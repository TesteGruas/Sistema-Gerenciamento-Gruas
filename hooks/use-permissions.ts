"use client"

import { useState, useEffect } from "react"

export interface UserPermissions {
  role: string
  permissions: string[]
}

export function usePermissions() {
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simular carregamento de permissões do usuário
    const loadUserPermissions = async () => {
      try {
        // Em uma implementação real, isso viria de uma API ou contexto de autenticação
        const storedRole = localStorage.getItem('userRole') || 'funcionario_nivel_1'
        
        const rolePermissions = {
          admin: ["all"],
          gestor: ["obras", "gruas", "funcionarios", "financeiro", "estoque", "relatorios"],
          funcionario_nivel_1: ["obras_read", "gruas_read"],
          funcionario_nivel_2: ["obras", "gruas", "funcionarios_read"],
          funcionario_nivel_3: ["obras", "gruas", "funcionarios", "financeiro_read"],
          cliente: ["obras_read", "gruas_read"]
        }

        setUserPermissions({
          role: storedRole,
          permissions: rolePermissions[storedRole as keyof typeof rolePermissions] || []
        })
      } catch (error) {
        console.error('Erro ao carregar permissões:', error)
        setUserPermissions({
          role: 'funcionario_nivel_1',
          permissions: ["obras_read", "gruas_read"]
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadUserPermissions()
  }, [])

  const hasPermission = (permission: string): boolean => {
    if (!userPermissions) return false
    
    // Admin tem todas as permissões
    if (userPermissions.permissions.includes('all')) return true
    
    return userPermissions.permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!userPermissions) return false
    
    // Admin tem todas as permissões
    if (userPermissions.permissions.includes('all')) return true
    
    return permissions.some(permission => userPermissions.permissions.includes(permission))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!userPermissions) return false
    
    // Admin tem todas as permissões
    if (userPermissions.permissions.includes('all')) return true
    
    return permissions.every(permission => userPermissions.permissions.includes(permission))
  }

  const isAdmin = (): boolean => {
    return userPermissions?.role === 'admin'
  }

  const isGestor = (): boolean => {
    return userPermissions?.role === 'gestor'
  }

  const isFuncionario = (): boolean => {
    return userPermissions?.role?.startsWith('funcionario_') || false
  }

  const isCliente = (): boolean => {
    return userPermissions?.role === 'cliente'
  }

  const canManageUsers = (): boolean => {
    return hasPermission('usuarios') || isAdmin()
  }

  const canAccessFinancial = (): boolean => {
    return hasAnyPermission(['financeiro', 'financeiro_read'])
  }

  const canManageObras = (): boolean => {
    return hasAnyPermission(['obras', 'obras_read'])
  }

  const canManageGruas = (): boolean => {
    return hasAnyPermission(['gruas', 'gruas_read'])
  }

  const canManageFuncionarios = (): boolean => {
    return hasAnyPermission(['funcionarios', 'funcionarios_read'])
  }

  const canAccessReports = (): boolean => {
    return hasAnyPermission(['relatorios', 'relatorios_read'])
  }

  return {
    userPermissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isGestor,
    isFuncionario,
    isCliente,
    canManageUsers,
    canAccessFinancial,
    canManageObras,
    canManageGruas,
    canManageFuncionarios,
    canAccessReports
  }
}
