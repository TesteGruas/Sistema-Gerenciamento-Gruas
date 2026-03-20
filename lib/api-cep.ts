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

/** Máscara 12345-678 */
export function formatarCepBr(value: string): string {
  const n = value.replace(/\D/g, '').slice(0, 8)
  if (n.length <= 5) return n
  return `${n.slice(0, 5)}-${n.slice(5)}`
}

/** Mesma regra do backend/nova obra: rua, nº — bairro — complemento */
export function montarLinhaEnderecoObraDetalhado(p: {
  endereco_rua?: string | null
  endereco_numero?: string | null
  endereco_bairro?: string | null
  endereco_complemento?: string | null
}): string {
  const rua = (p.endereco_rua || '').trim()
  const numero = (p.endereco_numero || '').trim()
  const bairro = (p.endereco_bairro || '').trim()
  const comp = (p.endereco_complemento || '').trim()
  const base = [rua, numero].filter(Boolean).join(', ')
  const comBairro = [base, bairro].filter(Boolean).join(' - ')
  return [comBairro, comp].filter(Boolean).join(', ')
}

