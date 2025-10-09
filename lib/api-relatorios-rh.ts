// API client para relatórios RH
import { buildApiUrl } from './api'

export interface RelatorioRH {
  id: number
  tipo: string
  periodo?: string
  parametros?: any
  funcionarios_count?: number
  total_horas?: number
  total_salarios?: number
  status: 'Gerado' | 'Processando' | 'Erro'
  arquivo_path?: string
  gerado_por?: number
  created_at: string
  updated_at: string
  usuarios?: {
    nome: string
    email: string
  }
}

export interface RelatorioRHCreateData {
  tipo: string
  periodo?: string
  parametros?: any
  gerado_por?: number
}

export interface RelatoriosRHResponse {
  success: boolean
  data: RelatorioRH[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface RelatorioRHSingleResponse {
  success: boolean
  data: RelatorioRH
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

const BASE_URL = 'relatorios-rh'

export async function getRelatoriosRH(params?: {
  page?: number
  limit?: number
  tipo?: string
  status?: string
  periodo?: string
}): Promise<RelatoriosRHResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.tipo) queryParams.append('tipo', params.tipo)
  if (params?.status) queryParams.append('status', params.status)
  if (params?.periodo) queryParams.append('periodo', params.periodo)

  const url = buildApiUrl(`${BASE_URL}?${queryParams.toString()}`)
  const response = await fetch(url, { method: 'GET', headers: getHeaders() })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar relatórios' }))
    throw new Error(error.message || 'Erro ao buscar relatórios')
  }

  return response.json()
}

export async function getRelatorioRHPorId(id: number): Promise<RelatorioRHSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/${id}`)
  const response = await fetch(url, { method: 'GET', headers: getHeaders() })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar relatório' }))
    throw new Error(error.message || 'Erro ao buscar relatório')
  }

  return response.json()
}

export async function createRelatorioRH(data: RelatorioRHCreateData): Promise<RelatorioRHSingleResponse> {
  const url = buildApiUrl(BASE_URL)
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao criar relatório' }))
    throw new Error(error.message || 'Erro ao criar relatório')
  }

  return response.json()
}

export async function gerarRelatorio(
  tipo: string,
  periodo?: string,
  parametros?: any,
  gerado_por?: number
): Promise<RelatorioRHSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/gerar/${tipo}`)
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ periodo, parametros, gerado_por })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao gerar relatório' }))
    throw new Error(error.message || 'Erro ao gerar relatório')
  }

  return response.json()
}

export async function deleteRelatorioRH(id: number): Promise<{ success: boolean; message: string }> {
  const url = buildApiUrl(`${BASE_URL}/${id}`)
  const response = await fetch(url, { method: 'DELETE', headers: getHeaders() })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao deletar relatório' }))
    throw new Error(error.message || 'Erro ao deletar relatório')
  }

  return response.json()
}

// Helpers para relatórios específicos
export async function gerarRelatorioFuncionariosAtivos(gerado_por?: number): Promise<RelatorioRHSingleResponse> {
  return gerarRelatorio('funcionarios-ativos', undefined, undefined, gerado_por)
}

export async function gerarRelatorioHorasMensais(periodo: string, gerado_por?: number): Promise<RelatorioRHSingleResponse> {
  return gerarRelatorio('horas-mensais', periodo, undefined, gerado_por)
}

export async function gerarRelatorioFolhaPagamento(periodo: string, gerado_por?: number): Promise<RelatorioRHSingleResponse> {
  return gerarRelatorio('folha-pagamento', periodo, undefined, gerado_por)
}

