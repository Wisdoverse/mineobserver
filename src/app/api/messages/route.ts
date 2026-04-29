import { NextRequest, NextResponse } from 'next/server';
import { agentDb } from '@/storage/database/agent-db';

// GET /api/messages - 获取最近聊天消息
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const channel = searchParams.get('channel') || undefined;

    const messages = await agentDb.getRecentMessages(limit, channel);
    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取消息列表失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
