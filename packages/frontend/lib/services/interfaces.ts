// Service interfaces following SOLID principles

// Domain types
export interface UsageAnchor {
  id: string;
  provider: string;
  windowStart: number;
  windowEnd: number;
  totalUsage: number;
  merkleRoot: string;
  disputed: boolean;
  status: 'confirmed' | 'disputed' | 'pending';
  transactionHash: string;
  blockNumber?: number;
  timestamp: number;
}

export interface Invoice {
  id: string;
  invoiceHash?: string;
  amount: number;
  status: 'draft' | 'generated' | 'anchored' | 'paid';
  anchoredDate?: number;
  paid: boolean;
  transactionHash?: string;
  generatedDate: number;
  dueDate: number;
  billingPeriod: {
    start: number;
    end: number;
  };
  lineItems: InvoiceLineItem[];
  metadata?: {
    invoiceHash?: string;
    blockchainTxHash?: string;
    generatedAt?: number;
    anchoredAt?: number;
  };
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  rateId: string;
  usageData: {
    anchorId?: string;
    windowStart: number;
    windowEnd: number;
    unitsConsumed: number;
  };
}

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'inactive';
  usage: number;
  cost: number;
  lastUpdated: number;
  providers: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ServiceStats {
  totalUsage: number;
  activeProviders: number;
  invoicesGenerated: number;
  systemHealth: number;
}

// Service interfaces
export interface IBlockchainService {
  getUsageAnchors(provider?: string, fromBlock?: number, toBlock?: number): Promise<UsageAnchor[]>;
  getUsageAnchor(anchorId: string): Promise<UsageAnchor | null>;
  getInvoice(invoiceId: string): Promise<Invoice | null>;
  getInvoices(provider?: string): Promise<Invoice[]>;
  isRelayerAuthorized(address: string): Promise<boolean>;
  getNextInvoiceId(): Promise<number>;
  listenToEvents(callback: (event: any) => void): () => void;
}

export interface IInvoicingService {
  getInvoices(provider?: string): Promise<Invoice[]>;
  getInvoice(invoiceId: string): Promise<Invoice | null>;
  generateInvoice(anchorIds: string[]): Promise<Invoice | null>;
  downloadInvoice(invoiceId: string): Promise<Blob>;
  getInvoiceStatus(invoiceId: string): Promise<'draft' | 'generated' | 'anchored' | 'paid'>;
}

export interface IProjectService {
  getProjects(): Promise<Project[]>;
  getProject(projectId: string): Promise<Project | null>;
  getProjectUsage(projectId: string, startTime?: number, endTime?: number): Promise<number>;
  getProjectCost(projectId: string, startTime?: number, endTime?: number): Promise<number>;
}

export interface IAnalyticsService {
  getServiceStats(): Promise<ServiceStats>;
  getUsageTrends(timeRange: 'day' | 'week' | 'month' | 'year'): Promise<Array<{ date: string; usage: number; cost: number }>>;
  getProviderStats(provider: string): Promise<{
    totalAnchors: number;
    totalEarnings: number;
    averageUsage: number;
    disputeRate: number;
  }>;
  getEnterpriseStats(): Promise<{
    totalProjects: number;
    totalUsage: number;
    totalCost: number;
    activeProviders: number;
  }>;
}

export interface IApiService {
  get<T>(endpoint: string, params?: Record<string, any>): Promise<T>;
  post<T>(endpoint: string, data?: any): Promise<T>;
  put<T>(endpoint: string, data?: any): Promise<T>;
  delete<T>(endpoint: string): Promise<T>;
}

// Error types
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class BlockchainError extends ServiceError {
  constructor(message: string, public transactionHash?: string) {
    super(message, 'BLOCKCHAIN_ERROR');
    this.name = 'BlockchainError';
  }
}

export class InvoicingError extends ServiceError {
  constructor(message: string, public invoiceId?: string) {
    super(message, 'INVOICING_ERROR');
    this.name = 'InvoicingError';
  }
}

// Configuration types
export interface ServiceConfig {
  blockchain: {
    rpcUrl: string;
    contractAddress: string;
    chainId: number;
  };
  invoicing: {
    baseUrl: string;
    apiKey?: string;
  };
  analytics: {
    baseUrl: string;
    apiKey?: string;
  };
}
