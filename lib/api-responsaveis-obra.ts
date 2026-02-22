import { buildApiUrl, fetchWithAuth } from './api'

export interface ResponsavelObra {
  id: number
  obra_id: number
  nome: string
  usuario: string | null
  email: string | null
  telefone: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ResponsavelObraCreateData {
  nome: string
  usuario?: string
  email?: string
  telefone?: string
}

export interface ResponsavelObraUpdateData extends ResponsavelObraCreateData {
  ativo?: boolean
}

const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetchWithAuth(url, options)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`)
  }

  return await response.json()
}

export const responsaveisObraApi = {
  async listar(obraId: number): Promise<{ success: boolean; data: ResponsavelObra[] }> {
    const url = buildApiUrl(`obras/${obraId}/responsaveis-obra`)
    return apiRequest(url)
  },

  async criar(obraId: number, data: ResponsavelObraCreateData): Promise<{ success: boolean; data: ResponsavelObra }> {
    const url = buildApiUrl(`obras/${obraId}/responsaveis-obra`)
    return apiRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  async atualizar(obraId: number, id: number, data: ResponsavelObraUpdateData): Promise<{ success: boolean; data: ResponsavelObra }> {
    const url = buildApiUrl(`obras/${obraId}/responsaveis-obra/${id}`)
    return apiRequest(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  async remover(obraId: number, id: number): Promise<{ success: boolean; message: string }> {
    const url = buildApiUrl(`obras/${obraId}/responsaveis-obra/${id}`)
    return apiRequest(url, { method: 'DELETE' })
  },
}
