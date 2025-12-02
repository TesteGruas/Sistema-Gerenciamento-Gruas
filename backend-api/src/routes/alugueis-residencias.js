/**
 * Rotas para gerenciamento de aluguéis de residências
 * Sistema de Gerenciamento de Gruas - Módulo RH
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// ==================== SCHEMAS DE VALIDAÇÃO ====================

const residenciaSchema = Joi.object({
  nome: Joi.string().min(2).max(255).required(),
  endereco: Joi.string().min(5).max(500).required(),
  cidade: Joi.string().min(2).max(100).required(),
  estado: Joi.string().length(2).required(),
  cep: Joi.string().pattern(/^\d{5}-?\d{3}$/).required(),
  quartos: Joi.number().integer().min(1).required(),
  banheiros: Joi.number().integer().min(1).required(),
  area: Joi.number().positive().required(),
  mobiliada: Joi.boolean().default(false),
  valor_base: Joi.number().positive().required(),
  disponivel: Joi.boolean().default(true),
  fotos: Joi.array().items(Joi.string()).optional(),
  observacoes: Joi.string().allow('', null).optional()
})

const aluguelSchema = Joi.object({
  residencia_id: Joi.string().uuid().required(),
  funcionario_id: Joi.number().integer().positive().required(),
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().allow(null).optional(),
  valor_mensal: Joi.number().positive().required(),
  dia_vencimento: Joi.number().integer().min(1).max(31).required(),
  desconto_folha: Joi.boolean().default(false),
  porcentagem_desconto: Joi.number().min(0).max(100).when('desconto_folha', {
    is: true,
    then: Joi.optional(),
    otherwise: Joi.allow(null).optional()
  }),
  observacoes: Joi.string().allow('', null).optional()
})

const pagamentoSchema = Joi.object({
  mes: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
  valor_pago: Joi.number().positive().required(),
  data_pagamento: Joi.date().allow(null).optional(),
  observacoes: Joi.string().allow('', null).optional()
})

// ==================== RESIDÊNCIAS ====================

/**
 * GET /api/alugueis-residencias/residencias
 * Listar residências com filtros opcionais
 */
router.get('/residencias', async (req, res) => {
  try {
    const { cidade, disponivel, page = 1, limit = 50 } = req.query
    
    let query = supabaseAdmin
      .from('residencias')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (cidade) {
      query = query.ilike('cidade', `%${cidade}%`)
    }
    
    if (disponivel !== undefined) {
      query = query.eq('disponivel', disponivel === 'true')
    }

    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50))
    const offset = (pageNum - 1) * limitNum

    query = query.range(offset, offset + limitNum - 1)

    const { data, error, count } = await query

    if (error) throw error

    res.json({
      success: true,
      data: data || [],
      paginacao: {
        pagina_atual: pageNum,
        limite: limitNum,
        total_registros: count || 0,
        total_paginas: Math.ceil((count || 0) / limitNum)
      }
    })
  } catch (error) {
    console.error('Erro ao listar residências:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

/**
 * GET /api/alugueis-residencias/residencias/:id
 * Buscar residência por ID
 */
router.get('/residencias/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('residencias')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false,
          error: 'Residência não encontrada' 
        })
      }
      throw error
    }

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao buscar residência:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

/**
 * POST /api/alugueis-residencias/residencias
 * Criar nova residência
 */
router.post('/residencias', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { error: validationError, value } = residenciaSchema.validate(req.body)
    if (validationError) {
      return res.status(400).json({ 
        success: false,
        error: 'Dados inválidos', 
        details: validationError.details[0].message 
      })
    }

    const userId = req.user?.id

    const { data, error } = await supabaseAdmin
      .from('residencias')
      .insert({
        ...value,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({ success: true, data })
  } catch (error) {
    console.error('Erro ao criar residência:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

/**
 * PUT /api/alugueis-residencias/residencias/:id
 * Atualizar residência
 */
router.put('/residencias/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { error: validationError, value } = residenciaSchema.validate(req.body)
    
    if (validationError) {
      return res.status(400).json({ 
        success: false,
        error: 'Dados inválidos', 
        details: validationError.details[0].message 
      })
    }

    const userId = req.user?.id

    const { data, error } = await supabaseAdmin
      .from('residencias')
      .update({
        ...value,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false,
          error: 'Residência não encontrada' 
        })
      }
      throw error
    }

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar residência:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

/**
 * DELETE /api/alugueis-residencias/residencias/:id
 * Excluir residência
 */
router.delete('/residencias/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se há aluguéis ativos
    const { data: alugueis, error: alugueisError } = await supabaseAdmin
      .from('alugueis_residencias')
      .select('id')
      .eq('residencia_id', id)
      .eq('status', 'ativo')
      .limit(1)

    if (alugueisError) throw alugueisError

    if (alugueis && alugueis.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Não é possível excluir residência com aluguéis ativos' 
      })
    }

    const { error } = await supabaseAdmin
      .from('residencias')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Residência excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir residência:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

// ==================== ALUGUÉIS ====================

/**
 * GET /api/alugueis-residencias
 * Listar aluguéis com filtros opcionais
 */
router.get('/', async (req, res) => {
  try {
    const { status, funcionario_id, page = 1, limit = 50 } = req.query
    
    let query = supabaseAdmin
      .from('alugueis_residencias')
      .select(`
        *,
        residencias (*),
        funcionarios (id, nome, cargo, cpf)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }
    
    if (funcionario_id) {
      query = query.eq('funcionario_id', parseInt(funcionario_id))
    }

    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50))
    const offset = (pageNum - 1) * limitNum

    query = query.range(offset, offset + limitNum - 1)

    const { data, error, count } = await query

    if (error) throw error

    // Buscar pagamentos para cada aluguel
    const alugueisComPagamentos = await Promise.all(
      (data || []).map(async (aluguel) => {
        const { data: pagamentos } = await supabaseAdmin
          .from('pagamentos_aluguel')
          .select('*')
          .eq('aluguel_id', aluguel.id)
          .order('mes', { ascending: false })

        return {
          ...aluguel,
          pagamentos: pagamentos || []
        }
      })
    )

    res.json({
      success: true,
      data: alugueisComPagamentos,
      paginacao: {
        pagina_atual: pageNum,
        limite: limitNum,
        total_registros: count || 0,
        total_paginas: Math.ceil((count || 0) / limitNum)
      }
    })
  } catch (error) {
    console.error('Erro ao listar aluguéis:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

/**
 * GET /api/alugueis-residencias/ativos
 * Listar apenas aluguéis ativos
 */
router.get('/ativos', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query
    
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50))
    const offset = (pageNum - 1) * limitNum

    const { data, error, count } = await supabaseAdmin
      .from('alugueis_residencias')
      .select(`
        *,
        residencias (*),
        funcionarios (id, nome, cargo, cpf)
      `, { count: 'exact' })
      .eq('status', 'ativo')
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1)

    if (error) throw error

    // Buscar pagamentos para cada aluguel
    const alugueisComPagamentos = await Promise.all(
      (data || []).map(async (aluguel) => {
        const { data: pagamentos } = await supabaseAdmin
          .from('pagamentos_aluguel')
          .select('*')
          .eq('aluguel_id', aluguel.id)
          .order('mes', { ascending: false })

        return {
          ...aluguel,
          pagamentos: pagamentos || []
        }
      })
    )

    res.json({ 
      success: true, 
      data: alugueisComPagamentos,
      paginacao: {
        pagina_atual: pageNum,
        limite: limitNum,
        total_registros: count || 0,
        total_paginas: Math.ceil((count || 0) / limitNum)
      }
    })
  } catch (error) {
    console.error('Erro ao listar aluguéis ativos:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

/**
 * GET /api/alugueis-residencias/:id
 * Buscar aluguel por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('alugueis_residencias')
      .select(`
        *,
        residencias (*),
        funcionarios (id, nome, cargo, cpf)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false,
          error: 'Aluguel não encontrado' 
        })
      }
      throw error
    }

    // Buscar pagamentos
    const { data: pagamentos } = await supabaseAdmin
      .from('pagamentos_aluguel')
      .select('*')
      .eq('aluguel_id', id)
      .order('mes', { ascending: false })

    res.json({ 
      success: true, 
      data: {
        ...data,
        pagamentos: pagamentos || []
      }
    })
  } catch (error) {
    console.error('Erro ao buscar aluguel:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

/**
 * GET /api/alugueis-residencias/funcionario/:funcionarioId
 * Listar aluguéis por funcionário
 */
router.get('/funcionario/:funcionarioId', async (req, res) => {
  try {
    const { funcionarioId } = req.params

    const { data, error } = await supabaseAdmin
      .from('alugueis_residencias')
      .select(`
        *,
        residencias (*),
        funcionarios (id, nome, cargo, cpf)
      `)
      .eq('funcionario_id', parseInt(funcionarioId))
      .order('created_at', { ascending: false })

    if (error) throw error

    // Buscar pagamentos para cada aluguel
    const alugueisComPagamentos = await Promise.all(
      (data || []).map(async (aluguel) => {
        const { data: pagamentos } = await supabaseAdmin
          .from('pagamentos_aluguel')
          .select('*')
          .eq('aluguel_id', aluguel.id)
          .order('mes', { ascending: false })

        return {
          ...aluguel,
          pagamentos: pagamentos || []
        }
      })
    )

    res.json({ success: true, data: alugueisComPagamentos })
  } catch (error) {
    console.error('Erro ao listar aluguéis do funcionário:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

/**
 * POST /api/alugueis-residencias
 * Criar novo aluguel
 */
router.post('/', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { error: validationError, value } = aluguelSchema.validate(req.body)
    if (validationError) {
      return res.status(400).json({ 
        success: false,
        error: 'Dados inválidos', 
        details: validationError.details[0].message 
      })
    }

    // Verificar se residência existe e está disponível
    const { data: residencia, error: residenciaError } = await supabaseAdmin
      .from('residencias')
      .select('id, disponivel')
      .eq('id', value.residencia_id)
      .single()

    if (residenciaError || !residencia) {
      return res.status(404).json({ 
        success: false,
        error: 'Residência não encontrada' 
      })
    }

    if (!residencia.disponivel) {
      return res.status(400).json({ 
        success: false,
        error: 'Residência não está disponível' 
      })
    }

    // Verificar se funcionário existe
    const { data: funcionario, error: funcionarioError } = await supabaseAdmin
      .from('funcionarios')
      .select('id')
      .eq('id', value.funcionario_id)
      .single()

    if (funcionarioError || !funcionario) {
      return res.status(404).json({ 
        success: false,
        error: 'Funcionário não encontrado' 
      })
    }

    const userId = req.user?.id

    // Criar aluguel
    const { data: aluguel, error: aluguelError } = await supabaseAdmin
      .from('alugueis_residencias')
      .insert({
        ...value,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single()

    if (aluguelError) throw aluguelError

    // Atualizar disponibilidade da residência
    await supabaseAdmin
      .from('residencias')
      .update({ disponivel: false })
      .eq('id', value.residencia_id)

    // Buscar dados completos
    const { data: aluguelCompleto } = await supabaseAdmin
      .from('alugueis_residencias')
      .select(`
        *,
        residencias (*),
        funcionarios (id, nome, cargo, cpf)
      `)
      .eq('id', aluguel.id)
      .single()

    res.status(201).json({ 
      success: true, 
      data: {
        ...aluguelCompleto,
        pagamentos: []
      }
    })
  } catch (error) {
    console.error('Erro ao criar aluguel:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

/**
 * PUT /api/alugueis-residencias/:id
 * Atualizar aluguel
 */
router.put('/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { error: validationError, value } = aluguelSchema.validate(req.body)
    
    if (validationError) {
      return res.status(400).json({ 
        success: false,
        error: 'Dados inválidos', 
        details: validationError.details[0].message 
      })
    }

    const userId = req.user?.id

    const { data, error } = await supabaseAdmin
      .from('alugueis_residencias')
      .update({
        ...value,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false,
          error: 'Aluguel não encontrado' 
        })
      }
      throw error
    }

    // Buscar dados completos
    const { data: aluguelCompleto, error: aluguelError } = await supabaseAdmin
      .from('alugueis_residencias')
      .select(`
        *,
        residencias (*),
        funcionarios (id, nome, cargo, cpf)
      `)
      .eq('id', id)
      .single()

    if (aluguelError) {
      if (aluguelError.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false,
          error: 'Aluguel não encontrado' 
        })
      }
      throw aluguelError
    }

    // Buscar pagamentos
    const { data: pagamentos } = await supabaseAdmin
      .from('pagamentos_aluguel')
      .select('*')
      .eq('aluguel_id', id)
      .order('mes', { ascending: false })

    res.json({ 
      success: true, 
      data: {
        ...aluguelCompleto,
        pagamentos: pagamentos || []
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar aluguel:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

/**
 * PUT /api/alugueis-residencias/:id/encerrar
 * Encerrar aluguel
 */
router.put('/:id/encerrar', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { data_fim } = req.body

    const dataFim = data_fim || new Date().toISOString().split('T')[0]
    const userId = req.user?.id

    // Buscar aluguel para pegar residencia_id
    const { data: aluguel, error: aluguelError } = await supabaseAdmin
      .from('alugueis_residencias')
      .select('residencia_id')
      .eq('id', id)
      .single()

    if (aluguelError || !aluguel) {
      return res.status(404).json({ 
        success: false,
        error: 'Aluguel não encontrado' 
      })
    }

    // Atualizar aluguel
    const { data, error } = await supabaseAdmin
      .from('alugueis_residencias')
      .update({
        status: 'encerrado',
        data_fim: dataFim,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Liberar residência
    await supabaseAdmin
      .from('residencias')
      .update({ disponivel: true })
      .eq('id', aluguel.residencia_id)

    // Buscar dados completos
    const { data: aluguelCompleto } = await supabaseAdmin
      .from('alugueis_residencias')
      .select(`
        *,
        residencias (*),
        funcionarios (id, nome, cargo, cpf)
      `)
      .eq('id', id)
      .single()

    // Buscar pagamentos
    const { data: pagamentos } = await supabaseAdmin
      .from('pagamentos_aluguel')
      .select('*')
      .eq('aluguel_id', id)
      .order('mes', { ascending: false })

    res.json({ 
      success: true, 
      data: {
        ...aluguelCompleto,
        pagamentos: pagamentos || []
      }
    })
  } catch (error) {
    console.error('Erro ao encerrar aluguel:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

// ==================== PAGAMENTOS ====================

/**
 * GET /api/alugueis-residencias/:aluguelId/pagamentos
 * Listar pagamentos de um aluguel
 */
router.get('/:aluguelId/pagamentos', async (req, res) => {
  try {
    const { aluguelId } = req.params

    const { data, error } = await supabaseAdmin
      .from('pagamentos_aluguel')
      .select('*')
      .eq('aluguel_id', aluguelId)
      .order('mes', { ascending: false })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

/**
 * POST /api/alugueis-residencias/:aluguelId/pagamentos
 * Registrar pagamento
 */
router.post('/:aluguelId/pagamentos', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { aluguelId } = req.params
    const { error: validationError, value } = pagamentoSchema.validate(req.body)
    
    if (validationError) {
      return res.status(400).json({ 
        success: false,
        error: 'Dados inválidos', 
        details: validationError.details[0].message 
      })
    }

    // Verificar se aluguel existe
    const { data: aluguel, error: aluguelError } = await supabaseAdmin
      .from('alugueis_residencias')
      .select('id, valor_mensal')
      .eq('id', aluguelId)
      .single()

    if (aluguelError || !aluguel) {
      return res.status(404).json({ 
        success: false,
        error: 'Aluguel não encontrado' 
      })
    }

    // Verificar se já existe pagamento para este mês
    const { data: pagamentoExistente } = await supabaseAdmin
      .from('pagamentos_aluguel')
      .select('id')
      .eq('aluguel_id', aluguelId)
      .eq('mes', value.mes)
      .single()

    if (pagamentoExistente) {
      return res.status(400).json({ 
        success: false,
        error: 'Já existe pagamento registrado para este mês' 
      })
    }

    // Determinar status do pagamento
    let statusPagamento = 'pendente'
    if (value.data_pagamento) {
      statusPagamento = 'pago'
    } else {
      // Verificar se está atrasado (comparar mês com data atual)
      const mesAtual = new Date().toISOString().slice(0, 7)
      if (value.mes < mesAtual) {
        statusPagamento = 'atrasado'
      }
    }

    const userId = req.user?.id

    const { data, error } = await supabaseAdmin
      .from('pagamentos_aluguel')
      .insert({
        aluguel_id: aluguelId,
        ...value,
        status: statusPagamento,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({ success: true, data })
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

/**
 * PUT /api/alugueis-residencias/pagamentos/:id
 * Atualizar pagamento
 */
router.put('/pagamentos/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { mes, valor_pago, data_pagamento, observacoes } = req.body

    const schema = Joi.object({
      mes: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(),
      valor_pago: Joi.number().positive().optional(),
      data_pagamento: Joi.date().allow(null).optional(),
      observacoes: Joi.string().allow('', null).optional()
    })

    const { error: validationError } = schema.validate({ mes, valor_pago, data_pagamento, observacoes })
    if (validationError) {
      return res.status(400).json({ 
        success: false,
        error: 'Dados inválidos', 
        details: validationError.details[0].message 
      })
    }

    // Determinar status do pagamento
    let statusPagamento = 'pendente'
    if (data_pagamento) {
      statusPagamento = 'pago'
    } else if (mes) {
      const mesAtual = new Date().toISOString().slice(0, 7)
      if (mes < mesAtual) {
        statusPagamento = 'atrasado'
      }
    }

    const userId = req.user?.id
    const updateData = {
      updated_by: userId,
      updated_at: new Date().toISOString()
    }

    if (mes !== undefined) updateData.mes = mes
    if (valor_pago !== undefined) updateData.valor_pago = valor_pago
    if (data_pagamento !== undefined) updateData.data_pagamento = data_pagamento
    if (observacoes !== undefined) updateData.observacoes = observacoes
    if (statusPagamento) updateData.status = statusPagamento

    const { data, error } = await supabaseAdmin
      .from('pagamentos_aluguel')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false,
          error: 'Pagamento não encontrado' 
        })
      }
      throw error
    }

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: error.message 
    })
  }
})

export default router

