// Shared constants for the EdgeCharge application

export const STATUS_CONFIG = {
  active: { variant: 'success' as const, label: 'Active' },
  paused: { variant: 'secondary' as const, label: 'Paused' },
  inactive: { variant: 'outline' as const, label: 'Inactive' },
  paid: { variant: 'success' as const, label: 'Paid' },
  pending: { variant: 'warning' as const, label: 'Pending' },
  overdue: { variant: 'destructive' as const, label: 'Overdue' },
  confirmed: { variant: 'success' as const, label: 'Confirmed' },
  disputed: { variant: 'destructive' as const, label: 'Disputed' },
  anchored: { variant: 'success' as const, label: 'Anchored' },
} as const;

export const TREND_ICONS = {
  up: 'TrendingUp',
  down: 'TrendingDown',
  stable: 'Minus',
} as const;

export const STATUS_ICONS = {
  confirmed: 'CheckCircle',
  disputed: 'AlertCircle',
  pending: 'Clock',
  active: 'CheckCircle',
  paid: 'CheckCircle',
  anchored: 'CheckCircle',
} as const;

export const EXPLORER_URLS = {
  u2u: 'https://explorer.u2u.xyz',
  etherscan: 'https://etherscan.io',
} as const;

export const API_ENDPOINTS = {
  enterprise: {
    projects: '/api/enterprise/projects',
    invoices: '/api/enterprise/invoices',
  },
  provider: {
    anchors: '/api/provider/anchors',
    invoices: '/api/provider/invoices',
  },
  invoices: {
    download: (id: string) => `/api/invoices/${id}/download`,
  },
} as const;
