import 'dotenv/config';
import { z } from 'zod';
import { ProviderConfigSchema } from '../domain/providerConfig.js';

const EnvSchema = z.object({
  PROVIDER_PRIVATE_KEY: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  NODE_ID: z.string().min(1).default('node-001'),
  RELAYER_URL: z.string().url().default('http://localhost:8787'),
  SUBMISSION_INTERVAL_MS: z.coerce.number().int().positive().default(30000),
  // Simulation config
  GPU_USAGE_MIN: z.coerce.number().min(0).max(100).default(20),
  GPU_USAGE_MAX: z.coerce.number().min(0).max(100).default(80),
  GPU_USAGE_VARIANCE: z.coerce.number().min(0).max(1).default(0.1),
  BANDWIDTH_USAGE_MIN: z.coerce.number().min(0).default(1024 * 1024),
  BANDWIDTH_USAGE_MAX: z.coerce.number().min(0).default(100 * 1024 * 1024),
  BANDWIDTH_USAGE_VARIANCE: z.coerce.number().min(0).max(1).default(0.2),
  WINDOW_DURATION_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_ID: z.string().min(1).default('rate-gpu-bandwidth-1'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${msg}`);
  }
  return parsed.data;
}

export function loadProviderConfig(): z.infer<typeof ProviderConfigSchema> {
  const env = loadEnv();
  
  const config = {
    providerPrivateKey: env.PROVIDER_PRIVATE_KEY,
    nodeId: env.NODE_ID,
    relayerUrl: env.RELAYER_URL,
    submissionIntervalMs: env.SUBMISSION_INTERVAL_MS,
    simulationConfig: {
      gpuUsage: {
        min: env.GPU_USAGE_MIN,
        max: env.GPU_USAGE_MAX,
        variance: env.GPU_USAGE_VARIANCE,
      },
      bandwidthUsage: {
        min: env.BANDWIDTH_USAGE_MIN,
        max: env.BANDWIDTH_USAGE_MAX,
        variance: env.BANDWIDTH_USAGE_VARIANCE,
      },
      windowDurationSeconds: env.WINDOW_DURATION_SECONDS,
      rateId: env.RATE_ID,
    },
  };

  return ProviderConfigSchema.parse(config);
}
