import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { spawn } from "child_process";
import path from "path";
import crypto from "crypto";

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
      const dataString = JSON.stringify(input.data);
      const fileHash = crypto.createHash('sha256').update(dataString).digest('hex');

      const item = await storage.createDataset({ ...input, fileHash });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get(api.models.list.path, async (req, res) => {
    const items = await storage.getModels();
    res.json(items);
  });

  app.get(api.models.get.path, async (req, res) => {
    const item = await storage.getModel(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Model not found' });
    }
    res.json(item);
  });

  app.post(api.models.train.path, async (req, res) => {
    try {
      const input = api.models.train.input.parse(req.body);
      
      const dataset = await storage.getDataset(input.datasetId);
      if (!dataset) {
        return res.status(404).json({ message: 'Dataset not found' });
      }

      // Prepare hyperparameters based on model
      const hyperparameters = input.algorithm === 'random_forest' 
        ? { n_estimators: 100 } // Example, can be expanded
        : {};

      const result = await runForecastModel({
        data: dataset.data,
        targetVariable: input.targetVariable,
        features: input.features,
        modelUsed: input.algorithm,
        hyperparameters,
        horizon: input.horizon
      });

      const model = await storage.createModel({
        datasetId: input.datasetId,
        algorithm: input.algorithm,
        targetVariable: input.targetVariable,
        features: input.features,
        horizon: input.horizon,
        hyperparameters,
        modelPath: result.modelPath,
        trainingDuration: result.trainingDuration,
        forecastData: result.forecastData,
        metrics: result.metrics
      });

      res.status(201).json(model);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      console.error(err);
      res.status(500).json({ message: err instanceof Error ? err.message : 'Internal server error' });
    }
  });

  return httpServer;
}
