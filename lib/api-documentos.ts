import api from './api';

export interface DocumentoFuncionario {
  id: string | number;
  documento_id: number;
  user_id: string;
  ordem: number;
  status: 'pendente' | 'aguardando' | 'assinado' | 'rejeitado';
  tipo: 'interno' | 'cliente';
  docu_sign_link?: string;
  docu_sign_envelope_id?: string;
  data_envio?: string;
  data_assinatura?: string;
  arquivo_assinado?: string;
  observacoes?: string;
  email_enviado: boolean;
  data_email_enviado?: string;
  created_at: string;
  updated_at: string;
  // Campos do documento relacionado
  titulo?: string;
  descricao?: string;
  arquivo_original?: string;
  data_criacao?: string;
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
 * Retorna documentos de obras onde o funcionário é assinante
 */
export const getDocumentosFuncionario = async (funcionarioId: number | string): Promise<any[]> => {
  const response = await api.get(`/funcionarios/${funcionarioId}/documentos`);
  // A API retorna { success: true, data: [...], funcionario: "...", total: N }
  if (response.data && response.data.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  // Fallback para formato antigo
  return response.data.data || response.data || [];
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
  assinaturaId: string | number,
  payload: AssinarDocumentoPayload
): Promise<DocumentoFuncionario> => {
  // const response = await api.post(`/funcionarios/documentos/${documentoId}/assinar`, payload);
  const response = await api.post(`/assinaturas/assinar/${assinaturaId}`, {
    assinatura: payload.assinatura,
    geoloc: payload.geoloc,
    timestamp: payload.timestamp
  });
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
  const response = await api.get('/assinaturas/pendentes');
  return response.data.data || response.data;
};

