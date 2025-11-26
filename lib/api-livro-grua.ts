/**
 * API Client para Livro da Grua
 * Sistema de Gerenciamento de Gruas
 */

import { fetchWithAuth } from './api'

// Configuração da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

// Função para obter token de autenticação
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

// Função para verificar se o usuário está autenticado
const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem('access_token')
  return !!token
}

// Função para redirecionar para login se não autenticado
const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/'
  }
}

// Função para fazer requisições HTTP
async function httpRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}/api/${endpoint.replace(/^\//, '')}`
  
  try {
    const response = await fetchWithAuth(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

export interface EntradaLivroGrua {
  id?: number
  grua_id: string
  funcionario_id: number
  data_entrada: string
  hora_entrada?: string
  tipo_entrada: 'checklist' | 'manutencao' | 'falha'
  status_entrada: 'ok' | 'manutencao' | 'falha'
  descricao: string
  observacoes?: string
  responsavel_resolucao?: string
  data_resolucao?: string
  status_resolucao?: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'
  // Campos específicos do checklist diário
  cabos?: boolean
  polias?: boolean
  estrutura?: boolean
  movimentos?: boolean
  freios?: boolean
  limitadores?: boolean
  indicadores?: boolean
  aterramento?: boolean
  // Campos específicos de manutenção
  realizado_por_id?: number
  realizado_por_nome?: string
  cargo?: string
  anexos?: Array<{
    nome: string
    tipo: string
    tamanho: number
    url: string
  }>
  created_at?: string
  updated_at?: string
  created_by?: number
  updated_by?: number
}

export interface EntradaLivroGruaCompleta extends EntradaLivroGrua {
  grua_modelo?: string
  grua_fabricante?: string
  grua_tipo?: string
  grua_capacidade?: string
  funcionario_nome?: string
  funcionario_cargo?: string
  funcionario_telefone?: string
  funcionario_email?: string
  status_color?: string
  tipo_entrada_display?: string
  // Propriedades adicionais para compatibilidade com o frontend
  gruaName?: string
  funcionarioName?: string
  obraName?: string
}

export interface FiltrosLivroGrua {
  grua_id?: string
  funcionario_id?: number
  data_inicio?: string
  data_fim?: string
  tipo_entrada?: 'checklist' | 'manutencao' | 'falha'
  status_entrada?: 'ok' | 'manutencao' | 'falha'
  page?: number
  limit?: number
}

export interface EstatisticasLivroGrua {
  total_entradas: number
  por_tipo: Record<string, number>
  por_status: Record<string, number>
  ultima_entrada: string | null
  primeira_entrada: string | null
  entradas_ultimos_30_dias: number
}

export interface RespostaListaEntradas {
  success: boolean
  data: EntradaLivroGruaCompleta[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface RespostaEntrada {
  success: boolean
  data: EntradaLivroGruaCompleta
  message?: string
}

export interface RespostaEstatisticas {
  success: boolean
  data: {
    grua: {
      id: string
      modelo: string
      fabricante: string
    }
    estatisticas: EstatisticasLivroGrua
  }
}

export const livroGruaApi = {
  /**
   * Listar entradas do livro da grua
   */
  async listarEntradas(filtros: FiltrosLivroGrua = {}): Promise<RespostaListaEntradas> {
    const params = new URLSearchParams()
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    const response = await httpRequest(`/livro-grua?${params.toString()}`)
    return response
  },

  /**
   * Obter entrada específica
   */
  async obterEntrada(id: number): Promise<RespostaEntrada> {
    const response = await httpRequest(`/livro-grua/${id}`)
    return response
  },

  /**
   * Criar nova entrada
   */
  async criarEntrada(entrada: EntradaLivroGrua): Promise<RespostaEntrada> {
    const response = await httpRequest('/livro-grua', {
      method: 'POST',
      body: JSON.stringify(entrada)
    })
    return response
  },

  /**
   * Atualizar entrada
   */
  async atualizarEntrada(id: number, entrada: Partial<EntradaLivroGrua>): Promise<RespostaEntrada> {
    const response = await httpRequest(`/livro-grua/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entrada)
    })
    return response
  },

  /**
   * Excluir entrada
   */
  async excluirEntrada(id: number): Promise<{ success: boolean; message: string }> {
    const response = await httpRequest(`/livro-grua/${id}`, {
      method: 'DELETE'
    })
    return response
  },

  /**
   * Exportar entradas para CSV
   */
  async exportarEntradas(gruaId: string, dataInicio?: string, dataFim?: string): Promise<Blob> {
    const params = new URLSearchParams()
    if (dataInicio) params.append('data_inicio', dataInicio)
    if (dataFim) params.append('data_fim', dataFim)
    
    const url = `${API_BASE_URL}/api/livro-grua/export/${gruaId}?${params.toString()}`
    const token = getAuthToken()
    
    if (!token) {
      throw new Error('Token de acesso requerido')
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.blob()
  },

  /**
   * Obter estatísticas do livro da grua
   */
  async obterEstatisticas(gruaId: string): Promise<RespostaEstatisticas> {
    const response = await httpRequest(`/livro-grua/stats/${gruaId}`)
    return response
  },

  /**
   * Baixar arquivo CSV exportado
   */
  async baixarCSV(gruaId: string, dataInicio?: string, dataFim?: string): Promise<void> {
    try {
      const blob = await this.exportarEntradas(gruaId, dataInicio, dataFim)
      
      // Criar URL do blob
      const url = window.URL.createObjectURL(blob)
      
      // Criar link de download
      const link = document.createElement('a')
      link.href = url
      
      // Gerar nome do arquivo
      const dataAtual = new Date().toISOString().split('T')[0]
      const nomeArquivo = `livro-grua-${gruaId}-${dataAtual}.csv`
      link.download = nomeArquivo
      
      // Adicionar ao DOM e clicar
      document.body.appendChild(link)
      link.click()
      
      // Limpar
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar CSV:', error)
      throw error
    }
  },

  /**
   * Obter tipos de entrada disponíveis
   */
  getTiposEntrada(): Array<{ value: string; label: string }> {
    return [
      { value: 'checklist', label: 'Checklist Diário' },
      { value: 'manutencao', label: 'Manutenção' },
      { value: 'falha', label: 'Falha/Problema' }
    ]
  },

  /**
   * Obter status de entrada disponíveis
   */
  getStatusEntrada(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'ok', label: 'OK', color: 'success' },
      { value: 'manutencao', label: 'Em Manutenção', color: 'warning' },
      { value: 'falha', label: 'Falha', color: 'danger' }
    ]
  },

  /**
   * Obter status de resolução disponíveis
   */
  getStatusResolucao(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'pendente', label: 'Pendente', color: 'warning' },
      { value: 'em_andamento', label: 'Em Andamento', color: 'info' },
      { value: 'concluido', label: 'Concluído', color: 'success' },
      { value: 'cancelado', label: 'Cancelado', color: 'danger' }
    ]
  },

  /**
   * Formatar data para exibição
   */
  formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR')
  },

  /**
   * Formatar data e hora para exibição
   */
  formatarDataHora(data: string, hora?: string): string {
    const dataFormatada = new Date(data).toLocaleDateString('pt-BR')
    if (hora) {
      return `${dataFormatada} às ${hora}`
    }
    return dataFormatada
  },

  /**
   * Obter cor do status
   */
  obterCorStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'ok': 'success',
      'manutencao': 'warning',
      'falha': 'danger'
    }
    return statusMap[status] || 'secondary'
  },

  /**
   * Obter cor do tipo
   */
  obterCorTipo(tipo: string): string {
    const tipoMap: Record<string, string> = {
      'checklist': 'success',
      'manutencao': 'warning',
      'falha': 'danger'
    }
    return tipoMap[tipo] || 'secondary'
  },

  /**
   * Buscar grua pelo ID da relação grua_obra
   */
  async buscarGruaPorRelacao(relacaoId: number): Promise<{relacao: any, grua: any, obra: any}> {
    const response = await httpRequest(`/livro-grua/grua-by-relation/${relacaoId}`)
    return response.data
  },

  /**
   * Buscar grua diretamente pelo ID da grua
   */
  async buscarGruaPorId(gruaId: string): Promise<any> {
    const response = await httpRequest(`/gruas/${gruaId}`)
    return response.data
  },

  /**
   * Listar todas as relações grua-obra para funcionários
   */
  async listarRelacoesGruaObra(
    funcionarioId?: number,
    page?: number,
    limit?: number,
    search?: string,
    obraId?: string | number,
    status?: string
  ): Promise<{success: boolean, data: any[], total?: number, page?: number, limit?: number, totalPages?: number}> {
    const searchParams = new URLSearchParams()
    
    if (funcionarioId) {
      searchParams.append('funcionario_id', funcionarioId.toString())
    }
    if (page) {
      searchParams.append('page', page.toString())
    }
    if (limit) {
      searchParams.append('limit', limit.toString())
    }
    if (search && search.trim()) {
      searchParams.append('search', search.trim())
    }
    if (obraId && obraId !== 'all') {
      searchParams.append('obra_id', obraId.toString())
    }
    if (status && status !== 'all') {
      searchParams.append('status', status)
    }
    
    const params = searchParams.toString() ? `?${searchParams.toString()}` : ''
    const response = await httpRequest(`/livro-grua/relacoes-grua-obra${params}`)
    return response
  },

  /**
   * Obter dados do funcionário logado
   */
  async obterFuncionarioLogado(): Promise<{ id: number; nome: string; cargo: string; role?: string; email?: string; funcionario_id?: number }> {
    const response = await httpRequest('/auth/me')
    
    // O endpoint retorna: { success: true, data: { user: {...}, profile: {...}, perfil: {...} } }
    const userData = response.data.user || response.data.profile
    
    if (!userData) {
      throw new Error('Dados do usuário não encontrados na resposta')
    }
    
    return {
      id: userData.id,
      nome: userData.nome || userData.name,
      cargo: userData.cargo || userData.role || 'Funcionário',
      role: userData.role || userData.perfil?.nome,
      email: userData.email,
      funcionario_id: userData.funcionario_id // CORREÇÃO: incluir funcionario_id
    }
  },

  /**
   * Debug: Listar todas as relações sem filtro
   */
  async listarRelacoesGruaObraDebug(): Promise<{success: boolean, data: any[]}> {
    const response = await httpRequest('/livro-grua/relacoes-grua-obra-debug')
    return response
  }
}

export default livroGruaApi
