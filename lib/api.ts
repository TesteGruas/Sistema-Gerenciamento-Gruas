import axios from 'axios'

// Configuração da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

// Criar instância do axios
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
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
      // Tenta buscar o token com ambos os nomes para compatibilidade
      const token = localStorage.getItem('token') || localStorage.getItem('access_token')
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

// Variável para controlar se está fazendo refresh
let isRefreshing = false
let failedQueue: Array<{ resolve: (value: any) => void; reject: (error: any) => void }> = []

// Função para processar fila de requisições falhadas
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

// Função para fazer refresh do token
const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshTokenValue = localStorage.getItem('refresh_token')
    if (!refreshTokenValue) {
      throw new Error('Refresh token não encontrado')
    }

    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
      headers: {
        'Authorization': `Bearer ${refreshTokenValue}`
      }
    })

    if (response.data.success) {
      const { access_token, refresh_token } = response.data.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      return access_token
    }
    
    throw new Error('Falha ao renovar token')
  } catch (error) {
    console.error('Erro ao renovar token:', error)
    // Limpar tokens e redirecionar para login
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
    return null
  }
}

// Função utilitária para refresh token que pode ser exportada
export const refreshAuthToken = refreshToken

// Função utilitária para interceptar requisições fetch com refresh token
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    throw new Error('Token de acesso requerido')
  }

  // Usar URL relativa para aproveitar o rewrite do Next.js
  // Se a URL já for completa (começar com http), usar como está
  // Caso contrário, usar URL relativa que será redirecionada pelo Next.js
  const requestUrl = url.startsWith('http') ? url : url

  // Adicionar token de autorização
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  }

  const response = await fetch(requestUrl, {
    ...options,
    headers,
  })

  // Verificar se é endpoint de login - não aplicar refresh token
  const isLoginEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh')

  // Se for 403 e não for login, tentar refresh token
  if (response.status === 403 && !isLoginEndpoint) {
    try {
      const newToken = await refreshAuthToken()
      if (newToken) {
        // Refazer a requisição com o novo token
        const newHeaders = {
          ...headers,
          'Authorization': `Bearer ${newToken}`,
        }
        
        return await fetch(requestUrl, {
          ...options,
          headers: newHeaders,
        })
      }
    } catch (refreshError) {
      console.error('Erro ao renovar token:', refreshError)
      // Se falhar o refresh, retornar a resposta original
    }
  }

  return response
}

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Verificar se é endpoint de login - não aplicar refresh token
    const isLoginEndpoint = originalRequest.url?.includes('/auth/login') || 
                           originalRequest.url?.includes('/auth/refresh')

    // Verificar se é erro de token inválido/expirado (403) e não é login
    if (error.response?.status === 403 && 
        !isLoginEndpoint &&
        !originalRequest._retry) {
      
      if (isRefreshing) {
        // Se já está fazendo refresh, adicionar à fila
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await refreshToken()
        
        if (newToken) {
          processQueue(null, newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        } else {
          processQueue(new Error('Falha ao renovar token'), null)
          return Promise.reject(error)
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Logar outros erros
    if (error.response?.status >= 500) {
      console.error('Erro do servidor:', error.response?.data)
    } else if (error.response?.status === 401 || error.response?.status === 403) {
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
  return `${API_BASE_URL}/api/${cleanEndpoint}`
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