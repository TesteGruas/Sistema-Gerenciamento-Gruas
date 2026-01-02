// API de Aluguéis de Residências

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken()
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro na requisição' }))
    throw new Error(error.message || error.error || 'Erro na requisição')
  }

  const result = await response.json()
  return result.success ? result.data : result
}

export type StatusAluguel = 'ativo' | 'encerrado' | 'pendente' | 'cancelado'

export interface AluguelResidencia {
  id: string
  residencia: {
    id: string
    nome: string
    endereco: string
    cidade: string
    estado: string
    cep: string
    quartos: number
    banheiros: number
    area: number
    mobiliada: boolean
    valor_base?: number
    disponivel?: boolean
    fotos?: string[]
  }
  funcionario: {
    id: number | string
    nome: string
    cargo: string
    cpf: string
  }
  contrato: {
    dataInicio: string
    dataFim?: string
    valorMensal: number
    diaVencimento: number
    descontoFolha: boolean
    porcentagemDesconto?: number
    tipoSinal?: 'caucao' | 'fiador' | 'outros'
    valorDeposito?: number
    periodoMulta?: number
    contratoArquivo?: string
  }
  pagamentos: {
    mes: string
    valorPago: number
    dataPagamento?: string
    status: 'pago' | 'pendente' | 'atrasado'
  }[]
  status: StatusAluguel
  observacoes?: string
  createdAt: string
  updatedAt: string
  // Novos campos de datas
  data_inicio_contrato?: string
  data_aniversario_contrato?: string
  dias_ate_aniversario?: number | null
  proximo_aniversario?: boolean
}

export interface Residencia {
  id: string
  nome: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  quartos: number
  banheiros: number
  area: number
  mobiliada: boolean
  valorBase: number
  disponivel: boolean
  fotos?: string[]
}

// Função auxiliar para transformar dados do backend para o formato esperado pelo frontend
function transformarAluguelBackendParaFrontend(aluguelBackend: any): AluguelResidencia {
  return {
    id: aluguelBackend.id,
    residencia: {
      id: aluguelBackend.residencias?.id || aluguelBackend.residencia_id,
      nome: aluguelBackend.residencias?.nome || '',
      endereco: aluguelBackend.residencias?.endereco || '',
      cidade: aluguelBackend.residencias?.cidade || '',
      estado: aluguelBackend.residencias?.estado || '',
      cep: aluguelBackend.residencias?.cep || '',
      quartos: aluguelBackend.residencias?.quartos || 0,
      banheiros: aluguelBackend.residencias?.banheiros || 0,
      area: parseFloat(aluguelBackend.residencias?.area || 0),
      mobiliada: aluguelBackend.residencias?.mobiliada || false,
      valor_base: parseFloat(aluguelBackend.residencias?.valor_base || 0),
      disponivel: aluguelBackend.residencias?.disponivel ?? true,
      fotos: aluguelBackend.residencias?.fotos || []
    },
    funcionario: {
      id: aluguelBackend.funcionarios?.id || aluguelBackend.funcionario_id,
      nome: aluguelBackend.funcionarios?.nome || '',
      cargo: aluguelBackend.funcionarios?.cargo || '',
      cpf: aluguelBackend.funcionarios?.cpf || ''
    },
    contrato: {
      dataInicio: aluguelBackend.data_inicio,
      dataFim: aluguelBackend.data_fim || undefined,
      valorMensal: parseFloat(aluguelBackend.valor_mensal || 0),
      diaVencimento: aluguelBackend.dia_vencimento,
      descontoFolha: aluguelBackend.desconto_folha || false,
      porcentagemDesconto: aluguelBackend.porcentagem_desconto ? parseFloat(aluguelBackend.porcentagem_desconto) : undefined,
      tipoSinal: aluguelBackend.tipo_sinal || undefined,
      valorDeposito: aluguelBackend.valor_deposito ? parseFloat(aluguelBackend.valor_deposito) : undefined,
      periodoMulta: aluguelBackend.periodo_multa || undefined,
      contratoArquivo: aluguelBackend.contrato_arquivo || undefined
    },
    pagamentos: (aluguelBackend.pagamentos || []).map((p: any) => ({
      mes: p.mes,
      valorPago: parseFloat(p.valor_pago || 0),
      dataPagamento: p.data_pagamento || undefined,
      status: p.status
    })),
    status: aluguelBackend.status,
    observacoes: aluguelBackend.observacoes || undefined,
    createdAt: aluguelBackend.created_at,
    updatedAt: aluguelBackend.updated_at,
    // Campos de aniversário do contrato
    data_inicio_contrato: aluguelBackend.data_inicio_contrato || aluguelBackend.data_inicio,
    data_aniversario_contrato: aluguelBackend.data_aniversario_contrato || undefined,
    dias_ate_aniversario: aluguelBackend.dias_ate_aniversario !== undefined ? aluguelBackend.dias_ate_aniversario : null,
    proximo_aniversario: aluguelBackend.proximo_aniversario || false
  }
}

function transformarResidenciaBackendParaFrontend(residenciaBackend: any): Residencia {
  return {
    id: residenciaBackend.id,
    nome: residenciaBackend.nome,
    endereco: residenciaBackend.endereco,
    cidade: residenciaBackend.cidade,
    estado: residenciaBackend.estado,
    cep: residenciaBackend.cep,
    quartos: residenciaBackend.quartos,
    banheiros: residenciaBackend.banheiros,
    area: parseFloat(residenciaBackend.area || 0),
    mobiliada: residenciaBackend.mobiliada || false,
    valorBase: parseFloat(residenciaBackend.valor_base || 0),
    disponivel: residenciaBackend.disponivel ?? true,
    fotos: residenciaBackend.fotos || []
  }
}

export const AlugueisAPI = {
  // Listar todos os aluguéis
  listar: async (): Promise<AluguelResidencia[]> => {
    try {
      const data = await apiRequest('/api/alugueis-residencias')
      return Array.isArray(data) ? data.map(transformarAluguelBackendParaFrontend) : []
    } catch (error) {
      console.error('Erro ao listar aluguéis:', error)
      throw error
    }
  },

  // Listar apenas aluguéis ativos
  listarAtivos: async (): Promise<AluguelResidencia[]> => {
    try {
      const data = await apiRequest('/api/alugueis-residencias/ativos')
      return Array.isArray(data) ? data.map(transformarAluguelBackendParaFrontend) : []
    } catch (error) {
      console.error('Erro ao listar aluguéis ativos:', error)
      throw error
    }
  },

  // Buscar por ID
  buscarPorId: async (id: string): Promise<AluguelResidencia | null> => {
    try {
      const data = await apiRequest(`/api/alugueis-residencias/${id}`)
      return data ? transformarAluguelBackendParaFrontend(data) : null
    } catch (error: any) {
      if (error.message?.includes('não encontrado')) {
        return null
      }
      console.error('Erro ao buscar aluguel:', error)
      throw error
    }
  },

  // Criar novo aluguel
  criar: async (aluguel: Omit<AluguelResidencia, 'id' | 'createdAt' | 'updatedAt' | 'pagamentos'>): Promise<AluguelResidencia> => {
    try {
      const payload = {
        residencia_id: aluguel.residencia.id,
        funcionario_id: typeof aluguel.funcionario.id === 'string' ? parseInt(aluguel.funcionario.id) : aluguel.funcionario.id,
        data_inicio: aluguel.contrato.dataInicio,
        data_fim: aluguel.contrato.dataFim || null,
        valor_mensal: aluguel.contrato.valorMensal,
        dia_vencimento: aluguel.contrato.diaVencimento,
        desconto_folha: aluguel.contrato.descontoFolha,
        porcentagem_desconto: aluguel.contrato.porcentagemDesconto || null,
        tipo_sinal: aluguel.contrato.tipoSinal || null,
        valor_deposito: aluguel.contrato.valorDeposito || null,
        periodo_multa: aluguel.contrato.periodoMulta || null,
        contrato_arquivo: aluguel.contrato.contratoArquivo || null,
        observacoes: aluguel.observacoes || null
      }

      const data = await apiRequest('/api/alugueis-residencias', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      return transformarAluguelBackendParaFrontend(data)
    } catch (error) {
      console.error('Erro ao criar aluguel:', error)
      throw error
    }
  },

  // Atualizar aluguel
  atualizar: async (id: string, dados: Partial<AluguelResidencia>): Promise<AluguelResidencia | null> => {
    try {
      const payload: any = {}

      if (dados.residencia?.id) payload.residencia_id = dados.residencia.id
      if (dados.funcionario?.id) {
        payload.funcionario_id = typeof dados.funcionario.id === 'string' 
          ? parseInt(dados.funcionario.id) 
          : dados.funcionario.id
      }
      if (dados.contrato?.dataInicio) payload.data_inicio = dados.contrato.dataInicio
      if (dados.contrato?.dataFim !== undefined) payload.data_fim = dados.contrato.dataFim || null
      if (dados.contrato?.valorMensal !== undefined) payload.valor_mensal = dados.contrato.valorMensal
      if (dados.contrato?.diaVencimento !== undefined) payload.dia_vencimento = dados.contrato.diaVencimento
      if (dados.contrato?.descontoFolha !== undefined) payload.desconto_folha = dados.contrato.descontoFolha
      if (dados.contrato?.porcentagemDesconto !== undefined) {
        payload.porcentagem_desconto = dados.contrato.porcentagemDesconto || null
      }
      if (dados.contrato?.tipoSinal !== undefined) payload.tipo_sinal = dados.contrato.tipoSinal || null
      if (dados.contrato?.valorDeposito !== undefined) payload.valor_deposito = dados.contrato.valorDeposito || null
      if (dados.contrato?.periodoMulta !== undefined) payload.periodo_multa = dados.contrato.periodoMulta || null
      if (dados.contrato?.contratoArquivo !== undefined) payload.contrato_arquivo = dados.contrato.contratoArquivo || null
      if (dados.status) payload.status = dados.status
      if (dados.observacoes !== undefined) payload.observacoes = dados.observacoes || null

      const data = await apiRequest(`/api/alugueis-residencias/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })

      return transformarAluguelBackendParaFrontend(data)
    } catch (error: any) {
      if (error.message?.includes('não encontrado')) {
        return null
      }
      console.error('Erro ao atualizar aluguel:', error)
      throw error
    }
  },

  // Encerrar aluguel
  encerrar: async (id: string, dataFim: string): Promise<AluguelResidencia | null> => {
    try {
      const data = await apiRequest(`/api/alugueis-residencias/${id}/encerrar`, {
        method: 'PUT',
        body: JSON.stringify({ data_fim: dataFim })
      })

      return transformarAluguelBackendParaFrontend(data)
    } catch (error: any) {
      if (error.message?.includes('não encontrado')) {
        return null
      }
      console.error('Erro ao encerrar aluguel:', error)
      throw error
    }
  },

  // Adicionar pagamento
  adicionarPagamento: async (
    aluguelId: string, 
    pagamento: { mes: string; valorPago: number; dataPagamento?: string; status?: 'pago' | 'pendente' | 'atrasado' }
  ): Promise<AluguelResidencia | null> => {
    try {
      const payload = {
        mes: pagamento.mes,
        valor_pago: pagamento.valorPago,
        data_pagamento: pagamento.dataPagamento || null,
        observacoes: null
      }

      await apiRequest(`/api/alugueis-residencias/${aluguelId}/pagamentos`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      // Buscar aluguel atualizado
      return await AlugueisAPI.buscarPorId(aluguelId)
    } catch (error) {
      console.error('Erro ao adicionar pagamento:', error)
      throw error
    }
  },

  // Deletar aluguel (não implementado no backend, mas mantido para compatibilidade)
  deletar: async (id: string): Promise<boolean> => {
    console.warn('Deletar aluguel não está implementado no backend. Use encerrar() ao invés.')
    return false
  },

  // Gerenciar arquivos do aluguel
  listarArquivos: async (aluguelId: string): Promise<any[]> => {
    try {
      const data = await apiRequest(`/api/alugueis-residencias/${aluguelId}/arquivos`)
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Erro ao listar arquivos:', error)
      throw error
    }
  },

  uploadArquivos: async (aluguelId: string, files: File[], categoria?: string, descricao?: string): Promise<{ sucessos: any[], erros: any[] }> => {
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('arquivos', file)
      })
      if (categoria) formData.append('categoria', categoria)
      if (descricao) formData.append('descricao', descricao)

      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/api/alugueis-residencias/${aluguelId}/arquivos`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro na requisição' }))
        throw new Error(error.message || error.error || 'Erro na requisição')
      }

      const result = await response.json()
      return result.success ? result.data : { sucessos: [], erros: [] }
    } catch (error) {
      console.error('Erro ao fazer upload de arquivos:', error)
      throw error
    }
  },

  deletarArquivo: async (arquivoId: string): Promise<boolean> => {
    try {
      await apiRequest(`/api/alugueis-residencias/arquivos/${arquivoId}`, {
        method: 'DELETE'
      })
      return true
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error)
      throw error
    }
  }
}

// API de Residências
export const ResidenciasAPI = {
  // Listar todas as residências
  listar: async (filtros?: { cidade?: string; disponivel?: boolean }): Promise<Residencia[]> => {
    try {
      const params = new URLSearchParams()
      if (filtros?.cidade) params.append('cidade', filtros.cidade)
      if (filtros?.disponivel !== undefined) params.append('disponivel', filtros.disponivel.toString())

      const query = params.toString()
      const data = await apiRequest(`/api/alugueis-residencias/residencias${query ? `?${query}` : ''}`)
      return Array.isArray(data) ? data.map(transformarResidenciaBackendParaFrontend) : []
    } catch (error) {
      console.error('Erro ao listar residências:', error)
      throw error
    }
  },

  // Listar apenas disponíveis
  listarDisponiveis: async (): Promise<Residencia[]> => {
    return ResidenciasAPI.listar({ disponivel: true })
  },

  // Buscar residência por ID
  buscarPorId: async (id: string): Promise<Residencia | null> => {
    try {
      const data = await apiRequest(`/api/alugueis-residencias/residencias/${id}`)
      return data ? transformarResidenciaBackendParaFrontend(data) : null
    } catch (error: any) {
      if (error.message?.includes('não encontrada')) {
        return null
      }
      console.error('Erro ao buscar residência:', error)
      throw error
    }
  },

  // Criar residência
  criar: async (residencia: Omit<Residencia, 'id' | 'disponivel'>): Promise<Residencia> => {
    try {
      const payload = {
        nome: residencia.nome,
        endereco: residencia.endereco,
        cidade: residencia.cidade,
        estado: residencia.estado,
        cep: residencia.cep,
        quartos: residencia.quartos,
        banheiros: residencia.banheiros,
        area: residencia.area,
        mobiliada: residencia.mobiliada,
        valor_base: residencia.valorBase,
        disponivel: true,
        fotos: residencia.fotos || [],
        observacoes: null
      }

      const data = await apiRequest('/api/alugueis-residencias/residencias', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      return transformarResidenciaBackendParaFrontend(data)
    } catch (error) {
      console.error('Erro ao criar residência:', error)
      throw error
    }
  },

  // Atualizar residência
  atualizar: async (id: string, dados: Partial<Residencia>): Promise<Residencia | null> => {
    try {
      const payload: any = {}

      if (dados.nome !== undefined) payload.nome = dados.nome
      if (dados.endereco !== undefined) payload.endereco = dados.endereco
      if (dados.cidade !== undefined) payload.cidade = dados.cidade
      if (dados.estado !== undefined) payload.estado = dados.estado
      if (dados.cep !== undefined) payload.cep = dados.cep
      if (dados.quartos !== undefined) payload.quartos = dados.quartos
      if (dados.banheiros !== undefined) payload.banheiros = dados.banheiros
      if (dados.area !== undefined) payload.area = dados.area
      if (dados.mobiliada !== undefined) payload.mobiliada = dados.mobiliada
      if (dados.valorBase !== undefined) payload.valor_base = dados.valorBase
      if (dados.disponivel !== undefined) payload.disponivel = dados.disponivel
      if (dados.fotos !== undefined) payload.fotos = dados.fotos

      const data = await apiRequest(`/api/alugueis-residencias/residencias/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })

      return transformarResidenciaBackendParaFrontend(data)
    } catch (error: any) {
      if (error.message?.includes('não encontrada')) {
        return null
      }
      console.error('Erro ao atualizar residência:', error)
      throw error
    }
  },

  // Deletar residência
  deletar: async (id: string): Promise<boolean> => {
    try {
      await apiRequest(`/api/alugueis-residencias/residencias/${id}`, {
        method: 'DELETE'
      })
      return true
    } catch (error: any) {
      if (error.message?.includes('não encontrada')) {
        return false
      }
      console.error('Erro ao deletar residência:', error)
      throw error
    }
  }
}

// Funções auxiliares
export function calcularValorFuncionario(valorMensal: number, porcentagemDesconto?: number): number {
  if (!porcentagemDesconto) return valorMensal
  return valorMensal * (1 - porcentagemDesconto / 100)
}

export function calcularSubsidioEmpresa(valorMensal: number, porcentagemDesconto?: number): number {
  if (!porcentagemDesconto) return 0
  return valorMensal * (porcentagemDesconto / 100)
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

export function obterStatusPagamento(mes: string, diaVencimento: number): 'pago' | 'pendente' | 'atrasado' {
  const hoje = new Date()
  const [ano, mesNum] = mes.split('-').map(Number)
  const dataVencimento = new Date(ano, mesNum - 1, diaVencimento)
  
  if (hoje > dataVencimento) {
    return 'atrasado'
  }
  return 'pendente'
}
