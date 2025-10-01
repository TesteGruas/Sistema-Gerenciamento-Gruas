import { api } from './api'

export interface Custo {
  id: string
  obra_id: number
  tipo: 'salario' | 'material' | 'servico' | 'manutencao'
  descricao: string
  valor: number
  data_custo: string
  funcionario_id?: number
  status: 'pendente' | 'confirmado' | 'cancelado'
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface CustoCreate {
  obra_id: number
  tipo: 'salario' | 'material' | 'servico' | 'manutencao'
  descricao: string
  valor: number
  data_custo: string
  funcionario_id?: number
  status?: 'pendente' | 'confirmado' | 'cancelado'
  observacoes?: string
}

export interface CustoUpdate {
  tipo?: 'salario' | 'material' | 'servico' | 'manutencao'
  descricao?: string
  valor?: number
  data_custo?: string
  funcionario_id?: number
  status?: 'pendente' | 'confirmado' | 'cancelado'
  observacoes?: string
}

export interface CustoFilters {
  obra_id?: number
  tipo?: string
  status?: string
  data_inicio?: string
  data_fim?: string
  funcionario_id?: number
  page?: number
  limit?: number
}

export interface CustoStats {
  total_custos: number
  valor_total: number
  valor_medio: number
  custos_por_tipo: {
    tipo: string
    quantidade: number
    valor_total: number
  }[]
  custos_por_obra: {
    obra_id: number
    obra_nome: string
    cliente_nome: string
    total_custos: number
    valor_total: number
  }[]
}

export interface CustoMensal {
  obra_id: number
  obra_nome: string
  cliente_id: number
  cliente_nome: string
  mes: string
  tipo: string
  quantidade_custos: number
  valor_total: number
  valor_medio: number
}

// API Functions
export const custosApi = {
  // Listar custos com filtros
  async list(filters: CustoFilters = {}): Promise<{ custos: Custo[], total: number }> {
    const params = new URLSearchParams()
    
    if (filters.obra_id) params.append('obra_id', filters.obra_id.toString())
    if (filters.tipo) params.append('tipo', filters.tipo)
    if (filters.status) params.append('status', filters.status)
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters.data_fim) params.append('data_fim', filters.data_fim)
    if (filters.funcionario_id) params.append('funcionario_id', filters.funcionario_id.toString())
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/custos?${params.toString()}`)
    
    // Transformar os dados para garantir tipos corretos
    const custos = (response.data.data || []).map((custo: any) => ({
      ...custo,
      valor: parseFloat(custo.valor) || 0,
      obra_id: parseInt(custo.obra_id) || 0,
      funcionario_id: custo.funcionario_id ? parseInt(custo.funcionario_id) : undefined
    }))
    
    return {
      custos,
      total: response.data.pagination?.total || 0
    }
  },

  // Buscar custo por ID
  async getById(id: string): Promise<Custo> {
    const response = await api.get(`/custos/${id}`)
    const custo = response.data.data
    
    return {
      ...custo,
      valor: parseFloat(custo.valor) || 0,
      obra_id: parseInt(custo.obra_id) || 0,
      funcionario_id: custo.funcionario_id ? parseInt(custo.funcionario_id) : undefined
    }
  },

  // Criar novo custo
  async create(custo: CustoCreate): Promise<Custo> {
    const response = await api.post('/custos', custo)
    const custoData = response.data.data
    
    return {
      ...custoData,
      valor: parseFloat(custoData.valor) || 0,
      obra_id: parseInt(custoData.obra_id) || 0,
      funcionario_id: custoData.funcionario_id ? parseInt(custoData.funcionario_id) : undefined
    }
  },

  // Atualizar custo
  async update(id: string, custo: CustoUpdate): Promise<Custo> {
    const response = await api.put(`/custos/${id}`, custo)
    const custoData = response.data.data
    
    return {
      ...custoData,
      valor: parseFloat(custoData.valor) || 0,
      obra_id: parseInt(custoData.obra_id) || 0,
      funcionario_id: custoData.funcionario_id ? parseInt(custoData.funcionario_id) : undefined
    }
  },

  // Excluir custo
  async delete(id: string): Promise<void> {
    await api.delete(`/custos/${id}`)
  },

  // Obter estatísticas
  async getStats(filters: CustoFilters = {}): Promise<CustoStats> {
    const params = new URLSearchParams()
    
    if (filters.obra_id) params.append('obra_id', filters.obra_id.toString())
    if (filters.tipo) params.append('tipo', filters.tipo)
    if (filters.status) params.append('status', filters.status)
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters.data_fim) params.append('data_fim', filters.data_fim)
    if (filters.funcionario_id) params.append('funcionario_id', filters.funcionario_id.toString())

    const response = await api.get(`/custos/stats?${params.toString()}`)
    return response.data
  },

  // Obter custos mensais
  async getMensal(filters: CustoFilters = {}): Promise<CustoMensal[]> {
    const params = new URLSearchParams()
    
    if (filters.obra_id) params.append('obra_id', filters.obra_id.toString())
    if (filters.tipo) params.append('tipo', filters.tipo)
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters.data_fim) params.append('data_fim', filters.data_fim)

    const response = await api.get(`/custos/mensal?${params.toString()}`)
    return response.data
  },

  // Confirmar custo
  async confirm(id: string): Promise<Custo> {
    const response = await api.patch(`/custos/${id}/confirm`)
    const custoData = response.data.data
    
    return {
      ...custoData,
      valor: parseFloat(custoData.valor) || 0,
      obra_id: parseInt(custoData.obra_id) || 0,
      funcionario_id: custoData.funcionario_id ? parseInt(custoData.funcionario_id) : undefined
    }
  },

  // Cancelar custo
  async cancel(id: string, motivo?: string): Promise<Custo> {
    const response = await api.patch(`/custos/${id}/cancel`, { motivo })
    const custoData = response.data.data
    
    return {
      ...custoData,
      valor: parseFloat(custoData.valor) || 0,
      obra_id: parseInt(custoData.obra_id) || 0,
      funcionario_id: custoData.funcionario_id ? parseInt(custoData.funcionario_id) : undefined
    }
  },

  // Exportar custos
  async export(filters: CustoFilters = {}, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams()
    
    if (filters.obra_id) params.append('obra_id', filters.obra_id.toString())
    if (filters.tipo) params.append('tipo', filters.tipo)
    if (filters.status) params.append('status', filters.status)
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters.data_fim) params.append('data_fim', filters.data_fim)
    if (filters.funcionario_id) params.append('funcionario_id', filters.funcionario_id.toString())
    params.append('format', format)

    const response = await api.get(`/custos/export?${params.toString()}`, {
      responseType: 'blob'
    })
    return response.data
  }
}

// Hook personalizado para custos
export const useCustos = () => {
  const [custos, setCustos] = useState<Custo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCustos = async (filters: CustoFilters = {}) => {
    try {
      setLoading(true)
      setError(null)
      const data = await custosApi.list(filters)
      setCustos(data.custos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar custos')
    } finally {
      setLoading(false)
    }
  }

  const createCusto = async (custo: CustoCreate) => {
    try {
      setLoading(true)
      setError(null)
      const newCusto = await custosApi.create(custo)
      setCustos(prev => [newCusto, ...prev])
      return newCusto
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar custo')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateCusto = async (id: string, custo: CustoUpdate) => {
    try {
      setLoading(true)
      setError(null)
      const updatedCusto = await custosApi.update(id, custo)
      setCustos(prev => prev.map(c => c.id === id ? updatedCusto : c))
      return updatedCusto
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar custo')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteCusto = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      await custosApi.delete(id)
      setCustos(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir custo')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    custos,
    loading,
    error,
    fetchCustos,
    createCusto,
    updateCusto,
    deleteCusto
  }
}

// Utilitários
export const custosUtils = {
  // Formatar valor monetário
  formatCurrency: (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  },

  // Formatar data
  formatDate: (date: string): string => {
    return new Date(date).toLocaleDateString('pt-BR')
  },

  // Obter cor do tipo
  getTipoColor: (tipo: string): string => {
    const colors = {
      salario: 'bg-blue-100 text-blue-800',
      material: 'bg-green-100 text-green-800',
      servico: 'bg-yellow-100 text-yellow-800',
      manutencao: 'bg-red-100 text-red-800'
    }
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  },

  // Obter cor do status
  getStatusColor: (status: string): string => {
    const colors = {
      pendente: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  },

  // Calcular total
  calculateTotal: (custos: Custo[]): number => {
    return custos.reduce((total, custo) => total + custo.valor, 0)
  },

  // Agrupar por tipo
  groupByTipo: (custos: Custo[]) => {
    return custos.reduce((acc, custo) => {
      if (!acc[custo.tipo]) {
        acc[custo.tipo] = []
      }
      acc[custo.tipo].push(custo)
      return acc
    }, {} as Record<string, Custo[]>)
  },

  // Agrupar por obra
  groupByObra: (custos: Custo[]) => {
    return custos.reduce((acc, custo) => {
      if (!acc[custo.obra_id]) {
        acc[custo.obra_id] = []
      }
      acc[custo.obra_id].push(custo)
      return acc
    }, {} as Record<number, Custo[]>)
  }
}
