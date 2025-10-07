import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ProviderStats } from "@/lib/types";
import { Shield, AlertCircle } from "lucide-react";

interface ProviderAnalyticsProps {
  stats: ProviderStats;
}

export function ProviderAnalytics({ stats }: ProviderAnalyticsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Usage Trends</CardTitle>
          <CardDescription>
            Daily usage patterns and anchor frequency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Daily Usage</span>
              <span className="font-medium">1,234.56 units</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Peak Usage Day</span>
              <span className="font-medium">Jan 15, 2024</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Anchors per Day</span>
              <span className="font-medium">24.5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Uptime</span>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="font-medium">{stats.uptime}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
          <CardDescription>
            Revenue analysis and payment status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Earnings</span>
              <span className="font-medium">{formatCurrency(stats.totalEarnings)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Paid Amount</span>
              <span className="font-medium">{formatCurrency(stats.totalEarnings - stats.pendingPayments)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending Payments</span>
              <span className="font-medium text-yellow-600">{formatCurrency(stats.pendingPayments)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Dispute Count</span>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="font-medium">{stats.disputeCount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
