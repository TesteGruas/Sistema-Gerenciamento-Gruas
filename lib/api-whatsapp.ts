/**
 * API Client para WhatsApp - Aprovações
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken()
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro na requisição' }))
    throw new Error(error.message || 'Erro na requisição')
  }

  return response.json()
}

export interface WhatsAppConfig {
  api_provider: string
  api_key: string
  api_secret?: string
  api_url?: string
  webhook_url?: string
  enabled: boolean
  mensagem_template: string
  lembrete_enabled: boolean
  lembrete_intervalo_horas: number
  lembrete_max_tentativas: number
  mensagem_lembrete_template: string
}

export interface WhatsAppLog {
  id: number
  aprovacao_id: number
  telefone_destino: string
  mensagem: string
  status: 'enviado' | 'entregue' | 'lido' | 'erro'
  status_detalhes?: string
  tipo: 'aprovacao' | 'lembrete'
  tentativa: number
  created_at: string
  updated_at: string
  aprovacao?: {
    id: number
    funcionario_nome: string
    obra_nome: string
    data: string
    horas_extras: number
  }
}

export interface EstatisticasWhatsApp {
  total_enviadas: number
  total_entregues: number
  total_lidas: number
  total_erros: number
  taxa_entrega: number
  taxa_leitura: number
  tempo_medio_resposta: number
}

export interface FiltrosLogs {
  data_inicio?: string
  data_fim?: string
  status?: string
  tipo?: string
  aprovacao_id?: string
}

export const whatsappApi = {
  /**
   * Obter configurações do WhatsApp
   */
  async obterConfiguracao(): Promise<{ success: boolean; data: WhatsAppConfig }> {
    return apiRequest('/api/whatsapp/config')
  },

  /**
   * Salvar configurações do WhatsApp
   */
  async salvarConfiguracao(config: WhatsAppConfig): Promise<{ success: boolean; message: string }> {
    return apiRequest('/api/whatsapp/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    })
  },

  /**
   * Testar conexão com a API WhatsApp
   */
  async testarConexao(config: Partial<WhatsAppConfig>): Promise<{ success: boolean; message: string }> {
    return apiRequest('/api/whatsapp/test', {
      method: 'POST',
      body: JSON.stringify(config),
    })
  },

  /**
   * Listar logs de mensagens
   */
  async listarLogs(filtros?: FiltrosLogs): Promise<{ success: boolean; data: WhatsAppLog[] }> {
    const params = new URLSearchParams()
    if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio)
    if (filtros?.data_fim) params.append('data_fim', filtros.data_fim)
    if (filtros?.status) params.append('status', filtros.status)
    if (filtros?.tipo) params.append('tipo', filtros.tipo)
    if (filtros?.aprovacao_id) params.append('aprovacao_id', filtros.aprovacao_id)

    const query = params.toString()
    return apiRequest(`/api/whatsapp-logs${query ? `?${query}` : ''}`)
  },

  /**
   * Obter estatísticas
   */
  async obterEstatisticas(filtros?: { data_inicio?: string; data_fim?: string }): Promise<{ success: boolean; data: EstatisticasWhatsApp }> {
    const params = new URLSearchParams()
    if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio)
    if (filtros?.data_fim) params.append('data_fim', filtros.data_fim)

    const query = params.toString()
    return apiRequest(`/api/whatsapp-logs/estatisticas${query ? `?${query}` : ''}`)
  },

  /**
   * Exportar logs em CSV
   */
  async exportarLogs(filtros?: FiltrosLogs): Promise<Blob> {
    const token = getAuthToken()
    const params = new URLSearchParams()
    if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio)
    if (filtros?.data_fim) params.append('data_fim', filtros.data_fim)
    if (filtros?.status) params.append('status', filtros.status)
    if (filtros?.tipo) params.append('tipo', filtros.tipo)

    const query = params.toString()
    const response = await fetch(`${API_URL}/api/whatsapp-logs/export${query ? `?${query}` : ''}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    })

    if (!response.ok) {
      throw new Error('Erro ao exportar logs')
    }

    return response.blob()
  },

  /**
   * Obter histórico de uma aprovação específica
   */
  async obterHistoricoAprovacao(aprovacaoId: number): Promise<{ success: boolean; data: WhatsAppLog[] }> {
    return apiRequest(`/api/aprovacoes/${aprovacaoId}/historico-whatsapp`)
  },
}

