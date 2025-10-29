

// Utilitários de autenticação
export class AuthService {
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
  private static readonly LOGIN_CREDENTIALS = {
    email: 'admin@admin.com',
    password: 'teste@123'
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
  static async login(): Promise<string> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.LOGIN_CREDENTIALS)
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

  // Fazer requisição autenticada
  static async authenticatedRequest(url: string, options: RequestInit = {}): Promise<any> {
    let token = this.getToken()
    
    // Se não tem token, tentar fazer login
    if (!token) {
      try {
        token = await this.login()
      } catch (error) {
        console.error('Erro no login:', error)
        throw new Error('Erro ao obter token de autenticação')
      }
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
      console.log('[AuthService] Chamando /api/auth/me...')
      const response = await this.authenticatedRequest(`${this.API_BASE_URL}/api/auth/me`, {
        method: 'GET'
      })
      
      console.log('[AuthService] Response completo:', response)
      console.log('[AuthService] response.data:', response.data)
      console.log('[AuthService] response.data.perfil:', response.data.perfil)
      console.log('[AuthService] response.data.perfil?.nome:', response.data.perfil?.nome)
      
      // Retornar dados do usuário
      // Normalizar o nome do perfil para lowercase e mapear alguns perfis específicos
      let roleNormalizado = 'usuario'
      
      // Primeiro, tentar pegar do perfil
      if (response.data.perfil?.nome) {
        const perfilNome = response.data.perfil.nome.toLowerCase()
        console.log('[AuthService] perfilNome (lowercase):', perfilNome)
        
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
      else if (response.data.perfil?.nivel_acesso) {
        const nivelAcesso = response.data.perfil.nivel_acesso
        console.log('[AuthService] Perfil sem nome, usando nivel_acesso:', nivelAcesso)
        
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
      else if (response.data.user?.role) {
        const userRole = response.data.user.role.toLowerCase()
        console.log('[AuthService] Usando user.role como fallback:', userRole)
        
        if (userRole.includes('admin')) {
          roleNormalizado = 'admin'
        } else {
          roleNormalizado = userRole
        }
      }
      
      console.log('[AuthService] roleNormalizado FINAL:', roleNormalizado)
      
      const userObject = {
        id: response.data.user.id,
        name: response.data.profile?.nome || response.data.user.email,
        email: response.data.user.email,
        role: roleNormalizado,
        perfil: response.data.perfil,
        permissoes: response.data.permissoes || [],
        profile: response.data.profile,
        avatar: '/placeholder-user.jpg'
      }
      
      console.log('[AuthService] Objeto do usuário criado:', userObject)
      return userObject
    } catch (error) {
      console.error('[AuthService] Erro ao buscar usuário atual:', error)
      throw new Error('Não foi possível carregar dados do usuário')
    }
  }

  // Fazer logout
  static logout(): void {
    this.removeToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  // Verificar se usuário é gestor e redirecionar corretamente
  static async redirectToCorrectPath(router: any): Promise<void> {
    try {
      const userData = localStorage.getItem('user_data')
      
      if (!userData) {
        router.push('/pwa/login')
        return
      }

      const user = JSON.parse(userData)
      const cargo = user.user_metadata?.cargo || user.cargo || ''
      const role = user.role || ''

      // Se cargo contém palavras-chave de gestão, redirecionar para dashboard
      const cargoStr = cargo?.toLowerCase() || ''
      const roleStr = role?.toLowerCase() || ''
      
      const isGestor = (
        cargoStr.includes('gestor') ||
        cargoStr.includes('gerente') ||
        cargoStr.includes('diretor') ||
        cargoStr.includes('admin') ||
        cargoStr.includes('supervisor') ||
        cargoStr.includes('encarregado') ||
        roleStr.includes('gestor') ||
        roleStr.includes('gerente') ||
        roleStr.includes('admin')
      )

      if (isGestor) {
        router.push('/dashboard')
      } else {
        router.push('/pwa')
      }
    } catch (error) {
      router.push('/pwa/login')
    }
  }
}
