// API client para vales de funcionários
import { buildApiUrl, API_ENDPOINTS } from './api'

// Interfaces
export interface Vale {
  id: number
  funcionario_id: number
  tipo: 'vale-transporte' | 'vale-refeicao' | 'vale-alimentacao' | 'vale-combustivel' | 'outros'
  descricao: string
  valor: number
  data_solicitacao: string
  data_aprovacao?: string
  data_pagamento?: string
  status: 'solicitado' | 'aprovado' | 'pago' | 'rejeitado'
  aprovado_por?: number
  observacoes?: string
  created_at: string
  updated_at: string
  funcionarios?: {
    nome: string
    cargo: string
  }
}

export interface ValeCreateData {
  funcionario_id: number
  tipo: 'vale-transporte' | 'vale-refeicao' | 'vale-alimentacao' | 'vale-combustivel' | 'outros'
  descricao: string
  valor: number
  data_solicitacao?: string
  observacoes?: string
}

export interface ValesResponse {
  success: boolean
  data: Vale[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ValeSingleResponse {
  success: boolean
  data: Vale
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

const BASE_URL = 'vales'

/**
 * Listar vales
 */
export async function getVales(params?: {
  page?: number
  limit?: number
  funcionario_id?: number
  tipo?: string
  status?: string
  mes?: string
}): Promise<ValesResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.funcionario_id) queryParams.append('funcionario_id', params.funcionario_id.toString())
  if (params?.tipo) queryParams.append('tipo', params.tipo)
  if (params?.status) queryParams.append('status', params.status)
  if (params?.mes) queryParams.append('mes', params.mes)

  const url = buildApiUrl(`${BASE_URL}?${queryParams.toString()}`)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar vales' }))
    throw new Error(error.message || 'Erro ao buscar vales')
  }

  return response.json()
}

/**
 * Obter vale por ID
 */
export async function getValePorId(id: number): Promise<ValeSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/${id}`)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar vale' }))
    throw new Error(error.message || 'Erro ao buscar vale')
  }

  return response.json()
}

/**
 * Criar solicitação de vale
 */
export async function createVale(data: ValeCreateData): Promise<ValeSingleResponse> {
  const url = buildApiUrl(BASE_URL)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao criar vale' }))
    throw new Error(error.message || 'Erro ao criar vale')
  }

  return response.json()
}

/**
 * Atualizar vale
 */
export async function updateVale(id: number, data: Partial<ValeCreateData>): Promise<ValeSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/${id}`)
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao atualizar vale' }))
    throw new Error(error.message || 'Erro ao atualizar vale')
  }

  return response.json()
}

/**
 * Aprovar vale
 */
export async function aprovarVale(id: number, aprovado_por: number): Promise<ValeSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/${id}/aprovar`)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ aprovado_por })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao aprovar vale' }))
    throw new Error(error.message || 'Erro ao aprovar vale')
  }

  return response.json()
}

/**
 * Marcar vale como pago
 */
export async function pagarVale(id: number): Promise<ValeSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/${id}/pagar`)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao marcar vale como pago' }))
    throw new Error(error.message || 'Erro ao marcar vale como pago')
  }

  return response.json()
}

/**
 * Deletar vale
 */
export async function deleteVale(id: number): Promise<{ success: boolean; message: string }> {
  const url = buildApiUrl(`${BASE_URL}/${id}`)
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao deletar vale' }))
    throw new Error(error.message || 'Erro ao deletar vale')
  }

  return response.json()
}

/**
 * Obter vales de um funcionário
 */
export async function getValesFuncionario(funcionario_id: number, status?: string): Promise<ValesResponse> {
  return getVales({ funcionario_id, status, limit: 100 })
}

/**
 * Obter vales por tipo
 */
export async function getValesPorTipo(tipo: string, status?: string): Promise<ValesResponse> {
  return getVales({ tipo, status, limit: 100 })
}

/**
 * Obter vales pendentes
 */
export async function getValesPendentes(): Promise<ValesResponse> {
  return getVales({ status: 'solicitado', limit: 100 })
}

