import { z } from 'zod';
import { insertDatasetSchema, datasets, forecasts } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  datasets: {
    list: {
      method: 'GET' as const,
      path: '/api/datasets' as const,
      responses: {
        200: z.array(z.custom<typeof datasets.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/datasets/:id' as const,
      responses: {
        200: z.custom<typeof datasets.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/datasets' as const,
      input: insertDatasetSchema,
      responses: {
        201: z.custom<typeof datasets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  forecasts: {
    list: {
      method: 'GET' as const,
      path: '/api/forecasts' as const,
      responses: {
        200: z.array(z.custom<typeof forecasts.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/forecasts/:id' as const,
      responses: {
        200: z.custom<typeof forecasts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/forecasts/generate' as const,
      input: z.object({
        datasetId: z.number(),
        modelUsed: z.enum(['linear_regression', 'random_forest']),
        targetVariable: z.string(),
        features: z.array(z.string()),
        horizon: z.number().min(1).max(365),
      }),
      responses: {
        201: z.custom<typeof forecasts.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type DatasetResponse = z.infer<typeof api.datasets.create.responses[201]>;
export type ForecastResponse = z.infer<typeof api.forecasts.generate.responses[201]>;
