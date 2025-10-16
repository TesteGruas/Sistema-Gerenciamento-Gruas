// Dados mockados para o sistema de gerenciamento de gruas

export interface Cliente {
  id: string
  name: string
  email: string
  telefone: string
  cnpj: string
  endereco: {
    rua: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    estado: string
    cep: string
  }
  contato: {
    nome: string
    cargo: string
    telefone: string
    email: string
  }
  status: 'ativo' | 'inativo'
  observacoes?: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'engenheiro' | 'chefe_obras' | 'funcionario' | 'diretor' | 'cliente'
  obraId?: string
  obraName?: string
  status: 'ativo' | 'inativo'
  createdAt: string
  lastLogin?: string
}

export interface Obra {
  id: string
  name: string
  description: string
  startDate: string
  endDate?: string
  status: 'Planejamento' | 'Em Andamento' | 'Pausada' | 'Concluída' | 'Cancelada'
  responsavelId: string
  responsavelName: string
  clienteId: string
  clienteName: string
  cliente?: {
    id: string
    nome: string
    cnpj: string
    email?: string
    telefone?: string
  } | null
  budget: number
  location: string
  client: string
  observations?: string
  createdAt: string
  updatedAt: string
  custosIniciais: number
  custosAdicionais: number
  totalCustos: number
  // Relacionamentos
  gruasVinculadas?: any[]
  funcionariosVinculados?: any[]
}

export interface Grua {
  id: string
  name: string
  model: string
  capacity: string
  status: 'disponivel' | 'em_obra' | 'manutencao' | 'inativa'
  currentObraId?: string
  currentObraName?: string
  createdAt: string
  historico: HistoricoGrua[]
}

export interface HistoricoGrua {
  id: string
  gruaId: string
  data: string
  status: 'ok' | 'falha' | 'manutencao'
  observacoes: string
  funcionarioId: string
  funcionarioName: string
  tipo: 'checklist' | 'manutencao' | 'falha'
  notificacaoEnviada?: boolean
}

export interface Documento {
  id: string
  obraId: string
  obraName: string
  titulo: string
  descricao: string
  arquivo: string
  arquivoOriginal: string
  docuSignLink?: string
  status: 'rascunho' | 'aguardando_assinatura' | 'em_assinatura' | 'assinado' | 'rejeitado'
  ordemAssinatura: AssinaturaOrdem[]
  historicoAssinaturas: AssinaturaHistorico[]
  createdAt: string
  updatedAt: string
  proximoAssinante?: string
}

export interface AssinaturaOrdem {
  userId: string
  userName: string
  role: string
  ordem: number
  status: 'pendente' | 'aguardando' | 'assinado' | 'rejeitado'
  docuSignLink?: string
  docuSignEnvelopeId?: string
  dataEnvio?: string
  dataAssinatura?: string
  arquivoAssinado?: string
  observacoes?: string
  emailEnviado?: boolean
  dataEmailEnviado?: string
}

export interface AssinaturaHistorico {
  id: string
  userId: string
  userName: string
  role: string
  acao: 'assinou' | 'rejeitou'
  data: string
  arquivoAssinado?: string
  observacoes?: string
}

export interface CustoObra {
  id: string
  obraId: string
  obraName: string
  descricao: string
  valor: number
  tipo: 'inicial' | 'adicional'
  categoria: 'equipamentos' | 'materiais' | 'mao_obra' | 'outros'
  data: string
  responsavelId: string
  responsavelName: string
  comprovante?: string
}

export interface CustoMensal {
  id: string
  obraId: string
  item: string
  descricao: string
  unidade: string
  quantidadeOrcamento: number
  valorUnitario: number
  totalOrcamento: number
  mes: string // formato YYYY-MM
  quantidadeRealizada: number
  valorRealizado: number
  quantidadeAcumulada: number
  valorAcumulado: number
  quantidadeSaldo: number
  valorSaldo: number
  tipo: 'contrato' | 'aditivo'
  createdAt: string
  updatedAt: string
}

// Dados mockados
export const mockClientes: Cliente[] = [
  {
    id: '1',
    name: 'Construtora Alpha Ltda',
    email: 'contato@alpha.com',
    telefone: '(11) 99999-9999',
    cnpj: '12.345.678/0001-90',
    endereco: {
      rua: 'Rua das Flores',
      numero: '123',
      complemento: 'Sala 45',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567'
    },
    contato: {
      nome: 'João Silva',
      cargo: 'Gerente de Projetos',
      telefone: '(11) 88888-8888',
      email: 'joao.silva@alpha.com'
    },
    status: 'ativo',
    observacoes: 'Cliente preferencial com histórico de pagamentos em dia',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z'
  },
  {
    id: '2',
    name: 'Beta Incorporações S.A.',
    email: 'projetos@beta.com',
    telefone: '(21) 77777-7777',
    cnpj: '98.765.432/0001-10',
    endereco: {
      rua: 'Av. Copacabana',
      numero: '456',
      bairro: 'Copacabana',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      cep: '22000-000'
    },
    contato: {
      nome: 'Maria Santos',
      cargo: 'Diretora Comercial',
      telefone: '(21) 66666-6666',
      email: 'maria.santos@beta.com'
    },
    status: 'ativo',
    observacoes: 'Cliente novo, primeira obra conosco',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z'
  },
  {
    id: '3',
    name: 'Gamma Empreendimentos',
    email: 'contato@gamma.com',
    telefone: '(31) 55555-5555',
    cnpj: '11.222.333/0001-44',
    endereco: {
      rua: 'Rua da Liberdade',
      numero: '789',
      complemento: 'Conjunto 201',
      bairro: 'Savassi',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      cep: '30112-000'
    },
    contato: {
      nome: 'Carlos Mendes',
      cargo: 'Engenheiro Responsável',
      telefone: '(31) 44444-4444',
      email: 'carlos.mendes@gamma.com'
    },
    status: 'inativo',
    observacoes: 'Cliente inativo - obra concluída em 2023',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2023-12-31T00:00:00Z'
  }
]

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@irbana.com',
    role: 'admin',
    status: 'ativo',
    createdAt: '2024-01-15',
    lastLogin: '2024-12-19T10:30:00Z'
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@irbana.com',
    role: 'engenheiro',
    status: 'ativo',
    createdAt: '2024-02-01',
    lastLogin: '2024-12-19T09:15:00Z'
  },
  {
    id: '3',
    name: 'Pedro Costa',
    email: 'pedro.costa@irbana.com',
    role: 'chefe_obras',
    obraId: '1',
    obraName: 'Torre Residencial Alpha',
    status: 'ativo',
    createdAt: '2024-02-15',
    lastLogin: '2024-12-19T08:45:00Z'
  },
  {
    id: '4',
    name: 'Ana Oliveira',
    email: 'ana.oliveira@irbana.com',
    role: 'funcionario',
    obraId: '1',
    obraName: 'Torre Residencial Alpha',
    status: 'ativo',
    createdAt: '2024-03-01',
    lastLogin: '2024-12-18T17:20:00Z'
  },
  {
    id: '5',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@irbana.com',
    role: 'funcionario',
    obraId: '2',
    obraName: 'Shopping Center Beta',
    status: 'ativo',
    createdAt: '2024-03-15',
    lastLogin: '2024-12-18T16:30:00Z'
  },
  {
    id: '6',
    name: 'Roberto Diretor',
    email: 'roberto.diretor@irbana.com',
    role: 'diretor',
    status: 'ativo',
    createdAt: '2024-01-01',
    lastLogin: '2024-12-19T11:00:00Z'
  },
  {
    id: '7',
    name: 'Cliente Alpha Ltda',
    email: 'cliente@alpha.com',
    role: 'cliente',
    obraId: '1',
    obraName: 'Torre Residencial Alpha',
    status: 'ativo',
    createdAt: '2024-01-10',
    lastLogin: '2024-12-17T15:30:00Z'
  },
  {
    id: '8',
    name: 'Cliente Beta Corp',
    email: 'cliente@beta.com',
    role: 'cliente',
    obraId: '2',
    obraName: 'Shopping Center Beta',
    status: 'ativo',
    createdAt: '2024-01-20',
    lastLogin: '2024-12-16T10:15:00Z'
  }
]

export const mockObras: Obra[] = [
  {
    id: '1',
    name: 'Torre Residencial Alpha',
    description: 'Construção de torre residencial de 25 andares',
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    status: 'ativa',
    responsavelId: '3',
    responsavelName: 'Pedro Costa',
    clienteId: '1',
    clienteName: 'Construtora Alpha Ltda',
    budget: 5000000,
    location: 'São Paulo, SP',
    client: 'Construtora Alpha Ltda',
    observations: 'Obra de alto padrão com prazo apertado',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    custosIniciais: 150000,
    custosAdicionais: 25000,
    totalCustos: 175000
  },
  {
    id: '2',
    name: 'Shopping Center Beta',
    description: 'Construção de shopping center com 3 pavimentos',
    startDate: '2024-03-01',
    endDate: '2025-06-30',
    status: 'ativa',
    responsavelId: '2',
    responsavelName: 'Maria Santos',
    clienteId: '2',
    clienteName: 'Beta Incorporações S.A.',
    budget: 8000000,
    location: 'Rio de Janeiro, RJ',
    client: 'Beta Incorporações S.A.',
    observations: 'Projeto comercial de grande porte',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    custosIniciais: 200000,
    custosAdicionais: 45000,
    totalCustos: 245000
  },
  {
    id: '3',
    name: 'Hospital Municipal',
    description: 'Construção de hospital municipal de 8 andares',
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    status: 'concluida',
    responsavelId: '2',
    responsavelName: 'Maria Santos',
    clienteId: '3',
    clienteName: 'Gamma Empreendimentos',
    budget: 12000000,
    location: 'Belo Horizonte, MG',
    client: 'Gamma Empreendimentos',
    observations: 'Obra pública concluída com sucesso',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-05-31T00:00:00Z',
    custosIniciais: 300000,
    custosAdicionais: 50000,
    totalCustos: 350000
  }
]

export const mockGruas: Grua[] = [
  {
    id: '1',
    name: 'Grua 001',
    model: 'Liebherr 200HC',
    capacity: '200 ton',
    status: 'em_obra',
    currentObraId: '1',
    currentObraName: 'Torre Residencial Alpha',
    createdAt: '2024-01-15',
    historico: [
      {
        id: '1',
        gruaId: '1',
        data: '2024-12-19',
        status: 'ok',
        observacoes: 'Checklist diário realizado com sucesso. Todos os sistemas funcionando normalmente.',
        funcionarioId: '4',
        funcionarioName: 'Ana Oliveira',
        tipo: 'checklist'
      },
      {
        id: '2',
        gruaId: '1',
        data: '2024-12-18',
        status: 'ok',
        observacoes: 'Manutenção preventiva realizada. Substituição de filtros de óleo.',
        funcionarioId: '4',
        funcionarioName: 'Ana Oliveira',
        tipo: 'manutencao'
      }
    ]
  },
  {
    id: '2',
    name: 'Grua 002',
    model: 'Potain MDT 178',
    capacity: '150 ton',
    status: 'em_obra',
    currentObraId: '2',
    currentObraName: 'Shopping Center Beta',
    createdAt: '2024-03-01',
    historico: [
      {
        id: '3',
        gruaId: '2',
        data: '2024-12-19',
        status: 'falha',
        observacoes: 'Falha no sistema hidráulico identificada. Necessária manutenção urgente.',
        funcionarioId: '5',
        funcionarioName: 'Carlos Mendes',
        tipo: 'falha',
        notificacaoEnviada: true
      }
    ]
  },
  {
    id: '3',
    name: 'Grua 003',
    model: 'Terex CTT 112-1',
    capacity: '100 ton',
    status: 'disponivel',
    createdAt: '2024-02-01',
    historico: []
  }
]

export const mockDocumentos: Documento[] = [
  {
    id: '1',
    obraId: '1',
    obraName: 'Torre Residencial Alpha',
    titulo: 'Contrato de Prestação de Serviços',
    descricao: 'Contrato principal para prestação de serviços de gruas',
    arquivo: 'contrato_principal.pdf',
    arquivoOriginal: 'contrato_principal_original.pdf',
    docuSignLink: 'https://demo.docusign.net/signing/documents/abc123',
    status: 'em_assinatura',
    proximoAssinante: '3',
    ordemAssinatura: [
      {
        userId: '2',
        userName: 'Maria Santos',
        role: 'engenheiro',
        ordem: 1,
        status: 'assinado',
        docuSignLink: 'https://demo.docusign.net/signing/documents/abc123-maria',
        docuSignEnvelopeId: 'abc123-maria',
        dataEnvio: '2024-12-15T10:00:00Z',
        dataAssinatura: '2024-12-18T14:30:00Z',
        arquivoAssinado: 'contrato_principal_assinado_maria.pdf',
        observacoes: 'Assinado com sucesso',
        emailEnviado: true,
        dataEmailEnviado: '2024-12-15T10:05:00Z'
      },
      {
        userId: '3',
        userName: 'Pedro Costa',
        role: 'chefe_obras',
        ordem: 2,
        status: 'aguardando',
        docuSignLink: 'https://demo.docusign.net/signing/documents/abc123-pedro',
        docuSignEnvelopeId: 'abc123-pedro',
        dataEnvio: '2024-12-18T15:00:00Z',
        emailEnviado: true,
        dataEmailEnviado: '2024-12-18T15:05:00Z'
      },
      {
        userId: '1',
        userName: 'João Silva',
        role: 'admin',
        ordem: 3,
        status: 'pendente'
      }
    ],
    historicoAssinaturas: [
      {
        id: '1',
        userId: '2',
        userName: 'Maria Santos',
        role: 'engenheiro',
        acao: 'assinou',
        data: '2024-12-18T14:30:00Z',
        arquivoAssinado: 'contrato_principal_assinado_maria.pdf',
        observacoes: 'Assinado via DocuSign'
      }
    ],
    createdAt: '2024-12-15',
    updatedAt: '2024-12-18T14:30:00Z'
  },
  {
    id: '2',
    obraId: '2',
    obraName: 'Shopping Center Beta',
    titulo: 'Termo de Responsabilidade Técnica',
    descricao: 'Termo de responsabilidade técnica para operação de gruas',
    arquivo: 'termo_responsabilidade.pdf',
    arquivoOriginal: 'termo_responsabilidade_original.pdf',
    status: 'aguardando_assinatura',
    proximoAssinante: '2',
    ordemAssinatura: [
      {
        userId: '2',
        userName: 'Maria Santos',
        role: 'engenheiro',
        ordem: 1,
        status: 'pendente'
      },
      {
        userId: '5',
        userName: 'Carlos Mendes',
        role: 'funcionario',
        ordem: 2,
        status: 'pendente'
      }
    ],
    historicoAssinaturas: [],
    createdAt: '2024-12-19',
    updatedAt: '2024-12-19T09:00:00Z'
  }
]

export const mockCustos: CustoObra[] = [
  {
    id: '1',
    obraId: '1',
    obraName: 'Torre Residencial Alpha',
    descricao: 'Aluguel de grua Liebherr 200HC',
    valor: 150000,
    tipo: 'inicial',
    categoria: 'equipamentos',
    data: '2024-01-15',
    responsavelId: '3',
    responsavelName: 'Pedro Costa'
  },
  {
    id: '2',
    obraId: '1',
    obraName: 'Torre Residencial Alpha',
    descricao: 'Manutenção preventiva adicional',
    valor: 25000,
    tipo: 'adicional',
    categoria: 'manutencao',
    data: '2024-12-01',
    responsavelId: '3',
    responsavelName: 'Pedro Costa'
  }
]

// Dados mockados para custos mensais
export const mockCustosMensais: CustoMensal[] = [
  // Obra 1 - Janeiro 2025
  {
    id: 'cm1',
    obraId: '1',
    item: '01.01',
    descricao: 'Locação de grua torre PINGON BR47',
    unidade: 'mês',
    quantidadeOrcamento: 17,
    valorUnitario: 30900,
    totalOrcamento: 525300,
    mes: '2025-01',
    quantidadeRealizada: 1,
    valorRealizado: 30900,
    quantidadeAcumulada: 1,
    valorAcumulado: 30900,
    quantidadeSaldo: 16,
    valorSaldo: 494400,
    tipo: 'contrato',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cm2',
    obraId: '1',
    item: '01.02',
    descricao: 'Chumbador',
    unidade: 'und',
    quantidadeOrcamento: 1,
    valorUnitario: 18600,
    totalOrcamento: 18600,
    mes: '2025-01',
    quantidadeRealizada: 1,
    valorRealizado: 18600,
    quantidadeAcumulada: 1,
    valorAcumulado: 18600,
    quantidadeSaldo: 0,
    valorSaldo: 0,
    tipo: 'contrato',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'cm3',
    obraId: '1',
    item: '01.04',
    descricao: 'Custos de Operação',
    unidade: 'mês',
    quantidadeOrcamento: 17,
    valorUnitario: 6800,
    totalOrcamento: 115600,
    mes: '2025-01',
    quantidadeRealizada: 1,
    valorRealizado: 6800,
    quantidadeAcumulada: 1,
    valorAcumulado: 6800,
    quantidadeSaldo: 16,
    valorSaldo: 108800,
    tipo: 'contrato',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  // Obra 1 - Fevereiro 2025
  {
    id: 'cm4',
    obraId: '1',
    item: '01.01',
    descricao: 'Locação de grua torre PINGON BR47',
    unidade: 'mês',
    quantidadeOrcamento: 17,
    valorUnitario: 30900,
    totalOrcamento: 525300,
    mes: '2025-02',
    quantidadeRealizada: 1,
    valorRealizado: 30900,
    quantidadeAcumulada: 2,
    valorAcumulado: 61800,
    quantidadeSaldo: 15,
    valorSaldo: 463500,
    tipo: 'contrato',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z'
  },
  {
    id: 'cm5',
    obraId: '1',
    item: '01.02',
    descricao: 'Chumbador',
    unidade: 'und',
    quantidadeOrcamento: 1,
    valorUnitario: 18600,
    totalOrcamento: 18600,
    mes: '2025-02',
    quantidadeRealizada: 0,
    valorRealizado: 0,
    quantidadeAcumulada: 1,
    valorAcumulado: 18600,
    quantidadeSaldo: 0,
    valorSaldo: 0,
    tipo: 'contrato',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z'
  },
  {
    id: 'cm6',
    obraId: '1',
    item: '01.04',
    descricao: 'Custos de Operação',
    unidade: 'mês',
    quantidadeOrcamento: 17,
    valorUnitario: 6800,
    totalOrcamento: 115600,
    mes: '2025-02',
    quantidadeRealizada: 1,
    valorRealizado: 6800,
    quantidadeAcumulada: 2,
    valorAcumulado: 13600,
    quantidadeSaldo: 15,
    valorSaldo: 102000,
    tipo: 'contrato',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z'
  },
  // Obra 1 - Março 2025
  {
    id: 'cm7',
    obraId: '1',
    item: '01.01',
    descricao: 'Locação de grua torre PINGON BR47',
    unidade: 'mês',
    quantidadeOrcamento: 17,
    valorUnitario: 30900,
    totalOrcamento: 525300,
    mes: '2025-03',
    quantidadeRealizada: 1,
    valorRealizado: 30900,
    quantidadeAcumulada: 3,
    valorAcumulado: 92700,
    quantidadeSaldo: 14,
    valorSaldo: 432600,
    tipo: 'contrato',
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z'
  },
  {
    id: 'cm8',
    obraId: '1',
    item: '01.02',
    descricao: 'Chumbador',
    unidade: 'und',
    quantidadeOrcamento: 1,
    valorUnitario: 18600,
    totalOrcamento: 18600,
    mes: '2025-03',
    quantidadeRealizada: 0,
    valorRealizado: 0,
    quantidadeAcumulada: 1,
    valorAcumulado: 18600,
    quantidadeSaldo: 0,
    valorSaldo: 0,
    tipo: 'contrato',
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z'
  },
  {
    id: 'cm9',
    obraId: '1',
    item: '01.04',
    descricao: 'Custos de Operação',
    unidade: 'mês',
    quantidadeOrcamento: 17,
    valorUnitario: 6800,
    totalOrcamento: 115600,
    mes: '2025-03',
    quantidadeRealizada: 1,
    valorRealizado: 6800,
    quantidadeAcumulada: 3,
    valorAcumulado: 20400,
    quantidadeSaldo: 14,
    valorSaldo: 95200,
    tipo: 'contrato',
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z'
  }
]

// Funções utilitárias para simular operações
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id)
}

export const getUsersByRole = (role: string): User[] => {
  return mockUsers.filter(user => user.role === role)
}

export const getUsersByObra = (obraId: string): User[] => {
  return mockUsers.filter(user => user.obraId === obraId)
}

export const getObraById = (id: string): Obra | undefined => {
  return mockObras.find(obra => obra.id === id)
}

export const getGruaById = (id: string): Grua | undefined => {
  return mockGruas.find(grua => grua.id === id)
}

export const getGruasByObra = (obraId: string): Grua[] => {
  return mockGruas.filter(grua => grua.currentObraId === obraId)
}

export const getDocumentosByObra = (obraId: string): Documento[] => {
  return mockDocumentos.filter(doc => doc.obraId === obraId)
}

export const getCustosByObra = (obraId: string): CustoObra[] => {
  return mockCustos.filter(custo => custo.obraId === obraId)
}

export const getCustosMensaisByObra = (obraId: string): CustoMensal[] => {
  return mockCustosMensais.filter(custo => custo.obraId === obraId)
}

export const getCustosMensaisByObraAndMes = (obraId: string, mes: string): CustoMensal[] => {
  return mockCustosMensais.filter(custo => custo.obraId === obraId && custo.mes === mes)
}

export const getMesesDisponiveis = (obraId: string): string[] => {
  const custos = getCustosMensaisByObra(obraId)
  const meses = [...new Set(custos.map(custo => custo.mes))]
  return meses.sort()
}

export const criarCustosParaNovoMes = (obraId: string, mes: string): CustoMensal[] => {
  // Busca os custos do mês anterior para replicar
  const mesAnterior = new Date(mes + '-01')
  mesAnterior.setMonth(mesAnterior.getMonth() - 1)
  const mesAnteriorStr = mesAnterior.toISOString().slice(0, 7)
  
  const custosAnteriores = getCustosMensaisByObraAndMes(obraId, mesAnteriorStr)
  
  if (custosAnteriores.length === 0) {
    // Se não há custos anteriores, cria custos iniciais padrão
    return criarCustosIniciaisParaObra(obraId, mes)
  }
  
  // Cria novos custos para o mês atual baseados nos anteriores
  const novosCustos: CustoMensal[] = custosAnteriores.map(custo => ({
    ...custo,
    id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    mes: mes,
    quantidadeRealizada: 0,
    valorRealizado: 0,
    quantidadeAcumulada: custo.quantidadeAcumulada,
    valorAcumulado: custo.valorAcumulado,
    quantidadeSaldo: custo.quantidadeSaldo,
    valorSaldo: custo.valorSaldo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
  
  return novosCustos
}

// Função para criar custos iniciais para uma obra
export const criarCustosIniciaisParaObra = (obraId: string, mes: string): CustoMensal[] => {
  const obra = getObraById(obraId)
  if (!obra) {
    return []
  }

  // Custos iniciais padrão para uma obra
  const custosIniciais: CustoMensal[] = [
    {
      id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      obraId: obraId,
      item: '01.01',
      descricao: 'Locação de grua torre PINGON BR47',
      unidade: 'mês',
      quantidadeOrcamento: 17,
      valorUnitario: 30900,
      totalOrcamento: 525300,
      mes: mes,
      quantidadeRealizada: 0,
      valorRealizado: 0,
      quantidadeAcumulada: 0,
      valorAcumulado: 0,
      quantidadeSaldo: 17,
      valorSaldo: 525300,
      tipo: 'contrato',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      obraId: obraId,
      item: '01.02',
      descricao: 'Chumbador',
      unidade: 'und',
      quantidadeOrcamento: 1,
      valorUnitario: 18600,
      totalOrcamento: 18600,
      mes: mes,
      quantidadeRealizada: 0,
      valorRealizado: 0,
      quantidadeAcumulada: 0,
      valorAcumulado: 0,
      quantidadeSaldo: 1,
      valorSaldo: 18600,
      tipo: 'contrato',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      obraId: obraId,
      item: '01.04',
      descricao: 'Custos de Operação',
      unidade: 'mês',
      quantidadeOrcamento: 17,
      valorUnitario: 6800,
      totalOrcamento: 115600,
      mes: mes,
      quantidadeRealizada: 0,
      valorRealizado: 0,
      quantidadeAcumulada: 0,
      valorAcumulado: 0,
      quantidadeSaldo: 17,
      valorSaldo: 115600,
      tipo: 'contrato',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  return custosIniciais
}

export const getHistoricoByGrua = (gruaId: string): HistoricoGrua[] => {
  const grua = getGruaById(gruaId)
  return grua ? grua.historico : []
}

export const getHistoricoByMonth = (gruaId: string, month: number, year: number): HistoricoGrua[] => {
  const historico = getHistoricoByGrua(gruaId)
  return historico.filter(entry => {
    const entryDate = new Date(entry.data)
    return entryDate.getMonth() === month && entryDate.getFullYear() === year
  })
}

// Dados mock para relações grua-obra
export interface GruaObraRelacao {
  id: number
  grua_id: string
  obra_id: number
  data_inicio_locacao: string
  data_fim_locacao?: string
  status: string
  valor_locacao_mensal?: number
  observacoes?: string
  grua: {
    id: string
    tipo: string
    modelo: string
    fabricante: string
  }
  obra: {
    id: number
    nome: string
    endereco: string
    cidade: string
    estado: string
    status: string
  }
}

export const mockRelacoesGruaObra: GruaObraRelacao[] = [
  {
    id: 1,
    grua_id: "G001",
    obra_id: 1,
    data_inicio_locacao: "2024-01-15",
    data_fim_locacao: "2024-06-15",
    status: "Ativa",
    valor_locacao_mensal: 15000,
    observacoes: "Locação para construção do shopping",
    grua: {
      id: "G001",
      tipo: "Torre",
      modelo: "TC7030",
      fabricante: "Liebherr"
    },
    obra: {
      id: 1,
      nome: "Shopping Center Norte",
      endereco: "Av. Paulista, 1000",
      cidade: "São Paulo",
      estado: "SP",
      status: "Em Andamento"
    }
  },
  {
    id: 2,
    grua_id: "G002",
    obra_id: 1,
    data_inicio_locacao: "2024-02-01",
    status: "Ativa",
    valor_locacao_mensal: 12000,
    observacoes: "Grua auxiliar para montagem",
    grua: {
      id: "G002",
      tipo: "Torre",
      modelo: "TC5013",
      fabricante: "Liebherr"
    },
    obra: {
      id: 1,
      nome: "Shopping Center Norte",
      endereco: "Av. Paulista, 1000",
      cidade: "São Paulo",
      estado: "SP",
      status: "Em Andamento"
    }
  },
  {
    id: 3,
    grua_id: "G003",
    obra_id: 2,
    data_inicio_locacao: "2024-03-01",
    data_fim_locacao: "2024-05-01",
    status: "Pausada",
    valor_locacao_mensal: 18000,
    observacoes: "Obra pausada por questões financeiras",
    grua: {
      id: "G003",
      tipo: "Torre",
      modelo: "TC8030",
      fabricante: "Potain"
    },
    obra: {
      id: 2,
      nome: "Residencial Jardim Europa",
      endereco: "Rua das Flores, 500",
      cidade: "Rio de Janeiro",
      estado: "RJ",
      status: "Pausada"
    }
  },
  {
    id: 4,
    grua_id: "G004",
    obra_id: 3,
    data_inicio_locacao: "2024-04-01",
    status: "Ativa",
    valor_locacao_mensal: 20000,
    observacoes: "Grua para construção do hospital",
    grua: {
      id: "G004",
      tipo: "Torre",
      modelo: "TC10040",
      fabricante: "Potain"
    },
    obra: {
      id: 3,
      nome: "Hospital Municipal",
      endereco: "Av. Brasil, 2000",
      cidade: "Belo Horizonte",
      estado: "MG",
      status: "Em Andamento"
    }
  },
  {
    id: 5,
    grua_id: "G005",
    obra_id: 4,
    data_inicio_locacao: "2024-05-01",
    status: "Ativa",
    valor_locacao_mensal: 14000,
    observacoes: "Grua para construção do prédio comercial",
    grua: {
      id: "G005",
      tipo: "Torre",
      modelo: "TC6020",
      fabricante: "Liebherr"
    },
    obra: {
      id: 4,
      nome: "Edifício Comercial Centro",
      endereco: "Rua Comercial, 300",
      cidade: "Salvador",
      estado: "BA",
      status: "Em Andamento"
    }
  }
]

// Dados mock para funcionários
export interface Funcionario {
  id: number
  nome: string
  cargo: string
  email: string
  telefone: string
  obra_id?: number
  obra_nome?: string
  status: 'ativo' | 'inativo'
}

export const mockFuncionarios: Funcionario[] = [
  {
    id: 1,
    nome: "João Silva",
    cargo: "Operador de Grua",
    email: "joao.silva@empresa.com",
    telefone: "(11) 99999-1111",
    obra_id: 1,
    obra_nome: "Shopping Center Norte",
    status: "ativo"
  },
  {
    id: 2,
    nome: "Maria Santos",
    cargo: "Engenheira de Segurança",
    email: "maria.santos@empresa.com",
    telefone: "(11) 99999-2222",
    obra_id: 1,
    obra_nome: "Shopping Center Norte",
    status: "ativo"
  },
  {
    id: 3,
    nome: "Pedro Oliveira",
    cargo: "Supervisor de Obra",
    email: "pedro.oliveira@empresa.com",
    telefone: "(11) 99999-3333",
    obra_id: 2,
    obra_nome: "Residencial Jardim Europa",
    status: "ativo"
  },
  {
    id: 4,
    nome: "Ana Costa",
    cargo: "Técnica em Manutenção",
    email: "ana.costa@empresa.com",
    telefone: "(11) 99999-4444",
    obra_id: 3,
    obra_nome: "Hospital Municipal",
    status: "ativo"
  },
  {
    id: 5,
    nome: "Carlos Ferreira",
    cargo: "Operador de Grua",
    email: "carlos.ferreira@empresa.com",
    telefone: "(11) 99999-5555",
    obra_id: 4,
    obra_nome: "Edifício Comercial Centro",
    status: "ativo"
  }
]

// Dados mock para entradas do livro da grua
export interface EntradaLivroGrua {
  id: number
  grua_id: string
  funcionario_id: number
  funcionario_nome: string
  data_entrada: string
  tipo_entrada: 'checklist' | 'manutencao' | 'falha'
  descricao: string
  status: 'pendente' | 'concluido' | 'cancelado'
  observacoes?: string
  created_at: string
  updated_at: string
}

export const mockEntradasLivroGrua: EntradaLivroGrua[] = [
  {
    id: 1,
    grua_id: "G001",
    funcionario_id: 1,
    funcionario_nome: "João Silva",
    data_entrada: "2024-01-20",
    tipo_entrada: "checklist",
    descricao: "Checklist diário - todos os sistemas funcionando normalmente",
    status: "concluido",
    observacoes: "Verificação de cabos, freios e sistema hidráulico OK",
    created_at: "2024-01-20T08:00:00Z",
    updated_at: "2024-01-20T08:30:00Z"
  },
  {
    id: 2,
    grua_id: "G001",
    funcionario_id: 1,
    funcionario_nome: "João Silva",
    data_entrada: "2024-01-22",
    tipo_entrada: "manutencao",
    descricao: "Manutenção preventiva - troca de óleo hidráulico",
    status: "concluido",
    observacoes: "Óleo trocado conforme cronograma. Próxima manutenção em 30 dias.",
    created_at: "2024-01-22T14:00:00Z",
    updated_at: "2024-01-22T16:00:00Z"
  },
  {
    id: 3,
    grua_id: "G001",
    funcionario_id: 2,
    funcionario_nome: "Maria Santos",
    data_entrada: "2024-01-25",
    tipo_entrada: "falha",
    descricao: "Falha no sistema de freio de emergência",
    status: "pendente",
    observacoes: "Sistema de freio apresentou falha durante operação. Grua parada para manutenção.",
    created_at: "2024-01-25T10:30:00Z",
    updated_at: "2024-01-25T10:30:00Z"
  },
  {
    id: 4,
    grua_id: "G002",
    funcionario_id: 1,
    funcionario_nome: "João Silva",
    data_entrada: "2024-02-01",
    tipo_entrada: "checklist",
    descricao: "Checklist diário - verificação de segurança",
    status: "concluido",
    observacoes: "Todos os sistemas operacionais. Grua pronta para uso.",
    created_at: "2024-02-01T07:00:00Z",
    updated_at: "2024-02-01T07:15:00Z"
  },
  {
    id: 5,
    grua_id: "G003",
    funcionario_id: 3,
    funcionario_nome: "Pedro Oliveira",
    data_entrada: "2024-03-05",
    tipo_entrada: "manutencao",
    descricao: "Manutenção corretiva - reparo no sistema de elevação",
    status: "concluido",
    observacoes: "Sistema de elevação reparado. Testes realizados com sucesso.",
    created_at: "2024-03-05T09:00:00Z",
    updated_at: "2024-03-05T17:00:00Z"
  }
]

// Funções utilitárias para clientes
export const getClienteById = (id: string): Cliente | undefined => {
  return mockClientes.find(cliente => cliente.id === id)
}

export const getClientesAtivos = (): Cliente[] => {
  return mockClientes.filter(cliente => cliente.status === 'ativo')
}

export const getObrasByCliente = (clienteId: string): Obra[] => {
  return mockObras.filter(obra => obra.clienteId === clienteId)
}
