import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBlockchainService } from '../services';
import { UsageAnchor, Invoice } from '../services/interfaces';

// Hook for fetching usage anchors
export function useUsageAnchors(provider?: string, fromBlock?: number, toBlock?: number) {
  const blockchainService = getBlockchainService();

  return useQuery({
    queryKey: ['usageAnchors', provider, fromBlock, toBlock],
    queryFn: () => blockchainService.getUsageAnchors(provider, fromBlock, toBlock),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook for fetching a specific usage anchor
export function useUsageAnchor(anchorId: string) {
  const blockchainService = getBlockchainService();

  return useQuery({
    queryKey: ['usageAnchor', anchorId],
    queryFn: () => blockchainService.getUsageAnchor(anchorId),
    enabled: !!anchorId,
    staleTime: 60000, // 1 minute
  });
}

// Hook for fetching invoices
export function useInvoices(provider?: string) {
  const blockchainService = getBlockchainService();

  return useQuery({
    queryKey: ['invoices', provider],
    queryFn: () => blockchainService.getInvoices(provider),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook for fetching a specific invoice
export function useInvoice(invoiceId: string) {
  const blockchainService = getBlockchainService();

  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => blockchainService.getInvoice(invoiceId),
    enabled: !!invoiceId,
    staleTime: 60000, // 1 minute
  });
}

// Hook for checking relayer authorization
export function useRelayerAuthorization(address: string) {
  const blockchainService = getBlockchainService();

  return useQuery({
    queryKey: ['relayerAuthorization', address],
    queryFn: () => blockchainService.isRelayerAuthorized(address),
    enabled: !!address,
    staleTime: 300000, // 5 minutes
  });
}

// Hook for getting next invoice ID
export function useNextInvoiceId() {
  const blockchainService = getBlockchainService();

  return useQuery({
    queryKey: ['nextInvoiceId'],
    queryFn: () => blockchainService.getNextInvoiceId(),
    staleTime: 60000, // 1 minute
  });
}

// Hook for blockchain event listening
export function useBlockchainEvents(callback: (event: any) => void) {
  const blockchainService = getBlockchainService();

  return useQuery({
    queryKey: ['blockchainEvents'],
    queryFn: () => {
      const cleanup = blockchainService.listenToEvents(callback);
      return cleanup;
    },
    enabled: false, // Manual trigger only
    staleTime: Infinity,
  });
}

// Hook for refreshing blockchain data
export function useRefreshBlockchain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Invalidate all blockchain-related queries
      await queryClient.invalidateQueries({ queryKey: ['usageAnchors'] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['usageAnchor'] });
      await queryClient.invalidateQueries({ queryKey: ['invoice'] });
    },
  });
}
