// API client para horas mensais
import { buildApiUrl, API_ENDPOINTS } from './api'

// Interfaces
export interface HorasMensais {
  id: number
  funcionario_id: number
  mes: string // Formato YYYY-MM
  horas_trabalhadas: number
  horas_extras: number
  horas_faltas: number
  horas_atrasos: number
  dias_trabalhados: number
  dias_uteis: number
  percentual_frequencia?: number
  valor_hora?: number
  total_receber?: number
  status: 'calculado' | 'pago' | 'pendente'
  created_at: string
  updated_at: string
  funcionarios?: {
    nome: string
    cargo: string
    salario: number
  }
}

export interface HorasMensaisCreateData {
  funcionario_id: number
  mes: string // Formato YYYY-MM
  horas_trabalhadas?: number
  horas_extras?: number
  horas_faltas?: number
  horas_atrasos?: number
  dias_trabalhados?: number
  dias_uteis?: number
  valor_hora?: number
  status?: 'calculado' | 'pago' | 'pendente'
}

export interface HorasMensaisResponse {
  success: boolean
  data: HorasMensais[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface HorasMensaisSingleResponse {
  success: boolean
  data: HorasMensais
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

const BASE_URL = 'horas-mensais'

/**
 * Listar horas mensais
 */
export async function getHorasMensais(params?: {
  page?: number
  limit?: number
  funcionario_id?: number
  mes?: string
  status?: string
  ano?: number
}): Promise<HorasMensaisResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.funcionario_id) queryParams.append('funcionario_id', params.funcionario_id.toString())
  if (params?.mes) queryParams.append('mes', params.mes)
  if (params?.status) queryParams.append('status', params.status)
  if (params?.ano) queryParams.append('ano', params.ano.toString())

  const url = buildApiUrl(`${BASE_URL}?${queryParams.toString()}`)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar horas mensais' }))
    throw new Error(error.message || 'Erro ao buscar horas mensais')
  }

  return response.json()
}

/**
 * Obter horas mensais por ID
 */
export async function getHorasMensaisPorId(id: number): Promise<HorasMensaisSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/${id}`)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar horas mensais' }))
    throw new Error(error.message || 'Erro ao buscar horas mensais')
  }

  return response.json()
}

/**
 * Obter horas de um funcionário em um mês específico
 */
export async function getHorasMensaisFuncionarioMes(
  funcionario_id: number,
  mes: string
): Promise<HorasMensaisSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/funcionario/${funcionario_id}/mes/${mes}`)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar horas mensais' }))
    throw new Error(error.message || 'Erro ao buscar horas mensais')
  }

  return response.json()
}

/**
 * Criar registro de horas mensais
 */
export async function createHorasMensais(data: HorasMensaisCreateData): Promise<HorasMensaisSingleResponse> {
  const url = buildApiUrl(BASE_URL)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao criar horas mensais' }))
    throw new Error(error.message || 'Erro ao criar horas mensais')
  }

  return response.json()
}

/**
 * Atualizar horas mensais
 */
export async function updateHorasMensais(
  id: number,
  data: Partial<HorasMensaisCreateData>
): Promise<HorasMensaisSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/${id}`)
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao atualizar horas mensais' }))
    throw new Error(error.message || 'Erro ao atualizar horas mensais')
  }

  return response.json()
}

/**
 * Calcular totais (recalcular)
 */
export async function calcularHorasMensais(id: number): Promise<HorasMensaisSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/${id}/calcular`)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao calcular horas mensais' }))
    throw new Error(error.message || 'Erro ao calcular horas mensais')
  }

  return response.json()
}

/**
 * Deletar horas mensais
 */
export async function deleteHorasMensais(id: number): Promise<{ success: boolean; message: string }> {
  const url = buildApiUrl(`${BASE_URL}/${id}`)
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao deletar horas mensais' }))
    throw new Error(error.message || 'Erro ao deletar horas mensais')
  }

  return response.json()
}

/**
 * Obter horas de um funcionário (todos os meses)
 */
export async function getHorasMensaisFuncionario(funcionario_id: number): Promise<HorasMensaisResponse> {
  return getHorasMensais({ funcionario_id, limit: 100 })
}

/**
 * Obter horas pendentes de um mês
 */
export async function getHorasMensaisPendentes(mes: string): Promise<HorasMensaisResponse> {
  return getHorasMensais({ mes, status: 'pendente', limit: 100 })
}

/**
 * Obter horas de um ano específico
 */
export async function getHorasMensaisAno(ano: number): Promise<HorasMensaisResponse> {
  return getHorasMensais({ ano, limit: 200 })
}

