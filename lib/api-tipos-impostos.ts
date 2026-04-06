import { api } from './api'

export interface EnsureTiposImpostosResult {
  criados: string[]
  existentes: string[]
  total: number
}

export const tiposImpostosApi = {
  /**
   * Para cada nome: se já existir em tipos_impostos, reutiliza; senão, cadastra.
   */
  async ensure(nomes: string[]): Promise<{
    success: boolean
    data?: EnsureTiposImpostosResult
    message?: string
  }> {
    const response = await api.post('/tipos-impostos/ensure', { nomes })
    return response.data
  }
}
