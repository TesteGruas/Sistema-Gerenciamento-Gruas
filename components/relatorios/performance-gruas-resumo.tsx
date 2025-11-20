"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Clock, BarChart3, Wrench } from "lucide-react"
import type { PerformanceGruasResponse } from "@/lib/mocks/performance-gruas-mocks"

interface PerformanceGruasResumoProps {
  resumo?: PerformanceGruasResponse['resumo_geral'] | null
}

export function PerformanceGruasResumo({ resumo }: PerformanceGruasResumoProps) {
  // Wrapper try-catch para capturar qualquer erro
  try {
    // Verificação inicial - se não houver resumo válido, retornar imediatamente
    const resumoValido = resumo && typeof resumo === 'object' && resumo !== null
    
    if (!resumoValido) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum dado de resumo disponível</p>
        </div>
      )
    }

    // Função helper para obter valor seguro de propriedade
    const getSafeValue = (obj: any, key: string, defaultValue: number = 0): number => {
      try {
        if (!obj || typeof obj !== 'object' || obj === null) return defaultValue
        if (!(key in obj)) return defaultValue
        const value = obj[key]
        return value !== undefined && value !== null ? Number(value) : defaultValue
      } catch {
        return defaultValue
      }
    }

    // Extrair propriedades com valores padrão seguros usando função helper
    // Usar resumo apenas após verificação acima - garantir que resumo não é undefined
    const resumoObj = resumoValido ? resumo : {}
    const totalGruas = getSafeValue(resumoObj, 'total_gruas', 0)
    const taxaUtilizacaoMedia = getSafeValue(resumoObj, 'taxa_utilizacao_media', 0)
    const totalHorasTrabalhadas = getSafeValue(resumoObj, 'total_horas_trabalhadas', 0)
    const totalHorasDisponiveis = getSafeValue(resumoObj, 'total_horas_disponiveis', 0)
    const receitaTotal = getSafeValue(resumoObj, 'receita_total', 0)
    const custoTotal = getSafeValue(resumoObj, 'custo_total', 0)
    const lucroTotal = getSafeValue(resumoObj, 'lucro_total', 0)
    const roiMedio = getSafeValue(resumoObj, 'roi_medio', 0)

    const cards = [
    {
      title: "Total de Gruas",
      value: totalGruas,
      icon: Wrench,
      color: "bg-blue-500",
      subtitle: "Analisadas no período"
    },
    {
      title: "Taxa de Utilização Média",
      value: `${taxaUtilizacaoMedia.toFixed(1)}%`,
      icon: BarChart3,
      color: taxaUtilizacaoMedia >= 80 ? "bg-green-500" : taxaUtilizacaoMedia >= 60 ? "bg-yellow-500" : "bg-red-500",
      subtitle: `${totalHorasTrabalhadas.toLocaleString('pt-BR')}h trabalhadas`
    },
    {
      title: "Receita Total",
      value: `R$ ${receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "bg-green-500",
      subtitle: "Período selecionado"
    },
    {
      title: "Custo Total",
      value: `R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "bg-orange-500",
      subtitle: "Operação + Manutenção"
    },
    {
      title: "Lucro Total",
      value: `R$ ${lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: lucroTotal >= 0 ? TrendingUp : TrendingDown,
      color: lucroTotal >= 0 ? "bg-green-500" : "bg-red-500",
      subtitle: `Margem: ${receitaTotal > 0 ? ((lucroTotal / receitaTotal) * 100).toFixed(1) : '0.0'}%`
    },
    {
      title: "ROI Médio",
      value: `${roiMedio.toFixed(1)}%`,
      icon: BarChart3,
      color: roiMedio >= 50 ? "bg-green-500" : roiMedio >= 20 ? "bg-yellow-500" : "bg-red-500",
      subtitle: "Retorno sobre investimento"
    },
    {
      title: "Horas Trabalhadas",
      value: totalHorasTrabalhadas.toLocaleString('pt-BR'),
      icon: Clock,
      color: "bg-purple-500",
      subtitle: `${totalHorasDisponiveis.toLocaleString('pt-BR')}h disponíveis`
    },
    {
      title: "Horas Ociosas",
      value: (totalHorasDisponiveis - totalHorasTrabalhadas).toLocaleString('pt-BR'),
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
  } catch (error) {
    console.error('Erro ao renderizar PerformanceGruasResumo:', error)
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Erro ao carregar dados de resumo</p>
      </div>
    )
  }
}

