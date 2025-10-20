/**
 * API functions for Permissões module
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types
export interface Perfil {
  id: number;
  nome: string;
  descricao?: string;
  nivel_acesso: number;
  status: 'Ativo' | 'Inativo';
  created_at: string;
  updated_at: string;
}

export interface Permissao {
  id: number;
  nome: string;
  descricao?: string;
  modulo: string;
  acao: string;
  recurso?: string;
  status: 'Ativa' | 'Inativa';
  created_at: string;
  updated_at: string;
}

export interface PerfilPermissao {
  id: number;
  perfil_id: number;
  permissao_id: number;
  data_atribuicao: string;
  atribuido_por: number;
  status: 'Ativa' | 'Inativa';
  created_at: string;
  updated_at: string;
  permissoes?: Permissao;
}

export interface PermissaoResponse {
  success: boolean;
  data: Permissao[];
  message?: string;
}

export interface PerfilResponse {
  success: boolean;
  data: Perfil[];
  message?: string;
}

export interface PerfilPermissaoResponse {
  success: boolean;
  data: PerfilPermissao[];
  message?: string;
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
  const token = getAuthToken();
  
  if (!token) {
    console.warn('Token não encontrado');
    throw new Error('Token de acesso requerido');
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
    // TEMPORARIAMENTE DESABILITADO - Interceptor de logout para 403
    // if (response.status === 403 && errorData.error === "Token inválido ou expirado" && errorData.code === "INVALID_TOKEN") {
    //   console.warn('Token inválido ou expirado, removendo dados do localStorage e redirecionando para login...')
    //   localStorage.removeItem('access_token')
    //   localStorage.removeItem('user_data')
    //   localStorage.removeItem('refresh_token')
    //   if (typeof window !== 'undefined') {
    //     window.location.href = '/'
    //   }
    // }
    // TEMPORARIAMENTE DESABILITADO - Interceptor de logout para 401/403
    // else if (response.status === 401 || response.status === 403) {
    //   console.warn('Erro de autenticação, redirecionando para login...')
    //   localStorage.removeItem('access_token')
    //   localStorage.removeItem('user_data')
    //   localStorage.removeItem('refresh_token')
    //   if (typeof window !== 'undefined') {
    //     window.location.href = '/'
    //   }
    // }
      
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Perfis API
export const apiPerfis = {
  // Listar todos os perfis
  listar: async (): Promise<Perfil[]> => {
    const response = await apiRequest('/api/permissoes/perfis');
    return response.data || [];
  },

  // Buscar perfil por ID
  buscar: async (id: number): Promise<Perfil> => {
    const response = await apiRequest(`/api/permissoes/perfis/${id}`);
    return response.data;
  },

  // Criar novo perfil
  criar: async (dados: {
    nome: string;
    descricao?: string;
    nivel_acesso?: number;
    status?: 'Ativo' | 'Inativo';
  }): Promise<Perfil> => {
    const response = await apiRequest('/api/permissoes/perfis', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
    return response.data;
  },

  // Atualizar perfil
  atualizar: async (id: number, dados: {
    nome?: string;
    descricao?: string;
    nivel_acesso?: number;
    status?: 'Ativo' | 'Inativo';
  }): Promise<Perfil> => {
    const response = await apiRequest(`/api/permissoes/perfis/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    });
    return response.data;
  },

  // Excluir perfil
  excluir: async (id: number): Promise<void> => {
    await apiRequest(`/api/permissoes/perfis/${id}`, {
      method: 'DELETE',
    });
  }
};

// Permissões API
export const apiPermissoes = {
  // Listar todas as permissões
  listar: async (): Promise<Permissao[]> => {
    const response = await apiRequest('/api/permissoes/permissoes');
    return response.data || [];
  },

  // Buscar permissões por módulo
  buscarPorModulo: async (modulo: string): Promise<Permissao[]> => {
    const todasPermissoes = await apiPermissoes.listar();
    return todasPermissoes.filter(p => p.modulo === modulo);
  },

  // Criar nova permissão
  criar: async (dados: {
    nome: string;
    descricao?: string;
    modulo: string;
    acao: string;
    recurso?: string;
    status?: 'Ativa' | 'Inativa';
  }): Promise<Permissao> => {
    const response = await apiRequest('/api/permissoes/permissoes', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
    return response.data;
  }
};

// Perfil Permissões API
export const apiPerfilPermissoes = {
  // Obter permissões de um perfil
  obterPermissoes: async (perfilId: number): Promise<PerfilPermissao[]> => {
    const response = await apiRequest(`/api/permissoes/perfis/${perfilId}/permissoes`);
    return response.data || [];
  },

  // Atualizar permissões de um perfil
  atualizarPermissoes: async (perfilId: number, permissaoIds: number[]): Promise<void> => {
    await apiRequest(`/api/permissoes/perfis/${perfilId}/permissoes`, {
      method: 'POST',
      body: JSON.stringify({ permissoes: permissaoIds }),
    });
  },

  // Verificar se perfil tem permissão específica
  temPermissao: async (perfilId: number, permissaoId: number): Promise<boolean> => {
    const permissoes = await apiPerfilPermissoes.obterPermissoes(perfilId);
    return permissoes.some(p => p.permissao_id === permissaoId && p.status === 'Ativa');
  }
};

// Usuário Perfis API
export interface UsuarioPerfil {
  id: number;
  usuario_id: number;
  perfil_id: number;
  data_atribuicao: string;
  atribuido_por?: number;
  status: 'Ativa' | 'Inativa';
  created_at: string;
  updated_at: string;
  perfis?: Perfil;
}

export const apiUsuarioPerfis = {
  // Obter perfil de um usuário
  obterPerfilUsuario: async (usuarioId: number): Promise<UsuarioPerfil | null> => {
    try {
      const response = await apiRequest(`/api/permissoes/usuarios/${usuarioId}/perfil`);
      return response.data || null;
    } catch (error) {
      console.warn(`Usuário ${usuarioId} não possui perfil atribuído`);
      return null;
    }
  },

  // Atribuir perfil a um usuário
  atribuirPerfil: async (usuarioId: number, perfilId: number): Promise<void> => {
    await apiRequest(`/api/permissoes/usuarios/${usuarioId}/perfil`, {
      method: 'POST',
      body: JSON.stringify({ perfil_id: perfilId }),
    });
  },

  // Remover perfil de um usuário
  removerPerfil: async (usuarioId: number, perfilId: number): Promise<void> => {
    await apiRequest(`/api/permissoes/usuarios/${usuarioId}/perfil/${perfilId}`, {
      method: 'DELETE',
    });
  }
};

// Utilitários
export const utilsPermissoes = {
  // Agrupar permissões por módulo
  agruparPorModulo: (permissoes: Permissao[]): Record<string, Permissao[]> => {
    return permissoes.reduce((acc, permissao) => {
      if (!acc[permissao.modulo]) {
        acc[permissao.modulo] = [];
      }
      acc[permissao.modulo].push(permissao);
      return acc;
    }, {} as Record<string, Permissao[]>);
  },

  // Obter módulos únicos
  obterModulos: (permissoes: Permissao[]): string[] => {
    return [...new Set(permissoes.map(p => p.modulo))].sort();
  },

  // Filtrar permissões ativas
  filtrarAtivas: (permissoes: Permissao[]): Permissao[] => {
    return permissoes.filter(p => p.status === 'Ativa');
  },

  // Mapear permissões para checkboxes
  mapearParaCheckboxes: (permissoes: Permissao[], perfilPermissoes: PerfilPermissao[]) => {
    const perfilPermissaoIds = perfilPermissoes
      .filter(pp => pp.status === 'Ativa')
      .map(pp => pp.permissao_id);

    return permissoes.map(permissao => ({
      ...permissao,
      checked: perfilPermissaoIds.includes(permissao.id)
    }));
  }
};

export default {
  apiPerfis,
  apiPermissoes,
  apiPerfilPermissoes,
  apiUsuarioPerfis,
  utilsPermissoes
};
