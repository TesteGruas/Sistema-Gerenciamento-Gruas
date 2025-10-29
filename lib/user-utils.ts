/**
 * Utilitários para verificação de usuários e permissões
 */

interface User {
  id?: string
  role?: string
  [key: string]: any
}

/**
 * Verifica se o usuário é administrador
 * Aceita tanto 'admin' quanto 'administrador' (case insensitive)
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user || !user.role) return false
  
  const role = user.role.toLowerCase()
  return role === 'admin' || role === 'administrador'
}

/**
 * Verifica se o usuário tem permissão de gerente
 * Aceita 'gerente' ou 'manager' (case insensitive)
 */
export function isGerente(user: User | null | undefined): boolean {
  if (!user || !user.role) return false
  
  const role = user.role.toLowerCase()
  return role === 'gerente' || role === 'manager'
}

/**
 * Verifica se o usuário é admin ou gerente
 */
export function isAdminOrGerente(user: User | null | undefined): boolean {
  return isAdmin(user) || isGerente(user)
}

/**
 * Verifica se o usuário tem um dos roles especificados
 */
export function hasRole(user: User | null | undefined, roles: string[]): boolean {
  if (!user || !user.role) return false
  
  const userRole = user.role.toLowerCase()
  return roles.some(role => role.toLowerCase() === userRole)
}

