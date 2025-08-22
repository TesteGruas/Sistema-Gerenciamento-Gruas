"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  Clock,
  Users,
  DollarSign,
  BarChart3,
  ConeIcon as Crane,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"

export default function Dashboard() {
  const stats = [
    { title: "Gruas Ativas", value: "12", icon: Crane, color: "bg-blue-500" },
    { title: "Itens em Estoque", value: "1,247", icon: Package, color: "bg-green-500" },
    { title: "Funcionários", value: "45", icon: Users, color: "bg-purple-500" },
    { title: "Receita Mensal", value: "R$ 125.400", icon: DollarSign, color: "bg-yellow-500" },
  ]

  const recentActivities = [
    { action: "Grua #007 - Manutenção concluída", time: "2 horas atrás", type: "success" },
    { action: "Novo funcionário cadastrado: João Silva", time: "4 horas atrás", type: "info" },
    { action: "Estoque baixo: Cabos de aço", time: "6 horas atrás", type: "warning" },
    { action: "Pagamento recebido: R$ 15.000", time: "1 dia atrás", type: "success" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do sistema de gestão IRBANA</p>
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
                    <span className="text-sm text-gray-700">{activity.action}</span>
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
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
                <Crane className="w-6 h-6 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">Nova Grua</p>
                <p className="text-xs text-gray-600">Cadastrar equipamento</p>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
                <Package className="w-6 h-6 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">Estoque</p>
                <p className="text-xs text-gray-600">Gerenciar itens</p>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
                <Clock className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-medium text-gray-900">Ponto</p>
                <p className="text-xs text-gray-600">Registrar ponto</p>
              </button>
              <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors">
                <DollarSign className="w-6 h-6 text-yellow-600 mb-2" />
                <p className="font-medium text-gray-900">Financeiro</p>
                <p className="text-xs text-gray-600">Ver relatórios</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Atenção necessária</p>
              <p className="text-sm text-yellow-700">3 gruas precisam de manutenção preventiva nos próximos 7 dias</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
