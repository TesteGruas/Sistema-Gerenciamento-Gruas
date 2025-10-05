// API client para gruas
import { buildApiUrl, API_ENDPOINTS } from './api'

// Interfaces baseadas no backend atualizado
export interface GruaBackend {
  id: string
  name: string
  modelo: string
  fabricante?: string
  tipo?: string
  capacidade: string
  capacidade_ponta?: string
  lanca?: string
  altura_trabalho?: string
  ano?: number
  status: 'disponivel' | 'em_obra' | 'manutencao' | 'inativa'
  localizacao?: string
  horas_operacao?: number
  valor_locacao?: number
  valor_real?: number
  valor_operacao?: number
  valor_sinaleiro?: number
  valor_manutencao?: number
  ultima_manutencao?: string
  proxima_manutencao?: string
  observacoes?: string
  created_at: string
  updated_at: string
  current_obra_id?: number
  current_obra_name?: string
  // Campos de compatibilidade com frontend
  model?: string
  capacity?: string
  currentObraId?: string
  currentObraName?: string
}

export interface GruaCreateData {
  name: string
  model: string
  capacity: string
  status?: 'disponivel' | 'em_obra' | 'manutencao' | 'inativa'
  obraId?: string
  observacoes?: string
  fabricante?: string
  tipo?: string
  capacidade_ponta?: string
  lanca?: string
  altura_trabalho?: string
  ano?: number
  localizacao?: string
  horas_operacao?: number
  valor_locacao?: number
  valor_real?: number
  valor_operacao?: number
  valor_sinaleiro?: number
  valor_manutencao?: number
  ultima_manutencao?: string
  proxima_manutencao?: string
}

export interface GruaUpdateData {
  name?: string
  model?: string
  capacity?: string
  status?: 'disponivel' | 'em_obra' | 'manutencao' | 'inativa'
  obraId?: string
  observacoes?: string
  fabricante?: string
  tipo?: string
  capacidade_ponta?: string
  lanca?: string
  altura_trabalho?: string
  ano?: number
  localizacao?: string
  horas_operacao?: number
  valor_locacao?: number
  valor_real?: number
  valor_operacao?: number
  valor_sinaleiro?: number
  valor_manutencao?: number
  ultima_manutencao?: string
  proxima_manutencao?: string
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
    'Authorization': `Bearer ${token}`
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

  const responseData = await response.json()
  return responseData
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
    const url = buildApiUrl(`${API_ENDPOINTS.GRUAS}?status=disponivel&limit=100`)
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
    name: gruaBackend.name || `Grua ${gruaBackend.id}`,
    model: gruaBackend.model || gruaBackend.modelo,
    capacity: gruaBackend.capacity || gruaBackend.capacidade,
    status: gruaBackend.status,
    currentObraId: gruaBackend.currentObraId || gruaBackend.current_obra_id?.toString(),
    currentObraName: gruaBackend.currentObraName || gruaBackend.current_obra_name,
    fabricante: gruaBackend.fabricante,
    tipo: gruaBackend.tipo,
    capacidade_ponta: gruaBackend.capacidade_ponta,
    lanca: gruaBackend.lanca,
    altura_trabalho: gruaBackend.altura_trabalho,
    ano: gruaBackend.ano,
    localizacao: gruaBackend.localizacao,
    horas_operacao: gruaBackend.horas_operacao,
    valor_locacao: gruaBackend.valor_locacao,
    valor_real: gruaBackend.valor_real,
    valor_operacao: gruaBackend.valor_operacao,
    valor_sinaleiro: gruaBackend.valor_sinaleiro,
    valor_manutencao: gruaBackend.valor_manutencao,
    ultima_manutencao: gruaBackend.ultima_manutencao,
    proxima_manutencao: gruaBackend.proxima_manutencao,
    observacoes: gruaBackend.observacoes,
    createdAt: gruaBackend.created_at,
    updatedAt: gruaBackend.updated_at
  }
}

export const converterGruaFrontendParaBackend = (gruaFrontend: any): GruaCreateData => {
  return {
    name: gruaFrontend.name,
    model: gruaFrontend.model,
    capacity: gruaFrontend.capacity,
    status: gruaFrontend.status || 'disponivel',
    obraId: gruaFrontend.obraId || '',
    observacoes: gruaFrontend.observacoes || '',
    fabricante: gruaFrontend.fabricante || 'Não informado',
    tipo: gruaFrontend.tipo || 'Grua Torre',
    capacidade_ponta: gruaFrontend.capacidade_ponta || gruaFrontend.capacity || 'Não informado',
    lanca: gruaFrontend.lanca || 'Não informado',
    altura_trabalho: gruaFrontend.altura_trabalho || 'Não informado',
    ano: gruaFrontend.ano || new Date().getFullYear(),
    localizacao: gruaFrontend.localizacao || 'Não informado',
    horas_operacao: gruaFrontend.horas_operacao || 0,
    valor_locacao: gruaFrontend.valor_locacao || null, // Permitir null em vez de 0
    valor_real: gruaFrontend.valor_real || 0,
    valor_operacao: gruaFrontend.valor_operacao || 0,
    valor_sinaleiro: gruaFrontend.valor_sinaleiro || 0,
    valor_manutencao: gruaFrontend.valor_manutencao || 0,
    ultima_manutencao: gruaFrontend.ultima_manutencao || null,
    proxima_manutencao: gruaFrontend.proxima_manutencao || null
  }
}

export default gruasApi
