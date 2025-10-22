import jwt from 'jsonwebtoken'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { getRolePermissions, getRoleLevel } from '../config/roles.js'
import { attachPermissions } from './permissions.js'

/**
 * Middleware de autenticação JWT - Versão 2.0 (Sistema Simplificado)
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

    // Buscar dados completos do usuário no banco
    let userInfo = {
      id: user.id,
      email: user.email,
      nome: user.user_metadata?.nome || 'Usuário',
      status: 'Ativo',
      role: null,
      perfil: null
    }

    try {
      // Buscar usuário na tabela usuarios
      const { data: userData, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('email', user.email)
        .single()

      if (userData && !userError) {
        // Buscar perfil do usuário (novo sistema simplificado)
        const { data: perfilData, error: perfilError } = await supabaseAdmin
          .from('usuario_perfis')
          .select(`
            perfil_id,
            status,
            perfis!inner(
              id,
              nome,
              nivel_acesso,
              descricao
            )
          `)
          .eq('usuario_id', userData.id)
          .eq('status', 'Ativa')
          .single()

        if (perfilData && !perfilError) {
          const perfilNome = perfilData.perfis?.nome
          
          userInfo = {
            ...userData,
            role: perfilNome, // Nome do role (Admin, Gestores, Supervisores, Operários, Clientes)
            perfil: {
              id: perfilData.perfis.id,
              nome: perfilNome,
              nivel_acesso: perfilData.perfis.nivel_acesso,
              descricao: perfilData.perfis.descricao
            },
            perfil_id: perfilData.perfil_id,
            funcionario_id: userData.funcionario_id,
            // Adicionar permissões hardcoded baseadas no role
            permissions: getRolePermissions(perfilNome),
            level: getRoleLevel(perfilNome)
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('✓ Usuário autenticado:', {
              id: userData.id,
              email: userData.email,
              role: perfilNome,
              nivel: userInfo.level,
              permissoes: userInfo.permissions.length
            })
          }
        } else {
          console.warn('⚠️  Usuário sem perfil ativo:', userData.email)
          userInfo = {
            ...userData,
            role: null,
            perfil: null,
            funcionario_id: userData.funcionario_id,
            permissions: [],
            level: 0
          }
        }
      } else {
        console.warn('⚠️  Usuário não encontrado na tabela usuarios:', user.email)
      }
    } catch (dbError) {
      console.error('❌ Erro ao buscar dados do usuário:', dbError.message)
    }

    // Adicionar usuário enriquecido ao request
    req.user = { ...user, ...userInfo }
    
    next()
  } catch (error) {
    console.error('❌ Erro na autenticação:', error)
    return res.status(500).json({
      error: 'Erro interno na autenticação',
      code: 'AUTH_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * NOTA: As funções requirePermission, requireRole, requireLevel, etc. agora 
 * estão em backend-api/src/middleware/permissions.js
 * 
 * Use imports:
 * import { requirePermission, requireLevel, requireAdmin } from '../middleware/permissions.js'
 * 
 * Mantido aqui apenas para retrocompatibilidade temporária.
 * TODO: Remover após atualização de todas as rotas.
 */

// Re-exportar funções do novo middleware para retrocompatibilidade
export { 
  requirePermission,
  requireLevel,
  requireAdmin,
  requireManager,
  requireSupervisor,
  requireAllPermissions,
  requireAnyPermission
} from './permissions.js'

/**
 * @deprecated Use requirePermission do permissions.js
 */
export const requireRole = (roleName) => {
  console.warn('⚠️  requireRole está deprecated. Use requireLevel ou requirePermission do permissions.js')
  return requireLevel(getRoleLevel(roleName))
}
