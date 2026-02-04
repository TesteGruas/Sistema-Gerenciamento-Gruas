// API client para sinaleiros e documentos
import { buildApiUrl, fetchWithAuth } from './api.ts'

// Interfaces baseadas no backend
export interface SinaleiroBackend {
  id: string
  obra_id: number
  nome: string
  rg_cpf: string
  telefone?: string
  email?: string
  tipo: 'principal' | 'reserva'
  created_at: string
  updated_at: string
}

export interface DocumentoSinaleiroBackend {
  id: string
  sinaleiro_id: string
  tipo: string
  arquivo: string
  data_validade?: string
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'vencido'
  aprovado_por?: number
  aprovado_em?: string
  alerta_enviado: boolean
  created_at: string
}

export interface SinaleiroCreateData {
  id?: string
  nome: string
  rg_cpf: string
  telefone?: string
  email?: string
  tipo: 'principal' | 'reserva'
}

export interface DocumentoSinaleiroCreateData {
  tipo: string
  arquivo: string
  data_validade?: string
}

export interface DocumentoSinaleiroAprovarData {
  status: 'aprovado' | 'rejeitado'
  comentarios?: string
}

export interface SinaleirosResponse {
  success: boolean
  data: SinaleiroBackend[]
}

export interface DocumentosSinaleiroResponse {
  success: boolean
  data: DocumentoSinaleiroBackend[]
}

export interface DocumentoSinaleiroResponse {
  success: boolean
  data: DocumentoSinaleiroBackend
}

// Função para fazer requisições autenticadas
const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    console.log('🌐 [apiRequest] Fazendo requisição:', {
      url,
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body ? JSON.parse(options.body as string) : null
    })
    
    const response = await fetchWithAuth(url, options)
    
    console.log('📥 [apiRequest] Resposta recebida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ [apiRequest] Erro na resposta:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      })
      throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('✅ [apiRequest] Dados recebidos:', data)
    return data
  } catch (error) {
    console.error('❌ [apiRequest] Erro na requisição:', error)
    console.error('   - URL:', url)
    console.error('   - Options:', options)
    throw error
  }
}

// API functions
export const sinaleirosApi = {
  // Listar sinaleiros de uma obra
  async listarPorObra(obraId: number): Promise<SinaleirosResponse> {
    const url = buildApiUrl(`obras/${obraId}/sinaleiros`)
    return apiRequest(url)
  },

  // Criar ou atualizar sinaleiros de uma obra
  async criarOuAtualizar(obraId: number, sinaleiros: SinaleiroCreateData[]): Promise<SinaleirosResponse> {
    const url = buildApiUrl(`obras/${obraId}/sinaleiros`)
    
    console.log('🌐 [API Sinaleiros] Chamando API para criar/atualizar sinaleiros:')
    console.log('   - URL:', url)
    console.log('   - Obra ID:', obraId)
    console.log('   - Quantidade de sinaleiros:', sinaleiros.length)
    console.log('   - Dados dos sinaleiros:', JSON.stringify(sinaleiros, null, 2))
    
    try {
      const response = await apiRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sinaleiros }),
      })
      
      console.log('✅ [API Sinaleiros] Resposta da API:', response)
      return response
    } catch (error: any) {
      console.error('❌ [API Sinaleiros] Erro na chamada da API:', error)
      console.error('   - URL chamada:', url)
      console.error('   - Dados enviados:', JSON.stringify({ sinaleiros }, null, 2))
      throw error
    }
  },

  // Listar documentos de um sinaleiro
  async listarDocumentos(sinaleiroId: string): Promise<DocumentosSinaleiroResponse> {
    const url = buildApiUrl(`obras/sinaleiros/${sinaleiroId}/documentos`)
    return apiRequest(url)
  },

  // Criar documento de um sinaleiro
  async criarDocumento(sinaleiroId: string, data: DocumentoSinaleiroCreateData): Promise<DocumentoSinaleiroResponse> {
    const url = buildApiUrl(`obras/sinaleiros/${sinaleiroId}/documentos`)
    return apiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  },

  // Aprovar ou rejeitar documento de um sinaleiro
  async aprovarDocumento(documentoId: string, data: DocumentoSinaleiroAprovarData): Promise<DocumentoSinaleiroResponse> {
    const url = buildApiUrl(`obras/documentos-sinaleiro/${documentoId}/aprovar`)
    return apiRequest(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  },

  // Validar se sinaleiro tem documentos completos
  async validarDocumentosCompletos(sinaleiroId: string): Promise<{ success: boolean; completo: boolean; documentosFaltando?: string[] }> {
    try {
      const url = buildApiUrl(`obras/sinaleiros/${sinaleiroId}/validar-documentos`)
      return apiRequest(url)
    } catch (error: any) {
      // Se o endpoint não existir, retornar como não completo
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        return { success: false, completo: false, documentosFaltando: ['rg_frente', 'rg_verso', 'comprovante_vinculo'] }
      }
      throw error
    }
  },
}

// Funções de conversão (se necessário para compatibilidade com frontend)
export const converterSinaleiroBackendParaFrontend = (
  backend: SinaleiroBackend
): SinaleiroBackend => {
  return backend
}

export const converterDocumentoSinaleiroBackendParaFrontend = (
  backend: DocumentoSinaleiroBackend
): DocumentoSinaleiroBackend => {
  return backend
}

export default sinaleirosApi

