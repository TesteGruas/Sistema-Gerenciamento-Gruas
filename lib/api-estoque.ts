// Serviço de API para integração com endpoints de estoque
import { buildApiUrl } from './api'

// Importar AuthService para gerenciar autenticação
import { AuthService } from '../app/lib/auth'

interface Produto {
  id: string
  nome: string
  descricao?: string
  categoria_id: number
  codigo_barras?: string
  unidade_medida: string
  valor_unitario: number
  estoque_minimo: number
  estoque_maximo?: number
  localizacao?: string
  status: 'Ativo' | 'Inativo'
  created_at: string
  updated_at: string
  categorias?: {
    id: number
    nome: string
  }
  estoque?: {
    quantidade_atual: number
    quantidade_reservada: number
    quantidade_disponivel: number
    valor_total: number
    ultima_movimentacao?: string
  }[]
}

interface Movimentacao {
  id: string
  produto_id: string
  tipo: 'Entrada' | 'Saída' | 'Ajuste' | 'Transferência'
  quantidade: number
  valor_unitario: number
  valor_total: number
  data_movimentacao: string
  responsavel_id: number
  obra_id?: number
  grua_id?: string
  fornecedor_id?: number
  numero_documento?: string
  motivo: string
  observacoes?: string
  status: string
  created_at: string
  produtos?: {
    id: string
    nome: string
    unidade_medida: string
  }
}

interface Categoria {
  id: number
  nome: string
}

interface EstoqueResponse {
  success: boolean
  data: Produto[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface MovimentacaoResponse {
  success: boolean
  data: {
    movimentacao: Movimentacao
    estoque_anterior: number
    estoque_atual: number
    quantidade_disponivel?: number
    valor_total?: number
  }
  message: string
}

interface RelatorioResponse {
  success: boolean
  data: {
    produtos: Produto[]
    estatisticas: {
      total_produtos: number
      produtos_ativos: number
      produtos_inativos: number
      produtos_estoque_baixo: number
      valor_total_estoque: number
    }
  }
}

class EstoqueAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const url = buildApiUrl(endpoint)
      
      // Usar AuthService para fazer requisições autenticadas
      const result = await AuthService.authenticatedRequest(url, options)
      return result
    } catch (error) {
      console.error('Erro na requisição:', error)
      throw error
    }
  }

  // Listar produtos com paginação e filtros
  async listarProdutos(params: {
    page?: number
    limit?: number
    categoria_id?: number
    status?: string
  } = {}): Promise<EstoqueResponse> {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.categoria_id) queryParams.append('categoria_id', params.categoria_id.toString())
    if (params.status) queryParams.append('status', params.status)

    const queryString = queryParams.toString()
    return this.request<EstoqueResponse>(`/estoque${queryString ? `?${queryString}` : ''}`)
  }

  // Obter produto por ID
  async obterProduto(id: string): Promise<{ success: boolean; data: Produto }> {
    return this.request<{ success: boolean; data: Produto }>(`/estoque/${id}`)
  }

  // Criar novo produto
  async criarProduto(dados: {
    nome: string
    descricao?: string
    categoria_id: number
    codigo_barras?: string
    unidade_medida: string
    valor_unitario: number
    estoque_minimo?: number
    estoque_maximo?: number
    localizacao?: string
    status?: 'Ativo' | 'Inativo'
  }): Promise<{ success: boolean; data: Produto; message: string }> {
    return this.request<{ success: boolean; data: Produto; message: string }>('/estoque', {
      method: 'POST',
      body: JSON.stringify(dados),
    })
  }

  // Atualizar produto
  async atualizarProduto(
    id: string,
    dados: Partial<{
      nome: string
      descricao: string
      categoria_id: number
      codigo_barras: string
      unidade_medida: string
      valor_unitario: number
      estoque_minimo: number
      estoque_maximo: number
      localizacao: string
      status: 'Ativo' | 'Inativo'
    }>
  ): Promise<{ success: boolean; data: Produto; message: string }> {
    return this.request<{ success: boolean; data: Produto; message: string }>(`/estoque/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    })
  }

  // Excluir produto
  async excluirProduto(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/estoque/${id}`, {
      method: 'DELETE',
    })
  }

  // Realizar movimentação de estoque
  async movimentarEstoque(dados: {
    produto_id: string
    tipo: 'Entrada' | 'Saída' | 'Ajuste'
    quantidade: number
    motivo: string
    observacoes?: string
  }): Promise<MovimentacaoResponse> {
    return this.request<MovimentacaoResponse>('/estoque/movimentar', {
      method: 'POST',
      body: JSON.stringify(dados),
    })
  }

  // Reservar estoque
  async reservarEstoque(dados: {
    produto_id: string
    quantidade: number
    motivo: string
    observacoes?: string
    referencia?: string
  }): Promise<MovimentacaoResponse> {
    return this.request<MovimentacaoResponse>('/estoque/reservar', {
      method: 'POST',
      body: JSON.stringify(dados),
    })
  }

  // Liberar reserva de estoque
  async liberarReserva(dados: {
    produto_id: string
    quantidade: number
    motivo: string
    observacoes?: string
    referencia?: string
  }): Promise<MovimentacaoResponse> {
    return this.request<MovimentacaoResponse>('/estoque/liberar-reserva', {
      method: 'POST',
      body: JSON.stringify(dados),
    })
  }

  // Listar movimentações de estoque
  async listarMovimentacoes(params: {
    page?: number
    limit?: number
    produto_id?: string
    tipo?: string
    data_inicio?: string
    data_fim?: string
  } = {}): Promise<{ success: boolean; data: Movimentacao[]; pagination: any }> {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.produto_id) queryParams.append('produto_id', params.produto_id)
    if (params.tipo) queryParams.append('tipo', params.tipo)
    if (params.data_inicio) queryParams.append('data_inicio', params.data_inicio)
    if (params.data_fim) queryParams.append('data_fim', params.data_fim)

    const queryString = queryParams.toString()
    return this.request<{ success: boolean; data: Movimentacao[]; pagination: any }>(`/estoque/movimentacoes${queryString ? `?${queryString}` : ''}`)
  }

  // Obter relatório de estoque
  async obterRelatorio(params: {
    categoria_id?: number
    status?: string
    estoque_baixo?: boolean
  } = {}): Promise<RelatorioResponse> {
    const queryParams = new URLSearchParams()
    
    if (params.categoria_id) queryParams.append('categoria_id', params.categoria_id.toString())
    if (params.status) queryParams.append('status', params.status)
    if (params.estoque_baixo !== undefined) queryParams.append('estoque_baixo', params.estoque_baixo.toString())

    const queryString = queryParams.toString()
    return this.request<RelatorioResponse>(`/estoque/relatorio${queryString ? `?${queryString}` : ''}`)
  }

  // Listar categorias (assumindo que existe um endpoint para isso)
  async listarCategorias(): Promise<{ success: boolean; data: Categoria[] }> {
    return this.request<{ success: boolean; data: Categoria[] }>('/categorias')
  }
}

export const estoqueAPI = new EstoqueAPI()
export type { Produto, Movimentacao, Categoria, EstoqueResponse, MovimentacaoResponse, RelatorioResponse }
