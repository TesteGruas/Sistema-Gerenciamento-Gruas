"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Clock, 
  Building2, 
  DollarSign, 
  Gift, 
  FileText, 
  History, 
  Calculator,
  TrendingUp,
  BarChart3,
  PieChart,
  Download,
  Settings
} from "lucide-react"

export default function RHCompletoPage() {
  const modules = [
    {
      title: "Relatórios RH",
      description: "Geração e visualização de relatórios",
      icon: FileText,
      href: "/dashboard/rh-completo/relatorios",
      color: "bg-blue-500",
      stats: "15 relatórios gerados"
    },
    {
      title: "Histórico",
      description: "Histórico completo de eventos",
      icon: History,
      href: "/dashboard/rh-completo/historico",
      color: "bg-green-500",
      stats: "25 eventos registrados"
    },
    {
      title: "Ponto Eletrônico",
      description: "Controle de frequência",
      icon: Clock,
      href: "/dashboard/rh-completo/ponto",
      color: "bg-orange-500",
      stats: "160h trabalhadas"
    },
    {
      title: "Horas Trabalhadas",
      description: "Cálculo de horas por funcionário",
      icon: Calculator,
      href: "/dashboard/rh-completo/horas",
      color: "bg-purple-500",
      stats: "2.000h totais"
    },
    {
      title: "Obras e Alocações",
      description: "Gestão de funcionários em obras",
      icon: Building2,
      href: "/dashboard/rh-completo/obras",
      color: "bg-yellow-500",
      stats: "3 obras ativas"
    },
    {
      title: "Remuneração",
      description: "Salários, descontos e benefícios",
      icon: DollarSign,
      href: "/dashboard/rh-completo/remuneracao",
      color: "bg-emerald-500",
      stats: "R$ 125.000 total"
    },
    {
      title: "Vales e Benefícios",
      description: "Gestão de vales e benefícios",
      icon: Gift,
      href: "/dashboard/rh-completo/vales",
      color: "bg-pink-500",
      stats: "8 benefícios ativos"
    }
  ]

  const quickActions = [
    {
      title: "Calcular Salários",
      description: "Calcular salários do mês",
      icon: Calculator,
      href: "/dashboard/rh-completo/remuneracao",
      color: "bg-blue-100 text-blue-800"
    },
    {
      title: "Gerar Relatório",
      description: "Gerar relatório completo",
      icon: FileText,
      href: "/dashboard/rh-completo/relatorios",
      color: "bg-green-100 text-green-800"
    },
    {
      title: "Ver Pontos",
      description: "Visualizar pontos do dia",
      icon: Clock,
      href: "/dashboard/rh-completo/ponto",
      color: "bg-orange-100 text-orange-800"
    },
    {
      title: "Alocar Funcionário",
      description: "Alocar em obra",
      icon: Building2,
      href: "/dashboard/rh-completo/obras",
      color: "bg-yellow-100 text-yellow-800"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">RH Completo</h1>
          <p className="text-gray-600">Módulo completo de gestão de recursos humanos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Tudo
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Funcionários</p>
                <p className="text-2xl font-bold text-gray-900">25</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horas Trabalhadas</p>
                <p className="text-2xl font-bold text-gray-900">2.000h</p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Obras Ativas</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
              <div className="p-3 rounded-full bg-orange-500">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Salários</p>
                <p className="text-2xl font-bold text-gray-900">R$ 125.000</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>Acesso rápido às funcionalidades mais utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => window.location.href = action.href}
              >
                <action.icon className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-gray-500">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Módulos do RH */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Módulos do RH</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => window.location.href = module.href}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${module.color}`}>
                    <module.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{module.title}</div>
                    <div className="text-sm text-gray-500">{module.stats}</div>
                  </div>
                </CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Acessar Módulo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Gráficos e Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Resumo Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Gráficos serão implementados em breve</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Distribuição de Funcionários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Gráficos serão implementados em breve</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}