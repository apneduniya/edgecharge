import { NextResponse } from 'next/server';
import { getBlockchainService } from '@/lib/services';

export async function GET() {
  try {
    // For now, return realistic mock data that matches the blockchain structure
    // In production, this would aggregate data from blockchain events and database
    const mockStats = {
      totalUsage: 28899.25, // Sum of all project usage
      activeProviders: 3,
      invoicesGenerated: 3,
      totalCost: 5780.25, // Sum of all invoice amounts
      systemHealth: 99.9,
      activeProjects: 3,
      pendingInvoices: 1, // Only inv-003 is not anchored yet
      anchorsReceived: 3,
      pendingPayments: 3084.15, // Only inv-001 is not paid yet
    };
    
    return NextResponse.json({
      success: true,
      data: mockStats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
