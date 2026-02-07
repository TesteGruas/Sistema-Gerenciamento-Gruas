// API de Cobranças de Aluguel

const getApiBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  return baseUrl.replace(/\/api\/?$/, '')
}

const API_BASE_URL = getApiBaseUrl()

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken()
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro na requisição' }))
    throw new Error(error.message || error.error || 'Erro na requisição')
  }

  const result = await response.json()
  // Retornar o objeto completo para que o código possa verificar success e data
  return result
}

export interface CobrancaAluguel {
  id: string
  aluguel_id: string
  mes: string // formato YYYY-MM
  conta_bancaria_id: number
  valor_aluguel: number
  valor_custos: number
  valor_total: number
  data_vencimento: string
  data_pagamento?: string
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
  movimentacao_bancaria_id?: number
  observacoes?: string
  created_at: string
  updated_at: string
  // Relacionamentos
  alugueis_residencias?: {
    id: string
    valor_mensal: number
    dia_vencimento: number
    residencias?: {
      nome: string
      endereco: string
    }
    funcionarios?: {
      nome: string
      cpf: string
    }
  }
  contas_bancarias?: {
    id: number
    banco: string
    agencia: string
    conta: string
  }
  movimentacoes_bancarias?: {
    id: number
    valor: number
    descricao: string
  }
}

export interface CriarCobrancaAluguel {
  aluguel_id: string
  mes: string // formato YYYY-MM
  conta_bancaria_id: number
  valor_aluguel: number
  valor_custos?: number
  data_vencimento: string
  boleto_id?: number
  observacoes?: string
}

export const CobrancasAluguelAPI = {
  // Listar todas as cobranças
  listar: async (filtros?: {
    aluguel_id?: string
    mes?: string
    status?: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
  }): Promise<CobrancaAluguel[]> => {
    try {
      const params = new URLSearchParams()
      if (filtros?.aluguel_id) params.append('aluguel_id', filtros.aluguel_id)
      if (filtros?.mes) params.append('mes', filtros.mes)
      if (filtros?.status) params.append('status', filtros.status)
      // Adicionar timestamp para evitar cache
      params.append('_t', Date.now().toString())

      const query = params.toString()
      const response = await apiRequest(`/api/cobrancas-aluguel${query ? `?${query}` : ''}`)
      
      // A API retorna { success: true, data: [...] }
      if (response?.success && Array.isArray(response.data)) {
        return response.data
      } else if (Array.isArray(response)) {
        return response
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data
      }
      
      return []
    } catch (error) {
      console.error('Erro ao listar cobranças:', error)
      return []
    }
  },

  // Buscar por ID
  buscarPorId: async (id: string): Promise<CobrancaAluguel | null> => {
    try {
      const data = await apiRequest(`/api/cobrancas-aluguel/${id}`)
      return data || null
    } catch (error: any) {
      if (error.message?.includes('não encontrada')) {
        return null
      }
      console.error('Erro ao buscar cobrança:', error)
      throw error
    }
  },

  // Criar cobrança
  criar: async (cobranca: CriarCobrancaAluguel): Promise<CobrancaAluguel> => {
    try {
      const data = await apiRequest('/api/cobrancas-aluguel', {
        method: 'POST',
        body: JSON.stringify(cobranca)
      })
      return data
    } catch (error) {
      console.error('Erro ao criar cobrança:', error)
      throw error
    }
  },

  // Atualizar cobrança
  atualizar: async (id: string, dados: Partial<CriarCobrancaAluguel & {
    data_pagamento?: string | null
  }>): Promise<CobrancaAluguel> => {
    try {
      const data = await apiRequest(`/api/cobrancas-aluguel/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados)
      })
      return data
    } catch (error) {
      console.error('Erro ao atualizar cobrança:', error)
      throw error
    }
  },

  // Cancelar cobrança
  cancelar: async (id: string): Promise<boolean> => {
    try {
      await apiRequest(`/api/cobrancas-aluguel/${id}`, {
        method: 'DELETE'
      })
      return true
    } catch (error) {
      console.error('Erro ao cancelar cobrança:', error)
      throw error
    }
  },

  // Gerar cobranças mensais automaticamente
  gerarMensais: async (mes?: string, conta_bancaria_id?: number): Promise<{
    mes: string
    cobrancas_criadas: number
    erros: number
    detalhes: {
      sucessos: string[]
      erros: Array<{ aluguel_id: string; mensagem: string }>
    }
  }> => {
    try {
      const data = await apiRequest('/api/cobrancas-aluguel/gerar-mensais', {
        method: 'POST',
        body: JSON.stringify({ mes, conta_bancaria_id })
      })
      return data
    } catch (error) {
      console.error('Erro ao gerar cobranças mensais:', error)
      throw error
    }
  }
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

export function formatarMes(mes: string): string {
  const [ano, mesNum] = mes.split('-')
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return `${meses[parseInt(mesNum) - 1]} de ${ano}`
}
