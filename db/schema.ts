import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const aiMonthlyUsage = sqliteTable("ai_monthly_usage", {
  monthKey: text("month_key").primaryKey().notNull(),
  requestCount: integer("request_count").notNull().default(0),
  reservedCostMicros: integer("reserved_cost_micros").notNull().default(0),
  actualCostMicros: integer("actual_cost_micros").notNull().default(0),
  inputTokens: integer("input_tokens").notNull().default(0),
  cachedInputTokens: integer("cached_input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const aiRateLimits = sqliteTable(
  "ai_rate_limits",
  {
    clientKey: text("client_key").notNull(),
    windowKey: text("window_key").notNull(),
    requestCount: integer("request_count").notNull().default(0),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.clientKey, table.windowKey] })],
);
