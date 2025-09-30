import { api } from './api'

// Tipos para configurações de gruas
export interface ConfiguracaoGrua {
  id: number
  grua_id: string
  nome: string
  descricao?: string
  altura_maxima?: number
  alcance_maximo?: number
  capacidade_maxima?: number
  capacidade_ponta?: number
  velocidade_operacao?: number
  velocidade_rotacao?: number
  potencia_motor?: number
  consumo_energia?: number
  peso_total?: number
  dimensoes?: string
  tipo_operacao?: 'Manual' | 'Semi-automática' | 'Automática'
  nivel_automatizacao?: 'Básico' | 'Intermediário' | 'Avançado' | 'Total'
  certificacoes?: string[]
  normas_tecnicas?: string[]
  valor_configuracao: number
  custo_operacao_mensal: number
  eficiencia_energetica?: 'A' | 'B' | 'C' | 'D' | 'E'
  status: 'Ativa' | 'Inativa' | 'Em desenvolvimento'
  observacoes?: string
  anexos?: any
  data_criacao: string
  data_ultima_atualizacao: string
  created_at: string
  updated_at: string
  created_by?: number
  updated_by?: number
  grua?: {
    id: string
    name: string
    modelo: string
    fabricante: string
  }
  componentes?: Array<{
    id: number
    quantidade_necessaria: number
    posicao_instalacao?: string
    ordem_instalacao?: number
    observacoes_instalacao?: string
    componente: {
      id: number
      nome: string
      tipo: string
      modelo?: string
      fabricante?: string
      status: string
      quantidade_disponivel: number
      valor_unitario: number
      unidade_medida: string
    }
  }>
}

export interface ComponenteConfiguracao {
  configuracao_id: number
  componente_id: number
  quantidade_necessaria: number
  posicao_instalacao?: string
  ordem_instalacao?: number
  observacoes_instalacao?: string
}

export interface ConfiguracaoFilters {
  grua_id?: string
  status?: string
  tipo_operacao?: string
  page?: number
  limit?: number
  search?: string
}

export interface ConfiguracaoResponse {
  success: boolean
  data: ConfiguracaoGrua[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ValorCalculado {
  valor_total_componentes: number
  valor_configuracao: number
  valor_total: number
  detalhes: Array<{
    componente_id: number
    nome: string
    quantidade: number
    valor_unitario: number
    valor_total: number
  }>
}

// API de Configurações
export const apiConfiguracoes = {
  // Listar configurações com filtros
  async listar(filters: ConfiguracaoFilters = {}): Promise<ConfiguracaoResponse> {
    const params = new URLSearchParams()
    
    if (filters.grua_id) params.append('grua_id', filters.grua_id)
    if (filters.status) params.append('status', filters.status)
    if (filters.tipo_operacao) params.append('tipo_operacao', filters.tipo_operacao)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/grua-configuracoes?${params.toString()}`)
    return response.data
  },

  // Obter configuração por ID
  async obter(id: number): Promise<{ success: boolean; data: ConfiguracaoGrua }> {
    const response = await api.get(`/grua-configuracoes/${id}`)
    return response.data
  },

  // Criar nova configuração
  async criar(dados: Partial<ConfiguracaoGrua>): Promise<{ success: boolean; data: ConfiguracaoGrua; message: string }> {
    const response = await api.post('/grua-configuracoes', dados)
    return response.data
  },

  // Atualizar configuração
  async atualizar(id: number, dados: Partial<ConfiguracaoGrua>): Promise<{ success: boolean; data: ConfiguracaoGrua; message: string }> {
    const response = await api.put(`/grua-configuracoes/${id}`, dados)
    return response.data
  },

  // Excluir configuração
  async excluir(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/grua-configuracoes/${id}`)
    return response.data
  },

  // Adicionar componente à configuração
  async adicionarComponente(configuracaoId: number, componente: ComponenteConfiguracao): Promise<{ success: boolean; data: any; message: string }> {
    const response = await api.post(`/grua-configuracoes/${configuracaoId}/componentes`, componente)
    return response.data
  },

  // Remover componente da configuração
  async removerComponente(configuracaoId: number, componenteId: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/grua-configuracoes/${configuracaoId}/componentes/${componenteId}`)
    return response.data
  },

  // Calcular valor da configuração
  async calcularValor(configuracaoId: number): Promise<{ success: boolean; data: ValorCalculado }> {
    const response = await api.post(`/grua-configuracoes/${configuracaoId}/calcular-valor`)
    return response.data
  },

  // Buscar configurações por grua
  async buscarPorGrua(gruaId: string, filters: Omit<ConfiguracaoFilters, 'grua_id'> = {}): Promise<ConfiguracaoResponse> {
    return this.listar({ ...filters, grua_id: gruaId })
  }
}

export default apiConfiguracoes
