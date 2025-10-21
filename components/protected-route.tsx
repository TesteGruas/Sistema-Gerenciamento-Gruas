"use client"

import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionFallback } from './permission-fallback'
import { WelcomeScreen } from './welcome-screen'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Lock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ProtectedRouteProps {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  showAccessDenied?: boolean
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback,
  showAccessDenied = true,
  redirectTo = '/dashboard'
}) => {
  const { user, isLoading } = useAuth()
  const { hasPermission, hasAnyPermission, canAccessDashboard } = usePermissions()

  // Mostrar loading enquanto carrega dados do usuário
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Se não estiver autenticado
  if (!user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <Shield className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <CardTitle className="text-xl">Acesso Negado</CardTitle>
          <CardDescription>
            Você precisa estar logado para acessar esta página.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/auth/login">Fazer Login</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Verificar permissões
  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = permissions.every(p => hasPermission(p))
    } else {
      hasAccess = hasAnyPermission(permissions)
    }
  } else {
    // Se não especificou permissões, permite acesso
    hasAccess = true
  }

  // Se tem acesso, renderiza o conteúdo
  if (hasAccess) {
    return <>{children}</>
  }

  // Se não tem acesso ao dashboard, mostrar tela de boas-vindas
  if (permission === 'dashboard:visualizar' || (permissions.length === 0 && !permission)) {
    if (!canAccessDashboard()) {
      return <WelcomeScreen user={user} />
    }
  }

  // Se não tem acesso e não deve mostrar fallback customizado
  if (fallback) {
    return <>{fallback}</>
  }

  // Se não tem acesso, usar o fallback melhorado
  if (showAccessDenied) {
    return (
      <PermissionFallback permission={permission || permissions?.[0] || ''}>
        {children}
      </PermissionFallback>
    )
  }

  // Fallback antigo (mantido para compatibilidade)
  if (true) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <Lock className="w-12 h-12 mx-auto text-orange-500 mb-4" />
          <CardTitle className="text-xl">Acesso Restrito</CardTitle>
          <CardDescription>
            Você não tem permissão para acessar esta página.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-sm text-gray-600">
            <p>Perfil atual: <strong>{user.perfil?.nome || 'Não definido'}</strong></p>
            {permission && (
              <p>Permissão necessária: <code className="bg-gray-100 px-2 py-1 rounded">{permission}</code></p>
            )}
            {permissions.length > 0 && (
              <p>Permissões necessárias: {permissions.map(p => (
                <code key={p} className="bg-gray-100 px-2 py-1 rounded mr-1">{p}</code>
              ))}</p>
            )}
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" asChild>
              <Link href={redirectTo}>Voltar ao Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/usuarios">Solicitar Acesso</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Se não deve mostrar nada, retorna null
  return null
}

// Componente para proteger seções específicas
interface ProtectedSectionProps {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  className?: string
}

export const ProtectedSection: React.FC<ProtectedSectionProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback,
  className = ""
}) => {
  const { hasPermission, hasAnyPermission } = usePermissions()

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = permissions.every(p => hasPermission(p))
    } else {
      hasAccess = hasAnyPermission(permissions)
    }
  } else {
    hasAccess = true
  }

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null
  }

  return <div className={className}>{children}</div>
}

// Hook para verificar permissões em componentes
export const usePermissionCheck = () => {
  const { hasPermission, hasAnyPermission } = usePermissions()

  const canAccess = (permission?: string, permissions?: string[], requireAll = false) => {
    if (permission) {
      return hasPermission(permission)
    }
    
    if (permissions && permissions.length > 0) {
      if (requireAll) {
        return permissions.every(p => hasPermission(p))
      } else {
        return hasAnyPermission(permissions)
      }
    }
    
    return true
  }

  return { canAccess }
}

// Componente para mostrar avisos de permissão
interface PermissionWarningProps {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  message?: string
  className?: string
}

export const PermissionWarning: React.FC<PermissionWarningProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  message = "Você não tem permissão para realizar esta ação.",
  className = ""
}) => {
  const { hasPermission, hasAnyPermission } = usePermissions()

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = permissions.every(p => hasPermission(p))
    } else {
      hasAccess = hasAnyPermission(permissions)
    }
  } else {
    hasAccess = true
  }

  if (hasAccess) {
    return null
  }

  return (
    <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <p className="text-sm text-orange-800">{message}</p>
          {permission && (
            <p className="text-xs text-orange-600 mt-1">
              Permissão necessária: <code className="bg-orange-100 px-1 py-0.5 rounded">{permission}</code>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
