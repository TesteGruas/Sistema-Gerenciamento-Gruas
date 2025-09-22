import { buildApiUrl, API_ENDPOINTS } from './api'

// Tipos para os dados de obra
export interface Obra {
  id: number
  nome: string
  cliente_id: number
  endereco: string
  cidade: string
  estado: string
  cep?: string
  tipo: string
  contato_obra?: string
  telefone_obra?: string
  email_obra?: string
  status: string
  created_at: string
  updated_at: string
  clientes?: {
    id: number
    nome: string
    cnpj: string
    email: string
    telefone: string
  }
}

export interface ObraFormData {
  nome: string
  cliente_id: number
  endereco: string
  cidade: string
  estado: string
  cep?: string
  tipo: string
  contato_obra?: string
  telefone_obra?: string
  email_obra?: string
  status?: string
}

export interface ObrasResponse {
  success: boolean
  data: Obra[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ObraResponse {
  success: boolean
  data: Obra
}

// Função para obter token de autenticação
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

// Função para verificar se o usuário está autenticado
const isAuthenticated = () => {
  const token = getAuthToken()
  return !!token
}

// Função para redirecionar para login
const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/'
  }
}

// Função para fazer requisições autenticadas
const apiRequest = async (url: string, options: RequestInit = {}) => {
  if (!isAuthenticated()) {
    redirectToLogin()
    throw new Error('Usuário não autenticado')
  }
  
  const token = getAuthToken()
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  }

  const response = await fetch(url, config)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    
    // Tratamento específico para erros de autenticação
    if (response.status === 401) {
      // Remover token inválido e redirecionar
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
      }
      redirectToLogin()
      throw new Error('Sessão expirada. Redirecionando para login...')
    }
    
    throw new Error(errorData.message || `Erro na requisição: ${response.status}`)
  }

  return response.json()
}

// Serviços da API de obras
export const obrasApi = {
  // Listar todas as obras com paginação
  async listarObras(page: number = 1, limit: number = 10, status?: string): Promise<ObrasResponse> {
    let url = buildApiUrl(`${API_ENDPOINTS.OBRAS}?page=${page}&limit=${limit}`)
    if (status) {
      url += `&status=${encodeURIComponent(status)}`
    }
    return apiRequest(url)
  },

  // Obter obra por ID
  async obterObra(id: number): Promise<ObraResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/${id}`)
    return apiRequest(url)
  },

  // Buscar obras por cliente
  async buscarObrasPorCliente(clienteId: number, page: number = 1, limit: number = 100): Promise<ObrasResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}?cliente_id=${clienteId}&page=${page}&limit=${limit}`)
    return apiRequest(url)
  },

  // Criar nova obra
  async criarObra(dados: ObraFormData): Promise<ObraResponse> {
    const url = buildApiUrl(API_ENDPOINTS.OBRAS)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(dados),
    })
  },

  // Atualizar obra
  async atualizarObra(id: number, dados: ObraFormData): Promise<ObraResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(dados),
    })
  },

  // Excluir obra
  async excluirObra(id: number): Promise<{ success: boolean; message: string }> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/${id}`)
    return apiRequest(url, {
      method: 'DELETE',
    })
  },

  // Buscar obras por termo
  async buscarObras(termo: string, page: number = 1, limit: number = 10): Promise<ObrasResponse> {
    // Como o backend não tem endpoint de busca específico, vamos usar o listarObras
    // e filtrar no frontend por enquanto
    const response = await this.listarObras(page, limit)
    
    if (termo.trim()) {
      const obrasFiltradas = response.data.filter(obra =>
        obra.nome.toLowerCase().includes(termo.toLowerCase()) ||
        obra.endereco.toLowerCase().includes(termo.toLowerCase()) ||
        obra.cidade.toLowerCase().includes(termo.toLowerCase()) ||
        obra.clientes?.nome.toLowerCase().includes(termo.toLowerCase())
      )
      
      return {
        ...response,
        data: obrasFiltradas,
        pagination: {
          ...response.pagination,
          total: obrasFiltradas.length
        }
      }
    }
    
    return response
  }
}
