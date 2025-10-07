import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

// Define U2U Nebulas testnet chain
export const u2uNebulasTestnet = defineChain({
  id: 2484,
  name: 'U2U Nebulas Testnet',
  nativeCurrency: { name: 'U2U', symbol: 'U2U', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-nebulas-testnet.u2u.xyz'] },
    public: { http: ['https://rpc-nebulas-testnet.u2u.xyz'] },
  },
  blockExplorers: {
    default: { 
      name: 'U2U Explorer', 
      url: 'https://testnet.u2u.xyz' 
    },
  },
});

// EdgeCharge contract configuration
export const EDGECHARGE_CONFIG = {
  address: '0x6715671733872Ce246A260F0497400430c4dEeD4' as const,
  chainId: u2uNebulasTestnet.id,
};

// Create wagmi config
export const config = createConfig({
  chains: [u2uNebulasTestnet],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
    }),
  ],
  transports: {
    [u2uNebulasTestnet.id]: http(),
  },
  ssr: true,
});

// Contract ABI - this should match the EdgeCharge contract
export const EDGECHARGE_ABI = [
  {
    "type": "event",
    "name": "UsageAnchored",
    "inputs": [
      { "name": "anchorId", "type": "bytes32", "indexed": true },
      { "name": "provider", "type": "address", "indexed": true },
      { "name": "windowStart", "type": "uint256" },
      { "name": "windowEnd", "type": "uint256" },
      { "name": "totalUsage", "type": "uint256" }
    ]
  },
  {
    "type": "event",
    "name": "InvoiceAnchored",
    "inputs": [
      { "name": "invoiceId", "type": "uint256", "indexed": true },
      { "name": "enterprise", "type": "address", "indexed": true },
      { "name": "provider", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256" }
    ]
  },
  {
    "type": "event",
    "name": "InvoicePaid",
    "inputs": [
      { "name": "invoiceId", "type": "uint256", "indexed": true }
    ]
  },
  {
    "type": "event",
    "name": "DisputeOpened",
    "inputs": [
      { "name": "anchorId", "type": "bytes32", "indexed": true },
      { "name": "disputant", "type": "address", "indexed": true },
      { "name": "reason", "type": "string" }
    ]
  },
  {
    "type": "function",
    "name": "getUsageAnchor",
    "inputs": [{ "name": "anchorId", "type": "bytes32" }],
    "outputs": [
      {
        "type": "tuple",
        "components": [
          { "name": "provider", "type": "address" },
          { "name": "windowStart", "type": "uint256" },
          { "name": "windowEnd", "type": "uint256" },
          { "name": "merkleRoot", "type": "bytes32" },
          { "name": "totalUsage", "type": "uint256" },
          { "name": "disputed", "type": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getInvoice",
    "inputs": [{ "name": "invoiceId", "type": "uint256" }],
    "outputs": [
      {
        "type": "tuple",
        "components": [
          { "name": "enterprise", "type": "address" },
          { "name": "provider", "type": "address" },
          { "name": "invoiceHash", "type": "bytes32" },
          { "name": "amount", "type": "uint256" },
          { "name": "paid", "type": "bool" },
          { "name": "exists", "type": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextInvoiceId",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "authorizedRelayers",
    "inputs": [{ "name": "", "type": "address" }],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view"
  }
] as const;
