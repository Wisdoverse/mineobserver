import { NextRequest, NextResponse } from 'next/server';
import { agentDb } from '@/storage/database/agent-db';

// GET /api/events - 获取全局事件流
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const type = searchParams.get('type') || undefined;

    const events = await agentDb.getAllEvents(limit, offset, type);
    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取事件流失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
