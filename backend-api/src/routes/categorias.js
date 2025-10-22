import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para categorias
const categoriaSchema = Joi.object({
  nome: Joi.string().min(2).required(),
  descricao: Joi.string().allow('').optional(),
  status: Joi.string().valid('Ativa', 'Inativa').default('Ativa')
})

/**
 * @swagger
 * /api/categorias:
 *   get:
 *     summary: Listar categorias
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativa, Inativa]
 *         description: Filtrar por status da categoria
 *     responses:
 *       200:
 *         description: Lista de categorias
 */
router.get('/', authenticateToken, requirePermission('estoque:visualizar'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { status } = req.query

    let query = supabaseAdmin
      .from('categorias')
      .select('*', { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar categorias',
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
    console.error('Erro ao listar categorias:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/categorias/{id}:
 *   get:
 *     summary: Obter categoria por ID
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Dados da categoria
 *       404:
 *         description: Categoria não encontrada
 */
router.get('/:id', authenticateToken, requirePermission('estoque:visualizar'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('categorias')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Categoria não encontrada',
          message: 'A categoria com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar categoria',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar categoria:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/categorias:
 *   post:
 *     summary: Criar nova categoria
 *     tags: [Categorias]
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
 *               status:
 *                 type: string
 *                 enum: [Ativa, Inativa]
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', authenticateToken, requirePermission('produtos:criar'), async (req, res) => {
  try {
    const { error, value } = categoriaSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const categoriaData = {
      ...value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('categorias')
      .insert(categoriaData)
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao criar categoria',
        message: insertError.message
      })
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Categoria criada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/categorias/{id}:
 *   put:
 *     summary: Atualizar categoria
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da categoria
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
 *               status:
 *                 type: string
 *                 enum: [Ativa, Inativa]
 *     responses:
 *       200:
 *         description: Categoria atualizada com sucesso
 *       404:
 *         description: Categoria não encontrada
 */
router.put('/:id', authenticateToken, requirePermission('produtos:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { error, value } = categoriaSchema.validate(req.body)
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
      .from('categorias')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Categoria não encontrada',
          message: 'A categoria com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar categoria',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Categoria atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/categorias/{id}:
 *   delete:
 *     summary: Excluir categoria
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Categoria excluída com sucesso
 *       404:
 *         description: Categoria não encontrada
 */
router.delete('/:id', authenticateToken, requirePermission('produtos:excluir'), async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se existem produtos usando esta categoria
    const { data: produtos, error: produtosError } = await supabaseAdmin
      .from('produtos')
      .select('id')
      .eq('categoria_id', id)
      .limit(1)

    if (produtosError) {
      return res.status(500).json({
        error: 'Erro ao verificar produtos',
        message: produtosError.message
      })
    }

    if (produtos && produtos.length > 0) {
      return res.status(400).json({
        error: 'Categoria em uso',
        message: 'Não é possível excluir uma categoria que possui produtos associados'
      })
    }

    const { error } = await supabaseAdmin
      .from('categorias')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao excluir categoria',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Categoria excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
