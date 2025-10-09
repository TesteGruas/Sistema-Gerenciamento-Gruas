/**
 * Rotas para gerenciamento de remuneração
 * Sistema de Gerenciamento de Gruas - Módulo RH
 * Gerencia: Folha de Pagamento, Descontos, Benefícios
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação
router.use(authenticateToken)

// ============== FOLHA DE PAGAMENTO ==============

/**
 * GET /api/remuneracao/folha-pagamento
 * Listar folhas de pagamento
 */
router.get('/folha-pagamento', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      funcionario_id,
      mes,
      status
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    let query = supabaseAdmin
      .from('folha_pagamento')
      .select('*, funcionarios(nome, cargo)', { count: 'exact' })

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id)
    }

    if (mes) {
      query = query.eq('mes', mes)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query
      .order('mes', { ascending: false })
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
    console.error('Erro ao listar folha de pagamento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar folha de pagamento',
      error: error.message
    })
  }
})

/**
 * GET /api/remuneracao/folha-pagamento/:id
 * Obter folha de pagamento por ID
 */
router.get('/folha-pagamento/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data: folha, error: folhaError } = await supabaseAdmin
      .from('folha_pagamento')
      .select('*, funcionarios(nome, cargo, cpf)')
      .eq('id', id)
      .single()

    if (folhaError) {
      if (folhaError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Folha de pagamento não encontrada'
        })
      }
      throw folhaError
    }

    // Buscar descontos desta folha
    const { data: descontos } = await supabaseAdmin
      .from('funcionario_descontos')
      .select('*, descontos_tipo(tipo, descricao)')
      .eq('folha_pagamento_id', id)

    res.json({
      success: true,
      data: {
        ...folha,
        descontos
      }
    })
  } catch (error) {
    console.error('Erro ao buscar folha de pagamento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar folha de pagamento',
      error: error.message
    })
  }
})

/**
 * POST /api/remuneracao/folha-pagamento
 * Criar folha de pagamento
 */
router.post('/folha-pagamento', async (req, res) => {
  try {
    const {
      funcionario_id,
      mes,
      salario_base,
      horas_trabalhadas,
      horas_extras,
      valor_hora_extra,
      observacoes
    } = req.body

    // Validar dados
    if (!funcionario_id || !mes || !salario_base) {
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios: funcionario_id, mes, salario_base'
      })
    }

    // Verificar se já existe folha para este funcionário neste mês
    const { data: existente } = await supabaseAdmin
      .from('folha_pagamento')
      .select('id')
      .eq('funcionario_id', funcionario_id)
      .eq('mes', mes)
      .single()

    if (existente) {
      return res.status(409).json({
        success: false,
        message: 'Já existe folha de pagamento para este funcionário neste mês'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('folha_pagamento')
      .insert({
        funcionario_id,
        mes,
        salario_base,
        horas_trabalhadas: horas_trabalhadas || 0,
        horas_extras: horas_extras || 0,
        valor_hora_extra: valor_hora_extra || 0,
        observacoes
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Folha de pagamento criada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar folha de pagamento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar folha de pagamento',
      error: error.message
    })
  }
})

/**
 * PUT /api/remuneracao/folha-pagamento/:id
 * Atualizar folha de pagamento
 */
router.put('/folha-pagamento/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const { data, error } = await supabaseAdmin
      .from('folha_pagamento')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Folha de pagamento atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar folha de pagamento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar folha de pagamento',
      error: error.message
    })
  }
})

// ============== TIPOS DE DESCONTOS ==============

/**
 * GET /api/remuneracao/descontos-tipo
 * Listar tipos de descontos
 */
router.get('/descontos-tipo', async (req, res) => {
  try {
    const { ativo = 'true' } = req.query

    let query = supabaseAdmin
      .from('descontos_tipo')
      .select('*')

    if (ativo === 'true') {
      query = query.eq('ativo', true)
    }

    query = query.order('tipo', { ascending: true })

    const { data, error } = await query

    if (error) throw error

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao listar tipos de descontos:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar tipos de descontos',
      error: error.message
    })
  }
})

/**
 * POST /api/remuneracao/descontos-tipo
 * Criar tipo de desconto
 */
router.post('/descontos-tipo', async (req, res) => {
  try {
    const {
      tipo,
      descricao,
      valor,
      percentual,
      obrigatorio
    } = req.body

    if (!tipo || !descricao) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: tipo, descricao'
      })
    }

    if ((!valor || valor === 0) && (!percentual || percentual === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Informe ao menos um: valor ou percentual'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('descontos_tipo')
      .insert({
        tipo,
        descricao,
        valor: valor || 0,
        percentual: percentual || 0,
        obrigatorio: obrigatorio || false
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Tipo de desconto criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar tipo de desconto:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar tipo de desconto',
      error: error.message
    })
  }
})

// ============== TIPOS DE BENEFÍCIOS ==============

/**
 * GET /api/remuneracao/beneficios-tipo
 * Listar tipos de benefícios
 */
router.get('/beneficios-tipo', async (req, res) => {
  try {
    const { ativo = 'true' } = req.query

    let query = supabaseAdmin
      .from('beneficios_tipo')
      .select('*')

    if (ativo === 'true') {
      query = query.eq('ativo', true)
    }

    query = query.order('tipo', { ascending: true })

    const { data, error } = await query

    if (error) throw error

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao listar tipos de benefícios:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar tipos de benefícios',
      error: error.message
    })
  }
})

/**
 * POST /api/remuneracao/beneficios-tipo
 * Criar tipo de benefício
 */
router.post('/beneficios-tipo', async (req, res) => {
  try {
    const {
      tipo,
      descricao,
      valor,
      percentual
    } = req.body

    if (!tipo || !descricao || (!valor && valor !== 0)) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: tipo, descricao, valor'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('beneficios_tipo')
      .insert({
        tipo,
        descricao,
        valor,
        percentual: percentual || 0
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Tipo de benefício criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar tipo de benefício:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar tipo de benefício',
      error: error.message
    })
  }
})

// ============== DESCONTOS DO FUNCIONÁRIO ==============

/**
 * POST /api/remuneracao/funcionario-descontos
 * Adicionar desconto à folha
 */
router.post('/funcionario-descontos', async (req, res) => {
  try {
    const {
      folha_pagamento_id,
      desconto_tipo_id,
      valor,
      observacoes
    } = req.body

    if (!folha_pagamento_id || !desconto_tipo_id || (!valor && valor !== 0)) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: folha_pagamento_id, desconto_tipo_id, valor'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('funcionario_descontos')
      .insert({
        folha_pagamento_id,
        desconto_tipo_id,
        valor,
        observacoes
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Desconto adicionado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao adicionar desconto:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar desconto',
      error: error.message
    })
  }
})

// ============== BENEFÍCIOS DO FUNCIONÁRIO ==============

/**
 * GET /api/remuneracao/funcionario-beneficios
 * Listar benefícios de funcionários
 */
router.get('/funcionario-beneficios', async (req, res) => {
  try {
    const { funcionario_id, status = 'ativo' } = req.query

    let query = supabaseAdmin
      .from('funcionario_beneficios')
      .select('*, funcionarios(nome, cargo), beneficios_tipo(tipo, descricao, valor)')

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao listar benefícios:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar benefícios',
      error: error.message
    })
  }
})

/**
 * POST /api/remuneracao/funcionario-beneficios
 * Adicionar benefício ao funcionário
 */
router.post('/funcionario-beneficios', async (req, res) => {
  try {
    const {
      funcionario_id,
      beneficio_tipo_id,
      data_inicio,
      observacoes
    } = req.body

    if (!funcionario_id || !beneficio_tipo_id || !data_inicio) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: funcionario_id, beneficio_tipo_id, data_inicio'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('funcionario_beneficios')
      .insert({
        funcionario_id,
        beneficio_tipo_id,
        data_inicio,
        observacoes
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Benefício adicionado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao adicionar benefício:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar benefício',
      error: error.message
    })
  }
})

/**
 * PUT /api/remuneracao/funcionario-beneficios/:id
 * Atualizar benefício do funcionário
 */
router.put('/funcionario-beneficios/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const { data, error } = await supabaseAdmin
      .from('funcionario_beneficios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Benefício atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar benefício:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar benefício',
      error: error.message
    })
  }
})

export default router

