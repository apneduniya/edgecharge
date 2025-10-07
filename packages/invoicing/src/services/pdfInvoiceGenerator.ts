import fs from 'node:fs';
import path from 'node:path';
import { Invoice } from '../domain/invoice.js';
import { loadEnv } from '../config/env.js';

export interface IInvoiceGenerator {
  generate(invoice: Invoice): Promise<string>; // Returns file path
  generateFromTemplate(invoice: Invoice, templatePath: string): Promise<string>;
}

export class PDFInvoiceGenerator implements IInvoiceGenerator {
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
    const htmlContent = this.generateHTML(invoice);
    const fileName = `invoice-${invoice.invoiceId}-${Date.now()}.html`;
    const filePath = path.join(this.outputDir, fileName);
    
    fs.writeFileSync(filePath, htmlContent);
    console.log(`📄 Generated HTML invoice: ${filePath}`);
    
    // For now, we'll generate HTML that can be converted to PDF
    // In a production environment, you'd use a library like puppeteer or jsPDF
    return filePath;
  }

  async generateFromTemplate(invoice: Invoice, templatePath: string): Promise<string> {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    const template = fs.readFileSync(templatePath, 'utf8');
    const htmlContent = this.populateTemplate(template, invoice);
    const fileName = `invoice-${invoice.invoiceId}-${Date.now()}.html`;
    const filePath = path.join(this.outputDir, fileName);
    
    fs.writeFileSync(filePath, htmlContent);
    console.log(`📄 Generated invoice from template: ${filePath}`);
    
    return filePath;
  }

  private generateHTML(invoice: Invoice): string {
    const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleDateString();
    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceId}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .invoice-container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-title {
            font-size: 32px;
            font-weight: bold;
            color: #2c3e50;
            margin: 0;
        }
        .invoice-number {
            font-size: 18px;
            color: #7f8c8d;
            margin: 5px 0;
        }
        .billing-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
        }
        .billing-section {
            flex: 1;
            margin: 0 20px;
        }
        .billing-section h3 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .billing-section p {
            margin: 5px 0;
            color: #555;
        }
        .line-items {
            margin-bottom: 30px;
        }
        .line-items table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .line-items th,
        .line-items td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        .line-items th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #2c3e50;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 1px;
        }
        .line-items tr:hover {
            background-color: #f8f9fa;
        }
        .total-section {
            text-align: right;
            margin-top: 30px;
        }
        .total-row {
            display: flex;
            justify-content: flex-end;
            margin: 10px 0;
        }
        .total-label {
            width: 200px;
            text-align: right;
            padding-right: 20px;
            font-weight: bold;
        }
        .total-amount {
            width: 100px;
            text-align: right;
            font-weight: bold;
        }
        .grand-total {
            font-size: 18px;
            color: #2c3e50;
            border-top: 2px solid #2c3e50;
            padding-top: 10px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .status-draft { background-color: #f39c12; color: white; }
        .status-generated { background-color: #3498db; color: white; }
        .status-anchored { background-color: #27ae60; color: white; }
        .status-paid { background-color: #2ecc71; color: white; }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="logo">
                ${this.env.PROVIDER_NAME}
            </div>
            <div class="invoice-info">
                <h1 class="invoice-title">INVOICE</h1>
                <div class="invoice-number">#${invoice.invoiceId}</div>
                <div>Date: ${formatDate(invoice.createdAt)}</div>
                <div>Due: ${formatDate(invoice.dueDate)}</div>
                <div style="margin-top: 10px;">
                    <span class="status-badge status-${invoice.status}">${invoice.status}</span>
                </div>
            </div>
        </div>

        <div class="billing-info">
            <div class="billing-section">
                <h3>Bill To</h3>
                <p><strong>${this.env.ENTERPRISE_NAME}</strong></p>
                <p>${this.env.ENTERPRISE_ADDRESS}</p>
                <p>${this.env.ENTERPRISE_EMAIL}</p>
            </div>
            <div class="billing-section">
                <h3>From</h3>
                <p><strong>${this.env.PROVIDER_NAME}</strong></p>
                <p>${this.env.PROVIDER_EMAIL}</p>
                <p>${this.env.PROVIDER_WEBSITE}</p>
            </div>
        </div>

        <div class="line-items">
            <h3>Billing Period</h3>
            <p>${formatDate(invoice.billingPeriod.start)} - ${formatDate(invoice.billingPeriod.end)}</p>
            
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Rate ID</th>
                        <th>Usage Window</th>
                        <th>Units</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.lineItems.map(item => `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.rateId}</td>
                            <td>${formatDate(item.usageData.windowStart)} - ${formatDate(item.usageData.windowEnd)}</td>
                            <td>${item.quantity.toLocaleString()}</td>
                            <td>${formatCurrency(item.unitPrice)}</td>
                            <td>${formatCurrency(item.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="total-section">
            <div class="total-row">
                <div class="total-label">Subtotal:</div>
                <div class="total-amount">${formatCurrency(invoice.lineItems.reduce((sum, item) => sum + item.total, 0))}</div>
            </div>
            <div class="total-row">
                <div class="total-label">Tax (0%):</div>
                <div class="total-amount">$0.00</div>
            </div>
            <div class="total-row grand-total">
                <div class="total-label">Total:</div>
                <div class="total-amount">${formatCurrency(invoice.amount)}</div>
            </div>
        </div>

        <div class="footer">
            <p>This invoice was generated automatically by EdgeCharge billing system.</p>
            ${invoice.metadata?.invoiceHash ? `<p>Invoice Hash: ${invoice.metadata.invoiceHash}</p>` : ''}
            ${invoice.metadata?.blockchainTxHash ? `<p>Blockchain TX: ${invoice.metadata.blockchainTxHash}</p>` : ''}
        </div>
    </div>
</body>
</html>`;
  }

  private populateTemplate(template: string, invoice: Invoice): string {
    const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleDateString();
    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

    // Simple template variable replacement
    let html = template
      .replace(/\{\{invoiceId\}\}/g, invoice.invoiceId)
      .replace(/\{\{invoiceDate\}\}/g, formatDate(invoice.createdAt))
      .replace(/\{\{dueDate\}\}/g, formatDate(invoice.dueDate))
      .replace(/\{\{status\}\}/g, invoice.status)
      .replace(/\{\{totalAmount\}\}/g, formatCurrency(invoice.amount))
      .replace(/\{\{enterpriseName\}\}/g, this.env.ENTERPRISE_NAME)
      .replace(/\{\{enterpriseAddress\}\}/g, this.env.ENTERPRISE_ADDRESS)
      .replace(/\{\{enterpriseEmail\}\}/g, this.env.ENTERPRISE_EMAIL)
      .replace(/\{\{providerName\}\}/g, this.env.PROVIDER_NAME)
      .replace(/\{\{providerEmail\}\}/g, this.env.PROVIDER_EMAIL)
      .replace(/\{\{providerWebsite\}\}/g, this.env.PROVIDER_WEBSITE)
      .replace(/\{\{billingPeriodStart\}\}/g, formatDate(invoice.billingPeriod.start))
      .replace(/\{\{billingPeriodEnd\}\}/g, formatDate(invoice.billingPeriod.end))
      .replace(/\{\{invoiceHash\}\}/g, invoice.metadata?.invoiceHash || '')
      .replace(/\{\{blockchainTxHash\}\}/g, invoice.metadata?.blockchainTxHash || '');

    // Replace line items
    const lineItemsHtml = invoice.lineItems.map(item => `
      <tr>
        <td>${item.description}</td>
        <td>${item.rateId}</td>
        <td>${formatDate(item.usageData.windowStart)} - ${formatDate(item.usageData.windowEnd)}</td>
        <td>${item.quantity.toLocaleString()}</td>
        <td>${formatCurrency(item.unitPrice)}</td>
        <td>${formatCurrency(item.total)}</td>
      </tr>
    `).join('');

    html = html.replace(/\{\{lineItems\}\}/g, lineItemsHtml);

    return html;
  }
}
