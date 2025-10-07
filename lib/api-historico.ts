const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Interface unificada para atividades misturadas
interface AtividadeHistorico {
  id: string;
  tipo: 'auditoria' | 'locacao' | 'ponto' | 'componente';
  timestamp: string;
  usuario_id: number | null;
  acao: string;
  entidade: string;
  entidade_id: string;
  titulo: string;
  descricao: string;
  usuario_nome: string;
  // Campos específicos por tipo
  dados_anteriores?: any;
  dados_novos?: any;
  ip_address?: string;
  user_agent?: string;
  obra_nome?: string;
  cliente_nome?: string;
  grua_nome?: string;
  grua_modelo?: string;
  valor_locacao?: number;
  entrada?: string;
  saida?: string;
  horas_trabalhadas?: number;
  status?: string;
  componente_nome?: string;
  componente_tipo?: string;
  grua_origem_nome?: string;
  grua_destino_nome?: string;
}

interface HistoricoLocacao {
  id: number;
  grua_id: number;
  obra_id: number;
  data_inicio: string;
  data_fim: string;
  tipo_operacao: string;
  valor_locacao: number;
  funcionario_responsavel_id: number;
  obra: {
    id: number;
    nome: string;
    status: string;
    cliente: {
      nome: string;
    };
  };
  funcionario: {
    nome: string;
    cargo: string;
  };
  grua: {
    name: string;
    modelo: string;
  };
}

interface HistoricoResponse {
  success: boolean;
  data: HistoricoLocacao[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface LivroGrua {
  id: number;
  grua_id: number;
  funcionario_id: number;
  data_entrada: string;
  tipo_entrada: string;
  status_entrada: string;
  descricao: string;
  funcionario: {
    nome: string;
    cargo: string;
  };
}

interface HistoricoGruaResponse {
  success: boolean;
  data: {
    locacoes: HistoricoLocacao[];
    livro: LivroGrua[];
  };
}

interface LogAuditoria {
  id: string;
  tipo: string;
  timestamp: string;
  usuario_id: number | null;
  acao: string;
  entidade: string;
  entidade_id: string;
  dados_anteriores: any;
  dados_novos: any;
  ip_address: string;
  user_agent: string;
  titulo: string;
  descricao: string;
  usuario_nome: string;
}

interface HistoricoComponente {
  id: number;
  componente_id: number;
  tipo_movimentacao: string;
  quantidade_movimentada: number;
  quantidade_anterior: number;
  quantidade_atual: number;
  motivo: string;
  obra_id: number;
  grua_origem_id: string;
  grua_destino_id: string;
  funcionario_responsavel_id: number;
  data_movimentacao: string;
  observacoes: string;
  anexos: any;
  created_at: string;
  componente: {
    nome: string;
    tipo: string;
    modelo: string;
  };
  funcionario: {
    nome: string;
    cargo: string;
  };
  obra: {
    nome: string;
    cliente: {
      nome: string;
    };
  };
  grua_origem: {
    name: string;
    modelo: string;
  };
  grua_destino: {
    name: string;
    modelo: string;
  };
}

interface RegistroPonto {
  id: string;
  funcionario_id: number;
  data: string;
  entrada: string;
  saida_almoco: string;
  volta_almoco: string;
  saida: string;
  horas_trabalhadas: number;
  horas_extras: number;
  status: string;
  aprovado_por: number | null;
  data_aprovacao: string | null;
  observacoes: string | null;
  localizacao: string | null;
  created_at: string;
  updated_at: string;
  funcionario: {
    nome: string;
    cargo: string;
  };
  aprovado_por_usuario: {
    nome: string;
    email: string;
  } | null;
}

export const apiHistorico = {
  // Histórico geral (mix de todas as atividades)
  async listarGeral(params?: { 
    page?: number; 
    limit?: number; 
    modulo?: string; 
    acao?: string; 
  }): Promise<{ success: boolean; data: AtividadeHistorico[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.modulo) queryParams.append('modulo', params.modulo);
    if (params?.acao) queryParams.append('acao', params.acao);
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/historico/geral?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Listar histórico de todas as gruas
  async listar(params?: {
    page?: number;
    limit?: number;
  }): Promise<HistoricoResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/historico/gruas?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Histórico de componentes
  async listarComponentes(params?: { page?: number; limit?: number; }): Promise<{ success: boolean; data: HistoricoComponente[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/historico/componentes?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Registros de ponto
  async listarPonto(params?: { page?: number; limit?: number; }): Promise<{ success: boolean; data: RegistroPonto[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/historico/ponto?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Buscar histórico de uma grua específica
  async buscarPorGrua(gruaId: number, params?: {
    data_inicio?: string;
    data_fim?: string;
  }): Promise<{ locacoes: HistoricoLocacao[], livro: LivroGrua[] }> {
    const queryParams = new URLSearchParams();
    if (params?.data_inicio) queryParams.append('data_inicio', params.data_inicio);
    if (params?.data_fim) queryParams.append('data_fim', params.data_fim);
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/historico/gruas/${gruaId}?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  },

  // Obter estatísticas do histórico
  async obterEstatisticas(): Promise<any> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/historico/estatisticas`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }
};
