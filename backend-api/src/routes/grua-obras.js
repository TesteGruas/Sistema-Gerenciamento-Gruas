import express from 'express'
import Joi from 'joi'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// Schema de validação para relacionamento grua-obra
const gruaObraSchema = Joi.object({
  grua_id: Joi.string().required(),
  obra_id: Joi.number().integer().required(),
  data_inicio_locacao: Joi.date().required(),
  data_fim_locacao: Joi.date().allow(null),
  valor_locacao_mensal: Joi.number().min(0).allow(null),
  status: Joi.string().valid('Ativa', 'Concluída', 'Suspensa').default('Ativa'),
  observacoes: Joi.string().allow(null, '')
})

// Schema para transferência de grua entre obras
const transferenciaSchema = Joi.object({
  grua_id: Joi.string().required(),
  obra_origem_id: Joi.number().integer().required(),
  obra_destino_id: Joi.number().integer().required(),
  data_transferencia: Joi.date().default(() => new Date().toISOString().split('T')[0]),
  motivo: Joi.string().min(5).max(200).required(),
  funcionario_responsavel_id: Joi.number().integer().allow(null),
  observacoes: Joi.string().allow(null, '')
})

/**
 * @swagger
 * /api/grua-obras:
 *   get:
 *     summary: Listar relacionamentos grua-obra
 *     tags: [Grua Obras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grua_id
 *         schema:
 *           type: string
 *         description: ID da grua para filtrar
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: ID da obra para filtrar
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativa, Concluída, Suspensa]
 *         description: Status do relacionamento
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
 *     responses:
 *       200:
 *         description: Lista de relacionamentos grua-obra
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GruaObra'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { grua_id, obra_id, status } = req.query

    // Construir query
    let query = supabaseAdmin
      .from('grua_obra')
      .select(`
        *,
        grua:gruas(id, name, modelo, fabricante, status),
        obra:obras(id, nome, cliente_id, status, cliente:clientes(id, nome, cnpj))
      `, { count: 'exact' })

    // Aplicar filtros
    if (grua_id) {
      query = query.eq('grua_id', grua_id)
    }
    if (obra_id) {
      query = query.eq('obra_id', obra_id)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Aplicar paginação e ordenação
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar relacionamentos grua-obra',
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
    console.error('Erro ao listar relacionamentos grua-obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-obras/obras/{obraId}/gruas:
 *   get:
 *     summary: Listar todas as gruas de uma obra
 *     tags: [Grua Obras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: obraId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da obra
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativa, Concluída, Suspensa]
 *         description: Status do relacionamento
 *     responses:
 *       200:
 *         description: Lista de gruas da obra
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GruaObra'
 *                 obra:
 *                   $ref: '#/components/schemas/Obra'
 *                 resumo:
 *                   type: object
 *                   properties:
 *                     total_gruas:
 *                       type: integer
 *                     gruas_ativas:
 *                       type: integer
 *                     valor_total_mensal:
 *                       type: number
 */
router.get('/obras/:obraId/gruas', async (req, res) => {
  try {
    const { obraId } = req.params
    const { status } = req.query

    // Buscar dados da obra
    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select(`
        *,
        cliente:clientes(id, nome, cnpj, email, telefone)
      `)
      .eq('id', obraId)
      .single()

    if (obraError || !obra) {
      return res.status(404).json({
        error: 'Obra não encontrada',
        message: 'A obra especificada não existe'
      })
    }

    // Construir query para gruas da obra
    let query = supabaseAdmin
      .from('grua_obra')
      .select(`
        *,
        grua:gruas(id, name, modelo, fabricante, status, tipo, capacidade)
      `)

    query = query.eq('obra_id', obraId)

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('data_inicio_locacao', { ascending: false })

    const { data: gruasObra, error } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar gruas da obra',
        message: error.message
      })
    }

    // Calcular resumo
    const totalGruas = gruasObra.length
    const gruasAtivas = gruasObra.filter(g => g.status === 'Ativa').length
    const valorTotalMensal = gruasObra
      .filter(g => g.status === 'Ativa' && g.valor_locacao_mensal)
      .reduce((total, g) => total + parseFloat(g.valor_locacao_mensal || 0), 0)

    res.json({
      success: true,
      data: gruasObra || [],
      obra,
      resumo: {
        total_gruas: totalGruas,
        gruas_ativas: gruasAtivas,
        valor_total_mensal: valorTotalMensal
      }
    })
  } catch (error) {
    console.error('Erro ao buscar gruas da obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-obras:
 *   post:
 *     summary: Adicionar grua à obra
 *     tags: [Grua Obras]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GruaObraInput'
 *     responses:
 *       201:
 *         description: Grua adicionada à obra com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = gruaObraSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se a grua existe e está disponível
    const { data: grua, error: gruaError } = await supabase
      .from('gruas')
      .select('id, name, status')
      .eq('id', value.grua_id)
      .single()

    if (gruaError || !grua) {
      return res.status(400).json({
        error: 'Grua não encontrada',
        message: 'A grua especificada não existe'
      })
    }

    if (grua.status !== 'disponivel') {
      return res.status(400).json({
        error: 'Grua não disponível',
        message: `A grua "${grua.name}" não está disponível (status: ${grua.status})`
      })
    }

    // Verificar se a obra existe
    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select('id, nome, status')
      .eq('id', value.obra_id)
      .single()

    if (obraError || !obra) {
      return res.status(400).json({
        error: 'Obra não encontrada',
        message: 'A obra especificada não existe'
      })
    }

    // Verificar se a grua já está em alguma obra ativa
    const { data: gruaAtiva, error: ativaError } = await supabase
      .from('grua_obra')
      .select('id, obra_id, status')
      .eq('grua_id', value.grua_id)
      .eq('status', 'Ativa')
      .single()

    if (ativaError && ativaError.code !== 'PGRST116') {
      return res.status(500).json({
        error: 'Erro ao verificar grua ativa',
        message: ativaError.message
      })
    }

    if (gruaAtiva) {
      return res.status(400).json({
        error: 'Grua já está em obra',
        message: `A grua "${grua.name}" já está ativa na obra ID ${gruaAtiva.obra_id}`
      })
    }

    // Preparar dados para inserção
    const relacionamentoData = {
      ...value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Iniciar transação
    const { data: relacionamento, error: insertError } = await supabaseAdmin
      .from('grua_obra')
      .insert(relacionamentoData)
      .select(`
        *,
        grua:gruas(id, name, modelo, fabricante),
        obra:obras(id, nome, cliente_id, cliente:clientes(id, nome))
      `)
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao adicionar grua à obra',
        message: insertError.message
      })
    }

    // Atualizar status da grua para 'em_obra'
    const { error: updateGruaError } = await supabaseAdmin
      .from('gruas')
      .update({
        status: 'em_obra',
        current_obra_id: value.obra_id,
        current_obra_name: obra.nome,
        updated_at: new Date().toISOString()
      })
      .eq('id', value.grua_id)

    if (updateGruaError) {
      console.error('Erro ao atualizar status da grua:', updateGruaError)
      // Não falhar a operação, apenas logar o erro
    }

    res.status(201).json({
      success: true,
      data: relacionamento,
      message: 'Grua adicionada à obra com sucesso'
    })
  } catch (error) {
    console.error('Erro ao adicionar grua à obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-obras/{id}:
 *   put:
 *     summary: Atualizar relacionamento grua-obra
 *     tags: [Grua Obras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do relacionamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GruaObraInput'
 *     responses:
 *       200:
 *         description: Relacionamento atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Relacionamento não encontrado
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validar dados
    const { error, value } = gruaObraSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se o relacionamento existe
    const { data: relacionamentoExistente, error: checkError } = await supabase
      .from('grua_obra')
      .select('id, grua_id, obra_id, status')
      .eq('id', id)
      .single()

    if (checkError || !relacionamentoExistente) {
      return res.status(404).json({
        error: 'Relacionamento não encontrado',
        message: 'O relacionamento especificado não existe'
      })
    }

    // Preparar dados para atualização
    const updateData = {
      ...value,
      updated_at: new Date().toISOString()
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('grua_obra')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        grua:gruas(id, name, modelo, fabricante),
        obra:obras(id, nome, cliente_id, cliente:clientes(id, nome))
      `)
      .single()

    if (updateError) {
      return res.status(500).json({
        error: 'Erro ao atualizar relacionamento',
        message: updateError.message
      })
    }

    // Atualizar status da grua se necessário
    let novoStatusGrua = 'em_obra'
    if (value.status === 'Concluída') {
      novoStatusGrua = 'disponivel'
    }

    const { error: updateGruaError } = await supabaseAdmin
      .from('gruas')
      .update({
        status: novoStatusGrua,
        current_obra_id: value.status === 'Concluída' ? null : value.obra_id,
        current_obra_name: value.status === 'Concluída' ? null : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', value.grua_id)

    if (updateGruaError) {
      console.error('Erro ao atualizar status da grua:', updateGruaError)
    }

    res.json({
      success: true,
      data,
      message: 'Relacionamento atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar relacionamento:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-obras/{id}:
 *   delete:
 *     summary: Remover grua da obra
 *     tags: [Grua Obras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do relacionamento
 *     responses:
 *       200:
 *         description: Grua removida da obra com sucesso
 *       404:
 *         description: Relacionamento não encontrado
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Buscar relacionamento para obter dados da grua
    const { data: relacionamento, error: checkError } = await supabase
      .from('grua_obra')
      .select('id, grua_id, obra_id, status')
      .eq('id', id)
      .single()

    if (checkError || !relacionamento) {
      return res.status(404).json({
        error: 'Relacionamento não encontrado',
        message: 'O relacionamento especificado não existe'
      })
    }

    // Verificar se a grua está em uso (status Ativa)
    if (relacionamento.status === 'Ativa') {
      return res.status(400).json({
        error: 'Não é possível remover',
        message: 'Não é possível remover uma grua que está ativa na obra. Finalize o relacionamento primeiro.'
      })
    }

    const { error } = await supabaseAdmin
      .from('grua_obra')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao remover grua da obra',
        message: error.message
      })
    }

    // Atualizar status da grua para disponível
    const { error: updateGruaError } = await supabaseAdmin
      .from('gruas')
      .update({
        status: 'disponivel',
        current_obra_id: null,
        current_obra_name: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', relacionamento.grua_id)

    if (updateGruaError) {
      console.error('Erro ao atualizar status da grua:', updateGruaError)
    }

    res.json({
      success: true,
      message: 'Grua removida da obra com sucesso'
    })
  } catch (error) {
    console.error('Erro ao remover grua da obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-obras/transferir:
 *   post:
 *     summary: Transferir grua entre obras
 *     tags: [Grua Obras]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferenciaInput'
 *     responses:
 *       200:
 *         description: Grua transferida com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/transferir', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = transferenciaSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se a grua existe
    const { data: grua, error: gruaError } = await supabase
      .from('gruas')
      .select('id, name, status')
      .eq('id', value.grua_id)
      .single()

    if (gruaError || !grua) {
      return res.status(400).json({
        error: 'Grua não encontrada',
        message: 'A grua especificada não existe'
      })
    }

    // Verificar se a obra de origem existe e tem a grua
    const { data: obraOrigem, error: origemError } = await supabase
      .from('grua_obra')
      .select('id, status, obra:obras(id, nome)')
      .eq('grua_id', value.grua_id)
      .eq('obra_id', value.obra_origem_id)
      .eq('status', 'Ativa')
      .single()

    if (origemError || !obraOrigem) {
      return res.status(400).json({
        error: 'Grua não encontrada na obra de origem',
        message: 'A grua não está ativa na obra de origem especificada'
      })
    }

    // Verificar se a obra de destino existe
    const { data: obraDestino, error: destinoError } = await supabase
      .from('obras')
      .select('id, nome, status')
      .eq('id', value.obra_destino_id)
      .single()

    if (destinoError || !obraDestino) {
      return res.status(400).json({
        error: 'Obra de destino não encontrada',
        message: 'A obra de destino especificada não existe'
      })
    }

    // Finalizar relacionamento com obra de origem
    const { error: finalizarError } = await supabaseAdmin
      .from('grua_obra')
      .update({
        status: 'Concluída',
        data_fim_locacao: value.data_transferencia,
        updated_at: new Date().toISOString()
      })
      .eq('id', obraOrigem.id)

    if (finalizarError) {
      return res.status(500).json({
        error: 'Erro ao finalizar relacionamento com obra de origem',
        message: finalizarError.message
      })
    }

    // Criar novo relacionamento com obra de destino
    const { data: novoRelacionamento, error: criarError } = await supabaseAdmin
      .from('grua_obra')
      .insert({
        grua_id: value.grua_id,
        obra_id: value.obra_destino_id,
        data_inicio_locacao: value.data_transferencia,
        status: 'Ativa',
        observacoes: `Transferida da obra ${obraOrigem.obra.nome}. Motivo: ${value.motivo}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        grua:gruas(id, name, modelo, fabricante),
        obra:obras(id, nome, cliente_id, cliente:clientes(id, nome))
      `)
      .single()

    if (criarError) {
      return res.status(500).json({
        error: 'Erro ao criar relacionamento com obra de destino',
        message: criarError.message
      })
    }

    // Atualizar dados da grua
    const { error: updateGruaError } = await supabaseAdmin
      .from('gruas')
      .update({
        current_obra_id: value.obra_destino_id,
        current_obra_name: obraDestino.nome,
        updated_at: new Date().toISOString()
      })
      .eq('id', value.grua_id)

    if (updateGruaError) {
      console.error('Erro ao atualizar dados da grua:', updateGruaError)
    }

    // Registrar no histórico de locações
    const { error: historicoError } = await supabaseAdmin
      .from('historico_locacoes')
      .insert({
        grua_id: value.grua_id,
        obra_id: value.obra_destino_id,
        data_inicio: value.data_transferencia,
        funcionario_responsavel_id: value.funcionario_responsavel_id,
        tipo_operacao: 'Transferência',
        observacoes: `Transferida da obra ${obraOrigem.obra.nome} para ${obraDestino.nome}. Motivo: ${value.motivo}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (historicoError) {
      console.error('Erro ao registrar no histórico:', historicoError)
    }

    res.json({
      success: true,
      data: {
        transferencia: novoRelacionamento,
        obra_origem: obraOrigem.obra,
        obra_destino: obraDestino
      },
      message: 'Grua transferida com sucesso'
    })
  } catch (error) {
    console.error('Erro ao transferir grua:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
