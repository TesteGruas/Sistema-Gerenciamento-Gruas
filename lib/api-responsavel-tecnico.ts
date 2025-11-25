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
  funcionario_id?: number
  nome?: string
  cpf_cnpj?: string
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

  // Buscar responsável técnico por CPF/CNPJ
  async buscarPorCpf(cpfCnpj: string): Promise<any | null> {
    try {
      // Remove caracteres não numéricos
      const cpfLimpo = cpfCnpj.replace(/\D/g, '')
      
      // Validar se tem pelo menos 5 dígitos
      if (cpfLimpo.length < 5) {
        throw new Error('CPF/CNPJ deve ter pelo menos 5 dígitos')
      }
      
      const url = buildApiUrl(`responsaveis-tecnicos/buscar?cpf=${cpfLimpo}`)
      console.log('🔍 URL da busca:', url)
      
      const response = await apiRequest(url)
      console.log('📋 Resposta da API:', response)
      
      const d = response.data
      if (!d) {
        console.log('⚠️ Nenhum dado retornado')
        return null
      }
      
      // Se veio de funcionarios
      if (d.origem === 'funcionarios') {
        return {
          origem: 'funcionarios',
          funcionario_id: d.funcionario_id,
          nome: d.nome,
          cpf_cnpj: d.cpf_cnpj,
          email: d.email || '',
          telefone: d.telefone || '',
        }
      }
      
      // Fallback: tabela responsaveis_tecnicos
      return {
        id: d.id,
        nome: d.nome,
        cpf_cnpj: d.cpf_cnpj,
        crea: d.crea || '',
        email: d.email || '',
        telefone: d.telefone || ''
      }
    } catch (error: any) {
      console.error('❌ Erro na busca:', error)
      // Se o endpoint não existir ou não encontrar, retornar null
      if (error.message?.includes('404') || 
          error.message?.includes('não encontrado') ||
          error.message?.includes('404') ||
          error.message?.includes('Not Found')) {
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

