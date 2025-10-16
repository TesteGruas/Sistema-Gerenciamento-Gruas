// API de Transferências integrada com backend real

import api from './api'

// Interfaces
export interface Transferencia {
  id: number
  numero_transferencia: string
  data_transferencia: string
  conta_origem_id: number
  conta_origem_nome?: string
  conta_destino_id: number
  conta_destino_nome?: string
  valor: number
  descricao: string
  status: 'pendente' | 'processando' | 'concluida' | 'cancelada' | 'falhou'
  tipo: 'transferencia' | 'deposito' | 'saque' | 'pagamento'
  referencia?: string
  observacoes?: string
  usuario_id: number
  usuario_nome?: string
  created_at: string
  updated_at: string
}

export interface TransferenciaCreate {
  conta_origem_id: number
  conta_destino_id: number
  valor: number
  descricao: string
  tipo: 'transferencia' | 'deposito' | 'saque' | 'pagamento'
  referencia?: string
  observacoes?: string
  data_transferencia?: string
}

export interface TransferenciaUpdate {
  conta_origem_id?: number
  conta_destino_id?: number
  valor?: number
  descricao?: string
  tipo?: 'transferencia' | 'deposito' | 'saque' | 'pagamento'
  referencia?: string
  observacoes?: string
  data_transferencia?: string
}

export interface TransferenciaFilters {
  conta_origem_id?: number
  conta_destino_id?: number
  status?: string
  tipo?: string
  data_inicio?: string
  data_fim?: string
  usuario_id?: number
  search?: string
  page?: number
  limit?: number
}

export interface TransferenciaStats {
  total_transferencias: number
  valor_total: number
  por_status: Record<string, number>
  por_tipo: Record<string, number>
  por_mes: Array<{ mes: string; transferencias: number; valor: number }>
  por_conta: Array<{ conta: string; transferencias: number; valor: number }>
}

// API functions
export const apiTransferencias = {
  // Listar transferências
  async listar(filters?: TransferenciaFilters) {
    const params = new URLSearchParams()
    
    if (filters?.conta_origem_id) params.append('conta_origem_id', filters.conta_origem_id.toString())
    if (filters?.conta_destino_id) params.append('conta_destino_id', filters.conta_destino_id.toString())
    if (filters?.status) params.append('status', filters.status)
    if (filters?.tipo) params.append('tipo', filters.tipo)
    if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters?.data_fim) params.append('data_fim', filters.data_fim)
    if (filters?.usuario_id) params.append('usuario_id', filters.usuario_id.toString())
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/transferencias?${params.toString()}`)
    return response.data
  },

  // Obter transferência por ID
  async obter(id: number) {
    const response = await api.get(`/transferencias/${id}`)
    return response.data
  },

  // Criar transferência
  async criar(dados: TransferenciaCreate) {
    const response = await api.post('/transferencias', dados)
    return response.data
  },

  // Atualizar transferência
  async atualizar(id: number, dados: TransferenciaUpdate) {
    const response = await api.put(`/transferencias/${id}`, dados)
    return response.data
  },

  // Excluir transferência
  async excluir(id: number) {
    const response = await api.delete(`/transferencias/${id}`)
    return response.data
  },

  // Atualizar status
  async atualizarStatus(id: number, status: string) {
    const response = await api.patch(`/transferencias/${id}/status`, { status })
    return response.data
  },

  // Processar transferência
  async processar(id: number) {
    const response = await api.post(`/transferencias/${id}/processar`)
    return response.data
  },

  // Cancelar transferência
  async cancelar(id: number, motivo?: string) {
    const response = await api.post(`/transferencias/${id}/cancelar`, { motivo })
    return response.data
  },

  // Obter estatísticas
  async obterEstatisticas(filters?: {
    data_inicio?: string
    data_fim?: string
    conta_id?: number
  }) {
    const params = new URLSearchParams()
    if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters?.data_fim) params.append('data_fim', filters.data_fim)
    if (filters?.conta_id) params.append('conta_id', filters.conta_id.toString())

    const response = await api.get(`/transferencias/stats?${params.toString()}`)
    return response.data
  },

  // Gerar relatório
  async gerarRelatorio(filters: {
    data_inicio: string
    data_fim: string
    formato?: 'pdf' | 'excel'
    agrupar_por?: 'conta' | 'tipo' | 'mes'
  }) {
    const response = await api.post('/transferencias/relatorio', filters, {
      responseType: 'blob'
    })
    return response.data
  },

  // Verificar saldo
  async verificarSaldo(conta_id: number) {
    const response = await api.get(`/transferencias/verificar-saldo/${conta_id}`)
    return response.data
  }
}

export default apiTransferencias
