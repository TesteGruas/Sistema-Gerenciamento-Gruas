import api from './api'

// Interfaces para orçamentos
export interface Orcamento {
  id: number
  cliente_id: number
  data_orcamento: string
  data_validade: string
  valor_total: number
  desconto: number
  observacoes?: string
  status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'vencido'
  vendedor_id?: number
  condicoes_pagamento?: string
  prazo_entrega?: string
  tipo_orcamento: 'equipamento' | 'servico' | 'locacao' | 'venda'
  data_envio?: string
  data_aprovacao?: string
  data_rejeicao?: string
  motivo_rejeicao?: string
  created_at: string
  updated_at: string
  // Relacionamentos
  clientes?: {
    id: number
    nome: string
    email: string
    telefone: string
    endereco?: string
    cnpj_cpf?: string
  }
  funcionarios?: {
    id: number
    nome: string
    email?: string
  }
  itens?: OrcamentoItem[]
}

export interface OrcamentoItem {
  id?: number
  orcamento_id?: number
  produto_servico: string
  descricao: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  tipo: 'produto' | 'servico' | 'equipamento'
  unidade?: string
  observacoes?: string
}

export interface CreateOrcamentoData {
  cliente_id: number
  data_orcamento: string
  data_validade: string
  valor_total: number
  desconto?: number
  observacoes?: string
  status?: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'vencido'
  vendedor_id?: number
  condicoes_pagamento?: string
  prazo_entrega?: string
  tipo_orcamento: 'equipamento' | 'servico' | 'locacao' | 'venda'
  itens?: Omit<OrcamentoItem, 'id' | 'orcamento_id'>[]
}

export interface UpdateOrcamentoData extends Partial<CreateOrcamentoData> {
  id: number
}

export interface OrcamentoFilters {
  page?: number
  limit?: number
  status?: string
  cliente_id?: number
  obra_id?: number
  data_inicio?: string
  data_fim?: string
  search?: string
}

export interface OrcamentoResponse {
  success: boolean
  data: Orcamento
  message?: string
}

export interface OrcamentosListResponse {
  success: boolean
  data: Orcamento[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Funções da API

// Listar orçamentos
export const getOrcamentos = async (filters?: OrcamentoFilters): Promise<OrcamentosListResponse> => {
  const params = new URLSearchParams()
  
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.status) params.append('status', filters.status)
  if (filters?.cliente_id) params.append('cliente_id', filters.cliente_id.toString())
  if (filters?.obra_id) params.append('obra_id', filters.obra_id.toString())
  if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio)
  if (filters?.data_fim) params.append('data_fim', filters.data_fim)
  if (filters?.search) params.append('search', filters.search)

  const response = await api.get(`/orcamentos?${params.toString()}`)
  
  // Transformar orcamento_itens para itens
  const transformedData = response.data.data.map((orcamento: any) => ({
    ...orcamento,
    itens: orcamento.orcamento_itens || []
  }))
  
  return {
    ...response.data,
    data: transformedData
  }
}

// Buscar orçamento por ID
export const getOrcamento = async (id: number): Promise<OrcamentoResponse> => {
  const response = await api.get(`/orcamentos/${id}`)
  return response.data
}

// Criar novo orçamento
export const createOrcamento = async (data: CreateOrcamentoData): Promise<OrcamentoResponse> => {
  const response = await api.post('/orcamentos', data)
  return response.data
}

// Atualizar orçamento
export const updateOrcamento = async (data: UpdateOrcamentoData): Promise<OrcamentoResponse> => {
  const { id, ...updateData } = data
  const response = await api.put(`/orcamentos/${id}`, updateData)
  return response.data
}

// Excluir orçamento
export const deleteOrcamento = async (id: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/orcamentos/${id}`)
  return response.data
}

// Enviar orçamento
export const enviarOrcamento = async (id: number, email?: string, observacoes?: string): Promise<OrcamentoResponse> => {
  const response = await api.post(`/orcamentos/${id}/enviar`, { email, observacoes })
  return response.data
}

// Aprovar orçamento
export const aprovarOrcamento = async (id: number): Promise<OrcamentoResponse> => {
  const response = await api.post(`/orcamentos/${id}/aprovar`)
  return response.data
}

// Rejeitar orçamento
export const rejeitarOrcamento = async (id: number, motivo: string): Promise<OrcamentoResponse> => {
  const response = await api.post(`/orcamentos/${id}/rejeitar`, { motivo })
  return response.data
}

// Gerar PDF do orçamento
export const gerarPDFOrcamento = async (id: number): Promise<{ success: boolean; data: Orcamento }> => {
  const response = await api.get(`/orcamentos/${id}/pdf`)
  return response.data
}

// Funções auxiliares

// Calcular valor total dos itens
export const calcularValorTotalItens = (itens: OrcamentoItem[]): number => {
  return itens.reduce((total, item) => total + item.valor_total, 0)
}

// Calcular valor total com desconto
export const calcularValorTotalComDesconto = (valorTotal: number, desconto: number): number => {
  return valorTotal - desconto
}

// Validar data de validade
export const validarDataValidade = (dataValidade: string): boolean => {
  const hoje = new Date()
  const validade = new Date(dataValidade)
  return validade > hoje
}

// Formatar status do orçamento
export const formatarStatusOrcamento = (status: string): { label: string; color: string } => {
  const statusMap = {
    rascunho: { label: 'Rascunho', color: 'bg-gray-500' },
    enviado: { label: 'Enviado', color: 'bg-blue-500' },
    aprovado: { label: 'Aprovado', color: 'bg-green-500' },
    rejeitado: { label: 'Rejeitado', color: 'bg-red-500' },
    vencido: { label: 'Vencido', color: 'bg-orange-500' }
  }
  
  return statusMap[status as keyof typeof statusMap] || { label: status, color: 'bg-gray-500' }
}

// Formatar tipo de orçamento
export const formatarTipoOrcamento = (tipo: string): string => {
  const tipoMap = {
    equipamento: 'Equipamento',
    servico: 'Serviço',
    locacao: 'Locação',
    venda: 'Venda'
  }
  
  return tipoMap[tipo as keyof typeof tipoMap] || tipo
}

// Gerar número do orçamento
export const gerarNumeroOrcamento = (): string => {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  const timestamp = Date.now().toString().slice(-4)
  
  return `ORC${ano}${mes}${dia}${timestamp}`
}

// Verificar se orçamento pode ser editado
export const podeEditarOrcamento = (status: string): boolean => {
  return status === 'rascunho'
}

// Verificar se orçamento pode ser excluído
export const podeExcluirOrcamento = (status: string): boolean => {
  return status === 'rascunho'
}

// Verificar se orçamento pode ser enviado
export const podeEnviarOrcamento = (status: string): boolean => {
  return status === 'rascunho'
}

// Verificar se orçamento pode ser aprovado
export const podeAprovarOrcamento = (status: string): boolean => {
  return status === 'enviado'
}

// Verificar se orçamento pode ser rejeitado
export const podeRejeitarOrcamento = (status: string): boolean => {
  return status === 'enviado'
}
