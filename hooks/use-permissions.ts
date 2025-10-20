"use client"

import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'

export interface Permission {
  id: number
  nome: string
  descricao: string
  modulo: string
  acao: string
  recurso?: string
  status: 'Ativa' | 'Inativa'
}

export interface Perfil {
  id: number
  nome: string
  descricao: string
  nivel_acesso: number
  status: 'Ativo' | 'Inativo'
}

export const usePermissions = () => {
  const { user, loading: authLoading } = useAuth()
  const [permissions, setPermissions] = useState<string[]>([])
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user || authLoading) {
        setLoading(false)
        return
      }

      try {
        // Buscar permissões do usuário
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          const userPermissions = data.data?.permissoes || []
          const userPerfil = data.data?.perfil || null
          
          // Converter permissões para formato string
          const permissionStrings = userPermissions.map((p: Permission) => 
            `${p.modulo}:${p.acao}`
          )
          
          setPermissions(permissionStrings)
          setPerfil(userPerfil)
          
          // Cache das permissões no localStorage
          localStorage.setItem('user_permissions', JSON.stringify(permissionStrings))
          localStorage.setItem('user_perfil', JSON.stringify(userPerfil))
        } else {
          // Fallback para cache local
          const cachedPermissions = localStorage.getItem('user_permissions')
          const cachedPerfil = localStorage.getItem('user_perfil')
          
          if (cachedPermissions) {
            setPermissions(JSON.parse(cachedPermissions))
          }
          if (cachedPerfil) {
            setPerfil(JSON.parse(cachedPerfil))
          }
        }
      } catch (error) {
        console.error('Erro ao carregar permissões:', error)
        
        // Fallback para cache local
        const cachedPermissions = localStorage.getItem('user_permissions')
        const cachedPerfil = localStorage.getItem('user_perfil')
        
        if (cachedPermissions) {
          setPermissions(JSON.parse(cachedPermissions))
        }
        if (cachedPerfil) {
          setPerfil(JSON.parse(cachedPerfil))
        }
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [user, authLoading])

  // Verificar se tem uma permissão específica
  const hasPermission = (permission: string): boolean => {
    if (!permission) return true
    return permissions.includes(permission)
  }

  // Verificar se tem qualquer uma das permissões (OR)
  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (!permissionList || permissionList.length === 0) return true
    return permissionList.some(permission => hasPermission(permission))
  }

  // Verificar se tem todas as permissões (AND)
  const hasAllPermissions = (permissionList: string[]): boolean => {
    if (!permissionList || permissionList.length === 0) return true
    return permissionList.every(permission => hasPermission(permission))
  }

  // Verificar se tem perfil específico
  const hasProfile = (profileName: string): boolean => {
    if (!perfil) return false
    return perfil.nome === profileName
  }

  // Verificar se tem nível de acesso mínimo
  const hasMinLevel = (minLevel: number): boolean => {
    if (!perfil) return false
    return perfil.nivel_acesso >= minLevel
  }

  // Verificar se pode acessar módulo
  const canAccessModule = (module: string): boolean => {
    const modulePermissions = [
      `${module}:visualizar`,
      `${module}:criar`,
      `${module}:editar`,
      `${module}:excluir`,
      `${module}:gerenciar`
    ]
    return hasAnyPermission(modulePermissions)
  }

  // Verificar se pode realizar ação específica
  const canPerformAction = (module: string, action: string): boolean => {
    return hasPermission(`${module}:${action}`)
  }

  // Obter permissões por módulo
  const getModulePermissions = (module: string): string[] => {
    return permissions.filter(p => p.startsWith(`${module}:`))
  }

  // Verificar se é admin
  const isAdmin = (): boolean => {
    return hasProfile('Admin')
  }

  // Verificar se é gerente
  const isManager = (): boolean => {
    return hasProfile('Gerente')
  }

  // Verificar se é supervisor
  const isSupervisor = (): boolean => {
    return hasProfile('Supervisor')
  }

  // Verificar se é cliente
  const isClient = (): boolean => {
    return hasProfile('Cliente')
  }

  // Limpar cache de permissões
  const clearPermissions = () => {
    setPermissions([])
    setPerfil(null)
    localStorage.removeItem('user_permissions')
    localStorage.removeItem('user_perfil')
  }

  // Recarregar permissões
  const refreshPermissions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const userPermissions = data.data?.permissoes || []
        const userPerfil = data.data?.perfil || null
        
        const permissionStrings = userPermissions.map((p: Permission) => 
          `${p.modulo}:${p.acao}`
        )
        
        setPermissions(permissionStrings)
        setPerfil(userPerfil)
        
        localStorage.setItem('user_permissions', JSON.stringify(permissionStrings))
        localStorage.setItem('user_perfil', JSON.stringify(userPerfil))
      }
    } catch (error) {
      console.error('Erro ao recarregar permissões:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    permissions,
    perfil,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasProfile,
    hasMinLevel,
    canAccessModule,
    canPerformAction,
    getModulePermissions,
    isAdmin,
    isManager,
    isSupervisor,
    isClient,
    clearPermissions,
    refreshPermissions
  }
}