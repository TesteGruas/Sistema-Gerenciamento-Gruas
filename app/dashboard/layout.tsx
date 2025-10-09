"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AuthService } from "@/app/lib/auth"
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
  Menu,
  X,
  LogOut,
  Home,
  Shield,
  UserCheck,
  History,
  Bell,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NotificationsDropdown } from "@/components/notifications-dropdown"

const baseNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Notificações", href: "/dashboard/notificacoes", icon: Bell },
  { name: "Clientes", href: "/dashboard/clientes", icon: Users },
  { name: "Obras", href: "/dashboard/obras", icon: Building2 },
  { name: "Controle de Gruas", href: "/dashboard/gruas", icon: Crane },
  { name: "Estoque", href: "/dashboard/estoque", icon: Package },
  { name: "Ponto Eletrônico", href: "/dashboard/ponto", icon: Clock },
  { name: "RH", href: "/dashboard/rh", icon: UserCheck },
  { name: "Histórico", href: "/dashboard/historico", icon: History },
  { name: "Assinatura Digital", href: "/dashboard/assinatura", icon: FileSignature },
  { name: "Financeiro", href: "/dashboard/financeiro", icon: DollarSign },
  { name: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3 },
]

const adminNavigation = [
  { name: "Usuários", href: "/dashboard/usuarios", icon: Shield },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()
  
  useEffect(() => {
    console.log('Layout carregado')
  }, [])

  useEffect(() => {
    // Verificar se o usuário é admin
    const userRole = localStorage.getItem('userRole') || 'funcionario_nivel_1'
    console.log('User role from localStorage:', userRole)
    console.log('Is admin:', userRole === 'admin')
    setIsAdmin(userRole === 'admin')
    
    // Para teste: forçar como admin se não estiver definido
    if (!localStorage.getItem('userRole')) {
      localStorage.setItem('userRole', 'admin')
      setIsAdmin(true)
      console.log('Forçando usuário como admin para teste')
    }
  }, [])

  const handleLogout = () => {
    AuthService.logout()
  }

  // Combinar navegação base com navegação de admin se necessário
  const navigation = isAdmin ? [...baseNavigation, ...adminNavigation] : baseNavigation

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

        <nav className="flex-1 px-4 py-6 space-y-2">
          
          {navigation.map((item) => {
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
        </nav>

        <div className="p-4 border-t border-gray-200">
          {/* Botão temporário para forçar admin - remover depois */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mb-2 text-xs"
            onClick={() => {
              localStorage.setItem('userRole', 'admin')
              setIsAdmin(true)
              console.log('Forçando admin via botão')
            }}
          >
            🔧 Forçar Admin (Teste)
          </Button>
          
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
              <NotificationsDropdown />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
