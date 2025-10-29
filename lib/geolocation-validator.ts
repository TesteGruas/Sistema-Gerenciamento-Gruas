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
      options || {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutos
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
 * Busca obras do funcionário via API
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
    
    // Mapear obras para o formato esperado
    // Nota: Assumindo coordenadas padrão caso não existam no backend
    // Em produção, adicionar campos de coordenadas no backend
    return obras.map(obra => ({
      id: obra.id,
      nome: obra.nome,
      endereco: obra.endereco || '',
      coordenadas: {
        lat: -23.550520, // Coordenadas padrão - deve vir do backend
        lng: -46.633308
      },
      raio_permitido: 500 // Raio padrão em metros - deve vir do backend
    }))
  } catch (error) {
    console.error('Erro ao buscar obras:', error)
    throw new Error('Não foi possível carregar as obras')
  }
}

