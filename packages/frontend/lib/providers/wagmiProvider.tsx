'use client';

import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';
import { ReactNode } from 'react';

interface WagmiProviderProps {
  children: ReactNode;
}

export function WagmiProviderWrapper({ children }: WagmiProviderProps) {
  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  );
}
