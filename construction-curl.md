# Construction API - cURL Commands

This document contains all the cURL commands to test the Construction Agent API endpoints.

## Base URL
```bash
BASE_URL="http://localhost:3000"
```

---

## 🏥 Health & Info Endpoints

### Health Check
```bash
curl -X GET http://localhost:3000/health
```

### API Info
```bash
curl -X GET http://localhost:3000/
```

### API Endpoints Overview
```bash
curl -X GET http://localhost:3000/api
```

---

## 🏗️ Construction Agent Endpoints

### Get Construction Agent Capabilities
```bash
curl -X GET http://localhost:3000/api/construction/capabilities
```

---

## 💬 Chat Endpoint

### Basic Chat (without session)
```bash
curl -X POST http://localhost:3000/api/construction/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What can you help me with?"
  }'
```

### Chat with Session ID
```bash
curl -X POST http://localhost:3000/api/construction/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need help with a construction project",
    "sessionId": "session-123"
  }'
```

### Chat with Context
```bash
curl -X POST http://localhost:3000/api/construction/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Calculate material costs for my project",
    "sessionId": "session-123",
    "context": {
      "projectType": "residential",
      "location": "New York"
    }
  }'
```

---

## 🛠️ Direct Tool Execution

### 1️⃣ Material Cost Calculator

#### Calculate Single Material Cost
```bash
curl -X POST http://localhost:3000/api/construction/tools/material_cost_calculator \
  -H "Content-Type: application/json" \
  -d '{
    "materials": [
      {
        "material": "concrete",
        "quantity": 10,
        "unit": "cubic yards"
      }
    ]
  }'
```

#### Calculate Multiple Materials
```bash
curl -X POST http://localhost:3000/api/construction/tools/material_cost_calculator \
  -H "Content-Type: application/json" \
  -d '{
    "materials": [
      {
        "material": "concrete",
        "quantity": 10,
        "unit": "cubic yards"
      },
      {
        "material": "steel",
        "quantity": 5,
        "unit": "tons"
      },
      {
        "material": "lumber",
        "quantity": 2,
        "unit": "1000 board feet"
      },
      {
        "material": "brick",
        "quantity": 3,
        "unit": "1000 bricks"
      }
    ]
  }'
```

#### Full House Materials Estimate
```bash
curl -X POST http://localhost:3000/api/construction/tools/material_cost_calculator \
  -H "Content-Type: application/json" \
  -d '{
    "materials": [
      {"material": "concrete", "quantity": 50, "unit": "cubic yards"},
      {"material": "steel", "quantity": 10, "unit": "tons"},
      {"material": "lumber", "quantity": 15, "unit": "1000 board feet"},
      {"material": "brick", "quantity": 20, "unit": "1000 bricks"},
      {"material": "cement", "quantity": 100, "unit": "bags"},
      {"material": "sand", "quantity": 25, "unit": "tons"},
      {"material": "gravel", "quantity": 30, "unit": "tons"},
      {"material": "rebar", "quantity": 5, "unit": "tons"},
      {"material": "drywall", "quantity": 200, "unit": "sheets"},
      {"material": "insulation", "quantity": 2000, "unit": "square feet"},
      {"material": "roofing", "quantity": 2500, "unit": "square feet"},
      {"material": "paint", "quantity": 50, "unit": "gallons"},
      {"material": "tile", "quantity": 500, "unit": "square feet"},
      {"material": "plywood", "quantity": 100, "unit": "sheets"}
    ]
  }'
```

#### Test Unknown Material
```bash
curl -X POST http://localhost:3000/api/construction/tools/material_cost_calculator \
  -H "Content-Type: application/json" \
  -d '{
    "materials": [
      {"material": "concrete", "quantity": 10, "unit": "cubic yards"},
      {"material": "unknown_material", "quantity": 5, "unit": "units"}
    ]
  }'
```

---

### 2️⃣ Safety Checklist Generator

#### General Safety Checklist
```bash
curl -X POST http://localhost:3000/api/construction/tools/safety_checklist_generator \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "Residential Building"
  }'
```

#### Planning Phase Checklist
```bash
curl -X POST http://localhost:3000/api/construction/tools/safety_checklist_generator \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "Commercial Building",
    "phase": "planning"
  }'
```

#### Foundation Phase Checklist
```bash
curl -X POST http://localhost:3000/api/construction/tools/safety_checklist_generator \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "High-rise Building",
    "phase": "foundation"
  }'
```

#### Framing Phase Checklist
```bash
curl -X POST http://localhost:3000/api/construction/tools/safety_checklist_generator \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "Residential House",
    "phase": "framing"
  }'
```

#### Electrical Phase Checklist
```bash
curl -X POST http://localhost:3000/api/construction/tools/safety_checklist_generator \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "Office Building",
    "phase": "electrical"
  }'
```

#### Plumbing Phase Checklist
```bash
curl -X POST http://localhost:3000/api/construction/tools/safety_checklist_generator \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "Apartment Complex",
    "phase": "plumbing"
  }'
```

#### Finishing Phase Checklist
```bash
curl -X POST http://localhost:3000/api/construction/tools/safety_checklist_generator \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "Retail Store",
    "phase": "finishing"
  }'
```

---

### 3️⃣ Timeline Estimator

#### Simple Project Timeline
```bash
curl -X POST http://localhost:3000/api/construction/tools/timeline_estimator \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Small House Construction",
    "tasks": [
      {"name": "Site Preparation", "duration": 5},
      {"name": "Foundation", "duration": 10},
      {"name": "Framing", "duration": 15}
    ]
  }'
```

#### Full House Construction Timeline
```bash
curl -X POST http://localhost:3000/api/construction/tools/timeline_estimator \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Residential House Construction",
    "startDate": "2025-01-01",
    "tasks": [
      {"name": "Site Preparation", "duration": 7, "dependencies": []},
      {"name": "Foundation Work", "duration": 14, "dependencies": ["Site Preparation"]},
      {"name": "Framing", "duration": 21, "dependencies": ["Foundation Work"]},
      {"name": "Roofing", "duration": 10, "dependencies": ["Framing"]},
      {"name": "Electrical Rough-in", "duration": 7, "dependencies": ["Framing"]},
      {"name": "Plumbing Rough-in", "duration": 7, "dependencies": ["Framing"]},
      {"name": "HVAC Installation", "duration": 5, "dependencies": ["Framing"]},
      {"name": "Insulation", "duration": 5, "dependencies": ["Electrical Rough-in", "Plumbing Rough-in"]},
      {"name": "Drywall", "duration": 10, "dependencies": ["Insulation"]},
      {"name": "Interior Painting", "duration": 7, "dependencies": ["Drywall"]},
      {"name": "Flooring", "duration": 7, "dependencies": ["Drywall"]},
      {"name": "Kitchen Installation", "duration": 5, "dependencies": ["Flooring"]},
      {"name": "Bathroom Fixtures", "duration": 5, "dependencies": ["Flooring"]},
      {"name": "Final Electrical", "duration": 3, "dependencies": ["Interior Painting"]},
      {"name": "Final Plumbing", "duration": 3, "dependencies": ["Bathroom Fixtures"]},
      {"name": "Landscaping", "duration": 7, "dependencies": []},
      {"name": "Final Inspection", "duration": 2, "dependencies": ["Final Electrical", "Final Plumbing"]}
    ]
  }'
```

#### Commercial Building Timeline
```bash
curl -X POST http://localhost:3000/api/construction/tools/timeline_estimator \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Office Building Construction",
    "startDate": "2025-02-01",
    "tasks": [
      {"name": "Permits and Planning", "duration": 30},
      {"name": "Site Excavation", "duration": 14},
      {"name": "Foundation", "duration": 45},
      {"name": "Steel Frame Erection", "duration": 60},
      {"name": "Exterior Walls", "duration": 30},
      {"name": "Roof Installation", "duration": 20},
      {"name": "MEP Systems", "duration": 90},
      {"name": "Interior Finishes", "duration": 60},
      {"name": "Elevator Installation", "duration": 45},
      {"name": "Final Inspections", "duration": 14}
    ]
  }'
```

#### Timeline Without Start Date (Uses Current Date)
```bash
curl -X POST http://localhost:3000/api/construction/tools/timeline_estimator \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Quick Renovation",
    "tasks": [
      {"name": "Demolition", "duration": 3},
      {"name": "Rebuild", "duration": 7},
      {"name": "Finishing", "duration": 5}
    ]
  }'
```

---

### 4️⃣ Project Tracker (MongoDB Required)

> **Note**: These commands require MongoDB to be connected. They will fail if database is not configured.

#### Create New Project
```bash
curl -X POST http://localhost:3000/api/construction/tools/project_tracker \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "name": "Downtown Office Building",
    "description": "15-story commercial office building",
    "budget": 5000000,
    "startDate": "2025-01-15",
    "endDate": "2026-06-30"
  }'
```

#### List All Projects
```bash
curl -X POST http://localhost:3000/api/construction/tools/project_tracker \
  -H "Content-Type: application/json" \
  -d '{
    "action": "list"
  }'
```

#### Get Specific Project
```bash
curl -X POST http://localhost:3000/api/construction/tools/project_tracker \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get",
    "projectId": "YOUR_PROJECT_ID_HERE"
  }'
```

#### Update Project
```bash
curl -X POST http://localhost:3000/api/construction/tools/project_tracker \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update",
    "projectId": "YOUR_PROJECT_ID_HERE",
    "budget": 5500000,
    "status": "in_progress"
  }'
```

---

## 🧪 Error Testing

### Invalid Tool Name
```bash
curl -X POST http://localhost:3000/api/construction/tools/invalid_tool \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Missing Required Parameters
```bash
curl -X POST http://localhost:3000/api/construction/tools/material_cost_calculator \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Invalid JSON
```bash
curl -X POST http://localhost:3000/api/construction/chat \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

### Empty Message
```bash
curl -X POST http://localhost:3000/api/construction/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": ""
  }'
```

---

## 📊 Available Materials (for Reference)

The Material Cost Calculator supports these materials:

| Material | Cost | Unit |
|----------|------|------|
| concrete | $150 | per cubic yard |
| steel | $800 | per ton |
| lumber | $450 | per 1000 board feet |
| brick | $600 | per 1000 bricks |
| cement | $120 | per bag |
| sand | $30 | per ton |
| gravel | $35 | per ton |
| rebar | $650 | per ton |
| drywall | $10 | per sheet |
| insulation | $0.50 | per square foot |
| roofing | $3.50 | per square foot |
| paint | $30 | per gallon |
| tile | $5 | per square foot |
| glass | $25 | per square foot |
| plywood | $40 | per sheet |

---

## 🔄 Available Safety Phases

The Safety Checklist Generator supports these phases:
- `planning`
- `foundation`
- `framing`
- `electrical`
- `plumbing`
- `finishing`

---

## 💡 Tips

### Pretty Print JSON Output
Add `| jq` to any curl command for formatted output:
```bash
curl -X GET http://localhost:3000/api/construction/capabilities | jq
```

### Save Response to File
```bash
curl -X POST http://localhost:3000/api/construction/tools/timeline_estimator \
  -H "Content-Type: application/json" \
  -d @timeline-request.json \
  -o timeline-response.json
```

### Use Request Files
Create a JSON file and reference it:
```bash
# Create materials.json
echo '{
  "materials": [
    {"material": "concrete", "quantity": 10, "unit": "cubic yards"}
  ]
}' > materials.json

# Use it in curl
curl -X POST http://localhost:3000/api/construction/tools/material_cost_calculator \
  -H "Content-Type: application/json" \
  -d @materials.json
```

### Verbose Output (for debugging)
```bash
curl -v -X POST http://localhost:3000/api/construction/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

---

## 🚀 Quick Test Script

Save this as `test-construction.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "🏥 Testing Health Check..."
curl -s $BASE_URL/health | jq

echo -e "\n🏗️ Testing Capabilities..."
curl -s $BASE_URL/api/construction/capabilities | jq

echo -e "\n💰 Testing Material Cost Calculator..."
curl -s -X POST $BASE_URL/api/construction/tools/material_cost_calculator \
  -H "Content-Type: application/json" \
  -d '{
    "materials": [
      {"material": "concrete", "quantity": 10, "unit": "cubic yards"},
      {"material": "steel", "quantity": 5, "unit": "tons"}
    ]
  }' | jq

echo -e "\n✅ Testing Safety Checklist..."
curl -s -X POST $BASE_URL/api/construction/tools/safety_checklist_generator \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "Residential Building",
    "phase": "foundation"
  }' | jq

echo -e "\n📅 Testing Timeline Estimator..."
curl -s -X POST $BASE_URL/api/construction/tools/timeline_estimator \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Test Project",
    "tasks": [
      {"name": "Foundation", "duration": 10},
      {"name": "Framing", "duration": 15}
    ]
  }' | jq

echo -e "\n💬 Testing Chat..."
curl -s -X POST $BASE_URL/api/construction/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What construction tools do you have?"
  }' | jq

echo -e "\n✅ All tests completed!"
```

Make it executable and run:
```bash
chmod +x test-construction.sh
./test-construction.sh
```

---

**Last Updated**: 2025-11-24  
**API Version**: 1.0.0  
**Base URL**: http://localhost:3000
