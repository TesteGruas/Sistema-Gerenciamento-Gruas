// API client para alocação de funcionários em obras
import { buildApiUrl, API_ENDPOINTS } from './api'

// Interfaces
export interface FuncionarioObra {
  id: number
  funcionario_id: number
  obra_id: number
  data_inicio: string
  data_fim?: string
  horas_trabalhadas: number
  valor_hora?: number
  total_receber?: number
  status: 'ativo' | 'finalizado' | 'transferido'
  observacoes?: string
  created_at: string
  updated_at: string
  funcionarios?: {
    id: number
    nome: string
    cargo: string
    salario: number
    telefone?: string
    email?: string
  }
  obras?: {
    id: number
    nome: string
    cidade: string
    estado: string
    endereco?: string
    status?: string
  }
}

export interface FuncionarioObraCreateData {
  funcionario_id: number
  obra_id: number
  data_inicio: string
  data_fim?: string
  horas_trabalhadas?: number
  valor_hora?: number
  status?: 'ativo' | 'finalizado' | 'transferido'
  observacoes?: string
}

export interface FuncionariosObrasResponse {
  success: boolean
  data: FuncionarioObra[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface FuncionarioObraSingleResponse {
  success: boolean
  data: FuncionarioObra
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

const BASE_URL = 'funcionarios-obras'

/**
 * Listar alocações
 */
export async function getFuncionariosObras(params?: {
  page?: number
  limit?: number
  funcionario_id?: number
  obra_id?: number
  status?: string
}): Promise<FuncionariosObrasResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.funcionario_id) queryParams.append('funcionario_id', params.funcionario_id.toString())
  if (params?.obra_id) queryParams.append('obra_id', params.obra_id.toString())
  if (params?.status) queryParams.append('status', params.status)

  const url = buildApiUrl(`${BASE_URL}?${queryParams.toString()}`)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar alocações' }))
    throw new Error(error.message || 'Erro ao buscar alocações')
  }

  return response.json()
}

/**
 * Obter alocação por ID
 */
export async function getFuncionarioObraPorId(id: number): Promise<FuncionarioObraSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/${id}`)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar alocação' }))
    throw new Error(error.message || 'Erro ao buscar alocação')
  }

  return response.json()
}

/**
 * Criar alocação de funcionário em obra
 */
export async function createFuncionarioObra(data: FuncionarioObraCreateData): Promise<FuncionarioObraSingleResponse> {
  const url = buildApiUrl(BASE_URL)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao criar alocação' }))
    throw new Error(error.message || 'Erro ao criar alocação')
  }

  return response.json()
}

/**
 * Atualizar alocação
 */
export async function updateFuncionarioObra(
  id: number,
  data: Partial<FuncionarioObraCreateData>
): Promise<FuncionarioObraSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/${id}`)
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao atualizar alocação' }))
    throw new Error(error.message || 'Erro ao atualizar alocação')
  }

  return response.json()
}

/**
 * Finalizar alocação
 */
export async function finalizarFuncionarioObra(
  id: number,
  data_fim: string
): Promise<FuncionarioObraSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/${id}/finalizar`)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ data_fim })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao finalizar alocação' }))
    throw new Error(error.message || 'Erro ao finalizar alocação')
  }

  return response.json()
}

/**
 * Transferir funcionário para outra obra
 */
export async function transferirFuncionario(
  id: number,
  nova_obra_id: number,
  data_transferencia?: string
): Promise<FuncionarioObraSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/${id}/transferir`)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ nova_obra_id, data_transferencia })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao transferir funcionário' }))
    throw new Error(error.message || 'Erro ao transferir funcionário')
  }

  return response.json()
}

/**
 * Deletar alocação
 */
export async function deleteFuncionarioObra(id: number): Promise<{ success: boolean; message: string }> {
  const url = buildApiUrl(`${BASE_URL}/${id}`)
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao deletar alocação' }))
    throw new Error(error.message || 'Erro ao deletar alocação')
  }

  return response.json()
}

/**
 * Listar funcionários de uma obra
 */
export async function getFuncionariosObra(
  obra_id: number,
  status: string = 'ativo'
): Promise<FuncionariosObrasResponse> {
  const url = buildApiUrl(`${BASE_URL}/obra/${obra_id}/funcionarios?status=${status}`)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar funcionários da obra' }))
    throw new Error(error.message || 'Erro ao buscar funcionários da obra')
  }

  return response.json()
}

/**
 * Obter alocações ativas de um funcionário
 */
export async function getAlocacoesAtivasFuncionario(funcionario_id: number): Promise<FuncionariosObrasResponse> {
  return getFuncionariosObras({ funcionario_id, status: 'ativo', limit: 100 })
}

/**
 * Obter histórico de alocações de um funcionário
 */
export async function getHistoricoAlocacoesFuncionario(funcionario_id: number): Promise<FuncionariosObrasResponse> {
  return getFuncionariosObras({ funcionario_id, limit: 100 })
}

/**
 * Obter todas as alocações ativas
 */
export async function getAlocacoesAtivas(): Promise<FuncionariosObrasResponse> {
  return getFuncionariosObras({ status: 'ativo', limit: 200 })
}

