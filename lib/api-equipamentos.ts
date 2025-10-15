// API de Equipamentos integrada com backend real

import api from './api'

// Interfaces
export interface Equipamento {
  id: number
  nome: string
  codigo: string
  tipo: string
  categoria: string
  marca?: string
  modelo?: string
  numero_serie?: string
  status: 'ativo' | 'inativo' | 'manutencao' | 'vendido' | 'descartado'
  data_aquisicao: string
  valor_aquisicao: number
  vida_util_meses: number
  depreciacao_mensal: number
  valor_atual: number
  localizacao?: string
  responsavel_id?: number
  responsavel_nome?: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface EquipamentoCreate {
  nome: string
  codigo: string
  tipo: string
  categoria: string
  marca?: string
  modelo?: string
  numero_serie?: string
  status?: 'ativo' | 'inativo' | 'manutencao' | 'vendido' | 'descartado'
  data_aquisicao: string
  valor_aquisicao: number
  vida_util_meses: number
  localizacao?: string
  responsavel_id?: number
  observacoes?: string
}

export interface EquipamentoUpdate {
  nome?: string
  codigo?: string
  tipo?: string
  categoria?: string
  marca?: string
  modelo?: string
  numero_serie?: string
  status?: 'ativo' | 'inativo' | 'manutencao' | 'vendido' | 'descartado'
  data_aquisicao?: string
  valor_aquisicao?: number
  vida_util_meses?: number
  localizacao?: string
  responsavel_id?: number
  observacoes?: string
}

export interface EquipamentoFilters {
  tipo?: string
  categoria?: string
  status?: string
  marca?: string
  responsavel_id?: number
  localizacao?: string
  search?: string
  page?: number
  limit?: number
}

export interface EquipamentoStats {
  total_equipamentos: number
  valor_total: number
  por_tipo: Record<string, number>
  por_categoria: Record<string, number>
  por_status: Record<string, number>
  por_marca: Record<string, number>
  depreciacao_total: number
  valor_atual_total: number
}

// API functions
export const apiEquipamentos = {
  // Listar equipamentos
  async listar(filters?: EquipamentoFilters) {
    const params = new URLSearchParams()
    
    if (filters?.tipo) params.append('tipo', filters.tipo)
    if (filters?.categoria) params.append('categoria', filters.categoria)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.marca) params.append('marca', filters.marca)
    if (filters?.responsavel_id) params.append('responsavel_id', filters.responsavel_id.toString())
    if (filters?.localizacao) params.append('localizacao', filters.localizacao)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/equipamentos?${params.toString()}`)
    return response.data
  },

  // Obter equipamento por ID
  async obter(id: number) {
    const response = await api.get(`/equipamentos/${id}`)
    return response.data
  },

  // Criar equipamento
  async criar(dados: EquipamentoCreate) {
    const response = await api.post('/equipamentos', dados)
    return response.data
  },

  // Atualizar equipamento
  async atualizar(id: number, dados: EquipamentoUpdate) {
    const response = await api.put(`/equipamentos/${id}`, dados)
    return response.data
  },

  // Excluir equipamento
  async excluir(id: number) {
    const response = await api.delete(`/equipamentos/${id}`)
    return response.data
  },

  // Atualizar status
  async atualizarStatus(id: number, status: string) {
    const response = await api.patch(`/equipamentos/${id}/status`, { status })
    return response.data
  },

  // Calcular depreciação
  async calcularDepreciacao(id: number) {
    const response = await api.post(`/equipamentos/${id}/calcular-depreciacao`)
    return response.data
  },

  // Obter equipamentos por responsável
  async obterPorResponsavel(responsavel_id: number) {
    const response = await api.get(`/equipamentos/responsavel/${responsavel_id}`)
    return response.data
  },

  // Obter equipamentos por localização
  async obterPorLocalizacao(localizacao: string) {
    const response = await api.get(`/equipamentos/localizacao/${localizacao}`)
    return response.data
  },

  // Obter equipamentos em manutenção
  async obterEmManutencao() {
    const response = await api.get('/equipamentos/manutencao')
    return response.data
  },

  // Obter equipamentos próximos do vencimento
  async obterProximosVencimento(dias: number = 30) {
    const response = await api.get(`/equipamentos/proximos-vencimento?dias=${dias}`)
    return response.data
  },

  // Obter estatísticas
  async obterEstatisticas(filters?: {
    tipo?: string
    categoria?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.tipo) params.append('tipo', filters.tipo)
    if (filters?.categoria) params.append('categoria', filters.categoria)

    const response = await api.get(`/equipamentos/stats?${params.toString()}`)
    return response.data
  },

  // Gerar relatório
  async gerarRelatorio(filters: {
    formato?: 'pdf' | 'excel'
    agrupar_por?: 'tipo' | 'categoria' | 'status' | 'marca'
    incluir_depreciacao?: boolean
  }) {
    const response = await api.post('/equipamentos/relatorio', filters, {
      responseType: 'blob'
    })
    return response.data
  },

  // Transferir equipamento
  async transferir(id: number, novo_responsavel_id: number, nova_localizacao?: string) {
    const response = await api.post(`/equipamentos/${id}/transferir`, {
      novo_responsavel_id,
      nova_localizacao
    })
    return response.data
  },

  // Obter histórico de manutenção
  async obterHistoricoManutencao(id: number) {
    const response = await api.get(`/equipamentos/${id}/historico-manutencao`)
    return response.data
  }
}

export default apiEquipamentos
