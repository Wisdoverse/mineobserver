import { NextRequest, NextResponse } from 'next/server';
import { agentDb } from '@/storage/database/agent-db';

// GET /api/agents/[id]/trajectory - 获取 Agent 移动轨迹
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    const trajectory = await agentDb.getAgentTrajectory(id, limit);
    return NextResponse.json({ success: true, data: trajectory });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取轨迹数据失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
