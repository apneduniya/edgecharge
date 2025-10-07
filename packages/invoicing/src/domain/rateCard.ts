import { z } from 'zod';

export const RateCardSchema = z.object({
  rateId: z.string().min(1),
  provider: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  name: z.string().min(1),
  description: z.string().optional(),
  currency: z.string().default('USD'),
  unitPrice: z.coerce.number().nonnegative(),
  unit: z.string().min(1), // e.g., "compute-unit", "gpu-hour", "bandwidth-gb"
  billingType: z.enum(['per_unit', 'per_hour', 'per_gb', 'per_mb']).default('per_unit'),
  minimumCharge: z.coerce.number().nonnegative().default(0),
  maximumCharge: z.coerce.number().nonnegative().optional(),
  effectiveFrom: z.coerce.number().int().nonnegative(),
  effectiveTo: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

export type RateCard = z.infer<typeof RateCardSchema>;

export const RateCardConfigSchema = z.object({
  defaultRateCards: z.array(RateCardSchema),
  customRateCards: z.array(RateCardSchema).default([]),
});

export type RateCardConfig = z.infer<typeof RateCardConfigSchema>;

// Default rate cards for common edge computing services
export const DEFAULT_RATE_CARDS: RateCard[] = [
  {
    rateId: 'rate-gpu-bandwidth-1',
    provider: '0x0000000000000000000000000000000000000000', // Placeholder
    name: 'GPU + Bandwidth Standard',
    description: 'Standard rate for GPU compute units with bandwidth',
    currency: 'USD',
    unitPrice: 0.001, // $0.001 per compute unit
    unit: 'compute-unit',
    billingType: 'per_unit',
    minimumCharge: 0.01, // $0.01 minimum
    effectiveFrom: 0,
    isActive: true,
  },
  {
    rateId: 'rate-gpu-premium',
    provider: '0x0000000000000000000000000000000000000000', // Placeholder
    name: 'GPU Premium',
    description: 'Premium GPU compute rate',
    currency: 'USD',
    unitPrice: 0.002, // $0.002 per compute unit
    unit: 'compute-unit',
    billingType: 'per_unit',
    minimumCharge: 0.05, // $0.05 minimum
    effectiveFrom: 0,
    isActive: true,
  },
  {
    rateId: 'rate-bandwidth-only',
    provider: '0x0000000000000000000000000000000000000000', // Placeholder
    name: 'Bandwidth Only',
    description: 'Bandwidth transfer rate',
    currency: 'USD',
    unitPrice: 0.0001, // $0.0001 per compute unit
    unit: 'compute-unit',
    billingType: 'per_unit',
    minimumCharge: 0.005, // $0.005 minimum
    effectiveFrom: 0,
    isActive: true,
  },
];
