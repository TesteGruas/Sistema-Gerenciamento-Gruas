// API de Categorias integrada com backend real

import api from './api'

// Interfaces
export interface Categoria {
  id: number
  nome: string
  descricao?: string
  tipo: string
  cor?: string
  icone?: string
  ativa: boolean
  ordem: number
  categoria_pai_id?: number
  categoria_pai_nome?: string
  created_at: string
  updated_at: string
}

export interface CategoriaCreate {
  nome: string
  descricao?: string
  tipo: string
  cor?: string
  icone?: string
  ativa?: boolean
  ordem?: number
  categoria_pai_id?: number
}

export interface CategoriaUpdate {
  nome?: string
  descricao?: string
  tipo?: string
  cor?: string
  icone?: string
  ativa?: boolean
  ordem?: number
  categoria_pai_id?: number
}

export interface CategoriaFilters {
  tipo?: string
  ativa?: boolean
  categoria_pai_id?: number
  search?: string
  page?: number
  limit?: number
}

export interface CategoriaStats {
  total_categorias: number
  por_tipo: Record<string, number>
  por_status: Record<string, number>
  hierarquia: Array<{
    categoria: string
    subcategorias: number
    itens: number
  }>
}

// API functions
export const apiCategorias = {
  // Listar categorias
  async listar(filters?: CategoriaFilters) {
    const params = new URLSearchParams()
    
    if (filters?.tipo) params.append('tipo', filters.tipo)
    if (filters?.ativa !== undefined) params.append('ativa', filters.ativa.toString())
    if (filters?.categoria_pai_id) params.append('categoria_pai_id', filters.categoria_pai_id.toString())
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/categorias?${params.toString()}`)
    return response.data
  },

  // Obter categoria por ID
  async obter(id: number) {
    const response = await api.get(`/categorias/${id}`)
    return response.data
  },

  // Criar categoria
  async criar(dados: CategoriaCreate) {
    const response = await api.post('/categorias', dados)
    return response.data
  },

  // Atualizar categoria
  async atualizar(id: number, dados: CategoriaUpdate) {
    const response = await api.put(`/categorias/${id}`, dados)
    return response.data
  },

  // Excluir categoria
  async excluir(id: number) {
    const response = await api.delete(`/categorias/${id}`)
    return response.data
  },

  // Ativar/Desativar categoria
  async toggleStatus(id: number) {
    const response = await api.patch(`/categorias/${id}/toggle-status`)
    return response.data
  },

  // Obter categorias por tipo
  async obterPorTipo(tipo: string) {
    const response = await api.get(`/categorias/tipo/${tipo}`)
    return response.data
  },

  // Obter categorias ativas
  async obterAtivas(tipo?: string) {
    const params = new URLSearchParams()
    if (tipo) params.append('tipo', tipo)

    const response = await api.get(`/categorias/ativas?${params.toString()}`)
    return response.data
  },

  // Obter hierarquia de categorias
  async obterHierarquia(tipo?: string) {
    const params = new URLSearchParams()
    if (tipo) params.append('tipo', tipo)

    const response = await api.get(`/categorias/hierarquia?${params.toString()}`)
    return response.data
  },

  // Obter subcategorias
  async obterSubcategorias(categoria_pai_id: number) {
    const response = await api.get(`/categorias/${categoria_pai_id}/subcategorias`)
    return response.data
  },

  // Reordenar categorias
  async reordenar(categorias: Array<{ id: number; ordem: number }>) {
    const response = await api.patch('/categorias/reordenar', { categorias })
    return response.data
  },

  // Obter estatísticas
  async obterEstatisticas(filters?: {
    tipo?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.tipo) params.append('tipo', filters.tipo)

    const response = await api.get(`/categorias/stats?${params.toString()}`)
    return response.data
  },

  // Obter categorias com contagem de itens
  async obterComContagem(tipo?: string) {
    const params = new URLSearchParams()
    if (tipo) params.append('tipo', tipo)

    const response = await api.get(`/categorias/com-contagem?${params.toString()}`)
    return response.data
  },

  // Duplicar categoria
  async duplicar(id: number, novo_nome: string) {
    const response = await api.post(`/categorias/${id}/duplicar`, {
      novo_nome
    })
    return response.data
  },

  // Obter tipos de categoria disponíveis
  async obterTiposDisponiveis() {
    const response = await api.get('/categorias/tipos-disponiveis')
    return response.data
  }
}

export default apiCategorias
