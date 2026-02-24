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
    console.log(`[runForecastModel] Spawning Python script: ${scriptPath}`);
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
      console.log(`[runForecastModel] Python script finished with code ${code}.`);
      if (stderrData) {
        console.error(`[runForecastModel] STDERR: ${stderrData}`);
      }
      if (stdoutData) {
        // Log stdout but be careful not to log huge datasets
        const preview = stdoutData.length > 500 ? stdoutData.substring(0, 500) + '...' : stdoutData;
        console.log(`[runForecastModel] STDOUT: ${preview}`);
      }

      if (code !== 0) {
        // Try to parse stdout for a JSON error first, as our robust script sends errors there
        try {
            const errorResult = JSON.parse(stdoutData);
            if (errorResult.error) {
                return reject(new Error(`Forecast script error: ${errorResult.error}\nTraceback: ${errorResult.traceback}`));
            }
        } catch (e) {
            // Fallback if stdout is not a valid JSON error
        }
        reject(new Error(`Python script failed with code ${code}. STDERR: ${stderrData || 'N/A'}. STDOUT: ${stdoutData || 'N/A'}`));
      } else {
        try {
          const result = JSON.parse(stdoutData);
          if (result.error) {
            console.error('[runForecastModel] Python script returned a structured error.');
            return reject(new Error(`Forecast script error: ${result.error}\nTraceback: ${result.traceback}`));
          }
          console.log('[runForecastModel] Python script successful. Parsed JSON result.');
          resolve(result);
        } catch (e) {
          console.error('[runForecastModel] Failed to parse JSON from Python script stdout.');
          reject(new Error(`Failed to parse Python script output. Raw STDOUT: ${stdoutData}`));
        }
      }
    });
    
    console.log('[runForecastModel] Writing input to stdin.');
    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();
  });
}


export function registerRoutes(): express.Router {
  const router = express.Router();

  router.get(api.datasets.list.path, async (req, res) => {
    const items = await storage.getDatasets();
    res.json(items);
  });

  router.get(api.datasets.get.path, async (req, res) => {
    const item = await storage.getDataset(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Dataset not found' });
    }
    res.json(item);
  });

  router.post(api.datasets.create.path, async (req, res, next) => {
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
      next(err);
    }
  });

  router.get(api.models.list.path, async (req, res) => {
    const items = await storage.getModels();
    res.json(items);
  });

  router.get(api.models.get.path, async (req, res) => {
    const item = await storage.getModel(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Model not found' });
    }
    res.json(item);
  });

  router.post(api.models.train.path, async (req, res, next) => {
    const reqPath = `[API] POST ${api.models.train.path}`;
    try {
      console.log(`${reqPath} - Request received.`);
      const input = api.models.train.input.parse(req.body);
      
      console.log(`${reqPath} - Fetching dataset: ${input.datasetId}`);
      const dataset = await storage.getDataset(input.datasetId);
      if (!dataset) {
        console.error(`${reqPath} - Dataset not found: ${input.datasetId}`);
        return res.status(404).json({ message: 'Dataset not found' });
      }

      if (!Array.isArray(dataset.data)) {
        console.error(`${reqPath} - Dataset data is not an array.`);
        return res.status(400).json({ message: 'Dataset data is not in the expected array format.' });
      }

      console.log(`${reqPath} - Calling Python script...`);
      const result = await runForecastModel({
        data: dataset.data,
        targetVariable: input.targetVariable,
        features: input.features,
        algorithm: input.algorithm,
        hyperparameters: input.hyperparameters || {},
        horizon: input.horizon,
        forecastStartDate: input.forecastStartDate,
      });
      console.log(`${reqPath} - Python script succeeded.`);

      const model = await storage.createModel({
        datasetId: input.datasetId,
        algorithm: result.trainingConfig.modelUsed,
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

      console.log(`${reqPath} - Model created in DB. Sending 201 response.`);
      res.status(201).json(model);
    } catch (err) {
      console.error(`${reqPath} - ERROR:`, err);
      // Pass the error to the Express error handler
      next(err);
    }
  });

  return router;
}
