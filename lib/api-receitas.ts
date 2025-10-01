import { api } from './api';

export interface Receita {
  id: string;
  obra_id: number;
  tipo: 'locacao' | 'servico' | 'venda';
  descricao: string;
  valor: number;
  data_receita: string;
  status: 'pendente' | 'confirmada' | 'cancelada';
  observacoes?: string;
  funcionario_id?: number;
  created_at: string;
  updated_at: string;
  obras?: {
    id: number;
    nome: string;
    clientes?: {
      id: number;
      nome: string;
    };
  };
  funcionarios?: {
    id: number;
    nome: string;
    cargo: string;
  };
}

export interface ReceitaCreate {
  obra_id: number;
  tipo: 'locacao' | 'servico' | 'venda';
  descricao: string;
  valor: number;
  data_receita: string;
  funcionario_id?: number;
  observacoes?: string;
}

export interface ReceitaUpdate extends Partial<ReceitaCreate> {
  status?: 'pendente' | 'confirmada' | 'cancelada';
}

export interface ReceitaFilters {
  obra_id?: number;
  tipo?: string;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  limit?: number;
}

export interface ReceitasResponse {
  success: boolean;
  data: Receita[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const receitasApi = {
  async list(filters: ReceitaFilters = {}): Promise<{ receitas: Receita[], total: number }> {
    const params = new URLSearchParams();
    
    if (filters.obra_id) params.append('obra_id', filters.obra_id.toString());
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.status) params.append('status', filters.status);
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters.data_fim) params.append('data_fim', filters.data_fim);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/receitas?${params.toString()}`);
    
    // Transformar os dados para garantir tipos corretos
    const receitas = (response.data.data || []).map((receita: any) => ({
      ...receita,
      valor: parseFloat(receita.valor) || 0,
      obra_id: parseInt(receita.obra_id) || 0,
      funcionario_id: receita.funcionario_id ? parseInt(receita.funcionario_id) : undefined
    }));

    return {
      receitas,
      total: response.data.pagination?.total || 0
    };
  },

  async getById(id: string): Promise<Receita> {
    const response = await api.get(`/receitas/${id}`);
    const receitaData = response.data.data;
    
    return {
      ...receitaData,
      valor: parseFloat(receitaData.valor) || 0,
      obra_id: parseInt(receitaData.obra_id) || 0,
      funcionario_id: receitaData.funcionario_id ? parseInt(receitaData.funcionario_id) : undefined
    };
  },

  async create(receita: ReceitaCreate): Promise<Receita> {
    const response = await api.post('/receitas', receita);
    const receitaData = response.data.data;
    
    return {
      ...receitaData,
      valor: parseFloat(receitaData.valor) || 0,
      obra_id: parseInt(receitaData.obra_id) || 0,
      funcionario_id: receitaData.funcionario_id ? parseInt(receitaData.funcionario_id) : undefined
    };
  },

  async update(id: string, receita: ReceitaUpdate): Promise<Receita> {
    const response = await api.put(`/receitas/${id}`, receita);
    const receitaData = response.data.data;
    
    return {
      ...receitaData,
      valor: parseFloat(receitaData.valor) || 0,
      obra_id: parseInt(receitaData.obra_id) || 0,
      funcionario_id: receitaData.funcionario_id ? parseInt(receitaData.funcionario_id) : undefined
    };
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/receitas/${id}`);
  },

  async confirm(id: string): Promise<Receita> {
    const response = await api.patch(`/receitas/${id}/confirm`);
    const receitaData = response.data.data;
    
    return {
      ...receitaData,
      valor: parseFloat(receitaData.valor) || 0,
      obra_id: parseInt(receitaData.obra_id) || 0,
      funcionario_id: receitaData.funcionario_id ? parseInt(receitaData.funcionario_id) : undefined
    };
  },

  async cancel(id: string): Promise<Receita> {
    const response = await api.patch(`/receitas/${id}/cancel`);
    const receitaData = response.data.data;
    
    return {
      ...receitaData,
      valor: parseFloat(receitaData.valor) || 0,
      obra_id: parseInt(receitaData.obra_id) || 0,
      funcionario_id: receitaData.funcionario_id ? parseInt(receitaData.funcionario_id) : undefined
    };
  },

  async getResumo(filters: { obra_id?: number, data_inicio?: string, data_fim?: string } = {}): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters.obra_id) params.append('obra_id', filters.obra_id.toString());
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters.data_fim) params.append('data_fim', filters.data_fim);

    const response = await api.get(`/receitas/resumo?${params.toString()}`);
    return response.data.data || [];
  },

  async export(filters: ReceitaFilters = {}, format: 'csv' | 'xlsx' = 'csv'): Promise<void> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filters.obra_id) params.append('obra_id', filters.obra_id.toString());
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.status) params.append('status', filters.status);
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters.data_fim) params.append('data_fim', filters.data_fim);

    const response = await api.get(`/receitas/export?${params.toString()}`, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receitas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
};
