import api from './api'

export interface CustoMensal {
  id: number
  obra_id: number
  item: string
  descricao: string
  unidade: string
  quantidade_orcamento: number
  valor_unitario: number
  total_orcamento: number
  mes: string // formato YYYY-MM
  quantidade_realizada: number
  valor_realizado: number
  quantidade_acumulada: number
  valor_acumulado: number
  quantidade_saldo: number
  valor_saldo: number
  tipo: 'contrato' | 'aditivo'
  created_at: string
  updated_at: string
  obras?: {
    id: number
    nome: string
    status: string
  }
}

export interface CustoMensalCreate {
  obra_id: number
  item: string
  descricao: string
  unidade: string
  quantidade_orcamento: number
  valor_unitario: number
  mes: string
  quantidade_realizada?: number
  quantidade_acumulada?: number
  valor_acumulado?: number
  tipo?: 'contrato' | 'aditivo'
}

export interface CustoMensalUpdate {
  item?: string
  descricao?: string
  unidade?: string
  quantidade_orcamento?: number
  valor_unitario?: number
  quantidade_realizada?: number
  quantidade_acumulada?: number
  valor_acumulado?: number
  tipo?: 'contrato' | 'aditivo'
}

export interface CustoMensalFilters {
  obra_id?: number
  mes?: string
  tipo?: 'contrato' | 'aditivo'
  page?: number
  limit?: number
}

export interface ReplicarCustosRequest {
  obra_id: number
  mes_origem: string
  mes_destino: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ApiError {
  error: string
  message: string
}

class CustosMensaisApi {
  private baseUrl = 'custos-mensais'

  /**
   * Listar custos mensais com filtros opcionais
   */
  async listar(filters: CustoMensalFilters = {}): Promise<ApiResponse<CustoMensal[]>> {
    try {
      const params = new URLSearchParams()
      
      if (filters.obra_id) params.append('obra_id', filters.obra_id.toString())
      if (filters.mes) params.append('mes', filters.mes)
      if (filters.tipo) params.append('tipo', filters.tipo)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const queryString = params.toString()
      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl

      const response = await api.get(url)
      return response.data
    } catch (error: any) {
      console.error('Erro ao listar custos mensais:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Obter custo mensal por ID
   */
  async obter(id: number): Promise<ApiResponse<CustoMensal>> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Erro ao obter custo mensal:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Criar novo custo mensal
   */
  async criar(dados: CustoMensalCreate): Promise<ApiResponse<CustoMensal>> {
    try {
      const response = await api.post(this.baseUrl, dados)
      return response.data
    } catch (error: any) {
      console.error('Erro ao criar custo mensal:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Atualizar custo mensal
   */
  async atualizar(id: number, dados: CustoMensalUpdate): Promise<ApiResponse<CustoMensal>> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, dados)
      return response.data
    } catch (error: any) {
      console.error('Erro ao atualizar custo mensal:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Excluir custo mensal
   */
  async excluir(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Erro ao excluir custo mensal:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Listar custos mensais por obra
   */
  async listarPorObra(obraId: number, mes?: string): Promise<ApiResponse<CustoMensal[]>> {
    try {
      const params = new URLSearchParams()
      if (mes) params.append('mes', mes)
      
      const queryString = params.toString()
      const url = queryString 
        ? `${this.baseUrl}/obra/${obraId}?${queryString}` 
        : `${this.baseUrl}/obra/${obraId}`

      const response = await api.get(url)
      return response.data
    } catch (error: any) {
      console.error('Erro ao listar custos mensais por obra:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Replicar custos de um mês para outro
   */
  async replicar(dados: ReplicarCustosRequest): Promise<ApiResponse<{
    replicados: number
    mes_origem: string
    mes_destino: string
    obra: string
  }>> {
    try {
      const response = await api.post(`${this.baseUrl}/replicar`, dados)
      return response.data
    } catch (error: any) {
      console.error('Erro ao replicar custos:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Atualizar quantidade realizada de um custo
   */
  async atualizarQuantidadeRealizada(
    id: number, 
    quantidadeRealizada: number
  ): Promise<ApiResponse<CustoMensal>> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, {
        quantidade_realizada: quantidadeRealizada
      })
      return response.data
    } catch (error: any) {
      console.error('Erro ao atualizar quantidade realizada:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Obter resumo de custos por obra e mês
   */
  async obterResumo(obraId: number, mes?: string): Promise<{
    totalItens: number
    totalOrcado: number
    totalRealizado: number
    totalAcumulado: number
    totalSaldo: number
    totalContrato: number
    totalAditivo: number
  }> {
    try {
      const custos = await this.listarPorObra(obraId, mes)
      
      const resumo = custos.data.reduce((acc, custo) => {
        acc.totalItens += 1
        acc.totalOrcado += custo.total_orcamento
        acc.totalRealizado += custo.valor_realizado
        acc.totalAcumulado += custo.valor_acumulado
        acc.totalSaldo += custo.valor_saldo
        
        if (custo.tipo === 'contrato') {
          acc.totalContrato += custo.total_orcamento
        } else {
          acc.totalAditivo += custo.total_orcamento
        }
        
        return acc
      }, {
        totalItens: 0,
        totalOrcado: 0,
        totalRealizado: 0,
        totalAcumulado: 0,
        totalSaldo: 0,
        totalContrato: 0,
        totalAditivo: 0
      })

      return resumo
    } catch (error: any) {
      console.error('Erro ao obter resumo de custos:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Obter meses disponíveis para uma obra
   */
  async obterMesesDisponiveis(obraId: number): Promise<string[]> {
    try {
      const custos = await this.listarPorObra(obraId)
      const meses = [...new Set(custos.data.map(custo => custo.mes))]
      return meses.sort()
    } catch (error: any) {
      console.error('Erro ao obter meses disponíveis:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Gerar próximos meses disponíveis para criação
   */
  gerarProximosMeses(mesesExistentes: string[], quantidade: number = 12): string[] {
    const mesesDisponiveis: string[] = []
    const hoje = new Date()
    
    for (let i = 0; i < quantidade; i++) {
      const mes = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
      const mesStr = mes.toISOString().slice(0, 7) // YYYY-MM
      
      if (!mesesExistentes.includes(mesStr)) {
        mesesDisponiveis.push(mesStr)
      }
    }
    
    return mesesDisponiveis
  }

  /**
   * Validar dados de criação de custo mensal
   */
  validarDados(dados: CustoMensalCreate): string[] {
    const erros: string[] = []

    if (!dados.obra_id || dados.obra_id <= 0) {
      erros.push('ID da obra é obrigatório')
    }

    if (!dados.item || dados.item.trim().length === 0) {
      erros.push('Item é obrigatório')
    }

    if (!dados.descricao || dados.descricao.trim().length === 0) {
      erros.push('Descrição é obrigatória')
    }

    if (!dados.unidade || dados.unidade.trim().length === 0) {
      erros.push('Unidade é obrigatória')
    }

    if (dados.quantidade_orcamento < 0) {
      erros.push('Quantidade orçamento deve ser maior ou igual a zero')
    }

    if (dados.valor_unitario < 0) {
      erros.push('Valor unitário deve ser maior ou igual a zero')
    }

    if (!dados.mes || !/^\d{4}-\d{2}$/.test(dados.mes)) {
      erros.push('Mês deve estar no formato YYYY-MM')
    }

    return erros
  }

  /**
   * Tratar erros da API
   */
  private handleError(error: any): ApiError {
    if (error.response?.data) {
      return {
        error: error.response.data.error || 'Erro na API',
        message: error.response.data.message || 'Erro desconhecido'
      }
    }

    if (error.message) {
      return {
        error: 'Erro de conexão',
        message: error.message
      }
    }

    return {
      error: 'Erro desconhecido',
      message: 'Ocorreu um erro inesperado'
    }
  }
}

// Instância singleton da API
export const custosMensaisApi = new CustosMensaisApi()

// Funções auxiliares para formatação
export const formatarMes = (mes: string): string => {
  try {
    const [ano, mesNum] = mes.split('-')
    const data = new Date(parseInt(ano), parseInt(mesNum) - 1, 1)
    return data.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    })
  } catch {
    return mes
  }
}

export const formatarValor = (valor: number): string => {
  return valor.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export const formatarQuantidade = (quantidade: number): string => {
  return quantidade.toFixed(2)
}

// Tipos para componentes React
export interface CustoMensalFormData {
  item: string
  descricao: string
  unidade: string
  quantidade_orcamento: number
  valor_unitario: number
  quantidade_realizada: number
  quantidade_acumulada: number
  valor_acumulado: number
  tipo: 'contrato' | 'aditivo'
}

export interface CustoMensalTableProps {
  custos: CustoMensal[]
  loading?: boolean
  onEdit?: (custo: CustoMensal) => void
  onDelete?: (id: number) => void
  onUpdateQuantidade?: (id: number, quantidade: number) => void
}

export interface CustoMensalFormProps {
  obraId: number
  mes: string
  custo?: CustoMensal
  onSubmit: (dados: CustoMensalCreate | CustoMensalUpdate) => Promise<void>
  onCancel: () => void
  loading?: boolean
}
