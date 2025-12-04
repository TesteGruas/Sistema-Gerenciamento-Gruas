/**
 * Utilitários de Geocalização
 * Funções para cálculos de distância e validação de localização
 */

/**
 * Calcula a distância em metros entre dois pontos geográficos usando a fórmula de Haversine
 * @param {number} lat1 Latitude do primeiro ponto
 * @param {number} lon1 Longitude do primeiro ponto
 * @param {number} lat2 Latitude do segundo ponto
 * @param {number} lon2 Longitude do segundo ponto
 * @returns {number} Distância em metros
 */
export function calcularDistanciaEmMetros(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ em radianos
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distancia = R * c; // em metros

  return distancia;
}

/**
 * Valida se uma localização está dentro do raio permitido de uma obra
 * @param {number} latUsuario Latitude do usuário
 * @param {number} lonUsuario Longitude do usuário
 * @param {number} latObra Latitude da obra
 * @param {number} lonObra Longitude da obra
 * @param {number} raioPermitido Raio permitido em metros (padrão: 4000m / 4km)
 * @returns {Object} Objeto com valido, distancia e mensagem
 */
export function validarProximidadeObra(latUsuario, lonUsuario, latObra, lonObra, raioPermitido = 4000) {
  if (!latUsuario || !lonUsuario || !latObra || !lonObra) {
    return {
      valido: false,
      distancia: null,
      mensagem: 'Coordenadas incompletas para validação'
    };
  }

  const distancia = calcularDistanciaEmMetros(
    parseFloat(latUsuario),
    parseFloat(lonUsuario),
    parseFloat(latObra),
    parseFloat(lonObra)
  );

  const valido = distancia <= raioPermitido;

  let mensagem = '';
  if (valido) {
    mensagem = `Você está a ${Math.round(distancia)}m da obra. Dentro do raio permitido de ${raioPermitido}m.`;
  } else {
    mensagem = `Você está a ${Math.round(distancia)}m da obra. O limite é ${raioPermitido}m. Aproxime-se do local.`;
  }

  return {
    valido,
    distancia: Math.round(distancia),
    mensagem
  };
}

/**
 * Extrai coordenadas de uma string de localização
 * @param {string} localizacao String no formato "lat, lng" ou "lat,lng"
 * @returns {Object|null} Objeto com lat e lng ou null se inválido
 */
export function extrairCoordenadas(localizacao) {
  if (!localizacao || typeof localizacao !== 'string') {
    return null;
  }

  // Remover espaços e dividir por vírgula
  const partes = localizacao.replace(/\s/g, '').split(',');
  
  if (partes.length !== 2) {
    return null;
  }

  const lat = parseFloat(partes[0]);
  const lng = parseFloat(partes[1]);

  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }

  // Validar range de coordenadas válidas
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return { lat, lng };
}

