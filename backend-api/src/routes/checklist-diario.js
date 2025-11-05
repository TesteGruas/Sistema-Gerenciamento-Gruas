/**
 * Rotas para gerenciamento de checklist diário
 * Sistema de Gerenciamento de Gruas - Módulo Obras
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// ==================== MODELOS DE CHECKLIST ====================

/**
 * POST /api/checklist-diario/modelos
 * Criar modelo de checklist para obra
 */
router.post('/modelos', requirePermission('obras:editar'), async (req, res) => {
  try {
    const { obra_id, nome, descricao, itens } = req.body

    const schema = Joi.object({
      obra_id: Joi.number().integer().positive().required(),
      nome: Joi.string().min(2).required(),
      descricao: Joi.string().allow(null, '').optional(),
      itens: Joi.array().items(
        Joi.object({
          ordem: Joi.number().integer().positive().required(),
          categoria: Joi.string().required(),
          descricao: Joi.string().required(),
          obrigatorio: Joi.boolean().default(false),
          permite_anexo: Joi.boolean().default(false)
        })
      ).min(1).required()
    })

    const { error: validationError } = schema.validate({ obra_id, nome, descricao, itens })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    // Criar modelo
    const { data: modelo, error: modeloError } = await supabaseAdmin
      .from('checklists_modelos')
      .insert({ obra_id, nome, descricao })
      .select()
      .single()

    if (modeloError) throw modeloError

    // Criar itens do modelo
    const itensData = itens.map(item => ({
      modelo_id: modelo.id,
      ...item
    }))

    const { data: itensCriados, error: itensError } = await supabaseAdmin
      .from('checklist_itens')
      .insert(itensData)
      .select()

    if (itensError) throw itensError

    res.json({ success: true, data: { ...modelo, itens: itensCriados } })
  } catch (error) {
    console.error('Erro ao criar modelo de checklist:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/checklist-diario/modelos/:obra_id
 * Listar modelos de checklist da obra
 */
router.get('/modelos/:obra_id', async (req, res) => {
  try {
    const { obra_id } = req.params

    const { data: modelos, error: modelosError } = await supabaseAdmin
      .from('checklists_modelos')
      .select('*')
      .eq('obra_id', obra_id)
      .eq('ativo', true)
      .order('created_at', { ascending: false })

    if (modelosError) throw modelosError

    // Buscar itens de cada modelo
    const modelosComItens = await Promise.all(
      modelos.map(async (modelo) => {
        const { data: itens } = await supabaseAdmin
          .from('checklist_itens')
          .select('*')
          .eq('modelo_id', modelo.id)
          .order('ordem', { ascending: true })

        return { ...modelo, itens: itens || [] }
      })
    )

    res.json({ success: true, data: modelosComItens })
  } catch (error) {
    console.error('Erro ao listar modelos de checklist:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * PUT /api/checklist-diario/modelos/:id
 * Atualizar modelo de checklist
 */
router.put('/modelos/:id', requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { nome, descricao, ativo, itens } = req.body

    const updateData = {}
    if (nome !== undefined) updateData.nome = nome
    if (descricao !== undefined) updateData.descricao = descricao
    if (ativo !== undefined) updateData.ativo = ativo

    const { data: modelo, error: modeloError } = await supabaseAdmin
      .from('checklists_modelos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (modeloError) throw modeloError

    // Se itens foram fornecidos, atualizar
    if (itens && Array.isArray(itens)) {
      // Deletar itens existentes
      await supabaseAdmin
        .from('checklist_itens')
        .delete()
        .eq('modelo_id', id)

      // Inserir novos itens
      const itensData = itens.map(item => ({
        modelo_id: id,
        ordem: item.ordem,
        categoria: item.categoria,
        descricao: item.descricao,
        obrigatorio: item.obrigatorio || false,
        permite_anexo: item.permite_anexo || false
      }))

      await supabaseAdmin
        .from('checklist_itens')
        .insert(itensData)
    }

    res.json({ success: true, data: modelo })
  } catch (error) {
    console.error('Erro ao atualizar modelo de checklist:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * DELETE /api/checklist-diario/modelos/:id
 * Desativar modelo de checklist
 */
router.delete('/modelos/:id', requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('checklists_modelos')
      .update({ ativo: false })
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Modelo desativado com sucesso' })
  } catch (error) {
    console.error('Erro ao desativar modelo:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

// ==================== CHECKLISTS DIÁRIOS ====================

/**
 * POST /api/checklist-diario
 * Criar checklist diário
 */
router.post('/', requirePermission('obras:editar'), async (req, res) => {
  try {
    const { obra_id, modelo_id, data, responsavel_id, respostas } = req.body

    const schema = Joi.object({
      obra_id: Joi.number().integer().positive().required(),
      modelo_id: Joi.string().uuid().required(),
      data: Joi.date().required(),
      responsavel_id: Joi.number().integer().positive().required(),
      respostas: Joi.array().items(
        Joi.object({
          item_id: Joi.string().uuid().required(),
          status: Joi.string().valid('ok', 'nao_conforme', 'nao_aplicavel').required(),
          observacao: Joi.string().allow(null, '').optional(),
          plano_acao: Joi.string().allow(null, '').optional(),
          responsavel_correcao_id: Joi.number().integer().positive().allow(null).optional(),
          prazo_correcao: Joi.date().allow(null).optional(),
          anexos: Joi.array().items(Joi.string()).optional()
        })
      ).min(1).required()
    })

    const { error: validationError } = schema.validate({ obra_id, modelo_id, data, responsavel_id, respostas })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    // Verificar se já existe checklist para esta obra, data e modelo
    const { data: existing } = await supabaseAdmin
      .from('checklists_diarios')
      .select('id')
      .eq('obra_id', obra_id)
      .eq('data', data)
      .eq('modelo_id', modelo_id)
      .single()

    if (existing) {
      return res.status(400).json({ error: 'Já existe checklist para esta obra, data e modelo' })
    }

    // Criar checklist diário
    const { data: checklist, error: checklistError } = await supabaseAdmin
      .from('checklists_diarios')
      .insert({
        obra_id,
        modelo_id,
        data,
        responsavel_id,
        status: 'concluido'
      })
      .select()
      .single()

    if (checklistError) throw checklistError

    // Criar respostas
    const respostasData = respostas.map(resposta => ({
      checklist_id: checklist.id,
      item_id: resposta.item_id,
      status: resposta.status,
      observacao: resposta.observacao,
      plano_acao: resposta.plano_acao,
      responsavel_correcao_id: resposta.responsavel_correcao_id,
      prazo_correcao: resposta.prazo_correcao,
      status_correcao: resposta.status === 'nao_conforme' ? 'pendente' : null
    }))

    const { data: respostasCriadas, error: respostasError } = await supabaseAdmin
      .from('checklist_respostas')
      .insert(respostasData)
      .select()

    if (respostasError) throw respostasError

    // Criar anexos se houver
    if (respostas.some(r => r.anexos && r.anexos.length > 0)) {
      const anexosData = []
      respostas.forEach((resposta, index) => {
        if (resposta.anexos && resposta.anexos.length > 0) {
          resposta.anexos.forEach(arquivo => {
            anexosData.push({
              resposta_id: respostasCriadas[index].id,
              arquivo,
              tipo: 'imagem'
            })
          })
        }
      })

      if (anexosData.length > 0) {
        await supabaseAdmin
          .from('checklist_anexos')
          .insert(anexosData)
      }
    }

    res.json({ success: true, data: { ...checklist, respostas: respostasCriadas } })
  } catch (error) {
    console.error('Erro ao criar checklist diário:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/checklist-diario/:obra_id
 * Listar checklists diários da obra
 */
router.get('/:obra_id', async (req, res) => {
  try {
    const { obra_id } = req.params
    const { data_inicio, data_fim } = req.query

    let query = supabaseAdmin
      .from('checklists_diarios')
      .select(`
        *,
        checklists_modelos(nome, descricao),
        funcionarios(id, nome, cargo)
      `)
      .eq('obra_id', obra_id)
      .order('data', { ascending: false })

    if (data_inicio) {
      query = query.gte('data', data_inicio)
    }
    if (data_fim) {
      query = query.lte('data', data_fim)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar checklists diários:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/checklist-diario/detalhes/:id
 * Obter detalhes completos do checklist
 */
router.get('/detalhes/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Buscar checklist
    const { data: checklist, error: checklistError } = await supabaseAdmin
      .from('checklists_diarios')
      .select(`
        *,
        checklists_modelos(*),
        funcionarios(id, nome, cargo)
      `)
      .eq('id', id)
      .single()

    if (checklistError) throw checklistError

    // Buscar respostas
    const { data: respostas, error: respostasError } = await supabaseAdmin
      .from('checklist_respostas')
      .select(`
        *,
        checklist_itens(*),
        funcionarios:responsavel_correcao_id(id, nome)
      `)
      .eq('checklist_id', id)
      .order('created_at', { ascending: true })

    if (respostasError) throw respostasError

    // Buscar anexos
    const respostaIds = respostas.map(r => r.id)
    const { data: anexos } = await supabaseAdmin
      .from('checklist_anexos')
      .select('*')
      .in('resposta_id', respostaIds)

    // Agrupar anexos por resposta
    const anexosPorResposta = {}
    anexos?.forEach(anexo => {
      if (!anexosPorResposta[anexo.resposta_id]) {
        anexosPorResposta[anexo.resposta_id] = []
      }
      anexosPorResposta[anexo.resposta_id].push(anexo)
    })

    const respostasComAnexos = respostas.map(resposta => ({
      ...resposta,
      anexos: anexosPorResposta[resposta.id] || []
    }))

    res.json({ success: true, data: { ...checklist, respostas: respostasComAnexos } })
  } catch (error) {
    console.error('Erro ao obter detalhes do checklist:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

// ==================== NÃO CONFORMIDADES ====================

/**
 * PUT /api/checklist-diario/nc/:id/atualizar-status
 * Atualizar status de correção de não conformidade
 */
router.put('/nc/:id/atualizar-status', requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { status_correcao } = req.body

    const schema = Joi.object({
      status_correcao: Joi.string().valid('pendente', 'em_andamento', 'concluido', 'cancelado').required()
    })

    const { error: validationError } = schema.validate({ status_correcao })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const { data, error } = await supabaseAdmin
      .from('checklist_respostas')
      .update({ status_correcao })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar status de correção:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/checklist-diario/nc/:obra_id
 * Listar não conformidades pendentes da obra
 */
router.get('/nc/:obra_id', async (req, res) => {
  try {
    const { obra_id } = req.params

    const { data, error } = await supabaseAdmin
      .from('checklist_respostas')
      .select(`
        *,
        checklists_diarios(obra_id, data, funcionarios(id, nome)),
        checklist_itens(categoria, descricao),
        funcionarios:responsavel_correcao_id(id, nome, cargo)
      `)
      .eq('status', 'nao_conforme')
      .in('status_correcao', ['pendente', 'em_andamento'])
      .eq('checklists_diarios.obra_id', obra_id)
      .order('prazo_correcao', { ascending: true })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar não conformidades:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

export default router

