"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import {
  Bell,
  Search,
  User,
  Moon,
  Sun,
  Wallet
} from "lucide-react"
import { useTheme } from "next-themes"

interface HeaderProps {
  title: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
        <div className="container flex h-16 items-center px-6">

          <div className="flex flex-1 items-center justify-between space-x-4 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-10 py-2 text-sm shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-400/20 dark:focus:border-blue-400 md:w-[240px] lg:w-[320px]"
                />
              </div>
            </div>

            <nav className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {!mounted ? (
                  <span className="inline-block h-4 w-4" />
                ) : resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-600" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              >
                <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex h-10 px-4 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </Button>
            </nav>
          </div>
        </div>
      </header >
    </>
  )
}
