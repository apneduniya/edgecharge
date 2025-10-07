import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { QueryProvider } from "@/lib/providers/queryProvider";
import { WagmiProviderWrapper } from "@/lib/providers/wagmiProvider";
import { ThemeProvider } from "@/components/theme-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EdgeCharge - DePIN Billing Platform",
  description: "Enterprise billing, invoicing and escrow for DePIN providers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <WagmiProviderWrapper>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="hidden md:flex md:w-72 md:flex-col">
                  <div className="flex flex-col flex-grow pt-6 overflow-y-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                    <Sidebar />
                  </div>
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  {children}
                </div>
              </div>
            </ThemeProvider>
          </QueryProvider>
        </WagmiProviderWrapper>
      </body>
    </html>
  );
}
