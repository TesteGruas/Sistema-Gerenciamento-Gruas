/**
 * Validador de Geolocalização
 * Verifica se o funcionário está próximo à obra antes de registrar ponto
 */

export interface Coordenadas {
  lat: number
  lng: number
}

export interface Obra {
  id: number
  nome: string
  endereco: string
  coordenadas: Coordenadas
  raio_permitido: number // em metros
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
            mensagem = "Permissão de localização negada"
            break
          case error.POSITION_UNAVAILABLE:
            mensagem = "Localização indisponível"
            break
          case error.TIMEOUT:
            mensagem = "Tempo esgotado ao obter localização"
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
    
    // Mapear obras para o formato esperado usando coordenadas reais do banco
    return obras
      .filter(obra => {
        // Filtrar apenas obras com coordenadas configuradas
        const temCoordenadas = obra.latitude != null && obra.longitude != null
        if (!temCoordenadas) {
          console.warn(`⚠️ Obra "${obra.nome}" (ID: ${obra.id}) não possui coordenadas configuradas`)
        }
        return temCoordenadas
      })
      .map(obra => ({
        id: obra.id,
        nome: obra.nome,
        endereco: obra.endereco || '',
        coordenadas: {
          lat: parseFloat(obra.latitude),
          lng: parseFloat(obra.longitude)
        },
        raio_permitido: obra.raio_permitido || 4000 // Usar raio do banco ou padrão de 4000m (4km)
      }))
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

