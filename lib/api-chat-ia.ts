import { fetchWithAuth } from './api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

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

// Função para fazer requisições autenticadas
const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}${url}`, options)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
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
   * Verifica se o serviço de IA está disponível
   */
  async verificarDisponibilidade(): Promise<ChatHealthResponse> {
    return apiRequest('/api/chat-ia/health', {
      method: 'GET',
    })
  },
}






