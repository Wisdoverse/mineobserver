import { NextResponse } from 'next/server';
import { agentDb } from '@/storage/database/agent-db';
import { agentStateManager } from '@/ws-handlers/agent-state';

// GET /api/stats - 获取全局统计数据
export async function GET() {
  try {
    const [dbStats, onlineCount] = await Promise.all([
      agentDb.getGlobalStats(),
      Promise.resolve(agentStateManager.getOnlineAgentCount()),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...dbStats,
        onlineAgents: onlineCount,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取统计数据失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
