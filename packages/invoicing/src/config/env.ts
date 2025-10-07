import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  // Blockchain configuration
  U2U_RPC_URL: z.string().url().default('https://rpc-nebulas-testnet.u2u.xyz'),
  EDGECHARGE_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  
  // Invoicing configuration
  INVOICE_OUTPUT_DIR: z.string().default('./invoices'),
  INVOICE_TEMPLATE_DIR: z.string().default('./templates'),
  DEFAULT_CURRENCY: z.string().default('USD'),
  DEFAULT_DUE_DAYS: z.coerce.number().int().positive().default(30),
  
  // Rate card configuration
  RATE_CARD_FILE: z.string().default('./config/rate-cards.json'),
  
  // Enterprise configuration (for demo purposes)
  ENTERPRISE_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/).default('0x0000000000000000000000000000000000000000'),
  ENTERPRISE_NAME: z.string().default('Demo Enterprise'),
  ENTERPRISE_EMAIL: z.string().email().default('billing@demo-enterprise.com'),
  
  // Provider configuration
  PROVIDER_NAME: z.string().default('EdgeCharge Provider'),
  PROVIDER_EMAIL: z.string().email().default('billing@edgecharge-provider.com'),
  PROVIDER_WEBSITE: z.string().url().default('https://edgecharge-provider.com'),
  
  // Event listening configuration
  EVENT_POLLING_INTERVAL_MS: z.coerce.number().int().positive().default(10000), // 10 seconds
  EVENT_BATCH_SIZE: z.coerce.number().int().positive().default(100),
  EVENT_START_BLOCK: z.coerce.number().int().nonnegative().optional(),
  
  // Invoice generation configuration
  AUTO_GENERATE_INVOICES: z.coerce.boolean().default(true),
  AUTO_ANCHOR_INVOICES: z.coerce.boolean().default(true),
  INVOICE_GENERATION_DELAY_MS: z.coerce.number().int().nonnegative().default(5000), // 5 seconds delay
  
  // File format preferences
  GENERATE_PDF: z.coerce.boolean().default(true),
  GENERATE_CSV: z.coerce.boolean().default(true),
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
