# 🌐 LangGraph Enterprise Swarm — Pending Tasks (`v2-work.md`)

> **Sponsored & Developed by [Data Daur AI & ERP Consulting](https://www.datadaur.com)**  
> **Target Architecture**: Autonomous Multi-Agent Swarm (`/api/v2/graph/*`)

---

## 📌 Phase 2 Pending Tasks

### 1. ⚙️ Backend Swarm Infrastructure (`/api/v2/graph/*`)
- [ ] **Swarm StateGraph (`MultiAgentSwarmGraph.ts`)**:
  - Build top-level `StateGraph` in `src/workflows/langgraph/` connecting Supervisor, ConstructionNode, HRNode, ManufacturingNode, and BarrierJoinNode.
- [ ] **Parallel Agent Race (Fan-Out / Fan-In)**:
  - Configure multi-branch execution where `ConstructionNode`, `HRNode`, and `ManufacturingNode` run in parallel for multi-department prompts.
  - Implement `aggregateSwarmResults` join node to synthesize multi-agent outputs.
- [ ] **Inter-Agent Sub-Task Delegation**:
  - Allow nodes to trigger sibling nodes within graph state (e.g. `HRNode` requesting `ConstructionNode` for a site safety checklist during onboarding).
- [ ] **MongoDB Checkpointer (`MongoDBSaver.ts`)**:
  - Save StateGraph checkpoints in MongoDB collection `langgraph_checkpoints` for state persistence and execution resume.
- [ ] **Human-in-the-Loop Interrupt Nodes**:
  - Add conditional interrupt nodes requiring human review for purchase orders > $10,000 or sensitive HR actions.

### 2. 🎨 Frontend Engine Switcher & Swarm UI
- [ ] **Header Engine Toggle**:
  - Add header toggle switch (**⚡ Standard v1.x** vs **🌐 LangGraph Swarm v2.x**).
- [ ] **Interactive Swarm Graph Visualizer**:
  - Render real-time active node states (Supervisor → Parallel Nodes → Barrier Join → Complete) during V2 graph execution.
- [ ] **Human-in-the-Loop Approval Modal**:
  - Render an interactive **Approve / Reject / Modify** modal when V2 graph triggers an interrupt node.

---

## 📂 Target File Layout for Phase 2

```
src/workflows/langgraph/
├── MultiAgentSwarmGraph.ts # Top-level v2.x Swarm Graph
├── MongoDBSaver.ts         # MongoDB Checkpointer Persistence
└── nodes/
    ├── ConstructionNode.ts # Parallel Construction execution node
    ├── HRNode.ts           # Parallel HR execution node
    └── ManufacturingNode.ts# Parallel Manufacturing execution node

src/routes/
└── v2graph.ts              # Endpoint: POST /api/v2/graph/chat
```
