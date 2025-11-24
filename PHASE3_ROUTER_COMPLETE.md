# Phase 3 - Agent Router Complete ✅

## What We Built

### 1. AgentRegistry (Singleton)
- **Central registry** for all agents
- **Dynamic agent registration** and lookup
- **Capabilities aggregation** across all departments
- Thread-safe singleton pattern

### 2. AgentRouter (Smart Routing)
- **Intelligent department detection** using keyword scoring
- **Context-aware routing** (explicit department override)
- **Confidence scoring** for routing decisions
- **Extensible keyword system** (60+ keywords across 3 departments)
- **Fallback mechanism** to default department

### 3. Unified API Endpoints

#### `/api/agents/chat` - Auto-routing Chat
Routes messages to the appropriate department automatically:
```bash
POST /api/agents/chat
{
  "message": "I need a safety checklist",
  "sessionId": "optional-session-id",
  "department": "construction",  # Optional: force specific department
  "context": {}                   # Optional: additional context
}
```

#### `/api/agents/capabilities` - All Capabilities
Get capabilities from all registered agents:
```bash
GET /api/agents/capabilities
```

#### `/api/agents/stats` - Router Statistics
View routing statistics and registered departments:
```bash
GET /api/agents/stats
```

#### `/api/agents/detect` - Test Department Detection
Test department detection without executing:
```bash
POST /api/agents/detect
{
  "message": "calculate material costs",
  "context": {}
}
```

## Architecture

```
User Request
     ↓
AgentRouter.route()
     ↓
detectDepartment() → Keyword Scoring
     ↓
AgentRegistry.getAgent(department)
     ↓
agent.processMessage()
     ↓
Response + Detection Info
```

## Department Detection

### How It Works
1. **Context Check**: If `context.department` is provided, use it directly (confidence: 1.0)
2. **Keyword Matching**: Score each department based on keyword matches
3. **Best Match**: Select department with highest score (if score > 0)
4. **Fallback**: Use default department if no matches found

### Keyword Categories

**Construction** (20 keywords):
- construction, building, project, contractor, site
- foundation, framing, concrete, steel, material
- timeline, schedule, safety, checklist, excavation
- blueprint, permit, inspection, renovation, demolition

**Manufacturing** (20 keywords):
- manufacturing, production, inventory, stock, warehouse
- assembly, quality, defect, equipment, maintenance
- factory, plant, machine, batch, yield, capacity
- downtime, throughput, supplier, parts

**HR** (20 keywords):
- hr, human resources, employee, staff, personnel
- hiring, recruitment, onboarding, leave, vacation
- performance, review, salary, payroll, benefits
- training, termination, resignation, attendance, team

### Confidence Levels
- **1.0**: Explicit department in context
- **0.2-1.0**: Keyword matches (capped at 1.0, calculated as matches/5)
- **0.1**: No matches, using default

## Testing Results ✅

### Test 1: Construction Detection
```bash
curl -X POST http://localhost:3000/api/agents/detect \
  -H "Content-Type: application/json" \
  -d '{"message":"I need to calculate material costs for concrete and steel"}'
```

**Result:**
```json
{
  "detection": {
    "department": "construction",
    "confidence": 0.6,
    "reason": "Matched 3 keyword(s) related to construction"
  }
}
```
✅ Matched: "material", "concrete", "steel"

### Test 2: Unified Chat with Auto-Routing
```bash
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"I need a safety checklist for the foundation phase"}'
```

**Result:**
```json
{
  "message": "✅ Safety checklist generated with 8 items",
  "department": "construction",
  "detection": {
    "department": "construction",
    "confidence": 0.6,
    "reason": "Matched 3 keyword(s) related to construction"
  }
}
```
✅ Auto-routed to Construction Agent
✅ Executed safety_checklist_generator tool
✅ Returned detection metadata

### Test 3: Capabilities Endpoint
```bash
curl http://localhost:3000/api/agents/capabilities
```

**Result:**
```json
{
  "capabilities": {
    "construction": "Construction Agent Capabilities:\n- project_tracker\n- material_cost_calculator\n- timeline_estimator\n- safety_checklist_generator"
  },
  "stats": {
    "registeredDepartments": ["construction"],
    "totalAgents": 1,
    "keywordCounts": {
      "construction": 20,
      "manufacturing": 20,
      "hr": 20
    }
  }
}
```
✅ Shows all registered agents
✅ Provides routing statistics
✅ Lists keyword counts per department

## Project Structure

```
src/
├── agents/
│   ├── types.ts                 ✅ Updated (department: string)
│   ├── BaseAgent.ts             ✅ Existing
│   ├── ConstructionAgent.ts     ✅ Existing
│   ├── AgentRegistry.ts         ✅ NEW - Central registry
│   └── AgentRouter.ts           ✅ NEW - Smart routing
├── config/
│   └── agents.ts                ✅ NEW - Agent initialization
└── routes/
    ├── agents.ts                ✅ NEW - Unified endpoints
    └── construction.ts          ✅ Existing
```

## Key Features

1. ✅ **Singleton Registry** - One source of truth for all agents
2. ✅ **Smart Routing** - Keyword-based department detection
3. ✅ **Confidence Scoring** - Know how certain the routing is
4. ✅ **Context Override** - Force specific department when needed
5. ✅ **Extensible Keywords** - Easy to add custom keywords
6. ✅ **Fallback Mechanism** - Always routes somewhere
7. ✅ **Detection Testing** - Test routing without execution
8. ✅ **Statistics API** - Monitor routing behavior

## API Comparison

### Before (Phase 2)
```bash
# Had to know which department
POST /api/construction/chat
POST /api/manufacturing/chat  # (not implemented)
POST /api/hr/chat              # (not implemented)
```

### After (Phase 3)
```bash
# Automatic routing
POST /api/agents/chat
{
  "message": "any message here"
}
# Router figures out the department!
```

## Response Format

All routed responses include detection metadata:

```typescript
{
  message: string;           // Agent response
  toolsUsed?: string[];      // Tools executed
  data?: any;                // Tool results
  sessionId: string;         // Session ID
  department: string;        // ✅ NEW: Detected department
  detection: {               // ✅ NEW: Detection details
    department: string;
    confidence: number;
    reason: string;
  }
}
```

## Usage Examples

### Example 1: Let Router Decide
```bash
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Calculate costs for 10 cubic yards of concrete"
  }'
```
→ Routes to Construction → Uses material_cost_calculator

### Example 2: Force Specific Department
```bash
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me the projects",
    "department": "construction"
  }'
```
→ Forces Construction (confidence: 1.0)

### Example 3: Test Detection First
```bash
curl -X POST http://localhost:3000/api/agents/detect \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need help with employee onboarding"
  }'
```
→ Shows: department: "construction" (default, since HR not registered yet)

## Next Steps

### Phase 3.1: Manufacturing Agent
- Create ManufacturingAgent class
- Implement 4 manufacturing tools:
  1. Inventory Tracker
  2. Production Scheduler
  3. Quality Control Logger
  4. Equipment Maintenance
- Register with AgentRegistry
- Test auto-routing to manufacturing

### Phase 3.2: HR Agent
- Create HRAgent class
- Implement 4 HR tools:
  1. Employee Directory
  2. Leave Management
  3. Onboarding Checklist
  4. Performance Tracker
- Register with AgentRegistry
- Test multi-department routing

### Phase 3.3: Advanced Routing
- Add LLM-based intent detection (Phase 4)
- Multi-department query handling
- Agent collaboration workflows
- Cross-department context sharing

## Benefits

1. **Scalability**: Easy to add new departments
2. **Flexibility**: Multiple routing strategies (keywords, context, explicit)
3. **Transparency**: Detection metadata shows routing decisions
4. **Testing**: Dedicated endpoint for testing routing logic
5. **Maintainability**: Centralized agent management
6. **User Experience**: Single endpoint for all departments

---

**Status:** Phase 3 Router Infrastructure Complete! 🎉

**What's Working:**
- ✅ AgentRegistry managing all agents
- ✅ AgentRouter with smart detection
- ✅ Unified `/api/agents/chat` endpoint
- ✅ Department detection with confidence scoring
- ✅ Capabilities and stats endpoints
- ✅ Detection testing endpoint
- ✅ Construction agent fully integrated

**Ready For:**
- Manufacturing Agent (Phase 3.1)
- HR Agent (Phase 3.2)
- Multi-agent collaboration (Phase 4)
