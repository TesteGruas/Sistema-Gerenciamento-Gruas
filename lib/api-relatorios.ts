const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Interfaces para os relatórios
export interface RelatorioUtilizacao {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  filtros: {
    tipo_grua?: string;
    ordenar_por: string;
    limite: number;
    pagina?: number;
  };
  totais: {
    total_gruas: number;
    gruas_analisadas: number;
    receita_total_periodo: number;
    dias_total_locacao: number;
    taxa_utilizacao_media: number;
  };
  relatorio: Array<{
    grua: {
      id: number;
      modelo: string;
      fabricante: string;
      tipo: string;
      capacidade: number;
      status: string;
    };
    total_locacoes: number;
    dias_total_locacao: number;
    receita_total: number;
    obras_visitadas: number;
    taxa_utilizacao: number;
    receita_media_dia: number;
  }>;
  paginacao?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface RelatorioFinanceiro {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  agrupamento: string;
  totais: {
    receita_total_periodo: number;
    total_vendas: number;
    total_compras: number;
    total_orcamentos: number;
    lucro_bruto_total: number;
    margem_lucro: number;
  };
  relatorio: Array<{
    chave: string;
    nome: string;
    detalhes: any;
    total_receita: number;
    total_vendas: number;
    total_compras: number;
    total_orcamentos: number;
    lucro_bruto: number;
    vendas: any[];
    compras: any[];
    orcamentos: any[];
  }>;
  projecoes?: any;
  paginacao?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface RelatorioManutencao {
  filtros: {
    dias_antecedencia: number;
    status_grua: string;
    tipo_manutencao: string;
  };
  estatisticas: {
    total_gruas_analisadas: number;
    manutencoes_alta_prioridade: number;
    manutencoes_media_prioridade: number;
    manutencoes_baixa_prioridade: number;
    gruas_ocupadas: number;
    valor_total_estimado: number;
  };
  relatorio: Array<{
    grua: {
      id: number;
      modelo: string;
      fabricante: string;
      tipo: string;
      capacidade: number;
      status: string;
      status_operacional: string;
      horas_operacao: number;
      ultima_manutencao: string;
    };
    manutencao: {
      proxima_manutencao: string;
      dias_restantes: number;
      prioridade: string;
      tipo_manutencao: string;
      valor_estimado: number;
    };
    obra_atual: any;
  }>;
}

export interface RelatorioImpostos {
  competencia: string;
  total_impostos: number;
  total_pago: number;
  total_pendente: number;
  impostos_por_tipo: Array<{
    tipo: string;
    valor_total: number;
    valor_pago: number;
    valor_pendente: number;
  }>;
}

export interface DashboardRelatorios {
  resumo_geral: {
    total_gruas: number;
    gruas_ocupadas: number;
    gruas_disponiveis: number;
    taxa_utilizacao: number;
    valor_total_parque: number;
    receita_mes_atual: number;
  };
  distribuicao: {
    por_status: Record<string, number>;
    por_tipo: Record<string, number>;
  };
  manutencao: {
    manutencoes_proximas: number;
    proxima_semana: string;
  };
  top_gruas: Array<{
    grua: {
      id: number;
      modelo: string;
      fabricante: string;
    };
    total_locacoes: number;
    dias_total_locacao: number;
    receita_total: number;
    obras_visitadas: number;
    taxa_utilizacao: number;
    receita_media_dia: number;
  }>;
  alertas: Array<{
    tipo: string;
    prioridade: string;
    mensagem: string;
    acao: string;
  }>;
  ultima_atualizacao: string;
}

export const apiRelatorios = {
  // Relatório de utilização de gruas
  async utilizacao(params: {
    data_inicio: string;
    data_fim: string;
    tipo_grua?: string;
    ordenar_por?: string;
    limite?: number;
    pagina?: number;
  }): Promise<{ success: boolean; data: RelatorioUtilizacao }> {
    const queryParams = new URLSearchParams();
    queryParams.append('data_inicio', params.data_inicio);
    queryParams.append('data_fim', params.data_fim);
    if (params.tipo_grua) queryParams.append('tipo_grua', params.tipo_grua);
    if (params.ordenar_por) queryParams.append('ordenar_por', params.ordenar_por);
    if (params.limite) queryParams.append('limite', params.limite.toString());
    if (params.pagina) queryParams.append('pagina', params.pagina.toString());
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/relatorios/utilizacao?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Relatório financeiro
  async financeiro(params: {
    data_inicio: string;
    data_fim: string;
    agrupar_por?: string;
    incluir_projecao?: boolean;
    limite?: number;
    pagina?: number;
  }): Promise<{ success: boolean; data: RelatorioFinanceiro }> {
    const queryParams = new URLSearchParams();
    queryParams.append('data_inicio', params.data_inicio);
    queryParams.append('data_fim', params.data_fim);
    if (params.agrupar_por) queryParams.append('agrupar_por', params.agrupar_por);
    if (params.incluir_projecao !== undefined) queryParams.append('incluir_projecao', params.incluir_projecao.toString());
    if (params.limite) queryParams.append('limite', params.limite.toString());
    if (params.pagina) queryParams.append('pagina', params.pagina.toString());
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/relatorios/financeiro?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Relatório de manutenção
  async manutencao(params?: {
    dias_antecedencia?: number;
    status_grua?: string;
    tipo_manutencao?: string;
  }): Promise<{ success: boolean; data: RelatorioManutencao }> {
    const queryParams = new URLSearchParams();
    if (params?.dias_antecedencia) queryParams.append('dias_antecedencia', params.dias_antecedencia.toString());
    if (params?.status_grua) queryParams.append('status_grua', params.status_grua);
    if (params?.tipo_manutencao) queryParams.append('tipo_manutencao', params.tipo_manutencao);
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/relatorios/manutencao?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Relatório de impostos financeiros
  async impostos(params: {
    mes: number;
    ano: number;
  }): Promise<{ success: boolean; data: RelatorioImpostos }> {
    const mes = params.mes.toString().padStart(2, '0');
    const ano = params.ano.toString();
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/relatorios-impostos/${mes}/${ano}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Relatório de faturamento por tipo
  async faturamento(params: {
    data_inicio: string;
    data_fim: string;
    agrupar_por?: 'mes' | 'dia';
  }): Promise<{ success: boolean; data: any; resumo: any }> {
    const queryParams = new URLSearchParams();
    queryParams.append('data_inicio', params.data_inicio);
    queryParams.append('data_fim', params.data_fim);
    if (params.agrupar_por) queryParams.append('agrupar_por', params.agrupar_por);
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/relatorios-faturamento?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Dashboard financeiro consolidado
  async dashboardConsolidado(params?: {
    data_inicio?: string;
    data_fim?: string;
  }): Promise<{ success: boolean; periodo: any; resumo: any }> {
    const queryParams = new URLSearchParams();
    if (params?.data_inicio) queryParams.append('data_inicio', params.data_inicio);
    if (params?.data_fim) queryParams.append('data_fim', params.data_fim);
    
    const token = localStorage.getItem('access_token');
    const url = queryParams.toString() 
      ? `${API_BASE_URL}/api/financial-data/resumo?${queryParams}`
      : `${API_BASE_URL}/api/financial-data/resumo`;
      
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Dashboard de relatórios (reutiliza o endpoint do dashboard principal)
  async dashboard(): Promise<{ success: boolean; data: DashboardRelatorios }> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/relatorios/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Relatório de boletos
  async boletos(params: {
    data_inicio?: string;
    data_fim?: string;
    status?: string;
    obra_id?: number;
    cliente_id?: number;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: any[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params.data_inicio) queryParams.append('data_inicio', params.data_inicio);
    if (params.data_fim) queryParams.append('data_fim', params.data_fim);
    if (params.status) queryParams.append('status', params.status);
    if (params.obra_id) queryParams.append('obra_id', params.obra_id.toString());
    if (params.cliente_id) queryParams.append('cliente_id', params.cliente_id.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    queryParams.append('include_medicoes', 'true');
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/boletos?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Relatório de medições
  async medicoes(params: {
    data_inicio?: string;
    data_fim?: string;
    obra_id?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: any[]; total?: number }> {
    const queryParams = new URLSearchParams();
    if (params.data_inicio) queryParams.append('data_inicio', params.data_inicio);
    if (params.data_fim) queryParams.append('data_fim', params.data_fim);
    if (params.obra_id) queryParams.append('obra_id', params.obra_id.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/medicoes-mensais?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Relatório de orçamentos
  async orcamentos(params: {
    data_inicio?: string;
    data_fim?: string;
    status?: string;
    obra_id?: number;
    cliente_id?: number;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (params.data_inicio) queryParams.append('data_inicio', params.data_inicio);
    if (params.data_fim) queryParams.append('data_fim', params.data_fim);
    if (params.status) queryParams.append('status', params.status);
    if (params.obra_id) queryParams.append('obra_id', params.obra_id.toString());
    if (params.cliente_id) queryParams.append('cliente_id', params.cliente_id.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/orcamentos?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Relatório de obras
  async obras(params?: {
    status?: string;
    cliente_id?: number;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.cliente_id) queryParams.append('cliente_id', params.cliente_id.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/obras?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Relatório de estoque
  async estoque(params?: {
    categoria_id?: number;
    status?: string;
    tipo_item?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (params?.categoria_id) queryParams.append('categoria_id', params.categoria_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.tipo_item) queryParams.append('tipo_item', params.tipo_item);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/estoque?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  // Relatório de complementos
  async complementos(params?: {
    tipo?: string;
    ativo?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: any[]; pagination?: any }> {
    const queryParams = new URLSearchParams();
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    if (params?.ativo !== undefined) queryParams.append('ativo', params.ativo.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/complementos?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }
};
