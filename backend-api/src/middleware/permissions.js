/**
 * Middleware de Permissões Simplificado
 * 
 * Sistema baseado em 5 roles principais com permissões hardcoded.
 * Elimina consultas ao banco de dados para verificação de permissões.
 */

import { 
  ROLES_PERMISSIONS, 
  ROLES_LEVELS,
  getRolePermissions,
  getRoleLevel,
  isValidRole,
  normalizeRoleName
} from '../config/roles.js'

// ========================================
// FUNÇÃO PRINCIPAL DE VERIFICAÇÃO
// ========================================

/**
 * Verifica se um role tem uma permissão específica
 * @param {string} userRole - Nome do role do usuário (pode ser antigo ou novo)
 * @param {string} requiredPermission - Permissão necessária (formato: "modulo:acao")
 * @returns {boolean} - true se tem permissão
 */
export function checkPermission(userRole, requiredPermission) {
  // Normalizar role (converte nomes antigos → novos)
  const normalizedRole = normalizeRoleName(userRole)
  
  // Validar role
  if (!normalizedRole) {
    console.warn(`[Permissions] Role inválido: ${userRole}`)
    return false
  }

  // Validar formato da permissão
  if (!requiredPermission || typeof requiredPermission !== 'string') {
    console.warn(`[Permissions] Permissão inválida: ${requiredPermission}`)
    return false
  }

  // Obter permissões do role (já normalizado)
  const rolePermissions = getRolePermissions(normalizedRole)

  // Verificar wildcard (*) - Admin e Gestores têm acesso total
  if (rolePermissions.includes('*')) {
    return true
  }

  // Verificar permissão exata
  if (rolePermissions.includes(requiredPermission)) {
    return true
  }

  // Verificar wildcard de módulo (ex: "gruas:*" permite "gruas:visualizar")
  const [module, action] = requiredPermission.split(':')
  const moduleWildcard = `${module}:*`
  
  if (rolePermissions.includes(moduleWildcard)) {
    return true
  }

  return false
}

/**
 * Verifica se um role tem acesso a um módulo e ação específica
 * @param {string} module - Módulo do sistema
 * @param {string} action - Ação a ser realizada
 * @param {string} userRole - Nome do role do usuário
 * @returns {boolean} - true se tem acesso
 */
export function hasAccess(module, action, userRole) {
  const permission = `${module}:${action}`
  return checkPermission(userRole, permission)
}

/**
 * Verifica se um role tem nível de acesso mínimo
 * @param {string} userRole - Nome do role do usuário
 * @param {number} minLevel - Nível mínimo requerido (1-10)
 * @returns {boolean} - true se tem nível suficiente
 */
export function checkLevel(userRole, minLevel) {
  const userLevel = getRoleLevel(userRole)
  return userLevel >= minLevel
}

/**
 * Verifica se um role pode acessar um módulo (qualquer ação)
 * @param {string} module - Módulo do sistema
 * @param {string} userRole - Nome do role do usuário
 * @returns {boolean} - true se tem acesso ao módulo
 */
export function canAccessModule(module, userRole) {
  if (!userRole || !isValidRole(userRole)) {
    return false
  }

  const rolePermissions = getRolePermissions(userRole)

  // Wildcard total
  if (rolePermissions.includes('*')) {
    return true
  }

  // Wildcard do módulo
  if (rolePermissions.includes(`${module}:*`)) {
    return true
  }

  // Qualquer permissão do módulo
  return rolePermissions.some(perm => perm.startsWith(`${module}:`))
}

// ========================================
// MIDDLEWARE EXPRESS
// ========================================

/**
 * Middleware para verificar permissão específica
 * @param {string} requiredPermission - Permissão necessária (formato: "modulo:acao")
 * @returns {Function} - Middleware Express
 */
export function requirePermission(requiredPermission) {
  return (req, res, next) => {
    try {
      // Verificar se usuário está autenticado
      if (!req.user) {
        return res.status(401).json({
          error: 'Não autenticado',
          message: 'Você precisa estar logado para acessar este recurso'
        })
      }

      // Obter role do usuário
      const userRole = req.user.role || req.user.perfil?.nome

      if (!userRole) {
        console.error('[Permissions] Usuário sem role:', req.user.id)
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Seu usuário não possui um perfil de acesso definido'
        })
      }

      // Verificar permissão
      const hasPermission = checkPermission(userRole, requiredPermission)

      if (!hasPermission) {
        console.warn(
          `[Permissions] Acesso negado: Usuário ${req.user.id} (${userRole}) tentou acessar ${requiredPermission}`
        )
        
        return res.status(403).json({
          error: 'Acesso negado',
          message: `Você não tem permissão para realizar esta ação`,
          required: requiredPermission,
          userRole: userRole
        })
      }

      // Log de sucesso (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[Permissions] ✓ Acesso concedido: ${req.user.id} (${userRole}) → ${requiredPermission}`
        )
      }

      next()
    } catch (error) {
      console.error('[Permissions] Erro ao verificar permissão:', error)
      res.status(500).json({
        error: 'Erro interno',
        message: 'Erro ao verificar permissões'
      })
    }
  }
}

/**
 * Middleware para verificar nível mínimo de acesso
 * @param {number} minLevel - Nível mínimo requerido (1-10)
 * @returns {Function} - Middleware Express
 */
export function requireLevel(minLevel) {
  return (req, res, next) => {
    try {
      // Verificar se usuário está autenticado
      if (!req.user) {
        return res.status(401).json({
          error: 'Não autenticado',
          message: 'Você precisa estar logado para acessar este recurso'
        })
      }

      // Obter role do usuário
      const userRole = req.user.role || req.user.perfil?.nome

      if (!userRole) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Seu usuário não possui um perfil de acesso definido'
        })
      }

      // Verificar nível
      const hasLevel = checkLevel(userRole, minLevel)

      if (!hasLevel) {
        const userLevel = getRoleLevel(userRole)
        console.warn(
          `[Permissions] Nível insuficiente: Usuário ${req.user.id} (${userRole}, nível ${userLevel}) tentou acessar recurso de nível ${minLevel}`
        )
        
        return res.status(403).json({
          error: 'Acesso negado',
          message: `Seu nível de acesso (${userLevel}) é insuficiente para esta ação (requerido: ${minLevel})`,
          userLevel: userLevel,
          requiredLevel: minLevel
        })
      }

      next()
    } catch (error) {
      console.error('[Permissions] Erro ao verificar nível:', error)
      res.status(500).json({
        error: 'Erro interno',
        message: 'Erro ao verificar nível de acesso'
      })
    }
  }
}

/**
 * Middleware para verificar múltiplas permissões (requer TODAS)
 * @param {string[]} requiredPermissions - Array de permissões necessárias
 * @returns {Function} - Middleware Express
 */
export function requireAllPermissions(requiredPermissions) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Não autenticado',
          message: 'Você precisa estar logado para acessar este recurso'
        })
      }

      const userRole = req.user.role || req.user.perfil?.nome

      if (!userRole) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Seu usuário não possui um perfil de acesso definido'
        })
      }

      // Verificar todas as permissões
      const missingPermissions = requiredPermissions.filter(
        perm => !checkPermission(userRole, perm)
      )

      if (missingPermissions.length > 0) {
        console.warn(
          `[Permissions] Permissões faltando: Usuário ${req.user.id} (${userRole}) - faltam: ${missingPermissions.join(', ')}`
        )
        
        return res.status(403).json({
          error: 'Acesso negado',
          message: `Você não possui todas as permissões necessárias`,
          missing: missingPermissions
        })
      }

      next()
    } catch (error) {
      console.error('[Permissions] Erro ao verificar permissões múltiplas:', error)
      res.status(500).json({
        error: 'Erro interno',
        message: 'Erro ao verificar permissões'
      })
    }
  }
}

/**
 * Middleware para verificar múltiplas permissões (requer PELO MENOS UMA)
 * @param {string[]} requiredPermissions - Array de permissões (OR)
 * @returns {Function} - Middleware Express
 */
export function requireAnyPermission(requiredPermissions) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Não autenticado',
          message: 'Você precisa estar logado para acessar este recurso'
        })
      }

      const userRole = req.user.role || req.user.perfil?.nome

      if (!userRole) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Seu usuário não possui um perfil de acesso definido'
        })
      }

      // Verificar se tem pelo menos uma permissão
      const hasAnyPermission = requiredPermissions.some(
        perm => checkPermission(userRole, perm)
      )

      if (!hasAnyPermission) {
        console.warn(
          `[Permissions] Nenhuma permissão válida: Usuário ${req.user.id} (${userRole}) - tentou: ${requiredPermissions.join(', ')}`
        )
        
        return res.status(403).json({
          error: 'Acesso negado',
          message: `Você não possui nenhuma das permissões necessárias`,
          required: requiredPermissions
        })
      }

      next()
    } catch (error) {
      console.error('[Permissions] Erro ao verificar permissões alternativas:', error)
      res.status(500).json({
        error: 'Erro interno',
        message: 'Erro ao verificar permissões'
      })
    }
  }
}

/**
 * Middleware para acesso exclusivo de Admin
 * @returns {Function} - Middleware Express
 */
export function requireAdmin() {
  return requireLevel(10)
}

/**
 * Middleware para acesso de Gestores ou superior
 * @returns {Function} - Middleware Express
 */
export function requireManager() {
  return requireLevel(9)
}

/**
 * Middleware para acesso de Supervisores ou superior
 * @returns {Function} - Middleware Express
 */
export function requireSupervisor() {
  return requireLevel(6)
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Obtém lista de permissões do usuário autenticado
 * @param {object} req - Request Express
 * @returns {string[]} - Array de permissões
 */
export function getUserPermissions(req) {
  if (!req.user) return []
  
  const userRole = req.user.role || req.user.perfil?.nome
  if (!userRole) return []
  
  return getRolePermissions(userRole)
}

/**
 * Anexa informações de permissões ao objeto req.user
 * Middleware para enriquecer req.user com dados de permissões
 */
export function attachPermissions() {
  return (req, res, next) => {
    if (req.user) {
      const userRole = req.user.role || req.user.perfil?.nome
      
      if (userRole) {
        req.user.permissions = getRolePermissions(userRole)
        req.user.level = getRoleLevel(userRole)
        req.user.checkPermission = (permission) => checkPermission(userRole, permission)
        req.user.hasAccess = (module, action) => hasAccess(module, action, userRole)
      }
    }
    next()
  }
}

// ========================================
// EXPORTS
// ========================================

export default {
  checkPermission,
  hasAccess,
  checkLevel,
  canAccessModule,
  requirePermission,
  requireLevel,
  requireAllPermissions,
  requireAnyPermission,
  requireAdmin,
  requireManager,
  requireSupervisor,
  getUserPermissions,
  attachPermissions
}


