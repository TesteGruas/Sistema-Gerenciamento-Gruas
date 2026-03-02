"use client"

import { useMemo, useEffect, useState } from 'react'
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
  
  // Estado para armazenar o tipo do usuário
  const [userTipo, setUserTipo] = useState<string | null>(null)
  const [isResponsavelObra, setIsResponsavelObra] = useState(false)
  
  // Verificar user_metadata.tipo quando os dados mudarem
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const userDataStr = localStorage.getItem('user_data')
      if (userDataStr) {
        const userData = JSON.parse(userDataStr)
        const tipo = userData?.user_metadata?.tipo || userData?.user?.user_metadata?.tipo
        const responsavelFlag = Boolean(userData?.is_responsavel_obra) ||
          (Array.isArray(userData?.obras_responsavel) && userData.obras_responsavel.length > 0)
        setUserTipo(tipo || null)
        setIsResponsavelObra(responsavelFlag)
      } else {
        setUserTipo(null)
        setIsResponsavelObra(false)
      }
    } catch (error) {
      setUserTipo(null)
      setIsResponsavelObra(false)
    }
  }, [user])
  
  // Determinar role: verificar user_metadata.tipo primeiro, depois role do perfil
  const userRole = useMemo(() => {
    // Se user_metadata.tipo === 'cliente' ou 'responsavel_obra', mapear para 'Clientes'
    if (userTipo === 'cliente' || userTipo === 'responsavel_obra' || isResponsavelObra) {
      return 'Clientes' as RoleName
    }
    
    // Caso contrário, usar o role do user
    return (user?.role as RoleName) || null
  }, [user?.role, userTipo, isResponsavelObra])

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
  // Função removida: isSupervisor - sistema não utiliza mais supervisor
  const isSupervisor = () => false
  const isClient = () => userRole === 'Clientes'
  const isOperator = () => userRole === 'Operários'

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
    isClient,
    isOperator,

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


