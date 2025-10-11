import api from './api';

export interface RegistroPonto {
  id?: string | number;
  funcionario_id: number;
  data: string;
  entrada?: string;
  saida_almoco?: string;
  volta_almoco?: string;
  saida?: string;
  localizacao?: string;
  horas_trabalhadas?: number;
  horas_extras?: number;
  status?: string;
  aprovado_por?: number;
  data_aprovacao?: string;
  observacoes?: string;
  justificativa_alteracao?: string;
}

export interface RegistroPontoPayload {
  funcionario_id: number;
  data: string;
  entrada?: string;
  saida_almoco?: string;
  volta_almoco?: string;
  saida?: string;
  localizacao?: string;
  justificativa_alteracao?: string;
}

/**
 * Buscar registros de ponto por período
 */
export const getRegistros = async (params: {
  funcionario_id?: number;
  data_inicio?: string;
  data_fim?: string;
  status?: string;
  aprovador_id?: number;
}): Promise<RegistroPonto[]> => {
  const response = await api.get('/api/ponto-eletronico/registros', { params });
  return response.data.data || response.data;
};

/**
 * Buscar um registro específico
 */
export const getRegistroById = async (registroId: string | number): Promise<RegistroPonto> => {
  const response = await api.get(`/api/ponto-eletronico/registros/${registroId}`);
  return response.data.data || response.data;
};

/**
 * Criar um novo registro de ponto
 */
export const criarRegistro = async (payload: RegistroPontoPayload): Promise<RegistroPonto> => {
  const response = await api.post('/api/ponto-eletronico/registros', payload);
  return response.data.data || response.data;
};

/**
 * Atualizar um registro de ponto existente
 */
export const atualizarRegistro = async (
  registroId: string | number,
  payload: Partial<RegistroPontoPayload>
): Promise<RegistroPonto> => {
  const response = await api.put(`/api/ponto-eletronico/registros/${registroId}`, payload);
  return response.data.data || response.data;
};

/**
 * Deletar um registro de ponto
 */
export const deletarRegistro = async (registroId: string | number): Promise<void> => {
  await api.delete(`/api/ponto-eletronico/registros/${registroId}`);
};

/**
 * Aprovar um registro de ponto
 */
export const aprovarRegistro = async (
  registroId: string | number,
  observacoes?: string
): Promise<RegistroPonto> => {
  const response = await api.post(`/api/ponto-eletronico/registros/${registroId}/aprovar`, {
    observacoes_aprovacao: observacoes
  });
  return response.data.data || response.data;
};

/**
 * Rejeitar um registro de ponto
 */
export const rejeitarRegistro = async (
  registroId: string | number,
  motivo: string
): Promise<RegistroPonto> => {
  const response = await api.post(`/api/ponto-eletronico/registros/${registroId}/rejeitar`, {
    motivo_rejeicao: motivo
  });
  return response.data.data || response.data;
};

/**
 * Buscar o espelho de ponto de um funcionário
 */
export const getEspelhoPonto = async (params: {
  funcionario_id: number;
  mes: number;
  ano: number;
}): Promise<any> => {
  const response = await api.get('/api/ponto-eletronico/espelho', { params });
  return response.data.data || response.data;
};
