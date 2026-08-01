# 🚀 Multi-Agent System Upgrade Plan (`v2-work.md`)

> **Architecture Strategy**: Dual-Engine Coexistence (Zero Breaking Changes)  
> **Phase 1**: Existing System Enhancements (v1.x — Fast REST Agent Router)  
> **Phase 2**: LangGraph Enterprise Engine (v2.x — Autonomous Swarm & Parallel Race)

---

## 📌 Architectural Philosophy: Dual Engine Design

To ensure **100% stability** and zero disruption to the existing working application, the system will support two coexisting engines side-by-side:

```
                          [ User Input / Voice ]
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
      ⚡ Standard REST Engine (v1.x)       🌐 LangGraph Swarm Engine (v2.x)
      (Fast Intent Router)                (Multi-Agent Race & Human-in-Loop)
      • Endpoint: /api/agents/chat         • Endpoint: /api/v2/graph/chat
      • Direct tool execution             • StateGraph supervisor orchestration
      • Instant single-turn responses      • Parallel fan-out sub-task dispatch
                                          • MongoDB checkpointer persistence
```

---

## 🛠️ PHASE 1: Existing System Enhancements (v1.x Improvements)

*Goal: Polish and harden the existing working REST API, database indices, and frontend terminal experience without touching the core routing logic.*

### 1.1 Backend Stability & Performance
- [x] **MongoDB Index Optimization**: Add text indexes on `employees` (`firstName`, `lastName`, `email`, `department`, `position`) and `projects` (`name`, `status`) in [mongodb.ts](file:///Users/mac/Desktop/n8n/Construction_AI_Agent/src/db/mongodb.ts) for sub-5ms search speeds.
- [x] **PDF Generator Pagination**: Update [PDFGeneratorTool.ts](file:///Users/mac/Desktop/n8n/Construction_AI_Agent/src/tools/utils/PDFGeneratorTool.ts) to handle multi-page auto-overflow and header repetition when table data exceeds 50 rows.
- [x] **Groq Rate-Limit Backoff**: Add exponential retry backoff in [groq.ts](file:///Users/mac/Desktop/n8n/Construction_AI_Agent/src/services/groq.ts) when Groq API returns HTTP 429 quota errors.
- [x] **Export Filename Timestamps**: Automatically append ISO timestamps (e.g. `employees_export_2026-08-01.csv`) to prevent file overwrites.

### 1.2 Frontend Experience Enhancements
- [x] **Multi-Thread Session Persistence**: Add a local/MongoDB session switcher in the sidebar to create, rename, and switch chat history threads (`localStorage` / `/api/auth/sessions`).
- [x] **Voice-to-Text Speech Input**: Add microphone recording button in [App.tsx](file:///Users/mac/Desktop/n8n/Construction_AI_Agent/frontend/src/App.tsx) using the Web Speech API for hands-free queries.
- [x] **File Drawer Panel**: Add a collapsible sidebar drawer listing all generated CSV, Excel, and PDF files with single-click redownload links.

---

## 🌐 PHASE 2: LangGraph Enterprise Engine (v2.x Autonomous Swarm)

*Goal: Build the next-generation autonomous multi-agent swarm in parallel under isolated `/api/v2/graph/*` endpoints.*

### 2.1 Backend LangGraph Swarm Infrastructure (`/api/v2/graph/*`)
- [ ] **Swarm StateGraph (`MultiAgentSwarmGraph.ts`)**:
  - Build a top-level `StateGraph` in `src/workflows/langgraph/` connecting Supervisor, ConstructionNode, HRNode, ManufacturingNode, and JoinNode.
- [ ] **Parallel Agent Race (Fan-Out / Fan-In)**:
  - Configure multi-branch execution where `ConstructionNode`, `HRNode`, and `ManufacturingNode` run in parallel for multi-department prompts.
  - Implement `aggregateSwarmResults` join node to synthesize outputs into a single response.
- [ ] **Inter-Agent Delegation**:
  - Allow nodes to trigger sibling nodes within the graph state (e.g. `HRNode` automatically requesting `ConstructionNode` for a site safety checklist during onboarding).
- [ ] **MongoDB Checkpointer (`MongoDBSaver.ts`)**:
  - Store StateGraph execution checkpoints in MongoDB collection `langgraph_checkpoints`.
- [ ] **Human-in-the-Loop Interrupts**:
  - Add conditional interrupt nodes for purchase orders > $10,000 or sensitive HR actions.

### 2.2 Frontend Engine Switcher & V2 Features
- [ ] **Header Engine Toggle**: Add a sleek switcher in the header (**⚡ Standard v1.x** vs **🌐 LangGraph Swarm v2.x**).
- [ ] **Interactive Node Graph Visualizer**: Render real-time active node states (Supervisor → Parallel Nodes → Join → Complete) during V2 graph execution.
- [ ] **Human-in-the-Loop Approval Modal**: Render an interactive **Approve / Reject / Modify** modal when V2 graph hits an interrupt node.

---

## 📂 File Structure for Dual-Engine Coexistence

```
src/
├── agents/                     # Phase 1: Existing v1.x Agent System (Unchanged)
│   ├── AgentRouter.ts
│   ├── ConstructionAgent.ts
│   ├── HRAgent.ts
│   └── ManufacturingAgent.ts
│
├── workflows/langgraph/        # Phase 2: LangGraph v2.x Swarm System
│   ├── MultiAgentSwarmGraph.ts # NEW: Top-level v2.x Swarm Graph
│   ├── checkpointer/           # NEW: MongoDB Checkpointer
│   │   └── MongoDBSaver.ts
│   └── nodes/                  # NEW: Isolated v2.x Agent Nodes
│       ├── ConstructionNode.ts
│       ├── HRNode.ts
│       └── ManufacturingNode.ts
│
└── routes/
    ├── agents.ts               # v1.x REST Endpoint: /api/agents/chat
    └── v2graph.ts              # NEW v2.x LangGraph Endpoint: /api/v2/graph/chat
```

---

## 🗓️ Execution Order

```
[ Step 1: Execute Phase 1 ] ──► Complete MongoDB indexing, PDF pagination, file drawer & voice input
                                      │
                                      ▼
[ Step 2: Execute Phase 2 ] ──► Build /api/v2/graph/* endpoints, MultiAgentSwarmGraph & Human-in-Loop UI
```

---

## 📋 Verification & Safety Guarantees
1. **Zero Regression**: Standard `/api/agents/chat` REST API remains 100% operational during and after V2 development.
2. **Independent Routes**: V2 runs in isolated route group `/api/v2/graph/chat` and `/api/v2/graph/stream`.
3. **Type Safety**: Both backend and frontend maintain 100% clean `tsc --noEmit` build passes throughout.

---

**Created**: Aug 1, 2026  
**Status**: Pending Review & User Approval
