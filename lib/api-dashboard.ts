/**
 * API functions for Dashboard module
 */

import { fetchWithAuth } from './api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface EvolucaoMensal {
  mes: string
  mes_numero: number
  ano: number
  obras: number
  clientes: number
  gruas: number
}

export interface EvolucaoMensalResponse {
  success: boolean
  data: EvolucaoMensal[]
}

// Helper function to make API requests
const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}${url}`, options)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API request error:', error)
    throw error
  }
}

// Dashboard API
export const apiDashboard = {
  // Buscar evolução mensal
  buscarEvolucaoMensal: async (meses: number = 6): Promise<EvolucaoMensalResponse> => {
    const queryParams = new URLSearchParams()
    if (meses) queryParams.append('meses', meses.toString())
    
    const url = `/api/relatorios/dashboard/evolucao-mensal${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await apiRequest(url)
    return response
  }
}

// Export default for compatibility with existing code
export default {
  apiDashboard
}
