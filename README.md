<div align="center">

# ⛏️ MineObserver

**Real-Time Minecraft Agent Observation Platform**

Monitor, track, and visualize your Minecraft AI agents — all in one place.

[![GitHub](https://img.shields.io/badge/GitHub-Wisdoverse%2Fmineobserver-181717?logo=github)](https://github.com/Wisdoverse/mineobserver)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Français](README.fr.md) · [Русский](README.ru.md) · [Español](README.es.md) · [العربية](README.ar.md) · [Deutsch](README.de.md)

</div>

---

## 🖼️ Screenshots

**Landing Page** — Pixel-art Minecraft scene with live agent count and connection endpoint

![Landing Page](public/mineobserver-preview-landing.png)

**Dashboard** — Multi-agent card matrix · Inventory / Map / Log · Server overview · Leaderboard · Chat

![Dashboard](public/mineobserver-preview-dashboard.png)

---

## ✨ Features

| Category | Details |
|----------|---------|
| **Live Status** | Position, health, hunger, game mode, dimension — all in real-time |
| **Inventory Viz** | Equipment slots, hotbar, and main backpack at a glance |
| **Mini Map** | Block & entity distribution around the agent |
| **Vision Gallery** | Screenshots uploaded by agents, stored in object storage |
| **Build Progress** | Track construction blueprints and completion percentage |
| **Chat Window** | Public / team / whisper / system channels |
| **Event Log** | Every agent action — movement, block breaks, item pickups, etc. |
| **Multi-Agent** | Observe multiple agents simultaneously |
| **Stats & Leaderboard** | Aggregated statistics with sortable ranking dimensions |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + shadcn/ui (Radix) + Tailwind CSS 4 |
| Language | TypeScript 5 (strict) |
| Realtime | WebSocket (`ws` library) |
| Database | Supabase (PostgreSQL) |
| Object Storage | S3-compatible storage |
| Build | tsup · pnpm |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9

### Install & Run

```bash
# Install dependencies
pnpm install

# Start development server (http://localhost:5000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

---

## 📁 Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx               # Main observation dashboard
│   ├── layout.tsx             # Root layout
│   └── api/                   # 13 REST API endpoints
├── components/
│   ├── ui/                    # shadcn/ui base components
│   └── agent/                 # Domain components
│       ├── agent-card.tsx             # Agent status card
│       ├── inventory-grid.tsx         # Inventory grid
│       ├── mini-map.tsx               # Mini map
│       ├── vision-gallery.tsx         # Screenshot gallery
│       ├── build-progress.tsx         # Build progress tracker
│       ├── chat-window.tsx            # Chat window
│       ├── team-panel.tsx             # Team panel
│       └── stats-leaderboard.tsx      # Stats & leaderboard
├── hooks/
│   ├── use-agent-observer.ts          # Observer WebSocket hook
│   └── use-demo-agent.tsx             # Demo agent generator
├── lib/
│   ├── types/agent.ts                 # TypeScript type definitions
│   ├── ws-client.ts                   # WebSocket client utility
│   └── utils.ts                       # Shared utilities (cn, etc.)
├── storage/
│   ├── database/agent-db.ts           # Database operations
│   ├── database/supabase-client.ts    # Supabase client
│   └── vision-storage.ts              # Vision image upload & URL
├── ws-handlers/
│   ├── agent.ts                       # WebSocket message handler
│   └── agent-state.ts                 # Agent state manager
└── server.ts                          # Custom HTTP + WS server entry
```

---

## 📡 WebSocket Protocol

**Endpoint:** `ws://<host>:5000/ws/agent`

### Agent → Server

| Message Type | Description |
|-------------|-------------|
| `agent:register` | Register or reconnect an agent |
| `agent:status:update` | Push status update (partial OK) |
| `agent:event` | Report a custom event |
| `agent:world:snapshot` | Push world snapshot |
| `agent:vision` | Upload a screenshot |
| `agent:build:progress` | Update build progress |
| `agent:chat` | Send a chat message |
| `agent:disconnect` | Graceful disconnect |
| `ping` | Heartbeat |

### Server → Client

| Message Type | Description |
|-------------|-------------|
| `agents:list` | Full agent list (on observer register) |
| `status:update` | Broadcast status change |
| `event:new` | New event notification |
| `world:snapshot` | World snapshot broadcast |
| `vision:new` | New screenshot notification |
| `build:progress` | Build progress update |
| `chat:new` | New chat message |
| `admin:data-cleared` | Data purge notification |
| `pong` | Heartbeat reply |

> 📖 Full protocol specification: [public/api-docs.md](public/api-docs.md)

---

## 🔌 REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | List all agents |
| `/api/agents/[id]` | GET | Agent detail + recent events |
| `/api/agents/[id]/events` | GET | Agent events (paginated) |
| `/api/agents/[id]/snapshots` | GET | World snapshots |
| `/api/agents/[id]/vision` | GET | Screenshot list |
| `/api/agents/[id]/trajectory` | GET | Movement trajectory |
| `/api/agents/[id]/builds` | GET | Build records |
| `/api/events` | GET | Global event stream |
| `/api/messages` | GET | Chat messages |
| `/api/stats` | GET | Platform statistics |
| `/api/leaderboard` | GET | Agent leaderboard |
| `/api/admin/clear-data` | POST | Purge data (events / all) |
| `/api/vision-proxy` | GET | Image proxy (bypass signed-URL expiry) |

---

## 🤖 Agent Integration Guide

Connect your Minecraft bot to MineObserver in 4 steps:

```
1.  Connect        →  ws://<host>:5000/ws/agent
2.  Register       →  { type: "agent:register", payload: { agentId, username, ... } }
3.  Push Status    →  { type: "agent:status:update", payload: { agentId, status: {...} } }
4.  (Optional)     →  agent:vision · agent:build:progress · agent:chat · agent:world:snapshot
```

**Tips:**
- Use a **stable `agentId`** to enable reconnect without data loss
- Send status updates every **2–5 seconds**
- Upload vision captures as **base64-encoded PNG**
- On disconnect, send `agent:disconnect` or just close the socket — offline status is preserved

> 📖 Complete field reference & examples: [public/api-docs.md](public/api-docs.md)

---

## 🗄️ Data Retention

| Data Type | Retention Limit (per Agent) |
|-----------|---------------------------|
| Events | 200 |
| World Snapshots | 30 |
| Vision Captures | 50 |
| Chat Messages | 100 |
| Status Updates | 1 000 |
| Build Records | 20 |

Older records are automatically pruned via a sliding-window strategy with throttled cleanup.

---

## 🏗️ Architecture

```
┌──────────────┐      WebSocket       ┌──────────────────┐
│  Minecraft   │ ◄──────────────────► │   MineObserver      │
│  Agent(s)    │   ws://host/ws/agent │   Server         │
└──────────────┘                      │                  │
                                      │  ┌────────────┐  │
┌──────────────┐      WebSocket       │  │  State     │  │
│  Observer    │ ◄──────────────────► │  │  Manager   │  │
│  (Browser)   │   auto-connect       │  └────────────┘  │
└──────────────┘                      │                  │
                                      │  ┌────────────┐  │
                                      │  │  Supabase  │  │
                                      │  │  (Postgres)│  │
                                      │  └────────────┘  │
                                      │                  │
                                      │  ┌────────────┐  │
                                      │  │  S3 Object │  │
                                      │  │  Storage   │  │
                                      │  └────────────┘  │
                                      └──────────────────┘
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
