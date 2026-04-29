// Minecraft Agent 状态类型定义

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface AgentStatus {
  id: string;
  username: string;
  connected: boolean;
  position: Position;
  health: number;
  maxHealth: number;
  food: number;
  saturation: number;
  gamemode: 'survival' | 'creative' | 'adventure' | 'spectator';
  heldItem?: InventorySlot;
  inventory: InventorySlot[];
  equipment: {
    head?: InventorySlot;
    chest?: InventorySlot;
    legs?: InventorySlot;
    feet?: InventorySlot;
    mainhand?: InventorySlot;
    offhand?: InventorySlot;
  };
  world: string;
  dimension: string;
  yaw: number;
  pitch: number;
  velocity?: Position;
  isOnGround: boolean;
  isSleeping: boolean;
  isSprinting: boolean;
  isSneaking: boolean;
  lastUpdated: number;
}

export interface InventorySlot {
  slot: number;
  name: string;
  displayName: string;
  count: number;
  metadata?: number;
  nbt?: string;
}

export interface AgentEvent {
  id: string;
  agentId: string;
  type: EventType;
  timestamp: number;
  data: Record<string, unknown>;
  description: string;
}

export type EventType =
  | 'connected'
  | 'disconnected'
  | 'moved'
  | 'jumped'
  | 'attacked'
  | 'damaged'
  | 'died'
  | 'chat_sent'
  | 'chat_received'
  | 'block_broken'
  | 'block_placed'
  | 'item_picked_up'
  | 'item_dropped'
  | 'item_used'
  | 'inventory_changed'
  | 'world_changed'
  | 'respawned';

export interface NearbyBlock {
  position: Position;
  type: string;
  name: string;
  light?: number;
}

export interface NearbyEntity {
  id: number;
  type: string;
  name?: string;
  position: Position;
  distance: number;
}

export interface WorldSnapshot {
  blocks: NearbyBlock[];
  entities: NearbyEntity[];
  timestamp: number;
}

// WebSocket 消息类型
export interface WsMessage<T = unknown> {
  type: string;
  payload: T;
}

// Agent 注册消息
export interface AgentRegisterPayload {
  agentId: string;
  username: string;
  serverHost: string;
  serverPort: number;
}

// 状态更新消息
export interface StatusUpdatePayload {
  agentId: string;
  status: Partial<AgentStatus>;
}

// 事件消息
export interface EventPayload {
  agentId: string;
  event: AgentEvent;
}

// 世界快照消息
export interface WorldSnapshotPayload {
  agentId: string;
  snapshot: WorldSnapshot;
}

// Agent 列表更新
export interface AgentsUpdatePayload {
  agents: AgentStatus[];
}

// 广播消息（服务端 -> 客户端）
export interface BroadcastMessage {
  type: 'agent:registered' | 'agent:unregistered' | 'status:update' | 'event:new' | 'world:snapshot' | 'agents:list';
  payload: unknown;
}
