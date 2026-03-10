

// Utilitários de autenticação
export class AuthService {
  // No cliente, usar URL relativa para aproveitar o rewrite do Next.js
  // No servidor (SSR), usar URL absoluta
  private static getApiUrl(endpoint: string): string {
    // Garantir que o endpoint comece com /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    
    if (typeof window !== 'undefined') {
      // Cliente: usar URL relativa com /api para aproveitar o rewrite do Next.js
      return `/api${cleanEndpoint}`
    }
    // Servidor: usar URL absoluta
    const API_BASE_URL = getApiOrigin()
    // Remover /api do final se existir
    const baseUrl = API_BASE_URL.endsWith('/api') 
      ? API_BASE_URL.replace(/\/api$/, '') 
      : API_BASE_URL
    return `${baseUrl}/api${cleanEndpoint}`
  }

  // Obter token do localStorage
  static getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('access_token')
  }

  // Salvar token no localStorage
  static setToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('access_token', token)
  }

  // Remover token do localStorage
  static removeToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('access_token')
  }

  // Fazer login e obter token
  static async login(email: string, password: string): Promise<string> {
    try {
      const response = await fetch(this.getApiUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        throw new Error('Erro no login')
      }

      const data = await response.json()
      const token = data.data.access_token
      this.setToken(token)
      return token
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    }
  }
  
  // Obter usuário atual do backend
  static async getCurrentUser(): Promise<any> {
    try {
      const token = this.getToken()
      if (!token) {
        throw new Error('Token não encontrado')
      }

      const response = await fetch(this.getApiUrl('/auth/me'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao obter usuário atual')
      }

      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error)
      throw error
    }
  }

  // Fazer requisição autenticada
  static async authenticatedRequest(url: string, options: RequestInit = {}): Promise<any> {
    let token = this.getToken()
    
    // Se não tem token, redirecionar para login
    if (!token) {
      throw new Error('Token de autenticação não encontrado. Por favor, faça login.')
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Erro na requisição')
    }

    return response.json()
  }

  // Fazer requisição simples (sem autenticação para gruas)
  static async simpleRequest(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Erro na requisição')
    }

    return response.json()
  }

  // Verificar se está autenticado
  static isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // Obter dados do usuário atual
  static async getCurrentUser(): Promise<any> {
    try {
      const token = this.getToken()
      
      // Verificar se há token antes de fazer requisição
      if (!token) {
        throw new Error('Token não encontrado')
      }

      const response = await fetch(this.getApiUrl('/auth/me'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      // Se receber 403 ou 401, token é inválido ou expirado
      if (response.status === 403 || response.status === 401) {
        // Limpar token inválido
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('token')
        }
        throw new Error('Token inválido ou expirado')
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao buscar dados do usuário')
      }

      const data = await response.json()
      
      // Retornar dados do usuário
      // Normalizar o nome do perfil para lowercase e mapear alguns perfis específicos
      let roleNormalizado = 'usuario'
      
      // Primeiro, tentar pegar do perfil
      if (data.data?.perfil?.nome) {
        const perfilNome = data.data.perfil.nome.toLowerCase()
        
        // Mapeamento de perfis para nomes mais amigáveis
        const roleMapping: Record<string, string> = {
          'administrador': 'admin',
          'mestre de obra': 'mestre de obra',
          'gerente': 'gerente',
          'supervisor': 'supervisor',
          'operador': 'operador',
          'cliente': 'cliente'
        }
        
        roleNormalizado = roleMapping[perfilNome] || perfilNome
      }
      // Fallback: verificar pelo nivel_acesso
      else if (data.data?.perfil?.nivel_acesso) {
        const nivelAcesso = data.data.perfil.nivel_acesso
        
        if (nivelAcesso >= 10) {
          roleNormalizado = 'admin'
        } else if (nivelAcesso >= 9) {
          roleNormalizado = 'gerente'
        } else if (nivelAcesso >= 6) {
          roleNormalizado = 'supervisor'
        } else if (nivelAcesso >= 4) {
          roleNormalizado = 'operador'
        } else {
          roleNormalizado = 'cliente'
        }
      }
      // Último fallback: verificar o user.role da resposta
      else if (data.data?.user?.role) {
        const userRole = data.data.user.role.toLowerCase()
        
        if (userRole.includes('admin')) {
          roleNormalizado = 'admin'
        } else {
          roleNormalizado = userRole
        }
      }
      
      const userObject = {
        id: data.data.user.id,
        name: data.data.profile?.nome || data.data.user.email,
        email: data.data.user.email,
        role: roleNormalizado,
        perfil: data.data.perfil,
        permissoes: data.data.permissoes || [],
        profile: data.data.profile,
        avatar: '/placeholder-user.jpg'
      }
      
      return userObject
    } catch (error) {
      // Não logar erro se for token inválido (já foi tratado)
      if (error instanceof Error && error.message.includes('Token inválido')) {
        throw error
      }
      console.error('❌ [Preload] Erro ao buscar usuário:', error instanceof Error ? error.message : 'Erro desconhecido')
      throw new Error('Não foi possível carregar dados do usuário')
    }
  }

  // Fazer logout
  static logout(): void {
    this.removeToken()
    if (typeof window !== 'undefined') {
      // Detectar se é PWA e redirecionar corretamente
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true ||
                    window.location.pathname.startsWith('/pwa')
      window.location.href = isPWA ? '/pwa/login' : '/'
    }
  }

  // Verificar nível de acesso e redirecionar corretamente
  static async redirectToCorrectPath(router: any): Promise<void> {
    try {
      // Verificar se tem token
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/pwa/login')
        return
      }

      // Tentar obter dados do usuário de várias fontes
      const userDataStr = localStorage.getItem('user_data')
      const userPerfilStr = localStorage.getItem('user_perfil')
      const userLevelStr = localStorage.getItem('user_level')
      const userRole = localStorage.getItem('user_role')

      let userData: any = null

      // Construir objeto userData
      if (userDataStr) {
        try {
          userData = JSON.parse(userDataStr)
        } catch (e) {
          console.warn('Erro ao parsear user_data:', e)
        }
      }

      // Se não tem userData, construir a partir dos dados disponíveis
      if (!userData) {
        userData = {
          role: userRole || '',
          level: userLevelStr ? parseInt(userLevelStr, 10) : undefined,
          perfil: userPerfilStr ? JSON.parse(userPerfilStr) : null
        }
      } else {
        // Adicionar level e perfil se disponíveis
        if (userLevelStr) {
          userData.level = parseInt(userLevelStr, 10)
        }
        if (userRole) {
          userData.role = userRole
        }
        if (userPerfilStr) {
          try {
            userData.perfil = JSON.parse(userPerfilStr)
          } catch (e) {
            console.warn('Erro ao parsear user_perfil:', e)
          }
        }
      }

      // Importar função de redirecionamento
      const { getRedirectPath } = await import('@/lib/redirect-handler')
      const redirectPath = getRedirectPath(userData)
      
      console.log(`🔄 [Auth] Redirecionando para: ${redirectPath}`)
      router.push(redirectPath)
    } catch (error) {
      console.error('Erro ao redirecionar:', error)
      router.push('/pwa/login')
    }
  }
}
