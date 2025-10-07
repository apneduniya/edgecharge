import fs from 'node:fs';
import path from 'node:path';
import { Invoice } from '../domain/invoice.js';
import { loadEnv } from '../config/env.js';

export interface ICSVInvoiceGenerator {
  generate(invoice: Invoice): Promise<string>; // Returns file path
  generateSummary(invoices: Invoice[]): Promise<string>; // Returns file path
}

export class CSVInvoiceGenerator implements ICSVInvoiceGenerator {
  private env: ReturnType<typeof loadEnv>;
  private outputDir: string;

  constructor() {
    this.env = loadEnv();
    this.outputDir = path.resolve(this.env.INVOICE_OUTPUT_DIR);
    this.ensureOutputDirectory();
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${this.outputDir}`);
    }
  }

  async generate(invoice: Invoice): Promise<string> {
    const csvContent = this.generateCSV(invoice);
    const fileName = `invoice-${invoice.invoiceId}-${Date.now()}.csv`;
    const filePath = path.join(this.outputDir, fileName);
    
    fs.writeFileSync(filePath, csvContent);
    console.log(`📊 Generated CSV invoice: ${filePath}`);
    
    return filePath;
  }

  async generateSummary(invoices: Invoice[]): Promise<string> {
    const csvContent = this.generateSummaryCSV(invoices);
    const fileName = `invoice-summary-${Date.now()}.csv`;
    const filePath = path.join(this.outputDir, fileName);
    
    fs.writeFileSync(filePath, csvContent);
    console.log(`📊 Generated invoice summary: ${filePath}`);
    
    return filePath;
  }

  private generateCSV(invoice: Invoice): string {
    const formatDate = (timestamp: number) => new Date(timestamp * 1000).toISOString().split('T')[0];
    const formatDateTime = (timestamp: number) => new Date(timestamp * 1000).toISOString();

    // CSV header
    const headers = [
      'Invoice ID',
      'Invoice Date',
      'Due Date',
      'Status',
      'Enterprise',
      'Provider',
      'Total Amount',
      'Currency',
      'Billing Period Start',
      'Billing Period End',
      'Line Item Description',
      'Rate ID',
      'Usage Window Start',
      'Usage Window End',
      'Units Consumed',
      'Unit Price',
      'Line Total',
      'Invoice Hash',
      'Blockchain TX Hash',
      'Generated At',
      'Anchored At'
    ];

    // CSV rows
    const rows: string[] = [];
    
    // Add header row
    rows.push(headers.map(h => this.escapeCSVField(h)).join(','));

    // Add data rows (one row per line item)
    invoice.lineItems.forEach((item, index) => {
      const row = [
        invoice.invoiceId,
        formatDate(invoice.createdAt),
        formatDate(invoice.dueDate),
        invoice.status,
        this.env.ENTERPRISE_NAME,
        this.env.PROVIDER_NAME,
        invoice.amount.toString(),
        invoice.currency,
        formatDate(invoice.billingPeriod.start),
        formatDate(invoice.billingPeriod.end),
        item.description,
        item.rateId,
        formatDateTime(item.usageData.windowStart),
        formatDateTime(item.usageData.windowEnd),
        item.quantity.toString(),
        item.unitPrice.toString(),
        item.total.toString(),
        invoice.metadata?.invoiceHash || '',
        invoice.metadata?.blockchainTxHash || '',
        invoice.metadata?.generatedAt ? formatDateTime(invoice.metadata.generatedAt) : '',
        invoice.metadata?.anchoredAt ? formatDateTime(invoice.metadata.anchoredAt) : ''
      ];

      rows.push(row.map(field => this.escapeCSVField(field)).join(','));
    });

    return rows.join('\n');
  }

  private generateSummaryCSV(invoices: Invoice[]): string {
    const formatDate = (timestamp: number) => new Date(timestamp * 1000).toISOString().split('T')[0];

    // Summary CSV header
    const headers = [
      'Invoice ID',
      'Invoice Date',
      'Due Date',
      'Status',
      'Enterprise',
      'Provider',
      'Total Amount',
      'Currency',
      'Billing Period Start',
      'Billing Period End',
      'Line Items Count',
      'Total Units',
      'Invoice Hash',
      'Blockchain TX Hash',
      'Generated At',
      'Anchored At'
    ];

    // Summary CSV rows
    const rows: string[] = [];
    
    // Add header row
    rows.push(headers.map(h => this.escapeCSVField(h)).join(','));

    // Add summary rows (one row per invoice)
    invoices.forEach(invoice => {
      const totalUnits = invoice.lineItems.reduce((sum, item) => sum + item.quantity, 0);
      
      const row = [
        invoice.invoiceId,
        formatDate(invoice.createdAt),
        formatDate(invoice.dueDate),
        invoice.status,
        this.env.ENTERPRISE_NAME,
        this.env.PROVIDER_NAME,
        invoice.amount.toString(),
        invoice.currency,
        formatDate(invoice.billingPeriod.start),
        formatDate(invoice.billingPeriod.end),
        invoice.lineItems.length.toString(),
        totalUnits.toString(),
        invoice.metadata?.invoiceHash || '',
        invoice.metadata?.blockchainTxHash || '',
        invoice.metadata?.generatedAt ? formatDate(invoice.metadata.generatedAt) : '',
        invoice.metadata?.anchoredAt ? formatDate(invoice.metadata.anchoredAt) : ''
      ];

      rows.push(row.map(field => this.escapeCSVField(field)).join(','));
    });

    return rows.join('\n');
  }

  private escapeCSVField(field: string): string {
    // Escape CSV fields that contain commas, quotes, or newlines
    if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
      // Escape quotes by doubling them and wrap in quotes
      const escaped = field.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    return field;
  }

  // Helper method to generate a detailed line items CSV
  async generateLineItemsCSV(invoices: Invoice[]): Promise<string> {
    const formatDateTime = (timestamp: number) => new Date(timestamp * 1000).toISOString();

    // Line items CSV header
    const headers = [
      'Invoice ID',
      'Line Item Description',
      'Rate ID',
      'Usage Window Start',
      'Usage Window End',
      'Units Consumed',
      'Unit Price',
      'Line Total',
      'Anchor ID'
    ];

    // Line items CSV rows
    const rows: string[] = [];
    
    // Add header row
    rows.push(headers.map(h => this.escapeCSVField(h)).join(','));

    // Add line item rows
    invoices.forEach(invoice => {
      invoice.lineItems.forEach(item => {
        const row = [
          invoice.invoiceId,
          item.description,
          item.rateId,
          formatDateTime(item.usageData.windowStart),
          formatDateTime(item.usageData.windowEnd),
          item.quantity.toString(),
          item.unitPrice.toString(),
          item.total.toString(),
          item.usageData.anchorId || ''
        ];

        rows.push(row.map(field => this.escapeCSVField(field)).join(','));
      });
    });

    const csvContent = rows.join('\n');
    const fileName = `line-items-${Date.now()}.csv`;
    const filePath = path.join(this.outputDir, fileName);
    
    fs.writeFileSync(filePath, csvContent);
    console.log(`📊 Generated line items CSV: ${filePath}`);
    
    return filePath;
  }

  // Helper method to generate a rate analysis CSV
  async generateRateAnalysisCSV(invoices: Invoice[]): Promise<string> {
    const formatDate = (timestamp: number) => new Date(timestamp * 1000).toISOString().split('T')[0];

    // Rate analysis CSV header
    const headers = [
      'Rate ID',
      'Total Invoices',
      'Total Units',
      'Total Revenue',
      'Average Unit Price',
      'First Usage Date',
      'Last Usage Date',
      'Usage Count'
    ];

    // Aggregate data by rate ID
    const rateData = new Map<string, {
      totalInvoices: number;
      totalUnits: number;
      totalRevenue: number;
      unitPrices: number[];
      firstUsage: number;
      lastUsage: number;
      usageCount: number;
    }>();

    invoices.forEach(invoice => {
      invoice.lineItems.forEach(item => {
        const rateId = item.rateId;
        const existing = rateData.get(rateId) || {
          totalInvoices: 0,
          totalUnits: 0,
          totalRevenue: 0,
          unitPrices: [],
          firstUsage: Number.MAX_SAFE_INTEGER,
          lastUsage: 0,
          usageCount: 0
        };

        existing.totalInvoices++;
        existing.totalUnits += item.quantity;
        existing.totalRevenue += item.total;
        existing.unitPrices.push(item.unitPrice);
        existing.firstUsage = Math.min(existing.firstUsage, item.usageData.windowStart);
        existing.lastUsage = Math.max(existing.lastUsage, item.usageData.windowEnd);
        existing.usageCount++;

        rateData.set(rateId, existing);
      });
    });

    // Generate CSV rows
    const rows: string[] = [];
    
    // Add header row
    rows.push(headers.map(h => this.escapeCSVField(h)).join(','));

    // Add rate analysis rows
    rateData.forEach((data, rateId) => {
      const averageUnitPrice = data.unitPrices.reduce((sum, price) => sum + price, 0) / data.unitPrices.length;
      
      const row = [
        rateId,
        data.totalInvoices.toString(),
        data.totalUnits.toString(),
        data.totalRevenue.toString(),
        averageUnitPrice.toFixed(4),
        formatDate(data.firstUsage),
        formatDate(data.lastUsage),
        data.usageCount.toString()
      ];

      rows.push(row.map(field => this.escapeCSVField(field)).join(','));
    });

    const csvContent = rows.join('\n');
    const fileName = `rate-analysis-${Date.now()}.csv`;
    const filePath = path.join(this.outputDir, fileName);
    
    fs.writeFileSync(filePath, csvContent);
    console.log(`📊 Generated rate analysis CSV: ${filePath}`);
    
    return filePath;
  }
}
