"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Smartphone, Lock } from "lucide-react"

interface PWAAuthGuardProps {
  children: React.ReactNode
}

export function PWAAuthGuard({ children }: PWAAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      // Permitir acesso sem autenticação apenas para /pwa/login e /pwa/redirect
      const publicPaths = ['/pwa/login', '/pwa/redirect']
      const isPublicPath = publicPaths.some(path => pathname === path)
      
      if (isPublicPath) {
        setIsLoading(false)
        setIsAuthenticated(true) // Permitir renderização
        return
      }

      // Verificar se há token e dados do usuário
      const token = localStorage.getItem('access_token')
      const userData = localStorage.getItem('user_data')

      if (!token || !userData) {
        console.log('PWA Auth Guard: Sem credenciais, redirecionando para login')
        router.push('/pwa/login')
        return
      }

      // Verificar se o token não está expirado
      try {
        const tokenParts = token.split('.')
        if (tokenParts.length !== 3) {
          throw new Error('Token inválido')
        }

        const payload = JSON.parse(atob(tokenParts[1]))
        const isExpired = payload.exp * 1000 < Date.now()
        
        if (isExpired) {
          console.log('PWA Auth Guard: Token expirado')
          localStorage.removeItem('access_token')
          localStorage.removeItem('user_data')
          localStorage.removeItem('refresh_token')
          router.push('/pwa/login')
          return
        }
      } catch (error) {
        console.error('Erro ao validar token:', error)
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_data')
        localStorage.removeItem('refresh_token')
        router.push('/pwa/login')
        return
      }

      // Token válido, permitir acesso
      setIsAuthenticated(true)
      setIsLoading(false)
    }

    checkAuth()

    // Verificar autenticação a cada 5 minutos
    const interval = setInterval(checkAuth, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [pathname, router])

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

