import { api } from './api';

export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  tipo: 'venda' | 'locacao' | 'servico';
  preco: number;
  preco_custo?: number;
  unidade: string;
  estoque?: number;
  estoque_minimo?: number;
  fornecedor_id?: string;
  fornecedor?: {
    id: string;
    nome: string;
  };
  status: 'ativo' | 'inativo';
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProdutoCreate {
  nome: string;
  descricao?: string;
  categoria: string;
  tipo: 'venda' | 'locacao' | 'servico';
  preco: number;
  preco_custo?: number;
  unidade: string;
  estoque?: number;
  estoque_minimo?: number;
  fornecedor_id?: string;
  status?: 'ativo' | 'inativo';
  observacoes?: string;
}

export interface ProdutoUpdate extends Partial<ProdutoCreate> {}

export interface ProdutoFilters {
  categoria?: string;
  tipo?: string;
  status?: string;
  fornecedor_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const produtosApi = {
  async list(filters: ProdutoFilters = {}): Promise<{ produtos: Produto[], total: number }> {
    const params = new URLSearchParams();
    
    if (filters.categoria) params.append('categoria', filters.categoria);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.status) params.append('status', filters.status);
    if (filters.fornecedor_id) params.append('fornecedor_id', filters.fornecedor_id);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/produtos?${params.toString()}`);
    
    return {
      produtos: response.data.data || [],
      total: response.data.pagination?.total || 0
    };
  },

  async getById(id: string): Promise<Produto> {
    const response = await api.get(`/produtos/${id}`);
    return response.data.data;
  },

  async create(produto: ProdutoCreate): Promise<Produto> {
    const response = await api.post('/produtos', produto);
    return response.data.data;
  },

  async update(id: string, produto: ProdutoUpdate): Promise<Produto> {
    const response = await api.put(`/produtos/${id}`, produto);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/produtos/${id}`);
  },

  async getStats(): Promise<any> {
    const response = await api.get('/produtos/stats');
    return response.data.data;
  },

  async getBaixoEstoque(): Promise<Produto[]> {
    const response = await api.get('/produtos/baixo-estoque');
    return response.data.data || [];
  }
};

