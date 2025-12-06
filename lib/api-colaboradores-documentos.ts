// API client para documentos de colaboradores (certificados, documentos admissionais, holerites)
import { buildApiUrl, fetchWithAuth } from './api.ts'

// ==================== CERTIFICADOS ====================

export interface CertificadoBackend {
  id: string
  funcionario_id: number
  tipo: string
  nome: string
  data_validade?: string
  arquivo?: string
  alerta_enviado: boolean
  assinatura_digital?: string
  assinado_por?: number
  assinado_em?: string
  created_at: string
  updated_at: string
}

export interface CertificadoCreateData {
  tipo: string
  nome: string
  data_validade?: string
  arquivo?: string
}

export interface CertificadoUpdateData {
  tipo?: string
  nome?: string
  data_validade?: string
  arquivo?: string
}

export interface CertificadoAssinaturaData {
  assinatura_digital: string
}

export interface CertificadosResponse {
  success: boolean
  data: CertificadoBackend[]
}

export interface CertificadoResponse {
  success: boolean
  data: CertificadoBackend
}

// ==================== DOCUMENTOS ADMISSIONAIS ====================

export interface DocumentoAdmissionalBackend {
  id: string
  funcionario_id: number
  tipo: string
  data_validade?: string
  arquivo: string
  alerta_enviado: boolean
  created_at: string
  updated_at: string
}

export interface DocumentoAdmissionalCreateData {
  tipo: string
  data_validade?: string
  arquivo: string
}

export interface DocumentoAdmissionalUpdateData {
  tipo?: string
  data_validade?: string
  arquivo?: string
}

export interface DocumentosAdmissionaisResponse {
  success: boolean
  data: DocumentoAdmissionalBackend[]
}

export interface DocumentoAdmissionalResponse {
  success: boolean
  data: DocumentoAdmissionalBackend
}

// ==================== HOLERITES ====================

export interface HoleriteBackend {
  id: string
  funcionario_id: number
  mes_referencia: string // formato YYYY-MM
  arquivo: string
  assinatura_digital?: string
  assinado_por?: number
  assinado_em?: string
  created_at: string
  updated_at: string
}

export interface HoleriteCreateData {
  mes_referencia: string // formato YYYY-MM
  arquivo: string
}

export interface HoleriteAssinaturaData {
  assinatura_digital: string
}

export interface HoleritesResponse {
  success: boolean
  data: HoleriteBackend[]
}

export interface HoleriteResponse {
  success: boolean
  data: HoleriteBackend
}

// ==================== FUNÇÕES AUXILIARES ====================

const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    console.log('[API-REQUEST] Fazendo requisição para:', url)
    console.log('[API-REQUEST] Opções:', { method: options.method || 'GET', headers: options.headers })
    
    const response = await fetchWithAuth(url, options)
    
    console.log('[API-REQUEST] Resposta recebida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[API-REQUEST] Erro na resposta:', errorData)
      throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('[API-REQUEST] Dados recebidos:', data)
    return data
  } catch (error) {
    console.error('[API-REQUEST] Erro na requisição:', error)
    throw error
  }
}

// ==================== API FUNCTIONS ====================

export const colaboradoresDocumentosApi = {
  // ==================== CERTIFICADOS ====================
  certificados: {
    // Listar certificados do colaborador
    async listar(colaboradorId: number): Promise<CertificadosResponse> {
      const url = buildApiUrl(`colaboradores/${colaboradorId}/certificados`)
      return apiRequest(url)
    },

    // Criar certificado
    async criar(colaboradorId: number, data: CertificadoCreateData): Promise<CertificadoResponse> {
      const url = buildApiUrl(`colaboradores/${colaboradorId}/certificados`)
      return apiRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    },

    // Atualizar certificado
    async atualizar(certificadoId: string, data: CertificadoUpdateData): Promise<CertificadoResponse> {
      const url = buildApiUrl(`colaboradores/certificados/${certificadoId}`)
      return apiRequest(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    },

    // Excluir certificado
    async excluir(certificadoId: string): Promise<{ success: boolean; message: string }> {
      const url = buildApiUrl(`colaboradores/certificados/${certificadoId}`)
      return apiRequest(url, {
        method: 'DELETE',
      })
    },

    // Listar certificados vencendo em até 30 dias
    async listarVencendo(): Promise<CertificadosResponse> {
      const url = buildApiUrl('colaboradores/certificados/vencendo')
      return apiRequest(url)
    },

    // Adicionar assinatura digital ao certificado
    async assinar(certificadoId: string, data: CertificadoAssinaturaData): Promise<CertificadoResponse> {
      const url = buildApiUrl(`colaboradores/certificados/${certificadoId}/assinatura`)
      return apiRequest(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    },

    // Baixar certificado (com opção de incluir assinatura)
    async baixar(certificadoId: string, comAssinatura: boolean = false): Promise<Blob> {
      const url = buildApiUrl(`colaboradores/certificados/${certificadoId}/download`)
      const params = comAssinatura ? { comAssinatura: 'true' } : {}
      
      const response = await fetchWithAuth(url + (Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : ''), {
        method: 'GET',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`)
      }
      
      return await response.blob()
    },
  },

  // ==================== DOCUMENTOS ADMISSIONAIS ====================
  documentosAdmissionais: {
    // Listar documentos admissionais do colaborador
    async listar(colaboradorId: number): Promise<DocumentosAdmissionaisResponse> {
      const url = buildApiUrl(`colaboradores/${colaboradorId}/documentos-admissionais`)
      return apiRequest(url)
    },

    // Criar documento admissional
    async criar(colaboradorId: number, data: DocumentoAdmissionalCreateData): Promise<DocumentoAdmissionalResponse> {
      const url = buildApiUrl(`colaboradores/${colaboradorId}/documentos-admissionais`)
      return apiRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    },

    // Atualizar documento admissional
    async atualizar(documentoId: string, data: DocumentoAdmissionalUpdateData): Promise<DocumentoAdmissionalResponse> {
      const url = buildApiUrl(`colaboradores/documentos-admissionais/${documentoId}`)
      return apiRequest(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    },

    // Excluir documento admissional
    async excluir(documentoId: string): Promise<{ success: boolean; message: string }> {
      const url = buildApiUrl(`colaboradores/documentos-admissionais/${documentoId}`)
      return apiRequest(url, {
        method: 'DELETE',
      })
    },

    // Listar documentos admissionais vencendo em até 30 dias
    async listarVencendo(): Promise<DocumentosAdmissionaisResponse> {
      const url = buildApiUrl('colaboradores/documentos-admissionais/vencendo')
      return apiRequest(url)
    },
  },

  // ==================== HOLERITES ====================
  holerites: {
    // Listar holerites do colaborador
    async listar(colaboradorId: number): Promise<HoleritesResponse> {
      const url = buildApiUrl(`colaboradores/${colaboradorId}/holerites`)
      return apiRequest(url)
    },

    // Criar ou atualizar holerite
    async criar(colaboradorId: number, data: HoleriteCreateData): Promise<HoleriteResponse> {
      const url = buildApiUrl(`colaboradores/${colaboradorId}/holerites`)
      return apiRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    },

    // Adicionar assinatura digital ao holerite
    async assinar(holeriteId: string, data: HoleriteAssinaturaData): Promise<HoleriteResponse> {
      const url = buildApiUrl(`colaboradores/holerites/${holeriteId}/assinatura`)
      return apiRequest(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    },

    // Excluir holerite
    async excluir(holeriteId: string): Promise<{ success: boolean; message: string }> {
      const url = buildApiUrl(`colaboradores/holerites/${holeriteId}`)
      return apiRequest(url, {
        method: 'DELETE',
      })
    },

    // Baixar holerite (com opção de incluir assinatura)
    async baixar(holeriteId: string, comAssinatura: boolean = false): Promise<Blob> {
      const url = buildApiUrl(`colaboradores/holerites/${holeriteId}/download`)
      const params = comAssinatura ? { comAssinatura: 'true' } : {}
      
      const response = await fetchWithAuth(url + (Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : ''), {
        method: 'GET',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`)
      }
      
      return await response.blob()
    },
  },
}

// Funções de conversão (se necessário para compatibilidade com frontend)
export const converterCertificadoBackendParaFrontend = (
  backend: CertificadoBackend
): CertificadoBackend => {
  return backend
}

export const converterDocumentoAdmissionalBackendParaFrontend = (
  backend: DocumentoAdmissionalBackend
): DocumentoAdmissionalBackend => {
  return backend
}

export const converterHoleriteBackendParaFrontend = (
  backend: HoleriteBackend
): HoleriteBackend => {
  return backend
}

export default colaboradoresDocumentosApi

