# 📌 Pending Tasks & Technical TODO List

> Last updated: July 2026  
> System: Construction AI Agent / Multi-Agent Enterprise Orchestrator

---

## 🚀 High Priority (Immediate Action Items)

### 1. Middleware Adaptation for Elysia.js
- [x] **Security & Rate Limiting Hooks**: Complete adaptation of `securityHeaders`, `rateLimiter`, and `requestLogger` from [src/middleware/security.ts](file:///Users/mac/Desktop/n8n/Construction_AI_Agent/src/middleware/security.ts) into [src/app.ts](file:///Users/mac/Desktop/n8n/Construction_AI_Agent/src/app.ts) (`app.onBeforeHandle`).
- [ ] **Granular Auth Controls**: Refine JWT auth scoping per route group (e.g. public health/capabilities vs protected agent/workflow actions).

### 2. Expanded LangGraph Workflows
- [x] **Project Kickoff Workflow**: Multi-step graph automating project record initialization, initial material cost estimations, safety checklist generation, and team assignment emails.
- [x] **Inventory Restock Workflow**: Automated workflow monitoring low-stock items, generating vendor purchase requests, scheduling delivery timelines, and notifying logistics.
- [x] **Employee Offboarding Workflow**: Revoking access, processing final leave balances, transferring active project responsibilities, and generating offboarding summaries.
- [x] **Monthly Executive Report Workflow**: Multi-agent compilation aggregating site timelines, factory QC metrics, and HR stats into a unified PDF report.

---

## 🧪 Testing & Quality Assurance

### 1. Automated Test Suite (Target: 80%+ Coverage)
- [x] **Agent & Tool Unit Tests**: Test suite for [ConstructionAgent](file:///Users/mac/Desktop/n8n/Construction_AI_Agent/src/agents/ConstructionAgent.ts), [ManufacturingAgent](file:///Users/mac/Desktop/n8n/Construction_AI_Agent/src/agents/ManufacturingAgent.ts), and [HRAgent](file:///Users/mac/Desktop/n8n/Construction_AI_Agent/src/agents/HRAgent.ts).
- [x] **Router & Intent Detection Tests**: Automated tests for [AgentRouter](file:///Users/mac/Desktop/n8n/Construction_AI_Agent/src/agents/AgentRouter.ts) keyword scoring and LLM intent extraction.
- [x] **API Endpoint Integration Tests**: Bun tests validating `/api/agents/chat`, `/api/workflows/*`, `/api/hr/*`, `/api/construction/*`, and `/api/manufacturing/*`.
- [x] **Database & Mocking Layer**: Integration tests validating MongoDB & Redis fallbacks when databases are offline.

---

## 🎨 Frontend Application (React / Vite)

### 1. View & API Service Connections
- [x] **Dynamic Data Hook Integration**: Replace static fallback constants in HR (`HR.tsx`), Construction (`Construction.tsx`), and Manufacturing (`Manufacturing.tsx`) with `useQuery` hooks connected to `/api/hr/employees`, `/api/construction/projects`, `/api/manufacturing/inventory`, and `/api/manufacturing/stats`.
- [ ] **Real-time Terminal Output**: Enhanced chat interface displaying live tool execution badges, agent confidence scores, and extracted parameters.
- [ ] **Interactive Workflow Wizard**: Multi-step UI modal for triggering and visual progress tracking of LangGraph workflows.

---

## 🐳 DevOps & Production Hardening

- [x] **Multi-stage Production Dockerfile**: Optimized Dockerfile for Bun runtime with minimal image size.
- [x] **Production Docker Compose**: Complete `docker-compose.prod.yml` configured with MongoDB container, Redis container, volume persistence, and environment variable secrets.
- [x] **Logging & Monitoring Integration**: Structured log aggregation setup (Pino output formatting for production log management).

---

## 🔮 Future Agent Expansion (Backlog)

- [ ] **Finance Agent**: Budget management, expense tracking, invoice processing, and cost variance reporting.
- [ ] **Procurement Agent**: Supplier evaluation, purchase order processing, and vendor contract management.
- [ ] **Quality Assurance (QA) Agent**: Automated inspection logging, defect pattern recognition, and audit compliance.
- [ ] **Logistics & Fleet Agent**: Equipment shipment tracking, driver assignment, and transport schedule optimization.
