import { api } from './api'

export interface OrcamentoLocacao {
  id: number
  numero: string
  cliente_id: number
  data_orcamento: string
  data_validade: string
  valor_total: number
  desconto: number
  status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'vencido' | 'convertido'
  tipo_orcamento: 'locacao_grua' | 'locacao_plataforma'
  vendedor_id?: number
  condicoes_pagamento?: string
  prazo_entrega?: string
  observacoes?: string
  created_at: string
  updated_at: string
  // Relacionamentos
  clientes?: {
    nome: string
    cnpj: string
    contato?: string
    telefone?: string
    email?: string
  }
  funcionarios?: {
    nome: string
    telefone?: string
    email?: string
  }
  orcamento_itens_locacao?: Array<OrcamentoItemLocacao>
}

export interface OrcamentoItemLocacao {
  id: number
  orcamento_id: number
  produto_servico: string
  descricao?: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  tipo: 'produto' | 'servico' | 'equipamento'
  unidade?: string
  observacoes?: string
  created_at: string
}

export interface OrcamentoLocacaoFormData {
  numero: string
  cliente_id: number
  data_orcamento: string
  data_validade: string
  valor_total: number
  desconto?: number
  status?: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'vencido' | 'convertido'
  tipo_orcamento: 'locacao_grua' | 'locacao_plataforma'
  vendedor_id?: number
  condicoes_pagamento?: string
  prazo_entrega?: string
  observacoes?: string
  itens?: Array<{
    produto_servico: string
    descricao?: string
    quantidade: number
    valor_unitario: number
    valor_total: number
    tipo: 'produto' | 'servico' | 'equipamento'
    unidade?: string
    observacoes?: string
  }>
}

export interface OrcamentoLocacaoFilters {
  page?: number
  limit?: number
  status?: string
  tipo_orcamento?: string
  cliente_id?: number
  search?: string
}

export const orcamentosLocacaoApi = {
  // Listar orçamentos com filtros
  async list(filters: OrcamentoLocacaoFilters = {}) {
    const params = new URLSearchParams()
    
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.tipo_orcamento && filters.tipo_orcamento !== 'all') params.append('tipo_orcamento', filters.tipo_orcamento)
    if (filters.cliente_id) params.append('cliente_id', filters.cliente_id.toString())
    if (filters.search) params.append('search', filters.search)

    const response = await api.get(`/orcamentos-locacao?${params.toString()}`)
    return response.data
  },

  // Obter orçamento específico
  async get(id: number) {
    const response = await api.get(`/orcamentos-locacao/${id}`)
    return response.data
  },

  // Criar novo orçamento
  async create(data: OrcamentoLocacaoFormData) {
    const response = await api.post('/orcamentos-locacao', data)
    return response.data
  },

  // Atualizar orçamento
  async update(id: number, data: Partial<OrcamentoLocacaoFormData>) {
    const response = await api.put(`/orcamentos-locacao/${id}`, data)
    return response.data
  },

  // Excluir orçamento
  async delete(id: number) {
    const response = await api.delete(`/orcamentos-locacao/${id}`)
    return response.data
  },

  // Enviar orçamento
  async enviar(id: number) {
    const response = await api.post(`/orcamentos-locacao/${id}/enviar`)
    return response.data
  },

  // Aprovar orçamento
  async aprovar(id: number) {
    const response = await api.post(`/orcamentos-locacao/${id}/aprovar`)
    return response.data
  }
}

export default orcamentosLocacaoApi
