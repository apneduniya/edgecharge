import { UsageRecord, UnsignedUsageRecord } from '../domain/usageRecord.js';
import { ProviderConfig } from '../domain/providerConfig.js';
import { IUsageSimulator } from './usageSimulator.js';
import { ISignatureService } from './signatureService.js';
import { IRelayerClient } from './relayerClient.js';
import { INonceGenerator } from './nonceGenerator.js';

export interface IProviderService {
  generateAndSubmitUsageRecord(): Promise<UsageRecord>;
  startContinuousSubmission(): void;
  stopContinuousSubmission(): void;
}

export class ProviderService implements IProviderService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private config: ProviderConfig,
    private usageSimulator: IUsageSimulator,
    private signatureService: ISignatureService,
    private relayerClient: IRelayerClient,
    private nonceGenerator: INonceGenerator,
  ) {}

  async generateAndSubmitUsageRecord(): Promise<UsageRecord> {
    // Generate usage simulation
    const simulation = this.usageSimulator.simulateUsage();
    
    // Create unsigned usage record
    const unsignedRecord: UnsignedUsageRecord = {
      provider: this.signatureService.getProviderAddress(),
      nodeId: this.config.nodeId,
      windowStart: simulation.windowStart,
      windowEnd: simulation.windowEnd,
      unitsConsumed: simulation.metrics.computeUnits,
      rateId: this.config.simulationConfig.rateId,
      nonce: this.nonceGenerator.generateNonce(),
    };

    // Sign the record
    const signature = await this.signatureService.signUsageRecord(unsignedRecord);
    
    // Create signed record
    const signedRecord: UsageRecord = {
      ...unsignedRecord,
      providerSig: signature,
    };

    // Submit to relayer
    try {
      const result = await this.relayerClient.submitUsageRecord(signedRecord);
      console.log(`✅ Usage record submitted successfully:`, {
        nodeId: signedRecord.nodeId,
        windowStart: new Date(signedRecord.windowStart * 1000).toISOString(),
        windowEnd: new Date(signedRecord.windowEnd * 1000).toISOString(),
        unitsConsumed: signedRecord.unitsConsumed,
        gpuUtilization: `${simulation.metrics.gpuUtilization}%`,
        bandwidthBytes: `${(simulation.metrics.bandwidthBytes / (1024 * 1024)).toFixed(2)}MB`,
        status: result.status,
      });
    } catch (error) {
      console.error(`❌ Failed to submit usage record:`, error);
      throw error;
    }

    return signedRecord;
  }

  startContinuousSubmission(): void {
    if (this.isRunning) {
      console.log('⚠️  Provider service is already running');
      return;
    }

    console.log(`🚀 Starting continuous usage record submission...`);
    console.log(`📊 Submission interval: ${this.config.submissionIntervalMs}ms`);
    console.log(`🔗 Relayer URL: ${this.config.relayerUrl}`);
    console.log(`🖥️  Node ID: ${this.config.nodeId}`);
    console.log(`👤 Provider address: ${this.signatureService.getProviderAddress()}`);

    this.isRunning = true;
    
    // Submit immediately, then on interval
    this.generateAndSubmitUsageRecord().catch(console.error);
    
    this.intervalId = setInterval(async () => {
      try {
        await this.generateAndSubmitUsageRecord();
      } catch (error) {
        console.error('Error in continuous submission:', error);
      }
    }, this.config.submissionIntervalMs);
  }

  stopContinuousSubmission(): void {
    if (!this.isRunning) {
      console.log('⚠️  Provider service is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('🛑 Stopped continuous usage record submission');
  }

  isSubmissionRunning(): boolean {
    return this.isRunning;
  }
}
