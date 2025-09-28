import { api } from './api'

export interface Aditivo {
  id: number
  locacao_id: number
  medicao_id?: number
  tipo: 'horas_extras' | 'multa' | 'desconto' | 'outros'
  descricao: string
  valor: number
  data_aplicacao: string
  status: 'pendente' | 'aprovado' | 'rejeitado'
  observacoes?: string
  created_at: string
  updated_at: string
  // Relacionamentos
  locacoes?: {
    id: number
    numero: string
    cliente_id: number
    equipamento_id: string
    tipo_equipamento: string
    clientes?: {
      nome: string
    }
  }
  medicoes?: {
    id: number
    numero: string
    periodo: string
  }
}

export interface AditivoFormData {
  locacao_id: number
  medicao_id?: number
  tipo: 'horas_extras' | 'multa' | 'desconto' | 'outros'
  descricao: string
  valor: number
  data_aplicacao: string
  status?: 'pendente' | 'aprovado' | 'rejeitado'
  observacoes?: string
}

export interface AditivoFilters {
  page?: number
  limit?: number
  status?: string
  tipo?: string
  locacao_id?: number
  medicao_id?: number
  search?: string
}

export const aditivosApi = {
  // Listar aditivos com filtros
  async list(filters: AditivoFilters = {}) {
    const params = new URLSearchParams()
    
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.tipo && filters.tipo !== 'all') params.append('tipo', filters.tipo)
    if (filters.locacao_id) params.append('locacao_id', filters.locacao_id.toString())
    if (filters.medicao_id) params.append('medicao_id', filters.medicao_id.toString())
    if (filters.search) params.append('search', filters.search)

    const response = await api.get(`/aditivos?${params.toString()}`)
    return response.data
  },

  // Obter aditivo específico
  async get(id: number) {
    const response = await api.get(`/aditivos/${id}`)
    return response.data
  },

  // Criar novo aditivo
  async create(data: AditivoFormData) {
    const response = await api.post('/aditivos', data)
    return response.data
  },

  // Atualizar aditivo
  async update(id: number, data: Partial<AditivoFormData>) {
    const response = await api.put(`/aditivos/${id}`, data)
    return response.data
  },

  // Excluir aditivo
  async delete(id: number) {
    const response = await api.delete(`/aditivos/${id}`)
    return response.data
  },

  // Aprovar aditivo
  async aprovar(id: number) {
    const response = await api.post(`/aditivos/${id}/aprovar`)
    return response.data
  },

  // Rejeitar aditivo
  async rejeitar(id: number) {
    const response = await api.post(`/aditivos/${id}/rejeitar`)
    return response.data
  }
}

export default aditivosApi
