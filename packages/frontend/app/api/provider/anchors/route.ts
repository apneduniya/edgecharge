import { NextResponse } from 'next/server';
import { getBlockchainService } from '@/lib/services';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || undefined;
    const fromBlock = searchParams.get('fromBlock') ? parseInt(searchParams.get('fromBlock')!) : undefined;
    const toBlock = searchParams.get('toBlock') ? parseInt(searchParams.get('toBlock')!) : undefined;

    // For now, return realistic mock data that matches the blockchain structure
    // In production, this would fetch from blockchain events
    const mockAnchors = [
      {
        id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        provider: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        windowStart: Date.now() / 1000 - 3600, // 1 hour ago
        windowEnd: Date.now() / 1000 - 3540, // 59 minutes ago
        totalUsage: 1234.56,
        merkleRoot: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        disputed: false,
        status: 'confirmed',
        transactionHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
        blockNumber: 12345678,
        timestamp: Date.now() / 1000 - 3600,
      },
      {
        id: '0x2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcdef1',
        provider: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        windowStart: Date.now() / 1000 - 7200, // 2 hours ago
        windowEnd: Date.now() / 1000 - 7140, // 1 hour 59 minutes ago
        totalUsage: 1456.78,
        merkleRoot: '0xbcdef12345678901bcdef12345678901bcdef12345678901bcdef12345678901',
        disputed: false,
        status: 'confirmed',
        transactionHash: '0x8765432109edcba98765432109edcba98765432109edcba98765432109edcba9',
        blockNumber: 12345675,
        timestamp: Date.now() / 1000 - 7200,
      },
      {
        id: '0x3456789012cdef123456789012cdef123456789012cdef123456789012cdef12',
        provider: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        windowStart: Date.now() / 1000 - 10800, // 3 hours ago
        windowEnd: Date.now() / 1000 - 10740, // 2 hours 59 minutes ago
        totalUsage: 987.34,
        merkleRoot: '0xcdef123456789012cdef123456789012cdef123456789012cdef123456789012',
        disputed: true,
        status: 'disputed',
        transactionHash: '0x7654321098dcba987654321098dcba987654321098dcba987654321098dcba98',
        blockNumber: 12345672,
        timestamp: Date.now() / 1000 - 10800,
      },
    ];

    // Filter by provider if specified
    let filteredAnchors = mockAnchors;
    if (provider) {
      filteredAnchors = filteredAnchors.filter(anchor => 
        anchor.provider.toLowerCase() === provider.toLowerCase()
      );
    }
    
    return NextResponse.json({
      success: true,
      data: filteredAnchors
    });
  } catch (error) {
    console.error('Error fetching anchors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch anchors' },
      { status: 500 }
    );
  }
}
