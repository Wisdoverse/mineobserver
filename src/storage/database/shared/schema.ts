import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, boolean, jsonb, integer, index } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// Agent 基本信息表
export const agents = pgTable(
  "agents",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    username: varchar("username", { length: 64 }).notNull(),
    server_host: varchar("server_host", { length: 255 }),
    server_port: integer("server_port"),
    // 存储最新状态（位置、生命值、饥饿值、游戏模式等）
    last_status: jsonb("last_status"),
    // Agent 最后活跃时间
    last_seen_at: timestamp("last_seen_at", { withTimezone: true }),
    // 是否在线
    is_online: boolean("is_online").default(false).notNull(),
    // Agent 注册时间
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    // 最后更新时间
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("agents_username_idx").on(table.username),
    index("agents_is_online_idx").on(table.is_online),
    index("agents_last_seen_at_idx").on(table.last_seen_at),
  ]
);

// Agent 事件日志表
export const agentEvents = pgTable(
  "agent_events",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    agent_id: varchar("agent_id", { length: 64 }).notNull().references(() => agents.id, { onDelete: "cascade" }),
    event_type: varchar("event_type", { length: 64 }).notNull(),
    description: varchar("description", { length: 500 }),
    // 事件详情（JSONB 存储）
    event_data: jsonb("event_data"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("agent_events_agent_id_idx").on(table.agent_id),
    index("agent_events_event_type_idx").on(table.event_type),
    index("agent_events_created_at_idx").on(table.created_at),
  ]
);

// Agent 世界快照表（存储周围环境）
export const agentWorldSnapshots = pgTable(
  "agent_world_snapshots",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    agent_id: varchar("agent_id", { length: 64 }).notNull().references(() => agents.id, { onDelete: "cascade" }),
    // 快照数据（JSONB 存储方块和实体信息）
    snapshot_data: jsonb("snapshot_data").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("agent_world_snapshots_agent_id_idx").on(table.agent_id),
    index("agent_world_snapshots_created_at_idx").on(table.created_at),
  ]
);

// 创建插入 Schema
const { createInsertSchema: createAgentsInsertSchema } = createSchemaFactory({ coerce: { date: true } });
const { createInsertSchema: createAgentEventsInsertSchema } = createSchemaFactory({ coerce: { date: true } });
const { createInsertSchema: createAgentWorldSnapshotsInsertSchema } = createSchemaFactory({ coerce: { date: true } });

export const insertAgentSchema = createAgentsInsertSchema(agents).pick({
  id: true,
  username: true,
  server_host: true,
  server_port: true,
});

export const insertAgentEventSchema = createAgentEventsInsertSchema(agentEvents).pick({
  agent_id: true,
  event_type: true,
  description: true,
  event_data: true,
});

export const insertAgentWorldSnapshotSchema = createAgentWorldSnapshotsInsertSchema(agentWorldSnapshots).pick({
  agent_id: true,
  snapshot_data: true,
});

// 类型导出
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type AgentEvent = typeof agentEvents.$inferSelect;
export type InsertAgentEvent = z.infer<typeof insertAgentEventSchema>;
export type AgentWorldSnapshot = typeof agentWorldSnapshots.$inferSelect;
export type InsertAgentWorldSnapshot = z.infer<typeof insertAgentWorldSnapshotSchema>;
