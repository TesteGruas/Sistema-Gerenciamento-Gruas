// API de Itens de Custos Mensais

import api from './api'

export interface ItemCustoMensal {
  id: number
  codigo: string
  descricao: string
  unidade: 'mês' | 'und' | 'und.' | 'km' | 'h' | 'hora' | 'kg' | 'm²' | 'm³'
  tipo: 'contrato' | 'aditivo'
  categoria?: 'funcionario' | 'horas_extras' | 'servico' | 'produto'
  ativo: boolean
  observacoes?: string
  created_at: string
  updated_at: string
  created_by?: number
  updated_by?: number
}

export interface ItemCustoMensalCreate {
  codigo: string
  descricao: string
  unidade: 'mês' | 'und' | 'und.' | 'km' | 'h' | 'hora' | 'kg' | 'm²' | 'm³'
  tipo: 'contrato' | 'aditivo'
  categoria?: 'funcionario' | 'horas_extras' | 'servico' | 'produto'
  ativo?: boolean
  observacoes?: string
}

export interface ItemCustoMensalUpdate {
  codigo?: string
  descricao?: string
  unidade?: 'mês' | 'und' | 'und.' | 'km' | 'h' | 'hora' | 'kg' | 'm²' | 'm³'
  tipo?: 'contrato' | 'aditivo'
  categoria?: 'funcionario' | 'horas_extras' | 'servico' | 'produto'
  ativo?: boolean
  observacoes?: string
}

export interface ItemCustoMensalFilters {
  ativo?: boolean
  tipo?: 'contrato' | 'aditivo'
  categoria?: 'funcionario' | 'horas_extras' | 'servico' | 'produto'
  search?: string
}

export const itensCustosMensaisApi = {
  /**
   * Lista todos os itens de custos mensais
   */
  async listar(filters?: ItemCustoMensalFilters): Promise<ItemCustoMensal[]> {
    const params = new URLSearchParams()
    if (filters?.ativo !== undefined) params.append('ativo', String(filters.ativo))
    if (filters?.tipo) params.append('tipo', filters.tipo)
    if (filters?.categoria) params.append('categoria', filters.categoria)
    if (filters?.search) params.append('search', filters.search)

    const response = await api.get(`/itens-custos-mensais?${params.toString()}`)
    return response.data.data
  },

  /**
   * Busca um item específico por ID
   */
  async obter(id: number): Promise<ItemCustoMensal> {
    const response = await api.get(`/itens-custos-mensais/${id}`)
    return response.data.data
  },

  /**
   * Cria um novo item
   */
  async criar(item: ItemCustoMensalCreate): Promise<ItemCustoMensal> {
    const response = await api.post('/itens-custos-mensais', item)
    return response.data.data
  },

  /**
   * Atualiza um item existente
   */
  async atualizar(id: number, item: ItemCustoMensalUpdate): Promise<ItemCustoMensal> {
    const response = await api.put(`/itens-custos-mensais/${id}`, item)
    return response.data.data
  },

  /**
   * Deleta um item (soft delete - marca como inativo)
   */
  async deletar(id: number): Promise<void> {
    await api.delete(`/itens-custos-mensais/${id}`)
  }
}

