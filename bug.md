# 🐛 Bug Report & Known Issues

This document tracks known bugs, architectural mismatches, and TypeScript compilation errors discovered in the codebase.

## 🟢 Resolved Issues

All issues identified during testing and workflow audits have been resolved as of August 2026.

### Backend & Router Errors (Fixed)
1. **Hono to Elysia Migration Leftovers:** Deleted outdated `src/middleware/auth.ts` which relied on Hono types. Authentication is handled inline in `src/app.ts`.
2. **Missing Security Middleware Application:** Elysia security middlewares (CORS, Rate Limiter, Headers, Request Logger) are correctly invoked in `app.onBeforeHandle`.
3. **Invalid `ToolResult` Object Shapes:** Fixed `ProjectTrackerTool.ts`, `TimelineEstimatorTool.ts`, and `HRPolicyTool.ts` to return stringified details inside `error` property.
4. **HRAgent & ManufacturingAgent Incomplete Intents:** Expanded agent intent mappings from 3 to 9 intents each, registering onboarding, leave, performance tracking, quality metrics, and file exports.
5. **Action & Schema Mismatches:** Aligned `handleLeaveManagement` action names (`request` / `balance`) and normalized `leaveType` inputs (`annual` → `vacation`). Aligned `handlePerformanceTracking` to invoke supported `summary` action.
6. **Multi-word Employee Directory Search:** Resolved issue where searching multi-word names (e.g. "John Doe") failed regex matching by implementing split-word OR searches across `firstName` and `lastName`.
7. **Low-Confidence Greeting Fallbacks:** Intercepted low-confidence router outputs (< 0.4) for generic greetings ("hi", "hello") to return unified multi-agent system capabilities.
8. **Bare `@` Tool Mention Handling:** Updated intent keywords and handlers to handle bare `@tool_name` queries (e.g. `@inventory_tracker`, `@employee_directory`) by returning complete summaries/listings.
9. **File Generation & Public Download Link Serving:** Added `/api/files/:type/:filename` public endpoint to serve generated CSV, Excel, and PDF reports with in-chat **📥 Download** cards.
10. **Groq HTTP 429 Rate Limit Handling:** Implemented 3-attempt exponential backoff retry logic in `GroqService.createCompletion` to handle rate limit and quota quota errors without throwing unhandled exceptions.
11. **Project Kickoff LangGraph Tool Mismatch:** Resolved issue where `projectKickoff.ts` invoked non-existent tool names `material_calculator` and `safety_checklist` by updating to `material_cost_calculator` and `safety_checklist_generator`.
12. **Employee Offboarding Property Access Crash:** Resolved `TypeError: Cannot read property 'firstName' of undefined` in `employeeOffboarding.ts` by adding optional chaining and fallback employee IDs.
13. **Executive Report PDF Generator Schema Mismatch:** Resolved Zod schema validation error in `executiveReport.ts` by structuring content as an array of objects `{ type: 'heading', text: '...' }` and providing a default filename.

### Frontend Errors (Fixed)
14: **Missing DOM Type Definitions:** Updated root `tsconfig.json` to exclude `frontend/`, preventing backend rules from breaking frontend DOM typing.
15. **EventTarget Missing `value` Property:** Typecasted `e.target` to `HTMLInputElement` in `App.tsx` onChange handlers.
16. **Unknown API Response Data:** Explicitly cast JSON fetch responses to `any` in `App.tsx` to satisfy strict typing.
17. **Static Mock Hub Data:** Replaced static arrays in `HR.tsx`, `Construction.tsx`, and `Manufacturing.tsx` with full operational CRUD modals (Add, Edit, Delete, View Details) connected to backend REST APIs.

---
*No active unresolved bugs. `npx tsc --noEmit` is 100% clean across backend and frontend.*
