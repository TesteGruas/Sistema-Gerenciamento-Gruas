import api from './api';

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
  async listarParaPonto(usuarioId: number): Promise<{ isAdmin: boolean; funcionarios: Funcionario[] }> {
    try {
      const response = await api.get('/api/funcionarios');
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
        }))
      };
    } catch (error) {
      console.error('Erro ao listar funcionários:', error);
      return { isAdmin: true, funcionarios: [] };
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
    limit?: number;
  }): Promise<{ data: RegistroPonto[] }> {
    try {
      const response = await api.get('/api/ponto-eletronico/registros', { params });
      return { data: response.data.data || response.data || [] };
    } catch (error) {
      console.error('Erro ao listar registros:', error);
      return { data: [] };
    }
  },

  async obter(id: string | number): Promise<RegistroPonto> {
    const response = await api.get(`/api/ponto-eletronico/registros/${id}`);
    return response.data.data || response.data;
  },

  async criar(payload: RegistroPontoPayload): Promise<RegistroPonto> {
    const response = await api.post('/api/ponto-eletronico/registros', payload);
    return response.data.data || response.data;
  },

  async atualizar(
    id: string | number,
    payload: Partial<RegistroPontoPayload>
  ): Promise<RegistroPonto> {
    const response = await api.put(`/api/ponto-eletronico/registros/${id}`, payload);
    return response.data.data || response.data;
  },

  async deletar(id: string | number): Promise<void> {
    await api.delete(`/api/ponto-eletronico/registros/${id}`);
  },

  async aprovar(id: string | number, observacoes?: string): Promise<RegistroPonto> {
    const response = await api.post(`/api/ponto-eletronico/registros/${id}/aprovar`, {
      observacoes_aprovacao: observacoes
    });
    return response.data.data || response.data;
  },

  async rejeitar(id: string | number, motivo: string): Promise<RegistroPonto> {
    const response = await api.post(`/api/ponto-eletronico/registros/${id}/rejeitar`, {
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
  }): Promise<{ data: Justificativa[] }> {
    try {
      const response = await api.get('/api/ponto-eletronico/justificativas', { params });
      return { data: response.data.data || response.data || [] };
    } catch (error) {
      console.error('Erro ao listar justificativas:', error);
      return { data: [] };
    }
  },

  async criar(payload: JustificativaPayload): Promise<Justificativa> {
    const response = await api.post('/api/ponto-eletronico/justificativas', payload);
    return response.data.data || response.data;
  },

  async aprovar(id: string | number): Promise<Justificativa> {
    const response = await api.post(`/api/ponto-eletronico/justificativas/${id}/aprovar`);
    return response.data.data || response.data;
  },

  async rejeitar(id: string | number, motivo: string): Promise<Justificativa> {
    const response = await api.post(`/api/ponto-eletronico/justificativas/${id}/rejeitar`, {
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
    const response = await api.get('/api/ponto-eletronico/espelho', { params });
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
  const response = await api.get('/api/ponto-eletronico/registros', { params });
  return response.data.data || response.data;
};

/**
 * Buscar um registro específico
 * @deprecated Use apiRegistrosPonto.obter() em vez disso
 */
export const getRegistroById = async (registroId: string | number): Promise<RegistroPonto> => {
  const response = await api.get(`/api/ponto-eletronico/registros/${registroId}`);
  return response.data.data || response.data;
};

/**
 * Criar um novo registro de ponto
 * @deprecated Use apiRegistrosPonto.criar() em vez disso
 */
export const criarRegistro = async (payload: RegistroPontoPayload): Promise<RegistroPonto> => {
  const response = await api.post('/api/ponto-eletronico/registros', payload);
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
  const response = await api.put(`/api/ponto-eletronico/registros/${registroId}`, payload);
  return response.data.data || response.data;
};

/**
 * Deletar um registro de ponto
 * @deprecated Use apiRegistrosPonto.deletar() em vez disso
 */
export const deletarRegistro = async (registroId: string | number): Promise<void> => {
  await api.delete(`/api/ponto-eletronico/registros/${registroId}`);
};

/**
 * Aprovar um registro de ponto
 * @deprecated Use apiRegistrosPonto.aprovar() em vez disso
 */
export const aprovarRegistro = async (
  registroId: string | number,
  observacoes?: string
): Promise<RegistroPonto> => {
  const response = await api.post(`/api/ponto-eletronico/registros/${registroId}/aprovar`, {
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
  const response = await api.post(`/api/ponto-eletronico/registros/${registroId}/rejeitar`, {
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
  const response = await api.get('/api/ponto-eletronico/espelho', { params });
  return response.data.data || response.data;
};
