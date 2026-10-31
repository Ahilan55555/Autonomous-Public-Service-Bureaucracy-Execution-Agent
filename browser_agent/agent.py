from browser_agent.perception.observer import BrowserObserver
from browser_agent.execution.executor import BrowserExecutor

from browser_agent.intelligence.decision_engine import DecisionEngine

from browser_agent.verification.verifier import ActionVerifier
from browser_agent.verification.error_recovery import (
    ErrorRecovery,
    RecoveryDecision,
)

from browser_agent.state.task_manager import TaskManager


class BrowserAgentError(Exception):
    pass


class BrowserAgent:

    def __init__(self, allowed_domains, model="gemini-flash-lite-latest"):

        self.observer = BrowserObserver(allowed_domains)
        self.decision_engine = DecisionEngine(model=model)

        self.executor = None

        self.verifier = ActionVerifier()
        self.recovery = ErrorRecovery(max_retries=2)
        self.task_manager = TaskManager()

    def start(self):

        page = self.observer.start()

        self.executor = BrowserExecutor(
            page=page,
            allowed_domains=self.observer.allowed_domains
        )

    def navigate(self, url):

        return self.observer.navigate(url)

    def start_task(self):

        if self.task_manager.current_task is not None:
            raise BrowserAgentError("A task is already active")

        self.recovery.reset()

        return self.task_manager.start_task("browser_task")

    def run_step(self, task):

        if self.executor is None:
            raise BrowserAgentError("Agent has not started")

        # Start task tracking if necessary.
        if self.task_manager.current_task is None:
            self.start_task()

        task_id = self.task_manager.current_task["task_id"]

        # 1. Observe the current browser state.
        before_observation = self.observer.observe()

        # 2. Ask the model to select one action.
        action = self.decision_engine.decide(
            task=task,
            observation=before_observation
        )

        action_name = action["action"]

        # 3. Execute the authorized action.
        try:

            execution_result = self.executor.execute(action)

        except Exception:

            execution_result = {
                "status": "failed",
                "reason": "Action execution failed"
            }

            recovery_decision = self.recovery.decide(
                action_key=action_name,
                verification_status="failure"
            )

            self.task_manager.record_action(
                action={"type": action_name},
                execution=execution_result,
                verification=None
            )

            return {
                "task_id": task_id,
                "action": action_name,
                "result": execution_result,
                "recovery": recovery_decision.value
            }

        # 4. Handle explicit stop.
        if execution_result.get("status") == "stopped":

            self.task_manager.record_action(
                action={"type": action_name},
                execution={"status": "stopped"},
                verification=None
            )

            self.task_manager.complete_task()

            return {
                "task_id": task_id,
                "action": action_name,
                "result": execution_result,
                "task_status": "completed"
            }

        # 5. Handle actions requiring user interaction.
        if execution_result.get("status") == "user_interaction_required":

            self.task_manager.record_action(
                action={"type": action_name},
                execution={"status": "user_interaction_required"},
                verification=None
            )

            return {
                "task_id": task_id,
                "action": action_name,
                "result": execution_result,
                "task_status": "awaiting_user"
            }

        # 6. Verify successful click execution.
        verification_result = None
        recovery_decision = None

        if action_name == "click":

            after_observation = self.observer.observe()

            verification_result = self.verifier.verify_click(
                before_observation=before_observation,
                after_observation=after_observation,
                target=action["target"],
                execution_result=execution_result
            )

            verification_status = verification_result["status"]

            if verification_status == "uncertain":

                recovery_decision = self.recovery.decide(
                    action_key=action_name,
                    verification_status="uncertain"
                )

            elif verification_status == "failure":

                recovery_decision = self.recovery.decide(
                    action_key=action_name,
                    verification_status="failure"
                )

        # 7. Record only minimal action metadata.
        # Never store actual form values or webpage contents here.
        self.task_manager.record_action(
            action={"type": action_name},
            execution={"status": execution_result.get("status")},
            verification=verification_result
        )

        # 8. Return the complete step result.
        return {
            "task_id": task_id,
            "action": action_name,
            "result": execution_result,
            "verification": verification_result,
            "recovery": (
                recovery_decision.value
                if recovery_decision is not None
                else None
            ),
            "task_status": self.task_manager.current_task["status"]
        }

    def close(self):

        self.observer.close()
        self.executor = None