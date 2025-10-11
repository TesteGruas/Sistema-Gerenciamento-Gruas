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
    let userInfo = {
      id: user.id,
      email: user.email,
      nome: user.user_metadata?.nome || 'Usuário',
      status: 'Ativo',
      role: user.user_metadata?.role || 'admin'
    }

    try {
      // Primeiro buscar o usuário
      const { data: userData, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('email', user.email)
        .single()

      if (userData && !userError) {
        console.log('🔍 DEBUG: Usuário encontrado na tabela usuarios:', userData.id, userData.email)
        // Depois buscar o perfil do usuário
        const { data: perfilData, error: perfilError } = await supabaseAdmin
          .from('usuario_perfis')
          .select(`
            perfil_id,
            status,
            perfis!inner(nome, nivel_acesso)
          `)
          .eq('usuario_id', userData.id)
          .eq('status', 'Ativa')
          .single()

        if (perfilData && !perfilError) {
          userInfo = {
            ...userData,
            role: perfilData.perfis?.nome?.toLowerCase() || 'user'
          }
          console.log('🔍 DEBUG: Usuário encontrado com perfil:', perfilData.perfis?.nome)
        } else {
          console.log('🔍 DEBUG: Perfil não encontrado para o usuário:', userData.email, 'Erro:', perfilError?.message)
          userInfo = {
            ...userData,
            role: 'user'
          }
        }
      } else {
        console.log('🔍 DEBUG: Usuário não encontrado na tabela usuarios:', userError?.message)
      }
    } catch (dbError) {
      console.log('🔍 DEBUG: Erro ao buscar usuário:', dbError.message)
      console.log('Usuário não encontrado na tabela usuarios, usando dados do Supabase Auth')
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
      const userRole = req.user?.role || 'user'
      console.log('🔍 DEBUG: Role do usuário:', userRole)
      // Mapeamento de permissões por role
      const rolePermissions = {
        'administrador': [
          'visualizar_estoque', 'criar_produtos', 'editar_produtos', 'excluir_produtos', 'movimentar_estoque',
          'visualizar_clientes', 'criar_clientes', 'editar_clientes', 'excluir_clientes',
          'visualizar_obras', 'criar_obras', 'editar_obras', 'excluir_obras',
          'visualizar_funcionarios', 'criar_funcionarios', 'editar_funcionarios', 'excluir_funcionarios',
          'visualizar_equipamentos', 'criar_equipamentos', 'editar_equipamentos', 'excluir_equipamentos',
          'visualizar_relacionamentos', 'criar_relacionamentos', 'editar_relacionamentos', 'excluir_relacionamentos',
          'usuarios:visualizar', 'usuarios:criar', 'usuarios:editar', 'usuarios:deletar', 'usuarios:gerenciar_perfis', 'usuarios:gerenciar_permissoes',
          'rh:visualizar', 'rh:criar', 'rh:editar', 'rh:deletar',
            'historico:visualizar', 'historico:criar', 'historico:editar', 'historico:deletar',
          'criar_notificacoes', 'visualizar_notificacoes', 'editar_notificacoes', 'excluir_notificacoes'
        ],
        'gerente': [
          'visualizar_estoque', 'criar_produtos', 'editar_produtos', 'movimentar_estoque',
          'visualizar_clientes', 'criar_clientes', 'editar_clientes',
          'usuarios:visualizar',
          'rh:visualizar', 'rh:criar', 'rh:editar',
          'historico:visualizar', 'historico:criar', 'historico:editar',
          'criar_notificacoes', 'visualizar_notificacoes'
        ],
        'supervisor': [
          'visualizar_estoque', 'visualizar_clientes', 'visualizar_obras',
          'usuarios:visualizar',
          'rh:visualizar',
          'historico:visualizar'
        ],
        'operador': [
          'visualizar_estoque', 'visualizar_clientes'
        ],
        'visualizador': [
          'visualizar_estoque', 'visualizar_clientes'
        ],
        'admin': [
          'visualizar_estoque', 'criar_produtos', 'editar_produtos', 'excluir_produtos', 'movimentar_estoque',
          'visualizar_clientes', 'criar_clientes', 'editar_clientes', 'excluir_clientes',
          'visualizar_obras', 'criar_obras', 'editar_obras', 'excluir_obras',
          'visualizar_funcionarios', 'criar_funcionarios', 'editar_funcionarios', 'excluir_funcionarios',
          'visualizar_equipamentos', 'criar_equipamentos', 'editar_equipamentos', 'excluir_equipamentos',
          'visualizar_relacionamentos', 'criar_relacionamentos', 'editar_relacionamentos', 'excluir_relacionamentos',
          'usuarios:visualizar', 'usuarios:gerenciar_perfis', 'usuarios:gerenciar_permissoes',
          'rh:visualizar', 'rh:criar', 'rh:editar', 'rh:deletar',
          'historico:visualizar', 'historico:criar', 'historico:editar', 'historico:deletar',
          'criar_notificacoes', 'visualizar_notificacoes', 'editar_notificacoes', 'excluir_notificacoes'
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
