import { pgTable, text, serial, integer, json, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  data: json("data").notNull(),
  fileHash: text("file_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  datasetId: integer("dataset_id").notNull(),
  datasetVersion: integer("dataset_version").default(1), // To be implemented based on hash changes
  algorithm: text("algorithm").notNull(),
  targetVariable: text("target_variable").notNull(),
  features: json("features").notNull(), // Array of feature names
  hyperparameters: json("hyperparameters"), // e.g., { "n_estimators": 100 }
  trainingDuration: real("training_duration"), // in seconds
  modelPath: text("model_path"), // Path to the serialized .pkl file
  horizon: integer("horizon").notNull(),
  forecastData: json("forecast_data").notNull(), // Stores the prediction made at training time
  metrics: json("metrics").notNull(), // MAE, RMSE, etc.
  status: text("status").default('completed'), // 'training', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
});


export const insertDatasetSchema = createInsertSchema(datasets).omit({ id: true, createdAt: true });
export const insertModelSchema = createInsertSchema(models).omit({ id: true, createdAt: true });

export type Dataset = typeof datasets.$inferSelect;
export type InsertDataset = z.infer<typeof insertDatasetSchema>;

export type Model = typeof models.$inferSelect;
export type InsertModel = z.infer<typeof insertModelSchema>;
