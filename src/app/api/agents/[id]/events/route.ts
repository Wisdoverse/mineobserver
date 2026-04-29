import { NextRequest, NextResponse } from 'next/server';
import { agentDb } from '@/storage/database/agent-db';

// GET /api/agents/[id]/events - 获取 Agent 事件列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const eventType = searchParams.get('type') || undefined;

    const events = await agentDb.getAgentEvents(id, limit);
    const filtered = eventType
      ? events.filter((e) => e.event_type === eventType)
      : events;

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取事件列表失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
