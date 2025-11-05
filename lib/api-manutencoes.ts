// API client para manutenções
import { buildApiUrl, fetchWithAuth } from './api.ts'

// ==================== ORDENS DE MANUTENÇÃO ====================

export interface ManutencaoItemBackend {
  id: string
  manutencao_id: string
  produto_id?: string
  descricao: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  created_at: string
  produtos?: {
    id: string
    nome: string
  }
}

export interface ManutencaoAnexoBackend {
  id: string
  manutencao_id: string
  arquivo: string
  tipo: string
  descricao?: string
  created_at: string
}

export interface ManutencaoOrdemBackend {
  id: string
  grua_id: string
  obra_id?: number
  tipo: 'preventiva' | 'corretiva' | 'preditiva' | 'emergencial'
  descricao: string
  responsavel_tecnico_id?: number
  data_prevista?: string
  data_inicio?: string
  data_fim?: string
  prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  status: string
  horas_trabalhadas?: number
  custo_mao_obra?: number
  custo_total: number
  observacoes?: string
  created_at: string
  updated_at: string
  gruas?: {
    id: string
    name: string
    modelo: string
  }
  obras?: {
    id: number
    nome: string
  }
  funcionarios?: {
    id: number
    nome: string
    cargo: string
  }
  itens?: ManutencaoItemBackend[]
  anexos?: ManutencaoAnexoBackend[]
}

export interface ManutencaoOrdemCreateData {
  grua_id: string
  obra_id?: number
  tipo: 'preventiva' | 'corretiva' | 'preditiva' | 'emergencial'
  descricao: string
  responsavel_tecnico_id?: number
  data_prevista?: string
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica'
  itens?: Array<{
    produto_id?: string
    descricao: string
    quantidade: number
    valor_unitario: number
  }>
  anexos?: Array<{
    arquivo: string
    tipo?: string
    descricao?: string
  }>
}

export interface ManutencaoOrdemUpdateData {
  tipo?: 'preventiva' | 'corretiva' | 'preditiva' | 'emergencial'
  descricao?: string
  responsavel_tecnico_id?: number
  data_prevista?: string
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica'
  status?: string
  data_inicio?: string
  data_fim?: string
  horas_trabalhadas?: number
  custo_mao_obra?: number
  observacoes?: string
}

export interface ManutencaoItemCreateData {
  produto_id?: string
  descricao: string
  quantidade: number
  valor_unitario: number
}

export interface ManutencoesResponse {
  success: boolean
  data: ManutencaoOrdemBackend[]
  page?: number
  limit?: number
}

export interface ManutencaoOrdemResponse {
  success: boolean
  data: ManutencaoOrdemBackend
}

export interface ManutencaoItemResponse {
  success: boolean
  data: ManutencaoItemBackend
}

// ==================== AGENDA PREVENTIVA ====================

export interface AgendaPreventivaBackend {
  id: string
  grua_id: string
  tipo_manutencao: string
  intervalo_tipo: 'horas' | 'dias' | 'meses' | 'km'
  intervalo_valor: number
  ultima_manutencao_horimetro?: number
  ultima_manutencao_data?: string
  proxima_manutencao_horimetro?: number
  proxima_manutencao_data?: string
  ativo: boolean
  created_at: string
  updated_at: string
  gruas?: {
    id: string
    name: string
    modelo: string
    horas_operacao?: number
  }
}

export interface AgendaPreventivaCreateData {
  grua_id: string
  tipo_manutencao: string
  intervalo_tipo: 'horas' | 'dias' | 'meses' | 'km'
  intervalo_valor: number
  ultima_manutencao_horimetro?: number
  ultima_manutencao_data?: string
}

export interface AgendaPreventivaUpdateData {
  ultima_manutencao_horimetro?: number
  ultima_manutencao_data?: string
  ativo?: boolean
}

export interface AgendaPreventivaResponse {
  success: boolean
  data: AgendaPreventivaBackend
}

export interface AgendaPreventivaListResponse {
  success: boolean
  data: AgendaPreventivaBackend[]
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

export const manutencoesApi = {
  // ==================== ORDENS DE MANUTENÇÃO ====================
  ordens: {
    // Listar ordens de manutenção
    async listar(params?: {
      grua_id?: string
      obra_id?: number
      tipo?: string
      status?: string
      page?: number
      limit?: number
    }): Promise<ManutencoesResponse> {
      let url = buildApiUrl('manutencoes')
      const queryParams = new URLSearchParams()
      if (params?.grua_id) queryParams.append('grua_id', params.grua_id)
      if (params?.obra_id) queryParams.append('obra_id', params.obra_id.toString())
      if (params?.tipo) queryParams.append('tipo', params.tipo)
      if (params?.status) queryParams.append('status', params.status)
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`
      }
      return apiRequest(url)
    },

    // Obter detalhes da ordem de manutenção
    async obter(ordemId: string): Promise<ManutencaoOrdemResponse> {
      const url = buildApiUrl(`manutencoes/${ordemId}`)
      return apiRequest(url)
    },

    // Criar ordem de manutenção
    async criar(data: ManutencaoOrdemCreateData): Promise<ManutencaoOrdemResponse> {
      const url = buildApiUrl('manutencoes')
      return apiRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    },

    // Atualizar ordem de manutenção
    async atualizar(ordemId: string, data: ManutencaoOrdemUpdateData): Promise<ManutencaoOrdemResponse> {
      const url = buildApiUrl(`manutencoes/${ordemId}`)
      return apiRequest(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    },

    // Adicionar item à ordem de manutenção
    async adicionarItem(ordemId: string, data: ManutencaoItemCreateData): Promise<ManutencaoItemResponse> {
      const url = buildApiUrl(`manutencoes/${ordemId}/itens`)
      return apiRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    },
  },

  // ==================== AGENDA PREVENTIVA ====================
  agendaPreventiva: {
    // Listar agenda preventiva da grua
    async listar(gruaId: string): Promise<AgendaPreventivaListResponse> {
      const url = buildApiUrl(`manutencoes/agenda-preventiva/${gruaId}`)
      return apiRequest(url)
    },

    // Listar manutenções preventivas próximas (30 dias)
    async listarProximas(): Promise<AgendaPreventivaListResponse> {
      const url = buildApiUrl('manutencoes/agenda-preventiva/proximas')
      return apiRequest(url)
    },

    // Criar registro na agenda preventiva
    async criar(data: AgendaPreventivaCreateData): Promise<AgendaPreventivaResponse> {
      const url = buildApiUrl('manutencoes/agenda-preventiva')
      return apiRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    },

    // Atualizar agenda preventiva
    async atualizar(agendaId: string, data: AgendaPreventivaUpdateData): Promise<AgendaPreventivaResponse> {
      const url = buildApiUrl(`manutencoes/agenda-preventiva/${agendaId}`)
      return apiRequest(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    },
  },
}

// Funções de conversão (se necessário para compatibilidade com frontend)
export const converterManutencaoOrdemBackendParaFrontend = (
  backend: ManutencaoOrdemBackend
): ManutencaoOrdemBackend => {
  return backend
}

export const converterAgendaPreventivaBackendParaFrontend = (
  backend: AgendaPreventivaBackend
): AgendaPreventivaBackend => {
  return backend
}

export default manutencoesApi

