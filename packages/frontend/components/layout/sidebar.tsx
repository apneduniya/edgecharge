"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Building2, 
  Server, 
  FileText, 
  BarChart3, 
  Settings,
  Wallet,
  Activity,
  Zap
} from "lucide-react"

const navigation = [
  {
    name: "Enterprise Dashboard",
    href: "/enterprise",
    icon: Building2,
    description: "View usage per project and download invoices"
  },
  {
    name: "Provider Dashboard", 
    href: "/provider",
    icon: Server,
    description: "Monitor anchors and invoice status"
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Usage analytics and insights"
  },
  {
    name: "Invoices",
    href: "/invoices",
    icon: FileText,
    description: "Invoice management and history"
  },
  {
    name: "Wallet",
    href: "/wallet",
    icon: Wallet,
    description: "Escrow and payment management"
  },
  {
    name: "Activity",
    href: "/activity",
    icon: Activity,
    description: "Transaction and event history"
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "System configuration"
  }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-6 py-6">
        {/* Logo/Brand */}
        <div className="px-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                EdgeCharge
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                DePIN Billing Platform
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="px-3">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-700/50" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  <item.icon className={cn(
                    "mr-3 h-5 w-5 transition-colors",
                    isActive 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  )} />
                  <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    <span className={cn(
                      "text-xs transition-colors",
                      isActive 
                        ? "text-blue-600/70 dark:text-blue-400/70" 
                        : "text-slate-500 dark:text-slate-500"
                    )}>
                      {item.description}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
