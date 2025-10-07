import { useQuery } from '@tanstack/react-query';
import { getAnalyticsService } from '../services';

// Hook for fetching service statistics
export function useServiceStats() {
  const analyticsService = getAnalyticsService();

  return useQuery({
    queryKey: ['analytics', 'serviceStats'],
    queryFn: () => analyticsService.getServiceStats(),
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

// Hook for fetching usage trends
export function useUsageTrends(timeRange: 'day' | 'week' | 'month' | 'year' = 'week') {
  const analyticsService = getAnalyticsService();

  return useQuery({
    queryKey: ['analytics', 'usageTrends', timeRange],
    queryFn: () => analyticsService.getUsageTrends(timeRange),
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // Refetch every 10 minutes
  });
}

// Hook for fetching provider statistics
export function useProviderStats(provider: string) {
  const analyticsService = getAnalyticsService();

  return useQuery({
    queryKey: ['analytics', 'providerStats', provider],
    queryFn: () => analyticsService.getProviderStats(provider),
    enabled: !!provider,
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // Refetch every 10 minutes
  });
}

// Hook for fetching enterprise statistics
export function useEnterpriseStats() {
  const analyticsService = getAnalyticsService();

  return useQuery({
    queryKey: ['analytics', 'enterpriseStats'],
    queryFn: () => analyticsService.getEnterpriseStats(),
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // Refetch every 10 minutes
  });
}

// Hook for dashboard overview data
export function useDashboardOverview() {
  const { data: serviceStats, isLoading: serviceStatsLoading } = useServiceStats();
  const { data: enterpriseStats, isLoading: enterpriseStatsLoading } = useEnterpriseStats();
  const { data: usageTrends, isLoading: trendsLoading } = useUsageTrends('week');

  const isLoading = serviceStatsLoading || enterpriseStatsLoading || trendsLoading;

  const overview = serviceStats && enterpriseStats ? {
    totalUsage: serviceStats.totalUsage,
    activeProviders: serviceStats.activeProviders,
    invoicesGenerated: serviceStats.invoicesGenerated,
    systemHealth: serviceStats.systemHealth,
    totalProjects: enterpriseStats.totalProjects,
    totalCost: enterpriseStats.totalCost,
    activeProviders: enterpriseStats.activeProviders,
    usageTrends: usageTrends || [],
  } : null;

  return {
    overview,
    isLoading,
  };
}
