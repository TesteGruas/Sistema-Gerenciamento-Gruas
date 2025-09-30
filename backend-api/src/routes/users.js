import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para usuários
const userSchema = Joi.object({
  nome: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  cpf: Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/).optional(),
  telefone: Joi.string().optional(),
  data_nascimento: Joi.date().optional(),
  endereco: Joi.string().optional(),
  cidade: Joi.string().optional(),
  estado: Joi.string().length(2).optional(),
  cep: Joi.string().pattern(/^\d{5}-?\d{3}$/).optional(),
  foto_perfil: Joi.string().uri().optional(),
  status: Joi.string().valid('Ativo', 'Inativo', 'Bloqueado', 'Pendente').default('Ativo'),
  perfil_id: Joi.number().integer().positive().optional()
})

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar todos os usuários
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativo, Inativo, Bloqueado, Pendente]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
router.get('/', authenticateToken, requirePermission('usuarios:visualizar'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { status } = req.query

    // Primeiro buscar usuários
    let query = supabaseAdmin
      .from('usuarios')
      .select('*', { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data: usuarios, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar usuários',
        message: error.message
      })
    }

    // Buscar perfis para cada usuário
    const usuariosComPerfis = await Promise.all(
      usuarios.map(async (usuario) => {
        const { data: perfilData } = await supabaseAdmin
          .from('usuario_perfis')
          .select(`
            id,
            perfil_id,
            status,
            data_atribuicao,
            perfis!inner(
              id,
              nome,
              nivel_acesso,
              descricao
            )
          `)
          .eq('usuario_id', usuario.id)
          .eq('status', 'Ativa')
          .single()

        return {
          ...usuario,
          usuario_perfis: perfilData
        }
      })
    )

    const data = usuariosComPerfis

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar usuários',
        message: error.message
      })
    }

    const totalPages = Math.ceil(count / limit)

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages
      }
    })
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obter usuário por ID
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/:id', authenticateToken, requirePermission('usuarios:visualizar'), async (req, res) => {
  try {
    const { id } = req.params

    // Buscar usuário
    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single()

    if (usuarioError) {
      if (usuarioError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'O usuário com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar usuário',
        message: usuarioError.message
      })
    }

    // Buscar perfil do usuário
    const { data: perfilData } = await supabaseAdmin
      .from('usuario_perfis')
      .select(`
        id,
        perfil_id,
        status,
        data_atribuicao,
        perfis!inner(
          id,
          nome,
          nivel_acesso,
          descricao
        )
      `)
      .eq('usuario_id', id)
      .eq('status', 'Ativa')
      .single()

    const data = {
      ...usuario,
      usuario_perfis: perfilData
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Criar novo usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               cpf:
 *                 type: string
 *               telefone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Ativo, Inativo, Bloqueado, Pendente]
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', authenticateToken, requirePermission('usuarios:criar'), async (req, res) => {
  try {
    const { error, value } = userSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Separar perfil_id dos dados do usuário
    const { perfil_id, ...userData } = value
    
    const finalUserData = {
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('usuarios')
      .insert(finalUserData)
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao criar usuário',
        message: insertError.message
      })
    }

    // Se perfil_id foi fornecido, associar o usuário ao perfil
    if (perfil_id && data) {
      const { error: perfilError } = await supabaseAdmin
        .from('usuario_perfis')
        .insert({
          usuario_id: data.id,
          perfil_id: perfil_id,
          data_atribuicao: new Date().toISOString(),
          status: 'Ativa',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (perfilError) {
        console.error('Erro ao associar perfil ao usuário:', perfilError)
        // Não falha a criação do usuário, apenas loga o erro
      }
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Usuário criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Atualizar usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               status:
 *                 type: string
 *                 enum: [Ativo, Inativo, Bloqueado, Pendente]
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       404:
 *         description: Usuário não encontrado
 */
router.put('/:id', authenticateToken, requirePermission('usuarios:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { error, value } = userSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Separar perfil_id dos dados do usuário
    const { perfil_id, ...userData } = value
    
    const updateData = {
      ...userData,
      updated_at: new Date().toISOString()
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'O usuário com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar usuário',
        message: updateError.message
      })
    }

    // Se perfil_id foi fornecido, atualizar a associação do usuário ao perfil
    if (perfil_id && data) {
      // Primeiro, desativar o perfil atual
      await supabaseAdmin
        .from('usuario_perfis')
        .update({ 
          status: 'Inativa',
          updated_at: new Date().toISOString()
        })
        .eq('usuario_id', id)
        .eq('status', 'Ativa')

      // Depois, criar nova associação ou ativar existente
      const { data: existingPerfil } = await supabaseAdmin
        .from('usuario_perfis')
        .select('*')
        .eq('usuario_id', id)
        .eq('perfil_id', perfil_id)
        .single()

      if (existingPerfil) {
        // Ativar perfil existente
        await supabaseAdmin
          .from('usuario_perfis')
          .update({
            status: 'Ativa',
            data_atribuicao: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPerfil.id)
      } else {
        // Criar nova associação
        await supabaseAdmin
          .from('usuario_perfis')
          .insert({
            usuario_id: id,
            perfil_id: perfil_id,
            data_atribuicao: new Date().toISOString(),
            status: 'Ativa',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }
    }

    res.json({
      success: true,
      data,
      message: 'Usuário atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Excluir usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário excluído com sucesso
 *       404:
 *         description: Usuário não encontrado
 */
router.delete('/:id', authenticateToken, requirePermission('usuarios:deletar'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao excluir usuário',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
