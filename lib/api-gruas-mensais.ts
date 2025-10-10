import api from './api';

export interface GruaMensal {
  id: number;
  grua_id: string;
  grua_name?: string;
  grua_modelo?: string;
  mes: string; // formato YYYY-MM
  ano: number;
  obra_id: number | null;
  obra_name?: string;
  status: 'disponivel' | 'em_obra' | 'manutencao' | 'inativa';
  horas_trabalhadas: number;
  horas_disponiveis: number;
  horas_manutencao: number;
  eficiencia: number; // porcentagem 0-100
  custo_hora: number;
  custo_total: number;
  custo_operacional: number;
  receita_gerada: number;
  taxa_utilizacao: number; // porcentagem 0-100
  tempo_inatividade: number;
  manutencoes_realizadas: number;
  responsavel_id: number | null;
  responsavel_name?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface GruaMensalCreate {
  grua_id: string;
  mes: string;
  ano: number;
  obra_id?: number | null;
  status?: 'disponivel' | 'em_obra' | 'manutencao' | 'inativa';
  horas_trabalhadas?: number;
  horas_disponiveis?: number;
  horas_manutencao?: number;
  custo_hora?: number;
  responsavel_id?: number | null;
  observacoes?: string;
}

export interface GruaMensalUpdate {
  obra_id?: number | null;
  status?: 'disponivel' | 'em_obra' | 'manutencao' | 'inativa';
  horas_trabalhadas?: number;
  horas_disponiveis?: number;
  horas_manutencao?: number;
  custo_hora?: number;
  custo_operacional?: number;
  receita_gerada?: number;
  manutencoes_realizadas?: number;
  responsavel_id?: number | null;
  observacoes?: string;
}

export interface EstatisticasGruasMes {
  total_gruas: number;
  total_horas_trabalhadas: number;
  total_horas_disponiveis: number;
  total_custo: number;
  total_receita: number;
  eficiencia_media: number;
  utilizacao_media: number;
  gruas_em_obra: number;
  gruas_manutencao: number;
  gruas_disponiveis: number;
  gruas_inativas: number;
}

export interface FiltrosGruasMensais {
  mes?: string;
  ano?: number;
  grua_id?: string;
  status?: string;
  obra_id?: number;
}

/**
 * Lista gruas mensais com filtros opcionais
 */
export const getGruasMensais = async (filtros?: FiltrosGruasMensais): Promise<GruaMensal[]> => {
  const params = new URLSearchParams();
  
  if (filtros?.mes) params.append('mes', filtros.mes);
  if (filtros?.ano) params.append('ano', filtros.ano.toString());
  if (filtros?.grua_id) params.append('grua_id', filtros.grua_id);
  if (filtros?.status) params.append('status', filtros.status);
  if (filtros?.obra_id) params.append('obra_id', filtros.obra_id.toString());
  
  const queryString = params.toString();
  const url = queryString ? `/gruas-mensais?${queryString}` : '/gruas-mensais';
  
  const response = await api.get(url);
  return response.data;
};

/**
 * Busca uma grua mensal por ID
 */
export const getGruaMensalById = async (id: number): Promise<GruaMensal> => {
  const response = await api.get(`/gruas-mensais/${id}`);
  return response.data;
};

/**
 * Cria um novo registro mensal de grua
 */
export const createGruaMensal = async (data: GruaMensalCreate): Promise<GruaMensal> => {
  const response = await api.post('/gruas-mensais', data);
  return response.data;
};

/**
 * Atualiza um registro mensal de grua
 */
export const updateGruaMensal = async (id: number, data: GruaMensalUpdate): Promise<GruaMensal> => {
  const response = await api.put(`/gruas-mensais/${id}`, data);
  return response.data;
};

/**
 * Deleta um registro mensal de grua
 */
export const deleteGruaMensal = async (id: number): Promise<void> => {
  await api.delete(`/gruas-mensais/${id}`);
};

/**
 * Retorna estatísticas agregadas de todas as gruas em um mês
 */
export const getEstatisticasGruasMes = async (mes: string): Promise<EstatisticasGruasMes> => {
  const response = await api.get(`/gruas-mensais/estatisticas/${mes}`);
  return response.data;
};

/**
 * Retorna ranking de gruas por eficiência/receita/horas
 */
export const getRankingGruas = async (
  mes: string,
  orderBy: 'eficiencia' | 'receita_gerada' | 'horas_trabalhadas' = 'eficiencia'
): Promise<GruaMensal[]> => {
  const response = await api.get(`/gruas-mensais/ranking/${mes}?orderBy=${orderBy}`);
  return response.data;
};

/**
 * Retorna histórico mensal de uma grua específica
 */
export const getHistoricoGrua = async (grua_id: string, limit: number = 12): Promise<GruaMensal[]> => {
  const response = await api.get(`/gruas-mensais/grua/${grua_id}/historico?limit=${limit}`);
  return response.data;
};

/**
 * Inicializa registros mensais para todas as gruas
 */
export const inicializarMes = async (mes: string, ano: number): Promise<{ message: string; registros: GruaMensal[] }> => {
  const response = await api.post('/gruas-mensais/inicializar-mes', { mes, ano });
  return response.data;
};

