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
  | 'respawned'
  | 'item_crafted'
  | 'craft_failed'
  | 'item_smelted'
  | 'smelt_completed'
  | 'chest_opened'
  | 'item_deposited'
  | 'item_withdrawn'
  | 'land_tilled'
  | 'crop_planted'
  | 'crop_harvested'
  | 'health_change'
  | 'dimension_change'
  | 'weather_change'
  | 'entity_spawn'
  | 'entity_death'
  | 'player_death'
  | 'trade_opened'
  | 'trade_completed'
  | 'trade_failed'
  | 'build_started'
  | 'build_progress'
  | 'build_completed'
  | 'build_failed'
  | 'achievement_earned'
  | 'vision_captured'
  | 'team_created'
  | 'team_joined'
  | 'team_left'
  | 'team_disbanded';

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

// ============ 新增类型 ============

// 截图相关
export interface VisionPayload {
  agentId: string;
  vision: {
    captureId: string;
    imageData: string;       // Base64 编码的图片数据
    thumbnailData?: string;  // Base64 编码的缩略图
    dimensions: { width: number; height: number };
    position: Position;
    facing?: { yaw: number; pitch: number };
    description?: string;
    scene?: {
      biome?: string;
      timeOfDay?: string;
      weather?: string;
      dimension?: string;
    };
    timestamp: number;
  };
}

export interface VisionRecord {
  captureId: string;
  agentId: string;
  imageUrl: string;
  thumbnailUrl: string;
  imageKey: string;       // S3 对象存储 key
  thumbnailKey?: string;  // 缩略图 S3 key
  dimensions: { width: number; height: number };
  position: Position;
  facing?: { yaw: number; pitch: number };
  description?: string;
  sceneInfo?: Record<string, unknown>;
  sizeBytes?: number;
  createdAt: string;
}

// 建造进度
export interface BuildProgressPayload {
  agentId: string;
  build: {
    buildId: string;
    blueprintName: string;
    status: 'started' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    currentLayer?: number;
    totalLayers?: number;
    blocksPlaced: number;
    blocksTotal: number;
    materialsUsed?: Array<{ material: string; used: number; remaining: number }>;
    startedAt: number;
    estimatedCompletion?: number;
    errors?: string[];
  };
}

export interface BuildRecord {
  buildId: string;
  agentId: string;
  blueprintName: string;
  status: string;
  progress: number;
  currentLayer?: number;
  totalLayers?: number;
  blocksPlaced: number;
  blocksTotal: number;
  materialsUsed?: Array<{ material: string; used: number; remaining: number }>;
  startedAt: string;
  completedAt?: string;
  estimatedCompletion?: string;
  errors?: string[];
  createdAt: string;
  updatedAt: string;
}

// 事件订阅
export interface SubscribePayload {
  agentId: string;
  subscription: {
    subscriptionId: string;
    events: string[];
    filter?: {
      entityTypes?: string[];
      chatContains?: string | null;
    };
    callbackUrl?: string | null;
    action?: 'subscribe' | 'unsubscribe';
  };
}

export interface SubscriptionRecord {
  subscriptionId: string;
  agentId: string;
  events: string[];
  filter?: Record<string, unknown>;
  callbackUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// 团队
export interface TeamUpdatePayload {
  agentId: string;
  team: {
    teamId: string;
    teamName: string;
    action: 'created' | 'joined' | 'left' | 'status_update' | 'disbanded';
    leader: string;
    members: Array<{
      agentId: string;
      username: string;
      role: 'leader' | 'member';
      position?: Position;
      status?: string;
      task?: {
        type: string;
        progress: number;
        targetPosition?: Position;
      };
    }>;
    task?: {
      type: string;
      status: string;
      progress: number;
      startedAt?: number;
      estimatedCompletion?: number;
    };
    timestamp: number;
  };
}

export interface TeamRecord {
  teamId: string;
  teamName: string;
  leaderAgentId: string;
  members: unknown[];
  task?: unknown;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// 聊天消息
export interface ChatPayload {
  agentId: string;
  message: {
    messageId: string;
    content: string;
    channel: 'public' | 'whisper' | 'team' | 'system';
    recipient?: string;
    sender: {
      agentId: string;
      username: string;
      type: 'agent' | 'player';
    };
    mentionedAgents?: string[];
    timestamp: number;
  };
}

export interface ChatMessageRecord {
  messageId: string;
  agentId: string;
  content: string;
  channel: string;
  recipient?: string;
  sender: unknown;
  mentionedAgents?: unknown[];
  createdAt: string;
}

// 交易
export interface TradePayload {
  agentId: string;
  trade: {
    tradeId: string;
    villagerId: number;
    villagerProfession?: string;
    action: 'trade_opened' | 'trade_completed' | 'trade_failed';
    tradeIndex: number;
    count?: number;
    input?: string[];
    output?: string;
    position?: Position;
    timestamp: number;
  };
}

// 状态更新历史（轨迹）
export interface StatusUpdateRecord {
  id: number;
  agentId: string;
  position: Position;
  health?: number;
  food?: number;
  dimension?: string;
  createdAt: string;
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
  type: string;
  payload: unknown;
}
