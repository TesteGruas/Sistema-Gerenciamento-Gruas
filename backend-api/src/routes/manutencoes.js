/**
 * Rotas para gerenciamento de manutenções
 * Sistema de Gerenciamento de Gruas - Módulo Manutenções
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// ==================== ORDENS DE MANUTENÇÃO ====================

/**
 * POST /api/manutencoes
 * Criar ordem de manutenção
 */
router.post('/', requirePermission('gruas:editar'), async (req, res) => {
  try {
    const { grua_id, obra_id, tipo, descricao, responsavel_tecnico_id, data_prevista, prioridade, itens, anexos } = req.body

    const schema = Joi.object({
      grua_id: Joi.string().required(),
      obra_id: Joi.number().integer().positive().allow(null).optional(),
      tipo: Joi.string().valid('preventiva', 'corretiva', 'preditiva', 'emergencial').required(),
      descricao: Joi.string().required(),
      responsavel_tecnico_id: Joi.number().integer().positive().allow(null).optional(),
      data_prevista: Joi.date().allow(null).optional(),
      prioridade: Joi.string().valid('baixa', 'media', 'alta', 'critica').default('media'),
      itens: Joi.array().items(
        Joi.object({
          produto_id: Joi.string().allow(null, '').optional(),
          descricao: Joi.string().required(),
          quantidade: Joi.number().positive().required(),
          valor_unitario: Joi.number().min(0).required()
        })
      ).optional(),
      anexos: Joi.array().items(
        Joi.object({
          arquivo: Joi.string().required(),
          tipo: Joi.string().optional(),
          descricao: Joi.string().allow(null, '').optional()
        })
      ).optional()
    })

    const { error: validationError } = schema.validate({ grua_id, obra_id, tipo, descricao, responsavel_tecnico_id, data_prevista, prioridade, itens, anexos })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    // Calcular custo total
    let custo_total = 0
    if (itens && itens.length > 0) {
      custo_total = itens.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0)
    }

    // Criar ordem de manutenção
    const { data: ordem, error: ordemError } = await supabaseAdmin
      .from('manutencoes_ordens')
      .insert({
        grua_id,
        obra_id,
        tipo,
        descricao,
        responsavel_tecnico_id,
        data_prevista,
        prioridade,
        custo_total,
        status: 'agendada'
      })
      .select()
      .single()

    if (ordemError) throw ordemError

    // Criar itens se houver
    if (itens && itens.length > 0) {
      const itensData = itens.map(item => ({
        manutencao_id: ordem.id,
        produto_id: item.produto_id || null,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario
      }))

      const { error: itensError } = await supabaseAdmin
        .from('manutencoes_itens')
        .insert(itensData)

      if (itensError) throw itensError
    }

    // Criar anexos se houver
    if (anexos && anexos.length > 0) {
      const anexosData = anexos.map(anexo => ({
        manutencao_id: ordem.id,
        arquivo: anexo.arquivo,
        tipo: anexo.tipo || 'documento',
        descricao: anexo.descricao
      }))

      const { error: anexosError } = await supabaseAdmin
        .from('manutencoes_anexos')
        .insert(anexosData)

      if (anexosError) throw anexosError
    }

    res.json({ success: true, data: ordem })
  } catch (error) {
    console.error('Erro ao criar ordem de manutenção:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/manutencoes
 * Listar ordens de manutenção
 */
router.get('/', async (req, res) => {
  try {
    const { grua_id, obra_id, tipo, status, page = 1, limit = 50 } = req.query

    let query = supabaseAdmin
      .from('manutencoes_ordens')
      .select(`
        *,
        gruas(id, name, modelo),
        obras(id, nome),
        funcionarios:id(id, nome, cargo)
      `)
      .order('created_at', { ascending: false })

    if (grua_id) query = query.eq('grua_id', grua_id)
    if (obra_id) query = query.eq('obra_id', obra_id)
    if (tipo) query = query.eq('tipo', tipo)
    if (status) query = query.eq('status', status)

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    query = query.range(offset, offset + limitNum - 1)

    const { data, error } = await query

    if (error) throw error

    res.json({ success: true, data: data || [], page: pageNum, limit: limitNum })
  } catch (error) {
    console.error('Erro ao listar ordens de manutenção:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/manutencoes/:id
 * Obter detalhes da ordem de manutenção
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Buscar ordem
    const { data: ordem, error: ordemError } = await supabaseAdmin
      .from('manutencoes_ordens')
      .select(`
        *,
        gruas(id, name, modelo),
        obras(id, nome),
        funcionarios:id(id, nome, cargo)
      `)
      .eq('id', id)
      .single()

    if (ordemError) throw ordemError

    // Buscar itens
    const { data: itens } = await supabaseAdmin
      .from('manutencoes_itens')
      .select(`
        *,
        produtos(id, nome)
      `)
      .eq('manutencao_id', id)

    // Buscar anexos
    const { data: anexos } = await supabaseAdmin
      .from('manutencoes_anexos')
      .select('*')
      .eq('manutencao_id', id)

    res.json({ success: true, data: { ...ordem, itens: itens || [], anexos: anexos || [] } })
  } catch (error) {
    console.error('Erro ao obter ordem de manutenção:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * PUT /api/manutencoes/:id
 * Atualizar ordem de manutenção
 */
router.put('/:id', requirePermission('gruas:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, descricao, responsavel_tecnico_id, data_prevista, prioridade, status, data_inicio, data_fim, horas_trabalhadas, custo_mao_obra, observacoes } = req.body

    const updateData = {}
    if (tipo !== undefined) updateData.tipo = tipo
    if (descricao !== undefined) updateData.descricao = descricao
    if (responsavel_tecnico_id !== undefined) updateData.responsavel_tecnico_id = responsavel_tecnico_id
    if (data_prevista !== undefined) updateData.data_prevista = data_prevista
    if (prioridade !== undefined) updateData.prioridade = prioridade
    if (status !== undefined) updateData.status = status
    if (data_inicio !== undefined) updateData.data_inicio = data_inicio
    if (data_fim !== undefined) updateData.data_fim = data_fim
    if (horas_trabalhadas !== undefined) updateData.horas_trabalhadas = horas_trabalhadas
    if (custo_mao_obra !== undefined) updateData.custo_mao_obra = custo_mao_obra
    if (observacoes !== undefined) updateData.observacoes = observacoes

    // Recalcular custo total se necessário
    if (custo_mao_obra !== undefined) {
      const { data: itens } = await supabaseAdmin
        .from('manutencoes_itens')
        .select('valor_total')
        .eq('manutencao_id', id)

      const custoItens = itens?.reduce((sum, item) => sum + parseFloat(item.valor_total || 0), 0) || 0
      updateData.custo_total = custo_mao_obra + custoItens
    }

    const { data, error } = await supabaseAdmin
      .from('manutencoes_ordens')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar ordem de manutenção:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * POST /api/manutencoes/:id/itens
 * Adicionar item à ordem de manutenção
 */
router.post('/:id/itens', requirePermission('gruas:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { produto_id, descricao, quantidade, valor_unitario } = req.body

    const schema = Joi.object({
      produto_id: Joi.string().allow(null, '').optional(),
      descricao: Joi.string().required(),
      quantidade: Joi.number().positive().required(),
      valor_unitario: Joi.number().min(0).required()
    })

    const { error: validationError } = schema.validate({ produto_id, descricao, quantidade, valor_unitario })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const { data, error } = await supabaseAdmin
      .from('manutencoes_itens')
      .insert({
        manutencao_id: id,
        produto_id: produto_id || null,
        descricao,
        quantidade,
        valor_unitario
      })
      .select()
      .single()

    if (error) throw error

    // Atualizar custo total da ordem
    const { data: ordem } = await supabaseAdmin
      .from('manutencoes_ordens')
      .select('custo_mao_obra')
      .eq('id', id)
      .single()

    const { data: itens } = await supabaseAdmin
      .from('manutencoes_itens')
      .select('valor_total')
      .eq('manutencao_id', id)

    const custoItens = itens?.reduce((sum, item) => sum + parseFloat(item.valor_total || 0), 0) || 0
    const custoTotal = (ordem?.custo_mao_obra || 0) + custoItens

    await supabaseAdmin
      .from('manutencoes_ordens')
      .update({ custo_total: custoTotal })
      .eq('id', id)

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao adicionar item:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

// ==================== AGENDA PREVENTIVA ====================

/**
 * POST /api/manutencoes/agenda-preventiva
 * Criar registro na agenda preventiva
 */
router.post('/agenda-preventiva', requirePermission('gruas:editar'), async (req, res) => {
  try {
    const { grua_id, tipo_manutencao, intervalo_tipo, intervalo_valor, ultima_manutencao_horimetro, ultima_manutencao_data } = req.body

    const schema = Joi.object({
      grua_id: Joi.string().required(),
      tipo_manutencao: Joi.string().required(),
      intervalo_tipo: Joi.string().valid('horas', 'dias', 'meses', 'km').required(),
      intervalo_valor: Joi.number().integer().positive().required(),
      ultima_manutencao_horimetro: Joi.number().integer().min(0).allow(null).optional(),
      ultima_manutencao_data: Joi.date().allow(null).optional()
    })

    const { error: validationError } = schema.validate({ grua_id, tipo_manutencao, intervalo_tipo, intervalo_valor, ultima_manutencao_horimetro, ultima_manutencao_data })
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    // Calcular próxima manutenção
    let proxima_manutencao_horimetro = null
    let proxima_manutencao_data = null

    if (ultima_manutencao_horimetro) {
      proxima_manutencao_horimetro = ultima_manutencao_horimetro + intervalo_valor
    }

    if (ultima_manutencao_data) {
      const proximaData = new Date(ultima_manutencao_data)
      if (intervalo_tipo === 'dias') {
        proximaData.setDate(proximaData.getDate() + intervalo_valor)
      } else if (intervalo_tipo === 'meses') {
        proximaData.setMonth(proximaData.getMonth() + intervalo_valor)
      }
      proxima_manutencao_data = proximaData.toISOString().split('T')[0]
    }

    const { data, error } = await supabaseAdmin
      .from('manutencoes_agenda_preventiva')
      .insert({
        grua_id,
        tipo_manutencao,
        intervalo_tipo,
        intervalo_valor,
        ultima_manutencao_horimetro,
        ultima_manutencao_data,
        proxima_manutencao_horimetro,
        proxima_manutencao_data
      })
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao criar agenda preventiva:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/manutencoes/agenda-preventiva/:grua_id
 * Listar agenda preventiva da grua
 */
router.get('/agenda-preventiva/:grua_id', async (req, res) => {
  try {
    const { grua_id } = req.params

    const { data, error } = await supabaseAdmin
      .from('manutencoes_agenda_preventiva')
      .select('*')
      .eq('grua_id', grua_id)
      .eq('ativo', true)
      .order('proxima_manutencao_data', { ascending: true })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar agenda preventiva:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * GET /api/manutencoes/agenda-preventiva/proximas
 * Listar manutenções preventivas próximas (30 dias)
 */
router.get('/agenda-preventiva/proximas', async (req, res) => {
  try {
    const hoje = new Date()
    const limite = new Date()
    limite.setDate(hoje.getDate() + 30)

    const { data, error } = await supabaseAdmin
      .from('manutencoes_agenda_preventiva')
      .select(`
        *,
        gruas(id, name, modelo, horas_operacao)
      `)
      .eq('ativo', true)
      .not('proxima_manutencao_data', 'is', null)
      .gte('proxima_manutencao_data', hoje.toISOString().split('T')[0])
      .lte('proxima_manutencao_data', limite.toISOString().split('T')[0])
      .order('proxima_manutencao_data', { ascending: true })

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Erro ao listar manutenções próximas:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

/**
 * PUT /api/manutencoes/agenda-preventiva/:id
 * Atualizar agenda preventiva
 */
router.put('/agenda-preventiva/:id', requirePermission('gruas:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { ultima_manutencao_horimetro, ultima_manutencao_data, ativo } = req.body

    const updateData = {}
    if (ultima_manutencao_horimetro !== undefined) {
      updateData.ultima_manutencao_horimetro = ultima_manutencao_horimetro
      // Recalcular próxima manutenção
      const { data: agenda } = await supabaseAdmin
        .from('manutencoes_agenda_preventiva')
        .select('intervalo_tipo, intervalo_valor')
        .eq('id', id)
        .single()

      if (agenda && agenda.intervalo_tipo === 'horas') {
        updateData.proxima_manutencao_horimetro = ultima_manutencao_horimetro + agenda.intervalo_valor
      }
    }

    if (ultima_manutencao_data !== undefined) {
      updateData.ultima_manutencao_data = ultima_manutencao_data
      // Recalcular próxima manutenção
      const { data: agenda } = await supabaseAdmin
        .from('manutencoes_agenda_preventiva')
        .select('intervalo_tipo, intervalo_valor')
        .eq('id', id)
        .single()

      if (agenda) {
        const proximaData = new Date(ultima_manutencao_data)
        if (agenda.intervalo_tipo === 'dias') {
          proximaData.setDate(proximaData.getDate() + agenda.intervalo_valor)
        } else if (agenda.intervalo_tipo === 'meses') {
          proximaData.setMonth(proximaData.getMonth() + agenda.intervalo_valor)
        }
        updateData.proxima_manutencao_data = proximaData.toISOString().split('T')[0]
      }
    }

    if (ativo !== undefined) updateData.ativo = ativo

    const { data, error } = await supabaseAdmin
      .from('manutencoes_agenda_preventiva')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar agenda preventiva:', error)
    res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
  }
})

export default router

