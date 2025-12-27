# 🧪 LangGraph Step-by-Step Testing Guide

This guide provides a sequence of real-world scenarios to test the LangGraph workflow orchestration, error handling, and conditional logic.

## 🏁 Prerequisites
- Server running: `bun run dev`
- Database (MongoDB) is active.
- SMTP configured in `.env` (optional, for email step).

---

## 🟢 Step 1: Successful Full Onboarding
This test creates a new employee and runs all nodes: `createEmployee` -> `generateChecklist` -> `sendEmail`.

**Action:** Change the email to something unique for every run.

```bash
curl -X POST http://localhost:3000/api/workflows/langgraph/execute \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "firstName": "Alice",
      "lastName": "Engineer",
      "email": "alice.eng'$(date +%s)'@construction.com",
      "department": "Engineering",
      "position": "Site manager"
    }
  }'
```

---

## 🟡 Step 2: Test Conditional Logic (Skip Email)
This tests the **Conditional Edge**. By omitting the `email` from the context, the graph should skip the final `sendEmail` node but still complete the checklist.

```bash
curl -X POST http://localhost:3000/api/workflows/langgraph/execute \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "firstName": "Bob",
      "lastName": "NoEmail",
      "department": "Manufacturing",
      "position": "Factory worker"
    }
  }'
```
*Check the `results` array in the response; `Send Email` should be missing.*

---

## 🔴 Step 3: Test Error Handling (Duplicate Email)
This tests the **Failure Protection**. If we use the same email twice, the first step fails. The graph should stop immediately and NOT attempt to generate a checklist.

**Action:** Run this command twice.

```bash
curl -X POST http://localhost:3000/api/workflows/langgraph/execute \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "firstName": "Charlie",
      "lastName": "Duplicate",
      "email": "charlie.fix@example.com",
      "department": "HR",
      "position": "HR Assistant"
    }
  }'
```
*On the second run, you should receive a `failed` status with the error: "An employee with this email already exists".*

---

## 🏢 Multi-Department Agent Verification
Now that the agents are refactored to use **Intelligent Routing** (LLM-detected actions and parameters), you can verify the entire multi-agent system.

### 👤 HR Agent (Employee Directory & Policy)
Test the "Charlie Duplicate" search and policy queries.

```bash
# Search for the employee created in Step 3
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Who is employee Charlie Duplicate?",
    "sessionId": "hr-test"
  }'

# Query HR Policy (LLM should detect action: QUERY_POLICY)
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is our vacation policy?",
    "sessionId": "hr-test"
  }'
```

---

### 🏗️ Construction Agent (Project Management)
Test project creation and exports. The LLM should extract "projectName" automatically.

```bash
# Create a project (LLM extracts action: CREATE_PROJECT)
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a new project called Sky Tower in Downtown",
    "sessionId": "const-test"
  }'

# List projects
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me all active construction projects",
    "sessionId": "const-test"
  }'

# Export to PDF (LLM extracts action: EXPORT_PDF)
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Download the project report as a PDF",
    "sessionId": "const-test"
  }'
```

---

### 🏭 Manufacturing Agent (Inventory & Production)
Test inventory tracking and production scheduling.

```bash
# Add inventory (LLM extracts action: ADD_ITEM, parameters: item="Steel Beam", quantity=500)
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Add 500 units of Steel Beam to the inventory",
    "sessionId": "mfg-test"
  }'

# Check stock
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the current stock level for Steel Beam?",
    "sessionId": "mfg-test"
  }'

# Schedule a run
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Schedule a production run for the Sky Tower beams",
    "sessionId": "mfg-test"
  }'
```

---

## 🧠 Intelligent Router Verification
Verify that the system correctly routes messages based on intent, even with ambiguous queries.

```bash
# Mixed intent: Should route to HR for "Charlie"
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about Charlie Duplicates position and our sick leave policy",
    "sessionId": "router-test"
  }'

# Mixed intent: Should route to Construction
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How much does it cost to build the Sky Tower?",
    "sessionId": "router-test"
  }'
```

---

## 🛠️ Debugging Tips
- **Logs:** Watch the terminal running `bun run dev`. 
  - `[LangGraph]` markers show workflow state.
  - `Matched HR intent: ... (via action)` confirms that the LLM successfully detected the intent and parameters.
- **Router Logic:** If a message goes to the wrong department, check the `LM Studio` reasoning in the logs.
- **Parameters:** If the search fails, check if the `finalQuery` in the logs contains the expected name.
- **Database:** Use a MongoDB viewer to check the `employees`, `projects`, and `inventory` collections.
