# 🤖 Multi-Agent System Documentation

> **Sponsored & Developed by [Data Daur AI & ERP Consulting](https://www.datadaur.com)**  
> 🌐 Website: [www.datadaur.com](https://www.datadaur.com) • ✉️ Contact: [info@datadaur.com](mailto:contact@datadaur.com)

## Overview

The Construction AI Agent System features a modular multi-agent architecture designed to handle operations across Construction, Manufacturing, and HR departments. Each agent contains specialized tools for domain-specific tasks, with an intelligent router directing natural language queries to the appropriate agent.

## Architecture

### Agent Registry
- **AgentRegistry**: Singleton registry managing all active agents (`ConstructionAgent`, `HRAgent`, `ManufacturingAgent`).
- **BaseAgent**: Abstract base class providing common functionality for defensive tool execution, parameter validation, and structured logging.
- **Dynamic Intelligence Intent Layer**: Inspects live tool schemas from `AgentRegistry`, executing zero-shot LLM intent classification and parameter extraction with automatic action normalization.
- **Intelligent Router**: Routes user queries to the correct agent using Groq LLM with HTTP 429 exponential backoff retry (primary), LM Studio (fallback), or keyword fallback.

### Agents Overview

| Agent | Department | Status | Tools Count | Intents Count | Hub Status |
|-------|------------|--------|-------------|---------------|------------|
| **ConstructionAgent** | Construction | ✅ Active | 8 (incl. export & KB) | 9 | ✅ Full CRUD |
| **ManufacturingAgent** | Manufacturing | ✅ Active | 8 (incl. export & KB) | 9 | ✅ Full CRUD |
| **HRAgent** | HR | ✅ Active | 7 (incl. export & KB) | 9 | ✅ Full CRUD |

---

## 🏗️ ConstructionAgent

**Purpose**: Manage construction projects, materials, timelines, and safety compliance.

### Tools
- **ProjectTracker**: Create, list, update, and delete construction projects (`PRJ-001`).
- **MaterialCostCalculator**: Calculate material cost breakdowns (steel, concrete, lumber, drywall).
- **TimelineEstimator**: Estimate project phase schedules based on past performance.
- **SafetyChecklistGenerator**: Generate OSHA-compliant pre-construction & framing safety checklists.
- **File Generators**: CSV, Excel, and PDF exporters.

---

## 🏭 ManufacturingAgent

**Purpose**: Oversee inventory, production, quality control, and equipment maintenance.

### Tools
- **InventoryTracker**: Monitor and update stock levels, SKUs (`STEEL-001`), and reorder points.
- **ProductionScheduler**: Schedule production runs and optimize line utilization.
- **QualityControlLogger**: Log and analyze batch QC inspections and OEE pass rates.
- **EquipmentMaintenance**: Track predictive maintenance and machine health status (CNC, Welding Robots).
- **File Generators**: CSV, Excel, and PDF exporters.

---

## 👥 HRAgent

**Purpose**: Handle employee management, leave, onboarding, and performance tracking.

### Tools
- **EmployeeDirectory**: Manage workforce directory with Employee IDs (`EMP001`), split-word regex search.
- **LeaveManagement**: Handle leave requests, vacation balances, and approval workflows.
- **OnboardingChecklist**: Process new hires with 15-step automated checklists.
- **PerformanceTracker**: Track employee quarterly goals, reviews, and performance metrics.
- **EmailSender**: Send notifications and attachments via SMTP.

---

## 🎯 Intelligent Router & Capabilities

### Routing Logic
1. **Context-Based**: Direct routing when department context is explicitly specified.
2. **Groq LLM Intent Detection**: High-accuracy natural language classification with parameter extraction and 429 retry backoff.
3. **LM Studio Fallback**: Local LLM fallback if cloud service is unavailable.
4. **Keyword Scoring**: Specialized term frequency matching.
5. **Unified Welcome Fallback**: When query confidence is low (< 0.4) or a generic greeting ("hi", "hello") is received, the router returns a unified multi-agent capabilities overview.

### Frontend Capabilities & UX Features
- **`@`-Mention Tool Selection**: Typing `@` in chat opens an interactive, department-grouped tool menu for quick tool insertion.
- **🎙️ Voice-to-Text**: Hands-free speech recognition in input bar.
- **💬 Multi-Thread Chat Sessions**: Sidebar conversation thread switcher stored in `localStorage`.
- **📥 In-Chat File Downloads**: Instant download cards for CSV, Excel, and PDF reports.
- **🔔 Toast System**: Animated floating notification popups for all user actions (`success`, `error`, `info`, `warning`).
- **🌐 6/6 LangGraph Workflows**: Company Control, Employee Onboarding, Project Kickoff, Inventory Restock, Employee Offboarding, Monthly Executive Report.

---

## 📊 Current Status

- **Total Agents**: 3 (`ConstructionAgent`, `ManufacturingAgent`, `HRAgent`)
- **Total Tools**: 12 domain tools + 4 export generators + 1 communication tool + 1 enterprise knowledge base tool
- **Router & Intent Layer**: Dynamic Intelligence Intent Layer (`IntelligentIntentLayer.ts`) harvesting live schemas + Groq LLM (with 429 exponential backoff) + LM Studio + Keyword Fallback
- **LangGraph Workflows**: 6/6 Operational StateGraph workflows + v2 Autonomous Multi-Agent Swarm (`MultiAgentSwarmGraph.ts`) with MongoDB checkpoints and $10k+ PO Human Interrupts
- **Security & Hardening**: 100% Resolved (`SECURITY.md` — `SEC-01` through `SEC-09` & `BUG-01`)
- **Frontend Architecture**: Modular React 19 + TypeScript (`types/`, `constants/`, `services/`, `hooks/`, `components/`) with `@` autocomplete, Voice input, Multi-thread sessions, Toast notifications, and 3 Full CRUD Department Hubs
- **Automated Tests**: 54/54 PASS across 12 test suites (123 assertions, 0 failures)

**Last Updated**: Aug 2026
