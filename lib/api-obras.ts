// API client para obras
import { buildApiUrl, API_ENDPOINTS, fetchWithAuth } from './api.ts'
import { gruaObraApi, converterGruaObraBackendParaFrontend } from './api-grua-obra'

// Interfaces baseadas no backend
export interface ObraBackend {
  id: number
  nome: string
  cliente_id: number
  endereco: string
  cidade: string
  estado: string
  tipo: string
  cep?: string
  contato_obra?: string
  telefone_obra?: string
  email_obra?: string
  status: 'Planejamento' | 'Em Andamento' | 'Pausada' | 'Concluída' | 'Cancelada'
  // Novos campos adicionados
  descricao?: string
  data_inicio?: string
  data_fim?: string
  orcamento?: number
  observacoes?: string
  responsavel_id?: number
  responsavel_nome?: string
  // Campos obrigatórios (CNO, ART, Apólice)
  cno?: string
  art_numero?: string
  art_arquivo?: string
  apolice_numero?: string
  apolice_arquivo?: string
  created_at: string
  updated_at: string
  clientes?: {
    id: number
    nome: string
    cnpj: string
    email?: string
    telefone?: string
  }
  // Campos de custos
  custos_iniciais?: number
  custos_adicionais?: number
  total_custos?: number
  total_custos_mensais?: number
  total_custos_gerais?: number
  custos_mensais?: Array<{
    total_orcamento: number
  }>
  
  // Relacionamentos incluídos diretamente
  grua_obra?: Array<{
    id: number
    grua_id: string
    data_inicio_locacao: string
    data_fim_locacao?: string
    valor_locacao_mensal?: number
    valor_locacao?: number
    status: string
    observacoes?: string
    // Parâmetros técnicos
    tipo_base?: string
    altura_inicial?: number
    altura_final?: number
    velocidade_giro?: number
    velocidade_elevacao?: number
    velocidade_translacao?: number
    potencia_instalada?: number
    voltagem?: string
    tipo_ligacao?: string
    capacidade_ponta?: number
    capacidade_maxima_raio?: number
    ano_fabricacao?: number
    vida_util?: number
    // Valores detalhados
    valor_operador?: number
    valor_manutencao?: number
    valor_estaiamento?: number
    valor_chumbadores?: number
    valor_montagem?: number
    valor_desmontagem?: number
    valor_transporte?: number
    valor_hora_extra?: number
    valor_seguro?: number
    valor_caucao?: number
    // Serviços e logística
    guindaste_montagem?: string
    quantidade_viagens?: number
    alojamento_alimentacao?: string
    responsabilidade_acessorios?: string
    // Condições comerciais
    prazo_validade?: number
    forma_pagamento?: string
    multa_atraso?: number
    reajuste_indice?: string
    garantia_caucao?: string
    retencao_contratual?: number
    grua: {
      id: string
      modelo: string
      fabricante: string
      tipo: string
    }
  }>
  grua_funcionario?: Array<{
    id: number
    grua_id: string
    funcionario_id: number
    data_inicio: string
    data_fim?: string
    status: string
    observacoes?: string
    funcionario: {
      id: number
      nome: string
      cargo: string
      status: string
    }
    grua: {
      id: string
      modelo: string
      fabricante: string
      tipo: string
    }
  }>
}

export interface ObraCreateData {
  nome: string
  cliente_id: number
  endereco: string
  cidade: string
  estado: string
  tipo: string
  cep?: string
  contato_obra?: string
  telefone_obra?: string
  email_obra?: string
  status?: 'Planejamento' | 'Em Andamento' | 'Pausada' | 'Concluída' | 'Cancelada'
  // Novos campos adicionados
  descricao?: string
  data_inicio?: string
  data_fim?: string
  orcamento?: number
  observacoes?: string
  responsavel_id?: number
  responsavel_nome?: string
  // Campos obrigatórios (CNO, ART, Apólice)
  cno?: string
  art_numero?: string
  art_arquivo?: string
  apolice_numero?: string
  apolice_arquivo?: string
  // Dados da grua (mantido para compatibilidade)
  grua_id?: string
  grua_valor?: number
  grua_mensalidade?: number
  // Múltiplas gruas
  gruas?: Array<{
    grua_id: string
    valor_locacao: number
    taxa_mensal: number
    // Parâmetros técnicos
    tipo_base?: string
    altura_inicial?: number
    altura_final?: number
    velocidade_giro?: number
    velocidade_elevacao?: number
    velocidade_translacao?: number
    potencia_instalada?: number
    voltagem?: string
    tipo_ligacao?: string
    capacidade_ponta?: number
    capacidade_maxima_raio?: number
    ano_fabricacao?: number
    vida_util?: number
    // Valores detalhados
    valor_operador?: number
    valor_manutencao?: number
    valor_estaiamento?: number
    valor_chumbadores?: number
    valor_montagem?: number
    valor_desmontagem?: number
    valor_transporte?: number
    valor_hora_extra?: number
    valor_seguro?: number
    valor_caucao?: number
    // Serviços e logística
    guindaste_montagem?: string
    quantidade_viagens?: number
    alojamento_alimentacao?: string
    responsabilidade_acessorios?: string
    // Condições comerciais
    prazo_validade?: number
    forma_pagamento?: string
    multa_atraso?: number
    reajuste_indice?: string
    garantia_caucao?: string
    retencao_contratual?: number
  }>
  // Dados dos funcionários
  funcionarios?: Array<{
    id: string
    userId: string
    role: string
    name: string
  }>
  // Custos mensais
  custos_mensais?: Array<{
    item: string
    descricao: string
    unidade: string
    quantidadeOrcamento: number
    valorUnitario: number
    totalOrcamento: number
    mes: string
    tipo?: 'contrato' | 'aditivo'
  }>
  // Campos para criação automática de cliente
  cliente_nome?: string
  cliente_cnpj?: string
  cliente_email?: string
  cliente_telefone?: string
}

export interface ObraUpdateData {
  nome?: string
  cliente_id?: number
  endereco?: string
  cidade?: string
  estado?: string
  tipo?: string
  cep?: string
  contato_obra?: string
  telefone_obra?: string
  email_obra?: string
  status?: 'Planejamento' | 'Em Andamento' | 'Pausada' | 'Concluída' | 'Cancelada'
  descricao?: string
  data_inicio?: string
  data_fim?: string
  orcamento?: number
  observacoes?: string
  responsavel_id?: number
  responsavel_nome?: string
  // Campos obrigatórios (CNO, ART, Apólice)
  cno?: string
  art_numero?: string
  art_arquivo?: string
  apolice_numero?: string
  apolice_arquivo?: string
}

export interface ObrasResponse {
  success: boolean
  data: ObraBackend[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ObraResponse {
  success: boolean
  data: ObraBackend
}

export interface ObraDocumentosUpdateData {
  cno?: string
  art_numero?: string
  art_arquivo?: string
  apolice_numero?: string
  apolice_arquivo?: string
}

// Tipo para o frontend
export type Obra = ObraBackend

// Função para obter token de autenticação
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

// Função para verificar se o usuário está autenticado
const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  const token = localStorage.getItem('access_token')
  return !!token
}

// Função para redirecionar para login se não autenticado
const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/'
  }
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

// API functions
export const obrasApi = {
  // Listar todas as obras
  async listarObras(params?: {
    page?: number
    limit?: number
    status?: string
    cliente_id?: number
  }): Promise<ObrasResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.status) searchParams.append('status', params.status)
    if (params?.cliente_id) searchParams.append('cliente_id', params.cliente_id.toString())

    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}?${searchParams.toString()}`)
    return apiRequest(url)
  },

  // Obter obra por ID
  async obterObra(id: number): Promise<ObraResponse> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/${id}`)
    return apiRequest(url)
  },

  // Criar nova obra
  async criarObra(data: ObraCreateData): Promise<ObraResponse> {
    const url = buildApiUrl(API_ENDPOINTS.OBRAS)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Atualizar obra
  async atualizarObra(id: number, data: ObraUpdateData): Promise<ObraResponse> {
    // Remover campos com valor null ou undefined
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined) {
        acc[key] = value
      }
      return acc
    }, {} as any)
    
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(cleanData),
    })
  },

  // Atualizar apenas documentos (CNO, ART, Apólice)
  async atualizarDocumentos(id: number, data: ObraDocumentosUpdateData): Promise<ObraResponse> {
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined) acc[key] = value
      return acc
    }, {} as any)

    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/${id}/documentos`)
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(cleanData),
    })
  },

  // Excluir obra
  async excluirObra(id: number): Promise<{ success: boolean; message: string }> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/${id}`)
    return apiRequest(url, {
      method: 'DELETE',
    })
  },

  // Buscar gruas vinculadas à obra
  async buscarGruasVinculadas(obraId: number): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await gruaObraApi.buscarGruasPorObra(obraId)
      const gruasConvertidas = response.data.map(converterGruaObraBackendParaFrontend)
      return {
        success: true,
        data: gruasConvertidas
      }
    } catch (error) {
      console.error('Erro ao buscar gruas vinculadas:', error)
      return {
        success: false,
        data: []
      }
    }
  },

  // Buscar funcionários vinculados a uma obra
  async buscarFuncionariosVinculados(obraId: number): Promise<{ success: boolean; data: any[] }> {
    try {
      const url = buildApiUrl(`funcionarios-obras?obra_id=${obraId}`)
      const response = await apiRequest(url)
      
      if (response.success) {
        // Converter dados para o formato esperado pelo frontend
        const funcionariosConvertidos = response.data.map((item: any) => ({
          id: item.id.toString(),
          userId: item.funcionario_id.toString(),
          funcionarioId: item.funcionario_id,
          obraId: item.obra_id,
          name: item.funcionarios?.nome || 'Funcionário',
          role: item.funcionarios?.cargo || 'Cargo não informado',
          dataInicio: item.data_inicio,
          dataFim: item.data_fim,
          status: item.status,
          horasTrabalhadas: item.horas_trabalhadas,
          valorHora: item.valor_hora,
          totalReceber: item.total_receber,
          observacoes: item.observacoes,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }))
        
        return {
          success: true,
          data: funcionariosConvertidos
        }
      } else {
        return {
          success: false,
          data: []
        }
      }
    } catch (error) {
      console.error('Erro ao buscar funcionários vinculados:', error)
      return {
        success: false,
        data: []
      }
    }
  },

  // Buscar obra com todos os relacionamentos
  async obterObraComRelacionamentos(id: number): Promise<{ success: boolean; data: any }> {
    try {
      const [obraResponse, gruasResponse, funcionariosResponse] = await Promise.all([
        this.obterObra(id),
        this.buscarGruasVinculadas(id),
        this.buscarFuncionariosVinculados(id)
      ])

      if (obraResponse.success) {
        return {
          success: true,
          data: {
            ...obraResponse.data,
            gruasVinculadas: gruasResponse.data,
            funcionariosVinculados: funcionariosResponse.data
          }
        }
      } else {
        return obraResponse
      }
    } catch (error) {
      console.error('Erro ao buscar obra com relacionamentos:', error)
      return {
        success: false,
        data: null
      }
    }
  },

  // Listar obras com fim próximo (até 60 dias)
  async listarAlertasFimProximo(): Promise<{ success: boolean; data: Array<{ id: number; nome: string; data_fim: string; cliente_id: number; clientes?: { nome: string } }> }> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/alertas/fim-proximo`)
    return apiRequest(url)
  },

  // Endpoints de teste e utilitários
  async testarValidacao(data: ObraCreateData): Promise<{ success: boolean; data?: any; error?: string; details?: string }> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/teste-validacao`)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async verificarCliente(id: number): Promise<{ success: boolean; data: { cliente: any; existe: boolean } }> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/teste-cliente-${id}`)
    return apiRequest(url)
  },

  async criarClientePadrao(): Promise<{ success: boolean; data: any; message: string }> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/criar-cliente-padrao`)
    return apiRequest(url, {
      method: 'POST',
    })
  },

  async criarClienteAutomatico(data: {
    nome: string
    cnpj: string
    email?: string
    telefone?: string
  }): Promise<{ success: boolean; data: any; message: string }> {
    const url = buildApiUrl(`${API_ENDPOINTS.OBRAS}/criar-cliente-automatico`)
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// Funções utilitárias para converter dados entre frontend e backend
export const converterObraBackendParaFrontend = (obraBackend: ObraBackend, relacionamentos?: { gruasVinculadas?: any[], funcionariosVinculados?: any[] }) => {
  // Converter relacionamentos que vêm diretamente do backend
  const gruasVinculadas = obraBackend.grua_obra?.map(relacao => ({
    id: relacao.id.toString(),
    gruaId: relacao.grua_id,
    obraId: obraBackend.id.toString(),
    dataInicioLocacao: relacao.data_inicio_locacao,
    dataFimLocacao: relacao.data_fim_locacao,
    valorLocacaoMensal: relacao.valor_locacao_mensal,
    status: relacao.status,
    observacoes: relacao.observacoes,
    createdAt: obraBackend.created_at,
    updatedAt: obraBackend.updated_at,
    // Dados da grua
    grua: relacao.grua ? {
      id: relacao.grua.id,
      modelo: relacao.grua.modelo,
      fabricante: relacao.grua.fabricante,
      tipo: relacao.grua.tipo
    } : null
  })) || []

  const funcionariosVinculados = obraBackend.grua_funcionario?.map(relacao => ({
    id: relacao.id.toString(),
    gruaId: relacao.grua_id,
    funcionarioId: relacao.funcionario_id.toString(),
    obraId: obraBackend.id.toString(),
    dataInicio: relacao.data_inicio,
    dataFim: relacao.data_fim,
    status: relacao.status,
    observacoes: relacao.observacoes,
    createdAt: obraBackend.created_at,
    updatedAt: obraBackend.updated_at,
    // Dados do funcionário
    funcionario: {
      id: relacao.funcionario.id.toString(),
      nome: relacao.funcionario.nome,
      cargo: relacao.funcionario.cargo,
      status: relacao.funcionario.status
    },
    // Dados da grua
    grua: relacao.grua ? {
      id: relacao.grua.id,
      modelo: relacao.grua.modelo,
      fabricante: relacao.grua.fabricante,
      tipo: relacao.grua.tipo
    } : null
  })) || []

  return {
    id: obraBackend.id.toString(),
    name: obraBackend.nome,
    description: obraBackend.descricao || `${obraBackend.tipo} - ${obraBackend.endereco}, ${obraBackend.cidade}/${obraBackend.estado}`,
    startDate: obraBackend.data_inicio || obraBackend.created_at.split('T')[0],
    endDate: obraBackend.data_fim,
    status: obraBackend.status,
    responsavelId: obraBackend.responsavel_id?.toString() || '3',
    responsavelName: obraBackend.responsavel_nome || 'Pedro Costa',
    clienteId: obraBackend.cliente_id.toString(),
    clienteName: obraBackend.clientes?.nome || 'Cliente não encontrado',
    cliente: obraBackend.clientes ? {
      id: obraBackend.clientes.id.toString(),
      nome: obraBackend.clientes.nome,
      cnpj: obraBackend.clientes.cnpj,
      email: obraBackend.clientes.email,
      telefone: obraBackend.clientes.telefone
    } : null,
    budget: obraBackend.orcamento || 0,
    orcamento: obraBackend.orcamento || 0,
    valorTotalObra: obraBackend.total_custos || obraBackend.total_custos_mensais || 0,
    location: `${obraBackend.cidade}, ${obraBackend.estado}`,
    client: obraBackend.clientes?.nome || 'Cliente não encontrado',
    observations: obraBackend.observacoes || (obraBackend.contato_obra ? `Contato: ${obraBackend.contato_obra}` : undefined),
    createdAt: obraBackend.created_at,
    updatedAt: obraBackend.updated_at,
    custosIniciais: obraBackend.custos_iniciais || obraBackend.total_custos_mensais || obraBackend.custos_mensais?.reduce((total, custo) => total + (custo.total_orcamento || 0), 0) || 0,
    custosAdicionais: obraBackend.custos_adicionais || obraBackend.total_custos_gerais || 0,
    totalCustos: obraBackend.total_custos || (obraBackend.custos_iniciais || 0) + (obraBackend.custos_adicionais || 0),
    // Campos adicionais do backend
    endereco: obraBackend.endereco,
    cidade: obraBackend.cidade,
    estado: obraBackend.estado,
    cep: obraBackend.cep,
    tipo: obraBackend.tipo,
    contato_obra: obraBackend.contato_obra,
    telefone_obra: obraBackend.telefone_obra,
    email_obra: obraBackend.email_obra,
    // Campos obrigatórios (CNO, ART, Apólice)
    cno: obraBackend.cno,
    art_numero: obraBackend.art_numero,
    art_arquivo: obraBackend.art_arquivo,
    apolice_numero: obraBackend.apolice_numero,
    apolice_arquivo: obraBackend.apolice_arquivo,
    // Relacionamentos - usar os que vêm do backend ou fallback para os passados como parâmetro
    gruasVinculadas: gruasVinculadas.length > 0 ? gruasVinculadas : (relacionamentos?.gruasVinculadas || []),
    funcionariosVinculados: funcionariosVinculados.length > 0 ? funcionariosVinculados : (relacionamentos?.funcionariosVinculados || [])
  }
}

export const converterObraFrontendParaBackend = (obraFrontend: any): ObraCreateData => {
  console.log('🔍 DEBUG - Converter recebeu:', obraFrontend)
  console.log('🔍 DEBUG - Custos mensais recebidos:', obraFrontend.custos_mensais)
  console.log('🔍 DEBUG - Funcionários recebidos:', obraFrontend.funcionarios)
  console.log('🔍 DEBUG - Gruas selecionadas recebidas:', obraFrontend.gruasSelecionadas)
  console.log('🔍 DEBUG - Dados da grua recebidos:', {
    gruaId: obraFrontend.gruaId,
    gruaValue: obraFrontend.gruaValue,
    monthlyFee: obraFrontend.monthlyFee
  })
  
  // Debug adicional para verificar se os campos estão sendo processados
  console.log('🔍 DEBUG - Verificação no conversor:')
  console.log('  - gruaId existe?', !!obraFrontend.gruaId)
  console.log('  - gruaValue existe?', !!obraFrontend.gruaValue)
  console.log('  - monthlyFee existe?', !!obraFrontend.monthlyFee)
  console.log('  - gruasSelecionadas é array?', Array.isArray(obraFrontend.gruasSelecionadas))
  console.log('  - gruasSelecionadas.length:', obraFrontend.gruasSelecionadas?.length || 0)
  console.log('  - custos_mensais é array?', Array.isArray(obraFrontend.custos_mensais))
  console.log('  - custos_mensais.length:', obraFrontend.custos_mensais?.length || 0)
  
  // Processar múltiplas gruas se disponível
  let gruas = []
  
  // Primeiro, adicionar gruas selecionadas (modo edição com múltiplas gruas)
  if (obraFrontend.gruasSelecionadas && Array.isArray(obraFrontend.gruasSelecionadas) && obraFrontend.gruasSelecionadas.length > 0) {
    gruas = obraFrontend.gruasSelecionadas.map((grua: any) => ({
      grua_id: grua.id,
      valor_locacao: grua.valor_locacao || 0,
      taxa_mensal: grua.taxa_mensal || 0,
      // Parâmetros técnicos
      tipo_base: grua.tipo_base,
      altura_inicial: grua.altura_inicial,
      altura_final: grua.altura_final,
      velocidade_giro: grua.velocidade_giro,
      velocidade_elevacao: grua.velocidade_elevacao,
      velocidade_translacao: grua.velocidade_translacao,
      potencia_instalada: grua.potencia_instalada,
      voltagem: grua.voltagem,
      tipo_ligacao: grua.tipo_ligacao,
      capacidade_ponta: grua.capacidade_ponta,
      capacidade_maxima_raio: grua.capacidade_maxima_raio,
      ano_fabricacao: grua.ano_fabricacao,
      vida_util: grua.vida_util,
      // Valores detalhados
      valor_operador: grua.valor_operador,
      valor_manutencao: grua.valor_manutencao,
      valor_estaiamento: grua.valor_estaiamento,
      valor_chumbadores: grua.valor_chumbadores,
      valor_montagem: grua.valor_montagem,
      valor_desmontagem: grua.valor_desmontagem,
      valor_transporte: grua.valor_transporte,
      valor_hora_extra: grua.valor_hora_extra,
      valor_seguro: grua.valor_seguro,
      valor_caucao: grua.valor_caucao,
      // Serviços e logística
      guindaste_montagem: grua.guindaste_montagem,
      quantidade_viagens: grua.quantidade_viagens,
      alojamento_alimentacao: grua.alojamento_alimentacao,
      responsabilidade_acessorios: grua.responsabilidade_acessorios,
      // Condições comerciais
      prazo_validade: grua.prazo_validade,
      forma_pagamento: grua.forma_pagamento,
      multa_atraso: grua.multa_atraso,
      reajuste_indice: grua.reajuste_indice,
      garantia_caucao: grua.garantia_caucao,
      retencao_contratual: grua.retencao_contratual
    }))
  }
  
  // Se houver uma nova grua sendo adicionada via formulário, adicionar à lista
  if (obraFrontend.gruaId && obraFrontend.gruaValue && obraFrontend.monthlyFee) {
    // Verificar se essa grua já não está na lista
    if (!gruas.find((g: any) => g.grua_id === obraFrontend.gruaId)) {
      gruas.push({
        grua_id: obraFrontend.gruaId,
        valor_locacao: parseFloat(obraFrontend.gruaValue) || 0,
        taxa_mensal: parseFloat(obraFrontend.monthlyFee) || 0
      })
    }
  }
  
  console.log('🔍 DEBUG - Gruas processadas:', gruas)
  
  const result = {
    nome: obraFrontend.name,
    cliente_id: parseInt(obraFrontend.clienteId),
    endereco: obraFrontend.location || obraFrontend.endereco || '',
    cidade: obraFrontend.cidade || '',
    estado: obraFrontend.estado || '',
    tipo: obraFrontend.tipo || '',
    cep: obraFrontend.cep,
    contato_obra: obraFrontend.contato_obra,
    telefone_obra: obraFrontend.telefone_obra,
    email_obra: obraFrontend.email_obra,
    status: converterStatusFrontendParaBackend(obraFrontend.status),
    // Novos campos adicionados
    descricao: obraFrontend.description,
    data_inicio: obraFrontend.startDate,
    data_fim: obraFrontend.endDate,
    orcamento: obraFrontend.budget ? parseFloat(obraFrontend.budget) : undefined,
    observacoes: obraFrontend.observations,
    responsavel_id: obraFrontend.responsavelId ? parseInt(obraFrontend.responsavelId) : undefined,
    responsavel_nome: obraFrontend.responsavelName,
    // Campos obrigatórios (CNO, ART, Apólice)
    cno: obraFrontend.cno,
    art_numero: obraFrontend.art_numero,
    art_arquivo: obraFrontend.art_arquivo, // URL do arquivo após upload
    apolice_numero: obraFrontend.apolice_numero,
    apolice_arquivo: obraFrontend.apolice_arquivo, // URL do arquivo após upload
    // Dados da grua (mantido para compatibilidade)
    grua_id: obraFrontend.gruaId || null,
    grua_valor: obraFrontend.gruaValue ? parseFloat(obraFrontend.gruaValue) : null,
    grua_mensalidade: obraFrontend.monthlyFee ? parseFloat(obraFrontend.monthlyFee) : null,
    // Múltiplas gruas
    gruas: gruas,
    // Dados dos funcionários
    funcionarios: obraFrontend.funcionarios && Array.isArray(obraFrontend.funcionarios) ? obraFrontend.funcionarios.map((func: any) => ({
      id: func.id,
      userId: func.userId,
      role: func.role,
      name: func.name,
      gruaId: func.gruaId || obraFrontend.gruaId // Usar gruaId do funcionário ou da obra
    })) : [],
    // Custos mensais
    custos_mensais: obraFrontend.custos_mensais && Array.isArray(obraFrontend.custos_mensais) ? obraFrontend.custos_mensais : [],
    // Dados para criação automática de cliente se necessário
    cliente_nome: obraFrontend.cliente_nome,
    cliente_cnpj: obraFrontend.cliente_cnpj,
    cliente_email: obraFrontend.cliente_email,
    cliente_telefone: obraFrontend.cliente_telefone
  }
  
  console.log('🔍 DEBUG - Resultado da conversão:', result)
  console.log('🔍 DEBUG - Verificação final dos campos:')
  console.log('  - grua_id:', result.grua_id)
  console.log('  - grua_valor:', result.grua_valor)
  console.log('  - grua_mensalidade:', result.grua_mensalidade)
  console.log('  - gruas.length:', result.gruas?.length || 0)
  console.log('  - funcionarios.length:', result.funcionarios?.length || 0)
  console.log('  - custos_mensais.length:', result.custos_mensais?.length || 0)
  return result
}

export const converterStatusBackendParaFrontend = (status: string): 'ativa' | 'pausada' | 'concluida' => {
  switch (status) {
    case 'Em Andamento':
      return 'ativa'
    case 'Pausada':
      return 'pausada'
    case 'Concluída':
      return 'concluida'
    case 'Planejamento':
    case 'Cancelada':
    default:
      return 'pausada'
  }
}

export const converterStatusFrontendParaBackend = (status: string): 'Planejamento' | 'Em Andamento' | 'Pausada' | 'Concluída' | 'Cancelada' => {
  switch (status) {
    // Valores convertidos do frontend
    case 'ativa':
      return 'Em Andamento'
    case 'pausada':
      return 'Pausada'
    case 'concluida':
      return 'Concluída'
    // Valores diretos do backend (para compatibilidade com edição)
    case 'Em Andamento':
      return 'Em Andamento'
    case 'Pausada':
      return 'Pausada'
    case 'Concluída':
      return 'Concluída'
    case 'Planejamento':
      return 'Planejamento'
    case 'Cancelada':
      return 'Cancelada'
    default:
      return 'Pausada'
  }
}

// Função utilitária para verificar autenticação
export const checkAuthentication = (): boolean => {
  return isAuthenticated()
}

// Função para fazer login se necessário
export const ensureAuthenticated = async (): Promise<boolean> => {
  if (!isAuthenticated()) {
    redirectToLogin()
    return false
  }
  return true
}

// Funções de conveniência para compatibilidade
export const getObras = async (): Promise<ObraBackend[]> => {
  const response = await obrasApi.listarObras({ limit: 1000 });
  return response.data || [];
};

export default obrasApi