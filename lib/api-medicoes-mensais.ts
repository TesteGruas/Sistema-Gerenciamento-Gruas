import { api } from './api';

export interface MedicaoMensal {
  id: number;
  orcamento_id: number;
  numero: string;
  periodo: string; // YYYY-MM
  data_medicao: string;
  mes_referencia: number;
  ano_referencia: number;
  valor_mensal_bruto: number;
  valor_aditivos: number;
  valor_custos_extras: number;
  valor_descontos: number;
  valor_total: number;
  status: 'pendente' | 'finalizada' | 'cancelada' | 'enviada';
  data_finalizacao?: string;
  data_envio?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  orcamentos?: {
    id: number;
    numero: string;
    cliente_id: number;
    data_orcamento: string;
    valor_total: number;
    total_faturado_acumulado: number;
    ultima_medicao_periodo?: string;
    clientes?: {
      id: number;
      nome: string;
      cnpj_cpf?: string;
    };
  };
  custos_mensais?: MedicaoCustoMensal[];
  horas_extras?: MedicaoHoraExtra[];
  servicos_adicionais?: MedicaoServicoAdicional[];
  aditivos?: MedicaoAditivo[];
}

export interface MedicaoCustoMensal {
  id: number;
  medicao_id: number;
  tipo: string;
  descricao: string;
  valor_mensal: number;
  quantidade_meses: number;
  valor_total: number;
  observacoes?: string;
  created_at: string;
}

export interface MedicaoHoraExtra {
  id: number;
  medicao_id: number;
  tipo: 'operador' | 'sinaleiro' | 'equipamento';
  dia_semana: 'sabado' | 'domingo_feriado' | 'normal';
  quantidade_horas: number;
  valor_hora: number;
  valor_total: number;
  observacoes?: string;
  created_at: string;
}

export interface MedicaoServicoAdicional {
  id: number;
  medicao_id: number;
  tipo: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  observacoes?: string;
  created_at: string;
}

export interface MedicaoAditivo {
  id: number;
  medicao_id: number;
  tipo: 'adicional' | 'desconto';
  descricao: string;
  valor: number;
  observacoes?: string;
  created_at: string;
}

export interface MedicaoMensalCreate {
  orcamento_id?: number | null;
  obra_id?: number | null;
  numero: string;
  periodo: string;
  data_medicao: string;
  mes_referencia: number;
  ano_referencia: number;
  valor_mensal_bruto?: number;
  valor_aditivos?: number;
  valor_custos_extras?: number;
  valor_descontos?: number;
  status?: 'pendente' | 'finalizada' | 'cancelada' | 'enviada';
  observacoes?: string;
  custos_mensais?: Omit<MedicaoCustoMensal, 'id' | 'medicao_id' | 'created_at'>[];
  horas_extras?: Omit<MedicaoHoraExtra, 'id' | 'medicao_id' | 'created_at'>[];
  servicos_adicionais?: Omit<MedicaoServicoAdicional, 'id' | 'medicao_id' | 'created_at'>[];
  aditivos?: Omit<MedicaoAditivo, 'id' | 'medicao_id' | 'created_at'>[];
}

export interface MedicaoMensalUpdate extends Partial<MedicaoMensalCreate> {
  custos_mensais?: Omit<MedicaoCustoMensal, 'id' | 'medicao_id' | 'created_at'>[];
  horas_extras?: Omit<MedicaoHoraExtra, 'id' | 'medicao_id' | 'created_at'>[];
  servicos_adicionais?: Omit<MedicaoServicoAdicional, 'id' | 'medicao_id' | 'created_at'>[];
  aditivos?: Omit<MedicaoAditivo, 'id' | 'medicao_id' | 'created_at'>[];
}

export interface MedicaoMensalFilters {
  orcamento_id?: number;
  periodo?: string;
  status?: 'pendente' | 'finalizada' | 'cancelada' | 'enviada';
  data_inicio?: string;
  data_fim?: string;
  mes_referencia?: number;
  ano_referencia?: number;
  page?: number;
  limit?: number;
}

export interface GerarMedicaoAutomaticaParams {
  orcamento_id: number;
  periodo: string;
  data_medicao?: string;
  aplicar_valores_orcamento?: boolean;
  incluir_horas_extras?: boolean;
  incluir_servicos_adicionais?: boolean;
}

export const medicoesMensaisApi = {
  /**
   * Listar medições mensais com filtros
   */
  async listar(filters: MedicaoMensalFilters = {}): Promise<{ success: boolean; data: MedicaoMensal[]; pagination: any }> {
    const params = new URLSearchParams();
    
    if (filters.orcamento_id) params.append('orcamento_id', filters.orcamento_id.toString());
    if (filters.periodo) params.append('periodo', filters.periodo);
    if (filters.status) params.append('status', filters.status);
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters.data_fim) params.append('data_fim', filters.data_fim);
    if (filters.mes_referencia) params.append('mes_referencia', filters.mes_referencia.toString());
    if (filters.ano_referencia) params.append('ano_referencia', filters.ano_referencia.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/medicoes-mensais?${params.toString()}`);
    return response.data;
  },

  /**
   * Buscar medição mensal por ID
   */
  async obter(id: number): Promise<{ success: boolean; data: MedicaoMensal }> {
    const response = await api.get(`/medicoes-mensais/${id}`);
    return response.data;
  },

  /**
   * Criar nova medição mensal
   */
  async criar(medicao: MedicaoMensalCreate): Promise<{ success: boolean; data: MedicaoMensal; message: string }> {
    const response = await api.post('/medicoes-mensais', medicao);
    return response.data;
  },

  /**
   * Gerar medição mensal automaticamente a partir do orçamento
   */
  async gerarAutomatica(params: GerarMedicaoAutomaticaParams): Promise<{ success: boolean; data: MedicaoMensal; message: string }> {
    const response = await api.post('/medicoes-mensais/gerar-automatica', params);
    return response.data;
  },

  /**
   * Atualizar medição mensal
   */
  async atualizar(id: number, medicao: MedicaoMensalUpdate): Promise<{ success: boolean; data: MedicaoMensal; message: string }> {
    const response = await api.put(`/medicoes-mensais/${id}`, medicao);
    return response.data;
  },

  /**
   * Finalizar medição mensal
   */
  async finalizar(id: number): Promise<{ success: boolean; data: MedicaoMensal; message: string }> {
    const response = await api.patch(`/medicoes-mensais/${id}/finalizar`);
    return response.data;
  },

  /**
   * Listar todas as medições de um orçamento (histórico mensal)
   */
  async listarPorOrcamento(orcamento_id: number): Promise<{ success: boolean; data: MedicaoMensal[]; total: number }> {
    const response = await api.get(`/medicoes-mensais/orcamento/${orcamento_id}`);
    return response.data;
  },

  /**
   * Deletar medição mensal
   */
  async deletar(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/medicoes-mensais/${id}`);
    return response.data;
  }
};

