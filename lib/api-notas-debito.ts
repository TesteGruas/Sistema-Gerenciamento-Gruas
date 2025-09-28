import { api } from './api'

export interface NotaDebito {
  id: number
  numero: string
  cliente_id: number
  locacao_id?: number
  data_emissao: string
  valor: number
  descricao: string
  tipo: 'multa' | 'adicional' | 'correcao' | 'outros'
  status: 'pendente' | 'emitida' | 'paga' | 'cancelada'
  observacoes?: string
  created_at: string
  updated_at: string
  // Relacionamentos
  clientes?: {
    nome: string
    cnpj: string
    contato?: string
    telefone?: string
    email?: string
  }
  locacoes?: {
    id: number
    numero: string
    equipamento_id: string
    tipo_equipamento: string
  }
}

export interface NotaDebitoFormData {
  numero: string
  cliente_id: number
  locacao_id?: number
  data_emissao: string
  valor: number
  descricao: string
  tipo: 'multa' | 'adicional' | 'correcao' | 'outros'
  status?: 'pendente' | 'emitida' | 'paga' | 'cancelada'
  observacoes?: string
}

export interface NotaDebitoFilters {
  page?: number
  limit?: number
  status?: string
  tipo?: string
  cliente_id?: number
  locacao_id?: number
  search?: string
}

export const notasDebitoApi = {
  // Listar notas de débito com filtros
  async list(filters: NotaDebitoFilters = {}) {
    const params = new URLSearchParams()
    
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.tipo && filters.tipo !== 'all') params.append('tipo', filters.tipo)
    if (filters.cliente_id) params.append('cliente_id', filters.cliente_id.toString())
    if (filters.locacao_id) params.append('locacao_id', filters.locacao_id.toString())
    if (filters.search) params.append('search', filters.search)

    const response = await api.get(`/notas-debito?${params.toString()}`)
    return response.data
  },

  // Obter nota de débito específica
  async get(id: number) {
    const response = await api.get(`/notas-debito/${id}`)
    return response.data
  },

  // Criar nova nota de débito
  async create(data: NotaDebitoFormData) {
    const response = await api.post('/notas-debito', data)
    return response.data
  },

  // Atualizar nota de débito
  async update(id: number, data: Partial<NotaDebitoFormData>) {
    const response = await api.put(`/notas-debito/${id}`, data)
    return response.data
  },

  // Excluir nota de débito
  async delete(id: number) {
    const response = await api.delete(`/notas-debito/${id}`)
    return response.data
  },

  // Emitir nota de débito
  async emitir(id: number) {
    const response = await api.post(`/notas-debito/${id}/emitir`)
    return response.data
  },

  // Marcar como paga
  async marcarPaga(id: number) {
    const response = await api.post(`/notas-debito/${id}/marcar-paga`)
    return response.data
  }
}

export default notasDebitoApi
