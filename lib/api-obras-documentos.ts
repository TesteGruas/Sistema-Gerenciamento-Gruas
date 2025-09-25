import api from './api'

export interface DocumentoObra {
  id: number
  obra_id: number
  obra_nome: string
  titulo: string
  descricao?: string
  arquivo_original: string
  arquivo_assinado?: string
  caminho_arquivo: string
  docu_sign_link?: string
  docu_sign_envelope_id?: string
  status: 'rascunho' | 'aguardando_assinatura' | 'em_assinatura' | 'assinado' | 'rejeitado'
  proximo_assinante_id?: number
  proximo_assinante_nome?: string
  created_by: number
  created_by_nome: string
  created_at: string
  updated_at: string
  total_assinantes: number
  assinaturas_concluidas: number
  progresso_percentual: number
  assinaturas: AssinaturaDocumento[]
  historico: HistoricoDocumento[]
  ordemAssinatura?: AssinaturaDocumento[]
  historicoAssinaturas?: HistoricoDocumento[]
}

export interface AssinaturaDocumento {
  id: number
  documento_id: number
  user_id: number
  ordem: number
  status: 'pendente' | 'aguardando' | 'assinado' | 'rejeitado'
  tipo: 'interno' | 'cliente'
  docu_sign_link?: string
  docu_sign_envelope_id?: string
  data_envio?: string
  data_assinatura?: string
  arquivo_assinado?: string
  observacoes?: string
  email_enviado: boolean
  data_email_enviado?: string
  created_at: string
  updated_at: string
  user_nome?: string
  user_email?: string
  user_cargo?: string
  usuario?: {
    id: number
    nome: string
    email: string
    role: string
  }
  users?: {
    id: number
    nome: string
    email: string
    role: string
  }
}

export interface HistoricoDocumento {
  id: number
  documento_id: number
  user_id: number
  acao: 'criado' | 'enviado' | 'assinou' | 'rejeitou' | 'cancelou'
  data_acao: string
  arquivo_gerado?: string
  observacoes?: string
  ip_address?: string
  user_agent?: string
  user_nome?: string
  user_email?: string
  user_role?: string
}

export interface DocumentoCreate {
  titulo: string
  descricao?: string
  arquivo: File
  ordem_assinatura: Array<{
    user_id: number
    ordem: number
    tipo: 'interno' | 'cliente'
    docu_sign_link?: string
    status?: 'pendente' | 'aguardando' | 'assinado' | 'rejeitado'
  }>
}

export interface DocumentoUpdate {
  titulo?: string
  descricao?: string
  status?: string
}

export interface DocumentoResponse {
  success: boolean
  data: DocumentoObra | DocumentoObra[]
  message?: string
}

export const obrasDocumentosApi = {
  // Listar documentos de uma obra
  async listarPorObra(obraId: number, status?: string): Promise<DocumentoResponse> {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    
    const response = await api.get(`/obras/${obraId}/documentos?${params.toString()}`)
    return response.data
  },

  // Listar todos os documentos
  async listarTodos(params?: {
    status?: string
    obra_id?: number
  }): Promise<DocumentoResponse> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.obra_id) queryParams.append('obra_id', params.obra_id.toString())
    
    const url = `/obras/documentos/todos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)
    return response.data
  },

  // Obter documento específico por obra
  async obter(obraId: number, documentoId: number): Promise<DocumentoResponse> {
    const response = await api.get(`/obras/${obraId}/documentos/${documentoId}`)
    return response.data
  },

  // Obter documento específico (geral)
  async obterPorId(documentoId: number): Promise<DocumentoResponse> {
    const response = await api.get(`/obras/documentos/${documentoId}`)
    return response.data
  },

  // Criar novo documento
  async criar(obraId: number, dados: DocumentoCreate): Promise<DocumentoResponse> {
    const formData = new FormData()
    formData.append('titulo', dados.titulo)
    if (dados.descricao) formData.append('descricao', dados.descricao)
    formData.append('arquivo', dados.arquivo)
    formData.append('ordem_assinatura', JSON.stringify(dados.ordem_assinatura))

    const response = await api.post(`/obras/${obraId}/documentos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Enviar documento para assinatura
  async enviarParaAssinatura(obraId: number, documentoId: number): Promise<DocumentoResponse> {
    const response = await api.post(`/obras/${obraId}/documentos/${documentoId}/enviar`)
    return response.data
  },

  // Atualizar documento
  async atualizar(obraId: number, documentoId: number, dados: DocumentoUpdate): Promise<DocumentoResponse> {
    const response = await api.put(`/obras/${obraId}/documentos/${documentoId}`, dados)
    return response.data
  },

  // Excluir documento
  async excluir(obraId: number, documentoId: number): Promise<DocumentoResponse> {
    const response = await api.delete(`/obras/${obraId}/documentos/${documentoId}`)
    return response.data
  },

  // Download do arquivo
  async download(obraId: number, documentoId: number): Promise<{ download_url: string; nome_arquivo: string }> {
    const response = await api.get(`/obras/${obraId}/documentos/${documentoId}/download`)
    return response.data.data
  },

  // Obter URL de download direto
  async obterUrlDownload(obraId: number, documentoId: number): Promise<string> {
    const dados = await this.download(obraId, documentoId)
    return dados.download_url
  },

  // Atualizar documento
  async atualizar(obraId: number, documentoId: number, dados: {
    titulo?: string
    descricao?: string
    status?: 'rascunho' | 'aguardando_assinatura' | 'em_assinatura' | 'assinado' | 'rejeitado'
  }): Promise<DocumentoResponse> {
    const response = await api.put(`/obras/${obraId}/documentos/${documentoId}`, dados)
    return response.data
  }
}

export default obrasDocumentosApi
