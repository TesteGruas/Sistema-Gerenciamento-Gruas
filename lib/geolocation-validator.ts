/**
 * Validador de Geolocalização
 * Verifica se o funcionário está próximo à obra antes de registrar ponto
 */
import { buildApiUrl, fetchWithAuth } from "./api"

export interface Coordenadas {
  lat: number
  lng: number
}

export interface Obra {
  id: number
  nome: string
  endereco: string
  cidade?: string
  estado?: string
  cep?: string
  coordenadas: Coordenadas | null
  raio_permitido: number // em metros
  geocoding_status?: string
}

type ResultadoGeocoding = {
  coordenadas: Coordenadas | null
  status: string
}

const CACHE_TTL_MS = 5 * 60 * 1000
const CACHE_FAIL_TTL_MS = 20 * 1000
const cacheCoordenadasObra = new Map<number, { coordenadas: Coordenadas | null; status: string; ts: number }>()

async function geocodificarEnderecoObra(params: {
  endereco?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  nome?: string | null
}): Promise<ResultadoGeocoding> {
  const removerAcentos = (texto: string) =>
    texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  const enderecoBase = (params.endereco || "").trim()
  const enderecoSemNumero = enderecoBase.replace(/,\s*\d+.*$/g, "").trim()
  const cidadeBase = (params.cidade || "").trim()
  const cidadeSemAcento = cidadeBase ? removerAcentos(cidadeBase) : ""

  const partesEndereco = [params.endereco, params.cidade, params.estado, "Brasil"]
    .map((item) => (item || "").trim())
    .filter(Boolean)

  if (partesEndereco.length === 0) {
    return { coordenadas: null, status: "Endereco insuficiente para geocodificar." }
  }

  const consultas = [
    partesEndereco.join(", "),
    [enderecoSemNumero, params.cidade, params.estado, "Brasil"].filter(Boolean).join(", "),
    [cidadeBase, params.estado, "Brasil"].filter(Boolean).join(", "),
    [cidadeSemAcento, params.estado, "Brasil"].filter(Boolean).join(", "),
  ].filter(Boolean).slice(0, 4)

  let ultimaFalha = "Nenhuma resposta valida de geocoding."

  const cepLimpo = (params.cep || "").replace(/\D/g, "")
  if (cepLimpo.length === 8) {
    try {
      const endpointCep = buildApiUrl(`geocoding/cep/${cepLimpo}`)
      const responseCep = await fetchWithAuth(endpointCep, { method: "GET" })
      if (responseCep.ok) {
        const payloadCep = await responseCep.json().catch(() => null)
        const latCep = payloadCep?.data?.coordenadas?.lat
        const lngCep = payloadCep?.data?.coordenadas?.lng
        if (typeof latCep === "number" && typeof lngCep === "number") {
          return {
            coordenadas: { lat: latCep, lng: lngCep },
            status: `Geocoding por CEP (${cepLimpo}) via API interna.`
          }
        }
      }
    } catch {
      // continua para geocoding por endereço
    }
  }

  for (const consulta of consultas) {
    try {
      const endpoint = buildApiUrl(`geocoding/endereco?q=${encodeURIComponent(consulta)}`)
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
      const response = await fetch(endpoint, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
      if (!response.ok) {
        ultimaFalha = `API interna retornou ${response.status} para "${consulta}".`
        continue
      }

      const payload = await response.json().catch(() => null)
      const lat = payload?.data?.coordenadas?.lat
      const lng = payload?.data?.coordenadas?.lng

      if (typeof lat === "number" && typeof lng === "number") {
        return {
          coordenadas: { lat, lng },
          status: `Geocoding via API interna: "${consulta}".`
        }
      }
      ultimaFalha = `API interna sem coordenadas para "${consulta}".`
    } catch {
      ultimaFalha = `Falha na API interna para "${consulta}".`
    }
  }

  // Fallback controlado: tenta apenas cidade/UF uma única vez.
  if (cidadeBase && params.estado) {
    try {
      const consultaCidade = `${cidadeBase}, ${params.estado}, Brasil`
      const endpointCidade = buildApiUrl(`geocoding/endereco?q=${encodeURIComponent(consultaCidade)}`)
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
      const responseCidade = await fetch(endpointCidade, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
      if (responseCidade.ok) {
        const payloadCidade = await responseCidade.json().catch(() => null)
        const lat = payloadCidade?.data?.coordenadas?.lat
        const lng = payloadCidade?.data?.coordenadas?.lng
        if (typeof lat === "number" && typeof lng === "number") {
          return {
            coordenadas: { lat, lng },
            status: `Geocoding por cidade/UF: "${consultaCidade}".`
          }
        }
      }
    } catch {
      // Mantém ultimaFalha
    }
  }

  return { coordenadas: null, status: `${ultimaFalha} (fallback cidade sem sucesso)` }
}

/**
 * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
 * @param coord1 Primeira coordenada
 * @param coord2 Segunda coordenada
 * @returns Distância em metros
 */
export function calcularDistancia(coord1: Coordenadas, coord2: Coordenadas): number {
  const R = 6371e3 // Raio da Terra em metros
  const φ1 = (coord1.lat * Math.PI) / 180
  const φ2 = (coord2.lat * Math.PI) / 180
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  const distancia = R * c // em metros

  return distancia
}

/**
 * Valida se o funcionário está dentro do raio permitido da obra
 * @param localizacaoAtual Localização atual do funcionário
 * @param obra Dados da obra
 * @returns Objeto com resultado da validação
 */
export function validarProximidadeObra(
  localizacaoAtual: Coordenadas,
  obra: Obra
): {
  valido: boolean
  distancia: number
  mensagem: string
} {
  if (!obra.coordenadas) {
    return {
      valido: false,
      distancia: Infinity,
      mensagem: "A obra não possui coordenadas configuradas para validação de proximidade.",
    }
  }

  const distancia = calcularDistancia(localizacaoAtual, obra.coordenadas)
  const valido = distancia <= obra.raio_permitido

  let mensagem = ""
  if (valido) {
    mensagem = `Você está a ${Math.round(distancia)}m da obra ${obra.nome}`
  } else {
    mensagem = `Você está muito longe da obra (${Math.round(distancia)}m). Distância máxima permitida: ${obra.raio_permitido}m`
  }

  return {
    valido,
    distancia,
    mensagem,
  }
}

/**
 * Obtém a localização atual do usuário
 * @param options Opções de geolocalização
 * @returns Promise com as coordenadas
 */
export function obterLocalizacaoAtual(
  options?: PositionOptions
): Promise<Coordenadas> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalização não é suportada por este navegador"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        let mensagem = "Erro ao obter localização"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            mensagem = "Permissão de localização negada. Ative a localização no navegador para registrar ponto."
            break
          case error.POSITION_UNAVAILABLE:
            mensagem = "Localização indisponível no momento. Verifique GPS/sinal e tente novamente."
            break
          case error.TIMEOUT:
            mensagem = "Tempo esgotado ao obter localização. Tente novamente em área com melhor sinal."
            break
        }
        reject(new Error(mensagem))
      },
      {
        enableHighAccuracy: true, // Tenta usar GPS em vez de apenas Wi-Fi/Antena
        timeout: 10000,
        maximumAge: 0 // Não usar cache, sempre obter localização atual
      }
    )
  })
}

/**
 * Formata a distância para exibição
 * @param metros Distância em metros
 * @returns String formatada
 */
export function formatarDistancia(metros: number): string {
  if (metros < 1000) {
    return `${Math.round(metros)}m`
  }
  return `${(metros / 1000).toFixed(2)}km`
}

/**
 * Busca obras do funcionário via API com coordenadas reais
 * @param funcionarioId ID do funcionário
 * @returns Promise com lista de obras
 */
export async function buscarObrasFuncionario(funcionarioId?: number): Promise<Obra[]> {
  try {
    // Importação dinâmica para evitar problemas de ciclo
    const { obrasApi } = await import('./api-obras')
    
    const response = await obrasApi.listarObras({ 
      limit: 1000,
      status: 'Em Andamento'
    })
    
    const obras = response.data || []
    
    // Mapear obras para o formato esperado.
    // Importante: quando não houver coordenadas no cadastro, tentar geocodificar pelo endereço.
    const obrasMapeadas = await Promise.all(obras.map(async (obra: any) => {
      let coordenadas: Coordenadas | null = null
      let geocodingStatus = ""
      let cidade = obra.cidade || ""
      let estado = obra.estado || ""
      let cep = obra.cep || ""
      let endereco = obra.endereco || ""
      let nome = obra.nome || ""

      if (obra.latitude != null && obra.longitude != null) {
        coordenadas = {
          lat: parseFloat(obra.latitude),
          lng: parseFloat(obra.longitude)
        }
        geocodingStatus = "Coordenadas vindas do cadastro da obra."
      } else {
        const cacheAtual = cacheCoordenadasObra.get(obra.id)
        const ttlAtual = cacheAtual?.coordenadas ? CACHE_TTL_MS : CACHE_FAIL_TTL_MS
        if (cacheAtual && (Date.now() - cacheAtual.ts) < ttlAtual) {
          return {
            id: obra.id,
            nome,
            endereco,
            cidade,
            estado,
            cep,
            coordenadas: cacheAtual.coordenadas,
            raio_permitido: 5000,
            geocoding_status: `${cacheAtual.status} (cache)`
          }
        }

        // Tenta resolver pelo backend por ID (inclui geocoding e persistência).
        try {
          const endpointResolver = buildApiUrl(`obras/${obra.id}/resolver-coordenadas`)
          const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
          const responseResolver = await fetch(endpointResolver, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          })
          if (responseResolver.ok) {
            const payloadResolver = await responseResolver.json().catch(() => null)
            const lat = payloadResolver?.data?.coordenadas?.lat
            const lng = payloadResolver?.data?.coordenadas?.lng
            if (typeof lat === "number" && typeof lng === "number") {
              const resolvidas: Coordenadas = { lat, lng }
              const statusResolver = payloadResolver?.data?.mensagem || "Coordenadas resolvidas por endpoint da obra."
              cacheCoordenadasObra.set(obra.id, { coordenadas: resolvidas, status: statusResolver, ts: Date.now() })
              return {
                id: obra.id,
                nome,
                endereco,
                cidade,
                estado,
                cep,
                coordenadas: resolvidas,
                raio_permitido: 5000,
                geocoding_status: statusResolver
              }
            }
          } else {
            geocodingStatus = `Resolver-coordenadas retornou ${responseResolver.status}.`
          }
        } catch {
          geocodingStatus = "Falha ao chamar resolver-coordenadas."
        }

        // Tenta buscar dados completos da obra para enriquecer endereço/cidade/UF/CEP.
        try {
          const obraDetalhada: any = await obrasApi.obterObra(obra.id)
          if (obraDetalhada) {
            cidade = obraDetalhada.cidade || cidade
            estado = obraDetalhada.estado || estado
            cep = obraDetalhada.cep || cep
            endereco = obraDetalhada.endereco || endereco
            nome = obraDetalhada.nome || nome

            if (obraDetalhada.latitude != null && obraDetalhada.longitude != null) {
              coordenadas = {
                lat: parseFloat(obraDetalhada.latitude),
                lng: parseFloat(obraDetalhada.longitude)
              }
              geocodingStatus = "Coordenadas carregadas da obra detalhada."
            }
          }
        } catch {
          // segue para geocoding por endereço
        }

        if (!coordenadas) {
          const resultadoGeocoding = await geocodificarEnderecoObra({
            endereco,
            cidade,
            estado,
            cep,
            nome
          })
          coordenadas = resultadoGeocoding.coordenadas
          geocodingStatus = resultadoGeocoding.status
        }

        cacheCoordenadasObra.set(obra.id, {
          coordenadas,
          status: geocodingStatus || "Sem coordenadas no momento.",
          ts: Date.now()
        })

        return {
          id: obra.id,
          nome,
          endereco,
          cidade,
          estado,
          cep,
          coordenadas,
          raio_permitido: 5000,
          geocoding_status: geocodingStatus
        }
      }

      return {
        id: obra.id,
        nome,
        endereco,
        cidade,
        estado,
        cep,
        coordenadas,
        raio_permitido: 5000,
        geocoding_status: geocodingStatus || (coordenadas ? "Coordenadas vindas do cadastro da obra." : "Sem coordenadas no cadastro.")
      }
    }))

    return obrasMapeadas
  } catch (error) {
    console.error('Erro ao buscar obras:', error)
    throw new Error('Não foi possível carregar as obras')
  }
}

/**
 * Verifica se uma obra tem coordenadas configuradas
 * @param obraId ID da obra
 * @returns Promise<boolean>
 */
export async function obraTemCoordenadas(obraId: number): Promise<boolean> {
  try {
    const { obrasApi } = await import('./api-obras')
    const obra = await obrasApi.obterObra(obraId)
    return obra.latitude != null && obra.longitude != null
  } catch (error) {
    console.error('Erro ao verificar coordenadas da obra:', error)
    return false
  }
}

