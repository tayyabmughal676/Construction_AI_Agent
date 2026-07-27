# 📝 Changelogs

All notable changes to the Multi-Agent Enterprise Orchestrator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to Semantic Versioning.

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
