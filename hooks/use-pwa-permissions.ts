"use client"

import { useMemo } from 'react'
import { useAuth } from './use-auth'
import { usePWAUser } from './use-pwa-user'
import type { RoleName, Permission } from '@/types/permissions'
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

/**
 * Hook de Permissões PWA
 * 
 * Hook específico para gerenciar permissões no aplicativo PWA.
 * Usa o sistema simplificado de 5 roles principais.
 */
export const usePWAPermissions = () => {
  // Tentar usar hook PWA específico primeiro, senão usar auth geral
  const pwaUser = usePWAUser()
  const authUser = useAuth()
  
  const user = pwaUser?.user || authUser?.user
  const loading = pwaUser?.loading ?? authUser?.isLoading ?? true
  
  const userRole = user?.role as RoleName | null

  // ========================================
  // PERMISSÕES
  // ========================================

  /**
   * Lista de permissões PWA do usuário
   */
  const permissions = useMemo(() => {
    if (!userRole) return []
    return getPWAPermissions(userRole)
  }, [userRole])

  /**
   * Nível de acesso do usuário
   */
  const level = useMemo(() => {
    if (!userRole) return 0
    return getPWAAccessLevel(userRole)
  }, [userRole])

  /**
   * Itens do menu PWA acessíveis
   */
  const menuItems = useMemo(() => {
    return getAccessiblePWAMenuItems(userRole)
  }, [userRole])

  /**
   * Página inicial do PWA para o role
   */
  const homePage = useMemo(() => {
    if (!userRole) return '/pwa'
    return getPWAHomePage(userRole)
  }, [userRole])

  /**
   * Descrição do que o role pode fazer no PWA
   */
  const roleDescription = useMemo(() => {
    if (!userRole) return ''
    return getPWARoleDescription(userRole)
  }, [userRole])

  /**
   * Funcionalidades disponíveis para o role
   */
  const features = useMemo(() => {
    if (!userRole) return []
    return getPWAFeatures(userRole)
  }, [userRole])

  // ========================================
  // VERIFICAÇÕES DE PERMISSÃO
  // ========================================

  /**
   * Verifica se tem permissão específica
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!userRole) return false
    return hasPWAPermission(userRole, permission)
  }

  /**
   * Verifica se tem qualquer uma das permissões
   */
  const hasAnyPermission = (permissionList: Permission[]): boolean => {
    if (!userRole) return false
    return hasPWAAnyPermission(userRole, permissionList)
  }

  /**
   * Verifica se tem todas as permissões
   */
  const hasAllPermissions = (permissionList: Permission[]): boolean => {
    if (!userRole) return false
    return hasPWAAllPermissions(userRole, permissionList)
  }

  /**
   * Verifica se tem nível mínimo de acesso
   */
  const hasMinLevel = (minLevel: number): boolean => {
    if (!userRole) return false
    return hasPWAMinLevel(userRole, minLevel as any)
  }

  /**
   * Verifica se pode acessar o PWA
   */
  const canAccess = (): boolean => {
    return canAccessPWA(userRole)
  }

  // ========================================
  // VERIFICAÇÕES POR ROLE
  // ========================================

  const isAdmin = () => userRole === 'Admin'
  const isManager = () => userRole === 'Gestores'
  const isSupervisor = () => userRole === 'Supervisores'
  const isOperator = () => userRole === 'Operários'
  const isClient = () => userRole === 'Clientes'

  // ========================================
  // VERIFICAÇÕES DE FUNCIONALIDADES
  // ========================================

  /**
   * Pode registrar ponto?
   */
  const canRegisterPonto = (): boolean => {
    return hasPermission('ponto:registrar') || hasPermission('ponto_eletronico:registrar')
  }

  /**
   * Pode visualizar espelho de ponto?
   */
  const canViewEspelhoPonto = (): boolean => {
    return hasPermission('ponto:visualizar') || hasPermission('ponto_eletronico:visualizar')
  }

  /**
   * Pode aprovar horas extras?
   */
  const canApproveHoras = (): boolean => {
    return hasPermission('ponto:aprovacoes') || hasPermission('ponto_eletronico:aprovacoes')
  }

  /**
   * Pode visualizar gruas?
   */
  const canViewGruas = (): boolean => {
    return hasPermission('gruas:visualizar')
  }

  /**
   * Pode visualizar documentos?
   */
  const canViewDocuments = (): boolean => {
    return hasPermission('documentos:visualizar')
  }

  /**
   * Pode assinar documentos?
   */
  const canSignDocuments = (): boolean => {
    return hasPermission('documentos:assinatura') || hasPermission('assinatura_digital:visualizar')
  }

  /**
   * Pode gerenciar documentos?
   */
  const canManageDocuments = (): boolean => {
    return hasPermission('documentos:gerenciar')
  }

  /**
   * Pode visualizar notificações?
   */
  const canViewNotifications = (): boolean => {
    return hasPermission('notificacoes:visualizar')
  }

  // ========================================
  // UTILIDADES
  // ========================================

  /**
   * Verifica se um item do menu é acessível
   */
  const canAccessMenuItem = (item: PWAMenuItem): boolean => {
    if (item.permission === '*') return true
    
    if (Array.isArray(item.permission)) {
      if (item.requireAll) {
        return hasAllPermissions(item.permission)
      } else {
        return hasAnyPermission(item.permission)
      }
    }
    
    return hasPermission(item.permission)
  }

  /**
   * Debug de permissões (apenas desenvolvimento)
   */
  const debugPermissions = () => {
    if (process.env.NODE_ENV !== 'development') return

    console.group('🔐 PWA Permissions Debug')
    console.log('User Role:', userRole)
    console.log('Access Level:', level)
    console.log('Permissions:', permissions)
    console.log('Menu Items:', menuItems.length)
    console.log('Home Page:', homePage)
    console.log('Features:', features)
    console.groupEnd()
  }

  // ========================================
  // RETURN
  // ========================================

  return {
    // Estado
    user,
    userRole,
    loading,
    level,
    permissions,
    menuItems,
    homePage,
    roleDescription,
    features,

    // Verificações básicas
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMinLevel,
    canAccess,

    // Verificações por role
    isAdmin,
    isManager,
    isSupervisor,
    isOperator,
    isClient,

    // Verificações de funcionalidades
    canRegisterPonto,
    canViewEspelhoPonto,
    canApproveHoras,
    canViewGruas,
    canViewDocuments,
    canSignDocuments,
    canManageDocuments,
    canViewNotifications,

    // Utilidades
    canAccessMenuItem,
    debugPermissions
  }
}

export default usePWAPermissions


