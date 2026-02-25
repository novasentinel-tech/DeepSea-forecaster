import express from "express";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export function registerRoutes() {
  const router = express.Router();

  // Get all KPIs with their data
  router.get(api.kpis.list.path, async (req, res) => {
    const kpis = await storage.getKpis();
    res.json(kpis);
  });

  // Get a single KPI by ID
  router.get(api.kpis.get.path, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    const kpi = await storage.getKpiWithData(id);
    if (!kpi) {
      return res.status(404).json({ message: "KPI not found" });
    }
    res.json(kpi);
  });

  // Create a new KPI
  router.post(api.kpis.create.path, async (req, res, next) => {
    try {
      const kpiData = api.kpis.create.input.parse(req.body);
      const newKpi = await storage.createKpi(kpiData);
      res.status(201).json(newKpi);
    } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: error.errors[0].message });
        }
        next(error);
    }
  });

  // Add a new data point
  router.post(api.dataPoints.create.path, async (req, res, next) => {
    try {
      const dataPointData = api.dataPoints.create.input.parse(req.body);
      const newDataPoint = await storage.createDataPoint(dataPointData);
      res.status(201).json(newDataPoint);
    } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: error.errors[0].message });
        }
        next(error);
    }
  });
  
  seedDatabase().catch(console.error);

  return router;
}

// Seed the database with some example data if it's empty
async function seedDatabase() {
  const kpis = await storage.getKpis();
  if (kpis.length === 0) {
    console.log("Seeding database with example KPIs...");
    const mrr = await storage.createKpi({ name: "Monthly Recurring Revenue", category: "Financial", format: "currency", description: "The predictable recurring revenue a company can expect to receive every month." });
    const dau = await storage.createKpi({ name: "Daily Active Users", category: "Engagement", format: "number", description: "The number of unique users who engage with the product in a day." });
    const churn = await storage.createKpi({ name: "Customer Churn Rate", category: "Sales", format: "percentage", description: "The rate at which customers stop doing business with a company." });
    
    // Seed MRR data
    let currentMrr = 42000;
    for (let i = 90; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        currentMrr += (Math.random() - 0.4) * 500;
        await storage.createDataPoint({ kpiId: mrr.id, value: currentMrr.toFixed(2), date });
    }
    
    // Seed DAU data
    let currentDau = 1200;
     for (let i = 90; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        currentDau += (Math.random() - 0.5) * 50 + (date.getDay() >= 5 ? 100 : -50);
        await storage.createDataPoint({ kpiId: dau.id, value: Math.round(currentDau).toString(), date });
    }
    
    // Seed Churn data
    let currentChurn = 5.5;
     for (let i = 90; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        currentChurn += (Math.random() - 0.5) * 0.2;
        if(currentChurn < 1) currentChurn = 1.1;
        await storage.createDataPoint({ kpiId: churn.id, value: currentChurn.toFixed(2), date });
    }
    console.log("Database seeded.");
  }
}
