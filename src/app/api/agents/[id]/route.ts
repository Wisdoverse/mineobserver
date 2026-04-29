import { NextRequest, NextResponse } from 'next/server';
import { agentDb } from '@/storage/database/agent-db';
import { agentStateManager } from '@/ws-handlers/agent-state';

// GET /api/agents/[id] - 获取单个 Agent 详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const liveStatus = agentStateManager.getAgentStatus(id);
    let dbAgent = null;

    try {
      dbAgent = await agentDb.getAgent(id);
    } catch {
      // Agent 不在数据库中，可能仅在内存中
    }

    const events = await agentDb.getAgentEvents(id, 50);

    // 如果数据库和内存都没有，返回 404
    if (!dbAgent && !liveStatus) {
      return NextResponse.json({ success: false, error: 'Agent 不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...dbAgent,
        liveStatus,
        recentEvents: events,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取 Agent 详情失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
