// API de Compras integrada com backend real

import api from './api'

// Interfaces
export interface Compra {
  id: number
  numero_compra: string
  data_compra: string
  fornecedor_id: number
  fornecedor_nome?: string
  comprador_id: number
  comprador_nome?: string
  status: 'pendente' | 'aprovada' | 'processando' | 'recebida' | 'finalizada' | 'cancelada'
  valor_total: number
  desconto: number
  valor_final: number
  forma_pagamento: 'dinheiro' | 'cartao' | 'pix' | 'transferencia' | 'cheque' | 'boleto'
  observacoes?: string
  created_at: string
  updated_at: string
  itens: CompraItem[]
}

export interface CompraItem {
  id: number
  compra_id: number
  produto_id: number
  produto_nome?: string
  quantidade: number
  preco_unitario: number
  desconto_item: number
  valor_total: number
}

export interface CompraCreate {
  fornecedor_id: number
  comprador_id: number
  data_compra: string
  status?: 'pendente' | 'aprovada' | 'processando' | 'recebida' | 'finalizada' | 'cancelada'
  desconto?: number
  forma_pagamento: 'dinheiro' | 'cartao' | 'pix' | 'transferencia' | 'cheque' | 'boleto'
  observacoes?: string
  itens: {
    produto_id: number
    quantidade: number
    preco_unitario: number
    desconto_item?: number
  }[]
}

export interface CompraUpdate {
  fornecedor_id?: number
  comprador_id?: number
  data_compra?: string
  status?: 'pendente' | 'aprovada' | 'processando' | 'recebida' | 'finalizada' | 'cancelada'
  desconto?: number
  forma_pagamento?: 'dinheiro' | 'cartao' | 'pix' | 'transferencia' | 'cheque' | 'boleto'
  observacoes?: string
}

export interface CompraFilters {
  fornecedor_id?: number
  comprador_id?: number
  status?: string
  data_inicio?: string
  data_fim?: string
  forma_pagamento?: string
  search?: string
  page?: number
  limit?: number
}

export interface CompraStats {
  total_compras: number
  valor_total: number
  por_status: Record<string, number>
  por_mes: Array<{ mes: string; compras: number; valor: number }>
  top_fornecedores: Array<{ fornecedor: string; compras: number; valor: number }>
  top_compradores: Array<{ comprador: string; compras: number; valor: number }>
}

// API functions
export const apiCompras = {
  // Listar compras
  async listar(filters?: CompraFilters) {
    const params = new URLSearchParams()
    
    if (filters?.fornecedor_id) params.append('fornecedor_id', filters.fornecedor_id.toString())
    if (filters?.comprador_id) params.append('comprador_id', filters.comprador_id.toString())
    if (filters?.status) params.append('status', filters.status)
    if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters?.data_fim) params.append('data_fim', filters.data_fim)
    if (filters?.forma_pagamento) params.append('forma_pagamento', filters.forma_pagamento)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/compras?${params.toString()}`)
    return response.data
  },

  // Obter compra por ID
  async obter(id: number) {
    const response = await api.get(`/compras/${id}`)
    return response.data
  },

  // Criar compra
  async criar(dados: CompraCreate) {
    const response = await api.post('/compras', dados)
    return response.data
  },

  // Atualizar compra
  async atualizar(id: number, dados: CompraUpdate) {
    const response = await api.put(`/compras/${id}`, dados)
    return response.data
  },

  // Excluir compra
  async excluir(id: number) {
    const response = await api.delete(`/compras/${id}`)
    return response.data
  },

  // Atualizar status
  async atualizarStatus(id: number, status: string) {
    const response = await api.patch(`/compras/${id}/status`, { status })
    return response.data
  },

  // Adicionar item
  async adicionarItem(compra_id: number, item: {
    produto_id: number
    quantidade: number
    preco_unitario: number
    desconto_item?: number
  }) {
    const response = await api.post(`/compras/${compra_id}/itens`, item)
    return response.data
  },

  // Atualizar item
  async atualizarItem(compra_id: number, item_id: number, dados: {
    quantidade?: number
    preco_unitario?: number
    desconto_item?: number
  }) {
    const response = await api.put(`/compras/${compra_id}/itens/${item_id}`, dados)
    return response.data
  },

  // Remover item
  async removerItem(compra_id: number, item_id: number) {
    const response = await api.delete(`/compras/${compra_id}/itens/${item_id}`)
    return response.data
  },

  // Obter estatísticas
  async obterEstatisticas(filters?: {
    data_inicio?: string
    data_fim?: string
    comprador_id?: number
  }) {
    const params = new URLSearchParams()
    if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters?.data_fim) params.append('data_fim', filters.data_fim)
    if (filters?.comprador_id) params.append('comprador_id', filters.comprador_id.toString())

    const response = await api.get(`/compras/stats?${params.toString()}`)
    return response.data
  },

  // Gerar relatório
  async gerarRelatorio(filters: {
    data_inicio: string
    data_fim: string
    formato?: 'pdf' | 'excel'
    agrupar_por?: 'fornecedor' | 'comprador' | 'mes'
  }) {
    const response = await api.post('/compras/relatorio', filters, {
      responseType: 'blob'
    })
    return response.data
  },

  // Duplicar compra
  async duplicar(id: number) {
    const response = await api.post(`/compras/${id}/duplicar`)
    return response.data
  }
}

export default apiCompras
