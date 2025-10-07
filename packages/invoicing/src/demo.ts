import { InvoicingService } from './services/invoicingService.js';
import { BlockchainEventService } from './services/blockchainEventService.js';
import { RateCardService } from './services/rateCardService.js';
import { PDFInvoiceGenerator } from './services/pdfInvoiceGenerator.js';
import { CSVInvoiceGenerator } from './services/csvInvoiceGenerator.js';
import { InvoiceHashService } from './services/invoiceHashService.js';
import { BlockchainAnchorService } from './services/blockchainAnchorService.js';
import { UsageAnchorEvent } from './domain/usageAnchor.js';

async function runDemo() {
  console.log('🎬 EdgeCharge Invoicing Service Demo');
  console.log('=====================================\n');

  try {
    // Initialize services
    console.log('🔧 Initializing services...');
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

    // Load rate cards
    console.log('📋 Loading rate cards...');
    await rateCardService.loadRateCards();
    const rateCards = await rateCardService.getAllRateCards();
    console.log(`✅ Loaded ${rateCards.length} rate cards`);

    // Check blockchain configuration
    console.log('🔗 Checking blockchain configuration...');
    const configCheck = await anchorService.checkConfiguration();
    if (configCheck.isValid) {
      console.log('✅ Blockchain configuration is valid');
    } else {
      console.log('⚠️  Blockchain configuration issues:');
      configCheck.errors.forEach(error => console.log(`   - ${error}`));
    }

    // Simulate a UsageAnchored event
    console.log('\n📊 Simulating UsageAnchored event...');
    const mockEvent: UsageAnchorEvent = {
      anchorId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      provider: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      windowStart: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      windowEnd: Math.floor(Date.now() / 1000), // now
      totalUsage: 1500,
      blockNumber: 12345,
      transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      logIndex: 0,
    };

    console.log(`📦 Anchor ID: ${mockEvent.anchorId}`);
    console.log(`👤 Provider: ${mockEvent.provider}`);
    console.log(`⏰ Window: ${new Date(mockEvent.windowStart * 1000).toLocaleString()} - ${new Date(mockEvent.windowEnd * 1000).toLocaleString()}`);
    console.log(`📊 Usage: ${mockEvent.totalUsage} units`);

    // Process the event
    await invoicingService.processUsageAnchorEvent(mockEvent);

    // Generate invoice manually
    console.log('\n📋 Generating invoice...');
    const invoice = await invoicingService.generateInvoiceForProvider(
      mockEvent.provider,
      mockEvent.windowStart,
      mockEvent.windowEnd
    );

    if (invoice) {
      console.log('✅ Invoice generated successfully!');
      console.log(`📄 Invoice ID: ${invoice.invoiceId}`);
      console.log(`💰 Amount: $${invoice.amount} ${invoice.currency}`);
      console.log(`📅 Period: ${new Date(invoice.billingPeriod.start * 1000).toLocaleDateString()} - ${new Date(invoice.billingPeriod.end * 1000).toLocaleDateString()}`);
      console.log(`📊 Line Items: ${invoice.lineItems.length}`);
      
      if (invoice.metadata?.invoiceHash) {
        console.log(`🔗 Hash: ${invoice.metadata.invoiceHash}`);
      }

      // Show service statistics
      console.log('\n📊 Service Statistics:');
      const stats = invoicingService.getServiceStats();
      console.log(`🔄 Service Running: ${stats.isRunning ? 'Yes' : 'No'}`);
      console.log(`📄 Total Invoices: ${stats.totalInvoices}`);
      console.log(`⏳ Pending Anchors: ${stats.pendingAnchors}`);
      console.log('📊 Invoices by Status:');
      Object.entries(stats.invoicesByStatus).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });

    } else {
      console.log('⚠️  No invoice generated');
    }

    console.log('\n🎉 Demo completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start the service: pnpm -w --filter invoicing cli start');
    console.log('   2. List invoices: pnpm -w --filter invoicing cli list');
    console.log('   3. Check status: pnpm -w --filter invoicing cli status');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
runDemo();
