import { db } from "./db";
import {
  datasets,
  models,
  type Dataset,
  type InsertDataset,
  type Model,
  type InsertModel,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getDatasets(): Promise<Dataset[]>;
  getDataset(id: number): Promise<Dataset | undefined>;
  createDataset(dataset: InsertDataset): Promise<Dataset>;
  
  getModels(): Promise<Model[]>;
  getModel(id: number): Promise<Model | undefined>;
  createModel(model: InsertModel): Promise<Model>;
}

export class DatabaseStorage implements IStorage {
  async getDatasets(): Promise<Dataset[]> {
    return await db.select().from(datasets);
  }

  async getDataset(id: number): Promise<Dataset | undefined> {
    const [dataset] = await db.select().from(datasets).where(eq(datasets.id, id));
    return dataset;
  }

  async createDataset(dataset: InsertDataset): Promise<Dataset> {
    const [created] = await db.insert(datasets).values(dataset).returning();
    return created;
  }

  async getModels(): Promise<Model[]> {
    return await db.select().from(models);
  }

  async getModel(id: number): Promise<Model | undefined> {
    const [model] = await db.select().from(models).where(eq(models.id, id));
    return model;
  }

  async createModel(model: InsertModel): Promise<Model> {
    const [created] = await db.insert(models).values(model).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
