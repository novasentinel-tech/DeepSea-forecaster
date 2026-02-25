import { db } from "./db";
import { kpis, dataPoints, type Kpi, type DataPoint, type KpiWithData, type InsertKpi, type InsertDataPoint } from "@shared/schema";
import { eq, desc, and, lt, sql } from "drizzle-orm";

export class DatabaseStorage {
  async getKpis(): Promise<KpiWithData[]> {
    const allKpis = await db.select().from(kpis).orderBy(desc(kpis.id));
    const kpisWithData = await Promise.all(
      allKpis.map(kpi => this.getKpiWithData(kpi.id))
    );
    return kpisWithData.filter((k): k is KpiWithData => k !== null);
  }

  async getKpi(id: number): Promise<Kpi | undefined> {
    const [result] = await db.select().from(kpis).where(eq(kpis.id, id));
    return result;
  }

  async getKpiWithData(id: number): Promise<KpiWithData | null> {
    const kpi = await this.getKpi(id);
    if (!kpi) return null;

    const points = await db.select().from(dataPoints).where(eq(dataPoints.kpiId, id)).orderBy(desc(dataPoints.date));
    
    if (points.length === 0) {
      return { kpi, dataPoints: [], currentValue: null, previousValue: null, percentageChange: null };
    }

    const latestPoint = points[0];
    const previousPoint = points[1];

    const currentValue = Number(latestPoint.value);
    const previousValue = previousPoint ? Number(previousPoint.value) : null;
    
    let percentageChange: number | null = null;
    if(previousValue && previousValue !== 0) {
      percentageChange = ((currentValue - previousValue) / previousValue) * 100;
    } else if (previousValue === 0 && currentValue > 0) {
      percentageChange = 100;
    }
    
    return {
      kpi,
      dataPoints: points,
      currentValue,
      previousValue,
      percentageChange,
    };
  }

  async createKpi(data: InsertKpi): Promise<Kpi> {
    const [newKpi] = await db.insert(kpis).values(data).returning();
    return newKpi;
  }
  
  async createDataPoint(data: InsertDataPoint): Promise<DataPoint> {
    const [newDataPoint] = await db.insert(dataPoints).values(data).returning();
    return newDataPoint;
  }
}

export const storage = new DatabaseStorage();
