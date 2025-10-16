import api from './api';

export interface DocumentoAssinatura {
  id: number;
  titulo: string;
  tipo: string;
  data_criacao: string;
  status: 'rascunho' | 'aguardando_assinatura' | 'em_assinatura' | 'assinado' | 'rejeitado';
  descricao?: string;
  arquivo_original: string;
  arquivo_assinado?: string;
  caminho_arquivo: string;
  docu_sign_link?: string;
  docu_sign_envelope_id?: string;
  proximo_assinante_id?: string;
  created_by: string;
  obra_id?: number;
  assinaturas?: AssinaturaDocumento[];
}

export interface AssinaturaDocumento {
  id: number;
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
}

export interface AssinaturaPayload {
  assinatura: string; // Base64 da assinatura
  geoloc?: string;
  timestamp?: string;
  observacoes?: string;
}

export interface RecusaPayload {
  motivo: string;
  observacoes?: string;
}

/**
 * Busca documentos pendentes de assinatura para o usuário atual
 */
export const getDocumentosPendentes = async (): Promise<DocumentoAssinatura[]> => {
  const response = await api.get('/assinaturas/pendentes');
  return response.data;
};

/**
 * Busca um documento específico por ID
 */
export const getDocumentoById = async (id: number): Promise<DocumentoAssinatura> => {
  const response = await api.get(`/assinaturas/documento/${id}`);
  return response.data;
};

/**
 * Assina um documento digitalmente
 */
export const assinarDocumento = async (
  id: number, 
  payload: AssinaturaPayload
): Promise<DocumentoAssinatura> => {
  const response = await api.post(`/assinaturas/assinar/${id}`, payload);
  return response.data;
};

/**
 * Recusa um documento com justificativa
 */
export const recusarDocumento = async (
  id: number, 
  payload: RecusaPayload
): Promise<DocumentoAssinatura> => {
  const response = await api.post(`/assinaturas/recusar/${id}`, payload);
  return response.data;
};

/**
 * Busca histórico de assinaturas do usuário
 */
export const getHistoricoAssinaturas = async (): Promise<AssinaturaDocumento[]> => {
  const response = await api.get('/assinaturas/historico');
  return response.data;
};

/**
 * Busca todos os documentos (pendentes, assinados, rejeitados)
 */
export const getTodosDocumentos = async (): Promise<DocumentoAssinatura[]> => {
  const response = await api.get('/assinaturas/documentos');
  return response.data;
};

/**
 * Valida se um documento pode ser assinado pelo usuário atual
 */
export const validarAssinatura = async (id: number): Promise<{ valido: boolean, motivo?: string }> => {
  const response = await api.get(`/assinaturas/${id}/validar`);
  return response.data;
};

/**
 * Baixa um documento para visualização/download
 */
export const downloadDocumento = async (id: number): Promise<Blob> => {
  const response = await api.get(`/assinaturas/documento/${id}/download`, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Envia lembrete para assinantes pendentes
 */
export const enviarLembrete = async (documentoId: number): Promise<void> => {
  await api.post(`/assinaturas/${documentoId}/lembrete`);
};

/**
 * Cancela um documento (apenas criador)
 */
export const cancelarDocumento = async (id: number, motivo: string): Promise<void> => {
  await api.post(`/assinaturas/${id}/cancelar`, { motivo });
};

/**
 * Upload de arquivo assinado fisicamente
 */
export const uploadArquivoAssinado = async (
  assinaturaId: number, 
  arquivo: File, 
  observacoes?: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  const formData = new FormData();
  formData.append('arquivo', arquivo);
  if (observacoes) {
    formData.append('observacoes', observacoes);
  }

  const response = await api.post(`/assinaturas/${assinaturaId}/upload-assinado`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

/**
 * Download do arquivo assinado
 */
export const downloadArquivoAssinado = async (assinaturaId: number): Promise<Blob> => {
  const response = await api.get(`/assinaturas/${assinaturaId}/arquivo-assinado`, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Atualizar status da assinatura (para casos especiais)
 */
export const atualizarStatusAssinatura = async (
  assinaturaId: number,
  payload: { status: string; observacoes?: string }
): Promise<{ success: boolean; message: string }> => {
  const response = await api.put(`/assinaturas/${assinaturaId}/status`, payload);
  return response.data;
};

