import { NextRequest, NextResponse } from 'next/server';
import { agentDb } from '@/storage/database/agent-db';

// GET /api/agents - 获取所有 Agent 列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const online = searchParams.get('online');

    const agents = await agentDb.getAllAgents();

    // 过滤在线状态
    const filtered = online !== null
      ? agents.filter((a) => online === 'true' ? a.is_online : !a.is_online)
      : agents;

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取 Agent 列表失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
