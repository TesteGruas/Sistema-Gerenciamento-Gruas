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
    // Apenas logar erros, sem interceptação automática
    if (error.response?.status >= 500) {
      console.error('Erro do servidor:', error.response?.data)
    } else if (error.response?.status === 403 || error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || ''
      console.warn(`Erro ${error.response?.status}: ${errorMessage}`)
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
  CUSTOS_MENSAIS: 'custos-mensais',
  CARGOS: 'cargos',
  FERIAS: 'ferias',
  AFASTAMENTOS: 'afastamentos',
  FOLHA_PAGAMENTO: 'folha-pagamento',
  DESCONTOS_TIPO: 'descontos-tipo',
  BENEFICIOS_TIPO: 'beneficios-tipo',
  VALES: 'vales',
  HORAS_MENSAIS: 'horas-mensais',
  FUNCIONARIOS_OBRAS: 'funcionarios-obras',
  HISTORICO_RH: 'historico-rh',
  RELATORIOS_RH: 'relatorios-rh'
} as const

export { API_BASE_URL }

// Função utilitária para retry de requests
export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  retryCondition?: (error: any) => boolean
}

export async function apiWithRetry<T>(
  apiCall: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // DESABILITADO TEMPORARIAMENTE - Sem retry para evitar "Muitas tentativas"
  return await apiCall()
}