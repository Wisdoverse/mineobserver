import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scope } = body as { scope: "events" | "all" };

    // 动态导入以使用 supabase-client 的环境变量加载逻辑
    const { getSupabaseClient } = await import("@/storage/database/supabase-client");
    const supabase = getSupabaseClient();

    if (scope === "events") {
      // 只清空事件和快照，保留 Agent
      const [eventsRes, snapshotsRes] = await Promise.all([
        supabase.from("agent_events").delete().gte("id", 0),
        supabase.from("agent_world_snapshots").delete().gte("id", 0),
      ]);

      if (eventsRes.error || snapshotsRes.error) {
        return NextResponse.json(
          { error: `清理失败: ${eventsRes.error?.message || snapshotsRes.error?.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "已清空所有事件和快照数据",
      });
    }

    if (scope === "all") {
      // 清空所有数据：事件 → 快照 → Agent（按外键依赖顺序）
      const [eventsRes, snapshotsRes] = await Promise.all([
        supabase.from("agent_events").delete().gte("id", 0),
        supabase.from("agent_world_snapshots").delete().gte("id", 0),
      ]);

      if (eventsRes.error || snapshotsRes.error) {
        return NextResponse.json(
          { error: `清理事件/快照失败: ${eventsRes.error?.message || snapshotsRes.error?.message}` },
          { status: 500 }
        );
      }

      const agentsRes = await supabase.from("agents").delete().gte("id", 0);
      if (agentsRes.error) {
        return NextResponse.json(
          { error: `清理 Agent 失败: ${agentsRes.error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "已清空所有数据（Agent、事件、快照）",
      });
    }

    return NextResponse.json(
      { error: "无效的 scope 参数，支持: events | all" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[API] clear-data error:", err);
    const message = err instanceof Error ? err.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
