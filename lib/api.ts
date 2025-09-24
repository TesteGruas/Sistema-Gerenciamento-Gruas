import axios from 'axios'

// Configuração da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    // Adicionar token se disponível
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Tratar erros de autenticação
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        // Redirecionar para a página de login (que está na raiz)
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Função para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  // Remove barra inicial se existir para evitar dupla barra
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${API_BASE_URL}/${cleanEndpoint}`
}

// Endpoints específicos
export const API_ENDPOINTS = {
  GRUAS: 'gruas',
  CLIENTES: 'clientes',
  FUNCIONARIOS: 'funcionarios',
  EQUIPAMENTOS: 'equipamentos',
  OBRAS: 'obras',
  RELACIONAMENTOS: 'relacionamentos',
  USERS: 'users',
  AUTH: 'auth',
  CUSTOS_MENSAIS: 'custos-mensais'
} as const

export { API_BASE_URL }
