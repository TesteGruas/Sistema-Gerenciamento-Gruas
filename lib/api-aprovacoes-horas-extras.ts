import { api } from './api'

// ========================================
// TIPOS
// ========================================

export interface AprovacaoHorasExtras {
  id: string;
  registro_ponto_id: string;
  funcionario_id: number;
  supervisor_id: number;
  horas_extras: number;
  data_trabalho: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
  assinatura_supervisor?: string;
  observacoes?: string;
  data_submissao: string;
  data_aprovacao?: string;
  data_limite: string;
  created_at: string;
  updated_at: string;
  dias_restantes?: number;
  funcionario?: {
    id: number;
    nome: string;
    cargo?: string;
    cpf?: string;
  };
  supervisor?: {
    id: number;
    nome: string;
    email: string;
    role: string;
  };
  registros_ponto?: {
    entrada: string;
    saida: string;
    obra_id?: number;
  };
}

export interface AprovacaoPayload {
  assinatura: string;
  observacoes?: string;
}

export interface RejeicaoPayload {
  motivo: string;
}

export interface AprovacaoLotePayload {
  ids: string[];
  assinatura: string;
  observacoes?: string;
}

export interface RejeicaoLotePayload {
  ids: string[];
  motivo: string;
}

export interface Estatisticas {
  total: number;
  pendentes: number;
  aprovadas: number;
  rejeitadas: number;
  canceladas: number;
  total_horas_aprovadas: number;
}

// ========================================
// API DE APROVAÇÕES DE HORAS EXTRAS
// ========================================

export const apiAprovacoesHorasExtras = {
  /**
   * Cria uma nova aprovação de horas extras (geralmente não usado, pois é automático)
   */
  async criar(dados: {
    registro_ponto_id: string;
    funcionario_id: number;
    supervisor_id: number;
    horas_extras: number;
    data_trabalho: string;
    observacoes?: string;
  }): Promise<{ data: AprovacaoHorasExtras; message: string }> {
    const response = await api.post('aprovacoes-horas-extras', dados);
    return {
      data: response.data.data,
      message: response.data.message || 'Aprovação criada com sucesso'
    };
  },

  /**
   * Lista aprovações pendentes do supervisor logado
   */
  async listarPendentes(): Promise<{ data: AprovacaoHorasExtras[]; total: number }> {
    const response = await api.get('aprovacoes-horas-extras/pendentes');
    return {
      data: response.data.data || [],
      total: response.data.total || 0
    };
  },

  /**
   * Lista aprovações de um funcionário específico
   */
  async listarPorFuncionario(
    funcionario_id: number,
    status?: string
  ): Promise<{ data: AprovacaoHorasExtras[]; total: number }> {
    const response = await api.get(`aprovacoes-horas-extras/funcionario/${funcionario_id}`, {
      params: { status }
    });
    return {
      data: response.data.data || [],
      total: response.data.total || 0
    };
  },

  /**
   * Aprova horas extras com assinatura digital obrigatória
   */
  async aprovar(
    aprovacao_id: string,
    payload: AprovacaoPayload
  ): Promise<{ data: AprovacaoHorasExtras; message: string }> {
    const response = await api.put(
      `aprovacoes-horas-extras/${aprovacao_id}/aprovar`,
      payload
    );
    return {
      data: response.data.data,
      message: response.data.message || 'Horas extras aprovadas com sucesso'
    };
  },

  /**
   * Rejeita horas extras com motivo obrigatório
   */
  async rejeitar(
    aprovacao_id: string,
    payload: RejeicaoPayload
  ): Promise<{ data: AprovacaoHorasExtras; message: string }> {
    const response = await api.put(
      `aprovacoes-horas-extras/${aprovacao_id}/rejeitar`,
      payload
    );
    return {
      data: response.data.data,
      message: response.data.message || 'Horas extras rejeitadas'
    };
  },

  /**
   * Aprova múltiplas aprovações em lote (máx 50)
   */
  async aprovarLote(
    payload: AprovacaoLotePayload
  ): Promise<{ aprovadas: number; total_solicitado: number; ids_aprovados: string[]; message: string }> {
    const response = await api.post(
      'aprovacoes-horas-extras/aprovar-lote',
      payload
    );
    return {
      aprovadas: response.data.data.aprovadas,
      total_solicitado: response.data.data.total_solicitado,
      ids_aprovados: response.data.data.ids_aprovados,
      message: response.data.message || 'Aprovações processadas com sucesso'
    };
  },

  /**
   * Rejeita múltiplas aprovações em lote (máx 50)
   */
  async rejeitarLote(
    payload: RejeicaoLotePayload
  ): Promise<{ rejeitadas: number; total_solicitado: number; ids_rejeitados: string[]; message: string }> {
    const response = await api.post(
      'aprovacoes-horas-extras/rejeitar-lote',
      payload
    );
    return {
      rejeitadas: response.data.data.rejeitadas,
      total_solicitado: response.data.data.total_solicitado,
      ids_rejeitados: response.data.data.ids_rejeitados,
      message: response.data.message || 'Rejeições processadas com sucesso'
    };
  },

  /**
   * Busca estatísticas de aprovações
   */
  async estatisticas(periodo: number = 30): Promise<{ data: Estatisticas; periodo: string }> {
    const response = await api.get('aprovacoes-horas-extras/estatisticas', {
      params: { periodo }
    });
    return {
      data: response.data.data,
      periodo: response.data.periodo
    };
  }
};
