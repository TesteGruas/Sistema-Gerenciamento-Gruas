/**
 * Utilitário para gerenciar redirecionamento inteligente baseado no nível de acesso
 * 
 * Regras de redirecionamento:
 * - Sistema Web (dashboard): Níveis 8+ e Cliente (nível 1)
 * - App PWA: Níveis 7 ou menos (exceto Cliente)
 */

export interface UserData {
  id?: string
  email?: string
  role?: string
  cargo?: string
  level?: number
  perfil?: {
    nome?: string
    nivel_acesso?: number
  }
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
 * Obtém o nível de acesso do usuário
 * Prioridade: level direto > perfil.nivel_acesso > role mapeado
 */
export function getUserLevel(userData: UserData | null): number {
  if (!userData) return 0

  // 1. Tentar pegar level direto (vem do backend)
  if (userData.level !== undefined && userData.level !== null) {
    return userData.level
  }

  // 2. Tentar pegar do perfil
  if (userData.perfil?.nivel_acesso !== undefined && userData.perfil.nivel_acesso !== null) {
    return userData.perfil.nivel_acesso
  }

  // 3. Mapear role para nível (fallback)
  const role = (userData.role || '').toLowerCase()
  const roleLevelMap: Record<string, number> = {
    'admin': 10,
    'administrador': 10,
    'gestores': 9,
    'gerente': 8,
    'financeiro': 8,
    'supervisores': 6, // Supervisor migrado para Cliente (nível 6)
    'supervisor': 6, // Supervisor migrado para Cliente (nível 6)
    'clientes': 6,
    'cliente': 6,
    'operários': 4,
    'operarios': 4,
    'operador': 4
  }

  return roleLevelMap[role] || 0
}

/**
 * Verifica se o usuário deve acessar o sistema web (dashboard)
 * Regra: APENAS ADMIN (nível 10) pode acessar o dashboard
 */
export function shouldAccessWeb(userData: UserData | null): boolean {
  if (!userData) return false

  const level = getUserLevel(userData)
  
  // Apenas Admin (nível 10) → Web/Dashboard
  if (level === 10) {
    return true
  }

  // Demais níveis → PWA
  return false
}

/**
 * Determina se um usuário tem perfil de gestor (acesso ao dashboard)
 * @deprecated Use shouldAccessWeb() que verifica por nível
 */
export function isGestorUser(userData: UserData | null): boolean {
  return shouldAccessWeb(userData)
}

/**
 * Redireciona usuário para a página correta baseado no nível de acesso
 * 
 * - Apenas Admin (nível 10) → Dashboard (web)
 * - Demais níveis → PWA
 */
export function getRedirectPath(userData: UserData | null): string {
  if (!userData) {
    return '/pwa/login'
  }

  // Verificar se deve acessar web (apenas Admin)
  if (shouldAccessWeb(userData)) {
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
  
  const level = getUserLevel(userData)
  const role = (userData.role || '').toLowerCase()
  
  // Mostrar welcome screen para operários (nível 4)
  if (level === 4 || role.includes('operario') || role.includes('operador')) {
    return true
  }
  
  return false
}
