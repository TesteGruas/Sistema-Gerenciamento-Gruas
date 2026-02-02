import { api } from './api'

// Tipos para componentes de gruas
export interface ComponenteGrua {
  id: number
  grua_id: string
  nome: string
  tipo: 'Estrutural' | 'Hidráulico' | 'Elétrico' | 'Mecânico' | 'Segurança' | 'Outro'
  modelo?: string
  fabricante?: string
  numero_serie?: string
  capacidade?: string
  unidade_medida: string
  quantidade_total: number
  quantidade_disponivel: number
  quantidade_em_uso: number
  quantidade_danificada: number
  status: 'Disponível' | 'Em uso' | 'Danificado' | 'Manutenção' | 'Descontinuado' | 'Devolvido'
  localizacao?: string
  localizacao_tipo?: 'Obra X' | 'Almoxarifado' | 'Oficina' | 'Em trânsito' | 'Em manutenção'
  obra_id?: number
  dimensoes_altura?: number
  dimensoes_largura?: number
  dimensoes_comprimento?: number
  dimensoes_peso?: number
  vida_util_percentual?: number
  valor_unitario: number
  data_instalacao?: string
  data_ultima_manutencao?: string
  data_proxima_manutencao?: string
  observacoes?: string
  anexos?: any
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
  obra?: {
    id: number
    nome: string
  }
}

export interface MovimentacaoComponente {
  tipo_movimentacao: 'Instalação' | 'Remoção' | 'Manutenção' | 'Substituição' | 'Transferência' | 'Ajuste'
  quantidade_movimentada: number
  motivo: string
  obra_id?: number
  grua_origem_id?: string
  grua_destino_id?: string
  funcionario_responsavel_id?: number
  observacoes?: string
  anexos?: any
}

export interface ComponenteFilters {
  grua_id?: string
  tipo?: string
  status?: string
  page?: number
  limit?: number
  search?: string
}

export interface ComponenteResponse {
  success: boolean
  data: ComponenteGrua[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface MovimentacaoResponse {
  success: boolean
  data: {
    componente: ComponenteGrua
    movimentacao: any
  }
  message: string
}

export interface ComponenteAgrupadoPorGrua {
  grua: {
    id: string
    name: string
    modelo: string
    fabricante: string
    tipo: string
  }
  componentes: Array<{
    id: number
    nome: string
    tipo: string
    modelo?: string
    fabricante?: string
    unidade_medida: string
    quantidade_total: number
    quantidade_disponivel: number
    quantidade_em_uso: number
    quantidade_danificada: number
    status: string
    localizacao?: string
    localizacao_tipo?: string
    valor_unitario: number
    componente_estoque_id: string | number
    valor_total: number
  }>
  total_componentes: number
  total_quantidade: number
  total_valor: number
}

export interface ComponentesAgrupadosResponse {
  success: boolean
  data: ComponenteAgrupadoPorGrua[]
  total: number
}

// API de Componentes
export const apiComponentes = {
  // Listar componentes com filtros
  async listar(filters: ComponenteFilters = {}): Promise<ComponenteResponse> {
    const params = new URLSearchParams()
    
    if (filters.grua_id) params.append('grua_id', filters.grua_id)
    if (filters.tipo) params.append('tipo', filters.tipo)
    if (filters.status) params.append('status', filters.status)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.search) params.append('search', filters.search)

    const response = await api.get(`/grua-componentes?${params.toString()}`)
    return response.data
  },

  // Obter componente por ID
  async obter(id: number): Promise<{ success: boolean; data: ComponenteGrua }> {
    const response = await api.get(`/grua-componentes/${id}`)
    return response.data
  },

  // Criar novo componente
  async criar(dados: Partial<ComponenteGrua>): Promise<{ success: boolean; data: ComponenteGrua; message: string }> {
    const response = await api.post('/grua-componentes', dados)
    return response.data
  },

  // Atualizar componente
  async atualizar(id: number, dados: Partial<ComponenteGrua>): Promise<{ success: boolean; data: ComponenteGrua; message: string }> {
    const response = await api.put(`/grua-componentes/${id}`, dados)
    return response.data
  },

  // Excluir componente
  async excluir(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/grua-componentes/${id}`)
    return response.data
  },

  // Registrar movimentação de componente
  async movimentar(id: number, movimentacao: MovimentacaoComponente): Promise<MovimentacaoResponse> {
    const response = await api.post(`/grua-componentes/${id}/movimentar`, movimentacao)
    return response.data
  },

  // Buscar componentes por grua
  async buscarPorGrua(gruaId: string, filters: Omit<ComponenteFilters, 'grua_id'> = {}): Promise<ComponenteResponse> {
    return this.listar({ ...filters, grua_id: gruaId })
  },

  // Obter estatísticas de componentes
  async obterEstatisticas(gruaId?: string): Promise<{
    total: number
    disponivel: number
    em_uso: number
    danificado: number
    manutencao: number
    valor_total: number
  }> {
    const filters: ComponenteFilters = {}
    if (gruaId) filters.grua_id = gruaId

    const response = await this.listar({ ...filters, limit: 10 })
    
    const componentes = response.data
    const estatisticas = {
      total: componentes.length,
      disponivel: componentes.filter(c => c.status === 'Disponível').length,
      em_uso: componentes.filter(c => c.status === 'Em uso').length,
      danificado: componentes.filter(c => c.status === 'Danificado').length,
      manutencao: componentes.filter(c => c.status === 'Manutenção').length,
      valor_total: componentes.reduce((total, c) => total + (c.valor_unitario * c.quantidade_total), 0)
    }

    return estatisticas
  },

  // Buscar componentes agrupados por grua (para visualização no estoque)
  async buscarAgrupadosPorGrua(): Promise<ComponentesAgrupadosResponse> {
    const response = await api.get('/grua-componentes/agrupados/estoque')
    return response.data
  }
}

export default apiComponentes
