<!-- <p align="center">
  <img src="assets/logo.png" width="300" alt="NexusAI Logo">
</p> -->

<h1 align="center">NexusAI</h1>

<p align="center">
  <strong>Advanced Multi-Agent Orchestration Framework with Dynamic Routing</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.100+-green?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Upstash_Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white" alt="RabbitMQ">
  <img src="https://img.shields.io/badge/Gemini_1.5_Pro-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white" alt="Gemini">
</p>

<hr />

## 🌟 Vision
**NexusAI** is a cloud-native, highly scalable **digital workforce**. Built on the foundation of the Fugu-architected dynamic routing system, it uses an intelligent Manager LLM (Gemini 1.5 Pro) to dynamically delegate tasks across a specialized swarm of agents. It enforces strict **Human-in-the-Loop (HITL)** safety protocols using enterprise message brokers.

---

## 🛠️ Tech Stack & Infrastructure

- **🖥️ Mission Control (Frontend)**: A sophisticated React dashboard featuring Glassmorphism, Framer Motion UI animations, live execution telemetry, and interactive HITL approval flows.
- **🚀 Neural Gateway (Backend)**: FastAPI serving as a high-performance, fully asynchronous bridge between the UI and the agent swarm.
- **🧠 Agent Swarm**: Powered by **Microsoft AutoGen (v0.4.x)** utilizing a `SelectorGroupChat`. It relies on **Gemini 1.5 Pro's** massive 2-million token context window to handle massive cognitive loads and dynamic Fugu-style task delegation.
- **💾 State Persistence**: **MongoDB Atlas** (via Motor) handles durable session memory and workflow resumption horizontally.
- **⚡ Async Pulse (Redis)**: **Upstash Redis** handles the fast, ephemeral background task queuing, ensuring UI requests never block the main thread.
- **🛡️ Critical Alert System (RabbitMQ)**: **CloudAMQP RabbitMQ** handles highly durable, persistent queues specifically for Human-in-the-Loop (HITL) alerts and high-stakes operations that require guaranteed delivery.

---

## 🗺️ System Architecture

```mermaid
sequenceDiagram
    participant U as User (React UI)
    participant B as Backend (FastAPI)
    participant Q_Fast as Redis Queue
    participant W as AutoGen Swarm (Fugu Router)
    participant D as MongoDB Atlas
    participant Q_Crit as RabbitMQ (Alerts)

    U->>B: POST /api/workflow/start (Prompt)
    B->>D: Initialize Session State
    B->>Q_Fast: Dispatch 'START' Message
    B-->>U: Return Session ID
    Q_Fast->>W: Consume Task
    W->>W: [Loop] Manager dynamically routes -> Planner/Researcher/Executor
    W->>D: Save Intermediate Agent Logs
    W->>W: Reviewer: Detect PENDING_APPROVAL
    W->>D: Set status: PAUSED_FOR_HITL
    W->>Q_Crit: Publish Durable Alert (RabbitMQ)
    D-->>U: SSE Update: "Waiting for you..."
    U->>B: POST /api/workflow/approve (Feedback)
    B->>Q_Fast: Dispatch 'RESUME' Message
    Q_Fast->>W: Finalize Execution & Summary
    W->>D: Set status: COMPLETED
```

---

## 👥 The Agent Team

| Agent | Role | Model | Specialization |
| :--- | :--- | :--- | :--- |
| **Manager (Router)** | The Brain | `Gemini-1.5-Pro` | Dynamically selects the next speaker based on context history. |
| **Planner** | The Architect | `Gemini-1.5-Pro` | Decomposes prompts into precise workflows. |
| **Researcher** | The Investigator | `Gemini-1.5-Pro` | Handles Web Search (Serper MCP) and deep analysis. |
| **Executor** | The Operator | `Gemini-1.5-Pro` | Triggers MCP tools (Spotify, Brevo Email, API calls). |
| **Reviewer** | The Auditor | `Gemini-1.5-Pro` | Quality control and triggers Human-In-The-Loop (HITL) pauses. |

---

## 🚀 Quick Start (Local & Cloud)

### 1. Environment Setup
Create a `.env` file in the `backend/` directory:
```bash
# Core AI
GEMINI_API_KEY_PLANNER="..."
GEMINI_API_KEY_RESEARCHER="..."
GEMINI_API_KEY_EXECUTOR="..."
GEMINI_API_KEY_REVIEWER="..."

# Database & Queues
MONGO_URI="mongodb+srv://..."
MONGO_DB_DATABASE="NexusAldb"
MONGO_DB_CONTAINER="workflow_states"

REDIS_URL="rediss://default:..."
RABBITMQ_URL="amqps://..."

# Security
JWT_SECRET_KEY="your-random-secure-string"

# External MCP Tools
SERPER_API_KEY="..."
SPOTIFY_CLIENT_ID="..."
SPOTIFY_CLIENT_SECRET="..."
```

### 2. Launch the Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
*(Note: Since you are using cloud providers for MongoDB, Redis, and RabbitMQ, you do not need to run Docker locally!)*

### 3. Launch the Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 Security & Privacy
- **JWT Authentication**: All endpoints are protected with industry-standard tokens.
- **Enterprise Message Brokers**: High-stakes API tool executions and human-in-the-loop triggers are pushed through RabbitMQ to guarantee they are never lost to server failure.
- **Safety First**: No destructive actions (emails, API modifications) are sent without your explicit click in the dashboard, powered by the HITL Reviewer agent.
