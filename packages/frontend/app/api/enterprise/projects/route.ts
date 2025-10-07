import { NextResponse } from 'next/server';
import { getBlockchainService } from '@/lib/services';

export async function GET() {
  try {
    // For now, return realistic mock data that matches the blockchain structure
    // In production, this would aggregate data from blockchain events and database
    const mockProjects = [
      {
        id: 'proj-001',
        name: 'AI Compute Cluster',
        status: 'active',
        usage: 15420.75,
        cost: 3084.15,
        providers: 3,
        trend: 'up',
        lastUpdated: Date.now() / 1000,
      },
      {
        id: 'proj-002', 
        name: 'Data Storage Network',
        status: 'active',
        usage: 8920.30,
        cost: 1784.06,
        providers: 2,
        trend: 'stable',
        lastUpdated: Date.now() / 1000,
      },
      {
        id: 'proj-003',
        name: 'Edge Computing Nodes',
        status: 'paused',
        usage: 4560.20,
        cost: 912.04,
        providers: 1,
        trend: 'down',
        lastUpdated: Date.now() / 1000 - 86400, // 1 day ago
      },
    ];
    
    return NextResponse.json({
      success: true,
      data: mockProjects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
