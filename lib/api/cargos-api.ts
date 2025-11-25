import api, { API_ENDPOINTS } from '../api'

/**
 * Interface para representar um perfil
 */
export interface Perfil {
  id: number
  nome: string
  descricao?: string
  nivel_acesso: number
  status: string
}

/**
 * Interface para representar um cargo
 */
export interface Cargo {
  id: number
  nome: string
  descricao?: string
  nivel: 'Operacional' | 'Técnico' | 'Supervisor' | 'Gerencial' | 'Diretoria'
  salario_minimo?: number
  salario_maximo?: number
  requisitos?: string[]
  competencias?: string[]
  ativo: boolean
  perfil_id?: number
  perfil?: Perfil
  created_at: string
  updated_at: string
}

/**
 * Interface para dados de criação de cargo
 */
export interface CargoCreateData {
  nome: string
  descricao?: string
  nivel: 'Operacional' | 'Técnico' | 'Supervisor' | 'Gerencial' | 'Diretoria'
  salario_minimo?: number
  salario_maximo?: number
  requisitos?: string[]
  competencias?: string[]
  perfil_id?: number
}

/**
 * Interface para dados de atualização de cargo
 */
export interface CargoUpdateData {
  nome?: string
  descricao?: string
  nivel?: 'Operacional' | 'Técnico' | 'Supervisor' | 'Gerencial' | 'Diretoria'
  salario_minimo?: number
  salario_maximo?: number
  requisitos?: string[]
  competencias?: string[]
  ativo?: boolean
  perfil_id?: number
}

/**
 * Parâmetros para listagem de cargos
 */
export interface ListarCargosParams {
  page?: number
  limit?: number
  nivel?: string
  ativo?: boolean | string
  search?: string
}

/**
 * Resposta padrão da API
 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

/**
 * API de Cargos
 */
export const cargosApi = {
  /**
   * Listar todos os cargos com filtros opcionais
   */
  listarCargos: async (params?: ListarCargosParams): Promise<ApiResponse<Cargo[]>> => {
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.set('page', String(params.page))
    if (params?.limit) queryParams.set('limit', String(params.limit))
    if (params?.nivel) queryParams.set('nivel', params.nivel)
    if (params?.ativo !== undefined) {
      queryParams.set('ativo', String(params.ativo))
    }
    if (params?.search) queryParams.set('search', params.search)
    
    const queryString = queryParams.toString()
    const url = queryString ? `${API_ENDPOINTS.CARGOS}?${queryString}` : API_ENDPOINTS.CARGOS
    
    const response = await api.get(url)
    return response.data
  },

  /**
   * Obter cargo por ID
   */
  obterCargo: async (id: number): Promise<ApiResponse<Cargo>> => {
    const response = await api.get(`${API_ENDPOINTS.CARGOS}/${id}`)
    return response.data
  },

  /**
   * Criar novo cargo
   */
  criarCargo: async (data: CargoCreateData): Promise<ApiResponse<Cargo>> => {
    const response = await api.post(API_ENDPOINTS.CARGOS, data)
    return response.data
  },

  /**
   * Atualizar cargo existente
   */
  atualizarCargo: async (id: number, data: CargoUpdateData): Promise<ApiResponse<Cargo>> => {
    const response = await api.put(`${API_ENDPOINTS.CARGOS}/${id}`, data)
    // Debug: verificar resposta
    if (id === 12) {
      console.log('Resposta da API ao atualizar cargo 12:', JSON.stringify(response.data, null, 2))
    }
    return response.data
  },

  /**
   * Deletar cargo (soft delete - marca como inativo)
   */
  deletarCargo: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`${API_ENDPOINTS.CARGOS}/${id}`)
    return response.data
  },

  /**
   * Reativar cargo
   */
  reativarCargo: async (id: number): Promise<ApiResponse<Cargo>> => {
    const response = await api.post(`${API_ENDPOINTS.CARGOS}/${id}/reativar`)
    return response.data
  }
}

export default cargosApi

