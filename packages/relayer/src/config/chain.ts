import { defineChain } from 'viem';

export const u2uNebulasTestnet = defineChain({
  id: 2484,
  name: 'U2U Nebulas Testnet',
  nativeCurrency: { name: 'U2U', symbol: 'U2U', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-nebulas-testnet.u2u.xyz'] },
    public: { http: ['https://rpc-nebulas-testnet.u2u.xyz'] },
  },
});


