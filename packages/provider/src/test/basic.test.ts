import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UsageSimulator } from '../services/usageSimulator.js';
import { NonceGenerator } from '../services/nonceGenerator.js';
import { SignatureService } from '../services/signatureService.js';
import { RelayerClient } from '../services/relayerClient.js';
import { ProviderService } from '../services/providerService.js';
import { ProviderConfig } from '../domain/providerConfig.js';

describe('Provider Services', () => {
  const mockConfig: ProviderConfig = {
    providerPrivateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
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

  describe('UsageSimulator', () => {
    it('should generate usage simulation with valid metrics', () => {
      const simulator = new UsageSimulator(mockConfig.simulationConfig);
      const simulation = simulator.simulateUsage();

      assert.ok(simulation.metrics.gpuUtilization >= 0);
      assert.ok(simulation.metrics.gpuUtilization <= 100);
      assert.ok(simulation.metrics.bandwidthBytes >= 0);
      assert.ok(simulation.metrics.computeUnits >= 0);
      assert.ok(simulation.windowStart < simulation.windowEnd);
      assert.ok(simulation.timestamp > 0);
    });

    it('should generate different simulations over time', () => {
      const simulator = new UsageSimulator(mockConfig.simulationConfig);
      const sim1 = simulator.simulateUsage();
      
      // Wait a bit to ensure different timestamps
      const sim2 = simulator.simulateUsage();

      assert.ok(sim1.timestamp !== sim2.timestamp || 
                sim1.metrics.gpuUtilization !== sim2.metrics.gpuUtilization ||
                sim1.metrics.bandwidthBytes !== sim2.metrics.bandwidthBytes);
    });
  });

  describe('NonceGenerator', () => {
    it('should generate unique nonces', () => {
      const generator = new NonceGenerator();
      const nonce1 = generator.generateNonce();
      const nonce2 = generator.generateNonce();

      assert.ok(nonce1.startsWith('0x'));
      assert.ok(nonce2.startsWith('0x'));
      assert.ok(nonce1.length === 34); // 0x + 32 hex chars
      assert.ok(nonce2.length === 34);
      assert.notEqual(nonce1, nonce2);
    });
  });

  describe('SignatureService', () => {
    it('should generate provider address from private key', () => {
      const service = new SignatureService(mockConfig.providerPrivateKey as `0x${string}`);
      const address = service.getProviderAddress();

      assert.ok(address.startsWith('0x'));
      assert.ok(address.length === 42); // 0x + 40 hex chars
    });

    it('should sign usage records', async () => {
      const service = new SignatureService(mockConfig.providerPrivateKey as `0x${string}`);
      const unsignedRecord = {
        provider: service.getProviderAddress(),
        nodeId: 'test-node',
        windowStart: Math.floor(Date.now() / 1000) - 60,
        windowEnd: Math.floor(Date.now() / 1000),
        unitsConsumed: 1000,
        rateId: 'rate-test',
        nonce: '0x1234567890abcdef1234567890abcdef',
      };

      const signature = await service.signUsageRecord(unsignedRecord);
      
      assert.ok(signature.startsWith('0x'));
      assert.ok(signature.length > 130); // ECDSA signature length
    });
  });

  describe('RelayerClient', () => {
    it('should construct with valid base URL', () => {
      const client = new RelayerClient('http://localhost:8787');
      assert.ok(client);
    });

    it('should handle URLs with trailing slashes', () => {
      const client = new RelayerClient('http://localhost:8787/');
      assert.ok(client);
    });
  });

  describe('ProviderService', () => {
    it('should initialize without errors', () => {
      const usageSimulator = new UsageSimulator(mockConfig.simulationConfig);
      const signatureService = new SignatureService(mockConfig.providerPrivateKey as `0x${string}`);
      const relayerClient = new RelayerClient(mockConfig.relayerUrl);
      const nonceGenerator = new NonceGenerator();
      
      const service = new ProviderService(
        mockConfig,
        usageSimulator,
        signatureService,
        relayerClient,
        nonceGenerator,
      );

      assert.ok(service);
      assert.equal(service.isSubmissionRunning(), false);
    });
  });
});
