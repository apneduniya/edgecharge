import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoicingService } from '../services';
import { Invoice } from '../services/interfaces';

// Hook for fetching invoices
export function useInvoices(provider?: string) {
  const invoicingService = getInvoicingService();

  return useQuery({
    queryKey: ['invoicing', 'invoices', provider],
    queryFn: () => invoicingService.getInvoices(provider),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook for fetching a specific invoice
export function useInvoice(invoiceId: string) {
  const invoicingService = getInvoicingService();

  return useQuery({
    queryKey: ['invoicing', 'invoice', invoiceId],
    queryFn: () => invoicingService.getInvoice(invoiceId),
    enabled: !!invoiceId,
    staleTime: 60000, // 1 minute
  });
}

// Hook for generating an invoice
export function useGenerateInvoice() {
  const invoicingService = getInvoicingService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (anchorIds: string[]) => invoicingService.generateInvoice(anchorIds),
    onSuccess: (invoice) => {
      if (invoice) {
        // Invalidate and refetch invoices
        queryClient.invalidateQueries({ queryKey: ['invoicing', 'invoices'] });
        // Add the new invoice to the cache
        queryClient.setQueryData(['invoicing', 'invoice', invoice.id], invoice);
      }
    },
  });
}

// Hook for downloading an invoice
export function useDownloadInvoice() {
  const invoicingService = getInvoicingService();

  return useMutation({
    mutationFn: (invoiceId: string) => invoicingService.downloadInvoice(invoiceId),
    onSuccess: (blob, invoiceId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}

// Hook for getting invoice status
export function useInvoiceStatus(invoiceId: string) {
  const invoicingService = getInvoicingService();

  return useQuery({
    queryKey: ['invoicing', 'status', invoiceId],
    queryFn: () => invoicingService.getInvoiceStatus(invoiceId),
    enabled: !!invoiceId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook for refreshing invoicing data
export function useRefreshInvoicing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Invalidate all invoicing-related queries
      await queryClient.invalidateQueries({ queryKey: ['invoicing'] });
    },
  });
}

// Hook for invoice statistics
export function useInvoiceStats(provider?: string) {
  const { data: invoices, isLoading, error } = useInvoices(provider);

  const stats = invoices ? {
    total: invoices.length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    pending: invoices.filter(inv => inv.status === 'generated' || inv.status === 'anchored').length,
    overdue: invoices.filter(inv => 
      inv.status !== 'paid' && inv.dueDate < Date.now() / 1000
    ).length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paidAmount: invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0),
  } : null;

  return {
    stats,
    isLoading,
    error,
  };
}
