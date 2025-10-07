// Shared types for the EdgeCharge application

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

export interface Invoice {
  id: string;
  projectId?: string;
  projectName?: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'anchored';
  dueDate?: number;
  generatedDate: number;
  downloadUrl?: string;
  invoiceHash?: string;
  anchoredDate?: number | null;
  paid?: boolean;
  transactionHash?: string | null;
}

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
}

export interface ProviderStats {
  totalAnchors: number;
  totalUsage: number;
  totalEarnings: number;
  pendingPayments: number;
  disputeCount: number;
  uptime: number;
}

export interface UsageData {
  date: string;
  usage: number;
  cost: number;
}

export type StatusVariant = 'success' | 'warning' | 'destructive' | 'secondary' | 'outline';
export type TrendDirection = 'up' | 'down' | 'stable';
