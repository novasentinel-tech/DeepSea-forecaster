import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { spawn } from "child_process";
import path from "path";

// Helper to run python script
async function runForecastModel(inputData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'server', 'forecast.py');
    const pythonProcess = spawn('.venv/bin/python', [scriptPath]);
    
    let stdoutData = '';
    let stderrData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed: ${stderrData}`));
      } else {
        try {
          resolve(JSON.parse(stdoutData));
        } catch (e) {
          reject(new Error(`Failed to parse python output: ${stdoutData}`));
        }
      }
    });
    
    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.datasets.list.path, async (req, res) => {
    const items = await storage.getDatasets();
    res.json(items);
  });

  app.get(api.datasets.get.path, async (req, res) => {
    const item = await storage.getDataset(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Dataset not found' });
    }
    res.json(item);
  });

  app.post(api.datasets.create.path, async (req, res) => {
    try {
      const input = api.datasets.create.input.parse(req.body);
      const item = await storage.createDataset(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get(api.forecasts.list.path, async (req, res) => {
    const items = await storage.getForecasts();
    res.json(items);
  });

  app.get(api.forecasts.get.path, async (req, res) => {
    const item = await storage.getForecast(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Forecast not found' });
    }
    res.json(item);
  });

  app.post(api.forecasts.generate.path, async (req, res) => {
    try {
      const input = api.forecasts.generate.input.parse(req.body);
      
      const dataset = await storage.getDataset(input.datasetId);
      if (!dataset) {
        return res.status(404).json({ message: 'Dataset not found' });
      }

      // Run python model
      const result = await runForecastModel({
        data: dataset.data,
        targetVariable: input.targetVariable,
        features: input.features,
        modelUsed: input.modelUsed,
        horizon: input.horizon
      });

      // Save forecast
      const forecast = await storage.createForecast({
        datasetId: input.datasetId,
        modelUsed: input.modelUsed,
        targetVariable: input.targetVariable,
        features: input.features,
        horizon: input.horizon,
        forecastData: result.forecastData,
        metrics: result.metrics
      });

      res.status(201).json(forecast);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      console.error(err);
      res.status(500).json({ message: err instanceof Error ? err.message : 'Internal server error' });
    }
  });

  // Basic seed function if needed
  async function seedDatabase() {
    const existing = await storage.getDatasets();
    if (existing.length === 0) {
      // Generate some dummy energy data
      const data = [];
      let baseVal = 100;
      for (let i = 0; i < 60; i++) {
        const date = new Date(2024, 0, i + 1);
        baseVal += (Math.random() - 0.5) * 10; // random walk
        data.push({
          date: date.toISOString().split('T')[0],
          energy_demand: Math.round(baseVal),
          temperature: Math.round(20 + Math.random() * 10),
          humidity: Math.round(50 + Math.random() * 20)
        });
      }
      
      await storage.createDataset({
        name: "Sample Energy Demand",
        type: "energy",
        data: data
      });
    }
  }

  // Run seed after server starts
  setTimeout(() => seedDatabase().catch(console.error), 2000);

  return httpServer;
}
