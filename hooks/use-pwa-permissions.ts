"use client"

import { useMemo, useEffect, useState, useCallback } from 'react'
import { useAuth } from './use-auth'
import { usePWAUser } from './use-pwa-user'
import { normalizeRoleName, type RoleName, type Permission } from '@/types/permissions'
import {
  getPWAPermissions,
  hasPWAPermission,
  hasPWAAnyPermission,
  hasPWAAllPermissions,
  getAccessiblePWAMenuItems,
  canAccessPWA,
  getPWAAccessLevel,
  hasPWAMinLevel,
  getPWAHomePage,
  getPWARoleDescription,
  getPWAFeatures,
  type PWAMenuItem
} from '@/app/pwa/lib/permissions'
import {
  type PWAProfile,
  type PWAProfileUserData,
  resolvePWAProfile,
  getPWAProfilePermissions,
  hasPWAProfilePermission,
  getPWAProfileHomePage,
  getPWAProfileDescription,
  canAccessRoute,
} from '@/app/pwa/lib/pwa-profile'

function readUserDataFromStorage(): PWAProfileUserData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user_data')
    if (!raw) return null
    return JSON.parse(raw) as PWAProfileUserData
  } catch {
    return null
  }
}

/**
 * Hook de Permissões PWA
 *
 * Gerencia permissões via perfil operacional (cliente | supervisor | tecnico)
 * e mantém compatibilidade com roles globais do sistema.
 */
export const usePWAPermissions = () => {
  const pwaUser = usePWAUser()
  const authUser = useAuth()

  const user = pwaUser?.user || authUser?.user
  const loading = pwaUser?.loading ?? authUser?.isLoading ?? true

  const [storedUserData, setStoredUserData] = useState<PWAProfileUserData | null>(null)

  useEffect(() => {
    setStoredUserData(readUserDataFromStorage())
  }, [user])

  const pwaProfile = useMemo((): PWAProfile | null => {
    const backendProfile = storedUserData?.pwa_profile
    if (
      backendProfile === 'cliente' ||
      backendProfile === 'supervisor' ||
      backendProfile === 'tecnico'
    ) {
      return backendProfile
    }

    const fromStorage = resolvePWAProfile(storedUserData)
    if (fromStorage) return fromStorage

    const fromUser: PWAProfileUserData = {
      pwa_profile: (user as { pwa_profile?: PWAProfile })?.pwa_profile,
      funcionario_id: (user as { funcionario_id?: number | string })?.funcionario_id,
      user_metadata: (user as { user_metadata?: { tipo?: string; funcionario_id?: number | string } })?.user_metadata,
    }
    return resolvePWAProfile(fromUser)
  }, [storedUserData, user])

  const userRole = useMemo((): RoleName | null => {
    if (pwaProfile === 'tecnico') return 'Operários'
    if (pwaProfile === 'supervisor' || pwaProfile === 'cliente') return 'Clientes'
    return normalizeRoleName(user?.role || undefined) || null
  }, [pwaProfile, user?.role])

  const permissions = useMemo(() => {
    if (pwaProfile) return getPWAProfilePermissions(pwaProfile)
    if (!userRole) return []
    return getPWAPermissions(userRole)
  }, [pwaProfile, userRole])

  const level = useMemo(() => {
    if (!userRole) return 0
    return getPWAAccessLevel(userRole)
  }, [userRole])

  const menuItems = useMemo(() => {
    return getAccessiblePWAMenuItems(userRole, pwaProfile)
  }, [userRole, pwaProfile])

  const homePage = useMemo(() => {
    if (pwaProfile) return getPWAProfileHomePage(pwaProfile)
    if (!userRole) return '/pwa'
    return getPWAHomePage(userRole)
  }, [pwaProfile, userRole])

  const roleDescription = useMemo(() => {
    if (pwaProfile) return getPWAProfileDescription(pwaProfile)
    if (!userRole) return ''
    return getPWARoleDescription(userRole)
  }, [pwaProfile, userRole])

  const features = useMemo(() => {
    if (!userRole) return []
    return getPWAFeatures(userRole)
  }, [userRole])

  const checkPermission = useCallback(
    (permission: Permission): boolean => {
      if (pwaProfile) return hasPWAProfilePermission(pwaProfile, permission)
      if (!userRole) return false
      return hasPWAPermission(userRole, permission)
    },
    [pwaProfile, userRole]
  )

  const hasPermission = (permission: Permission): boolean => checkPermission(permission)

  const hasAnyPermission = (permissionList: Permission[]): boolean => {
    return permissionList.some(perm => checkPermission(perm))
  }

  const hasAllPermissions = (permissionList: Permission[]): boolean => {
    return permissionList.every(perm => checkPermission(perm))
  }

  const hasMinLevel = (minLevel: number): boolean => {
    if (!userRole) return false
    return hasPWAMinLevel(userRole, minLevel as Parameters<typeof hasPWAMinLevel>[1])
  }

  const canAccess = (): boolean => {
    if (pwaProfile) return true
    return canAccessPWA(userRole)
  }

  const isAdmin = useCallback(() => userRole === 'Admin', [userRole])
  const isManager = useCallback(() => userRole === 'Gestores', [userRole])
  const isSupervisor = useCallback(() => pwaProfile === 'supervisor', [pwaProfile])
  const isClient = useCallback(() => pwaProfile === 'cliente', [pwaProfile])
  const isTecnico = useCallback(() => pwaProfile === 'tecnico', [pwaProfile])
  const isOperator = useCallback(() => pwaProfile === 'tecnico' || userRole === 'Operários', [pwaProfile, userRole])

  const canRegisterPonto = (): boolean => {
    return hasPermission('ponto:registrar') || hasPermission('ponto_eletronico:registrar')
  }

  const canViewEspelhoPonto = (): boolean => {
    return hasPermission('ponto:visualizar') || hasPermission('ponto_eletronico:visualizar')
  }

  const canApproveHoras = (): boolean => {
    return hasPermission('ponto:aprovacoes') || hasPermission('ponto_eletronico:aprovacoes')
  }

  const canViewGruas = (): boolean => hasPermission('gruas:visualizar')
  const canViewDocuments = (): boolean => hasPermission('documentos:visualizar')
  const canSignDocuments = (): boolean =>
    hasPermission('documentos:assinatura') || hasPermission('assinatura_digital:visualizar')
  const canManageDocuments = (): boolean => hasPermission('documentos:gerenciar')
  const canViewNotifications = (): boolean => hasPermission('notificacoes:visualizar')

  const canAccessRouteForProfile = (pathname: string): boolean => {
    if (!pwaProfile) return true
    return canAccessRoute(pwaProfile, pathname)
  }

  const canAccessModule = (module: string): boolean => {
    if (permissions.includes('*' as Permission)) return true
    return permissions.some(p => p === `${module}:*` || p.startsWith(`${module}:`))
  }

  const canAccessMenuItem = (item: PWAMenuItem): boolean => {
    if (item.permission === '*') return true

    if (Array.isArray(item.permission)) {
      if (item.requireAll) return hasAllPermissions(item.permission)
      return hasAnyPermission(item.permission)
    }

    return hasPermission(item.permission)
  }

  const debugPermissions = () => {
    if (process.env.NODE_ENV !== 'development') return
  }

  return {
    user,
    userRole,
    pwaProfile,
    loading,
    level,
    permissions,
    menuItems,
    homePage,
    roleDescription,
    features,

    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMinLevel,
    canAccess,

    isAdmin,
    isManager,
    isSupervisor,
    isClient,
    isTecnico,
    isOperator,

    canRegisterPonto,
    canViewEspelhoPonto,
    canApproveHoras,
    canViewGruas,
    canViewDocuments,
    canSignDocuments,
    canManageDocuments,
    canViewNotifications,

    canAccessMenuItem,
    canAccessRouteForProfile,
    canAccessModule,
    debugPermissions,
  }
}

export default usePWAPermissions
