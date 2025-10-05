export * from './domain/usageRecord.js';
export * from './domain/usageSimulation.js';
export * from './domain/providerConfig.js';
export * from './services/usageSimulator.js';
export * from './services/signatureService.js';
export * from './services/relayerClient.js';
export * from './services/nonceGenerator.js';
export * from './services/providerService.js';
export * from './config/env.js';

// CLI entry point
declare const process: any;
if (import.meta.url === `file://${process.argv[1]}`) {
  import('./cli/index.js');
}
