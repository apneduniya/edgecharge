import { v4 as uuidv4 } from 'uuid';
import { Invoice, InvoiceSchema } from '../domain/invoice.js';
import { UsageAnchorEvent } from '../domain/usageAnchor.js';
import { IBlockchainEventService } from './blockchainEventService.js';
import { IRateCardService } from './rateCardService.js';
import { IInvoiceGenerator } from './pdfInvoiceGenerator.js';
import { ICSVInvoiceGenerator } from './csvInvoiceGenerator.js';
import { IInvoiceHashService } from './invoiceHashService.js';
import { IBlockchainAnchorService } from './blockchainAnchorService.js';
import { loadEnv } from '../config/env.js';

export interface IInvoicingService {
  start(): Promise<void>;
  stop(): Promise<void>;
  processUsageAnchorEvent(event: UsageAnchorEvent): Promise<void>;
  generateInvoiceForAnchors(anchorIds: string[]): Promise<Invoice | null>;
  generateInvoiceForProvider(provider: string, startTime: number, endTime: number): Promise<Invoice | null>;
  getInvoices(): Invoice[];
  getInvoice(invoiceId: string): Invoice | null;
  isRunning(): boolean;
}

export class InvoicingService implements IInvoicingService {
  private isServiceRunning = false;
  private invoices: Map<string, Invoice> = new Map();
  private pendingAnchors: Map<string, UsageAnchorEvent> = new Map();
  private env: ReturnType<typeof loadEnv>;

  constructor(
    private blockchainEventService: IBlockchainEventService,
    private rateCardService: IRateCardService,
    private pdfGenerator: IInvoiceGenerator,
    private csvGenerator: ICSVInvoiceGenerator,
    private hashService: IInvoiceHashService,
    private anchorService: IBlockchainAnchorService,
  ) {
    this.env = loadEnv();
  }

  async start(): Promise<void> {
    if (this.isServiceRunning) {
      console.log('⚠️  Invoicing service is already running');
      return;
    }

    console.log('🚀 Starting EdgeCharge invoicing service...');

    try {
      // Load rate cards
      await this.rateCardService.loadRateCards();
      console.log('✅ Rate cards loaded');

      // Check blockchain configuration
      const configCheck = await this.anchorService.checkConfiguration();
      if (!configCheck.isValid) {
        console.error('❌ Blockchain configuration issues:', configCheck.errors);
        throw new Error('Blockchain configuration is invalid');
      }
      console.log('✅ Blockchain configuration verified');

      // Start listening for blockchain events
      await this.blockchainEventService.startListening(
        this.processUsageAnchorEvent.bind(this)
      );
      console.log('✅ Blockchain event listener started');

      this.isServiceRunning = true;
      console.log('🎉 Invoicing service started successfully');

      // Start periodic invoice generation if enabled
      if (this.env.AUTO_GENERATE_INVOICES) {
        this.startPeriodicInvoiceGeneration();
      }

    } catch (error) {
      console.error('❌ Failed to start invoicing service:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isServiceRunning) {
      console.log('⚠️  Invoicing service is not running');
      return;
    }

    console.log('🛑 Stopping invoicing service...');

    try {
      this.blockchainEventService.stopListening();
      this.isServiceRunning = false;
      console.log('✅ Invoicing service stopped');
    } catch (error) {
      console.error('❌ Error stopping invoicing service:', error);
      throw error;
    }
  }

  async processUsageAnchorEvent(event: UsageAnchorEvent): Promise<void> {
    console.log(`📊 Processing UsageAnchored event: ${event.anchorId}`);

    try {
      // Store the anchor event
      this.pendingAnchors.set(event.anchorId, event);

      // Check if we should auto-generate invoices
      if (this.env.AUTO_GENERATE_INVOICES) {
        // Add a delay before generating invoice to allow for batching
        setTimeout(async () => {
          await this.generateInvoiceForProvider(
            event.provider,
            event.windowStart,
            event.windowEnd
          );
        }, this.env.INVOICE_GENERATION_DELAY_MS);
      }

      console.log(`✅ Processed UsageAnchored event: ${event.anchorId}`);
    } catch (error) {
      console.error(`❌ Error processing UsageAnchored event ${event.anchorId}:`, error);
    }
  }

  async generateInvoiceForAnchors(anchorIds: string[]): Promise<Invoice | null> {
    console.log(`📋 Generating invoice for ${anchorIds.length} anchors`);

    try {
      const anchors = anchorIds
        .map(id => this.pendingAnchors.get(id))
        .filter((anchor): anchor is UsageAnchorEvent => anchor !== undefined);

      if (anchors.length === 0) {
        console.log('⚠️  No valid anchors found for invoice generation');
        return null;
      }

      // Group anchors by provider
      const anchorsByProvider = new Map<string, UsageAnchorEvent[]>();
      anchors.forEach(anchor => {
        const existing = anchorsByProvider.get(anchor.provider) || [];
        existing.push(anchor);
        anchorsByProvider.set(anchor.provider, existing);
      });

      // Generate invoice for the first provider (in a real system, you might want to handle multiple providers)
      const firstEntry = anchorsByProvider.entries().next().value;
      if (!firstEntry) {
        console.log('⚠️  No provider entries found');
        return null;
      }
      const [provider, providerAnchors] = firstEntry;
      return await this.generateInvoiceForProviderAnchors(provider, providerAnchors);

    } catch (error) {
      console.error('❌ Error generating invoice for anchors:', error);
      return null;
    }
  }

  async generateInvoiceForProvider(provider: string, startTime: number, endTime: number): Promise<Invoice | null> {
    console.log(`📋 Generating invoice for provider ${provider} from ${startTime} to ${endTime}`);

    try {
      // Find anchors for this provider in the time range
      const relevantAnchors = Array.from(this.pendingAnchors.values())
        .filter(anchor => 
          anchor.provider.toLowerCase() === provider.toLowerCase() &&
          anchor.windowStart >= startTime &&
          anchor.windowEnd <= endTime
        );

      if (relevantAnchors.length === 0) {
        console.log('⚠️  No anchors found for the specified provider and time range');
        return null;
      }

      return await this.generateInvoiceForProviderAnchors(provider, relevantAnchors);

    } catch (error) {
      console.error('❌ Error generating invoice for provider:', error);
      return null;
    }
  }

  private async generateInvoiceForProviderAnchors(provider: string, anchors: UsageAnchorEvent[]): Promise<Invoice | null> {
    try {
      // Generate unique invoice ID
      const invoiceId = uuidv4();
      const now = Math.floor(Date.now() / 1000);
      const dueDate = now + (this.env.DEFAULT_DUE_DAYS * 24 * 60 * 60);

      // Calculate billing period
      const windowStarts = anchors.map(a => a.windowStart);
      const windowEnds = anchors.map(a => a.windowEnd);
      const billingPeriodStart = Math.min(...windowStarts);
      const billingPeriodEnd = Math.max(...windowEnds);

      // Generate line items
      const lineItems = [];
      let totalAmount = 0;

      for (const anchor of anchors) {
        // For demo purposes, we'll use a default rate ID
        // In production, you'd determine the rate ID based on the anchor data
        const rateId = 'rate-gpu-bandwidth-1';
        
        const cost = await this.rateCardService.calculateCost(rateId, provider, anchor.totalUsage);
        
        const lineItem = {
          description: `Edge computing usage - ${new Date(anchor.windowStart * 1000).toLocaleDateString()}`,
          quantity: anchor.totalUsage,
          unitPrice: cost / anchor.totalUsage,
          total: cost,
          rateId: rateId,
          usageData: {
            anchorId: anchor.anchorId,
            windowStart: anchor.windowStart,
            windowEnd: anchor.windowEnd,
            unitsConsumed: anchor.totalUsage,
          },
        };

        lineItems.push(lineItem);
        totalAmount += cost;
      }

      // Create invoice
      const invoice: Invoice = {
        invoiceId: invoiceId,
        enterprise: this.env.ENTERPRISE_ADDRESS,
        provider: provider,
        amount: Math.round(totalAmount * 100) / 100, // Round to 2 decimal places
        currency: this.env.DEFAULT_CURRENCY,
        status: 'draft',
        createdAt: now,
        dueDate: dueDate,
        billingPeriod: {
          start: billingPeriodStart,
          end: billingPeriodEnd,
        },
        lineItems: lineItems,
        metadata: {
          generatedAt: now,
        },
      };

      // Validate invoice
      const validation = InvoiceSchema.safeParse(invoice);
      if (!validation.success) {
        console.error('❌ Invalid invoice generated:', validation.error);
        return null;
      }

      // Generate files
      const pdfPath = await this.pdfGenerator.generate(invoice);
      const csvPath = await this.csvGenerator.generate(invoice);

      // Compute invoice hash
      const invoiceHash = this.hashService.computeInvoiceHash(invoice);
      invoice.metadata = {
        ...invoice.metadata,
        invoiceHash: invoiceHash,
      };

      // Store invoice
      this.invoices.set(invoiceId, invoice);

      console.log(`✅ Generated invoice ${invoiceId}`);
      console.log(`📄 PDF: ${pdfPath}`);
      console.log(`📊 CSV: ${csvPath}`);
      console.log(`🔗 Hash: ${invoiceHash}`);

      // Anchor invoice on blockchain if enabled
      if (this.env.AUTO_ANCHOR_INVOICES) {
        await this.anchorInvoiceOnBlockchain(invoice, invoiceHash);
      }

      return invoice;

    } catch (error) {
      console.error('❌ Error generating invoice for provider anchors:', error);
      return null;
    }
  }

  private async anchorInvoiceOnBlockchain(invoice: Invoice, invoiceHash: string): Promise<void> {
    try {
      console.log(`🔗 Anchoring invoice ${invoice.invoiceId} on blockchain...`);

      const result = await this.anchorService.anchorInvoice(invoice, invoiceHash);
      
      if (result.success) {
        // Update invoice metadata
        const updatedInvoice = {
          ...invoice,
          status: 'anchored' as const,
          metadata: {
            ...invoice.metadata,
            blockchainTxHash: result.transactionHash,
            anchoredAt: Math.floor(Date.now() / 1000),
          },
        };

        this.invoices.set(invoice.invoiceId, updatedInvoice);
        console.log(`✅ Invoice ${invoice.invoiceId} anchored on blockchain`);
      } else {
        console.error(`❌ Failed to anchor invoice ${invoice.invoiceId}: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error anchoring invoice ${invoice.invoiceId}:`, error);
    }
  }

  private startPeriodicInvoiceGeneration(): void {
    // Generate invoices every hour for pending anchors
    setInterval(async () => {
      if (!this.isServiceRunning) return;

      const pendingAnchors = Array.from(this.pendingAnchors.values());
      if (pendingAnchors.length === 0) return;

      console.log(`⏰ Periodic invoice generation: ${pendingAnchors.length} pending anchors`);

      // Group by provider and generate invoices
      const anchorsByProvider = new Map<string, UsageAnchorEvent[]>();
      pendingAnchors.forEach(anchor => {
        const existing = anchorsByProvider.get(anchor.provider) || [];
        existing.push(anchor);
        anchorsByProvider.set(anchor.provider, existing);
      });

      for (const [provider, anchors] of anchorsByProvider.entries()) {
        try {
          await this.generateInvoiceForProviderAnchors(provider, anchors);
          
          // Remove processed anchors
          anchors.forEach(anchor => {
            this.pendingAnchors.delete(anchor.anchorId);
          });
        } catch (error) {
          console.error(`❌ Error in periodic invoice generation for ${provider}:`, error);
        }
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  getInvoices(): Invoice[] {
    return Array.from(this.invoices.values());
  }

  getInvoice(invoiceId: string): Invoice | null {
    return this.invoices.get(invoiceId) || null;
  }

  isRunning(): boolean {
    return this.isServiceRunning;
  }

  // Helper method to get pending anchors
  getPendingAnchors(): UsageAnchorEvent[] {
    return Array.from(this.pendingAnchors.values());
  }

  // Helper method to clear pending anchors (for testing)
  clearPendingAnchors(): void {
    this.pendingAnchors.clear();
  }

  // Helper method to get service statistics
  getServiceStats(): {
    isRunning: boolean;
    totalInvoices: number;
    pendingAnchors: number;
    invoicesByStatus: Record<string, number>;
  } {
    const invoices = this.getInvoices();
    const invoicesByStatus = invoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      isRunning: this.isServiceRunning,
      totalInvoices: invoices.length,
      pendingAnchors: this.pendingAnchors.size,
      invoicesByStatus,
    };
  }
}
