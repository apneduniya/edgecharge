"use client"

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/shared/stats-card";
import { ProjectTable } from "@/components/enterprise/project-table";
import { InvoiceTable } from "@/components/enterprise/invoice-table";
import { UsageAnalytics } from "@/components/enterprise/usage-analytics";
import { 
  Building2, 
  Activity,
  DollarSign,
  Calendar,
  Filter,
  Search
} from "lucide-react";
import { Project, Invoice, UsageData } from "@/lib/types";

// Mock data - in real app, this would come from API
const mockProjects: Project[] = [
  {
    id: "proj-001",
    name: "AI Training Cluster",
    status: "active",
    usage: 1234.56,
    cost: 2456.78,
    lastUpdated: 1704067200,
    providers: 3,
    trend: "up"
  },
  {
    id: "proj-002", 
    name: "Edge Computing Network",
    status: "active",
    usage: 987.34,
    cost: 1876.45,
    lastUpdated: 1704063600,
    providers: 5,
    trend: "up"
  },
  {
    id: "proj-003",
    name: "Data Processing Pipeline",
    status: "paused",
    usage: 456.78,
    cost: 892.34,
    lastUpdated: 1704056400,
    providers: 2,
    trend: "down"
  }
];

const mockInvoices: Invoice[] = [
  {
    id: "inv-001",
    projectId: "proj-001",
    projectName: "AI Training Cluster",
    amount: 2456.78,
    status: "paid",
    dueDate: 1704153600,
    generatedDate: 1704067200,
    downloadUrl: "/api/invoices/inv-001/download"
  },
  {
    id: "inv-002",
    projectId: "proj-002", 
    projectName: "Edge Computing Network",
    amount: 1876.45,
    status: "pending",
    dueDate: 1704240000,
    generatedDate: 1704063600,
    downloadUrl: "/api/invoices/inv-002/download"
  },
  {
    id: "inv-003",
    projectId: "proj-003",
    projectName: "Data Processing Pipeline", 
    amount: 892.34,
    status: "overdue",
    dueDate: 1703980800,
    generatedDate: 1704056400,
    downloadUrl: "/api/invoices/inv-003/download"
  }
];

const mockUsageData: UsageData[] = [
  { date: "2024-01-01", usage: 1200, cost: 2400 },
  { date: "2024-01-02", usage: 1350, cost: 2700 },
  { date: "2024-01-03", usage: 1100, cost: 2200 },
  { date: "2024-01-04", usage: 1450, cost: 2900 },
  { date: "2024-01-05", usage: 1300, cost: 2600 },
  { date: "2024-01-06", usage: 1600, cost: 3200 },
  { date: "2024-01-07", usage: 1400, cost: 2800 }
];

export default function EnterpriseDashboard() {

  const handleDownloadInvoice = (invoice: Invoice) => {
    console.log(`Downloading invoice: ${invoice.id}`);
    const link = document.createElement('a');
    link.href = `/api/invoices/${invoice.id}/download`;
    link.download = `invoice-${invoice.id}.pdf`;
    link.click();
  };

  const handleViewProject = (project: Project) => {
    console.log('Viewing project:', project.id);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    console.log('Viewing invoice:', invoice.id);
  };

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Enterprise Dashboard" 
        description="Monitor usage per project and manage enterprise billing" 
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="Total Projects"
              value={mockProjects.length}
              description={`${mockProjects.filter(p => p.status === 'active').length} active`}
              icon={Building2}
            />
            
            <StatsCard
              title="Total Usage"
              value={`${mockProjects.reduce((sum, p) => sum + p.usage, 0).toFixed(2)}`}
              description="units this month"
              icon={Activity}
            />
            
            <StatsCard
              title="Total Cost"
              value={`$${mockProjects.reduce((sum, p) => sum + p.cost, 0).toFixed(2)}`}
              description="this month"
              icon={DollarSign}
            />
            
            <StatsCard
              title="Pending Invoices"
              value={mockInvoices.filter(i => i.status === 'pending' || i.status === 'overdue').length}
              description={`$${mockInvoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0).toFixed(2)} total`}
              icon={Calendar}
            />
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="projects" className="space-y-4">
            <TabsList>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
            </TabsList>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Overview</CardTitle>
                  <CardDescription>
                    Monitor usage and costs across all your projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Search and Filter */}
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                          type="search"
                          placeholder="Search projects..."
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-8 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                      </Button>
                    </div>

                    {/* Projects Table */}
                    <ProjectTable
                      projects={mockProjects}
                      onView={handleViewProject}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Management</CardTitle>
                  <CardDescription>
                    View and download invoices for all projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InvoiceTable
                    invoices={mockInvoices}
                    onView={handleViewInvoice}
                    onDownload={handleDownloadInvoice}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Usage Analytics Tab */}
            <TabsContent value="usage" className="space-y-4">
              <UsageAnalytics 
                usageData={mockUsageData}
                projects={mockProjects}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
