const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface FuncionarioRH {
  id: number
  nome: string
  cpf: string
  cargo: string
  departamento: string
  salario: number
  data_admissao: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  status: 'Ativo' | 'Inativo' | 'Afastado' | 'Demitido'
  turno?: 'Manhã' | 'Tarde' | 'Noite' | 'Integral'
  obra_atual_id?: number
  created_at: string
  updated_at: string
  usuario?: {
    id: number
    nome: string
    email: string
    status: string
  }
  obra_atual?: {
    id: number
    nome: string
    status: string
    cliente: {
      nome: string
    }
  }
}

interface FuncionariosResponse {
  success: boolean
  data: FuncionarioRH[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface EstatisticasRH {
  por_status: Record<string, number>
  por_departamento: Record<string, number>
  por_cargo: Record<string, number>
  por_obra: any[]
}

export const apiRH = {
  // Listar funcionários
  async listarFuncionarios(params?: {
    page?: number
    limit?: number
    status?: string
    departamento?: string
    cargo?: string
  }): Promise<FuncionariosResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.departamento) queryParams.append('departamento', params.departamento)
    if (params?.cargo) queryParams.append('cargo', params.cargo)
    
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_BASE_URL}/rh/funcionarios?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // TEMPORARIAMENTE DESABILITADO - Interceptor de logout para 403
      // if (response.status === 403 && errorData.error === "Token inválido ou expirado" && errorData.code === "INVALID_TOKEN") {
      //   console.warn('Token inválido ou expirado, removendo dados do localStorage e redirecionando para login...')
      //   localStorage.removeItem('access_token')
      //   localStorage.removeItem('user_data')
      //   localStorage.removeItem('refresh_token')
      //   if (typeof window !== 'undefined') {
      //     window.location.href = '/'
      //   }
      //   throw new Error('Token inválido ou expirado. Redirecionando para login...')
      // }
      
      // TEMPORARIAMENTE DESABILITADO - Interceptor de logout para 401/403
      // if (response.status === 401 || response.status === 403) {
      //   console.warn('Erro de autenticação, redirecionando para login...')
      //   localStorage.removeItem('access_token')
      //   localStorage.removeItem('user_data')
      //   localStorage.removeItem('refresh_token')
      //   if (typeof window !== 'undefined') {
      //     window.location.href = '/'
      //   }
      // }
      
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  },

  // Buscar funcionário por ID
  async buscarFuncionario(id: number): Promise<FuncionarioRH> {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_BASE_URL}/rh/funcionarios/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // TEMPORARIAMENTE DESABILITADO - Interceptor de logout para 403
      // if (response.status === 403 && errorData.error === "Token inválido ou expirado" && errorData.code === "INVALID_TOKEN") {
      //   console.warn('Token inválido ou expirado, removendo dados do localStorage e redirecionando para login...')
      //   localStorage.removeItem('access_token')
      //   localStorage.removeItem('user_data')
      //   localStorage.removeItem('refresh_token')
      //   if (typeof window !== 'undefined') {
      //     window.location.href = '/'
      //   }
      //   throw new Error('Token inválido ou expirado. Redirecionando para login...')
      // }
      
      // TEMPORARIAMENTE DESABILITADO - Interceptor de logout para 401/403
      // if (response.status === 401 || response.status === 403) {
      //   console.warn('Erro de autenticação, redirecionando para login...')
      //   localStorage.removeItem('access_token')
      //   localStorage.removeItem('user_data')
      //   localStorage.removeItem('refresh_token')
      //   if (typeof window !== 'undefined') {
      //     window.location.href = '/'
      //   }
      // }
      
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  },

  // Criar funcionário
  async criarFuncionario(dados: Partial<FuncionarioRH>): Promise<FuncionarioRH> {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_BASE_URL}/rh/funcionarios`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // TEMPORARIAMENTE DESABILITADO - Interceptor de logout para 403
      // if (response.status === 403 && errorData.error === "Token inválido ou expirado" && errorData.code === "INVALID_TOKEN") {
      //   console.warn('Token inválido ou expirado, removendo dados do localStorage e redirecionando para login...')
      //   localStorage.removeItem('access_token')
      //   localStorage.removeItem('user_data')
      //   localStorage.removeItem('refresh_token')
      //   if (typeof window !== 'undefined') {
      //     window.location.href = '/'
      //   }
      //   throw new Error('Token inválido ou expirado. Redirecionando para login...')
      // }
      
      // TEMPORARIAMENTE DESABILITADO - Interceptor de logout para 401/403
      // if (response.status === 401 || response.status === 403) {
      //   console.warn('Erro de autenticação, redirecionando para login...')
      //   localStorage.removeItem('access_token')
      //   localStorage.removeItem('user_data')
      //   localStorage.removeItem('refresh_token')
      //   if (typeof window !== 'undefined') {
      //     window.location.href = '/'
      //   }
      // }
      
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  },

  // Atualizar funcionário
  async atualizarFuncionario(id: number, dados: Partial<FuncionarioRH>): Promise<FuncionarioRH> {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_BASE_URL}/rh/funcionarios/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // TEMPORARIAMENTE DESABILITADO - Interceptor de logout para 403
      // if (response.status === 403 && errorData.error === "Token inválido ou expirado" && errorData.code === "INVALID_TOKEN") {
      //   console.warn('Token inválido ou expirado, removendo dados do localStorage e redirecionando para login...')
      //   localStorage.removeItem('access_token')
      //   localStorage.removeItem('user_data')
      //   localStorage.removeItem('refresh_token')
      //   if (typeof window !== 'undefined') {
      //     window.location.href = '/'
      //   }
      //   throw new Error('Token inválido ou expirado. Redirecionando para login...')
      // }
      
      // TEMPORARIAMENTE DESABILITADO - Interceptor de logout para 401/403
      // if (response.status === 401 || response.status === 403) {
      //   console.warn('Erro de autenticação, redirecionando para login...')
      //   localStorage.removeItem('access_token')
      //   localStorage.removeItem('user_data')
      //   localStorage.removeItem('refresh_token')
      //   if (typeof window !== 'undefined') {
      //     window.location.href = '/'
      //   }
      // }
      
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  },

  // Obter estatísticas
  async obterEstatisticas(): Promise<EstatisticasRH> {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_BASE_URL}/rh/estatisticas`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // TEMPORARIAMENTE DESABILITADO - Interceptor de logout para 403
      // if (response.status === 403 && errorData.error === "Token inválido ou expirado" && errorData.code === "INVALID_TOKEN") {
      //   console.warn('Token inválido ou expirado, removendo dados do localStorage e redirecionando para login...')
      //   localStorage.removeItem('access_token')
      //   localStorage.removeItem('user_data')
      //   localStorage.removeItem('refresh_token')
      //   if (typeof window !== 'undefined') {
      //     window.location.href = '/'
      //   }
      //   throw new Error('Token inválido ou expirado. Redirecionando para login...')
      // }
      
      // TEMPORARIAMENTE DESABILITADO - Interceptor de logout para 401/403
      // if (response.status === 401 || response.status === 403) {
      //   console.warn('Erro de autenticação, redirecionando para login...')
      //   localStorage.removeItem('access_token')
      //   localStorage.removeItem('user_data')
      //   localStorage.removeItem('refresh_token')
      //   if (typeof window !== 'undefined') {
      //     window.location.href = '/'
      //   }
      // }
      
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }
}
