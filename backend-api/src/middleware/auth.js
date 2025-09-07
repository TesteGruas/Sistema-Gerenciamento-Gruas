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
 * Middleware para verificar permissões
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

      // Buscar permissões do usuário
      const { data: userPermissions, error } = await supabaseAdmin
        .from('usuario_perfis')
        .select(`
          perfis (
            perfil_permissoes (
              permissoes (
                nome
              )
            )
          )
        `)
        .eq('usuario_id', req.user.id)
        .eq('status', 'Ativa')

      if (error) {
        return res.status(500).json({
          error: 'Erro ao verificar permissões',
          code: 'PERMISSION_CHECK_ERROR'
        })
      }

      // Verificar se usuário tem a permissão
      const hasPermission = userPermissions?.some(up => 
        up.perfis?.perfil_permissoes?.some(pp => 
          pp.permissoes?.nome === permission
        )
      )

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Permissão insuficiente',
          code: 'INSUFFICIENT_PERMISSION',
          required: permission
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
 * Middleware para verificar roles
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

      // Buscar roles do usuário
      const { data: userRoles, error } = await supabaseAdmin
        .from('usuario_perfis')
        .select(`
          perfis (
            nome
          )
        `)
        .eq('usuario_id', req.user.id)
        .eq('status', 'Ativa')

      if (error) {
        return res.status(500).json({
          error: 'Erro ao verificar roles',
          code: 'ROLE_CHECK_ERROR'
        })
      }

      // Verificar se usuário tem o role
      const hasRole = userRoles?.some(ur => ur.perfis?.nome === role)

      if (!hasRole) {
        return res.status(403).json({
          error: 'Role insuficiente',
          code: 'INSUFFICIENT_ROLE',
          required: role
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
