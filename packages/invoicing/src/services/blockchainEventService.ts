import { createPublicClient, http, parseAbiItem } from 'viem';
import { defineChain } from 'viem';
import { loadEnv } from '../config/env.js';
import { getEdgeChargeAdapter } from '../contracts/edgeCharge.js';
import { UsageAnchorEvent, UsageAnchorEventSchema } from '../domain/usageAnchor.js';

// Define U2U Nebulas testnet chain
const u2uNebulasTestnet = defineChain({
  id: 2484,
  name: 'U2U Nebulas Testnet',
  nativeCurrency: { name: 'U2U', symbol: 'U2U', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-nebulas-testnet.u2u.xyz'] },
    public: { http: ['https://rpc-nebulas-testnet.u2u.xyz'] },
  },
});

export interface IBlockchainEventService {
  startListening(onUsageAnchored: (event: UsageAnchorEvent) => Promise<void>): Promise<void>;
  stopListening(): void;
  getLatestBlockNumber(): Promise<bigint>;
  getUsageAnchoredEvents(fromBlock: bigint, toBlock: bigint): Promise<UsageAnchorEvent[]>;
}

export class BlockchainEventService implements IBlockchainEventService {
  private publicClient: ReturnType<typeof createPublicClient>;
  private adapter: ReturnType<typeof getEdgeChargeAdapter>;
  private isListening = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastProcessedBlock: bigint;
  private env: ReturnType<typeof loadEnv>;

  constructor() {
    this.env = loadEnv();
    this.adapter = getEdgeChargeAdapter(this.env.EDGECHARGE_ADDRESS as `0x${string}` | undefined);
    
    this.publicClient = createPublicClient({
      chain: u2uNebulasTestnet,
      transport: http(this.env.U2U_RPC_URL),
    });

    // Initialize last processed block
    this.lastProcessedBlock = this.env.EVENT_START_BLOCK ? BigInt(this.env.EVENT_START_BLOCK) : 0n;
  }

  async startListening(onUsageAnchored: (event: UsageAnchorEvent) => Promise<void>): Promise<void> {
    if (this.isListening) {
      console.log('⚠️  Event listener is already running');
      return;
    }

    console.log('🔍 Starting blockchain event listener...');
    console.log(`📡 Listening to contract: ${this.adapter.address}`);
    console.log(`⛓️  Chain: ${u2uNebulasTestnet.name} (${u2uNebulasTestnet.id})`);

    this.isListening = true;

    // Get current block number if not set
    if (this.lastProcessedBlock === 0n) {
      this.lastProcessedBlock = await this.getLatestBlockNumber();
      console.log(`📦 Starting from block: ${this.lastProcessedBlock}`);
    }

    // Start polling for events
    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollForEvents(onUsageAnchored);
      } catch (error) {
        console.error('❌ Error polling for events:', error);
      }
    }, this.env.EVENT_POLLING_INTERVAL_MS);

    console.log('✅ Event listener started successfully');
  }

  stopListening(): void {
    if (!this.isListening) {
      console.log('⚠️  Event listener is not running');
      return;
    }

    console.log('🛑 Stopping blockchain event listener...');
    
    this.isListening = false;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    console.log('✅ Event listener stopped');
  }

  async getLatestBlockNumber(): Promise<bigint> {
    return await this.publicClient.getBlockNumber();
  }

  async getUsageAnchoredEvents(fromBlock: bigint, toBlock: bigint): Promise<UsageAnchorEvent[]> {
    try {
      const events = await this.publicClient.getLogs({
        address: this.adapter.address,
        event: parseAbiItem('event UsageAnchored(bytes32 indexed anchorId, address indexed provider, uint256 windowStart, uint256 windowEnd, uint256 totalUsage)'),
        fromBlock,
        toBlock,
      });

      const usageAnchorEvents: UsageAnchorEvent[] = [];

      for (const event of events) {
        if (event.args) {
          const eventData = {
            anchorId: event.args.anchorId as string,
            provider: event.args.provider as string,
            windowStart: Number(event.args.windowStart),
            windowEnd: Number(event.args.windowEnd),
            totalUsage: Number(event.args.totalUsage),
            blockNumber: Number(event.blockNumber),
            transactionHash: event.transactionHash,
            logIndex: event.logIndex,
          };

          const validatedEvent = UsageAnchorEventSchema.parse(eventData);
          usageAnchorEvents.push(validatedEvent);
        }
      }

      return usageAnchorEvents;
    } catch (error) {
      console.error('❌ Error fetching usage anchored events:', error);
      throw error;
    }
  }

  private async pollForEvents(onUsageAnchored: (event: UsageAnchorEvent) => Promise<void>): Promise<void> {
    const currentBlock = await this.getLatestBlockNumber();
    
    if (currentBlock <= this.lastProcessedBlock) {
      return; // No new blocks
    }

    const fromBlock = this.lastProcessedBlock + 1n;
    const toBlock = currentBlock;

    console.log(`🔍 Polling events from block ${fromBlock} to ${toBlock}`);

    try {
      const events = await this.getUsageAnchoredEvents(fromBlock, toBlock);
      
      if (events.length > 0) {
        console.log(`📊 Found ${events.length} UsageAnchored events`);
        
        for (const event of events) {
          try {
            await onUsageAnchored(event);
            console.log(`✅ Processed UsageAnchored event: ${event.anchorId}`);
          } catch (error) {
            console.error(`❌ Error processing event ${event.anchorId}:`, error);
          }
        }
      }

      this.lastProcessedBlock = toBlock;
    } catch (error) {
      console.error('❌ Error polling for events:', error);
      // Don't update lastProcessedBlock on error to retry
    }
  }
}
