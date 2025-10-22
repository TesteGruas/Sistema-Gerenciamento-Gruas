// API client para alocação de funcionários em obras
import { buildApiUrl, API_ENDPOINTS, api } from './api'

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

// Usar a instância do axios que já tem autenticação configurada

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

  const response = await api.get(`${BASE_URL}?${queryParams.toString()}`)
  return response.data
}

/**
 * Obter alocação por ID
 */
export async function getFuncionarioObraPorId(id: number): Promise<FuncionarioObraSingleResponse> {
  const response = await api.get(`${BASE_URL}/${id}`)
  return response.data
}

/**
 * Criar alocação de funcionário em obra
 */
export async function createFuncionarioObra(data: FuncionarioObraCreateData): Promise<FuncionarioObraSingleResponse> {
  const response = await api.post(BASE_URL, data)
  return response.data
}

/**
 * Atualizar alocação
 */
export async function updateFuncionarioObra(
  id: number,
  data: Partial<FuncionarioObraCreateData>
): Promise<FuncionarioObraSingleResponse> {
  const response = await api.put(`${BASE_URL}/${id}`, data)
  return response.data
}

/**
 * Finalizar alocação
 */
export async function finalizarFuncionarioObra(
  id: number,
  data_fim: string
): Promise<FuncionarioObraSingleResponse> {
  const response = await api.post(`${BASE_URL}/${id}/finalizar`, { data_fim })
  return response.data
}

/**
 * Transferir funcionário para outra obra
 */
export async function transferirFuncionario(
  id: number,
  nova_obra_id: number,
  data_transferencia?: string
): Promise<FuncionarioObraSingleResponse> {
  const response = await api.post(`${BASE_URL}/${id}/transferir`, { nova_obra_id, data_transferencia })
  return response.data
}

/**
 * Deletar alocação
 */
export async function deleteFuncionarioObra(id: number): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`${BASE_URL}/${id}`)
  return response.data
}

/**
 * Listar funcionários de uma obra
 */
export async function getFuncionariosObra(
  obra_id: number,
  status: string = 'ativo'
): Promise<FuncionariosObrasResponse> {
  const response = await api.get(`${BASE_URL}/obra/${obra_id}/funcionarios?status=${status}`)
  return response.data
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

