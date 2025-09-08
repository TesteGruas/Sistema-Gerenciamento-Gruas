import jwt from 'jsonwebtoken'
import { supabase, supabaseAdmin } from '../config/supabase.js'

/**
 * Middleware de autenticação JWT
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token de acesso requerido',
        code: 'MISSING_TOKEN'
      })
    }

    // Verificar token com Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(403).json({
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN'
      })
    }

    // Buscar dados completos do usuário no banco (opcional)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', user.email)
      .single()

    // Se não encontrar na tabela usuarios, usar dados do Supabase Auth
    const userInfo = userData || {
      id: user.id,
      email: user.email,
      nome: user.user_metadata?.nome || 'Usuário',
      status: 'Ativo',
      role: user.user_metadata?.role || 'user'
    }

    // Adicionar usuário ao request
    req.user = { ...user, ...userInfo }
    next()
  } catch (error) {
    console.error('Erro na autenticação:', error)
    return res.status(500).json({
      error: 'Erro interno na autenticação',
      code: 'AUTH_ERROR'
    })
  }
}

/**
 * Middleware para verificar permissões (versão simplificada)
 */
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        })
      }

      // Sistema de permissões simplificado baseado no role do usuário
      const userRole = req.user.role || req.user.user_metadata?.role || 'user'
      
      // Mapeamento de permissões por role
      const rolePermissions = {
        'admin': [
          'visualizar_estoque', 'criar_produtos', 'editar_produtos', 'excluir_produtos', 'movimentar_estoque',
          'visualizar_clientes', 'criar_clientes', 'editar_clientes', 'excluir_clientes'
        ],
        'manager': [
          'visualizar_estoque', 'criar_produtos', 'editar_produtos', 'movimentar_estoque',
          'visualizar_clientes', 'criar_clientes', 'editar_clientes'
        ],
        'user': [
          'visualizar_estoque', 'visualizar_clientes'
        ]
      }

      // Verificar se o usuário tem a permissão baseada no seu role
      const userPermissions = rolePermissions[userRole] || rolePermissions['user']
      const hasPermission = userPermissions.includes(permission)

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Permissão insuficiente',
          code: 'INSUFFICIENT_PERMISSION',
          required: permission,
          userRole: userRole,
          availablePermissions: userPermissions
        })
      }

      next()
    } catch (error) {
      console.error('Erro na verificação de permissão:', error)
      return res.status(500).json({
        error: 'Erro interno na verificação de permissão',
        code: 'PERMISSION_ERROR'
      })
    }
  }
}

/**
 * Middleware para verificar roles (versão simplificada)
 */
export const requireRole = (role) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        })
      }

      // Sistema de roles simplificado
      const userRole = req.user.role || req.user.user_metadata?.role || 'user'
      
      // Verificar se usuário tem o role necessário
      const hasRole = userRole === role || 
                     (role === 'admin' && userRole === 'admin') ||
                     (role === 'manager' && (userRole === 'admin' || userRole === 'manager'))

      if (!hasRole) {
        return res.status(403).json({
          error: 'Role insuficiente',
          code: 'INSUFFICIENT_ROLE',
          required: role,
          userRole: userRole
        })
      }

      next()
    } catch (error) {
      console.error('Erro na verificação de role:', error)
      return res.status(500).json({
        error: 'Erro interno na verificação de role',
        code: 'ROLE_ERROR'
      })
    }
  }
}
