import express from 'express'
import Joi from 'joi'
import { supabase } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

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
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { email, password } = value

    // Fazer login no Supabase
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: authError.message
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

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
        profile: profile,
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

    res.json({
      success: true,
      data: {
        user: req.user,
        profile: profile
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

export default router
