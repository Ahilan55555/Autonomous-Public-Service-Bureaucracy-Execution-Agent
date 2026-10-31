import unittest

from browser_agent.state.task_manager import (
    TaskManager,
    TaskManagerError,
)


class TaskManagerTests(unittest.TestCase):

    def setUp(self):
        self.manager = TaskManager()

    def test_start_task(self):

        task_id = self.manager.start_task("Test browser workflow")

        self.assertIsNotNone(task_id)
        self.assertEqual(
            self.manager.get_current_task()["status"],
            "running",
        )

    def test_record_action(self):

        self.manager.start_task("Test workflow")

        self.manager.record_action(
            action={"action": "click", "target": "Continue"},
            execution={"status": "executed"},
            verification={"status": "success"},
        )

        task = self.manager.get_current_task()

        self.assertEqual(len(task["actions"]), 1)

    def test_complete_task(self):

        self.manager.start_task("Test workflow")
        self.manager.complete_task()

        self.assertEqual(
            self.manager.get_current_task()["status"],
            "completed",
        )

    def test_fail_task(self):

        self.manager.start_task("Test workflow")
        self.manager.fail_task()

        self.assertEqual(
            self.manager.get_current_task()["status"],
            "failed",
        )

    def test_action_without_task_rejected(self):

        with self.assertRaises(TaskManagerError):
            self.manager.record_action(
                action={},
                execution={},
            )


if __name__ == "__main__":
    unittest.main()