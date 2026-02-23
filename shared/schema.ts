import { pgTable, text, serial, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'energy', 'stocks', 'traffic'
  data: json("data").notNull(), // Array of records
  createdAt: timestamp("created_at").defaultNow(),
});

export const forecasts = pgTable("forecasts", {
  id: serial("id").primaryKey(),
  datasetId: integer("dataset_id").notNull(),
  modelUsed: text("model_used").notNull(),
  targetVariable: text("target_variable").notNull(),
  features: json("features").notNull(), // Array of feature names
  horizon: integer("horizon").notNull(),
  forecastData: json("forecast_data").notNull(), // Array of { date, actual, predicted, lower_bound, upper_bound }
  metrics: json("metrics").notNull(), // MAE, RMSE, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDatasetSchema = createInsertSchema(datasets).omit({ id: true, createdAt: true });
export const insertForecastSchema = createInsertSchema(forecasts).omit({ id: true, createdAt: true });

export type Dataset = typeof datasets.$inferSelect;
export type InsertDataset = z.infer<typeof insertDatasetSchema>;

export type Forecast = typeof forecasts.$inferSelect;
export type InsertForecast = z.infer<typeof insertForecastSchema>;

export type GenerateForecastRequest = {
  datasetId: number;
  modelUsed: 'linear_regression' | 'random_forest';
  targetVariable: string;
  features: string[];
  horizon: number;
};
