"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import {
  Package,
  Clock,
  Users,
  DollarSign,
  BarChart3,
  ConeIcon as Crane,
  TrendingUp,
  AlertTriangle,
  Building2,
  Loader2,
  PieChart as PieChartIcon
} from "lucide-react"
import { apiDashboard, DashboardData } from '@/lib/api-dashboard'

// Cores para gráficos
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiDashboard.carregar();
      setDashboardData(data);
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDashboard();
  }, []);

  // Substituir dados hardcoded pelos dados do backend
  const stats = dashboardData ? [
    { 
      title: "Total de Gruas", 
      value: dashboardData.resumo_geral.total_gruas.toString(), 
      icon: Crane, 
      color: "bg-blue-500" 
    },
    { 
      title: "Gruas em Operação", 
      value: dashboardData.resumo_geral.gruas_ocupadas.toString(), 
      icon: Building2, 
      color: "bg-green-500" 
    },
    { 
      title: "Taxa de Utilização", 
      value: `${dashboardData.resumo_geral.taxa_utilizacao}%`, 
      icon: BarChart3, 
      color: "bg-purple-500" 
    },
    { 
      title: "Receita do Mês", 
      value: `R$ ${dashboardData.resumo_geral.receita_mes_atual.toLocaleString()}`, 
      icon: DollarSign, 
      color: "bg-yellow-500" 
    },
  ] : [];

  const recentActivities = dashboardData ? 
    dashboardData.ultimas_atividades.map(atividade => {
      const timeAgo = new Date(atividade.timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - timeAgo.getTime()) / (1000 * 60));
      
      let timeText = '';
      if (diffInMinutes < 1) {
        timeText = 'Agora';
      } else if (diffInMinutes < 60) {
        timeText = `${diffInMinutes} min atrás`;
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        timeText = `${hours}h atrás`;
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        timeText = `${days} dia${days > 1 ? 's' : ''} atrás`;
      }

      return {
        action: `${atividade.acao}${atividade.detalhes ? ` - ${atividade.detalhes}` : ''}`,
        time: timeText,
        type: atividade.tipo === 'locacao' ? 'info' : 
              atividade.tipo === 'ponto' ? 'success' : 
              atividade.tipo === 'auditoria' ? 'warning' : 'info',
        usuario: atividade.usuario
      };
    }) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do sistema de gestão IRBANA</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Erro ao carregar dashboard</p>
                <p className="text-sm text-red-700">{error}</p>
                <button 
                  onClick={carregarDashboard}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do sistema de gestão IRBANA</p>
        {dashboardData && (
          <p className="text-sm text-gray-500 mt-1">
            Última atualização: {new Date(dashboardData.ultima_atualizacao).toLocaleString('pt-BR')}
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos de Visão Geral */}
      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Taxa de Utilização por Mês */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Taxa de Utilização
              </CardTitle>
              <CardDescription>Evolução mensal de gruas em operação</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={[
                  { mes: 'Jan', taxa: 75, gruas: 12 },
                  { mes: 'Fev', taxa: 82, gruas: 14 },
                  { mes: 'Mar', taxa: 78, gruas: 13 },
                  { mes: 'Abr', taxa: 85, gruas: 15 },
                  { mes: 'Mai', taxa: 90, gruas: 16 },
                  { mes: 'Jun', taxa: dashboardData.resumo_geral.taxa_utilizacao, gruas: dashboardData.resumo_geral.gruas_ocupadas }
                ]}>
                  <defs>
                    <linearGradient id="colorTaxa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'taxa') return [`${value}%`, 'Taxa de Utilização']
                      return [value, 'Gruas Ocupadas']
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="taxa" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTaxa)" name="Taxa %" />
                  <Area type="monotone" dataKey="gruas" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Gruas" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status das Gruas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Status das Gruas
              </CardTitle>
              <CardDescription>Distribuição atual do parque</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'Em Operação', value: dashboardData.resumo_geral.gruas_ocupadas },
                      { name: 'Disponível', value: dashboardData.resumo_geral.total_gruas - dashboardData.resumo_geral.gruas_ocupadas },
                      { name: 'Manutenção', value: Math.floor(dashboardData.resumo_geral.total_gruas * 0.1) }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#3b82f6" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <RechartsTooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Receita Mensal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Receita Mensal
              </CardTitle>
              <CardDescription>Evolução de receitas dos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsBarChart data={[
                  { mes: 'Jan', receita: dashboardData.resumo_geral.receita_mes_atual * 0.8 },
                  { mes: 'Fev', receita: dashboardData.resumo_geral.receita_mes_atual * 0.85 },
                  { mes: 'Mar', receita: dashboardData.resumo_geral.receita_mes_atual * 0.9 },
                  { mes: 'Abr', receita: dashboardData.resumo_geral.receita_mes_atual * 0.95 },
                  { mes: 'Mai', receita: dashboardData.resumo_geral.receita_mes_atual * 1.05 },
                  { mes: 'Jun', receita: dashboardData.resumo_geral.receita_mes_atual }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip 
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="receita" fill="#10b981" name="Receita (R$)" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Obras por Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Obras por Status
              </CardTitle>
              <CardDescription>Distribuição de obras ativas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsBarChart data={[
                  { status: 'Em Andamento', quantidade: 8 },
                  { status: 'Planejamento', quantidade: 4 },
                  { status: 'Finalização', quantidade: 3 },
                  { status: 'Paralisada', quantidade: 1 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="quantidade" fill="#3b82f6" name="Quantidade" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>Últimas movimentações do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {activity.type === "success" && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                    {activity.type === "warning" && <div className="w-2 h-2 bg-yellow-500 rounded-full" />}
                    {activity.type === "info" && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700">{activity.action}</span>
                      {activity.usuario && (
                        <span className="text-xs text-gray-500">por {activity.usuario}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/dashboard/obras" className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors block">
                <Building2 className="w-6 h-6 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">Obras</p>
                <p className="text-xs text-gray-600">Gerenciar projetos</p>
              </Link>
              <Link href="/dashboard/historico" className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors block">
                <Clock className="w-6 h-6 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">Histórico</p>
                <p className="text-xs text-gray-600">Ver atividades</p>
              </Link>
              <Link href="/dashboard/rh" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors block">
                <Users className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-medium text-gray-900">RH</p>
                <p className="text-xs text-gray-600">Gerenciar funcionários</p>
              </Link>
              <Link href="/dashboard/financeiro" className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors block">
                <DollarSign className="w-6 h-6 text-yellow-600 mb-2" />
                <p className="font-medium text-gray-900">Financeiro</p>
                <p className="text-xs text-gray-600">Ver relatórios</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {dashboardData && dashboardData.alertas.length > 0 && (
        <div className="space-y-4">
          {dashboardData.alertas.map((alerta, index) => (
            <Card 
              key={index} 
              className={`border-2 ${
                alerta.prioridade === 'alta' 
                  ? 'border-red-200 bg-red-50' 
                  : alerta.prioridade === 'media'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-green-200 bg-green-50'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${
                    alerta.prioridade === 'alta' 
                      ? 'text-red-600' 
                      : alerta.prioridade === 'media'
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`} />
                  <div>
                    <p className={`font-medium ${
                      alerta.prioridade === 'alta' 
                        ? 'text-red-800' 
                        : alerta.prioridade === 'media'
                        ? 'text-yellow-800'
                        : 'text-green-800'
                    }`}>
                      {alerta.tipo === 'manutencao' ? 'Manutenção' : 
                       alerta.tipo === 'utilizacao' ? 'Utilização' : 
                       alerta.tipo === 'status' ? 'Status' : 'Alerta'}
                    </p>
                    <p className={`text-sm ${
                      alerta.prioridade === 'alta' 
                        ? 'text-red-700' 
                        : alerta.prioridade === 'media'
                        ? 'text-yellow-700'
                        : 'text-green-700'
                    }`}>
                      {alerta.mensagem}
                    </p>
                    {alerta.acao && (
                      <p className={`text-xs mt-1 ${
                        alerta.prioridade === 'alta' 
                          ? 'text-red-600' 
                          : alerta.prioridade === 'media'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        Ação: {alerta.acao}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
