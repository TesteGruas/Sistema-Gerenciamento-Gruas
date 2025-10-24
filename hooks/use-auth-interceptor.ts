"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authInterceptor } from "@/lib/auth-interceptor"

/**
 * Hook para verificar autenticação e redirecionar automaticamente
 */
export function useAuthInterceptor() {
  const router = useRouter()

  useEffect(() => {
    // Verificar autenticação ao montar o componente
    authInterceptor.checkAuthAndRedirect()
  }, [])

  return {
    isAuthenticated: authInterceptor.isAuthenticated(),
    checkAuth: () => authInterceptor.checkAuthAndRedirect()
  }
}

/**
 * Hook para interceptar erros de API e redirecionar se necessário
 */
export function useApiErrorHandler() {
  const router = useRouter()

  const handleApiError = async (error: any) => {
    try {
      // Verificar se é erro de autenticação
      if (authInterceptor.isAuthenticationError(error.response?.status, error.response)) {
        console.warn('[useApiErrorHandler] Erro de autenticação detectado')
        // O auth interceptor já vai redirecionar automaticamente
        return
      }

      // Outros tipos de erro podem ser tratados aqui
      if (error.response?.status >= 500) {
        console.error('[useApiErrorHandler] Erro do servidor:', error.response?.data)
      }
    } catch (interceptorError) {
      console.error('[useApiErrorHandler] Erro no interceptor:', interceptorError)
    }
  }

  return {
    handleApiError
  }
}

/**
 * Hook para verificar se deve mostrar loading durante redirecionamento
 */
export function useAuthRedirect() {
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Verificar se está redirecionando
    const checkRedirect = () => {
      const currentPath = window.location.pathname
      const isLoginPage = currentPath.includes('/login') || currentPath.includes('/auth')
      const isAuthenticated = authInterceptor.isAuthenticated()
      
      if (!isLoginPage && !isAuthenticated) {
        setIsRedirecting(true)
      } else {
        setIsRedirecting(false)
      }
    }

    checkRedirect()
    
    // Verificar a cada segundo se está redirecionando
    const interval = setInterval(checkRedirect, 1000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    isRedirecting
  }
}
