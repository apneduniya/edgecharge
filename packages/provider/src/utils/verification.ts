import { verifyMessage, keccak256, toBytes } from 'viem';
import { UsageRecord } from '../domain/usageRecord.js';
import { createCanonicalJson } from './canonicalJson.js';

/**
 * Utility functions for verifying provider signatures and Merkle roots
 * These functions can be used by the relayer or other components to verify
 * the authenticity and integrity of usage records.
 */

export interface VerificationResult {
  isValid: boolean;
  error?: string;
}

export interface MerkleVerificationResult {
  isValid: boolean;
  merkleRoot: string;
  totalUsage: bigint;
  leafCount: number;
  error?: string;
}

/**
 * Verify a single usage record signature
 */
export async function verifyUsageRecordSignature(record: UsageRecord): Promise<VerificationResult> {
  try {
    // Create the canonical message string that was signed
    const messageString = createCanonicalJson(record);

    // Verify the signature
    const isValid = await verifyMessage({
      address: record.provider as `0x${string}`,
      message: { raw: messageString as `0x${string}` },
      signature: record.providerSig as `0x${string}`,
    });

    return { isValid };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

/**
 * Verify multiple usage records and build Merkle tree
 */
export async function verifyUsageRecordsAndBuildMerkle(
  records: UsageRecord[]
): Promise<MerkleVerificationResult> {
  try {
    if (records.length === 0) {
      return {
        isValid: false,
        merkleRoot: '0x' + '00'.repeat(32),
        totalUsage: 0n,
        leafCount: 0,
        error: 'No records provided',
      };
    }

    // Verify all signatures first
    const signatureResults = await Promise.all(
      records.map(record => verifyUsageRecordSignature(record))
    );

    const invalidSignatures = signatureResults.filter(result => !result.isValid);
    if (invalidSignatures.length > 0) {
      return {
        isValid: false,
        merkleRoot: '0x' + '00'.repeat(32),
        totalUsage: 0n,
        leafCount: records.length,
        error: `Invalid signatures found: ${invalidSignatures.length}/${records.length}`,
      };
    }

    // Build Merkle tree
    const leafHashes = records.map(record => {
      const json = createCanonicalJson(record);
      return keccak256(toBytes(json));
    });

    const merkleRoot = buildMerkleRoot(leafHashes);
    const totalUsage = records.reduce((sum, record) => sum + BigInt(record.unitsConsumed), 0n);

    return {
      isValid: true,
      merkleRoot,
      totalUsage,
      leafCount: records.length,
    };
  } catch (error) {
    return {
      isValid: false,
      merkleRoot: '0x' + '00'.repeat(32),
      totalUsage: 0n,
      leafCount: records.length,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

/**
 * Generate Merkle proof for a specific leaf
 */
export function generateMerkleProof(
  records: UsageRecord[],
  targetRecordIndex: number
): { proof: string[]; leafHash: string } | null {
  if (targetRecordIndex < 0 || targetRecordIndex >= records.length) {
    return null;
  }

  const leafHashes = records.map(record => {
    const json = createCanonicalJson(record);
    return keccak256(toBytes(json));
  });

  const targetLeafHash = leafHashes[targetRecordIndex];
  const proof = generateMerkleProofForLeaf(leafHashes, targetRecordIndex);

  return {
    proof: proof.map(hash => hash),
    leafHash: targetLeafHash,
  };
}

/**
 * Verify Merkle proof
 */
export function verifyMerkleProof(
  leafHash: string,
  proof: string[],
  root: string
): boolean {
  try {
    let computedHash = leafHash as `0x${string}`;
    
    for (const proofElement of proof) {
      computedHash = hashPairCommutative(computedHash, proofElement as `0x${string}`);
    }
    
    return computedHash === root;
  } catch {
    return false;
  }
}

/**
 * Validate usage record structure and business rules
 */
export function validateUsageRecord(record: UsageRecord): VerificationResult {
  try {
    // Check required fields
    if (!record.provider || !record.provider.startsWith('0x') || record.provider.length !== 42) {
      return { isValid: false, error: 'Invalid provider address' };
    }

    if (!record.nodeId || record.nodeId.length === 0) {
      return { isValid: false, error: 'Invalid node ID' };
    }

    if (!record.nonce || !record.nonce.startsWith('0x')) {
      return { isValid: false, error: 'Invalid nonce' };
    }

    if (!record.providerSig || !record.providerSig.startsWith('0x')) {
      return { isValid: false, error: 'Invalid signature' };
    }

    // Check time window
    if (record.windowStart >= record.windowEnd) {
      return { isValid: false, error: 'Invalid time window: start must be before end' };
    }

    if (record.windowStart < 0 || record.windowEnd < 0) {
      return { isValid: false, error: 'Invalid timestamps: must be non-negative' };
    }

    // Check usage
    if (record.unitsConsumed < 0) {
      return { isValid: false, error: 'Invalid usage: must be non-negative' };
    }

    if (!record.rateId || record.rateId.length === 0) {
      return { isValid: false, error: 'Invalid rate ID' };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

// Helper functions for Merkle tree operations

function buildMerkleRoot(leaves: `0x${string}`[]): `0x${string}` {
  if (leaves.length === 0) return ('0x' + '00'.repeat(32)) as `0x${string}`;
  
  let layer = [...leaves];
  layer.sort();
  
  while (layer.length > 1) {
    const next: `0x${string}`[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = layer[i + 1] ?? layer[i];
      next.push(hashPairCommutative(left, right));
    }
    next.sort();
    layer = next;
  }
  
  return layer[0] as `0x${string}`;
}

function hashPairCommutative(a: `0x${string}`, b: `0x${string}`): `0x${string}` {
  return a.toLowerCase() < b.toLowerCase()
    ? keccak256(concatBytes(a, b))
    : keccak256(concatBytes(b, a));
}

function concatBytes(a: `0x${string}`, b: `0x${string}`) {
  const ab = new Uint8Array(64);
  ab.set(toBytes(a));
  ab.set(toBytes(b), 32);
  return ab;
}

function generateMerkleProofForLeaf(leaves: `0x${string}`[], leafIndex: number): `0x${string}`[] {
  if (leaves.length === 0 || leafIndex >= leaves.length) {
    return [];
  }

  const proof: `0x${string}`[] = [];
  let layer = [...leaves];
  let currentIndex = leafIndex;

  while (layer.length > 1) {
    const nextLayer: `0x${string}`[] = [];
    
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = layer[i + 1] ?? layer[i];
      
      if (i === currentIndex) {
        // This is our target leaf, add its sibling to proof
        proof.push(right);
      } else if (i + 1 === currentIndex) {
        // This is our target leaf's sibling, add left to proof
        proof.push(left);
      }
      
      nextLayer.push(hashPairCommutative(left, right));
    }
    
    layer = nextLayer;
    currentIndex = Math.floor(currentIndex / 2);
  }

  return proof;
}
