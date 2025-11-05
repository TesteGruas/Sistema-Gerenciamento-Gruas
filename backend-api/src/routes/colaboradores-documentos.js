/**
 * Rotas para gerenciamento de documentos e certificados de colaboradores
 * Sistema de Gerenciamento de Gruas - Módulo RH
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// ==================== CERTIFICADOS ====================

/**
 * POST /api/colaboradores/:id/certificados
 * Criar certificado para colaborador
 */
router.post('/:id/certificados', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, nome, data_validade, arquivo } = req.body

    const schema = Joi.object({
      tipo: Joi.string().required(),
      nome: Joi.string().min(2).required(),
      data_validade: Joi.date().allow(null).optional(),
      arquivo: Joi.string().allow(null, '').optional()
    })

    const { error: validationError } = schema.validate({ tipo, nome, data_validade, arquivo })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const { data, error } = await supabaseAdmin
      .from('certificados_colaboradores')
      .insert({
        funcionario_id: parseInt(id),
        tipo,
        nome,
        data_validade,
        arquivo
      })
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao criar certificado:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/colaboradores/:id/certificados
 * Listar certificados do colaborador
 */
router.get('/:id/certificados', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('certificados_colaboradores')
      .select('*')
      .eq('funcionario_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar certificados:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * PUT /api/certificados/:id
 * Atualizar certificado
 */
router.put('/certificados/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, nome, data_validade, arquivo } = req.body

    const schema = Joi.object({
      tipo: Joi.string().optional(),
      nome: Joi.string().min(2).optional(),
      data_validade: Joi.date().allow(null).optional(),
      arquivo: Joi.string().allow(null, '').optional()
    })

    const { error: validationError } = schema.validate({ tipo, nome, data_validade, arquivo })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const updateData = {}
    if (tipo !== undefined) updateData.tipo = tipo
    if (nome !== undefined) updateData.nome = nome
    if (data_validade !== undefined) updateData.data_validade = data_validade
    if (arquivo !== undefined) updateData.arquivo = arquivo

    const { data, error } = await supabaseAdmin
      .from('certificados_colaboradores')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar certificado:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * DELETE /api/certificados/:id
 * Excluir certificado
 */
router.delete('/certificados/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('certificados_colaboradores')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Certificado excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir certificado:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/certificados/vencendo
 * Listar certificados vencendo em até 30 dias
 */
router.get('/certificados/vencendo', async (req, res) => {
  try {
    const hoje = new Date()
    const limite = new Date()
    limite.setDate(hoje.getDate() + 30)

    const { data, error } = await supabaseAdmin
      .from('certificados_colaboradores')
      .select(`
        *,
        funcionarios(id, nome, cargo)
      `)
      .not('data_validade', 'is', null)
      .gte('data_validade', hoje.toISOString().split('T')[0])
      .lte('data_validade', limite.toISOString().split('T')[0])
      .eq('alerta_enviado', false)
      .order('data_validade', { ascending: true })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar certificados vencendo:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

// ==================== DOCUMENTOS ADMISSIONAIS ====================

/**
 * POST /api/colaboradores/:id/documentos-admissionais
 * Criar documento admissional para colaborador
 */
router.post('/:id/documentos-admissionais', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, data_validade, arquivo } = req.body

    const schema = Joi.object({
      tipo: Joi.string().required(),
      data_validade: Joi.date().allow(null).optional(),
      arquivo: Joi.string().required()
    })

    const { error: validationError } = schema.validate({ tipo, data_validade, arquivo })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const { data, error } = await supabaseAdmin
      .from('documentos_admissionais')
      .insert({
        funcionario_id: parseInt(id),
        tipo,
        data_validade,
        arquivo
      })
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao criar documento admissional:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/colaboradores/:id/documentos-admissionais
 * Listar documentos admissionais do colaborador
 */
router.get('/:id/documentos-admissionais', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('documentos_admissionais')
      .select('*')
      .eq('funcionario_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar documentos admissionais:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * PUT /api/documentos-admissionais/:id
 * Atualizar documento admissional
 */
router.put('/documentos-admissionais/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, data_validade, arquivo } = req.body

    const updateData = {}
    if (tipo !== undefined) updateData.tipo = tipo
    if (data_validade !== undefined) updateData.data_validade = data_validade
    if (arquivo !== undefined) updateData.arquivo = arquivo

    const { data, error } = await supabaseAdmin
      .from('documentos_admissionais')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar documento admissional:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * DELETE /api/documentos-admissionais/:id
 * Excluir documento admissional
 */
router.delete('/documentos-admissionais/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('documentos_admissionais')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Documento admissional excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir documento admissional:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/documentos-admissionais/vencendo
 * Listar documentos admissionais vencendo em até 30 dias
 */
router.get('/documentos-admissionais/vencendo', async (req, res) => {
  try {
    const hoje = new Date()
    const limite = new Date()
    limite.setDate(hoje.getDate() + 30)

    const { data, error } = await supabaseAdmin
      .from('documentos_admissionais')
      .select(`
        *,
        funcionarios(id, nome, cargo)
      `)
      .not('data_validade', 'is', null)
      .gte('data_validade', hoje.toISOString().split('T')[0])
      .lte('data_validade', limite.toISOString().split('T')[0])
      .eq('alerta_enviado', false)
      .order('data_validade', { ascending: true })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar documentos admissionais vencendo:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

// ==================== HOLERITES ====================

/**
 * POST /api/colaboradores/:id/holerites
 * Upload de holerite para colaborador
 */
router.post('/:id/holerites', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { mes_referencia, arquivo } = req.body

    const schema = Joi.object({
      mes_referencia: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
      arquivo: Joi.string().required()
    })

    const { error: validationError } = schema.validate({ mes_referencia, arquivo })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    // Verificar se já existe holerite para este mês
    const { data: existing } = await supabaseAdmin
      .from('holerites')
      .select('id')
      .eq('funcionario_id', id)
      .eq('mes_referencia', mes_referencia)
      .single()

    let result
    if (existing) {
      // Atualizar existente
      const { data, error } = await supabaseAdmin
        .from('holerites')
        .update({ arquivo })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Criar novo
      const { data, error } = await supabaseAdmin
        .from('holerites')
        .insert({
          funcionario_id: parseInt(id),
          mes_referencia,
          arquivo
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Erro ao salvar holerite:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/colaboradores/:id/holerites
 * Listar holerites do colaborador
 */
router.get('/:id/holerites', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('holerites')
      .select('*')
      .eq('funcionario_id', id)
      .order('mes_referencia', { ascending: false })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar holerites:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * PUT /api/holerites/:id/assinatura
 * Adicionar assinatura digital ao holerite
 */
router.put('/holerites/:id/assinatura', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { assinatura_digital } = req.body
    const userId = req.user.id

    const schema = Joi.object({
      assinatura_digital: Joi.string().required()
    })

    const { error: validationError } = schema.validate({ assinatura_digital })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const { data, error } = await supabaseAdmin
      .from('holerites')
      .update({
        assinatura_digital,
        assinado_em: new Date().toISOString(),
        assinado_por: userId
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao assinar holerite:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * DELETE /api/holerites/:id
 * Excluir holerite
 */
router.delete('/holerites/:id', requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('holerites')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Holerite excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir holerite:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

export default router

