import unittest

from browser_agent.verification.error_recovery import (
    ErrorRecovery,
    RecoveryDecision,
)


class ErrorRecoveryTests(unittest.TestCase):

    def setUp(self):
        self.recovery = ErrorRecovery(max_retries=2)

    def test_retries_after_failure(self):
        decision = self.recovery.decide("click_continue", "failure")
        self.assertEqual(decision, RecoveryDecision.RETRY)

    def test_retries_only_up_to_limit(self):
        self.assertEqual(
            self.recovery.decide("click_continue", "failure"),
            RecoveryDecision.RETRY,
        )
        self.assertEqual(
            self.recovery.decide("click_continue", "failure"),
            RecoveryDecision.RETRY,
        )
        self.assertEqual(
            self.recovery.decide("click_continue", "failure"),
            RecoveryDecision.REPLAN,
        )

    def test_uncertain_result_asks_user(self):
        decision = self.recovery.decide("click_continue", "uncertain")
        self.assertEqual(decision, RecoveryDecision.ASK_USER)

    def test_success_clears_retry_count(self):
        self.recovery.decide("click_continue", "failure")
        self.recovery.decide("click_continue", "success")

        self.assertEqual(
            self.recovery.decide("click_continue", "failure"),
            RecoveryDecision.RETRY,
        )

    def test_reset(self):
        self.recovery.decide("click_continue", "failure")
        self.recovery.reset()
        self.assertEqual(self.recovery.retry_counts, {})


if __name__ == "__main__":
    unittest.main()