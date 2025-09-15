

// Utilitários de autenticação
export class AuthService {
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
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
      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
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

  // Fazer logout
  static logout(): void {
    this.removeToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }
}
