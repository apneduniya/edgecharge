import { Command } from 'commander';
import { loadProviderConfig } from '../config/env.js';
import { UsageSimulator } from '../services/usageSimulator.js';
import { SignatureService } from '../services/signatureService.js';
import { RelayerClient } from '../services/relayerClient.js';
import { NonceGenerator } from '../services/nonceGenerator.js';
import { ProviderService } from '../services/providerService.js';

const program = new Command();

program
  .name('edgecharge-provider')
  .description('EdgeCharge provider agent for generating signed usage records')
  .version('1.0.0');

program
  .command('start')
  .description('Start continuous usage record generation and submission')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (options) => {
    try {
      const config = loadProviderConfig();
      
      // Initialize services
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

      // Check relayer health before starting
      console.log('🔍 Checking relayer health...');
      try {
        const health = await relayerClient.checkHealth();
        if (health.ok) {
          console.log('✅ Relayer is healthy');
        } else {
          console.log('⚠️  Relayer health check returned false');
        }
      } catch (error) {
        console.error('❌ Relayer health check failed:', error);
        console.log('💡 Make sure the relayer is running and accessible');
        process.exit(1);
      }

      // Start continuous submission
      providerService.startContinuousSubmission();

      // Handle graceful shutdown
      const shutdown = () => {
        console.log('\n🛑 Shutting down provider service...');
        providerService.stopContinuousSubmission();
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

    } catch (error) {
      console.error('❌ Failed to start provider service:', error);
      process.exit(1);
    }
  });

program
  .command('submit-once')
  .description('Generate and submit a single usage record')
  .action(async () => {
    try {
      const config = loadProviderConfig();
      
      // Initialize services
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

      // Check relayer health
      console.log('🔍 Checking relayer health...');
      try {
        const health = await relayerClient.checkHealth();
        if (health.ok) {
          console.log('✅ Relayer is healthy');
        } else {
          console.log('⚠️  Relayer health check returned false');
        }
      } catch (error) {
        console.error('❌ Relayer health check failed:', error);
        console.log('💡 Make sure the relayer is running and accessible');
        process.exit(1);
      }

      // Submit single record
      await providerService.generateAndSubmitUsageRecord();
      console.log('✅ Single usage record submitted successfully');
      
    } catch (error) {
      console.error('❌ Failed to submit usage record:', error);
      process.exit(1);
    }
  });

program
  .command('simulate')
  .description('Generate usage simulation data without submitting')
  .option('-n, --count <number>', 'Number of simulations to generate', '5')
  .action(async (options) => {
    try {
      const config = loadProviderConfig();
      const count = parseInt(options.count, 10);
      
      const usageSimulator = new UsageSimulator(config.simulationConfig);
      
      console.log(`🎲 Generating ${count} usage simulations...\n`);
      
      for (let i = 0; i < count; i++) {
        const simulation = usageSimulator.simulateUsage();
        console.log(`Simulation ${i + 1}:`);
        console.log(`  GPU Utilization: ${simulation.metrics.gpuUtilization}%`);
        console.log(`  Bandwidth: ${(simulation.metrics.bandwidthBytes / (1024 * 1024)).toFixed(2)}MB`);
        console.log(`  Compute Units: ${simulation.metrics.computeUnits}`);
        console.log(`  Window: ${new Date(simulation.windowStart * 1000).toISOString()} - ${new Date(simulation.windowEnd * 1000).toISOString()}`);
        console.log('');
      }
      
    } catch (error) {
      console.error('❌ Failed to generate simulations:', error);
      process.exit(1);
    }
  });

program
  .command('health')
  .description('Check relayer health')
  .action(async () => {
    try {
      const config = loadProviderConfig();
      const relayerClient = new RelayerClient(config.relayerUrl);
      
      console.log(`🔍 Checking relayer health at ${config.relayerUrl}...`);
      const health = await relayerClient.checkHealth();
      
      if (health.ok) {
        console.log('✅ Relayer is healthy');
      } else {
        console.log('⚠️  Relayer health check returned false');
      }
      
    } catch (error) {
      console.error('❌ Relayer health check failed:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
