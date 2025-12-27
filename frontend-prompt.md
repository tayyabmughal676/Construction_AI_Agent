# Frontend Generation Prompt: Multi-Agent Enterprise Dashboard

Act as a Senior Frontend Engineer. Your task is to generate a premium, high-performance web application using **React (Vite)**, **TypeScript**, and **Tailwind CSS**.

## Design Philosophy
- **Aesthetic**: "Future Industrial" / "Aerospace Corporate" (Dark mode by default, sleek glassmorphism, subtle gradients, and crisp typography).
- **UX**: Smooth transitions (Framer Motion), interactive micro-animations, and a responsive layout that works for both site managers in the field and office executives.

## Technical Requirements
- **Framework**: React 18+ with Vite.
- **Styling**: Tailwind CSS with a curated color palette (e.g., Deep Slate #0f172a, Construction Gold #f59e0b, Manufacturing Blue #3b82f6).
- **State Management**: React Query (TanStack Query) for API interactions.
- **Icons**: Lucide React.
- **Animations**: Framer Motion.
- **Components**: Shadcn/UI (Radix UI) primitives where applicable.

## Core Features to Implement

### 1. Unified Intelligence Terminal (Chat)
- A central chat interface that connects to `POST /api/agents/chat`.
- Support for streaming-like response display (even if the backend doesn't stream yet).
- Visual indicators for which "Agent" (HR, Construction, Manufacturing) is currently processing the request.
- "Tools Used" display: Show which backend tools were executed for a request (e.g., "Project Tracker Tool used", "Employee Directory searched").
- Parameter auto-fill: UI should react if the agent extracts specific data (like a project name or employee ID).

### 2. Multi-Department Dashboard
- **HR Hub**:
    - Employee Directory view (cards/grid).
    - Policy Knowledge Base browser.
    - Employee Onboarding Workflow wizard (interactive multi-step form connecting to `/api/workflows/langgraph/execute`).
- **Construction Site**:
    - Project Progress Tracker (Gantt-lite or Stage visualizer).
    - Cost Calculator Widget.
    - Timeline Estimation board.
- **Manufacturing Plant**:
    - Real-time Inventory Status (list with status badges: "Low Stock", "In Production").
    - Production Scheduler (Calendar view or Queue).
    - Equipment Maintenance health monitor.

### 3. Workflow Center
- A section to trigger and monitor **LangGraph Workflows**.
- Progress tracking for long-running workflows (e.g., Onboarding checklist progress).

### 4. Export & Reports
- UI hooks to trigger PDF, CSV, and Excel generation from any dashboard view.

## API Integration Map
- `BASE_URL`: `http://localhost:3000/api`
- `CHAT`: `POST /agents/chat { message, sessionId, context }`
- `CAPABILITIES`: `GET /agents/capabilities`
- `EXECUTE_WORKFLOW`: `POST /workflows/langgraph/execute { context }`
- `HEALTH`: `GET /health` (for system status badge)

## Component Structure
- `Sidebar`: Collapsible, high-tech aesthetic, quick access to departments.
- `ChatOverlay`: Minimized floating chat or full-screen terminal mode.
- `StatCards`: Dynamic cards for "Total Projects", "Inventory Value", "Active Employees".
- `DataGrid`: Sortable, filterable tables for all resources.

## Prompt Instructions for the Generator
"Generate a clean, modular React folder structure. Use `src/components`, `src/hooks`, `src/services`, and `src/views`. Ensure all components are type-safe. Implement a `useChat` hook to handle conversation state and session IDs. Use Tailwind's `group` and `hover` utilities for premium interactive feels. Provide a `theme.ts` for consistent colors."
