import express from 'express'
import Joi from 'joi'
import { supabase } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'
import { generateToken, hashToken, isTokenExpired, getTokenExpiry } from '../utils/token.js'
import { sendResetPasswordEmail, sendPasswordChangedEmail } from '../services/email.service.js'

const router = express.Router()

// Middleware para adicionar headers CORS específicos
router.use((req, res, next) => {
  const origin = req.headers.origin
  
  // Verificar se a origin é permitida
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://72.60.60.118:3000',
    'http://72.60.60.118:3001',
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3001$/
  ]
  
  const isAllowed = !origin || allowedOrigins.some(allowedOrigin => {
    if (typeof allowedOrigin === 'string') {
      return allowedOrigin === origin
    } else if (allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin)
    }
    return false
  })
  
  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin || '*')
  } else {
    res.header('Access-Control-Allow-Origin', '*')
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
})

// Schemas de validação
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
})

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  nome: Joi.string().min(2).required(),
  cpf: Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/).optional(),
  telefone: Joi.string().optional()
})

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Fazer login no sistema
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@admin.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: teste@123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     session:
 *                       type: object
 *                     profile:
 *                       type: object
 *                       description: Dados do perfil do usuário
 *                     perfil:
 *                       type: object
 *                       description: Dados do perfil de acesso
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nome:
 *                           type: string
 *                         nivel_acesso:
 *                           type: string
 *                         descricao:
 *                           type: string
 *                     permissoes:
 *                       type: array
 *                       description: Lista de permissões do usuário
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                           descricao:
 *                             type: string
 *                           modulo:
 *                             type: string
 *                           acao:
 *                             type: string
 *                     access_token:
 *                       type: string
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      // Traduzir mensagens de erro do Joi para mensagens mais amigáveis
      let userMessage = 'Dados inválidos'
      const joiMessage = error.details[0].message
      
      if (joiMessage.includes('email')) {
        userMessage = 'Por favor, insira um email válido'
      } else if (joiMessage.includes('password') && joiMessage.includes('length')) {
        userMessage = 'A senha deve ter pelo menos 6 caracteres'
      } else if (joiMessage.includes('required')) {
        if (joiMessage.includes('email')) {
          userMessage = 'O email é obrigatório'
        } else if (joiMessage.includes('password')) {
          userMessage = 'A senha é obrigatória'
        }
      }
      
      return res.status(400).json({
        error: userMessage,
        message: userMessage,
        details: joiMessage
      })
    }

    const { email, password } = value

    // Fazer login no Supabase
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      // Traduzir erros específicos do Supabase
      let userMessage = 'Email ou senha incorretos'
      let description = 'Verifique suas credenciais e tente novamente'
      
      if (authError.message.includes('Invalid login credentials')) {
        userMessage = 'Email ou senha incorretos'
        description = 'Verifique se o email e senha estão corretos'
      } else if (authError.message.includes('Email not confirmed')) {
        userMessage = 'Email não confirmado'
        description = 'Verifique sua caixa de entrada e confirme seu email'
      } else if (authError.message.includes('Too many requests')) {
        userMessage = 'Muitas tentativas de login'
        description = 'Aguarde alguns minutos antes de tentar novamente'
      } else if (authError.message.includes('User not found')) {
        userMessage = 'Usuário não encontrado'
        description = 'Verifique se o email está correto'
      }
      
      return res.status(401).json({
        error: userMessage,
        message: userMessage,
        description: description
      })
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single()

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError)
    }

    // Buscar perfil e permissões do usuário
    let perfilData = null
    let permissoes = []

    if (profile) {
      // Buscar o perfil do usuário
      const { data: perfilUsuario, error: perfilError } = await supabase
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
        .eq('usuario_id', profile.id)
        .eq('status', 'Ativa')
        .single()

      if (perfilUsuario && !perfilError) {
        perfilData = {
          id: perfilUsuario.perfil_id,
          nome: perfilUsuario.perfis.nome,
          nivel_acesso: perfilUsuario.perfis.nivel_acesso,
          descricao: perfilUsuario.perfis.descricao
        }

        // Buscar permissões do perfil
        const { data: perfilPermissoes, error: permissoesError } = await supabase
          .from('perfil_permissoes')
          .select(`
            *,
            permissoes(
              id,
              nome,
              descricao,
              modulo,
              acao
            )
          `)
          .eq('perfil_id', perfilUsuario.perfil_id)
          .eq('status', 'Ativa')

        if (perfilPermissoes && !permissoesError) {
          permissoes = perfilPermissoes.map(pp => ({
            id: pp.permissoes.id,
            nome: pp.permissoes.nome,
            descricao: pp.permissoes.descricao,
            modulo: pp.permissoes.modulo,
            acao: pp.permissoes.acao
          }))
        }
      }
    }

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
        profile: profile,
        perfil: perfilData,
        permissoes: permissoes,
        access_token: data.session.access_token
      }
    })
  } catch (error) {
    console.error('Erro no login:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - nome
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               nome:
 *                 type: string
 *               cpf:
 *                 type: string
 *                 pattern: '^\d{3}\.\d{3}\.\d{3}-\d{2}$'
 *               telefone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Email já cadastrado
 */
router.post('/register', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { email, password, nome, cpf, telefone } = value

    // Registrar no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          cpf,
          telefone
        }
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(409).json({
          error: 'Email já cadastrado',
          message: authError.message
        })
      }
      return res.status(400).json({
        error: 'Erro ao registrar usuário',
        message: authError.message
      })
    }

    // Criar perfil na tabela usuarios
    const { data: profileData, error: profileError } = await supabase
      .from('usuarios')
      .insert({
        email,
        nome,
        cpf,
        telefone,
        status: 'Ativo',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)
    }

    res.status(201).json({
      success: true,
      data: {
        user: authData.user,
        profile: profileData,
        message: 'Usuário registrado com sucesso'
      }
    })
  } catch (error) {
    console.error('Erro no registro:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Fazer logout
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *       401:
 *         description: Token inválido
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return res.status(400).json({
        error: 'Erro ao fazer logout',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    })
  } catch (error) {
    console.error('Erro no logout:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obter dados do usuário logado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       401:
 *         description: Token inválido
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Buscar perfil completo do usuário
    const { data: profile, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', req.user.email)
      .single()

    if (error) {
      return res.status(404).json({
        error: 'Perfil não encontrado',
        message: error.message
      })
    }

    // Buscar perfil e permissões do usuário
    let perfilData = null
    let permissoes = []

    if (profile) {
      // Buscar o perfil do usuário
      const { data: perfilUsuario, error: perfilError } = await supabase
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
        .eq('usuario_id', profile.id)
        .eq('status', 'Ativa')
        .single()

      if (perfilUsuario && !perfilError) {
        perfilData = {
          id: perfilUsuario.perfil_id,
          nome: perfilUsuario.perfis.nome,
          nivel_acesso: perfilUsuario.perfis.nivel_acesso,
          descricao: perfilUsuario.perfis.descricao
        }

        // Buscar permissões do perfil
        const { data: perfilPermissoes, error: permissoesError } = await supabase
          .from('perfil_permissoes')
          .select(`
            *,
            permissoes(
              id,
              nome,
              descricao,
              modulo,
              acao
            )
          `)
          .eq('perfil_id', perfilUsuario.perfil_id)
          .eq('status', 'Ativa')

        if (perfilPermissoes && !permissoesError) {
          permissoes = perfilPermissoes.map(pp => ({
            id: pp.permissoes.id,
            nome: pp.permissoes.nome,
            descricao: pp.permissoes.descricao,
            modulo: pp.permissoes.modulo,
            acao: pp.permissoes.acao
          }))
        }
      }
    }

    res.json({
      success: true,
      data: {
        user: req.user,
        profile: profile,
        perfil: perfilData,
        permissoes: permissoes
      }
    })
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar token de acesso
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *       401:
 *         description: Token inválido
 */
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: req.user.refresh_token
    })

    if (error) {
      return res.status(401).json({
        error: 'Erro ao renovar token',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      }
    })
  } catch (error) {
    console.error('Erro ao renovar token:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * ==============================================
 * RESET PASSWORD ENDPOINTS
 * ==============================================
 */

// Schema para validação de redefinição de senha
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
})

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().min(6).required().valid(Joi.ref('password'))
})

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicitar redefinição de senha
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email de redefinição enviado
 */
router.post('/forgot-password', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = forgotPasswordSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { email } = value

    // Buscar usuário pelo email
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('email', email)
      .eq('status', 'Ativo')
      .single()

    // Por segurança, sempre retorna sucesso mesmo se o email não existir
    if (usuarioError || !usuario) {
      return res.json({
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir a senha'
      })
    }

    // Gerar token único
    const token = generateToken()
    const hashedToken = hashToken(token)
    
    // Configurar expiração (1 hora)
    const expiryMs = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY || '3600000')
    const expiresAt = getTokenExpiry(expiryMs)

    // Invalidar tokens anteriores do mesmo usuário
    await supabase
      .from('password_reset_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('usuario_id', usuario.id)
      .eq('used', false)

    // Salvar novo token no banco
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        usuario_id: usuario.id,
        email: usuario.email,
        token: hashedToken,
        expires_at: expiresAt.toISOString()
      })

    if (tokenError) {
      console.error('Erro ao criar token:', tokenError)
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar solicitação'
      })
    }

    // Enviar email com token (usar token original, não o hash)
    try {
      await sendResetPasswordEmail({
        nome: usuario.nome,
        email: usuario.email,
        token: token // Token original para o link
      })
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError)
      // Não retornar erro para o usuário por segurança
    }

    res.json({
      success: true,
      message: 'Se o email existir, você receberá instruções para redefinir a senha'
    })

  } catch (error) {
    console.error('Erro em forgot-password:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao processar solicitação'
    })
  }
})

/**
 * @swagger
 * /api/auth/validate-reset-token/{token}:
 *   get:
 *     summary: Validar token de redefinição
 *     tags: [Autenticação]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token válido
 *       400:
 *         description: Token inválido ou expirado
 */
router.get('/validate-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params
    
    if (!token) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Token não fornecido'
      })
    }

    // Hash do token para buscar no banco
    const hashedToken = hashToken(token)

    // Buscar token no banco
    const { data: tokenData, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', hashedToken)
      .eq('used', false)
      .single()

    if (error || !tokenData) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Token inválido ou já utilizado'
      })
    }

    // Verificar se está expirado
    if (isTokenExpired(tokenData.expires_at)) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Token expirado'
      })
    }

    res.json({
      success: true,
      valid: true,
      email: tokenData.email
    })

  } catch (error) {
    console.error('Erro em validate-reset-token:', error)
    res.status(500).json({
      success: false,
      valid: false,
      error: 'Erro ao validar token'
    })
  }
})

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Redefinir senha com token
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *               confirmPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 */
router.post('/reset-password', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = resetPasswordSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { token, password } = value

    // Hash do token
    const hashedToken = hashToken(token)

    // Buscar token no banco
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', hashedToken)
      .eq('used', false)
      .single()

    if (tokenError || !tokenData) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido ou já utilizado'
      })
    }

    // Verificar expiração
    if (isTokenExpired(tokenData.expires_at)) {
      return res.status(400).json({
        success: false,
        error: 'Token expirado. Solicite uma nova redefinição de senha'
      })
    }

    // Buscar usuário
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', tokenData.usuario_id)
      .single()

    if (usuarioError || !usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      })
    }

    // Atualizar senha no Supabase Auth
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
        usuario.id.toString(),
        { password: password }
      )

      if (authError) {
        throw authError
      }
    } catch (authError) {
      console.error('Erro ao atualizar senha no Supabase Auth:', authError)
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar senha'
      })
    }

    // Marcar token como usado
    await supabase
      .from('password_reset_tokens')
      .update({ 
        used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('id', tokenData.id)

    // Enviar email de confirmação
    try {
      await sendPasswordChangedEmail({
        nome: usuario.nome,
        email: usuario.email
      })
    } catch (emailError) {
      console.error('Erro ao enviar email de confirmação:', emailError)
      // Não falhar a operação por causa do email
    }

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    })

  } catch (error) {
    console.error('Erro em reset-password:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao redefinir senha'
    })
  }
})

/**
 * @swagger
 * /api/auth/reset-tokens:
 *   delete:
 *     summary: Limpar tokens expirados (Admin)
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tokens expirados removidos
 */
router.delete('/reset-tokens', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin (implementar verificação de permissão)
    
    // Deletar tokens expirados
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      throw error
    }

    res.json({
      success: true,
      message: 'Tokens expirados removidos',
      deleted_count: data?.length || 0
    })

  } catch (error) {
    console.error('Erro ao limpar tokens:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao limpar tokens'
    })
  }
})

export default router
