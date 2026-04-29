# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   ├── components/
│   │   ├── ui/             # Shadcn UI 组件库
│   │   └── agent/          # Agent 观测组件
│   │       ├── agent-card.tsx      # Agent 状态卡片
│   │       ├── inventory-grid.tsx  # 背包网格
│   │       ├── mini-map.tsx        # 小地图
│   │       └── index.ts
│   ├── hooks/
│   │   └── use-agent-observer.ts   # Agent 观测 WebSocket Hook
│   ├── lib/
│   │   ├── utils.ts        # 通用工具函数 (cn)
│   │   ├── types/          # 类型定义
│   │   │   ├── agent.ts   # Agent 状态类型
│   │   │   └── index.ts
│   │   └── ws-client.ts   # WebSocket 客户端工具
│   ├── ws-handlers/        # WebSocket 处理器
│   │   ├── agent.ts       # Agent 端点处理器
│   │   └── agent-state.ts # Agent 状态管理器
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json          # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用 path.resolve(__dirname, ...)、import.meta.dirname 或 process.cwd() 动态拼接。

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**

---

# Minecraft Agent 观测台

本项目是一个用于实时观测 Minecraft Agent 行为的网页应用。

## 核心功能

- **实时状态监控**: 监控 Agent 的位置、生命值、饥饿值、游戏模式等
- **背包可视化**: 展示 Agent 的装备栏、热键栏和主背包
- **小地图**: 显示 Agent 周围的方块和实体分布
- **事件日志**: 记录 Agent 的所有操作事件（移动、破坏方块、拾取物品等）
- **多 Agent 支持**: 可同时监控多个 Agent 的状态

## WebSocket 端点

- `/ws/agent`: Agent 状态上报和观测者连接端点

## 消息协议

所有 WebSocket 消息使用 JSON 格式：

```typescript
interface WsMessage<T = unknown> {
  type: string;
  payload: T;
}
```

### Agent -> 服务端 消息

| type | payload | 说明 |
|------|---------|------|
| `agent:register` | `{ agentId, username, serverHost, serverPort }` | Agent 注册 |
| `agent:status:update` | `{ agentId, status }` | 状态更新 |
| `agent:event` | `{ agentId, event }` | 上报事件 |
| `agent:world:snapshot` | `{ agentId, snapshot }` | 世界快照 |
| `observer:register` | `{}` | 观测者注册 |

### 服务端 -> Observer 消息

| type | payload | 说明 |
|------|---------|------|
| `agents:list` | `{ agents }` | 所有 Agent 列表 |
| `agent:registered` | `{ agentId, status }` | Agent 注册通知 |
| `agent:unregistered` | `{ agentId }` | Agent 断开通知 |
| `status:update` | `{ agentId, status }` | 状态更新广播 |
| `event:new` | `{ agentId, event }` | 新事件通知 |
| `world:snapshot` | `{ agentId, snapshot }` | 世界快照 |

## 观测者使用流程

1. 打开观测台页面
2. 页面自动通过 WebSocket 连接 `/ws/agent` 端点
3. 发送 `observer:register` 消息注册为观测者
4. 接收实时推送的 Agent 状态更新

## Agent 客户端集成

Minecraft Agent 需要通过 WebSocket 连接到此观测台并上报状态。Agent 端需要：

1. 连接到 `ws://<observer-host>/ws/agent`
2. 发送 `agent:register` 消息注册
3. 定期发送 `agent:status:update` 更新状态
4. 可选发送 `agent:event` 上报重要事件
5. 可选发送 `agent:world:snapshot` 更新周围环境
