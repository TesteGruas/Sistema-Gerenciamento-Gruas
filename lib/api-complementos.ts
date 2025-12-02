// API client para complementos do catálogo
import { buildApiUrl, fetchWithAuth } from './api.ts'

// ==================== INTERFACES ====================

export interface ComplementoCatalogo {
  id: number
  nome: string
  sku: string
  tipo: 'acessorio' | 'servico'
  tipo_precificacao: 'mensal' | 'unico' | 'por_metro' | 'por_hora' | 'por_dia'
  unidade: 'm' | 'h' | 'unidade' | 'dia' | 'mes'
  preco_unitario_centavos: number
  fator?: number
  descricao?: string
  rule_key?: string
  ativo: boolean
  created_at?: string
  updated_at?: string
  created_by?: number
  updated_by?: number
}

export interface ComplementoCreateData {
  nome: string
  sku: string
  tipo: 'acessorio' | 'servico'
  tipo_precificacao: 'mensal' | 'unico' | 'por_metro' | 'por_hora' | 'por_dia'
  unidade: 'm' | 'h' | 'unidade' | 'dia' | 'mes'
  preco_unitario_centavos: number
  fator?: number
  descricao?: string
  rule_key?: string
  ativo?: boolean
}

export interface ComplementoUpdateData {
  nome?: string
  sku?: string
  tipo?: 'acessorio' | 'servico'
  tipo_precificacao?: 'mensal' | 'unico' | 'por_metro' | 'por_hora' | 'por_dia'
  unidade?: 'm' | 'h' | 'unidade' | 'dia' | 'mes'
  preco_unitario_centavos?: number
  fator?: number
  descricao?: string
  rule_key?: string
  ativo?: boolean
}

export interface ComplementosListResponse {
  success: boolean
  data: ComplementoCatalogo[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ComplementoResponse {
  success: boolean
  data: ComplementoCatalogo
}

export interface ComplementosListParams {
  page?: number
  limit?: number
  tipo?: 'acessorio' | 'servico'
  ativo?: boolean
  search?: string
}

// ==================== FUNÇÕES AUXILIARES ====================

const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetchWithAuth(url, options)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API request error:', error)
    throw error
  }
}

// ==================== API FUNCTIONS ====================

export const complementosApi = {
  // Listar complementos do catálogo
  async listar(params?: ComplementosListParams): Promise<ComplementosListResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.tipo) searchParams.append('tipo', params.tipo)
    if (params?.ativo !== undefined) searchParams.append('ativo', params.ativo.toString())
    if (params?.search) searchParams.append('search', params.search)

    const url = buildApiUrl(`complementos?${searchParams.toString()}`)
    return apiRequest(url)
  },

  // Buscar complemento por ID
  async obter(id: number): Promise<ComplementoResponse> {
    const url = buildApiUrl(`complementos/${id}`)
    return apiRequest(url)
  },

  // Criar complemento
  async criar(data: ComplementoCreateData): Promise<ComplementoResponse> {
    const url = buildApiUrl('complementos')
    return apiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  },

  // Atualizar complemento
  async atualizar(id: number, data: ComplementoUpdateData): Promise<ComplementoResponse> {
    const url = buildApiUrl(`complementos/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  },

  // Excluir complemento
  async excluir(id: number): Promise<{ success: boolean; message: string }> {
    const url = buildApiUrl(`complementos/${id}`)
    return apiRequest(url, {
      method: 'DELETE',
    })
  },

  // Alternar status ativo/inativo
  async toggleAtivo(id: number): Promise<ComplementoResponse> {
    const url = buildApiUrl(`complementos/${id}/toggle-ativo`)
    return apiRequest(url, {
      method: 'PATCH',
    })
  },
}

export default complementosApi

