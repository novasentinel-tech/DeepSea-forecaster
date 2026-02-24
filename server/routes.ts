import type { Express } from "express";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { spawn } from "child_process";
import path from "path";
import crypto from "crypto";
import express from "express";

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
        reject(new Error(`Python script failed with code ${code}: ${stderrData}`));
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

export function registerRoutes(app: Express): void {
  const router = express.Router();

  router.get(api.datasets.list.path.replace('/api', ''), async (req, res) => {
    const items = await storage.getDatasets();
    res.json(items);
  });

  router.get(api.datasets.get.path.replace('/api', ''), async (req, res) => {
    const item = await storage.getDataset(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Dataset not found' });
    }
    res.json(item);
  });

  router.post(api.datasets.create.path.replace('/api', ''), async (req, res) => {
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

  router.get(api.models.list.path.replace('/api', ''), async (req, res) => {
    const items = await storage.getModels();
    res.json(items);
  });

  router.get(api.models.get.path.replace('/api', ''), async (req, res) => {
    const item = await storage.getModel(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Model not found' });
    }
    res.json(item);
  });

  router.post(api.models.train.path.replace('/api', ''), async (req, res) => {
    try {
      const input = api.models.train.input.parse(req.body);
      
      const dataset = await storage.getDataset(input.datasetId);
      if (!dataset) {
        return res.status(404).json({ message: 'Dataset not found' });
      }

      if (!Array.isArray(dataset.data)) {
        return res.status(400).json({ message: 'Dataset data is not in the expected array format.' });
      }

      const result = await runForecastModel({
        data: dataset.data,
        targetVariable: input.targetVariable,
        features: input.features,
        algorithm: input.algorithm,
        hyperparameters: input.hyperparameters || {},
        horizon: input.horizon
      });

      const model = await storage.createModel({
        datasetId: input.datasetId,
        algorithm: result.trainingConfig.modelUsed, // Use the model selected by the script
        targetVariable: input.targetVariable,
        features: result.featuresUsed,
        horizon: input.horizon,
        hyperparameters: result.trainingConfig.hyperparameters,
        modelPath: result.modelPath,
        trainingDuration: result.trainingDuration,
        forecastData: result.forecastData,
        metrics: result.metrics,
        featureImportance: result.featureImportance,
        trainingConfig: result.trainingConfig,
        datasetVersion: 1, // Placeholder
      });

      res.status(201).json(model);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during model training.';
      res.status(500).json({ message: errorMessage });
    }
  });

  app.use('/api', router);
}
