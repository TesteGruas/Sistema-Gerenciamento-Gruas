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

import type { Permission } from '@/types/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: React.ReactNode
  showAccessDenied?: boolean
  redirectTo?: string
  minLevel?: number
}

/**
 * Componente ProtectedRoute - Versão 2.0 (Sistema Simplificado)
 * Protege rotas baseado em permissões hardcoded do sistema simplificado.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback,
  showAccessDenied = true,
  redirectTo = '/dashboard',
  minLevel
}) => {
  const { user, isLoading } = useAuth()
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    hasMinLevel,
    canAccessDashboard,
    userRole,
    level
  } = usePermissions()

  // Mostrar loading enquanto carrega dados do usuário
  // OU enquanto o role não está disponível mas há verificação de permissão necessária
  // Isso evita mostrar "Acesso Negado" antes dos dados estarem prontos
  const needsPermissionCheck = permission || permissions.length > 0 || minLevel !== undefined
  const isRoleLoading = user && !userRole && needsPermissionCheck
  
  if (isLoading || isRoleLoading) {
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

  // Verificar nível mínimo se especificado
  if (minLevel !== undefined) {
    hasAccess = hasMinLevel(minLevel as any)
  } 
  // Verificar permissão única
  else if (permission) {
    hasAccess = hasPermission(permission)
  } 
  // Verificar múltiplas permissões
  else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions)
    } else {
      hasAccess = hasAnyPermission(permissions)
    }
  } 
  // Se não especificou permissões, permite acesso
  else {
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
          <div className="text-sm text-gray-600 space-y-2">
            <div>
              <span className="font-medium">Role atual:</span>{' '}
              <strong className="text-gray-900">{userRole || 'Não definido'}</strong>
              {level > 0 && <span className="text-gray-500"> (Nível {level})</span>}
            </div>
            {minLevel && (
              <div>
                <span className="font-medium">Nível requerido:</span>{' '}
                <strong className="text-red-600">{minLevel}</strong>
              </div>
            )}
            {permission && (
              <div>
                <span className="font-medium">Permissão necessária:</span>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{permission}</code>
              </div>
            )}
            {permissions.length > 0 && (
              <div>
                <span className="font-medium">Permissões {requireAll ? '(todas)' : '(qualquer uma)'}:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {permissions.map(p => (
                    <code key={p} className="bg-gray-100 px-2 py-1 rounded text-xs">{p}</code>
                  ))}
                </div>
              </div>
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
