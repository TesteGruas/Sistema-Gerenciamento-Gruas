/**
 * Dados mockados para o Relatório de Performance de Gruas
 * Usado quando a API não está disponível ou para desenvolvimento
 */

export interface GruaPerformance {
  grua: {
    id: number
    nome: string
    modelo: string
    fabricante: string
    tipo: string
    status: string
    numero_serie?: string
  }
  metricas: {
    horas_trabalhadas: number
    horas_disponiveis: number
    horas_ociosas: number
    taxa_utilizacao: number
    dias_em_operacao: number
    dias_total_periodo: number
  }
  financeiro: {
    receita_total: number
    custo_operacao: number
    custo_manutencao: number
    custo_total: number
    lucro_bruto: number
    margem_lucro: number
    receita_por_hora: number
    custo_por_hora: number
    lucro_por_hora: number
  }
  roi: {
    investimento_inicial: number
    receita_acumulada: number
    custo_acumulado: number
    roi_percentual: number
    tempo_retorno_meses: number
  }
  obras: {
    total_obras: number
    obras_visitadas: Array<{
      obra_id: number
      obra_nome: string
      dias_permanencia: number
      receita_gerada: number
    }>
  }
  comparativo_periodo_anterior?: {
    horas_trabalhadas_variacao: number
    receita_variacao: number
    utilizacao_variacao: number
  }
}

export interface PerformanceGruasResponse {
  periodo: {
    data_inicio: string
    data_fim: string
    dias_totais: number
    dias_uteis: number
  }
  resumo_geral: {
    total_gruas: number
    total_horas_trabalhadas: number
    total_horas_disponiveis: number
    taxa_utilizacao_media: number
    receita_total: number
    custo_total: number
    lucro_total: number
    roi_medio: number
  }
  performance_por_grua: GruaPerformance[]
  paginacao?: {
    pagina_atual: number
    total_paginas: number
    total_registros: number
    limite: number
  }
}

/**
 * Gera dados mockados realistas para o relatório
 */
export function gerarMockPerformanceGruas(
  dataInicio: string = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  dataFim: string = new Date().toISOString().split('T')[0]
): PerformanceGruasResponse {
  const diasTotais = Math.ceil((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24))
  const diasUteis = Math.floor(diasTotais * 0.7) // Aproximadamente 70% são dias úteis

  const gruasMock: GruaPerformance[] = [
    {
      grua: {
        id: 1,
        nome: "Grua 01",
        modelo: "GT-550",
        fabricante: "Liebherr",
        tipo: "Torre",
        status: "Operacional",
        numero_serie: "LR-2020-001"
      },
      metricas: {
        horas_trabalhadas: 850,
        horas_disponiveis: 1200,
        horas_ociosas: 350,
        taxa_utilizacao: 70.8,
        dias_em_operacao: 35,
        dias_total_periodo: diasTotais
      },
      financeiro: {
        receita_total: 85000,
        custo_operacao: 45000,
        custo_manutencao: 12000,
        custo_total: 57000,
        lucro_bruto: 28000,
        margem_lucro: 32.9,
        receita_por_hora: 100,
        custo_por_hora: 67.1,
        lucro_por_hora: 32.9
      },
      roi: {
        investimento_inicial: 500000,
        receita_acumulada: 85000,
        custo_acumulado: 57000,
        roi_percentual: 5.6,
        tempo_retorno_meses: 18
      },
      obras: {
        total_obras: 3,
        obras_visitadas: [
          {
            obra_id: 1,
            obra_nome: "Edifício Residencial Centro",
            dias_permanencia: 20,
            receita_gerada: 50000
          },
          {
            obra_id: 2,
            obra_nome: "Shopping Center Norte",
            dias_permanencia: 10,
            receita_gerada: 25000
          },
          {
            obra_id: 3,
            obra_nome: "Condomínio Jardim das Flores",
            dias_permanencia: 5,
            receita_gerada: 10000
          }
        ]
      },
      comparativo_periodo_anterior: {
        horas_trabalhadas_variacao: 5.2,
        receita_variacao: 8.5,
        utilizacao_variacao: 2.1
      }
    },
    {
      grua: {
        id: 2,
        nome: "Grua 02",
        modelo: "TC-1200",
        fabricante: "Terex",
        tipo: "Móvel",
        status: "Operacional",
        numero_serie: "TX-2019-045"
      },
      metricas: {
        horas_trabalhadas: 1100,
        horas_disponiveis: 1440,
        horas_ociosas: 340,
        taxa_utilizacao: 76.4,
        dias_em_operacao: 45,
        dias_total_periodo: diasTotais
      },
      financeiro: {
        receita_total: 132000,
        custo_operacao: 66000,
        custo_manutencao: 15000,
        custo_total: 81000,
        lucro_bruto: 51000,
        margem_lucro: 38.6,
        receita_por_hora: 120,
        custo_por_hora: 73.6,
        lucro_por_hora: 46.4
      },
      roi: {
        investimento_inicial: 650000,
        receita_acumulada: 132000,
        custo_acumulado: 81000,
        roi_percentual: 7.8,
        tempo_retorno_meses: 13
      },
      obras: {
        total_obras: 4,
        obras_visitadas: [
          {
            obra_id: 4,
            obra_nome: "Complexo Industrial Sul",
            dias_permanencia: 30,
            receita_gerada: 90000
          },
          {
            obra_id: 5,
            obra_nome: "Torre Comercial Centro",
            dias_permanencia: 15,
            receita_gerada: 42000
          }
        ]
      },
      comparativo_periodo_anterior: {
        horas_trabalhadas_variacao: -3.1,
        receita_variacao: 12.3,
        utilizacao_variacao: -1.5
      }
    },
    {
      grua: {
        id: 3,
        nome: "Grua 03",
        modelo: "K-200",
        fabricante: "Kone",
        tipo: "Torre",
        status: "Manutenção",
        numero_serie: "KN-2021-012"
      },
      metricas: {
        horas_trabalhadas: 420,
        horas_disponiveis: 1200,
        horas_ociosas: 780,
        taxa_utilizacao: 35.0,
        dias_em_operacao: 18,
        dias_total_periodo: diasTotais
      },
      financeiro: {
        receita_total: 42000,
        custo_operacao: 21000,
        custo_manutencao: 35000,
        custo_total: 56000,
        lucro_bruto: -14000,
        margem_lucro: -33.3,
        receita_por_hora: 100,
        custo_por_hora: 133.3,
        lucro_por_hora: -33.3
      },
      roi: {
        investimento_inicial: 480000,
        receita_acumulada: 42000,
        custo_acumulado: 56000,
        roi_percentual: -2.9,
        tempo_retorno_meses: -1
      },
      obras: {
        total_obras: 1,
        obras_visitadas: [
          {
            obra_id: 6,
            obra_nome: "Residencial Vista do Mar",
            dias_permanencia: 18,
            receita_gerada: 42000
          }
        ]
      },
      comparativo_periodo_anterior: {
        horas_trabalhadas_variacao: -45.2,
        receita_variacao: -38.5,
        utilizacao_variacao: -25.8
      }
    },
    {
      grua: {
        id: 4,
        nome: "Grua 04",
        modelo: "SC-2000",
        fabricante: "Sany",
        tipo: "Torre",
        status: "Operacional",
        numero_serie: "SY-2022-078"
      },
      metricas: {
        horas_trabalhadas: 980,
        horas_disponiveis: 1200,
        horas_ociosas: 220,
        taxa_utilizacao: 81.7,
        dias_em_operacao: 41,
        dias_total_periodo: diasTotais
      },
      financeiro: {
        receita_total: 117600,
        custo_operacao: 49000,
        custo_manutencao: 8000,
        custo_total: 57000,
        lucro_bruto: 60600,
        margem_lucro: 51.5,
        receita_por_hora: 120,
        custo_por_hora: 58.2,
        lucro_por_hora: 61.8
      },
      roi: {
        investimento_inicial: 420000,
        receita_acumulada: 117600,
        custo_acumulado: 57000,
        roi_percentual: 14.4,
        tempo_retorno_meses: 7
      },
      obras: {
        total_obras: 5,
        obras_visitadas: [
          {
            obra_id: 7,
            obra_nome: "Centro Empresarial Oeste",
            dias_permanencia: 25,
            receita_gerada: 75000
          },
          {
            obra_id: 8,
            obra_nome: "Hotel Praia do Sol",
            dias_permanencia: 16,
            receita_gerada: 42600
          }
        ]
      },
      comparativo_periodo_anterior: {
        horas_trabalhadas_variacao: 15.8,
        receita_variacao: 22.1,
        utilizacao_variacao: 8.3
      }
    },
    {
      grua: {
        id: 5,
        nome: "Grua 05",
        modelo: "RT-550",
        fabricante: "Potain",
        tipo: "Torre",
        status: "Disponível",
        numero_serie: "PT-2020-156"
      },
      metricas: {
        horas_trabalhadas: 600,
        horas_disponiveis: 1200,
        horas_ociosas: 600,
        taxa_utilizacao: 50.0,
        dias_em_operacao: 25,
        dias_total_periodo: diasTotais
      },
      financeiro: {
        receita_total: 60000,
        custo_operacao: 30000,
        custo_manutencao: 5000,
        custo_total: 35000,
        lucro_bruto: 25000,
        margem_lucro: 41.7,
        receita_por_hora: 100,
        custo_por_hora: 58.3,
        lucro_por_hora: 41.7
      },
      roi: {
        investimento_inicial: 450000,
        receita_acumulada: 60000,
        custo_acumulado: 35000,
        roi_percentual: 5.6,
        tempo_retorno_meses: 18
      },
      obras: {
        total_obras: 2,
        obras_visitadas: [
          {
            obra_id: 9,
            obra_nome: "Escola Municipal Central",
            dias_permanencia: 20,
            receita_gerada: 48000
          },
          {
            obra_id: 10,
            obra_nome: "Posto de Saúde Bairro Novo",
            dias_permanencia: 5,
            receita_gerada: 12000
          }
        ]
      },
      comparativo_periodo_anterior: {
        horas_trabalhadas_variacao: -10.5,
        receita_variacao: -8.2,
        utilizacao_variacao: -5.3
      }
    },
    {
      grua: {
        id: 6,
        nome: "Grua 06",
        modelo: "LTM-1200",
        fabricante: "Liebherr",
        tipo: "Móvel",
        status: "Operacional",
        numero_serie: "LR-2021-089"
      },
      metricas: {
        horas_trabalhadas: 1320,
        horas_disponiveis: 1440,
        horas_ociosas: 120,
        taxa_utilizacao: 91.7,
        dias_em_operacao: 55,
        dias_total_periodo: diasTotais
      },
      financeiro: {
        receita_total: 158400,
        custo_operacao: 79200,
        custo_manutencao: 18000,
        custo_total: 97200,
        lucro_bruto: 61200,
        margem_lucro: 38.6,
        receita_por_hora: 120,
        custo_por_hora: 73.6,
        lucro_por_hora: 46.4
      },
      roi: {
        investimento_inicial: 720000,
        receita_acumulada: 158400,
        custo_acumulado: 97200,
        roi_percentual: 8.5,
        tempo_retorno_meses: 12
      },
      obras: {
        total_obras: 6,
        obras_visitadas: [
          {
            obra_id: 11,
            obra_nome: "Aeroporto Internacional",
            dias_permanencia: 40,
            receita_gerada: 115200
          },
          {
            obra_id: 12,
            obra_nome: "Terminal Rodoviário",
            dias_permanencia: 15,
            receita_gerada: 43200
          }
        ]
      },
      comparativo_periodo_anterior: {
        horas_trabalhadas_variacao: 8.3,
        receita_variacao: 15.2,
        utilizacao_variacao: 4.1
      }
    },
    {
      grua: {
        id: 7,
        nome: "Grua 07",
        modelo: "GT-300",
        fabricante: "Liebherr",
        tipo: "Torre",
        status: "Operacional",
        numero_serie: "LR-2019-234"
      },
      metricas: {
        horas_trabalhadas: 720,
        horas_disponiveis: 1200,
        horas_ociosas: 480,
        taxa_utilizacao: 60.0,
        dias_em_operacao: 30,
        dias_total_periodo: diasTotais
      },
      financeiro: {
        receita_total: 72000,
        custo_operacao: 36000,
        custo_manutencao: 10000,
        custo_total: 46000,
        lucro_bruto: 26000,
        margem_lucro: 36.1,
        receita_por_hora: 100,
        custo_por_hora: 63.9,
        lucro_por_hora: 36.1
      },
      roi: {
        investimento_inicial: 380000,
        receita_acumulada: 72000,
        custo_acumulado: 46000,
        roi_percentual: 6.8,
        tempo_retorno_meses: 15
      },
      obras: {
        total_obras: 2,
        obras_visitadas: [
          {
            obra_id: 13,
            obra_nome: "Supermercado Atacadão",
            dias_permanencia: 25,
            receita_gerada: 60000
          },
          {
            obra_id: 14,
            obra_nome: "Farmácia Popular",
            dias_permanencia: 5,
            receita_gerada: 12000
          }
        ]
      },
      comparativo_periodo_anterior: {
        horas_trabalhadas_variacao: 2.5,
        receita_variacao: 5.8,
        utilizacao_variacao: 1.2
      }
    },
    {
      grua: {
        id: 8,
        nome: "Grua 08",
        modelo: "TC-800",
        fabricante: "Terex",
        tipo: "Móvel",
        status: "Operacional",
        numero_serie: "TX-2020-201"
      },
      metricas: {
        horas_trabalhadas: 1050,
        horas_disponiveis: 1440,
        horas_ociosas: 390,
        taxa_utilizacao: 72.9,
        dias_em_operacao: 44,
        dias_total_periodo: diasTotais
      },
      financeiro: {
        receita_total: 126000,
        custo_operacao: 63000,
        custo_manutencao: 14000,
        custo_total: 77000,
        lucro_bruto: 49000,
        margem_lucro: 38.9,
        receita_por_hora: 120,
        custo_por_hora: 73.3,
        lucro_por_hora: 46.7
      },
      roi: {
        investimento_inicial: 580000,
        receita_acumulada: 126000,
        custo_acumulado: 77000,
        roi_percentual: 8.4,
        tempo_retorno_meses: 12
      },
      obras: {
        total_obras: 4,
        obras_visitadas: [
          {
            obra_id: 15,
            obra_nome: "Estádio Municipal",
            dias_permanencia: 35,
            receita_gerada: 105000
          },
          {
            obra_id: 16,
            obra_nome: "Ginásio Poliesportivo",
            dias_permanencia: 9,
            receita_gerada: 21000
          }
        ]
      },
      comparativo_periodo_anterior: {
        horas_trabalhadas_variacao: 6.7,
        receita_variacao: 9.8,
        utilizacao_variacao: 3.5
      }
    },
    {
      grua: {
        id: 9,
        nome: "Grua 09",
        modelo: "K-300",
        fabricante: "Kone",
        tipo: "Torre",
        status: "Operacional",
        numero_serie: "KN-2022-045"
      },
      metricas: {
        horas_trabalhadas: 900,
        horas_disponiveis: 1200,
        horas_ociosas: 300,
        taxa_utilizacao: 75.0,
        dias_em_operacao: 38,
        dias_total_periodo: diasTotais
      },
      financeiro: {
        receita_total: 108000,
        custo_operacao: 54000,
        custo_manutencao: 11000,
        custo_total: 65000,
        lucro_bruto: 43000,
        margem_lucro: 39.8,
        receita_por_hora: 120,
        custo_por_hora: 72.2,
        lucro_por_hora: 47.8
      },
      roi: {
        investimento_inicial: 520000,
        receita_acumulada: 108000,
        custo_acumulado: 65000,
        roi_percentual: 8.3,
        tempo_retorno_meses: 12
      },
      obras: {
        total_obras: 3,
        obras_visitadas: [
          {
            obra_id: 17,
            obra_nome: "Hospital Regional",
            dias_permanencia: 30,
            receita_gerada: 90000
          },
          {
            obra_id: 18,
            obra_nome: "Clínica Médica",
            dias_permanencia: 8,
            receita_gerada: 18000
          }
        ]
      },
      comparativo_periodo_anterior: {
        horas_trabalhadas_variacao: 12.5,
        receita_variacao: 18.3,
        utilizacao_variacao: 6.2
      }
    },
    {
      grua: {
        id: 10,
        nome: "Grua 10",
        modelo: "SC-1500",
        fabricante: "Sany",
        tipo: "Torre",
        status: "Disponível",
        numero_serie: "SY-2021-112"
      },
      metricas: {
        horas_trabalhadas: 480,
        horas_disponiveis: 1200,
        horas_ociosas: 720,
        taxa_utilizacao: 40.0,
        dias_em_operacao: 20,
        dias_total_periodo: diasTotais
      },
      financeiro: {
        receita_total: 48000,
        custo_operacao: 24000,
        custo_manutencao: 6000,
        custo_total: 30000,
        lucro_bruto: 18000,
        margem_lucro: 37.5,
        receita_por_hora: 100,
        custo_por_hora: 62.5,
        lucro_por_hora: 37.5
      },
      roi: {
        investimento_inicial: 400000,
        receita_acumulada: 48000,
        custo_acumulado: 30000,
        roi_percentual: 4.5,
        tempo_retorno_meses: 22
      },
      obras: {
        total_obras: 1,
        obras_visitadas: [
          {
            obra_id: 19,
            obra_nome: "Ponte sobre o Rio",
            dias_permanencia: 20,
            receita_gerada: 48000
          }
        ]
      },
      comparativo_periodo_anterior: {
        horas_trabalhadas_variacao: -20.8,
        receita_variacao: -15.2,
        utilizacao_variacao: -12.5
      }
    }
  ]

  // Calcular resumo geral
  const resumoGeral = gruasMock.reduce(
    (acc, grua) => {
      acc.total_gruas += 1
      acc.total_horas_trabalhadas += grua.metricas.horas_trabalhadas
      acc.total_horas_disponiveis += grua.metricas.horas_disponiveis
      acc.receita_total += grua.financeiro.receita_total
      acc.custo_total += grua.financeiro.custo_total
      acc.lucro_total += grua.financeiro.lucro_bruto
      return acc
    },
    {
      total_gruas: 0,
      total_horas_trabalhadas: 0,
      total_horas_disponiveis: 0,
      receita_total: 0,
      custo_total: 0,
      lucro_total: 0,
      taxa_utilizacao_media: 0,
      roi_medio: 0
    }
  )

  resumoGeral.taxa_utilizacao_media =
    resumoGeral.total_horas_disponiveis > 0
      ? (resumoGeral.total_horas_trabalhadas / resumoGeral.total_horas_disponiveis) * 100
      : 0

  const investimentoTotal = gruasMock.reduce((sum, g) => sum + g.roi.investimento_inicial, 0)
  resumoGeral.roi_medio =
    investimentoTotal > 0
      ? ((resumoGeral.receita_total - resumoGeral.custo_total) / investimentoTotal) * 100
      : 0

  return {
    periodo: {
      data_inicio: dataInicio,
      data_fim: dataFim,
      dias_totais: diasTotais,
      dias_uteis: diasUteis
    },
    resumo_geral: resumoGeral,
    performance_por_grua: gruasMock,
    paginacao: {
      pagina_atual: 1,
      total_paginas: 1,
      total_registros: gruasMock.length,
      limite: 50
    }
  }
}

/**
 * Filtra dados mockados baseado nos parâmetros
 */
export function filtrarMockPerformanceGruas(
  dados: PerformanceGruasResponse,
  filtros: {
    grua_id?: number
    obra_id?: number
    ordenar_por?: string
    ordem?: 'asc' | 'desc'
  }
): PerformanceGruasResponse {
  let performanceFiltrada = [...dados.performance_por_grua]

  // Filtrar por grua_id
  if (filtros.grua_id) {
    performanceFiltrada = performanceFiltrada.filter((p) => p.grua.id === filtros.grua_id)
  }

  // Filtrar por obra_id
  if (filtros.obra_id) {
    performanceFiltrada = performanceFiltrada.filter((p) =>
      p.obras.obras_visitadas.some((o) => o.obra_id === filtros.obra_id)
    )
  }

  // Ordenar
  if (filtros.ordenar_por) {
    const campo = filtros.ordenar_por as keyof GruaPerformance
    const ordem = filtros.ordem || 'desc'

    performanceFiltrada.sort((a, b) => {
      let valorA: any
      let valorB: any

      if (campo === 'taxa_utilizacao') {
        valorA = a.metricas.taxa_utilizacao
        valorB = b.metricas.taxa_utilizacao
      } else if (campo === 'receita_total') {
        valorA = a.financeiro.receita_total
        valorB = b.financeiro.receita_total
      } else if (campo === 'lucro_bruto') {
        valorA = a.financeiro.lucro_bruto
        valorB = b.financeiro.lucro_bruto
      } else if (campo === 'roi') {
        valorA = a.roi.roi_percentual
        valorB = b.roi.roi_percentual
      } else {
        valorA = (a as any)[campo]
        valorB = (b as any)[campo]
      }

      if (ordem === 'asc') {
        return valorA > valorB ? 1 : -1
      } else {
        return valorA < valorB ? 1 : -1
      }
    })
  }

  return {
    ...dados,
    performance_por_grua: performanceFiltrada,
    paginacao: {
      ...dados.paginacao!,
      total_registros: performanceFiltrada.length
    }
  }
}

