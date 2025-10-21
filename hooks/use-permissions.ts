"use client"

import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'
import { authCache } from '@/lib/auth-cache'

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
  const { user, perfil, permissoes, loading: authLoading } = useAuth()
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPermissions = async () => {
      console.log('🔐 Iniciando carregamento de permissões...')
      console.log('🔐 Estado atual:', { user, perfil, permissoes, authLoading })
      
      if (authLoading) {
        console.log('🔐 Auth ainda carregando, aguardando...')
        setLoading(true)
        return
      }

      if (!user) {
        console.log('🔐 Usuário não encontrado, limpando permissões')
        setPermissions([])
        setLoading(false)
        return
      }

      try {
        // Verificar se estamos no cliente
        if (typeof window === 'undefined') {
          console.log('🔐 Executando no servidor, aguardando hidratação...')
          setLoading(true)
          return
        }

        const token = localStorage.getItem('access_token')
        if (!token) {
          console.log('🔐 Token não encontrado no localStorage')
          setPermissions([])
          setLoading(false)
          return
        }

        console.log('🔐 Buscando dados usando cache centralizado...')
        const authData = await authCache.getAuthData()
        
        const permissionStrings = authData.permissoes.map((p: Permission) => p.nome)
        console.log('🔐 Permissões carregadas:', permissionStrings)
        setPermissions(permissionStrings)
        
      } catch (error) {
        console.error('🔐 Erro ao carregar permissões:', error)
        
        // Fallback para cache local
        const cachedPermissions = localStorage.getItem('user_permissions')
        
        if (cachedPermissions) {
          console.log('🔐 Usando permissões do cache local após erro')
          setPermissions(JSON.parse(cachedPermissions))
        } else {
          console.log('🔐 Nenhum cache local encontrado após erro')
          setPermissions([])
        }
      } finally {
        setLoading(false)
        console.log('🔐 Carregamento de permissões finalizado')
      }
    }

    loadPermissions()
  }, [user, authLoading])

  // Verificar se tem uma permissão específica
  const hasPermission = (permission: string): boolean => {
    if (!permission || permission.trim() === '') return false
    
    console.log(`🔐 === VERIFICANDO PERMISSÃO: ${permission} ===`)
    
    // Se for admin, sempre permitir acesso
    if (isAdmin()) {
      console.log(`🔐 Admin detectado - permitindo acesso a ${permission}`)
      return true
    }
    
    // Sempre verificar localStorage primeiro se disponível
    if (typeof window !== 'undefined') {
      const cachedPermissions = localStorage.getItem('user_permissions')
      console.log(`🔐 localStorage disponível:`, !!cachedPermissions)
      
      if (cachedPermissions) {
        try {
          const cachedPerms = JSON.parse(cachedPermissions)
          const hasAccess = cachedPerms.includes(permission)
          console.log(`🔐 Permissões no localStorage:`, cachedPerms.length, 'itens')
          console.log(`🔐 Tem ${permission}? ${hasAccess}`)
          
          if (!hasAccess) {
            console.log(`🔐 Permissões similares:`, cachedPerms.filter((p: string) => p.includes(permission.split(':')[0])))
          }
          
          return hasAccess
        } catch (error) {
          console.error('🔐 Erro ao parsear permissões do localStorage:', error)
        }
      } else {
        console.log('🔐 Nenhuma permissão encontrada no localStorage')
      }
    }
    
    // Fallback para estado se localStorage não disponível
    const hasAccess = permissions.includes(permission)
    console.log(`🔐 Fallback para estado:`, hasAccess, 'Permissões disponíveis:', permissions.length)
    return hasAccess
  }

  // Verificar se tem qualquer uma das permissões (OR)
  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (!permissionList || permissionList.length === 0) return false
    return permissionList.some(permission => hasPermission(permission))
  }

  // Verificar se tem todas as permissões (AND)
  const hasAllPermissions = (permissionList: string[]): boolean => {
    if (!permissionList || permissionList.length === 0) return false
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
    // Verificar pelo perfil do backend
    if (perfil && perfil.nome === 'Admin') {
      return true
    }
    
    // Verificar pelo localStorage como fallback
    if (typeof window !== 'undefined') {
      const userRole = localStorage.getItem('userRole')
      const userPerfil = localStorage.getItem('user_perfil')
      
      if (userRole === 'admin') {
        return true
      }
      
      if (userPerfil) {
        try {
          const perfilData = JSON.parse(userPerfil)
          if (perfilData.nome === 'Admin' || perfilData.nivel_acesso >= 10) {
            return true
          }
        } catch (error) {
          console.error('Erro ao parsear perfil do localStorage:', error)
        }
      }
    }
    
    return false
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
    localStorage.removeItem('user_permissions')
    localStorage.removeItem('user_perfil')
  }

  // Recarregar permissões
  const refreshPermissions = async () => {
    setLoading(true)
    try {
      console.log('🔐 Recarregando permissões...')
      const authData = await authCache.refreshAuthData()
      
      const permissionStrings = authData.permissoes.map((p: Permission) => p.nome)
      setPermissions(permissionStrings)
      
      console.log('🔐 Permissões recarregadas:', permissionStrings)
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