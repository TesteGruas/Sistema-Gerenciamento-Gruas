// API client para responsável técnico
import { buildApiUrl, fetchWithAuth } from './api.ts'

// Interfaces baseadas no backend
export interface ResponsavelTecnicoBackend {
  id: string
  obra_id: number
  nome: string
  cpf_cnpj: string
  crea?: string
  email?: string
  telefone?: string
  created_at: string
  updated_at: string
}

export interface ResponsavelTecnicoCreateData {
  nome: string
  cpf_cnpj: string
  crea?: string
  email?: string
  telefone?: string
}

export interface ResponsavelTecnicoResponse {
  success: boolean
  data: ResponsavelTecnicoBackend | null
}

// Função para fazer requisições autenticadas
const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetchWithAuth(url, options)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API request error:', error)
    throw error
  }
}

// API functions
export const responsavelTecnicoApi = {
  // Obter responsável técnico de uma obra
  async obterPorObra(obraId: number): Promise<ResponsavelTecnicoResponse> {
    const url = buildApiUrl(`obras/${obraId}/responsavel-tecnico`)
    return apiRequest(url)
  },

  // Criar ou atualizar responsável técnico de uma obra
  async criarOuAtualizar(obraId: number, data: ResponsavelTecnicoCreateData): Promise<ResponsavelTecnicoResponse> {
    const url = buildApiUrl(`obras/${obraId}/responsavel-tecnico`)
    return apiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  },

  // Buscar responsável técnico por CPF/CNPJ (endpoint pode não existir ainda, mas preparado)
  async buscarPorCpf(cpfCnpj: string): Promise<ResponsavelTecnicoBackend | null> {
    try {
      // Remove caracteres não numéricos
      const cpfLimpo = cpfCnpj.replace(/\D/g, '')
      const url = buildApiUrl(`responsaveis-tecnicos/buscar?cpf=${cpfLimpo}`)
      const response = await apiRequest(url)
      return response.data || null
    } catch (error) {
      // Se o endpoint não existir, retornar null
      if (error.message.includes('404') || error.message.includes('não encontrado')) {
        return null
      }
      throw error
    }
  },
}

// Funções de conversão (se necessário para compatibilidade com frontend)
export const converterResponsavelTecnicoBackendParaFrontend = (
  backend: ResponsavelTecnicoBackend
): ResponsavelTecnicoBackend => {
  return backend
}

export default responsavelTecnicoApi

