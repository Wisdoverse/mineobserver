import { NextRequest, NextResponse } from 'next/server';
import { agentDb } from '@/storage/database/agent-db';

// GET /api/leaderboard - 获取排行榜
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get('metric') || 'blocks_placed';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const leaderboard = await agentDb.getLeaderboard(metric, limit);
    return NextResponse.json({ success: true, data: leaderboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取排行榜失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
