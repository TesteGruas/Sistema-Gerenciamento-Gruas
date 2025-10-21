"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { usePermissions } from "@/hooks/use-permissions"
import { DebugPermissions } from "@/components/debug-permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign,
  BarChart3,
  Clock,
  Package,
  BookOpen,
  FileSignature,
  UserCheck,
  History,
  Bell
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

const COLORS = [ '#ef4444', '#8b5cf6', '#ec4899']

export default function Dashboard() {
  // Todos os hooks devem ser chamados no topo
  const { 
    permissions, 
    perfil, 
    loading: permissionsLoading,
    canAccessDashboard,
    canAccessPontoEletronico,
    canAccessFinanceiro,
    canAccessRH,
    canAccessObras,
    canAccessClientes,
    canAccessRelatorios
  } = usePermissions()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        // Simular carregamento de dados
        await new Promise(resolve => setTimeout(resolve, 1000))
        setDashboardData({
          totalObras: 12,
          totalClientes: 45,
          totalGruas: 8,
          totalFuncionarios: 156
        })
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute permission="dashboard:visualizar" showAccessDenied={true}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do sistema de gestão de gruas</p>
        </div>

        {/* Debug - Sistema de Permissões */}
        <DebugPermissions />

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Obras Ativas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalObras || 0}</div>
              <p className="text-xs text-muted-foreground">
                +2 desde o mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalClientes || 0}</div>
              <p className="text-xs text-muted-foreground">
                +5 desde o mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gruas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalGruas || 0}</div>
              <p className="text-xs text-muted-foreground">
                +1 desde o mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.totalFuncionarios || 0}</div>
              <p className="text-xs text-muted-foreground">
                +3 desde o mês passado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {canAccessObras() && (
                <Link href="/dashboard/obras" className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors block">
                  <Building2 className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="font-medium text-gray-900">Obras</p>
                  <p className="text-xs text-gray-600">Gerenciar projetos</p>
                </Link>
              )}

              {canAccessObras() && (
                <Link href="/dashboard/gruas" className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors block">
                  <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
                  <p className="font-medium text-gray-900">Gruas</p>
                  <p className="text-xs text-gray-600">Gerenciar equipamentos</p>
                </Link>
              )}

              {canAccessClientes() && (
                <Link href="/dashboard/clientes" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors block">
                  <Users className="w-6 h-6 text-purple-600 mb-2" />
                  <p className="font-medium text-gray-900">Clientes</p>
                  <p className="text-xs text-gray-600">Gerenciar clientes</p>
                </Link>
              )}

              {canAccessFinanceiro() && (
                <Link href="/dashboard/financeiro" className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors block">
                  <DollarSign className="w-6 h-6 text-yellow-600 mb-2" />
                  <p className="font-medium text-gray-900">Financeiro</p>
                  <p className="text-xs text-gray-600">Ver relatórios</p>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Módulos do Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {canAccessPontoEletronico() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Ponto Eletrônico
                </CardTitle>
                <CardDescription>Controle de frequência dos funcionários</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/ponto">
                  <Button className="w-full">Acessar</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {canAccessRH() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-green-600" />
                  Recursos Humanos
                </CardTitle>
                <CardDescription>Gestão de funcionários e RH</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/rh">
                  <Button className="w-full">Acessar</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {canAccessObras() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  Estoque
                </CardTitle>
                <CardDescription>Controle de estoque e materiais</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/estoque">
                  <Button className="w-full">Acessar</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Livros de Gruas
              </CardTitle>
              <CardDescription>Registros e documentação das gruas</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/livros-gruas">
                <Button className="w-full">Acessar</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-indigo-600" />
                Assinatura Digital
              </CardTitle>
              <CardDescription>Documentos e assinaturas digitais</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/assinatura">
                <Button className="w-full">Acessar</Button>
              </Link>
            </CardContent>
          </Card>

          {canAccessRelatorios() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-red-600" />
                  Relatórios
                </CardTitle>
                <CardDescription>Relatórios e análises do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/relatorios">
                  <Button className="w-full">Acessar</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}