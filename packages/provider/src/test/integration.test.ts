import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SignatureService } from '../services/signatureService.js';
import { RelayerClient } from '../services/relayerClient.js';
import { NonceGenerator } from '../services/nonceGenerator.js';
import { UsageSimulator } from '../services/usageSimulator.js';
import { ProviderService } from '../services/providerService.js';
import { ProviderConfig } from '../domain/providerConfig.js';
import { UsageRecord } from '../domain/usageRecord.js';
import { createCanonicalJson } from '../utils/canonicalJson.js';

describe('Provider-Relayer Integration Tests', () => {
  let signatureService: SignatureService;
  let relayerClient: RelayerClient;
  let nonceGenerator: NonceGenerator;
  let usageSimulator: UsageSimulator;
  let providerService: ProviderService;
  let config: ProviderConfig;
  let providerAddress: string;

  beforeEach(() => {
    const testPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    signatureService = new SignatureService(testPrivateKey);
    providerAddress = signatureService.getProviderAddress();
    
    // Mock relayer client for testing (we'll test against real relayer in e2e tests)
    relayerClient = new RelayerClient('http://localhost:8787');
    nonceGenerator = new NonceGenerator();
    
    config = {
      providerPrivateKey: testPrivateKey,
      nodeId: 'test-node-001',
      relayerUrl: 'http://localhost:8787',
      submissionIntervalMs: 30000,
      simulationConfig: {
        gpuUsage: {
          min: 20,
          max: 80,
          variance: 0.1,
        },
        bandwidthUsage: {
          min: 1024 * 1024, // 1MB
          max: 100 * 1024 * 1024, // 100MB
          variance: 0.2,
        },
        windowDurationSeconds: 60,
        rateId: 'rate-test-1',
      },
    };

    usageSimulator = new UsageSimulator(config.simulationConfig);
    providerService = new ProviderService(
      config,
      usageSimulator,
      signatureService,
      relayerClient,
      nonceGenerator,
    );
  });

  describe('End-to-End Usage Record Generation', () => {
    it('should generate valid usage records with proper structure', async () => {
      const record = await providerService.generateAndSubmitUsageRecord();
      
      // Verify record structure
      assert.ok(record.provider.startsWith('0x'));
      assert.equal(record.provider.length, 42);
      assert.equal(record.nodeId, 'test-node-001');
      assert.ok(record.windowStart < record.windowEnd);
      assert.ok(record.unitsConsumed >= 0);
      assert.equal(record.rateId, 'rate-test-1');
      assert.ok(record.nonce.startsWith('0x'));
      assert.ok(record.providerSig.startsWith('0x'));
      assert.ok(record.providerSig.length >= 130);
    });

    it('should generate different records for different time windows', async () => {
      const record1 = await providerService.generateAndSubmitUsageRecord();
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const record2 = await providerService.generateAndSubmitUsageRecord();
      
      assert.notEqual(record1.nonce, record2.nonce);
      assert.notEqual(record1.providerSig, record2.providerSig);
      assert.notEqual(record1.windowStart, record2.windowStart);
      assert.notEqual(record1.windowEnd, record2.windowEnd);
    });

    it('should generate records with realistic usage metrics', async () => {
      const record = await providerService.generateAndSubmitUsageRecord();
      
      // Verify usage is within expected ranges
      assert.ok(record.unitsConsumed >= 0);
      assert.ok(record.unitsConsumed <= 10000); // Reasonable upper bound
      
      // Verify time window is correct
      const now = Math.floor(Date.now() / 1000);
      const expectedWindowStart = now - config.simulationConfig.windowDurationSeconds;
      const expectedWindowEnd = now;
      
      assert.ok(Math.abs(record.windowStart - expectedWindowStart) <= 1);
      assert.ok(Math.abs(record.windowEnd - expectedWindowEnd) <= 1);
    });
  });

  describe('Signature Verification Integration', () => {
    it('should generate records with verifiable signatures', async () => {
      const record = await providerService.generateAndSubmitUsageRecord();
      
      // Verify the signature can be verified
      const { verifyMessage } = await import('viem');
      
      const messageHash = createCanonicalJson(record);
      
      const isValid = await verifyMessage({
        address: record.provider as `0x${string}`,
        message: { raw: messageHash as `0x${string}` },
        signature: record.providerSig as `0x${string}`,
      });
      
      assert.ok(isValid, 'Generated signature should be verifiable');
    });

    it('should reject records with modified data', async () => {
      const record = await providerService.generateAndSubmitUsageRecord();
      
      // Modify the record
      const modifiedRecord = {
        ...record,
        unitsConsumed: record.unitsConsumed + 1000,
      };
      
      const { verifyMessage } = await import('viem');
      
      const messageHash = createCanonicalJson(modifiedRecord);
      
      const isValid = await verifyMessage({
        address: record.provider as `0x${string}`,
        message: { raw: messageHash as `0x${string}` },
        signature: record.providerSig as `0x${string}`,
      });
      
      assert.ok(!isValid, 'Modified record should have invalid signature');
    });
  });

  describe('Merkle Tree Integration', () => {
    it('should generate records compatible with relayer Merkle tree construction', async () => {
      // Generate multiple records
      const records: UsageRecord[] = [];
      for (let i = 0; i < 3; i++) {
        const record = await providerService.generateAndSubmitUsageRecord();
        records.push(record);
        
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Create leaf hashes the same way the relayer would
      const { keccak256, toBytes } = await import('viem');
      const leafHashes = records.map(record => {
        const json = createCanonicalJson(record);
        return keccak256(toBytes(json));
      });
      
      // Build Merkle root
      const merkleRoot = buildMerkleRoot(leafHashes);
      
      assert.ok(merkleRoot.startsWith('0x'));
      assert.equal(merkleRoot.length, 66);
      
      // Verify all records are from the same provider
      const uniqueProviders = new Set(records.map(r => r.provider));
      assert.equal(uniqueProviders.size, 1);
      assert.equal(records[0].provider, providerAddress);
    });

    it('should calculate correct total usage for multiple records', async () => {
      // Generate multiple records
      const records: UsageRecord[] = [];
      for (let i = 0; i < 3; i++) {
        const record = await providerService.generateAndSubmitUsageRecord();
        records.push(record);
        
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Calculate total usage the same way the relayer would
      const totalUsage = records.reduce((sum, record) => sum + BigInt(record.unitsConsumed), 0n);
      
      assert.ok(totalUsage > 0n);
      assert.ok(totalUsage < 100000n); // Reasonable upper bound
      
      // Verify individual record usage is positive
      for (const record of records) {
        assert.ok(record.unitsConsumed >= 0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = {
        ...config,
        providerPrivateKey: 'invalid-key',
      };
      
      assert.throws(() => {
        new SignatureService(invalidConfig.providerPrivateKey as `0x${string}`);
      }, /Invalid private key/);
    });

    it('should handle network errors gracefully', async () => {
      // Create a relayer client with invalid URL
      const invalidRelayerClient = new RelayerClient('http://invalid-url:9999');
      
      const invalidProviderService = new ProviderService(
        config,
        usageSimulator,
        signatureService,
        invalidRelayerClient,
        nonceGenerator,
      );
      
      // This should not throw, but the submission should fail
      await assert.rejects(
        invalidProviderService.generateAndSubmitUsageRecord(),
        /Failed to submit usage record/
      );
    });
  });
});

// Helper function to build Merkle root (same as relayer)
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

// Import viem functions
import { keccak256, toBytes } from 'viem';
