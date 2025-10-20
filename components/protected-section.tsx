"use client"

import React from 'react'
import { usePermissions } from '@/hooks/use-permissions'

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
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions)
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
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  const canAccess = (permission?: string, permissions?: string[], requireAll = false) => {
    if (permission) {
      return hasPermission(permission)
    }
    
    if (permissions && permissions.length > 0) {
      if (requireAll) {
        return hasAllPermissions(permissions)
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
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions)
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
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
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
