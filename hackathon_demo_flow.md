# Demo Flow for Presentation

## Scenario
Duplicate Registration Certificate / RC Reissue

## Demo steps

1. Open the system with a service request payload.
2. Show that sensitive citizen data is kept locally and not sent to the LLM.
3. Explain the agent observes the portal page and sanitizes the DOM.
4. Show the LLM proposes the next safe action from sanitized observations.
5. Python validates action safety and user approval requirements.
6. Playwright executes the approved action.
7. Show verification step after click or form fill.
8. If a password or OTP screen appears, pause and ask the user to complete it manually.
9. If a field or document is missing, ask for user input/document upload.
10. Show that the workflow resumes safely after user intervention.

## Key talking points

- This is real workflow automation, not unrestricted browser control.
- LLM reasoning is limited to safe observations.
- High-risk actions require approval.
- Security is built into the execution path.
- We are solving a real citizen problem with a strong safety model.
