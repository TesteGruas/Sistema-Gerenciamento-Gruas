import { buildApiUrl, API_ENDPOINTS } from './api'

// Tipos para os dados de cliente
export interface Cliente {
  id: number
  nome: string
  cnpj: string
  email: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  contato: string
  created_at: string
  updated_at: string
}

export interface ClienteFormData {
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

export interface ClientesResponse {
  success: boolean
  data: Cliente[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ClienteResponse {
  success: boolean
  data: Cliente
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

// Serviços da API de clientes
export const clientesApi = {
  // Listar todos os clientes com paginação
  async listarClientes(page: number = 1, limit: number = 10): Promise<ClientesResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.CLIENTES}?page=${page}&limit=${limit}`)
    return apiRequest(url)
  },

  // Obter cliente por ID
  async obterCliente(id: number): Promise<ClienteResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.CLIENTES}/${id}`)
    return apiRequest(url)
  },

  // Criar novo cliente
  async criarCliente(dados: ClienteFormData): Promise<ClienteResponse> {
    const url = buildApiUrl(API_ENDPOINTS.CLIENTES)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(dados),
    })
  },

  // Atualizar cliente
  async atualizarCliente(id: number, dados: ClienteFormData): Promise<ClienteResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.CLIENTES}/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(dados),
    })
  },

  // Excluir cliente
  async excluirCliente(id: number): Promise<{ success: boolean; message: string }> {
    const url = buildApiUrl(`${API_ENDPOINTS.CLIENTES}/${id}`)
    return apiRequest(url, {
      method: 'DELETE',
    })
  },

  // Buscar clientes por termo
  async buscarClientes(termo: string, page: number = 1, limit: number = 10): Promise<ClientesResponse> {
    // Como o backend não tem endpoint de busca específico, vamos usar o listarClientes
    // e filtrar no frontend por enquanto
    const response = await this.listarClientes(page, limit)
    
    if (termo.trim()) {
      const clientesFiltrados = response.data.filter(cliente =>
        cliente.nome.toLowerCase().includes(termo.toLowerCase()) ||
        cliente.email.toLowerCase().includes(termo.toLowerCase()) ||
        cliente.cnpj.includes(termo)
      )
      
      return {
        ...response,
        data: clientesFiltrados,
        pagination: {
          ...response.pagination,
          total: clientesFiltrados.length
        }
      }
    }
    
    return response
  }
}
