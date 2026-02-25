import { z } from 'zod';
import { CreateKpiRequest, CreateKpiDataPointRequest } from './schema';

export const api = {
  kpis: {
    list: {
      method: 'GET' as const,
      path: '/api/kpis' as const,
      responses: { 200: z.array(z.any()) }, // z.any() to represent KpiWithData[]
    },
    get: {
      method: 'GET' as const,
      path: '/api/kpis/:id' as const,
      responses: { 200: z.any() }, // z.any() to represent KpiWithData
    },
    create: {
      method: 'POST' as const,
      path: '/api/kpis' as const,
      input: CreateKpiRequest,
      responses: { 201: z.any() },
    },
  },
  dataPoints: {
    create: {
        method: 'POST' as const,
        path: '/api/data-points' as const,
        input: CreateKpiDataPointRequest,
        responses: { 201: z.any() },
    }
  }
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
