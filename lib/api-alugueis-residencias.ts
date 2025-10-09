// API de Aluguéis de Residências (Mock)

export type StatusAluguel = 'ativo' | 'encerrado' | 'pendente' | 'cancelado';

export interface AluguelResidencia {
  id: string;
  residencia: {
    id: string;
    nome: string;
    endereco: string;
    cidade: string;
    estado: string;
    cep: string;
    quartos: number;
    banheiros: number;
    area: number; // m²
    mobiliada: boolean;
  };
  funcionario: {
    id: string;
    nome: string;
    cargo: string;
    cpf: string;
  };
  contrato: {
    dataInicio: string;
    dataFim?: string;
    valorMensal: number;
    diaVencimento: number; // dia do mês para pagamento
    descontoFolha: boolean; // se desconta direto da folha de pagamento
    porcentagemDesconto?: number; // % que a empresa subsidia
  };
  pagamentos: {
    mes: string; // YYYY-MM
    valorPago: number;
    dataPagamento?: string;
    status: 'pago' | 'pendente' | 'atrasado';
  }[];
  status: StatusAluguel;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Residencia {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  quartos: number;
  banheiros: number;
  area: number;
  mobiliada: boolean;
  valorBase: number;
  disponivel: boolean;
  fotos?: string[];
}

// Dados mockados
const residenciasMock: Residencia[] = [
  {
    id: '1',
    nome: 'Casa Vila Nova',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    quartos: 3,
    banheiros: 2,
    area: 120,
    mobiliada: true,
    valorBase: 2500,
    disponivel: false,
  },
  {
    id: '2',
    nome: 'Apartamento Centro',
    endereco: 'Av. Paulista, 1000 - Apto 501',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01311-000',
    quartos: 2,
    banheiros: 1,
    area: 65,
    mobiliada: true,
    valorBase: 1800,
    disponivel: false,
  },
  {
    id: '3',
    nome: 'Casa Jardim América',
    endereco: 'Rua dos Lírios, 456',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '05678-901',
    quartos: 4,
    banheiros: 3,
    area: 180,
    mobiliada: false,
    valorBase: 3500,
    disponivel: true,
  },
  {
    id: '4',
    nome: 'Kitnet Vila Mariana',
    endereco: 'Rua Domingos de Morais, 789',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04010-100',
    quartos: 1,
    banheiros: 1,
    area: 35,
    mobiliada: true,
    valorBase: 1200,
    disponivel: true,
  },
];

const aluguelResMock: AluguelResidencia[] = [
  {
    id: '1',
    residencia: residenciasMock[0],
    funcionario: {
      id: '101',
      nome: 'João Silva Santos',
      cargo: 'Operador de Grua Sênior',
      cpf: '123.456.789-00',
    },
    contrato: {
      dataInicio: '2024-01-01',
      valorMensal: 2500,
      diaVencimento: 5,
      descontoFolha: true,
      porcentagemDesconto: 50, // empresa paga 50%
    },
    pagamentos: [
      {
        mes: '2024-10',
        valorPago: 1250,
        dataPagamento: '2024-10-05',
        status: 'pago',
      },
      {
        mes: '2024-09',
        valorPago: 1250,
        dataPagamento: '2024-09-05',
        status: 'pago',
      },
      {
        mes: '2024-08',
        valorPago: 1250,
        dataPagamento: '2024-08-05',
        status: 'pago',
      },
    ],
    status: 'ativo',
    observacoes: 'Contrato com desconto de 50% subsidiado pela empresa',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-10-05T14:30:00Z',
  },
  {
    id: '2',
    residencia: residenciasMock[1],
    funcionario: {
      id: '102',
      nome: 'Maria Costa Oliveira',
      cargo: 'Técnica de Manutenção',
      cpf: '987.654.321-00',
    },
    contrato: {
      dataInicio: '2024-03-15',
      valorMensal: 1800,
      diaVencimento: 10,
      descontoFolha: true,
      porcentagemDesconto: 30,
    },
    pagamentos: [
      {
        mes: '2024-10',
        valorPago: 1260,
        status: 'pendente',
      },
      {
        mes: '2024-09',
        valorPago: 1260,
        dataPagamento: '2024-09-10',
        status: 'pago',
      },
    ],
    status: 'ativo',
    createdAt: '2024-03-15T09:00:00Z',
    updatedAt: '2024-09-10T11:20:00Z',
  },
  {
    id: '3',
    residencia: {
      ...residenciasMock[0],
      id: '5', // residência que não existe mais no sistema
      nome: 'Casa Vila Antiga (Encerrada)',
    },
    funcionario: {
      id: '103',
      nome: 'Pedro Alves Lima',
      cargo: 'Supervisor de Obras',
      cpf: '456.789.123-00',
    },
    contrato: {
      dataInicio: '2023-06-01',
      dataFim: '2024-05-31',
      valorMensal: 2200,
      diaVencimento: 15,
      descontoFolha: false,
    },
    pagamentos: [
      {
        mes: '2024-05',
        valorPago: 2200,
        dataPagamento: '2024-05-15',
        status: 'pago',
      },
    ],
    status: 'encerrado',
    observacoes: 'Contrato encerrado - Funcionário mudou para outro estado',
    createdAt: '2023-06-01T08:00:00Z',
    updatedAt: '2024-05-31T16:00:00Z',
  },
];

// Simula chamadas de API
let alugueis = [...aluguelResMock];
let residencias = [...residenciasMock];

export const AlugueisAPI = {
  // Listar todos os aluguéis
  listar: async (): Promise<AluguelResidencia[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...alugueis].sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ));
      }, 300);
    });
  },

  // Listar apenas aluguéis ativos
  listarAtivos: async (): Promise<AluguelResidencia[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(alugueis.filter(a => a.status === 'ativo'));
      }, 300);
    });
  },

  // Buscar por ID
  buscarPorId: async (id: string): Promise<AluguelResidencia | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const aluguel = alugueis.find(a => a.id === id);
        resolve(aluguel || null);
      }, 200);
    });
  },

  // Criar novo aluguel
  criar: async (aluguel: Omit<AluguelResidencia, 'id' | 'createdAt' | 'updatedAt' | 'pagamentos'>): Promise<AluguelResidencia> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const novo: AluguelResidencia = {
          ...aluguel,
          id: String(Date.now()),
          pagamentos: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        alugueis.unshift(novo);
        
        // Atualizar disponibilidade da residência
        const residencia = residencias.find(r => r.id === novo.residencia.id);
        if (residencia) {
          residencia.disponivel = false;
        }
        
        resolve(novo);
      }, 300);
    });
  },

  // Atualizar aluguel
  atualizar: async (id: string, dados: Partial<AluguelResidencia>): Promise<AluguelResidencia | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = alugueis.findIndex(a => a.id === id);
        if (index !== -1) {
          alugueis[index] = {
            ...alugueis[index],
            ...dados,
            updatedAt: new Date().toISOString(),
          };
          resolve(alugueis[index]);
        } else {
          resolve(null);
        }
      }, 300);
    });
  },

  // Encerrar aluguel
  encerrar: async (id: string, dataFim: string): Promise<AluguelResidencia | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const aluguel = alugueis.find(a => a.id === id);
        if (aluguel) {
          aluguel.status = 'encerrado';
          aluguel.contrato.dataFim = dataFim;
          aluguel.updatedAt = new Date().toISOString();
          
          // Liberar residência
          const residencia = residencias.find(r => r.id === aluguel.residencia.id);
          if (residencia) {
            residencia.disponivel = true;
          }
          
          resolve(aluguel);
        } else {
          resolve(null);
        }
      }, 300);
    });
  },

  // Adicionar pagamento
  adicionarPagamento: async (
    aluguelId: string, 
    pagamento: { mes: string; valorPago: number; dataPagamento?: string; status: 'pago' | 'pendente' | 'atrasado' }
  ): Promise<AluguelResidencia | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const aluguel = alugueis.find(a => a.id === aluguelId);
        if (aluguel) {
          aluguel.pagamentos.push(pagamento);
          aluguel.updatedAt = new Date().toISOString();
          resolve(aluguel);
        } else {
          resolve(null);
        }
      }, 300);
    });
  },

  // Deletar aluguel
  deletar: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = alugueis.findIndex(a => a.id === id);
        if (index !== -1) {
          // Liberar residência
          const residencia = residencias.find(r => r.id === alugueis[index].residencia.id);
          if (residencia) {
            residencia.disponivel = true;
          }
          
          alugueis.splice(index, 1);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 300);
    });
  },
};

// API de Residências
export const ResidenciasAPI = {
  // Listar todas as residências
  listar: async (): Promise<Residencia[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...residencias]);
      }, 200);
    });
  },

  // Listar apenas disponíveis
  listarDisponiveis: async (): Promise<Residencia[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(residencias.filter(r => r.disponivel));
      }, 200);
    });
  },

  // Criar residência
  criar: async (residencia: Omit<Residencia, 'id' | 'disponivel'>): Promise<Residencia> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const nova: Residencia = {
          ...residencia,
          id: String(Date.now()),
          disponivel: true,
        };
        residencias.push(nova);
        resolve(nova);
      }, 300);
    });
  },

  // Atualizar residência
  atualizar: async (id: string, dados: Partial<Residencia>): Promise<Residencia | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = residencias.findIndex(r => r.id === id);
        if (index !== -1) {
          residencias[index] = { ...residencias[index], ...dados };
          resolve(residencias[index]);
        } else {
          resolve(null);
        }
      }, 300);
    });
  },

  // Deletar residência
  deletar: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = residencias.findIndex(r => r.id === id);
        if (index !== -1) {
          residencias.splice(index, 1);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 300);
    });
  },
};

// Funções auxiliares
export function calcularValorFuncionario(valorMensal: number, porcentagemDesconto?: number): number {
  if (!porcentagemDesconto) return valorMensal;
  return valorMensal * (1 - porcentagemDesconto / 100);
}

export function calcularSubsidioEmpresa(valorMensal: number, porcentagemDesconto?: number): number {
  if (!porcentagemDesconto) return 0;
  return valorMensal * (porcentagemDesconto / 100);
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function obterStatusPagamento(mes: string, diaVencimento: number): 'pago' | 'pendente' | 'atrasado' {
  const hoje = new Date();
  const [ano, mesNum] = mes.split('-').map(Number);
  const dataVencimento = new Date(ano, mesNum - 1, diaVencimento);
  
  if (hoje > dataVencimento) {
    return 'atrasado';
  }
  return 'pendente';
}

