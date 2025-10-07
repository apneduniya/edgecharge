import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Server,
  FileText,
  BarChart3,
  ArrowRight,
  Activity,
  Shield,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useDashboardOverview } from "@/lib/hooks/useAnalytics";

export default function Home() {
  const { overview, isLoading } = useDashboardOverview();

  return (
    <div className="flex flex-col h-full">
      <Header title="EdgeCharge Dashboard" description="DePIN Billing Platform" />

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
                Welcome to EdgeCharge
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Enterprise billing, invoicing and escrow for DePIN providers.
                Monitor usage, manage invoices, and track payments in real-time.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">Total Usage</CardTitle>
                <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {isLoading ? '...' : overview?.totalUsage?.toFixed(2) || '0.00'}
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">Active Providers</CardTitle>
                <div className="h-10 w-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <Server className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {isLoading ? '...' : overview?.activeProviders || 0}
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  +3 new this week
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">Invoices Generated</CardTitle>
                <div className="h-10 w-10 bg-purple-500 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {isLoading ? '...' : overview?.invoicesGenerated || 0}
                </div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  ${overview?.totalCost?.toFixed(2) || '0.00'} total
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-300">System Health</CardTitle>
                <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                  {isLoading ? '...' : `${overview?.systemHealth?.toFixed(1) || '99.9'}%`}
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  Uptime this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  Enterprise Dashboard
                </CardTitle>
                <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                  Monitor usage per project and manage enterprise billing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Projects</span>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">12</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Usage This Month</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">1,234.56 units</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pending Invoices</span>
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">3</Badge>
                  </div>
                </div>
                <Button asChild className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 group-hover:shadow-lg">
                  <Link href="/enterprise">
                    View Enterprise Dashboard
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Server className="h-6 w-6 text-white" />
                  </div>
                  Provider Dashboard
                </CardTitle>
                <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                  Track anchors received and monitor invoice status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Anchors Received</span>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">1,456</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Invoice Hash Status</span>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pending Payments</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">$12,345.67</span>
                  </div>
                </div>
                <Button asChild className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 group-hover:shadow-lg">
                  <Link href="/provider">
                    View Provider Dashboard
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Platform Features</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Powerful tools designed for enterprise-grade DePIN billing and management
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="h-10 w-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    Real-time Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Monitor usage patterns and system performance in real-time with detailed analytics and instant notifications.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="h-10 w-10 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    Secure Billing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Cryptographically secure billing with Merkle tree verification and comprehensive dispute resolution.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    Advanced Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Comprehensive analytics and reporting for usage patterns, cost optimization, and business insights.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
