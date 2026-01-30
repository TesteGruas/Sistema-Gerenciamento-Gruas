import { fetchWithAuth } from './api'

// Normalizar a base URL removendo /api do final se existir
const getApiBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  // Remover /api do final se existir para evitar duplicação
  return baseUrl.replace(/\/api\/?$/, '')
}

const API_BASE_URL = getApiBaseUrl()

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface ChatRequest {
  message: string
  conversationHistory?: ChatMessage[]
}

export interface ChatResponse {
  success: boolean
  data: {
    response: string
    timestamp: string
  }
  error?: string
}

export interface ChatHealthResponse {
  success: boolean
  data: {
    available: boolean
    configured: boolean
  }
}

// Cache para verificação de disponibilidade
let lastAvailabilityCheck: { timestamp: number; data: any } | null = null
const AVAILABILITY_CACHE_TTL = 60000 // 1 minuto

// Função para fazer requisições autenticadas com tratamento de erro 429
const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}${url}`, options)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Tratar erro 429 especificamente
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 15000
        throw new Error(`Muitas tentativas. Tente novamente em ${Math.ceil(waitTime / 1000 / 60)} minutos.`)
      }
      
      throw new Error(errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API request error:', error)
    throw error
  }
}

// API functions para Chat de IA
export const chatIaApi = {
  /**
   * Envia uma mensagem para o assistente de IA
   */
  async enviarMensagem(request: ChatRequest): Promise<ChatResponse> {
    return apiRequest('/api/chat-ia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
  },

  /**
   * Verifica se o serviço de IA está disponível (com cache)
   */
  async verificarDisponibilidade(): Promise<ChatHealthResponse> {
    // Verificar cache
    if (lastAvailabilityCheck && Date.now() - lastAvailabilityCheck.timestamp < AVAILABILITY_CACHE_TTL) {
      return lastAvailabilityCheck.data
    }

    try {
      const data = await apiRequest('/api/chat-ia/health', {
        method: 'GET',
      })
      
      // Armazenar no cache
      lastAvailabilityCheck = {
        timestamp: Date.now(),
        data
      }
      
      return data
    } catch (error: any) {
      // Se for erro 429, retornar último valor conhecido ou erro
      if (error.message?.includes('Muitas tentativas')) {
        if (lastAvailabilityCheck) {
          return lastAvailabilityCheck.data
        }
      }
      throw error
    }
  },
}












