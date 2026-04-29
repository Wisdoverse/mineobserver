// Agent 状态管理器 - 服务端单例

import type {
  AgentStatus,
  AgentEvent,
  EventType,
  Position,
  WorldSnapshot,
} from '@/lib/types/agent';

interface AgentState {
  status: AgentStatus;
  events: AgentEvent[];
  worldSnapshot: WorldSnapshot | null;
}

class AgentStateManager {
  private agents: Map<string, AgentState> = new Map();
  private maxEventsPerAgent = 100;

  // 注册新 Agent
  register(agentId: string, username: string, serverHost: string, _serverPort: number): AgentStatus {
    const status: AgentStatus = {
      id: agentId,
      username,
      connected: true,
      position: { x: 0, y: 64, z: 0 },
      health: 20,
      maxHealth: 20,
      food: 20,
      saturation: 5,
      gamemode: 'survival',
      inventory: [],
      equipment: {},
      world: serverHost,
      dimension: 'overworld',
      yaw: 0,
      pitch: 0,
      isOnGround: true,
      isSleeping: false,
      isSprinting: false,
      isSneaking: false,
      lastUpdated: Date.now(),
    };

    this.agents.set(agentId, {
      status,
      events: [],
      worldSnapshot: null,
    });

    return status;
  }

  // 注销 Agent
  unregister(agentId: string): void {
    this.agents.delete(agentId);
  }

  // 更新 Agent 状态
  updateStatus(agentId: string, updates: Partial<AgentStatus>): AgentStatus | null {
    const state = this.agents.get(agentId);
    if (!state) return null;

    // 合并更新
    state.status = {
      ...state.status,
      ...updates,
      lastUpdated: Date.now(),
    };

    return state.status;
  }

  // 添加事件
  addEvent(agentId: string, event: Omit<AgentEvent, 'id' | 'timestamp'>): AgentEvent | null {
    const state = this.agents.get(agentId);
    if (!state) return null;

    const newEvent: AgentEvent = {
      ...event,
      id: `${agentId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };

    state.events.unshift(newEvent);

    // 限制事件数量
    if (state.events.length > this.maxEventsPerAgent) {
      state.events = state.events.slice(0, this.maxEventsPerAgent);
    }

    return newEvent;
  }

  // 更新世界快照
  updateWorldSnapshot(agentId: string, snapshot: WorldSnapshot): void {
    const state = this.agents.get(agentId);
    if (!state) return;
    state.worldSnapshot = snapshot;
  }

  // 获取所有 Agent 状态
  getAllAgents(): AgentStatus[] {
    return Array.from(this.agents.values()).map((s) => s.status);
  }

  // 获取单个 Agent 状态
  getAgentStatus(agentId: string): AgentStatus | null {
    return this.agents.get(agentId)?.status ?? null;
  }

  // 获取 Agent 事件
  getAgentEvents(agentId: string): AgentEvent[] {
    return this.agents.get(agentId)?.events ?? [];
  }

  // 获取世界快照
  getWorldSnapshot(agentId: string): WorldSnapshot | null {
    return this.agents.get(agentId)?.worldSnapshot ?? null;
  }

  // 检查 Agent 是否存在
  hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  // 获取连接数
  getAgentCount(): number {
    return this.agents.size;
  }
}

// 导出单例
export const agentStateManager = new AgentStateManager();

// 便捷函数：创建标准事件
export function createAgentEvent(
  agentId: string,
  type: EventType,
  description: string,
  data: Record<string, unknown> = {}
): Omit<AgentEvent, 'id' | 'timestamp'> {
  return {
    agentId,
    type,
    description,
    data,
  };
}

// 便捷函数：创建位置相关描述
export function formatPosition(pos: Position): string {
  return `(${pos.x}, ${pos.y}, ${pos.z})`;
}
