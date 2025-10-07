"use client"

import { useAuth } from "./use-auth"

export function usePermissions() {
  const { permissoes, perfil, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth()

  const canView = (module: string) => {
    return hasPermission(`visualizar_${module}`) || hasPermission(`${module}:visualizar`)
  }

  const canCreate = (module: string) => {
    return hasPermission(`criar_${module}`) || hasPermission(`${module}:criar`)
  }

  const canEdit = (module: string) => {
    return hasPermission(`editar_${module}`) || hasPermission(`${module}:editar`)
  }

  const canDelete = (module: string) => {
    return hasPermission(`excluir_${module}`) || hasPermission(`${module}:deletar`)
  }

  const canManage = (module: string) => {
    return hasAnyPermission([
      `gerenciar_${module}`,
      `${module}:gerenciar`,
      `criar_${module}`,
      `editar_${module}`,
      `excluir_${module}`
    ])
  }

  const getPermissionsByModule = (module: string) => {
    return permissoes.filter(p => 
      p.modulo === module || 
      p.nome.includes(module) || 
      p.acao.includes(module)
    )
  }

  const isAdmin = () => {
    return perfil?.nome?.toLowerCase() === 'administrador' || 
           perfil?.nivel_acesso === 'admin'
  }

  const isManager = () => {
    return perfil?.nome?.toLowerCase() === 'gerente' || 
           perfil?.nivel_acesso === 'manager'
  }

  const isSupervisor = () => {
    return perfil?.nome?.toLowerCase() === 'supervisor' || 
           perfil?.nivel_acesso === 'supervisor'
  }

  const isOperator = () => {
    return perfil?.nome?.toLowerCase() === 'operador' || 
           perfil?.nivel_acesso === 'operator'
  }

  return {
    permissoes,
    perfil,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canManage,
    getPermissionsByModule,
    isAdmin,
    isManager,
    isSupervisor,
    isOperator
  }
}

export default usePermissions