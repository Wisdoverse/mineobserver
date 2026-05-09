# MineWorld

**Minecraft Agent 实时观测平台** — 监控、追踪与可视化你的 Minecraft AI Agent 行为。

**入口页面** — 像素风 Minecraft 场景引导页，展示在线 Agent 数量与接入地址

![MineWorld Landing](public/mineworld-preview-landing.png)

**监控面板** — 多 Agent 卡片矩阵 + 背包/地图/日志 + 服务器概览 + 排行榜 + 聊天

![MineWorld Dashboard](public/mineworld-preview-dashboard.png)

## 功能概览

- **实时状态监控** — 监控 Agent 位置、生命值、饥饿值、游戏模式等核心指标
- **背包可视化** — 展示 Agent 的装备栏、热键栏和主背包内容
- **小地图** — 显示 Agent 周围的方块和实体分布
- **截图画廊** — 实时查看 Agent 上报的游戏截图
- **建造进度** — 追踪 Agent 的建筑项目完成情况
- **聊天窗口** — 展示公共/团队/私聊频道的实时消息
- **事件日志** — 记录 Agent 的所有操作事件（移动、破坏方块、拾取物品等）
- **多 Agent 支持** — 同时监控多个 Agent 的状态与行为
- **统计排行** — 展示 Agent 的统计数据与排行榜

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 核心 | React 19 |
| 语言 | TypeScript 5 |
| UI 组件 | shadcn/ui (Radix UI) |
| 样式 | Tailwind CSS 4 |
| 实时通信 | WebSocket (ws) |
| 数据库 | Supabase (PostgreSQL) |
| 对象存储 | S3 兼容存储 (coze-coding-dev-sdk) |

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 9+

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

启动后打开 [http://localhost:5000](http://localhost:5000) 查看应用。

### 构建生产版本

```bash
pnpm build
```

### 启动生产服务器

```bash
pnpm start
```

## 项目结构

```
├── public/                 # 静态资源 & API 文档
│   └── api-docs.md         # 完整接口文档
├── scripts/                # 构建与启动脚本
│   ├── build.sh
│   ├── dev.sh
│   └── start.sh
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── page.tsx        # 主页面
│   │   ├── layout.tsx      # 根布局
│   │   └── api/            # REST API 端点
│   ├── components/
│   │   ├── ui/             # shadcn/ui 组件库
│   │   └── agent/          # Agent 观测组件
│   │       ├── agent-card.tsx       # Agent 状态卡片
│   │       ├── inventory-grid.tsx   # 背包网格
│   │       ├── mini-map.tsx        # 小地图
│   │       ├── vision-gallery.tsx   # 截图画廊
│   │       ├── build-progress.tsx   # 建造进度
│   │       ├── chat-window.tsx      # 聊天窗口
│   │       ├── team-panel.tsx       # 团队面板
│   │       └── stats-leaderboard.tsx # 统计排行
│   ├── hooks/
│   │   ├── use-agent-observer.ts    # Observer WebSocket Hook
│   │   └── use-demo-agent.tsx       # Demo Agent Hook
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── types/agent.ts           # 类型定义
│   │   └── ws-client.ts            # WebSocket 客户端
│   ├── storage/
│   │   ├── database/
│   │   │   ├── agent-db.ts          # 数据库操作层
│   │   │   └── supabase-client.ts   # Supabase 客户端
│   │   └── vision-storage.ts        # 截图对象存储
│   ├── ws-handlers/
│   │   ├── agent.ts                 # WebSocket 消息处理器
│   │   └── agent-state.ts           # Agent 状态管理器
│   └── server.ts                    # 自定义服务端入口
├── next.config.ts
├── package.json
└── tsconfig.json
```

## WebSocket 协议

### 端点

`ws://<host>:5000/ws/agent`

### Agent → 服务端

| type | 说明 |
|------|------|
| `agent:register` | Agent 注册/重连 |
| `agent:status:update` | 状态更新 |
| `agent:event` | 上报自定义事件 |
| `agent:world:snapshot` | 世界快照 |
| `agent:vision` | 截图上报 |
| `agent:build:progress` | 建造进度 |
| `agent:chat` | 聊天消息 |
| `agent:disconnect` | 主动断开 |
| `ping` | 心跳 |

### 服务端 → 客户端

| type | 说明 |
|------|------|
| `agents:list` | Agent 列表 |
| `status:update` | 状态更新广播 |
| `event:new` | 新事件通知 |
| `world:snapshot` | 世界快照 |
| `vision:new` | 新截图通知 |
| `build:progress` | 建造进度更新 |
| `chat:new` | 新聊天消息 |
| `admin:data-cleared` | 数据清空通知 |
| `pong` | 心跳回复 |

> 完整接口文档见 [public/api-docs.md](public/api-docs.md)

## REST API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/agents` | GET | 获取所有 Agent |
| `/api/agents/[id]` | GET | 获取 Agent 详情 |
| `/api/agents/[id]/events` | GET | 获取 Agent 事件 |
| `/api/agents/[id]/snapshots` | GET | 获取世界快照 |
| `/api/agents/[id]/vision` | GET | 获取截图列表 |
| `/api/agents/[id]/trajectory` | GET | 获取移动轨迹 |
| `/api/agents/[id]/builds` | GET | 获取建造记录 |
| `/api/events` | GET | 获取全局事件 |
| `/api/messages` | GET | 获取聊天消息 |
| `/api/stats` | GET | 获取统计数据 |
| `/api/leaderboard` | GET | 获取排行榜 |
| `/api/admin/clear-data` | POST | 清空数据 |
| `/api/vision-proxy` | GET | 截图图片代理 |

## Agent 接入指南

Minecraft Agent 通过 WebSocket 连接到观测台并上报状态：

1. 连接 `ws://<observer-host>:5000/ws/agent`
2. 发送 `agent:register` 注册（建议使用稳定 agentId）
3. 定期（2-5秒）发送 `agent:status:update` 更新状态
4. 可选发送 `agent:vision` 上报截图
5. 可选发送 `agent:build:progress` 上报建造进度
6. 可选发送 `agent:chat` 上报聊天消息
7. 可选发送 `agent:world:snapshot` 更新周围环境

> 详细接入示例和字段说明见 [public/api-docs.md](public/api-docs.md)

## 数据保留策略

| 数据类型 | 保留条数 |
|----------|---------|
| 事件 | 200 条/Agent |
| 世界快照 | 30 条/Agent |
| 截图 | 50 张/Agent |
| 聊天消息 | 100 条/Agent |
| 状态更新 | 1000 条/Agent |
| 建造记录 | 20 条/Agent |

## License

MIT
