// API de Contas Bancárias integrada com backend real

import api from './api'

// Interfaces
export interface ContaBancaria {
  id: number
  nome: string
  banco: string
  agencia: string
  conta: string
  tipo: 'corrente' | 'poupanca' | 'investimento'
  saldo_atual: number
  saldo_inicial: number
  moeda: string
  ativa: boolean
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface ContaBancariaCreate {
  nome: string
  banco: string
  agencia: string
  conta: string
  tipo: 'corrente' | 'poupanca' | 'investimento'
  saldo_inicial?: number
  moeda?: string
  ativa?: boolean
  observacoes?: string
}

export interface ContaBancariaUpdate {
  nome?: string
  banco?: string
  agencia?: string
  conta?: string
  tipo?: 'corrente' | 'poupanca' | 'investimento'
  ativa?: boolean
  observacoes?: string
}

export interface ContaBancariaFilters {
  banco?: string
  tipo?: string
  ativa?: boolean
  search?: string
  page?: number
  limit?: number
}

export interface ContaBancariaStats {
  total_contas: number
  saldo_total: number
  por_tipo: Record<string, number>
  por_banco: Record<string, number>
  movimentacao_mensal: Array<{ mes: string; entrada: number; saida: number; saldo: number }>
}

export interface MovimentacaoConta {
  id: number
  conta_id: number
  tipo: 'entrada' | 'saida'
  valor: number
  descricao: string
  referencia?: string
  data: string
  created_at: string
}

// API functions
export const apiContasBancarias = {
  // Listar contas bancárias
  async listar(filters?: ContaBancariaFilters) {
    const params = new URLSearchParams()
    
    if (filters?.banco) params.append('banco', filters.banco)
    if (filters?.tipo) params.append('tipo', filters.tipo)
    if (filters?.ativa !== undefined) params.append('ativa', filters.ativa.toString())
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    // Adicionar timestamp para evitar cache
    params.append('_t', Date.now().toString())

    const response = await api.get(`/contas-bancarias?${params.toString()}`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
    // Tratar diferentes formatos de resposta
    const data = response.data
    if (data?.success && Array.isArray(data.data)) {
      return data.data
    } else if (Array.isArray(data)) {
      return data
    } else if (data?.data && Array.isArray(data.data)) {
      return data.data
    }
    
    return []
  },

  // Obter conta bancária por ID
  async obter(id: number) {
    const response = await api.get(`/contas-bancarias/${id}`)
    return response.data
  },

  // Criar conta bancária
  async criar(dados: ContaBancariaCreate) {
    const response = await api.post('/contas-bancarias', dados)
    return response.data
  },

  // Atualizar conta bancária
  async atualizar(id: number, dados: ContaBancariaUpdate) {
    const response = await api.put(`/contas-bancarias/${id}`, dados)
    return response.data
  },

  // Excluir conta bancária
  async excluir(id: number) {
    const response = await api.delete(`/contas-bancarias/${id}`)
    return response.data
  },

  // Ativar/Desativar conta
  async toggleStatus(id: number) {
    const response = await api.patch(`/contas-bancarias/${id}/toggle-status`)
    return response.data
  },

  // Obter saldo atual
  async obterSaldo(id: number) {
    const response = await api.get(`/contas-bancarias/${id}/saldo`)
    return response.data
  },

  // Atualizar saldo
  async atualizarSaldo(id: number, novo_saldo: number, motivo?: string) {
    const response = await api.patch(`/contas-bancarias/${id}/saldo`, {
      novo_saldo,
      motivo
    })
    return response.data
  },

  // Obter movimentações
  async obterMovimentacoes(id: number, filters?: {
    data_inicio?: string
    data_fim?: string
    tipo?: string
    page?: number
    limit?: number
  }) {
    const params = new URLSearchParams()
    if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters?.data_fim) params.append('data_fim', filters.data_fim)
    if (filters?.tipo) params.append('tipo', filters.tipo)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/contas-bancarias/${id}/movimentacoes?${params.toString()}`)
    return response.data
  },

  // Registrar movimentação
  async registrarMovimentacao(id: number, dados: {
    tipo: 'entrada' | 'saida'
    valor: number
    descricao: string
    referencia?: string
    data?: string
    categoria?: string
    observacoes?: string
  }) {
    const response = await api.post(`/contas-bancarias/${id}/movimentacoes`, dados)
    return response.data
  },

  // Obter estatísticas
  async obterEstatisticas(filters?: {
    data_inicio?: string
    data_fim?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters?.data_fim) params.append('data_fim', filters.data_fim)

    const response = await api.get(`/contas-bancarias/stats?${params.toString()}`)
    return response.data
  },

  // Gerar relatório
  async gerarRelatorio(filters: {
    data_inicio: string
    data_fim: string
    conta_id?: number
    formato?: 'pdf' | 'excel'
  }) {
    const response = await api.post('/contas-bancarias/relatorio', filters, {
      responseType: 'blob'
    })
    return response.data
  },

  // Conciliar conta
  async conciliar(id: number, saldo_conciliado: number, observacoes?: string) {
    const response = await api.post(`/contas-bancarias/${id}/conciliar`, {
      saldo_conciliado,
      observacoes
    })
    return response.data
  }
}

export default apiContasBancarias
