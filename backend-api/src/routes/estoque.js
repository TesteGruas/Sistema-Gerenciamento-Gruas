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
}).custom((value, helpers) => {
  // Validar se estoque_maximo > estoque_minimo quando ambos estão definidos
  if (value.estoque_maximo && value.estoque_maximo <= value.estoque_minimo) {
    return helpers.error('custom.estoqueMaximo');
  }
  return value;
}, 'Validação de estoque máximo')

// Schema para movimentações de estoque
const movimentacaoSchema = Joi.object({
  produto_id: Joi.string().required(),
  tipo: Joi.string().valid('Entrada', 'Saída', 'Ajuste', 'Transferência').required(),
  quantidade: Joi.number().integer().required(),
  motivo: Joi.string().required(),
  observacoes: Joi.string().allow('').optional()
})

// Schema para reservas de estoque
const reservaSchema = Joi.object({
  produto_id: Joi.string().required(),
  quantidade: Joi.number().integer().positive().required(),
  motivo: Joi.string().required(),
  observacoes: Joi.string().allow('').optional()
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
          quantidade_atual,
          quantidade_reservada,
          quantidade_disponivel,
          valor_total,
          ultima_movimentacao
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

    console.log('Dados do produto a ser criado:', produtoData)

    const { data, error: insertError } = await supabaseAdmin
      .from('produtos')
      .insert(produtoData)
      .select('*')
      .single()

    if (insertError) {
      console.error('Erro detalhado ao criar produto:', insertError)
      return res.status(500).json({
        error: 'Erro ao criar produto',
        message: insertError.message,
        details: insertError.details || 'Sem detalhes adicionais'
      })
    }

    // Criar registro de estoque inicial
    const { error: estoqueError } = await supabaseAdmin
      .from('estoque')
      .insert({
        produto_id: data.id,
        quantidade_atual: 0,
        quantidade_reservada: 0,
        quantidade_disponivel: 0,
        valor_total: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
      .select('*')
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

    const { produto_id, tipo, quantidade, motivo, observacoes } = value

    // Verificar se produto existe
    const { data: produto, error: produtoError } = await supabaseAdmin
      .from('produtos')
      .select('id, nome, valor_unitario, estoque_minimo, estoque_maximo')
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
      .select('quantidade_atual, quantidade_reservada, quantidade_disponivel, valor_total')
      .eq('produto_id', produto_id)
      .single()

    if (estoqueError) {
      return res.status(500).json({
        error: 'Erro ao consultar estoque',
        message: estoqueError.message
      })
    }

    // Calcular nova quantidade
    let novaQuantidade = estoqueAtual.quantidade_atual
    if (tipo === 'Entrada') {
      novaQuantidade += quantidade
      
      // Verificar se excede estoque máximo
      if (produto.estoque_maximo && novaQuantidade > produto.estoque_maximo) {
        return res.status(400).json({
          error: 'Estoque máximo excedido',
          message: `Estoque máximo: ${produto.estoque_maximo}, quantidade após entrada: ${novaQuantidade}`
        })
      }
    } else if (tipo === 'Saída') {
      // Verificar se há estoque disponível suficiente
      const estoqueDisponivel = estoqueAtual.quantidade_disponivel
      if (estoqueDisponivel < quantidade) {
        return res.status(400).json({
          error: 'Estoque insuficiente',
          message: `Estoque disponível: ${estoqueDisponivel}, tentativa de saída: ${quantidade}`
        })
      }
      
      novaQuantidade -= quantidade
      
      // Verificar se ficará abaixo do estoque mínimo
      if (novaQuantidade < produto.estoque_minimo) {
        return res.status(400).json({
          error: 'Estoque abaixo do mínimo',
          message: `Estoque restante: ${novaQuantidade}, mínimo: ${produto.estoque_minimo}`
        })
      }
    } else if (tipo === 'Ajuste') {
      novaQuantidade = quantidade
    }

    // Calcular valores atualizados
    const quantidadeDisponivel = novaQuantidade - estoqueAtual.quantidade_reservada
    const valorTotal = novaQuantidade * produto.valor_unitario

    // Atualizar estoque
    const { error: updateEstoqueError } = await supabaseAdmin
      .from('estoque')
      .update({ 
        quantidade_atual: novaQuantidade,
        quantidade_disponivel: quantidadeDisponivel,
        valor_total: valorTotal,
        ultima_movimentacao: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('produto_id', produto_id)

    if (updateEstoqueError) {
      return res.status(500).json({
        error: 'Erro ao atualizar estoque',
        message: updateEstoqueError.message
      })
    }

    // Preparar dados para inserção
    const movimentacaoData = {
      produto_id: produto_id.toString(),
      tipo,
      quantidade: quantidade.toString(),
      valor_unitario: produto.valor_unitario.toString(),
      valor_total: valorTotal.toString(),
      data_movimentacao: new Date().toISOString(),
      responsavel_id: req.user.id,
      observacoes: observacoes || null,
      status: 'Confirmada',
      motivo: motivo || null,
      created_at: new Date().toISOString()
    }

    console.log('Dados da movimentação a ser inserida:', movimentacaoData)

    // Registrar movimentação
    const { data: movimentacao, error: movimentacaoError } = await supabaseAdmin
      .from('movimentacoes_estoque')
      .insert(movimentacaoData)
      .select()
      .single()

    if (movimentacaoError) {
      console.error('Erro ao registrar movimentação:', movimentacaoError)
    }

    res.json({
      success: true,
      data: {
        movimentacao,
        estoque_anterior: estoqueAtual.quantidade_atual,
        estoque_atual: novaQuantidade,
        quantidade_disponivel: quantidadeDisponivel,
        valor_total: valorTotal
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

/**
 * @swagger
 * /api/estoque/reservar:
 *   post:
 *     summary: Reservar estoque
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
 *               - quantidade
 *               - motivo
 *             properties:
 *               produto_id:
 *                 type: integer
 *               quantidade:
 *                 type: integer
 *               motivo:
 *                 type: string
 *               observacoes:
 *                 type: string
 *               referencia:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estoque reservado com sucesso
 *       400:
 *         description: Dados inválidos ou estoque insuficiente
 */
router.post('/reservar', authenticateToken, requirePermission('movimentar_estoque'), async (req, res) => {
  try {
    const { error, value } = reservaSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { produto_id, quantidade, motivo, observacoes } = value

    // Verificar se produto existe
    const { data: produto, error: produtoError } = await supabaseAdmin
      .from('produtos')
      .select('id, nome, valor_unitario')
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
      .select('quantidade_atual, quantidade_reservada, quantidade_disponivel')
      .eq('produto_id', produto_id)
      .single()

    if (estoqueError) {
      return res.status(500).json({
        error: 'Erro ao consultar estoque',
        message: estoqueError.message
      })
    }

    // Verificar se há estoque disponível suficiente
    if (estoqueAtual.quantidade_disponivel < quantidade) {
      return res.status(400).json({
        error: 'Estoque insuficiente para reserva',
        message: `Estoque disponível: ${estoqueAtual.quantidade_disponivel}, quantidade solicitada: ${quantidade}`
      })
    }

    // Calcular nova quantidade reservada
    const novaQuantidadeReservada = estoqueAtual.quantidade_reservada + quantidade
    const novaQuantidadeDisponivel = estoqueAtual.quantidade_atual - novaQuantidadeReservada

    // Atualizar estoque
    const { error: updateEstoqueError } = await supabaseAdmin
      .from('estoque')
      .update({ 
        quantidade_reservada: novaQuantidadeReservada,
        quantidade_disponivel: novaQuantidadeDisponivel,
        ultima_movimentacao: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('produto_id', produto_id)

    if (updateEstoqueError) {
      return res.status(500).json({
        error: 'Erro ao reservar estoque',
        message: updateEstoqueError.message
      })
    }

    // Registrar movimentação de reserva
    const { data: movimentacao, error: movimentacaoError } = await supabaseAdmin
      .from('movimentacoes_estoque')
      .insert({
        produto_id: produto_id.toString(),
        tipo: 'RESERVA',
        quantidade: quantidade.toString(),
        valor_unitario: produto.valor_unitario.toString(),
        valor_total: (quantidade * produto.valor_unitario).toString(),
        data_movimentacao: new Date().toISOString(),
        responsavel_id: req.user.id,
        observacoes,
        status: 'Confirmada',
        motivo,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (movimentacaoError) {
      console.error('Erro ao registrar movimentação de reserva:', movimentacaoError)
    }

    res.json({
      success: true,
      data: {
        movimentacao,
        quantidade_reservada_anterior: estoqueAtual.quantidade_reservada,
        quantidade_reservada_atual: novaQuantidadeReservada,
        quantidade_disponivel: novaQuantidadeDisponivel
      },
      message: 'Estoque reservado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao reservar estoque:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/estoque/liberar-reserva:
 *   post:
 *     summary: Liberar reserva de estoque
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
 *               - quantidade
 *               - motivo
 *             properties:
 *               produto_id:
 *                 type: integer
 *               quantidade:
 *                 type: integer
 *               motivo:
 *                 type: string
 *               observacoes:
 *                 type: string
 *               referencia:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reserva liberada com sucesso
 *       400:
 *         description: Dados inválidos ou reserva insuficiente
 */
router.post('/liberar-reserva', authenticateToken, requirePermission('movimentar_estoque'), async (req, res) => {
  try {
    const { error, value } = reservaSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { produto_id, quantidade, motivo, observacoes } = value

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
      .select('quantidade_atual, quantidade_reservada, quantidade_disponivel')
      .eq('produto_id', produto_id)
      .single()

    if (estoqueError) {
      return res.status(500).json({
        error: 'Erro ao consultar estoque',
        message: estoqueError.message
      })
    }

    // Verificar se há reserva suficiente para liberar
    if (estoqueAtual.quantidade_reservada < quantidade) {
      return res.status(400).json({
        error: 'Reserva insuficiente para liberação',
        message: `Quantidade reservada: ${estoqueAtual.quantidade_reservada}, quantidade solicitada: ${quantidade}`
      })
    }

    // Calcular nova quantidade reservada
    const novaQuantidadeReservada = estoqueAtual.quantidade_reservada - quantidade
    const novaQuantidadeDisponivel = estoqueAtual.quantidade_atual - novaQuantidadeReservada

    // Atualizar estoque
    const { error: updateEstoqueError } = await supabaseAdmin
      .from('estoque')
      .update({ 
        quantidade_reservada: novaQuantidadeReservada,
        quantidade_disponivel: novaQuantidadeDisponivel,
        ultima_movimentacao: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('produto_id', produto_id)

    if (updateEstoqueError) {
      return res.status(500).json({
        error: 'Erro ao liberar reserva',
        message: updateEstoqueError.message
      })
    }

    // Registrar movimentação de liberação de reserva
    const { data: movimentacao, error: movimentacaoError } = await supabaseAdmin
      .from('movimentacoes_estoque')
      .insert({
        produto_id: produto_id.toString(),
        tipo: 'LIBERACAO_RESERVA',
        quantidade: quantidade.toString(),
        valor_unitario: produto.valor_unitario?.toString() || '0',
        valor_total: (quantidade * (produto.valor_unitario || 0)).toString(),
        data_movimentacao: new Date().toISOString(),
        responsavel_id: req.user.id,
        observacoes,
        status: 'Confirmada',
        motivo,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (movimentacaoError) {
      console.error('Erro ao registrar movimentação de liberação:', movimentacaoError)
    }

    res.json({
      success: true,
      data: {
        movimentacao,
        quantidade_reservada_anterior: estoqueAtual.quantidade_reservada,
        quantidade_reservada_atual: novaQuantidadeReservada,
        quantidade_disponivel: novaQuantidadeDisponivel
      },
      message: 'Reserva liberada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao liberar reserva:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/estoque/relatorio:
 *   get:
 *     summary: Relatório de estoque
 *     tags: [Estoque]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: estoque_baixo
 *         schema:
 *           type: boolean
 *         description: Mostrar apenas produtos com estoque baixo
 *     responses:
 *       200:
 *         description: Relatório de estoque
 */
router.get('/relatorio', authenticateToken, requirePermission('visualizar_estoque'), async (req, res) => {
  try {
    const { categoria_id, status, estoque_baixo } = req.query

    let query = supabaseAdmin
      .from('produtos')
      .select(`
        *,
        categorias (
          id,
          nome
        ),
        estoque (
          quantidade_atual,
          quantidade_reservada,
          quantidade_disponivel,
          valor_total,
          ultima_movimentacao
        )
      `)

    if (categoria_id) {
      query = query.eq('categoria_id', categoria_id)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: produtos, error } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar relatório',
        message: error.message
      })
    }

    // Filtrar produtos com estoque baixo se solicitado
    let produtosFiltrados = produtos || []
    if (estoque_baixo === 'true') {
      produtosFiltrados = produtos.filter(produto => 
        produto.estoque && produto.estoque.length > 0 && 
        produto.estoque[0].quantidade_disponivel <= produto.estoque_minimo
      )
    }

    // Calcular estatísticas
    const totalProdutos = produtosFiltrados.length
    const produtosAtivos = produtosFiltrados.filter(p => p.status === 'Ativo').length
    const produtosInativos = produtosFiltrados.filter(p => p.status === 'Inativo').length
    const produtosEstoqueBaixo = produtosFiltrados.filter(p => 
      p.estoque && p.estoque.length > 0 && 
      p.estoque[0].quantidade_disponivel <= p.estoque_minimo
    ).length

    const valorTotalEstoque = produtosFiltrados.reduce((total, produto) => {
      if (produto.estoque && produto.estoque.length > 0) {
        return total + parseFloat(produto.estoque[0].valor_total || 0)
      }
      return total
    }, 0)

    res.json({
      success: true,
      data: {
        produtos: produtosFiltrados,
        estatisticas: {
          total_produtos: totalProdutos,
          produtos_ativos: produtosAtivos,
          produtos_inativos: produtosInativos,
          produtos_estoque_baixo: produtosEstoqueBaixo,
          valor_total_estoque: valorTotalEstoque
        }
      }
    })
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// Endpoint de teste para verificar estrutura da tabela
router.get('/teste-estrutura', authenticateToken, async (req, res) => {
  try {
    // Testar consulta simples
    const { data, error } = await supabaseAdmin
      .from('produtos')
      .select('*')
      .limit(1)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao testar estrutura',
        message: error.message,
        details: error.details
      })
    }

    res.json({
      success: true,
      message: 'Estrutura da tabela OK',
      data: data
    })
  } catch (error) {
    console.error('Erro no teste de estrutura:', error)
    res.status(500).json({
      error: 'Erro interno',
      message: error.message
    })
  }
})

// Endpoint para testar inserção mínima na tabela movimentacoes_estoque
router.post('/teste-insercao', authenticateToken, async (req, res) => {
  try {
    // Testar inserção com dados mínimos
    const { data, error } = await supabaseAdmin
      .from('movimentacoes_estoque')
      .insert({
        produto_id: 'P0001',
        tipo: 'ENTRADA',
        quantidade: '1',
        valor_unitario: '100',
        valor_total: '100',
        data_movimentacao: new Date().toISOString(),
        responsavel_id: 2,
        status: 'Confirmada',
        motivo: 'TESTE',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao testar inserção:', error)
      return res.status(500).json({
        error: 'Erro ao testar inserção',
        message: error.message,
        details: error.details
      })
    }

    res.json({
      success: true,
      message: 'Inserção de teste bem-sucedida',
      data: data
    })
  } catch (error) {
    console.error('Erro ao testar inserção:', error)
    res.status(500).json({
      error: 'Erro interno',
      message: error.message
    })
  }
})

// Endpoint para criar movimentações de estoque (POST)
router.post('/movimentacoes', authenticateToken, requirePermission('movimentar_estoque'), async (req, res) => {
  try {
    const { error, value } = movimentacaoSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { produto_id, tipo, quantidade, motivo, observacoes } = value

    // Verificar se produto existe
    const { data: produto, error: produtoError } = await supabaseAdmin
      .from('produtos')
      .select('id, nome, valor_unitario, estoque_minimo, estoque_maximo')
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
      .select('quantidade_atual, quantidade_reservada, quantidade_disponivel, valor_total')
      .eq('produto_id', produto_id)
      .single()

    if (estoqueError) {
      return res.status(500).json({
        error: 'Erro ao consultar estoque',
        message: estoqueError.message
      })
    }

    // Calcular nova quantidade
    let novaQuantidade = estoqueAtual.quantidade_atual
    if (tipo === 'Entrada') {
      novaQuantidade += quantidade
      
      // Verificar se excede estoque máximo
      if (produto.estoque_maximo && novaQuantidade > produto.estoque_maximo) {
        return res.status(400).json({
          error: 'Estoque máximo excedido',
          message: `Estoque máximo: ${produto.estoque_maximo}, quantidade após entrada: ${novaQuantidade}`
        })
      }
    } else if (tipo === 'Saída') {
      // Verificar se há estoque disponível suficiente
      const estoqueDisponivel = estoqueAtual.quantidade_disponivel
      if (estoqueDisponivel < quantidade) {
        return res.status(400).json({
          error: 'Estoque insuficiente',
          message: `Estoque disponível: ${estoqueDisponivel}, tentativa de saída: ${quantidade}`
        })
      }
      
      novaQuantidade -= quantidade
      
      // Verificar se ficará abaixo do estoque mínimo
      if (novaQuantidade < produto.estoque_minimo) {
        return res.status(400).json({
          error: 'Estoque abaixo do mínimo',
          message: `Estoque restante: ${novaQuantidade}, mínimo: ${produto.estoque_minimo}`
        })
      }
    } else if (tipo === 'Ajuste') {
      novaQuantidade = quantidade
    }

    // Calcular valores atualizados
    const quantidadeDisponivel = novaQuantidade - estoqueAtual.quantidade_reservada
    const valorTotal = novaQuantidade * produto.valor_unitario

    // Atualizar estoque
    const { error: updateEstoqueError } = await supabaseAdmin
      .from('estoque')
      .update({ 
        quantidade_atual: novaQuantidade,
        quantidade_disponivel: quantidadeDisponivel,
        valor_total: valorTotal,
        ultima_movimentacao: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('produto_id', produto_id)

    if (updateEstoqueError) {
      return res.status(500).json({
        error: 'Erro ao atualizar estoque',
        message: updateEstoqueError.message
      })
    }

    // Preparar dados para inserção
    const movimentacaoData = {
      produto_id: produto_id.toString(),
      tipo,
      quantidade: quantidade.toString(),
      valor_unitario: produto.valor_unitario.toString(),
      valor_total: valorTotal.toString(),
      data_movimentacao: new Date().toISOString(),
      responsavel_id: req.user.id,
      observacoes: observacoes || null,
      status: 'Confirmada',
      motivo: motivo || null,
      created_at: new Date().toISOString()
    }

    console.log('Dados da movimentação a ser inserida:', movimentacaoData)

    // Registrar movimentação
    const { data: movimentacao, error: movimentacaoError } = await supabaseAdmin
      .from('movimentacoes_estoque')
      .insert(movimentacaoData)
      .select()
      .single()

    if (movimentacaoError) {
      console.error('Erro ao registrar movimentação:', movimentacaoError)
    }

    res.json({
      success: true,
      data: {
        movimentacao,
        estoque_anterior: estoqueAtual.quantidade_atual,
        estoque_atual: novaQuantidade,
        quantidade_disponivel: quantidadeDisponivel,
        valor_total: valorTotal
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

// Endpoint para listar movimentações de estoque
router.get('/movimentacoes', authenticateToken, requirePermission('visualizar_estoque'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const offset = (page - 1) * limit
    const { produto_id, tipo, data_inicio, data_fim } = req.query

    let query = supabaseAdmin
      .from('movimentacoes_estoque')
      .select(`
        *,
        produtos (
          id,
          nome,
          unidade_medida
        )
      `, { count: 'exact' })
      .order('data_movimentacao', { ascending: false })

    if (produto_id) {
      query = query.eq('produto_id', produto_id)
    }
    if (tipo) {
      query = query.eq('tipo', tipo)
    }
    if (data_inicio) {
      query = query.gte('data_movimentacao', data_inicio)
    }
    if (data_fim) {
      query = query.lte('data_movimentacao', data_fim)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar movimentações',
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
    console.error('Erro ao listar movimentações:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// Endpoint de teste para movimentações (sem autenticação)
router.get('/teste-movimentacoes', async (req, res) => {
  try {
    console.log('🔍 Testando endpoint de movimentações...')
    
    const { data, error } = await supabaseAdmin
      .from('movimentacoes_estoque')
      .select(`
        *,
        produtos (
          id,
          nome,
          unidade_medida
        )
      `)
      .limit(10)
      .order('data_movimentacao', { ascending: false })

    console.log('📊 Dados encontrados:', data?.length || 0)
    console.log('❌ Erro:', error)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar movimentações',
        message: error.message,
        details: error.details
      })
    }

    res.json({
      success: true,
      data: data || [],
      message: 'Teste de movimentações funcionando',
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Erro ao testar movimentações:', error)
    res.status(500).json({
      error: 'Erro interno',
      message: error.message
    })
  }
})

// Endpoint de teste para produtos (sem autenticação)
router.get('/teste-produtos', async (req, res) => {
  try {
    console.log('🔍 Testando endpoint de produtos...')
    
    const { data, error } = await supabaseAdmin
      .from('produtos')
      .select(`
        *,
        categorias (
          id,
          nome
        ),
        estoque (
          quantidade_atual,
          quantidade_reservada,
          quantidade_disponivel,
          valor_total,
          ultima_movimentacao
        )
      `)
      .limit(10)

    console.log('📊 Produtos encontrados:', data?.length || 0)
    console.log('❌ Erro:', error)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar produtos',
        message: error.message,
        details: error.details
      })
    }

    res.json({
      success: true,
      data: data || [],
      message: 'Teste de produtos funcionando',
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Erro ao testar produtos:', error)
    res.status(500).json({
      error: 'Erro interno',
      message: error.message
    })
  }
})

// Endpoint de debug para verificar token
router.get('/debug-token', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Token válido!',
      user: req.user,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao verificar token:', error)
    res.status(500).json({
      error: 'Erro interno',
      message: error.message
    })
  }
})

// Endpoint para testar diferentes valores de motivo
router.post('/teste-motivo', authenticateToken, async (req, res) => {
  try {
    const motivos = ['COMPRA', 'VENDA', 'AJUSTE', 'ENTRADA', 'SAIDA', 'TESTE']
    const resultados = []

    for (const motivo of motivos) {
      try {
        const { data, error } = await supabaseAdmin
          .from('movimentacoes_estoque')
          .insert({
            produto_id: 'P0001',
            tipo: 'Entrada',
            quantidade: '1',
            valor_unitario: '100',
            valor_total: '100',
            data_movimentacao: new Date().toISOString(),
            responsavel_id: 2,
            status: 'Confirmada',
            motivo: motivo,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        resultados.push({
          motivo,
          sucesso: !error,
          erro: error?.message || null
        })
      } catch (err) {
        resultados.push({
          motivo,
          sucesso: false,
          erro: err.message
        })
      }
    }

    res.json({
      success: true,
      resultados
    })
  } catch (error) {
    console.error('Erro ao testar motivos:', error)
    res.status(500).json({
      error: 'Erro interno',
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
          quantidade_atual,
          quantidade_reservada,
          quantidade_disponivel,
          valor_total,
          ultima_movimentacao
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

export default router
