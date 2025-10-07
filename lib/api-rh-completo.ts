// API client completo para RH - MVP Essencial
import { buildApiUrl, API_ENDPOINTS } from './api'

// ========================================
// INTERFACES PARA FUNCIONÁRIOS COMPLETOS
// ========================================

export interface FuncionarioCompleto {
  id: number
  // Dados Pessoais
  nome: string
  cpf: string
  rg?: string
  data_nascimento?: string
  sexo?: 'M' | 'F' | 'Outro'
  estado_civil?: 'Solteiro' | 'Casado' | 'Divorciado' | 'Viúvo' | 'União Estável'
  nacionalidade?: string
  naturalidade?: string
  
  // Contato
  telefone?: string
  celular?: string
  email?: string
  endereco?: {
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
    cep?: string
  }
  
  // Dados do Vínculo
  cargo_id: number
  setor_id: number
  centro_custo_id?: number
  data_admissao: string
  data_demissao?: string
  status: 'Ativo' | 'Inativo' | 'Férias' | 'Licença' | 'Afastado'
  tipo_contrato: 'CLT' | 'PJ' | 'Estagiário' | 'Terceirizado'
  regime_trabalho: 'Integral' | 'Parcial' | 'Temporário'
  
  // Remuneração
  salario_base: number
  adicionais: AdicionalRemuneracao[]
  beneficios: BeneficioFuncionario[]
  
  // Documentos
  documentos: DocumentoFuncionario[]
  
  // Auditoria
  created_at: string
  updated_at: string
  created_by: number
  updated_by: number
}

// ========================================
// INTERFACES PARA ESTRUTURA ORGANIZACIONAL
// ========================================

export interface Cargo {
  id: number
  nome: string
  descricao?: string
  nivel: 'Operacional' | 'Técnico' | 'Supervisor' | 'Gerencial' | 'Diretoria'
  salario_minimo?: number
  salario_maximo?: number
  requisitos?: string[]
  competencias?: string[]
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Setor {
  id: number
  nome: string
  descricao?: string
  centro_custo_id?: number
  responsavel_id?: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CentroCusto {
  id: number
  codigo: string
  nome: string
  descricao?: string
  orcamento?: number
  ativo: boolean
  created_at: string
  updated_at: string
}

// ========================================
// INTERFACES PARA DOCUMENTOS
// ========================================

export interface DocumentoFuncionario {
  id: number
  funcionario_id: number
  tipo: 'CTPS' | 'RG' | 'CPF' | 'Título' | 'Reservista' | 'Diploma' | 'Certificado' | 'Atestado' | 'Exame' | 'Outro'
  nome: string
  numero?: string
  orgao_emissor?: string
  data_emissao?: string
  data_vencimento?: string
  arquivo_url?: string
  observacoes?: string
  confidencial: boolean
  created_at: string
  updated_at: string
}

// ========================================
// INTERFACES PARA REMUNERAÇÃO
// ========================================

export interface AdicionalRemuneracao {
  id: number
  funcionario_id: number
  tipo: 'Periculosidade' | 'Insalubridade' | 'Adicional Noturno' | 'Hora Extra' | 'Comissão' | 'Gratificação' | 'Outro'
  descricao: string
  valor: number
  percentual?: number
  base_calculo?: 'Salário Base' | 'Salário + Adicionais'
  ativo: boolean
  data_inicio: string
  data_fim?: string
  created_at: string
  updated_at: string
}

export interface BeneficioFuncionario {
  id: number
  funcionario_id: number
  tipo: 'Vale Refeição' | 'Vale Alimentação' | 'Plano Saúde' | 'Plano Odontológico' | 'Seguro Vida' | 'Auxílio Creche' | 'Outro'
  descricao: string
  valor: number
  ativo: boolean
  data_inicio: string
  data_fim?: string
  created_at: string
  updated_at: string
}

// ========================================
// INTERFACES PARA PONTO/FREQUÊNCIA
// ========================================

export interface RegistroPonto {
  id: number
  funcionario_id: number
  data: string
  entrada?: string
  saida?: string
  entrada_almoco?: string
  saida_almoco?: string
  horas_trabalhadas?: number
  horas_extras?: number
  atrasos?: number
  faltas?: number
  observacoes?: string
  tipo: 'Normal' | 'Hora Extra' | 'Compensação' | 'Folga'
  status: 'Pendente' | 'Aprovado' | 'Rejeitado'
  aprovado_por?: number
  data_aprovacao?: string
  created_at: string
  updated_at: string
}

// ========================================
// INTERFACES PARA FÉRIAS E AFASTAMENTOS
// ========================================

export interface Ferias {
  id: number
  funcionario_id: number
  data_inicio: string
  data_fim: string
  dias_solicitados: number
  saldo_anterior: number
  saldo_restante: number
  status: 'Solicitado' | 'Aprovado' | 'Em Andamento' | 'Finalizado' | 'Cancelado'
  observacoes?: string
  aprovado_por?: number
  data_aprovacao?: string
  created_at: string
  updated_at: string
}

export interface Afastamento {
  id: number
  funcionario_id: number
  tipo: 'Licença Médica' | 'Licença Maternidade' | 'Licença Paternidade' | 'Licença Sem Vencimento' | 'Suspensão' | 'Outro'
  data_inicio: string
  data_fim?: string
  dias_solicitados: number
  status: 'Solicitado' | 'Aprovado' | 'Em Andamento' | 'Finalizado' | 'Cancelado'
  observacoes?: string
  documento_anexo?: string
  aprovado_por?: number
  data_aprovacao?: string
  created_at: string
  updated_at: string
}

// ========================================
// INTERFACES PARA RELATÓRIOS
// ========================================

export interface RelatorioFuncionarios {
  total_funcionarios: number
  funcionarios_ativos: number
  funcionarios_inativos: number
  funcionarios_ferias: number
  funcionarios_licenca: number
  por_cargo: Array<{
    cargo: string
    quantidade: number
  }>
  por_setor: Array<{
    setor: string
    quantidade: number
  }>
  por_centro_custo: Array<{
    centro_custo: string
    quantidade: number
  }>
}

export interface RelatorioFrequencia {
  funcionario_id: number
  funcionario_nome: string
  periodo: string
  dias_trabalhados: number
  faltas: number
  atrasos: number
  horas_extras: number
  percentual_frequencia: number
}

export interface RelatorioFerias {
  funcionario_id: number
  funcionario_nome: string
  saldo_ferias: number
  ferias_agendadas: number
  ferias_pendentes: number
  proxima_ferias?: string
}

// ========================================
// INTERFACES PARA PERMISSÕES E AUDITORIA
// ========================================

export interface PerfilUsuario {
  id: number
  nome: string
  descricao?: string
  permissoes: PermissaoRH[]
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface PermissaoRH {
  id: number
  modulo: 'funcionarios' | 'cargos' | 'setores' | 'ponto' | 'ferias' | 'remuneracao' | 'relatorios'
  acao: 'visualizar' | 'criar' | 'editar' | 'excluir' | 'aprovar'
  descricao: string
}

export interface AuditoriaRH {
  id: number
  tabela: string
  registro_id: number
  acao: 'CREATE' | 'UPDATE' | 'DELETE'
  dados_anteriores?: any
  dados_novos?: any
  usuario_id: number
  usuario_nome: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

// ========================================
// INTERFACES PARA LGPD
// ========================================

export interface ConsentimentoLGPD {
  id: number
  funcionario_id: number
  tipo_dados: 'Pessoais' | 'Sensíveis' | 'Biométricos'
  finalidade: string
  consentimento: boolean
  data_consentimento: string
  data_revogacao?: string
  observacoes?: string
}

export interface RetencaoDocumentos {
  id: number
  funcionario_id: number
  tipo_documento: string
  data_retencao: string
  prazo_retencao: number // em meses
  status: 'Ativo' | 'Expirado' | 'Eliminado'
  data_eliminacao?: string
  observacoes?: string
}

// ========================================
// API FUNCTIONS
// ========================================

// Função para obter token de autenticação
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

// Função para fazer requisições autenticadas
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken()
  
  if (!token) {
    console.warn('Token não encontrado, redirecionando para login...')
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
    throw new Error('Token de acesso requerido')
  }
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    
    // Tratar erro 403 com token inválido ou expirado
    if (response.status === 403 && errorData.error === "Token inválido ou expirado" && errorData.code === "INVALID_TOKEN") {
      console.warn('Token inválido ou expirado, removendo dados do localStorage e redirecionando para login...')
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('refresh_token')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Token inválido ou expirado. Redirecionando para login...')
    }
    
    // Tratar outros erros 401/403
    if (response.status === 401 || response.status === 403) {
      console.warn('Erro de autenticação, redirecionando para login...')
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('refresh_token')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    
    throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// API RH Completo
export const rhApi = {
  // ========================================
  // FUNCIONÁRIOS
  // ========================================
  
  async listarFuncionariosCompletos(params?: {
    page?: number
    limit?: number
    cargo_id?: number
    setor_id?: number
    status?: string
    centro_custo_id?: number
  }) {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.cargo_id) searchParams.append('cargo_id', params.cargo_id.toString())
    if (params?.setor_id) searchParams.append('setor_id', params.setor_id.toString())
    if (params?.status) searchParams.append('status', params.status)
    if (params?.centro_custo_id) searchParams.append('centro_custo_id', params.centro_custo_id.toString())

    const url = buildApiUrl(`rh/funcionarios?${searchParams.toString()}`)
    return apiRequest(url)
  },

  async obterFuncionarioCompleto(id: number) {
    const url = buildApiUrl(`rh/funcionarios/${id}`)
    return apiRequest(url)
  },

  async criarFuncionarioCompleto(data: Partial<FuncionarioCompleto>) {
    const url = buildApiUrl('rh/funcionarios')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async atualizarFuncionarioCompleto(id: number, data: Partial<FuncionarioCompleto>) {
    const url = buildApiUrl(`rh/funcionarios/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async excluirFuncionarioCompleto(id: number) {
    const url = buildApiUrl(`rh/funcionarios/${id}`)
    return apiRequest(url, {
      method: 'DELETE',
    })
  },

  // ========================================
  // CARGOS E SETORES
  // ========================================
  
  async listarCargos() {
    const url = buildApiUrl('rh/cargos')
    return apiRequest(url)
  },

  async criarCargo(data: Partial<Cargo>) {
    const url = buildApiUrl('rh/cargos')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async listarSetores() {
    const url = buildApiUrl('rh/setores')
    return apiRequest(url)
  },

  async criarSetor(data: Partial<Setor>) {
    const url = buildApiUrl('rh/setores')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async listarCentrosCusto() {
    const url = buildApiUrl('rh/centros-custo')
    return apiRequest(url)
  },

  async criarCentroCusto(data: Partial<CentroCusto>) {
    const url = buildApiUrl('rh/centros-custo')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // ========================================
  // DOCUMENTOS
  // ========================================
  
  async listarDocumentosFuncionario(funcionarioId: number) {
    const url = buildApiUrl(`rh/funcionarios/${funcionarioId}/documentos`)
    return apiRequest(url)
  },

  async adicionarDocumento(funcionarioId: number, data: Partial<DocumentoFuncionario>) {
    const url = buildApiUrl(`rh/funcionarios/${funcionarioId}/documentos`)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async atualizarDocumento(documentoId: number, data: Partial<DocumentoFuncionario>) {
    const url = buildApiUrl(`rh/documentos/${documentoId}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async excluirDocumento(documentoId: number) {
    const url = buildApiUrl(`rh/documentos/${documentoId}`)
    return apiRequest(url, {
      method: 'DELETE',
    })
  },

  // ========================================
  // PONTO/FREQUÊNCIA
  // ========================================
  
  async registrarPonto(data: Partial<RegistroPonto>) {
    const url = buildApiUrl('rh/ponto')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async listarRegistrosPonto(funcionarioId: number, periodo?: { inicio: string; fim: string }) {
    const searchParams = new URLSearchParams()
    if (periodo?.inicio) searchParams.append('inicio', periodo.inicio)
    if (periodo?.fim) searchParams.append('fim', periodo.fim)

    const url = buildApiUrl(`rh/funcionarios/${funcionarioId}/ponto?${searchParams.toString()}`)
    return apiRequest(url)
  },

  async aprovarRegistroPonto(registroId: number) {
    const url = buildApiUrl(`rh/ponto/${registroId}/aprovar`)
    return apiRequest(url, {
      method: 'POST',
    })
  },

  // ========================================
  // FÉRIAS E AFASTAMENTOS
  // ========================================
  
  async solicitarFerias(data: Partial<Ferias>) {
    const url = buildApiUrl('rh/ferias')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async listarFeriasFuncionario(funcionarioId: number) {
    const url = buildApiUrl(`rh/funcionarios/${funcionarioId}/ferias`)
    return apiRequest(url)
  },

  async aprovarFerias(feriasId: number) {
    const url = buildApiUrl(`rh/ferias/${feriasId}/aprovar`)
    return apiRequest(url, {
      method: 'POST',
    })
  },

  async solicitarAfastamento(data: Partial<Afastamento>) {
    const url = buildApiUrl('rh/afastamentos')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async listarAfastamentosFuncionario(funcionarioId: number) {
    const url = buildApiUrl(`rh/funcionarios/${funcionarioId}/afastamentos`)
    return apiRequest(url)
  },

  // ========================================
  // REMUNERAÇÃO
  // ========================================
  
  async adicionarAdicional(funcionarioId: number, data: Partial<AdicionalRemuneracao>) {
    const url = buildApiUrl(`rh/funcionarios/${funcionarioId}/adicionais`)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async adicionarBeneficio(funcionarioId: number, data: Partial<BeneficioFuncionario>) {
    const url = buildApiUrl(`rh/funcionarios/${funcionarioId}/beneficios`)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async calcularSalario(funcionarioId: number, mes: string, ano: string) {
    const url = buildApiUrl(`rh/funcionarios/${funcionarioId}/calcular-salario?mes=${mes}&ano=${ano}`)
    return apiRequest(url)
  },

  // ========================================
  // RELATÓRIOS
  // ========================================
  
  async obterRelatorioFuncionarios() {
    const url = buildApiUrl('rh/relatorios/funcionarios')
    return apiRequest(url)
  },

  async obterRelatorioFrequencia(periodo: { inicio: string; fim: string }) {
    const searchParams = new URLSearchParams()
    searchParams.append('inicio', periodo.inicio)
    searchParams.append('fim', periodo.fim)

    const url = buildApiUrl(`rh/relatorios/frequencia?${searchParams.toString()}`)
    return apiRequest(url)
  },

  async obterRelatorioFerias() {
    const url = buildApiUrl('rh/relatorios/ferias')
    return apiRequest(url)
  },

  async exportarRelatorio(tipo: string, formato: 'csv' | 'excel' | 'pdf', filtros?: any) {
    const url = buildApiUrl(`rh/relatorios/exportar?tipo=${tipo}&formato=${formato}`)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(filtros || {}),
    })
  },

  // ========================================
  // AUDITORIA E PERMISSÕES
  // ========================================
  
  async obterAuditoria(tabela?: string, registroId?: number) {
    const searchParams = new URLSearchParams()
    if (tabela) searchParams.append('tabela', tabela)
    if (registroId) searchParams.append('registro_id', registroId.toString())

    const url = buildApiUrl(`rh/auditoria?${searchParams.toString()}`)
    return apiRequest(url)
  },

  async obterPermissoesUsuario(usuarioId: number) {
    const url = buildApiUrl(`rh/usuarios/${usuarioId}/permissoes`)
    return apiRequest(url)
  },

  // ========================================
  // LGPD
  // ========================================
  
  async obterConsentimentos(funcionarioId: number) {
    const url = buildApiUrl(`rh/funcionarios/${funcionarioId}/consentimentos`)
    return apiRequest(url)
  },

  async registrarConsentimento(data: Partial<ConsentimentoLGPD>) {
    const url = buildApiUrl('rh/consentimentos')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async obterRetencaoDocumentos(funcionarioId: number) {
    const url = buildApiUrl(`rh/funcionarios/${funcionarioId}/retencao-documentos`)
    return apiRequest(url)
  }
}

export default rhApi
