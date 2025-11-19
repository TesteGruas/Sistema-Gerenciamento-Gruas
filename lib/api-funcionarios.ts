// API client para funcionários
import { buildApiUrl, API_ENDPOINTS, fetchWithAuth } from './api'

// Interfaces baseadas no backend funcionarios.js
export interface FuncionarioBackend {
  id: number
  nome: string
  cargo: string // Manter para compatibilidade - valor antigo (string)
  cargo_id?: number // Novo - FK para tabela cargos
  cargo_info?: { // Novo - retornado via JOIN
    id: number
    nome: string
    nivel: string
    descricao?: string
  }
  telefone?: string
  email?: string
  cpf?: string
  turno: 'Diurno' | 'Noturno' | 'Sob Demanda'
  status: 'Ativo' | 'Inativo' | 'Férias'
  data_admissao?: string
  salario?: number
  observacoes?: string
  created_at: string
  updated_at: string
  // Campos adicionais retornados pela API
  usuario_criado?: boolean
  usuario_id?: number
  usuario_existe?: boolean
  usuario?: {
    id: number
    nome: string
    email: string
    status: string
  }
}

export interface FuncionarioCreateData {
  nome: string
  cargo: 'Operador' | 'Sinaleiro' | 'Técnico Manutenção' | 'Supervisor' | 'Mecânico' | 'Engenheiro' | 'Chefe de Obras'
  telefone?: string
  email?: string
  cpf?: string
  turno?: 'Diurno' | 'Noturno' | 'Sob Demanda'
  status?: 'Ativo' | 'Inativo' | 'Férias'
  data_admissao?: string
  salario?: number
  observacoes?: string
  // Campos para criação do usuário
  criar_usuario?: boolean
  usuario_senha?: string
}

export interface FuncionarioUpdateData {
  nome?: string
  cargo?: 'Operador' | 'Sinaleiro' | 'Técnico Manutenção' | 'Supervisor' | 'Mecânico' | 'Engenheiro' | 'Chefe de Obras'
  telefone?: string
  email?: string
  cpf?: string
  turno?: 'Diurno' | 'Noturno' | 'Sob Demanda'
  status?: 'Ativo' | 'Inativo' | 'Férias'
  data_admissao?: string
  salario?: number
  observacoes?: string
  // Campos para criação do usuário (apenas para compatibilidade, não são salvos na tabela)
  criar_usuario?: boolean
  usuario_senha?: string
}

export interface FuncionariosResponse {
  success: boolean
  data: FuncionarioBackend[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface FuncionarioResponse {
  success: boolean
  data: FuncionarioBackend
}

// ========================================
// INTERFACES PARA DOCUMENTOS
// ========================================

export interface FuncionarioDocumento {
  id: number
  funcionario_id: number
  tipo: 'rg' | 'cpf' | 'ctps' | 'pis' | 'pasep' | 'titulo_eleitor' | 'certificado_reservista' | 
        'cnh' | 'certificado_aso' | 'certificado_nr' | 'comprovante_residencia' | 
        'certidao_nascimento' | 'certidao_casamento' | 'outros'
  nome: string
  numero: string
  orgao_emissor?: string
  data_emissao?: string
  data_vencimento?: string
  arquivo_url?: string
  observacoes?: string
  created_at: string
  updated_at: string
  // Dados do funcionário (se retornado pela API)
  funcionarios?: {
    nome: string
    cpf?: string
    cargo?: string
  }
}

export interface DocumentoCreateData {
  funcionario_id: number
  tipo: string
  nome: string
  numero: string
  orgao_emissor?: string
  data_emissao?: string
  data_vencimento?: string
  arquivo_url?: string
  observacoes?: string
}

export interface DocumentoUpdateData {
  nome?: string
  numero?: string
  orgao_emissor?: string
  data_emissao?: string
  data_vencimento?: string
  arquivo_url?: string
  observacoes?: string
}

export interface DocumentosResponse {
  success: boolean
  data: FuncionarioDocumento[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  funcionario?: string
}

export interface DocumentoResponse {
  success: boolean
  data: FuncionarioDocumento
  message?: string
}

// Função para obter token de autenticação
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

// Função para fazer requisições autenticadas
const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetchWithAuth(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      if (errorData.details) {
        (error as any).details = errorData.details;
      }
      if (errorData.error) {
        (error as any).error = errorData.error;
      }
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// API functions
export const funcionariosApi = {
  // Listar todos os funcionários
  async listarFuncionarios(params?: {
    page?: number
    limit?: number
    cargo?: string
    status?: string
    turno?: string
    search?: string
  }): Promise<FuncionariosResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.cargo) searchParams.append('cargo', params.cargo)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.turno) searchParams.append('turno', params.turno)
    if (params?.search) searchParams.append('search', params.search)

    const url = buildApiUrl(`${API_ENDPOINTS.FUNCIONARIOS}?${searchParams.toString()}`)
    return apiRequest(url)
  },

  // Buscar funcionários por nome ou cargo
  async buscarFuncionarios(termo: string, filtros?: {
    cargo?: string
    status?: string
  }, options?: { signal?: AbortSignal }): Promise<{ success: boolean; data: FuncionarioBackend[] }> {
    if (!termo || termo.length < 2) {
      return { success: true, data: [] }
    }

    const searchParams = new URLSearchParams()
    searchParams.append('page', '1')
    searchParams.append('limit', '100')
    searchParams.append('search', termo) // Parâmetro de pesquisa por nome (backend espera 'search', não 'q')
    
    if (filtros?.cargo) searchParams.append('cargo', filtros.cargo)
    if (filtros?.status) searchParams.append('status', filtros.status)

    const url = buildApiUrl(`${API_ENDPOINTS.FUNCIONARIOS}?${searchParams.toString()}`)
    return apiRequest(url, { signal: options?.signal })
  },

  // Obter funcionário por ID
  async obterFuncionario(id: number): Promise<FuncionarioResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.FUNCIONARIOS}/${id}`)
    return apiRequest(url)
  },

  // Criar novo funcionário
  async criarFuncionario(data: FuncionarioCreateData): Promise<FuncionarioResponse> {
    const url = buildApiUrl(API_ENDPOINTS.FUNCIONARIOS)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Atualizar funcionário
  async atualizarFuncionario(id: number, data: FuncionarioUpdateData): Promise<FuncionarioResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.FUNCIONARIOS}/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Excluir funcionário
  async excluirFuncionario(id: number): Promise<{ success: boolean; message: string }> {
    const url = buildApiUrl(`${API_ENDPOINTS.FUNCIONARIOS}/${id}`)
    return apiRequest(url, {
      method: 'DELETE',
    })
  },

  // Desassociar funcionário de todas as gruas ativas
  async desassociarFuncionarioDasGruas(id: number): Promise<{ 
    success: boolean; 
    message: string; 
    desassociacoes: number;
    gruas_desassociadas: any[];
  }> {
    const url = buildApiUrl(`${API_ENDPOINTS.FUNCIONARIOS}/${id}/desassociar-gruas`)
    return apiRequest(url, {
      method: 'POST',
    })
  },

  // ========================================
  // FUNÇÕES PARA DOCUMENTOS
  // ========================================

  // Listar documentos (todos ou filtrados)
  async listarDocumentos(params?: {
    page?: number
    limit?: number
    funcionario_id?: number
    tipo?: string
  }): Promise<DocumentosResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.funcionario_id) searchParams.append('funcionario_id', params.funcionario_id.toString())
    if (params?.tipo) searchParams.append('tipo', params.tipo)

    const url = buildApiUrl(`funcionarios/documentos?${searchParams.toString()}`)
    return apiRequest(url)
  },

  // Listar documentos de um funcionário específico
  async listarDocumentosFuncionario(funcionarioId: number): Promise<DocumentosResponse> {
    const url = buildApiUrl(`funcionarios/documentos/funcionario/${funcionarioId}`)
    return apiRequest(url)
  },

  // Obter documento específico
  async obterDocumento(id: number): Promise<DocumentoResponse> {
    const url = buildApiUrl(`funcionarios/documentos/${id}`)
    return apiRequest(url)
  },

  // Criar novo documento
  async criarDocumento(data: DocumentoCreateData): Promise<DocumentoResponse> {
    const url = buildApiUrl('funcionarios/documentos')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Atualizar documento
  async atualizarDocumento(id: number, data: DocumentoUpdateData): Promise<DocumentoResponse> {
    const url = buildApiUrl(`funcionarios/documentos/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Excluir documento
  async excluirDocumento(id: number): Promise<{ success: boolean; message: string }> {
    const url = buildApiUrl(`funcionarios/documentos/${id}`)
    return apiRequest(url, {
      method: 'DELETE',
    })
  }
}

// Funções utilitárias para converter dados entre frontend e backend
export const converterFuncionarioBackendParaFrontend = (funcionarioBackend: FuncionarioBackend) => {
  return {
    id: funcionarioBackend.id.toString(),
    name: funcionarioBackend.nome,
    role: funcionarioBackend.cargo,
    status: funcionarioBackend.status,
    phone: funcionarioBackend.telefone || '',
    email: funcionarioBackend.email || '',
    cpf: funcionarioBackend.cpf || '',
    turno: funcionarioBackend.turno,
    hireDate: funcionarioBackend.data_admissao || '',
    salary: funcionarioBackend.salario || 0,
    observations: funcionarioBackend.observacoes || '',
    createdAt: funcionarioBackend.created_at,
    updatedAt: funcionarioBackend.updated_at
  }
}

export const converterFuncionarioFrontendParaBackend = (funcionarioFrontend: any): FuncionarioCreateData => {
  return {
    nome: funcionarioFrontend.name,
    cargo: funcionarioFrontend.role,
    status: funcionarioFrontend.status || 'Ativo',
    telefone: funcionarioFrontend.phone,
    email: funcionarioFrontend.email,
    cpf: funcionarioFrontend.cpf,
    turno: funcionarioFrontend.turno || 'Diurno',
    data_admissao: funcionarioFrontend.hireDate,
    salario: funcionarioFrontend.salary,
    observacoes: funcionarioFrontend.observations
  }
}

export default funcionariosApi
