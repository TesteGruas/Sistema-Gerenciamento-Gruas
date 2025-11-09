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
  funcionario_id: number | string;
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
  funcionario_id: number | string;
  data: string;
  entrada?: string;
  saida_almoco?: string;
  volta_almoco?: string;
  saida?: string;
  localizacao?: string;
  justificativa_alteracao?: string;
  observacoes?: string;
  status?: string;
}

export interface Justificativa {
  id: string | number;
  funcionario_id: number | string;
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
  funcionario_id: number | string;
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
      
      // Verificar permissões do usuário via getCurrentUser
      const isAdmin = response.data.isAdmin !== undefined ? response.data.isAdmin : false;
      
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
      console.error('Erro ao listar funcionários:', error);
      throw error;
    }
  }
};

// ========================================
// API DE REGISTROS DE PONTO
// ========================================

export const apiRegistrosPonto = {
  async listar(params?: {
    funcionario_id?: number | string;
    data_inicio?: string;
    data_fim?: string;
    status?: string;
    aprovador_id?: number | string;
    page?: number;
    limit?: number;
    search?: string;
    recalcular?: boolean;
    // Novos parâmetros de filtro
    obra_id?: number;
    cargo?: string;
    turno?: string;
    horas_extras_min?: number;
    horas_extras_max?: number;
    order_by?: 'data' | 'funcionario' | 'horas_trabalhadas' | 'horas_extras' | 'status' | 'created_at';
    order_direction?: 'asc' | 'desc';
  }): Promise<{ data: RegistroPonto[]; pagination?: any; recalculated?: boolean }> {
    try {
      const response = await api.get('ponto-eletronico/registros', { params });
      return { 
        data: response.data.data || response.data || [],
        pagination: response.data.pagination,
        recalculated: response.data.recalculated
      };
    } catch (error) {
      console.error('Erro ao listar registros de ponto:', error);
      throw error;
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
  },

  /**
   * Recalcula horas trabalhadas e status de registros
   * Útil para corrigir dados inconsistentes em lote
   */
  async recalcular(payload?: {
    funcionario_id?: number | string;
    data_inicio?: string;
    data_fim?: string;
    recalcular_todos?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    atualizados: number;
    total: number;
    erros?: Array<{ id: string; error: string }>;
  }> {
    const response = await api.post('ponto-eletronico/registros/calcular', payload || {});
    return response.data;
  },

  /**
   * Valida consistência dos registros de ponto
   * Retorna estatísticas de problemas encontrados
   */
  async validar(params?: {
    funcionario_id?: number | string;
    data_inicio?: string;
    data_fim?: string;
  }): Promise<{
    success: boolean;
    estatisticas: {
      total: number;
      com_problemas: number;
      sem_entrada: number;
      sem_saida: number;
      horas_zeradas: number;
      status_inconsistente: number;
      horarios_iguais: number;
    };
    problemas: Array<{
      id: string;
      funcionario: string;
      data: string;
      problemas: string[];
    }>;
    total_problemas: number;
  }> {
    const response = await api.get('ponto-eletronico/registros/validar', { params });
    return response.data;
  },

  /**
   * Obter estatísticas dos registros com filtros
   */
  async obterEstatisticas(params?: {
    funcionario_id?: number | string;
    data_inicio?: string;
    data_fim?: string;
    status?: string;
    obra_id?: number;
    cargo?: string;
    turno?: string;
  }): Promise<{
    success: boolean;
    data: {
      total_registros: number;
      total_horas_trabalhadas: number;
      total_horas_extras: number;
      media_horas_trabalhadas: string | number;
      media_horas_extras: string | number;
      por_status: Record<string, {
        quantidade: number;
        horas_trabalhadas: number;
        horas_extras: number;
      }>;
      por_funcionario: Record<string, {
        nome: string;
        cargo: string;
        registros: number;
        horas_trabalhadas: number;
        horas_extras: number;
      }>;
      por_obra: Record<string, {
        registros: number;
        horas_trabalhadas: number;
        horas_extras: number;
        total_funcionarios: number;
      }>;
    };
  }> {
    const response = await api.get('ponto-eletronico/registros/estatisticas', { params });
    return response.data;
  }
};

// ========================================
// API DE JUSTIFICATIVAS
// ========================================

export const apiJustificativas = {
  async listar(params?: {
    funcionario_id?: number | string;
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
      console.error('Erro ao listar justificativas:', error);
      throw error;
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
  },

  // ========================================
  // RELATÓRIOS DE JUSTIFICATIVAS
  // ========================================

  /**
   * Gera relatório mensal de justificativas
   */
  async relatorioMensal(params: {
    mes: number;
    ano: number;
    funcionario_id?: number | string;
    obra_id?: number;
    status?: string;
    tipo?: string;
  }): Promise<any> {
    const response = await api.get('ponto-eletronico/relatorios/justificativas/mensal', { params });
    return response.data.data || response.data;
  },

  /**
   * Gera relatório de justificativas por período
   */
  async relatorioPeriodo(params: {
    data_inicio: string;
    data_fim: string;
    funcionario_id?: number | string;
    obra_id?: number;
    status?: string;
    tipo?: string;
    agrupar_por?: 'funcionario' | 'tipo' | 'status' | 'dia' | 'semana';
  }): Promise<any> {
    const response = await api.get('ponto-eletronico/relatorios/justificativas/periodo', { params });
    return response.data.data || response.data;
  },

  /**
   * Gera relatório de estatísticas de justificativas
   */
  async relatorioEstatisticas(params?: {
    periodo?: 'ultimo_mes' | 'ultimos_3_meses' | 'ultimo_ano';
    funcionario_id?: number | string;
    obra_id?: number;
  }): Promise<any> {
    const response = await api.get('ponto-eletronico/relatorios/justificativas/estatisticas', { params });
    return response.data.data || response.data;
  }
};

// ========================================
// API DE HORAS EXTRAS
// ========================================

export const apiHorasExtras = {
  async listar(params?: {
    funcionario_id?: number | string;
    data_inicio?: string;
    data_fim?: string;
    status?: string;
    ordenacao?: 'maior' | 'menor' | 'data';
    page?: number;
    limit?: number;
  }): Promise<{ data: RegistroPonto[]; pagination?: any }> {
    const response = await api.get('ponto-eletronico/horas-extras', { params });
    return {
      data: response.data.data || response.data || [],
      pagination: response.data.pagination
    };
  },

  async estatisticas(params?: {
    periodo?: 'mes' | 'trimestre' | 'ano';
    funcionario_id?: number | string;
    mes?: number;
    ano?: number;
  }): Promise<any> {
    const response = await api.get('ponto-eletronico/horas-extras/estatisticas', { params });
    return response.data.data || response.data;
  },

  async aprovarLote(payload: {
    registro_ids: (string | number)[];
    observacoes?: string;
  }): Promise<{ data: RegistroPonto[]; message: string }> {
    const response = await api.post('ponto-eletronico/horas-extras/aprovar-lote', payload);
    return {
      data: response.data.data || [],
      message: response.data.message || 'Registros aprovados com sucesso'
    };
  },

  async rejeitarLote(payload: {
    registro_ids: (string | number)[];
    motivo: string;
  }): Promise<{ data: RegistroPonto[]; message: string }> {
    const response = await api.post('ponto-eletronico/horas-extras/rejeitar-lote', payload);
    return {
      data: response.data.data || [],
      message: response.data.message || 'Registros rejeitados com sucesso'
    };
  },

  async notificarSupervisor(registro_id: string | number): Promise<{
    success: boolean;
    message: string;
    data?: {
      aprovacao_id: string;
      supervisor: { id: number; nome: string };
      link_aprovacao: string;
      telefone: string;
    };
  }> {
    const response = await api.post(`ponto-eletronico/horas-extras/${registro_id}/notificar`);
    return response.data;
  }
};

// ========================================
// API DE GRÁFICOS
// ========================================

export const apiGraficos = {
  async horasTrabalhadas(params?: {
    periodo?: 'semana' | 'mes' | 'trimestre' | 'ano';
    funcionario_id?: number | string;
    agrupamento?: 'dia' | 'semana' | 'mes';
    mes?: number;
    ano?: number;
  }): Promise<any> {
    const response = await api.get('ponto-eletronico/graficos/horas-trabalhadas', { params });
    return response.data;
  },

  async frequencia(params?: {
    periodo?: 'semana' | 'mes' | 'trimestre' | 'ano';
    funcionario_id?: number | string;
    mes?: number;
    ano?: number;
  }): Promise<any> {
    const response = await api.get('ponto-eletronico/graficos/frequencia', { params });
    return response.data;
  },

  async status(params?: {
    periodo?: 'semana' | 'mes' | 'trimestre' | 'ano';
    agrupamento?: 'funcionario' | 'departamento' | 'cargo';
    mes?: number;
    ano?: number;
  }): Promise<any> {
    const response = await api.get('ponto-eletronico/graficos/status', { params });
    return response.data;
  },

  async horasExtras(params?: {
    periodo?: 'semana' | 'mes' | 'trimestre' | 'ano';
    funcionario_id?: number | string;
    agrupamento?: 'dia' | 'semana' | 'mes';
    mes?: number;
    ano?: number;
  }): Promise<any> {
    const response = await api.get('ponto-eletronico/graficos/horas-extras', { params });
    return response.data;
  },

  async atrasos(params?: {
    periodo?: 'semana' | 'mes' | 'trimestre' | 'ano';
    funcionario_id?: number | string;
    mes?: number;
    ano?: number;
  }): Promise<any> {
    const response = await api.get('ponto-eletronico/graficos/atrasos', { params });
    return response.data;
  },

  async dashboard(params?: {
    periodo?: 'hoje' | 'semana' | 'mes' | 'trimestre' | 'ano';
    mes?: number;
    ano?: number;
  }): Promise<any> {
    const response = await api.get('ponto-eletronico/graficos/dashboard', { params });
    return response.data;
  }
};

// ========================================
// API DE RELATÓRIOS
// ========================================

export const apiRelatorios = {
  async espelhoPonto(params: {
    funcionario_id: number | string;
    mes: number;
    ano: number;
  }): Promise<any> {
    const response = await api.get('ponto-eletronico/espelho', { params });
    return response.data.data || response.data;
  },

  async mensalFuncionario(
    funcionario_id: number,
    params: {
      mes: number;
      ano: number;
      incluir_graficos?: boolean;
    }
  ): Promise<any> {
    const response = await api.get(`ponto-eletronico/relatorios/mensal/funcionario/${funcionario_id}`, { params });
    return response.data.data || response.data;
  },

  async frequencia(params: {
    mes: number;
    ano: number;
    funcionario_id?: number | string;
    departamento?: string;
  }): Promise<any> {
    const response = await api.get('ponto-eletronico/relatorios/frequencia', { params });
    return response.data.data || response.data;
  },

  async atrasos(params: {
    mes: number;
    ano: number;
    funcionario_id?: number | string;
  }): Promise<any> {
    const response = await api.get('ponto-eletronico/relatorios/atrasos', { params });
    return response.data.data || response.data;
  },

  async exportar(params: {
    tipo: 'csv' | 'json';
    formato: 'mensal' | 'semanal' | 'diario';
    mes?: number;
    ano?: number;
  }): Promise<any> {
    const response = await api.get('ponto-eletronico/relatorios/exportar', { 
      params,
      responseType: params.tipo === 'csv' ? 'blob' : 'json'
    });
    
    if (params.tipo === 'csv') {
      // Para CSV, retornar o blob diretamente
      return response.data;
    }
    
    return response.data.data || response.data;
  }
};

// ========================================
// UTILITÁRIOS
// ========================================

export const utilsPonto = {
  /**
   * Calcula horas trabalhadas com base nos horários de entrada e saída
   * Fórmula: (Saída Almoço - Entrada) + (Saída - Volta do Almoço)
   * Se não houver horários de almoço, calcula como (Saída - Entrada) e pode resultar em negativo
   */
  calcularHorasTrabalhadas(
    entrada?: string,
    saida?: string,
    saidaAlmoco?: string,
    voltaAlmoco?: string
  ): number {
    // Se não tem entrada e saída básicos, retorna 0
    if (!entrada || !saida) return 0;

    const parseTime = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours + minutes / 60;
    };

    const horaEntrada = parseTime(entrada);
    const horaSaida = parseTime(saida);
    
    // Se tem horários de almoço, usa fórmula completa
    if (saidaAlmoco && voltaAlmoco) {
      const horaSaidaAlmoco = parseTime(saidaAlmoco);
      const horaVoltaAlmoco = parseTime(voltaAlmoco);
      
      // Fórmula correta: (Saída Almoço - Entrada) + (Saída - Volta do Almoço)
      const periodoManha = horaSaidaAlmoco - horaEntrada;
      const periodoTarde = horaSaida - horaVoltaAlmoco;
      const totalHoras = periodoManha + periodoTarde;

      return Math.max(0, totalHoras);
    } else {
      // Se não tem horários de almoço, calcula como (Saída - Entrada)
      // Pode resultar em negativo se for menos de 8 horas
      const totalHoras = horaSaida - horaEntrada;
      return totalHoras; // Pode ser negativo
    }
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
        text: 'Incompleto',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      },
      'Incompleto': {
        text: 'Incompleto',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
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
      'Autorizado': {
        text: 'Autorizado',
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
  funcionario_id?: number | string;
  data_inicio?: string;
  data_fim?: string;
  status?: string;
  aprovador_id?: number | string;
  // Novos parâmetros
  search?: string;
  obra_id?: number;
  cargo?: string;
  turno?: string;
  horas_extras_min?: number;
  horas_extras_max?: number;
  order_by?: 'data' | 'funcionario' | 'horas_trabalhadas' | 'horas_extras' | 'status' | 'created_at';
  order_direction?: 'asc' | 'desc';
  page?: number;
  limit?: number;
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
  funcionario_id: number | string;
  mes: number;
  ano: number;
}): Promise<any> => {
  const response = await api.get('ponto-eletronico/espelho', { params });
  return response.data.data || response.data;
};
