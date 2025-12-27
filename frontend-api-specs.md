# 🌐 Frontend API Integration Spec

This document provides the technical specifications for integrating the React/Vite frontend with the Multi-Agent Backend.

## ⚙️ Base Configuration
- **Base URL**: `http://localhost:3000`
- **Content-Type**: `application/json`
- **Auth**: None (Development/Local)

---

## 🤖 Unified Agent API (Recommended)
This is the primary way to interact with the AI agents. It uses the **Intelligent Router** to automatically send messages to the correct department.

### 1. Unified Chat
**Endpoint**: `POST /api/agents/chat`  
**Description**: Sends a natural language message to the system. The router will detect the department (HR, Construction, Manufacturing), extract parameters, and return a response.

**Request Body**:
```json
{
  "message": "Add 500 units of Steel Beam to stock",
  "sessionId": "optional-uuid",
  "context": {
    "any_extra_field": "value"
  }
}
```

**Response (Success)**:
```json
{
  "sessionId": "5a59be95-d0a3-4f8e-bd24-cbb587d20809",
  "department": "manufacturing",
  "message": "📦 Added 500 unit(s) of Steel Beam to inventory.",
  "toolsUsed": ["inventory_tracker"],
  "data": { ... },
  "detection": {
    "department": "manufacturing",
    "confidence": 0.95,
    "action": "ADD_ITEM",
    "method": "llm",
    "reason": "..."
  }
}
```

### 2. System Capabilities
**Endpoint**: `GET /api/agents/capabilities`  
**Description**: Returns all registered departments and what they can do. Useful for building dynamic help menus or sidebars.

**Response**:
```json
{
  "registered_departments": ["construction", "hr", "manufacturing"],
  "capabilities": {
    "construction": "Construction Agent: Manages sites...",
    "hr": "HR Agent: Handles policies..."
  }
}
```

---

## 🏗️ Workflow API (LangGraph)
Use these endpoints to trigger multi-step processes like onboarding.

### 1. Execute LangGraph Workflow
**Endpoint**: `POST /api/workflows/langgraph/execute`  
**Description**: Triggers a StateGraph-based workflow (e.g., Employee Onboarding).

**Request Body**:
```json
{
  "context": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "department": "Engineering",
    "position": "Manager"
  },
  "sessionId": "optional-uuid"
}
```

**Response**:
```json
{
  "sessionId": "...",
  "success": true,
  "status": "completed",
  "results": [
    { "node": "createEmployee", "result": { ... } },
    { "node": "generateChecklist", "result": { ... } }
  ],
  "errors": [],
  "finalData": { ... }
}
```

### 2. List All Workflows
**Endpoint**: `GET /api/workflows/list`  
**Description**: Retrieves a list of all available hardcoded and LangGraph workflows.

---

## 🏢 Department Data APIs
Use these endpoints to populate the dashboard views with real-time data from the database.

### 1. HR: Employee Directory
**Endpoint**: `GET /api/hr/employees`  
**Description**: Returns the full list of employees for the HR Hub.

**Response**:
```json
{
  "employees": [
    { 
      "id": "EMP123456", 
      "name": "Sarah Connor", 
      "role": "Site Manager", 
      "department": "Construction", 
      "status": "active" 
    }
  ]
}
```

### 2. Construction: Project List
**Endpoint**: `GET /api/construction/projects`  
**Description**: Returns active and pending projects for the Site Terminal.

**Response**:
```json
{
  "projects": [
    { 
      "id": "PROJ-789", 
      "name": "Skyline Tower", 
      "location": "New York", 
      "budget": "$125.0M", 
      "progress": 68, 
      "status": "On Track" 
    }
  ]
}
```

### 3. Manufacturing: Inventory
**Endpoint**: `GET /api/manufacturing/inventory`  
**Description**: Returns real-time stock levels for the Fabrication Node.

**Response**:
```json
{
  "inventory": [
    { 
      "component": "Hydraulic Actuators", 
      "sku": "HA-402", 
      "stock": 124, 
      "status": "Optimal", 
      "location": "Rack A-04" 
    }
  ]
}
```

### 4. Manufacturing: Stats
**Endpoint**: `GET /api/manufacturing/stats`  
**Description**: Returns production and quality metrics.

**Response**:
```json
{ 
  "oee": "94.2%", 
  "activeLines": "12/14", 
  "qcPassRate": "99.8%" 
}
```

---

## 🛠️ Direct Department API (Fallback)
If you need to bypass the router and talk to a specific agent directly.

### 1. Direct Construction Chat
**Endpoint**: `POST /api/construction/chat`  
**Request**: `{ "message": "...", "sessionId": "..." }`

### 2. Direct Tool Execution
**Endpoint**: `POST /api/construction/tools/:toolName`  
**Description**: Manually trigger a specific tool (e.g., `material_cost_calculator`).

---

## 📋 Recommended Frontend Types (TypeScript)

```typescript
export interface AgentResponse {
  sessionId: string;
  department: string;
  message: string;
  toolsUsed?: string[];
  data?: any;
  error?: string;
  detection?: DepartmentDetection;
}

export interface DepartmentDetection {
  department: string;
  confidence: number;
  reason: string;
  action?: string;
  method: 'llm' | 'keyword' | 'context';
  parameters?: Record<string, any>;
}

export interface WorkflowExecutionResult {
  sessionId: string;
  success: boolean;
  status: 'completed' | 'failed' | 'running';
  results: Array<{ node: string; result: any }>;
  errors: string[];
  finalData: any;
}
```

---

## 🏥 Health Check
**Endpoint**: `GET /health`  
**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-27T...",
  "dependencies": {
    "redis": "healthy"
  }
}
```
