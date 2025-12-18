"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { usePermissions } from "@/hooks/use-permissions"
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
import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { obrasApi } from "@/lib/api-obras"
import { clientesApi } from "@/lib/api-clientes"
import { gruasApi } from "@/lib/api-gruas"
import { funcionariosApi } from "@/lib/api-funcionarios"

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

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
    canAccessRelatorios,
    isOperator
  } = usePermissions()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Redirecionar Operários para o PWA - não devem ter acesso ao dashboard web
  useEffect(() => {
    if (!permissionsLoading && isOperator()) {
      window.location.href = '/pwa'
      return
    }
  }, [permissionsLoading, isOperator])
  
  // Não renderizar nada se for Operário (enquanto redireciona)
  if (!permissionsLoading && isOperator()) {
    return null
  }

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        // Buscar dados reais das APIs
        const [obrasResponse, clientesResponse, gruasResponse, funcionariosResponse] = await Promise.all([
          obrasApi.listarObras({ limit: 1000 }).catch(() => ({ success: false, data: [] })),
          clientesApi.listarClientes({ limit: 1000 }).catch(() => ({ success: false, data: [] })),
          gruasApi.listarGruas({ limit: 1000 }).catch(() => ({ success: false, data: [] })),
          funcionariosApi.listarFuncionarios({ limit: 1000 }).catch(() => ({ success: false, data: [] }))
        ])

        const obras = obrasResponse?.success && obrasResponse?.data ? (Array.isArray(obrasResponse.data) ? obrasResponse.data : []) : []
        const clientes = clientesResponse?.success && clientesResponse?.data ? (Array.isArray(clientesResponse.data) ? clientesResponse.data : []) : []
        const gruas = gruasResponse?.success && gruasResponse?.data ? (Array.isArray(gruasResponse.data) ? gruasResponse.data : []) : []
        const funcionarios = funcionariosResponse?.success && funcionariosResponse?.data ? (Array.isArray(funcionariosResponse.data) ? funcionariosResponse.data : []) : []

        // Processar dados para gráficos
        const obrasPorStatus = obras.reduce((acc: any, obra: any) => {
          const status = obra.status || 'Sem Status'
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {})

        const gruasPorTipo = gruas.reduce((acc: any, grua: any) => {
          const tipo = grua.tipo || 'Sem Tipo'
          acc[tipo] = (acc[tipo] || 0) + 1
          return acc
        }, {})

        // Buscar dados reais de evolução mensal da API
        let meses = []
        try {
          const { apiDashboard } = await import('@/lib/api-dashboard')
          const evolucaoResponse = await apiDashboard.buscarEvolucaoMensal(6)
          if (evolucaoResponse.success && evolucaoResponse.data) {
            meses = evolucaoResponse.data.map(item => ({
              mes: item.mes,
              obras: item.obras,
              clientes: item.clientes,
              gruas: item.gruas
            }))
          }
        } catch (error) {
          console.warn('Erro ao carregar evolução mensal, usando valores proporcionais:', error)
          // Fallback para valores proporcionais
          const hoje = new Date()
          for (let i = 5; i >= 0; i--) {
            const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
            const mesAno = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
            const progresso = (5 - i) / 5
            meses.push({
              mes: mesAno,
              obras: Math.max(0, Math.floor(obras.length * (0.5 + progresso * 0.5))),
              clientes: Math.max(0, Math.floor(clientes.length * (0.6 + progresso * 0.4))),
              gruas: Math.max(0, Math.floor(gruas.length * (0.7 + progresso * 0.3)))
            })
          }
        }

        setDashboardData({
          totalObras: obras.length,
          totalClientes: clientes.length,
          totalGruas: gruas.length,
          totalFuncionarios: funcionarios.length,
          obrasPorStatus,
          gruasPorTipo,
          evolucaoMensal: meses
        })
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error)
        // Dados de fallback
        setDashboardData({
          totalObras: 0,
          totalClientes: 0,
          totalGruas: 0,
          totalFuncionarios: 0,
          obrasPorStatus: {},
          gruasPorTipo: {},
          evolucaoMensal: []
        })
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

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Evolução Mensal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolução dos Últimos 6 Meses
              </CardTitle>
              <CardDescription>Crescimento de obras, clientes e gruas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData?.evolucaoMensal || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="obras" stroke="#3b82f6" strokeWidth={2} name="Obras" />
                  <Line type="monotone" dataKey="clientes" stroke="#10b981" strokeWidth={2} name="Clientes" />
                  <Line type="monotone" dataKey="gruas" stroke="#f59e0b" strokeWidth={2} name="Gruas" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Obras por Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Distribuição de Obras por Status
              </CardTitle>
              <CardDescription>Status atual das obras no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(dashboardData?.obrasPorStatus || {}).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(dashboardData?.obrasPorStatus || {}).map(([name, value]) => ({ name, value: value as number }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(dashboardData?.obrasPorStatus || {}).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Gruas por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Distribuição de Gruas por Tipo
              </CardTitle>
              <CardDescription>Quantidade de gruas por tipo</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(dashboardData?.gruasPorTipo || {}).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(dashboardData?.gruasPorTipo || {}).map(([name, value]) => ({ name, quantidade: value as number }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Área - Atividade Mensal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Atividade Mensal
              </CardTitle>
              <CardDescription>Evolução da atividade ao longo dos meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData?.evolucaoMensal || []}>
                  <defs>
                    <linearGradient id="colorObras" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="obras" stroke="#3b82f6" fillOpacity={1} fill="url(#colorObras)" name="Obras" />
                  <Area type="monotone" dataKey="clientes" stroke="#10b981" fillOpacity={1} fill="url(#colorClientes)" name="Clientes" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

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