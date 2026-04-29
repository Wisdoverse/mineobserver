import { getSupabaseClient } from './supabase-client';
import type { Agent, AgentEvent, AgentWorldSnapshot } from './shared/schema';

// Agent 数据库操作
export const agentDb = {
  // 创建或更新 Agent
  upsert: async (agent: {
    id: string;
    username: string;
    server_host?: string;
    server_port?: number;
    last_status?: Record<string, unknown>;
    is_online: boolean;
  }) => {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    
    const { data, error } = await client
      .from('agents')
      .upsert(
        {
          id: agent.id,
          username: agent.username,
          server_host: agent.server_host,
          server_port: agent.server_port,
          last_status: agent.last_status,
          is_online: agent.is_online,
          last_seen_at: now,
          updated_at: now,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();
    
    if (error) throw new Error(`Agent upsert 失败: ${error.message}`);
    return data;
  },

  // 更新 Agent 在线状态
  updateOnlineStatus: async (agentId: string, isOnline: boolean) => {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    
    const { data, error } = await client
      .from('agents')
      .update({ is_online: isOnline, last_seen_at: now, updated_at: now })
      .eq('id', agentId)
      .select()
      .single();
    
    if (error) throw new Error(`更新 Agent 在线状态失败: ${error.message}`);
    return data;
  },

  // 更新 Agent 状态
  updateStatus: async (agentId: string, status: Record<string, unknown>) => {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    
    const { data, error } = await client
      .from('agents')
      .update({ last_status: status, last_seen_at: now, updated_at: now })
      .eq('id', agentId)
      .select()
      .single();
    
    if (error) throw new Error(`更新 Agent 状态失败: ${error.message}`);
    return data;
  },

  // 获取所有在线 Agent
  getOnlineAgents: async () => {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('agents')
      .select('*')
      .eq('is_online', true)
      .order('last_seen_at', { ascending: false });
    
    if (error) throw new Error(`获取在线 Agent 失败: ${error.message}`);
    return data as Agent[];
  },

  // 获取所有 Agent
  getAllAgents: async () => {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('agents')
      .select('*')
      .order('last_seen_at', { ascending: false });
    
    if (error) throw new Error(`获取所有 Agent 失败: ${error.message}`);
    return data as Agent[];
  },

  // 获取单个 Agent
  getAgent: async (agentId: string) => {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .maybeSingle();
    
    if (error) throw new Error(`获取 Agent 失败: ${error.message}`);
    return data as Agent | null;
  },

  // 删除 Agent
  delete: async (agentId: string) => {
    const client = getSupabaseClient();
    
    const { error } = await client
      .from('agents')
      .delete()
      .eq('id', agentId);
    
    if (error) throw new Error(`删除 Agent 失败: ${error.message}`);
  },
};

// Agent 事件数据库操作
export const agentEventDb = {
  // 添加事件
  insert: async (event: {
    agent_id: string;
    event_type: string;
    description?: string;
    event_data?: Record<string, unknown>;
  }) => {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('agent_events')
      .insert({
        agent_id: event.agent_id,
        event_type: event.event_type,
        description: event.description,
        event_data: event.event_data,
      })
      .select()
      .single();
    
    if (error) throw new Error(`插入事件失败: ${error.message}`);
    return data;
  },

  // 获取 Agent 的最近事件
  getRecentByAgent: async (agentId: string, limit = 50) => {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('agent_events')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(`获取事件失败: ${error.message}`);
    return data as AgentEvent[];
  },

  // 获取所有 Agent 的最近事件
  getRecentAll: async (limit = 100) => {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('agent_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(`获取事件失败: ${error.message}`);
    return data as AgentEvent[];
  },

  // 清理旧事件（保留最近 N 条）
  cleanupOldEvents: async (agentId: string, keepCount = 100) => {
    const client = getSupabaseClient();
    
    // 获取需要保留的事件 ID
    const { data: eventsToKeep, error: fetchError } = await client
      .from('agent_events')
      .select('id')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(keepCount);
    
    if (fetchError) throw new Error(`获取要保留的事件失败: ${fetchError.message}`);
    
    if (!eventsToKeep || eventsToKeep.length === 0) return;
    
    const keepIds = eventsToKeep.map((e: { id: number }) => e.id);
    
    // 如果没有要保留的事件，删除所有事件
    if (keepIds.length === 0) {
      const { error } = await client
        .from('agent_events')
        .delete()
        .eq('agent_id', agentId);
      
      if (error) throw new Error(`清理旧事件失败: ${error.message}`);
      return;
    }
    
    // 删除不在保留列表中的事件（使用 PostgreSQL 函数）
    const { error: rpcError } = await client.rpc('delete_events_except', {
      p_agent_id: agentId,
      p_keep_ids: keepIds,
    });
    if (rpcError) throw new Error(`清理旧事件失败: ${rpcError.message}`);
  },
};

// Agent 世界快照数据库操作
export const agentWorldSnapshotDb = {
  // 保存快照
  insert: async (snapshot: {
    agent_id: string;
    snapshot_data: Record<string, unknown>;
  }) => {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('agent_world_snapshots')
      .insert({
        agent_id: snapshot.agent_id,
        snapshot_data: snapshot.snapshot_data,
      })
      .select()
      .single();
    
    if (error) throw new Error(`保存世界快照失败: ${error.message}`);
    return data;
  },

  // 获取 Agent 的最新快照
  getLatestByAgent: async (agentId: string) => {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('agent_world_snapshots')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) throw new Error(`获取世界快照失败: ${error.message}`);
    return data as AgentWorldSnapshot | null;
  },

  // 获取 Agent 的最近快照
  getRecentByAgent: async (agentId: string, limit = 10) => {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('agent_world_snapshots')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(`获取世界快照失败: ${error.message}`);
    return data as AgentWorldSnapshot[];
  },

  // 清理旧快照（保留最近 N 条）
  cleanupOldSnapshots: async (agentId: string, keepCount = 20) => {
    const client = getSupabaseClient();
    
    // 获取需要保留的快照 ID
    const { data: snapshotsToKeep, error: fetchError } = await client
      .from('agent_world_snapshots')
      .select('id')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(keepCount);
    
    if (fetchError) throw new Error(`获取要保留的快照失败: ${fetchError.message}`);
    
    if (!snapshotsToKeep || snapshotsToKeep.length === 0) return;
    
    const keepIds = snapshotsToKeep.map((s: { id: number }) => s.id);
    
    // 删除不在保留列表中的快照（使用 PostgreSQL 函数）
    const { error: rpcError } = await client.rpc('delete_snapshots_except', {
      p_agent_id: agentId,
      p_keep_ids: keepIds,
    });
    if (rpcError) throw new Error(`清理旧快照失败: ${rpcError.message}`);
  },
};
