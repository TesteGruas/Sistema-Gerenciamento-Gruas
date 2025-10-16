// API de Arquivos integrada com backend real

import api from './api'

// Interfaces
export interface Arquivo {
  id: number
  nome: string
  nome_original: string
  caminho: string
  tamanho: number
  tipo_mime: string
  extensao: string
  modulo: string
  entidade_id: number
  entidade_tipo: string
  descricao?: string
  tags?: string[]
  publico: boolean
  usuario_id: number
  usuario_nome?: string
  created_at: string
  updated_at: string
}

export interface ArquivoUpload {
  nome: string
  descricao?: string
  tags?: string[]
  publico?: boolean
  modulo: string
  entidade_id: number
  entidade_tipo: string
}

export interface ArquivoFilters {
  modulo?: string
  entidade_tipo?: string
  entidade_id?: number
  usuario_id?: number
  publico?: boolean
  tags?: string[]
  search?: string
  page?: number
  limit?: number
}

export interface ArquivoStats {
  total_arquivos: number
  tamanho_total: number
  por_modulo: Record<string, number>
  por_tipo: Record<string, number>
  por_usuario: Record<string, number>
}

// API functions
export const apiArquivos = {
  // Listar arquivos
  async listar(filters?: ArquivoFilters) {
    const params = new URLSearchParams()
    
    if (filters?.modulo) params.append('modulo', filters.modulo)
    if (filters?.entidade_tipo) params.append('entidade_tipo', filters.entidade_tipo)
    if (filters?.entidade_id) params.append('entidade_id', filters.entidade_id.toString())
    if (filters?.usuario_id) params.append('usuario_id', filters.usuario_id.toString())
    if (filters?.publico !== undefined) params.append('publico', filters.publico.toString())
    if (filters?.tags) params.append('tags', filters.tags.join(','))
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/arquivos?${params.toString()}`)
    return response.data
  },

  // Obter arquivo por ID
  async obter(id: number) {
    const response = await api.get(`/arquivos/${id}`)
    return response.data
  },

  // Upload de arquivo
  async upload(file: File, dados: ArquivoUpload) {
    const formData = new FormData()
    formData.append('arquivo', file)
    formData.append('nome', dados.nome)
    formData.append('modulo', dados.modulo)
    formData.append('entidade_id', dados.entidade_id.toString())
    formData.append('entidade_tipo', dados.entidade_tipo)
    
    if (dados.descricao) formData.append('descricao', dados.descricao)
    if (dados.tags) formData.append('tags', JSON.stringify(dados.tags))
    if (dados.publico !== undefined) formData.append('publico', dados.publico.toString())

    const response = await api.post('/arquivos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Atualizar arquivo
  async atualizar(id: number, dados: Partial<ArquivoUpload>) {
    const response = await api.put(`/arquivos/${id}`, dados)
    return response.data
  },

  // Excluir arquivo
  async excluir(id: number) {
    const response = await api.delete(`/arquivos/${id}`)
    return response.data
  },

  // Download de arquivo
  async download(id: number) {
    const response = await api.get(`/arquivos/${id}/download`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Obter URL pública
  async obterUrlPublica(id: number) {
    const response = await api.get(`/arquivos/${id}/url-publica`)
    return response.data
  },

  // Obter estatísticas
  async obterEstatisticas() {
    const response = await api.get('/arquivos/stats')
    return response.data
  },

  // Buscar arquivos por tags
  async buscarPorTags(tags: string[]) {
    const response = await api.get('/arquivos/buscar-por-tags', {
      params: { tags: tags.join(',') }
    })
    return response.data
  },

  // Obter arquivos por entidade
  async obterPorEntidade(entidade_tipo: string, entidade_id: number) {
    const response = await api.get('/arquivos/por-entidade', {
      params: { entidade_tipo, entidade_id }
    })
    return response.data
  }
}

export default apiArquivos
