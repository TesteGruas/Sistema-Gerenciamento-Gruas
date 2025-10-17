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
            role: perfilData.perfis?.nome?.toLowerCase() || 'user',
            perfil_id: perfilData.perfil_id, // Armazenar perfil_id para buscar permissões
            funcionario_id: userData.funcionario_id // Armazenar funcionario_id para filtrar obras
          }
          console.log('🔍 DEBUG: Usuário encontrado com perfil:', perfilData.perfis?.nome, 'ID:', perfilData.perfil_id)
          console.log('🔍 DEBUG: funcionario_id do usuário:', userData.funcionario_id)
        } else {
          console.log('🔍 DEBUG: Perfil não encontrado para o usuário:', userData.email, 'Erro:', perfilError?.message)
          userInfo = {
            ...userData,
            role: 'user',
            funcionario_id: userData.funcionario_id
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
    
    console.log('🔍 DEBUG: Usuário autenticado:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      nome: req.user.nome
    })
    
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
 * Converte permissão do formato antigo (underscore) para novo formato (modulo:acao)
 * Ex: visualizar_obras -> obras:visualizar
 */
const converterPermissaoParaNovoFormato = (permission) => {
  // Mapeamento de permissões antigas para novas
  const mapeamento = {
    'visualizar_obras': 'obras:visualizar',
    'criar_obras': 'obras:criar',
    'editar_obras': 'obras:editar',
    'excluir_obras': 'obras:deletar',
    'visualizar_estoque': 'estoque:visualizar',
    'criar_produtos': 'estoque:criar',
    'editar_produtos': 'estoque:editar',
    'excluir_produtos': 'estoque:deletar',
    'movimentar_estoque': 'estoque:movimentar',
    'visualizar_clientes': 'clientes:visualizar',
    'criar_clientes': 'clientes:criar',
    'editar_clientes': 'clientes:editar',
    'excluir_clientes': 'clientes:deletar',
    'visualizar_funcionarios': 'funcionarios:visualizar',
    'criar_funcionarios': 'funcionarios:criar',
    'editar_funcionarios': 'funcionarios:editar',
    'excluir_funcionarios': 'funcionarios:deletar',
    'visualizar_equipamentos': 'equipamentos:visualizar',
    'criar_equipamentos': 'equipamentos:criar',
    'editar_equipamentos': 'equipamentos:editar',
    'excluir_equipamentos': 'equipamentos:deletar',
    'visualizar_relacionamentos': 'relacionamentos:visualizar',
    'criar_relacionamentos': 'relacionamentos:criar',
    'editar_relacionamentos': 'relacionamentos:editar',
    'excluir_relacionamentos': 'relacionamentos:deletar',
    'criar_notificacoes': 'notificacoes:criar',
    'visualizar_notificacoes': 'notificacoes:visualizar',
    'editar_notificacoes': 'notificacoes:editar',
    'excluir_notificacoes': 'notificacoes:deletar'
  }
  
  return mapeamento[permission] || permission
}

/**
 * Middleware para verificar permissões (busca do banco de dados)
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

      const userRole = req.user?.role || 'user'
      const perfilId = req.user?.perfil_id
      
      console.log('🔍 DEBUG: Verificando permissão:', {
        permission,
        userRole,
        perfilId
      })

      // Converter permissão para novo formato se necessário
      const permissaoNovoFormato = converterPermissaoParaNovoFormato(permission)
      
      // Administrador tem acesso total
      if (userRole === 'administrador' || userRole === 'admin') {
        console.log('✅ PERMISSÃO CONCEDIDA: Administrador tem acesso total')
        return next()
      }

      // Se não tiver perfil_id, usar permissões hardcoded antigas (fallback)
      if (!perfilId) {
        console.log('⚠️ AVISO: Usuário sem perfil_id, usando permissões hardcoded')
        const rolePermissionsFallback = {
          'gerente': [
            'estoque:visualizar', 'estoque:criar', 'estoque:editar', 'estoque:movimentar',
            'clientes:visualizar', 'clientes:criar', 'clientes:editar',
            'usuarios:visualizar',
            'rh:visualizar', 'rh:criar', 'rh:editar',
            'historico:visualizar', 'historico:criar', 'historico:editar',
            'notificacoes:criar', 'notificacoes:visualizar'
          ],
          'supervisor': [
            'estoque:visualizar', 'clientes:visualizar', 'obras:visualizar',
            'usuarios:visualizar',
            'rh:visualizar',
            'historico:visualizar'
          ],
          'operador': [
            'estoque:visualizar', 'clientes:visualizar', 'obras:visualizar'
          ],
          'visualizador': [
            'estoque:visualizar', 'clientes:visualizar'
          ],
          'user': [
            'estoque:visualizar', 'clientes:visualizar'
          ]
        }
        
        const userPermissions = rolePermissionsFallback[userRole] || rolePermissionsFallback['user']
        const hasPermission = userPermissions.includes(permissaoNovoFormato)
        
        if (!hasPermission) {
          return res.status(403).json({
            error: 'Permissão insuficiente',
            code: 'INSUFFICIENT_PERMISSION',
            required: permission,
            userRole: userRole,
            availablePermissions: userPermissions
          })
        }
        
        return next()
      }

      // Buscar permissões do banco de dados
      try {
        const { data: permissoesData, error: permissoesError } = await supabaseAdmin
          .from('perfil_permissoes')
          .select(`
            status,
            permissoes!inner (
              nome,
              modulo,
              acao,
              status
            )
          `)
          .eq('perfil_id', perfilId)
          .eq('status', 'Ativa')

        if (permissoesError) {
          console.error('❌ Erro ao buscar permissões:', permissoesError)
          throw permissoesError
        }

        // Extrair nomes das permissões ativas
        const permissoesAtivas = (permissoesData || [])
          .filter(pp => pp.permissoes?.status === 'Ativa')
          .map(pp => pp.permissoes.nome)

        console.log('🔍 DEBUG: Permissões do usuário:', {
          perfilId,
          total: permissoesAtivas.length,
          permissoes: permissoesAtivas
        })

        // Verificar se tem a permissão (formato novo ou antigo)
        const hasPermission = permissoesAtivas.includes(permissaoNovoFormato) || 
                             permissoesAtivas.includes(permission)

        if (!hasPermission) {
          console.log('❌ PERMISSÃO NEGADA:', {
            permissionRequired: permission,
            permissionNovoFormato: permissaoNovoFormato,
            userRole,
            perfilId,
            availablePermissions: permissoesAtivas
          })
          return res.status(403).json({
            error: 'Permissão insuficiente',
            code: 'INSUFFICIENT_PERMISSION',
            required: permission,
            userRole: userRole,
            availablePermissions: permissoesAtivas
          })
        }

        console.log('✅ PERMISSÃO CONCEDIDA:', permission)
        next()

      } catch (dbError) {
        console.error('❌ Erro ao verificar permissões no banco:', dbError)
        return res.status(500).json({
          error: 'Erro ao verificar permissões',
          code: 'PERMISSION_DB_ERROR',
          message: dbError.message
        })
      }

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
