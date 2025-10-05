import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { keccak256, toBytes } from 'viem';
import { UsageRecord } from '../domain/usageRecord.js';
import { SignatureService } from '../services/signatureService.js';
import { NonceGenerator } from '../services/nonceGenerator.js';
import { createCanonicalJson } from '../utils/canonicalJson.js';

// Import the relayer's Merkle utilities (we'll need to access them)
// For testing, we'll recreate the same logic here
function hashLeafCanonicalJson(jsonString: string): `0x${string}` {
  return keccak256(toBytes(jsonString));
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

describe('Merkle Root Verification', () => {
  let signatureService: SignatureService;
  let nonceGenerator: NonceGenerator;
  let providerAddress: string;

  beforeEach(() => {
    const testPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    signatureService = new SignatureService(testPrivateKey);
    nonceGenerator = new NonceGenerator();
    providerAddress = signatureService.getProviderAddress();
  });

  describe('Single Leaf Merkle Tree', () => {
    it('should create valid Merkle root for single leaf', async () => {
      const usageRecord: UsageRecord = {
        provider: providerAddress,
        nodeId: 'test-node-001',
        windowStart: 1690000000,
        windowEnd: 1690000060,
        unitsConsumed: 1000,
        rateId: 'rate-test-1',
        nonce: nonceGenerator.generateNonce(),
        providerSig: await signatureService.signUsageRecord({
          provider: providerAddress,
          nodeId: 'test-node-001',
          windowStart: 1690000000,
          windowEnd: 1690000060,
          unitsConsumed: 1000,
          rateId: 'rate-test-1',
          nonce: nonceGenerator.generateNonce(),
        }),
      };

      // Create the canonical object that gets hashed (without signature)
      const canonicalObject = createCanonicalJson(usageRecord);
      const leafHash = hashLeafCanonicalJson(canonicalObject);
      const merkleRoot = buildMerkleRoot([leafHash]);

      // For single leaf, the root should equal the leaf hash
      assert.equal(merkleRoot, leafHash);
      assert.ok(merkleRoot.startsWith('0x'));
      assert.equal(merkleRoot.length, 66); // 0x + 64 hex chars
    });
  });

  describe('Multiple Leaves Merkle Tree', () => {
    it('should create consistent Merkle root for multiple leaves', async () => {
      const records: UsageRecord[] = [];
      
      // Generate 3 usage records
      for (let i = 0; i < 3; i++) {
        const nonce = nonceGenerator.generateNonce();
        const unsignedRecord = {
          provider: providerAddress,
          nodeId: `test-node-${i.toString().padStart(3, '0')}`,
          windowStart: 1690000000 + (i * 60),
          windowEnd: 1690000060 + (i * 60),
          unitsConsumed: 1000 + (i * 100),
          rateId: 'rate-test-1',
          nonce,
        };

        const signature = await signatureService.signUsageRecord(unsignedRecord);
        
        records.push({
          ...unsignedRecord,
          providerSig: signature,
        });
      }

      // Create leaf hashes (canonical objects without signatures)
      const leafHashes = records.map(record => {
        const canonicalJson = createCanonicalJson(record);
        return hashLeafCanonicalJson(canonicalJson);
      });

      const merkleRoot = buildMerkleRoot(leafHashes);

      assert.ok(merkleRoot.startsWith('0x'));
      assert.equal(merkleRoot.length, 66);
      
      // The root should be different from any individual leaf hash
      for (const leafHash of leafHashes) {
        assert.notEqual(merkleRoot, leafHash);
      }
    });

    it('should produce same Merkle root regardless of leaf order', async () => {
      const records: UsageRecord[] = [];
      
      // Generate 4 usage records
      for (let i = 0; i < 4; i++) {
        const nonce = nonceGenerator.generateNonce();
        const unsignedRecord = {
          provider: providerAddress,
          nodeId: `test-node-${i.toString().padStart(3, '0')}`,
          windowStart: 1690000000 + (i * 60),
          windowEnd: 1690000060 + (i * 60),
          unitsConsumed: 1000 + (i * 100),
          rateId: 'rate-test-1',
          nonce,
        };

        const signature = await signatureService.signUsageRecord(unsignedRecord);
        
        records.push({
          ...unsignedRecord,
          providerSig: signature,
        });
      }

      // Create leaf hashes
      const leafHashes = records.map(record => {
        const canonicalJson = createCanonicalJson(record);
        return hashLeafCanonicalJson(canonicalJson);
      });

      // Build Merkle root with original order
      const merkleRoot1 = buildMerkleRoot(leafHashes);
      
      // Build Merkle root with reversed order
      const merkleRoot2 = buildMerkleRoot([...leafHashes].reverse());
      
      // Build Merkle root with shuffled order
      const shuffledHashes = [...leafHashes].sort(() => Math.random() - 0.5);
      const merkleRoot3 = buildMerkleRoot(shuffledHashes);

      // All should be the same due to commutative hashing
      assert.equal(merkleRoot1, merkleRoot2);
      assert.equal(merkleRoot1, merkleRoot3);
    });
  });

  describe('Merkle Proof Generation and Verification', () => {
    it('should generate valid Merkle proofs for leaf inclusion', () => {
      // Create test leaf hashes
      const leafHashes: `0x${string}`[] = [
        '0x1111111111111111111111111111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222222222222222222222222222',
        '0x3333333333333333333333333333333333333333333333333333333333333333',
        '0x4444444444444444444444444444444444444444444444444444444444444444',
      ];

      const merkleRoot = buildMerkleRoot(leafHashes);
      
      // Generate proof for first leaf
      const targetLeaf = leafHashes[0];
      const proof = generateMerkleProof(leafHashes, 0);
      
      // Verify the proof
      const isValid = verifyMerkleProof(targetLeaf, proof, merkleRoot);
      assert.ok(isValid, 'Merkle proof should be valid');
    });

    it('should reject invalid Merkle proofs', () => {
      const leafHashes: `0x${string}`[] = [
        '0x1111111111111111111111111111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222222222222222222222222222',
        '0x3333333333333333333333333333333333333333333333333333333333333333',
        '0x4444444444444444444444444444444444444444444444444444444444444444',
      ];

      const merkleRoot = buildMerkleRoot(leafHashes);
      
      // Generate proof for first leaf
      const targetLeaf = leafHashes[0];
      const proof = generateMerkleProof(leafHashes, 0);
      
      // Try to verify with wrong leaf
      const wrongLeaf = '0x5555555555555555555555555555555555555555555555555555555555555555';
      const isValid = verifyMerkleProof(wrongLeaf, proof, merkleRoot);
      assert.ok(!isValid, 'Merkle proof should be invalid for wrong leaf');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty Merkle tree', () => {
      const merkleRoot = buildMerkleRoot([]);
      const expectedRoot = '0x' + '00'.repeat(32);
      assert.equal(merkleRoot, expectedRoot);
    });

    it('should handle odd number of leaves', () => {
      const leafHashes: `0x${string}`[] = [
        '0x1111111111111111111111111111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222222222222222222222222222',
        '0x3333333333333333333333333333333333333333333333333333333333333333',
      ];

      const merkleRoot = buildMerkleRoot(leafHashes);
      assert.ok(merkleRoot.startsWith('0x'));
      assert.equal(merkleRoot.length, 66);
    });

    it('should handle large number of leaves', () => {
      const leafHashes: `0x${string}`[] = [];
      
      // Generate 100 leaf hashes
      for (let i = 0; i < 100; i++) {
        const hash = `0x${i.toString().padStart(64, '0')}` as `0x${string}`;
        leafHashes.push(hash);
      }

      const merkleRoot = buildMerkleRoot(leafHashes);
      assert.ok(merkleRoot.startsWith('0x'));
      assert.equal(merkleRoot.length, 66);
    });
  });
});

// Helper functions for Merkle proof generation and verification
function generateMerkleProof(leaves: `0x${string}`[], leafIndex: number): `0x${string}`[] {
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

function verifyMerkleProof(leaf: `0x${string}`, proof: `0x${string}`[], root: `0x${string}`): boolean {
  let computedHash = leaf;
  
  for (const proofElement of proof) {
    computedHash = hashPairCommutative(computedHash, proofElement);
  }
  
  return computedHash === root;
}
