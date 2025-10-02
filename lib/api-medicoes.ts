import { api } from './api';

export interface Medicao {
  id: number;
  numero: string;
  locacao_id: number;
  periodo: string;
  data_medicao: string;
  valor_base: number;
  valor_aditivos: number;
  valor_total: number;
  status: 'pendente' | 'finalizada' | 'cancelada';
  observacoes?: string;
  created_at: string;
  updated_at: string;
  locacoes?: {
    id: number;
    numero: string;
    cliente_id: number;
    equipamento_id: string;
    tipo_equipamento: string;
    valor_mensal: number;
    status: string;
    clientes?: {
      id: number;
      nome: string;
    };
  };
}

export interface MedicaoCreate {
  numero: string;
  locacao_id: number;
  periodo: string;
  data_medicao: string;
  valor_base: number;
  valor_aditivos?: number;
  valor_total: number;
  observacoes?: string;
}

export interface MedicaoUpdate {
  numero?: string;
  locacao_id?: number;
  periodo?: string;
  data_medicao?: string;
  valor_base?: number;
  valor_aditivos?: number;
  valor_total?: number;
  status?: 'pendente' | 'finalizada' | 'cancelada';
  observacoes?: string;
}

export interface MedicaoFilters {
  locacao_id?: number;
  periodo?: string;
  status?: 'pendente' | 'finalizada' | 'cancelada';
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  limit?: number;
}

export const medicoesApi = {
  async list(filters: MedicaoFilters = {}): Promise<{ medicoes: Medicao[], total: number }> {
    const params = new URLSearchParams();
    
    if (filters.locacao_id) params.append('locacao_id', filters.locacao_id.toString());
    if (filters.periodo) params.append('periodo', filters.periodo);
    if (filters.status) params.append('status', filters.status);
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters.data_fim) params.append('data_fim', filters.data_fim);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/medicoes?${params.toString()}`);
    
    // Transformar os dados para garantir tipos corretos
    const medicoes = (response.data.data || []).map((medicao: any) => ({
      ...medicao,
      valor_base: parseFloat(medicao.valor_base) || 0,
      valor_aditivos: parseFloat(medicao.valor_aditivos) || 0,
      valor_total: parseFloat(medicao.valor_total) || 0,
      locacao_id: parseInt(medicao.locacao_id) || 0
    }));

    return {
      medicoes,
      total: response.data.pagination?.total || 0
    };
  },

  async getById(id: string): Promise<Medicao> {
    const response = await api.get(`/medicoes/${id}`);
    const medicaoData = response.data.data;
    
    return {
      ...medicaoData,
      valor_base: parseFloat(medicaoData.valor_base) || 0,
      valor_aditivos: parseFloat(medicaoData.valor_aditivos) || 0,
      valor_total: parseFloat(medicaoData.valor_total) || 0,
      locacao_id: parseInt(medicaoData.locacao_id) || 0
    };
  },

  async create(medicao: MedicaoCreate): Promise<Medicao> {
    const response = await api.post('/medicoes', medicao);
    const medicaoData = response.data.data;
    
    return {
      ...medicaoData,
      valor_base: parseFloat(medicaoData.valor_base) || 0,
      valor_aditivos: parseFloat(medicaoData.valor_aditivos) || 0,
      valor_total: parseFloat(medicaoData.valor_total) || 0,
      locacao_id: parseInt(medicaoData.locacao_id) || 0
    };
  },

  async update(id: string, medicao: MedicaoUpdate): Promise<Medicao> {
    const response = await api.put(`/medicoes/${id}`, medicao);
    const medicaoData = response.data.data;
    
    return {
      ...medicaoData,
      valor_base: parseFloat(medicaoData.valor_base) || 0,
      valor_aditivos: parseFloat(medicaoData.valor_aditivos) || 0,
      valor_total: parseFloat(medicaoData.valor_total) || 0,
      locacao_id: parseInt(medicaoData.locacao_id) || 0
    };
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/medicoes/${id}`);
  },

  async finalizar(id: string): Promise<Medicao> {
    const response = await api.patch(`/medicoes/${id}/finalizar`);
    const medicaoData = response.data.data;
    
    return {
      ...medicaoData,
      valor_base: parseFloat(medicaoData.valor_base) || 0,
      valor_aditivos: parseFloat(medicaoData.valor_aditivos) || 0,
      valor_total: parseFloat(medicaoData.valor_total) || 0,
      locacao_id: parseInt(medicaoData.locacao_id) || 0
    };
  }
};