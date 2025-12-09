# 🤖 Multi-Domain Construction AI Agent System

> A game-changing **Agentic AI System** for the Construction Industry! This powerful AI Agent revolutionizes operations across multiple departments including **Construction**, **Manufacturing**, and **HR**.

Built with **TypeScript**, **Bun.js**, **Hono.js**, **MongoDB**, and **Redis**.

---

## ✅ System Status

| Component | Status |
|-----------|--------|
| **Server** | 🟢 Running on `http://localhost:3000` |
| **Database** | 🟢 MongoDB connected |
| **Agents** | 🟢 3 active departments |
| **Tools** | 🟢 25+ registered |
| **Routing** | 🟢 Keyword-based (working) |

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://www.docker.com/) & Docker Compose

### Installation

```bash
# 1. Clone and install dependencies
bun install

# 2. Start databases
docker-compose up -d

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 4. Seed database (optional)
bun run seed

# 5. Run development server
bun run dev
```

Server starts at `http://localhost:3000`

---

## 🏗️ Architecture

### Agents

| Agent | Domain | Tools |
|-------|--------|-------|
| **Construction Agent** | Projects, Materials, Timelines, Safety | 4 tools |
| **Manufacturing Agent** | Inventory, Production, Quality, Equipment | 4 tools |
| **HR Agent** | Employees, Leave, Onboarding, Performance | 4 tools |

### Utilities Toolkit

| Category | Capabilities |
|----------|--------------|
| **Validators** | Email, Phone, Date, URL, SSN, Credit Card |
| **File Generators** | CSV, Excel, PDF, Word |
| **Communications** | Email (SMTP) |

---

## 📁 Project Structure

```
src/
├── agents/           # AI agent definitions + router
├── config/           # Environment & configuration
├── db/               # MongoDB & Redis clients
├── middleware/       # Auth, logging, rate limiting
├── routes/           # API endpoints
├── services/         # Business logic & LLM services
├── tools/            # Agent tools per domain
│   ├── construction/ # 4 construction tools
│   ├── hr/           # 4 HR tools
│   ├── manufacturing/# 4 manufacturing tools
│   └── utils/        # Utility tools (export, validate, email)
└── utils/            # Helpers & validators
```

---

## 🔧 API Endpoints

### Health & Info
```bash
GET  /health               # Health check
GET  /                     # API information
GET  /api/agents/capabilities  # List all agents & tools
```

### Chat Interface
```bash
POST /api/agents/chat      # Primary chat endpoint
```

### Example Requests

```bash
# List inventory (Manufacturing)
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "list inventory"}'

# List employees (HR)
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "list employees"}'

# List projects (Construction)
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "list projects"}'

# Export to Excel
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "export inventory to Excel"}'

# Export to PDF
curl -X POST http://localhost:3000/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "export projects to PDF"}'
```

---

## 🐳 Docker Commands

```bash
# Start databases
docker-compose up -d

# Stop databases
docker-compose down

# View logs
docker-compose logs -f

# Reset databases
docker-compose down -v
```

---

## 🔧 Available Scripts

```bash
bun run dev      # Start development server with hot reload
bun run start    # Start production server
bun run seed     # Seed database with test data
bun test         # Run tests
```

---

## 🔑 Environment Variables

Create a `.env` file with:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/multi-ai-agency
MONGODB_DB_NAME=multi-ai-agency

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# LLM (Optional)
GOOGLE_API_KEY=your_google_api_key

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 📊 Features

### ✅ Completed (Phases 1-3)

- [x] **Foundation** - Hono.js server, MongoDB, Redis, TypeScript
- [x] **Construction Agent** - Projects, materials, timelines, safety
- [x] **Manufacturing Agent** - Inventory, production, quality, equipment
- [x] **HR Agent** - Employees, leave, onboarding, performance
- [x] **Agent Router** - Keyword-based routing
- [x] **Export System** - CSV, Excel, PDF generation
- [x] **Email Integration** - SMTP email sending
- [x] **Database Seeding** - 25+ test records
- [x] **Workflow System** - Employee onboarding workflow

### 🚧 Roadmap (Phase 4-5)

- [ ] **LangGraph Workflows** - Multi-step task automation
- [ ] **CrewAI Collaboration** - Multi-agent collaboration
- [ ] **LLM Integration** - Natural language understanding
- [ ] **Authentication** - JWT & role-based access
- [ ] **API Documentation** - OpenAPI/Swagger
- [ ] **Testing Suite** - Unit & integration tests
- [ ] **Frontend Dashboard** - React-based UI

---

## 🎯 Use Cases

### Construction
- Track project progress and milestones
- Calculate material costs
- Estimate project timelines
- Generate safety checklists

### Manufacturing
- Monitor inventory levels
- Schedule production runs
- Log quality control checks
- Track equipment maintenance

### HR
- Manage employee directory
- Handle leave requests
- Process onboarding checklists
- Track performance reviews

---

## 📖 Documentation

- `implementation_plan.md` - Detailed implementation roadmap
- `idea.md` - Future feature ideas
- `.env.example` - Environment configuration template

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Bun.js |
| **Framework** | Hono.js |
| **Database** | MongoDB |
| **Cache** | Redis |
| **Language** | TypeScript |
| **Validation** | Zod |
| **Logging** | Pino |
| **AI/ML** | LangChain, LangGraph |

---

## 📝 License

MIT License

---

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**Built with ❤️ for the Construction Industry**
