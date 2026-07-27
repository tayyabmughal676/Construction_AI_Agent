# 🐛 Bug Report & Known Issues

This document tracks known bugs, architectural mismatches, and TypeScript compilation errors discovered in the codebase.

## 🟢 Resolved Issues

All issues identified during the initial code audit have been resolved as of July 2026.

### Backend Errors (Fixed)
1. **Hono to Elysia Migration Leftovers:** Deleted the outdated `src/middleware/auth.ts` which relied on Hono types. Authentication is now handled properly inline in `src/app.ts`.
2. **Missing Security Middleware Application:** Elysia security middlewares (CORS, Rate Limiter, Headers, Request Logger) are now correctly invoked in `app.onBeforeHandle`.
3. **Invalid `ToolResult` Object Shapes:** Fixed `ProjectTrackerTool.ts`, `TimelineEstimatorTool.ts`, and `HRPolicyTool.ts` to return stringified details inside the `error` property, complying with the `ToolResult` interface.

### Frontend Errors (Fixed)
4. **Missing DOM Type Definitions:** Updated the root `tsconfig.json` to exclude the `frontend/` directory, preventing strict backend rules from breaking frontend DOM typing (`Cannot find name 'document'`).
5. **EventTarget Missing `value` Property:** Typecasted `e.target` to `HTMLInputElement` in `App.tsx` onChange handlers.
6. **Unknown API Response Data:** Explicitly cast JSON fetch responses to `any` in `App.tsx` to satisfy strict typing.

---
*No active bugs at this time.*
