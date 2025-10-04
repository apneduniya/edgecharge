import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  U2U_RPC_URL: z.string().url().default('https://rpc-nebulas-testnet.u2u.xyz'),
  RELAYER_PRIVATE_KEY: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  EDGECHARGE_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  BATCH_INTERVAL_MS: z.coerce.number().int().positive().default(60000),
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


