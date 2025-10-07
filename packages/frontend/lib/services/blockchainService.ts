import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { config, u2uNebulasTestnet, EDGECHARGE_ABI, EDGECHARGE_CONFIG } from '../wagmi';
import { 
  IBlockchainService, 
  UsageAnchor, 
  Invoice, 
  BlockchainError 
} from './interfaces';

export class BlockchainService implements IBlockchainService {
  private publicClient;

  constructor() {
    this.publicClient = createPublicClient({
      chain: u2uNebulasTestnet,
      transport: http(),
    });
  }

  async getUsageAnchors(
    provider?: string, 
    fromBlock?: number, 
    toBlock?: number
  ): Promise<UsageAnchor[]> {
    try {
      const currentBlock = await this.publicClient.getBlockNumber();
      const from = fromBlock ? BigInt(fromBlock) : currentBlock - 10000n; // Last ~10k blocks
      const to = toBlock ? BigInt(toBlock) : currentBlock;

      const logs = await this.publicClient.getLogs({
        address: EDGECHARGE_CONFIG.address,
        event: parseAbiItem('event UsageAnchored(bytes32 indexed anchorId, address indexed provider, uint256 windowStart, uint256 windowEnd, uint256 totalUsage)'),
        fromBlock: from,
        toBlock: to,
        args: provider ? { provider: provider as `0x${string}` } : undefined,
      });

      const anchors: UsageAnchor[] = [];

      for (const log of logs) {
        if (log.args) {
          // Get additional anchor data from contract
          const anchorData = await this.getUsageAnchor(log.args.anchorId as string);
          if (anchorData) {
            anchors.push(anchorData);
          }
        }
      }

      return anchors.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error fetching usage anchors:', error);
      throw new BlockchainError(`Failed to fetch usage anchors: ${error}`);
    }
  }

  async getUsageAnchor(anchorId: string): Promise<UsageAnchor | null> {
    try {
      const result = await this.publicClient.readContract({
        address: EDGECHARGE_CONFIG.address,
        abi: EDGECHARGE_ABI,
        functionName: 'getUsageAnchor',
        args: [anchorId as `0x${string}`],
      });

      if (!result || !result.provider) {
        return null;
      }

      // Get transaction details
      const logs = await this.publicClient.getLogs({
        address: EDGECHARGE_CONFIG.address,
        event: parseAbiItem('event UsageAnchored(bytes32 indexed anchorId, address indexed provider, uint256 windowStart, uint256 windowEnd, uint256 totalUsage)'),
        args: { anchorId: anchorId as `0x${string}` },
      });

      const log = logs[0];
      const block = log ? await this.publicClient.getBlock({ blockNumber: log.blockNumber }) : null;

      return {
        id: anchorId,
        provider: result.provider,
        windowStart: Number(result.windowStart),
        windowEnd: Number(result.windowEnd),
        totalUsage: Number(formatUnits(result.totalUsage, 18)), // Assuming 18 decimals
        merkleRoot: result.merkleRoot,
        disputed: result.disputed,
        status: result.disputed ? 'disputed' : 'confirmed',
        transactionHash: log?.transactionHash || '',
        blockNumber: log ? Number(log.blockNumber) : undefined,
        timestamp: block ? Number(block.timestamp) : Date.now() / 1000,
      };
    } catch (error) {
      console.error(`Error fetching usage anchor ${anchorId}:`, error);
      return null;
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const result = await this.publicClient.readContract({
        address: EDGECHARGE_CONFIG.address,
        abi: EDGECHARGE_ABI,
        functionName: 'getInvoice',
        args: [BigInt(invoiceId)],
      });

      if (!result || !result.exists) {
        return null;
      }

      // Get invoice events for additional data
      const anchoredLogs = await this.publicClient.getLogs({
        address: EDGECHARGE_CONFIG.address,
        event: parseAbiItem('event InvoiceAnchored(uint256 indexed invoiceId, address indexed enterprise, address indexed provider, uint256 amount)'),
        args: { invoiceId: BigInt(invoiceId) },
      });

      const paidLogs = await this.publicClient.getLogs({
        address: EDGECHARGE_CONFIG.address,
        event: parseAbiItem('event InvoicePaid(uint256 indexed invoiceId)'),
        args: { invoiceId: BigInt(invoiceId) },
      });

      const anchoredLog = anchoredLogs[0];
      const paidLog = paidLogs[0];

      let status: 'draft' | 'generated' | 'anchored' | 'paid' = 'draft';
      if (paidLog) {
        status = 'paid';
      } else if (anchoredLog) {
        status = 'anchored';
      } else if (result.exists) {
        status = 'generated';
      }

      return {
        id: invoiceId,
        invoiceHash: result.invoiceHash,
        amount: Number(formatUnits(result.amount, 18)),
        status,
        anchoredDate: anchoredLog ? Number(anchoredLog.blockNumber) : undefined,
        paid: result.paid,
        transactionHash: anchoredLog?.transactionHash,
        generatedDate: Date.now() / 1000,
        dueDate: Date.now() / 1000 + (30 * 24 * 60 * 60), // 30 days from now
        billingPeriod: {
          start: Date.now() / 1000 - (30 * 24 * 60 * 60),
          end: Date.now() / 1000,
        },
        lineItems: [], // Would be populated from invoicing service
        metadata: {
          invoiceHash: result.invoiceHash,
          blockchainTxHash: anchoredLog?.transactionHash,
          anchoredAt: anchoredLog ? Number(anchoredLog.blockNumber) : undefined,
        },
      };
    } catch (error) {
      console.error(`Error fetching invoice ${invoiceId}:`, error);
      return null;
    }
  }

  async getInvoices(provider?: string): Promise<Invoice[]> {
    try {
      // Get all InvoiceAnchored events
      const logs = await this.publicClient.getLogs({
        address: EDGECHARGE_CONFIG.address,
        event: parseAbiItem('event InvoiceAnchored(uint256 indexed invoiceId, address indexed enterprise, address indexed provider, uint256 amount)'),
        args: provider ? { provider: provider as `0x${string}` } : undefined,
      });

      const invoices: Invoice[] = [];

      for (const log of logs) {
        if (log.args) {
          const invoice = await this.getInvoice(log.args.invoiceId.toString());
          if (invoice) {
            invoices.push(invoice);
          }
        }
      }

      return invoices.sort((a, b) => b.generatedDate - a.generatedDate);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw new BlockchainError(`Failed to fetch invoices: ${error}`);
    }
  }

  async isRelayerAuthorized(address: string): Promise<boolean> {
    try {
      const result = await this.publicClient.readContract({
        address: EDGECHARGE_CONFIG.address,
        abi: EDGECHARGE_ABI,
        functionName: 'authorizedRelayers',
        args: [address as `0x${string}`],
      });

      return result;
    } catch (error) {
      console.error(`Error checking relayer authorization for ${address}:`, error);
      return false;
    }
  }

  async getNextInvoiceId(): Promise<number> {
    try {
      const result = await this.publicClient.readContract({
        address: EDGECHARGE_CONFIG.address,
        abi: EDGECHARGE_ABI,
        functionName: 'nextInvoiceId',
        args: [],
      });

      return Number(result);
    } catch (error) {
      console.error('Error fetching next invoice ID:', error);
      throw new BlockchainError(`Failed to fetch next invoice ID: ${error}`);
    }
  }

  listenToEvents(callback: (event: any) => void): () => void {
    // This would set up event listeners for real-time updates
    // For now, we'll return a no-op cleanup function
    console.log('Event listener setup (not implemented yet)');
    return () => {
      console.log('Event listener cleanup');
    };
  }
}
