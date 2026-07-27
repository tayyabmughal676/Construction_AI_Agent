# 🤖 Multi-Agent System Documentation

## Overview

The Construction AI Agent System features a modular multi-agent architecture designed to handle operations across Construction, Manufacturing, and HR departments. Each agent contains specialized tools for domain-specific tasks, with an intelligent router directing natural language queries to the appropriate agent.

## Architecture

### Agent Registry
- **AgentRegistry**: Singleton registry managing all active agents
- **BaseAgent**: Abstract base class providing common functionality for all agents
- **Intelligent Router**: Routes user queries to the correct agent using keyword detection or LLM analysis

### Agents Overview

| Agent | Department | Status | Tools Count |
|-------|------------|--------|-------------|
| ConstructionAgent | Construction | ✅ Active | 4 |
| ManufacturingAgent | Manufacturing | ✅ Active | 4 |
| HRAgent | HR | ✅ Active | 4 |

---

## 🏗️ ConstructionAgent

**Purpose**: Manage construction projects, materials, timelines, and safety compliance.

### Tools
- **ProjectTracker**: Create, list, update, and delete construction projects
- **MaterialCostCalculator**: Calculate material costs with historical data
- **TimelineEstimator**: Estimate project schedules based on past performance
- **SafetyChecklistGenerator**: Generate OSHA-compliant safety checklists

### Key Features
- Real-time project tracking across job sites
- AI-powered cost estimates with supplier recommendations
- Timeline predictions using historical data
- Automated safety compliance generation

---

## 🏭 ManufacturingAgent

**Purpose**: Oversee inventory, production, quality control, and equipment maintenance.

### Tools
- **InventoryTracker**: Monitor and update stock levels
- **ProductionScheduler**: Schedule production runs and optimize utilization
- **QualityControlLogger**: Log and analyze QC inspections
- **EquipmentMaintenance**: Track predictive maintenance and health status

### Key Features
- Never-run-out inventory management
- Production scheduling optimization
- Trend analysis for quality issues
- Predictive maintenance tracking

---

## 👥 HRAgent

**Purpose**: Handle employee management, leave, onboarding, and performance tracking.

### Tools
- **EmployeeDirectory**: Manage workforce directory and employee records
- **LeaveManagement**: Handle leave requests and approvals
- **OnboardingChecklist**: Process new hires with automated checklists
- **PerformanceTracker**: Track and analyze employee performance reviews

### Key Features
- Unified workforce management
- Automated leave approvals
- Onboarding in minutes, not days
- Data-driven performance reviews

---

## 🛠️ Utility Tools

### Validators
- Email validation
- Phone number validation
- Date validation
- URL validation
- SSN validation
- Credit card validation
- String/Number validation

### File Generators
- **CSV Export**: One-click CSV generation for all agent data
- **Excel Export**: Excel file creation with formatting
- **PDF Export**: Professional PDF reports
- **Word Export**: Docx document generation

### Communications
- **Email Sender**: SMTP-based email integration for notifications and workflows

---

## 🎯 Intelligent Router

### Routing Logic
1. **Keyword Detection**: Primary method using department-specific keywords
2. **LLM Fallback**: Optional advanced NLP for complex queries
3. **Confidence Scoring**: Determines routing accuracy

### Supported Query Types
- Construction: "show projects", "calculate material costs", "safety checklist"
- Manufacturing: "inventory levels", "schedule production", "equipment status"
- HR: "employee directory", "onboard new hire", "leave request"

### Response Format
```json
{
  "department": "construction",
  "toolsUsed": ["project_tracker"],
  "message": "Response text",
  "data": { ... }
}
```

---

## 🔧 Technical Implementation

### Agent Structure
```
src/agents/
├── AgentRegistry.ts      # Agent management
├── BaseAgent.ts          # Abstract base
├── ConstructionAgent.ts  # Construction logic
├── HRAgent.ts           # HR logic
├── ManufacturingAgent.ts # Manufacturing logic
├── IntelligentRouter.ts  # Query routing
└── types.ts             # Type definitions
```

### Tool Integration
- Each tool extends a base tool interface
- Tools are registered with agents at startup
- Tools handle database operations and business logic
- Error handling and logging built-in

---

## 📊 Current Status

- **Total Agents**: 3
- **Total Tools**: 12 specialized + 3 utility toolsets
- **Router**: Keyword-based (LLM integration paused)
- **Export Support**: CSV, Excel, PDF for all agents
- **Email Integration**: SMTP ready

### Phase 4 Progress
- LangGraph workflows: Not implemented
- LLM integration: Paused (keyword routing works perfectly)
- Advanced routing: Planned

---

## 🚀 Usage Examples

### Construction Query
```
Input: "Show me all projects behind schedule"
→ ConstructionAgent → ProjectTracker
→ Returns: List of delayed projects with analysis
```

### Manufacturing Query
```
Input: "Add 500 steel beams to inventory"
→ ManufacturingAgent → InventoryTracker
→ Returns: Updated stock levels
```

### HR Query
```
Input: "Onboard Sarah as new engineer"
→ HRAgent → OnboardingChecklist
→ Returns: Generated checklist and welcome email
```

---

## 📝 Notes

- All agents support export functionality
- Database seeding provides realistic demo data
- System is designed for easy addition of new agents/tools
- Graceful fallbacks ensure system reliability

**Last Updated**: Feb 23, 2026
