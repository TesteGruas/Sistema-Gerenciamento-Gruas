import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para produtos
const produtoSchema = Joi.object({
  nome: Joi.string().min(2).required(),
  descricao: Joi.string().allow('').optional(),
  categoria_id: Joi.number().integer().positive().required(),
  codigo_barras: Joi.string().allow('').optional(),
  unidade_medida: Joi.string().valid('UN', 'KG', 'M', 'L', 'M2', 'M3', 'UNIDADE', 'PECA', 'CAIXA').required(),
  valor_unitario: Joi.number().positive().required(),
  estoque_minimo: Joi.number().min(0).default(0),
  estoque_maximo: Joi.number().min(0).optional(),
  localizacao: Joi.string().allow('').optional(),
  status: Joi.string().valid('Ativo', 'Inativo').default('Ativo')
})

// Schema para movimentações de estoque
const movimentacaoSchema = Joi.object({
  produto_id: Joi.string().required(),
  tipo: Joi.string().valid('ENTRADA', 'SAIDA', 'AJUSTE').required(),
  quantidade: Joi.number().integer().required(),
  motivo: Joi.string().required(),
  observacoes: Joi.string().allow('').optional(),
  referencia: Joi.string().allow('').optional() // Número da nota, ordem, etc.
})

/**
 * @swagger
 * /api/estoque:
 *   get:
 *     summary: Listar produtos em estoque
 *     tags: [Estoque]
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
 *         name: categoria_id
 *         schema:
 *           type: integer
 *         description: Filtrar por categoria
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativo, Inativo]
 *         description: Filtrar por status do produto
 *     responses:
 *       200:
 *         description: Lista de produtos
 */
router.get('/', authenticateToken, requirePermission('visualizar_estoque'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { categoria_id, status } = req.query

    let query = supabaseAdmin
      .from('produtos')
      .select(`
        *,
        categorias (
          id,
          nome
        ),
        estoque (
          quantidade
        )
      `, { count: 'exact' })

    if (categoria_id) {
      query = query.eq('categoria_id', categoria_id)
    }
    if (status) {
      query = query.eq('status', status)
    }

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar produtos',
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
    console.error('Erro ao listar produtos:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/estoque/{id}:
 *   get:
 *     summary: Obter produto por ID
 *     tags: [Estoque]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Dados do produto
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:id', authenticateToken, requirePermission('visualizar_estoque'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('produtos')
      .select(`
        *,
        categorias (
          id,
          nome
        ),
        estoque (
          quantidade
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Produto não encontrado',
          message: 'O produto com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar produto',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar produto:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/estoque:
 *   post:
 *     summary: Criar novo produto
 *     tags: [Estoque]
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
 *               - categoria_id
 *               - unidade_medida
 *               - valor_unitario
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               categoria_id:
 *                 type: integer
 *               unidade_medida:
 *                 type: string
 *                 enum: [UN, KG, M, L, M2, M3, UNIDADE, PECA, CAIXA]
 *               valor_unitario:
 *                 type: number
 *               estoque_minimo:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', authenticateToken, requirePermission('criar_produtos'), async (req, res) => {
  try {
    const { error, value } = produtoSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const produtoData = {
      ...value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('produtos')
      .insert(produtoData)
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao criar produto',
        message: insertError.message
      })
    }

    // Criar registro de estoque inicial
    const { error: estoqueError } = await supabaseAdmin
      .from('estoque')
      .insert({
        produto_id: data.id,
        quantidade: 0,
        created_at: new Date().toISOString()
      })

    if (estoqueError) {
      console.error('Erro ao criar estoque inicial:', estoqueError)
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Produto criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/estoque/{id}:
 *   put:
 *     summary: Atualizar produto
 *     tags: [Estoque]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               valor_unitario:
 *                 type: number
 *               estoque_minimo:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *       404:
 *         description: Produto não encontrado
 */
router.put('/:id', authenticateToken, requirePermission('editar_produtos'), async (req, res) => {
  try {
    const { id } = req.params

    const { error, value } = produtoSchema.validate(req.body)
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
      .from('produtos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Produto não encontrado',
          message: 'O produto com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar produto',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Produto atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/estoque/{id}:
 *   delete:
 *     summary: Excluir produto
 *     tags: [Estoque]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto excluído com sucesso
 *       404:
 *         description: Produto não encontrado
 */
router.delete('/:id', authenticateToken, requirePermission('excluir_produtos'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('produtos')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao excluir produto',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Produto excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir produto:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/estoque/movimentar:
 *   post:
 *     summary: Realizar movimentação de estoque
 *     tags: [Estoque]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - produto_id
 *               - tipo
 *               - quantidade
 *               - motivo
 *             properties:
 *               produto_id:
 *                 type: integer
 *               tipo:
 *                 type: string
 *                 enum: [ENTRADA, SAIDA, AJUSTE]
 *               quantidade:
 *                 type: integer
 *               motivo:
 *                 type: string
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Movimentação realizada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/movimentar', authenticateToken, requirePermission('movimentar_estoque'), async (req, res) => {
  try {
    const { error, value } = movimentacaoSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { produto_id, tipo, quantidade, motivo, observacoes, referencia } = value

    // Verificar se produto existe
    const { data: produto, error: produtoError } = await supabaseAdmin
      .from('produtos')
      .select('id, nome')
      .eq('id', produto_id)
      .single()

    if (produtoError || !produto) {
      return res.status(404).json({
        error: 'Produto não encontrado',
        message: 'O produto especificado não existe'
      })
    }

    // Obter estoque atual
    const { data: estoqueAtual, error: estoqueError } = await supabaseAdmin
      .from('estoque')
      .select('quantidade')
      .eq('produto_id', produto_id)
      .single()

    if (estoqueError) {
      return res.status(500).json({
        error: 'Erro ao consultar estoque',
        message: estoqueError.message
      })
    }

    // Calcular nova quantidade
    let novaQuantidade = estoqueAtual.quantidade
    if (tipo === 'ENTRADA') {
      novaQuantidade += quantidade
    } else if (tipo === 'SAIDA') {
      novaQuantidade -= quantidade
      if (novaQuantidade < 0) {
        return res.status(400).json({
          error: 'Estoque insuficiente',
          message: `Estoque atual: ${estoqueAtual.quantidade}, tentativa de saída: ${quantidade}`
        })
      }
    } else if (tipo === 'AJUSTE') {
      novaQuantidade = quantidade
    }

    // Atualizar estoque
    const { error: updateEstoqueError } = await supabaseAdmin
      .from('estoque')
      .update({ 
        quantidade: novaQuantidade,
        updated_at: new Date().toISOString()
      })
      .eq('produto_id', produto_id)

    if (updateEstoqueError) {
      return res.status(500).json({
        error: 'Erro ao atualizar estoque',
        message: updateEstoqueError.message
      })
    }

    // Registrar movimentação
    const { data: movimentacao, error: movimentacaoError } = await supabaseAdmin
      .from('movimentacoes_estoque')
      .insert({
        produto_id,
        tipo,
        quantidade,
        quantidade_anterior: estoqueAtual.quantidade,
        quantidade_atual: novaQuantidade,
        motivo,
        observacoes,
        referencia,
        usuario_id: req.user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (movimentacaoError) {
      console.error('Erro ao registrar movimentação:', movimentacaoError)
    }

    res.json({
      success: true,
      data: {
        movimentacao,
        estoque_anterior: estoqueAtual.quantidade,
        estoque_atual: novaQuantidade
      },
      message: 'Movimentação realizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao movimentar estoque:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
