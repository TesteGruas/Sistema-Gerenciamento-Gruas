/**
 * Utilitário para gerenciar redirecionamento inteligente baseado no nível de acesso
 * 
 * Regras de redirecionamento:
 * - Sistema Web (dashboard): Admin e Gestores
 * - App PWA: perfis operacionais/clientes
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
 * Prioridade: perfil.nivel_acesso (banco) > level do login > mapeamento por nome de role
 */
export function getUserLevel(userData: UserData | null): number {
  if (!userData) return 0

  // 1. Nível do perfil no banco (fonte de verdade quando o login envia level inconsistente, ex.: 0)
  const perfilNivel = userData.perfil?.nivel_acesso
  if (perfilNivel !== undefined && perfilNivel !== null && Number(perfilNivel) > 0) {
    return Number(perfilNivel)
  }

  // 2. Level explícito do backend (aceitar 0 como “ausente”: cair para o mapa por role)
  if (
    userData.level !== undefined &&
    userData.level !== null &&
    Number(userData.level) > 0
  ) {
    return Number(userData.level)
  }

  // 3. Mapear role para nível (fallback)
  const role = (userData.role || userData.perfil?.nome || "").toLowerCase()
  const roleLevelMap: Record<string, number> = {
    'admin': 10,
    'administrador': 10,
    'gestores': 9,
    'gerente': 8,
    'financeiro': 8,
    'financeiro/1': 8,
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
 * Regra: nível ≥ 8 no perfil, ou perfil/role administrativo (admin, gestor, financeiro, etc.)
 */
export function shouldAccessWeb(userData: UserData | null): boolean {
  if (!userData) return false

  const level = getUserLevel(userData)
  const role = (userData.role || userData.perfil?.nome || '').toLowerCase()

  // Web: nível ≥ 8 (Financeiro, Gerente, etc.) ou roles administrativos explícitos
  if (
    level >= 8 ||
    role === 'admin' ||
    role === 'administrador' ||
    role === 'gestores' ||
    role === 'gestor' ||
    role === 'gerente' ||
    role.includes('financeiro')
  ) {
    return true
  }

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
 * - Equipe web (nível ≥ 8, admin, gestão, financeiro, etc.) → Dashboard
 * - Demais perfis → PWA
 */
export function getRedirectPath(userData: UserData | null): string {
  if (!userData) {
    return '/pwa/login'
  }

  if (shouldAccessWeb(userData)) {
    const nome = (userData.role || userData.perfil?.nome || '').toLowerCase()
    if (nome.includes('financeiro')) {
      return '/dashboard/financeiro'
    }
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
