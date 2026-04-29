import { NextRequest, NextResponse } from 'next/server';
import { agentDb } from '@/storage/database/agent-db';

// GET /api/agents/[id]/vision - 获取 Agent 截图列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const visions = await agentDb.getAgentVision(id, limit);
    return NextResponse.json({ success: true, data: visions });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取截图列表失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
