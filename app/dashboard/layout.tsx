"use client"

import type React from "react"

import { useState, useEffect, useRef, Suspense, useMemo, useCallback, memo } from "react"
import dynamic from "next/dynamic"
import { AuthService } from "@/app/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Package,
  Clock,
  Users,
  FileSignature,
  FileText,
  DollarSign,
  BarChart3,
  ConeIcon as Crane,
  BookOpen,
  Menu,
  X,
  LogOut,
  Home,
  Shield,
  UserCheck,
  History,
  Bell,
  Settings,
  Mail,
  User,
  ChevronDown,
  ChevronRight,
  Lock,
  Layers,
  MessageSquare,
  Calculator,
  Smartphone,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { GlobalLoading, useGlobalLoading } from "@/components/global-loading"
import { EmpresaProvider, useEmpresa } from "@/hooks/use-empresa"
import Image from "next/image"
import { ChatIa } from "@/components/chat-ia"
import { APP_NAME, APP_VERSION_DATE, APP_VERSION_LABEL } from "@/lib/app-version"

// Dynamic imports para componentes pesados - carregam apenas quando necessário
const NotificationsDropdown = dynamic(
  () => import("@/components/notifications-dropdown").then(mod => ({ default: mod.NotificationsDropdown })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-10 h-10 flex items-center justify-center">
        <Bell className="w-5 h-5 text-gray-400" />
      </div>
    )
  }
)

const UserDropdown = dynamic(
  () => import("@/components/user-dropdown").then(mod => ({ default: mod.UserDropdown })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-10 h-10 flex items-center justify-center">
        <User className="w-5 h-5 text-gray-400" />
      </div>
    )
  }
)

const GlobalSearch = dynamic(
  () => import("@/components/global-search").then(mod => ({ default: mod.GlobalSearch })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-64 h-10 bg-gray-100 rounded-md animate-pulse" />
    )
  }
)

// Tipos para navegação
interface NavigationItem {
  name: string
  href: string
  icon: any
  category?: string
}

// Navegação com permissões
interface NavigationItemWithPermission extends NavigationItem {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
}

const baseNavigation: NavigationItemWithPermission[] = [
  // SEÇÃO PRINCIPAL
  { name: "Dashboard", href: "/dashboard", icon: Home, category: "principal", permission: "dashboard:visualizar" },
  
  // SEÇÃO NOTIFICAÇÕES
  { name: "Notificações", href: "/dashboard/notificacoes", icon: Bell, category: "notificacoes", permission: "notificacoes:visualizar" },
  { name: "WhatsApp Notificações", href: "/dashboard/aprovacoes-horas-extras/whatsapp", icon: MessageSquare, category: "notificacoes", permission: "aprovacoes:visualizar" },
  { name: "Notificações app (debug)", href: "/dashboard/configuracoes/notificacoes-app", icon: Smartphone, category: "notificacoes", permission: "usuarios:gerenciar" },
  
  // SEÇÃO OPERACIONAL
  { name: "Clientes", href: "/dashboard/clientes", icon: Users, category: "operacional", permission: "clientes:visualizar" },
  { name: "Orçamentos", href: "/dashboard/orcamentos", icon: FileText, category: "operacional", permission: "orcamentos:visualizar" },
  { name: "Obras", href: "/dashboard/obras", icon: Building2, category: "operacional", permission: "obras:visualizar" },
  { name: "Gruas", href: "/dashboard/gruas", icon: Crane, category: "operacional", permission: "gruas:visualizar" },
  { name: "Medições", href: "/dashboard/medicoes", icon: Calculator, category: "operacional", permission: "obras:visualizar" },
  { name: "Livros de Gruas", href: "/dashboard/livros-gruas", icon: BookOpen, category: "operacional", permission: "livros_gruas:visualizar" },
  { name: "Estoque", href: "/dashboard/estoque", icon: Package, category: "operacional", permission: "estoque:visualizar" },
  { name: "Complementos", href: "/dashboard/complementos", icon: Layers, category: "operacional", permission: "complementos:visualizar" },
  
  // SEÇÃO RH E PESSOAS
  { name: "Ponto Eletrônico", href: "/dashboard/ponto", icon: Clock, category: "rh", permission: "ponto_eletronico:visualizar" },
  { name: "RH", href: "/dashboard/rh", icon: UserCheck, category: "rh", permission: "rh:visualizar" },
  
  // SEÇÃO FINANCEIRA
  { name: "Financeiro", href: "/dashboard/financeiro", icon: DollarSign, category: "financeiro", permission: "financeiro:visualizar" },
  { name: "Aluguéis", href: "/dashboard/financeiro/alugueis", icon: Home, category: "financeiro", permission: "financeiro:visualizar" },
  
  // SEÇÃO RELATÓRIOS E ANÁLISES
  { name: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3, category: "relatorios", permission: "relatorios:visualizar" },
  { name: "Histórico", href: "/dashboard/historico", icon: History, category: "relatorios", permission: "historico:visualizar" },
  
  // SEÇÃO DOCUMENTOS
  { name: "Assinatura Digital", href: "/dashboard/assinatura", icon: FileSignature, category: "documentos", permission: "assinatura_digital:visualizar" },
]

const adminNavigation: NavigationItemWithPermission[] = [
  { name: "Usuários", href: "/dashboard/usuarios", icon: Shield, category: "admin", permission: "usuarios:visualizar" },
  { name: "Perfis e Permissões", href: "/dashboard/perfis-permissoes", icon: Shield, category: "admin", permission: "usuarios:visualizar" },
  { name: "Configurações de Email", href: "/dashboard/configuracoes/email", icon: Mail, category: "admin", permission: "email:configurar" },
  { name: "Configuração da Empresa", href: "/dashboard/configuracoes/empresa", icon: Building2, category: "admin", permission: "admin:configurar" },
  { name: "Configurações do Sistema", href: "/dashboard/configuracoes/sistema", icon: Settings, category: "admin", permission: "usuarios:gerenciar" },
]

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  // Todos os hooks devem ser chamados no topo, antes de qualquer lógica condicional
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    isAdmin: isAdminFromPermissions, 
    isManager,
    isOperator,
    isViewer,
    isClient,
    canAccessDashboard,
    canAccessPontoEletronico,
    canAccessFinanceiro,
    canAccessRH,
    canAccessObras,
    canAccessClientes,
    canAccessRelatorios,
    canAccessUsuarios,
    hasMinLevel,
    level,
    perfil, 
    loading: permissionsLoading 
  } = usePermissions()
  const { empresa } = useEmpresa()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isClientSide, setIsClientSide] = useState(false)
  const { isLoading, showLoading, hideLoading, message } = useGlobalLoading()
  const [isNavigating, setIsNavigating] = useState(false)
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const initialLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    principal: false,
    notificacoes: false,
    operacional: false,
    rh: false,
    financeiro: false,
    relatorios: false,
    documentos: false,
    admin: false,
  })
  
  // Todos os hooks devem ser chamados ANTES de qualquer retorno condicional
  // Filtrar navegação baseada em permissões - memoizado para evitar recálculos
  const filterNavigationByPermissions = useMemo(() => {
    return (navigation: NavigationItemWithPermission[]) => {
      return navigation.filter(item => {
      // Dashboard - apenas Admin e Gerente
      if (item.href === '/dashboard') {
        return canAccessDashboard()
      }
      
      // Notificações - apenas Admin e Gerente
      if (item.href === '/dashboard/notificacoes') {
        return canAccessDashboard()
      }
      
      // WhatsApp Notificações - apenas Admin
      if (item.href === '/dashboard/aprovacoes-horas-extras/whatsapp') {
        return isAdminFromPermissions()
      }
      
      // Clientes - apenas Admin e Gerente
      if (item.href === '/dashboard/clientes') {
        return canAccessClientes()
      }
      
      // Obras - todos podem acessar (com limitações)
      if (item.href === '/dashboard/obras') {
        return canAccessObras()
      }
      
      // Controle de Gruas - Admin, Gerente, Clientes (nível 6+)
      if (item.href === '/dashboard/gruas') {
        return isAdminFromPermissions() || isManager() || (level >= 6)
      }
      
      // Livros de Gruas - todos podem acessar
      if (item.href === '/dashboard/livros-gruas') {
        return true
      }
      
      // Estoque - Admin, Gerente, Clientes (nível 6+)
      if (item.href === '/dashboard/estoque') {
        return isAdminFromPermissions() || isManager() || (level >= 6)
      }
      
      // Complementos - Admin, Gerente, Clientes (nível 6+)
      if (item.href === '/dashboard/complementos') {
        return isAdminFromPermissions() || isManager() || (level >= 6)
      }
      
      // Orçamentos - apenas Admin, Gestor e Financeiro
      if (item.href === '/dashboard/orcamentos') {
        return hasPermission('orcamentos:visualizar')
      }
      
      // Medições - mesma permissão de obras
      if (item.href === '/dashboard/medicoes') {
        return canAccessObras()
      }
      
      // Ponto Eletrônico - Admin, Gerente, Supervisor
      if (item.href === '/dashboard/ponto') {
        return canAccessPontoEletronico()
      }
      
      // RH - Admin, Gerente, Supervisor
      if (item.href === '/dashboard/rh') {
        return canAccessRH()
      }
      
      // Financeiro - apenas Admin e Gerente
      if (item.href === '/dashboard/financeiro') {
        return canAccessFinanceiro()
      }
      
      // Aluguéis - apenas Admin e Gerente (mesma permissão do financeiro)
      if (item.href === '/dashboard/financeiro/alugueis') {
        return canAccessFinanceiro()
      }
      
      // Relatórios - apenas Admin e Gerente
      if (item.href === '/dashboard/relatorios') {
        return canAccessRelatorios()
      }
      
      // Histórico - apenas Admin e Gerente
      if (item.href === '/dashboard/historico') {
        return canAccessRelatorios()
      }
      
      // Assinatura Digital - todos podem acessar
      if (item.href === '/dashboard/assinatura') {
        return true
      }
      
      // Usuários - apenas Admin e Gerente
      if (item.href === '/dashboard/usuarios') {
        return canAccessUsuarios()
      }
      
      // Perfis e Permissões - apenas Admin
      if (item.href === '/dashboard/perfis-permissoes') {
        return isAdminFromPermissions()
      }
      
      // Configurações de Email - apenas Admin
      if (item.href === '/dashboard/configuracoes/email') {
        return isAdminFromPermissions()
      }
      
      return true
      })
    }
  }, [
    canAccessDashboard,
    canAccessClientes,
    canAccessObras,
    isAdminFromPermissions,
    isManager,
    level,
    canAccessPontoEletronico,
    canAccessRH,
    canAccessFinanceiro,
    canAccessRelatorios,
    canAccessUsuarios
  ])

  // Navegação filtrada por permissões - memoizado
  const filteredBaseNavigation = useMemo(() => 
    filterNavigationByPermissions(baseNavigation),
    [filterNavigationByPermissions]
  )
  
  const filteredAdminNavigation = useMemo(() => 
    filterNavigationByPermissions(adminNavigation),
    [filterNavigationByPermissions]
  )

  const handleLogout = () => {
    AuthService.logout()
  }

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Combinar navegação base com navegação de admin se necessário - memoizado
  const navigation = useMemo(() => 
    isAdminFromPermissions() ? [...filteredBaseNavigation, ...filteredAdminNavigation] : filteredBaseNavigation,
    [isAdminFromPermissions, filteredBaseNavigation, filteredAdminNavigation]
  )

  // Mantém o item da sidebar ativo também em rotas filhas (ex.: /dashboard/financeiro/*)
  const isNavItemActive = useCallback((href: string) => {
    if (!pathname) return false
    if (href === "/dashboard") return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }, [pathname])

  // Detectar mudanças no pathname para desativar loading
  const previousPathname = useRef(pathname)
  
  useEffect(() => {
    // Limpar timer de navegação se o pathname mudou
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current)
      navigationTimerRef.current = null
    }
    
    // Se o pathname mudou e estávamos navegando, desativar loading
    if (previousPathname.current !== pathname && isNavigating) {
      console.log(`✅ [Preload] Página carregada: ${pathname}`)
      previousPathname.current = pathname
      // Desativar loading imediatamente - delay mínimo apenas para garantir renderização
      const timer = setTimeout(() => {
        setIsNavigating(false)
        hideLoading()
      }, 50)
      return () => clearTimeout(timer)
    } else if (previousPathname.current !== pathname) {
      console.log(`🔄 [Preload] Mudança de rota: ${previousPathname.current || 'inicial'} → ${pathname}`)
      previousPathname.current = pathname
    }
  }, [pathname, isNavigating, hideLoading])

  // Função para lidar com clique em links da sidebar
  // Não interfere na navegação - apenas adiciona feedback visual
  const handleLinkClick = (href: string, itemName: string) => {
    // Fechar sidebar no mobile ao clicar em um item
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
    
    if (pathname !== href) {
      // Limpar timer anterior se existir
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current)
      }
      // Usar debounce para não mostrar loading em navegações muito rápidas
      navigationTimerRef.current = setTimeout(() => {
        // Só mostrar loading se ainda estiver navegando após 150ms
        if (pathname !== href) {
          setIsNavigating(true)
          console.log(`⏳ [Preload] Navegando para: ${itemName}`)
          showLoading(`Carregando ${itemName}...`)
        }
        navigationTimerRef.current = null
      }, 150)
    }
  }

  // Todos os useEffect devem estar no topo também
  useEffect(() => {
    setIsClientSide(true)
  }, [])

  // Timeout de 5 segundos para recarregar a página se o loading inicial demorar muito
  useEffect(() => {
    if (!isClientSide) {
      // Configurar timeout de 5 segundos para recarregar a página
      initialLoadingTimeoutRef.current = setTimeout(() => {
        console.warn('⚠️ [Loading] Timeout de 5s no loading inicial. Recarregando página...')
        window.location.reload()
      }, 5000)
    }

    return () => {
      if (initialLoadingTimeoutRef.current) {
        clearTimeout(initialLoadingTimeoutRef.current)
        initialLoadingTimeoutRef.current = null
      }
    }
  }, [isClientSide])
  
  // Redirecionar usuários que não são Admin para o PWA
  // Apenas Admin (level 10) pode acessar o dashboard
  useEffect(() => {
    if (!permissionsLoading) {
      // Se não é admin, redirecionar para PWA
      if (!isAdminFromPermissions() && level !== 10) {
        console.log(`🚫 [Dashboard] Acesso negado. Redirecionando para PWA. (Level: ${level}, isAdmin: ${isAdminFromPermissions()})`)
        router.replace('/pwa')
      }
    }
  }, [permissionsLoading, isAdminFromPermissions, level, router])
  
  // Redirecionar Operários para o PWA - não devem ter acesso ao dashboard web
  useEffect(() => {
    if (!permissionsLoading && isOperator()) {
      router.replace('/pwa')
    }
  }, [permissionsLoading, isOperator, router])
  
  // Renderizar apenas no cliente para evitar erros de SSR
  // IMPORTANTE: Este check deve vir DEPOIS de todos os hooks
  if (!isClientSide) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Carregando Dashboard...</h1>
        </div>
      </div>
    )
  }
  
  // Não renderizar layout se for Operário (enquanto redireciona)
  if (!permissionsLoading && isOperator()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Redirecionando para o aplicativo...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex lg:flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {empresa.logo ? (
              <div className="relative w-8 h-8">
                <Image
                  src={empresa.logo}
                  alt={empresa.nome}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="font-bold text-gray-900">{empresa.nome || "IRBANA"}</span>
          </div>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-6">
          {/* Seção Principal */}
          <div>
            <button
              onClick={() => toggleSection('principal')}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-gray-700 transition-colors"
            >
              <span>Principal</span>
              {collapsedSections.principal ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {!collapsedSections.principal && (
              <div className="space-y-1">
                {navigation.filter(item => item.category === "principal").map((item) => {
                  const isActive = isNavItemActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => handleLinkClick(item.href, item.name)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Seção Notificações - Só exibir se houver itens visíveis */}
          {navigation.filter(item => item.category === "notificacoes").length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('notificacoes')}
                className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-gray-700 transition-colors"
              >
                <span>Notificações</span>
                {collapsedSections.notificacoes ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {!collapsedSections.notificacoes && (
                <div className="space-y-1">
                  {navigation.filter(item => item.category === "notificacoes").map((item) => {
                    const isActive = isNavItemActive(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => handleLinkClick(item.href, item.name)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Seção Operacional */}
          <div>
            <button
              onClick={() => toggleSection('operacional')}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-gray-700 transition-colors"
            >
              <span>Operacional</span>
              {collapsedSections.operacional ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {!collapsedSections.operacional && (
              <div className="space-y-1">
                {navigation.filter(item => item.category === "operacional").map((item) => {
                  const isActive = isNavItemActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => handleLinkClick(item.href, item.name)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Seção RH e Pessoas - Só exibir se houver itens visíveis */}
          {filteredBaseNavigation.filter(item => item.category === "rh").length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('rh')}
                className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-gray-700 transition-colors"
              >
                <span>RH e Pessoas</span>
                {collapsedSections.rh ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {!collapsedSections.rh && (
                <div className="space-y-1">
                  {filteredBaseNavigation.filter(item => item.category === "rh").map((item) => {
                    const isActive = isNavItemActive(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => handleLinkClick(item.href, item.name)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Seção Financeira - Só exibir se houver itens visíveis */}
          {filteredBaseNavigation.filter(item => item.category === "financeiro").length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('financeiro')}
                className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-gray-700 transition-colors"
              >
                <span>Financeiro</span>
                {collapsedSections.financeiro ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {!collapsedSections.financeiro && (
                <div className="space-y-1">
                  {filteredBaseNavigation.filter(item => item.category === "financeiro").map((item) => {
                    const isActive = isNavItemActive(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => handleLinkClick(item.href, item.name)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Seção Relatórios e Análises */}
          <div>
            <button
              onClick={() => toggleSection('relatorios')}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-gray-700 transition-colors"
            >
              <span>Relatórios</span>
              {collapsedSections.relatorios ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {!collapsedSections.relatorios && (
              <div className="space-y-1">
                {navigation.filter(item => item.category === "relatorios").map((item) => {
                  const isActive = isNavItemActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => handleLinkClick(item.href, item.name)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Seção Documentos */}
          <div>
            <button
              onClick={() => toggleSection('documentos')}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-gray-700 transition-colors"
            >
              <span>Documentos</span>
              {collapsedSections.documentos ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {!collapsedSections.documentos && (
              <div className="space-y-1">
                {navigation.filter(item => item.category === "documentos").map((item) => {
                  const isActive = isNavItemActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => handleLinkClick(item.href, item.name)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Seção Administrativa (apenas para admin) */}
          {isAdminFromPermissions() && (
            <div>
              <button
                onClick={() => toggleSection('admin')}
                className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-gray-700 transition-colors"
              >
                <span>Administração</span>
                {collapsedSections.admin ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {!collapsedSections.admin && (
                <div className="space-y-1">
                  {filteredAdminNavigation.map((item) => {
                    const isActive = isNavItemActive(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => handleLinkClick(item.href, item.name)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sair do Sistema
          </Button>
          
          {/* Controle de versão */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xs text-gray-500 font-medium">
                {APP_NAME}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Versão: {APP_VERSION_LABEL}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {APP_VERSION_DATE}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-4 ml-auto">
              <span className="text-sm text-gray-600 hidden md:block">{empresa.razao_social || empresa.nome}</span>
              <Suspense fallback={<div className="w-64 h-10 bg-gray-100 rounded-md animate-pulse" />}>
                <GlobalSearch />
              </Suspense>
              <Suspense fallback={<div className="w-10 h-10 flex items-center justify-center"><Bell className="w-5 h-5 text-gray-400" /></div>}>
                <NotificationsDropdown />
              </Suspense>
              <Suspense fallback={<div className="w-10 h-10 flex items-center justify-center"><User className="w-5 h-5 text-gray-400" /></div>}>
                <UserDropdown />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      
      {/* Chat de IA - Botão Flutuante */}
      <ChatIa floating={true} />
      
      {/* Global Loading */}
      <GlobalLoading show={isLoading} message={message} />
      </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <EmpresaProvider>
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </EmpresaProvider>
  )
}
