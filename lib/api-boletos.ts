import { api } from './api'

export interface Boleto {
  id: number
  uuid?: string
  numero_boleto: string
  cliente_id?: number
  obra_id?: number
  medicao_id?: number
  descricao: string
  valor: number
  data_emissao: string
  data_vencimento: string
  data_pagamento?: string
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado'
  tipo?: 'receber' | 'pagar'
  forma_pagamento?: string
  codigo_barras?: string
  linha_digitavel?: string
  nosso_numero?: string
  banco?: string
  agencia?: string
  conta?: string
  banco_origem_id?: number
  arquivo_boleto?: string
  observacoes?: string
  created_at: string
  updated_at: string
  // Relacionamentos
  clientes?: {
    id: number
    nome: string
    cnpj?: string
  }
  obras?: {
    id: number
    nome: string
  }
  medicoes?: {
    id: number
    numero: string
    periodo: string
  }
  contas_bancarias?: {
    id: number
    banco: string
    agencia: string
    conta: string
    tipo_conta: string
  }
}

export interface BoletoCreate {
  numero_boleto: string
  cliente_id?: number
  obra_id?: number
  medicao_id?: number
  descricao: string
  valor: number
  data_emissao: string
  data_vencimento: string
  tipo?: 'receber' | 'pagar'
  forma_pagamento?: string
  codigo_barras?: string
  linha_digitavel?: string
  nosso_numero?: string
  banco?: string
  agencia?: string
  conta?: string
  banco_origem_id?: number
  observacoes?: string
}

export const boletosApi = {
  async list(params?: {
    cliente_id?: number
    obra_id?: number
    medicao_id?: number
    status?: string
    tipo?: 'receber' | 'pagar'
    search?: string
    page?: number
    limit?: number
    include_medicoes?: boolean
  }) {
    const searchParams = new URLSearchParams()
    
    if (params?.cliente_id) searchParams.append('cliente_id', params.cliente_id.toString())
    if (params?.obra_id) searchParams.append('obra_id', params.obra_id.toString())
    if (params?.medicao_id) searchParams.append('medicao_id', params.medicao_id.toString())
    if (params?.status) searchParams.append('status', params.status)
    if (params?.tipo) searchParams.append('tipo', params.tipo)
    if (params?.search) searchParams.append('search', params.search)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.include_medicoes) searchParams.append('include_medicoes', 'true')

    const response = await api.get(`/boletos?${searchParams.toString()}`)
    return response.data
  },

  async getById(id: number) {
    const response = await api.get(`/boletos/${id}`)
    return response.data
  },

  async create(data: BoletoCreate) {
    const response = await api.post('/boletos', data)
    return response.data
  },

  async update(id: number, data: Partial<BoletoCreate>) {
    const response = await api.put(`/boletos/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/boletos/${id}`)
    return response.data
  },

  async marcarComoPago(id: number, data_pagamento?: string) {
    const response = await api.post(`/boletos/${id}/pagar`, { data_pagamento })
    return response.data
  },

  async getBoletosMedicoes() {
    const response = await api.get('/boletos?include_medicoes=true')
    return response.data
  },

  async uploadFile(id: number, file: File) {
    const formData = new FormData()
    formData.append('arquivo', file)
    
    const response = await api.post(`/boletos/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
}

