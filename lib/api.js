// Configuração da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'

// Função para construir URLs completas
export const buildApiUrl = (endpoint) => {
  // Remove barra inicial se existir para evitar dupla barra
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${API_BASE_URL}/${cleanEndpoint}`
}

// Endpoints específicos
export const API_ENDPOINTS = {
  GRUAS: 'gruas',
  CLIENTES: 'clientes',
  FUNCIONARIOS: 'funcionarios',
  EQUIPAMENTOS: 'equipamentos',
  OBRAS: 'obras',
  RELACIONAMENTOS: 'relacionamentos',
  USERS: 'users',
  AUTH: 'auth'
}

export default API_BASE_URL
