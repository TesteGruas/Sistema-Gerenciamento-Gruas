import express from 'express'
import Joi from 'joi'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// Schema de validação para configurações (criação)
const configuracaoSchema = Joi.object({
  grua_id: Joi.string().required(),
  nome: Joi.string().min(2).max(100).required(),
  descricao: Joi.string().allow(null, ''),
  altura_maxima: Joi.number().min(0).allow(null),
  alcance_maximo: Joi.number().min(0).allow(null),
  capacidade_maxima: Joi.number().min(0).allow(null),
  capacidade_ponta: Joi.number().min(0).allow(null),
  velocidade_operacao: Joi.number().min(0).allow(null),
  velocidade_rotacao: Joi.number().min(0).allow(null),
  potencia_motor: Joi.number().min(0).allow(null),
  consumo_energia: Joi.number().min(0).allow(null),
  peso_total: Joi.number().min(0).allow(null),
  dimensoes: Joi.string().max(100).allow(null, ''),
  tipo_operacao: Joi.string().valid('Manual', 'Semi-automática', 'Automática').allow(null, ''),
  nivel_automatizacao: Joi.string().valid('Básico', 'Intermediário', 'Avançado', 'Total').allow(null, ''),
  certificacoes: Joi.array().items(Joi.string()).allow(null),
  normas_tecnicas: Joi.array().items(Joi.string()).allow(null),
  valor_configuracao: Joi.number().min(0).default(0),
  custo_operacao_mensal: Joi.number().min(0).default(0),
  eficiencia_energetica: Joi.string().valid('A', 'B', 'C', 'D', 'E').allow(null, ''),
  status: Joi.string().valid('Ativa', 'Inativa', 'Em desenvolvimento').default('Ativa'),
  observacoes: Joi.string().allow(null, ''),
  anexos: Joi.object().allow(null)
})

// Schema de validação para atualização de configurações (sem grua_id obrigatório)
const configuracaoUpdateSchema = Joi.object({
  grua_id: Joi.string(),
  nome: Joi.string().min(2).max(100),
  descricao: Joi.string().allow(null, ''),
  altura_maxima: Joi.number().min(0).allow(null),
  alcance_maximo: Joi.number().min(0).allow(null),
  capacidade_maxima: Joi.number().min(0).allow(null),
  capacidade_ponta: Joi.number().min(0).allow(null),
  velocidade_operacao: Joi.number().min(0).allow(null),
  velocidade_rotacao: Joi.number().min(0).allow(null),
  potencia_motor: Joi.number().min(0).allow(null),
  consumo_energia: Joi.number().min(0).allow(null),
  peso_total: Joi.number().min(0).allow(null),
  dimensoes: Joi.string().max(100).allow(null, ''),
  tipo_operacao: Joi.string().valid('Manual', 'Semi-automática', 'Automática').allow(null, ''),
  nivel_automatizacao: Joi.string().valid('Básico', 'Intermediário', 'Avançado', 'Total').allow(null, ''),
  certificacoes: Joi.array().items(Joi.string()).allow(null),
  normas_tecnicas: Joi.array().items(Joi.string()).allow(null),
  valor_configuracao: Joi.number().min(0).default(0),
  custo_operacao_mensal: Joi.number().min(0).default(0),
  eficiencia_energetica: Joi.string().valid('A', 'B', 'C', 'D', 'E').allow(null, ''),
  status: Joi.string().valid('Ativa', 'Inativa', 'Em desenvolvimento').default('Ativa'),
  observacoes: Joi.string().allow(null, ''),
  anexos: Joi.object().allow(null)
})

// Schema para relacionamento componente-configuração
const componenteConfiguracaoSchema = Joi.object({
  configuracao_id: Joi.number().integer().required(),
  componente_id: Joi.number().integer().required(),
  quantidade_necessaria: Joi.number().integer().min(1).default(1),
  posicao_instalacao: Joi.string().max(100).allow(null, ''),
  ordem_instalacao: Joi.number().integer().min(1).allow(null),
  observacoes_instalacao: Joi.string().allow(null, '')
})

/**
 * @swagger
 * /api/grua-configuracoes:
 *   get:
 *     summary: Listar configurações de gruas
 *     tags: [Grua Configurações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grua_id
 *         schema:
 *           type: string
 *         description: ID da grua para filtrar configurações
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativa, Inativa, Em desenvolvimento]
 *         description: Status da configuração
 *       - in: query
 *         name: tipo_operacao
 *         schema:
 *           type: string
 *           enum: [Manual, Semi-automática, Automática]
 *         description: Tipo de operação
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
 *         description: Lista de configurações
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
 *                     $ref: '#/components/schemas/Configuracao'
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
    const { grua_id, status, tipo_operacao } = req.query

    // Construir query
    let query = supabaseAdmin
      .from('grua_configuracoes')
      .select(`
        *,
        grua:gruas(id, name, modelo, fabricante),
        created_by_user:usuarios!grua_configuracoes_created_by_fkey(id, nome),
        updated_by_user:usuarios!grua_configuracoes_updated_by_fkey(id, nome),
        componentes:componente_configuracao(
          id,
          quantidade_necessaria,
          posicao_instalacao,
          ordem_instalacao,
          observacoes_instalacao,
          componente:grua_componentes(
            id,
            nome,
            tipo,
            modelo,
            fabricante,
            status
          )
        )
      `, { count: 'exact' })

    // Aplicar filtros
    if (grua_id) {
      query = query.eq('grua_id', grua_id)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (tipo_operacao) {
      query = query.eq('tipo_operacao', tipo_operacao)
    }

    // Aplicar paginação e ordenação
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar configurações',
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
    console.error('Erro ao listar configurações:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-configuracoes/{id}:
 *   get:
 *     summary: Obter configuração por ID
 *     tags: [Grua Configurações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da configuração
 *     responses:
 *       200:
 *         description: Dados da configuração
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Configuracao'
 *       404:
 *         description: Configuração não encontrada
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data: configuracao, error } = await supabase
      .from('grua_configuracoes')
      .select(`
        *,
        grua:gruas(id, name, modelo, fabricante),
        created_by_user:usuarios!grua_configuracoes_created_by_fkey(id, nome),
        updated_by_user:usuarios!grua_configuracoes_updated_by_fkey(id, nome),
        componentes:componente_configuracao(
          id,
          quantidade_necessaria,
          posicao_instalacao,
          ordem_instalacao,
          observacoes_instalacao,
          componente:grua_componentes(
            id,
            nome,
            tipo,
            modelo,
            fabricante,
            status,
            quantidade_disponivel,
            valor_unitario
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Configuração não encontrada',
          message: 'A configuração com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar configuração',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: configuracao
    })
  } catch (error) {
    console.error('Erro ao buscar configuração:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-configuracoes:
 *   post:
 *     summary: Criar nova configuração
 *     tags: [Grua Configurações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfiguracaoInput'
 *     responses:
 *       201:
 *         description: Configuração criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = configuracaoSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se a grua existe
    const { data: grua, error: gruaError } = await supabaseAdmin
      .from('gruas')
      .select('id, name')
      .eq('id', value.grua_id)
      .maybeSingle()

    if (gruaError) {
      console.error('Erro ao buscar grua:', gruaError)
      return res.status(500).json({
        error: 'Erro ao verificar grua',
        message: gruaError.message
      })
    }

    if (!grua) {
      return res.status(400).json({
        error: 'Grua não encontrada',
        message: `A grua com ID '${value.grua_id}' não existe no sistema`
      })
    }

    // Preparar dados para inserção
    const configuracaoData = {
      ...value,
      data_criacao: new Date().toISOString().split('T')[0],
      data_ultima_atualizacao: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('grua_configuracoes')
      .insert(configuracaoData)
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao criar configuração',
        message: insertError.message
      })
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Configuração criada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar configuração:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-configuracoes/{id}:
 *   put:
 *     summary: Atualizar configuração
 *     tags: [Grua Configurações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da configuração
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfiguracaoInput'
 *     responses:
 *       200:
 *         description: Configuração atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Configuração não encontrada
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validar dados
    const { error, value } = configuracaoUpdateSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se a configuração existe
    const { data: configuracaoExistente, error: checkError } = await supabaseAdmin
      .from('grua_configuracoes')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (checkError || !configuracaoExistente) {
      return res.status(404).json({
        error: 'Configuração não encontrada',
        message: 'A configuração com o ID especificado não existe'
      })
    }

    // Preparar dados para atualização
    const updateData = {
      ...value,
      data_ultima_atualizacao: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('grua_configuracoes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return res.status(500).json({
        error: 'Erro ao atualizar configuração',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Configuração atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-configuracoes/{id}:
 *   delete:
 *     summary: Excluir configuração
 *     tags: [Grua Configurações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da configuração
 *     responses:
 *       200:
 *         description: Configuração excluída com sucesso
 *       404:
 *         description: Configuração não encontrada
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se a configuração existe
    const { data: configuracao, error: checkError } = await supabaseAdmin
      .from('grua_configuracoes')
      .select('id, nome')
      .eq('id', id)
      .maybeSingle()

    if (checkError) {
      console.error('Erro ao buscar configuração:', checkError)
      return res.status(500).json({
        error: 'Erro ao verificar configuração',
        message: checkError.message
      })
    }

    if (!configuracao) {
      return res.status(404).json({
        error: 'Configuração não encontrada',
        message: 'A configuração com o ID especificado não existe'
      })
    }

    const { error } = await supabaseAdmin
      .from('grua_configuracoes')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao excluir configuração',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Configuração excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir configuração:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-configuracoes/{id}/componentes:
 *   post:
 *     summary: Adicionar componente à configuração
 *     tags: [Grua Configurações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da configuração
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComponenteConfiguracaoInput'
 *     responses:
 *       201:
 *         description: Componente adicionado à configuração com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/:id/componentes', async (req, res) => {
  try {
    const { id } = req.params

    // Validar dados
    const { error, value } = componenteConfiguracaoSchema.validate({
      ...req.body,
      configuracao_id: parseInt(id)
    })
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se a configuração existe
    const { data: configuracao, error: configError } = await supabaseAdmin
      .from('grua_configuracoes')
      .select('id, nome, grua_id')
      .eq('id', id)
      .maybeSingle()

    if (configError) {
      console.error('Erro ao buscar configuração:', configError)
      return res.status(500).json({
        error: 'Erro ao verificar configuração',
        message: configError.message
      })
    }

    if (!configuracao) {
      return res.status(404).json({
        error: 'Configuração não encontrada',
        message: 'A configuração especificada não existe'
      })
    }

    // Verificar se o componente existe
    const { data: componente, error: compError } = await supabaseAdmin
      .from('grua_componentes')
      .select('id, nome, grua_id')
      .eq('id', value.componente_id)
      .maybeSingle()

    if (compError) {
      console.error('Erro ao buscar componente:', compError)
      return res.status(500).json({
        error: 'Erro ao verificar componente',
        message: compError.message
      })
    }

    if (!componente) {
      return res.status(404).json({
        error: 'Componente não encontrado',
        message: 'O componente especificado não existe'
      })
    }

    // Verificar se o componente pertence à mesma grua da configuração
    if (componente.grua_id !== configuracao.grua_id) {
      return res.status(400).json({
        error: 'Componente incompatível',
        message: 'O componente deve pertencer à mesma grua da configuração'
      })
    }

    // Preparar dados para inserção
    const relacionamentoData = {
      ...value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('componente_configuracao')
      .insert(relacionamentoData)
      .select(`
        *,
        componente:grua_componentes(
          id,
          nome,
          tipo,
          modelo,
          fabricante,
          status
        )
      `)
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao adicionar componente à configuração',
        message: insertError.message
      })
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Componente adicionado à configuração com sucesso'
    })
  } catch (error) {
    console.error('Erro ao adicionar componente à configuração:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-configuracoes/{id}/componentes/{componenteId}:
 *   delete:
 *     summary: Remover componente da configuração
 *     tags: [Grua Configurações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da configuração
 *       - in: path
 *         name: componenteId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do componente
 *     responses:
 *       200:
 *         description: Componente removido da configuração com sucesso
 *       404:
 *         description: Relacionamento não encontrado
 */
router.delete('/:id/componentes/:componenteId', async (req, res) => {
  try {
    const { id, componenteId } = req.params

    // Verificar se o relacionamento existe
    const { data: relacionamento, error: checkError } = await supabaseAdmin
      .from('componente_configuracao')
      .select('id')
      .eq('configuracao_id', id)
      .eq('componente_id', componenteId)
      .maybeSingle()

    if (checkError) {
      console.error('Erro ao buscar relacionamento:', checkError)
      return res.status(500).json({
        error: 'Erro ao verificar relacionamento',
        message: checkError.message
      })
    }

    if (!relacionamento) {
      return res.status(404).json({
        error: 'Relacionamento não encontrado',
        message: 'O componente não está associado a esta configuração'
      })
    }

    const { error } = await supabaseAdmin
      .from('componente_configuracao')
      .delete()
      .eq('configuracao_id', id)
      .eq('componente_id', componenteId)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao remover componente da configuração',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Componente removido da configuração com sucesso'
    })
  } catch (error) {
    console.error('Erro ao remover componente da configuração:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/grua-configuracoes/{id}/calcular-valor:
 *   post:
 *     summary: Calcular valor total da configuração
 *     tags: [Grua Configurações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da configuração
 *     responses:
 *       200:
 *         description: Valor calculado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     valor_total_componentes:
 *                       type: number
 *                     valor_configuracao:
 *                       type: number
 *                     valor_total:
 *                       type: number
 *                     detalhes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           componente_id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                           quantidade:
 *                             type: integer
 *                           valor_unitario:
 *                             type: number
 *                           valor_total:
 *                             type: number
 */
router.post('/:id/calcular-valor', async (req, res) => {
  try {
    const { id } = req.params

    // Buscar configuração com componentes
    const { data: configuracao, error } = await supabase
      .from('grua_configuracoes')
      .select(`
        id,
        nome,
        valor_configuracao,
        componente_configuracao(
          quantidade_necessaria,
          componente:grua_componentes(
            id,
            nome,
            valor_unitario
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !configuracao) {
      return res.status(404).json({
        error: 'Configuração não encontrada',
        message: 'A configuração especificada não existe'
      })
    }

    // Calcular valor total dos componentes
    let valorTotalComponentes = 0
    const detalhes = []

    configuracao.componente_configuracao.forEach(rel => {
      const valorTotal = rel.quantidade_necessaria * (rel.componente.valor_unitario || 0)
      valorTotalComponentes += valorTotal

      detalhes.push({
        componente_id: rel.componente.id,
        nome: rel.componente.nome,
        quantidade: rel.quantidade_necessaria,
        valor_unitario: rel.componente.valor_unitario || 0,
        valor_total: valorTotal
      })
    })

    const valorTotal = valorTotalComponentes + (configuracao.valor_configuracao || 0)

    res.json({
      success: true,
      data: {
        valor_total_componentes: valorTotalComponentes,
        valor_configuracao: configuracao.valor_configuracao || 0,
        valor_total: valorTotal,
        detalhes
      }
    })
  } catch (error) {
    console.error('Erro ao calcular valor da configuração:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
