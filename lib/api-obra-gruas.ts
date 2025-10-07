import { api } from './api'

export interface ObraGruaConfiguracao {
  id: number
  obra_id: number
  grua_id: string
  posicao_x?: number
  posicao_y?: number
  posicao_z?: number
  angulo_rotacao?: number
  alcance_operacao?: number
  area_cobertura?: any
  data_instalacao?: string
  data_remocao?: string
  status: 'ativa' | 'inativa' | 'manutencao' | 'removida'
  observacoes?: string
  created_at?: string
  updated_at?: string
  grua?: {
    id: string
    name: string
    modelo: string
    fabricante: string
    tipo: string
    capacidade: string
  }
  obra?: {
    id: number
    nome: string
    endereco: string
  }
}

export interface ObraGruaConfiguracaoInput {
  obra_id: number
  grua_id: string
  posicao_x?: number
  posicao_y?: number
  posicao_z?: number
  angulo_rotacao?: number
  alcance_operacao?: number
  area_cobertura?: any
  data_instalacao?: string
  observacoes?: string
}

export const obraGruasApi = {
  /**
   * Listar todas as gruas de uma obra específica
   */
  listarGruasObra: async (obraId: number): Promise<{ success: boolean; data: ObraGruaConfiguracao[] }> => {
    const response = await api.get(`/obra-gruas/${obraId}`)
    return response.data
  },

  /**
   * Adicionar uma grua à obra
   */
  adicionarGruaObra: async (dados: ObraGruaConfiguracaoInput): Promise<{ success: boolean; data: ObraGruaConfiguracao; message: string }> => {
    const response = await api.post('/obra-gruas', dados)
    return response.data
  },

  /**
   * Atualizar configuração de uma grua na obra
   */
  atualizarConfiguracao: async (id: number, dados: Partial<ObraGruaConfiguracaoInput>): Promise<{ success: boolean; data: ObraGruaConfiguracao; message: string }> => {
    const response = await api.put(`/obra-gruas/${id}`, dados)
    return response.data
  },

  /**
   * Remover uma grua da obra (marca como removida)
   */
  removerGruaObra: async (id: number): Promise<{ success: boolean; data: ObraGruaConfiguracao; message: string }> => {
    const response = await api.delete(`/obra-gruas/${id}`)
    return response.data
  },

  /**
   * Buscar configuração específica por ID
   */
  buscarConfiguracao: async (id: number): Promise<{ success: boolean; data: ObraGruaConfiguracao }> => {
    const response = await api.get(`/obra-gruas/configuracao/${id}`)
    return response.data
  },

  /**
   * Listar todas as obras onde uma grua está ativa
   */
  listarObrasGrua: async (gruaId: string): Promise<{ success: boolean; data: ObraGruaConfiguracao[] }> => {
    const response = await api.get(`/obra-gruas/grua/${gruaId}`)
    return response.data
  }
}
