/**
 * Rotas para gerenciamento de relatórios RH
 * Sistema de Gerenciamento de Gruas - Módulo RH
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação
router.use(authenticateToken)

// Schema de validação para relatórios
const relatorioSchema = Joi.object({
  tipo: Joi.string().min(3).max(100).required(),
  periodo: Joi.string().max(50).optional(),
  parametros: Joi.object().allow(null).optional(),
  gerado_por: Joi.number().integer().positive().optional()
})

/**
 * GET /api/relatorios-rh
 * Listar relatórios
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      tipo,
      status,
      periodo
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    let query = supabaseAdmin
      .from('relatorios_rh')
      .select('*, usuarios(nome, email)', { count: 'exact' })

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (periodo) {
      query = query.eq('periodo', periodo)
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
    console.error('Erro ao listar relatórios:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar relatórios',
      error: error.message
    })
  }
})

/**
 * GET /api/relatorios-rh/:id
 * Obter relatório por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('relatorios_rh')
      .select('*, usuarios(nome, email)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Relatório não encontrado'
        })
      }
      throw error
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar relatório:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar relatório',
      error: error.message
    })
  }
})

/**
 * POST /api/relatorios-rh
 * Criar/solicitar relatório
 */
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = relatorioSchema.validate(req.body, {
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

    // Criar relatório com status "Processando"
    const { data, error } = await supabaseAdmin
      .from('relatorios_rh')
      .insert({
        ...value,
        status: 'Processando'
      })
      .select()
      .single()

    if (error) throw error

    // TODO: Aqui entraria a lógica de processamento assíncrono do relatório
    // Por enquanto, apenas criamos o registro

    res.status(201).json({
      success: true,
      data,
      message: 'Relatório solicitado com sucesso. Será processado em breve.'
    })
  } catch (error) {
    console.error('Erro ao criar relatório:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar relatório',
      error: error.message
    })
  }
})

/**
 * PUT /api/relatorios-rh/:id
 * Atualizar relatório
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const { data, error } = await supabaseAdmin
      .from('relatorios_rh')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Relatório atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar relatório:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar relatório',
      error: error.message
    })
  }
})

/**
 * DELETE /api/relatorios-rh/:id
 * Deletar relatório
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('relatorios_rh')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({
      success: true,
      message: 'Relatório deletado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar relatório:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar relatório',
      error: error.message
    })
  }
})

/**
 * POST /api/relatorios-rh/gerar/:tipo
 * Gerar relatório específico
 */
router.post('/gerar/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params
    const { periodo, parametros, gerado_por } = req.body

    // Criar registro do relatório
    const { data: relatorio, error: relatorioError } = await supabaseAdmin
      .from('relatorios_rh')
      .insert({
        tipo,
        periodo,
        parametros,
        gerado_por,
        status: 'Processando'
      })
      .select()
      .single()

    if (relatorioError) throw relatorioError

    // Processar relatório baseado no tipo
    let dadosRelatorio = {}

    switch (tipo) {
      case 'funcionarios-ativos':
        const { data: funcionarios } = await supabaseAdmin
          .from('funcionarios')
          .select('*')
          .eq('status', 'Ativo')
        
        dadosRelatorio = {
          funcionarios_count: funcionarios?.length || 0
        }
        break

      case 'horas-mensais':
        const { data: horas } = await supabaseAdmin
          .from('horas_mensais')
          .select('total_receber, horas_trabalhadas')
          .eq('mes', periodo)
        
        const totalHoras = horas?.reduce((sum, h) => sum + (Number(h.horas_trabalhadas) || 0), 0) || 0
        const totalSalarios = horas?.reduce((sum, h) => sum + (Number(h.total_receber) || 0), 0) || 0
        
        dadosRelatorio = {
          funcionarios_count: horas?.length || 0,
          total_horas: totalHoras,
          total_salarios: totalSalarios
        }
        break

      case 'folha-pagamento':
        const { data: folhas } = await supabaseAdmin
          .from('folha_pagamento')
          .select('salario_liquido')
          .eq('mes', periodo)
        
        dadosRelatorio = {
          funcionarios_count: folhas?.length || 0,
          total_salarios: folhas?.reduce((sum, f) => sum + (Number(f.salario_liquido) || 0), 0) || 0
        }
        break

      default:
        dadosRelatorio = {
          funcionarios_count: 0,
          message: 'Tipo de relatório não implementado'
        }
    }

    // Atualizar relatório com dados processados
    const { data: relatorioAtualizado, error: updateError } = await supabaseAdmin
      .from('relatorios_rh')
      .update({
        ...dadosRelatorio,
        status: 'Gerado'
      })
      .eq('id', relatorio.id)
      .select()
      .single()

    if (updateError) throw updateError

    res.json({
      success: true,
      data: relatorioAtualizado,
      message: 'Relatório gerado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório',
      error: error.message
    })
  }
})

export default router

