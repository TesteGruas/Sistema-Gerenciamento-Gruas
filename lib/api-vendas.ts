// API de Vendas integrada com backend real

import api from './api'

// Interfaces
export interface Venda {
  id: number
  numero_venda: string
  data_venda: string
  cliente_id: number
  cliente_nome?: string
  vendedor_id: number
  vendedor_nome?: string
  status: 'pendente' | 'confirmada' | 'processando' | 'enviada' | 'entregue' | 'cancelada'
  valor_total: number
  desconto: number
  valor_final: number
  forma_pagamento: 'dinheiro' | 'cartao' | 'pix' | 'transferencia' | 'cheque' | 'boleto'
  observacoes?: string
  created_at: string
  updated_at: string
  itens: VendaItem[]
}

export interface VendaItem {
  id: number
  venda_id: number
  produto_id: number
  produto_nome?: string
  quantidade: number
  preco_unitario: number
  desconto_item: number
  valor_total: number
}

export interface VendaCreate {
  cliente_id: number
  vendedor_id: number
  data_venda: string
  status?: 'pendente' | 'confirmada' | 'processando' | 'enviada' | 'entregue' | 'cancelada'
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

export interface VendaUpdate {
  cliente_id?: number
  vendedor_id?: number
  data_venda?: string
  status?: 'pendente' | 'confirmada' | 'processando' | 'enviada' | 'entregue' | 'cancelada'
  desconto?: number
  forma_pagamento?: 'dinheiro' | 'cartao' | 'pix' | 'transferencia' | 'cheque' | 'boleto'
  observacoes?: string
}

export interface VendaFilters {
  cliente_id?: number
  vendedor_id?: number
  status?: string
  data_inicio?: string
  data_fim?: string
  forma_pagamento?: string
  search?: string
  page?: number
  limit?: number
}

export interface VendaStats {
  total_vendas: number
  valor_total: number
  por_status: Record<string, number>
  por_mes: Array<{ mes: string; vendas: number; valor: number }>
  top_clientes: Array<{ cliente: string; vendas: number; valor: number }>
  top_vendedores: Array<{ vendedor: string; vendas: number; valor: number }>
}

// API functions
export const apiVendas = {
  // Listar vendas
  async listar(filters?: VendaFilters) {
    const params = new URLSearchParams()
    
    if (filters?.cliente_id) params.append('cliente_id', filters.cliente_id.toString())
    if (filters?.vendedor_id) params.append('vendedor_id', filters.vendedor_id.toString())
    if (filters?.status) params.append('status', filters.status)
    if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters?.data_fim) params.append('data_fim', filters.data_fim)
    if (filters?.forma_pagamento) params.append('forma_pagamento', filters.forma_pagamento)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/vendas?${params.toString()}`)
    return response.data
  },

  // Obter venda por ID
  async obter(id: number) {
    const response = await api.get(`/vendas/${id}`)
    return response.data
  },

  // Criar venda
  async criar(dados: VendaCreate) {
    const response = await api.post('/vendas', dados)
    return response.data
  },

  // Atualizar venda
  async atualizar(id: number, dados: VendaUpdate) {
    const response = await api.put(`/vendas/${id}`, dados)
    return response.data
  },

  // Excluir venda
  async excluir(id: number) {
    const response = await api.delete(`/vendas/${id}`)
    return response.data
  },

  // Atualizar status
  async atualizarStatus(id: number, status: string) {
    const response = await api.patch(`/vendas/${id}/status`, { status })
    return response.data
  },

  // Adicionar item
  async adicionarItem(venda_id: number, item: {
    produto_id: number
    quantidade: number
    preco_unitario: number
    desconto_item?: number
  }) {
    const response = await api.post(`/vendas/${venda_id}/itens`, item)
    return response.data
  },

  // Atualizar item
  async atualizarItem(venda_id: number, item_id: number, dados: {
    quantidade?: number
    preco_unitario?: number
    desconto_item?: number
  }) {
    const response = await api.put(`/vendas/${venda_id}/itens/${item_id}`, dados)
    return response.data
  },

  // Remover item
  async removerItem(venda_id: number, item_id: number) {
    const response = await api.delete(`/vendas/${venda_id}/itens/${item_id}`)
    return response.data
  },

  // Obter estatísticas
  async obterEstatisticas(filters?: {
    data_inicio?: string
    data_fim?: string
    vendedor_id?: number
  }) {
    const params = new URLSearchParams()
    if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters?.data_fim) params.append('data_fim', filters.data_fim)
    if (filters?.vendedor_id) params.append('vendedor_id', filters.vendedor_id.toString())

    const response = await api.get(`/vendas/stats?${params.toString()}`)
    return response.data
  },

  // Gerar relatório
  async gerarRelatorio(filters: {
    data_inicio: string
    data_fim: string
    formato?: 'pdf' | 'excel'
    agrupar_por?: 'cliente' | 'vendedor' | 'mes'
  }) {
    const response = await api.post('/vendas/relatorio', filters, {
      responseType: 'blob'
    })
    return response.data
  },

  // Duplicar venda
  async duplicar(id: number) {
    const response = await api.post(`/vendas/${id}/duplicar`)
    return response.data
  }
}

export default apiVendas
