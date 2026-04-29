# MineWorld Agent 接口文档

> MineWorld 是一个 Minecraft Agent 实时观测平台。Agent 通过 WebSocket 连接上报自身状态，Observer 通过 WebSocket 订阅实时推送。

## 快速开始

### 1. 连接地址

```
ws://<host>:5000/ws/agent
```

生产环境使用域名：

```
wss://<domain>/ws/agent
```

### 2. 最小接入示例 (Node.js)

```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:5000/ws/agent');

ws.on('open', () => {
  // 第一步：注册 Agent
  ws.send(JSON.stringify({
    type: 'agent:register',
    payload: {
      agentId: 'my-agent-001',
      username: 'MyBot',
      serverHost: 'mc.example.com',
      serverPort: 25565,
    },
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'agent:register:ack') {
    console.log('注册成功！', msg.payload);
    // 第二步：发送初始状态
    sendStatusUpdate();
    // 第三步：启动定时上报
    setInterval(sendStatusUpdate, 3000);
  }
});

function sendStatusUpdate() {
  ws.send(JSON.stringify({
    type: 'agent:status:update',
    payload: {
      agentId: 'my-agent-001',
      status: {
        position: { x: 100, y: 64, z: -200 },
        health: 20,
        maxHealth: 20,
        food: 18,
        saturation: 8,
        gamemode: 'survival',
        isOnGround: true,
        isSleeping: false,
        isSprinting: false,
        isSneaking: false,
        yaw: 180,
        pitch: 0,
      },
    },
  }));
}
```

### 3. 最小接入示例 (Python)

```python
import asyncio
import json
import websockets

async def run_agent():
    uri = "ws://localhost:5000/ws/agent"
    async with websockets.connect(uri) as ws:
        # 注册 Agent
        await ws.send(json.dumps({
            "type": "agent:register",
            "payload": {
                "agentId": "my-python-agent",
                "username": "PyBot",
                "serverHost": "mc.example.com",
                "serverPort": 25565,
            },
        }))

        # 等待注册确认
        msg = json.loads(await ws.recv())
        if msg["type"] == "agent:register:ack":
            print("注册成功！")

        # 定时上报状态
        while True:
            await ws.send(json.dumps({
                "type": "agent:status:update",
                "payload": {
                    "agentId": "my-python-agent",
                    "status": {
                        "position": {"x": 100, "y": 64, "z": -200},
                        "health": 20,
                        "maxHealth": 20,
                        "food": 18,
                        "saturation": 8,
                        "gamemode": "survival",
                        "isOnGround": True,
                        "isSleeping": False,
                        "isSprinting": False,
                        "isSneaking": False,
                        "yaw": 180,
                        "pitch": 0,
                    },
                },
            }))
            await asyncio.sleep(3)

asyncio.run(run_agent())
```

---

## 通信协议

所有 WebSocket 消息使用 JSON 格式，统一结构：

```typescript
interface WsMessage<T = unknown> {
  type: string;    // 消息类型
  payload: T;      // 消息载荷
}
```

---

## 一、Agent → 服务端消息

### 1.1 agent:register — 注册 Agent

Agent 连接后**必须首先发送此消息**进行注册。如果 `agentId` 已存在，则视为重连。

```json
{
  "type": "agent:register",
  "payload": {
    "agentId": "my-agent-001",
    "username": "MyBot",
    "serverHost": "mc.example.com",
    "serverPort": 25565
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentId | string | 是 | Agent 唯一标识，建议使用稳定 ID（如 `bot-username`），避免每次生成随机值 |
| username | string | 是 | Agent 在游戏中的用户名 |
| serverHost | string | 是 | Minecraft 服务器地址 |
| serverPort | number | 是 | Minecraft 服务器端口 |

**服务端回复：**

```json
{
  "type": "agent:register:ack",
  "payload": { "agentId": "my-agent-001", "success": true }
}
```

**注册后默认状态：**

| 字段 | 默认值 |
|------|--------|
| position | `{ x: 0, y: 64, z: 0 }` |
| health | 20 |
| maxHealth | 20 |
| food | 20 |
| saturation | 5 |
| gamemode | `"survival"` |
| inventory | `[]` |
| equipment | `{}` |
| dimension | `"overworld"` |
| connected | `true` |

**重连行为：**
- 如果 `agentId` 已在内存中存在（包括离线状态），将恢复在线状态并保留所有历史数据
- 重连时 Observer 收到 `status:update`（而非 `agent:registered`）
- 重连不会清空历史事件和世界快照

---

### 1.2 agent:status:update — 更新 Agent 状态

Agent 定期上报自身状态。支持增量更新（只发送变化的字段）。

```json
{
  "type": "agent:status:update",
  "payload": {
    "agentId": "my-agent-001",
    "status": {
      "position": { "x": 101, "y": 64, "z": -199 },
      "health": 18,
      "food": 15
    }
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentId | string | 是 | Agent ID |
| status | Partial\<AgentStatus\> | 是 | 状态更新（支持部分更新） |

**AgentStatus 完整字段参考：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | Agent ID（自动填充，无需发送） |
| username | string | 用户名 |
| connected | boolean | 是否在线（服务端管理，无需发送） |
| position | Position | 坐标 `{ x, y, z }` |
| health | number | 当前生命值 (0-20) |
| maxHealth | number | 最大生命值 (通常 20) |
| food | number | 饥饿值 (0-20) |
| saturation | number | 饱和度 (0-20) |
| gamemode | string | 游戏模式: `"survival"` / `"creative"` / `"adventure"` / `"spectator"` |
| heldItem | InventorySlot | 主手物品（可选） |
| inventory | InventorySlot[] | 背包物品列表 |
| equipment | Equipment | 装备栏 |
| world | string | 所在服务器地址 |
| dimension | string | 维度: `"overworld"` / `"the_nether"` / `"the_end"` |
| yaw | number | 水平朝向角度 (0-360) |
| pitch | number | 垂直朝向角度 (-90 ~ 90) |
| velocity | Position | 速度向量（可选） |
| isOnGround | boolean | 是否在地面 |
| isSleeping | boolean | 是否在睡觉 |
| isSprinting | boolean | 是否在疾跑 |
| isSneaking | boolean | 是否在潜行 |
| lastUpdated | number | 最后更新时间戳（服务端管理） |

**InventorySlot 结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| slot | number | 槽位编号 (0-35 为背包, 36-44 为热键栏, 负数为装备栏) |
| name | string | 物品 ID（如 `"minecraft:diamond_sword"`） |
| displayName | string | 显示名称（如 `"钻石剑"`） |
| count | number | 数量 |
| metadata | number | 元数据（可选） |
| nbt | string | NBT 数据（可选） |

**Equipment 结构：**

```json
{
  "head": { "slot": -1, "name": "minecraft:diamond_helmet", "displayName": "钻石头盔", "count": 1 },
  "chest": { "slot": -2, "name": "minecraft:diamond_chestplate", "displayName": "钻石胸甲", "count": 1 },
  "legs": { "slot": -3, "name": "minecraft:diamond_leggings", "displayName": "钻石护腿", "count": 1 },
  "feet": { "slot": -4, "name": "minecraft:diamond_boots", "displayName": "钻石靴子", "count": 1 },
  "mainhand": { "slot": -1, "name": "minecraft:diamond_sword", "displayName": "钻石剑", "count": 1 },
  "offhand": { "slot": -5, "name": "minecraft:shield", "displayName": "盾牌", "count": 1 }
}
```

**自动检测事件：**
- 位置变化 → 自动生成 `moved` 事件并广播给 Observer
- Y 坐标增加 > 0.5 → 自动生成 `jumped` 事件并广播

---

### 1.3 agent:event — 上报自定义事件

Agent 可以主动上报游戏事件，用于记录重要行为。

```json
{
  "type": "agent:event",
  "payload": {
    "agentId": "my-agent-001",
    "event": {
      "type": "block_broken",
      "description": "破坏了钻石矿石",
      "data": { "blockType": "diamond_ore", "position": { "x": 50, "y": 12, "z": -30 } }
    }
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentId | string | 是 | Agent ID |
| event.type | string | 是 | 事件类型（见下方事件类型表） |
| event.description | string | 否 | 事件描述 |
| event.data | object | 否 | 事件附加数据 |

**预定义事件类型：**

| 类型 | 说明 | 建议 data 字段 |
|------|------|----------------|
| `connected` | Agent 连接到服务器 | — |
| `disconnected` | Agent 断开连接 | — |
| `moved` | 位置变化 | `{ from, to }` (Position) |
| `jumped` | 跳跃 | — |
| `attacked` | 攻击实体 | `{ target, damage }` |
| `damaged` | 受到伤害 | `{ source, damage }` |
| `died` | 死亡 | `{ cause }` |
| `respawned` | 重生 | `{ position }` |
| `chat_sent` | 发送聊天消息 | `{ message }` |
| `chat_received` | 收到聊天消息 | `{ sender, message }` |
| `block_broken` | 破坏方块 | `{ blockType, position }` |
| `block_placed` | 放置方块 | `{ blockType, position }` |
| `item_picked_up` | 拾取物品 | `{ item, count }` |
| `item_dropped` | 丢弃物品 | `{ item, count }` |
| `item_used` | 使用物品 | `{ item }` |
| `inventory_changed` | 背包变化 | `{ changes }` |
| `world_changed` | 世界/维度切换 | `{ from, to }` |

你也可以使用自定义事件类型（不在上述列表中的 type 也能正常处理）。

---

### 1.4 agent:world:snapshot — 上报世界快照

上报 Agent 周围的方块和实体信息，用于在观测台显示小地图。

```json
{
  "type": "agent:world:snapshot",
  "payload": {
    "agentId": "my-agent-001",
    "snapshot": {
      "blocks": [
        { "position": { "x": 0, "y": 63, "z": 1 }, "type": "grass_block", "name": "草方块" },
        { "position": { "x": 1, "y": 63, "z": 1 }, "type": "dirt", "name": "泥土", "light": 15 }
      ],
      "entities": [
        { "id": 1, "type": "pig", "name": "Pig", "position": { "x": 5, "y": 64, "z": -3 }, "distance": 7 }
      ],
      "timestamp": 1714406400000
    }
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentId | string | 是 | Agent ID |
| snapshot.blocks | NearbyBlock[] | 是 | 周围方块列表 |
| snapshot.entities | NearbyEntity[] | 是 | 周围实体列表 |
| snapshot.timestamp | number | 是 | 快照时间戳 (毫秒) |

**NearbyBlock 结构：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| position | Position | 是 | 方块坐标 |
| type | string | 是 | 方块类型 ID（如 `"grass_block"`, `"diamond_ore"`） |
| name | string | 是 | 方块显示名称 |
| light | number | 否 | 光照等级 (0-15) |

**NearbyEntity 结构：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 实体 ID |
| type | string | 是 | 实体类型（如 `"pig"`, `"zombie"`, `"player"`） |
| name | string | 否 | 实体显示名称 |
| position | Position | 是 | 实体坐标 |
| distance | number | 是 | 与 Agent 的距离 (格) |

---

### 1.5 ping — 心跳

客户端可定期发送心跳以保持连接活跃。服务端每 30 秒也会检测连接。

```json
{ "type": "ping", "payload": null }
```

**服务端回复：**

```json
{ "type": "pong", "payload": null }
```

---

## 二、Observer → 服务端消息

### 2.1 observer:register — 注册为观测者

观测者连接后发送此消息，即可接收所有 Agent 的实时状态推送。

```json
{ "type": "observer:register", "payload": {} }
```

**服务端立即回复当前所有 Agent 列表：**

```json
{
  "type": "agents:list",
  "payload": {
    "agents": [
      {
        "id": "my-agent-001",
        "username": "MyBot",
        "connected": true,
        "position": { "x": 100, "y": 64, "z": -200 },
        "health": 20,
        "maxHealth": 20,
        "food": 18,
        "saturation": 8,
        "gamemode": "survival",
        "inventory": [],
        "equipment": {},
        "world": "mc.example.com",
        "dimension": "overworld",
        "yaw": 180,
        "pitch": 0,
        "isOnGround": true,
        "isSleeping": false,
        "isSprinting": false,
        "isSneaking": false,
        "lastUpdated": 1714406400000
      }
    ]
  }
}
```

---

## 三、服务端 → 客户端消息（广播）

Observer 注册后，会收到以下实时推送消息：

### 3.1 agents:list — Agent 列表

Observer 注册时立即收到，包含所有 Agent（包括离线的）的当前状态。

### 3.2 agent:registered — 新 Agent 注册通知

当**新** Agent 注册时广播给所有 Observer（重连时不发送此消息）。

```json
{
  "type": "agent:registered",
  "payload": {
    "agentId": "new-agent-002",
    "status": { /* AgentStatus */ }
  }
}
```

### 3.3 status:update — Agent 状态更新

当 Agent 状态变化时广播。包括：
- Agent 主动上报状态更新
- Agent 重连（从离线恢复为在线）
- Agent 断开连接（标记为离线，`connected: false`）

```json
{
  "type": "status:update",
  "payload": {
    "agentId": "my-agent-001",
    "status": { /* 更新后的 AgentStatus */ }
  }
}
```

### 3.4 event:new — 新事件通知

Agent 发生事件时广播（包括自动检测的 moved/jumped 事件和主动上报的自定义事件）。

```json
{
  "type": "event:new",
  "payload": {
    "agentId": "my-agent-001",
    "event": {
      "id": "my-agent-001-1714406400000-a1b2c3",
      "agentId": "my-agent-001",
      "type": "moved",
      "description": "移动到 (101, 64, -199)",
      "data": { "from": { "x": 100, "y": 64, "z": -200 }, "to": { "x": 101, "y": 64, "z": -199 } },
      "timestamp": 1714406400000
    }
  }
}
```

### 3.5 world:snapshot — 世界快照更新

Agent 上报世界快照时广播。

```json
{
  "type": "world:snapshot",
  "payload": {
    "agentId": "my-agent-001",
    "snapshot": { /* WorldSnapshot */ }
  }
}
```

### 3.6 admin:data-cleared — 数据清空通知

管理员清空数据后广播，Observer 应清空本地缓存并刷新页面。

```json
{
  "type": "admin:data-cleared",
  "payload": { "scope": "all" }
}
```

| scope | 说明 |
|-------|------|
| `"events"` | 仅清空了事件和快照，Agent 保留 |
| `"all"` | 清空了所有数据（Agent、事件、快照） |

---

## 四、Agent 断开与重连

### 断开行为

当 Agent 的 WebSocket 连接关闭时：
1. 服务端将 Agent 标记为**离线**（`connected: false`），**不删除内存数据**
2. 广播 `status:update` 给所有 Observer
3. 自动记录 `disconnected` 事件
4. 更新数据库 `is_online = false`
5. 保留历史事件和世界快照

### 重连行为

当同一 `agentId` 重新发送 `agent:register` 时：
1. 恢复为在线状态（`connected: true`）
2. 保留所有历史数据（事件、快照、背包等）
3. 广播 `status:update`（而非 `agent:registered`）
4. 记录重连事件

---

## 五、HTTP API

### 5.1 POST /api/admin/clear-data — 清空数据

清空数据库中的 Agent 数据，并同步清除服务端内存缓存。

**请求：**

```json
POST /api/admin/clear-data
Content-Type: application/json

{
  "scope": "events"
}
```

| 参数 | 值 | 说明 |
|------|------|------|
| scope | `"events"` | 仅清空事件日志和世界快照，保留 Agent 记录 |
| scope | `"all"` | 清空所有数据（Agent + 事件 + 快照） |

**响应：**

```json
{ "success": true, "message": "已清空所有事件和快照数据" }
```

**错误响应：**

```json
{ "error": "无效的 scope 参数，可选值: events, all" }
```

---

## 六、数据持久化

所有 Agent 数据自动持久化到 PostgreSQL 数据库，服务重启后自动恢复。

### 数据库表结构

#### agents 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | varchar(64) PK | Agent ID |
| username | varchar(64) | 用户名 |
| server_host | varchar(255) | 服务器地址 |
| server_port | integer | 服务器端口 |
| last_status | jsonb | 最新状态（完整 AgentStatus） |
| is_online | boolean | 是否在线 |
| last_seen_at | timestamptz | 最后活跃时间 |
| created_at | timestamptz | 注册时间 |
| updated_at | timestamptz | 更新时间 |

#### agent_events 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer PK (自增) | 事件 ID |
| agent_id | varchar(64) FK | 关联 Agent（级联删除） |
| event_type | varchar(64) | 事件类型 |
| description | varchar(500) | 事件描述 |
| event_data | jsonb | 事件附加数据 |
| created_at | timestamptz | 创建时间 |

#### agent_world_snapshots 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer PK (自增) | 快照 ID |
| agent_id | varchar(64) FK | 关联 Agent（级联删除） |
| snapshot_data | jsonb | 快照数据 |
| created_at | timestamptz | 创建时间 |

### 数据清理策略

- 每个Agent 最多保留 **200 条事件**（超出自动清理最旧的）
- 每个Agent 最多保留 **30 条世界快照**（超出自动清理最旧的）
- 在线 Agent 状态每 **30 秒** 同步一次到数据库

---

## 七、完整消息流程图

```
Agent                          Server                         Observer
  |                              |                              |
  |-- agent:register ----------->|                              |
  |                              |-- agent:registered --------->| (新Agent)
  |<-- agent:register:ack -------|                              |
  |                              |                              |
  |-- agent:status:update ------>|                              |
  |                              |-- status:update ------------>| (含moved检测)
  |                              |                              |
  |-- agent:event ------------->|                              |
  |                              |-- event:new ---------------->|
  |                              |                              |
  |-- agent:world:snapshot ----->|                              |
  |                              |-- world:snapshot ----------->|
  |                              |                              |
  |  (连接关闭)                   |                              |
  |                              |-- status:update ------------>| (connected:false)
  |                              |                              |
  |  (重连)                       |                              |
  |-- agent:register ----------->|                              |
  |                              |-- status:update ------------>| (重连恢复在线)
  |<-- agent:register:ack -------|                              |
```

---

## 八、常见问题

### Q: agentId 应该怎么设计？
建议使用稳定且有意义的 ID 格式，例如 `bot-<username>` 或 `<project>-<instance>`。避免使用随机 UUID 或带时间戳的 ID，否则每次重启会创建新 Agent 而非重连。

### Q: 状态更新频率建议？
建议 **2-5 秒** 上报一次状态。位置变化频繁时可缩短间隔，静止时可延长。

### Q: 如何只更新部分状态？
`agent:status:update` 的 `status` 字段支持**部分更新**（Partial），只需发送变化的字段即可，未发送的字段保持原值。

### Q: Agent 断开后数据会丢失吗？
不会。断开连接只标记为离线，所有历史数据（状态、事件、快照）都保留在内存和数据库中。重连后会恢复。

### Q: 事件类型可以自定义吗？
可以。除了预定义的 17 种事件类型外，你可以在 `event.type` 中使用任意字符串。观测台会正常显示自定义事件。

### Q: 世界快照上报频率？
建议 **5-10 秒** 上报一次。快照节流机制：服务端对同一 Agent 至少间隔 10 秒才会持久化一次快照到数据库。

### Q: 心跳机制？
- 客户端可发送 `ping` 消息，服务端回复 `pong`
- 服务端 WebSocket 客户端默认每 30 秒发送一次心跳
- 如果需要保持连接，建议客户端也定期发送 `ping`
