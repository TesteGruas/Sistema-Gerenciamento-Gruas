"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  DollarSign, 
  Receipt, 
  FileText, 
  Calculator,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Menu,
  X,
  Home
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const financeiroNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard/financeiro",
    icon: BarChart3,
  },
  {
    title: "Vendas",
    href: "/dashboard/financeiro/vendas",
    icon: Receipt,
  },
  {
    title: "Medições",
    href: "/dashboard/financeiro/medicoes",
    icon: Calculator,
  },
  {
    title: "Receitas",
    href: "/dashboard/financeiro/receitas",
    icon: TrendingUp,
  },
  {
    title: "Custos",
    href: "/dashboard/financeiro/custos",
    icon: TrendingDown,
  },
  {
    title: "Aluguéis",
    href: "/dashboard/financeiro/alugueis",
    icon: Home,
  },
  {
    title: "Relatórios",
    href: "/dashboard/financeiro/relatorios",
    icon: FileText,
  },
]

export default function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Superior */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo e Título */}
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>
            </div>

            {/* Menu Desktop */}
            <nav className="hidden md:flex items-center space-x-1">
              {financeiroNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              ))}
            </nav>

            {/* Botão Menu Mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="px-4 py-2 space-y-1">
              {financeiroNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
