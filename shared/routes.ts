import { z } from 'zod';
import { insertDatasetSchema, datasets, models } from './schema';

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
      input: insertDatasetSchema.omit({ fileHash: true }),
      responses: {
        201: z.custom<typeof datasets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  models: {
    list: {
      method: 'GET' as const,
      path: '/api/models' as const,
      responses: {
        200: z.array(z.custom<typeof models.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/models/:id' as const,
      responses: {
        200: z.custom<typeof models.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    train: {
      method: 'POST' as const,
      path: '/api/models/train' as const,
      input: z.object({
        datasetId: z.number(),
        algorithm: z.enum(['linear_regression', 'random_forest', 'auto']),
        targetVariable: z.string(),
        features: z.array(z.string()),
        horizon: z.number().min(1).max(365),
      }),
      responses: {
        201: z.custom<typeof models.$inferSelect>(),
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
