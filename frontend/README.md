<div align="center">

# 🎨 Construction AI Agent — Frontend UI
### **Modern Intelligence Terminal & Department Management Hubs**

[![React](https://img.shields.io/badge/React-v19.2-blue?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-v8.2-purple?logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-v12.4-black)](https://framer.com/motion)
[![Sponsored & Developed by Data Daur](https://img.shields.io/badge/Sponsored%20%26%20Developed%20By-Data%20Daur%20AI%20%26%20ERP%20Consulting-blue?style=for-the-badge&logo=shield)](https://www.datadaur.com)

*Unified web application interface for the Construction AI Multi-Agent Platform.*

[🚀 Quick Start](#-quick-start) • [✨ Key UI Features](#-key-ui-features) • [🧩 Component Architecture](#-component-architecture) • [🧪 Testing](#-testing--quality-assurance)

---

</div>

## 📌 Overview

The **Construction AI Agent Frontend** is a modern, high-performance web interface built with **React 19**, **Vite 8**, **TailwindCSS 4**, and **Framer Motion 12**. 

It provides an intuitive ChatGPT-style **Unified Intelligence Terminal** alongside dedicated management hubs for **Construction Site Operations**, **Manufacturing Plant Inventory**, **HR Workforce Directory**, and **LangGraph StateGraph Workflows**.

---

## ✨ Key UI Features

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                    🌟 FRONTEND HIGHLIGHTS                                 │
├───────────────────────────────┬───────────────────────────────┬───────────────────────────┤
│ 💬 Intelligence Terminal      │ 👥 Workforce Directory Hub    │ 🏗️ Site Operations Hub    │
│ • `@` Tool Autocomplete Menu  │ • Complete Employee CRUD      │ • Project Progress Bars   │
│ • 🎙️ Voice-to-Text Speech     │ • Prominent Employee IDs      │ • Site Location & Budgets │
│ • Multi-Thread History        │ • Search & Filter Drawer      │ • Details Drawer Modal    │
├───────────────────────────────┼───────────────────────────────┼───────────────────────────┤
│ 🏭 Manufacturing Node Hub     │ 🌐 LangGraph Workflow Wizard  │ 🔔 Floating Toast Alerts  │
│ • SKUs & Warehouse Locations  │ • 4-Step Interactive Wizard   │ • Animated Framer Popups  │
│ • Real-time OEE Metrics       │ • 6 Autonomous Workflows      │ • Color-Coded Categories  │
│ • Stock Level Adjustments     │ • Execution Step Graphs       │ • Auto-Dismiss (4 seconds)│
└───────────────────────────────┴───────────────────────────────┴───────────────────────────┘
```

---

## 🧩 Component Architecture

```
frontend/src/
├── components/
│   ├── Construction.tsx      # Site Terminal (Full CRUD, Project IDs, Progress bars)
│   ├── HR.tsx                # HR Workforce Hub (Full CRUD, Employee IDs, Search)
│   ├── Manufacturing.tsx     # Fabrication Node (Full CRUD, SKUs, OEE stats)
│   ├── Toast.tsx             # Animated Toast Notification Provider & Context
│   └── Workflow.tsx          # LangGraph Interactive 4-Step Workflow Wizard
├── test/
│   ├── Terminal.test.ts      # Unit tests for @-mention filter & badge icons
│   └── Toast.test.ts         # Unit tests for Toast queue & style mapping
├── App.tsx                   # Unified Intelligence Terminal & Sidebar
├── index.css                 # TailwindCSS utility layers & dark mode styling
├── main.tsx                  # React root & ToastProvider wrapper
└── vite-env.d.ts             # Vite client type definitions
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **[Bun Runtime](https://bun.sh)** (`>= 1.0`)
- Running Backend API server (`http://localhost:3000`)

### 2. Install & Launch Frontend

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
bun install

# Start Vite development server
bun run dev
```

🎉 **Frontend interface running at** `http://localhost:5173`

---

## 📜 NPM Scripts

| Script | Command | Description |
|---|---|---|
| `bun run dev` | `vite` | Launch Vite hot-reloading development server |
| `bun run build` | `tsc && vite build` | Type-check and compile production bundle |
| `bun run preview` | `vite preview` | Serve production build locally |
| `bun run test` | `bun test` | Run frontend unit & integration test suite |

---

## 🧪 Testing & Quality Assurance

The frontend includes a native test suite powered by Bun:

```bash
# Execute frontend unit test suite
bun test
```

- **`Toast.test.ts`**: Tests toast queue capping (max 5 active alerts) and color theme / icon resolution (`🟢 success`, `🔴 error`, `🟡 warning`, `⚡ info`).
- **`Terminal.test.ts`**: Tests `@`-mention tool filter logic and department icons (`🏗️`, `🏭`, `👥`, `⚡`).

---

## 🏢 Sponsored & Developed By

This open-source project is sponsored, engineered, and maintained by **[Data Daur AI & ERP Consulting](https://www.datadaur.com)**.

> **Data Daur** specializes in empowering global enterprises with tailored Artificial Intelligence, autonomous multi-agent systems, data engineering pipelines, and custom ERP integration services.
>
> 🌐 **Website**: [www.datadaur.com](https://www.datadaur.com)  
> ✉️ **Enterprise Inquiries**: [contact@datadaur.com](mailto:contact@datadaur.com)

---

## 📝 License

Distributed under the **MIT License**. See `LICENSE` for more information.
