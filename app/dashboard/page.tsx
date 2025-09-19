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
  Building2,
} from "lucide-react"

export default function Dashboard() {
  const stats = [
    { title: "Obras Ativas", value: "3", icon: Building2, color: "bg-blue-500" },
    { title: "Gruas em Operação", value: "2", icon: Crane, color: "bg-green-500" },
    { title: "Funcionários", value: "5", icon: Users, color: "bg-purple-500" },
    { title: "Total de Custos", value: "R$ 420.000", icon: DollarSign, color: "bg-yellow-500" },
  ]

  const recentActivities = [
    { action: "Grua 002 - Falha hidráulica identificada", time: "2 horas atrás", type: "warning" },
    { action: "Checklist diário - Grua 001 OK", time: "4 horas atrás", type: "success" },
    { action: "Documento assinado: Contrato Principal", time: "6 horas atrás", type: "success" },
    { action: "Novo custo registrado: R$ 25.000", time: "1 dia atrás", type: "info" },
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
                <Building2 className="w-6 h-6 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">Nova Obra</p>
                <p className="text-xs text-gray-600">Criar projeto</p>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
                <Clock className="w-6 h-6 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">Histórico</p>
                <p className="text-xs text-gray-600">Registrar checklist</p>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
                <Users className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-medium text-gray-900">RH</p>
                <p className="text-xs text-gray-600">Gerenciar usuários</p>
              </button>
              <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors">
                <DollarSign className="w-6 h-6 text-yellow-600 mb-2" />
                <p className="font-medium text-gray-900">Financeiro</p>
                <p className="text-xs text-gray-600">Ver custos</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Falha identificada</p>
              <p className="text-sm text-red-700">Grua 002 - Falha no sistema hidráulico. Notificação enviada para o responsável.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
