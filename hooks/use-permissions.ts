"use client"

import { useMemo } from 'react'
import { useAuth } from './use-auth'
import {
  type Permission,
  type RoleName,
  type AccessLevel,
  type ModuleName,
  ROLES_PERMISSIONS,
  ROLES_LEVELS,
  getRolePermissions,
  getRoleLevel,
  hasMinLevel as hasMinLevelUtil,
  matchesPermissionPattern,
  normalizeRoleName
} from '@/types/permissions'

/**
 * Hook de Permissões - Versão 2.0 (Sistema Simplificado)
 * 
 * Sistema baseado em 5 roles principais com permissões hardcoded.
 * Elimina consultas ao backend e simplifica a lógica de verificação.
 */
export const usePermissions = () => {
  const { user, perfil, loading: authLoading } = useAuth()

  // Obter role e permissões do usuário (com normalização para retrocompatibilidade)
  const rawRole = user?.role
  const userRole = useMemo(() => normalizeRoleName(rawRole), [rawRole])
  
  const permissions = useMemo(() => {
    if (!userRole) return []
    return getRolePermissions(userRole)
  }, [userRole])

  const level = useMemo(() => {
    if (!userRole) return 0 as AccessLevel
    return getRoleLevel(userRole)
  }, [userRole])

  /**
   * Verifica se tem uma permissão específica
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!permission || permission.trim() === '') return false
    if (!userRole) return false

    // Admin e Gestores têm acesso total (wildcard *)
    if (permissions.includes('*')) return true

    // Verificar permissão exata
    if (permissions.includes(permission)) return true

    // Verificar wildcard de módulo (ex: "gruas:*" permite "gruas:visualizar")
    const [module] = permission.split(':')
    if (permissions.includes(`${module}:*`)) return true

    // Verificar com matchPattern para casos especiais
    return permissions.some(perm => matchesPermissionPattern(permission, perm))
  }

  /**
   * Verifica se tem qualquer uma das permissões (OR)
   */
  const hasAnyPermission = (permissionList: Permission[]): boolean => {
    if (!permissionList || permissionList.length === 0) return false
    return permissionList.some(permission => hasPermission(permission))
  }

  /**
   * Verifica se tem todas as permissões (AND)
   */
  const hasAllPermissions = (permissionList: Permission[]): boolean => {
    if (!permissionList || permissionList.length === 0) return false
    return permissionList.every(permission => hasPermission(permission))
  }

  /**
   * Verifica se tem perfil específico
   */
  const hasProfile = (profileName: RoleName): boolean => {
    return userRole === profileName
  }

  /**
   * Verifica se tem nível de acesso mínimo
   */
  const hasMinLevel = (minLevel: AccessLevel): boolean => {
    if (!userRole) return false
    return hasMinLevelUtil(userRole, minLevel)
  }

  /**
   * Verifica se pode acessar módulo (qualquer ação)
   */
  const canAccessModule = (module: ModuleName): boolean => {
    if (!userRole) return false

    // Wildcard total
    if (permissions.includes('*')) return true

    // Wildcard do módulo
    if (permissions.includes(`${module}:*`)) return true

    // Qualquer permissão do módulo
    return permissions.some(perm => perm.startsWith(`${module}:`))
  }

  /**
   * Verifica se pode realizar ação específica em um módulo
   */
  const canPerformAction = (module: ModuleName, action: string): boolean => {
    return hasPermission(`${module}:${action}`)
  }

  /**
   * Obtém permissões de um módulo específico
   */
  const getModulePermissions = (module: ModuleName): Permission[] => {
    return permissions.filter(p => p.startsWith(`${module}:`))
  }

  // ========================================
  // VERIFICAÇÕES POR ROLE
  // ========================================

  /**
   * Verifica se é Admin
   */
  const isAdmin = (): boolean => {
    return userRole === 'Admin'
  }

  /**
   * Verifica se é Gestor
   */
  const isManager = (): boolean => {
    return userRole === 'Gestores'
  }

  /**
   * Verifica se é Supervisor
   */
  const isSupervisor = (): boolean => {
    return userRole === 'Supervisores'
  }

  /**
   * Verifica se é Operário
   */
  const isOperator = (): boolean => {
    return userRole === 'Operários'
  }

  /**
   * Verifica se é Cliente
   */
  const isClient = (): boolean => {
    return userRole === 'Clientes'
  }

  // ========================================
  // VERIFICAÇÕES DE ACESSO POR MÓDULO
  // ========================================

  /**
   * Verifica se tem acesso ao dashboard web
   */
  const canAccessDashboard = (): boolean => {
    // Admin, Gestores e Supervisores têm acesso ao dashboard
    return hasMinLevel(6 as AccessLevel) || hasPermission('dashboard:visualizar')
  }

  /**
   * Verifica se tem acesso ao ponto eletrônico
   * Nota: Gestores não têm acesso completo (apenas visualizar e relatórios, sem aprovações)
   */
  const canAccessPontoEletronico = (): boolean => {
    // Verificar se tem permissão específica de visualizar ou gerenciar
    return hasPermission('ponto:visualizar') || 
           hasPermission('ponto_eletronico:visualizar') ||
           hasPermission('ponto:gerenciar') ||
           hasPermission('ponto_eletronico:gerenciar')
  }

  /**
   * Verifica se tem acesso ao financeiro
   * Nota: Apenas Admin e Financeiro têm acesso (Gestores não têm)
   */
  const canAccessFinanceiro = (): boolean => {
    // Admin tem acesso total
    if (isAdmin()) return true
    
    // Verificar se tem permissão específica de financeiro
    return canAccessModule('financeiro')
  }

  /**
   * Verifica se tem acesso ao RH
   * Nota: Apenas Admin e RH têm acesso (Gestores não têm)
   */
  const canAccessRH = (): boolean => {
    // Admin tem acesso total
    if (isAdmin()) return true
    
    // Verificar se tem permissão específica de RH
    return canAccessModule('rh')
  }

  /**
   * Verifica se tem acesso às obras
   */
  const canAccessObras = (): boolean => {
    return canAccessModule('obras')
  }

  /**
   * Verifica se tem acesso global a todas as obras (sem filtro)
   * Nota: Esta verificação deve ser feita no backend também
   */
  const hasGlobalAccessToObras = (): boolean => {
    // Admin, Gestores e Supervisores têm acesso global por padrão
    if (hasMinLevel(6 as AccessLevel)) return true
    
    // Verificar se o cargo do usuário tem acesso_global_obras
    // Nota: Esta informação deve vir do backend no objeto do usuário
    // Por enquanto, retorna false e deixa o backend fazer a verificação
    return false
  }

  /**
   * Verifica se tem acesso aos clientes
   */
  const canAccessClientes = (): boolean => {
    return hasMinLevel(9 as AccessLevel) || canAccessModule('clientes')
  }

  /**
   * Verifica se tem acesso aos relatórios
   */
  const canAccessRelatorios = (): boolean => {
    return hasMinLevel(6 as AccessLevel) || canAccessModule('relatorios')
  }

  /**
   * Verifica se tem acesso aos usuários
   */
  const canAccessUsuarios = (): boolean => {
    return hasMinLevel(9 as AccessLevel) || canAccessModule('usuarios')
  }

  /**
   * Verifica se tem acesso às gruas
   */
  const canAccessGruas = (): boolean => {
    return canAccessModule('gruas')
  }

  /**
   * Verifica se tem acesso ao estoque
   */
  const canAccessEstoque = (): boolean => {
    return canAccessModule('estoque')
  }

  /**
   * Verifica se tem acesso aos livros de gruas
   */
  const canAccessLivrosGruas = (): boolean => {
    return canAccessModule('livros_gruas')
  }

  /**
   * Verifica se pode aprovar horas extras / ponto
   */
  const canApprovePonto = (): boolean => {
    return hasPermission('ponto:aprovacoes') || hasPermission('ponto_eletronico:aprovacoes')
  }

  /**
   * Verifica se pode gerenciar documentos
   */
  const canManageDocuments = (): boolean => {
    return hasPermission('documentos:gerenciar')
  }

  /**
   * Verifica se pode assinar documentos
   */
  const canSignDocuments = (): boolean => {
    return hasPermission('documentos:assinatura') || hasPermission('assinatura_digital:visualizar')
  }

  // ========================================
  // DEBUGGING (apenas desenvolvimento)
  // ========================================

  const debugPermissions = () => {
    if (process.env.NODE_ENV !== 'development') return

    console.group('🔐 Informações de Permissões')
    console.log('Role:', userRole)
    console.log('Nível:', level)
    console.log('Total de permissões:', permissions.length)
    console.log('Permissões:', permissions)
    console.groupEnd()
  }

  // ========================================
  // RETURN
  // ========================================

  return {
    // Estado
    permissions,
    permissoes: permissions, // Alias para compatibilidade
    perfil,
    loading: authLoading,
    level,
    userRole,

    // Verificações básicas
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasProfile,
    hasMinLevel,
    canAccessModule,
    canPerformAction,
    getModulePermissions,

    // Verificações por role
    isAdmin,
    isManager,
    isSupervisor,
    isOperator,
    isClient,

    // Verificações por módulo
    canAccessDashboard,
    canAccessPontoEletronico,
    canAccessFinanceiro,
    canAccessRH,
    canAccessObras,
    hasGlobalAccessToObras,
    canAccessClientes,
    canAccessRelatorios,
    canAccessUsuarios,
    canAccessGruas,
    canAccessEstoque,
    canAccessLivrosGruas,

    // Verificações de ações específicas
    canApprovePonto,
    canManageDocuments,
    canSignDocuments,

    // Debug
    debugPermissions
  }
}

export default usePermissions
