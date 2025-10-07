import { NextResponse } from 'next/server';
import { getBlockchainService } from '@/lib/services';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || undefined;

    // For now, return realistic mock data that matches the blockchain structure
    // In production, this would fetch from blockchain events and invoicing service
    const mockInvoices = [
      {
        id: 'inv-001',
        invoiceHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        amount: 3084.15,
        status: 'anchored',
        anchoredDate: Date.now() / 1000 - 86400, // 1 day ago
        paid: false,
        transactionHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
        generatedDate: Date.now() / 1000 - 172800, // 2 days ago
        dueDate: Date.now() / 1000 + 2592000, // 30 days from now
        projectName: 'AI Compute Cluster',
        projectId: 'proj-001',
        billingPeriod: {
          start: Date.now() / 1000 - 2592000, // 30 days ago
          end: Date.now() / 1000 - 86400, // 1 day ago
        },
        lineItems: [
          { description: 'Compute Units', quantity: 15420.75, rate: 0.20, amount: 3084.15 }
        ],
        metadata: {
          invoiceHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockchainTxHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
          anchoredAt: Date.now() / 1000 - 86400,
        },
      },
      {
        id: 'inv-002',
        invoiceHash: '0x2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcdef1',
        amount: 1784.06,
        status: 'paid',
        anchoredDate: Date.now() / 1000 - 259200, // 3 days ago
        paid: true,
        transactionHash: '0x8765432109edcba98765432109edcba98765432109edcba98765432109edcba9',
        generatedDate: Date.now() / 1000 - 345600, // 4 days ago
        dueDate: Date.now() / 1000 - 86400, // 1 day ago (overdue but paid)
        projectName: 'Data Storage Network',
        projectId: 'proj-002',
        billingPeriod: {
          start: Date.now() / 1000 - 5184000, // 60 days ago
          end: Date.now() / 1000 - 2592000, // 30 days ago
        },
        lineItems: [
          { description: 'Storage Units', quantity: 8920.30, rate: 0.20, amount: 1784.06 }
        ],
        metadata: {
          invoiceHash: '0x2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcdef1',
          blockchainTxHash: '0x8765432109edcba98765432109edcba98765432109edcba98765432109edcba9',
          anchoredAt: Date.now() / 1000 - 259200,
        },
      },
    ];

    // Filter by provider if specified (in real implementation, this would be done at the blockchain level)
    let filteredInvoices = mockInvoices;
    if (provider) {
      // For mock data, we'll just return all invoices since they're all for the same provider
      // In real implementation, this would filter based on the provider address
      filteredInvoices = mockInvoices;
    }
    
    return NextResponse.json({
      success: true,
      data: filteredInvoices
    });
  } catch (error) {
    console.error('Error fetching provider invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch provider invoices' },
      { status: 500 }
    );
  }
}
