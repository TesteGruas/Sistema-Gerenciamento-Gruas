/**
 * Utilitário para gerenciar redirecionamento inteligente baseado no perfil do usuário
 */

export interface UserData {
  id?: string
  email?: string
  role?: string
  cargo?: string
  user_metadata?: {
    cargo?: string
    nome?: string
    funcionario_id?: number
    email_verified?: boolean
  }
  app_metadata?: {
    provider?: string
    providers?: string[]
  }
}

/**
 * Determina se um usuário tem perfil de gestor (acesso ao dashboard)
 */
export function isGestorUser(userData: UserData | null): boolean {
  if (!userData) return false

  const cargo = userData.user_metadata?.cargo || userData.cargo || ''
  const role = userData.role || ''
  
  const cargoStr = cargo?.toLowerCase() || ''
  const roleStr = role?.toLowerCase() || ''
  
  // Lista de cargos de gestão
  const gestorKeywords = [
    'gestor', 'gerente', 'diretor', 'admin', 'administrador',
    'supervisor', 'encarregado', 'coordenador', 'chefe'
  ]
  
  // Lista de roles de gestão
  const gestorRoles = [
    'gestores', 'admin', 'supervisor', 'gerente', 'diretor',
    'encarregador', 'coordenador'
  ]
  
  const hasGestorCargo = gestorKeywords.some(keyword => 
    cargoStr.includes(keyword)
  )
  
  const hasGestorRole = gestorRoles.some(role => 
    roleStr.includes(role)
  )
  
  return hasGestorCargo || hasGestorRole
}

/**
 * Redireciona usuário para a página correta baseado no perfil
 */
export function getRedirectPath(userData: UserData | null): string {
  if (!userData) {
    return '/pwa/login'
  }

  // Se for gestor, redirecionar para dashboard
  if (isGestorUser(userData)) {
    return '/dashboard'
  }

  // Caso contrário, redirecionar para PWA
  return '/pwa'
}

/**
 * Redireciona o usuário após login
 */
export function redirectAfterLogin(userData: UserData | null, router: any) {
  const path = getRedirectPath(userData)
  console.log('🔄 [Redirect] Redirecionando para:', path)
  router.push(path)
}

/**
 * Verifica se deve mostrar tela de boas-vindas
 */
export function shouldShowWelcomeScreen(userData: UserData | null): boolean {
  if (!userData) return false
  
  // Mostrar welcome screen se for operário/cliente sem acesso específico
  const cargo = userData.user_metadata?.cargo || userData.cargo || ''
  const cargoStr = cargo?.toLowerCase() || ''
  
  const isOperario = cargoStr.includes('operario') || 
                     cargoStr.includes('operário') || 
                     cargoStr.includes('mecanico') ||
                     cargoStr.includes('mecânico') ||
                     cargoStr.includes('funcionario')
  
  return isOperario
}
