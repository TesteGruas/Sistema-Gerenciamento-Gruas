/**
 * Interceptor Global de Autenticação
 * Captura erros de autenticação e redireciona para login automaticamente
 * Tenta fazer refresh token antes de redirecionar
 */

import { sessionPersistence } from './session-persistence'

export interface AuthError {
  status: number
  message: string
  isAuthError: boolean
}

class AuthInterceptor {
  private isRedirecting = false
  private redirectTimeout: NodeJS.Timeout | null = null
  private static redirectCount = 0
  private static lastRedirectTime = 0

  /**
   * Verificar se é um erro de autenticação
   */
  private isAuthenticationError(status: number, response?: any): boolean {
    // Status codes que indicam problemas de autenticação
    const authErrorCodes = [401, 403]
    
    if (!authErrorCodes.includes(status)) {
      return false
    }

    // Verificar se é endpoint de login/refresh - não redirecionar
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.pathname
      const isLoginPage = currentUrl.includes('/login') || currentUrl.includes('/auth')
      if (isLoginPage) {
        return false
      }
    }

    // Verificar mensagem de erro específica
    if (response?.data?.message) {
      const authMessages = [
        'token expirado',
        'token inválido',
        'não autorizado',
        'acesso negado',
        'authentication failed',
        'invalid token',
        'token expired'
      ]
      
      const message = response.data.message.toLowerCase()
      return authMessages.some(authMsg => message.includes(authMsg))
    }

    return true
  }

  /**
   * Redirecionar para login com limpeza de sessão
   * Em caso de dúvida, sempre deslogar e redirecionar para login (não home para evitar loops)
   */
  private async redirectToLogin(reason: string = 'Sessão expirada'): Promise<void> {
    if (this.isRedirecting) {
      return
    }

    // Detectar loop - se houve muitos redirecionamentos recentes, parar
    const now = Date.now()
    if (AuthInterceptor.lastRedirectTime > 0 && (now - AuthInterceptor.lastRedirectTime) < 5000) {
      AuthInterceptor.redirectCount++
    } else {
      AuthInterceptor.redirectCount = 1
    }
    AuthInterceptor.lastRedirectTime = now

    if (AuthInterceptor.redirectCount > 3) {
      console.error('[AuthInterceptor] Loop detectado! Parando redirecionamentos')
      this.isRedirecting = false
      return
    }

    this.isRedirecting = true

    try {
      console.warn(`[AuthInterceptor] Deslogando e redirecionando: ${reason} (tentativa ${AuthInterceptor.redirectCount})`)
      
      // Limpar sessão persistente
      await sessionPersistence.clearSession()
      
      // Limpar localStorage completamente
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_data')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_profile')
        localStorage.removeItem('user_perfil')
        localStorage.removeItem('user_permissoes')
        localStorage.removeItem('token')
        localStorage.removeItem('remembered_email')
        localStorage.removeItem('biometric_key')
        localStorage.removeItem('session_data')
        localStorage.removeItem('pwa_session')
        localStorage.removeItem('redirect_count')
        localStorage.removeItem('last_redirect_path')
        localStorage.removeItem('loop_detected')
        
        // Limpar sessionStorage também
        sessionStorage.clear()
        
        // Detectar se é PWA
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true ||
                      window.location.pathname.startsWith('/pwa')
        
        // Se já está em login, não redirecionar
        if (window.location.pathname === '/pwa/login' || window.location.pathname === '/') {
          this.isRedirecting = false
          return
        }
        
        // Redirecionar para login do PWA ou home
        const loginUrl = isPWA ? '/pwa/login' : '/'
        window.location.replace(loginUrl)
      }
    } catch (error) {
      console.error('[AuthInterceptor] Erro ao redirecionar:', error)
      // Não tentar redirecionar novamente em caso de erro
    } finally {
      // Resetar flag após um delay para permitir redirecionamento
      setTimeout(() => {
        this.isRedirecting = false
      }, 2000)
    }
  }

  /**
   * Interceptar resposta de fetch
   * Tenta fazer refresh token antes de redirecionar
   */
  async interceptFetchResponse(response: Response, url: string): Promise<Response> {
    // Verificar se é erro de autenticação
    if (this.isAuthenticationError(response.status)) {
      // Verificar se é endpoint de login/refresh - não tentar refresh
      const isLoginEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh')
      
      if (!isLoginEndpoint) {
        // Tentar fazer refresh token antes de redirecionar
        const refreshToken = typeof window !== 'undefined' 
          ? localStorage.getItem('refresh_token') 
          : null
        
        if (refreshToken) {
          console.warn(`[AuthInterceptor] Tentando fazer refresh token antes de redirecionar...`)
          try {
            const { refreshAuthToken } = await import('./api')
            const newToken = await refreshAuthToken()
            if (newToken) {
              console.log('[AuthInterceptor] Refresh token bem-sucedido, não redirecionando')
              // Não redirecionar, a requisição será refeita com o novo token
              return response
            }
          } catch (refreshError) {
            console.error('[AuthInterceptor] Falha ao fazer refresh token:', refreshError)
            // Se o refresh falhar, continuar com o redirecionamento
          }
        }
      }
      
      console.warn(`[AuthInterceptor] Erro de autenticação detectado: ${response.status}`)
      
      // Aguardar um pouco para evitar múltiplos redirecionamentos
      if (this.redirectTimeout) {
        clearTimeout(this.redirectTimeout)
      }
      
      this.redirectTimeout = setTimeout(() => {
        this.redirectToLogin(`Erro ${response.status} - ${response.statusText}`)
      }, 100)
    }

    return response
  }

  /**
   * Interceptar erro de fetch
   */
  async interceptFetchError(error: any, url: string): Promise<never> {
    console.error(`[AuthInterceptor] Erro na requisição para ${url}:`, error)

    // Verificar se é erro de rede que pode indicar problemas de autenticação
    if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      // Verificar se o token existe
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token')
        if (!token) {
          console.warn('[AuthInterceptor] Token não encontrado, redirecionando para login')
          await this.redirectToLogin('Token não encontrado')
        }
      }
    }

    throw error
  }

  /**
   * Interceptar resposta do axios
   */
  interceptAxiosResponse(response: any): any {
    // Axios já trata status codes automaticamente
    return response
  }

  /**
   * Interceptar erro do axios
   * Tenta fazer refresh token antes de redirecionar
   */
  async interceptAxiosError(error: any): Promise<never> {
    const status = error.response?.status
    const response = error.response

    console.error('[AuthInterceptor] Erro do axios:', {
      status,
      url: error.config?.url,
      message: error.message
    })

    // Verificar se é erro de autenticação
    if (this.isAuthenticationError(status, response)) {
      // Verificar se é endpoint de login/refresh - não tentar refresh
      const isLoginEndpoint = error.config?.url?.includes('/auth/login') || 
                             error.config?.url?.includes('/auth/refresh')
      
      if (!isLoginEndpoint) {
        // Tentar fazer refresh token antes de redirecionar
        const refreshToken = typeof window !== 'undefined' 
          ? localStorage.getItem('refresh_token') 
          : null
        
        if (refreshToken) {
          console.warn(`[AuthInterceptor] Tentando fazer refresh token antes de redirecionar...`)
          try {
            // Usar import dinâmico para evitar import circular
            const { refreshAuthToken } = await import('./api')
            const newToken = await refreshAuthToken()
            if (newToken) {
              console.log('[AuthInterceptor] Refresh token bem-sucedido, não redirecionando')
              // Não redirecionar, deixar o interceptor do axios tentar novamente
              throw error // Re-throw para o interceptor do axios processar
            }
          } catch (refreshError) {
            console.error('[AuthInterceptor] Falha ao fazer refresh token:', refreshError)
            // Se o refresh falhar, redirecionar
          }
        }
      }
      
      console.warn(`[AuthInterceptor] Erro de autenticação do axios: ${status}`)
      
      // Aguardar um pouco para evitar múltiplos redirecionamentos
      if (this.redirectTimeout) {
        clearTimeout(this.redirectTimeout)
      }
      
      this.redirectTimeout = setTimeout(() => {
        this.redirectToLogin(`Erro ${status} - ${response?.data?.message || error.message}`)
      }, 100)
    }

    throw error
  }

  /**
   * Verificar se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user_data')
    
    return !!(token && userData)
  }

  /**
   * Verificar se deve redirecionar para login
   */
  shouldRedirectToLogin(): boolean {
    if (typeof window === 'undefined') return false
    
    const currentPath = window.location.pathname
    const isLoginPage = currentPath.includes('/login') || currentPath.includes('/auth')
    
    return !isLoginPage && !this.isAuthenticated()
  }

  /**
   * Verificar autenticação e redirecionar se necessário
   */
  checkAuthAndRedirect(): void {
    if (this.shouldRedirectToLogin()) {
      console.warn('[AuthInterceptor] Usuário não autenticado, redirecionando para login')
      this.redirectToLogin('Usuário não autenticado')
    }
  }
}

// Instância singleton
export const authInterceptor = new AuthInterceptor()

/**
 * Wrapper para fetch com interceptação automática
 */
export async function fetchWithAuthInterceptor(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  try {
    const response = await fetch(url, options)
    
    // Interceptar resposta
    await authInterceptor.interceptFetchResponse(response, url)
    
    return response
  } catch (error) {
    // Interceptar erro
    await authInterceptor.interceptFetchError(error, url)
    throw error
  }
}

/**
 * Hook para verificar autenticação em componentes
 */
export function useAuthCheck() {
  if (typeof window !== 'undefined') {
    // Verificar autenticação ao montar o componente
    authInterceptor.checkAuthAndRedirect()
  }
}

/**
 * Função para verificar se uma resposta indica erro de autenticação
 */
export function isAuthError(response: Response): boolean {
  return authInterceptor.isAuthenticationError(response.status)
}

/**
 * Função para verificar se um erro indica problema de autenticação
 */
export function isAuthErrorResponse(error: any): boolean {
  const status = error.response?.status || error.status
  return authInterceptor.isAuthenticationError(status, error.response)
}
