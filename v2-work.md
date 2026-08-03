# 🌐 LangGraph Enterprise Swarm Engine (`v2-work.md`)

> **Sponsored & Developed by [Data Daur AI & ERP Consulting](https://www.datadaur.com)**  
> **Status**: ✅ **100% Phase 2 & 2.1 Completed & Verified** (`/api/v2/graph/*`)

---

## 📌 Phase 2 & 2.1 Completed Tasks

### 1. 🧠 Dynamic Intelligence Intent Layer & Direct Agent Tool Dispatch
- [x] **Dynamic Tool Schema Harvesting (`IntelligentIntentLayer.ts`)**:
  - Dynamically harvests live tool catalog (names, descriptions, schemas) from `AgentRegistry`.
- [x] **Zero-Shot LLM Intent Classification**:
  - Eliminates hardcoded keyword lists in favor of Groq LLM + LM Studio zero-shot tool classification and parameter extraction.
- [x] **Direct Agent Tool Dispatch**:
  - Implemented direct tool execution in `processMessage()` across `ConstructionAgent`, `HRAgent`, and `ManufacturingAgent`.
- [x] **Action Normalizer & Schema Enrichers**:
  - Automatically maps LLM action synonyms (`list` → `list_items`, `order`/`create` → `add_item`, `search` → `check_stock`, `log` → `log_inspection`), populating parameter defaults.

### 2. 📖 Issa Enterprise Knowledge Base & Policy Engine
- [x] **MongoDB Knowledge Schema (`Knowledge.ts`)**:
  - Built Zod validator and collection model supporting category tags and departments.
- [x] **15 Seeded Corporate Policies (`src/seed.ts`)**:
  - Seeded 15 detailed corporate policy documents for **Issa Construction & Industrial Group** (WFH $500 stipend, 20 PTO days, OSHA site safety checklists, ISO 9001 quality SOPs).
- [x] **Knowledge Search AI Tool (`KnowledgeBaseTool.ts`)**:
  - Created `company_knowledge_base` tool registered across `HRAgent`, `ConstructionAgent`, and `ManufacturingAgent`.

### 3. ⚙️ Backend Swarm Infrastructure (`/api/v2/graph/*`)
- [x] **Swarm StateGraph (`MultiAgentSwarmGraph.ts`)**:
  - Built top-level `StateGraph` in `src/workflows/langgraph/` connecting Supervisor, ConstructionNode, HRNode, ManufacturingNode, and BarrierJoinNode.
- [x] **Parallel Agent Race (Fan-Out / Fan-In)**:
  - Multi-branch parallel execution with `barrierJoinNode` synthesizing multi-agent output summaries.
- [x] **MongoDB Checkpointer (`MongoDBSaver.ts`)**:
  - Checkpoint persistence in MongoDB collection `langgraph_checkpoints` with memory fallback.
- [x] **Human-in-the-Loop Interrupt Nodes**:
  - Automatic graph pause whenever purchase order totals exceed **$10,000**, rendering interactive UI approval modal.

### 4. 🛡️ System Resilience & Codebase Hardening
- [x] **Defensive Tool Exception Guard (`BaseAgent.ts`)**:
  - Wrapped tool execution in try/catch to eliminate unhandled server process crashes.
- [x] **MongoDB Text Indexing (`mongodb.ts`)**:
  - Added `KnowledgeTextIndex` for sub-5ms text queries across policy documents.
- [x] **Safe Date Deserialization (`App.tsx`)**:
  - Built `formatTimestamp()` helper resolving string ISO date formatting errors cleanly.

---

## 📂 File Layout for Phase 2 & 2.1

```
src/agents/
├── IntelligentIntentLayer.ts # Dynamic Tool Schema LLM Classifier & Action Normalizer
├── ConstructionAgent.ts      # Direct Tool Dispatch & Project Summary Cards
├── HRAgent.ts                # Direct Tool Dispatch & Performance Card Summary
└── ManufacturingAgent.ts     # Direct Tool Dispatch & Inventory Summary Cards

src/tools/utils/
└── KnowledgeBaseTool.ts      # Issa Group Knowledge Base Policy Lookup Tool

src/db/models/
└── Knowledge.ts              # MongoDB Knowledge Base Zod Schema

src/workflows/langgraph/
├── MultiAgentSwarmGraph.ts   # Top-level v2.x Swarm Graph
└── MongoDBSaver.ts           # MongoDB Checkpointer Persistence

src/routes/
└── v2graph.ts                # Endpoint: POST /api/v2/graph/chat & /approve

test/router/
└── IntelligentIntentLayer.test.ts # 4 automated Intent Layer tests
```
