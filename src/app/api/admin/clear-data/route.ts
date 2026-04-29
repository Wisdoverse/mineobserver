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
      // 1. 清空数据库
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

      // 2. 清空 WebSocket 服务端内存中的 Agent
      try {
        const wsUrl = `ws://localhost:${process.env.DEPLOY_RUN_PORT || 5000}/ws/agent`;
        const WebSocket = (await import("ws")).default;
        const ws = new WebSocket(wsUrl);

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error("WebSocket timeout"));
          }, 5000);

          ws.on("open", () => {
            ws.send(JSON.stringify({ type: "admin:clear", payload: { scope: "all" } }));
          });

          ws.on("message", (raw: Buffer) => {
            const msg = JSON.parse(raw.toString());
            if (msg.type === "admin:clear:ack") {
              clearTimeout(timeout);
              ws.close();
              resolve();
            }
          });

          ws.on("error", () => {
            clearTimeout(timeout);
            resolve(); // 不阻塞，数据库已清空即可
          });
        });
      } catch {
        // WebSocket 清理失败不影响数据库清理结果
        console.warn("Failed to clear WebSocket memory, but database is cleared");
      }

      return NextResponse.json({
        success: true,
        message: "已清空所有数据（Agent、事件、快照）并同步清除内存缓存",
      });
    }

    return NextResponse.json(
      { error: "无效的 scope 参数，可选值: events, all" },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
