/**
 * Rotas para gerenciamento de relacionamentos
 * Sistema de Gerenciamento de Gruas
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// Schemas de validação
const gruaObraSchema = Joi.object({
  grua_id: Joi.string().required(),
  obra_id: Joi.number().integer().positive().required(),
  data_inicio_locacao: Joi.date().required(),
  data_fim_locacao: Joi.date().allow(null).optional(),
  valor_locacao_mensal: Joi.number().min(0).allow(null).optional(),
  status: Joi.string().valid('Ativa', 'Concluída', 'Suspensa').default('Ativa'),
  observacoes: Joi.string().allow(null, '').optional()
})

const gruaFuncionarioSchema = Joi.object({
  grua_id: Joi.string().required(),
  funcionario_id: Joi.number().integer().positive().required(),
  obra_id: Joi.number().integer().positive().allow(null).optional(),
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().allow(null).optional(),
  status: Joi.string().valid('Ativo', 'Inativo').default('Ativo'),
  observacoes: Joi.string().allow(null, '').optional()
})

const gruaEquipamentoSchema = Joi.object({
  grua_id: Joi.string().required(),
  equipamento_id: Joi.number().integer().positive().required(),
  obra_id: Joi.number().integer().positive().allow(null).optional(),
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().allow(null).optional(),
  status: Joi.string().valid('Ativo', 'Inativo').default('Ativo'),
  observacoes: Joi.string().allow(null, '').optional()
})

// =====================================================
// ENDPOINTS PARA GRUA-OBRA
// =====================================================

/**
 * @swagger
 * /api/relacionamentos/grua-obra:
 *   get:
 *     summary: Listar relacionamentos grua-obra
 *     tags: [Relacionamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grua_id
 *         schema:
 *           type: string
 *         description: Filtrar por ID da grua
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID da obra
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativa, Concluída, Suspensa]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de relacionamentos grua-obra
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/grua-obra', async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('grua_obra')
      .select(`
        *,
        grua:gruas(id, modelo, fabricante, tipo, capacidade, altura_trabalho, capacidade_ponta, ano),
        obra:obras(id, nome, cliente_id, status)
      `)

    // Aplicar filtros
    if (req.query.grua_id) {
      query = query.eq('grua_id', req.query.grua_id)
    }
    if (req.query.obra_id) {
      query = query.eq('obra_id', req.query.obra_id)
    }
    if (req.query.status) {
      query = query.eq('status', req.query.status)
    }

    const { data, error } = await query.order('data_inicio_locacao', { ascending: false })

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar relacionamentos grua-obra',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
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
 * /api/relacionamentos/grua-obra:
 *   post:
 *     summary: Criar relacionamento grua-obra
 *     tags: [Relacionamentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grua_id
 *               - obra_id
 *               - data_inicio_locacao
 *             properties:
 *               grua_id:
 *                 type: string
 *               obra_id:
 *                 type: integer
 *               data_inicio_locacao:
 *                 type: string
 *                 format: date
 *               data_fim_locacao:
 *                 type: string
 *                 format: date
 *               valor_locacao_mensal:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Ativa, Concluída, Suspensa]
 *               observacoes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Relacionamento criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/grua-obra', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = gruaObraSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se grua existe
    const { data: grua } = await supabaseAdmin
      .from('gruas')
      .select('id')
      .eq('id', value.grua_id)
      .single()

    if (!grua) {
      return res.status(400).json({
        error: 'Grua não encontrada',
        message: 'A grua especificada não existe'
      })
    }

    // Verificar se obra existe
    const { data: obra } = await supabaseAdmin
      .from('obras')
      .select('id, nome')
      .eq('id', value.obra_id)
      .single()

    if (!obra) {
      return res.status(400).json({
        error: 'Obra não encontrada',
        message: 'A obra especificada não existe'
      })
    }

    // Verificar se já existe relacionamento ativo
    const { data: existingRelation } = await supabaseAdmin
      .from('grua_obra')
      .select('id')
      .eq('grua_id', value.grua_id)
      .eq('obra_id', value.obra_id)
      .eq('status', 'Ativa')
      .single()

    if (existingRelation) {
      return res.status(400).json({
        error: 'Relacionamento já existe',
        message: 'Já existe um relacionamento ativo entre esta grua e obra'
      })
    }

    // Criar relacionamento
    const { data, error: createError } = await supabaseAdmin
      .from('grua_obra')
      .insert([value])
      .select(`
        *,
        grua:gruas(id, modelo, fabricante, tipo),
        obra:obras(id, nome, cliente_id, status)
      `)
      .single()

    if (createError) {
      return res.status(500).json({
        error: 'Erro ao criar relacionamento',
        message: createError.message
      })
    }

    // Atualizar status da grua para 'em_obra' se o relacionamento estiver ativo
    if (value.status === 'Ativa') {
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
    }

    res.status(201).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao criar relacionamento grua-obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// ENDPOINTS PARA GRUA-FUNCIONÁRIO
// =====================================================

/**
 * @swagger
 * /api/relacionamentos/grua-funcionario:
 *   get:
 *     summary: Listar relacionamentos grua-funcionário
 *     tags: [Relacionamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grua_id
 *         schema:
 *           type: string
 *         description: Filtrar por ID da grua
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do funcionário
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID da obra
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativo, Inativo]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de relacionamentos grua-funcionário
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/grua-funcionario', async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('grua_funcionario')
      .select(`
        *,
        grua:gruas(id, modelo, fabricante, tipo),
        funcionario:funcionarios(id, nome, cargo, status),
        obra:obras(id, nome, status)
      `)

    // Aplicar filtros
    if (req.query.grua_id) {
      query = query.eq('grua_id', req.query.grua_id)
    }
    if (req.query.funcionario_id) {
      query = query.eq('funcionario_id', req.query.funcionario_id)
    }
    if (req.query.obra_id) {
      query = query.eq('obra_id', req.query.obra_id)
    }
    if (req.query.status) {
      query = query.eq('status', req.query.status)
    }

    const { data, error } = await query.order('data_inicio', { ascending: false })

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar relacionamentos grua-funcionário',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao listar relacionamentos grua-funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/relacionamentos/grua-funcionario:
 *   post:
 *     summary: Criar relacionamento grua-funcionário
 *     tags: [Relacionamentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grua_id
 *               - funcionario_id
 *               - data_inicio
 *             properties:
 *               grua_id:
 *                 type: string
 *               funcionario_id:
 *                 type: integer
 *               obra_id:
 *                 type: integer
 *               data_inicio:
 *                 type: string
 *                 format: date
 *               data_fim:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [Ativo, Inativo]
 *               observacoes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Relacionamento criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/grua-funcionario', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = gruaFuncionarioSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se grua existe
    const { data: grua } = await supabaseAdmin
      .from('gruas')
      .select('id')
      .eq('id', value.grua_id)
      .single()

    if (!grua) {
      return res.status(400).json({
        error: 'Grua não encontrada',
        message: 'A grua especificada não existe'
      })
    }

    // Verificar se funcionário existe
    const { data: funcionario } = await supabaseAdmin
      .from('funcionarios')
      .select('id')
      .eq('id', value.funcionario_id)
      .single()

    if (!funcionario) {
      return res.status(400).json({
        error: 'Funcionário não encontrado',
        message: 'O funcionário especificado não existe'
      })
    }

    // Verificar se obra existe (se fornecida)
    if (value.obra_id) {
      const { data: obra } = await supabaseAdmin
        .from('obras')
        .select('id')
        .eq('id', value.obra_id)
        .single()

      if (!obra) {
        return res.status(400).json({
          error: 'Obra não encontrada',
          message: 'A obra especificada não existe'
        })
      }
    }

    // Criar relacionamento
    const { data, error: createError } = await supabaseAdmin
      .from('grua_funcionario')
      .insert([value])
      .select(`
        *,
        grua:gruas(id, modelo, fabricante, tipo),
        funcionario:funcionarios(id, nome, cargo, status),
        obra:obras(id, nome, status)
      `)
      .single()

    if (createError) {
      return res.status(500).json({
        error: 'Erro ao criar relacionamento',
        message: createError.message
      })
    }

    res.status(201).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao criar relacionamento grua-funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// ENDPOINTS PARA GRUA-EQUIPAMENTO
// =====================================================

/**
 * @swagger
 * /api/relacionamentos/grua-equipamento:
 *   get:
 *     summary: Listar relacionamentos grua-equipamento
 *     tags: [Relacionamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grua_id
 *         schema:
 *           type: string
 *         description: Filtrar por ID da grua
 *       - in: query
 *         name: equipamento_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID do equipamento
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativo, Inativo]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de relacionamentos grua-equipamento
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/grua-equipamento', async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('grua_equipamento')
      .select(`
        *,
        grua:gruas(id, modelo, fabricante, tipo),
        equipamento:equipamentos_auxiliares(id, nome, tipo, status),
        obra:obras(id, nome, status)
      `)

    // Aplicar filtros
    if (req.query.grua_id) {
      query = query.eq('grua_id', req.query.grua_id)
    }
    if (req.query.equipamento_id) {
      query = query.eq('equipamento_id', req.query.equipamento_id)
    }
    if (req.query.status) {
      query = query.eq('status', req.query.status)
    }

    const { data, error } = await query.order('data_inicio', { ascending: false })

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar relacionamentos grua-equipamento',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao listar relacionamentos grua-equipamento:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/relacionamentos/grua-equipamento:
 *   post:
 *     summary: Criar relacionamento grua-equipamento
 *     tags: [Relacionamentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grua_id
 *               - equipamento_id
 *               - data_inicio
 *             properties:
 *               grua_id:
 *                 type: string
 *               equipamento_id:
 *                 type: integer
 *               obra_id:
 *                 type: integer
 *               data_inicio:
 *                 type: string
 *                 format: date
 *               data_fim:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [Ativo, Inativo]
 *               observacoes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Relacionamento criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/grua-equipamento', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = gruaEquipamentoSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se grua existe
    const { data: grua } = await supabaseAdmin
      .from('gruas')
      .select('id')
      .eq('id', value.grua_id)
      .single()

    if (!grua) {
      return res.status(400).json({
        error: 'Grua não encontrada',
        message: 'A grua especificada não existe'
      })
    }

    // Verificar se equipamento existe
    const { data: equipamento } = await supabaseAdmin
      .from('equipamentos_auxiliares')
      .select('id')
      .eq('id', value.equipamento_id)
      .single()

    if (!equipamento) {
      return res.status(400).json({
        error: 'Equipamento não encontrado',
        message: 'O equipamento especificado não existe'
      })
    }

    // Verificar se obra existe (se fornecida)
    if (value.obra_id) {
      const { data: obra } = await supabaseAdmin
        .from('obras')
        .select('id')
        .eq('id', value.obra_id)
        .single()

      if (!obra) {
        return res.status(400).json({
          error: 'Obra não encontrada',
          message: 'A obra especificada não existe'
        })
      }
    }

    // Criar relacionamento
    const { data, error: createError } = await supabaseAdmin
      .from('grua_equipamento')
      .insert([value])
      .select(`
        *,
        grua:gruas(id, modelo, fabricante, tipo),
        equipamento:equipamentos_auxiliares(id, nome, tipo, status),
        obra:obras(id, nome, status)
      `)
      .single()

    if (createError) {
      return res.status(500).json({
        error: 'Erro ao criar relacionamento',
        message: createError.message
      })
    }

    res.status(201).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao criar relacionamento grua-equipamento:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// ENDPOINTS PARA ATUALIZAR RELACIONAMENTOS
// =====================================================

/**
 * @swagger
 * /api/relacionamentos/grua-obra/{id}:
 *   put:
 *     summary: Atualizar relacionamento grua-obra
 *     tags: [Relacionamentos]
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
 *         description: Relacionamento atualizado com sucesso
 *       404:
 *         description: Relacionamento não encontrado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/grua-obra/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Buscar relacionamento atual para pegar grua_id
    const { data: relacionamentoAtual, error: erroBuscar } = await supabaseAdmin
      .from('grua_obra')
      .select('grua_id, obra_id')
      .eq('id', id)
      .single()

    if (erroBuscar || !relacionamentoAtual) {
      return res.status(404).json({
        error: 'Relacionamento não encontrado',
        message: 'O relacionamento especificado não existe'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('grua_obra')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        grua:gruas(id, modelo, fabricante, tipo),
        obra:obras(id, nome, cliente_id, status)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Relacionamento não encontrado',
          message: 'O relacionamento especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar relacionamento',
        message: error.message
      })
    }

    // Atualizar status da grua se o status do relacionamento foi alterado
    if (updateData.status !== undefined) {
      let novoStatusGrua = 'em_obra'
      let currentObraId = relacionamentoAtual.obra_id
      let currentObraName = null

      if (updateData.status === 'Concluída') {
        novoStatusGrua = 'disponivel'
        currentObraId = null
        currentObraName = null
      } else if (updateData.status === 'Ativa') {
        // Buscar nome da obra
        const { data: obraData } = await supabaseAdmin
          .from('obras')
          .select('nome')
          .eq('id', relacionamentoAtual.obra_id)
          .single()
        
        if (obraData) {
          currentObraName = obraData.nome
        }
      }

      const { error: updateGruaError } = await supabaseAdmin
        .from('gruas')
        .update({
          status: novoStatusGrua,
          current_obra_id: currentObraId,
          current_obra_name: currentObraName,
          updated_at: new Date().toISOString()
        })
        .eq('id', relacionamentoAtual.grua_id)

      if (updateGruaError) {
        console.error('Erro ao atualizar status da grua:', updateGruaError)
        // Não falhar a operação, apenas logar o erro
      }
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao atualizar relacionamento grua-obra:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/relacionamentos/grua-funcionario/{id}:
 *   put:
 *     summary: Atualizar relacionamento grua-funcionário
 *     tags: [Relacionamentos]
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
 *         description: Relacionamento atualizado com sucesso
 *       404:
 *         description: Relacionamento não encontrado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/grua-funcionario/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const { data, error } = await supabaseAdmin
      .from('grua_funcionario')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        grua:gruas(id, modelo, fabricante, tipo),
        funcionario:funcionarios(id, nome, cargo, status),
        obra:obras(id, nome, status)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Relacionamento não encontrado',
          message: 'O relacionamento especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar relacionamento',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao atualizar relacionamento grua-funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/relacionamentos/grua-equipamento/{id}:
 *   put:
 *     summary: Atualizar relacionamento grua-equipamento
 *     tags: [Relacionamentos]
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
 *         description: Relacionamento atualizado com sucesso
 *       404:
 *         description: Relacionamento não encontrado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/grua-equipamento/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const { data, error } = await supabaseAdmin
      .from('grua_equipamento')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        grua:gruas(id, modelo, fabricante, tipo),
        equipamento:equipamentos_auxiliares(id, nome, tipo, status),
        obra:obras(id, nome, status)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Relacionamento não encontrado',
          message: 'O relacionamento especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar relacionamento',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao atualizar relacionamento grua-equipamento:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * components:
 *   schemas:
 *     RelacionamentoGruaObra:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do relacionamento
 *         grua_id:
 *           type: string
 *           description: ID da grua
 *         obra_id:
 *           type: integer
 *           description: ID da obra
 *         data_inicio_locacao:
 *           type: string
 *           format: date
 *           description: Data de início da locação
 *         data_fim_locacao:
 *           type: string
 *           format: date
 *           description: Data de fim da locação
 *         valor_locacao_mensal:
 *           type: number
 *           description: Valor da locação mensal
 *         status:
 *           type: string
 *           enum: [Ativa, Concluída, Suspensa]
 *           description: Status do relacionamento
 *         observacoes:
 *           type: string
 *           description: Observações adicionais
 *         grua:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             modelo:
 *               type: string
 *             fabricante:
 *               type: string
 *             tipo:
 *               type: string
 *         obra:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             nome:
 *               type: string
 *             cliente_id:
 *               type: integer
 *             status:
 *               type: string
 *     
 *     RelacionamentoGruaFuncionario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do relacionamento
 *         grua_id:
 *           type: string
 *           description: ID da grua
 *         funcionario_id:
 *           type: integer
 *           description: ID do funcionário
 *         obra_id:
 *           type: integer
 *           description: ID da obra (opcional)
 *         data_inicio:
 *           type: string
 *           format: date
 *           description: Data de início
 *         data_fim:
 *           type: string
 *           format: date
 *           description: Data de fim
 *         status:
 *           type: string
 *           enum: [Ativo, Inativo]
 *           description: Status do relacionamento
 *         observacoes:
 *           type: string
 *           description: Observações adicionais
 *         grua:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             modelo:
 *               type: string
 *             fabricante:
 *               type: string
 *             tipo:
 *               type: string
 *         funcionario:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             nome:
 *               type: string
 *             cargo:
 *               type: string
 *             status:
 *               type: string
 *         obra:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             nome:
 *               type: string
 *             status:
 *               type: string
 *     
 *     RelacionamentoGruaEquipamento:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do relacionamento
 *         grua_id:
 *           type: string
 *           description: ID da grua
 *         equipamento_id:
 *           type: integer
 *           description: ID do equipamento
 *         obra_id:
 *           type: integer
 *           description: ID da obra (opcional)
 *         data_inicio:
 *           type: string
 *           format: date
 *           description: Data de início
 *         data_fim:
 *           type: string
 *           format: date
 *           description: Data de fim
 *         status:
 *           type: string
 *           enum: [Ativo, Inativo]
 *           description: Status do relacionamento
 *         observacoes:
 *           type: string
 *           description: Observações adicionais
 *         grua:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             modelo:
 *               type: string
 *             fabricante:
 *               type: string
 *             tipo:
 *               type: string
 *         equipamento:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             nome:
 *               type: string
 *             tipo:
 *               type: string
 *             status:
 *               type: string
 *         obra:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             nome:
 *               type: string
 *             status:
 *               type: string
 */

export default router
