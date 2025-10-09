import { api } from './api';

export interface Imposto {
  id: string;
  tipo: 'ISS' | 'ICMS' | 'PIS' | 'COFINS' | 'IRPJ' | 'CSLL' | 'INSS' | 'OUTRO';
  descricao: string;
  valor: number;
  valor_base: number;
  aliquota: number;
  competencia: string; // formato: YYYY-MM
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  referencia?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface ImpostoPagamento {
  id: string;
  imposto_id: string;
  valor_pago: number;
  data_pagamento: string;
  forma_pagamento: string;
  comprovante?: string;
  observacoes?: string;
  created_at: string;
}

export interface ImpostoCreate {
  tipo: 'ISS' | 'ICMS' | 'PIS' | 'COFINS' | 'IRPJ' | 'CSLL' | 'INSS' | 'OUTRO';
  descricao: string;
  valor: number;
  valor_base: number;
  aliquota: number;
  competencia: string;
  data_vencimento: string;
  referencia?: string;
  observacoes?: string;
}

export interface ImpostoCalculoParams {
  receita_bruta: number;
  tipo_imposto: 'ISS' | 'ICMS' | 'PIS' | 'COFINS' | 'IRPJ' | 'CSLL';
  competencia: string;
}

export interface ImpostoRelatorio {
  competencia: string;
  total_impostos: number;
  total_pago: number;
  total_pendente: number;
  impostos_por_tipo: {
    tipo: string;
    valor_total: number;
    valor_pago: number;
    valor_pendente: number;
  }[];
}

export const impostosApi = {
  // Listar impostos
  async list(filters: { 
    competencia?: string;
    tipo?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ impostos: Imposto[], total: number }> {
    const params = new URLSearchParams();
    
    if (filters.competencia) params.append('competencia', filters.competencia);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/impostos?${params.toString()}`);
    
    return {
      impostos: response.data.data || [],
      total: response.data.pagination?.total || 0
    };
  },

  // Buscar por ID
  async getById(id: string): Promise<Imposto> {
    const response = await api.get(`/impostos/${id}`);
    return response.data.data;
  },

  // Criar imposto
  async create(imposto: ImpostoCreate): Promise<Imposto> {
    const response = await api.post('/impostos', imposto);
    return response.data.data;
  },

  // Atualizar imposto
  async update(id: string, imposto: Partial<ImpostoCreate>): Promise<Imposto> {
    const response = await api.put(`/impostos/${id}`, imposto);
    return response.data.data;
  },

  // Excluir imposto
  async delete(id: string): Promise<void> {
    await api.delete(`/impostos/${id}`);
  },

  // Registrar pagamento
  async registrarPagamento(impostoId: string, pagamento: {
    valor_pago: number;
    data_pagamento: string;
    forma_pagamento: string;
    comprovante?: string;
    observacoes?: string;
  }): Promise<ImpostoPagamento> {
    const response = await api.post(`/impostos/${impostoId}/pagamento`, pagamento);
    return response.data.data;
  },

  // Calcular imposto
  async calcular(params: ImpostoCalculoParams): Promise<{
    tipo: string;
    valor_base: number;
    aliquota: number;
    valor_calculado: number;
  }> {
    const response = await api.post('/impostos/calcular', params);
    return response.data.data;
  },

  // Obter relatório por período
  async getRelatorio(mes: string, ano: string): Promise<ImpostoRelatorio> {
    const response = await api.get(`/impostos/relatorio?mes=${mes}&ano=${ano}`);
    return response.data.data;
  },

  // Gerar guia de pagamento
  async gerarGuia(impostoId: string): Promise<Blob> {
    const response = await api.get(`/impostos/${impostoId}/guia`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Obter impostos vencendo
  async getVencendo(dias: number = 7): Promise<Imposto[]> {
    const response = await api.get(`/impostos/vencendo?dias=${dias}`);
    return response.data.data || [];
  },

  // Obter impostos atrasados
  async getAtrasados(): Promise<Imposto[]> {
    const response = await api.get('/impostos/atrasados');
    return response.data.data || [];
  },

  // Exportar
  async export(filters: any = {}, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key].toString());
    });

    const response = await api.get(`/impostos/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

// Utilidades
export const impostosUtils = {
  formatCurrency: (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  formatDate: (date: string): string => {
    return new Date(date).toLocaleDateString('pt-BR');
  },

  formatCompetencia: (competencia: string): string => {
    const [ano, mes] = competencia.split('-');
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${meses[parseInt(mes) - 1]}/${ano}`;
  },

  getStatusColor: (status: string): string => {
    const colors = {
      pendente: 'bg-yellow-100 text-yellow-800',
      pago: 'bg-green-100 text-green-800',
      atrasado: 'bg-red-100 text-red-800',
      cancelado: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  },

  getTipoColor: (tipo: string): string => {
    const colors = {
      ISS: 'bg-blue-100 text-blue-800',
      ICMS: 'bg-green-100 text-green-800',
      PIS: 'bg-purple-100 text-purple-800',
      COFINS: 'bg-orange-100 text-orange-800',
      IRPJ: 'bg-red-100 text-red-800',
      CSLL: 'bg-pink-100 text-pink-800',
      INSS: 'bg-indigo-100 text-indigo-800',
      OUTRO: 'bg-gray-100 text-gray-800'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  },

  // Tabela de alíquotas (simplificada - em produção viria do backend)
  getAliquota: (tipo: string): number => {
    const aliquotas: Record<string, number> = {
      ISS: 5.0,
      ICMS: 18.0,
      PIS: 0.65,
      COFINS: 3.0,
      IRPJ: 15.0,
      CSLL: 9.0,
      INSS: 11.0
    };
    return aliquotas[tipo] || 0;
  },

  // Calcular valor do imposto
  calcularValor: (valorBase: number, aliquota: number): number => {
    return valorBase * (aliquota / 100);
  },

  // Verificar se está vencido
  isVencido: (dataVencimento: string): boolean => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    return vencimento < hoje;
  },

  // Dias até vencimento
  diasAteVencimento: (dataVencimento: string): number => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    const diff = vencimento.getTime() - hoje.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
};

