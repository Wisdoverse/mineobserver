# MineWorld Agent 接口能力文档

> MineWorld 是一个 Minecraft Agent 实时观测平台。Agent 通过 WebSocket 连接上报自身状态，Observer 通过 WebSocket 订阅实时推送。平台定位为**被动观测者**——只接收上报，不管理 Agent 生命周期。

**版本**: v1.0 | **日期**: 2026-04-29 | **状态**: 开发中

---

## 目录

1. [快速开始](#快速开始)
2. [WebSocket 协议 — Agent → 服务端](#websocket-协议--agent--服务端)
3. [WebSocket 协议 — Observer → 服务端](#websocket-协议--observer--服务端)
4. [WebSocket 协议 — 服务端 → 客户端广播](#websocket-协议--服务端--客户端广播)
5. [HTTP REST API](#http-rest-api)
6. [数据结构参考](#数据结构参考)
7. [Agent 断开与重连](#agent-断开与重连)
8. [数据库与持久化](#数据库与持久化)
9. [数据保留策略](#数据保留策略)
10. [错误码](#错误码)
11. [消息流程图](#消息流程图)
12. [FAQ](#faq)

---

## 快速开始

### 连接地址

```
ws://<host>:5000/ws/agent
```

生产环境：

```
wss://<domain>/ws/agent
```

### 最小接入示例 (Node.js)

```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:5000/ws/agent');

ws.on('open', () => {
  // 第一步：注册 Agent
  ws.send(JSON.stringify({
    type: 'agent:register',
    payload: {
      agentId: 'my-agent-001',
      username: 'MinerBot',
      serverHost: 'mc.example.com',
      serverPort: 25565
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log('收到:', msg.type);
});
```

### 最小接入示例 (Python)

```python
import asyncio
import json
import websockets

async def connect():
    async with websockets.connect("ws://localhost:5000/ws/agent") as ws:
        # 注册 Agent
        await ws.send(json.dumps({
            "type": "agent:register",
            "payload": {
                "agentId": "my-agent-001",
                "username": "MinerBot",
                "serverHost": "mc.example.com",
                "serverPort": 25565
            }
        }))

        async for message in ws:
            msg = json.loads(message)
            print(f"收到: {msg['type']}")

asyncio.run(connect())
```

### Observer 接入示例

```javascript
const ws = new WebSocket('ws://localhost:5000/ws/agent');

ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'observer:register', payload: {} }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  // 接收: agents:list, agent:registered, status:update, event:new, ...
});
```

---

## WebSocket 协议 — Agent → 服务端

所有 WebSocket 消息使用 JSON 格式：

```typescript
interface WsMessage<T = unknown> {
  type: string;
  payload: T;
}
```

### 1. agent:register — 注册 Agent [已实现]

Agent 连接后**必须**首先发送此消息注册。使用已有 `agentId` 重新注册将触发重连逻辑。

```json
{
  "type": "agent:register",
  "payload": {
    "agentId": "my-agent-001",
    "username": "MinerBot",
    "serverHost": "mc.example.com",
    "serverPort": 25565
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentId | string | 是 | Agent 唯一标识（建议使用稳定 ID，避免随机值） |
| username | string | 是 | 游戏内用户名 |
| serverHost | string | 是 | MC 服务器地址 |
| serverPort | number | 是 | MC 服务器端口 |

服务端回复 `agent:register:ack`。

---

### 2. agent:status:update — 状态更新 [已实现]

定期（建议 2-5 秒）上报 Agent 当前状态。支持**部分更新**，只需发送变化字段。

```json
{
  "type": "agent:status:update",
  "payload": {
    "agentId": "my-agent-001",
    "status": {
      "connected": true,
      "position": { "x": 100, "y": 64, "z": -200 },
      "health": 18,
      "maxHealth": 20,
      "food": 15,
      "saturation": 8.0,
      "gamemode": "survival",
      "dimension": "overworld",
      "yaw": 180,
      "pitch": 0,
      "isOnGround": true,
      "isSprinting": false,
      "isSneaking": false
    }
  }
}
```

状态变更（位置变化超过阈值、生命值变化等）会自动生成事件并广播给 Observer。

---

### 3. agent:event — 自定义事件上报 [已实现]

上报 Agent 的操作事件。

```json
{
  "type": "agent:event",
  "payload": {
    "agentId": "my-agent-001",
    "event": {
      "type": "item_crafted",
      "description": "合成了 1 个钻石镐",
      "data": { "item": "diamond_pickaxe", "count": 1 }
    }
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| event.type | string | 是 | 事件类型（见下表） |
| event.description | string | 是 | 事件描述 |
| event.data | object | 否 | 事件附加数据 |

**预定义事件类型**：

| 事件类型 | 说明 | 来源 Skill 脚本 |
|---------|------|---------------|
| `moved` | 移动（自动检测） | auto.js |
| `jumped` | 跳跃（自动检测） | auto.js |
| `connected` | Agent 已连接 | auto.js |
| `disconnected` | Agent 已断开 | auto.js |
| `block_broken` | 破坏方块 | interact.js |
| `block_placed` | 放置方块 | interact.js |
| `item_used` | 使用物品 | interact.js |
| `item_crafted` | 合成物品 | craft.js |
| `craft_failed` | 合成失败 | craft.js |
| `item_smelted` | 熔炼物品 | smelt.js |
| `smelt_completed` | 熔炼完成 | smelt.js |
| `inventory_changed` | 背包变化 | inventory.js |
| `item_picked_up` | 拾取物品 | inventory.js |
| `item_dropped` | 丢弃物品 | inventory.js |
| `chest_opened` | 打开箱子 | chest.js |
| `item_deposited` | 存入物品 | chest.js |
| `item_withdrawn` | 取出物品 | chest.js |
| `land_tilled` | 耕地 | farm.js |
| `crop_planted` | 种植作物 | farm.js |
| `crop_harvested` | 收割作物 | farm.js |
| `attacked` | 攻击实体 | monitor.js |
| `damaged` | 受到伤害 | monitor.js |
| `died` | 死亡 | monitor.js |
| `respawned` | 重生 | monitor.js |
| `achievement_earned` | 获得成就 | monitor.js |

也支持自定义事件类型，直接传入即可。

---

### 4. agent:world:snapshot — 世界快照 [已实现]

上报 Agent 周围的方块和实体信息。

```json
{
  "type": "agent:world:snapshot",
  "payload": {
    "agentId": "my-agent-001",
    "snapshot": {
      "blocks": [
        { "position": { "x": 100, "y": 63, "z": 200 }, "type": "grass_block", "name": "草方块" }
      ],
      "entities": [
        { "id": 1, "type": "pig", "name": "Pig", "position": { "x": 105, "y": 64, "z": 203 }, "distance": 7 }
      ]
    }
  }
}
```

---

### 5. agent:vision — 截图上报 [规划中]

Agent 上报视觉截图到观测平台。

```json
{
  "type": "agent:vision",
  "payload": {
    "agentId": "my-agent-001",
    "vision": {
      "captureId": "cap_abcdef",
      "imageData": "data:image/jpeg;base64,/9j/4AAQ...",
      "thumbnailData": "data:image/jpeg;base64,/9j/4AAQ...",
      "dimensions": { "width": 800, "height": 512 },
      "position": { "x": 100, "y": 64, "z": 200 },
      "facing": { "yaw": 45.5, "pitch": -10.2 },
      "description": "发现钻石矿",
      "scene": {
        "biome": "plains",
        "timeOfDay": "day",
        "weather": "clear",
        "dimension": "overworld"
      },
      "timestamp": 1714406400000
    }
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| vision.captureId | string | 是 | 截图唯一标识 |
| vision.imageData | string | 是 | Base64 编码图片（带 MIME 类型） |
| vision.thumbnailData | string | 否 | Base64 编码缩略图 |
| vision.dimensions | object | 是 | 图片尺寸 `{ width, height }` |
| vision.position | object | 是 | 截图位置 `{ x, y, z }` |
| vision.facing | object | 否 | 朝向 `{ yaw, pitch }` |
| vision.description | string | 否 | 截图描述 |
| vision.scene | object | 否 | 场景信息（biome, timeOfDay, weather, dimension） |
| vision.timestamp | number | 是 | 时间戳（毫秒） |

服务端回复 `vision:received`，广播 `vision:new` 给 Observer。

实现要求：
- Base64 图片解码后存储到对象存储（S3/OSS）
- 存储路径：`/vision/{agentId}/{captureId}.jpg`
- 缩略图生成（200x128）
- 数据库记录元数据到 `agent_vision` 表

---

### 6. agent:build:progress — 建造进度 [规划中]

Agent 上报建造任务进度。

```json
{
  "type": "agent:build:progress",
  "payload": {
    "agentId": "my-agent-001",
    "build": {
      "buildId": "build_12345",
      "blueprintName": "simple_house",
      "status": "in_progress",
      "progress": 0.65,
      "currentLayer": 2,
      "totalLayers": 4,
      "blocksPlaced": 64,
      "blocksTotal": 98,
      "materialsUsed": [
        { "material": "cobblestone", "used": 50, "remaining": 450 },
        { "material": "oak_planks", "used": 10, "remaining": 54 }
      ],
      "startedAt": 1714405620000,
      "estimatedCompletion": 1714406100000,
      "errors": []
    }
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| build.buildId | string | 是 | 建造任务 ID |
| build.blueprintName | string | 是 | 蓝图名称 |
| build.status | enum | 是 | `started` / `in_progress` / `completed` / `failed` / `cancelled` |
| build.progress | number | 是 | 进度 (0.0 - 1.0) |
| build.currentLayer | number | 否 | 当前层 |
| build.totalLayers | number | 否 | 总层数 |
| build.blocksPlaced | number | 是 | 已放置方块数 |
| build.blocksTotal | number | 是 | 总方块数 |
| build.materialsUsed | array | 否 | 材料使用情况 |
| build.startedAt | number | 是 | 开始时间戳 |
| build.estimatedCompletion | number | 否 | 预计完成时间戳 |
| build.errors | array | 否 | 错误列表 |

服务端广播 `build:progress` 给 Observer。存储到 `agent_builds` 表。

---

### 7. agent:subscribe — 事件订阅 [规划中]

Agent 告诉平台它想接收哪些游戏事件的推送通知。

```json
{
  "type": "agent:subscribe",
  "payload": {
    "agentId": "my-agent-001",
    "subscription": {
      "subscriptionId": "sub_12345",
      "events": ["entity_spawn", "player_death", "chat_received"],
      "filter": {
        "entityTypes": ["zombie", "skeleton", "creeper"],
        "chatContains": null
      },
      "callbackUrl": null
    }
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| subscription.subscriptionId | string | 是 | 订阅 ID |
| subscription.events | array | 是 | 订阅的事件类型列表 |
| subscription.filter | object | 否 | 事件过滤器 |
| subscription.callbackUrl | string | 否 | 回调 URL |

**支持的 events**：
- `entity_spawn` — 实体生成
- `entity_death` — 实体死亡
- `player_death` — 玩家死亡
- `chat_received` — 收到聊天
- `inventory_changed` — 背包变化
- `health_change` — 生命变化
- `dimension_change` — 维度切换
- `weather_change` — 天气变化

取消订阅：
```json
{
  "type": "agent:subscribe",
  "payload": {
    "agentId": "my-agent-001",
    "subscription": {
      "subscriptionId": "sub_12345",
      "action": "unsubscribe"
    }
  }
}
```

服务端回复 `event:subscribed`。存储到 `agent_subscriptions` 表。

---

### 8. agent:team:update — 团队状态 [规划中]

Agent 上报团队/多 Bot 协作状态。

```json
{
  "type": "agent:team:update",
  "payload": {
    "agentId": "my-agent-001",
    "team": {
      "teamId": "team_001",
      "teamName": "MiningTeam",
      "action": "status_update",
      "leader": "my-agent-001",
      "members": [
        {
          "agentId": "my-agent-001",
          "username": "MinerBot",
          "role": "leader",
          "position": { "x": 100, "y": 64, "z": 200 },
          "status": "mining",
          "task": { "type": "mining_diamonds", "progress": 0.45 }
        },
        {
          "agentId": "my-agent-002",
          "username": "GuardBot",
          "role": "member",
          "position": { "x": 95, "y": 64, "z": 195 },
          "status": "defending",
          "task": { "type": "defend_area", "progress": 0.8 }
        }
      ],
      "task": {
        "type": "coordinated_mining",
        "status": "in_progress",
        "progress": 0.45,
        "startedAt": 1714405620000,
        "estimatedCompletion": 1714408800000
      },
      "timestamp": 1714406400000
    }
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| team.teamId | string | 是 | 队伍 ID |
| team.teamName | string | 是 | 队伍名称 |
| team.action | enum | 是 | `created` / `joined` / `left` / `status_update` / `disbanded` |
| team.leader | string | 是 | 队长 Agent ID |
| team.members | array | 是 | 成员列表（含 agentId, username, role, position, status, task） |
| team.task | object | 否 | 团队整体任务 |
| team.timestamp | number | 是 | 时间戳 |

服务端广播 `team:update` 给 Observer。存储到 `agent_teams` 表。

---

### 9. agent:chat — 聊天消息 [规划中]

Agent 上报聊天消息。

```json
{
  "type": "agent:chat",
  "payload": {
    "agentId": "my-agent-001",
    "message": {
      "messageId": "msg_12345",
      "channel": "public",
      "content": "发现钻石矿！位置 102, 55, 198",
      "recipient": null,
      "sender": {
        "agentId": "my-agent-001",
        "username": "MinerBot",
        "type": "agent"
      },
      "mentionedAgents": [],
      "timestamp": 1714406400000
    }
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message.messageId | string | 是 | 消息 ID |
| message.content | string | 是 | 消息内容 |
| message.channel | enum | 是 | `public` / `whisper` / `team` / `system` |
| message.recipient | string | 否 | 私聊接收者（channel=whisper 时） |
| message.sender | object | 是 | 发送者信息（agentId, username, type） |
| message.sender.type | enum | 是 | `agent` / `player` |
| message.mentionedAgents | array | 否 | @提及的 Agent ID |
| message.timestamp | number | 是 | 时间戳 |

服务端广播 `chat:new` 给 Observer。存储到 `agent_messages` 表（每 Agent 保留最近 100 条）。

---

### 10. agent:trade — 村民交易 [规划中]

Agent 上报村民交易事件。

```json
{
  "type": "agent:trade",
  "payload": {
    "agentId": "my-agent-001",
    "trade": {
      "tradeId": "trade_12345",
      "villagerId": 1234,
      "villagerProfession": "Librarian",
      "action": "trade_completed",
      "tradeIndex": 0,
      "count": 1,
      "input": ["emerald x5"],
      "output": "bookshelf x1",
      "position": { "x": 100, "y": 64, "z": 200 },
      "timestamp": 1714406400000
    }
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| trade.tradeId | string | 是 | 交易唯一标识 |
| trade.villagerId | number | 是 | 村民实体 ID |
| trade.villagerProfession | string | 否 | 村民职业 |
| trade.action | enum | 是 | `trade_opened` / `trade_completed` / `trade_failed` |
| trade.tradeIndex | number | 是 | 交易槽位索引 |
| trade.count | number | 否 | 交易次数 |
| trade.input | array | 否 | 交易输入物品 |
| trade.output | string | 否 | 交易输出物品 |
| trade.position | object | 否 | 交易位置 |
| trade.timestamp | number | 是 | 时间戳 |

服务端广播 `trade:event` 给 Observer。复用 `agent_events` 表存储。

---

### 11. ping — 心跳 [已实现]

```json
{ "type": "ping", "payload": null }
```

服务端回复 `pong`。

---

## WebSocket 协议 — Observer → 服务端

### observer:register — 注册观测者 [已实现]

```json
{ "type": "observer:register", "payload": {} }
```

注册成功后服务端返回 `agents:list`（包含所有 Agent 当前状态）。

---

## WebSocket 协议 — 服务端 → 客户端广播

### 1. agents:list — Agent 列表 [已实现]

Observer 注册后返回，包含所有 Agent 的当前状态。

```json
{
  "type": "agents:list",
  "payload": {
    "agents": [
      {
        "agentId": "my-agent-001",
        "username": "MinerBot",
        "connected": true,
        "position": { "x": 100, "y": 64, "z": -200 },
        "health": 20,
        "maxHealth": 20,
        "food": 18,
        "dimension": "overworld"
      }
    ]
  }
}
```

---

### 2. agent:register:ack — 注册确认 [已实现]

Agent 注册成功后服务端回复。

```json
{
  "type": "agent:register:ack",
  "payload": { "agentId": "my-agent-001", "success": true }
}
```

---

### 3. agent:registered — 新注册通知 [已实现]

新 Agent 注册时广播给所有 Observer。

```json
{
  "type": "agent:registered",
  "payload": { "agentId": "my-agent-001", "status": { ... } }
}
```

---

### 4. status:update — 状态更新广播 [已实现]

Agent 状态更新时广播给所有 Observer（含断开/重连）。

```json
{
  "type": "status:update",
  "payload": {
    "agentId": "my-agent-001",
    "status": { "connected": false }
  }
}
```

---

### 5. event:new — 事件广播 [已实现]

Agent 上报事件时广播给所有 Observer。

```json
{
  "type": "event:new",
  "payload": {
    "agentId": "my-agent-001",
    "event": {
      "type": "block_broken",
      "description": "破坏了钻石矿石",
      "data": { "blockType": "diamond_ore" }
    }
  }
}
```

---

### 6. world:snapshot — 快照广播 [已实现]

```json
{
  "type": "world:snapshot",
  "payload": {
    "agentId": "my-agent-001",
    "snapshot": { "blocks": [...], "entities": [...] }
  }
}
```

---

### 7. vision:received — 截图确认 [规划中]

Agent 截图上传成功后服务端回复。

```json
{
  "type": "vision:received",
  "payload": {
    "agentId": "my-agent-001",
    "captureId": "cap_abcdef",
    "success": true,
    "storageUrl": "https://mc-observer.coze.site/api/vision/cap_abcdef"
  }
}
```

---

### 8. vision:new — 截图广播 [规划中]

Agent 上报截图时广播给所有 Observer（含缩略图）。

```json
{
  "type": "vision:new",
  "payload": {
    "agentId": "my-agent-001",
    "username": "MinerBot",
    "vision": {
      "captureId": "cap_abcdef",
      "thumbnailData": "data:image/jpeg;base64,...",
      "position": { "x": 100, "y": 64, "z": 200 },
      "description": "发现钻石矿",
      "dimensions": { "width": 800, "height": 512 },
      "scene": { "timeOfDay": "day", "biome": "plains", "weather": "clear" },
      "timestamp": 1714406400000
    }
  }
}
```

---

### 9. build:progress — 建造进度广播 [规划中]

```json
{
  "type": "build:progress",
  "payload": {
    "agentId": "my-agent-001",
    "username": "MinerBot",
    "build": {
      "buildId": "build_12345",
      "blueprintName": "simple_house",
      "status": "in_progress",
      "progress": 0.65,
      "blocksPlaced": 64,
      "blocksTotal": 98,
      "timestamp": 1714406400000
    }
  }
}
```

---

### 10. event:subscribed — 订阅确认/事件推送 [规划中]

```json
{
  "type": "event:subscribed",
  "payload": {
    "agentId": "my-agent-001",
    "subscriptionId": "sub_12345",
    "event": {
      "type": "entity_spawn",
      "entityType": "zombie",
      "position": { "x": 105, "y": 64, "z": 198 },
      "distance": 8.5,
      "timestamp": 1714406400000
    }
  }
}
```

---

### 11. team:update — 团队状态广播 [规划中]

```json
{
  "type": "team:update",
  "payload": {
    "teamId": "team_001",
    "teamName": "MiningTeam",
    "action": "status_update",
    "leader": { "agentId": "my-agent-001", "username": "MinerBot" },
    "members": [
      { "agentId": "my-agent-001", "username": "MinerBot", "status": "mining" },
      { "agentId": "my-agent-002", "username": "GuardBot", "status": "defending" }
    ],
    "task": { "type": "coordinated_mining", "progress": 0.45 },
    "timestamp": 1714406400000
  }
}
```

---

### 12. chat:new — 聊天广播 [规划中]

```json
{
  "type": "chat:new",
  "payload": {
    "messageId": "msg_12345",
    "agentId": "my-agent-001",
    "username": "MinerBot",
    "message": {
      "content": "发现钻石矿！位置 102, 55, 198",
      "channel": "public",
      "sender": { "type": "agent", "username": "MinerBot" },
      "mentionedAgents": [],
      "timestamp": 1714406400000
    }
  }
}
```

---

### 13. trade:event — 交易事件广播 [规划中]

```json
{
  "type": "trade:event",
  "payload": {
    "agentId": "my-agent-001",
    "username": "MinerBot",
    "trade": {
      "tradeId": "trade_12345",
      "action": "trade_completed",
      "villagerProfession": "Librarian",
      "input": ["emerald x5"],
      "output": "bookshelf x1",
      "timestamp": 1714406400000
    }
  }
}
```

---

### 14. admin:data-cleared — 数据清空通知 [已实现]

```json
{
  "type": "admin:data-cleared",
  "payload": { "scope": "all" }
}
```

`scope` 取值：`"events"` 或 `"all"`。

---

### 15. pong — 心跳回复 [已实现]

```json
{ "type": "pong", "payload": null }
```

---

## HTTP REST API

### 通用说明

**认证方式**：Bearer Token（规划中，当前无需认证）

```
Authorization: Bearer <API_KEY>
```

**通用响应格式**：

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "ISO8601",
    "requestId": "req_12345"
  }
}
```

**错误响应格式**：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

---

### 1. POST /api/admin/clear-data [已实现]

清空数据。

**请求**：

```json
{
  "scope": "events"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scope | enum | 是 | `"events"` — 仅清空事件；`"all"` — 清空所有数据 |

**响应**：

```json
{
  "success": true,
  "data": { "scope": "events", "cleared": true }
}
```

---

### 2. GET /api/agents [规划中 - P0]

获取所有 Agent 列表。

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| status | enum | 否 | `online` / `offline` / `all`（默认 all） |
| server | string | 否 | 服务器地址过滤 |
| page | number | 否 | 页码（默认 1） |
| limit | number | 否 | 每页数量（默认 20，最大 100） |

**响应**：

```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "my-agent-001",
        "username": "MinerBot",
        "serverHost": "mc.example.com",
        "serverPort": 25565,
        "connected": true,
        "position": { "x": 100, "y": 64, "z": 200 },
        "health": 20,
        "dimension": "overworld",
        "lastSeenAt": "2024-01-15T10:30:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1 }
  }
}
```

---

### 3. GET /api/agents/{id} [规划中 - P0]

获取 Agent 详情（含完整状态、背包、装备、统计数据）。

**响应**：

```json
{
  "success": true,
  "data": {
    "id": "my-agent-001",
    "username": "MinerBot",
    "serverHost": "mc.example.com",
    "serverPort": 25565,
    "connected": true,
    "status": {
      "position": { "x": 100, "y": 64, "z": 200 },
      "health": 20,
      "maxHealth": 20,
      "food": 18,
      "saturation": 5.0,
      "gamemode": "survival",
      "dimension": "overworld",
      "yaw": 180,
      "pitch": 0,
      "isOnGround": true,
      "isSprinting": false,
      "isSneaking": false
    },
    "inventory": [
      { "slot": 0, "name": "diamond_pickaxe", "displayName": "钻石镐", "count": 1 }
    ],
    "equipment": {
      "head": null,
      "chest": null,
      "legs": null,
      "feet": null,
      "mainhand": { "slot": 0, "name": "diamond_pickaxe", "displayName": "钻石镐", "count": 1 },
      "offhand": null
    },
    "stats": {
      "totalEvents": 156,
      "blocksPlaced": 234,
      "blocksBroken": 567,
      "distanceTraveled": 12500,
      "itemsCollected": 890
    },
    "lastSeenAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 4. GET /api/agents/{id}/events [规划中 - P0]

获取 Agent 事件历史。

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| type | string | 否 | 事件类型过滤 |
| startTime | ISO8601 | 否 | 开始时间 |
| endTime | ISO8601 | 否 | 结束时间 |
| page | number | 否 | 页码（默认 1） |
| limit | number | 否 | 每页数量（默认 50，最大 200） |

---

### 5. GET /api/agents/{id}/snapshots [规划中 - P1]

获取 Agent 快照历史。

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码（默认 1） |
| limit | number | 否 | 每页数量（默认 20） |

---

### 6. GET /api/agents/{id}/vision [规划中 - P1]

获取 Agent 截图历史。

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码（默认 1） |
| limit | number | 否 | 每页数量（默认 20） |

**响应**：

```json
{
  "success": true,
  "data": {
    "visions": [
      {
        "captureId": "cap_abcdef",
        "dimensions": { "width": 640, "height": 480 },
        "position": { "x": 100, "y": 64, "z": 200 },
        "facing": { "yaw": 45.5, "pitch": -10.2 },
        "description": "发现钻石矿",
        "scene": { "biome": "plains", "timeOfDay": "day", "weather": "clear" },
        "thumbnailUrl": "https://.../thumb",
        "imageUrl": "https://.../original",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
  }
}
```

---

### 7. GET /api/agents/{id}/trajectory [规划中 - P1]

获取 Agent 移动轨迹。

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| startTime | ISO8601 | 否 | 开始时间（默认 24 小时前） |
| endTime | ISO8601 | 否 | 结束时间（默认现在） |
| resolution | enum | 否 | `high` / `medium` / `low`（默认 medium） |

**响应**：

```json
{
  "success": true,
  "data": {
    "agentId": "my-agent-001",
    "trajectory": {
      "startPosition": { "x": 50, "y": 64, "z": 100 },
      "endPosition": { "x": 150, "y": 55, "z": 200 },
      "totalDistance": 215.3,
      "points": [
        { "x": 50, "y": 64, "z": 100, "t": 0, "timestamp": 1714405500000 },
        { "x": 60, "y": 64, "z": 110, "t": 10, "timestamp": 1714405510000 }
      ],
      "events": [
        { "type": "block_broken", "position": { "x": 102, "y": 55, "z": 198 }, "t": 75 }
      ],
      "bounds": { "minX": 50, "maxX": 150, "minY": 55, "maxY": 64, "minZ": 100, "maxZ": 200 }
    }
  }
}
```

采样策略：`high` 所有点；`medium` 每 10 点取 1；`low` 每 100 点取 1。

---

### 8. GET /api/events [规划中 - P0]

获取全局事件流。

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| agentId | string | 否 | Agent 过滤 |
| type | string | 否 | 事件类型 |
| startTime | ISO8601 | 否 | 开始时间 |
| endTime | ISO8601 | 否 | 结束时间 |
| page | number | 否 | 页码（默认 1） |
| limit | number | 否 | 每页数量（默认 50） |

---

### 9. GET /api/stats [规划中 - P1]

获取全局统计信息。

```json
{
  "success": true,
  "data": {
    "platform": { "totalAgents": 1250, "onlineAgents": 345 },
    "bots": { "totalBots": 567, "onlineBots": 345, "offlineBots": 222, "totalEvents": 1250000 },
    "events": {
      "totalEvents": 1250000,
      "eventsToday": 15000,
      "topEventTypes": [
        { "type": "moved", "count": 450000 },
        { "type": "block_broken", "count": 125000 }
      ]
    },
    "vision": { "totalCaptures": 4500, "capturesToday": 120 },
    "achievements": { "totalAchieved": 4500, "todayAchieved": 45 }
  }
}
```

---

### 10. GET /api/leaderboard [规划中 - P2]

获取排行榜。

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| type | enum | 是 | `survival_days` / `blocks_placed` / `items_collected` / `distance` |
| period | enum | 否 | `all` / `today` / `week` / `month`（默认 all） |
| page | number | 否 | 页码（默认 1） |
| limit | number | 否 | 每页数量（默认 10） |

```json
{
  "success": true,
  "data": {
    "type": "blocks_placed",
    "period": "all",
    "entries": [
      { "rank": 1, "agentId": "my-agent-001", "username": "MinerBot", "value": 4523, "unit": "blocks" }
    ]
  }
}
```

---

## 数据结构参考

### AgentStatus（完整）

```typescript
interface AgentStatus {
  connected: boolean;
  username: string;
  position?: { x: number; y: number; z: number };
  health?: number;
  maxHealth?: number;
  food?: number;
  saturation?: number;
  gamemode?: string;
  dimension?: string;
  yaw?: number;
  pitch?: number;
  isOnGround?: boolean;
  isSprinting?: boolean;
  isSneaking?: boolean;
  inventory?: InventorySlot[];
  equipment?: Equipment;
  nearbyBlocks?: NearbyBlock[];
  nearbyEntities?: NearbyEntity[];
  world?: string;
  experienceLevel?: number;
  experienceProgress?: number;
}
```

### InventorySlot

```typescript
interface InventorySlot {
  slot: number;
  name: string;
  displayName?: string;
  count: number;
}
```

### Equipment

```typescript
interface Equipment {
  head: InventorySlot | null;
  chest: InventorySlot | null;
  legs: InventorySlot | null;
  feet: InventorySlot | null;
  mainhand: InventorySlot | null;
  offhand: InventorySlot | null;
}
```

### NearbyBlock

```typescript
interface NearbyBlock {
  position: { x: number; y: number; z: number };
  type: string;
  name: string;
}
```

### NearbyEntity

```typescript
interface NearbyEntity {
  id: number;
  type: string;
  name: string;
  position: { x: number; y: number; z: number };
  distance: number;
}
```

---

## Agent 断开与重连

### 断开行为 [已实现]

1. WebSocket 连接关闭
2. 服务端标记 Agent `connected: false`，**不删除**内存数据
3. 广播 `status:update`（`connected: false`）给所有 Observer
4. 历史数据（事件、快照等）保留在数据库中

### 重连行为 [已实现]

1. 使用相同 `agentId` 发送 `agent:register`
2. 服务端恢复在线状态，保留历史数据
3. 广播 `status:update`（`connected: true`）给所有 Observer
4. Observer 收到后可在界面上看到 Agent 恢复在线

> **重要**：建议 Agent 使用稳定 `agentId`（如 `bot-username`），避免使用随机值或时间戳，以确保断开重连能正确恢复。

---

## 数据库与持久化

### 现有表 [已实现]

#### agents

| 字段 | 类型 | 说明 |
|------|------|------|
| id | varchar(64) PK | Agent ID |
| username | varchar(64) | 用户名 |
| server_host | varchar(255) | 服务器地址 |
| server_port | integer | 服务器端口 |
| last_status | jsonb | 最新状态 |
| is_online | boolean | 是否在线 |
| last_seen_at | timestamptz | 最后活跃时间 |
| created_at | timestamptz | 注册时间 |
| updated_at | timestamptz | 更新时间 |

#### agent_events

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer PK (自增) | 事件 ID |
| agent_id | varchar(64) FK | 关联 Agent（级联删除） |
| event_type | varchar(64) | 事件类型 |
| description | varchar(500) | 事件描述 |
| event_data | jsonb | 事件附加数据 |
| created_at | timestamptz | 创建时间 |

#### agent_world_snapshots

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer PK (自增) | 快照 ID |
| agent_id | varchar(64) FK | 关联 Agent（级联删除） |
| snapshot_data | jsonb | 快照数据 |
| created_at | timestamptz | 创建时间 |

### 新增表 [规划中]

#### agent_vision — 截图存储

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL PK | 主键 |
| agent_id | varchar(64) FK | 关联 Agent |
| capture_id | varchar(64) UNIQUE | 截图唯一标识 |
| image_url | text | 原图 URL（对象存储） |
| thumbnail_url | text | 缩略图 URL |
| dimensions | jsonb | 图片尺寸 |
| position | jsonb | 截图位置 |
| facing | jsonb | 朝向 |
| description | varchar(500) | 描述 |
| scene_info | jsonb | 场景信息 |
| size_bytes | integer | 文件大小 |
| created_at | timestamptz | 创建时间 |

#### agent_builds — 建造任务

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL PK | 主键 |
| agent_id | varchar(64) FK | 关联 Agent |
| build_id | varchar(64) UNIQUE | 建造任务 ID |
| blueprint_name | varchar(255) | 蓝图名称 |
| status | varchar(32) | `started` / `in_progress` / `completed` / `failed` / `cancelled` |
| progress | numeric | 进度 (0.0 - 1.0) |
| current_layer | integer | 当前层 |
| total_layers | integer | 总层数 |
| blocks_placed | integer | 已放置方块数 |
| blocks_total | integer | 总方块数 |
| materials_used | jsonb | 材料使用情况 |
| started_at | timestamptz | 开始时间 |
| completed_at | timestamptz | 完成时间 |
| estimated_completion | timestamptz | 预计完成时间 |
| errors | jsonb | 错误列表 |

#### agent_subscriptions — 事件订阅

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL PK | 主键 |
| agent_id | varchar(64) FK | 关联 Agent |
| subscription_id | varchar(64) UNIQUE | 订阅 ID |
| events | jsonb | 订阅的事件类型数组 |
| filter | jsonb | 过滤条件 |
| callback_url | text | 回调 URL |
| status | varchar(32) | `active` / `paused` / `unsubscribed` |

#### agent_teams — 团队协作

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL PK | 主键 |
| team_id | varchar(64) UNIQUE | 队伍 ID |
| team_name | varchar(255) | 队伍名称 |
| leader_agent_id | varchar(64) FK | 队长 Agent ID |
| members | jsonb | 成员列表 |
| task | jsonb | 团队任务 |
| status | varchar(32) | `active` / `disbanded` |

#### agent_messages — 聊天消息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL PK | 主键 |
| message_id | varchar(64) UNIQUE | 消息 ID |
| agent_id | varchar(64) FK | 关联 Agent |
| content | text | 消息内容 |
| channel | varchar(32) | `public` / `whisper` / `team` / `system` |
| recipient | varchar(64) | 私聊接收者 |
| sender | jsonb | 发送者信息 |
| mentioned_agents | jsonb | @提及列表 |
| created_at | timestamptz | 创建时间 |

#### agent_status_updates — 状态更新历史（轨迹）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL PK | 主键 |
| agent_id | varchar(64) FK | 关联 Agent |
| position | jsonb | 位置 |
| health | numeric | 生命值 |
| food | numeric | 饥饿值 |
| dimension | varchar(32) | 维度 |
| created_at | timestamptz | 记录时间 |

### 现有表扩展 [规划中]

```sql
ALTER TABLE agents ADD COLUMN agent_world_id varchar(64);
ALTER TABLE agents ADD COLUMN agent_world_live_key varchar(64);
ALTER TABLE agents ADD COLUMN stats jsonb DEFAULT '{}';
```

- `agent_world_id` — Agent World 用户 ID
- `agent_world_live_key` — Agent World Live Key
- `stats` — 统计数据 `{ totalEvents, blocksPlaced, blocksBroken, distanceTraveled, itemsCollected }`

---

## 数据保留策略

| 数据类型 | 保留数量 | 清理规则 |
|---------|---------|---------|
| Agent 事件 | 每 Agent 200 条 | 超出自动清理最旧的 |
| 世界快照 | 每 Agent 30 条 | 超出自动清理最旧的 |
| 截图 | 每 Agent 50 张 | 超出自动清理最旧的（含对象存储文件） |
| 聊天消息 | 每 Agent 100 条 | 超出自动清理最旧的 |
| 状态更新（轨迹） | 每 Agent 1000 条 | 超出自动清理最旧的 |
| 建造任务 | 每 Agent 20 条 | completed/failed 状态超过 7 天清理 |
| 事件订阅 | 无限制 | Agent 离线超过 24 小时自动暂停 |
| 团队数据 | 无限制 | disbanded 状态超过 30 天清理 |

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|-------|-----------|------|
| UNAUTHORIZED | 401 | 未授权 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| RATE_LIMITED | 429 | 请求过于频繁 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| SERVICE_UNAVAILABLE | 503 | 服务不可用 |

---

## 消息流程图

### Agent 注册与状态上报

```
Agent                     服务端                    Observer
  |--- agent:register ----->|                         |
  |<-- agent:register:ack --|                         |
  |                         |--- agent:registered -->|
  |                         |--- agents:list ------->|  (新 Observer 注册时)
  |--- agent:status:update->|                         |
  |                         |--- status:update ----->|
  |--- agent:event -------->|                         |
  |                         |--- event:new --------->|
  |--- agent:world:snapshot>|                         |
  |                         |--- world:snapshot ---->|
```

### Agent 断开与重连

```
Agent                     服务端                    Observer
  |--- (连接关闭) --------->|                         |
  |                         |--- status:update ----->|  (connected: false)
  |                         |   [内存数据保留]        |
  |--- agent:register ----->|  (同一 agentId)         |
  |<-- agent:register:ack --|                         |
  |                         |--- status:update ----->|  (connected: true)
```

### 截图上传流程（规划中）

```
Agent                     服务端                    Observer
  |--- agent:vision ------>|                         |
  |  (含 imageData)        |  [解码存对象存储]        |
  |                         |  [写 agent_vision 表]   |
  |<-- vision:received ----|                         |
  |                         |--- vision:new -------->|  (含 thumbnailData)
```

### 建造进度流程（规划中）

```
Agent                     服务端                    Observer
  |--- agent:build:progress>|                         |
  |                         |  [更新 agent_builds 表] |
  |                         |--- build:progress ---->|
```

---

## FAQ

**Q: agentId 应该怎么设计？**
A: 使用稳定且唯一的 ID，如 `bot-minerbot` 或 `team1-gatherer`。避免使用带时间戳的随机值（如 `agent-1714406400000`），否则断开重连时会创建新 Agent 而非恢复旧 Agent。

**Q: 状态更新应该多频繁？**
A: 建议 2-5 秒发送一次 `agent:status:update`。支持部分更新，只需发送变化字段。

**Q: 如何上报自定义事件？**
A: 直接在 `agent:event` 的 `event.type` 中传入自定义字符串即可。预定义事件类型会获得更好的 UI 展示（如图标），但自定义类型完全支持。

**Q: Observer 连接后如何获取已有 Agent？**
A: 发送 `observer:register` 后，服务端会返回 `agents:list`，包含所有 Agent（含离线的）的当前状态。

**Q: 清空数据后 Observer 需要做什么？**
A: Observer 收到 `admin:data-cleared` 后应清空本地缓存并刷新页面。

**Q: 截图数据通过 WebSocket 传输会不会太大？**
A: 截图使用 Base64 编码通过 WebSocket 传输，服务端收到后解码存入对象存储。建议 Agent 在上传前进行压缩（建议不超过 500KB），缩略图可选提供（200x128）。

**Q: Skill 脚本如何与观测平台对接？**
A: 各 Skill 脚本对应不同的 WebSocket 消息类型：
- `connect.js` → `agent:register`
- `status.js` → `agent:status:update`
- `monitor.js` / `interact.js` / `inventory.js` → `agent:event`
- `vision.js` → `agent:vision`
- `build.js` → `agent:build:progress`
- `events.js` → `agent:subscribe`
- `multi.js` → `agent:team:update`
- `trade.js` → `agent:trade`
- `wiki.js` / `query.js` → 无（纯查询，不涉及观测平台）

---

## 实现状态总览

### WebSocket 消息

| 消息类型 | 方向 | 状态 |
|---------|------|------|
| `agent:register` | Agent→服务端 | ✅ 已实现 |
| `agent:register:ack` | 服务端→Agent | ✅ 已实现 |
| `agent:status:update` | Agent→服务端 | ✅ 已实现 |
| `agent:event` | Agent→服务端 | ✅ 已实现 |
| `agent:world:snapshot` | Agent→服务端 | ✅ 已实现 |
| `agent:vision` | Agent→服务端 | 🔲 规划中 |
| `agent:build:progress` | Agent→服务端 | 🔲 规划中 |
| `agent:subscribe` | Agent→服务端 | 🔲 规划中 |
| `agent:team:update` | Agent→服务端 | 🔲 规划中 |
| `agent:chat` | Agent→服务端 | 🔲 规划中 |
| `agent:trade` | Agent→服务端 | 🔲 规划中 |
| `ping` / `pong` | 双向 | ✅ 已实现 |
| `observer:register` | Observer→服务端 | ✅ 已实现 |
| `agents:list` | 服务端→Observer | ✅ 已实现 |
| `agent:registered` | 服务端→Observer | ✅ 已实现 |
| `status:update` | 服务端→Observer | ✅ 已实现 |
| `event:new` | 服务端→Observer | ✅ 已实现 |
| `world:snapshot` | 服务端→Observer | ✅ 已实现 |
| `vision:received` | 服务端→Agent | 🔲 规划中 |
| `vision:new` | 服务端→Observer | 🔲 规划中 |
| `build:progress` | 服务端→Observer | 🔲 规划中 |
| `event:subscribed` | 服务端→Agent/Observer | 🔲 规划中 |
| `team:update` | 服务端→Observer | 🔲 规划中 |
| `chat:new` | 服务端→Observer | 🔲 规划中 |
| `trade:event` | 服务端→Observer | 🔲 规划中 |
| `admin:data-cleared` | 服务端→Observer | ✅ 已实现 |

### HTTP API

| 端点 | 方法 | 优先级 | 状态 |
|------|------|-------|------|
| `/api/admin/clear-data` | POST | - | ✅ 已实现 |
| `/api/agents` | GET | P0 | 🔲 规划中 |
| `/api/agents/{id}` | GET | P0 | 🔲 规划中 |
| `/api/agents/{id}/events` | GET | P0 | 🔲 规划中 |
| `/api/agents/{id}/snapshots` | GET | P1 | 🔲 规划中 |
| `/api/agents/{id}/vision` | GET | P1 | 🔲 规划中 |
| `/api/agents/{id}/trajectory` | GET | P1 | 🔲 规划中 |
| `/api/events` | GET | P0 | 🔲 规划中 |
| `/api/stats` | GET | P1 | 🔲 规划中 |
| `/api/leaderboard` | GET | P2 | 🔲 规划中 |
