import json
import tempfile
import unittest
import uuid

from pathlib import Path

from browser_agent.security.audit_logger import (
    AuditLogger,
    AuditLoggerError,
)


class AuditLoggerTests(unittest.TestCase):

    def setUp(self):
        self.temp_directory = tempfile.TemporaryDirectory()

        self.log_path = (
            Path(self.temp_directory.name) / "audit.jsonl"
        )

        self.logger = AuditLogger(self.log_path)

        self.task_id = str(uuid.uuid4())

    def tearDown(self):
        self.temp_directory.cleanup()

    def test_valid_event_recorded(self):

        event_id = self.logger.log_event(
            event_type="action_proposed",
            outcome="pending",
            component="intelligence",
            action="click",
            task_id=self.task_id,
        )

        self.assertIsInstance(event_id, str)
        self.assertTrue(self.log_path.exists())

    def test_event_contains_required_fields(self):

        self.logger.log_event(
            event_type="execution_succeeded",
            outcome="success",
            component="execution",
            action="click",
            task_id=self.task_id,
        )

        with open(self.log_path, "r", encoding="utf-8") as file:
            event = json.loads(file.readline())

        expected_fields = {
            "event_id",
            "timestamp",
            "task_id",
            "event_type",
            "outcome",
            "component",
            "action",
            "reason_code",
        }

        self.assertEqual(set(event.keys()), expected_fields)

    def test_invalid_event_type_rejected(self):

        with self.assertRaises(AuditLoggerError):
            self.logger.log_event(
                event_type="unknown_event",
                outcome="success",
                component="agent",
            )

    def test_invalid_outcome_rejected(self):

        with self.assertRaises(AuditLoggerError):
            self.logger.log_event(
                event_type="task_started",
                outcome="unknown",
                component="agent",
            )

    def test_invalid_component_rejected(self):

        with self.assertRaises(AuditLoggerError):
            self.logger.log_event(
                event_type="task_started",
                outcome="success",
                component="unknown",
            )

    def test_invalid_action_rejected(self):

        with self.assertRaises(AuditLoggerError):
            self.logger.log_event(
                event_type="action_proposed",
                outcome="pending",
                component="intelligence",
                action="execute_terminal_command",
            )

    def test_invalid_task_id_rejected(self):

        with self.assertRaises(AuditLoggerError):
            self.logger.log_event(
                event_type="task_started",
                outcome="success",
                component="agent",
                task_id="user@example.com",
            )

    def test_arbitrary_sensitive_data_not_accepted(self):

        with self.assertRaises(TypeError):
            self.logger.log_event(
                event_type="task_started",
                outcome="success",
                component="agent",
                password="secret123",
            )

    def test_multiple_events_are_separate_records(self):

        for _ in range(3):
            self.logger.log_event(
                event_type="task_started",
                outcome="success",
                component="agent",
                task_id=self.task_id,
            )

        with open(self.log_path, "r", encoding="utf-8") as file:
            events = [
                json.loads(line)
                for line in file
            ]

        self.assertEqual(len(events), 3)

    def test_event_ids_are_unique(self):

        first_id = self.logger.log_event(
            event_type="task_started",
            outcome="success",
            component="agent",
        )

        second_id = self.logger.log_event(
            event_type="task_completed",
            outcome="success",
            component="agent",
        )

        self.assertNotEqual(first_id, second_id)


if __name__ == "__main__":
    unittest.main()