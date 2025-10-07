import { Command } from 'commander';
import { InvoicingService } from '../services/invoicingService.js';
import { BlockchainEventService } from '../services/blockchainEventService.js';
import { RateCardService } from '../services/rateCardService.js';
import { PDFInvoiceGenerator } from '../services/pdfInvoiceGenerator.js';
import { CSVInvoiceGenerator } from '../services/csvInvoiceGenerator.js';
import { InvoiceHashService } from '../services/invoiceHashService.js';
import { BlockchainAnchorService } from '../services/blockchainAnchorService.js';
import { loadEnv } from '../config/env.js';

const program = new Command();

program
  .name('edgecharge-invoicing')
  .description('EdgeCharge invoicing service for generating and anchoring invoices')
  .version('1.0.0');

program
  .command('start')
  .description('Start the invoicing service')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      console.log('🚀 Starting EdgeCharge invoicing service...');
      
      // Initialize services
      const blockchainEventService = new BlockchainEventService();
      const rateCardService = new RateCardService();
      const pdfGenerator = new PDFInvoiceGenerator();
      const csvGenerator = new CSVInvoiceGenerator();
      const hashService = new InvoiceHashService();
      const anchorService = new BlockchainAnchorService();
      
      const invoicingService = new InvoicingService(
        blockchainEventService,
        rateCardService,
        pdfGenerator,
        csvGenerator,
        hashService,
        anchorService,
      );

      // Start the service
      await invoicingService.start();

      // Handle graceful shutdown
      const shutdown = async () => {
        console.log('\n🛑 Shutting down invoicing service...');
        await invoicingService.stop();
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      // Keep the process running
      console.log('✅ Invoicing service is running. Press Ctrl+C to stop.');
      
    } catch (error) {
      console.error('❌ Failed to start invoicing service:', error);
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate invoice for specific anchors or provider')
  .option('-p, --provider <address>', 'Provider address')
  .option('-s, --start <timestamp>', 'Start timestamp')
  .option('-e, --end <timestamp>', 'End timestamp')
  .option('-a, --anchors <ids>', 'Comma-separated anchor IDs')
  .action(async (options) => {
    try {
      console.log('📋 Generating invoice...');
      
      // Initialize services
      const blockchainEventService = new BlockchainEventService();
      const rateCardService = new RateCardService();
      const pdfGenerator = new PDFInvoiceGenerator();
      const csvGenerator = new CSVInvoiceGenerator();
      const hashService = new InvoiceHashService();
      const anchorService = new BlockchainAnchorService();
      
      const invoicingService = new InvoicingService(
        blockchainEventService,
        rateCardService,
        pdfGenerator,
        csvGenerator,
        hashService,
        anchorService,
      );

      let invoice = null;

      if (options.anchors) {
        const anchorIds = options.anchors.split(',').map((id: string) => id.trim());
        invoice = await invoicingService.generateInvoiceForAnchors(anchorIds);
      } else if (options.provider && options.start && options.end) {
        const startTime = parseInt(options.start, 10);
        const endTime = parseInt(options.end, 10);
        invoice = await invoicingService.generateInvoiceForProvider(
          options.provider,
          startTime,
          endTime
        );
      } else {
        console.error('❌ Please provide either --anchors or --provider with --start and --end');
        process.exit(1);
      }

      if (invoice) {
        console.log(`✅ Generated invoice: ${invoice.invoiceId}`);
        console.log(`💰 Amount: $${invoice.amount}`);
        console.log(`📅 Period: ${new Date(invoice.billingPeriod.start * 1000).toLocaleDateString()} - ${new Date(invoice.billingPeriod.end * 1000).toLocaleDateString()}`);
      } else {
        console.log('⚠️  No invoice generated');
      }
      
    } catch (error) {
      console.error('❌ Failed to generate invoice:', error);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all generated invoices')
  .option('-s, --status <status>', 'Filter by status (draft, generated, anchored, paid)')
  .action(async (options) => {
    try {
      console.log('📋 Listing invoices...');
      
      // Initialize services
      const blockchainEventService = new BlockchainEventService();
      const rateCardService = new RateCardService();
      const pdfGenerator = new PDFInvoiceGenerator();
      const csvGenerator = new CSVInvoiceGenerator();
      const hashService = new InvoiceHashService();
      const anchorService = new BlockchainAnchorService();
      
      const invoicingService = new InvoicingService(
        blockchainEventService,
        rateCardService,
        pdfGenerator,
        csvGenerator,
        hashService,
        anchorService,
      );

      const invoices = invoicingService.getInvoices();
      const filteredInvoices = options.status 
        ? invoices.filter(invoice => invoice.status === options.status)
        : invoices;

      if (filteredInvoices.length === 0) {
        console.log('📭 No invoices found');
        return;
      }

      console.log(`📊 Found ${filteredInvoices.length} invoices:`);
      console.log('');

      filteredInvoices.forEach(invoice => {
        console.log(`📄 Invoice ${invoice.invoiceId}`);
        console.log(`   Status: ${invoice.status}`);
        console.log(`   Amount: $${invoice.amount} ${invoice.currency}`);
        console.log(`   Provider: ${invoice.provider}`);
        console.log(`   Period: ${new Date(invoice.billingPeriod.start * 1000).toLocaleDateString()} - ${new Date(invoice.billingPeriod.end * 1000).toLocaleDateString()}`);
        console.log(`   Created: ${new Date(invoice.createdAt * 1000).toLocaleString()}`);
        if (invoice.metadata?.invoiceHash) {
          console.log(`   Hash: ${invoice.metadata.invoiceHash}`);
        }
        if (invoice.metadata?.blockchainTxHash) {
          console.log(`   TX: ${invoice.metadata.blockchainTxHash}`);
        }
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Failed to list invoices:', error);
      process.exit(1);
    }
  });

program
  .command('anchor')
  .description('Anchor an invoice on the blockchain')
  .argument('<invoiceId>', 'Invoice ID to anchor')
  .action(async (invoiceId) => {
    try {
      console.log(`🔗 Anchoring invoice ${invoiceId}...`);
      
      // Initialize services
      const blockchainEventService = new BlockchainEventService();
      const rateCardService = new RateCardService();
      const pdfGenerator = new PDFInvoiceGenerator();
      const csvGenerator = new CSVInvoiceGenerator();
      const hashService = new InvoiceHashService();
      const anchorService = new BlockchainAnchorService();
      
      const invoicingService = new InvoicingService(
        blockchainEventService,
        rateCardService,
        pdfGenerator,
        csvGenerator,
        hashService,
        anchorService,
      );

      const invoice = invoicingService.getInvoice(invoiceId);
      if (!invoice) {
        console.error(`❌ Invoice ${invoiceId} not found`);
        process.exit(1);
      }

      if (!invoice.metadata?.invoiceHash) {
        console.error(`❌ Invoice ${invoiceId} has no hash`);
        process.exit(1);
      }

      const result = await anchorService.anchorInvoice(invoice, invoice.metadata.invoiceHash);
      
      if (result.success) {
        console.log(`✅ Invoice ${invoiceId} anchored successfully`);
        console.log(`📦 Transaction: ${result.transactionHash}`);
      } else {
        console.error(`❌ Failed to anchor invoice: ${result.error}`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Failed to anchor invoice:', error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show service status and statistics')
  .action(async () => {
    try {
      console.log('📊 Service Status');
      console.log('================');
      
      // Initialize services
      const blockchainEventService = new BlockchainEventService();
      const rateCardService = new RateCardService();
      const pdfGenerator = new PDFInvoiceGenerator();
      const csvGenerator = new CSVInvoiceGenerator();
      const hashService = new InvoiceHashService();
      const anchorService = new BlockchainAnchorService();
      
      const invoicingService = new InvoicingService(
        blockchainEventService,
        rateCardService,
        pdfGenerator,
        csvGenerator,
        hashService,
        anchorService,
      );

      const stats = invoicingService.getServiceStats();
      
      console.log(`🔄 Service Running: ${stats.isRunning ? '✅ Yes' : '❌ No'}`);
      console.log(`📄 Total Invoices: ${stats.totalInvoices}`);
      console.log(`⏳ Pending Anchors: ${stats.pendingAnchors}`);
      console.log('');
      console.log('📊 Invoices by Status:');
      Object.entries(stats.invoicesByStatus).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });

      // Check blockchain configuration
      console.log('');
      console.log('🔗 Blockchain Configuration:');
      const configCheck = await anchorService.checkConfiguration();
      if (configCheck.isValid) {
        console.log('   ✅ Configuration is valid');
      } else {
        console.log('   ❌ Configuration issues:');
        configCheck.errors.forEach(error => {
          console.log(`      - ${error}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to get service status:', error);
      process.exit(1);
    }
  });

program
  .command('rate-cards')
  .description('Manage rate cards')
  .option('-l, --list', 'List all rate cards')
  .option('-a, --add <file>', 'Add rate cards from JSON file')
  .action(async (options) => {
    try {
      const rateCardService = new RateCardService();
      await rateCardService.loadRateCards();

      if (options.list) {
        console.log('📋 Rate Cards:');
        const rateCards = await rateCardService.getAllRateCards();
        
        if (rateCards.length === 0) {
          console.log('📭 No rate cards found');
          return;
        }

        rateCards.forEach(rateCard => {
          console.log(`📄 ${rateCard.rateId}`);
          console.log(`   Name: ${rateCard.name}`);
          console.log(`   Provider: ${rateCard.provider}`);
          console.log(`   Price: $${rateCard.unitPrice} per ${rateCard.unit}`);
          console.log(`   Active: ${rateCard.isActive ? '✅' : '❌'}`);
          console.log('');
        });
      } else if (options.add) {
        console.log(`➕ Adding rate cards from ${options.add}...`);
        // Implementation for adding rate cards from file
        console.log('⚠️  Rate card import not yet implemented');
      } else {
        console.log('❌ Please specify --list or --add');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Failed to manage rate cards:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
