import { api } from './api'

export interface NotaFiscal {
  id: number
  numero_nf: string
  serie?: string
  data_emissao: string
  data_vencimento?: string
  valor_total: number
  valor_liquido?: number
  valor_icms?: number
  valor_icms_st?: number
  valor_fcp_st?: number
  valor_ipi?: number
  valor_pis?: number
  valor_cofins?: number
  valor_inss?: number
  valor_ir?: number
  valor_csll?: number
  valor_issqn?: number
  retencoes_federais?: number
  outras_retencoes?: number
  tipo: 'entrada' | 'saida'
  status: 'pendente' | 'paga' | 'vencida' | 'cancelada'
  cliente_id?: number
  fornecedor_id?: number
  venda_id?: number
  compra_id?: number
  medicao_id?: number
  locacao_id?: number
  tipo_nota?: 'nf_servico' | 'nf_locacao' | 'fatura' | 'nfe_eletronica'
  eletronica?: boolean
  chave_acesso?: string
  arquivo_nf?: string
  nome_arquivo?: string
  tamanho_arquivo?: number
  tipo_arquivo?: string
  observacoes?: string
  created_at: string
  updated_at: string
  // Relacionamentos
  clientes?: {
    id: number
    nome: string
    cnpj?: string
    cnpj_cpf?: string
  }
  fornecedores?: {
    id: number
    nome: string
    cnpj?: string
  }
  vendas?: {
    id: number
    numero_venda: string
  }
  compras?: {
    id: number
    numero_pedido: string
  }
  medicoes?: {
    id: number
    numero: string
    periodo: string
  }
  locacoes?: {
    id: number
    numero: string
  }
  boletos?: Array<{
    id: number
    numero_boleto: string
    valor: number
    data_vencimento: string
    status: 'pendente' | 'pago' | 'vencido' | 'cancelado'
    tipo: 'pagar' | 'receber'
    arquivo_boleto?: string
  }>
}

export interface NotaFiscalCreate {
  numero_nf: string
  serie?: string
  data_emissao: string
  data_vencimento?: string
  valor_total: number
  tipo: 'entrada' | 'saida'
  status?: 'pendente' | 'paga' | 'vencida' | 'cancelada'
  cliente_id?: number
  fornecedor_id?: number
  venda_id?: number
  compra_id?: number
  medicao_id?: number
  locacao_id?: number
  tipo_nota?: 'nf_servico' | 'nf_locacao' | 'fatura' | 'nfe_eletronica'
  eletronica?: boolean
  chave_acesso?: string
  observacoes?: string
}

export const notasFiscaisApi = {
  async list(params?: {
    tipo?: 'entrada' | 'saida'
    status?: string
    search?: string
    cliente_id?: number
    fornecedor_id?: number
    medicao_id?: number
    locacao_id?: number
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    
    if (params?.tipo) searchParams.append('tipo', params.tipo)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.search) searchParams.append('search', params.search)
    if (params?.cliente_id) searchParams.append('cliente_id', params.cliente_id.toString())
    if (params?.fornecedor_id) searchParams.append('fornecedor_id', params.fornecedor_id.toString())
    if (params?.medicao_id) searchParams.append('medicao_id', params.medicao_id.toString())
    if (params?.locacao_id) searchParams.append('locacao_id', params.locacao_id.toString())
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())

    const response = await api.get(`/notas-fiscais?${searchParams.toString()}`)
    return response.data
  },

  async getById(id: number) {
    const response = await api.get(`/notas-fiscais/${id}`)
    return response.data
  },

  async create(data: NotaFiscalCreate) {
    const response = await api.post('/notas-fiscais', data)
    return response.data
  },

  async update(id: number, data: Partial<NotaFiscalCreate>) {
    const response = await api.put(`/notas-fiscais/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/notas-fiscais/${id}`)
    return response.data
  },

  async uploadFile(id: number, file: File) {
    const formData = new FormData()
    formData.append('arquivo', file)
    
    const response = await api.post(`/notas-fiscais/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  async downloadFile(id: number) {
    const response = await api.get(`/notas-fiscais/${id}/download`)
    return response.data
  },

  async importarXML(file: File) {
    const formData = new FormData()
    formData.append('arquivo', file)
    
    const response = await api.post('/notas-fiscais/importar-xml', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Itens da nota fiscal
  async listarItens(notaFiscalId: number) {
    const response = await api.get(`/notas-fiscais/${notaFiscalId}/itens`)
    return response.data
  },

  async adicionarItem(notaFiscalId: number, item: any) {
    const response = await api.post(`/notas-fiscais/${notaFiscalId}/itens`, item)
    return response.data
  },

  async atualizarItem(itemId: number, item: any) {
    const response = await api.put(`/notas-fiscais/itens/${itemId}`, item)
    return response.data
  },

  async deletarItem(itemId: number) {
    const response = await api.delete(`/notas-fiscais/itens/${itemId}`)
    return response.data
  }
}

