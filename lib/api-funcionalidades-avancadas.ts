// API de Funcionalidades Avançadas integrada com backend real

import api from './api'

// Interfaces
export interface FuncionalidadeAvancada {
  id: number
  nome: string
  descricao: string
  modulo: string
  tipo: 'relatorio' | 'integracao' | 'automatizacao' | 'analise' | 'exportacao'
  status: 'ativo' | 'inativo' | 'manutencao'
  configuracoes: Record<string, any>
  permissoes_necessarias: string[]
  created_at: string
  updated_at: string
}

export interface FuncionalidadeAvancadaCreate {
  nome: string
  descricao: string
  modulo: string
  tipo: 'relatorio' | 'integracao' | 'automatizacao' | 'analise' | 'exportacao'
  configuracoes?: Record<string, any>
  permissoes_necessarias?: string[]
}

export interface FuncionalidadeAvancadaUpdate {
  nome?: string
  descricao?: string
  status?: 'ativo' | 'inativo' | 'manutencao'
  configuracoes?: Record<string, any>
  permissoes_necessarias?: string[]
}

export interface FuncionalidadeAvancadaFilters {
  modulo?: string
  tipo?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}

export interface FuncionalidadeAvancadaStats {
  total_funcionalidades: number
  por_modulo: Record<string, number>
  por_tipo: Record<string, number>
  por_status: Record<string, number>
  mais_utilizadas: Array<{ funcionalidade: string; uso: number }>
}

// API functions
export const apiFuncionalidadesAvancadas = {
  // Listar funcionalidades avançadas
  async listar(filters?: FuncionalidadeAvancadaFilters) {
    const params = new URLSearchParams()
    
    if (filters?.modulo) params.append('modulo', filters.modulo)
    if (filters?.tipo) params.append('tipo', filters.tipo)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/funcionalidades-avancadas?${params.toString()}`)
    return response.data
  },

  // Obter funcionalidade avançada por ID
  async obter(id: number) {
    const response = await api.get(`/funcionalidades-avancadas/${id}`)
    return response.data
  },

  // Criar funcionalidade avançada
  async criar(dados: FuncionalidadeAvancadaCreate) {
    const response = await api.post('/funcionalidades-avancadas', dados)
    return response.data
  },

  // Atualizar funcionalidade avançada
  async atualizar(id: number, dados: FuncionalidadeAvancadaUpdate) {
    const response = await api.put(`/funcionalidades-avancadas/${id}`, dados)
    return response.data
  },

  // Excluir funcionalidade avançada
  async excluir(id: number) {
    const response = await api.delete(`/funcionalidades-avancadas/${id}`)
    return response.data
  },

  // Ativar/Desativar funcionalidade
  async toggleStatus(id: number) {
    const response = await api.patch(`/funcionalidades-avancadas/${id}/toggle-status`)
    return response.data
  },

  // Executar funcionalidade
  async executar(id: number, parametros?: Record<string, any>) {
    const response = await api.post(`/funcionalidades-avancadas/${id}/executar`, {
      parametros
    })
    return response.data
  },

  // Obter configurações
  async obterConfiguracoes(id: number) {
    const response = await api.get(`/funcionalidades-avancadas/${id}/configuracoes`)
    return response.data
  },

  // Atualizar configurações
  async atualizarConfiguracoes(id: number, configuracoes: Record<string, any>) {
    const response = await api.put(`/funcionalidades-avancadas/${id}/configuracoes`, {
      configuracoes
    })
    return response.data
  },

  // Obter estatísticas
  async obterEstatisticas(filters?: {
    data_inicio?: string
    data_fim?: string
    modulo?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters?.data_fim) params.append('data_fim', filters.data_fim)
    if (filters?.modulo) params.append('modulo', filters.modulo)

    const response = await api.get(`/funcionalidades-avancadas/stats?${params.toString()}`)
    return response.data
  },

  // Obter logs de execução
  async obterLogs(id: number, filters?: {
    data_inicio?: string
    data_fim?: string
    status?: string
    page?: number
    limit?: number
  }) {
    const params = new URLSearchParams()
    if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters?.data_fim) params.append('data_fim', filters.data_fim)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/funcionalidades-avancadas/${id}/logs?${params.toString()}`)
    return response.data
  },

  // Testar funcionalidade
  async testar(id: number, parametros?: Record<string, any>) {
    const response = await api.post(`/funcionalidades-avancadas/${id}/testar`, {
      parametros
    })
    return response.data
  },

  // Obter funcionalidades por módulo
  async obterPorModulo(modulo: string) {
    const response = await api.get(`/funcionalidades-avancadas/modulo/${modulo}`)
    return response.data
  },

  // Obter funcionalidades disponíveis para usuário
  async obterDisponiveis() {
    const response = await api.get('/funcionalidades-avancadas/disponiveis')
    return response.data
  }
}

export default apiFuncionalidadesAvancadas
