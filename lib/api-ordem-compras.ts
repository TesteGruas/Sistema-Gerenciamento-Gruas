// API client para ordem de compras
import { buildApiUrl, fetchWithAuth } from './api.ts'

// ==================== ORDEM DE COMPRAS ====================

export interface AprovacaoOrdemCompraBackend {
  id: string
  ordem_id: string
  etapa: 'orcamento' | 'financeiro' | 'pagamento'
  aprovador_id: number
  status: 'pendente' | 'aprovado' | 'rejeitado'
  comentarios?: string
  data_aprovacao?: string
  created_at: string
  usuarios?: {
    id: number
    nome: string
    email: string
  }
}

export interface OrdemCompraBackend {
  id: string
  solicitante_id: number
  descricao: string
  valor_total: number
  aprovador_orcamento_id?: number
  responsavel_pagamento_id?: number
  aprovador_final_id?: number
  status: 'rascunho' | 'aguardando_orcamento' | 'orcamento_aprovado' | 'enviado_financeiro' | 'pagamento_registrado' | 'finalizada' | 'cancelada'
  created_at: string
  updated_at: string
  funcionarios?: {
    id: number
    nome: string
    cargo: string
  }
  usuarios?: {
    id: number
    nome: string
    email: string
  }
  aprovacoes?: AprovacaoOrdemCompraBackend[]
}

export interface OrdemCompraCreateData {
  solicitante_id: number
  descricao: string
  valor_total?: number
  aprovador_orcamento_id?: number
  responsavel_pagamento_id?: number
  aprovador_final_id?: number
}

export interface OrdemCompraUpdateData {
  descricao?: string
  valor_total?: number
  aprovador_orcamento_id?: number
  responsavel_pagamento_id?: number
  aprovador_final_id?: number
}

export interface OrdemCompraAprovarOrcamentoData {
  comentarios?: string
}

export interface OrdemCompraRejeitarData {
  etapa: 'orcamento' | 'financeiro' | 'pagamento'
  comentarios: string
}

export interface OrdemComprasResponse {
  success: boolean
  data: OrdemCompraBackend[]
  page?: number
  limit?: number
}

export interface OrdemCompraResponse {
  success: boolean
  data: OrdemCompraBackend
}

export interface OrdemComprasPendentesResponse {
  success: boolean
  data: Array<{
    id: string
    etapa: string
    status: string
    ordem_compras: OrdemCompraBackend
  }>
}

// ==================== FUNÇÕES AUXILIARES ====================

const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetchWithAuth(url, options)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API request error:', error)
    throw error
  }
}

// ==================== API FUNCTIONS ====================

export const ordemComprasApi = {
  // Listar ordens de compras
  async listar(params?: {
    status?: string
    solicitante_id?: number
    page?: number
    limit?: number
  }): Promise<OrdemComprasResponse> {
    let url = buildApiUrl('ordem-compras')
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.solicitante_id) queryParams.append('solicitante_id', params.solicitante_id.toString())
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`
    }
    return apiRequest(url)
  },

  // Obter detalhes da ordem de compras
  async obter(ordemId: string): Promise<OrdemCompraResponse> {
    const url = buildApiUrl(`ordem-compras/${ordemId}`)
    return apiRequest(url)
  },

  // Criar ordem de compras
  async criar(data: OrdemCompraCreateData): Promise<OrdemCompraResponse> {
    const url = buildApiUrl('ordem-compras')
    return apiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  },

  // Atualizar ordem de compras
  async atualizar(ordemId: string, data: OrdemCompraUpdateData): Promise<OrdemCompraResponse> {
    const url = buildApiUrl(`ordem-compras/${ordemId}`)
    return apiRequest(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  },

  // Enviar ordem para aprovação de orçamento
  async enviarOrcamento(ordemId: string): Promise<OrdemCompraResponse> {
    const url = buildApiUrl(`ordem-compras/${ordemId}/enviar-orcamento`)
    return apiRequest(url, {
      method: 'POST',
    })
  },

  // Aprovar orçamento da ordem
  async aprovarOrcamento(ordemId: string, data?: OrdemCompraAprovarOrcamentoData): Promise<OrdemCompraResponse> {
    const url = buildApiUrl(`ordem-compras/${ordemId}/aprovar-orcamento`)
    return apiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data || {}),
    })
  },

  // Enviar ordem para o financeiro
  async enviarFinanceiro(ordemId: string): Promise<OrdemCompraResponse> {
    const url = buildApiUrl(`ordem-compras/${ordemId}/enviar-financeiro`)
    return apiRequest(url, {
      method: 'POST',
    })
  },

  // Registrar pagamento da ordem
  async registrarPagamento(ordemId: string): Promise<OrdemCompraResponse> {
    const url = buildApiUrl(`ordem-compras/${ordemId}/registrar-pagamento`)
    return apiRequest(url, {
      method: 'POST',
    })
  },

  // Aprovação final da ordem
  async aprovarFinal(ordemId: string, data?: OrdemCompraAprovarOrcamentoData): Promise<OrdemCompraResponse> {
    const url = buildApiUrl(`ordem-compras/${ordemId}/aprovar-final`)
    return apiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data || {}),
    })
  },

  // Rejeitar ordem em qualquer etapa
  async rejeitar(ordemId: string, data: OrdemCompraRejeitarData): Promise<OrdemCompraResponse> {
    const url = buildApiUrl(`ordem-compras/${ordemId}/rejeitar`)
    return apiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  },

  // Listar ordens pendentes de aprovação do usuário logado
  async listarPendentesAprovacao(): Promise<OrdemComprasPendentesResponse> {
    const url = buildApiUrl('ordem-compras/pendentes/aprovacao')
    return apiRequest(url)
  },
}

// Funções de conversão (se necessário para compatibilidade com frontend)
export const converterOrdemCompraBackendParaFrontend = (
  backend: OrdemCompraBackend
): OrdemCompraBackend => {
  return backend
}

export default ordemComprasApi

