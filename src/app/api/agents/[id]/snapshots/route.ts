import { NextRequest, NextResponse } from 'next/server';
import { agentDb } from '@/storage/database/agent-db';

// GET /api/agents/[id]/snapshots - 获取 Agent 世界快照列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const snapshots = await agentDb.getAgentSnapshots(id, limit);
    return NextResponse.json({ success: true, data: snapshots });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取快照列表失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
