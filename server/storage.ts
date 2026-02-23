import { db } from "./db";
import {
  datasets,
  forecasts,
  type Dataset,
  type InsertDataset,
  type Forecast,
  type InsertForecast,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getDatasets(): Promise<Dataset[]>;
  getDataset(id: number): Promise<Dataset | undefined>;
  createDataset(dataset: InsertDataset): Promise<Dataset>;
  
  getForecasts(): Promise<Forecast[]>;
  getForecast(id: number): Promise<Forecast | undefined>;
  createForecast(forecast: InsertForecast): Promise<Forecast>;
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

  async getForecasts(): Promise<Forecast[]> {
    return await db.select().from(forecasts);
  }

  async getForecast(id: number): Promise<Forecast | undefined> {
    const [forecast] = await db.select().from(forecasts).where(eq(forecasts.id, id));
    return forecast;
  }

  async createForecast(forecast: InsertForecast): Promise<Forecast> {
    const [created] = await db.insert(forecasts).values(forecast).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
