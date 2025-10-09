// API client para cargos
import { buildApiUrl, API_ENDPOINTS } from './api'

// Interfaces
export interface Cargo {
  id: number
  nome: string
  descricao?: string
  nivel: 'Operacional' | 'Técnico' | 'Supervisor' | 'Gerencial' | 'Diretoria'
  salario_minimo?: number
  salario_maximo?: number
  requisitos: string[]
  competencias: string[]
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CargoCreateData {
  nome: string
  descricao?: string
  nivel: 'Operacional' | 'Técnico' | 'Supervisor' | 'Gerencial' | 'Diretoria'
  salario_minimo?: number
  salario_maximo?: number
  requisitos?: string[]
  competencias?: string[]
  ativo?: boolean
}

export interface CargoUpdateData {
  nome?: string
  descricao?: string
  nivel?: 'Operacional' | 'Técnico' | 'Supervisor' | 'Gerencial' | 'Diretoria'
  salario_minimo?: number
  salario_maximo?: number
  requisitos?: string[]
  competencias?: string[]
  ativo?: boolean
}

export interface CargosResponse {
  success: boolean
  data: Cargo[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface CargoResponse {
  success: boolean
  data: Cargo
  message?: string
}

// Função para obter token de autenticação
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

// Headers padrão com autenticação
const getHeaders = (): HeadersInit => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

/**
 * Listar todos os cargos
 */
export async function getCargos(params?: {
  page?: number
  limit?: number
  nivel?: string
  ativo?: boolean
  search?: string
}): Promise<CargosResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.nivel) queryParams.append('nivel', params.nivel)
  if (params?.ativo !== undefined) queryParams.append('ativo', params.ativo.toString())
  if (params?.search) queryParams.append('search', params.search)

  const url = buildApiUrl(`${API_ENDPOINTS.CARGOS}?${queryParams.toString()}`)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar cargos' }))
    throw new Error(error.message || 'Erro ao buscar cargos')
  }

  return response.json()
}

/**
 * Obter cargo por ID
 */
export async function getCargo(id: number): Promise<CargoResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.CARGOS}/${id}`)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar cargo' }))
    throw new Error(error.message || 'Erro ao buscar cargo')
  }

  return response.json()
}

/**
 * Criar novo cargo
 */
export async function createCargo(data: CargoCreateData): Promise<CargoResponse> {
  const url = buildApiUrl(API_ENDPOINTS.CARGOS)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao criar cargo' }))
    throw new Error(error.message || 'Erro ao criar cargo')
  }

  return response.json()
}

/**
 * Atualizar cargo
 */
export async function updateCargo(id: number, data: CargoUpdateData): Promise<CargoResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.CARGOS}/${id}`)
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao atualizar cargo' }))
    throw new Error(error.message || 'Erro ao atualizar cargo')
  }

  return response.json()
}

/**
 * Deletar cargo (soft delete)
 */
export async function deleteCargo(id: number): Promise<{ success: boolean; message: string }> {
  const url = buildApiUrl(`${API_ENDPOINTS.CARGOS}/${id}`)
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao deletar cargo' }))
    throw new Error(error.message || 'Erro ao deletar cargo')
  }

  return response.json()
}

/**
 * Reativar cargo
 */
export async function reativarCargo(id: number): Promise<CargoResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.CARGOS}/${id}/reativar`)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao reativar cargo' }))
    throw new Error(error.message || 'Erro ao reativar cargo')
  }

  return response.json()
}

/**
 * Obter cargos ativos (helper)
 */
export async function getCargosAtivos(): Promise<CargosResponse> {
  return getCargos({ ativo: true, limit: 100 })
}

/**
 * Obter cargos por nível
 */
export async function getCargosPorNivel(nivel: string): Promise<CargosResponse> {
  return getCargos({ nivel, ativo: true, limit: 100 })
}

