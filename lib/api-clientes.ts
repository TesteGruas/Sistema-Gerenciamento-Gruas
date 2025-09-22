// API client para clientes
import { buildApiUrl, API_ENDPOINTS } from './api'

// Interfaces baseadas no backend
export interface ClienteBackend {
  id: number
  nome: string
  cnpj: string
  email?: string
  telefone?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  contato?: string
  created_at: string
  updated_at: string
}

export interface ClienteCreateData {
  nome: string
  cnpj: string
  email?: string
  telefone?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  contato?: string
}

export interface ClienteUpdateData {
  nome?: string
  cnpj?: string
  email?: string
  telefone?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  contato?: string
}

export interface ClientesResponse {
  success: boolean
  data: ClienteBackend[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ClienteResponse {
  success: boolean
  data: ClienteBackend
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
export const clientesApi = {
  // Listar todos os clientes
  async listarClientes(params?: {
    page?: number
    limit?: number
  }): Promise<ClientesResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())

    const url = buildApiUrl(`${API_ENDPOINTS.CLIENTES}?${searchParams.toString()}`)
    return apiRequest(url)
  },

  // Buscar clientes por nome ou CNPJ
  async buscarClientes(termo: string): Promise<{ success: boolean; data: ClienteBackend[] }> {
    if (!termo || termo.length < 2) {
      return { success: true, data: [] }
    }

    const url = buildApiUrl(`gruas/clientes/buscar?q=${encodeURIComponent(termo)}`)
    return apiRequest(url)
  },

  // Obter cliente por ID
  async obterCliente(id: number): Promise<ClienteResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.CLIENTES}/${id}`)
    return apiRequest(url)
  },

  // Criar novo cliente
  async criarCliente(data: ClienteCreateData): Promise<ClienteResponse> {
    const url = buildApiUrl(API_ENDPOINTS.CLIENTES)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Atualizar cliente
  async atualizarCliente(id: number, data: ClienteUpdateData): Promise<ClienteResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.CLIENTES}/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Excluir cliente
  async excluirCliente(id: number): Promise<{ success: boolean; message: string }> {
    const url = buildApiUrl(`${API_ENDPOINTS.CLIENTES}/${id}`)
    return apiRequest(url, {
      method: 'DELETE',
    })
  }
}

// Funções utilitárias para converter dados entre frontend e backend
export const converterClienteBackendParaFrontend = (clienteBackend: ClienteBackend) => {
  return {
    id: clienteBackend.id.toString(),
    name: clienteBackend.nome,
    cnpj: clienteBackend.cnpj,
    email: clienteBackend.email || '',
    phone: clienteBackend.telefone || '',
    address: clienteBackend.endereco || '',
    city: clienteBackend.cidade || '',
    state: clienteBackend.estado || '',
    zipCode: clienteBackend.cep || '',
    contact: clienteBackend.contato || '',
    createdAt: clienteBackend.created_at,
    updatedAt: clienteBackend.updated_at
  }
}

export const converterClienteFrontendParaBackend = (clienteFrontend: any): ClienteCreateData => {
  return {
    nome: clienteFrontend.name,
    cnpj: clienteFrontend.cnpj,
    email: clienteFrontend.email,
    telefone: clienteFrontend.phone,
    endereco: clienteFrontend.address,
    cidade: clienteFrontend.city,
    estado: clienteFrontend.state,
    cep: clienteFrontend.zipCode,
    contato: clienteFrontend.contact
  }
}

export default clientesApi