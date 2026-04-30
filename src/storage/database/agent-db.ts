import { getSupabaseClient } from './supabase-client';
import type { Agent, AgentEvent, AgentWorldSnapshot } from './shared/schema';
import type {
  VisionRecord,
  BuildRecord,
  SubscriptionRecord,
  TeamRecord,
  ChatMessageRecord,
  StatusUpdateRecord,
} from '@/lib/types/agent';

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
    stats?: Record<string, unknown>;
  }) => {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    
    const { data, error } = await client
      .from('agents')
      .upsert(
        {
          id: agent.id,
          username: agent.username,
          server_host: agent.server_host || null,
          server_port: agent.server_port || null,
          last_status: agent.last_status || {},
          is_online: agent.is_online,
          last_seen_at: now,
          updated_at: now,
          stats: agent.stats || {},
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw new Error(`upsert Agent 失败: ${error.message}`);
    return data as Agent;
  },

  // 获取所有 Agent
  getAllAgents: async () => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`获取 Agent 列表失败: ${error.message}`);
    return data as Agent[];
  },

  // 获取单个 Agent
  getAgent: async (id: string) => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`获取 Agent 失败: ${error.message}`);
    return data as Agent;
  },

  // 更新 Agent 在线状态
  updateOnlineStatus: async (id: string, isOnline: boolean) => {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const { error } = await client
      .from('agents')
      .update({ is_online: isOnline, last_seen_at: now, updated_at: now })
      .eq('id', id);

    if (error) throw new Error(`更新 Agent 在线状态失败: ${error.message}`);
  },

  // 插入事件
  insertEvent: async (event: {
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
        description: event.description || null,
        event_data: event.event_data || null,
      })
      .select()
      .single();

    if (error) throw new Error(`插入事件失败: ${error.message}`);
    return data as AgentEvent;
  },

  // 获取 Agent 事件
  getAgentEvents: async (agentId: string, limit: number = 50) => {
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

  // 获取所有事件（全局）
  getAllEvents: async (limit: number = 100, offset: number = 0, eventType?: string) => {
    const client = getSupabaseClient();
    let query = client
      .from('agent_events')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;
    if (error) throw new Error(`获取事件列表失败: ${error.message}`);
    return data as AgentEvent[];
  },

  // 插入世界快照
  insertWorldSnapshot: async (snapshot: {
    agent_id: string;
    blocks: unknown[];
    entities: unknown[];
  }) => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('agent_world_snapshots')
      .insert({
        agent_id: snapshot.agent_id,
        snapshot_data: { blocks: snapshot.blocks, entities: snapshot.entities },
      })
      .select()
      .single();

    if (error) throw new Error(`插入世界快照失败: ${error.message}`);
    return data as AgentWorldSnapshot;
  },

  // 获取 Agent 世界快照
  getAgentSnapshots: async (agentId: string, limit: number = 10) => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('agent_world_snapshots')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`获取快照失败: ${error.message}`);
    return data as AgentWorldSnapshot[];
  },

  // 清理旧事件（保留最近 N 条）
  cleanupOldEvents: async (agentId: string, keepCount: number = 200) => {
    const client = getSupabaseClient();
    
    const { data: eventsToKeep, error: fetchError } = await client
      .from('agent_events')
      .select('id')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(keepCount);

    if (fetchError) throw new Error(`获取要保留的事件失败: ${fetchError.message}`);
    
    if (!eventsToKeep || eventsToKeep.length === 0) return;
    
    const keepIds = eventsToKeep.map((s: { id: number }) => s.id);
    
    const { data: allEvents, error: allError } = await client
      .from('agent_events')
      .select('id')
      .eq('agent_id', agentId);
    
    if (allError) throw new Error(`获取所有事件失败: ${allError.message}`);
    
    const idsToDelete = (allEvents as { id: number }[])
      .map((s) => s.id)
      .filter((id) => !keepIds.includes(id));
    
    if (idsToDelete.length === 0) return;
    
    for (let i = 0; i < idsToDelete.length; i += 100) {
      const batch = idsToDelete.slice(i, i + 100);
      const { error } = await client
        .from('agent_events')
        .delete()
        .in('id', batch);
      if (error) throw new Error(`清理旧事件失败: ${error.message}`);
    }
  },

  // 清理旧快照（保留最近 N 条）
  cleanupOldSnapshots: async (agentId: string, keepCount: number = 30) => {
    const client = getSupabaseClient();
    
    const { data: snapshotsToKeep, error: fetchError } = await client
      .from('agent_world_snapshots')
      .select('id')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(keepCount);

    if (fetchError) throw new Error(`获取要保留的快照失败: ${fetchError.message}`);
    
    if (!snapshotsToKeep || snapshotsToKeep.length === 0) return;
    
    const keepIds = snapshotsToKeep.map((s: { id: number }) => s.id);
    
    const { data: allSnapshots, error: allError } = await client
      .from('agent_world_snapshots')
      .select('id')
      .eq('agent_id', agentId);
    
    if (allError) throw new Error(`获取所有快照失败: ${allError.message}`);
    
    const idsToDelete = (allSnapshots as { id: number }[])
      .map((s) => s.id)
      .filter((id) => !keepIds.includes(id));
    
    if (idsToDelete.length === 0) return;
    
    for (let i = 0; i < idsToDelete.length; i += 100) {
      const batch = idsToDelete.slice(i, i + 100);
      const { error } = await client
        .from('agent_world_snapshots')
        .delete()
        .in('id', batch);
      if (error) throw new Error(`清理旧快照失败: ${error.message}`);
    }
  },

  // ============ 新增数据库操作 ============

  // --- Vision 截图 ---
  insertVision: async (vision: {
    agent_id: string;
    capture_id: string;
    image_key: string;
    thumbnail_key?: string;
    dimensions: { width: number; height: number };
    position: { x: number; y: number; z: number };
    facing?: { yaw: number; pitch: number };
    description?: string;
    scene_info?: Record<string, unknown>;
    size_bytes?: number;
  }) => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('agent_vision')
      .insert({
        agent_id: vision.agent_id,
        capture_id: vision.capture_id,
        image_key: vision.image_key,
        thumbnail_key: vision.thumbnail_key || null,
        image_url: vision.image_key,
        thumbnail_url: vision.thumbnail_key || null,
        dimensions: vision.dimensions,
        position: vision.position,
        facing: vision.facing || null,
        description: vision.description || null,
        scene_info: vision.scene_info || null,
        size_bytes: vision.size_bytes || null,
      })
      .select()
      .single();

    if (error) throw new Error(`插入截图记录失败: ${error.message}`);
    return data;
  },

  getAgentVision: async (agentId: string, limit: number = 20) => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('agent_vision')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`获取截图列表失败: ${error.message}`);
    return data as VisionRecord[];
  },

  cleanupOldVision: async (agentId: string, keepCount: number = 50) => {
    const client = getSupabaseClient();
    const { data: toKeep, error: fetchError } = await client
      .from('agent_vision')
      .select('id')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(keepCount);

    if (fetchError) throw new Error(`获取要保留的截图失败: ${fetchError.message}`);
    if (!toKeep || toKeep.length === 0) return;

    const keepIds = toKeep.map((s: { id: number }) => s.id);
    const { data: all, error: allError } = await client
      .from('agent_vision')
      .select('id')
      .eq('agent_id', agentId);

    if (allError) throw new Error(`获取所有截图失败: ${allError.message}`);

    const idsToDelete = (all as { id: number }[]).map((s) => s.id).filter((id) => !keepIds.includes(id));
    if (idsToDelete.length === 0) return;

    for (let i = 0; i < idsToDelete.length; i += 100) {
      const batch = idsToDelete.slice(i, i + 100);
      const { error } = await client.from('agent_vision').delete().in('id', batch);
      if (error) throw new Error(`清理旧截图失败: ${error.message}`);
    }
  },

  // --- Build 建造进度 ---
  upsertBuild: async (build: {
    agent_id: string;
    build_id: string;
    blueprint_name: string;
    status: string;
    progress: number;
    current_layer?: number;
    total_layers?: number;
    blocks_placed: number;
    blocks_total: number;
    materials_used?: unknown[];
    started_at: string;
    estimated_completion?: string;
    errors?: string[];
  }) => {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      agent_id: build.agent_id,
      blueprint_name: build.blueprint_name,
      status: build.status,
      progress: build.progress,
      current_layer: build.current_layer || null,
      total_layers: build.total_layers || null,
      blocks_placed: build.blocks_placed,
      blocks_total: build.blocks_total,
      materials_used: build.materials_used || null,
      estimated_completion: build.estimated_completion || null,
      errors: build.errors || null,
      updated_at: now,
    };

    if (build.status === 'completed' || build.status === 'failed') {
      updateData.completed_at = now;
    }

    const { data, error } = await client
      .from('agent_builds')
      .upsert(
        {
          build_id: build.build_id,
          ...updateData,
          started_at: build.started_at,
        },
        { onConflict: 'build_id' }
      )
      .select()
      .single();

    if (error) throw new Error(`upsert 建造进度失败: ${error.message}`);
    return data;
  },

  getAgentBuilds: async (agentId: string, limit: number = 20) => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('agent_builds')
      .select('*')
      .eq('agent_id', agentId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`获取建造进度失败: ${error.message}`);
    return data as BuildRecord[];
  },

  cleanupOldBuilds: async (agentId: string, keepCount: number = 20) => {
    const client = getSupabaseClient();
    const { data } = await client
      .from('agent_builds')
      .select('id')
      .eq('agent_id', agentId)
      .order('updated_at', { ascending: false })
      .range(keepCount, keepCount + 99);

    if (data && data.length > 0) {
      const idsToDelete = data.map((r: { id: number }) => r.id);
      await client.from('agent_builds').delete().in('id', idsToDelete);
    }
  },

  // --- Subscription 事件订阅 ---
  upsertSubscription: async (sub: {
    agent_id: string;
    subscription_id: string;
    events: string[];
    filter?: Record<string, unknown>;
    callback_url?: string;
    status: string;
  }) => {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const { data, error } = await client
      .from('agent_subscriptions')
      .upsert(
        {
          subscription_id: sub.subscription_id,
          agent_id: sub.agent_id,
          events: sub.events,
          filter: sub.filter || null,
          callback_url: sub.callback_url || null,
          status: sub.status,
          updated_at: now,
        },
        { onConflict: 'subscription_id' }
      )
      .select()
      .single();

    if (error) throw new Error(`upsert 订阅失败: ${error.message}`);
    return data;
  },

  getAgentSubscriptions: async (agentId: string) => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('agent_subscriptions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'active');

    if (error) throw new Error(`获取订阅列表失败: ${error.message}`);
    return data as SubscriptionRecord[];
  },

  // --- Team 团队 ---
  upsertTeam: async (team: {
    team_id: string;
    team_name: string;
    leader_agent_id: string;
    members: unknown[];
    task?: unknown;
    status: string;
  }) => {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const { data, error } = await client
      .from('agent_teams')
      .upsert(
        {
          team_id: team.team_id,
          team_name: team.team_name,
          leader_agent_id: team.leader_agent_id,
          members: team.members,
          task: team.task || null,
          status: team.status,
          updated_at: now,
        },
        { onConflict: 'team_id' }
      )
      .select()
      .single();

    if (error) throw new Error(`upsert 团队失败: ${error.message}`);
    return data;
  },

  getTeam: async (teamId: string) => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('agent_teams')
      .select('*')
      .eq('team_id', teamId)
      .single();

    if (error) throw new Error(`获取团队失败: ${error.message}`);
    return data as TeamRecord;
  },

  // --- Chat 消息 ---
  insertMessage: async (msg: {
    message_id: string;
    agent_id: string;
    content: string;
    channel: string;
    recipient?: string;
    sender: unknown;
    mentioned_agents?: unknown[];
  }) => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('agent_messages')
      .insert({
        message_id: msg.message_id,
        agent_id: msg.agent_id,
        content: msg.content,
        channel: msg.channel,
        recipient: msg.recipient || null,
        sender: msg.sender,
        mentioned_agents: msg.mentioned_agents || null,
      })
      .select()
      .single();

    if (error) throw new Error(`插入消息失败: ${error.message}`);
    return data;
  },

  cleanupOldMessages: async (agentId: string, keepCount: number = 100) => {
    const client = getSupabaseClient();
    const { data } = await client
      .from('agent_messages')
      .select('id')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .range(keepCount, keepCount + 99);

    if (data && data.length > 0) {
      const idsToDelete = data.map((r: { id: number }) => r.id);
      await client.from('agent_messages').delete().in('id', idsToDelete);
    }
  },

  getAgentMessages: async (agentId: string, limit: number = 50) => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('agent_messages')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`获取消息列表失败: ${error.message}`);
    return data as ChatMessageRecord[];
  },

  getRecentMessages: async (limit: number = 100, channel?: string) => {
    const client = getSupabaseClient();
    let query = client
      .from('agent_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (channel) {
      query = query.eq('channel', channel);
    }

    const { data, error } = await query;
    if (error) throw new Error(`获取最近消息失败: ${error.message}`);
    return data as ChatMessageRecord[];
  },



  // --- Status Updates 轨迹 ---
  insertStatusUpdate: async (update: {
    agent_id: string;
    position: { x: number; y: number; z: number };
    health?: number;
    food?: number;
    dimension?: string;
  }) => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('agent_status_updates')
      .insert({
        agent_id: update.agent_id,
        position: update.position,
        health: update.health ?? null,
        food: update.food ?? null,
        dimension: update.dimension ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(`插入状态更新失败: ${error.message}`);
    return data;
  },

  getAgentTrajectory: async (agentId: string, limit: number = 500) => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('agent_status_updates')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw new Error(`获取轨迹数据失败: ${error.message}`);
    return data as StatusUpdateRecord[];
  },

  cleanupOldStatusUpdates: async (agentId: string, keepCount: number = 1000) => {
    const client = getSupabaseClient();
    const { data: toKeep, error: fetchError } = await client
      .from('agent_status_updates')
      .select('id')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(keepCount);

    if (fetchError) throw new Error(`获取要保留的状态更新失败: ${fetchError.message}`);
    if (!toKeep || toKeep.length === 0) return;

    const keepIds = toKeep.map((s: { id: number }) => s.id);
    const { data: all, error: allError } = await client
      .from('agent_status_updates')
      .select('id')
      .eq('agent_id', agentId);

    if (allError) throw new Error(`获取所有状态更新失败: ${allError.message}`);
    const idsToDelete = (all as { id: number }[]).map((s) => s.id).filter((id) => !keepIds.includes(id));
    if (idsToDelete.length === 0) return;

    for (let i = 0; i < idsToDelete.length; i += 100) {
      const batch = idsToDelete.slice(i, i + 100);
      const { error } = await client.from('agent_status_updates').delete().in('id', batch);
      if (error) throw new Error(`清理旧状态更新失败: ${error.message}`);
    }
  },

  // --- Stats 统计 ---
  getGlobalStats: async () => {
    const client = getSupabaseClient();
    const [agentsRes, eventsRes, buildsRes, teamsRes] = await Promise.all([
      client.from('agents').select('id, is_online', { count: 'exact', head: false }),
      client.from('agent_events').select('id', { count: 'exact', head: true }),
      client.from('agent_builds').select('id, status', { count: 'exact', head: false }),
      client.from('agent_teams').select('id', { count: 'exact', head: true }),
    ]);

    const onlineAgents = (agentsRes.data || []).filter((a: { is_online: boolean }) => a.is_online).length;
    const totalAgents = (agentsRes.data || []).length;
    const totalEvents = eventsRes.count || 0;
    const activeBuilds = (buildsRes.data || []).filter((b: { status: string }) => b.status === 'in_progress').length;
    const totalBuilds = (buildsRes.data || []).length;
    const totalTeams = teamsRes.count || 0;

    return {
      onlineAgents,
      totalAgents,
      totalEvents,
      activeBuilds,
      totalBuilds,
      totalTeams,
    };
  },

  // --- Leaderboard 排行榜 ---
  getLeaderboard: async (metric: string = 'blocks_placed', limit: number = 10) => {
    const client = getSupabaseClient();
    // 根据 metric 从 events 表聚合统计
    const { data, error } = await client
      .from('agent_events')
      .select('agent_id, event_type')
      .in('event_type', ['block_broken', 'block_placed', 'item_crafted', 'entity_death', 'died']);

    if (error) throw new Error(`获取排行榜数据失败: ${error.message}`);

    // 聚合统计
    const stats: Record<string, Record<string, number>> = {};
    for (const evt of data as Array<{ agent_id: string; event_type: string }>) {
      if (!stats[evt.agent_id]) stats[evt.agent_id] = {};
      stats[evt.agent_id][evt.event_type] = (stats[evt.agent_id][evt.event_type] || 0) + 1;
    }

    // 获取 agent 用户名
    const agentIds = Object.keys(stats);
    const { data: agentsData } = await client
      .from('agents')
      .select('id, username')
      .in('id', agentIds);

    const agentMap: Record<string, string> = {};
    for (const a of (agentsData || []) as Array<{ id: string; username: string }>) {
      agentMap[a.id] = a.username;
    }

    // 排序
    const eventMap: Record<string, string> = {
      'blocks_broken': 'block_broken',
      'blocks_placed': 'block_placed',
      'items_crafted': 'item_crafted',
      'entities_killed': 'entity_death',
      'deaths': 'died',
    };

    const sortKey = eventMap[metric] || metric;
    const leaderboard = agentIds
      .map((id) => ({
        agentId: id,
        username: agentMap[id] || id,
        value: stats[id][sortKey] || 0,
        stats: stats[id],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);

    return leaderboard;
  },

  // --- 清空数据 ---
  clearAllData: async (scope: string = 'all') => {
    const client = getSupabaseClient();
    const tables = scope === 'events'
      ? ['agent_events', 'agent_world_snapshots', 'agent_vision', 'agent_messages', 'agent_status_updates', 'agent_builds', 'agent_subscriptions']
      : ['agent_events', 'agent_world_snapshots', 'agent_vision', 'agent_messages', 'agent_status_updates', 'agent_builds', 'agent_subscriptions', 'agent_teams', 'agents'];

    for (const table of tables) {
      const { error } = await client.from(table).delete().neq('id', 0);
      if (error && !error.message.includes('no rows')) {
        console.warn(`清空表 ${table} 时出错: ${error.message}`);
      }
    }
  },
};
