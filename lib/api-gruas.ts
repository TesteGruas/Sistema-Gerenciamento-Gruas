import { api } from './api'

// ============================================
// INTERFACES E TIPOS
// ============================================

export interface Grua {
  id: string | number;
  name: string;
  modelo: string;
  fabricante?: string;
  tipo?: string;
  capacidade: string;
  status: 'disponivel' | 'em_obra' | 'manutencao' | 'inativa';
  localizacao?: string;
  current_obra_name?: string;
  horas_operacao?: number;
  ultima_manutencao?: string;
  proxima_manutencao?: string;
  obra_id?: number;
  observacoes?: string;
}

export interface GruaBackend {
  id: string | number;
  name: string;
  modelo: string;
  model?: string;
  fabricante?: string;
  tipo?: string;
  capacidade: string;
  capacity?: string;
  status: 'disponivel' | 'em_obra' | 'manutencao' | 'inativa' | 'Disponível' | 'Operacional' | 'Manutenção' | 'Vendida';
  localizacao?: string;
  obra_atual_id?: number;
  obra_atual_nome?: string;
  currentObraId?: string | number;
  currentObraName?: string;
  horas_operacao?: number;
  horasOperacao?: number;
  ultima_manutencao?: string;
  ultimaManutencao?: string;
  proxima_manutencao?: string;
  proximaManutencao?: string;
  created_at?: string;
  updated_at?: string;
  ano?: number;
  altura_trabalho?: string;
  alturaTrabalho?: string;
  capacidade_ponta?: string;
  capacidadePonta?: string;
  lanca?: string;
  observacoes?: string;
  valor_locacao?: number;
  valorLocacao?: number;
  valor_operacao?: number;
  valorOperacao?: number;
  valor_sinaleiro?: number;
  valorSinaleiro?: number;
  valor_manutencao?: number;
  valorManutencao?: number;
}

export interface GruaFiltros {
  status?: string;
  obra_id?: number;
  funcionario_id?: number;
  page?: number;
  limit?: number;
  search?: string;
  tipo?: string;
  grua_id?: string;
}

// ============================================
// FUNÇÕES DE CONVERSÃO
// ============================================

/**
 * Converter grua do formato backend para frontend
 * Lida com ambos os formatos: camelCase e snake_case
 */
export function converterGruaBackendParaFrontend(grua: GruaBackend): Grua {
  // Normalizar status
  let statusNormalizado: Grua['status'] = 'disponivel';
  if (grua.status) {
    const statusMap: Record<string, Grua['status']> = {
      'disponivel': 'disponivel',
      'Disponível': 'disponivel',
      'em_obra': 'em_obra',
      'Operacional': 'em_obra',
      'manutencao': 'manutencao',
      'Manutenção': 'manutencao',
      'inativa': 'inativa',
      'Vendida': 'inativa',
    };
    statusNormalizado = statusMap[grua.status] || 'disponivel';
  }

  return {
    id: grua.id,
    name: grua.name,
    modelo: grua.model || grua.modelo,
    fabricante: grua.fabricante,
    tipo: grua.tipo,
    capacidade: grua.capacity || grua.capacidade,
    status: statusNormalizado,
    localizacao: grua.localizacao,
    current_obra_name: grua.currentObraName || grua.obra_atual_nome,
    horas_operacao: grua.horasOperacao || grua.horas_operacao,
    ultima_manutencao: grua.ultimaManutencao || grua.ultima_manutencao,
    proxima_manutencao: grua.proximaManutencao || grua.proxima_manutencao,
    obra_id: grua.currentObraId ? Number(grua.currentObraId) : grua.obra_atual_id,
    observacoes: grua.observacoes,
  };
}

/**
 * Converter grua do formato frontend para backend
 */
export function converterGruaFrontendParaBackend(grua: Grua): GruaBackend {
  return {
    id: grua.id,
    name: grua.name,
    modelo: grua.modelo,
    fabricante: grua.fabricante,
    tipo: grua.tipo,
    capacidade: grua.capacidade,
    status: grua.status,
    localizacao: grua.localizacao,
    obra_atual_id: grua.obra_id,
    obra_atual_nome: grua.current_obra_name,
    horas_operacao: grua.horas_operacao,
    ultima_manutencao: grua.ultima_manutencao,
    proxima_manutencao: grua.proxima_manutencao,
  };
}

// ============================================
// API OBJECT (Padrão do projeto)
// ============================================

export const gruasApi = {
  /**
   * Listar gruas com filtros opcionais
   */
  listarGruas: async (filtros?: GruaFiltros): Promise<{ success: boolean; data: Grua[]; pagination?: any }> => {
    const response = await api.get('/gruas', { params: filtros });
    const gruasBackend = response.data.data || response.data;
    const gruasFrontend = Array.isArray(gruasBackend)
      ? gruasBackend.map(converterGruaBackendParaFrontend)
      : [];
    return {
      success: true,
      data: gruasFrontend,
      pagination: response.data.pagination,
    };
  },

  /**
   * Buscar gruas de um funcionário específico
   */
  listarGruasFuncionario: async (funcionarioId: number): Promise<{ success: boolean; data: Grua[] }> => {
    const response = await api.get(`/gruas/funcionario/${funcionarioId}`);
    const gruasBackend = response.data.data || response.data;
    const gruasFrontend = Array.isArray(gruasBackend)
      ? gruasBackend.map(converterGruaBackendParaFrontend)
      : [];
    return {
      success: true,
      data: gruasFrontend,
    };
  },

  /**
   * Buscar uma grua específica por ID
   */
  obterGrua: async (gruaId: string | number): Promise<{ success: boolean; data: Grua }> => {
    const response = await api.get(`/gruas/${gruaId}`);
    const gruaBackend = response.data.data || response.data;
    return {
      success: true,
      data: converterGruaBackendParaFrontend(gruaBackend),
    };
  },

  /**
   * Buscar gruas de uma obra específica
   */
  listarGruasObra: async (obraId: number): Promise<{ success: boolean; data: Grua[] }> => {
    const response = await api.get(`/gruas/obra/${obraId}`);
    const gruasBackend = response.data.data || response.data;
    const gruasFrontend = Array.isArray(gruasBackend)
      ? gruasBackend.map(converterGruaBackendParaFrontend)
      : [];
    return {
      success: true,
      data: gruasFrontend,
    };
  },

  /**
   * Criar uma nova grua
   */
  criarGrua: async (dados: Partial<GruaBackend>): Promise<{ success: boolean; data: Grua; message: string }> => {
    const response = await api.post('/gruas', dados);
    const gruaBackend = response.data.data || response.data;
    return {
      success: true,
      data: converterGruaBackendParaFrontend(gruaBackend),
      message: 'Grua criada com sucesso',
    };
  },

  /**
   * Atualizar uma grua existente
   */
  atualizarGrua: async (
    gruaId: string | number,
    dados: Partial<GruaBackend>
  ): Promise<{ success: boolean; data: Grua; message: string }> => {
    const response = await api.put(`/gruas/${gruaId}`, dados);
    const gruaBackend = response.data.data || response.data;
    return {
      success: true,
      data: converterGruaBackendParaFrontend(gruaBackend),
      message: 'Grua atualizada com sucesso',
    };
  },

  /**
   * Atualizar status de uma grua
   */
  atualizarStatusGrua: async (
    gruaId: string | number,
    status: Grua['status']
  ): Promise<{ success: boolean; data: Grua; message: string }> => {
    const response = await api.patch(`/gruas/${gruaId}/status`, { status });
    const gruaBackend = response.data.data || response.data;
    return {
      success: true,
      data: converterGruaBackendParaFrontend(gruaBackend),
      message: 'Status atualizado com sucesso',
    };
  },

  /**
   * Deletar uma grua
   */
  deletarGrua: async (gruaId: string | number): Promise<{ success: boolean; message: string }> => {
    await api.delete(`/gruas/${gruaId}`);
    return {
      success: true,
      message: 'Grua deletada com sucesso',
    };
  },

  /**
   * Registrar manutenção de uma grua
   */
  registrarManutencao: async (
    gruaId: string | number,
    dados: {
      tipo: string;
      descricao: string;
      data_manutencao: string;
      proxima_manutencao?: string;
    }
  ): Promise<{ success: boolean; data: any; message: string }> => {
    const response = await api.post(`/gruas/${gruaId}/manutencao`, dados);
    return {
      success: true,
      data: response.data.data || response.data,
      message: 'Manutenção registrada com sucesso',
    };
  },

  /**
   * Buscar histórico de manutenções de uma grua
   */
  listarHistoricoManutencao: async (gruaId: string | number): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(`/gruas/${gruaId}/manutencao/historico`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  },
};

// ============================================
// EXPORTS DE COMPATIBILIDADE (para código antigo)
// ============================================

/**
 * @deprecated Use gruasApi.listarGruas() instead
 */
export const getGruas = gruasApi.listarGruas;

/**
 * @deprecated Use gruasApi.listarGruasFuncionario() instead
 */
export const getGruasFuncionario = gruasApi.listarGruasFuncionario;

/**
 * @deprecated Use gruasApi.obterGrua() instead
 */
export const getGruaById = gruasApi.obterGrua;

/**
 * @deprecated Use gruasApi.listarGruasObra() instead
 */
export const getGruasObra = gruasApi.listarGruasObra;

/**
 * @deprecated Use gruasApi.atualizarStatusGrua() instead
 */
export const atualizarStatusGrua = gruasApi.atualizarStatusGrua;

/**
 * @deprecated Use gruasApi.registrarManutencao() instead
 */
export const registrarManutencao = gruasApi.registrarManutencao;

/**
 * @deprecated Use gruasApi.listarHistoricoManutencao() instead
 */
export const getHistoricoManutencao = gruasApi.listarHistoricoManutencao;
