import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para clientes
const clienteSchema = Joi.object({
  nome: Joi.string().min(2).required(),
  cnpj: Joi.string().allow('').optional(), // CNPJ
  email: Joi.string().email().allow('').optional(),
  telefone: Joi.string().allow('').optional(),
  endereco: Joi.string().allow('').optional(),
  cidade: Joi.string().allow('').optional(),
  estado: Joi.string().length(2).allow('').optional(),
  cep: Joi.string().pattern(/^[\d]{2}\.?[\d]{3}-?[\d]{3}$/).allow('').optional(),
  contato: Joi.string().allow('').optional(), // Nome do representante
  contato_email: Joi.string().email().allow('').optional(), // Email do representante
  contato_cpf: Joi.string().allow('').optional(), // CPF do representante
  contato_telefone: Joi.string().allow('').optional(), // Telefone do representante
  status: Joi.string().valid('ativo', 'inativo', 'bloqueado', 'pendente').default('ativo').optional()
})

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     summary: Listar todos os clientes
 *     tags: [Clientes]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou email (LIKE)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ativo, inativo, bloqueado, pendente]
 *         description: Filtrar por status do cliente
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router.get('/', authenticateToken, requirePermission('visualizar_clientes'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    let query = supabaseAdmin
      .from('clientes')
      .select('*', { count: 'exact' })

    // Aplicar filtro de busca
    if (req.query.search) {
      const searchTerm = `%${req.query.search}%`
      query = query.or(`nome.ilike.${searchTerm},email.ilike.${searchTerm}`)
    }

    // Aplicar filtro de status
    if (req.query.status) {
      query = query.eq('status', req.query.status)
    }

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar clientes',
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
    console.error('Erro ao listar clientes:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/clientes/{id}:
 *   get:
 *     summary: Obter cliente por ID
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Dados do cliente
 *       404:
 *         description: Cliente não encontrado
 */
router.get('/:id', authenticateToken, requirePermission('visualizar_clientes'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Cliente não encontrado',
          message: 'O cliente com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar cliente',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/clientes:
 *   post:
 *     summary: Criar novo cliente
 *     tags: [Clientes]
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
 *               - cnpj
 *             properties:
 *               nome:
 *                 type: string
 *               cnpj:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               telefone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', authenticateToken, requirePermission('criar_clientes'), async (req, res) => {
  try {
    const { error, value } = clienteSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const clienteData = {
      ...value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('clientes')
      .insert(clienteData)
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao criar cliente',
        message: insertError.message
      })
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Cliente criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/clientes/{id}:
 *   put:
 *     summary: Atualizar cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cliente
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
 *               telefone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Ativo, Inativo, Bloqueado, Pendente]
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *       404:
 *         description: Cliente não encontrado
 */
router.put('/:id', authenticateToken, requirePermission('editar_clientes'), async (req, res) => {
  try {
    const { id } = req.params

    const { error, value } = clienteSchema.validate(req.body)
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
      .from('clientes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Cliente não encontrado',
          message: 'O cliente com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar cliente',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Cliente atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/clientes/{id}:
 *   delete:
 *     summary: Excluir cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Cliente excluído com sucesso
 *       404:
 *         description: Cliente não encontrado
 */
router.delete('/:id', authenticateToken, requirePermission('excluir_clientes'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao excluir cliente',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Cliente excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir cliente:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
