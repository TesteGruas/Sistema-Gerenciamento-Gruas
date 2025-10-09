/**
 * Rotas para gerenciamento de histórico RH
 * Sistema de Gerenciamento de Gruas - Módulo RH
 * Registra todos os eventos importantes dos funcionários
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação
router.use(authenticateToken)

// Schema de validação para histórico
const historicoSchema = Joi.object({
  funcionario_id: Joi.number().integer().positive().required(),
  tipo: Joi.string().valid('admissao', 'promocao', 'transferencia', 'obra', 'salario', 'ferias', 'demissao').required(),
  titulo: Joi.string().min(3).max(255).required(),
  descricao: Joi.string().allow(null, '').optional(),
  obra_id: Joi.number().integer().positive().allow(null).optional(),
  valor: Joi.number().allow(null).optional(),
  status: Joi.string().default('ativo'),
  dados_adicionais: Joi.object().allow(null).optional()
})

/**
 * GET /api/historico-rh
 * Listar histórico
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      funcionario_id,
      tipo,
      obra_id,
      data_inicio,
      data_fim
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    let query = supabaseAdmin
      .from('historico_rh')
      .select(`
        *,
        funcionarios(id, nome, cargo),
        obras(id, nome)
      `, { count: 'exact' })

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id)
    }

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    if (obra_id) {
      query = query.eq('obra_id', obra_id)
    }

    if (data_inicio) {
      query = query.gte('created_at', data_inicio)
    }

    if (data_fim) {
      query = query.lte('created_at', data_fim)
    }

    query = query
      .order('created_at', { ascending: false })
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
    console.error('Erro ao listar histórico:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar histórico',
      error: error.message
    })
  }
})

/**
 * GET /api/historico-rh/:id
 * Obter registro de histórico por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('historico_rh')
      .select(`
        *,
        funcionarios(id, nome, cargo, email, telefone),
        obras(id, nome, cidade, estado)
      `)
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
    console.error('Erro ao buscar histórico:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico',
      error: error.message
    })
  }
})

/**
 * POST /api/historico-rh
 * Criar registro de histórico
 */
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = historicoSchema.validate(req.body, {
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
      .from('historico_rh')
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
    console.error('Erro ao criar histórico:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar histórico',
      error: error.message
    })
  }
})

/**
 * PUT /api/historico-rh/:id
 * Atualizar registro de histórico
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const { data, error } = await supabaseAdmin
      .from('historico_rh')
      .update(updateData)
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
    console.error('Erro ao atualizar histórico:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar histórico',
      error: error.message
    })
  }
})

/**
 * DELETE /api/historico-rh/:id
 * Deletar registro de histórico
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('historico_rh')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({
      success: true,
      message: 'Registro deletado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar histórico:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar histórico',
      error: error.message
    })
  }
})

/**
 * GET /api/historico-rh/funcionario/:funcionario_id
 * Obter histórico completo de um funcionário
 */
router.get('/funcionario/:funcionario_id', async (req, res) => {
  try {
    const { funcionario_id } = req.params

    const { data, error } = await supabaseAdmin
      .from('historico_rh')
      .select(`
        *,
        obras(id, nome)
      `)
      .eq('funcionario_id', funcionario_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar histórico do funcionário:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico do funcionário',
      error: error.message
    })
  }
})

/**
 * GET /api/historico-rh/timeline/:funcionario_id
 * Obter timeline formatada de um funcionário
 */
router.get('/timeline/:funcionario_id', async (req, res) => {
  try {
    const { funcionario_id } = req.params

    const { data, error } = await supabaseAdmin
      .from('historico_rh')
      .select(`
        id,
        tipo,
        titulo,
        descricao,
        valor,
        created_at,
        obras(nome)
      `)
      .eq('funcionario_id', funcionario_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Formatar como timeline
    const timeline = data.map(item => ({
      id: item.id,
      date: item.created_at,
      type: item.tipo,
      title: item.titulo,
      description: item.descricao,
      value: item.valor,
      location: item.obras?.nome || null
    }))

    res.json({
      success: true,
      data: timeline
    })
  } catch (error) {
    console.error('Erro ao buscar timeline:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar timeline',
      error: error.message
    })
  }
})

/**
 * GET /api/historico-rh/estatisticas/geral
 * Obter estatísticas gerais do histórico
 */
router.get('/estatisticas/geral', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('historico_rh')
      .select('tipo')

    if (error) throw error

    // Contar por tipo
    const stats = data.reduce((acc, item) => {
      acc[item.tipo] = (acc[item.tipo] || 0) + 1
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        total: data.length,
        por_tipo: stats
      }
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas',
      error: error.message
    })
  }
})

export default router

