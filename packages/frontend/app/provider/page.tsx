"use client"

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/shared/stats-card";
import { AnchorTable } from "@/components/provider/anchor-table";
import { InvoiceStatusTable } from "@/components/provider/invoice-status-table";
import { ProviderAnalytics } from "@/components/provider/provider-analytics";
import { RecentActivity } from "@/components/provider/recent-activity";
import { 
  Server, 
  Activity, 
  DollarSign,
  Clock
} from "lucide-react";
import { UsageAnchor, Invoice, ProviderStats } from "@/lib/types";

// Mock data - in real app, this would come from API
const mockAnchors: UsageAnchor[] = [
  {
    id: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    provider: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    windowStart: 1704067200,
    windowEnd: 1704067260,
    totalUsage: 1234.56,
    merkleRoot: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    disputed: false,
    status: "confirmed",
    transactionHash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba"
  },
  {
    id: "0x2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcdef1",
    provider: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    windowStart: 1704067260,
    windowEnd: 1704067320,
    totalUsage: 1456.78,
    merkleRoot: "0xbcdef12345678901bcdef12345678901bcdef12345678901bcdef12345678901",
    disputed: false,
    status: "confirmed",
    transactionHash: "0x8765432109edcba98765432109edcba98765432109edcba98765432109edcba9"
  },
  {
    id: "0x3456789012cdef123456789012cdef123456789012cdef123456789012cdef12",
    provider: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    windowStart: 1704067320,
    windowEnd: 1704067380,
    totalUsage: 987.34,
    merkleRoot: "0xcdef123456789012cdef123456789012cdef123456789012cdef123456789012",
    disputed: true,
    status: "disputed",
    transactionHash: "0x7654321098dcba987654321098dcba987654321098dcba987654321098dcba98"
  }
];

const mockInvoices: Invoice[] = [
  {
    id: "inv-001",
    invoiceHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
    amount: 2456.78,
    status: "anchored",
    generatedDate: 1704067200,
    anchoredDate: 1704067200,
    paid: false,
    transactionHash: "0x2222222222222222222222222222222222222222222222222222222222222222"
  },
  {
    id: "inv-002",
    invoiceHash: "0x3333333333333333333333333333333333333333333333333333333333333333",
    amount: 1876.45,
    status: "paid",
    generatedDate: 1704063600,
    anchoredDate: 1704063600,
    paid: true,
    transactionHash: "0x4444444444444444444444444444444444444444444444444444444444444444"
  },
  {
    id: "inv-003",
    invoiceHash: "0x5555555555555555555555555555555555555555555555555555555555555555",
    amount: 892.34,
    status: "pending",
    generatedDate: 1704056400,
    anchoredDate: null,
    paid: false,
    transactionHash: null
  }
];

const mockProviderStats: ProviderStats = {
  totalAnchors: 1245,
  totalUsage: 156789.45,
  totalEarnings: 31234.56,
  pendingPayments: 4567.89,
  disputeCount: 3,
  uptime: 99.8
};

export default function ProviderDashboard() {

  const handleViewAnchor = (anchor: UsageAnchor) => {
    console.log('Viewing anchor:', anchor.id);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    console.log('Viewing invoice:', invoice.id);
  };

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Provider Dashboard" 
        description="Monitor anchors received and invoice status" 
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Provider Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="Total Anchors"
              value={mockProviderStats.totalAnchors.toLocaleString()}
              description="+12 this week"
              icon={Server}
            />
            
            <StatsCard
              title="Total Usage"
              value={mockProviderStats.totalUsage.toLocaleString()}
              description="units processed"
              icon={Activity}
            />
            
            <StatsCard
              title="Total Earnings"
              value={`$${mockProviderStats.totalEarnings.toFixed(2)}`}
              description="lifetime earnings"
              icon={DollarSign}
            />
            
            <StatsCard
              title="Pending Payments"
              value={`$${mockProviderStats.pendingPayments.toFixed(2)}`}
              description="awaiting payment"
              icon={Clock}
            />
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="anchors" className="space-y-4">
            <TabsList>
              <TabsTrigger value="anchors">Usage Anchors</TabsTrigger>
              <TabsTrigger value="invoices">Invoice Status</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Anchors Tab */}
            <TabsContent value="anchors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Anchors Received</CardTitle>
                  <CardDescription>
                    Monitor all usage anchors submitted to the blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnchorTable
                    anchors={mockAnchors}
                    onView={handleViewAnchor}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Hash & Status</CardTitle>
                  <CardDescription>
                    Track invoice hashes and their blockchain status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InvoiceStatusTable
                    invoices={mockInvoices}
                    onView={handleViewInvoice}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <ProviderAnalytics 
                stats={mockProviderStats}
              />
              
              <RecentActivity anchors={mockAnchors} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
