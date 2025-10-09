/**
 * Rotas para gerenciamento de férias e afastamentos
 * Sistema de Gerenciamento de Gruas - Módulo RH
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação
router.use(authenticateToken)

// Schema de validação para férias
const feriasSchema = Joi.object({
  funcionario_id: Joi.number().integer().positive().required(),
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().greater(Joi.ref('data_inicio')).required(),
  dias_solicitados: Joi.number().integer().positive().required(),
  saldo_anterior: Joi.number().integer().default(30),
  observacoes: Joi.string().allow(null, '').optional(),
  status: Joi.string().valid('Solicitado', 'Aprovado', 'Em Andamento', 'Finalizado', 'Cancelado').default('Solicitado')
})

// Schema para afastamentos
const afastamentosSchema = Joi.object({
  funcionario_id: Joi.number().integer().positive().required(),
  tipo: Joi.string().valid('Licença Médica', 'Licença Maternidade', 'Licença Paternidade', 'Licença Sem Vencimento', 'Suspensão', 'Acidente de Trabalho', 'INSS', 'Outro').required(),
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().greater(Joi.ref('data_inicio')).allow(null).optional(),
  dias_solicitados: Joi.number().integer().positive().required(),
  observacoes: Joi.string().allow(null, '').optional(),
  documento_anexo: Joi.string().allow(null, '').optional(),
  status: Joi.string().valid('Solicitado', 'Aprovado', 'Em Andamento', 'Finalizado', 'Cancelado').default('Solicitado')
})

/**
 * GET /api/ferias
 * Listar todas as férias
 */
router.get('/ferias', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      funcionario_id,
      status,
      ano
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    let query = supabaseAdmin
      .from('ferias')
      .select('*, funcionarios(nome, cargo)', { count: 'exact' })

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (ano) {
      query = query
        .gte('data_inicio', `${ano}-01-01`)
        .lte('data_inicio', `${ano}-12-31`)
    }

    query = query
      .order('data_inicio', { ascending: false })
      .range(offset, offset + limitNum - 1)

    const { data, error, count } = await query

    if (error) throw error

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum)
      }
    })
  } catch (error) {
    console.error('Erro ao listar férias:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar férias',
      error: error.message
    })
  }
})

/**
 * GET /api/ferias/:id
 * Obter férias por ID
 */
router.get('/ferias/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('ferias')
      .select('*, funcionarios(nome, cargo), usuarios(nome)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Férias não encontradas'
        })
      }
      throw error
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar férias:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar férias',
      error: error.message
    })
  }
})

/**
 * POST /api/ferias
 * Criar solicitação de férias
 */
router.post('/ferias', async (req, res) => {
  try {
    const { error: validationError, value } = feriasSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      })
    }

    const { data, error } = await supabaseAdmin
      .from('ferias')
      .insert(value)
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Férias solicitadas com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar férias:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar férias',
      error: error.message
    })
  }
})

/**
 * PUT /api/ferias/:id
 * Atualizar férias
 */
router.put('/ferias/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const { data, error } = await supabaseAdmin
      .from('ferias')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Férias atualizadas com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar férias:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar férias',
      error: error.message
    })
  }
})

/**
 * POST /api/ferias/:id/aprovar
 * Aprovar férias
 */
router.post('/ferias/:id/aprovar', async (req, res) => {
  try {
    const { id } = req.params
    const { aprovado_por } = req.body

    const { data, error } = await supabaseAdmin
      .from('ferias')
      .update({
        status: 'Aprovado',
        aprovado_por
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Férias aprovadas com sucesso'
    })
  } catch (error) {
    console.error('Erro ao aprovar férias:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar férias',
      error: error.message
    })
  }
})

/**
 * GET /api/afastamentos
 * Listar todos os afastamentos
 */
router.get('/afastamentos', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      funcionario_id,
      tipo,
      status
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    let query = supabaseAdmin
      .from('afastamentos')
      .select('*, funcionarios(nome, cargo)', { count: 'exact' })

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id)
    }

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query
      .order('data_inicio', { ascending: false })
      .range(offset, offset + limitNum - 1)

    const { data, error, count } = await query

    if (error) throw error

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum)
      }
    })
  } catch (error) {
    console.error('Erro ao listar afastamentos:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar afastamentos',
      error: error.message
    })
  }
})

/**
 * GET /api/afastamentos/:id
 * Obter afastamento por ID
 */
router.get('/afastamentos/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('afastamentos')
      .select('*, funcionarios(nome, cargo), usuarios(nome)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Afastamento não encontrado'
        })
      }
      throw error
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar afastamento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar afastamento',
      error: error.message
    })
  }
})

/**
 * POST /api/afastamentos
 * Criar afastamento
 */
router.post('/afastamentos', async (req, res) => {
  try {
    const { error: validationError, value } = afastamentosSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      })
    }

    const { data, error } = await supabaseAdmin
      .from('afastamentos')
      .insert(value)
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Afastamento criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar afastamento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar afastamento',
      error: error.message
    })
  }
})

/**
 * PUT /api/afastamentos/:id
 * Atualizar afastamento
 */
router.put('/afastamentos/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const { data, error } = await supabaseAdmin
      .from('afastamentos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Afastamento atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar afastamento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar afastamento',
      error: error.message
    })
  }
})

/**
 * POST /api/afastamentos/:id/aprovar
 * Aprovar afastamento
 */
router.post('/afastamentos/:id/aprovar', async (req, res) => {
  try {
    const { id } = req.params
    const { aprovado_por } = req.body

    const { data, error } = await supabaseAdmin
      .from('afastamentos')
      .update({
        status: 'Aprovado',
        aprovado_por
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Afastamento aprovado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao aprovar afastamento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar afastamento',
      error: error.message
    })
  }
})

export default router

