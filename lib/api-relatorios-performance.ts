/**
 * API Client para Relatório de Performance de Gruas
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken()
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro na requisição' }))
    throw new Error(error.message || 'Erro na requisição')
  }

  return response.json()
}

export interface PerformanceGruasFiltros {
  data_inicio?: string
  data_fim?: string
  grua_id?: number
  obra_id?: number
  agrupar_por?: 'grua' | 'obra' | 'mes'
  incluir_projecao?: boolean
  limite?: number
  pagina?: number
  ordenar_por?: string
  ordem?: 'asc' | 'desc'
}

export const performanceGruasApi = {
  /**
   * Obter relatório de performance de gruas
   */
  async obterRelatorio(filtros: PerformanceGruasFiltros = {}): Promise<{ success: boolean; data: any }> {
    const params = new URLSearchParams()
    if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio)
    if (filtros.data_fim) params.append('data_fim', filtros.data_fim)
    if (filtros.grua_id) params.append('grua_id', filtros.grua_id.toString())
    if (filtros.obra_id) params.append('obra_id', filtros.obra_id.toString())
    if (filtros.agrupar_por) params.append('agrupar_por', filtros.agrupar_por)
    if (filtros.incluir_projecao) params.append('incluir_projecao', 'true')
    if (filtros.limite) params.append('limite', filtros.limite.toString())
    if (filtros.pagina) params.append('pagina', filtros.pagina.toString())
    if (filtros.ordenar_por) params.append('ordenar_por', filtros.ordenar_por)
    if (filtros.ordem) params.append('ordem', filtros.ordem)

    const query = params.toString()
    const response = await apiRequest(`/api/relatorios/performance-gruas${query ? `?${query}` : ''}`)
    
    if (!response.success) {
      throw new Error(response.error || response.message || 'Erro ao obter relatório de performance')
    }
    
    return response
  },

  /**
   * Exportar relatório em PDF
   */
  async exportarPDF(filtros: PerformanceGruasFiltros): Promise<Blob> {
    const token = getAuthToken()
    const params = new URLSearchParams()
    if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio)
    if (filtros.data_fim) params.append('data_fim', filtros.data_fim)
    if (filtros.grua_id) params.append('grua_id', filtros.grua_id.toString())
    if (filtros.obra_id) params.append('obra_id', filtros.obra_id.toString())

    const query = params.toString()
    const response = await fetch(`${API_URL}/api/relatorios/performance-gruas/export/pdf${query ? `?${query}` : ''}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    })

    if (!response.ok) {
      throw new Error('Erro ao exportar relatório')
    }

    return response.blob()
  },

  /**
   * Exportar relatório em Excel
   */
  async exportarExcel(filtros: PerformanceGruasFiltros): Promise<Blob> {
    const token = getAuthToken()
    const params = new URLSearchParams()
    if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio)
    if (filtros.data_fim) params.append('data_fim', filtros.data_fim)
    if (filtros.grua_id) params.append('grua_id', filtros.grua_id.toString())
    if (filtros.obra_id) params.append('obra_id', filtros.obra_id.toString())

    const query = params.toString()
    const response = await fetch(`${API_URL}/api/relatorios/performance-gruas/export/excel${query ? `?${query}` : ''}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    })

    if (!response.ok) {
      throw new Error('Erro ao exportar relatório')
    }

    return response.blob()
  },

  /**
   * Exportar relatório em CSV
   */
  async exportarCSV(filtros: PerformanceGruasFiltros): Promise<Blob> {
    const token = getAuthToken()
    const params = new URLSearchParams()
    if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio)
    if (filtros.data_fim) params.append('data_fim', filtros.data_fim)
    if (filtros.grua_id) params.append('grua_id', filtros.grua_id.toString())
    if (filtros.obra_id) params.append('obra_id', filtros.obra_id.toString())

    const query = params.toString()
    const response = await fetch(`${API_URL}/api/relatorios/performance-gruas/export/csv${query ? `?${query}` : ''}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    })

    if (!response.ok) {
      throw new Error('Erro ao exportar relatório')
    }

    return response.blob()
  }
}

