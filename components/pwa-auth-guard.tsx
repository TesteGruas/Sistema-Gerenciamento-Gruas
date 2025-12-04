"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Smartphone, Lock } from "lucide-react"

interface PWAAuthGuardProps {
  children: React.ReactNode
}

// Flag global para evitar múltiplos redirecionamentos simultâneos
let isRedirecting = false
let redirectTimeout: NodeJS.Timeout | null = null

export function PWAAuthGuard({ children }: PWAAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  // Função para limpar todos os dados de autenticação
  const limparDadosAutenticacao = () => {
    if (typeof window === 'undefined') return
    
    // Remover todos os tokens e dados do usuário
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('user_profile')
    localStorage.removeItem('user_perfil')
    localStorage.removeItem('token')
    localStorage.removeItem('remembered_email')
    localStorage.removeItem('biometric_key')
    localStorage.removeItem('session_data')
    localStorage.removeItem('pwa_session')
    localStorage.removeItem('redirect_count')
    localStorage.removeItem('last_redirect_path')
    localStorage.removeItem('redirect_timestamp')
    localStorage.removeItem('loop_detected')
    
    // Limpar também sessionStorage
    sessionStorage.clear()
    
    console.log('[PWAAuthGuard] Todos os dados de autenticação foram removidos')
  }
  
  // Função para detectar e parar loop
  const detectarLoop = (): boolean => {
    if (typeof window === 'undefined') return false
    
    const loopDetected = localStorage.getItem('loop_detected') === 'true'
    if (loopDetected) {
      console.warn('[PWAAuthGuard] Loop já detectado anteriormente, parando verificações')
      return true
    }
    
    const redirectCount = parseInt(localStorage.getItem('redirect_count') || '0', 10)
    const lastRedirectTime = parseInt(localStorage.getItem('redirect_timestamp') || '0', 10)
    const now = Date.now()
    
    // Se houve mais de 2 redirecionamentos nos últimos 10 segundos, é um loop
    if (redirectCount > 2 && (now - lastRedirectTime) < 10000) {
      console.error('[PWAAuthGuard] LOOP DETECTADO! Parando redirecionamentos')
      localStorage.setItem('loop_detected', 'true')
      limparDadosAutenticacao()
      
      // Mostrar mensagem e parar completamente
      if (pathname !== '/pwa/login' && pathname !== '/') {
        window.location.replace('/pwa/login')
      }
      return true
    }
    
    return false
  }
  
  // Garantir que só renderiza no cliente para evitar erro de hidratação
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const checkAuth = () => {
      // Garantir que estamos no cliente
      if (typeof window === 'undefined') {
        return
      }

      // Se já está redirecionando, não fazer nada
      if (isRedirecting) {
        return
      }

      // Verificar se loop foi detectado
      if (detectarLoop()) {
        setIsLoading(false)
        setIsAuthenticated(false)
        return
      }

      // Permitir acesso sem autenticação para rotas públicas
      const publicPaths = ['/pwa/login', '/pwa/redirect', '/pwa/test-api', '/']
      const isPublicPath = publicPaths.some(path => pathname === path || pathname?.startsWith(path))
      
      if (isPublicPath) {
        setIsLoading(false)
        setIsAuthenticated(true)
        
        // Resetar contador de redirecionamentos quando em rota pública
        localStorage.removeItem('redirect_count')
        localStorage.removeItem('last_redirect_path')
        localStorage.removeItem('redirect_timestamp')
        localStorage.removeItem('loop_detected')
        return
      }

      // Verificar se há token e dados do usuário
      const token = localStorage.getItem('access_token')
      const userData = localStorage.getItem('user_data')

      // Se não tem token ou userData, sempre deslogar e ir para login
      if (!token || !userData) {
        setIsLoading(false)
        setIsAuthenticated(false)
        
        // Se já estamos em login, não fazer nada
        if (pathname === '/pwa/login') {
          return
        }
        
        // Incrementar contador e registrar timestamp
        const redirectCount = parseInt(localStorage.getItem('redirect_count') || '0', 10) + 1
        localStorage.setItem('redirect_count', redirectCount.toString())
        localStorage.setItem('redirect_timestamp', Date.now().toString())
        
        // Limpar dados e redirecionar apenas uma vez
        if (!isRedirecting) {
          isRedirecting = true
          limparDadosAutenticacao()
          
          // Usar timeout para evitar múltiplos redirecionamentos
          if (redirectTimeout) {
            clearTimeout(redirectTimeout)
          }
          
          redirectTimeout = setTimeout(() => {
            window.location.replace('/pwa/login')
            isRedirecting = false
          }, 500)
        }
        return
      }
      
      // Se tem token e userData, resetar contador (login válido)
      localStorage.removeItem('redirect_count')
      localStorage.removeItem('last_redirect_path')
      localStorage.removeItem('redirect_timestamp')
      localStorage.removeItem('loop_detected')

      // Verificar se o token está expirado
      try {
        const tokenParts = token.split('.')
        if (tokenParts.length === 3) {
          try {
            const payload = JSON.parse(atob(tokenParts[1]))
            if (payload.exp) {
              const isExpired = payload.exp * 1000 < Date.now()
              
              // Se token expirado, sempre deslogar e ir para login
              if (isExpired) {
                console.warn('[PWAAuthGuard] Token expirado, deslogando')
                setIsLoading(false)
                setIsAuthenticated(false)
                
                // Se já estamos em login, não fazer nada
                if (pathname === '/pwa/login') {
                  return
                }
                
                // Incrementar contador
                const redirectCount = parseInt(localStorage.getItem('redirect_count') || '0', 10) + 1
                localStorage.setItem('redirect_count', redirectCount.toString())
                localStorage.setItem('redirect_timestamp', Date.now().toString())
                
                // Limpar e redirecionar apenas uma vez
                if (!isRedirecting) {
                  isRedirecting = true
                  limparDadosAutenticacao()
                  
                  if (redirectTimeout) {
                    clearTimeout(redirectTimeout)
                  }
                  
                  redirectTimeout = setTimeout(() => {
                    window.location.replace('/pwa/login')
                    isRedirecting = false
                  }, 500)
                }
                return
              }
            }
          } catch (decodeError) {
            // Se não conseguir decodificar o token, em caso de dúvida, deslogar
            console.warn('[PWAAuthGuard] Erro ao decodificar token, deslogando por segurança')
            setIsLoading(false)
            setIsAuthenticated(false)
            
            if (pathname === '/pwa/login') {
              return
            }
            
            if (!isRedirecting) {
              isRedirecting = true
              limparDadosAutenticacao()
              
              if (redirectTimeout) {
                clearTimeout(redirectTimeout)
              }
              
              redirectTimeout = setTimeout(() => {
                window.location.replace('/pwa/login')
                isRedirecting = false
              }, 500)
            }
            return
          }
        }
      } catch (error) {
        // Em caso de erro, deslogar por segurança
        console.warn('[PWAAuthGuard] Erro ao verificar token, deslogando por segurança')
        setIsLoading(false)
        setIsAuthenticated(false)
        
        if (pathname === '/pwa/login') {
          return
        }
        
        if (!isRedirecting) {
          isRedirecting = true
          limparDadosAutenticacao()
          
          if (redirectTimeout) {
            clearTimeout(redirectTimeout)
          }
          
          redirectTimeout = setTimeout(() => {
            window.location.replace('/pwa/login')
            isRedirecting = false
          }, 500)
        }
        return
      }

      // Token existe e é válido, permitir acesso
      // Resetar contador de redirecionamentos quando autenticado com sucesso
      localStorage.removeItem('redirect_count')
      localStorage.removeItem('last_redirect_path')
      localStorage.removeItem('redirect_timestamp')
      localStorage.removeItem('loop_detected')
      setIsAuthenticated(true)
      setIsLoading(false)
    }

    // Pequeno delay para evitar flash de loading
    const timer = setTimeout(() => {
      checkAuth()
    }, 100)

    // Verificar autenticação a cada 5 minutos (mas não se loop foi detectado)
    const interval = setInterval(() => {
      if (!localStorage.getItem('loop_detected')) {
        checkAuth()
      }
    }, 5 * 60 * 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      if (redirectTimeout) {
        clearTimeout(redirectTimeout)
      }
    }
  }, [pathname, router])

  // Não renderizar nada no servidor para evitar erro de hidratação
  if (!isClient) {
    return null
  }

  // Mostrar tela de loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Verificando autenticação...</p>
          <p className="text-gray-500 text-sm mt-2">Por favor, aguarde</p>
        </div>
      </div>
    )
  }

  // Se não estiver autenticado e não for rota pública, não renderizar nada
  // (já redirecionou para login)
  if (!isAuthenticated && pathname !== '/pwa/login' && pathname !== '/pwa/redirect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-700 font-medium">Acesso não autorizado</p>
          <p className="text-gray-500 text-sm mt-2">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

