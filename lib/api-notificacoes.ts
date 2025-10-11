// API de Notificações integrada com backend real

import api, { apiWithRetry } from './api'

export type NotificationType = 
  | 'info' 
  | 'warning' 
  | 'error' 
  | 'success'
  | 'grua'
  | 'obra'
  | 'financeiro'
  | 'rh'
  | 'estoque';

export type DestinatarioTipo = 'geral' | 'cliente' | 'funcionario' | 'obra';

export interface Destinatario {
  tipo: DestinatarioTipo;
  id?: string; // ID do cliente, funcionário ou obra (undefined para 'geral')
  nome?: string; // Nome do destinatário (para exibição)
  info?: string; // Informação adicional (CNPJ, cargo, endereço, etc)
}

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: NotificationType;
  lida: boolean;
  data: string;
  link?: string;
  icone?: string;
  destinatario?: Destinatario; // Destinatário único (retrocompatibilidade)
  destinatarios?: Destinatario[]; // Array de destinatários (novo)
  remetente?: string; // Nome de quem criou a notificação
  usuario_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ListarNotificacoesParams {
  page?: number;
  limit?: number;
  tipo?: NotificationType;
  lida?: boolean;
}

export interface ListarNotificacoesResponse {
  success: boolean;
  data: Notificacao[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CriarNotificacaoInput {
  titulo: string;
  mensagem: string;
  tipo: NotificationType;
  link?: string;
  icone?: string;
  destinatarios?: Destinatario[];
  remetente?: string;
}

// ============================================
// FUNÇÕES DA API REAL
// ============================================

export const NotificacoesAPI = {
  /**
   * Listar todas as notificações com paginação e filtros
   */
  listar: async (params?: ListarNotificacoesParams): Promise<Notificacao[]> => {
    try {
      const response = await apiWithRetry(
        () => api.get<ListarNotificacoesResponse>('/notificacoes', { params }),
        { maxRetries: 2 }
      )
      return response.data.data || []
    } catch (error: any) {
      console.error('Erro ao listar notificações:', error)
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Erro ao carregar notificações'
      )
    }
  },

  /**
   * Listar apenas notificações não lidas
   */
  listarNaoLidas: async (): Promise<Notificacao[]> => {
    try {
      const response = await apiWithRetry(
        () => api.get<{ success: boolean; data: Notificacao[] }>('/notificacoes/nao-lidas'),
        { maxRetries: 2 }
      )
      return response.data.data || []
    } catch (error: any) {
      console.error('Erro ao listar notificações não lidas:', error)
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Erro ao carregar notificações não lidas'
      )
    }
  },

  /**
   * Contar notificações não lidas
   */
  contarNaoLidas: async (): Promise<number> => {
    try {
      const response = await apiWithRetry(
        () => api.get<{ success: boolean; count: number }>('/notificacoes/count/nao-lidas'),
        { maxRetries: 2 }
      )
      return response.data.count || 0
    } catch (error: any) {
      console.error('Erro ao contar notificações não lidas:', error)
      // Retornar 0 em caso de erro para não quebrar a UI
      return 0
    }
  },

  /**
   * Marcar notificação específica como lida
   */
  marcarComoLida: async (id: string): Promise<void> => {
    try {
      await api.patch(`/notificacoes/${id}/marcar-lida`)
    } catch (error: any) {
      console.error('Erro ao marcar notificação como lida:', error)
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Erro ao marcar notificação como lida'
      )
    }
  },

  /**
   * Marcar todas as notificações como lidas
   */
  marcarTodasComoLidas: async (): Promise<void> => {
    try {
      await api.patch('/notificacoes/marcar-todas-lidas')
    } catch (error: any) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Erro ao marcar todas as notificações como lidas'
      )
    }
  },

  /**
   * Deletar notificação específica
   */
  deletar: async (id: string): Promise<void> => {
    try {
      await api.delete(`/notificacoes/${id}`)
    } catch (error: any) {
      console.error('Erro ao deletar notificação:', error)
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Erro ao deletar notificação'
      )
    }
  },

  /**
   * Deletar todas as notificações do usuário
   */
  deletarTodas: async (): Promise<void> => {
    try {
      await api.delete('/notificacoes/todas')
    } catch (error: any) {
      console.error('Erro ao deletar todas as notificações:', error)
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Erro ao deletar todas as notificações'
      )
    }
  },

  /**
   * Criar nova notificação
   */
  criar: async (notificacao: CriarNotificacaoInput): Promise<Notificacao> => {
    try {
      const response = await api.post<{ success: boolean; data: Notificacao | Notificacao[] }>(
        '/notificacoes',
        notificacao
      )
      
      // Se o backend retornar um array (notificações para múltiplos usuários),
      // retornar o primeiro item
      const data = response.data.data
      if (Array.isArray(data)) {
        return data[0]
      }
      
      return data
    } catch (error: any) {
      console.error('Erro ao criar notificação:', error)
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.response?.data?.details ||
        'Erro ao criar notificação'
      )
    }
  },
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Função auxiliar para formatar tempo relativo
 */
export function formatarTempoRelativo(data: string): string {
  const agora = new Date();
  const dataNotificacao = new Date(data);
  const diferencaMs = agora.getTime() - dataNotificacao.getTime();
  
  const segundos = Math.floor(diferencaMs / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  
  if (dias > 0) {
    return `há ${dias} dia${dias > 1 ? 's' : ''}`;
  }
  if (horas > 0) {
    return `há ${horas} hora${horas > 1 ? 's' : ''}`;
  }
  if (minutos > 0) {
    return `há ${minutos} minuto${minutos > 1 ? 's' : ''}`;
  }
  return 'agora mesmo';
}

/**
 * Função auxiliar para obter ícone baseado no tipo de notificação
 */
export function obterIconePorTipo(tipo: NotificationType): string {
  const icones: Record<NotificationType, string> = {
    info: '🔔',
    warning: '⚠️',
    error: '❌',
    success: '✅',
    grua: '🏗️',
    obra: '🏢',
    financeiro: '💰',
    rh: '👥',
    estoque: '📦'
  }
  
  return icones[tipo] || '🔔'
}

/**
 * Função auxiliar para obter cor baseado no tipo de notificação
 */
export function obterCorPorTipo(tipo: NotificationType): string {
  const cores: Record<NotificationType, string> = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    success: 'bg-green-100 text-green-800',
    grua: 'bg-purple-100 text-purple-800',
    obra: 'bg-indigo-100 text-indigo-800',
    financeiro: 'bg-emerald-100 text-emerald-800',
    rh: 'bg-pink-100 text-pink-800',
    estoque: 'bg-orange-100 text-orange-800'
  }
  
  return cores[tipo] || 'bg-gray-100 text-gray-800'
}

/**
 * Validar dados de notificação antes de enviar
 */
export function validarNotificacao(notificacao: CriarNotificacaoInput): string[] {
  const erros: string[] = []
  
  if (!notificacao.titulo || notificacao.titulo.trim() === '') {
    erros.push('Título é obrigatório')
  } else if (notificacao.titulo.length > 255) {
    erros.push('Título deve ter no máximo 255 caracteres')
  }
  
  if (!notificacao.mensagem || notificacao.mensagem.trim() === '') {
    erros.push('Mensagem é obrigatória')
  }
  
  if (!notificacao.tipo) {
    erros.push('Tipo é obrigatório')
  }
  
  const tiposValidos: NotificationType[] = [
    'info', 'warning', 'error', 'success', 
    'grua', 'obra', 'financeiro', 'rh', 'estoque'
  ]
  
  if (notificacao.tipo && !tiposValidos.includes(notificacao.tipo)) {
    erros.push('Tipo de notificação inválido')
  }
  
  if (notificacao.destinatarios && notificacao.destinatarios.length > 0) {
    notificacao.destinatarios.forEach((dest, index) => {
      if (!dest.tipo) {
        erros.push(`Destinatário ${index + 1}: tipo é obrigatório`)
      }
      
      const tiposDestValidos: DestinatarioTipo[] = ['geral', 'cliente', 'funcionario', 'obra']
      if (dest.tipo && !tiposDestValidos.includes(dest.tipo)) {
        erros.push(`Destinatário ${index + 1}: tipo inválido`)
      }
    })
  }
  
  return erros
}
