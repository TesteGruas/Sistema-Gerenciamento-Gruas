// API client para remuneração (folha de pagamento, descontos, benefícios)
import { buildApiUrl, API_ENDPOINTS, fetchWithAuth } from './api'

// ============== Interfaces ==============

export interface FolhaPagamento {
  id: number
  funcionario_id: number
  mes: string
  salario_base: number
  horas_trabalhadas: number
  horas_extras: number
  valor_hora_extra: number
  total_proventos: number
  total_descontos: number
  salario_liquido: number
  status: 'pendente' | 'processado' | 'pago'
  observacoes?: string
  created_at: string
  updated_at: string
  funcionarios?: {
    nome: string
    cargo: string
    cpf: string
  }
}

export interface DescontoTipo {
  id: number
  tipo: string
  descricao: string
  valor: number
  percentual: number
  obrigatorio: boolean
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface BeneficioTipo {
  id: number
  tipo: string
  descricao: string
  valor: number
  percentual: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface FuncionarioDesconto {
  id: number
  folha_pagamento_id: number
  desconto_tipo_id: number
  valor: number
  observacoes?: string
  created_at: string
  descontos_tipo?: DescontoTipo
}

export interface FuncionarioBeneficio {
  id: number
  funcionario_id: number
  beneficio_tipo_id: number
  data_inicio: string
  data_fim?: string
  status: 'ativo' | 'inativo'
  observacoes?: string
  created_at: string
  updated_at: string
  funcionarios?: {
    nome: string
    cargo: string
  }
  beneficios_tipo?: BeneficioTipo
}

// ============== DTOs ==============

export interface FolhaPagamentoCreateData {
  funcionario_id: number
  mes: string
  salario_base: number
  horas_trabalhadas?: number
  horas_extras?: number
  valor_hora_extra?: number
  observacoes?: string
}

export interface DescontoTipoCreateData {
  tipo: string
  descricao: string
  valor?: number
  percentual?: number
  obrigatorio?: boolean
}

export interface BeneficioTipoCreateData {
  tipo: string
  descricao: string
  valor: number
  percentual?: number
}

export interface FuncionarioDescontoCreateData {
  folha_pagamento_id: number
  desconto_tipo_id: number
  valor: number
  observacoes?: string
}

export interface FuncionarioBeneficioCreateData {
  funcionario_id: number
  beneficio_tipo_id: number
  data_inicio: string
  observacoes?: string
}

// ============== Respostas da API ==============

export interface FolhaPagamentoResponse {
  success: boolean
  data: FolhaPagamento[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface FolhaPagamentoSingleResponse {
  success: boolean
  data: FolhaPagamento & {
    descontos?: FuncionarioDesconto[]
  }
  message?: string
}

export interface DescontoTipoResponse {
  success: boolean
  data: DescontoTipo[]
}

export interface BeneficioTipoResponse {
  success: boolean
  data: BeneficioTipo[]
}

export interface FuncionarioBeneficioResponse {
  success: boolean
  data: FuncionarioBeneficio[]
}

const BASE_URL = 'remuneracao'

// ============== APIs de Folha de Pagamento ==============

/**
 * Listar folhas de pagamento
 */
export async function getFolhasPagamento(params?: {
  page?: number
  limit?: number
  funcionario_id?: number
  mes?: string
  status?: string
}): Promise<FolhaPagamentoResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.funcionario_id) queryParams.append('funcionario_id', params.funcionario_id.toString())
  if (params?.mes) queryParams.append('mes', params.mes)
  if (params?.status) queryParams.append('status', params.status)

  const url = buildApiUrl(`${BASE_URL}/folha-pagamento?${queryParams.toString()}`)
  
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar folhas de pagamento' }))
    throw new Error(error.message || 'Erro ao buscar folhas de pagamento')
  }

  return response.json()
}

/**
 * Obter folha de pagamento por ID
 */
export async function getFolhaPagamento(id: number): Promise<FolhaPagamentoSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/folha-pagamento/${id}`)
  
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar folha de pagamento' }))
    throw new Error(error.message || 'Erro ao buscar folha de pagamento')
  }

  return response.json()
}

/**
 * Criar folha de pagamento
 */
export async function createFolhaPagamento(data: FolhaPagamentoCreateData): Promise<FolhaPagamentoSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/folha-pagamento`)
  
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao criar folha de pagamento' }))
    throw new Error(error.message || 'Erro ao criar folha de pagamento')
  }

  return response.json()
}

/**
 * Atualizar folha de pagamento
 */
export async function updateFolhaPagamento(id: number, data: Partial<FolhaPagamentoCreateData>): Promise<FolhaPagamentoSingleResponse> {
  const url = buildApiUrl(`${BASE_URL}/folha-pagamento/${id}`)
  
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao atualizar folha de pagamento' }))
    throw new Error(error.message || 'Erro ao atualizar folha de pagamento')
  }

  return response.json()
}

// ============== APIs de Tipos de Descontos ==============

/**
 * Listar tipos de descontos
 */
export async function getDescontosTipo(ativo = true): Promise<DescontoTipoResponse> {
  const url = buildApiUrl(`${BASE_URL}/descontos-tipo?ativo=${ativo}`)
  
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar tipos de descontos' }))
    throw new Error(error.message || 'Erro ao buscar tipos de descontos')
  }

  return response.json()
}

/**
 * Criar tipo de desconto
 */
export async function createDescontoTipo(data: DescontoTipoCreateData): Promise<{ success: boolean; data: DescontoTipo; message: string }> {
  const url = buildApiUrl(`${BASE_URL}/descontos-tipo`)
  
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao criar tipo de desconto' }))
    throw new Error(error.message || 'Erro ao criar tipo de desconto')
  }

  return response.json()
}

// ============== APIs de Tipos de Benefícios ==============

/**
 * Listar tipos de benefícios
 */
export async function getBeneficiosTipo(ativo = true): Promise<BeneficioTipoResponse> {
  const url = buildApiUrl(`${BASE_URL}/beneficios-tipo?ativo=${ativo}`)
  
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar tipos de benefícios' }))
    throw new Error(error.message || 'Erro ao buscar tipos de benefícios')
  }

  return response.json()
}

/**
 * Criar tipo de benefício
 */
export async function createBeneficioTipo(data: BeneficioTipoCreateData): Promise<{ success: boolean; data: BeneficioTipo; message: string }> {
  const url = buildApiUrl(`${BASE_URL}/beneficios-tipo`)
  
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao criar tipo de benefício' }))
    throw new Error(error.message || 'Erro ao criar tipo de benefício')
  }

  return response.json()
}

// ============== APIs de Descontos do Funcionário ==============

/**
 * Adicionar desconto à folha
 */
export async function addDescontoFolha(data: FuncionarioDescontoCreateData): Promise<{ success: boolean; data: FuncionarioDesconto; message: string }> {
  const url = buildApiUrl(`${BASE_URL}/funcionario-descontos`)
  
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao adicionar desconto' }))
    throw new Error(error.message || 'Erro ao adicionar desconto')
  }

  return response.json()
}

// ============== APIs de Benefícios do Funcionário ==============

/**
 * Listar benefícios de funcionários
 */
export async function getFuncionarioBeneficios(params?: {
  funcionario_id?: number
  status?: string
}): Promise<FuncionarioBeneficioResponse> {
  const queryParams = new URLSearchParams()
  
  if (params?.funcionario_id) queryParams.append('funcionario_id', params.funcionario_id.toString())
  if (params?.status) queryParams.append('status', params.status)

  const url = buildApiUrl(`${BASE_URL}/funcionario-beneficios?${queryParams.toString()}`)
  
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao buscar benefícios' }))
    throw new Error(error.message || 'Erro ao buscar benefícios')
  }

  return response.json()
}

/**
 * Adicionar benefício ao funcionário
 */
export async function addBeneficioFuncionario(data: FuncionarioBeneficioCreateData): Promise<{ success: boolean; data: FuncionarioBeneficio; message: string }> {
  const url = buildApiUrl(`${BASE_URL}/funcionario-beneficios`)
  
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao adicionar benefício' }))
    throw new Error(error.message || 'Erro ao adicionar benefício')
  }

  return response.json()
}

/**
 * Atualizar benefício do funcionário
 */
export async function updateBeneficioFuncionario(id: number, data: Partial<FuncionarioBeneficioCreateData>): Promise<{ success: boolean; data: FuncionarioBeneficio; message: string }> {
  const url = buildApiUrl(`${BASE_URL}/funcionario-beneficios/${id}`)
  
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao atualizar benefício' }))
    throw new Error(error.message || 'Erro ao atualizar benefício')
  }

  return response.json()
}

