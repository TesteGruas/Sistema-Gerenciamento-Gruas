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
    // Tratar erro 403 com token inválido ou expirado
    if (error.response?.status === 403 && 
        error.response?.data?.error === "Token inválido ou expirado" && 
        error.response?.data?.code === "INVALID_TOKEN") {
      console.warn('Token inválido ou expirado, removendo dados do localStorage e redirecionando para login...')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_data')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    // Tratar outros erros de autenticação
    else if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Erro de autenticação, redirecionando para login...')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_data')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
export { api }

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
