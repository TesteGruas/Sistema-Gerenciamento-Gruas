import api from './api';

export interface FuncionarioEncarregador {
  id: number;
  nome: string;
  cargo: string;
  turno: string;
  status: 'Ativo' | 'Inativo' | 'Férias';
  obra_id?: number;
}

export interface RegistroPontoEncarregador {
  id: string;
  funcionario_id: number;
  data: string;
  entrada?: string;
  saida_almoco?: string;
  volta_almoco?: string;
  saida?: string;
  horas_trabalhadas: number;
  horas_extras: number;
  status: string;
  aprovado_por?: number;
  data_aprovacao?: string;
  observacoes?: string;
  funcionario?: FuncionarioEncarregador;
}

export interface AprovarRegistroPayload {
  observacoes_aprovacao?: string;
}

export interface RejeitarRegistroPayload {
  motivo_rejeicao: string;
}

/**
 * Buscar funcionários da obra do encarregador
 */
export const getFuncionariosDaObra = async (obraId: number): Promise<FuncionarioEncarregador[]> => {
  const response = await api.get(`/funcionarios/obra/${obraId}`);
  return response.data.data || response.data;
};

/**
 * Buscar registros pendentes de aprovação
 */
export const getRegistrosPendentes = async (aprovadorId: number): Promise<RegistroPontoEncarregador[]> => {
  const response = await api.get('/ponto-eletronico/registros', {
    params: {
      status: 'Pendente Aprovação',
      aprovador_id: aprovadorId
    }
  });
  return response.data.data || response.data;
};

/**
 * Aprovar um registro de ponto
 */
export const aprovarRegistro = async (
  registroId: string, 
  payload: AprovarRegistroPayload
): Promise<RegistroPontoEncarregador> => {
  const response = await api.post(`/ponto-eletronico/registros/${registroId}/aprovar`, payload);
  return response.data.data || response.data;
};

/**
 * Rejeitar um registro de ponto
 */
export const rejeitarRegistro = async (
  registroId: string, 
  payload: RejeitarRegistroPayload
): Promise<RegistroPontoEncarregador> => {
  const response = await api.post(`/ponto-eletronico/registros/${registroId}/rejeitar`, payload);
  return response.data.data || response.data;
};

/**
 * Buscar escalas da obra
 */
export const getEscalasDaObra = async (obraId: number): Promise<any[]> => {
  const response = await api.get(`/ponto-eletronico/escalas/${obraId}`);
  return response.data.data || response.data;
};

