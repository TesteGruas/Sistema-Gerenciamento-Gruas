/**
 * Rotas para gerenciamento de documentos de funcionários
 * Sistema de Gerenciamento de Gruas - Módulo RH
 * Gerencia: RG, CPF, CTPS, PIS, Título de Eleitor, Reservista, CNH, etc.
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação
router.use(authenticateToken)

// Schema de validação para documentos
const documentoSchema = Joi.object({
  funcionario_id: Joi.number().integer().positive().required(),
  tipo: Joi.string().valid(
    'rg', 'cpf', 'ctps', 'pis', 'pasep',
    'titulo_eleitor', 'certificado_reservista', 
    'cnh', 'certificado_aso', 'certificado_nr',
    'comprovante_residencia', 'certidao_nascimento',
    'certidao_casamento', 'outros'
  ).required(),
  nome: Joi.string().min(2).max(255).required(),
  numero: Joi.string().min(1).max(100).required(),
  orgao_emissor: Joi.string().max(100).allow(null, '').optional(),
  data_emissao: Joi.date().allow(null).optional(),
  data_vencimento: Joi.date().allow(null).optional(),
  arquivo_url: Joi.string().uri().allow(null, '').optional(),
  observacoes: Joi.string().allow(null, '').optional()
})

// Schema para atualização (funcionario_id e tipo não podem ser alterados)
const documentoUpdateSchema = documentoSchema.fork(
  ['funcionario_id', 'tipo'],
  (schema) => schema.optional()
).append({
  id: Joi.number().integer().positive().required()
})

// ============== LISTAR DOCUMENTOS ==============

/**
 * GET /api/funcionarios/documentos
 * Listar documentos de funcionários
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      funcionario_id,
      tipo
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    let query = supabaseAdmin
      .from('funcionario_documentos')
      .select('*, funcionarios(nome, cpf)', { count: 'exact' })

    // Filtros
    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id)
    }

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    // Paginação e ordenação
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
        total: count,
        totalPages: Math.ceil(count / limitNum)
      }
    })
  } catch (error) {
    console.error('Erro ao listar documentos:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar documentos',
      error: error.message
    })
  }
})

// ============== OBTER DOCUMENTO ==============

/**
 * GET /api/funcionarios/documentos/:id
 * Obter documento específico
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('funcionario_documentos')
      .select('*, funcionarios(nome, cpf, cargo)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Documento não encontrado'
        })
      }
      throw error
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao obter documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao obter documento',
      error: error.message
    })
  }
})

// ============== CRIAR DOCUMENTO ==============

/**
 * POST /api/funcionarios/documentos
 * Criar novo documento
 */
router.post('/', async (req, res) => {
  try {
    // Validação
    const { error: validationError, value } = documentoSchema.validate(req.body)
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details.map(d => d.message)
      })
    }

    // Verificar se funcionário existe
    const { data: funcionario } = await supabaseAdmin
      .from('funcionarios')
      .select('id')
      .eq('id', value.funcionario_id)
      .single()

    if (!funcionario) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado'
      })
    }

    // Inserir documento
    const { data, error } = await supabaseAdmin
      .from('funcionario_documentos')
      .insert(value)
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data,
      message: 'Documento criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar documento',
      error: error.message
    })
  }
})

// ============== ATUALIZAR DOCUMENTO ==============

/**
 * PUT /api/funcionarios/documentos/:id
 * Atualizar documento existente
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validação
    const { error: validationError, value } = documentoUpdateSchema.validate({
      ...req.body,
      id: parseInt(id)
    })

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details.map(d => d.message)
      })
    }

    // Verificar se documento existe
    const { data: existing } = await supabaseAdmin
      .from('funcionario_documentos')
      .select('id')
      .eq('id', id)
      .single()

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      })
    }

    // Remover campos que não podem ser atualizados
    const { id: _, funcionario_id, ...updateData } = value
    updateData.updated_at = new Date().toISOString()

    // Atualizar documento
    const { data, error } = await supabaseAdmin
      .from('funcionario_documentos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      data,
      message: 'Documento atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar documento',
      error: error.message
    })
  }
})

// ============== EXCLUIR DOCUMENTO ==============

/**
 * DELETE /api/funcionarios/documentos/:id
 * Excluir documento
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se documento existe
    const { data: existing } = await supabaseAdmin
      .from('funcionario_documentos')
      .select('id, nome, tipo')
      .eq('id', id)
      .single()

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      })
    }

    // Excluir documento
    const { error } = await supabaseAdmin
      .from('funcionario_documentos')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({
      success: true,
      message: `Documento ${existing.nome} excluído com sucesso`
    })
  } catch (error) {
    console.error('Erro ao excluir documento:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir documento',
      error: error.message
    })
  }
})

// ============== LISTAR DOCUMENTOS POR FUNCIONÁRIO ==============

/**
 * GET /api/funcionarios/:funcionario_id/documentos
 * Listar todos os documentos de um funcionário específico
 */
router.get('/funcionario/:funcionario_id', async (req, res) => {
  try {
    const { funcionario_id } = req.params

    // Verificar se funcionário existe
    const { data: funcionario } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome')
      .eq('id', funcionario_id)
      .single()

    if (!funcionario) {
      return res.status(404).json({
        success: false,
        message: 'Funcionário não encontrado'
      })
    }

    // Buscar documentos
    const { data, error } = await supabaseAdmin
      .from('funcionario_documentos')
      .select('*')
      .eq('funcionario_id', funcionario_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({
      success: true,
      data,
      funcionario: funcionario.nome
    })
  } catch (error) {
    console.error('Erro ao listar documentos do funcionário:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar documentos do funcionário',
      error: error.message
    })
  }
})

export default router

