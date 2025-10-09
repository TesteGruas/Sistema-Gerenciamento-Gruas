import api, { apiWithRetry } from './api'

// Interfaces para os dados financeiros
export interface FinancialData {
  receberHoje: number
  pagarHoje: number
  recebimentosAtraso: number
  pagamentosAtraso: number
  saldoAtual: number
  fluxoCaixa: FluxoCaixa[]
  transferencias: Transferencia[]
}

export interface FluxoCaixa {
  mes: string
  entrada: number
  saida: number
}

export interface Transferencia {
  id: number
  data: string
  valor: number
  tipo: 'entrada' | 'saida'
  descricao: string
  status: 'confirmada' | 'pendente'
  banco_origem?: string
  banco_destino?: string
  documento_comprobatório?: string
}

export interface Venda {
  id: number
  cliente_id: number
  obra_id?: number
  orcamento_id?: number
  numero_venda: string
  data_venda: string
  valor_total: number
  status: 'pendente' | 'confirmada' | 'cancelada' | 'finalizada'
  tipo_venda: 'equipamento' | 'servico' | 'locacao'
  observacoes?: string
  created_at: string
  updated_at: string
  clientes?: {
    nome: string
    cnpj: string
  }
  obras?: {
    nome: string
    endereco: string
  }
}

export interface VendaItem {
  id: number
  venda_id: number
  produto_id?: string
  grua_id?: string
  descricao: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  created_at: string
  produtos?: {
    nome: string
    descricao: string
  }
  gruas?: {
    id: string
    modelo: string
    fabricante: string
  }
}

export interface Compra {
  id: number
  fornecedor_id: number
  numero_pedido: string
  data_pedido: string
  data_entrega?: string
  valor_total: number
  status: 'pendente' | 'aprovado' | 'enviado' | 'recebido' | 'cancelado'
  observacoes?: string
  created_at: string
  updated_at: string
  fornecedores?: {
    nome: string
    cnpj: string
    telefone?: string
    email?: string
  }
}

export interface CompraItem {
  id: number
  compra_id: number
  produto_id?: string
  descricao: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  created_at: string
  produtos?: {
    nome: string
    descricao: string
    unidade_medida: string
  }
}

export interface ContaBancaria {
  id: number
  banco: string
  agencia: string
  conta: string
  tipo_conta: 'corrente' | 'poupanca' | 'investimento'
  saldo_atual: number
  status: 'ativa' | 'inativa' | 'bloqueada'
  created_at: string
  updated_at: string
}

export interface NotaFiscal {
  id: number
  numero_nf: string
  serie?: string
  data_emissao: string
  data_vencimento?: string
  valor_total: number
  tipo: 'entrada' | 'saida'
  status: 'pendente' | 'paga' | 'vencida' | 'cancelada'
  cliente_id?: number
  fornecedor_id?: number
  venda_id?: number
  compra_id?: number
  arquivo_nf?: string
  nome_arquivo?: string
  tamanho_arquivo?: number
  tipo_arquivo?: string
  observacoes?: string
  created_at: string
  updated_at: string
  clientes?: {
    nome: string
    cnpj: string
  }
  fornecedores?: {
    nome: string
    cnpj: string
  }
  vendas?: {
    numero_venda: string
  }
  compras?: {
    numero_pedido: string
  }
}

export interface Imposto {
  id: number
  tipo_imposto: string
  descricao: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado'
  referencia?: string
  observacoes?: string
  created_at: string
  updated_at: string
}

// API Functions

// Dados financeiros gerais
export const getFinancialData = async (): Promise<FinancialData> => {
  const response = await api.get('/financial-data')
  return response.data.data
}

// Vendas (com retry logic)
export const getVendas = async (): Promise<Venda[]> => {
  return apiWithRetry(async () => {
    const response = await api.get('/vendas')
    return response.data.data
  })
}

export const getVenda = async (id: number): Promise<Venda> => {
  return apiWithRetry(async () => {
    const response = await api.get(`/vendas/${id}`)
    return response.data.data
  })
}

export const createVenda = async (venda: Omit<Venda, 'id' | 'created_at' | 'updated_at'>): Promise<Venda> => {
  return apiWithRetry(async () => {
    const response = await api.post('/vendas', venda)
    return response.data.data
  }, { maxRetries: 2 }) // Menos retries para operações de escrita
}

export const updateVenda = async (id: number, venda: Partial<Venda>): Promise<Venda> => {
  return apiWithRetry(async () => {
    const response = await api.put(`/vendas/${id}`, venda)
    return response.data.data
  }, { maxRetries: 2 })
}

export const deleteVenda = async (id: number): Promise<void> => {
  return apiWithRetry(async () => {
    await api.delete(`/vendas/${id}`)
  }, { maxRetries: 1 }) // Apenas 1 retry para delete
}


// Compras
export const getCompras = async (): Promise<Compra[]> => {
  const response = await api.get('/compras')
  return response.data.data
}

export const getCompra = async (id: number): Promise<Compra> => {
  const response = await api.get(`/compras/${id}`)
  return response.data.data
}

export const createCompra = async (compra: Omit<Compra, 'id' | 'created_at' | 'updated_at'>): Promise<Compra> => {
  const response = await api.post('/compras', compra)
  return response.data.data
}

export const updateCompra = async (id: number, compra: Partial<Compra>): Promise<Compra> => {
  const response = await api.put(`/compras/${id}`, compra)
  return response.data.data
}

export const deleteCompra = async (id: number): Promise<void> => {
  await api.delete(`/compras/${id}`)
}

export const getCompraItens = async (compraId: number): Promise<CompraItem[]> => {
  const response = await api.get(`/compras/${compraId}/itens`)
  return response.data.data
}

export const addCompraItem = async (compraId: number, item: Omit<CompraItem, 'id' | 'compra_id' | 'created_at'>): Promise<CompraItem> => {
  const response = await api.post(`/compras/${compraId}/itens`, item)
  return response.data.data
}

export const receberCompra = async (id: number): Promise<Compra> => {
  const response = await api.post(`/compras/${id}/receber`)
  return response.data.data
}

// Transferências
export const getTransferencias = async (): Promise<Transferencia[]> => {
  const response = await api.get('/transferencias')
  return response.data.data
}

export const createTransferencia = async (transferencia: Omit<Transferencia, 'id' | 'created_at' | 'updated_at'>): Promise<Transferencia> => {
  const response = await api.post('/transferencias', transferencia)
  return response.data.data
}

export const updateTransferencia = async (id: number, transferencia: Partial<Transferencia>): Promise<Transferencia> => {
  const response = await api.put(`/transferencias/${id}`, transferencia)
  return response.data.data
}

export const deleteTransferencia = async (id: number): Promise<void> => {
  await api.delete(`/transferencias/${id}`)
}

export const confirmarTransferencia = async (id: number): Promise<Transferencia> => {
  const response = await api.post(`/transferencias/${id}/confirmar`)
  return response.data.data
}

// Contas Bancárias
export const getContasBancarias = async (): Promise<ContaBancaria[]> => {
  const response = await api.get('/contas-bancarias')
  return response.data.data
}

export const createContaBancaria = async (conta: Omit<ContaBancaria, 'id' | 'created_at' | 'updated_at'>): Promise<ContaBancaria> => {
  const response = await api.post('/contas-bancarias', conta)
  return response.data.data
}

export const updateContaBancaria = async (id: number, conta: Partial<ContaBancaria>): Promise<ContaBancaria> => {
  const response = await api.put(`/contas-bancarias/${id}`, conta)
  return response.data.data
}

export const deleteContaBancaria = async (id: number): Promise<void> => {
  await api.delete(`/contas-bancarias/${id}`)
}

export const updateSaldoConta = async (id: number, saldo: number): Promise<ContaBancaria> => {
  const response = await api.put(`/contas-bancarias/${id}/saldo`, { saldo_atual: saldo })
  return response.data.data
}

// Notas Fiscais
export const getNotasFiscais = async (): Promise<NotaFiscal[]> => {
  const response = await api.get('/notas-fiscais')
  return response.data.data
}

export const getNotaFiscal = async (id: number): Promise<NotaFiscal> => {
  const response = await api.get(`/notas-fiscais/${id}`)
  return response.data.data
}

export const createNotaFiscal = async (nota: Omit<NotaFiscal, 'id' | 'created_at' | 'updated_at'>): Promise<NotaFiscal> => {
  const response = await api.post('/notas-fiscais', nota)
  return response.data.data
}

export const updateNotaFiscal = async (id: number, nota: Partial<NotaFiscal>): Promise<NotaFiscal> => {
  const response = await api.put(`/notas-fiscais/${id}`, nota)
  return response.data.data
}

export const deleteNotaFiscal = async (id: number): Promise<void> => {
  await api.delete(`/notas-fiscais/${id}`)
}

// Impostos
export const getImpostos = async (): Promise<Imposto[]> => {
  const response = await api.get('/impostos')
  return response.data.data
}

export const getImposto = async (id: number): Promise<Imposto> => {
  const response = await api.get(`/impostos/${id}`)
  return response.data.data
}

export const createImposto = async (imposto: Omit<Imposto, 'id' | 'created_at' | 'updated_at'>): Promise<Imposto> => {
  const response = await api.post('/impostos', imposto)
  return response.data.data
}

export const updateImposto = async (id: number, imposto: Partial<Imposto>): Promise<Imposto> => {
  const response = await api.put(`/impostos/${id}`, imposto)
  return response.data.data
}

export const deleteImposto = async (id: number): Promise<void> => {
  await api.delete(`/impostos/${id}`)
}

export const pagarImposto = async (id: number, dataPagamento?: string): Promise<Imposto> => {
  const response = await api.post(`/impostos/${id}/pagar`, { data_pagamento: dataPagamento })
  return response.data.data
}

// Interfaces para itens de venda

export interface CreateVendaItemData {
  produto_id?: string
  grua_id?: string
  descricao: string
  quantidade: number
  valor_unitario: number
}

// Funções para gerenciar itens de venda (com retry logic)
export const getVendaItens = async (vendaId: number): Promise<VendaItem[]> => {
  return apiWithRetry(async () => {
    const response = await api.get(`/vendas/${vendaId}/itens`)
    return response.data.data
  })
}

export const addVendaItem = async (vendaId: number, item: CreateVendaItemData): Promise<VendaItem> => {
  return apiWithRetry(async () => {
    const response = await api.post(`/vendas/${vendaId}/itens`, item)
    return response.data.data
  }, { maxRetries: 2 })
}

export const updateVendaItem = async (vendaId: number, itemId: number, item: Partial<CreateVendaItemData>): Promise<VendaItem> => {
  return apiWithRetry(async () => {
    const response = await api.put(`/vendas/${vendaId}/itens/${itemId}`, item)
    return response.data.data
  }, { maxRetries: 2 })
}

export const deleteVendaItem = async (vendaId: number, itemId: number): Promise<void> => {
  return apiWithRetry(async () => {
    await api.delete(`/vendas/${vendaId}/itens/${itemId}`)
  }, { maxRetries: 1 })
}

// Função para confirmar venda e criar movimentações (com retry logic)
export const confirmarVenda = async (vendaId: number): Promise<{ venda: Venda; movimentacoes: any[] }> => {
  return apiWithRetry(async () => {
    const response = await api.post(`/vendas/${vendaId}/confirmar`)
    return response.data.data
  }, { maxRetries: 2 })
}

// Função para criar venda a partir de orçamento (com retry logic)
export const createVendaFromOrcamento = async (orcamentoId: number): Promise<Venda> => {
  return apiWithRetry(async () => {
    const response = await api.post(`/vendas/from-orcamento/${orcamentoId}`)
    return response.data.data
  }, { maxRetries: 2 })
}
