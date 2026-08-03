# 📝 Changelogs

All notable changes to the Multi-Agent Enterprise Orchestrator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to Semantic Versioning.

## [2.1.0] - 2026-08-03

### Added
- **🧠 Dynamic Intelligence Intent Layer (`IntelligentIntentLayer.ts`):** Harvests live tool schemas dynamically from `AgentRegistry` and performs zero-shot LLM intent classification and parameter extraction, eliminating hardcoded keyword lists.
- **⚡ Direct Tool Dispatch Engine:** Implemented direct tool execution in `processMessage()` across `ConstructionAgent`, `HRAgent`, and `ManufacturingAgent` when invoked via the Intent Layer.
- **🔄 Action Normalization & Parameter Enrichers:** Automatically maps LLM action synonyms (`list` → `list_items`, `order`/`create` → `add_item`, `find` → `check_stock`, `log` → `log_inspection`), populating parameter defaults.
- **📖 Issa Enterprise Knowledge Base & Policy Engine:** Created MongoDB Knowledge model (`Knowledge.ts`) and seeded 15 detailed corporate policy documents for **Issa Construction & Industrial Group** ($500 WFH stipend, 20 PTO days, OSHA site safety checklists, ISO 9001 quality SOPs).
- **🔍 Knowledge Base Search Tool (`KnowledgeBaseTool.ts`):** Built `company_knowledge_base` tool registered across `HRAgent`, `ConstructionAgent`, and `ManufacturingAgent`.
- **📈 HR Performance Goals & Peer Feedback Seeding (`src/seed.ts`):** Seeded goals, reviews, and feedback records for employees `EMP001`, `EMP002`, and `EMP003`.
- **🛡️ Defensive Tool Exception Guard (`BaseAgent.ts`):** Wrapped tool execution in try/catch to eliminate unhandled server process crashes.
- **🍃 MongoDB Text Indexing Expansion (`mongodb.ts`):** Added `KnowledgeTextIndex` for sub-5ms text queries across policy documents.
- **🕒 Safe Frontend Date Formatting (`App.tsx`):** Added `formatTimestamp()` helper resolving ISO date string deserialization errors cleanly.

## [2.0.0-phase2] - 2026-08-03

### Added
- **🌐 LangGraph Autonomous Swarm Engine (`MultiAgentSwarmGraph.ts`):** Built top-level StateGraph featuring Supervisor task decomposition, parallel multi-agent execution (Construction, HR, Manufacturing nodes running in parallel), and barrier join synthesis.
- **💾 MongoDB Checkpointer Persistence (`MongoDBSaver.ts`):** Added state checkpointer storing graph execution checkpoints in collection `langgraph_checkpoints` with memory fallback.
- **🛑 Human-in-the-Loop Interrupt Nodes:** Added conditional interrupt node that automatically pauses graph execution whenever purchase order totals exceed **$10,000**, saving state in MongoDB.
- **🌐 Isolated v2 Route Group (`/api/v2/graph/*`):** Created `src/routes/v2graph.ts` featuring `/chat`, `/approve`, `/checkpoint/:sessionId`, and `/pending-approvals` endpoints.
- **🔘 Header Engine Switcher (`App.tsx`):** Added a sleek toggle in the header bar allowing seamless switching between **⚡ Standard v1.x Direct REST Engine** and **🌐 v2.x LangGraph Swarm Graph**.
- **✋ Interactive Human Approval Modal:** Rendered an interactive **Approve / Reject** dialog when a V2 graph triggers a high-value purchase order interrupt.
- **🧪 Swarm Test Suite (`MultiAgentSwarm.test.ts`):** Added 4 automated unit & integration tests covering Swarm StateGraph compilation, MongoDB checkpoints, multi-agent execution, and $10k+ purchase order interrupts (29/29 total tests passing).

## [2.0.0-phase1] - 2026-08-01

### Added
- **Animated Toast Notification System (`Toast.tsx`):** Added a floating, color-coded alert system using `framer-motion` for instant visual feedback on creating, updating, or deleting records, executing workflows, starting voice input, and managing chat threads.
- **🎙️ Voice-to-Text Speech Input:** Added a hands-free speech input button in the chat input bar utilizing the Web Speech API with active pulsing indicators.
- **💬 Multi-Thread Chat Sessions:** Added a sidebar conversation thread switcher allowing users to create (`+ New`), switch, rename, delete, and persist multiple chat threads in `localStorage`.
- **📥 In-Chat File Downloads:** Created public file streaming endpoint `/api/files/:type/:filename` and rendered interactive **📥 Download** cards in chat for generated CSV, Excel, and PDF files.
- **👥 Full Operational HR Hub (`HR.tsx`):** Added complete CRUD UI (Add, Edit, Delete, View Details Modal) displaying Employee IDs (`EMP001`), positions, salaries, and statuses.
- **🏗️ Full Operational Site Terminal (`Construction.tsx`):** Added complete CRUD UI (Add, Edit, Delete, View Details Modal) displaying Project IDs (`PRJ-001`), site locations, budgets, progress bars, and statuses.
- **🏭 Full Operational Fabrication Node (`Manufacturing.tsx`):** Added complete CRUD UI (Add, Edit, Delete, View Details Modal) displaying Component SKUs (`STEEL-001`), stock levels, unit costs, reorder thresholds, and OEE metrics.
- **⚡ MongoDB Compound Text Indexing:** Added automatic text indexes on `employees`, `projects`, and `inventory` collections for sub-5ms search speeds.
- **📄 PDF Auto-Pagination & Header Repetition:** Updated `PDFGeneratorTool.ts` to perform automatic page breaks and header repetition when table data overflows single-page bounds.
- **🔁 Groq HTTP 429 Retry Backoff:** Added 3-attempt exponential backoff retry logic in `GroqService.createCompletion` to handle rate limits and quota limits gracefully.
- **🌱 Enterprise Seed Dataset Refresh:** Updated `src/seed.ts` to seed 10 employees, 6 construction projects, 8 manufacturing items, and hashed admin/user accounts.

### Fixed
- **LangGraph Workflow Wizard (6/6 Fixes):** Resolved tool name mismatches in `projectKickoff.ts` (`material_cost_calculator`), safe employee lookups in `employeeOffboarding.ts`, and PDF array content parameters in `executiveReport.ts`. All 6 workflows now return `success: true`.

---

## [1.3.0] - 2026-08-01

### Added
- **Unified Intelligence Terminal UI:** Redesigned frontend `App.tsx` into a full-screen ChatGPT-style experience with collapsible sidebar navigation, department gradient theme styling, and auto-resizing textarea.
- **`@`-Mention Tool Autocomplete:** Added interactive tool selection in the chat input. Typing `@` triggers a floating, department-grouped tool picker with keyboard navigation (`↑`/`↓`/`Enter`/`Esc`) to insert tool mentions.
- **Live Capabilities Sync:** Integrated `GET /api/agents/capabilities` into frontend welcome state to display live capability cards and tool counts per agent.
- **Unified Router Fallback:** Added low-confidence (<0.4) router intercept in `AgentRouter.ts` that returns a multi-department capabilities summary when generic greetings ("hi", "hello") or vague queries are received.
- **Interactive LangGraph Workflow Wizard:** Rebuilt `Workflow.tsx` with a 4-step modal wizard (**Configure → Confirm → Execute → Results**) supporting all 6 enterprise workflows.

### Fixed
- **HR Intent Expansion:** Expanded `HRAgent.ts` from 3 to 9 intents (`ONBOARD_EMPLOYEE`, `MANAGE_LEAVE`, `TRACK_PERFORMANCE`, CSV/Excel/PDF exports).
- **Manufacturing Intent Expansion:** Added `QUALITY_METRICS` and CSV/Excel/PDF export intents to `ManufacturingAgent.ts`.
- **Employee Directory Search:** Fixed `HRAgent.ts` and `EmployeeDirectoryTool.ts` to strip command prefixes and perform multi-word regex OR searches (e.g. "John Doe").
- **Zod Schema Mismatches:** Normalized `leaveType` input in leave management and aligned performance tracker tool action identifiers (`summary`).

---

## [Unreleased]

### Added
- **LangGraph Workflows (Phase 3):** Implemented advanced state graph pipelines (`projectKickoff`, `inventoryRestock`, `employeeOffboarding`, `executiveReport`) connecting the multi-agent system into fully autonomous operations, exposed via POST `/api/workflows/langgraph/*`.
- **DevOps Hardening (Phase 4):** Added a highly optimized multi-stage `Dockerfile` (using `oven/bun:1-slim`) and a `docker-compose.prod.yml` mapping persistent volumes and health checks for MongoDB and Redis.
- **Production Logging:** Updated Pino logger configuration in `src/config/logger.ts` to output high-performance structured JSON automatically when `NODE_ENV=production`.
- **Testing Suite (Phase 5):** Added a robust automated testing suite using `bun:test`, targeting 80% coverage. Added `test/setup.ts` to natively mock MongoDB driver and Redis connections, along with unit and integration tests across agents, NLP routers, and Elysia endpoints.
- **Bun Polyfill Patch:** Created `src/patch.ts` to polyfill `node:v8` `startupSnapshot.isBuildingSnapshot` to resolve compatibility issues with the latest `bson` driver inside Bun v1.3.14.
- **npm Scripts:** Added `--preload ./src/patch.ts` flag to the `dev`, `start`, and `seed` scripts in `package.json` to ensure the patch is applied before dependency resolution.
- **Documentation:** Added `pending-todo.md` tracking high-priority implementation items and future backlogs.
- **Documentation:** Added `bug.md` to catalog known architectural issues and TypeScript compilation errors.

### Changed
- **Authentication (Phase 1):** Locked down API routes globally. Integrated a strict `requireRole` middleware inside `src/app.ts` ensuring endpoints are protected by `admin` or `user` privileges.
- **Frontend Dynamic Data (Phase 2):** Fully refactored React/Vite UI components (`HR.tsx`, `Construction.tsx`, `Manufacturing.tsx`). Replaced static mock arrays with React `useEffect`/fetch hooks tightly coupled to backend Elysia APIs.

### Fixed
- **Startup Crash:** Resolved the `ERR_NOT_IMPLEMENTED` exception that crashed `bun run dev` by intercepting the `process.getBuiltinModule` call for the `v8` module.
- **Middleware Application:** Properly registered Elysia security middleware (CORS, Rate Limit, etc.) in `src/app.ts` which were previously unapplied.
- **Outdated Imports:** Removed legacy Hono imports from `src/middleware/auth.ts`.
- **ToolResult Type Enforcement:** Fixed `ProjectTrackerTool.ts`, `TimelineEstimatorTool.ts`, and `HRPolicyTool.ts` to adhere strictly to the `ToolResult` return type.
- **Frontend Build Errors:** Fixed React `App.tsx` strict typings and updated root `tsconfig.json` to properly exclude frontend files from backend compilation checks.

---

## [1.2.0] - 2026-06-25

### Changed
- Migrated web framework from **Hono** to **Elysia.js** for native Bun optimization and improved type safety.
- Restructured `src/app.ts` to implement Elysia `app.group` routing.

### Added
- `test-curl-langgraph.md` testing guide.

---

## [1.1.0] - 2026-05-15

### Added
- **LangGraph Integration:** Added multi-step state graph execution for Employee Onboarding and Company Control orchestration.
- **Intelligent Routing:** Integrated Gemini/LLM fallback intent parser for advanced cross-department tool dispatching.

---

## [1.0.0] - 2026-01-10

### Added
- Initial Release of the Multi-Agent system.
- Construction, HR, and Manufacturing Agent sub-systems.
- Keyword-based intent routing.
- Export capabilities (CSV, Excel, PDF, Word).
