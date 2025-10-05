import { z } from 'zod';

export const ProviderConfigSchema = z.object({
  providerPrivateKey: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  nodeId: z.string().min(1),
  relayerUrl: z.string().url().default('http://localhost:8787'),
  submissionIntervalMs: z.coerce.number().int().positive().default(30000), // 30 seconds
  simulationConfig: z.object({
    gpuUsage: z.object({
      min: z.number().min(0).max(100).default(20),
      max: z.number().min(0).max(100).default(80),
      variance: z.number().min(0).max(1).default(0.1),
    }),
    bandwidthUsage: z.object({
      min: z.number().min(0).default(1024 * 1024), // 1MB
      max: z.number().min(0).default(100 * 1024 * 1024), // 100MB
      variance: z.number().min(0).max(1).default(0.2),
    }),
    windowDurationSeconds: z.number().int().positive().default(60),
    rateId: z.string().min(1).default('rate-gpu-bandwidth-1'),
  }),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
