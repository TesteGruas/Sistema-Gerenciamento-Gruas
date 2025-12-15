/**
 * ==============================================
 * Configurações do Sistema Routes
 * ==============================================
 * Rotas para gerenciamento de configurações gerais do sistema
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Middleware: Todas as rotas requerem autenticação
router.use(authenticateToken)

// ==================== SCHEMAS DE VALIDAÇÃO ====================

const updateConfigSchema = Joi.object({
  valor: Joi.string().required(),
  descricao: Joi.string().optional()
})

// ==================== GET - Obter Configuração ====================

/**
 * @swagger
 * /api/configuracoes/{chave}:
 *   get:
 *     summary: Obter valor de uma configuração
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chave
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave da configuração
 *     responses:
 *       200:
 *         description: Configuração obtida com sucesso
 */
router.get('/:chave', async (req, res) => {
  try {
    const { chave } = req.params

    const { data, error } = await supabaseAdmin
      .from('configuracoes')
      .select('*')
      .eq('chave', chave)
      .maybeSingle()

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar configuração',
        message: error.message
      })
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Configuração não encontrada'
      })
    }

    // Converter valor baseado no tipo
    let valor = data.valor
    if (data.tipo === 'boolean') {
      valor = data.valor === 'true'
    } else if (data.tipo === 'number') {
      valor = parseFloat(data.valor)
    }

    res.json({
      success: true,
      data: {
        chave: data.chave,
        valor,
        tipo: data.tipo,
        descricao: data.descricao
      }
    })

  } catch (error) {
    console.error('Erro ao buscar configuração:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// ==================== GET - Listar Todas as Configurações ====================

/**
 * @swagger
 * /api/configuracoes:
 *   get:
 *     summary: Listar todas as configurações
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de configurações
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('configuracoes')
      .select('*')
      .order('chave', { ascending: true })

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar configurações',
        message: error.message
      })
    }

    // Converter valores baseado no tipo
    const configuracoes = (data || []).map(config => {
      let valor = config.valor
      if (config.tipo === 'boolean') {
        valor = config.valor === 'true'
      } else if (config.tipo === 'number') {
        valor = parseFloat(config.valor)
      }

      return {
        chave: config.chave,
        valor,
        tipo: config.tipo,
        descricao: config.descricao,
        created_at: config.created_at,
        updated_at: config.updated_at
      }
    })

    res.json({
      success: true,
      data: configuracoes
    })

  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// ==================== PUT - Atualizar Configuração ====================

/**
 * @swagger
 * /api/configuracoes/{chave}:
 *   put:
 *     summary: Atualizar configuração (apenas Admin)
 *     tags: [Configurações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chave
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave da configuração
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               valor:
 *                 type: string
 *               descricao:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configuração atualizada
 */
router.put('/:chave', requirePermission('usuarios:gerenciar'), async (req, res) => {
  try {
    const { chave } = req.params

    // Validar dados
    const { error: validationError, value } = updateConfigSchema.validate(req.body)
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: validationError.details[0].message
      })
    }

    // Verificar se configuração existe
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('configuracoes')
      .select('*')
      .eq('chave', chave)
      .maybeSingle()

    if (checkError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar configuração',
        message: checkError.message
      })
    }

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Configuração não encontrada'
      })
    }

    // Converter valor para string baseado no tipo
    let valorString = String(value.valor)
    if (existing.tipo === 'boolean') {
      valorString = value.valor === true || value.valor === 'true' ? 'true' : 'false'
    }

    // Atualizar configuração
    const updateData = {
      valor: valorString,
      updated_at: new Date().toISOString()
    }

    if (value.descricao !== undefined) {
      updateData.descricao = value.descricao
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('configuracoes')
      .update(updateData)
      .eq('chave', chave)
      .select()
      .single()

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar configuração',
        message: updateError.message
      })
    }

    // Converter valor de volta
    let valor = data.valor
    if (data.tipo === 'boolean') {
      valor = data.valor === 'true'
    } else if (data.tipo === 'number') {
      valor = parseFloat(data.valor)
    }

    res.json({
      success: true,
      data: {
        chave: data.chave,
        valor,
        tipo: data.tipo,
        descricao: data.descricao
      },
      message: 'Configuração atualizada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar configuração:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router

