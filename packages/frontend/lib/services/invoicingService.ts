import { 
  IInvoicingService, 
  Invoice, 
  InvoiceLineItem, 
  InvoicingError 
} from './interfaces';

export class InvoicingService implements IInvoicingService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async getInvoices(provider?: string): Promise<Invoice[]> {
    try {
      const url = provider 
        ? `${this.baseUrl}/provider/invoices?provider=${provider}`
        : `${this.baseUrl}/enterprise/invoices`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch invoices');
      }

      return data.data.map(this.transformInvoice);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw new InvoicingError(`Failed to fetch invoices: ${error}`);
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const response = await fetch(`${this.baseUrl}/invoices/${invoiceId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch invoice');
      }

      return this.transformInvoice(data.data);
    } catch (error) {
      console.error(`Error fetching invoice ${invoiceId}:`, error);
      throw new InvoicingError(`Failed to fetch invoice: ${error}`, invoiceId);
    }
  }

  async generateInvoice(anchorIds: string[]): Promise<Invoice | null> {
    try {
      const response = await fetch(`${this.baseUrl}/invoices/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ anchorIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate invoice');
      }

      return this.transformInvoice(data.data);
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw new InvoicingError(`Failed to generate invoice: ${error}`);
    }
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/invoices/${invoiceId}/download`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error(`Error downloading invoice ${invoiceId}:`, error);
      throw new InvoicingError(`Failed to download invoice: ${error}`, invoiceId);
    }
  }

  async getInvoiceStatus(invoiceId: string): Promise<'draft' | 'generated' | 'anchored' | 'paid'> {
    try {
      const invoice = await this.getInvoice(invoiceId);
      return invoice?.status || 'draft';
    } catch (error) {
      console.error(`Error getting invoice status for ${invoiceId}:`, error);
      return 'draft';
    }
  }

  private transformInvoice(data: any): Invoice {
    return {
      id: data.id,
      invoiceHash: data.invoiceHash,
      amount: data.amount,
      status: data.status,
      anchoredDate: data.anchoredDate,
      paid: data.paid,
      transactionHash: data.transactionHash,
      generatedDate: data.generatedDate || Date.now() / 1000,
      dueDate: data.dueDate || (Date.now() / 1000) + (30 * 24 * 60 * 60),
      billingPeriod: data.billingPeriod || {
        start: Date.now() / 1000 - (30 * 24 * 60 * 60),
        end: Date.now() / 1000,
      },
      lineItems: data.lineItems || [],
      metadata: data.metadata,
    };
  }

  // Helper method to create download link
  createDownloadLink(invoiceId: string): string {
    return `${this.baseUrl}/invoices/${invoiceId}/download`;
  }

  // Helper method to format invoice amount
  formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  // Helper method to format date
  formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Helper method to get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'anchored':
        return 'text-blue-600 bg-blue-100';
      case 'generated':
        return 'text-yellow-600 bg-yellow-100';
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }
}
