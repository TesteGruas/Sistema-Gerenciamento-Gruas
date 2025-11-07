"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Clock, BarChart3, Wrench } from "lucide-react"
import type { PerformanceGruasResponse } from "@/lib/mocks/performance-gruas-mocks"

interface PerformanceGruasResumoProps {
  resumo: PerformanceGruasResponse['resumo_geral']
}

export function PerformanceGruasResumo({ resumo }: PerformanceGruasResumoProps) {
  const cards = [
    {
      title: "Total de Gruas",
      value: resumo.total_gruas,
      icon: Wrench,
      color: "bg-blue-500",
      subtitle: "Analisadas no período"
    },
    {
      title: "Taxa de Utilização Média",
      value: `${resumo.taxa_utilizacao_media.toFixed(1)}%`,
      icon: BarChart3,
      color: resumo.taxa_utilizacao_media >= 80 ? "bg-green-500" : resumo.taxa_utilizacao_media >= 60 ? "bg-yellow-500" : "bg-red-500",
      subtitle: `${resumo.total_horas_trabalhadas.toLocaleString('pt-BR')}h trabalhadas`
    },
    {
      title: "Receita Total",
      value: `R$ ${resumo.receita_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "bg-green-500",
      subtitle: "Período selecionado"
    },
    {
      title: "Custo Total",
      value: `R$ ${resumo.custo_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "bg-orange-500",
      subtitle: "Operação + Manutenção"
    },
    {
      title: "Lucro Total",
      value: `R$ ${resumo.lucro_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: resumo.lucro_total >= 0 ? TrendingUp : TrendingDown,
      color: resumo.lucro_total >= 0 ? "bg-green-500" : "bg-red-500",
      subtitle: `Margem: ${((resumo.lucro_total / resumo.receita_total) * 100).toFixed(1)}%`
    },
    {
      title: "ROI Médio",
      value: `${resumo.roi_medio.toFixed(1)}%`,
      icon: BarChart3,
      color: resumo.roi_medio >= 50 ? "bg-green-500" : resumo.roi_medio >= 20 ? "bg-yellow-500" : "bg-red-500",
      subtitle: "Retorno sobre investimento"
    },
    {
      title: "Horas Trabalhadas",
      value: resumo.total_horas_trabalhadas.toLocaleString('pt-BR'),
      icon: Clock,
      color: "bg-purple-500",
      subtitle: `${resumo.total_horas_disponiveis.toLocaleString('pt-BR')}h disponíveis`
    },
    {
      title: "Horas Ociosas",
      value: (resumo.total_horas_disponiveis - resumo.total_horas_trabalhadas).toLocaleString('pt-BR'),
      icon: Clock,
      color: "bg-gray-500",
      subtitle: "Tempo não utilizado"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
              </div>
              <div className={`p-3 rounded-full ${card.color}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

