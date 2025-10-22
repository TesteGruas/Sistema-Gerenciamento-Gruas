// API de Notificações integrada com backend real

import api, { apiWithRetry } from './api'

// Dados mockados para desenvolvimento
const mockNotificacoes: Notificacao[] = [
  {
    id: '1',
    titulo: 'Nova Grua Disponível',
    mensagem: 'A grua Liebherr 1000 está disponível para alocação em nova obra.',
    tipo: 'grua',
    lida: false,
    data: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min atrás
    link: '/dashboard/gruas',
    icone: '🏗️',
    destinatario: { tipo: 'geral' },
    remetente: 'Sistema',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: '2',
    titulo: 'Pagamento Recebido',
    mensagem: 'Pagamento de R$ 15.000,00 recebido da Construtora ABC Ltda.',
    tipo: 'financeiro',
    lida: false,
    data: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h atrás
    link: '/dashboard/financeiro',
    icone: '💰',
    destinatario: { tipo: 'geral' },
    remetente: 'Sistema Financeiro',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: '3',
    titulo: 'Justificativa Pendente',
    mensagem: 'João Silva enviou uma justificativa de atraso que precisa ser aprovada.',
    tipo: 'rh',
    lida: true,
    data: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h atrás
    link: '/dashboard/ponto',
    icone: '👥',
    destinatario: { tipo: 'geral' },
    remetente: 'Sistema RH',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
  },
  {
    id: '4',
    titulo: 'Estoque Baixo',
    mensagem: 'Cabo de aço 12mm está com estoque baixo (5 unidades restantes).',
    tipo: 'estoque',
    lida: false,
    data: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6h atrás
    link: '/dashboard/estoque',
    icone: '📦',
    destinatario: { tipo: 'geral' },
    remetente: 'Sistema de Estoque',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
  },
  {
    id: '5',
    titulo: 'Obra Concluída',
    mensagem: 'A obra "Edifício Residencial Horizonte" foi marcada como concluída.',
    tipo: 'obra',
    lida: true,
    data: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8h atrás
    link: '/dashboard/obras',
    icone: '🏢',
    destinatario: { tipo: 'geral' },
    remetente: 'Sistema de Obras',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
  }
]

// Função para simular delay de API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
  search?: string;
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
  listar: async (params?: ListarNotificacoesParams): Promise<ListarNotificacoesResponse> => {
    try {
      const response = await apiWithRetry(
        () => api.get<ListarNotificacoesResponse>('/api/notificacoes', { params }),
        { maxRetries: 2 }
      )
      return response.data
    } catch (error: any) {
      console.warn('API indisponível, usando dados mockados:', error.message)
      
      // Simular delay de API
      await delay(500)
      
      // Aplicar filtros nos dados mockados
      let filteredData = [...mockNotificacoes]
      
      if (params?.tipo) {
        filteredData = filteredData.filter(n => n.tipo === params.tipo)
      }
      
      if (params?.lida !== undefined) {
        filteredData = filteredData.filter(n => n.lida === params.lida)
      }
      
      if (params?.search) {
        const search = params.search.toLowerCase()
        filteredData = filteredData.filter(n => 
          n.titulo.toLowerCase().includes(search) || 
          n.mensagem.toLowerCase().includes(search)
        )
      }
      
      // Aplicar paginação
      const page = params?.page || 1
      const limit = params?.limit || 10
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedData = filteredData.slice(startIndex, endIndex)
      
      return {
        success: true,
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: filteredData.length,
          pages: Math.ceil(filteredData.length / limit)
        }
      }
    }
  },

  /**
   * Listar apenas notificações não lidas
   */
  listarNaoLidas: async (): Promise<Notificacao[]> => {
    try {
      const response = await apiWithRetry(
        () => api.get<{ success: boolean; data: Notificacao[] }>('/api/notificacoes/nao-lidas'),
        { maxRetries: 2 }
      )
      return response.data.data || []
    } catch (error: any) {
      console.warn('API indisponível, usando dados mockados:', error.message)
      
      // Simular delay de API
      await delay(300)
      
      // Retornar notificações não lidas dos dados mockados
      return mockNotificacoes.filter(n => !n.lida)
    }
  },

  /**
   * Contar notificações não lidas
   */
  contarNaoLidas: async (): Promise<number> => {
    try {
      const response = await apiWithRetry(
        () => api.get<{ success: boolean; count: number }>('/api/notificacoes/count/nao-lidas'),
        { maxRetries: 2 }
      )
      return response.data.count || 0
    } catch (error: any) {
      console.warn('API indisponível, usando dados mockados:', error.message)
      
      // Simular delay de API
      await delay(200)
      
      // Retornar contagem de notificações não lidas dos dados mockados
      return mockNotificacoes.filter(n => !n.lida).length
    }
  },

  /**
   * Marcar notificação específica como lida
   */
  marcarComoLida: async (id: string): Promise<void> => {
    try {
      await api.patch(`/api/notificacoes/${id}/marcar-lida`)
    } catch (error: any) {
      console.warn('API indisponível, simulando marcação como lida:', error.message)
      
      // Simular delay de API
      await delay(200)
      
      // Simular marcação como lida nos dados mockados
      const notificacao = mockNotificacoes.find(n => n.id === id)
      if (notificacao) {
        notificacao.lida = true
      }
    }
  },

  /**
   * Marcar todas as notificações como lidas
   */
  marcarTodasComoLidas: async (): Promise<void> => {
    try {
      await api.patch('/api/notificacoes/marcar-todas-lidas')
    } catch (error: any) {
      console.warn('API indisponível, simulando marcação de todas como lidas:', error.message)
      
      // Simular delay de API
      await delay(300)
      
      // Simular marcação de todas como lidas nos dados mockados
      mockNotificacoes.forEach(n => n.lida = true)
    }
  },

  /**
   * Deletar notificação específica
   */
  deletar: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/notificacoes/${id}`)
    } catch (error: any) {
      console.warn('API indisponível, simulando deleção:', error.message)
      
      // Simular delay de API
      await delay(200)
      
      // Simular deleção nos dados mockados
      const index = mockNotificacoes.findIndex(n => n.id === id)
      if (index > -1) {
        mockNotificacoes.splice(index, 1)
      }
    }
  },

  /**
   * Deletar todas as notificações do usuário
   */
  deletarTodas: async (): Promise<void> => {
    try {
      await api.delete('/api/notificacoes/todas')
    } catch (error: any) {
      console.warn('API indisponível, simulando deleção de todas:', error.message)
      
      // Simular delay de API
      await delay(300)
      
      // Simular deleção de todas nos dados mockados
      mockNotificacoes.length = 0
    }
  },

  /**
   * Criar nova notificação
   */
  criar: async (notificacao: CriarNotificacaoInput): Promise<Notificacao> => {
    try {
      const response = await api.post<{ success: boolean; data: Notificacao | Notificacao[] }>(
        '/api/notificacoes',
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
      console.warn('API indisponível, simulando criação:', error.message)
      
      // Simular delay de API
      await delay(400)
      
      // Simular criação de notificação nos dados mockados
      const novaNotificacao: Notificacao = {
        id: Date.now().toString(),
        titulo: notificacao.titulo,
        mensagem: notificacao.mensagem,
        tipo: notificacao.tipo,
        lida: false,
        data: new Date().toISOString(),
        link: notificacao.link,
        icone: notificacao.icone,
        destinatario: notificacao.destinatarios?.[0] || { tipo: 'geral' },
        remetente: notificacao.remetente || 'Sistema',
        created_at: new Date().toISOString()
      }
      
      mockNotificacoes.unshift(novaNotificacao)
      return novaNotificacao
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
