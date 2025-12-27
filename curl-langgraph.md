# 🧪 LangGraph Testing Guide

This guide contains `curl` commands to test the newly integrated **LangGraph** workflow engine.

## 🚀 Base URL
`http://localhost:3000/api/workflows/langgraph`

---

## 1. Complete Employee Onboarding
This tests the full graph execution, including creating the record, generating a checklist, and sending an email.

```bash
curl -X POST http://localhost:3000/api/workflows/langgraph/execute \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "department": "Engineering",
      "position": "Site Supervisor"
    }
  }'
```

---

## 2. Onboarding (Conditional Skip)
This tests the **conditional edge** in LangGraph. By omitting the `email`, the graph should automatically skip the `sendEmail` node and complete successfully.

```bash
curl -X POST http://localhost:3000/api/workflows/langgraph/execute \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "firstName": "Jane",
      "lastName": "Smith",
      "department": "HR",
      "position": "HR Coordinator"
    }
  }'
```

---

## 3. Workflow with Custom Session
Use this to track execution across logs using a specific `sessionId`.

```bash
curl -X POST http://localhost:3000/api/workflows/langgraph/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-123",
    "context": {
      "firstName": "Robert",
      "lastName": "Brown",
      "email": "robert.b@construction.com",
      "department": "Manufacturing",
      "position": "Plant Manager"
    }
  }'
```

---

## 📊 Expected Response Format

A successful execution will return a response similar to this:

```json
{
  "success": true,
  "status": "completed",
  "results": [
    { "step": "Create Employee", "employeeId": "EMP-123..." },
    { "step": "Generate Checklist", "checklistId": "CHK-456..." },
    { "step": "Send Email", "success": true }
  ],
  "errors": [],
  "finalData": { ... }
}
```

## 🛠️ Debugging
If the workflow fails, check the server logs for detailed "LangGraph" prefixed entries:
- `Using LM Studio to detect intent...`
- `LangGraph: Creating employee record...`
- `LangGraph: Generating checklist...`
