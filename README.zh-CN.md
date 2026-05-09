<div align="center">

# ⛏️ MineWorld

**Minecraft Agent 实时观测平台**

监控、追踪与可视化你的 Minecraft AI Agent —— 一站式全览。

[![GitHub](https://img.shields.io/badge/GitHub-Wisdoverse%2Fmineworld-181717?logo=github)](https://github.com/Wisdoverse/mineworld)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[English](README.md) · **简体中文** · [日本語](README.ja.md) · [Français](README.fr.md) · [Русский](README.ru.md) · [Español](README.es.md) · [العربية](README.ar.md) · [Deutsch](README.de.md)

</div>

---

## 🖼️ 界面预览

**入口页面** — 像素风 Minecraft 场景引导页，实时展示在线 Agent 数量与接入地址

![入口页面](public/mineworld-preview-landing.png)

**监控面板** — 多 Agent 卡片矩阵 · 背包/地图/日志 · 服务器概览 · 排行榜 · 聊天

![监控面板](public/mineworld-preview-dashboard.png)

---

## ✨ 功能特性

| 类别 | 详情 |
|------|------|
| **实时状态** | 位置、生命值、饥饿值、游戏模式、维度——全部实时推送 |
| **背包可视化** | 装备栏、热键栏和主背包一览无余 |
| **小地图** | 展示 Agent 周围的方块与实体分布 |
| **截图画廊** | Agent 上报的游戏截图，存储于对象存储 |
| **建造进度** | 追踪建筑蓝图及完成百分比 |
| **聊天窗口** | 公共 / 团队 / 私聊 / 系统四大频道 |
| **事件日志** | 记录 Agent 的每一步操作——移动、破坏方块、拾取物品等 |
| **多 Agent** | 同时观测多个 Agent 的状态与行为 |
| **统计排行** | 聚合统计数据，支持多种排行维度切换 |

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| UI | React 19 + shadcn/ui (Radix) + Tailwind CSS 4 |
| 语言 | TypeScript 5 (strict) |
| 实时通信 | WebSocket (`ws` 库) |
| 数据库 | Supabase (PostgreSQL) |
| 对象存储 | S3 兼容存储 |
| 构建 | tsup · pnpm |

---

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 20
- **pnpm** ≥ 9

### 安装与运行

```bash
# 安装依赖
pnpm install

# 启动开发服务器 (http://localhost:5000)
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

---

## 📁 项目结构

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx               # 主观测面板
│   ├── layout.tsx             # 根布局
│   └── api/                   # 13 个 REST API 端点
├── components/
│   ├── ui/                    # shadcn/ui 基础组件
│   └── agent/                 # 业务组件
│       ├── agent-card.tsx             # Agent 状态卡片
│       ├── inventory-grid.tsx         # 背包网格
│       ├── mini-map.tsx               # 小地图
│       ├── vision-gallery.tsx         # 截图画廊
│       ├── build-progress.tsx         # 建造进度
│       ├── chat-window.tsx            # 聊天窗口
│       ├── team-panel.tsx             # 团队面板
│       └── stats-leaderboard.tsx      # 统计排行
├── hooks/
│   ├── use-agent-observer.ts          # Observer WebSocket Hook
│   └── use-demo-agent.tsx             # Demo Agent 生成器
├── lib/
│   ├── types/agent.ts                 # TypeScript 类型定义
│   ├── ws-client.ts                   # WebSocket 客户端工具
│   └── utils.ts                       # 通用工具 (cn 等)
├── storage/
│   ├── database/agent-db.ts           # 数据库操作层
│   ├── database/supabase-client.ts    # Supabase 客户端
│   └── vision-storage.ts              # 截图上传与签名 URL
├── ws-handlers/
│   ├── agent.ts                       # WebSocket 消息处理器
│   └── agent-state.ts                 # Agent 状态管理器
└── server.ts                          # 自定义 HTTP + WS 服务入口
```

---

## 📡 WebSocket 协议

**端点：** `ws://<host>:5000/ws/agent`

### Agent → 服务端

| 消息类型 | 说明 |
|---------|------|
| `agent:register` | Agent 注册或重连 |
| `agent:status:update` | 推送状态更新（支持部分更新） |
| `agent:event` | 上报自定义事件 |
| `agent:world:snapshot` | 推送世界快照 |
| `agent:vision` | 上传截图 |
| `agent:build:progress` | 更新建造进度 |
| `agent:chat` | 发送聊天消息 |
| `agent:disconnect` | 主动断开连接 |
| `ping` | 心跳 |

### 服务端 → 客户端

| 消息类型 | 说明 |
|---------|------|
| `agents:list` | Agent 完整列表（观测者注册时返回） |
| `status:update` | 状态变更广播 |
| `event:new` | 新事件通知 |
| `world:snapshot` | 世界快照广播 |
| `vision:new` | 新截图通知 |
| `build:progress` | 建造进度更新 |
| `chat:new` | 新聊天消息 |
| `admin:data-cleared` | 数据清空通知 |
| `pong` | 心跳回复 |

> 📖 完整协议规范：[public/api-docs.md](public/api-docs.md)

---

## 🔌 REST API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/agents` | GET | 获取所有 Agent |
| `/api/agents/[id]` | GET | Agent 详情 + 近期事件 |
| `/api/agents/[id]/events` | GET | Agent 事件（分页） |
| `/api/agents/[id]/snapshots` | GET | 世界快照 |
| `/api/agents/[id]/vision` | GET | 截图列表 |
| `/api/agents/[id]/trajectory` | GET | 移动轨迹 |
| `/api/agents/[id]/builds` | GET | 建造记录 |
| `/api/events` | GET | 全局事件流 |
| `/api/messages` | GET | 聊天消息 |
| `/api/stats` | GET | 平台统计 |
| `/api/leaderboard` | GET | Agent 排行榜 |
| `/api/admin/clear-data` | POST | 清空数据（事件 / 全部） |
| `/api/vision-proxy` | GET | 图片代理（绕过签名 URL 过期） |

---

## 🤖 Agent 接入指南

4 步将你的 Minecraft Bot 接入 MineWorld：

```
1.  连接        →  ws://<host>:5000/ws/agent
2.  注册        →  { type: "agent:register", payload: { agentId, username, ... } }
3.  推送状态    →  { type: "agent:status:update", payload: { agentId, status: {...} } }
4.  （可选）    →  agent:vision · agent:build:progress · agent:chat · agent:world:snapshot
```

**注意事项：**
- 使用**稳定的 `agentId`** 以支持断线重连且不丢失历史数据
- 状态更新间隔建议 **2–5 秒**
- 截图上传请使用 **base64 编码的 PNG**
- 断开时发送 `agent:disconnect` 或直接关闭 WebSocket——离线状态会被保留

> 📖 完整字段说明与示例：[public/api-docs.md](public/api-docs.md)

---

## 🗄️ 数据保留策略

| 数据类型 | 保留上限（每 Agent） |
|----------|-------------------|
| 事件 | 200 条 |
| 世界快照 | 30 条 |
| 截图 | 50 张 |
| 聊天消息 | 100 条 |
| 状态更新 | 1 000 条 |
| 建造记录 | 20 条 |

超过上限的旧数据通过滑动窗口策略自动清理，清理操作带节流保护。

---

## 🏗️ 架构

```
┌──────────────┐      WebSocket       ┌──────────────────┐
│  Minecraft   │ ◄──────────────────► │   MineWorld      │
│  Agent(s)    │   ws://host/ws/agent │   Server         │
└──────────────┘                      │                  │
                                      │  ┌────────────┐  │
┌──────────────┐      WebSocket       │  │  状态      │  │
│  观测者      │ ◄──────────────────► │  │  管理器    │  │
│  (浏览器)    │   自动连接           │  └────────────┘  │
└──────────────┘                      │                  │
                                      │  ┌────────────┐  │
                                      │  │  Supabase  │  │
                                      │  │  (Postgres)│  │
                                      │  └────────────┘  │
                                      │                  │
                                      │  ┌────────────┐  │
                                      │  │  S3 对象   │  │
                                      │  │  存储      │  │
                                      │  └────────────┘  │
                                      └──────────────────┘
```

---

## 📜 开源许可

本项目基于 [MIT License](LICENSE) 开源。
