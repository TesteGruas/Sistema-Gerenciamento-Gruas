import { api } from './api'

export interface Locacao {
  id: number
  numero: string
  cliente_id: number
  equipamento_id: string
  tipo_equipamento: 'grua' | 'plataforma'
  contrato_id?: number
  data_inicio: string
  data_fim?: string
  valor_mensal: number
  status: 'ativa' | 'finalizada' | 'cancelada' | 'pausada'
  observacoes?: string
  funcionario_responsavel_id?: number
  created_at: string
  updated_at: string
  // Campos da view
  cliente_nome?: string
  cliente_cnpj?: string
  funcionario_responsavel?: string
  numero_contrato?: string
  total_medicoes?: number
  total_aditivos?: number
  receita_total?: number
}

export interface LocacaoFormData {
  numero: string
  cliente_id: number
  equipamento_id: string
  tipo_equipamento: 'grua' | 'plataforma'
  contrato_id?: number
  data_inicio: string
  data_fim?: string
  valor_mensal: number
  status?: 'ativa' | 'finalizada' | 'cancelada' | 'pausada'
  observacoes?: string
  funcionario_responsavel_id?: number
}

export interface LocacaoFilters {
  page?: number
  limit?: number
  status?: string
  tipo_equipamento?: string
  cliente_id?: number
  search?: string
}

export interface LocacaoStats {
  total_locacoes_ativas: number
  gruas_locadas: number
  plataformas_locadas: number
  receita_mensal_atual: number
  receita_por_periodo: Array<{
    periodo: string
    total_locacoes: number
    receita_total: number
    receita_media: number
    total_medicoes: number
  }>
}

export const locacoesApi = {
  // Listar locações com filtros
  async list(filters: LocacaoFilters = {}) {
    const params = new URLSearchParams()
    
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.tipo_equipamento && filters.tipo_equipamento !== 'all') params.append('tipo_equipamento', filters.tipo_equipamento)
    if (filters.cliente_id) params.append('cliente_id', filters.cliente_id.toString())
    if (filters.search) params.append('search', filters.search)

    const response = await api.get(`/locacoes?${params.toString()}`)
    return response.data
  },

  // Obter locação específica
  async get(id: number) {
    const response = await api.get(`/locacoes/${id}`)
    return response.data
  },

  // Criar nova locação
  async create(data: LocacaoFormData) {
    const response = await api.post('/locacoes', data)
    return response.data
  },

  // Atualizar locação
  async update(id: number, data: Partial<LocacaoFormData>) {
    const response = await api.put(`/locacoes/${id}`, data)
    return response.data
  },

  // Excluir locação
  async delete(id: number) {
    const response = await api.delete(`/locacoes/${id}`)
    return response.data
  },

  // Obter estatísticas
  async getStats() {
    const response = await api.get('/locacoes/stats/overview')
    return response.data
  }
}

export default locacoesApi
