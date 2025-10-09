import { api } from './api';

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  contato?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  categoria?: string;
  status: 'ativo' | 'inativo';
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface FornecedorCreate {
  nome: string;
  cnpj: string;
  contato?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  categoria?: string;
  status?: 'ativo' | 'inativo';
  observacoes?: string;
}

export interface FornecedorUpdate extends Partial<FornecedorCreate> {}

export interface FornecedorFilters {
  status?: string;
  categoria?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const fornecedoresApi = {
  async list(filters: FornecedorFilters = {}): Promise<{ fornecedores: Fornecedor[], total: number }> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.categoria) params.append('categoria', filters.categoria);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/fornecedores?${params.toString()}`);
    
    return {
      fornecedores: response.data.data || [],
      total: response.data.pagination?.total || 0
    };
  },

  async getById(id: string): Promise<Fornecedor> {
    const response = await api.get(`/fornecedores/${id}`);
    return response.data.data;
  },

  async create(fornecedor: FornecedorCreate): Promise<Fornecedor> {
    const response = await api.post('/fornecedores', fornecedor);
    return response.data.data;
  },

  async update(id: string, fornecedor: FornecedorUpdate): Promise<Fornecedor> {
    const response = await api.put(`/fornecedores/${id}`, fornecedor);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/fornecedores/${id}`);
  },

  async getStats(): Promise<any> {
    const response = await api.get('/fornecedores/stats');
    return response.data.data;
  }
};

