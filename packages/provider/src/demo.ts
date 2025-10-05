#!/usr/bin/env tsx

/**
 * Demo script showing how to use the EdgeCharge Provider
 * 
 * This script demonstrates:
 * 1. Usage simulation
 * 2. Record signing
 * 3. Single record submission
 * 4. Continuous operation (with manual stop)
 */

import { loadProviderConfig } from './config/env.js';
import { UsageSimulator } from './services/usageSimulator.js';
import { SignatureService } from './services/signatureService.js';
import { RelayerClient } from './services/relayerClient.js';
import { NonceGenerator } from './services/nonceGenerator.js';
import { ProviderService } from './services/providerService.js';

async function runDemo() {
  console.log('🚀 EdgeCharge Provider Demo\n');

  try {
    // Load configuration
    console.log('📋 Loading configuration...');
    const config = loadProviderConfig();
    console.log(`   Node ID: ${config.nodeId}`);
    console.log(`   Relayer URL: ${config.relayerUrl}`);
    console.log(`   Submission Interval: ${config.submissionIntervalMs}ms\n`);

    // Initialize services
    console.log('🔧 Initializing services...');
    const usageSimulator = new UsageSimulator(config.simulationConfig);
    const signatureService = new SignatureService(config.providerPrivateKey as `0x${string}`);
    const relayerClient = new RelayerClient(config.relayerUrl);
    const nonceGenerator = new NonceGenerator();
    const providerService = new ProviderService(
      config,
      usageSimulator,
      signatureService,
      relayerClient,
      nonceGenerator,
    );

    console.log(`   Provider Address: ${signatureService.getProviderAddress()}\n`);

    // Demo 1: Usage Simulation
    console.log('🎲 Demo 1: Usage Simulation');
    console.log('Generating 3 usage simulations...\n');
    
    for (let i = 0; i < 3; i++) {
      const simulation = usageSimulator.simulateUsage();
      console.log(`Simulation ${i + 1}:`);
      console.log(`  GPU Utilization: ${simulation.metrics.gpuUtilization}%`);
      console.log(`  Bandwidth: ${(simulation.metrics.bandwidthBytes / (1024 * 1024)).toFixed(2)}MB`);
      console.log(`  Compute Units: ${simulation.metrics.computeUnits}`);
      console.log(`  Window: ${new Date(simulation.windowStart * 1000).toISOString()} - ${new Date(simulation.windowEnd * 1000).toISOString()}`);
      console.log('');
    }

    // Demo 2: Check Relayer Health
    console.log('🏥 Demo 2: Relayer Health Check');
    try {
      const health = await relayerClient.checkHealth();
      console.log(`   Relayer Status: ${health.ok ? '✅ Healthy' : '⚠️  Unhealthy'}\n`);
    } catch (error) {
      console.log(`   Relayer Status: ❌ Unreachable (${error})\n`);
      console.log('💡 Make sure the relayer is running before proceeding with submission demos\n');
    }

    // Demo 3: Single Record Submission
    console.log('📤 Demo 3: Single Record Submission');
    try {
      const record = await providerService.generateAndSubmitUsageRecord();
      console.log(`   ✅ Record submitted successfully!`);
      console.log(`   Nonce: ${record.nonce}`);
      console.log(`   Signature: ${record.providerSig.substring(0, 20)}...\n`);
    } catch (error) {
      console.log(`   ❌ Submission failed: ${error}\n`);
    }

    // Demo 4: Continuous Operation (5 seconds)
    console.log('🔄 Demo 4: Continuous Operation (5 seconds)');
    console.log('Starting continuous submission...\n');
    
    providerService.startContinuousSubmission();
    
    // Stop after 5 seconds
    setTimeout(() => {
      providerService.stopContinuousSubmission();
      console.log('\n✅ Demo completed successfully!');
      console.log('\n📚 Next Steps:');
      console.log('   1. Set up your .env file with a real private key');
      console.log('   2. Ensure the relayer is running');
      console.log('   3. Run: pnpm -w --filter provider dev start');
      console.log('   4. Monitor the relayer logs for anchored usage records');
      process.exit(0);
    }, 5000);

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
runDemo();
