// API client para funcionários
import { buildApiUrl, API_ENDPOINTS } from './api'

// Interfaces baseadas no backend funcionarios.js
export interface FuncionarioBackend {
  id: number
  nome: string
  cargo: 'Operador' | 'Sinaleiro' | 'Técnico Manutenção' | 'Supervisor' | 'Mecânico'
  telefone?: string
  email?: string
  cpf?: string
  turno: 'Diurno' | 'Noturno' | 'Sob Demanda'
  status: 'Ativo' | 'Inativo' | 'Férias'
  data_admissao?: string
  salario?: number
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface FuncionarioCreateData {
  nome: string
  cargo: 'Operador' | 'Sinaleiro' | 'Técnico Manutenção' | 'Supervisor' | 'Mecânico'
  telefone?: string
  email?: string
  cpf?: string
  turno?: 'Diurno' | 'Noturno' | 'Sob Demanda'
  status?: 'Ativo' | 'Inativo' | 'Férias'
  data_admissao?: string
  salario?: number
  observacoes?: string
}

export interface FuncionarioUpdateData {
  nome?: string
  cargo?: 'Operador' | 'Sinaleiro' | 'Técnico Manutenção' | 'Supervisor' | 'Mecânico'
  telefone?: string
  email?: string
  cpf?: string
  turno?: 'Diurno' | 'Noturno' | 'Sob Demanda'
  status?: 'Ativo' | 'Inativo' | 'Férias'
  data_admissao?: string
  salario?: number
  observacoes?: string
}

export interface FuncionariosResponse {
  success: boolean
  data: FuncionarioBackend[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface FuncionarioResponse {
  success: boolean
  data: FuncionarioBackend
}

// Função para obter token de autenticação
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

// Função para fazer requisições autenticadas
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken()
  
  if (!token) {
    console.warn('Token não encontrado, redirecionando para login...')
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
    throw new Error('Token de acesso requerido')
  }
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    
    if (response.status === 401 || response.status === 403) {
      console.warn('Token inválido ou expirado, redirecionando para login...')
      localStorage.removeItem('access_token')
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
    
    throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// API functions
export const funcionariosApi = {
  // Listar todos os funcionários
  async listarFuncionarios(params?: {
    page?: number
    limit?: number
    cargo?: string
    status?: string
    turno?: string
  }): Promise<FuncionariosResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.cargo) searchParams.append('cargo', params.cargo)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.turno) searchParams.append('turno', params.turno)

    const url = buildApiUrl(`${API_ENDPOINTS.FUNCIONARIOS}?${searchParams.toString()}`)
    return apiRequest(url)
  },

  // Buscar funcionários por nome ou cargo
  async buscarFuncionarios(termo: string, filtros?: {
    cargo?: string
    status?: string
  }): Promise<{ success: boolean; data: FuncionarioBackend[] }> {
    if (!termo || termo.length < 2) {
      return { success: true, data: [] }
    }

    const searchParams = new URLSearchParams()
    searchParams.append('q', termo)
    
    if (filtros?.cargo) searchParams.append('cargo', filtros.cargo)
    if (filtros?.status) searchParams.append('status', filtros.status)

    const url = buildApiUrl(`funcionarios/buscar?${searchParams.toString()}`)
    return apiRequest(url)
  },

  // Obter funcionário por ID
  async obterFuncionario(id: number): Promise<FuncionarioResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.FUNCIONARIOS}/${id}`)
    return apiRequest(url)
  },

  // Criar novo funcionário
  async criarFuncionario(data: FuncionarioCreateData): Promise<FuncionarioResponse> {
    const url = buildApiUrl(API_ENDPOINTS.FUNCIONARIOS)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Atualizar funcionário
  async atualizarFuncionario(id: number, data: FuncionarioUpdateData): Promise<FuncionarioResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.FUNCIONARIOS}/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Excluir funcionário
  async excluirFuncionario(id: number): Promise<{ success: boolean; message: string }> {
    const url = buildApiUrl(`${API_ENDPOINTS.FUNCIONARIOS}/${id}`)
    return apiRequest(url, {
      method: 'DELETE',
    })
  }
}

// Funções utilitárias para converter dados entre frontend e backend
export const converterFuncionarioBackendParaFrontend = (funcionarioBackend: FuncionarioBackend) => {
  return {
    id: funcionarioBackend.id.toString(),
    name: funcionarioBackend.nome,
    role: funcionarioBackend.cargo,
    status: funcionarioBackend.status,
    phone: funcionarioBackend.telefone || '',
    email: funcionarioBackend.email || '',
    cpf: funcionarioBackend.cpf || '',
    turno: funcionarioBackend.turno,
    hireDate: funcionarioBackend.data_admissao || '',
    salary: funcionarioBackend.salario || 0,
    observations: funcionarioBackend.observacoes || '',
    createdAt: funcionarioBackend.created_at,
    updatedAt: funcionarioBackend.updated_at
  }
}

export const converterFuncionarioFrontendParaBackend = (funcionarioFrontend: any): FuncionarioCreateData => {
  return {
    nome: funcionarioFrontend.name,
    cargo: funcionarioFrontend.role,
    status: funcionarioFrontend.status || 'Ativo',
    telefone: funcionarioFrontend.phone,
    email: funcionarioFrontend.email,
    cpf: funcionarioFrontend.cpf,
    turno: funcionarioFrontend.turno || 'Diurno',
    data_admissao: funcionarioFrontend.hireDate,
    salario: funcionarioFrontend.salary,
    observacoes: funcionarioFrontend.observations
  }
}

export default funcionariosApi
