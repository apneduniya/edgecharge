import { keccak256, toBytes } from 'viem';
import { Invoice } from '../domain/invoice.js';

export interface IInvoiceHashService {
  computeInvoiceHash(invoice: Invoice): string;
  verifyInvoiceHash(invoice: Invoice, expectedHash: string): boolean;
  computeCanonicalInvoiceData(invoice: Invoice): string;
}

export class InvoiceHashService implements IInvoiceHashService {
  /**
   * Computes a deterministic hash for an invoice based on its canonical representation
   * This hash can be used for blockchain anchoring and verification
   */
  computeInvoiceHash(invoice: Invoice): string {
    const canonicalData = this.computeCanonicalInvoiceData(invoice);
    return keccak256(toBytes(canonicalData));
  }

  /**
   * Verifies that an invoice matches its expected hash
   */
  verifyInvoiceHash(invoice: Invoice, expectedHash: string): boolean {
    const computedHash = this.computeInvoiceHash(invoice);
    return computedHash.toLowerCase() === expectedHash.toLowerCase();
  }

  /**
   * Creates a canonical JSON representation of the invoice for hashing
   * This ensures consistent hashing regardless of field order or formatting
   */
  computeCanonicalInvoiceData(invoice: Invoice): string {
    // Create a canonical object with fields in a specific order
    const canonicalInvoice = {
      invoiceId: invoice.invoiceId,
      enterprise: invoice.enterprise.toLowerCase(),
      provider: invoice.provider.toLowerCase(),
      amount: invoice.amount,
      currency: invoice.currency,
      billingPeriod: {
        start: invoice.billingPeriod.start,
        end: invoice.billingPeriod.end,
      },
      lineItems: invoice.lineItems
        .map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          rateId: item.rateId,
          usageData: {
            windowStart: item.usageData.windowStart,
            windowEnd: item.usageData.windowEnd,
            unitsConsumed: item.usageData.unitsConsumed,
            // Note: anchorId is excluded from canonical data as it may not be available at generation time
          },
        }))
        .sort((a, b) => {
          // Sort line items by rateId, then by windowStart for consistency
          if (a.rateId !== b.rateId) {
            return a.rateId.localeCompare(b.rateId);
          }
          return a.usageData.windowStart - b.usageData.windowStart;
        }),
      createdAt: invoice.createdAt,
      dueDate: invoice.dueDate,
    };

    // Convert to JSON with consistent formatting
    return JSON.stringify(canonicalInvoice, null, 0);
  }

  /**
   * Computes a hash for invoice metadata (excluding the main invoice data)
   * This can be used for tracking invoice state changes
   */
  computeMetadataHash(invoice: Invoice): string {
    if (!invoice.metadata) {
      return keccak256(toBytes(''));
    }

    const canonicalMetadata = {
      invoiceHash: invoice.metadata.invoiceHash || '',
      blockchainTxHash: invoice.metadata.blockchainTxHash || '',
      generatedAt: invoice.metadata.generatedAt || 0,
      anchoredAt: invoice.metadata.anchoredAt || 0,
    };

    return keccak256(toBytes(JSON.stringify(canonicalMetadata, null, 0)));
  }

  /**
   * Computes a hash for a specific line item
   * This can be used for individual line item verification
   */
  computeLineItemHash(lineItem: Invoice['lineItems'][0]): string {
    const canonicalLineItem = {
      description: lineItem.description,
      quantity: lineItem.quantity,
      unitPrice: lineItem.unitPrice,
      total: lineItem.total,
      rateId: lineItem.rateId,
      usageData: {
        windowStart: lineItem.usageData.windowStart,
        windowEnd: lineItem.usageData.windowEnd,
        unitsConsumed: lineItem.usageData.unitsConsumed,
        anchorId: lineItem.usageData.anchorId || '',
      },
    };

    return keccak256(toBytes(JSON.stringify(canonicalLineItem, null, 0)));
  }

  /**
   * Computes a hash for the billing period
   * This can be used for period-based verification
   */
  computeBillingPeriodHash(billingPeriod: Invoice['billingPeriod']): string {
    const canonicalPeriod = {
      start: billingPeriod.start,
      end: billingPeriod.end,
    };

    return keccak256(toBytes(JSON.stringify(canonicalPeriod, null, 0)));
  }

  /**
   * Validates that an invoice has all required fields for hash computation
   */
  validateInvoiceForHashing(invoice: Invoice): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!invoice.invoiceId) {
      errors.push('Invoice ID is required');
    }

    if (!invoice.enterprise) {
      errors.push('Enterprise address is required');
    }

    if (!invoice.provider) {
      errors.push('Provider address is required');
    }

    if (invoice.amount < 0) {
      errors.push('Amount must be non-negative');
    }

    if (!invoice.currency) {
      errors.push('Currency is required');
    }

    if (!invoice.billingPeriod || invoice.billingPeriod.start >= invoice.billingPeriod.end) {
      errors.push('Valid billing period is required');
    }

    if (!invoice.lineItems || invoice.lineItems.length === 0) {
      errors.push('At least one line item is required');
    }

    // Validate line items
    invoice.lineItems?.forEach((item, index) => {
      if (!item.description) {
        errors.push(`Line item ${index + 1}: description is required`);
      }

      if (item.quantity <= 0) {
        errors.push(`Line item ${index + 1}: quantity must be positive`);
      }

      if (item.unitPrice < 0) {
        errors.push(`Line item ${index + 1}: unit price must be non-negative`);
      }

      if (item.total < 0) {
        errors.push(`Line item ${index + 1}: total must be non-negative`);
      }

      if (!item.rateId) {
        errors.push(`Line item ${index + 1}: rate ID is required`);
      }

      if (!item.usageData || item.usageData.windowStart >= item.usageData.windowEnd) {
        errors.push(`Line item ${index + 1}: valid usage data is required`);
      }

      if (item.usageData?.unitsConsumed <= 0) {
        errors.push(`Line item ${index + 1}: units consumed must be positive`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Creates a summary hash that includes only essential invoice information
   * This can be used for quick verification without full data
   */
  computeSummaryHash(invoice: Invoice): string {
    const summary = {
      invoiceId: invoice.invoiceId,
      enterprise: invoice.enterprise.toLowerCase(),
      provider: invoice.provider.toLowerCase(),
      amount: invoice.amount,
      currency: invoice.currency,
      billingPeriod: {
        start: invoice.billingPeriod.start,
        end: invoice.billingPeriod.end,
      },
      lineItemCount: invoice.lineItems.length,
      totalUnits: invoice.lineItems.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: invoice.createdAt,
    };

    return keccak256(toBytes(JSON.stringify(summary, null, 0)));
  }
}
