"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AuthService } from "@/app/lib/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Package,
  Clock,
  Users,
  FileSignature,
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
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { UserDropdown } from "@/components/user-dropdown"
import { GlobalLoading, useGlobalLoading } from "@/components/global-loading"
import { GlobalSearch } from "@/components/global-search"
import { PermissionsDebug } from "@/components/permissions-debug"

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
  { name: "Notificações", href: "/dashboard/notificacoes", icon: Bell, category: "principal", permission: "notificacoes:visualizar" },
  
  // SEÇÃO OPERACIONAL
  { name: "Clientes", href: "/dashboard/clientes", icon: Users, category: "operacional", permission: "clientes:visualizar" },
  { name: "Obras", href: "/dashboard/obras", icon: Building2, category: "operacional", permission: "obras:visualizar" },
  { name: "Controle de Gruas", href: "/dashboard/gruas", icon: Crane, category: "operacional", permission: "gruas:visualizar" },
  { name: "Livros de Gruas", href: "/dashboard/livros-gruas", icon: BookOpen, category: "operacional", permission: "livros_gruas:visualizar" },
  { name: "Estoque", href: "/dashboard/estoque", icon: Package, category: "operacional", permission: "estoque:visualizar" },
  
  // SEÇÃO RH E PESSOAS
  { name: "Ponto Eletrônico", href: "/dashboard/ponto", icon: Clock, category: "rh", permission: "ponto_eletronico:visualizar" },
  { name: "RH", href: "/dashboard/rh", icon: UserCheck, category: "rh", permission: "rh:visualizar" },
  
  // SEÇÃO FINANCEIRA
  { name: "Financeiro", href: "/dashboard/financeiro", icon: DollarSign, category: "financeiro", permission: "financeiro:visualizar" },
  
  // SEÇÃO RELATÓRIOS E ANÁLISES
  { name: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3, category: "relatorios", permission: "relatorios:visualizar" },
  { name: "Histórico", href: "/dashboard/historico", icon: History, category: "relatorios", permission: "historico:visualizar" },
  
  // SEÇÃO DOCUMENTOS
  { name: "Assinatura Digital", href: "/dashboard/assinatura", icon: FileSignature, category: "documentos", permission: "assinatura_digital:visualizar" },
]

const adminNavigation: NavigationItemWithPermission[] = [
  { name: "Usuários", href: "/dashboard/usuarios", icon: Shield, category: "admin", permission: "usuarios:visualizar" },
  { name: "Perfis de Acesso", href: "/dashboard/perfis", icon: Shield, category: "admin", permission: "usuarios:visualizar" },
  { name: "Permissões", href: "/dashboard/permissoes", icon: Lock, category: "admin", permission: "usuarios:gerenciar_permissoes" },
  { name: "Configurações de Email", href: "/dashboard/configuracoes/email", icon: Mail, category: "admin", permission: "email:configurar" },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Todos os hooks devem ser chamados no topo, antes de qualquer lógica condicional
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin: isAdminFromPermissions, perfil, loading: permissionsLoading } = usePermissions()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    principal: false,
    operacional: false,
    rh: false,
    financeiro: false,
    relatorios: false,
    documentos: false,
    admin: false,
  })
  
  // Todos os useEffect devem estar no topo também
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Renderizar apenas no cliente para evitar erros de SSR
  if (!isClient) {
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

  // Filtrar navegação baseada em permissões
  const filterNavigationByPermissions = (navigation: NavigationItemWithPermission[]) => {
    return navigation.filter(item => {
      if (!item.permission && !item.permissions) return true
      
      if (item.permission) {
        return hasPermission(item.permission)
      }
      
      if (item.permissions) {
        return item.requireAll 
          ? hasAllPermissions(item.permissions)
          : hasAnyPermission(item.permissions)
      }
      
      return true
    })
  }

  // Navegação filtrada por permissões
  const filteredBaseNavigation = filterNavigationByPermissions(baseNavigation)
  const filteredAdminNavigation = filterNavigationByPermissions(adminNavigation)

  const handleLogout = () => {
    AuthService.logout()
  }

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Combinar navegação base com navegação de admin se necessário
  const navigation = isAdminFromPermissions() ? [...filteredBaseNavigation, ...filteredAdminNavigation] : filteredBaseNavigation

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
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">IRBANA</span>
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
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
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
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
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

          {/* Seção RH e Pessoas */}
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
                {navigation.filter(item => item.category === "rh").map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
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

          {/* Seção Financeira */}
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
                {navigation.filter(item => item.category === "financeiro").map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
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
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
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
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
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
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
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
          {/* Debug info */}
          <div className="mb-2 p-2 bg-gray-100 rounded text-xs">
            <div>Perfil: {perfil?.nome || 'Carregando...'}</div>
            <div>Admin: {isAdminFromPermissions() ? 'Sim' : 'Não'}</div>
            <div>Permissões: {permissionsLoading ? 'Carregando...' : 'Carregadas'}</div>
          </div>
          
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
                Sistema de Gerenciamento de Gruas
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Versão: 1.1.0
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
              <span className="text-sm text-gray-600 hidden md:block">IRBANA COPAS SERVIÇOS DE MANUTENÇÃO E MONTAGEM LTDA</span>
              <GlobalSearch />
              <NotificationsDropdown />
              <UserDropdown />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
      
      {/* Global Loading */}
      <GlobalLoading show={false} />
      
      {/* Debug de Permissões */}
      <PermissionsDebug />
    </div>
  )
}
