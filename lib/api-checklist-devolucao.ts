import api from './api';

export interface ChecklistDevolucaoItem {
  id: number;
  checklist_id: number;
  componente_id: number | null;
  componente_nome?: string;
  peca_nome: string;
  peca_tipo: string;
  quantidade_enviada: number;
  quantidade_devolvida: number;
  quantidade_faltante: number;
  condicao: 'ok' | 'danificado' | 'necessita_reparo' | 'perda_total';
  custo_reparo: number;
  descricao_dano?: string;
  fotos: string[];
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistDevolucao {
  id: number;
  obra_id: number;
  obra_nome?: string;
  grua_id: string;
  grua_nome?: string;
  grua_modelo?: string;
  numero_checklist: string;
  data_devolucao: string;
  status: 'em_andamento' | 'finalizado' | 'cancelado';
  responsavel_entrega?: string;
  responsavel_recebimento?: string;
  observacoes_gerais?: string;
  fotos: string[];
  assinatura_digital?: string;
  total_itens?: number;
  itens_ok?: number;
  itens_danificados?: number;
  total_faltantes?: number;
  custo_total_reparos?: number;
  itens?: ChecklistDevolucaoItem[];
  created_at: string;
  updated_at: string;
}

export interface ChecklistDevolucaoCreate {
  obra_id: number;
  grua_id: string;
  data_devolucao: string;
  responsavel_entrega?: string;
  responsavel_recebimento?: string;
  observacoes_gerais?: string;
}

export interface ChecklistDevolucaoUpdate {
  status?: 'em_andamento' | 'finalizado' | 'cancelado';
  responsavel_entrega?: string;
  responsavel_recebimento?: string;
  observacoes_gerais?: string;
  assinatura_digital?: string;
}

export interface ChecklistItemCreate {
  componente_id?: number | null;
  peca_nome: string;
  peca_tipo?: string;
  quantidade_enviada: number;
  quantidade_devolvida?: number;
  condicao?: 'ok' | 'danificado' | 'necessita_reparo' | 'perda_total';
  custo_reparo?: number;
  descricao_dano?: string;
  observacoes?: string;
}

export interface ChecklistItemUpdate {
  quantidade_devolvida?: number;
  condicao?: 'ok' | 'danificado' | 'necessita_reparo' | 'perda_total';
  custo_reparo?: number;
  descricao_dano?: string;
  observacoes?: string;
}

export interface FiltrosChecklist {
  obra_id?: number;
  grua_id?: string;
  status?: string;
}

/**
 * Lista todos os checklists de devolução com filtros opcionais
 */
export const getChecklists = async (filtros?: FiltrosChecklist): Promise<ChecklistDevolucao[]> => {
  const params = new URLSearchParams();
  
  if (filtros?.obra_id) params.append('obra_id', filtros.obra_id.toString());
  if (filtros?.grua_id) params.append('grua_id', filtros.grua_id);
  if (filtros?.status) params.append('status', filtros.status);
  
  const queryString = params.toString();
  const url = queryString ? `/checklist-devolucao?${queryString}` : '/checklist-devolucao';
  
  const response = await api.get(url);
  return response.data;
};

/**
 * Busca um checklist por ID
 */
export const getChecklistById = async (id: number): Promise<ChecklistDevolucao> => {
  const response = await api.get(`/checklist-devolucao/${id}`);
  return response.data;
};

/**
 * Cria um novo checklist de devolução
 */
export const createChecklist = async (data: ChecklistDevolucaoCreate): Promise<ChecklistDevolucao> => {
  const response = await api.post('/checklist-devolucao', data);
  return response.data;
};

/**
 * Atualiza um checklist
 */
export const updateChecklist = async (id: number, data: ChecklistDevolucaoUpdate): Promise<ChecklistDevolucao> => {
  const response = await api.put(`/checklist-devolucao/${id}`, data);
  return response.data;
};

/**
 * Deleta um checklist
 */
export const deleteChecklist = async (id: number): Promise<void> => {
  await api.delete(`/checklist-devolucao/${id}`);
};

/**
 * Finaliza um checklist
 */
export const finalizarChecklist = async (id: number): Promise<ChecklistDevolucao> => {
  const response = await api.post(`/checklist-devolucao/${id}/finalizar`);
  return response.data;
};

/**
 * Lista itens de um checklist
 */
export const getItensChecklist = async (checklistId: number): Promise<ChecklistDevolucaoItem[]> => {
  const response = await api.get(`/checklist-devolucao/${checklistId}/itens`);
  return response.data;
};

/**
 * Adiciona item ao checklist
 */
export const addItemChecklist = async (checklistId: number, data: ChecklistItemCreate): Promise<ChecklistDevolucaoItem> => {
  const response = await api.post(`/checklist-devolucao/${checklistId}/itens`, data);
  return response.data;
};

/**
 * Atualiza item do checklist
 */
export const updateItemChecklist = async (itemId: number, data: ChecklistItemUpdate): Promise<ChecklistDevolucaoItem> => {
  const response = await api.put(`/checklist-devolucao/item/${itemId}`, data);
  return response.data;
};

/**
 * Histórico de devoluções de uma grua
 */
export const getHistoricoGrua = async (gruaId: string): Promise<ChecklistDevolucao[]> => {
  const response = await api.get(`/checklist-devolucao/historico/${gruaId}`);
  return response.data;
};

