/**
 * Rotas para gerenciamento de ordem de compras
 * Sistema de Gerenciamento de Gruas - Módulo Financeiro
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// ==================== ORDEM DE COMPRAS ====================

/**
 * POST /api/ordem-compras
 * Criar ordem de compras
 */
router.post('/', requirePermission('compras:criar'), async (req, res) => {
  try {
    const { solicitante_id, descricao, valor_total, aprovador_orcamento_id, responsavel_pagamento_id, aprovador_final_id } = req.body

    const schema = Joi.object({
      solicitante_id: Joi.number().integer().positive().required(),
      descricao: Joi.string().min(5).required(),
      valor_total: Joi.number().min(0).default(0),
      aprovador_orcamento_id: Joi.number().integer().positive().allow(null).optional(),
      responsavel_pagamento_id: Joi.number().integer().positive().allow(null).optional(),
      aprovador_final_id: Joi.number().integer().positive().allow(null).optional()
    })

    const { error: validationError } = schema.validate({ solicitante_id, descricao, valor_total, aprovador_orcamento_id, responsavel_pagamento_id, aprovador_final_id })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const { data, error } = await supabaseAdmin
      .from('ordem_compras')
      .insert({
        solicitante_id,
        descricao,
        valor_total,
        aprovador_orcamento_id,
        responsavel_pagamento_id,
        aprovador_final_id,
        status: 'rascunho'
      })
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao criar ordem de compras:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/ordem-compras
 * Listar ordens de compras
 */
router.get('/', async (req, res) => {
  try {
    const { status, solicitante_id, page = 1, limit = 50 } = req.query

    let query = supabaseAdmin
      .from('ordem_compras')
      .select(`
        *,
        funcionarios:solicitante_id(id, nome, cargo)
      `)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (solicitante_id) query = query.eq('solicitante_id', solicitante_id)

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    query = query.range(offset, offset + limitNum - 1)

    const { data, error } = await query

    if (error) throw error

    res.json({ success: true, data: data || [], page: pageNum, limit: limitNum })
  } catch (error) {
    console.error('Erro ao listar ordens de compras:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/ordem-compras/:id
 * Obter detalhes da ordem de compras
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data: ordem, error: ordemError } = await supabaseAdmin
      .from('ordem_compras')
      .select(`
        *,
        funcionarios:solicitante_id(id, nome, cargo),
        usuarios:aprovador_orcamento_id(id, nome, email),
        usuarios:responsavel_pagamento_id(id, nome, email),
        usuarios:aprovador_final_id(id, nome, email)
      `)
      .eq('id', id)
      .single()

    if (ordemError) throw ordemError

    // Buscar aprovações
    const { data: aprovacoes } = await supabaseAdmin
      .from('aprovacoes_ordem_compras')
      .select(`
        *,
        usuarios:aprovador_id(id, nome, email)
      `)
      .eq('ordem_id', id)
      .order('created_at', { ascending: true })

    res.json({ success: true, data: { ...ordem, aprovacoes: aprovacoes || [] } })
  } catch (error) {
    console.error('Erro ao obter ordem de compras:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * PUT /api/ordem-compras/:id
 * Atualizar ordem de compras
 */
router.put('/:id', requirePermission('compras:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { descricao, valor_total, aprovador_orcamento_id, responsavel_pagamento_id, aprovador_final_id } = req.body

    const updateData = {}
    if (descricao !== undefined) updateData.descricao = descricao
    if (valor_total !== undefined) updateData.valor_total = valor_total
    if (aprovador_orcamento_id !== undefined) updateData.aprovador_orcamento_id = aprovador_orcamento_id
    if (responsavel_pagamento_id !== undefined) updateData.responsavel_pagamento_id = responsavel_pagamento_id
    if (aprovador_final_id !== undefined) updateData.aprovador_final_id = aprovador_final_id

    const { data, error } = await supabaseAdmin
      .from('ordem_compras')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar ordem de compras:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

// ==================== FLUXO DE APROVAÇÃO ====================

/**
 * POST /api/ordem-compras/:id/enviar-orcamento
 * Enviar ordem para aprovação de orçamento
 */
router.post('/:id/enviar-orcamento', requirePermission('compras:editar'), async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se ordem existe
    const { data: ordem, error: ordemError } = await supabaseAdmin
      .from('ordem_compras')
      .select('*')
      .eq('id', id)
      .single()

    if (ordemError) throw ordemError

    if (ordem.status !== 'rascunho') {
      return res.status(400).json({ error: 'Ordem deve estar em rascunho para enviar para orçamento' })
    }

    // Atualizar status
    const { data: ordemAtualizada, error: updateError } = await supabaseAdmin
      .from('ordem_compras')
      .update({ status: 'aguardando_orcamento' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Criar registro de aprovação
    if (ordem.aprovador_orcamento_id) {
      await supabaseAdmin
        .from('aprovacoes_ordem_compras')
        .insert({
          ordem_id: id,
          etapa: 'orcamento',
          aprovador_id: ordem.aprovador_orcamento_id,
          status: 'pendente'
        })
    }

    res.json({ success: true, data: ordemAtualizada })
  } catch (error) {
    console.error('Erro ao enviar ordem para orçamento:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * POST /api/ordem-compras/:id/aprovar-orcamento
 * Aprovar orçamento da ordem
 */
router.post('/:id/aprovar-orcamento', requirePermission('compras:aprovar'), async (req, res) => {
  try {
    const { id } = req.params
    const { comentarios } = req.body
    const userId = req.user.id

    // Verificar se ordem existe e está no status correto
    const { data: ordem, error: ordemError } = await supabaseAdmin
      .from('ordem_compras')
      .select('*')
      .eq('id', id)
      .single()

    if (ordemError) throw ordemError

    if (!['aguardando_orcamento', 'orcamento_aprovado'].includes(ordem.status)) {
      return res.status(400).json({ error: 'Ordem não está aguardando aprovação de orçamento' })
    }

    // Atualizar aprovação
    await supabaseAdmin
      .from('aprovacoes_ordem_compras')
      .update({
        status: 'aprovado',
        comentarios,
        data_aprovacao: new Date().toISOString()
      })
      .eq('ordem_id', id)
      .eq('etapa', 'orcamento')
      .eq('aprovador_id', userId)
      .eq('status', 'pendente')

    // Atualizar status da ordem
    const { data: ordemAtualizada, error: updateError } = await supabaseAdmin
      .from('ordem_compras')
      .update({ status: 'orcamento_aprovado' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    res.json({ success: true, data: ordemAtualizada })
  } catch (error) {
    console.error('Erro ao aprovar orçamento:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * POST /api/ordem-compras/:id/enviar-financeiro
 * Enviar ordem para o financeiro
 */
router.post('/:id/enviar-financeiro', requirePermission('compras:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { data: ordem, error: ordemError } = await supabaseAdmin
      .from('ordem_compras')
      .select('*')
      .eq('id', id)
      .single()

    if (ordemError) throw ordemError

    if (ordem.status !== 'orcamento_aprovado') {
      return res.status(400).json({ error: 'Ordem deve ter orçamento aprovado' })
    }

    // Atualizar status
    const { data: ordemAtualizada, error: updateError } = await supabaseAdmin
      .from('ordem_compras')
      .update({ status: 'enviado_financeiro' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Criar registro de aprovação financeiro
    if (ordem.responsavel_pagamento_id) {
      await supabaseAdmin
        .from('aprovacoes_ordem_compras')
        .insert({
          ordem_id: id,
          etapa: 'financeiro',
          aprovador_id: ordem.responsavel_pagamento_id,
          status: 'pendente'
        })
    }

    res.json({ success: true, data: ordemAtualizada })
  } catch (error) {
    console.error('Erro ao enviar ordem para financeiro:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * POST /api/ordem-compras/:id/registrar-pagamento
 * Registrar pagamento da ordem
 */
router.post('/:id/registrar-pagamento', requirePermission('compras:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const { data: ordem, error: ordemError } = await supabaseAdmin
      .from('ordem_compras')
      .select('*')
      .eq('id', id)
      .single()

    if (ordemError) throw ordemError

    if (ordem.status !== 'enviado_financeiro') {
      return res.status(400).json({ error: 'Ordem deve estar enviada ao financeiro' })
    }

    // Atualizar aprovação financeiro
    await supabaseAdmin
      .from('aprovacoes_ordem_compras')
      .update({
        status: 'aprovado',
        data_aprovacao: new Date().toISOString()
      })
      .eq('ordem_id', id)
      .eq('etapa', 'financeiro')
      .eq('aprovador_id', userId)
      .eq('status', 'pendente')

    // Atualizar status da ordem
    const { data: ordemAtualizada, error: updateError } = await supabaseAdmin
      .from('ordem_compras')
      .update({ status: 'pagamento_registrado' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Se houver aprovador final, criar aprovação
    if (ordem.aprovador_final_id) {
      await supabaseAdmin
        .from('aprovacoes_ordem_compras')
        .insert({
          ordem_id: id,
          etapa: 'pagamento',
          aprovador_id: ordem.aprovador_final_id,
          status: 'pendente'
        })
    } else {
      // Se não houver aprovador final, finalizar direto
      await supabaseAdmin
        .from('ordem_compras')
        .update({ status: 'finalizada' })
        .eq('id', id)
    }

    res.json({ success: true, data: ordemAtualizada })
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * POST /api/ordem-compras/:id/aprovar-final
 * Aprovação final da ordem
 */
router.post('/:id/aprovar-final', requirePermission('compras:aprovar'), async (req, res) => {
  try {
    const { id } = req.params
    const { comentarios } = req.body
    const userId = req.user.id

    const { data: ordem, error: ordemError } = await supabaseAdmin
      .from('ordem_compras')
      .select('*')
      .eq('id', id)
      .single()

    if (ordemError) throw ordemError

    if (ordem.status !== 'pagamento_registrado') {
      return res.status(400).json({ error: 'Ordem deve ter pagamento registrado' })
    }

    // Atualizar aprovação
    await supabaseAdmin
      .from('aprovacoes_ordem_compras')
      .update({
        status: 'aprovado',
        comentarios,
        data_aprovacao: new Date().toISOString()
      })
      .eq('ordem_id', id)
      .eq('etapa', 'pagamento')
      .eq('aprovador_id', userId)
      .eq('status', 'pendente')

    // Finalizar ordem
    const { data: ordemAtualizada, error: updateError } = await supabaseAdmin
      .from('ordem_compras')
      .update({ status: 'finalizada' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    res.json({ success: true, data: ordemAtualizada })
  } catch (error) {
    console.error('Erro ao aprovar ordem final:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * POST /api/ordem-compras/:id/rejeitar
 * Rejeitar ordem em qualquer etapa
 */
router.post('/:id/rejeitar', requirePermission('compras:aprovar'), async (req, res) => {
  try {
    const { id } = req.params
    const { etapa, comentarios } = req.body
    const userId = req.user.id

    const schema = Joi.object({
      etapa: Joi.string().valid('orcamento', 'financeiro', 'pagamento').required(),
      comentarios: Joi.string().required()
    })

    const { error: validationError } = schema.validate({ etapa, comentarios })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    // Atualizar aprovação
    await supabaseAdmin
      .from('aprovacoes_ordem_compras')
      .update({
        status: 'rejeitado',
        comentarios,
        data_aprovacao: new Date().toISOString()
      })
      .eq('ordem_id', id)
      .eq('etapa', etapa)
      .eq('aprovador_id', userId)
      .eq('status', 'pendente')

    // Atualizar status da ordem
    const { data: ordemAtualizada, error: updateError } = await supabaseAdmin
      .from('ordem_compras')
      .update({ status: 'cancelada' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    res.json({ success: true, data: ordemAtualizada })
  } catch (error) {
    console.error('Erro ao rejeitar ordem:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/ordem-compras/pendentes/aprovacao
 * Listar ordens pendentes de aprovação do usuário logado
 */
router.get('/pendentes/aprovacao', async (req, res) => {
  try {
    const userId = req.user.id

    const { data, error } = await supabaseAdmin
      .from('aprovacoes_ordem_compras')
      .select(`
        *,
        ordem_compras(*, funcionarios:solicitante_id(id, nome))
      `)
      .eq('aprovador_id', userId)
      .eq('status', 'pendente')
      .order('created_at', { ascending: true })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar ordens pendentes:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

export default router

