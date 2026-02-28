import { buildApiUrl, fetchWithAuth } from './api'

export interface ViaCepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge?: string
  gia?: string
  ddd?: string
  siafi?: string
  erro?: boolean
}

interface ViaCepApiResponse {
  success: boolean
  data: ViaCepResponse
  error?: string
  message?: string
}

export async function buscarEnderecoPorCep(cep: string): Promise<ViaCepResponse> {
  const cepLimpo = cep.replace(/\D/g, '')

  if (cepLimpo.length !== 8) {
    throw new Error('CEP inválido. Deve conter 8 dígitos')
  }

  const url = buildApiUrl(`geocoding/via-cep/${cepLimpo}`)
  const response = await fetchWithAuth(url, {
    method: 'GET'
  })

  const data: ViaCepApiResponse = await response.json()

  if (!response.ok || !data.success || !data.data) {
    throw new Error(data?.message || data?.error || 'Erro ao buscar CEP')
  }

  return data.data
}

