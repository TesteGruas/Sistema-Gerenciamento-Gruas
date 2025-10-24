/**
 * Interceptor Global de Autenticação
 * Captura erros de autenticação e redireciona para login automaticamente
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
   */
  private async redirectToLogin(reason: string = 'Sessão expirada'): Promise<void> {
    if (this.isRedirecting) {
      return
    }

    this.isRedirecting = true

    try {
      console.warn(`[AuthInterceptor] Redirecionando para login: ${reason}`)
      
      // Limpar sessão persistente
      await sessionPersistence.clearSession()
      
      // Limpar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_data')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_profile')
        localStorage.removeItem('user_perfil')
        localStorage.removeItem('user_permissoes')
      }

      // Redirecionar para login
      if (typeof window !== 'undefined') {
        // Usar replace para não permitir voltar
        window.location.replace('/pwa/login')
      }
    } catch (error) {
      console.error('[AuthInterceptor] Erro ao redirecionar para login:', error)
      // Forçar redirecionamento mesmo com erro
      if (typeof window !== 'undefined') {
        window.location.href = '/pwa/login'
      }
    } finally {
      this.isRedirecting = false
    }
  }

  /**
   * Interceptar resposta de fetch
   */
  async interceptFetchResponse(response: Response, url: string): Promise<Response> {
    // Verificar se é erro de autenticação
    if (this.isAuthenticationError(response.status)) {
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
