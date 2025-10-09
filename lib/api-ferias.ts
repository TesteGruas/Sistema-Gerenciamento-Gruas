// API client para férias e afastamentos
import { buildApiUrl, API_ENDPOINTS } from './api'

// Interfaces para Férias
export interface Ferias {
  id: number
  funcionario_id: number
  data_inicio: string
  data_fim: string
  dias_solicitados: number
  saldo_anterior: number
  saldo_restante: number
  status: 'Solicitado' | 'Aprovado' | 'Em Andamento' | 'Finalizado' | 'Cancelado'
  observacoes?: string
  aprovado_por?: number
  data_aprovacao?: string
  created_at: string
  updated_at: string
  funcionarios?: {
    nome: string
    cargo: string
  }
}

export interface FeriasCreateData {
  funcionario_id: number
  data_inicio: string
  data_fim: string
  dias_solicitados: number
  saldo_anterior?: number
  observacoes?: string
}

// Interfaces para Afastamentos
export interface Afastamento {
  id: number
  funcionario_id: number
  tipo: 'Licença Médica' | 'Licença Maternidade' | 'Licença Paternidade' | 'Licença Sem Vencimento' | 'Suspensão' | 'Acidente de Trabalho' | 'INSS' | 'Outro'
  data_inicio: string
  data_fim?: string
  dias_solicitados: number
  status: 'Solicitado' | 'Aprovado' | 'Em Andamento' | 'Finalizado' | 'Cancelado'
  observacoes?: string
  documento_anexo?: string
  aprovado_por?: number
  data_aprovacao?: string
  created_at: string
  updated_at: string
  funcionarios?: {
    nome: string
    cargo: string
  }
}

export interface AfastamentoCreateData {
  funcionario_id: number
  tipo: string
  data_inicio: string
  data_fim?: string
  dias_solicitados: number
  observacoes?: string
  documento_anexo?: string
}

// Respostas da API
export interface FeriasResponse {
  success: boolean
  data: Ferias[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface FeriasSingleResponse {
  success: boolean
  data: Ferias
  message?: string
}

export interface AfastamentosResponse {
  success: boolean
  data: Afastamento[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface AfastamentoSingleResponse {
  success: boolean
  data: Afastamento
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

// ============== APIs de Férias ==============

/**
 * Listar férias
 */
export async function getFerias(params?: {
  page?: number
  limit?: number
  funcionario_id?: number
  status?: string
  ano?: number
}): Promise<FeriasResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.funcionario_id) queryParams.append('funcionario_id', params.funcionario_id.toString())
  if (params?.status) queryParams.append('status', params.status)
  if (params?.ano) queryParams.append('ano', params.ano.toString())

  const url = buildApiUrl(`${API_ENDPOINTS.FERIAS}/ferias?${queryParams.toString()}`)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar férias' }))
    throw new Error(error.message || 'Erro ao buscar férias')
  }

  return response.json()
}

/**
 * Obter férias por ID
 */
export async function getFeriasPorId(id: number): Promise<FeriasSingleResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.FERIAS}/ferias/${id}`)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar férias' }))
    throw new Error(error.message || 'Erro ao buscar férias')
  }

  return response.json()
}

/**
 * Criar solicitação de férias
 */
export async function createFerias(data: FeriasCreateData): Promise<FeriasSingleResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.FERIAS}/ferias`)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao criar férias' }))
    throw new Error(error.message || 'Erro ao criar férias')
  }

  return response.json()
}

/**
 * Atualizar férias
 */
export async function updateFerias(id: number, data: Partial<FeriasCreateData>): Promise<FeriasSingleResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.FERIAS}/ferias/${id}`)
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao atualizar férias' }))
    throw new Error(error.message || 'Erro ao atualizar férias')
  }

  return response.json()
}

/**
 * Aprovar férias
 */
export async function aprovarFerias(id: number, aprovado_por: number): Promise<FeriasSingleResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.FERIAS}/ferias/${id}/aprovar`)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ aprovado_por })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao aprovar férias' }))
    throw new Error(error.message || 'Erro ao aprovar férias')
  }

  return response.json()
}

// ============== APIs de Afastamentos ==============

/**
 * Listar afastamentos
 */
export async function getAfastamentos(params?: {
  page?: number
  limit?: number
  funcionario_id?: number
  tipo?: string
  status?: string
}): Promise<AfastamentosResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.funcionario_id) queryParams.append('funcionario_id', params.funcionario_id.toString())
  if (params?.tipo) queryParams.append('tipo', params.tipo)
  if (params?.status) queryParams.append('status', params.status)

  const url = buildApiUrl(`${API_ENDPOINTS.FERIAS}/afastamentos?${queryParams.toString()}`)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar afastamentos' }))
    throw new Error(error.message || 'Erro ao buscar afastamentos')
  }

  return response.json()
}

/**
 * Obter afastamento por ID
 */
export async function getAfastamentoPorId(id: number): Promise<AfastamentoSingleResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.FERIAS}/afastamentos/${id}`)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar afastamento' }))
    throw new Error(error.message || 'Erro ao buscar afastamento')
  }

  return response.json()
}

/**
 * Criar afastamento
 */
export async function createAfastamento(data: AfastamentoCreateData): Promise<AfastamentoSingleResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.FERIAS}/afastamentos`)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao criar afastamento' }))
    throw new Error(error.message || 'Erro ao criar afastamento')
  }

  return response.json()
}

/**
 * Atualizar afastamento
 */
export async function updateAfastamento(id: number, data: Partial<AfastamentoCreateData>): Promise<AfastamentoSingleResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.FERIAS}/afastamentos/${id}`)
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao atualizar afastamento' }))
    throw new Error(error.message || 'Erro ao atualizar afastamento')
  }

  return response.json()
}

/**
 * Aprovar afastamento
 */
export async function aprovarAfastamento(id: number, aprovado_por: number): Promise<AfastamentoSingleResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.FERIAS}/afastamentos/${id}/aprovar`)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ aprovado_por })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao aprovar afastamento' }))
    throw new Error(error.message || 'Erro ao aprovar afastamento')
  }

  return response.json()
}

