// API client completo para RH - MVP Essencial
import { buildApiUrl, API_ENDPOINTS, fetchWithAuth } from './api'

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
// INTERFACES PARA VALES
// ========================================

export interface Vale {
  id: number
  funcionario_id: number
  tipo: 'vale-transporte' | 'vale-refeicao' | 'vale-alimentacao' | 'vale-combustivel' | 'outros'
  descricao: string
  valor: number
  data_solicitacao: string
  data_aprovacao?: string
  data_pagamento?: string
  status: 'solicitado' | 'aprovado' | 'pago' | 'rejeitado'
  aprovado_por?: number
  observacoes?: string
  created_at: string
  updated_at: string
}

// ========================================
// INTERFACES PARA HORAS MENSAIS
// ========================================

export interface HorasMensais {
  id: number
  funcionario_id: number
  mes: string // formato YYYY-MM
  horas_trabalhadas: number
  horas_extras: number
  dias_trabalhados: number
  valor_hora: number
  total_horas: number
  total_valor: number
  status: 'calculado' | 'pago' | 'pendente'
  created_at: string
  updated_at: string
}

// ========================================
// INTERFACES PARA FOLHA DE PAGAMENTO
// ========================================

export interface FolhaPagamento {
  id: number
  funcionario_id: number
  mes: string // formato YYYY-MM
  salario_base: number
  horas_trabalhadas: number
  horas_extras: number
  valor_hora_extra: number
  total_proventos: number
  total_descontos: number
  salario_liquido: number
  status: 'calculado' | 'pago' | 'pendente'
  data_pagamento?: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface TipoDesconto {
  id: number
  tipo: string
  descricao: string
  valor?: number
  percentual?: number
  obrigatorio: boolean
  created_at: string
  updated_at: string
}

export interface TipoBeneficio {
  id: number
  tipo: string
  descricao: string
  valor: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface FuncionarioDesconto {
  id: number
  funcionario_id: number
  folha_pagamento_id: number
  tipo_desconto_id: number
  valor: number
  created_at: string
  updated_at: string
}

export interface FuncionarioBeneficio {
  id: number
  funcionario_id: number
  folha_pagamento_id: number
  tipo_beneficio_id: number
  valor: number
  created_at: string
  updated_at: string
}

// ========================================
// INTERFACES PARA HISTÓRICO RH
// ========================================

export interface HistoricoRH {
  id: number
  funcionario_id: number
  tipo: 'admissao' | 'promocao' | 'transferencia' | 'obra' | 'salario' | 'ferias' | 'demissao'
  titulo: string
  descricao: string
  data: string
  valor?: number
  obra_id?: number
  status: 'ativo' | 'inativo' | 'pendente'
  created_at: string
  updated_at: string
}

// ========================================
// INTERFACES PARA RELATÓRIOS
// ========================================

export interface RelatorioRH {
  id: number
  tipo: string
  periodo: string
  parametros?: any
  status: 'Gerado' | 'Processando' | 'Erro'
  arquivo_url?: string
  gerado_por: number
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
  try {
    const response = await fetchWithAuth(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
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
  
  async listarCargos(params?: {
    page?: number
    limit?: number
    search?: string
    nivel?: string
    ativo?: boolean
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.nivel) searchParams.append('nivel', params.nivel)
    if (params?.ativo !== undefined) searchParams.append('ativo', params.ativo.toString())

    const url = buildApiUrl(`cargos?${searchParams.toString()}`)
    return apiRequest(url)
  },

  async obterCargo(id: number) {
    const url = buildApiUrl(`cargos/${id}`)
    return apiRequest(url)
  },

  async criarCargo(data: Partial<Cargo>) {
    const url = buildApiUrl('cargos')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async atualizarCargo(id: number, data: Partial<Cargo>) {
    const url = buildApiUrl(`cargos/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async excluirCargo(id: number) {
    const url = buildApiUrl(`cargos/${id}`)
    return apiRequest(url, {
      method: 'DELETE',
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
  // VALES
  // ========================================
  
  async listarVales(params?: {
    funcionario_id?: number
    tipo?: string
    status?: string
    mes?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.funcionario_id) searchParams.append('funcionario_id', params.funcionario_id.toString())
    if (params?.tipo) searchParams.append('tipo', params.tipo)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.mes) searchParams.append('mes', params.mes)

    const url = buildApiUrl(`vales?${searchParams.toString()}`)
    return apiRequest(url)
  },

  async obterVale(id: number) {
    const url = buildApiUrl(`vales/${id}`)
    return apiRequest(url)
  },

  async criarVale(data: Partial<Vale>) {
    const url = buildApiUrl('vales')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async aprovarVale(id: number) {
    const url = buildApiUrl(`vales/${id}/aprovar`)
    return apiRequest(url, {
      method: 'POST',
    })
  },

  async pagarVale(id: number, data_pagamento?: string) {
    const url = buildApiUrl(`vales/${id}/pagar`)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ data_pagamento }),
    })
  },

  async rejeitarVale(id: number, motivo?: string) {
    const url = buildApiUrl(`vales/${id}/rejeitar`)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    })
  },

  // ========================================
  // HORAS MENSAIS
  // ========================================
  
  async listarHorasMensais(params?: {
    funcionario_id?: number
    mes?: string
    status?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.funcionario_id) searchParams.append('funcionario_id', params.funcionario_id.toString())
    if (params?.mes) searchParams.append('mes', params.mes)
    if (params?.status) searchParams.append('status', params.status)

    const url = buildApiUrl(`horas-mensais?${searchParams.toString()}`)
    return apiRequest(url)
  },

  async obterHorasMensais(id: number) {
    const url = buildApiUrl(`horas-mensais/${id}`)
    return apiRequest(url)
  },

  async criarHorasMensais(data: Partial<HorasMensais>) {
    const url = buildApiUrl('horas-mensais')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async atualizarHorasMensais(id: number, data: Partial<HorasMensais>) {
    const url = buildApiUrl(`horas-mensais/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async calcularHorasMensais(id: number) {
    const url = buildApiUrl(`horas-mensais/${id}/calcular`)
    return apiRequest(url, {
      method: 'POST',
    })
  },

  // ========================================
  // FOLHA DE PAGAMENTO
  // ========================================
  
  async listarFolhasPagamento(params?: {
    funcionario_id?: number
    mes?: string
    status?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.funcionario_id) searchParams.append('funcionario_id', params.funcionario_id.toString())
    if (params?.mes) searchParams.append('mes', params.mes)
    if (params?.status) searchParams.append('status', params.status)

    const url = buildApiUrl(`remuneracao/folha-pagamento?${searchParams.toString()}`)
    return apiRequest(url)
  },

  async obterFolhaPagamento(id: number) {
    const url = buildApiUrl(`remuneracao/folha-pagamento/${id}`)
    return apiRequest(url)
  },

  async criarFolhaPagamento(data: Partial<FolhaPagamento>) {
    const url = buildApiUrl('remuneracao/folha-pagamento')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async atualizarFolhaPagamento(id: number, data: Partial<FolhaPagamento>) {
    const url = buildApiUrl(`remuneracao/folha-pagamento/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async processarPagamentoFolha(id: number, data_pagamento: string) {
    const url = buildApiUrl(`remuneracao/folha-pagamento/${id}/processar`)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ data_pagamento }),
    })
  },

  // Tipos de Descontos
  async listarTiposDescontos() {
    const url = buildApiUrl('remuneracao/descontos-tipo')
    return apiRequest(url)
  },

  async criarTipoDesconto(data: Partial<TipoDesconto>) {
    const url = buildApiUrl('remuneracao/descontos-tipo')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Tipos de Benefícios
  async listarTiposBeneficios() {
    const url = buildApiUrl('remuneracao/beneficios-tipo')
    return apiRequest(url)
  },

  async criarTipoBeneficio(data: Partial<TipoBeneficio>) {
    const url = buildApiUrl('remuneracao/beneficios-tipo')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Descontos do Funcionário
  async adicionarDescontoFuncionario(data: Partial<FuncionarioDesconto>) {
    const url = buildApiUrl('remuneracao/funcionario-descontos')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Benefícios do Funcionário
  async listarBeneficiosFuncionarios(params?: {
    page?: number
    limit?: number
    funcionario_id?: number
    ativo?: boolean
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.funcionario_id) searchParams.append('funcionario_id', params.funcionario_id.toString())
    if (params?.ativo !== undefined) searchParams.append('ativo', params.ativo.toString())

    const url = buildApiUrl(`remuneracao/funcionario-beneficios?${searchParams.toString()}`)
    return apiRequest(url)
  },

  async adicionarBeneficioFuncionario(data: Partial<FuncionarioBeneficio>) {
    const url = buildApiUrl('remuneracao/funcionario-beneficios')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async atualizarBeneficioFuncionario(id: number, data: Partial<FuncionarioBeneficio>) {
    const url = buildApiUrl(`remuneracao/funcionario-beneficios/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async excluirBeneficioFuncionario(id: number) {
    const url = buildApiUrl(`remuneracao/funcionario-beneficios/${id}`)
    return apiRequest(url, {
      method: 'DELETE',
    })
  },

  // ========================================
  // HISTÓRICO RH
  // ========================================
  
  async listarHistoricoRH(params?: {
    funcionario_id?: number
    tipo?: string
    data_inicio?: string
    data_fim?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.funcionario_id) searchParams.append('funcionario_id', params.funcionario_id.toString())
    if (params?.tipo) searchParams.append('tipo', params.tipo)
    if (params?.data_inicio) searchParams.append('data_inicio', params.data_inicio)
    if (params?.data_fim) searchParams.append('data_fim', params.data_fim)

    const url = buildApiUrl(`historico-rh?${searchParams.toString()}`)
    return apiRequest(url)
  },

  async obterHistoricoFuncionario(funcionarioId: number) {
    const url = buildApiUrl(`historico-rh/funcionario/${funcionarioId}`)
    return apiRequest(url)
  },

  async obterTimelineFuncionario(funcionarioId: number) {
    const url = buildApiUrl(`historico-rh/timeline/${funcionarioId}`)
    return apiRequest(url)
  },

  async criarHistoricoRH(data: Partial<HistoricoRH>) {
    const url = buildApiUrl('historico-rh')
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async atualizarHistoricoRH(id: number, data: Partial<HistoricoRH>) {
    const url = buildApiUrl(`historico-rh/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async excluirHistoricoRH(id: number) {
    const url = buildApiUrl(`historico-rh/${id}`)
    return apiRequest(url, {
      method: 'DELETE',
    })
  },

  // ========================================
  // RELATÓRIOS RH
  // ========================================
  
  async listarRelatoriosRH(params?: {
    tipo?: string
    periodo?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.tipo) searchParams.append('tipo', params.tipo)
    if (params?.periodo) searchParams.append('periodo', params.periodo)

    const url = buildApiUrl(`relatorios-rh?${searchParams.toString()}`)
    return apiRequest(url)
  },

  async obterRelatorioRH(id: number) {
    const url = buildApiUrl(`relatorios-rh/${id}`)
    return apiRequest(url)
  },

  async gerarRelatorioRH(tipo: string, data: {
    periodo: string
    gerado_por: number
    parametros?: any
  }) {
    const url = buildApiUrl(`relatorios-rh/gerar/${tipo}`)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async exportarRelatorioRH(id: number, formato: 'pdf' | 'excel' | 'csv') {
    const url = buildApiUrl(`relatorios-rh/${id}/exportar?formato=${formato}`)
    return apiRequest(url)
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
