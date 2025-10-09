/**
 * Rotas para gerenciamento de vales
 * Sistema de Gerenciamento de Gruas - Módulo RH
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação
router.use(authenticateToken)

// Schema de validação para vales
const valeSchema = Joi.object({
  funcionario_id: Joi.number().integer().positive().required(),
  tipo: Joi.string().valid('vale-transporte', 'vale-refeicao', 'vale-alimentacao', 'vale-combustivel', 'outros').required(),
  descricao: Joi.string().min(3).max(255).required(),
  valor: Joi.number().positive().required(),
  data_solicitacao: Joi.date().optional(),
  observacoes: Joi.string().allow(null, '').optional()
})

/**
 * GET /api/vales
 * Listar todos os vales
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      funcionario_id,
      tipo,
      status,
      mes
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    let query = supabaseAdmin
      .from('vales_funcionario')
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

    if (mes) {
      const [ano, mesNum] = mes.split('-')
      query = query
        .gte('data_solicitacao', `${ano}-${mesNum}-01`)
        .lte('data_solicitacao', `${ano}-${mesNum}-31`)
    }

    query = query
      .order('data_solicitacao', { ascending: false })
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
    console.error('Erro ao listar vales:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar vales',
      error: error.message
    })
  }
})

/**
 * GET /api/vales/:id
 * Obter vale por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('vales_funcionario')
      .select('*, funcionarios(nome, cargo), usuarios(nome)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Vale não encontrado'
        })
      }
      throw error
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar vale:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar vale',
      error: error.message
    })
  }
})

/**
 * POST /api/vales
 * Criar solicitação de vale
 */
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = valeSchema.validate(req.body, {
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
      .from('vales_funcionario')
      .insert(value)
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Vale solicitado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar vale:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar vale',
      error: error.message
    })
  }
})

/**
 * PUT /api/vales/:id
 * Atualizar vale
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const { data, error } = await supabaseAdmin
      .from('vales_funcionario')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Vale atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar vale:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar vale',
      error: error.message
    })
  }
})

/**
 * POST /api/vales/:id/aprovar
 * Aprovar vale
 */
router.post('/:id/aprovar', async (req, res) => {
  try {
    const { id } = req.params
    const { aprovado_por } = req.body

    const { data, error } = await supabaseAdmin
      .from('vales_funcionario')
      .update({
        status: 'aprovado',
        aprovado_por,
        data_aprovacao: new Date().toISOString().split('T')[0]
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Vale aprovado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao aprovar vale:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar vale',
      error: error.message
    })
  }
})

/**
 * POST /api/vales/:id/pagar
 * Marcar vale como pago
 */
router.post('/:id/pagar', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('vales_funcionario')
      .update({
        status: 'pago',
        data_pagamento: new Date().toISOString().split('T')[0]
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Vale marcado como pago'
    })
  } catch (error) {
    console.error('Erro ao marcar vale como pago:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar vale como pago',
      error: error.message
    })
  }
})

/**
 * DELETE /api/vales/:id
 * Deletar vale
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se vale existe
    const { data: vale } = await supabaseAdmin
      .from('vales_funcionario')
      .select('id, status')
      .eq('id', id)
      .single()

    if (!vale) {
      return res.status(404).json({
        success: false,
        message: 'Vale não encontrado'
      })
    }

    // Não permitir deletar vales já pagos
    if (vale.status === 'pago') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar vale já pago'
      })
    }

    const { error } = await supabaseAdmin
      .from('vales_funcionario')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({
      success: true,
      message: 'Vale deletado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar vale:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar vale',
      error: error.message
    })
  }
})

export default router

