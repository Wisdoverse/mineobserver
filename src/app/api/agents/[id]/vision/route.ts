import { NextRequest, NextResponse } from 'next/server';
import { agentDb } from '@/storage/database/agent-db';
import type { VisionRecord } from '@/lib/types/agent';

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

    // 将 image_key/thumbnail_key 转换为代理 URL
    // Supabase 返回 snake_case，需要从原始数据中取
    const data = visions.map((v: VisionRecord) => ({
        ...v,
        image_url: v.imageKey ? `/api/vision-proxy?key=${encodeURIComponent(v.imageKey)}` : v.imageUrl,
        thumbnail_url: v.thumbnailKey ? `/api/vision-proxy?key=${encodeURIComponent(v.thumbnailKey)}` : v.thumbnailUrl,
      }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取截图列表失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
