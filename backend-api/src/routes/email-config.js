/**
 * ==============================================
 * Email Configuration Routes (Admin Panel)
 * ==============================================
 * Rotas para gerenciamento de configurações de email
 * pelo painel administrativo
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'
import { encrypt, decrypt, sendEmail, getEmailConfig, previewEmailTemplateByType, buildTestEmailContent } from '../services/email.service.js'

const router = express.Router()

// Middleware: Todas as rotas requerem autenticação
router.use(authenticateToken)

// TODO: Adicionar middleware para verificar se é admin

// ==================== SCHEMAS DE VALIDAÇÃO ====================

const updateConfigSchema = Joi.object({
  smtp_host: Joi.string().required(),
  smtp_port: Joi.number().integer().min(1).max(65535).required(),
  smtp_secure: Joi.boolean().required(),
  smtp_user: Joi.string().required(),
  smtp_pass: Joi.string().required(),
  email_from: Joi.string().email().required(),
  email_from_name: Joi.string().required(),
  email_enabled: Joi.boolean().required()
})

const updateTemplateSchema = Joi.object({
  assunto: Joi.string().max(500).required(),
  html_template: Joi.string().required(),
  ativo: Joi.boolean().required()
})

const previewTemplateSchema = Joi.object({
  assunto: Joi.string().allow('', null),
  html_template: Joi.string().allow('', null)
})

const createTemplateSchema = Joi.object({
  tipo: Joi.string()
    .pattern(/^[a-z0-9_]+$/)
    .min(3)
    .max(50)
    .required(),
  nome: Joi.string().max(255).required(),
  clone_from: Joi.string().max(50).allow('', null),
  assunto: Joi.string().max(500).allow('', null),
  html_template: Joi.string().allow('', null),
  variaveis: Joi.array().items(Joi.string()).default([]),
  ativo: Joi.boolean().default(true)
})

const testEmailSchema = Joi.object({
  tipo: Joi.string()
    .pattern(/^[a-z0-9_]+$/)
    .min(3)
    .max(50)
    .required(),
  destinatario: Joi.string().email().required(),
  dados_teste: Joi.object().optional()
})

// ==================== GET - Obter Configurações ====================

/**
 * @swagger
 * /api/email-config:
 *   get:
 *     summary: Obter configurações SMTP atuais
 *     tags: [Email Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configurações obtidas com sucesso
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_configs')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Configurações não encontradas'
      })
    }

    // Mascarar credenciais sensíveis
    const maskedConfig = {
      ...data,
      smtp_user: data.smtp_user ? data.smtp_user.substring(0, 3) + '***' : '',
      smtp_pass: '***'
    }

    res.json({
      success: true,
      data: maskedConfig
    })

  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar configurações'
    })
  }
})

// ==================== PUT - Atualizar Configurações ====================

/**
 * @swagger
 * /api/email-config:
 *   put:
 *     summary: Atualizar configurações SMTP
 *     tags: [Email Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Configurações atualizadas
 */
router.put('/', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = updateConfigSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Criptografar credenciais
    const encryptedConfig = {
      ...value,
      smtp_user: encrypt(value.smtp_user),
      smtp_pass: encrypt(value.smtp_pass),
      updated_by: req.user.id,
      updated_at: new Date().toISOString()
    }

    // Verificar se já existe configuração
    const { data: existing } = await supabaseAdmin
      .from('email_configs')
      .select('id')
      .limit(1)
      .single()

    let result

    if (existing) {
      // Atualizar existente
      const { data, error: updateError } = await supabaseAdmin
        .from('email_configs')
        .update(encryptedConfig)
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) throw updateError
      result = data
    } else {
      // Criar novo
      const { data, error: insertError } = await supabaseAdmin
        .from('email_configs')
        .insert(encryptedConfig)
        .select()
        .single()

      if (insertError) throw insertError
      result = data
    }

    // Retornar com credenciais mascaradas
    res.json({
      success: true,
      data: {
        ...result,
        smtp_user: value.smtp_user.substring(0, 3) + '***',
        smtp_pass: '***'
      },
      message: 'Configurações salvas com sucesso'
    })

  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao salvar configurações'
    })
  }
})

// ==================== GET - Listar Templates ====================

/**
 * @swagger
 * /api/email-config/templates:
 *   get:
 *     summary: Listar todos os templates de email
 *     tags: [Email Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de templates
 */
router.get('/templates', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .select('id, tipo, nome, assunto, html_template, variaveis, ativo, updated_at')
      .order('tipo', { ascending: true })

    if (error) throw error

    res.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Erro ao listar templates:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao listar templates'
    })
  }
})

// ==================== GET - Obter Template Específico ====================

/**
 * @swagger
 * /api/email-config/templates/{type}:
 *   get:
 *     summary: Obter template específico
 *     tags: [Email Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template obtido
 */
router.get('/templates/:type', async (req, res) => {
  try {
    const { type } = req.params

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('tipo', type)
      .single()

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      })
    }

    res.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Erro ao buscar template:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar template'
    })
  }
})

// ==================== POST - Criar Template ====================

router.post('/templates', async (req, res) => {
  try {
    const { error, value } = createTemplateSchema.validate(req.body, { stripUnknown: true })
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { tipo, nome, clone_from, assunto, html_template, variaveis, ativo } = value

    const TIPOS_RESERVADOS_SISTEMA = [
      'welcome',
      'reset_password',
      'password_changed',
      'medicao_enviada',
      'nota_fiscal_enviada',
      'notificacao_ponto_responsavel',
      'notificacao_ponto_pendente_generica',
      'notificacao_ponto_funcionario',
      'notificacao_ponto_rejeicao'
    ]
    if (TIPOS_RESERVADOS_SISTEMA.includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: 'Este identificador é reservado aos templates internos do sistema'
      })
    }

    const { data: existing } = await supabaseAdmin
      .from('email_templates')
      .select('id')
      .eq('tipo', tipo)
      .maybeSingle()

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Já existe um template com este identificador (tipo)'
      })
    }

    let assuntoVal = assunto ?? ''
    let htmlVal = html_template ?? ''
    let variaveisVal = Array.isArray(variaveis) ? variaveis : []

    if (clone_from && String(clone_from).trim()) {
      const { data: src, error: srcErr } = await supabaseAdmin
        .from('email_templates')
        .select('assunto, html_template, variaveis')
        .eq('tipo', clone_from.trim())
        .single()

      if (!srcErr && src) {
        if (!assuntoVal) assuntoVal = src.assunto || ''
        if (!htmlVal) htmlVal = src.html_template || ''
        if (!variaveisVal.length && src.variaveis) {
          variaveisVal = Array.isArray(src.variaveis) ? src.variaveis : []
        }
      }
    }

    if (!htmlVal.trim()) {
      htmlVal = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:24px;"><p>Olá, <strong>{{cliente_nome}}</strong>.</p><p>Edite este HTML e use variáveis entre chaves duplas.</p><p>— {{empresa}}</p></body></html>`
    }
    if (!assuntoVal.trim()) {
      assuntoVal = 'Novo template — {{empresa}}'
    }
    if (!variaveisVal.length) {
      variaveisVal = ['cliente_nome', 'empresa']
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('email_templates')
      .insert({
        tipo,
        nome,
        assunto: assuntoVal,
        html_template: htmlVal,
        variaveis: variaveisVal,
        ativo,
        updated_by: req.user.id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) throw insertError

    res.status(201).json({
      success: true,
      data,
      message: 'Template criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar template:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao criar template',
      details: error.message
    })
  }
})

// ==================== PUT - Atualizar Template ====================

/**
 * @swagger
 * /api/email-config/templates/{type}:
 *   put:
 *     summary: Atualizar template de email
 *     tags: [Email Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Template atualizado
 */
router.put('/templates/:type', async (req, res) => {
  try {
    const { type } = req.params

    // Validar dados
    const { error, value } = updateTemplateSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Atualizar template
    const { data, error: updateError } = await supabaseAdmin
      .from('email_templates')
      .update({
        ...value,
        updated_by: req.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('tipo', type)
      .select()
      .single()

    if (updateError) throw updateError

    res.json({
      success: true,
      data: data,
      message: 'Template atualizado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar template:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar template'
    })
  }
})

// ==================== POST - Preview do template (HTML renderizado, dados fictícios) ====================

router.post('/templates/:type/preview', async (req, res) => {
  try {
    const { type } = req.params

    const { error, value } = previewTemplateSchema.validate(req.body || {}, { stripUnknown: true })
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { assunto, html } = await previewEmailTemplateByType({
      tipo: type,
      assuntoDraft: value.assunto,
      htmlDraft: value.html_template
    })

    res.json({
      success: true,
      data: { assunto, html }
    })
  } catch (err) {
    console.error('Erro no preview do template:', err)
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar preview',
      details: err.message
    })
  }
})

// ==================== POST - Enviar Email de Teste ====================

/**
 * @swagger
 * /api/email-config/test:
 *   post:
 *     summary: Enviar email de teste
 *     tags: [Email Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Email enviado
 */
router.post('/test', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = testEmailSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const { tipo, destinatario, dados_teste } = value

    const { assunto, html } = await buildTestEmailContent({
      tipo,
      destinatario,
      dados_teste
    })

    await sendEmail({
      to: destinatario,
      subject: `[TESTE] ${assunto}`,
      html,
      tipo: 'test'
    })

    res.json({
      success: true,
      message: 'Email de teste enviado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao enviar email de teste:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar email de teste',
      details: error.message
    })
  }
})

// ==================== GET - Histórico de Emails ====================

/**
 * @swagger
 * /api/email-config/logs:
 *   get:
 *     summary: Obter histórico de emails enviados
 *     tags: [Email Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Histórico obtido
 */
router.get('/logs', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      tipo, 
      destinatario,
      data_inicio,
      data_fim
    } = req.query

    let query = supabaseAdmin
      .from('email_logs')
      .select('*', { count: 'exact' })

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }
    if (tipo) {
      query = query.eq('tipo', tipo)
    }
    if (destinatario) {
      query = query.ilike('destinatario', `%${destinatario}%`)
    }
    if (data_inicio) {
      query = query.gte('created_at', data_inicio)
    }
    if (data_fim) {
      query = query.lte('created_at', data_fim)
    }

    // Paginação
    const offset = (parseInt(page) - 1) * parseInt(limit)
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    const { data, error, count } = await query

    if (error) throw error

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    })

  } catch (error) {
    console.error('Erro ao buscar logs:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico'
    })
  }
})

// ==================== GET - Estatísticas de Email ====================

/**
 * @swagger
 * /api/email-config/stats:
 *   get:
 *     summary: Obter estatísticas de envio de emails
 *     tags: [Email Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas obtidas
 */
router.get('/stats', async (req, res) => {
  try {
    const { periodo = '30' } = req.query
    const dias = parseInt(periodo)
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - dias)

    // Total enviados
    const { count: totalEnviados } = await supabaseAdmin
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'enviado')
      .gte('created_at', dataInicio.toISOString())

    // Total falhas
    const { count: totalFalhas } = await supabaseAdmin
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'falha')
      .gte('created_at', dataInicio.toISOString())

    // Por tipo
    const { data: porTipo } = await supabaseAdmin
      .from('email_logs')
      .select('tipo')
      .eq('status', 'enviado')
      .gte('created_at', dataInicio.toISOString())

    const contagemPorTipo = {}
    porTipo?.forEach(item => {
      contagemPorTipo[item.tipo] = (contagemPorTipo[item.tipo] || 0) + 1
    })

    // Taxa de sucesso
    const total = totalEnviados + totalFalhas
    const taxaSucesso = total > 0 ? ((totalEnviados / total) * 100).toFixed(1) : 0

    res.json({
      success: true,
      data: {
        total_enviados: totalEnviados || 0,
        total_falhas: totalFalhas || 0,
        taxa_sucesso: parseFloat(taxaSucesso),
        por_tipo: contagemPorTipo
      }
    })

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas'
    })
  }
})

export default router

