import { pgTable, text, serial, numeric, timestamp, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const kpis = pgTable("kpis", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  format: varchar("format", { length: 50 }).default("number").notNull(), // 'number', 'currency', 'percentage'
});

export const dataPoints = pgTable("data_points", {
  id: serial("id").primaryKey(),
  kpiId: integer("kpi_id").references(() => kpis.id, { onDelete: "cascade" }).notNull(),
  value: numeric("value").notNull(),
  date: timestamp("date").notNull(),
});

export const insertKpiSchema = createInsertSchema(kpis, {
  name: z.string().min(3, "Name must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
}).omit({ id: true });

export const insertDataPointSchema = createInsertSchema(dataPoints).omit({ id: true });

export type Kpi = typeof kpis.$inferSelect;
export type InsertKpi = z.infer<typeof insertKpiSchema>;

export type DataPoint = typeof dataPoints.$inferSelect;
export type InsertDataPoint = z.infer<typeof insertDataPointSchema>;

// Custom type for API responses
export type KpiWithData = {
  kpi: Kpi;
  dataPoints: DataPoint[];
  currentValue: number | null;
  previousValue: number | null;
  percentageChange: number | null;
};

export const CreateKpiRequest = insertKpiSchema;
export const CreateKpiDataPointRequest = insertDataPointSchema;
