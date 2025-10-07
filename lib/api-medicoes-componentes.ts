import { api } from './api'

export interface MedicaoComponente {
  id: number
  medicao_id: number
  componente_id: number
  quantidade_utilizada: number
  horas_utilizacao: number
  custo_unitario: number
  custo_total: number
  desgaste_percentual: number
  observacoes?: string
  created_at?: string
  updated_at?: string
  componente?: {
    id: number
    nome: string
    tipo: string
    modelo: string
    fabricante: string
    quantidade_disponivel: number
    quantidade_em_uso: number
  }
}

export interface MedicaoComponenteInput {
  medicao_id: number
  componente_id: number
  quantidade_utilizada?: number
  horas_utilizacao?: number
  custo_unitario?: number
  desgaste_percentual?: number
  observacoes?: string
}

export interface CalculosAutomaticos {
  custos_componentes: number
  eficiencia_operacional: number
  componentes_utilizados: number
}

export const medicoesComponentesApi = {
  /**
   * Listar todos os componentes de uma medição específica
   */
  listarComponentesMedicao: async (medicaoId: number): Promise<{ success: boolean; data: MedicaoComponente[] }> => {
    const response = await api.get(`/medicoes-componentes/${medicaoId}/componentes`)
    return response.data
  },

  /**
   * Adicionar um componente à medição
   */
  adicionarComponenteMedicao: async (dados: MedicaoComponenteInput): Promise<{ success: boolean; data: MedicaoComponente; calculos: CalculosAutomaticos; message: string }> => {
    const response = await api.post('/medicoes-componentes', dados)
    return response.data
  },

  /**
   * Atualizar dados de um componente na medição
   */
  atualizarComponenteMedicao: async (id: number, dados: Partial<MedicaoComponenteInput>): Promise<{ success: boolean; data: MedicaoComponente; calculos: CalculosAutomaticos; message: string }> => {
    const response = await api.put(`/medicoes-componentes/${id}`, dados)
    return response.data
  },

  /**
   * Remover um componente da medição
   */
  removerComponenteMedicao: async (id: number): Promise<{ success: boolean; calculos: CalculosAutomaticos; message: string }> => {
    const response = await api.delete(`/medicoes-componentes/${id}`)
    return response.data
  },

  /**
   * Buscar componente específico na medição por ID
   */
  buscarComponenteMedicao: async (id: number): Promise<{ success: boolean; data: MedicaoComponente }> => {
    const response = await api.get(`/medicoes-componentes/${id}`)
    return response.data
  },

  /**
   * Recalcular custos automáticos de uma medição
   */
  recalcularCustos: async (medicaoId: number): Promise<{ success: boolean; calculos: CalculosAutomaticos }> => {
    const response = await api.post(`/medicoes-componentes/recalcular/${medicaoId}`)
    return response.data
  },

  /**
   * Obter relatório de componentes por período
   */
  relatorioComponentes: async (dataInicio: string, dataFim: string, componenteId?: number): Promise<{ success: boolean; data: any[] }> => {
    const params = new URLSearchParams({
      data_inicio: dataInicio,
      data_fim: dataFim
    })
    
    if (componenteId) {
      params.append('componente_id', componenteId.toString())
    }

    const response = await api.get(`/medicoes-componentes/relatorio?${params}`)
    return response.data
  }
}
