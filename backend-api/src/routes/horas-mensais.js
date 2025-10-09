/**
 * Rotas para gerenciamento de horas mensais
 * Sistema de Gerenciamento de Gruas - Módulo RH
 * Consolida horas trabalhadas, extras, faltas por funcionário/mês
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação
router.use(authenticateToken)

// Schema de validação para horas mensais
const horasMensaisSchema = Joi.object({
  funcionario_id: Joi.number().integer().positive().required(),
  mes: Joi.string().pattern(/^\d{4}-\d{2}$/).required(), // Formato YYYY-MM
  horas_trabalhadas: Joi.number().min(0).default(0),
  horas_extras: Joi.number().min(0).default(0),
  horas_faltas: Joi.number().min(0).default(0),
  horas_atrasos: Joi.number().min(0).default(0),
  dias_trabalhados: Joi.number().integer().min(0).default(0),
  dias_uteis: Joi.number().integer().min(1).default(22),
  valor_hora: Joi.number().min(0).optional(),
  status: Joi.string().valid('calculado', 'pago', 'pendente').default('pendente')
})

/**
 * GET /api/horas-mensais
 * Listar horas mensais
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      funcionario_id,
      mes,
      status,
      ano
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    let query = supabaseAdmin
      .from('horas_mensais')
      .select('*, funcionarios(nome, cargo, salario)', { count: 'exact' })

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id)
    }

    if (mes) {
      query = query.eq('mes', mes)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (ano) {
      query = query.like('mes', `${ano}%`)
    }

    query = query
      .order('mes', { ascending: false })
      .order('funcionario_id', { ascending: true })
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
    console.error('Erro ao listar horas mensais:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar horas mensais',
      error: error.message
    })
  }
})

/**
 * GET /api/horas-mensais/:id
 * Obter horas mensais por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('horas_mensais')
      .select('*, funcionarios(nome, cargo, salario)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Registro não encontrado'
        })
      }
      throw error
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar horas mensais:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar horas mensais',
      error: error.message
    })
  }
})

/**
 * POST /api/horas-mensais
 * Criar registro de horas mensais
 */
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = horasMensaisSchema.validate(req.body, {
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

    // Verificar se já existe registro para este funcionário neste mês
    const { data: existente } = await supabaseAdmin
      .from('horas_mensais')
      .select('id')
      .eq('funcionario_id', value.funcionario_id)
      .eq('mes', value.mes)
      .single()

    if (existente) {
      return res.status(409).json({
        success: false,
        message: 'Já existe registro para este funcionário neste mês'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('horas_mensais')
      .insert(value)
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Registro criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar horas mensais:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar horas mensais',
      error: error.message
    })
  }
})

/**
 * PUT /api/horas-mensais/:id
 * Atualizar horas mensais
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Validar dados (permitindo atualizações parciais)
    const partialSchema = horasMensaisSchema.fork(
      ['funcionario_id', 'mes'],
      (schema) => schema.optional()
    )

    const { error: validationError, value } = partialSchema.validate(updateData, {
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
      .from('horas_mensais')
      .update(value)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Registro atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar horas mensais:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar horas mensais',
      error: error.message
    })
  }
})

/**
 * DELETE /api/horas-mensais/:id
 * Deletar horas mensais
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se registro existe
    const { data: registro } = await supabaseAdmin
      .from('horas_mensais')
      .select('id, status')
      .eq('id', id)
      .single()

    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro não encontrado'
      })
    }

    // Não permitir deletar registros já pagos
    if (registro.status === 'pago') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar registro já pago'
      })
    }

    const { error } = await supabaseAdmin
      .from('horas_mensais')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({
      success: true,
      message: 'Registro deletado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar horas mensais:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar horas mensais',
      error: error.message
    })
  }
})

/**
 * GET /api/horas-mensais/funcionario/:funcionario_id/mes/:mes
 * Obter horas de um funcionário em um mês específico
 */
router.get('/funcionario/:funcionario_id/mes/:mes', async (req, res) => {
  try {
    const { funcionario_id, mes } = req.params

    const { data, error } = await supabaseAdmin
      .from('horas_mensais')
      .select('*, funcionarios(nome, cargo, salario)')
      .eq('funcionario_id', funcionario_id)
      .eq('mes', mes)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Registro não encontrado'
        })
      }
      throw error
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar horas mensais:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar horas mensais',
      error: error.message
    })
  }
})

/**
 * POST /api/horas-mensais/:id/calcular
 * Calcular e atualizar totais (recalcular)
 */
router.post('/:id/calcular', async (req, res) => {
  try {
    const { id } = req.params

    // Buscar registro atual
    const { data: registro, error: fetchError } = await supabaseAdmin
      .from('horas_mensais')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // O cálculo é feito automaticamente pelos triggers
    // Aqui apenas atualizamos o status para "calculado"
    const { data, error } = await supabaseAdmin
      .from('horas_mensais')
      .update({ status: 'calculado' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Cálculo realizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao calcular horas mensais:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao calcular horas mensais',
      error: error.message
    })
  }
})

export default router

