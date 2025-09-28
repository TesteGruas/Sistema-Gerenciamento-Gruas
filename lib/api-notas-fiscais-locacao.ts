import { api } from './api'

export interface NotaFiscalLocacao {
  id: number
  numero_nf: string
  serie: string
  cliente_id: number
  locacao_id?: number
  data_emissao: string
  valor_total: number
  status: string
  tipo: string
  arquivo_nf?: string
  data_upload?: string
  usuario_upload_id?: number
  observacoes?: string
  created_at: string
  updated_at: string
  // Relacionamentos
  clientes?: {
    nome: string
  }
  locacoes?: {
    numero: string
    equipamento_id: string
  }
}

export interface NotaFiscalLocacaoStats {
  total_notas: number
  valor_total: number
  notas_pendentes: number
  notas_emitidas: number
}

export const notasFiscaisLocacaoApi = {
  async list(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    tipo?: string
    cliente_id?: number
    locacao_id?: number
  }) {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.tipo) searchParams.append('tipo', params.tipo)
    if (params?.cliente_id) searchParams.append('cliente_id', params.cliente_id.toString())
    if (params?.locacao_id) searchParams.append('locacao_id', params.locacao_id.toString())

    const response = await api.get(`/notas-fiscais-locacao?${searchParams.toString()}`)
    return response.data
  },

  async getById(id: number) {
    const response = await api.get(`/notas-fiscais-locacao/${id}`)
    return response.data
  },

  async create(data: Partial<NotaFiscalLocacao>) {
    const response = await api.post('/notas-fiscais-locacao', data)
    return response.data
  },

  async update(id: number, data: Partial<NotaFiscalLocacao>) {
    const response = await api.put(`/notas-fiscais-locacao/${id}`, data)
    return response.data
  },

  async remove(id: number) {
    const response = await api.delete(`/notas-fiscais-locacao/${id}`)
    return response.data
  },

  async getStats() {
    const response = await api.get('/notas-fiscais-locacao/stats')
    return response.data
  },

  async uploadFile(id: number, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post(`/notas-fiscais-locacao/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
}
