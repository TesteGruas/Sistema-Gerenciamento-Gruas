"use client"

import { useEffect, useState } from "react"
import { PageLoader } from "@/components/ui/loader"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Garantir que estamos no cliente
    if (typeof window === 'undefined') {
      return
    }

    const checkAuth = () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token')
        
        if (token && token.trim() !== '') {
          // Token encontrado - usuário autenticado
          setIsAuthenticated(true)
        } else {
          // Sem token - redirecionar para login sem mostrar mensagem
          setIsAuthenticated(false)
          window.location.href = '/'
          return
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        setIsAuthenticated(false)
        window.location.href = '/'
        return
      } finally {
        // Sempre marcar como verificação completa
        setIsChecking(false)
      }
    }

    // Pequeno delay para garantir que o estado inicial seja renderizado primeiro
    // Isso evita o flash da mensagem de erro
    const timer = setTimeout(() => {
    checkAuth()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Mostrar loading enquanto verifica autenticação
  // Nunca mostrar a mensagem de erro durante a verificação inicial
  if (isAuthenticated === null || isChecking) {
    return <PageLoader text="Verificando autenticação..." />
  }

  // Se autenticado, mostrar conteúdo
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Se não autenticado e verificação completa, mostrar fallback
  // Mas na prática, o redirecionamento já deve ter acontecido
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você precisa fazer login para acessar esta página.</p>
        </div>
      </div>
    )
}

export default AuthGuard
