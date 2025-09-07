import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para obras
const obraSchema = Joi.object({
  nome: Joi.string().min(2).required(),
  descricao: Joi.string().optional(),
  cliente_id: Joi.number().integer().positive().required(),
  endereco: Joi.string().required(),
  cidade: Joi.string().required(),
  estado: Joi.string().length(2).required(),
  cep: Joi.string().pattern(/^\d{5}-?\d{3}$/).optional(),
  data_inicio: Joi.date().required(),
  data_prevista_fim: Joi.date().optional(),
  data_fim: Joi.date().optional(),
  status: Joi.string().valid('Planejamento', 'Em Andamento', 'Pausada', 'Concluída', 'Cancelada').default('Planejamento'),
  valor_total: Joi.number().positive().optional(),
  observacoes: Joi.string().optional(),
  responsavel_tecnico: Joi.string().optional(),
  contato_responsavel: Joi.string().optional()
})

/**
 * @swagger
 * /api/obras:
 *   get:
 *     summary: Listar todas as obras
 *     tags: [Obras]
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
 *           enum: [Planejamento, Em Andamento, Pausada, Concluída, Cancelada]
 *         description: Filtrar por status
 *       - in: query
 *         name: cliente_id
 *         schema:
 *           type: integer
 *         description: Filtrar por cliente
 *     responses:
 *       200:
 *         description: Lista de obras
 */
router.get('/', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { status, cliente_id } = req.query

    let query = supabaseAdmin
      .from('obras')
      .select(`
        *,
        clientes (
          id,
          nome,
          tipo
        )
      `, { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }
    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id)
    }

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar obras',
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
    console.error('Erro ao listar obras:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras/{id}:
 *   get:
 *     summary: Obter obra por ID
 *     tags: [Obras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *     responses:
 *       200:
 *         description: Dados da obra
 *       404:
 *         description: Obra não encontrada
 */
router.get('/:id', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('obras')
      .select(`
        *,
        clientes (
          id,
          nome,
          tipo,
          documento,
          telefone
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Obra não encontrada',
          message: 'A obra com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar obra',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras:
 *   post:
 *     summary: Criar nova obra
 *     tags: [Obras]
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
 *               - cliente_id
 *               - endereco
 *               - cidade
 *               - estado
 *               - data_inicio
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               cliente_id:
 *                 type: integer
 *               endereco:
 *                 type: string
 *               cidade:
 *                 type: string
 *               estado:
 *                 type: string
 *               data_inicio:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [Planejamento, Em Andamento, Pausada, Concluída, Cancelada]
 *     responses:
 *       201:
 *         description: Obra criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', authenticateToken, requirePermission('criar_obras'), async (req, res) => {
  try {
    const { error, value } = obraSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se cliente existe
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, nome')
      .eq('id', value.cliente_id)
      .single()

    if (clienteError || !cliente) {
      return res.status(404).json({
        error: 'Cliente não encontrado',
        message: 'O cliente especificado não existe'
      })
    }

    const obraData = {
      ...value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabase
      .from('obras')
      .insert(obraData)
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao criar obra',
        message: insertError.message
      })
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Obra criada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras/{id}:
 *   put:
 *     summary: Atualizar obra
 *     tags: [Obras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
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
 *                 enum: [Planejamento, Em Andamento, Pausada, Concluída, Cancelada]
 *               data_prevista_fim:
 *                 type: string
 *                 format: date
 *               valor_total:
 *                 type: number
 *     responses:
 *       200:
 *         description: Obra atualizada com sucesso
 *       404:
 *         description: Obra não encontrada
 */
router.put('/:id', authenticateToken, requirePermission('editar_obras'), async (req, res) => {
  try {
    const { id } = req.params

    const { error, value } = obraSchema.validate(req.body)
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

    const { data, error: updateError } = await supabase
      .from('obras')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Obra não encontrada',
          message: 'A obra com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar obra',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Obra atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/obras/{id}:
 *   delete:
 *     summary: Excluir obra
 *     tags: [Obras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *     responses:
 *       200:
 *         description: Obra excluída com sucesso
 *       404:
 *         description: Obra não encontrada
 */
router.delete('/:id', authenticateToken, requirePermission('excluir_obras'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('obras')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao excluir obra',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Obra excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
