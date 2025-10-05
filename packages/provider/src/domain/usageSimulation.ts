import { z } from 'zod';

export const UsageSimulationConfigSchema = z.object({
  gpuUsage: z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
    variance: z.number().min(0).max(1),
  }),
  bandwidthUsage: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    variance: z.number().min(0).max(1),
  }),
  windowDurationSeconds: z.number().int().positive(),
  rateId: z.string().min(1),
});

export type UsageSimulationConfig = z.infer<typeof UsageSimulationConfigSchema>;

export interface UsageMetrics {
  gpuUtilization: number; // 0-100%
  bandwidthBytes: number; // bytes transferred
  computeUnits: number; // derived from GPU + bandwidth
}

export interface SimulationResult {
  metrics: UsageMetrics;
  timestamp: number;
  windowStart: number;
  windowEnd: number;
}
