// Tipos para o sistema de aprovação de horas extras
export interface AprovacaoHorasExtras {
  id: string;
  registro_ponto_id: string;
  funcionario_id: string;
  supervisor_id: string;
  horas_extras: number;
  data_trabalho: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
  assinatura_supervisor?: string;
  observacoes?: string;
  data_submissao: string;
  data_aprovacao?: string;
  data_limite: string;
  funcionario: {
    nome: string;
    cargo: string;
    obra: string;
  };
  registro: {
    entrada: string;
    saida: string;
    horas_trabalhadas: number;
  };
  supervisor: {
    nome: string;
    cargo: string;
  };
}

export interface NotificacaoAprovacao {
  id: string;
  aprovacao_id: string;
  usuario_id: string;
  tipo: 'nova_aprovacao' | 'lembrete' | 'aprovado' | 'rejeitado' | 'cancelado';
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

// Dados mockados para desenvolvimento
export const mockAprovacoes: AprovacaoHorasExtras[] = [
  {
    id: '1',
    registro_ponto_id: 'reg-001',
    funcionario_id: 'func-001',
    supervisor_id: 'super-001',
    horas_extras: 2.5,
    data_trabalho: '2024-01-15',
    status: 'pendente',
    data_submissao: '2024-01-15T18:30:00Z',
    data_limite: '2024-01-22T18:30:00Z',
    funcionario: {
      nome: 'João Silva',
      cargo: 'Operador de Grua',
      obra: 'Obra Centro'
    },
    registro: {
      entrada: '08:00',
      saida: '18:30',
      horas_trabalhadas: 10.5
    },
    supervisor: {
      nome: 'Maria Santos',
      cargo: 'Supervisora'
    }
  },
  {
    id: '2',
    registro_ponto_id: 'reg-002',
    funcionario_id: 'func-002',
    supervisor_id: 'super-001',
    horas_extras: 1.0,
    data_trabalho: '2024-01-14',
    status: 'aprovado',
    assinatura_supervisor: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    observacoes: 'Aprovado conforme necessidade da obra',
    data_submissao: '2024-01-14T17:00:00Z',
    data_aprovacao: '2024-01-15T09:30:00Z',
    data_limite: '2024-01-21T17:00:00Z',
    funcionario: {
      nome: 'Pedro Costa',
      cargo: 'Auxiliar de Operação',
      obra: 'Obra Centro'
    },
    registro: {
      entrada: '08:00',
      saida: '17:00',
      horas_trabalhadas: 9.0
    },
    supervisor: {
      nome: 'Maria Santos',
      cargo: 'Supervisora'
    }
  },
  {
    id: '3',
    registro_ponto_id: 'reg-003',
    funcionario_id: 'func-003',
    supervisor_id: 'super-002',
    horas_extras: 3.0,
    data_trabalho: '2024-01-13',
    status: 'rejeitado',
    observacoes: 'Horas extras não justificadas conforme política da empresa',
    data_submissao: '2024-01-13T19:00:00Z',
    data_aprovacao: '2024-01-14T10:15:00Z',
    data_limite: '2024-01-20T19:00:00Z',
    funcionario: {
      nome: 'Ana Oliveira',
      cargo: 'Operadora de Grua',
      obra: 'Obra Norte'
    },
    registro: {
      entrada: '08:00',
      saida: '19:00',
      horas_trabalhadas: 11.0
    },
    supervisor: {
      nome: 'Carlos Mendes',
      cargo: 'Supervisor'
    }
  },
  {
    id: '4',
    registro_ponto_id: 'reg-004',
    funcionario_id: 'func-004',
    supervisor_id: 'super-002',
    horas_extras: 1.5,
    data_trabalho: '2024-01-10',
    status: 'cancelado',
    observacoes: 'Cancelado automaticamente por prazo expirado',
    data_submissao: '2024-01-10T18:00:00Z',
    data_limite: '2024-01-17T18:00:00Z',
    funcionario: {
      nome: 'Roberto Lima',
      cargo: 'Auxiliar de Operação',
      obra: 'Obra Norte'
    },
    registro: {
      entrada: '08:00',
      saida: '17:30',
      horas_trabalhadas: 9.5
    },
    supervisor: {
      nome: 'Carlos Mendes',
      cargo: 'Supervisor'
    }
  },
  {
    id: '5',
    registro_ponto_id: 'reg-005',
    funcionario_id: 'func-001',
    supervisor_id: 'super-001',
    horas_extras: 2.0,
    data_trabalho: '2024-01-12',
    status: 'pendente',
    data_submissao: '2024-01-12T18:00:00Z',
    data_limite: '2024-01-19T18:00:00Z',
    funcionario: {
      nome: 'João Silva',
      cargo: 'Operador de Grua',
      obra: 'Obra Centro'
    },
    registro: {
      entrada: '08:00',
      saida: '18:00',
      horas_trabalhadas: 10.0
    },
    supervisor: {
      nome: 'Maria Santos',
      cargo: 'Supervisora'
    }
  }
];

export const mockNotificacoes: NotificacaoAprovacao[] = [
  {
    id: 'notif-001',
    aprovacao_id: '1',
    usuario_id: 'super-001',
    tipo: 'nova_aprovacao',
    titulo: 'Nova Aprovação de Horas Extras',
    mensagem: 'João Silva trabalhou 2.5h extras em 15/01/2024',
    lida: false,
    created_at: '2024-01-15T18:30:00Z'
  },
  {
    id: 'notif-002',
    aprovacao_id: '2',
    usuario_id: 'func-002',
    tipo: 'aprovado',
    titulo: 'Horas Extras Aprovadas',
    mensagem: 'Suas 1.0h extras de 14/01/2024 foram aprovadas',
    lida: true,
    created_at: '2024-01-15T09:30:00Z'
  },
  {
    id: 'notif-003',
    aprovacao_id: '3',
    usuario_id: 'func-003',
    tipo: 'rejeitado',
    titulo: 'Horas Extras Rejeitadas',
    mensagem: 'Suas 3.0h extras de 13/01/2024 foram rejeitadas',
    lida: false,
    created_at: '2024-01-14T10:15:00Z'
  },
  {
    id: 'notif-004',
    aprovacao_id: '4',
    usuario_id: 'func-004',
    tipo: 'cancelado',
    titulo: 'Horas Extras Canceladas',
    mensagem: 'Suas 1.5h extras de 10/01/2024 foram canceladas por prazo expirado',
    lida: true,
    created_at: '2024-01-18T00:00:00Z'
  }
];

// Funções utilitárias para formatação
export function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR');
}

export function formatarDataHora(data: string): string {
  return new Date(data).toLocaleString('pt-BR');
}

export function formatarTempoRelativo(data: string): string {
  const agora = new Date();
  const dataComparacao = new Date(data);
  const diffMs = agora.getTime() - dataComparacao.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDias === 0) return 'Hoje';
  if (diffDias === 1) return 'Ontem';
  if (diffDias < 7) return `${diffDias} dias atrás`;
  return formatarData(data);
}

export function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'aprovado':
      return 'default';
    case 'pendente':
      return 'secondary';
    case 'rejeitado':
      return 'destructive';
    case 'cancelado':
      return 'outline';
    default:
      return 'outline';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'aprovado':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'pendente':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'rejeitado':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'cancelado':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}
