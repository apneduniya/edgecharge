import { z } from 'zod';

export const InvoiceSchema = z.object({
  invoiceId: z.string().min(1),
  enterprise: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  provider: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  amount: z.coerce.number().nonnegative(),
  currency: z.string().default('USD'),
  status: z.enum(['draft', 'generated', 'anchored', 'paid']).default('draft'),
  createdAt: z.coerce.number().int().nonnegative(),
  dueDate: z.coerce.number().int().nonnegative(),
  billingPeriod: z.object({
    start: z.coerce.number().int().nonnegative(),
    end: z.coerce.number().int().nonnegative(),
  }),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    quantity: z.coerce.number().nonnegative(),
    unitPrice: z.coerce.number().nonnegative(),
    total: z.coerce.number().nonnegative(),
    rateId: z.string().min(1),
    usageData: z.object({
      anchorId: z.string().optional(),
      windowStart: z.coerce.number().int().nonnegative(),
      windowEnd: z.coerce.number().int().nonnegative(),
      unitsConsumed: z.coerce.number().int().nonnegative(),
    }),
  })),
  metadata: z.object({
    invoiceHash: z.string().optional(),
    blockchainTxHash: z.string().optional(),
    generatedAt: z.coerce.number().int().nonnegative().optional(),
    anchoredAt: z.coerce.number().int().nonnegative().optional(),
  }).optional(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export const InvoiceLineItemSchema = InvoiceSchema.shape.lineItems.element;
export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;

export const BillingPeriodSchema = InvoiceSchema.shape.billingPeriod;
export type BillingPeriod = z.infer<typeof BillingPeriodSchema>;

export const InvoiceMetadataSchema = InvoiceSchema.shape.metadata;
export type InvoiceMetadata = z.infer<typeof InvoiceMetadataSchema>;
