import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para contratos
const contratoSchema = Joi.object({
  numero: Joi.string().required(),
  cliente_id: Joi.number().integer().positive().required(),
  obra_id: Joi.number().integer().positive().required(),
  tipo: Joi.string().valid('Locação', 'Venda', 'Serviço', 'Manutenção').required(),
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().optional(),
  valor_total: Joi.number().positive().required(),
  valor_mensal: Joi.number().positive().optional(),
  status: Joi.string().valid('Rascunho', 'Ativo', 'Pausado', 'Finalizado', 'Cancelado').default('Rascunho'),
  observacoes: Joi.string().optional(),
  termos_condicoes: Joi.string().optional(),
  responsavel_comercial: Joi.string().optional(),
  responsavel_tecnico: Joi.string().optional()
})

/**
 * @swagger
 * /api/contratos:
 *   get:
 *     summary: Listar todos os contratos
 *     tags: [Contratos]
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
 *           enum: [Rascunho, Ativo, Pausado, Finalizado, Cancelado]
 *         description: Filtrar por status
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [Locação, Venda, Serviço, Manutenção]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: cliente_id
 *         schema:
 *           type: integer
 *         description: Filtrar por cliente
 *     responses:
 *       200:
 *         description: Lista de contratos
 */
router.get('/', authenticateToken, requirePermission('visualizar_contratos'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { status, tipo, cliente_id } = req.query

    let query = supabaseAdmin
      .from('contratos')
      .select(`
        *,
        clientes (
          id,
          nome,
          tipo,
          documento
        ),
        obras (
          id,
          nome,
          endereco,
          cidade,
          estado
        )
      `, { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }
    if (tipo) {
      query = query.eq('tipo', tipo)
    }
    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id)
    }

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar contratos',
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
    console.error('Erro ao listar contratos:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/contratos/{id}:
 *   get:
 *     summary: Obter contrato por ID
 *     tags: [Contratos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do contrato
 *     responses:
 *       200:
 *         description: Dados do contrato
 *       404:
 *         description: Contrato não encontrado
 */
router.get('/:id', authenticateToken, requirePermission('visualizar_contratos'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('contratos')
      .select(`
        *,
        clientes (
          id,
          nome,
          tipo,
          documento,
          telefone,
          email
        ),
        obras (
          id,
          nome,
          endereco,
          cidade,
          estado,
          status
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Contrato não encontrado',
          message: 'O contrato com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar contrato',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar contrato:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/contratos:
 *   post:
 *     summary: Criar novo contrato
 *     tags: [Contratos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero
 *               - cliente_id
 *               - obra_id
 *               - tipo
 *               - data_inicio
 *               - valor_total
 *             properties:
 *               numero:
 *                 type: string
 *               cliente_id:
 *                 type: integer
 *               obra_id:
 *                 type: integer
 *               tipo:
 *                 type: string
 *                 enum: [Locação, Venda, Serviço, Manutenção]
 *               data_inicio:
 *                 type: string
 *                 format: date
 *               valor_total:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Rascunho, Ativo, Pausado, Finalizado, Cancelado]
 *     responses:
 *       201:
 *         description: Contrato criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', authenticateToken, requirePermission('criar_contratos'), async (req, res) => {
  try {
    const { error, value } = contratoSchema.validate(req.body)
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

    // Verificar se obra existe
    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select('id, nome')
      .eq('id', value.obra_id)
      .single()

    if (obraError || !obra) {
      return res.status(404).json({
        error: 'Obra não encontrada',
        message: 'A obra especificada não existe'
      })
    }

    const contratoData = {
      ...value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabase
      .from('contratos')
      .insert(contratoData)
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao criar contrato',
        message: insertError.message
      })
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Contrato criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar contrato:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/contratos/{id}:
 *   put:
 *     summary: Atualizar contrato
 *     tags: [Contratos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do contrato
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Rascunho, Ativo, Pausado, Finalizado, Cancelado]
 *               data_fim:
 *                 type: string
 *                 format: date
 *               valor_total:
 *                 type: number
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contrato atualizado com sucesso
 *       404:
 *         description: Contrato não encontrado
 */
router.put('/:id', authenticateToken, requirePermission('editar_contratos'), async (req, res) => {
  try {
    const { id } = req.params

    const { error, value } = contratoSchema.validate(req.body)
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
      .from('contratos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Contrato não encontrado',
          message: 'O contrato com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar contrato',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Contrato atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar contrato:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/contratos/{id}:
 *   delete:
 *     summary: Excluir contrato
 *     tags: [Contratos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do contrato
 *     responses:
 *       200:
 *         description: Contrato excluído com sucesso
 *       404:
 *         description: Contrato não encontrado
 */
router.delete('/:id', authenticateToken, requirePermission('excluir_contratos'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('contratos')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao excluir contrato',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Contrato excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir contrato:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
