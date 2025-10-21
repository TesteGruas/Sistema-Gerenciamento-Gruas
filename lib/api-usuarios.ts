/**
 * API functions for Usuários module
 */

import { fetchWithAuth } from './api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  data_nascimento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  foto_perfil?: string;
  status: 'Ativo' | 'Inativo' | 'Bloqueado' | 'Pendente';
  ultimo_acesso?: string;
  created_at: string;
  updated_at: string;
  cargo?: string;
  turno?: string;
  data_admissao?: string;
  salario?: number;
  funcionario_id?: number;
  usuario_perfis?: Array<{
    id: number;
    perfil_id: number;
    status: string;
    data_atribuicao: string;
    perfis: {
      id: number;
      nome: string;
      nivel_acesso: number;
      descricao?: string;
    };
  }> | {
    id: number;
    perfil_id: number;
    status: string;
    data_atribuicao: string;
    perfis: {
      id: number;
      nome: string;
      nivel_acesso: number;
      descricao?: string;
    };
  };
}

export interface UsuarioResponse {
  success: boolean;
  data: Usuario[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UsuarioCreateData {
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  data_nascimento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  foto_perfil?: string;
  status?: 'Ativo' | 'Inativo' | 'Bloqueado' | 'Pendente';
  cargo?: string;
  turno?: string;
  data_admissao?: string;
  salario?: number;
  funcionario_id?: number;
}

export interface UsuarioUpdateData {
  nome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  data_nascimento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  foto_perfil?: string;
  status?: 'Ativo' | 'Inativo' | 'Bloqueado' | 'Pendente';
  cargo?: string;
  turno?: string;
  data_admissao?: string;
  salario?: number;
  funcionario_id?: number;
}

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

// Helper function to make API requests
const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}${url}`, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Usuários API
export const apiUsuarios = {
  // Listar todos os usuários
  listar: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<UsuarioResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `/api/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest(url);
    return response;
  },

  // Buscar usuário por ID
  buscar: async (id: number): Promise<Usuario> => {
    const response = await apiRequest(`/api/users/${id}`);
    return response.data;
  },

  // Criar novo usuário
  criar: async (dados: UsuarioCreateData): Promise<Usuario> => {
    const response = await apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
    return response.data;
  },

  // Atualizar usuário
  atualizar: async (id: number, dados: UsuarioUpdateData): Promise<Usuario> => {
    const response = await apiRequest(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    });
    return response.data;
  },

  // Excluir usuário
  excluir: async (id: number): Promise<void> => {
    await apiRequest(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Buscar usuários por status
  buscarPorStatus: async (status: string): Promise<Usuario[]> => {
    const response = await apiUsuarios.listar({ status });
    return response.data;
  },

  // Buscar usuários por termo
  buscarPorTermo: async (termo: string): Promise<Usuario[]> => {
    const response = await apiUsuarios.listar({ search: termo });
    return response.data;
  },

  // Atualizar status do usuário
  atualizarStatus: async (id: number, status: 'Ativo' | 'Inativo' | 'Bloqueado' | 'Pendente'): Promise<Usuario> => {
    return await apiUsuarios.atualizar(id, { status });
  }
};

// Utilitários
export const utilsUsuarios = {
  // Filtrar usuários por termo de busca
  filtrarPorTermo: (usuarios: Usuario[], termo: string): Usuario[] => {
    if (!termo) return usuarios;
    
    const termoLower = termo.toLowerCase();
    return usuarios.filter(usuario => 
      usuario.nome.toLowerCase().includes(termoLower) ||
      usuario.email.toLowerCase().includes(termoLower) ||
      (usuario.cpf && usuario.cpf.includes(termo)) ||
      (usuario.telefone && usuario.telefone.includes(termo))
    );
  },

  // Filtrar usuários por status
  filtrarPorStatus: (usuarios: Usuario[], status: string): Usuario[] => {
    if (status === 'all') return usuarios;
    return usuarios.filter(usuario => usuario.status === status);
  },

  // Obter estatísticas dos usuários
  obterEstatisticas: (usuarios: Usuario[]) => {
    const total = usuarios.length;
    const ativos = usuarios.filter(u => u.status === 'Ativo').length;
    const inativos = usuarios.filter(u => u.status === 'Inativo').length;
    const bloqueados = usuarios.filter(u => u.status === 'Bloqueado').length;
    const pendentes = usuarios.filter(u => u.status === 'Pendente').length;

    return {
      total,
      ativos,
      inativos,
      bloqueados,
      pendentes,
      percentualAtivos: total > 0 ? Math.round((ativos / total) * 100) : 0
    };
  },

  // Formatar dados do usuário para exibição
  formatarParaExibicao: (usuario: Usuario) => {
    return {
      ...usuario,
      nomeFormatado: usuario.nome,
      emailFormatado: usuario.email,
      telefoneFormatado: usuario.telefone || 'Não informado',
      statusFormatado: usuario.status,
      ultimoAcessoFormatado: usuario.ultimo_acesso 
        ? new Date(usuario.ultimo_acesso).toLocaleDateString('pt-BR')
        : 'Nunca',
      dataCriacaoFormatada: new Date(usuario.created_at).toLocaleDateString('pt-BR')
    };
  }
};

// Funções de conveniência para compatibilidade
export const getUsers = async (): Promise<Usuario[]> => {
  const response = await apiUsuarios.listar({ limit: 1000 });
  return response.data || [];
};

export default {
  apiUsuarios,
  utilsUsuarios
};
