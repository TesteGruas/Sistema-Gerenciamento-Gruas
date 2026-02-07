"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  DollarSign, 
  Receipt, 
  Calculator,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Menu,
  X,
  Home,
  FileCheck,
  ReceiptText,
  CreditCard,
  ShoppingCart,
  Building2,
  ChevronDown
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type NavItem = {
  title: string
  href?: string
  icon: any
  category: string
  submenu?: Array<{
    title: string
    href: string
    icon: any
  }>
}

const financeiroNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard/financeiro",
    icon: BarChart3,
    category: "principal"
  },
  {
    title: "Vendas e Compras",
    icon: Receipt,
    category: "operacoes",
    submenu: [
      {
        title: "Vendas",
        href: "/dashboard/financeiro/vendas",
        icon: Receipt
      },
      {
        title: "Compras",
        href: "/dashboard/financeiro/compras",
        icon: ShoppingCart
      }
    ]
  },
  {
    title: "Medições",
    href: "/dashboard/financeiro/medicoes",
    icon: Calculator,
    category: "operacoes"
  },
  {
    title: "Notas Fiscais",
    href: "/dashboard/financeiro/notas-fiscais",
    icon: FileCheck,
    category: "documentos"
  },
  {
    title: "Impostos",
    href: "/dashboard/financeiro/impostos",
    icon: ReceiptText,
    category: "documentos"
  },
  {
    title: "Boletos",
    href: "/dashboard/financeiro/boletos",
    icon: CreditCard,
    category: "pagamentos"
  },
  {
    title: "Contas",
    icon: TrendingUp,
    category: "pagamentos",
    submenu: [
      {
        title: "Contas a Receber",
        href: "/dashboard/financeiro/contas-receber",
        icon: TrendingUp
      },
      {
        title: "Contas a Pagar",
        href: "/dashboard/financeiro/contas-pagar",
        icon: TrendingDown
      }
    ]
  },
  {
    title: "Aluguéis",
    href: "/dashboard/financeiro/alugueis",
    icon: Home,
    category: "gestao"
  },
  {
    title: "Bancos",
    href: "/dashboard/financeiro/bancos",
    icon: Building2,
    category: "gestao"
  },
]

export default function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)

  // Agrupar itens por categoria
  const itemsPorCategoria = financeiroNavItems.reduce((acc, item) => {
    const categoria = item.category || "outros"
    if (!acc[categoria]) {
      acc[categoria] = []
    }
    acc[categoria].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  // Verificar se algum item do submenu está ativo
  const isSubmenuActive = (item: NavItem) => {
    if (!item.submenu) return false
    return item.submenu.some(subItem => 
      pathname === subItem.href || pathname?.startsWith(subItem.href)
    )
  }

  // Ordem das categorias
  const ordemCategorias = ["principal", "operacoes", "documentos", "pagamentos", "gestao"]
  const categoriasOrdenadas = ordemCategorias.filter(cat => itemsPorCategoria[cat])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Superior */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo e Título */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Gestão financeira</p>
              </div>
            </div>

            {/* Menu Desktop */}
            <nav className="hidden lg:flex items-center gap-1 flex-wrap">
              {financeiroNavItems.map((item) => {
                if (item.submenu) {
                  const submenuActive = isSubmenuActive(item)
                  return (
                    <DropdownMenu key={item.title}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                            "hover:bg-gray-50 active:scale-95",
                            submenuActive
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-gray-700 hover:text-gray-900"
                          )}
                        >
                          <item.icon className={cn(
                            "w-4 h-4 transition-transform",
                            submenuActive && "scale-110"
                          )} />
                          <span>{item.title}</span>
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {item.submenu.map((subItem) => {
                          const isSubActive = pathname === subItem.href || 
                            pathname?.startsWith(subItem.href)
                          return (
                            <DropdownMenuItem key={subItem.href} asChild>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  "flex items-center gap-2 cursor-pointer",
                                  isSubActive && "bg-blue-50 text-blue-700"
                                )}
                              >
                                <subItem.icon className="w-4 h-4" />
                                <span>{subItem.title}</span>
                              </Link>
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                }

                const isActive = pathname === item.href || 
                  (item.href !== "/dashboard/financeiro" && pathname?.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                      "hover:bg-gray-50 active:scale-95",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-700 hover:text-gray-900"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 transition-transform",
                      isActive && "scale-110"
                    )} />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Menu Desktop Compacto (Tablet) */}
            <nav className="hidden md:flex lg:hidden items-center gap-1 flex-wrap">
              {financeiroNavItems.map((item) => {
                if (item.submenu) {
                  const submenuActive = isSubmenuActive(item)
                  return (
                    <DropdownMenu key={item.title}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                            "hover:bg-gray-50",
                            submenuActive
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 hover:text-gray-900"
                          )}
                          title={item.title}
                        >
                          <item.icon className="w-3.5 h-3.5" />
                          <span>{item.title}</span>
                          <ChevronDown className="w-3 h-3 ml-0.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {item.submenu.map((subItem) => {
                          const isSubActive = pathname === subItem.href || 
                            pathname?.startsWith(subItem.href)
                          return (
                            <DropdownMenuItem key={subItem.href} asChild>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  "flex items-center gap-2 cursor-pointer",
                                  isSubActive && "bg-blue-50 text-blue-700"
                                )}
                              >
                                <subItem.icon className="w-3.5 h-3.5" />
                                <span>{subItem.title}</span>
                              </Link>
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                }

                const isActive = pathname === item.href || 
                  (item.href !== "/dashboard/financeiro" && pathname?.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                      "hover:bg-gray-50",
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:text-gray-900"
                    )}
                    title={item.title}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
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
            <nav className="px-4 py-3">
              {categoriasOrdenadas.map((categoria) => {
                const items = itemsPorCategoria[categoria]
                const categoriaLabels: Record<string, string> = {
                  principal: "Principal",
                  operacoes: "Operações",
                  documentos: "Documentos",
                  pagamentos: "Pagamentos",
                  gestao: "Gestão"
                }

                return (
                  <div key={categoria} className="mb-4 last:mb-0">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                      {categoriaLabels[categoria] || categoria}
                    </h3>
                    <div className="space-y-1">
                      {items.map((item) => {
                        if (item.submenu) {
                          const submenuActive = isSubmenuActive(item)
                          const isSubmenuOpen = openSubmenu === item.title
                          
                          return (
                            <div key={item.title}>
                              <button
                                onClick={() => setOpenSubmenu(isSubmenuOpen ? null : item.title)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                  submenuActive
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-700 hover:bg-gray-100"
                                )}
                              >
                                <item.icon className={cn(
                                  "w-5 h-5",
                                  submenuActive ? "text-white" : "text-gray-500"
                                )} />
                                <span>{item.title}</span>
                                <ChevronDown className={cn(
                                  "w-4 h-4 ml-auto transition-transform",
                                  isSubmenuOpen && "rotate-180",
                                  submenuActive ? "text-white" : "text-gray-500"
                                )} />
                              </button>
                              {isSubmenuOpen && (
                                <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                                  {item.submenu.map((subItem) => {
                                    const isSubActive = pathname === subItem.href || 
                                      pathname?.startsWith(subItem.href)
                                    return (
                                      <Link
                                        key={subItem.href}
                                        href={subItem.href}
                                        className={cn(
                                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                          isSubActive
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "text-gray-700 hover:bg-gray-100"
                                        )}
                                        onClick={() => {
                                          setIsMobileMenuOpen(false)
                                          setOpenSubmenu(null)
                                        }}
                                      >
                                        <subItem.icon className={cn(
                                          "w-4 h-4",
                                          isSubActive ? "text-white" : "text-gray-500"
                                        )} />
                                        <span>{subItem.title}</span>
                                        {isSubActive && (
                                          <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                      </Link>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        }

                        const isActive = pathname === item.href || 
                          (item.href !== "/dashboard/financeiro" && pathname?.startsWith(item.href))
                        
                        return (
                          <Link
                            key={item.href}
                            href={item.href!}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                              isActive
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-gray-700 hover:bg-gray-100"
                            )}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <item.icon className={cn(
                              "w-5 h-5",
                              isActive ? "text-white" : "text-gray-500"
                            )} />
                            <span>{item.title}</span>
                            {isActive && (
                              <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-auto">
        <div>
          {children}
        </div>
      </main>
    </div>
  )
}
