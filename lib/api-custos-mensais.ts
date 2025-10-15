// API de Custos Mensais integrada com backend real

import api from './api'

// Interfaces
export interface CustoMensal {
  id: number
  mes: string // formato YYYY-MM
  ano: number
  categoria: string
  subcategoria?: string
  descricao: string
  valor: number
  tipo: 'fixo' | 'variavel' | 'extraordinario'
  status: 'pendente' | 'aprovado' | 'pago' | 'cancelado'
  data_vencimento: string
  data_pagamento?: string
  forma_pagamento?: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface CustoMensalCreate {
  mes: string
  ano: number
  categoria: string
  subcategoria?: string
  descricao: string
  valor: number
  tipo: 'fixo' | 'variavel' | 'extraordinario'
  status?: 'pendente' | 'aprovado' | 'pago' | 'cancelado'
  data_vencimento: string
  data_pagamento?: string
  forma_pagamento?: string
  observacoes?: string
}

export interface CustoMensalUpdate {
  categoria?: string
  subcategoria?: string
  descricao?: string
  valor?: number
  tipo?: 'fixo' | 'variavel' | 'extraordinario'
  status?: 'pendente' | 'aprovado' | 'pago' | 'cancelado'
  data_vencimento?: string
  data_pagamento?: string
  forma_pagamento?: string
  observacoes?: string
}

export interface CustoMensalFilters {
  mes?: string
  ano?: number
  categoria?: string
  subcategoria?: string
  tipo?: string
  status?: string
  data_vencimento_inicio?: string
  data_vencimento_fim?: string
  search?: string
  page?: number
  limit?: number
}

export interface CustoMensalStats {
  total_custos: number
  valor_total: number
  por_categoria: Record<string, number>
  por_tipo: Record<string, number>
  por_status: Record<string, number>
  por_mes: Array<{ mes: string; custos: number; valor: number }>
  proximos_vencimentos: Array<{ descricao: string; valor: number; data_vencimento: string }>
}

// API functions
export const apiCustosMensais = {
  // Listar custos mensais
  async listar(filters?: CustoMensalFilters) {
    const params = new URLSearchParams()
    
    if (filters?.mes) params.append('mes', filters.mes)
    if (filters?.ano) params.append('ano', filters.ano.toString())
    if (filters?.categoria) params.append('categoria', filters.categoria)
    if (filters?.subcategoria) params.append('subcategoria', filters.subcategoria)
    if (filters?.tipo) params.append('tipo', filters.tipo)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.data_vencimento_inicio) params.append('data_vencimento_inicio', filters.data_vencimento_inicio)
    if (filters?.data_vencimento_fim) params.append('data_vencimento_fim', filters.data_vencimento_fim)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/custos-mensais?${params.toString()}`)
    return response.data
  },

  // Obter custo mensal por ID
  async obter(id: number) {
    const response = await api.get(`/custos-mensais/${id}`)
    return response.data
  },

  // Criar custo mensal
  async criar(dados: CustoMensalCreate) {
    const response = await api.post('/custos-mensais', dados)
    return response.data
  },

  // Atualizar custo mensal
  async atualizar(id: number, dados: CustoMensalUpdate) {
    const response = await api.put(`/custos-mensais/${id}`, dados)
    return response.data
  },

  // Excluir custo mensal
  async excluir(id: number) {
    const response = await api.delete(`/custos-mensais/${id}`)
    return response.data
  },

  // Atualizar status
  async atualizarStatus(id: number, status: string) {
    const response = await api.patch(`/custos-mensais/${id}/status`, { status })
    return response.data
  },

  // Marcar como pago
  async marcarComoPago(id: number, data_pagamento: string, forma_pagamento: string) {
    const response = await api.patch(`/custos-mensais/${id}/pagar`, {
      data_pagamento,
      forma_pagamento
    })
    return response.data
  },

  // Obter custos por período
  async obterPorPeriodo(mes: string, ano: number) {
    const response = await api.get(`/custos-mensais/periodo/${ano}/${mes}`)
    return response.data
  },

  // Obter custos por categoria
  async obterPorCategoria(categoria: string, filters?: {
    mes?: string
    ano?: number
  }) {
    const params = new URLSearchParams()
    if (filters?.mes) params.append('mes', filters.mes)
    if (filters?.ano) params.append('ano', filters.ano.toString())

    const response = await api.get(`/custos-mensais/categoria/${categoria}?${params.toString()}`)
    return response.data
  },

  // Obter estatísticas
  async obterEstatisticas(filters?: {
    mes?: string
    ano?: number
    categoria?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.mes) params.append('mes', filters.mes)
    if (filters?.ano) params.append('ano', filters.ano.toString())
    if (filters?.categoria) params.append('categoria', filters.categoria)

    const response = await api.get(`/custos-mensais/stats?${params.toString()}`)
    return response.data
  },

  // Gerar relatório
  async gerarRelatorio(filters: {
    mes: string
    ano: number
    formato?: 'pdf' | 'excel'
    agrupar_por?: 'categoria' | 'tipo' | 'status'
  }) {
    const response = await api.post('/custos-mensais/relatorio', filters, {
      responseType: 'blob'
    })
    return response.data
  },

  // Obter próximos vencimentos
  async obterProximosVencimentos(dias: number = 30) {
    const response = await api.get(`/custos-mensais/proximos-vencimentos?dias=${dias}`)
    return response.data
  },

  // Duplicar custo
  async duplicar(id: number, novo_mes: string, novo_ano: number) {
    const response = await api.post(`/custos-mensais/${id}/duplicar`, {
      novo_mes,
      novo_ano
    })
    return response.data
  }
}

export default apiCustosMensais