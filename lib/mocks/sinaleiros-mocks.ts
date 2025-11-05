// Mock de dados para Sinaleiros
// TODO: Substituir por chamadas reais da API quando backend estiver pronto

export interface Sinaleiro {
  id: string
  obra_id: number
  nome: string
  rg_cpf?: string
  cpf?: string
  rg?: string
  telefone: string
  email?: string
  tipo: 'principal' | 'reserva'
  tipo_vinculo?: 'interno' | 'cliente'
  cliente_informou: boolean
  documentos?: DocumentoSinaleiro[]
  certificados?: Array<{
    nome: string
    tipo: string
    numero?: string
    validade?: string
  }>
}

export interface DocumentoSinaleiro {
  id: string
  sinaleiro_id: string
  tipo: 'rg_frente' | 'rg_verso' | 'cpf' | 'comprovante_vinculo' | 'certificado'
  arquivo: string
  data_validade?: string
  status: 'pendente' | 'aprovado' | 'vencido'
  aprovado_por?: string
  aprovado_em?: string
  alerta_enviado: boolean
}

export const mockSinaleiros: Sinaleiro[] = [
  {
    id: '1',
    obra_id: 1,
    nome: 'Carlos Silva',
    rg_cpf: '12345678901',
    telefone: '(11) 98765-4321',
    email: 'carlos.silva@example.com',
    tipo: 'principal',
    cliente_informou: true,
    documentos: [
      {
        id: 'doc1',
        sinaleiro_id: '1',
        tipo: 'rg_frente',
        arquivo: '/uploads/rg_frente_1.pdf',
        status: 'aprovado',
        aprovado_por: 'Admin',
        aprovado_em: '2025-01-15T10:00:00Z',
        alerta_enviado: false
      },
      {
        id: 'doc2',
        sinaleiro_id: '1',
        tipo: 'rg_verso',
        arquivo: '/uploads/rg_verso_1.pdf',
        status: 'aprovado',
        aprovado_por: 'Admin',
        aprovado_em: '2025-01-15T10:00:00Z',
        alerta_enviado: false
      },
      {
        id: 'doc3',
        sinaleiro_id: '1',
        tipo: 'comprovante_vinculo',
        arquivo: '/uploads/comprovante_1.pdf',
        status: 'pendente',
        alerta_enviado: false
      }
    ]
  },
  {
    id: '2',
    obra_id: 1,
    nome: 'Ana Costa',
    rg_cpf: '98765432100',
    telefone: '(11) 91234-5678',
    email: 'ana.costa@example.com',
    tipo: 'reserva',
    cliente_informou: false,
    documentos: []
  }
]

export const documentosObrigatorios = [
  { tipo: 'rg_frente', nome: 'RG (Frente)', obrigatorio: true },
  { tipo: 'rg_verso', nome: 'RG (Verso)', obrigatorio: true },
  { tipo: 'comprovante_vinculo', nome: 'Comprovante de Vínculo', obrigatorio: true },
  { tipo: 'certificado', nome: 'Certificado Aplicável', obrigatorio: false }
]

export const mockSinaleirosAPI = {
  async listar(obraId: number): Promise<Sinaleiro[]> {
    // Mock: Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockSinaleiros.filter(s => s.obra_id === obraId)
  },

  async criar(obraId: number, data: Partial<Sinaleiro>): Promise<Sinaleiro> {
    await new Promise(resolve => setTimeout(resolve, 500))
    const novo: Sinaleiro = {
      id: Date.now().toString(),
      obra_id: obraId,
      nome: data.nome || '',
      rg_cpf: data.rg_cpf || '',
      telefone: data.telefone || '',
      email: data.email,
      tipo: data.tipo || 'principal',
      cliente_informou: data.cliente_informou || false,
      documentos: []
    }
    mockSinaleiros.push(novo)
    return novo
  },

  async atualizar(id: string, data: Partial<Sinaleiro>): Promise<Sinaleiro> {
    await new Promise(resolve => setTimeout(resolve, 500))
    const index = mockSinaleiros.findIndex(s => s.id === id)
    if (index >= 0) {
      mockSinaleiros[index] = { ...mockSinaleiros[index], ...data }
      return mockSinaleiros[index]
    }
    throw new Error('Sinaleiro não encontrado')
  },

  async excluir(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500))
    const index = mockSinaleiros.findIndex(s => s.id === id)
    if (index >= 0) {
      mockSinaleiros.splice(index, 1)
    }
  }
}

