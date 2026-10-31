# Browser Automation Agent — Development Plan

## 1. My Responsibility

I am Member 3 — Browser Automation & Autonomous Agent Developer.

My responsibility is to develop an intelligent browser agent that can:

1. Open and navigate government websites.
2. Understand webpage structure and content.
3. Identify relevant services and form fields.
4. Fill application forms using user-provided information.
5. Upload required documents.
6. Detect missing information and request it from the user.
7. Handle authentication through direct user interaction.
8. Verify every important browser action.
9. Detect failures and attempt controlled recovery.
10. Request user approval before final application submission.
11. Extract application acknowledgement numbers and report results.

---

## 2. Core Architectural Decision

Use a HYBRID ARCHITECTURE:

- LLM (Gemini): Reasoning, webpage interpretation, service identification and decision-making.
- Playwright: Browser interaction and execution.
- Python: Control flow, orchestration and data management.
- Security Module: Sensitive information protection and action validation.
- Verification Module: Confirms whether browser actions succeeded.
- User: Controls sensitive information, authentication and final submission.

The LLM must not have unrestricted control over the browser.

### Architecture

USER
  |
  v
REACT FRONTEND
  |
  v
FASTAPI BACKEND
  |
  v
BROWSER AGENT
  |
  +--------------------------+
  |                          |
  v                          v
TRUSTED ENVIRONMENT      AI ENVIRONMENT
  |                          |
  |                     GEMINI API
  |                          |
  |                     Receives only
  |                     sanitized data
  |                          |
  +------------+-------------+
               |
               v
           PLAYWRIGHT
               |
               v
       GOVERNMENT WEBSITE
               |
               v
       VERIFY ACTIONS
               |
               v
         REPORT STATUS

---

## 3. Privacy and Security Requirements

Security is one of the highest priorities.

### Information classification

| Category | Examples | Gemini Access |
|---|---|---|
| Public | Website names, service names | Allowed |
| Personal | Name, address, DOB | Redact by default |
| Confidential | Bank details, identity numbers, certificates | Never |
| Authentication secrets | Passwords, OTPs, API keys, cookies | Never |

### Information that must NEVER reach Gemini

- Bank account numbers.
- IFSC and other confidential banking information.
- Banking passwords.
- Government portal passwords.
- OTPs.
- Authentication tokens.
- Session cookies.
- Uploaded document contents.
- Identity document numbers.
- Private database records.

### Security rules

1. Use an allowlist for information sent to Gemini.
2. Never send raw webpage HTML without sanitization.
3. Never send raw form values.
4. Never send sensitive screenshots.
5. Never store passwords or OTPs.
6. Never log confidential information.
7. Restrict browser navigation to approved domains.
8. Use HTTPS.
9. Store documents in private storage.
10. Encrypt sensitive data at rest.
11. Validate all LLM-generated actions.
12. Require explicit approval before final submission.

Important: Redaction is not sufficient by itself. Prevent sensitive information from entering the LLM prompt in the first place.

---

## 4. Authentication and User Interaction

For sensitive authentication fields:

- Detect password fields.
- Pause browser automation.
- Notify the frontend.
- Let the user interact directly with the browser.
- Resume after user confirmation.
- Never read, store or transmit credentials.

The same applies to OTP and CAPTCHA.

The agent must not attempt to bypass CAPTCHA or robot verification.

Example response:

{
    "status": "AWAITING_USER",
    "reason": "SENSITIVE_AUTHENTICATION",
    "message": "Please complete authentication directly in the browser.",
    "automation_paused": true
}

Do not capture passwords or OTPs in screenshots, videos, browser traces or logs.

---

## 5. Missing Information and Document Handling

The agent must support incomplete user information.

Example:

A government application requires:

- Name
- Date of birth
- Address
- Income proof
- Identity proof

If the user provides only their name and address, the agent must identify the missing information.

### Workflow

1. Inspect required form fields.
2. Compare requirements with available user information.
3. Identify missing information.
4. Ask the user to provide missing details.
5. Request document uploads when necessary.
6. Validate uploaded files.
7. Store documents securely.
8. Make documents available to the local browser agent.
9. Continue the application workflow.

Never invent missing information.

Use local OCR or local document processing if document extraction is needed. Ask the user to verify extracted information.

Never send confidential document contents to Gemini.

Example response:

{
    "status": "AWAITING_USER_INPUT",
    "missing_information": [
        {
            "field": "date_of_birth",
            "type": "user_input"
        },
        {
            "field": "income_proof",
            "type": "document_upload"
        }
    ]
}

---

## 6. LLM and Playwright Integration

The LLM should not directly execute browser actions.

Use this workflow:

1. Playwright observes the webpage.
2. Python extracts relevant DOM information.
3. Security module sanitizes the observation.
4. Gemini receives the sanitized observation.
5. Gemini returns a structured decision.
6. Python validates the decision.
7. Playwright executes the approved action.
8. Verification module checks the result.
9. Agent continues or initiates recovery.

### Decision-making responsibilities

| Operation | Responsible Component |
|---|---|
| Understand unfamiliar webpage | LLM |
| Identify requested service | LLM |
| Identify ambiguous form fields | LLM |
| Open known URL | Python |
| Fill known form field | Playwright |
| Verify field value | Python |
| Detect navigation failure | Python |
| Suggest recovery strategy | LLM |
| Validate action safety | Python |
| Final submission approval | Human |

Use structured JSON responses from Gemini.

Example:

{
    "action": "click",
    "target": "Income Certificate",
    "reason": "Matches the requested service"
}

Use a restricted action vocabulary:

- click
- fill
- select
- scroll
- wait
- ask_user
- request_document
- finish

Do not allow arbitrary code execution generated by the LLM.

---

## 7. Autonomous Agent States

The agent must support the following states:

1. RUNNING
2. AWAITING_USER_INPUT
3. AWAITING_DOCUMENT
4. AWAITING_AUTHENTICATION
5. AWAITING_APPROVAL
6. FAILED
7. COMPLETED

Persist task ID, current workflow state, current URL and completed steps.

When the user responds, resume the task after observing the current browser state again.

Never persist passwords or OTPs.

---

## 8. Recommended Folder Structure

browser_agent/
│
├── agent.py
│
├── perception/
│   ├── observer.py
│   ├── dom_extractor.py
│   └── screenshot.py
│
├── intelligence/
│   ├── decision_engine.py
│   ├── prompt_builder.py
│   └── response_parser.py
│
├── execution/
│   ├── executor.py
│   ├── navigation.py
│   ├── form_filler.py
│   └── document_upload.py
│
├── security/
│   ├── data_classifier.py
│   ├── sanitizer.py
│   ├── action_validator.py
│   ├── authentication.py
│   └── privacy_guard.py
│
├── verification/
│   ├── verifier.py
│   └── error_recovery.py
│
└── state/
    └── task_manager.py

---

## 9. Integration With Member 2

Member 2 has not finalized the backend input format.

Therefore, develop the browser agent independently using a temporary generic input contract.

Suggested input:

{
    "task_id": "TASK_001",
    "objective": "Apply for an income certificate",
    "website": "https://example.gov.in",
    "user_data": {},
    "documents": [],
    "privacy_settings": {
        "allow_llm_personal_data": false,
        "allow_llm_documents": false,
        "manual_authentication": true
    }
}

Suggested output:

{
    "task_id": "TASK_001",
    "status": "IN_PROGRESS",
    "current_action": "Filling application form",
    "completed_steps": [],
    "requires_user_input": false
}

Coordinate the final API contract with Member 2 before integration.

---

## 10. Development Priorities

### Phase 1 — Browser Foundation
- [ ] Install Playwright.
- [ ] Configure Chromium.
- [ ] Launch browser.
- [ ] Open government portal.
- [ ] Capture screenshots.
- [ ] Extract webpage text.
- [ ] Extract DOM elements.

### Phase 2 — Security Foundation
- [ ] Implement data_classifier.py.
- [ ] Implement sanitizer.py.
- [ ] Implement privacy_guard.py.
- [ ] Identify password fields.
- [ ] Identify OTP fields.
- [ ] Prevent confidential data from reaching Gemini.
- [ ] Prevent sensitive information from entering logs.

### Phase 3 — LLM Integration
- [ ] Implement decision_engine.py.
- [ ] Connect Gemini API.
- [ ] Create structured prompts.
- [ ] Parse JSON responses.
- [ ] Validate generated decisions.

### Phase 4 — Browser Execution
- [ ] Implement navigation.
- [ ] Implement clicking.
- [ ] Implement form filling.
- [ ] Implement dropdown selection.
- [ ] Implement document uploads.
- [ ] Implement screenshots.

### Phase 5 — User Interaction
- [ ] Detect missing information.
- [ ] Request missing information.
- [ ] Request document uploads.
- [ ] Implement manual authentication.
- [ ] Implement user approval before submission.

### Phase 6 — Verification and Recovery
- [ ] Verify browser actions.
- [ ] Detect navigation failures.
- [ ] Detect invalid form submissions.
- [ ] Implement screenshot-based debugging.
- [ ] Implement controlled retries.
- [ ] Implement recovery strategies.

### Phase 7 — Integration
- [ ] Agree on API structure with Member 2.
- [ ] Integrate browser agent with FastAPI.
- [ ] Send progress updates to frontend.
- [ ] Receive user-provided information.
- [ ] Receive uploaded documents.
- [ ] Implement end-to-end testing.

---

## 11. Immediate Development Plan

Do not wait for Member 2 to finish.

Start with these five tasks:

1. Create the browser_agent directory structure.
2. Implement observer.py.
3. Implement data_classifier.py.
4. Implement sanitizer.py.
5. Test that sensitive information never enters an LLM request.

After that:

6. Implement decision_engine.py.
7. Connect Gemini.
8. Implement executor.py.
9. Build the observe → decide → execute → verify loop.

---

## 12. Core Design Principles

1. Privacy before autonomy.
2. Never send confidential information to an external LLM.
3. Never let an LLM directly execute arbitrary code.
4. Never assume an action succeeded without verification.
5. Never invent missing user information.
6. Always ask the user for missing documents or details.
7. Let users handle passwords, OTPs and CAPTCHA directly.
8. Require human approval before consequential submissions.
9. Maintain task state so workflows can resume.
10. Prefer deterministic automation whenever possible.

## Final Architecture Philosophy

LLM = Reasoning engine.

Playwright = Execution engine.

Python = Control and orchestration layer.

Security module = Privacy gatekeeper.

Verification module = Reliability mechanism.

User = Authority over confidential information and consequential actions.

**Primary objective: Build a privacy-first, state-aware browser automation agent that can understand websites, complete tasks, recognize missing information, request human assistance and recover from failures without exposing confidential user data.**