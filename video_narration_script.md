# 60-Second Hackathon Demo Script

"Today, we present an AI-powered public service automation agent that makes government workflows simpler, safer, and more citizen-friendly.

Government portals are often slow, repetitive, and confusing. Citizens need to reopen forms, upload documents, and handle OTPs or security checks manually. Our solution automates the safe parts while keeping the sensitive parts under human control.

The system observes the browser page, sanitizes the data, and asks the AI for the next safe action. Python validates the action, Playwright performs the browser step, and the system verifies the result before moving forward.

In this demo, we simulate a duplicate RC workflow. The agent validates the registration, moves to chassis verification, and then reaches an OTP security checkpoint. At that point, the system pauses and asks the user to complete authentication manually, because passwords and OTPs must never be automated.

This is the key privacy-first principle of the project: we do not expose sensitive user data to the model, and we never submit or authenticate without human approval.

So our product is not just automation—it is trusted automation for public services."