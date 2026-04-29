import { NextRequest, NextResponse } from 'next/server';
import { agentDb } from '@/storage/database/agent-db';

// GET /api/agents/[id]/builds - 获取 Agent 建造进度
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const builds = await agentDb.getAgentBuilds(id, limit);
    return NextResponse.json({ success: true, data: builds });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取建造进度失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
