// API de Notificações com dados mockados

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
}

// Dados mockados
const notificacoesMock: Notificacao[] = [
  {
    id: '1',
    titulo: 'Grua #452 - Manutenção Agendada',
    mensagem: 'A grua #452 está programada para manutenção preventiva amanhã às 08:00',
    tipo: 'grua',
    lida: false,
    data: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min atrás
    link: '/dashboard/gruas/452',
    destinatario: {
      tipo: 'funcionario',
      id: '1',
      nome: 'João Silva - Operador de Grua',
    },
    remetente: 'Sistema de Manutenção',
  },
  {
    id: '2',
    titulo: 'Nova Obra Cadastrada',
    mensagem: 'A obra "Edifício Residencial Solar" foi cadastrada com sucesso',
    tipo: 'obra',
    lida: false,
    data: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min atrás
    link: '/dashboard/obras',
    destinatario: {
      tipo: 'geral',
    },
    remetente: 'Admin - Maria Costa',
  },
  {
    id: '3',
    titulo: 'Pagamento Aprovado',
    mensagem: 'O pagamento da NF #12345 no valor de R$ 15.000,00 foi aprovado',
    tipo: 'financeiro',
    lida: false,
    data: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 horas atrás
    link: '/dashboard/financeiro',
    destinatario: {
      tipo: 'cliente',
      id: '5',
      nome: 'ABC Construtora',
    },
    remetente: 'Financeiro - Carlos Santos',
  },
  {
    id: '4',
    titulo: 'Estoque Baixo - Cabos de Aço',
    mensagem: 'O estoque de cabos de aço está abaixo do nível mínimo (5 unidades restantes)',
    tipo: 'estoque',
    lida: true,
    data: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 horas atrás
    link: '/dashboard/estoque',
    destinatario: {
      tipo: 'obra',
      id: '10',
      nome: 'Obra Centro Empresarial',
    },
    remetente: 'Sistema de Estoque',
  },
  {
    id: '5',
    titulo: 'Férias Aprovadas',
    mensagem: 'As férias de João Silva foram aprovadas para o período de 15/11 a 30/11',
    tipo: 'rh',
    lida: true,
    data: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 horas atrás
    link: '/dashboard/rh-completo/ferias',
    destinatario: {
      tipo: 'funcionario',
      id: '1',
      nome: 'João Silva',
    },
    remetente: 'RH - Ana Paula',
  },
  {
    id: '6',
    titulo: 'Alerta de Segurança',
    mensagem: 'Grua #301 detectou sobrecarga. Operação interrompida automaticamente',
    tipo: 'error',
    lida: true,
    data: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 dia atrás
    link: '/dashboard/gruas/301',
    destinatario: {
      tipo: 'geral',
    },
    remetente: 'Sistema de Segurança',
  },
  {
    id: '7',
    titulo: 'Certificação Atualizada',
    mensagem: 'A certificação NR-12 da Grua #105 foi renovada com sucesso',
    tipo: 'success',
    lida: true,
    data: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 dias atrás
    link: '/dashboard/gruas/105',
    destinatario: {
      tipo: 'geral',
    },
    remetente: 'Sistema de Certificações',
  },
  {
    id: '8',
    titulo: 'Reunião Agendada',
    mensagem: 'Reunião de planejamento agendada para segunda-feira às 10:00',
    tipo: 'info',
    lida: true,
    data: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 dias atrás
    destinatario: {
      tipo: 'geral',
    },
    remetente: 'Admin - Maria Costa',
  },
  {
    id: '9',
    titulo: 'Ponto Eletrônico - Pendência',
    mensagem: 'Colaborador Maria Santos possui 2 registros de ponto pendentes de aprovação',
    tipo: 'warning',
    lida: true,
    data: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 dias atrás
    link: '/dashboard/ponto',
    destinatario: {
      tipo: 'funcionario',
      id: '2',
      nome: 'Maria Santos',
    },
    remetente: 'RH - Ana Paula',
  },
  {
    id: '10',
    titulo: 'Novo Orçamento Solicitado',
    mensagem: 'Cliente ABC Construtora solicitou orçamento para locação de 3 gruas',
    tipo: 'financeiro',
    lida: true,
    data: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 dias atrás
    link: '/dashboard/financeiro/orcamentos',
    destinatario: {
      tipo: 'cliente',
      id: '1',
      nome: 'ABC Construtora',
    },
    remetente: 'Comercial - Pedro Oliveira',
  },
];

// Simula chamadas de API
let notificacoes = [...notificacoesMock];

export const NotificacoesAPI = {
  // Listar todas as notificações
  listar: async (): Promise<Notificacao[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...notificacoes].sort((a, b) => 
          new Date(b.data).getTime() - new Date(a.data).getTime()
        ));
      }, 300);
    });
  },

  // Listar apenas não lidas
  listarNaoLidas: async (): Promise<Notificacao[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(notificacoes.filter(n => !n.lida).sort((a, b) => 
          new Date(b.data).getTime() - new Date(a.data).getTime()
        ));
      }, 300);
    });
  },

  // Contar não lidas
  contarNaoLidas: async (): Promise<number> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(notificacoes.filter(n => !n.lida).length);
      }, 100);
    });
  },

  // Marcar como lida
  marcarComoLida: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const notificacao = notificacoes.find(n => n.id === id);
        if (notificacao) {
          notificacao.lida = true;
        }
        resolve();
      }, 200);
    });
  },

  // Marcar todas como lidas
  marcarTodasComoLidas: async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        notificacoes.forEach(n => n.lida = true);
        resolve();
      }, 300);
    });
  },

  // Deletar notificação
  deletar: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        notificacoes = notificacoes.filter(n => n.id !== id);
        resolve();
      }, 200);
    });
  },

  // Deletar todas
  deletarTodas: async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        notificacoes = [];
        resolve();
      }, 300);
    });
  },

  // Criar nova notificação
  criar: async (notificacao: Omit<Notificacao, 'id' | 'data' | 'lida'>): Promise<Notificacao> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const nova: Notificacao = {
          ...notificacao,
          id: String(Date.now()),
          data: new Date().toISOString(),
          lida: false,
        };
        notificacoes.unshift(nova);
        resolve(nova);
      }, 300);
    });
  },
};

// Função auxiliar para formatar tempo relativo
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

