import { z } from 'zod';

export const UsageAnchorSchema = z.object({
  anchorId: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  provider: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  windowStart: z.coerce.number().int().nonnegative(),
  windowEnd: z.coerce.number().int().positive(),
  merkleRoot: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  totalUsage: z.coerce.number().int().nonnegative(),
  disputed: z.boolean().default(false),
  blockNumber: z.coerce.number().int().positive().optional(),
  transactionHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/).optional(),
  timestamp: z.coerce.number().int().nonnegative(),
});

export type UsageAnchor = z.infer<typeof UsageAnchorSchema>;

export const UsageAnchorEventSchema = z.object({
  anchorId: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  provider: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  windowStart: z.coerce.number().int().nonnegative(),
  windowEnd: z.coerce.number().int().positive(),
  totalUsage: z.coerce.number().int().nonnegative(),
  blockNumber: z.coerce.number().int().positive(),
  transactionHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  logIndex: z.coerce.number().int().nonnegative(),
});

export type UsageAnchorEvent = z.infer<typeof UsageAnchorEventSchema>;
