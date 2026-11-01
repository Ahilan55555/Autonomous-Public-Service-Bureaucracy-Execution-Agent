Table of Contents

- [Overview](#-overview)
- [The Problem vs. The Solution](#-the-problem-vs-the-solution)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup-fastapi)
  - [Frontend Setup](#2-frontend-setup-react--vite)
  - [Browser Agent Setup](#3-browser-agent-ai-model)
- [Environment Variables](#-environment-variables)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Security, Privacy & Ethics](#-security-privacy--ethics)
- [Roadmap](#-roadmap)
- [Contributing & License](#-contributing--license)

---

## 📖 Overview

Navigating government bureaucracy in developing nations often means dealing with fragmented websites, non-standardized multi-page forms, fragile legacy portals, and a complete lack of modern public APIs. 

*CivicEase* transforms this experience. It ingests a citizen's verified profile and document vault, discovers eligible welfare schemes and public services, and launches an autonomous browser agent that navigates legacy government web portals, fills out tedious multi-step application forms, handles dynamic UI obstacles, and returns completed tracking receipts directly to the citizen.

---

## ⚖️ The Problem vs. The Solution

| The Bureaucracy Trap | CivicEase Solution |
| :--- | :--- |
| *Information Asymmetry:* Citizens don't know which schemes they qualify for across 100+ ministries. | *AI Discovery & Semantic Search:* Natural language search + LLM eligibility engine matching rules in real time. |
| *No APIs:* 90%+ of government portals offer no developer APIs or programmatic access. | *Autonomous Browser Agent:* Playwright / browser-use agents interact with raw DOM elements just like a human clerk. |
| *Fragile Legacy UI:* Dropdowns, nested frames, legacy form layouts, and slow load times cause friction. | *DOM Parsing & Vision Agents:* Multimodal models analyze portal state, recover from failures, and retry intelligently. |
| *Security & Privacy Risks:* Citizens risk sharing identity papers and passwords with unofficial cyber-café operators. | *Encrypted Citizen Vault:* Zero-leak local encrypted storage with strict Human-in-the-Loop approvals for sensitive actions. |

---

## ✨ Key Features

1. *Intelligent Scheme Discovery & Catalog*
   - Natural language search across scholarships, subsidies, welfare schemes, and license renewals.
   - Comprehensive catalog filtered by sector, eligibility, state, and central government sponsors.

2. *Automated Eligibility Engine (Gemini LLM)*
   - Automatically cross-evaluates citizen profile attributes (Age calculated from DOB, Income, Category, State, Occupation) against official scheme criteria.
   - Outputs a transparent confidence score, eligibility breakdown, and missing requirement alerts.

3. *Autonomous Browser Execution Agent*
   - Headless or live browser automation powered by Playwright and browser-use.
   - Multi-step form population: inputs text, selects cascading dropdowns, handles checkboxes, and uploads required certificates.

4. *Human-in-the-Loop (HITL) Safety & Guardrails*
   - Pauses execution and alerts the citizen whenever a CAPTCHA, Aadhaar OTP, or multi-factor authentication is encountered.
   - Requires explicit final review and user confirmation before pressing "Final Submit".

5. *Citizen Profile & Encrypted Document Vault*
   - Centralized citizen profile with auto-computed age verification from Date of Birth.
   - Secure vault for Aadhaar cards, Income Certificates, Academic Transcripts, and Caste Certificates.

6. *Real-Time Task Monitoring & Receipt Vault*
   - Live step-by-step agent tracking with live screenshots/status logs.
   - Extracts and archives application reference numbers, acknowledgement PDFs, and submission receipts.

---

## 🏛️ System Architecture

mermaid
flowchart TD
    subgraph Client["Frontend (React 19 + Vite)"]
        UI["Citizen Dashboard / Catalog / Vault"]
        ProfileForm["Profile & Age Calculator"]
        Monitor["Live Agent Execution Monitor"]
    end

    subgraph Backend["Backend API (FastAPI)"]
        Auth["JWT Auth & Session Manager"]
        CatalogSvc["Catalog & Scheme Service"]
        EligSvc["LLM Eligibility Evaluator"]
        AgentSvc["Browser Agent Orchestrator"]
        DocVault["Encrypted Document Storage"]
        DB[(SQLite / PostgreSQL)]
    end

    subgraph AI["AI & Automation Layer"]
        Gemini["Google Gemini 2.0 (Reasoning & Vision)"]
        BrowserAgent["Playwright / browser-use Agent"]
    end

    subgraph External["External World"]
        GovPortals["Legacy Government Portals\n(NSP, Parivahan, State Portals)"]
        Citizen["Citizen (HITL for OTP / CAPTCHA)"]
    end

    UI -->|REST API| Backend
    ProfileForm --> Auth
    EligSvc -->|Evaluates Profile| Gemini
    AgentSvc -->|Launches Task| BrowserAgent
    BrowserAgent -->|Navigates & Fills| GovPortals
    GovPortals -->|CAPTCHA / OTP Challenge| BrowserAgent
    BrowserAgent -->|Triggers Approval| Monitor
    Monitor -->|User Input / Approval| Citizen
    Citizen -->|Submits OTP| Monitor
    GovPortals -->|Receipt / Ack Number| BrowserAgent
    BrowserAgent -->|Save Application & Receipt| DB
    DocVault -->|Provides verified files| BrowserAgent


---

## 📂 Project Structure

text
Autonomous-Public-Service-Bureaucracy-Execution-Agent/
├── backend/
│   └── gov-agent-backend/
│       ├── app/
│       │   ├── api/             # FastAPI REST routes (auth, profile, services, agent, etc.)
│       │   ├── core/            # Config, security, database sessions
│       │   ├── models/          # SQLAlchemy ORM models (Citizen, Application, Document, etc.)
│       │   ├── schemas/         # Pydantic schemas (AgentExecuteRequest, TaskStatus, etc.)
│       │   ├── services/        # Business logic (eligibility_service, browser_agent_service, gemini_base)
│       │   └── main.py          # FastAPI application entrypoint
│       ├── tests/               # Pytest test suite
│       ├── requirements.txt     # Backend Python dependencies
│       └── .env.example         # Backend environment variables template
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components (Sidebar, Navbar, Cards)
│   │   ├── pages/               # Views: Dashboard, Catalog, Discovery, Vault, Profile, Monitor
│   │   ├── services/            # Axios / Fetch API client
│   │   ├── App.jsx              # Main routing and layout
│   │   └── main.jsx             # React entrypoint
│   ├── package.json             # Frontend NPM scripts & dependencies
│   └── vite.config.js           # Vite build configuration
│
├── ai-model/
│   ├── browser_agent/           # Autonomous browser agent engine
│   │   ├── agent.py             # Core Playwright & browser-use execution loop
│   │   ├── parser.py            # DOM parsing and visual accessibility tree
│   │   └── actions.py           # Atomic browser actions (click, type, upload)
│   ├── goal.md                  # Detailed specifications and HITL safety bounds
│   └── requirements.txt         # AI agent dependencies
│
└── CivicEase_Presentation.pptx  # Architectural & pitch presentation


---

## 🚀 Getting Started

### Prerequisites

- *Python 3.10+*
- *Node.js 18+* and *npm*
- *Google Gemini API Key* ([Get one here](https://aistudio.google.com/))
- *Chromium / Playwright Browsers*

---

### 1. Backend Setup (FastAPI)

1. Open a terminal and navigate to the backend directory:
   bash
   cd backend/gov-agent-backend
   

2. Create and activate a Python virtual environment:
   bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   

3. Install required dependencies:
   bash
   pip install -r requirements.txt
   

4. Create your .env configuration file:
   bash
   cp .env.example .env
   
   (Update GEMINI_API_KEY, SECRET_KEY, and DATABASE_URL in .env)

5. Start the FastAPI development server:
   bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   

API docs will be available at:
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### 2. Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the frontend directory:
   bash
   cd frontend
   

2. Install dependencies:
   bash
   npm install
   

3. Set up the frontend .env:
   bash
   cp .env.example .env
   
   (Ensure VITE_API_BASE_URL=http://localhost:8000/api)

4. Run the Vite development server:
   bash
   npm run dev
   

The application will launch at: [http://localhost:5173](http://localhost:5173)

---

### 3. Browser Agent Setup (ai-model)

To enable live browser automation with Playwright:

bash
cd ai-model
pip install -r requirements.txt
playwright install chromium


---

## 🔐 Environment Variables

### Backend (backend/gov-agent-backend/.env)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| PROJECT_NAME | Name of the service | "CivicAgent Backend" |
| SECRET_KEY | JWT signing secret key | generate with: openssl rand -hex 32 |
| ALGORITHM | JWT token algorithm | "HS256" |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token lifespan | 1440 (24h) |
| GEMINI_API_KEY | Google Gemini API key | AIzaSy... |
| DATABASE_URL | SQLAlchemy connection URL | sqlite:///./gov_agent.db |
| UPLOAD_DIR | Document storage path | ./uploads |
| MAX_UPLOAD_SIZE_MB | Maximum single upload limit | 5 |

### Frontend (frontend/.env)

| Variable | Description | Default |
| :--- | :--- | :--- |
| VITE_API_BASE_URL | Base URL for FastAPI endpoints | http://localhost:8000/api |

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | /api/auth/register | Register a new citizen account |
| POST | /api/auth/login | Login and obtain JWT bearer token |
| GET / PUT | /api/profile | Retrieve / update citizen profile & auto-calculated age |
| GET / POST| /api/documents | List & upload documents to the encrypted vault |
| GET | /api/services | List all indexed public welfare schemes and portals |
| POST | /api/discovery/search | AI semantic discovery across available schemes |
| POST | /api/eligibility/check | Gemini-powered citizen eligibility score & reasoning |
| POST | /api/agent/execute | Initiate autonomous browser task on a target portal |
| GET | /api/agent/status/{task_id}| Stream / poll real-time agent execution progress |
| POST | /api/agent/approve | Submit Human-in-the-Loop decision (OTP, CAPTCHA, consent) |
| GET | /api/applications | View submission history, status, and tracking receipts |

---

## 🛡️ Security, Privacy & Ethics

- *Human-in-the-Loop (HITL) by Design:* The agent is strictly prohibited from submitting an application without explicit user authorization.
- *Credential & Identity Protection:* Sensitive credentials (passwords, OTPs, Aadhaar numbers) are never stored in plaintext or passed unencrypted to third-party logs.
- *Zero Hallucination Tolerance:* The agent strictly validates form fields against portal schemas. If a field's mapping is ambiguous, it requests citizen clarification rather than guessing.
- *Local Isolation:* File uploads and PDF receipts are contained within user-segregated directories with strict mime-type validation.

---

## 🗺️ Roadmap

- [x] Citizen profile auto-age calculation from Date of Birth.
- [x] Gemini-based eligibility reasoning engine.
- [x] Autonomous browser agent orchestrator with Playwright.
- [x] Human-in-the-Loop interruptible execution pipeline.
- [ ] Multilingual voice input (Hindi, Tamil, Telugu, Bengali) for non-literate citizens.
- [ ] WhatsApp bot integration for status tracking and receipt delivery.
- [ ] Direct DigiLocker API integration for instant e-KYC and document pulling.
- [ ] Self-healing DOM selector recovery using multimodal vision models.

---
