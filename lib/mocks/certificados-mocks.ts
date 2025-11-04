// Mock de dados para Certificados de Colaboradores
// TODO: Substituir por chamadas reais da API quando backend estiver pronto

export interface Certificado {
  id: number
  colaborador_id: number
  tipo: string
  nome: string
  data_validade: string
  arquivo: string
  alerta_enviado: boolean
}

export const tiposCertificados = [
  'Ficha de EPI',
  'Ordem de Serviço',
  'NR06',
  'NR11',
  'NR12',
  'NR18',
  'NR35',
  'Certificado de Especificação'
]

export const mockCertificados: Certificado[] = [
  {
    id: 1,
    colaborador_id: 1,
    tipo: 'NR18',
    nome: 'NR18 - Trabalho em Altura',
    data_validade: '2025-12-31',
    arquivo: '/uploads/certificado_nr18_1.pdf',
    alerta_enviado: false
  },
  {
    id: 2,
    colaborador_id: 1,
    tipo: 'NR35',
    nome: 'NR35 - Trabalho em Altura Avançado',
    data_validade: '2025-06-15',
    arquivo: '/uploads/certificado_nr35_1.pdf',
    alerta_enviado: false
  },
  {
    id: 3,
    colaborador_id: 1,
    tipo: 'Ficha de EPI',
    nome: 'Ficha de EPI - Capacete',
    data_validade: '2025-03-20',
    arquivo: '/uploads/epi_1.pdf',
    alerta_enviado: false
  }
]

export const mockCertificadosAPI = {
  async listar(colaboradorId: number): Promise<Certificado[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockCertificados.filter(c => c.colaborador_id === colaboradorId)
  },

  async criar(colaboradorId: number, data: Partial<Certificado>): Promise<Certificado> {
    await new Promise(resolve => setTimeout(resolve, 500))
    const novo: Certificado = {
      id: Date.now(),
      colaborador_id: colaboradorId,
      tipo: data.tipo || '',
      nome: data.nome || '',
      data_validade: data.data_validade || '',
      arquivo: data.arquivo || '',
      alerta_enviado: false
    }
    mockCertificados.push(novo)
    return novo
  },

  async atualizar(id: number, data: Partial<Certificado>): Promise<Certificado> {
    await new Promise(resolve => setTimeout(resolve, 500))
    const index = mockCertificados.findIndex(c => c.id === id)
    if (index >= 0) {
      mockCertificados[index] = { ...mockCertificados[index], ...data }
      return mockCertificados[index]
    }
    throw new Error('Certificado não encontrado')
  },

  async excluir(id: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500))
    const index = mockCertificados.findIndex(c => c.id === id)
    if (index >= 0) {
      mockCertificados.splice(index, 1)
    }
  },

  async verificarVencendo(): Promise<Certificado[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const hoje = new Date()
    const trintaDias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)
    return mockCertificados.filter(c => {
      const dataValidade = new Date(c.data_validade)
      return dataValidade <= trintaDias && dataValidade >= hoje
    })
  }
}

