// API client para relacionamentos grua-obra
import { buildApiUrl, API_ENDPOINTS, fetchWithAuth } from './api'

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

// Cache simples para evitar requisições repetidas
const requestCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5000 // 5 segundos

// Função para fazer requisições autenticadas com tratamento de erro 429
const apiRequest = async (url: string, options: RequestInit = {}, useCache = true) => {
  try {
    // Verificar cache para GET requests
    if (useCache && (!options.method || options.method === 'GET')) {
      const cacheKey = `${url}-${JSON.stringify(options)}`
      const cached = requestCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
      }
    }

    const response = await fetchWithAuth(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Tratar erro 429 especificamente
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 15000
        throw new Error(`Muitas tentativas. Tente novamente em ${Math.ceil(waitTime / 1000 / 60)} minutos.`)
      }
      
      throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Armazenar no cache para GET requests
    if (useCache && (!options.method || options.method === 'GET')) {
      const cacheKey = `${url}-${JSON.stringify(options)}`
      requestCache.set(cacheKey, { data, timestamp: Date.now() })
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
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
