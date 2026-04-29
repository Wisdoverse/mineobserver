// Agent 状态管理器 - 服务端单例（带数据库持久化）

import type {
  AgentStatus,
  AgentEvent,
  EventType,
  Position,
  WorldSnapshot,
} from '@/lib/types/agent';
import { agentDb, agentEventDb, agentWorldSnapshotDb } from '@/storage/database/agent-db';

interface AgentState {
  status: AgentStatus;
  events: AgentEvent[];
  worldSnapshot: WorldSnapshot | null;
}

class AgentStateManager {
  private agents: Map<string, AgentState> = new Map();
  private maxEventsPerAgent = 100;
  private dbSyncInterval: NodeJS.Timeout | null = null;
  private pendingDbSyncs: Set<string> = new Set();

  constructor() {
    // 定期同步到数据库
    this.startDbSync();
  }

  // 启动定期数据库同步
  private startDbSync() {
    // 每 30 秒同步一次在线 Agent 的状态到数据库
    this.dbSyncInterval = setInterval(async () => {
      await this.syncAllToDb();
    }, 30000);
  }

  // 停止数据库同步
  public stop() {
    if (this.dbSyncInterval) {
      clearInterval(this.dbSyncInterval);
      this.dbSyncInterval = null;
    }
  }

  // 同步所有 Agent 到数据库
  private async syncAllToDb() {
    const agents = this.getAllAgents();
    for (const status of agents) {
      if (status.connected) {
        await this.syncAgentToDb(status.id);
      }
    }
  }

  // 同步单个 Agent 到数据库
  private async syncAgentToDb(agentId: string) {
    try {
      const status = this.getAgentStatus(agentId);
      if (!status) return;

      await agentDb.updateStatus(agentId, status as unknown as Record<string, unknown>);
      this.pendingDbSyncs.delete(agentId);
    } catch (error) {
      console.error(`同步 Agent ${agentId} 到数据库失败:`, error);
    }
  }

  // 注册新 Agent
  async register(agentId: string, username: string, serverHost: string, serverPort: number): Promise<AgentStatus> {
    // 检查是否是已注册的 Agent 重连
    const existingState = this.agents.get(agentId);
    if (existingState) {
      // Agent 重连：恢复在线状态，保留原有数据
      existingState.status.connected = true;
      existingState.status.username = username;
      existingState.status.world = serverHost;
      existingState.status.lastUpdated = Date.now();

      // 持久化在线状态到数据库
      try {
        await agentDb.upsert({
          id: agentId,
          username,
          server_host: serverHost,
          server_port: serverPort,
          last_status: existingState.status as unknown as Record<string, unknown>,
          is_online: true,
        });
      } catch (error) {
        console.error(`重连 Agent ${agentId} 更新数据库失败:`, error);
      }

      return existingState.status;
    }

    // 新 Agent 注册：创建默认状态
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

    // 持久化到数据库
    try {
      await agentDb.upsert({
        id: agentId,
        username,
        server_host: serverHost,
        server_port: serverPort,
        last_status: status as unknown as Record<string, unknown>,
        is_online: true,
      });
    } catch (error) {
      console.error(`注册 Agent ${agentId} 到数据库失败:`, error);
    }

    // 从数据库加载历史事件
    try {
      const events = await agentEventDb.getRecentByAgent(agentId, 100);
      const state = this.agents.get(agentId);
      if (state && events) {
        state.events = events.map((e) => ({
          id: String(e.id),
          agentId: e.agent_id,
          type: e.event_type as EventType,
          description: e.description || '',
          data: (e.event_data || {}) as Record<string, unknown>,
          timestamp: new Date(e.created_at).getTime(),
        }));
      }
    } catch (error) {
      console.error(`加载 Agent ${agentId} 历史事件失败:`, error);
    }

    return status;
  }

  // Agent 断开连接 - 标记离线，保留内存数据
  async disconnect(agentId: string): Promise<void> {
    const state = this.agents.get(agentId);
    if (state) {
      // 标记为离线，保留所有数据
      state.status.connected = false;
      state.status.lastUpdated = Date.now();
    }

    // 更新数据库中的在线状态
    try {
      await agentDb.updateOnlineStatus(agentId, false);
    } catch (error) {
      console.error(`更新 Agent ${agentId} 离线状态失败:`, error);
    }
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

    // 标记需要同步到数据库
    this.pendingDbSyncs.add(agentId);

    // 批量同步（每 5 秒或累积 10 个变更）
    if (this.pendingDbSyncs.size >= 10) {
      this.syncAgentToDb(agentId);
    }

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

    // 持久化到数据库（异步，不阻塞）
    this.persistEvent(agentId, event);

    return newEvent;
  }

  // 持久化事件到数据库
  private async persistEvent(agentId: string, event: Omit<AgentEvent, 'id' | 'timestamp'>) {
    try {
      await agentEventDb.insert({
        agent_id: agentId,
        event_type: event.type,
        description: event.description,
        event_data: event.data,
      });

      // 清理旧事件（保留 200 条）
      await agentEventDb.cleanupOldEvents(agentId, 200);
    } catch (error) {
      console.error(`持久化事件失败:`, error);
    }
  }

  // 更新世界快照
  updateWorldSnapshot(agentId: string, snapshot: WorldSnapshot): void {
    const state = this.agents.get(agentId);
    if (!state) return;
    state.worldSnapshot = snapshot;

    // 持久化到数据库（节流，每 10 秒保存一次）
    this.persistWorldSnapshot(agentId, snapshot);
  }

  // 节流：避免频繁保存世界快照
  private snapshotLastPersist: Map<string, number> = new Map();
  private async persistWorldSnapshot(agentId: string, snapshot: WorldSnapshot) {
    const now = Date.now();
    const lastTime = this.snapshotLastPersist.get(agentId) || 0;
    
    if (now - lastTime < 10000) return; // 至少 10 秒保存一次
    this.snapshotLastPersist.set(agentId, now);

    try {
      await agentWorldSnapshotDb.insert({
        agent_id: agentId,
        snapshot_data: snapshot as unknown as Record<string, unknown>,
      });

      // 清理旧快照（保留 30 条）
      await agentWorldSnapshotDb.cleanupOldSnapshots(agentId, 30);
    } catch (error) {
      console.error(`持久化世界快照失败:`, error);
    }
  }

  // 获取所有 Agent 状态
  getAllAgents(): AgentStatus[] {
    return Array.from(this.agents.values()).map((s) => s.status);
  }

  // 获取单个 Agent 状态
  getAgentStatus(agentId: string): AgentStatus | null {
    return this.agents.get(agentId)?.status ?? null;
  }

  // 检查 Agent 是否存在于内存中（包括离线的）
  hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  // 获取 Agent 事件
  getAgentEvents(agentId: string): AgentEvent[] {
    return this.agents.get(agentId)?.events ?? [];
  }

  // 获取世界快照
  getWorldSnapshot(agentId: string): WorldSnapshot | null {
    return this.agents.get(agentId)?.worldSnapshot ?? null;
  }

  // 获取连接数
  getAgentCount(): number {
    return this.agents.size;
  }

  // 从数据库加载所有 Agent（包括离线的，用于服务重启恢复）
  async loadFromDb(): Promise<void> {
    try {
      const allAgents = await agentDb.getAllAgents();
      
      for (const agent of allAgents) {
        const lastStatus = (agent.last_status || {}) as Record<string, unknown>;
        
        // 恢复内存状态
        const status: AgentStatus = {
          id: agent.id,
          username: agent.username,
          connected: agent.is_online, // 按数据库中的在线状态恢复
          position: (lastStatus.position as Position) || { x: 0, y: 64, z: 0 },
          health: (lastStatus.health as number) || 20,
          maxHealth: (lastStatus.maxHealth as number) || 20,
          food: (lastStatus.food as number) || 20,
          saturation: (lastStatus.saturation as number) || 5,
          gamemode: (lastStatus.gamemode as AgentStatus['gamemode']) || 'survival',
          inventory: (lastStatus.inventory as AgentStatus['inventory']) || [],
          equipment: (lastStatus.equipment as AgentStatus['equipment']) || {},
          world: agent.server_host || '',
          dimension: (lastStatus.dimension as string) || 'overworld',
          yaw: (lastStatus.yaw as number) || 0,
          pitch: (lastStatus.pitch as number) || 0,
          isOnGround: (lastStatus.isOnGround as boolean) ?? true,
          isSleeping: (lastStatus.isSleeping as boolean) ?? false,
          isSprinting: (lastStatus.isSprinting as boolean) ?? false,
          isSneaking: (lastStatus.isSneaking as boolean) ?? false,
          lastUpdated: agent.last_seen_at ? new Date(agent.last_seen_at).getTime() : Date.now(),
        };

        this.agents.set(agent.id, {
          status,
          events: [],
          worldSnapshot: null,
        });
      }

      console.log(`从数据库加载了 ${allAgents.length} 个 Agent（在线: ${allAgents.filter(a => a.is_online).length}）`);
    } catch (error) {
      console.error(`从数据库加载 Agent 失败:`, error);
    }
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
