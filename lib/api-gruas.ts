// API client para gruas
import { buildApiUrl, API_ENDPOINTS } from './api'

// Interfaces baseadas no backend
export interface GruaBackend {
  id: string
  modelo: string
  fabricante: string
  capacidade: string
  tipo: string
  status: string
  localizacao?: string
  ultima_manutencao?: string
  proxima_manutencao?: string
  created_at: string
  updated_at: string
}

export interface GruaCreateData {
  name: string
  manufacturer: string
  model: string
  capacity: string
  type: string
  status?: string
  location?: string
  last_maintenance?: string
  next_maintenance?: string
}

export interface GruaUpdateData {
  name?: string
  manufacturer?: string
  model?: string
  capacity?: string
  type?: string
  status?: string
  location?: string
  last_maintenance?: string
  next_maintenance?: string
}

export interface GruasResponse {
  success: boolean
  data: GruaBackend[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface GruaResponse {
  success: boolean
  data: GruaBackend
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
export const gruasApi = {
  // Listar todas as gruas
  async listarGruas(params?: {
    page?: number
    limit?: number
    status?: string
    tipo?: string
  }): Promise<GruasResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.status) searchParams.append('status', params.status)
    if (params?.tipo) searchParams.append('tipo', params.tipo)

    const url = buildApiUrl(`${API_ENDPOINTS.GRUAS}?${searchParams.toString()}`)
    return apiRequest(url)
  },

  // Buscar gruas disponíveis (para seleção em obras)
  async buscarGruasDisponiveis(): Promise<{ success: boolean; data: GruaBackend[] }> {
    const url = buildApiUrl(`${API_ENDPOINTS.GRUAS}?status=Disponível&limit=100`)
    return apiRequest(url)
  },

  // Obter grua por ID
  async obterGrua(id: string): Promise<GruaResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.GRUAS}/${id}`)
    return apiRequest(url)
  },

  // Criar nova grua
  async criarGrua(data: GruaCreateData): Promise<GruaResponse> {
    const url = buildApiUrl(API_ENDPOINTS.GRUAS)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Atualizar grua
  async atualizarGrua(id: string, data: GruaUpdateData): Promise<GruaResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.GRUAS}/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Excluir grua
  async excluirGrua(id: string): Promise<{ success: boolean; message: string }> {
    const url = buildApiUrl(`${API_ENDPOINTS.GRUAS}/${id}`)
    return apiRequest(url, {
      method: 'DELETE',
    })
  }
}

// Funções utilitárias para converter dados entre frontend e backend
export const converterGruaBackendParaFrontend = (gruaBackend: GruaBackend) => {
  return {
    id: gruaBackend.id,
    name: `${gruaBackend.fabricante} ${gruaBackend.modelo}`, // Criar nome a partir de fabricante + modelo
    manufacturer: gruaBackend.fabricante,
    model: gruaBackend.modelo,
    capacity: gruaBackend.capacidade,
    type: gruaBackend.tipo,
    status: gruaBackend.status,
    location: gruaBackend.localizacao || '',
    lastMaintenance: gruaBackend.ultima_manutencao || '',
    nextMaintenance: gruaBackend.proxima_manutencao || '',
    createdAt: gruaBackend.created_at,
    updatedAt: gruaBackend.updated_at
  }
}

export const converterGruaFrontendParaBackend = (gruaFrontend: any): GruaCreateData => {
  return {
    name: gruaFrontend.name,
    manufacturer: gruaFrontend.manufacturer,
    model: gruaFrontend.model,
    capacity: gruaFrontend.capacity,
    type: gruaFrontend.type,
    status: gruaFrontend.status || 'Disponível',
    location: gruaFrontend.location,
    last_maintenance: gruaFrontend.lastMaintenance,
    next_maintenance: gruaFrontend.nextMaintenance
  }
}

export default gruasApi
