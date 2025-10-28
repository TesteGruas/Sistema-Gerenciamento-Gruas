import { api } from './api'

// ========================================
// TIPOS
// ========================================

export interface RegistroPontoAprovacao {
  id: string;
  funcionario_id: number;
  data: string;
  entrada: string;
  saida_almoco?: string;
  volta_almoco?: string;
  saida: string;
  horas_trabalhadas: number;
  horas_extras: number;
  status: 'Pendente Aprovação' | 'Aprovado' | 'Rejeitado';
  aprovado_por?: number;
  data_aprovacao?: string;
  observacoes?: string;
  assinatura_digital_path?: string;
  created_at: string;
  updated_at: string;
  funcionario?: {
    id: number;
    nome: string;
    cargo: string;
    turno?: string;
    obra_atual_id?: number;
  };
  aprovador?: {
    id: number;
    nome: string;
  };
}

export interface AprovacaoComAssinaturaPayload {
  gestor_id: number;
  assinatura_digital: string;
  observacoes_aprovacao?: string;
}

export interface RejeicaoPayload {
  motivo_rejeicao: string;
}

export interface AprovacaoLotePayload {
  registro_ids: (string | number)[];
  observacoes?: string;
}

export interface RejeicaoLotePayload {
  registro_ids: (string | number)[];
  motivo: string;
}

// ========================================
// API DE APROVAÇÕES DE HORAS EXTRAS
// ========================================

export const apiAprovacoesHorasExtras = {
  /**
   * Lista todos os registros com horas extras (permite filtrar por status)
   * Mantém compatibilidade com o padrão existente da aplicação
   */
  async listarPendentes(params?: {
    gestor_id?: number;
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ data: RegistroPontoAprovacao[]; pagination?: any }> {
    // Usar a mesma rota /horas-extras (sem filtro fixo de status)
    const response = await api.get('ponto-eletronico/horas-extras', { 
      params: {
        ...params,
        limit: params?.limit || 100 // Aumentar limite para buscar todos
      }
    });
    return {
      data: response.data.data || response.data || [],
      pagination: response.data.pagination
    };
  },

  /**
   * Aprova horas extras com assinatura digital obrigatória
   */
  async aprovarComAssinatura(
    registro_id: string | number,
    payload: AprovacaoComAssinaturaPayload
  ): Promise<{ data: RegistroPontoAprovacao; message: string }> {
    const response = await api.post(
      `ponto-eletronico/registros/${registro_id}/aprovar-assinatura`,
      payload
    );
    return {
      data: response.data.data || response.data,
      message: response.data.message || 'Horas extras aprovadas com sucesso'
    };
  },

  /**
   * Rejeita horas extras com motivo obrigatório
   */
  async rejeitar(
    registro_id: string | number,
    payload: RejeicaoPayload
  ): Promise<{ data: RegistroPontoAprovacao; message: string }> {
    const response = await api.post(
      `ponto-eletronico/registros/${registro_id}/rejeitar`,
      payload
    );
    return {
      data: response.data.data || response.data,
      message: response.data.message || 'Horas extras rejeitadas'
    };
  },

  /**
   * Aprova múltiplos registros de horas extras em lote
   */
  async aprovarLote(
    payload: AprovacaoLotePayload
  ): Promise<{ data: RegistroPontoAprovacao[]; message: string }> {
    const response = await api.post(
      'ponto-eletronico/horas-extras/aprovar-lote',
      payload
    );
    return {
      data: response.data.data || [],
      message: response.data.message || 'Registros aprovados com sucesso'
    };
  },

  /**
   * Rejeita múltiplos registros de horas extras em lote
   */
  async rejeitarLote(
    payload: RejeicaoLotePayload
  ): Promise<{ data: RegistroPontoAprovacao[]; message: string }> {
    const response = await api.post(
      'ponto-eletronico/horas-extras/rejeitar-lote',
      payload
    );
    return {
      data: response.data.data || [],
      message: response.data.message || 'Registros rejeitados com sucesso'
    };
  }
};

