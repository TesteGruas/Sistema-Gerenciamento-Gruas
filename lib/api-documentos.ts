import api from './api';

export interface DocumentoFuncionario {
  id: string | number;
  nome: string;
  tipo: string;
  status: 'pendente' | 'assinado' | 'rejeitado';
  data_criacao: string;
  data_vencimento?: string;
  descricao?: string;
  arquivo_url?: string;
  assinatura_url?: string;
  funcionario_id: number;
  funcionario_nome?: string;
  caminho_arquivo?: string;
}

export interface AssinarDocumentoPayload {
  assinatura: string; // Base64 da assinatura
  funcionario_id: number;
  geoloc?: string;
  timestamp?: string;
}

export interface UploadDocumentoPayload {
  file: File;
  nome: string;
  tipo: string;
  descricao?: string;
  funcionario_id: number;
}

/**
 * Buscar documentos de um funcionário específico
 */
export const getDocumentosFuncionario = async (funcionarioId: number): Promise<DocumentoFuncionario[]> => {
  const response = await api.get(`/funcionarios/${funcionarioId}/documentos`);
  return response.data.data || response.data;
};

/**
 * Buscar um documento específico pelo ID
 */
export const getDocumentoById = async (documentoId: string | number): Promise<DocumentoFuncionario> => {
  const response = await api.get(`/funcionarios/documentos/${documentoId}`);
  return response.data.data || response.data;
};

/**
 * Assinar um documento
 */
export const assinarDocumento = async (
  documentoId: string | number,
  payload: AssinarDocumentoPayload
): Promise<DocumentoFuncionario> => {
  const response = await api.post(`/funcionarios/documentos/${documentoId}/assinar`, payload);
  return response.data.data || response.data;
};

/**
 * Fazer upload de um novo documento
 */
export const uploadDocumento = async (payload: UploadDocumentoPayload): Promise<DocumentoFuncionario> => {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('nome', payload.nome);
  formData.append('tipo', payload.tipo);
  formData.append('funcionario_id', payload.funcionario_id.toString());
  
  if (payload.descricao) {
    formData.append('descricao', payload.descricao);
  }

  const response = await api.post('/funcionarios/documentos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data.data || response.data;
};

/**
 * Baixar um documento
 */
export const downloadDocumento = async (documentoId: string | number): Promise<Blob> => {
  const response = await api.get(`/funcionarios/documentos/${documentoId}/download`, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Deletar um documento
 */
export const deletarDocumento = async (documentoId: string | number): Promise<void> => {
  await api.delete(`/funcionarios/documentos/${documentoId}`);
};

/**
 * Buscar todos os documentos pendentes de assinatura do usuário logado
 */
export const getDocumentosPendentes = async (): Promise<DocumentoFuncionario[]> => {
  const response = await api.get('/funcionarios/documentos/pendentes');
  return response.data.data || response.data;
};

