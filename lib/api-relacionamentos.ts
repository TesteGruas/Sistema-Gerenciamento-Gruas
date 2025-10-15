// API de Relacionamentos integrada com backend real

import api from './api'

// Interfaces
export interface Relacionamento {
  id: number
  entidade_origem_tipo: string
  entidade_origem_id: number
  entidade_origem_nome?: string
  entidade_destino_tipo: string
  entidade_destino_id: number
  entidade_destino_nome?: string
  tipo_relacionamento: string
  descricao?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface RelacionamentoCreate {
  entidade_origem_tipo: string
  entidade_origem_id: number
  entidade_destino_tipo: string
  entidade_destino_id: number
  tipo_relacionamento: string
  descricao?: string
  ativo?: boolean
}

export interface RelacionamentoUpdate {
  tipo_relacionamento?: string
  descricao?: string
  ativo?: boolean
}

export interface RelacionamentoFilters {
  entidade_origem_tipo?: string
  entidade_origem_id?: number
  entidade_destino_tipo?: string
  entidade_destino_id?: number
  tipo_relacionamento?: string
  ativo?: boolean
  search?: string
  page?: number
  limit?: number
}

export interface RelacionamentoStats {
  total_relacionamentos: number
  por_tipo: Record<string, number>
  por_entidade_origem: Record<string, number>
  por_entidade_destino: Record<string, number>
  mais_relacionadas: Array<{ entidade: string; relacionamentos: number }>
}

// API functions
export const apiRelacionamentos = {
  // Listar relacionamentos
  async listar(filters?: RelacionamentoFilters) {
    const params = new URLSearchParams()
    
    if (filters?.entidade_origem_tipo) params.append('entidade_origem_tipo', filters.entidade_origem_tipo)
    if (filters?.entidade_origem_id) params.append('entidade_origem_id', filters.entidade_origem_id.toString())
    if (filters?.entidade_destino_tipo) params.append('entidade_destino_tipo', filters.entidade_destino_tipo)
    if (filters?.entidade_destino_id) params.append('entidade_destino_id', filters.entidade_destino_id.toString())
    if (filters?.tipo_relacionamento) params.append('tipo_relacionamento', filters.tipo_relacionamento)
    if (filters?.ativo !== undefined) params.append('ativo', filters.ativo.toString())
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/relacionamentos?${params.toString()}`)
    return response.data
  },

  // Obter relacionamento por ID
  async obter(id: number) {
    const response = await api.get(`/relacionamentos/${id}`)
    return response.data
  },

  // Criar relacionamento
  async criar(dados: RelacionamentoCreate) {
    const response = await api.post('/relacionamentos', dados)
    return response.data
  },

  // Atualizar relacionamento
  async atualizar(id: number, dados: RelacionamentoUpdate) {
    const response = await api.put(`/relacionamentos/${id}`, dados)
    return response.data
  },

  // Excluir relacionamento
  async excluir(id: number) {
    const response = await api.delete(`/relacionamentos/${id}`)
    return response.data
  },

  // Ativar/Desativar relacionamento
  async toggleStatus(id: number) {
    const response = await api.patch(`/relacionamentos/${id}/toggle-status`)
    return response.data
  },

  // Obter relacionamentos de uma entidade
  async obterPorEntidade(entidade_tipo: string, entidade_id: number) {
    const response = await api.get(`/relacionamentos/entidade/${entidade_tipo}/${entidade_id}`)
    return response.data
  },

  // Obter relacionamentos por tipo
  async obterPorTipo(tipo_relacionamento: string) {
    const response = await api.get(`/relacionamentos/tipo/${tipo_relacionamento}`)
    return response.data
  },

  // Verificar se existe relacionamento
  async verificarExistencia(
    entidade_origem_tipo: string,
    entidade_origem_id: number,
    entidade_destino_tipo: string,
    entidade_destino_id: number,
    tipo_relacionamento: string
  ) {
    const response = await api.get('/relacionamentos/verificar-existencia', {
      params: {
        entidade_origem_tipo,
        entidade_origem_id,
        entidade_destino_tipo,
        entidade_destino_id,
        tipo_relacionamento
      }
    })
    return response.data
  },

  // Criar relacionamento bidirecional
  async criarBidirecional(dados: {
    entidade_1_tipo: string
    entidade_1_id: number
    entidade_2_tipo: string
    entidade_2_id: number
    tipo_relacionamento: string
    descricao?: string
  }) {
    const response = await api.post('/relacionamentos/bidirecional', dados)
    return response.data
  },

  // Obter estatísticas
  async obterEstatisticas(filters?: {
    entidade_tipo?: string
    tipo_relacionamento?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.entidade_tipo) params.append('entidade_tipo', filters.entidade_tipo)
    if (filters?.tipo_relacionamento) params.append('tipo_relacionamento', filters.tipo_relacionamento)

    const response = await api.get(`/relacionamentos/stats?${params.toString()}`)
    return response.data
  },

  // Obter tipos de relacionamento disponíveis
  async obterTiposDisponiveis() {
    const response = await api.get('/relacionamentos/tipos-disponiveis')
    return response.data
  },

  // Obter entidades relacionadas
  async obterEntidadesRelacionadas(
    entidade_tipo: string,
    entidade_id: number,
    tipo_relacionamento?: string
  ) {
    const params = new URLSearchParams()
    if (tipo_relacionamento) params.append('tipo_relacionamento', tipo_relacionamento)

    const response = await api.get(`/relacionamentos/entidades-relacionadas/${entidade_tipo}/${entidade_id}?${params.toString()}`)
    return response.data
  }
}

export default apiRelacionamentos
