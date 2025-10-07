import { createConfig, http, writeContract } from '@wagmi/core';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient } from 'viem';
import { defineChain } from 'viem';
import { loadEnv } from '../config/env.js';
import { getEdgeChargeAdapter } from '../contracts/edgeCharge.js';
import { Invoice } from '../domain/invoice.js';

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

export interface IBlockchainAnchorService {
  anchorInvoice(invoice: Invoice, invoiceHash: string): Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  markInvoicePaid(invoiceId: string): Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  getInvoiceFromBlockchain(invoiceId: string): Promise<any>;
  isInvoiceAnchored(invoiceId: string): Promise<boolean>;
  checkConfiguration(): Promise<{ isValid: boolean; errors: string[] }>;
}

export class BlockchainAnchorService implements IBlockchainAnchorService {
  private config: ReturnType<typeof createConfig>;
  private publicClient: ReturnType<typeof createPublicClient>;
  private adapter: ReturnType<typeof getEdgeChargeAdapter>;
  private env: ReturnType<typeof loadEnv>;
  private account: ReturnType<typeof privateKeyToAccount>;

  constructor() {
    this.env = loadEnv();
    this.adapter = getEdgeChargeAdapter(this.env.EDGECHARGE_ADDRESS as `0x${string}` | undefined);
    
    // For demo purposes, we'll use a placeholder private key
    // In production, this should be a proper relayer private key
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
    this.account = privateKeyToAccount(relayerPrivateKey as `0x${string}`);

    this.config = createConfig({
      chains: [u2uNebulasTestnet],
      ssr: true,
      transports: {
        [u2uNebulasTestnet.id]: http(this.env.U2U_RPC_URL),
      },
    });

    this.publicClient = createPublicClient({
      chain: u2uNebulasTestnet,
      transport: http(this.env.U2U_RPC_URL),
    });

    console.log(`🔗 Blockchain anchor service initialized`);
    console.log(`📡 Contract: ${this.adapter.address}`);
    console.log(`⛓️  Chain: ${u2uNebulasTestnet.name} (${u2uNebulasTestnet.id})`);
    console.log(`👤 Account: ${this.account.address}`);
  }

  async anchorInvoice(invoice: Invoice, invoiceHash: string): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      console.log(`🔗 Anchoring invoice ${invoice.invoiceId} with hash ${invoiceHash}`);

      // Convert invoice ID to number (assuming it's numeric)
      const invoiceId = parseInt(invoice.invoiceId, 10);
      if (isNaN(invoiceId)) {
        throw new Error(`Invalid invoice ID: ${invoice.invoiceId}`);
      }

      // Call the anchorInvoice function on the contract
      const hash = await writeContract(this.config, {
        abi: this.adapter.abi,
        address: this.adapter.address,
        functionName: 'anchorInvoice',
        args: [BigInt(invoiceId), invoiceHash as `0x${string}`],
        chainId: u2uNebulasTestnet.id,
        account: this.account,
      });

      console.log(`📝 Transaction submitted: ${hash}`);

      // Wait for transaction receipt
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        console.log(`✅ Invoice ${invoice.invoiceId} anchored successfully`);
        console.log(`📦 Block: ${receipt.blockNumber}`);
        console.log(`⛽ Gas used: ${receipt.gasUsed}`);
        
        return {
          success: true,
          transactionHash: receipt.transactionHash,
        };
      } else {
        console.error(`❌ Transaction failed for invoice ${invoice.invoiceId}`);
        return {
          success: false,
          error: 'Transaction failed',
        };
      }
    } catch (error) {
      console.error(`❌ Error anchoring invoice ${invoice.invoiceId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async markInvoicePaid(invoiceId: string): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      console.log(`💰 Marking invoice ${invoiceId} as paid`);

      // Convert invoice ID to number
      const id = parseInt(invoiceId, 10);
      if (isNaN(id)) {
        throw new Error(`Invalid invoice ID: ${invoiceId}`);
      }

      // Call the markInvoicePaid function on the contract
      const hash = await writeContract(this.config, {
        abi: this.adapter.abi,
        address: this.adapter.address,
        functionName: 'markInvoicePaid',
        args: [BigInt(id)],
        chainId: u2uNebulasTestnet.id,
        account: this.account,
      });

      console.log(`📝 Transaction submitted: ${hash}`);

      // Wait for transaction receipt
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        console.log(`✅ Invoice ${invoiceId} marked as paid successfully`);
        console.log(`📦 Block: ${receipt.blockNumber}`);
        console.log(`⛽ Gas used: ${receipt.gasUsed}`);
        
        return {
          success: true,
          transactionHash: receipt.transactionHash,
        };
      } else {
        console.error(`❌ Transaction failed for invoice ${invoiceId}`);
        return {
          success: false,
          error: 'Transaction failed',
        };
      }
    } catch (error) {
      console.error(`❌ Error marking invoice ${invoiceId} as paid:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getInvoiceFromBlockchain(invoiceId: string): Promise<any> {
    try {
      console.log(`🔍 Fetching invoice ${invoiceId} from blockchain`);

      // Convert invoice ID to number
      const id = parseInt(invoiceId, 10);
      if (isNaN(id)) {
        throw new Error(`Invalid invoice ID: ${invoiceId}`);
      }

      // Call the getInvoice function on the contract
      const invoice = await this.publicClient.readContract({
        abi: this.adapter.abi,
        address: this.adapter.address,
        functionName: 'getInvoice',
        args: [BigInt(id)],
      });

      console.log(`📋 Invoice ${invoiceId} fetched from blockchain`);
      return invoice;
    } catch (error) {
      console.error(`❌ Error fetching invoice ${invoiceId} from blockchain:`, error);
      throw error;
    }
  }

  async isInvoiceAnchored(invoiceId: string): Promise<boolean> {
    try {
      const invoice = await this.getInvoiceFromBlockchain(invoiceId);
      return invoice.exists;
    } catch (error) {
      console.error(`❌ Error checking if invoice ${invoiceId} is anchored:`, error);
      return false;
    }
  }

  // Helper method to get the next invoice ID from the contract
  async getNextInvoiceId(): Promise<number> {
    try {
      const nextId = await this.publicClient.readContract({
        abi: this.adapter.abi,
        address: this.adapter.address,
        functionName: 'nextInvoiceId',
        args: [],
      });

      return Number(nextId);
    } catch (error) {
      console.error('❌ Error fetching next invoice ID:', error);
      throw error;
    }
  }

  // Helper method to check if the service is properly configured
  async checkConfiguration(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check if we can connect to the blockchain
      const blockNumber = await this.publicClient.getBlockNumber();
      console.log(`📦 Current block number: ${blockNumber}`);
    } catch (error) {
      errors.push(`Cannot connect to blockchain: ${error}`);
    }

    try {
      // Check if the contract is accessible
      const nextId = await this.getNextInvoiceId();
      console.log(`📋 Next invoice ID: ${nextId}`);
    } catch (error) {
      errors.push(`Cannot access contract: ${error}`);
    }

    // Check if account has sufficient balance (optional)
    try {
      const balance = await this.publicClient.getBalance({
        address: this.account.address,
      });
      console.log(`💰 Account balance: ${balance} wei`);
      
      if (balance === 0n) {
        errors.push('Account has zero balance - may not be able to send transactions');
      }
    } catch (error) {
      errors.push(`Cannot check account balance: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Helper method to get contract events
  async getInvoiceEvents(invoiceId: string): Promise<any[]> {
    try {
      const id = parseInt(invoiceId, 10);
      if (isNaN(id)) {
        throw new Error(`Invalid invoice ID: ${invoiceId}`);
      }

      // Get InvoiceAnchored events
      const anchoredEvents = await this.publicClient.getLogs({
        address: this.adapter.address,
        event: {
          type: 'event',
          name: 'InvoiceAnchored',
          inputs: [
            { name: 'invoiceId', type: 'uint256', indexed: true },
            { name: 'enterprise', type: 'address', indexed: true },
            { name: 'provider', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256' },
          ],
        },
        args: {
          invoiceId: BigInt(id),
        },
      });

      // Get InvoicePaid events
      const paidEvents = await this.publicClient.getLogs({
        address: this.adapter.address,
        event: {
          type: 'event',
          name: 'InvoicePaid',
          inputs: [
            { name: 'invoiceId', type: 'uint256', indexed: true },
          ],
        },
        args: {
          invoiceId: BigInt(id),
        },
      });

      return [...anchoredEvents, ...paidEvents];
    } catch (error) {
      console.error(`❌ Error fetching events for invoice ${invoiceId}:`, error);
      throw error;
    }
  }
}
