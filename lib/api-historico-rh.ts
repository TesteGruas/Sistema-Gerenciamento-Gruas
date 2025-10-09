// API client para histórico RH
import { buildApiUrl } from './api'

// Interfaces
export interface HistoricoRH {
  id: number
  funcionario_id: number
  tipo: 'admissao' | 'promocao' | 'transferencia' | 'obra' | 'salario' | 'ferias' | 'demissao'
  titulo: string
  descricao?: string
  obra_id?: number
  valor?: number
  status: string
  dados_adicionais?: any
  created_at: string
  funcionarios?: {
    id: number
    nome: string
    cargo: string
  }
  obras?: {
    id: number
    nome: string
  }
}

export interface HistoricoRHCreateData {
  funcionario_id: number
  tipo: 'admissao' | 'promocao' | 'transferencia' | 'obra' | 'salario' | 'ferias' | 'demissao'
  titulo: string
  descricao?: string
  obra_id?: number
  valor?: number
  status?: string
  dados_adicionais?: any
}

export interface HistoricoRHResponse {
  success: boolean
  data: HistoricoRH[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface HistoricoRHSingleResponse {
  success: boolean
  data: HistoricoRH
  message?: string
}

const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

const getHeaders = (): HeadersInit => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

const BASE_URL = 'historico-rh'

export async function getHistoricoRH(params?: {
  page?: number
  limit?: number
  funcionario_id?: number
  tipo?: string
  obra_id?: number
  data_inicio?: string
  data_fim?: string
}): Promise<HistoricoRHResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.funcionario_id) queryParams.append('funcionario_id', params.funcionario_id.toString())
  if (params?.tipo) queryParams.append('tipo', params.tipo)
  if (params?.obra_id) queryParams.append('obra_id', params.obra_id.toString())
  if (params?.data_inicio) queryParams.append('data_inicio', params.data_inicio)
  if (params?.data_fim) queryParams.append('data_fim', params.data_fim)

  const url = buildApiUrl(`${BASE_URL}?${queryParams.toString()}`)
  const response = await fetch(url, { method: 'GET', headers: getHeaders() })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar histórico' }))
    throw new Error(error.message || 'Erro ao buscar histórico')
  }

  return response.json()
}

export async function getHistoricoRHPorId(id: number): Promise<HistoricoRHSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/${id}`)
  const response = await fetch(url, { method: 'GET', headers: getHeaders() })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar histórico' }))
    throw new Error(error.message || 'Erro ao buscar histórico')
  }

  return response.json()
}

export async function createHistoricoRH(data: HistoricoRHCreateData): Promise<HistoricoRHSingleResponse> {
  const url = buildApiUrl(BASE_URL)
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao criar histórico' }))
    throw new Error(error.message || 'Erro ao criar histórico')
  }

  return response.json()
}

export async function updateHistoricoRH(id: number, data: Partial<HistoricoRHCreateData>): Promise<HistoricoRHSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/${id}`)
  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao atualizar histórico' }))
    throw new Error(error.message || 'Erro ao atualizar histórico')
  }

  return response.json()
}

export async function deleteHistoricoRH(id: number): Promise<{ success: boolean; message: string }> {
  const url = buildApiUrl(`${BASE_URL}/${id}`)
  const response = await fetch(url, { method: 'DELETE', headers: getHeaders() })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao deletar histórico' }))
    throw new Error(error.message || 'Erro ao deletar histórico')
  }

  return response.json()
}

export async function getHistoricoFuncionario(funcionario_id: number): Promise<HistoricoRHResponse> {
  const url = buildApiUrl(`${BASE_URL}/funcionario/${funcionario_id}`)
  const response = await fetch(url, { method: 'GET', headers: getHeaders() })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar histórico' }))
    throw new Error(error.message || 'Erro ao buscar histórico')
  }

  return response.json()
}

export async function getTimelineFuncionario(funcionario_id: number): Promise<any> {
  const url = buildApiUrl(`${BASE_URL}/timeline/${funcionario_id}`)
  const response = await fetch(url, { method: 'GET', headers: getHeaders() })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar timeline' }))
    throw new Error(error.message || 'Erro ao buscar timeline')
  }

  return response.json()
}

export async function getEstatisticasHistorico(): Promise<any> {
  const url = buildApiUrl(`${BASE_URL}/estatisticas/geral`)
  const response = await fetch(url, { method: 'GET', headers: getHeaders() })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar estatísticas' }))
    throw new Error(error.message || 'Erro ao buscar estatísticas')
  }

  return response.json()
}

