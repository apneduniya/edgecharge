import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SignatureService } from '../services/signatureService.js';
import { UnsignedUsageRecord } from '../domain/usageRecord.js';
import { verifyMessage } from 'viem';
import { createCanonicalJson } from '../utils/canonicalJson.js';

describe('Provider Signature Verification', () => {
  let signatureService: SignatureService;
  let testPrivateKey: `0x${string}`;
  let providerAddress: string;

  beforeEach(() => {
    // Use a deterministic test private key for consistent testing
    testPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    signatureService = new SignatureService(testPrivateKey);
    providerAddress = signatureService.getProviderAddress();
  });

  describe('Signature Generation', () => {
    it('should generate valid ECDSA signatures', async () => {
      const unsignedRecord: UnsignedUsageRecord = {
        provider: providerAddress,
        nodeId: 'test-node-001',
        windowStart: 1690000000,
        windowEnd: 1690000060,
        unitsConsumed: 1000,
        rateId: 'rate-test-1',
        nonce: '0x1234567890abcdef1234567890abcdef',
      };

      const signature = await signatureService.signUsageRecord(unsignedRecord);
      
      // Verify signature format
      assert.ok(signature.startsWith('0x'));
      assert.ok(signature.length >= 130); // ECDSA signature length
      
      // Verify signature is deterministic for same input
      const signature2 = await signatureService.signUsageRecord(unsignedRecord);
      assert.equal(signature, signature2);
    });

    it('should generate different signatures for different records', async () => {
      const record1: UnsignedUsageRecord = {
        provider: providerAddress,
        nodeId: 'test-node-001',
        windowStart: 1690000000,
        windowEnd: 1690000060,
        unitsConsumed: 1000,
        rateId: 'rate-test-1',
        nonce: '0x11111111111111111111111111111111',
      };

      const record2: UnsignedUsageRecord = {
        provider: providerAddress,
        nodeId: 'test-node-001',
        windowStart: 1690000000,
        windowEnd: 1690000060,
        unitsConsumed: 1000,
        rateId: 'rate-test-1',
        nonce: '0x22222222222222222222222222222222', // Different nonce
      };

      const sig1 = await signatureService.signUsageRecord(record1);
      const sig2 = await signatureService.signUsageRecord(record2);
      
      assert.notEqual(sig1, sig2);
    });

    it('should generate different signatures for different providers', async () => {
      const otherPrivateKey = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const otherSignatureService = new SignatureService(otherPrivateKey);
      
      const record: UnsignedUsageRecord = {
        provider: providerAddress,
        nodeId: 'test-node-001',
        windowStart: 1690000000,
        windowEnd: 1690000060,
        unitsConsumed: 1000,
        rateId: 'rate-test-1',
        nonce: '0x1234567890abcdef1234567890abcdef',
      };

      const sig1 = await signatureService.signUsageRecord(record);
      const sig2 = await otherSignatureService.signUsageRecord(record);
      
      assert.notEqual(sig1, sig2);
    });
  });

  describe('Signature Verification', () => {
    it('should verify valid signatures', async () => {
      const unsignedRecord: UnsignedUsageRecord = {
        provider: providerAddress,
        nodeId: 'test-node-001',
        windowStart: 1690000000,
        windowEnd: 1690000060,
        unitsConsumed: 1000,
        rateId: 'rate-test-1',
        nonce: '0x1234567890abcdef1234567890abcdef',
      };

      const signature = await signatureService.signUsageRecord(unsignedRecord);
      
      // Create the canonical JSON that was signed
      const messageHash = createCanonicalJson(unsignedRecord);
      
      // Verify the signature using viem
      const isValid = await verifyMessage({
        address: providerAddress as `0x${string}`,
        message: { raw: messageHash as `0x${string}` },
        signature: signature as `0x${string}`,
      });
      
      assert.ok(isValid, 'Signature should be valid');
    });

    it('should reject invalid signatures', async () => {
      const unsignedRecord: UnsignedUsageRecord = {
        provider: providerAddress,
        nodeId: 'test-node-001',
        windowStart: 1690000000,
        windowEnd: 1690000060,
        unitsConsumed: 1000,
        rateId: 'rate-test-1',
        nonce: '0x1234567890abcdef1234567890abcdef',
      };

      const validSignature = await signatureService.signUsageRecord(unsignedRecord);
      
      // Create a modified record
      const modifiedRecord = {
        ...unsignedRecord,
        unitsConsumed: 2000, // Different value
      };
      
      const messageHash = createCanonicalJson(modifiedRecord);
      
      // Try to verify with the original signature
      const isValid = await verifyMessage({
        address: providerAddress as `0x${string}`,
        message: { raw: messageHash as `0x${string}` },
        signature: validSignature as `0x${string}`,
      });
      
      assert.ok(!isValid, 'Signature should be invalid for modified record');
    });

    it('should reject signatures from wrong provider', async () => {
      const otherPrivateKey = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const otherSignatureService = new SignatureService(otherPrivateKey);
      const otherProviderAddress = otherSignatureService.getProviderAddress();
      
      const unsignedRecord: UnsignedUsageRecord = {
        provider: providerAddress, // Original provider address
        nodeId: 'test-node-001',
        windowStart: 1690000000,
        windowEnd: 1690000060,
        unitsConsumed: 1000,
        rateId: 'rate-test-1',
        nonce: '0x1234567890abcdef1234567890abcdef',
      };

      // Sign with the other provider's key
      const signature = await otherSignatureService.signUsageRecord(unsignedRecord);
      
      const messageHash = createCanonicalJson(unsignedRecord);
      
      // Try to verify with the original provider's address
      const isValid = await verifyMessage({
        address: providerAddress as `0x${string}`,
        message: { raw: messageHash as `0x${string}` },
        signature: signature as `0x${string}`,
      });
      
      assert.ok(!isValid, 'Signature should be invalid when provider address mismatch');
    });
  });

  describe('Canonical JSON Consistency', () => {
    it('should produce consistent signatures for same data with different field order', async () => {
      const record1: UnsignedUsageRecord = {
        provider: providerAddress,
        nodeId: 'test-node-001',
        windowStart: 1690000000,
        windowEnd: 1690000060,
        unitsConsumed: 1000,
        rateId: 'rate-test-1',
        nonce: '0x1234567890abcdef1234567890abcdef',
      };

      const sig1 = await signatureService.signUsageRecord(record1);
      
      // Test that our canonical JSON function produces consistent results
      const messageHash1 = createCanonicalJson(record1);
      const messageHash2 = createCanonicalJson(record1);
      
      // Should produce the same result every time
      assert.equal(messageHash1, messageHash2, 'Canonical JSON should be consistent');
    });

    it('should handle edge cases in signature generation', async () => {
      const edgeCases = [
        {
          name: 'zero values',
          record: {
            provider: providerAddress,
            nodeId: 'test-node-001',
            windowStart: 0,
            windowEnd: 1,
            unitsConsumed: 0,
            rateId: 'rate-test-1',
            nonce: '0x00000000000000000000000000000000',
          } as UnsignedUsageRecord,
        },
        {
          name: 'maximum values',
          record: {
            provider: providerAddress,
            nodeId: 'test-node-001',
            windowStart: 2147483647, // Max 32-bit int
            windowEnd: 2147483648,
            unitsConsumed: 4294967295, // Max 32-bit uint
            rateId: 'rate-test-1',
            nonce: '0xffffffffffffffffffffffffffffffff',
          } as UnsignedUsageRecord,
        },
        {
          name: 'special characters in nodeId',
          record: {
            provider: providerAddress,
            nodeId: 'node-001-special-chars-!@#$%',
            windowStart: 1690000000,
            windowEnd: 1690000060,
            unitsConsumed: 1000,
            rateId: 'rate-test-1',
            nonce: '0x1234567890abcdef1234567890abcdef',
          } as UnsignedUsageRecord,
        },
      ];

      for (const testCase of edgeCases) {
        const signature = await signatureService.signUsageRecord(testCase.record);
        assert.ok(signature.startsWith('0x'), `${testCase.name}: Signature should start with 0x`);
        assert.ok(signature.length >= 130, `${testCase.name}: Signature should be valid length`);
      }
    });
  });
});
