import api from './api';

// ========================================
// DADOS MOCKADOS
// ========================================

const mockFuncionarios: Funcionario[] = [
  { id: 1, nome: 'João Silva', cargo: 'Operador de Grua', status: 'ativo', email: 'joao@empresa.com', telefone: '(11) 99999-0001' },
  { id: 2, nome: 'Maria Santos', cargo: 'Supervisora', status: 'ativo', email: 'maria@empresa.com', telefone: '(11) 99999-0002' },
  { id: 3, nome: 'Pedro Costa', cargo: 'Operador de Grua', status: 'ativo', email: 'pedro@empresa.com', telefone: '(11) 99999-0003' },
  { id: 4, nome: 'Ana Oliveira', cargo: 'Operador de Grua', status: 'ativo', email: 'ana@empresa.com', telefone: '(11) 99999-0004' },
  { id: 5, nome: 'Carlos Lima', cargo: 'Operador de Grua', status: 'ativo', email: 'carlos@empresa.com', telefone: '(11) 99999-0005' }
];

const mockRegistrosPonto: RegistroPonto[] = [
  {
    id: 1,
    funcionario_id: 1,
    funcionario: mockFuncionarios[0],
    data: new Date().toISOString().split('T')[0],
    entrada: '08:00',
    saida_almoco: '12:00',
    volta_almoco: '13:00',
    saida: '17:00',
    horas_trabalhadas: 8.0,
    horas_extras: 0,
    status: 'completo',
    localizacao: 'Obra ABC'
  },
  {
    id: 2,
    funcionario_id: 2,
    funcionario: mockFuncionarios[1],
    data: new Date().toISOString().split('T')[0],
    entrada: '08:30',
    saida_almoco: '12:00',
    volta_almoco: '13:00',
    saida: '17:30',
    horas_trabalhadas: 8.0,
    horas_extras: 0.5,
    status: 'completo',
    localizacao: 'Obra XYZ'
  },
  {
    id: 3,
    funcionario_id: 3,
    funcionario: mockFuncionarios[2],
    data: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Ontem
    entrada: '08:00',
    saida_almoco: '12:00',
    volta_almoco: '13:00',
    saida: '17:00',
    horas_trabalhadas: 8.0,
    horas_extras: 0,
    status: 'completo',
    localizacao: 'Obra DEF'
  }
];

const mockJustificativas: Justificativa[] = [
  {
    id: 1,
    funcionario_id: 1,
    funcionario: mockFuncionarios[0],
    data: new Date().toISOString().split('T')[0],
    tipo: 'atraso',
    motivo: 'Problemas no trânsito',
    status: 'pendente',
    anexos: [],
    observacoes: 'Atraso de 30 minutos devido ao trânsito pesado'
  },
  {
    id: 2,
    funcionario_id: 2,
    funcionario: mockFuncionarios[1],
    data: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    tipo: 'falta',
    motivo: 'Problemas de saúde',
    status: 'aprovado',
    anexos: ['atestado.pdf'],
    observacoes: 'Atestado médico apresentado'
  }
];

// ========================================
// INTERFACES
// ========================================

export interface Funcionario {
  id: number;
  nome: string;
  cargo?: string;
  status?: string;
  email?: string;
  telefone?: string;
}

export interface RegistroPonto {
  id?: string | number;
  funcionario_id: number;
  funcionario?: Funcionario;
  aprovador?: { nome: string };
  data: string;
  entrada?: string;
  saida_almoco?: string;
  volta_almoco?: string;
  saida?: string;
  localizacao?: string;
  horas_trabalhadas?: number;
  horas_extras?: number;
  status?: string;
  aprovado_por?: number;
  data_aprovacao?: string;
  observacoes?: string;
  justificativa_alteracao?: string;
}

export interface RegistroPontoPayload {
  funcionario_id: number;
  data: string;
  entrada?: string;
  saida_almoco?: string;
  volta_almoco?: string;
  saida?: string;
  localizacao?: string;
  justificativa_alteracao?: string;
  observacoes?: string;
}

export interface Justificativa {
  id: string | number;
  funcionario_id: number;
  funcionario?: Funcionario;
  aprovador?: { nome: string };
  data: string;
  tipo: string;
  motivo: string;
  status: string;
  data_aprovacao?: string;
  anexos?: string[];
  observacoes?: string;
}

export interface JustificativaPayload {
  funcionario_id: number;
  data: string;
  tipo: string;
  motivo: string;
}

// ========================================
// API DE FUNCIONÁRIOS
// ========================================

export const apiFuncionarios = {
  async listarParaPonto(usuarioId: number, params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ isAdmin: boolean; funcionarios: Funcionario[]; pagination?: any }> {
    try {
      const response = await api.get('/funcionarios', { params });
      const funcionarios = response.data.data || response.data || [];
      
      // Verificar se o usuário é admin (pode ver todos)
      // Em um sistema real, isso viria do backend
      const isAdmin = true; // Temporariamente true para todos
      
      return {
        isAdmin,
        funcionarios: funcionarios.map((f: any) => ({
          id: f.id,
          nome: f.nome,
          cargo: f.cargo,
          status: f.status,
          email: f.email,
          telefone: f.telefone
        })),
        pagination: response.data.pagination
      };
    } catch (error) {
      console.warn('API indisponível, usando dados mockados:', error);
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Aplicar filtros nos dados mockados
      let filteredFuncionarios = [...mockFuncionarios];
      
      if (params?.search) {
        const search = params.search.toLowerCase();
        filteredFuncionarios = filteredFuncionarios.filter(f => 
          f.nome.toLowerCase().includes(search) ||
          f.cargo?.toLowerCase().includes(search) ||
          f.email?.toLowerCase().includes(search)
        );
      }
      
      // Aplicar paginação
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedFuncionarios = filteredFuncionarios.slice(startIndex, endIndex);
      
      return {
        isAdmin: true,
        funcionarios: paginatedFuncionarios,
        pagination: {
          page,
          limit,
          total: filteredFuncionarios.length,
          pages: Math.ceil(filteredFuncionarios.length / limit)
        }
      };
    }
  }
};

// ========================================
// API DE REGISTROS DE PONTO
// ========================================

export const apiRegistrosPonto = {
  async listar(params?: {
    funcionario_id?: number;
    data_inicio?: string;
    data_fim?: string;
    status?: string;
    aprovador_id?: number;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: RegistroPonto[]; pagination?: any }> {
    try {
      const response = await api.get('ponto-eletronico/registros', { params });
      return { 
        data: response.data.data || response.data || [],
        pagination: response.data.pagination
      };
    } catch (error) {
      console.warn('API indisponível, usando dados mockados:', error);
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Aplicar filtros nos dados mockados
      let filteredData = [...mockRegistrosPonto];
      
      if (params?.funcionario_id) {
        filteredData = filteredData.filter(r => r.funcionario_id === params.funcionario_id);
      }
      
      if (params?.status) {
        filteredData = filteredData.filter(r => r.status === params.status);
      }
      
      if (params?.data_inicio) {
        filteredData = filteredData.filter(r => r.data >= params.data_inicio!);
      }
      
      if (params?.data_fim) {
        filteredData = filteredData.filter(r => r.data <= params.data_fim!);
      }
      
      if (params?.search) {
        const search = params.search.toLowerCase();
        filteredData = filteredData.filter(r => 
          r.funcionario?.nome.toLowerCase().includes(search) ||
          r.localizacao?.toLowerCase().includes(search) ||
          r.status?.toLowerCase().includes(search)
        );
      }
      
      // Aplicar paginação
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      return { 
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: filteredData.length,
          pages: Math.ceil(filteredData.length / limit)
        }
      };
    }
  },

  async obter(id: string | number): Promise<RegistroPonto> {
    const response = await api.get(`ponto-eletronico/registros/${id}`);
    return response.data.data || response.data;
  },

  async criar(payload: RegistroPontoPayload): Promise<RegistroPonto> {
    const response = await api.post('ponto-eletronico/registros', payload);
    return response.data.data || response.data;
  },

  async atualizar(
    id: string | number,
    payload: Partial<RegistroPontoPayload>
  ): Promise<RegistroPonto> {
    const response = await api.put(`ponto-eletronico/registros/${id}`, payload);
    return response.data.data || response.data;
  },

  async deletar(id: string | number): Promise<void> {
    await api.delete(`ponto-eletronico/registros/${id}`);
  },

  async aprovar(id: string | number, observacoes?: string): Promise<RegistroPonto> {
    const response = await api.post(`ponto-eletronico/registros/${id}/aprovar`, {
      observacoes_aprovacao: observacoes
    });
    return response.data.data || response.data;
  },

  async rejeitar(id: string | number, motivo: string): Promise<RegistroPonto> {
    const response = await api.post(`ponto-eletronico/registros/${id}/rejeitar`, {
      motivo_rejeicao: motivo
    });
    return response.data.data || response.data;
  }
};

// ========================================
// API DE JUSTIFICATIVAS
// ========================================

export const apiJustificativas = {
  async listar(params?: {
    funcionario_id?: number;
    status?: string;
    data_inicio?: string;
    data_fim?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: Justificativa[]; pagination?: any }> {
    try {
      const response = await api.get('ponto-eletronico/justificativas', { params });
      return { 
        data: response.data.data || response.data || [],
        pagination: response.data.pagination
      };
    } catch (error) {
      console.warn('API indisponível, usando dados mockados:', error);
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Aplicar filtros nos dados mockados
      let filteredData = [...mockJustificativas];
      
      if (params?.funcionario_id) {
        filteredData = filteredData.filter(j => j.funcionario_id === params.funcionario_id);
      }
      
      if (params?.status) {
        filteredData = filteredData.filter(j => j.status === params.status);
      }
      
      if (params?.data_inicio) {
        filteredData = filteredData.filter(j => j.data >= params.data_inicio!);
      }
      
      if (params?.data_fim) {
        filteredData = filteredData.filter(j => j.data <= params.data_fim!);
      }
      
      if (params?.search) {
        const search = params.search.toLowerCase();
        filteredData = filteredData.filter(j => 
          j.funcionario?.nome.toLowerCase().includes(search) ||
          j.motivo.toLowerCase().includes(search) ||
          j.tipo.toLowerCase().includes(search) ||
          j.status.toLowerCase().includes(search)
        );
      }
      
      // Aplicar paginação
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      return { 
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: filteredData.length,
          pages: Math.ceil(filteredData.length / limit)
        }
      };
    }
  },

  async criar(payload: JustificativaPayload): Promise<Justificativa> {
    const response = await api.post('ponto-eletronico/justificativas', payload);
    return response.data.data || response.data;
  },

  async aprovar(id: string | number): Promise<Justificativa> {
    const response = await api.post(`ponto-eletronico/justificativas/${id}/aprovar`);
    return response.data.data || response.data;
  },

  async rejeitar(id: string | number, motivo: string): Promise<Justificativa> {
    const response = await api.post(`ponto-eletronico/justificativas/${id}/rejeitar`, {
      motivo_rejeicao: motivo
    });
    return response.data.data || response.data;
  }
};

// ========================================
// API DE RELATÓRIOS
// ========================================

export const apiRelatorios = {
  async espelhoPonto(params: {
    funcionario_id: number;
    mes: number;
    ano: number;
  }): Promise<any> {
    const response = await api.get('ponto-eletronico/espelho', { params });
    return response.data.data || response.data;
  }
};

// ========================================
// UTILITÁRIOS
// ========================================

export const utilsPonto = {
  /**
   * Calcula horas trabalhadas com base nos horários de entrada e saída
   */
  calcularHorasTrabalhadas(
    entrada?: string,
    saida?: string,
    saidaAlmoco?: string,
    voltaAlmoco?: string
  ): number {
    if (!entrada || !saida) return 0;

    const parseTime = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours + minutes / 60;
    };

    const horaEntrada = parseTime(entrada);
    const horaSaida = parseTime(saida);
    
    let totalHoras = horaSaida - horaEntrada;

    // Descontar intervalo de almoço se houver
    if (saidaAlmoco && voltaAlmoco) {
      const horaSaidaAlmoco = parseTime(saidaAlmoco);
      const horaVoltaAlmoco = parseTime(voltaAlmoco);
      totalHoras -= (horaVoltaAlmoco - horaSaidaAlmoco);
    }

    return Math.max(0, totalHoras);
  },

  /**
   * Formata data para padrão brasileiro
   */
  formatarData(data: string): string {
    if (!data) return '-';
    
    try {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  },

  /**
   * Retorna configuração de badge baseado no status
   */
  obterBadgeStatus(status: string): { text: string; className: string } {
    const statusMap: Record<string, { text: string; className: string }> = {
      'Completo': {
        text: 'Completo',
        className: 'bg-green-100 text-green-800'
      },
      'Em Andamento': {
        text: 'Em Andamento',
        className: 'bg-blue-100 text-blue-800'
      },
      'Atraso': {
        text: 'Atraso',
        className: 'bg-yellow-100 text-yellow-800'
      },
      'Falta': {
        text: 'Falta',
        className: 'bg-red-100 text-red-800'
      },
      'Pendente Aprovação': {
        text: 'Pendente',
        className: 'bg-orange-100 text-orange-800'
      },
      'Aprovado': {
        text: 'Aprovado',
        className: 'bg-green-100 text-green-800'
      },
      'Rejeitado': {
        text: 'Rejeitado',
        className: 'bg-red-100 text-red-800'
      },
      'Pendente': {
        text: 'Pendente',
        className: 'bg-orange-100 text-orange-800'
      },
      'Aprovada': {
        text: 'Aprovada',
        className: 'bg-green-100 text-green-800'
      },
      'Rejeitada': {
        text: 'Rejeitada',
        className: 'bg-red-100 text-red-800'
      }
    };

    return statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
  }
};

// ========================================
// FUNÇÕES LEGADAS (manter compatibilidade)
// ========================================

/**
 * Buscar registros de ponto por período
 * @deprecated Use apiRegistrosPonto.listar() em vez disso
 */
export const getRegistros = async (params: {
  funcionario_id?: number;
  data_inicio?: string;
  data_fim?: string;
  status?: string;
  aprovador_id?: number;
}): Promise<RegistroPonto[]> => {
  const response = await api.get('ponto-eletronico/registros', { params });
  return response.data.data || response.data;
};

/**
 * Buscar um registro específico
 * @deprecated Use apiRegistrosPonto.obter() em vez disso
 */
export const getRegistroById = async (registroId: string | number): Promise<RegistroPonto> => {
  const response = await api.get(`ponto-eletronico/registros/${registroId}`);
  return response.data.data || response.data;
};

/**
 * Criar um novo registro de ponto
 * @deprecated Use apiRegistrosPonto.criar() em vez disso
 */
export const criarRegistro = async (payload: RegistroPontoPayload): Promise<RegistroPonto> => {
  const response = await api.post('ponto-eletronico/registros', payload);
  return response.data.data || response.data;
};

/**
 * Atualizar um registro de ponto existente
 * @deprecated Use apiRegistrosPonto.atualizar() em vez disso
 */
export const atualizarRegistro = async (
  registroId: string | number,
  payload: Partial<RegistroPontoPayload>
): Promise<RegistroPonto> => {
  const response = await api.put(`ponto-eletronico/registros/${registroId}`, payload);
  return response.data.data || response.data;
};

/**
 * Deletar um registro de ponto
 * @deprecated Use apiRegistrosPonto.deletar() em vez disso
 */
export const deletarRegistro = async (registroId: string | number): Promise<void> => {
  await api.delete(`ponto-eletronico/registros/${registroId}`);
};

/**
 * Aprovar um registro de ponto
 * @deprecated Use apiRegistrosPonto.aprovar() em vez disso
 */
export const aprovarRegistro = async (
  registroId: string | number,
  observacoes?: string
): Promise<RegistroPonto> => {
  const response = await api.post(`ponto-eletronico/registros/${registroId}/aprovar`, {
    observacoes_aprovacao: observacoes
  });
  return response.data.data || response.data;
};

/**
 * Rejeitar um registro de ponto
 * @deprecated Use apiRegistrosPonto.rejeitar() em vez disso
 */
export const rejeitarRegistro = async (
  registroId: string | number,
  motivo: string
): Promise<RegistroPonto> => {
  const response = await api.post(`ponto-eletronico/registros/${registroId}/rejeitar`, {
    motivo_rejeicao: motivo
  });
  return response.data.data || response.data;
};

/**
 * Buscar o espelho de ponto de um funcionário
 * @deprecated Use apiRelatorios.espelhoPonto() em vez disso
 */
export const getEspelhoPonto = async (params: {
  funcionario_id: number;
  mes: number;
  ano: number;
}): Promise<any> => {
  const response = await api.get('ponto-eletronico/espelho', { params });
  return response.data.data || response.data;
};
