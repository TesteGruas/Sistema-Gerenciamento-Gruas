/**
 * Tipos para Relatório de Performance de Gruas
 * Compatível com a resposta da API real
 */

export interface GruaPerformance {
  grua: {
    id: number | string
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
    tempo_retorno_meses: number | null
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

