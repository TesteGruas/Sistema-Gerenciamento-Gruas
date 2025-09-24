import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para custos mensais
const custoMensalSchema = Joi.object({
  obra_id: Joi.number().integer().positive().required(),
  item: Joi.string().min(1).max(20).required(),
  descricao: Joi.string().min(1).required(),
  unidade: Joi.string().valid('mês', 'und', 'und.', 'km', 'h', 'kg', 'm²', 'm³').required(),
  quantidade_orcamento: Joi.number().min(0).required(),
  valor_unitario: Joi.number().min(0).required(),
  mes: Joi.string().pattern(/^\d{4}-\d{2}$/).required(), // formato YYYY-MM
  quantidade_realizada: Joi.number().min(0).default(0),
  quantidade_acumulada: Joi.number().min(0).default(0),
  valor_acumulado: Joi.number().min(0).default(0),
  tipo: Joi.string().valid('contrato', 'aditivo').default('contrato')
})

const updateCustoMensalSchema = Joi.object({
  item: Joi.string().min(1).max(20).optional(),
  descricao: Joi.string().min(1).optional(),
  unidade: Joi.string().valid('mês', 'und', 'und.', 'km', 'h', 'kg', 'm²', 'm³').optional(),
  quantidade_orcamento: Joi.number().min(0).optional(),
  valor_unitario: Joi.number().min(0).optional(),
  quantidade_realizada: Joi.number().min(0).optional(),
  quantidade_acumulada: Joi.number().min(0).optional(),
  valor_acumulado: Joi.number().min(0).optional(),
  tipo: Joi.string().valid('contrato', 'aditivo').optional()
})

/**
 * @swagger
 * /api/custos-mensais:
 *   get:
 *     summary: Listar custos mensais
 *     tags: [Custos Mensais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: Filtrar por obra
 *       - in: query
 *         name: mes
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *         description: Filtrar por mês (formato YYYY-MM)
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [contrato, aditivo]
 *         description: Filtrar por tipo
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
 *           default: 50
 *     responses:
 *       200:
 *         description: Lista de custos mensais
 */
router.get('/', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const offset = (page - 1) * limit
    const { obra_id, mes, tipo } = req.query

    let query = supabaseAdmin
      .from('custos_mensais')
      .select(`
        *,
        obras (
          id,
          nome,
          status
        )
      `, { count: 'exact' })

    if (obra_id) {
      query = query.eq('obra_id', obra_id)
    }
    if (mes) {
      query = query.eq('mes', mes)
    }
    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    query = query.range(offset, offset + limit - 1).order('mes', { ascending: false }).order('item', { ascending: true })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar custos mensais',
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
    console.error('Erro ao listar custos mensais:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos-mensais/{id}:
 *   get:
 *     summary: Obter custo mensal por ID
 *     tags: [Custos Mensais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do custo mensal
 *     responses:
 *       200:
 *         description: Dados do custo mensal
 *       404:
 *         description: Custo mensal não encontrado
 */
router.get('/:id', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('custos_mensais')
      .select(`
        *,
        obras (
          id,
          nome,
          status
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Custo mensal não encontrado',
          message: 'O custo mensal com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar custo mensal',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar custo mensal:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos-mensais:
 *   post:
 *     summary: Criar novo custo mensal
 *     tags: [Custos Mensais]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - obra_id
 *               - item
 *               - descricao
 *               - unidade
 *               - quantidade_orcamento
 *               - valor_unitario
 *               - mes
 *             properties:
 *               obra_id:
 *                 type: integer
 *               item:
 *                 type: string
 *               descricao:
 *                 type: string
 *               unidade:
 *                 type: string
 *                 enum: [mês, und, und., km, h, kg, m², m³]
 *               quantidade_orcamento:
 *                 type: number
 *               valor_unitario:
 *                 type: number
 *               mes:
 *                 type: string
 *                 pattern: '^\d{4}-\d{2}$'
 *               quantidade_realizada:
 *                 type: number
 *                 default: 0
 *               quantidade_acumulada:
 *                 type: number
 *                 default: 0
 *               valor_acumulado:
 *                 type: number
 *                 default: 0
 *               tipo:
 *                 type: string
 *                 enum: [contrato, aditivo]
 *                 default: contrato
 *     responses:
 *       201:
 *         description: Custo mensal criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', authenticateToken, requirePermission('criar_obras'), async (req, res) => {
  try {
    const { error: validationError, value } = custoMensalSchema.validate(req.body)
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      })
    }

    // Verificar se a obra existe
    const { data: obra, error: obraError } = await supabaseAdmin
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

    // Verificar se já existe um item com o mesmo código para a mesma obra e mês
    const { data: existingItem, error: existingError } = await supabaseAdmin
      .from('custos_mensais')
      .select('id')
      .eq('obra_id', value.obra_id)
      .eq('item', value.item)
      .eq('mes', value.mes)
      .single()

    if (existingItem) {
      return res.status(409).json({
        error: 'Item já existe',
        message: `Já existe um item ${value.item} para a obra ${obra.nome} no mês ${value.mes}`
      })
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('custos_mensais')
      .insert(value)
      .select(`
        *,
        obras (
          id,
          nome,
          status
        )
      `)
      .single()

    if (insertError) {
      console.error('Erro ao criar custo mensal:', insertError)
      return res.status(500).json({
        error: 'Erro ao criar custo mensal',
        message: insertError.message
      })
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Custo mensal criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar custo mensal:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos-mensais/{id}:
 *   put:
 *     summary: Atualizar custo mensal
 *     tags: [Custos Mensais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do custo mensal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               item:
 *                 type: string
 *               descricao:
 *                 type: string
 *               unidade:
 *                 type: string
 *                 enum: [mês, und, und., km, h, kg, m², m³]
 *               quantidade_orcamento:
 *                 type: number
 *               valor_unitario:
 *                 type: number
 *               quantidade_realizada:
 *                 type: number
 *               quantidade_acumulada:
 *                 type: number
 *               valor_acumulado:
 *                 type: number
 *               tipo:
 *                 type: string
 *                 enum: [contrato, aditivo]
 *     responses:
 *       200:
 *         description: Custo mensal atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Custo mensal não encontrado
 */
router.put('/:id', authenticateToken, requirePermission('editar_obras'), async (req, res) => {
  try {
    const { id } = req.params
    const { error: validationError, value } = updateCustoMensalSchema.validate(req.body)
    
    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: validationError.details[0].message
      })
    }

    // Verificar se o custo mensal existe
    const { data: existingCusto, error: existingError } = await supabaseAdmin
      .from('custos_mensais')
      .select('id, obra_id, item, mes')
      .eq('id', id)
      .single()

    if (existingError || !existingCusto) {
      return res.status(404).json({
        error: 'Custo mensal não encontrado',
        message: 'O custo mensal com o ID especificado não existe'
      })
    }

    // Se está alterando o item, verificar se não conflita com outro registro
    if (value.item && value.item !== existingCusto.item) {
      const { data: conflictingItem, error: conflictError } = await supabaseAdmin
        .from('custos_mensais')
        .select('id')
        .eq('obra_id', existingCusto.obra_id)
        .eq('item', value.item)
        .eq('mes', existingCusto.mes)
        .neq('id', id)
        .single()

      if (conflictingItem) {
        return res.status(409).json({
          error: 'Item já existe',
          message: `Já existe um item ${value.item} para esta obra no mês ${existingCusto.mes}`
        })
      }
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('custos_mensais')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        obras (
          id,
          nome,
          status
        )
      `)
      .single()

    if (updateError) {
      console.error('Erro ao atualizar custo mensal:', updateError)
      return res.status(500).json({
        error: 'Erro ao atualizar custo mensal',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Custo mensal atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar custo mensal:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos-mensais/{id}:
 *   delete:
 *     summary: Excluir custo mensal
 *     tags: [Custos Mensais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do custo mensal
 *     responses:
 *       200:
 *         description: Custo mensal excluído com sucesso
 *       404:
 *         description: Custo mensal não encontrado
 */
router.delete('/:id', authenticateToken, requirePermission('excluir_obras'), async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se o custo mensal existe
    const { data: existingCusto, error: existingError } = await supabaseAdmin
      .from('custos_mensais')
      .select('id')
      .eq('id', id)
      .single()

    if (existingError || !existingCusto) {
      return res.status(404).json({
        error: 'Custo mensal não encontrado',
        message: 'O custo mensal com o ID especificado não existe'
      })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('custos_mensais')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao excluir custo mensal:', deleteError)
      return res.status(500).json({
        error: 'Erro ao excluir custo mensal',
        message: deleteError.message
      })
    }

    res.json({
      success: true,
      message: 'Custo mensal excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir custo mensal:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos-mensais/obra/{obra_id}:
 *   get:
 *     summary: Listar custos mensais por obra
 *     tags: [Custos Mensais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: obra_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *       - in: query
 *         name: mes
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *         description: Filtrar por mês específico
 *     responses:
 *       200:
 *         description: Lista de custos mensais da obra
 */
router.get('/obra/:obra_id', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
  try {
    const { obra_id } = req.params
    const { mes } = req.query

    let query = supabaseAdmin
      .from('custos_mensais')
      .select(`
        *,
        obras (
          id,
          nome,
          status
        )
      `)
      .eq('obra_id', obra_id)

    if (mes) {
      query = query.eq('mes', mes)
    }

    query = query.order('mes', { ascending: false }).order('item', { ascending: true })

    const { data, error } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar custos mensais da obra',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao buscar custos mensais da obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos-mensais/replicar:
 *   post:
 *     summary: Replicar custos de um mês para outro
 *     tags: [Custos Mensais]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - obra_id
 *               - mes_origem
 *               - mes_destino
 *             properties:
 *               obra_id:
 *                 type: integer
 *               mes_origem:
 *                 type: string
 *                 pattern: '^\d{4}-\d{2}$'
 *               mes_destino:
 *                 type: string
 *                 pattern: '^\d{4}-\d{2}$'
 *     responses:
 *       200:
 *         description: Custos replicados com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/replicar', authenticateToken, requirePermission('criar_obras'), async (req, res) => {
  try {
    const { obra_id, mes_origem, mes_destino } = req.body

    if (!obra_id || !mes_origem || !mes_destino) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'obra_id, mes_origem e mes_destino são obrigatórios'
      })
    }

    // Verificar se a obra existe
    const { data: obra, error: obraError } = await supabaseAdmin
      .from('obras')
      .select('id, nome')
      .eq('id', obra_id)
      .single()

    if (obraError || !obra) {
      return res.status(404).json({
        error: 'Obra não encontrada',
        message: 'A obra especificada não existe'
      })
    }

    // Verificar se existem custos no mês origem
    const { data: custosOrigem, error: origemError } = await supabaseAdmin
      .from('custos_mensais')
      .select('*')
      .eq('obra_id', obra_id)
      .eq('mes', mes_origem)

    if (origemError) {
      return res.status(500).json({
        error: 'Erro ao buscar custos do mês origem',
        message: origemError.message
      })
    }

    if (!custosOrigem || custosOrigem.length === 0) {
      return res.status(404).json({
        error: 'Nenhum custo encontrado',
        message: `Não há custos para replicar no mês ${mes_origem}`
      })
    }

    // Verificar se já existem custos no mês destino
    const { data: custosDestino, error: destinoError } = await supabaseAdmin
      .from('custos_mensais')
      .select('id')
      .eq('obra_id', obra_id)
      .eq('mes', mes_destino)
      .limit(1)

    if (destinoError) {
      return res.status(500).json({
        error: 'Erro ao verificar custos do mês destino',
        message: destinoError.message
      })
    }

    if (custosDestino && custosDestino.length > 0) {
      return res.status(409).json({
        error: 'Mês destino já possui custos',
        message: `O mês ${mes_destino} já possui custos registrados`
      })
    }

    // Preparar dados para replicação
    const custosParaReplicar = custosOrigem.map(custo => ({
      obra_id: custo.obra_id,
      item: custo.item,
      descricao: custo.descricao,
      unidade: custo.unidade,
      quantidade_orcamento: custo.quantidade_orcamento,
      valor_unitario: custo.valor_unitario,
      mes: mes_destino,
      quantidade_realizada: 0,
      quantidade_acumulada: custo.quantidade_acumulada,
      valor_acumulado: custo.valor_acumulado,
      tipo: custo.tipo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data, error: insertError } = await supabaseAdmin
      .from('custos_mensais')
      .insert(custosParaReplicar)
      .select()

    if (insertError) {
      console.error('Erro ao replicar custos:', insertError)
      return res.status(500).json({
        error: 'Erro ao replicar custos',
        message: insertError.message
      })
    }

    res.json({
      success: true,
      data: {
        replicados: data.length,
        mes_origem,
        mes_destino,
        obra: obra.nome
      },
      message: `${data.length} custos replicados com sucesso de ${mes_origem} para ${mes_destino}`
    })
  } catch (error) {
    console.error('Erro ao replicar custos:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos-mensais/meses-disponiveis/{obra_id}:
 *   get:
 *     summary: Obter meses disponíveis para uma obra
 *     tags: [Custos Mensais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: obra_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *     responses:
 *       200:
 *         description: Lista de meses disponíveis
 */
router.get('/meses-disponiveis/:obra_id', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
  try {
    const { obra_id } = req.params

    const { data, error } = await supabaseAdmin
      .from('custos_mensais')
      .select('mes')
      .eq('obra_id', obra_id)
      .order('mes', { ascending: true })

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar meses disponíveis',
        message: error.message
      })
    }

    const meses = [...new Set(data.map(item => item.mes))]

    res.json({
      success: true,
      data: meses
    })
  } catch (error) {
    console.error('Erro ao buscar meses disponíveis:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos-mensais/proximos-meses/{obra_id}:
 *   post:
 *     summary: Gerar próximos meses disponíveis
 *     tags: [Custos Mensais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: obra_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *     responses:
 *       200:
 *         description: Lista de próximos meses disponíveis
 */
router.post('/proximos-meses/:obra_id', authenticateToken, requirePermission('visualizar_obras'), async (req, res) => {
  try {
    const { obra_id } = req.params

    // Buscar meses existentes
    const { data: mesesExistentes, error } = await supabaseAdmin
      .from('custos_mensais')
      .select('mes')
      .eq('obra_id', obra_id)
      .order('mes', { ascending: true })

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar meses existentes',
        message: error.message
      })
    }

    const mesesExistentesSet = new Set(mesesExistentes.map(item => item.mes))
    const proximosMeses = []

    // Gerar próximos 12 meses a partir do mês atual
    const hoje = new Date()
    for (let i = 0; i < 12; i++) {
      const mes = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
      const mesStr = mes.toISOString().slice(0, 7)
      
      if (!mesesExistentesSet.has(mesStr)) {
        proximosMeses.push(mesStr)
      }
    }

    res.json({
      success: true,
      data: proximosMeses
    })
  } catch (error) {
    console.error('Erro ao gerar próximos meses:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/custos-mensais/{id}/quantidade:
 *   patch:
 *     summary: Atualizar quantidade realizada de um custo
 *     tags: [Custos Mensais]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do custo mensal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantidade_realizada
 *             properties:
 *               quantidade_realizada:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Quantidade atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Custo mensal não encontrado
 */
router.patch('/:id/quantidade', authenticateToken, requirePermission('editar_obras'), async (req, res) => {
  try {
    const { id } = req.params
    const { quantidade_realizada } = req.body

    if (typeof quantidade_realizada !== 'number' || quantidade_realizada < 0) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'quantidade_realizada deve ser um número maior ou igual a 0'
      })
    }

    // Verificar se o custo mensal existe
    const { data: existingCusto, error: existingError } = await supabaseAdmin
      .from('custos_mensais')
      .select('id, valor_unitario')
      .eq('id', id)
      .single()

    if (existingError || !existingCusto) {
      return res.status(404).json({
        error: 'Custo mensal não encontrado',
        message: 'O custo mensal com o ID especificado não existe'
      })
    }

    // Calcular valor realizado
    const valor_realizado = quantidade_realizada * existingCusto.valor_unitario

    const { data, error: updateError } = await supabaseAdmin
      .from('custos_mensais')
      .update({
        quantidade_realizada,
        valor_realizado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        obras (
          id,
          nome,
          status
        )
      `)
      .single()

    if (updateError) {
      console.error('Erro ao atualizar quantidade:', updateError)
      return res.status(500).json({
        error: 'Erro ao atualizar quantidade',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Quantidade atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar quantidade:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
