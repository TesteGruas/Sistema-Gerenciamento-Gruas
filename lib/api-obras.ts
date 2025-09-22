// API client para obras
import { buildApiUrl, API_ENDPOINTS } from './api'
import { gruaObraApi, converterGruaObraBackendParaFrontend } from './api-grua-obra'

// Interfaces baseadas no backend
export interface ObraBackend {
  id: number
  nome: string
  cliente_id: number
  endereco: string
  cidade: string
  estado: string
  tipo: string
  cep?: string
  contato_obra?: string
  telefone_obra?: string
  email_obra?: string
  status: 'Planejamento' | 'Em Andamento' | 'Pausada' | 'Concluída' | 'Cancelada'
  created_at: string
  updated_at: string
  clientes?: {
    id: number
    nome: string
    cnpj: string
    email?: string
    telefone?: string
  }
}

export interface ObraCreateData {
  nome: string
  cliente_id: number
  endereco: string
  cidade: string
  estado: string
  tipo: string
  cep?: string
  contato_obra?: string
  telefone_obra?: string
  email_obra?: string
  status?: 'Planejamento' | 'Em Andamento' | 'Pausada' | 'Concluída' | 'Cancelada'
  // Campos para criação automática de cliente
  cliente_nome?: string
  cliente_cnpj?: string
  cliente_email?: string
  cliente_telefone?: string
}

export interface ObraUpdateData {
  nome?: string
  cliente_id?: number
  endereco?: string
  cidade?: string
  estado?: string
  tipo?: string
  cep?: string
  contato_obra?: string
  telefone_obra?: string
  email_obra?: string
  status?: 'Planejamento' | 'Em Andamento' | 'Pausada' | 'Concluída' | 'Cancelada'
}

export interface ObrasResponse {
  success: boolean
  data: ObraBackend[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ObraResponse {
  success: boolean
  data: ObraBackend
}

// Função para obter token de autenticação
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

// Função para verificar se o usuário está autenticado
const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem('access_token')
  return !!token
}

// Função para redirecionar para login se não autenticado
const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/'
  }
}

// Função para fazer requisições autenticadas
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken()
  
  // Verificar se está autenticado
  if (!token) {
    console.warn('Token não encontrado, redirecionando para login...')
    redirectToLogin()
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
    
    // Se o token é inválido ou expirado, redirecionar para login
    if (response.status === 401 || response.status === 403) {
      console.warn('Token inválido ou expirado, redirecionando para login...')
      localStorage.removeItem('access_token')
      redirectToLogin()
    }
    
    throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// API functions
export const obrasApi = {
  // Listar todas as obras
  async listarObras(params?: {
    page?: number
    limit?: number
    status?: string
    cliente_id?: number
  }): Promise<ObrasResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.status) searchParams.append('status', params.status)
    if (params?.cliente_id) searchParams.append('cliente_id', params.cliente_id.toString())

    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}?${searchParams.toString()}`)
    return apiRequest(url)
  },

  // Obter obra por ID
  async obterObra(id: number): Promise<ObraResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/${id}`)
    return apiRequest(url)
  },

  // Criar nova obra
  async criarObra(data: ObraCreateData): Promise<ObraResponse> {
    const url = buildApiUrl(API_ENDPOINTS.OBRAS)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Atualizar obra
  async atualizarObra(id: number, data: ObraUpdateData): Promise<ObraResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Excluir obra
  async excluirObra(id: number): Promise<{ success: boolean; message: string }> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/${id}`)
    return apiRequest(url, {
      method: 'DELETE',
    })
  },

  // Buscar gruas vinculadas à obra
  async buscarGruasVinculadas(obraId: number): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await gruaObraApi.buscarGruasPorObra(obraId)
      const gruasConvertidas = response.data.map(converterGruaObraBackendParaFrontend)
      return {
        success: true,
        data: gruasConvertidas
      }
    } catch (error) {
      console.error('Erro ao buscar gruas vinculadas:', error)
      return {
        success: false,
        data: []
      }
    }
  },

  // Endpoints de teste e utilitários
  async testarValidacao(data: ObraCreateData): Promise<{ success: boolean; data?: any; error?: string; details?: string }> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/teste-validacao`)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async verificarCliente(id: number): Promise<{ success: boolean; data: { cliente: any; existe: boolean } }> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/teste-cliente-${id}`)
    return apiRequest(url)
  },

  async criarClientePadrao(): Promise<{ success: boolean; data: any; message: string }> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/criar-cliente-padrao`)
    return apiRequest(url, {
      method: 'POST',
    })
  },

  async criarClienteAutomatico(data: {
    nome: string
    cnpj: string
    email?: string
    telefone?: string
  }): Promise<{ success: boolean; data: any; message: string }> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/criar-cliente-automatico`)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// Funções utilitárias para converter dados entre frontend e backend
export const converterObraBackendParaFrontend = (obraBackend: ObraBackend) => {
  return {
    id: obraBackend.id.toString(),
    name: obraBackend.nome,
    description: `${obraBackend.tipo} - ${obraBackend.endereco}, ${obraBackend.cidade}/${obraBackend.estado}`,
    startDate: obraBackend.created_at.split('T')[0],
    endDate: undefined, // Não disponível no backend atual
    status: converterStatusBackendParaFrontend(obraBackend.status),
    responsavelId: '3', // Valor padrão
    responsavelName: 'Pedro Costa', // Valor padrão
    clienteId: obraBackend.cliente_id.toString(),
    clienteName: obraBackend.clientes?.nome || 'Cliente não encontrado',
    budget: 0, // Não disponível no backend atual
    location: `${obraBackend.cidade}, ${obraBackend.estado}`,
    client: obraBackend.clientes?.nome || 'Cliente não encontrado',
    observations: obraBackend.contato_obra ? `Contato: ${obraBackend.contato_obra}` : undefined,
    createdAt: obraBackend.created_at,
    updatedAt: obraBackend.updated_at,
    custosIniciais: 0,
    custosAdicionais: 0,
    totalCustos: 0,
    // Campos adicionais do backend
    endereco: obraBackend.endereco,
    cidade: obraBackend.cidade,
    estado: obraBackend.estado,
    cep: obraBackend.cep,
    tipo: obraBackend.tipo,
    contato_obra: obraBackend.contato_obra,
    telefone_obra: obraBackend.telefone_obra,
    email_obra: obraBackend.email_obra
  }
}

export const converterObraFrontendParaBackend = (obraFrontend: any): ObraCreateData => {
  return {
    nome: obraFrontend.name,
    cliente_id: parseInt(obraFrontend.clienteId),
    endereco: obraFrontend.location || obraFrontend.endereco || '',
    cidade: obraFrontend.cidade || 'São Paulo',
    estado: obraFrontend.estado || 'SP',
    tipo: obraFrontend.tipo || 'Residencial',
    cep: obraFrontend.cep,
    contato_obra: obraFrontend.contato_obra,
    telefone_obra: obraFrontend.telefone_obra,
    email_obra: obraFrontend.email_obra,
    status: converterStatusFrontendParaBackend(obraFrontend.status),
    // Dados para criação automática de cliente se necessário
    cliente_nome: obraFrontend.cliente_nome,
    cliente_cnpj: obraFrontend.cliente_cnpj,
    cliente_email: obraFrontend.cliente_email,
    cliente_telefone: obraFrontend.cliente_telefone
  }
}

export const converterStatusBackendParaFrontend = (status: string): 'ativa' | 'pausada' | 'concluida' => {
  switch (status) {
    case 'Em Andamento':
      return 'ativa'
    case 'Pausada':
      return 'pausada'
    case 'Concluída':
      return 'concluida'
    case 'Planejamento':
    case 'Cancelada':
    default:
      return 'pausada'
  }
}

export const converterStatusFrontendParaBackend = (status: string): 'Planejamento' | 'Em Andamento' | 'Pausada' | 'Concluída' | 'Cancelada' => {
  switch (status) {
    case 'ativa':
      return 'Em Andamento'
    case 'pausada':
      return 'Pausada'
    case 'concluida':
      return 'Concluída'
    default:
      return 'Pausada'
  }
}

// Função utilitária para verificar autenticação
export const checkAuthentication = (): boolean => {
  return isAuthenticated()
}

// Função para fazer login se necessário
export const ensureAuthenticated = async (): Promise<boolean> => {
  if (!isAuthenticated()) {
    redirectToLogin()
    return false
  }
  return true
}

export default obrasApi