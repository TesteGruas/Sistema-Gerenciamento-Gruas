"use client"

import { useEffect, useState } from "react"
import { PageLoader } from "@/components/ui/loader"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token')
        if (token) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          // Redirecionar para login
          window.location.href = '/'
        }
      }
    }

    checkAuth()
  }, [])

  // Mostrar loading enquanto verifica autenticação
  if (isAuthenticated === null) {
    return <PageLoader text="Verificando autenticação..." />
  }

  // Se não autenticado, mostrar fallback ou redirecionar
  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você precisa fazer login para acessar esta página.</p>
        </div>
      </div>
    )
  }

  // Se autenticado, mostrar conteúdo
  return <>{children}</>
}

export default AuthGuard
