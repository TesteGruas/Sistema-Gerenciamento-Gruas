import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Schemas de validação
const perfilSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required(),
  descricao: Joi.string().max(500).optional(),
  nivel_acesso: Joi.number().integer().min(1).max(10).default(1),
  status: Joi.string().valid('Ativo', 'Inativo').default('Ativo')
})

const permissaoSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required(),
  descricao: Joi.string().max(500).optional(),
  modulo: Joi.string().min(2).max(50).required(),
  acao: Joi.string().min(2).max(50).required(),
  recurso: Joi.string().max(100).optional(),
  status: Joi.string().valid('Ativa', 'Inativa').default('Ativa')
})

/**
 * @swagger
 * /api/permissoes/perfis:
 *   get:
 *     summary: Listar todos os perfis
 *     tags: [Permissões]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de perfis
 */
router.get('/perfis', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('perfis')
      .select('*')
      .order('nivel_acesso', { ascending: false })

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar perfis',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao listar perfis:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/permissoes/perfis/{id}:
 *   get:
 *     summary: Obter perfil por ID
 *     tags: [Permissões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do perfil
 *     responses:
 *       200:
 *         description: Dados do perfil
 *       404:
 *         description: Perfil não encontrado
 */
router.get('/perfis/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('perfis')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return res.status(404).json({
        error: 'Perfil não encontrado',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
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
 * /api/permissoes/perfis:
 *   post:
 *     summary: Criar novo perfil
 *     tags: [Permissões]
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
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               nivel_acesso:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               status:
 *                 type: string
 *                 enum: [Ativo, Inativo]
 *     responses:
 *       201:
 *         description: Perfil criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/perfis', authenticateToken, requirePermission('usuarios:gerenciar_perfis'), async (req, res) => {
  try {
    const { error, value } = perfilSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const perfilData = {
      ...value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('perfis')
      .insert(perfilData)
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao criar perfil',
        message: insertError.message
      })
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Perfil criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar perfil:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/permissoes/perfis/{id}:
 *   put:
 *     summary: Atualizar perfil
 *     tags: [Permissões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do perfil
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               nivel_acesso:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [Ativo, Inativo]
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *       404:
 *         description: Perfil não encontrado
 */
router.put('/perfis/:id', authenticateToken, requirePermission('usuarios:gerenciar_perfis'), async (req, res) => {
  try {
    const { id } = req.params
    const { error, value } = perfilSchema.validate(req.body)
    
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const updateData = {
      ...value,
      updated_at: new Date().toISOString()
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('perfis')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return res.status(404).json({
        error: 'Perfil não encontrado',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Perfil atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/permissoes/perfis/{id}:
 *   delete:
 *     summary: Excluir perfil
 *     tags: [Permissões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do perfil
 *     responses:
 *       200:
 *         description: Perfil excluído com sucesso
 *       404:
 *         description: Perfil não encontrado
 */
router.delete('/perfis/:id', authenticateToken, requirePermission('usuarios:gerenciar_perfis'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('perfis')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(404).json({
        error: 'Perfil não encontrado',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Perfil excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir perfil:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/permissoes/permissoes:
 *   get:
 *     summary: Listar todas as permissões
 *     tags: [Permissões]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de permissões
 */
router.get('/permissoes', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('permissoes')
      .select('*')
      .order('modulo', { ascending: true })
      .order('acao', { ascending: true })

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar permissões',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao listar permissões:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/permissoes/perfis/{perfilId}/permissoes:
 *   get:
 *     summary: Obter permissões de um perfil
 *     tags: [Permissões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: perfilId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do perfil
 *     responses:
 *       200:
 *         description: Permissões do perfil
 */
router.get('/perfis/:perfilId/permissoes', authenticateToken, async (req, res) => {
  try {
    const { perfilId } = req.params

    const { data, error } = await supabaseAdmin
      .from('perfil_permissoes')
      .select(`
        *,
        permissoes(*)
      `)
      .eq('perfil_id', perfilId)
      .eq('status', 'Ativa')

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar permissões do perfil',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao buscar permissões do perfil:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/permissoes/perfis/{perfilId}/permissoes:
 *   post:
 *     summary: Atualizar permissões de um perfil
 *     tags: [Permissões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: perfilId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do perfil
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissoes:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs das permissões
 *     responses:
 *       200:
 *         description: Permissões atualizadas com sucesso
 */
router.post('/perfis/:perfilId/permissoes', authenticateToken, requirePermission('usuarios:gerenciar_permissoes'), async (req, res) => {
  try {
    const { perfilId } = req.params
    const { permissoes } = req.body

    if (!Array.isArray(permissoes)) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'Permissões deve ser um array'
      })
    }

    // Remover todas as permissões atuais do perfil
    await supabaseAdmin
      .from('perfil_permissoes')
      .delete()
      .eq('perfil_id', perfilId)

    // Adicionar as novas permissões
    if (permissoes.length > 0) {
      const perfilPermissoes = permissoes.map(permissaoId => ({
        perfil_id: parseInt(perfilId),
        permissao_id: permissaoId,
        data_atribuicao: new Date().toISOString(),
        atribuido_por: req.user.id,
        status: 'Ativa',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabaseAdmin
        .from('perfil_permissoes')
        .insert(perfilPermissoes)

      if (insertError) {
        return res.status(500).json({
          error: 'Erro ao atualizar permissões',
          message: insertError.message
        })
      }
    }

    res.json({
      success: true,
      message: 'Permissões atualizadas com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar permissões:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/permissoes/permissoes:
 *   post:
 *     summary: Criar nova permissão
 *     tags: [Permissões]
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
 *               - modulo
 *               - acao
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               modulo:
 *                 type: string
 *               acao:
 *                 type: string
 *               recurso:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Ativa, Inativa]
 *     responses:
 *       201:
 *         description: Permissão criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/permissoes', authenticateToken, requirePermission('usuarios:gerenciar_permissoes'), async (req, res) => {
  try {
    const { error, value } = permissaoSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const permissaoData = {
      ...value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('permissoes')
      .insert(permissaoData)
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao criar permissão',
        message: insertError.message
      })
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Permissão criada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar permissão:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
