/**
 * API functions for Ponto Eletrônico module
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types
export interface Funcionario {
  id: number;
  nome: string;
  cargo?: string;
  turno?: string;
  data_admissao?: string;
  salario?: number;
}

export interface RegistroPonto {
  id: string;
  funcionario_id: number;
  data: string;
  entrada?: string;
  saida_almoco?: string;
  volta_almoco?: string;
  saida?: string;
  horas_trabalhadas: number;
  horas_extras: number;
  status: string;
  aprovado_por?: number;
  data_aprovacao?: string;
  observacoes?: string;
  localizacao?: string;
  created_at: string;
  updated_at: string;
  funcionario?: Funcionario;
  aprovador?: Funcionario;
}

export interface Justificativa {
  id: string;
  funcionario_id: number;
  data: string;
  tipo: string;
  motivo: string;
  status: string;
  aprovado_por?: number;
  data_aprovacao?: string;
  created_at: string;
  updated_at: string;
  funcionario?: Funcionario;
  aprovador?: Funcionario;
}

export interface HistoricoAlteracao {
  id: string;
  registro_ponto_id: string;
  campo_alterado: string;
  valor_anterior?: string;
  valor_novo?: string;
  justificativa_alteracao: string;
  alterado_por: number;
  data_alteracao: string;
  alterado_por_user?: Funcionario;
}

export interface RelatorioMensal {
  periodo: {
    mes: number;
    ano: number;
    data_inicio: string;
    data_fim: string;
  };
  resumo: {
    totalHoras: number;
    totalHorasExtras: number;
    diasTrabalhados: number;
    atrasos: number;
    faltas: number;
    registros: RegistroPonto[];
  };
  registros: RegistroPonto[];
}

export interface RelatorioHorasExtras {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  total_registros: number;
  total_horas_extras: number;
  registros: RegistroPonto[];
}

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Helper function to make API requests
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Funcionários API
export const apiFuncionarios = {
  // Listar funcionários
  listar: async (): Promise<Funcionario[]> => {
    const response = await apiRequest('/api/users');
    return response.data || [];
  },

  // Buscar funcionário por ID
  buscar: async (id: number): Promise<Funcionario> => {
    const response = await apiRequest(`/api/users/${id}`);
    return response.data;
  },

  // Listar funcionários para ponto eletrônico (com verificação de admin)
  listarParaPonto: async (usuarioId: number): Promise<{ funcionarios: Funcionario[], isAdmin: boolean }> => {
    const response = await apiRequest(`/api/ponto-eletronico/funcionarios?usuario_id=${usuarioId}`);
    return response;
  }
};

// Registros de Ponto API
export const apiRegistrosPonto = {
  // Listar registros com filtros
  listar: async (filtros: {
    funcionario_id?: number;
    data_inicio?: string;
    data_fim?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: RegistroPonto[]; pagination: any }> => {
    const params = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = `/api/ponto-eletronico/registros${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest(url);
    return response;
  },

  // Buscar registro por ID
  buscar: async (id: string): Promise<RegistroPonto> => {
    const response = await apiRequest(`/api/ponto-eletronico/registros/${id}`);
    return response.data;
  },

  // Criar novo registro
  criar: async (dados: {
    funcionario_id: number;
    data: string;
    entrada?: string;
    saida_almoco?: string;
    volta_almoco?: string;
    saida?: string;
    observacoes?: string;
    localizacao?: string;
  }): Promise<RegistroPonto> => {
    const response = await apiRequest('/api/ponto-eletronico/registros', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
    return response.data;
  },

  // Atualizar registro
  atualizar: async (id: string, dados: {
    entrada?: string;
    saida_almoco?: string;
    volta_almoco?: string;
    saida?: string;
    observacoes?: string;
    localizacao?: string;
    justificativa_alteracao: string;
  }): Promise<RegistroPonto> => {
    const response = await apiRequest(`/api/ponto-eletronico/registros/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    });
    return response.data;
  },

  // Aprovar horas extras
  aprovar: async (id: string, observacoes_aprovacao?: string): Promise<RegistroPonto> => {
    const response = await apiRequest(`/api/ponto-eletronico/registros/${id}/aprovar`, {
      method: 'POST',
      body: JSON.stringify({ observacoes_aprovacao }),
    });
    return response.data;
  },

  // Rejeitar horas extras
  rejeitar: async (id: string, motivo_rejeicao: string): Promise<RegistroPonto> => {
    const response = await apiRequest(`/api/ponto-eletronico/registros/${id}/rejeitar`, {
      method: 'POST',
      body: JSON.stringify({ motivo_rejeicao }),
    });
    return response.data;
  }
};

// Justificativas API
export const apiJustificativas = {
  // Listar justificativas com filtros
  listar: async (filtros: {
    funcionario_id?: number;
    data_inicio?: string;
    data_fim?: string;
    status?: string;
    tipo?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: Justificativa[]; pagination: any }> => {
    const params = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = `/api/ponto-eletronico/justificativas${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest(url);
    return response;
  },

  // Criar nova justificativa
  criar: async (dados: {
    funcionario_id: number;
    data: string;
    tipo: string;
    motivo: string;
  }): Promise<Justificativa> => {
    const response = await apiRequest('/api/ponto-eletronico/justificativas', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
    return response.data;
  },

  // Aprovar justificativa
  aprovar: async (id: string): Promise<Justificativa> => {
    const response = await apiRequest(`/api/ponto-eletronico/justificativas/${id}/aprovar`, {
      method: 'POST',
    });
    return response.data;
  },

  // Rejeitar justificativa
  rejeitar: async (id: string, motivo_rejeicao: string): Promise<Justificativa> => {
    const response = await apiRequest(`/api/ponto-eletronico/justificativas/${id}/rejeitar`, {
      method: 'POST',
      body: JSON.stringify({ motivo_rejeicao }),
    });
    return response.data;
  }
};

// Relatórios API
export const apiRelatorios = {
  // Relatório mensal
  mensal: async (filtros: {
    funcionario_id?: number;
    mes: number;
    ano: number;
  }): Promise<RelatorioMensal> => {
    const params = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = `/api/ponto-eletronico/relatorios/mensal?${queryString}`;
    
    const response = await apiRequest(url);
    return response.data;
  },

  // Relatório de horas extras
  horasExtras: async (filtros: {
    data_inicio: string;
    data_fim: string;
    status?: string;
  }): Promise<RelatorioHorasExtras> => {
    const params = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = `/api/ponto-eletronico/relatorios/horas-extras?${queryString}`;
    
    const response = await apiRequest(url);
    return response.data;
  }
};

// Histórico API
export const apiHistorico = {
  // Buscar histórico de alterações de um registro
  buscar: async (registro_id: string): Promise<HistoricoAlteracao[]> => {
    const response = await apiRequest(`/api/ponto-eletronico/historico/${registro_id}`);
    return response.data;
  }
};

// Utility functions
export const utilsPonto = {
  // Calcular horas trabalhadas
  calcularHorasTrabalhadas: (entrada: string, saida: string, saidaAlmoco: string, voltaAlmoco: string): number => {
    if (!entrada || !saida || !saidaAlmoco || !voltaAlmoco) return 0;
    
    const entradaTime = new Date(`2000-01-01T${entrada}:00`);
    const saidaTime = new Date(`2000-01-01T${saida}:00`);
    const saidaAlmocoTime = new Date(`2000-01-01T${saidaAlmoco}:00`);
    const voltaAlmocoTime = new Date(`2000-01-01T${voltaAlmoco}:00`);
    
    const manha = (saidaAlmocoTime.getTime() - entradaTime.getTime()) / (1000 * 60 * 60);
    const tarde = (saidaTime.getTime() - voltaAlmocoTime.getTime()) / (1000 * 60 * 60);
    
    return Math.max(0, manha + tarde);
  },

  // Calcular horas extras
  calcularHorasExtras: (horasTrabalhadas: number, jornadaPadrao: number = 8): number => {
    return Math.max(0, horasTrabalhadas - jornadaPadrao);
  },

  // Formatar data para exibição
  formatarData: (data: string): string => {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR');
  },

  // Formatar horário para exibição
  formatarHorario: (horario: string): string => {
    if (!horario) return '';
    return horario;
  },

  // Obter badge de status
  obterBadgeStatus: (status: string) => {
    const badges = {
      'Completo': { className: 'bg-green-100 text-green-800', text: 'Completo' },
      'Em Andamento': { className: 'bg-blue-100 text-blue-800', text: 'Em Andamento' },
      'Atraso': { className: 'bg-yellow-100 text-yellow-800', text: 'Atraso' },
      'Falta': { className: 'bg-red-100 text-red-800', text: 'Falta' },
      'Pendente Aprovação': { className: 'bg-orange-100 text-orange-800', text: 'Pendente Aprovação' },
      'Aprovado': { className: 'bg-green-100 text-green-800', text: 'Aprovado' },
      'Rejeitado': { className: 'bg-red-100 text-red-800', text: 'Rejeitado' }
    };
    
    return badges[status as keyof typeof badges] || { className: 'bg-gray-100 text-gray-800', text: status };
  }
};

export default {
  apiFuncionarios,
  apiRegistrosPonto,
  apiJustificativas,
  apiRelatorios,
  apiHistorico,
  utilsPonto
};
