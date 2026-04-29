import type { AgentStatus, AgentEvent, WorldSnapshot, Position } from '@/lib/types/agent';
import { agentDb } from '@/storage/database/agent-db';

interface AgentState {
  status: AgentStatus;
  events: AgentEvent[];
  worldSnapshot: WorldSnapshot | null;
  // 新增：内存中的建造/订阅/团队数据
  builds: Map<string, unknown>;
  subscriptions: Map<string, unknown>;
}

class AgentStateManager {
  private agents: Map<string, AgentState> = new Map();

  // 注册 Agent
  register(agentId: string, data: {
    id: string;
    username: string;
    connected: boolean;
    serverHost?: string;
    serverPort?: number;
  }) {
    const existing = this.agents.get(agentId);
    if (existing) {
      // 重连：恢复在线状态
      existing.status.connected = true;
      existing.status.lastUpdated = Date.now();
    } else {
      // 新注册
      this.agents.set(agentId, {
        status: {
          id: agentId,
          username: data.username,
          connected: true,
          position: { x: 0, y: 64, z: 0 },
          health: 20,
          maxHealth: 20,
          food: 20,
          saturation: 5,
          gamemode: 'survival',
          inventory: [],
          equipment: {},
          world: data.serverHost || '',
          dimension: 'overworld',
          yaw: 0,
          pitch: 0,
          isOnGround: true,
          isSleeping: false,
          isSprinting: false,
          isSneaking: false,
          lastUpdated: Date.now(),
        },
        events: [],
        worldSnapshot: null,
        builds: new Map(),
        subscriptions: new Map(),
      });
    }

    // 持久化到数据库
    this.persistAgent(agentId);
  }

  // 断开连接（不删除内存数据）
  disconnect(agentId: string) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status.connected = false;
      agent.status.lastUpdated = Date.now();
    }

    // 更新数据库在线状态
    agentDb.updateOnlineStatus(agentId, false).catch((err) => {
      console.error(`更新 Agent ${agentId} 离线状态失败:`, err);
    });
  }

  // 更新 Agent 状态（支持部分更新）
  updateStatus(agentId: string, update: Partial<AgentStatus>): AgentStatus | null {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    // 合并更新
    Object.assign(agent.status, update, { lastUpdated: Date.now() });

    // 异步持久化
    this.persistAgent(agentId);

    return agent.status;
  }

  // 添加事件
  addEvent(agentId: string, event: Omit<AgentEvent, 'id' | 'timestamp'>): AgentEvent | null {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    const fullEvent: AgentEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };

    // 内存中保留最近 100 条事件
    agent.events.unshift(fullEvent);
    if (agent.events.length > 100) {
      agent.events = agent.events.slice(0, 100);
    }

    // 异步持久化事件
    this.persistEvent(agentId, fullEvent);

    return fullEvent;
  }

  // 更新世界快照
  updateWorldSnapshot(agentId: string, snapshot: WorldSnapshot) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.worldSnapshot = snapshot;

    // 异步持久化
    this.persistWorldSnapshot(agentId, snapshot);
  }

  // 获取所有 Agent 状态
  getAllAgents(): AgentStatus[] {
    return Array.from(this.agents.values())
      .filter((s) => s.status != null)
      .map((s) => s.status);
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

  // 获取在线 Agent 数
  getOnlineAgentCount(): number {
    return Array.from(this.agents.values()).filter((s) => s.status.connected).length;
  }

  // 清空所有内存数据
  clearAll(): number {
    const count = this.agents.size;
    this.agents.clear();
    return count;
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
          builds: new Map(),
          subscriptions: new Map(),
        });
      }

      console.log(`从数据库加载了 ${allAgents.length} 个 Agent（在线: ${allAgents.filter(a => a.is_online).length}）`);
    } catch (error) {
      console.error(`从数据库加载 Agent 失败:`, error);
    }
  }

  // ============ 私有方法：持久化 ============

  private async persistAgent(agentId: string) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    try {
      await agentDb.upsert({
        id: agentId,
        username: agent.status.username,
        server_host: agent.status.world || undefined,
        last_status: agent.status as unknown as Record<string, unknown>,
        is_online: agent.status.connected,
      });
    } catch (error) {
      console.error(`持久化 Agent ${agentId} 失败:`, error);
    }
  }

  private async persistEvent(agentId: string, event: AgentEvent) {
    try {
      await agentDb.insertEvent({
        agent_id: agentId,
        event_type: event.type,
        description: event.description,
        event_data: event.data,
      });
    } catch (error) {
      console.error(`持久化事件失败:`, error);
      // 外键约束失败时，尝试先 upsert Agent
      if (error instanceof Error && error.message.includes('foreign key')) {
        try {
          await this.persistAgent(agentId);
          await agentDb.insertEvent({
            agent_id: agentId,
            event_type: event.type,
            description: event.description,
            event_data: event.data,
          });
        } catch (retryError) {
          console.error(`重试持久化事件失败:`, retryError);
        }
      }
    }
  }

  private async persistWorldSnapshot(agentId: string, snapshot: WorldSnapshot) {
    try {
      await agentDb.insertWorldSnapshot({
        agent_id: agentId,
        blocks: snapshot.blocks,
        entities: snapshot.entities,
      });
    } catch (error) {
      console.error(`持久化世界快照失败:`, error);
    }
  }
}

// 单例导出
export const agentStateManager = new AgentStateManager();
