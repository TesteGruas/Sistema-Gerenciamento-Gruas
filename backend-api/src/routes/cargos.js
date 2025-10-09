/**
 * Rotas para gerenciamento de cargos
 * Sistema de Gerenciamento de Gruas - Módulo RH
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// Schema de validação para cargos
const cargoSchema = Joi.object({
  nome: Joi.string().min(2).max(255).required(),
  descricao: Joi.string().allow(null, '').optional(),
  nivel: Joi.string().valid('Operacional', 'Técnico', 'Supervisor', 'Gerencial', 'Diretoria').required(),
  salario_minimo: Joi.number().min(0).allow(null).optional(),
  salario_maximo: Joi.number().min(0).allow(null).optional(),
  requisitos: Joi.array().items(Joi.string()).default([]),
  competencias: Joi.array().items(Joi.string()).default([]),
  ativo: Joi.boolean().default(true)
})

// Schema para atualização (campos opcionais)
const cargoUpdateSchema = cargoSchema.fork(
  ['nome', 'nivel'], 
  (schema) => schema.optional()
)

/**
 * GET /api/cargos
 * Listar todos os cargos
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      nivel, 
      ativo = 'true',
      search 
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    // Construir query
    let query = supabaseAdmin
      .from('cargos')
      .select('*', { count: 'exact' })

    // Filtros
    if (ativo === 'true') {
      query = query.eq('ativo', true)
    } else if (ativo === 'false') {
      query = query.eq('ativo', false)
    }

    if (nivel) {
      query = query.eq('nivel', nivel)
    }

    if (search) {
      query = query.or(`nome.ilike.%${search}%,descricao.ilike.%${search}%`)
    }

    // Ordenação e paginação
    query = query
      .order('nivel', { ascending: true })
      .order('nome', { ascending: true })
      .range(offset, offset + limitNum - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao listar cargos:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar cargos',
        error: error.message
      })
    }

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
    console.error('Erro ao listar cargos:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar cargos',
      error: error.message
    })
  }
})

/**
 * GET /api/cargos/:id
 * Obter cargo por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('cargos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Cargo não encontrado'
        })
      }
      throw error
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar cargo:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar cargo',
      error: error.message
    })
  }
})

/**
 * POST /api/cargos
 * Criar novo cargo
 */
router.post('/', async (req, res) => {
  try {
    // Validar dados
    const { error: validationError, value } = cargoSchema.validate(req.body, {
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

    // Validar faixa salarial
    if (value.salario_minimo && value.salario_maximo && value.salario_minimo > value.salario_maximo) {
      return res.status(400).json({
        success: false,
        message: 'Salário mínimo não pode ser maior que o salário máximo'
      })
    }

    // Verificar se já existe cargo com mesmo nome
    const { data: existente } = await supabaseAdmin
      .from('cargos')
      .select('id')
      .eq('nome', value.nome)
      .single()

    if (existente) {
      return res.status(409).json({
        success: false,
        message: 'Já existe um cargo com este nome'
      })
    }

    // Criar cargo
    const { data, error } = await supabaseAdmin
      .from('cargos')
      .insert(value)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar cargo:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar cargo',
        error: error.message
      })
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Cargo criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar cargo:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar cargo',
      error: error.message
    })
  }
})

/**
 * PUT /api/cargos/:id
 * Atualizar cargo
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validar dados
    const { error: validationError, value } = cargoUpdateSchema.validate(req.body, {
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

    // Validar faixa salarial
    if (value.salario_minimo && value.salario_maximo && value.salario_minimo > value.salario_maximo) {
      return res.status(400).json({
        success: false,
        message: 'Salário mínimo não pode ser maior que o salário máximo'
      })
    }

    // Verificar se cargo existe
    const { data: cargoExiste } = await supabaseAdmin
      .from('cargos')
      .select('id')
      .eq('id', id)
      .single()

    if (!cargoExiste) {
      return res.status(404).json({
        success: false,
        message: 'Cargo não encontrado'
      })
    }

    // Se mudou o nome, verificar unicidade
    if (value.nome) {
      const { data: existente } = await supabaseAdmin
        .from('cargos')
        .select('id')
        .eq('nome', value.nome)
        .neq('id', id)
        .single()

      if (existente) {
        return res.status(409).json({
          success: false,
          message: 'Já existe um cargo com este nome'
        })
      }
    }

    // Atualizar cargo
    const { data, error } = await supabaseAdmin
      .from('cargos')
      .update(value)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar cargo:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar cargo',
        error: error.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Cargo atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar cargo:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar cargo',
      error: error.message
    })
  }
})

/**
 * DELETE /api/cargos/:id
 * Deletar cargo (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se cargo existe
    const { data: cargo } = await supabaseAdmin
      .from('cargos')
      .select('id')
      .eq('id', id)
      .single()

    if (!cargo) {
      return res.status(404).json({
        success: false,
        message: 'Cargo não encontrado'
      })
    }

    // Soft delete (marcar como inativo)
    const { error } = await supabaseAdmin
      .from('cargos')
      .update({ ativo: false })
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar cargo:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar cargo',
        error: error.message
      })
    }

    res.json({
      success: true,
      message: 'Cargo desativado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar cargo:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar cargo',
      error: error.message
    })
  }
})

/**
 * POST /api/cargos/:id/reativar
 * Reativar cargo
 */
router.post('/:id/reativar', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se cargo existe
    const { data: cargo } = await supabaseAdmin
      .from('cargos')
      .select('id')
      .eq('id', id)
      .single()

    if (!cargo) {
      return res.status(404).json({
        success: false,
        message: 'Cargo não encontrado'
      })
    }

    // Reativar
    const { data, error } = await supabaseAdmin
      .from('cargos')
      .update({ ativo: true })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao reativar cargo:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao reativar cargo',
        error: error.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Cargo reativado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao reativar cargo:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao reativar cargo',
      error: error.message
    })
  }
})

export default router

