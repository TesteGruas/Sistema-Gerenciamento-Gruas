import { api } from './api'

export interface Medicao {
  id: number
  numero: string
  locacao_id: number
  periodo: string
  data_medicao: string
  valor_base: number
  valor_aditivos: number
  valor_total: number
  status: 'pendente' | 'finalizada' | 'cancelada'
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
  aditivos?: Array<{
    id: number
    tipo: string
    descricao: string
    valor: number
    status: string
  }>
}

export interface MedicaoFormData {
  numero: string
  locacao_id: number
  periodo: string
  data_medicao: string
  valor_base: number
  valor_aditivos?: number
  status?: 'pendente' | 'finalizada' | 'cancelada'
  observacoes?: string
}

export interface MedicaoFilters {
  page?: number
  limit?: number
  status?: string
  locacao_id?: number
  periodo?: string
  search?: string
}

export const medicoesApi = {
  // Listar medições com filtros
  async list(filters: MedicaoFilters = {}) {
    const params = new URLSearchParams()
    
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.locacao_id) params.append('locacao_id', filters.locacao_id.toString())
    if (filters.periodo) params.append('periodo', filters.periodo)
    if (filters.search) params.append('search', filters.search)

    const response = await api.get(`/medicoes?${params.toString()}`)
    return response.data
  },

  // Obter medição específica
  async get(id: number) {
    const response = await api.get(`/medicoes/${id}`)
    return response.data
  },

  // Criar nova medição
  async create(data: MedicaoFormData) {
    const response = await api.post('/medicoes', data)
    return response.data
  },

  // Atualizar medição
  async update(id: number, data: Partial<MedicaoFormData>) {
    const response = await api.put(`/medicoes/${id}`, data)
    return response.data
  },

  // Excluir medição
  async delete(id: number) {
    const response = await api.delete(`/medicoes/${id}`)
    return response.data
  },

  // Finalizar medição
  async finalizar(id: number) {
    const response = await api.post(`/medicoes/${id}/finalizar`)
    return response.data
  }
}

export default medicoesApi
