// API client para checklist diário
import { buildApiUrl, fetchWithAuth } from './api.ts'

// ==================== MODELOS DE CHECKLIST ====================

export interface ChecklistItemBackend {
  id: string
  modelo_id: string
  ordem: number
  categoria: string
  descricao: string
  obrigatorio: boolean
  permite_anexo: boolean
  created_at: string
}

export interface ChecklistModeloBackend {
  id: string
  obra_id: number
  nome: string
  descricao?: string
  ativo: boolean
  created_at: string
  updated_at: string
  itens?: ChecklistItemBackend[]
}

export interface ChecklistModeloCreateData {
  obra_id: number
  nome: string
  descricao?: string
  itens: Array<{
    ordem: number
    categoria: string
    descricao: string
    obrigatorio?: boolean
    permite_anexo?: boolean
  }>
}

export interface ChecklistModeloUpdateData {
  nome?: string
  descricao?: string
  ativo?: boolean
  itens?: Array<{
    ordem: number
    categoria: string
    descricao: string
    obrigatorio?: boolean
    permite_anexo?: boolean
  }>
}

export interface ChecklistModelosResponse {
  success: boolean
  data: ChecklistModeloBackend[]
}

export interface ChecklistModeloResponse {
  success: boolean
  data: ChecklistModeloBackend
}

// ==================== CHECKLISTS DIÁRIOS ====================

export interface ChecklistRespostaBackend {
  id: string
  checklist_id: string
  item_id: string
  status: 'ok' | 'nao_conforme' | 'nao_aplicavel'
  observacao?: string
  plano_acao?: string
  responsavel_correcao_id?: number
  prazo_correcao?: string
  status_correcao?: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'
  created_at: string
  checklist_itens?: ChecklistItemBackend
  funcionarios?: {
    id: number
    nome: string
  }
  anexos?: ChecklistAnexoBackend[]
}

export interface ChecklistAnexoBackend {
  id: string
  resposta_id: string
  arquivo: string
  tipo: string
  created_at: string
}

export interface ChecklistDiarioBackend {
  id: string
  obra_id: number
  modelo_id: string
  data: string
  responsavel_id: number
  status: string
  created_at: string
  checklists_modelos?: {
    nome: string
    descricao?: string
  }
  funcionarios?: {
    id: number
    nome: string
    cargo: string
  }
  respostas?: ChecklistRespostaBackend[]
}

export interface ChecklistDiarioCreateData {
  obra_id: number
  modelo_id: string
  data: string
  responsavel_id: number
  respostas: Array<{
    item_id: string
    status: 'ok' | 'nao_conforme' | 'nao_aplicavel'
    observacao?: string
    plano_acao?: string
    responsavel_correcao_id?: number
    prazo_correcao?: string
    anexos?: string[]
  }>
}

export interface ChecklistsDiariosResponse {
  success: boolean
  data: ChecklistDiarioBackend[]
}

export interface ChecklistDiarioResponse {
  success: boolean
  data: ChecklistDiarioBackend
}

// ==================== NÃO CONFORMIDADES ====================

export interface NaoConformidadeBackend {
  id: string
  checklist_id: string
  item_id: string
  status: 'ok' | 'nao_conforme' | 'nao_aplicavel'
  observacao?: string
  plano_acao?: string
  responsavel_correcao_id?: number
  prazo_correcao?: string
  status_correcao?: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'
  created_at: string
  checklists_diarios?: {
    obra_id: number
    data: string
    funcionarios?: {
      id: number
      nome: string
    }
  }
  checklist_itens?: {
    categoria: string
    descricao: string
  }
  funcionarios?: {
    id: number
    nome: string
    cargo: string
  }
}

export interface NaoConformidadeUpdateStatusData {
  status_correcao: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'
}

export interface NaoConformidadesResponse {
  success: boolean
  data: NaoConformidadeBackend[]
}

export interface NaoConformidadeResponse {
  success: boolean
  data: NaoConformidadeBackend
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

export const checklistDiarioApi = {
  // ==================== MODELOS ====================
  modelos: {
    // Listar modelos de checklist da obra
    async listar(obraId: number): Promise<ChecklistModelosResponse> {
      const url = buildApiUrl(`checklist-diario/modelos/${obraId}`)
      return apiRequest(url)
    },

    // Criar modelo de checklist
    async criar(data: ChecklistModeloCreateData): Promise<ChecklistModeloResponse> {
      const url = buildApiUrl('checklist-diario/modelos')
      return apiRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    },

    // Atualizar modelo de checklist
    async atualizar(modeloId: string, data: ChecklistModeloUpdateData): Promise<ChecklistModeloResponse> {
      const url = buildApiUrl(`checklist-diario/modelos/${modeloId}`)
      return apiRequest(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    },

    // Desativar modelo de checklist
    async excluir(modeloId: string): Promise<{ success: boolean; message: string }> {
      const url = buildApiUrl(`checklist-diario/modelos/${modeloId}`)
      return apiRequest(url, {
        method: 'DELETE',
      })
    },
  },

  // ==================== CHECKLISTS DIÁRIOS ====================
  checklists: {
    // Listar checklists diários da obra
    async listar(obraId: number, params?: { data_inicio?: string; data_fim?: string }): Promise<ChecklistsDiariosResponse> {
      let url = buildApiUrl(`checklist-diario/${obraId}`)
      if (params?.data_inicio || params?.data_fim) {
        const queryParams = new URLSearchParams()
        if (params.data_inicio) queryParams.append('data_inicio', params.data_inicio)
        if (params.data_fim) queryParams.append('data_fim', params.data_fim)
        url += `?${queryParams.toString()}`
      }
      return apiRequest(url)
    },

    // Obter detalhes completos do checklist
    async obterDetalhes(checklistId: string): Promise<ChecklistDiarioResponse> {
      const url = buildApiUrl(`checklist-diario/detalhes/${checklistId}`)
      return apiRequest(url)
    },

    // Criar checklist diário
    async criar(data: ChecklistDiarioCreateData): Promise<ChecklistDiarioResponse> {
      const url = buildApiUrl('checklist-diario')
      return apiRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    },
  },

  // ==================== NÃO CONFORMIDADES ====================
  naoConformidades: {
    // Listar não conformidades pendentes da obra
    async listar(obraId: number): Promise<NaoConformidadesResponse> {
      const url = buildApiUrl(`checklist-diario/nc/${obraId}`)
      return apiRequest(url)
    },

    // Atualizar status de correção de não conformidade
    async atualizarStatus(naoConformidadeId: string, data: NaoConformidadeUpdateStatusData): Promise<NaoConformidadeResponse> {
      const url = buildApiUrl(`checklist-diario/nc/${naoConformidadeId}/atualizar-status`)
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
export const converterChecklistModeloBackendParaFrontend = (
  backend: ChecklistModeloBackend
): ChecklistModeloBackend => {
  return backend
}

export const converterChecklistDiarioBackendParaFrontend = (
  backend: ChecklistDiarioBackend
): ChecklistDiarioBackend => {
  return backend
}

export const converterNaoConformidadeBackendParaFrontend = (
  backend: NaoConformidadeBackend
): NaoConformidadeBackend => {
  return backend
}

export default checklistDiarioApi

