import { z } from 'zod';

export const UsageRecordSchema = z.object({
  provider: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  nodeId: z.string().min(1),
  windowStart: z.coerce.number().int().nonnegative(),
  windowEnd: z.coerce.number().int().positive(),
  unitsConsumed: z.coerce.number().int().nonnegative(),
  rateId: z.string().min(1),
  nonce: z.string().min(1),
  providerSig: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

export type UsageRecord = z.infer<typeof UsageRecordSchema>;

export const UnsignedUsageRecordSchema = UsageRecordSchema.omit({ providerSig: true });
export type UnsignedUsageRecord = z.infer<typeof UnsignedUsageRecordSchema>;
