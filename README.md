# Multi-Domain Construction AI Agent System

A TypeScript-based multi-domain AI agent system built with Bun.js, Hono, MongoDB, and Redis.

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) >= 1.0
- [Docker](https://www.docker.com/) & Docker Compose

### Installation

1. **Clone and install dependencies**
```bash
bun install
```

2. **Start databases**
```bash
docker-compose up -d
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Run development server**
```bash
bun run dev
```

Server will start at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── agents/          # AI agent definitions
├── config/          # Environment & configs
├── db/              # MongoDB & Redis clients
├── middleware/      # Auth, logging, rate limit
├── routes/          # API endpoints
├── services/        # Business logic
├── tools/           # Agent tools per domain
└── utils/           # Helpers
```

## 🔧 Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun test` - Run tests

## 🏥 Health Check

```bash
curl http://localhost:3000/health
```

## 📚 API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /api` - API routes (coming soon)

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

## 🎯 Departments

1. **Construction** - Project tracking, materials, timelines
2. **Manufacturing** - Inventory, production, quality control
3. **HR** - Employee management, leave, onboarding

## 📝 Development Status

- [x] Phase 1: Foundation (Core infrastructure)
- [ ] Phase 2: Agent Core (Single-domain agent)
- [ ] Phase 3: Multi-Domain (All departments)
- [ ] Phase 4: Intelligence (LangGraph/CrewAI)
- [ ] Phase 5: Production Ready (Security, monitoring)

## 🔑 Environment Variables

See `.env.example` for all configuration options.

## 📖 Documentation

See `implementation_plan.md` for detailed implementation roadmap.
