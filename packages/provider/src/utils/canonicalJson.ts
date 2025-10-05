import { UsageRecord, UnsignedUsageRecord } from '../domain/usageRecord.js';

/**
 * Create a canonical JSON string with consistent field ordering
 * This ensures that the same data always produces the same JSON string,
 * regardless of object property order, which is crucial for signature verification.
 */
export function createCanonicalJson(record: UnsignedUsageRecord | Omit<UsageRecord, 'providerSig'>): string {
  const canonicalRecord = {
    provider: record.provider,
    nodeId: record.nodeId,
    windowStart: record.windowStart,
    windowEnd: record.windowEnd,
    unitsConsumed: record.unitsConsumed,
    rateId: record.rateId,
    nonce: record.nonce,
  };
  
  return JSON.stringify(canonicalRecord);
}

/**
 * Create a canonical object with consistent field ordering
 * Useful when you need the object structure rather than the JSON string
 */
export function createCanonicalObject(record: UnsignedUsageRecord | Omit<UsageRecord, 'providerSig'>) {
  return {
    provider: record.provider,
    nodeId: record.nodeId,
    windowStart: record.windowStart,
    windowEnd: record.windowEnd,
    unitsConsumed: record.unitsConsumed,
    rateId: record.rateId,
    nonce: record.nonce,
  };
}
