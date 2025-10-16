// API client para relacionamentos grua-obra
import { buildApiUrl, API_ENDPOINTS } from './api'

// Interfaces baseadas no backend
export interface GruaObraBackend {
  id: number
  grua_id: string
  obra_id: number
  data_inicio_locacao: string
  data_fim_locacao?: string
  valor_locacao_mensal?: number
  status: 'Ativa' | 'Concluída' | 'Suspensa'
  observacoes?: string
  created_at: string
  updated_at: string
  grua?: {
    id: string
    modelo: string
    fabricante: string
    tipo: string
  }
  obra?: {
    id: number
    nome: string
    cliente_id: number
    status: string
  }
}

export interface GruaObraCreateData {
  grua_id: string
  obra_id: number
  data_inicio_locacao: string
  data_fim_locacao?: string
  valor_locacao_mensal?: number
  status?: 'Ativa' | 'Concluída' | 'Suspensa'
  observacoes?: string
}

export interface GruaObraUpdateData {
  data_fim_locacao?: string
  valor_locacao_mensal?: number
  status?: 'Ativa' | 'Concluída' | 'Suspensa'
  observacoes?: string
}

export interface GruaObraResponse {
  success: boolean
  data: GruaObraBackend[]
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
    
    // TEMPORARIAMENTE DESABILITADO - Interceptor de logout para 403
    // if (response.status === 403 && errorData.error === "Token inválido ou expirado" && errorData.code === "INVALID_TOKEN") {
    //   console.warn('Token inválido ou expirado, removendo dados do localStorage e redirecionando para login...')
    //   localStorage.removeItem('access_token')
    //   localStorage.removeItem('user_data')
    //   localStorage.removeItem('refresh_token')
    //   if (typeof window !== 'undefined') {
    //     window.location.href = '/'
    //   }
    // }
    // TEMPORARIAMENTE DESABILITADO - Interceptor de logout para 401/403
    // else if (response.status === 401 || response.status === 403) {
    //   console.warn('Erro de autenticação, redirecionando para login...')
    //   localStorage.removeItem('access_token')
    //   localStorage.removeItem('user_data')
    //   localStorage.removeItem('refresh_token')
    //   if (typeof window !== 'undefined') {
    //     window.location.href = '/'
    //   }
    // }
    
    throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// API functions
export const gruaObraApi = {
  // Listar relacionamentos grua-obra
  async listarRelacionamentos(params?: {
    grua_id?: string
    obra_id?: number
    status?: string
  }): Promise<GruaObraResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.grua_id) searchParams.append('grua_id', params.grua_id)
    if (params?.obra_id) searchParams.append('obra_id', params.obra_id.toString())
    if (params?.status) searchParams.append('status', params.status)

    const url = buildApiUrl(`relacionamentos/grua-obra?${searchParams.toString()}`)
    return apiRequest(url)
  },

  // Buscar gruas vinculadas a uma obra específica
  async buscarGruasPorObra(obraId: number): Promise<GruaObraResponse> {
    return this.listarRelacionamentos({ obra_id: obraId })
  },

  // Buscar obras vinculadas a uma grua específica
  async buscarObrasPorGrua(gruaId: string): Promise<GruaObraResponse> {
    return this.listarRelacionamentos({ grua_id: gruaId })
  },

  // Criar novo relacionamento grua-obra
  async criarRelacionamento(data: GruaObraCreateData): Promise<{ success: boolean; data: GruaObraBackend }> {
    const url = buildApiUrl('relacionamentos/grua-obra')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Atualizar relacionamento grua-obra
  async atualizarRelacionamento(id: number, data: GruaObraUpdateData): Promise<{ success: boolean; data: GruaObraBackend }> {
    const url = buildApiUrl(`relacionamentos/grua-obra/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Excluir relacionamento grua-obra
  async excluirRelacionamento(id: number): Promise<{ success: boolean; message: string }> {
    const url = buildApiUrl(`relacionamentos/grua-obra/${id}`)
    return apiRequest(url, {
      method: 'DELETE',
    })
  }
}

// Funções utilitárias para converter dados entre frontend e backend
export const converterGruaObraBackendParaFrontend = (gruaObraBackend: GruaObraBackend) => {
  return {
    id: gruaObraBackend.id.toString(),
    gruaId: gruaObraBackend.grua_id,
    obraId: gruaObraBackend.obra_id.toString(),
    dataInicioLocacao: gruaObraBackend.data_inicio_locacao,
    dataFimLocacao: gruaObraBackend.data_fim_locacao,
    valorLocacaoMensal: gruaObraBackend.valor_locacao_mensal || 0,
    status: converterStatusGruaObraBackendParaFrontend(gruaObraBackend.status),
    observacoes: gruaObraBackend.observacoes,
    createdAt: gruaObraBackend.created_at,
    updatedAt: gruaObraBackend.updated_at,
    // Dados da grua
    grua: gruaObraBackend.grua ? {
      id: gruaObraBackend.grua.id,
      name: `${gruaObraBackend.grua.fabricante} ${gruaObraBackend.grua.modelo}`,
      model: gruaObraBackend.grua.modelo,
      manufacturer: gruaObraBackend.grua.fabricante,
      type: gruaObraBackend.grua.tipo,
      capacity: 'N/A', // Não disponível no relacionamento
      status: 'em_obra' // Status padrão quando vinculada a obra
    } : null,
    // Dados da obra
    obra: gruaObraBackend.obra ? {
      id: gruaObraBackend.obra.id.toString(),
      name: gruaObraBackend.obra.nome,
      status: gruaObraBackend.obra.status
    } : null
  }
}

export const converterGruaObraFrontendParaBackend = (gruaObraFrontend: any): GruaObraCreateData => {
  return {
    grua_id: gruaObraFrontend.gruaId,
    obra_id: parseInt(gruaObraFrontend.obraId),
    data_inicio_locacao: gruaObraFrontend.dataInicioLocacao,
    data_fim_locacao: gruaObraFrontend.dataFimLocacao,
    valor_locacao_mensal: gruaObraFrontend.valorLocacaoMensal,
    status: converterStatusGruaObraFrontendParaBackend(gruaObraFrontend.status),
    observacoes: gruaObraFrontend.observacoes
  }
}

export const converterStatusGruaObraBackendParaFrontend = (status: string): 'ativa' | 'concluida' | 'suspensa' => {
  switch (status) {
    case 'Ativa':
      return 'ativa'
    case 'Concluída':
      return 'concluida'
    case 'Suspensa':
      return 'suspensa'
    default:
      return 'ativa'
  }
}

export const converterStatusGruaObraFrontendParaBackend = (status: string): 'Ativa' | 'Concluída' | 'Suspensa' => {
  switch (status) {
    case 'ativa':
      return 'Ativa'
    case 'concluida':
      return 'Concluída'
    case 'suspensa':
      return 'Suspensa'
    default:
      return 'Ativa'
  }
}

export default gruaObraApi
