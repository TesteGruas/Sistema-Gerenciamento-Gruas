import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para criação de item
const itemSchema = Joi.object({
  codigo: Joi.string().min(1).max(20).required(),
  descricao: Joi.string().min(1).max(255).required(),
  unidade: Joi.string().valid('mês', 'und', 'und.', 'km', 'h', 'hora', 'kg', 'm²', 'm³').required(),
  tipo: Joi.string().valid('contrato', 'aditivo').default('contrato'),
  categoria: Joi.string().valid('funcionario', 'horas_extras', 'servico', 'produto').optional(),
  ativo: Joi.boolean().default(true),
  observacoes: Joi.string().allow('').optional()
})

// Schema de validação para atualização
const updateItemSchema = Joi.object({
  codigo: Joi.string().min(1).max(20).optional(),
  descricao: Joi.string().min(1).max(255).optional(),
  unidade: Joi.string().valid('mês', 'und', 'und.', 'km', 'h', 'hora', 'kg', 'm²', 'm³').optional(),
  tipo: Joi.string().valid('contrato', 'aditivo').optional(),
  categoria: Joi.string().valid('funcionario', 'horas_extras', 'servico', 'produto').optional(),
  ativo: Joi.boolean().optional(),
  observacoes: Joi.string().allow('').optional()
})

/**
 * GET /api/itens-custos-mensais
 * Lista todos os itens de custos mensais
 */
router.get('/', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { ativo, tipo, categoria, search } = req.query

    let query = supabaseAdmin
      .from('itens_custos_mensais')
      .select('*')
      .order('codigo', { ascending: true })

    if (ativo !== undefined) {
      query = query.eq('ativo', ativo === 'true')
    }

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    if (categoria) {
      query = query.eq('categoria', categoria)
    }

    if (search) {
      query = query.or(`codigo.ilike.%${search}%,descricao.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar itens:', error)
      return res.status(500).json({
        error: 'Erro ao buscar itens',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao listar itens:', error)
    res.status(500).json({
      error: 'Erro ao listar itens',
      message: error.message
    })
  }
})

/**
 * GET /api/itens-custos-mensais/:id
 * Busca um item específico
 */
router.get('/:id', authenticateToken, requirePermission('obras:visualizar'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('itens_custos_mensais')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Item não encontrado'
        })
      }
      console.error('Erro ao buscar item:', error)
      return res.status(500).json({
        error: 'Erro ao buscar item',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar item:', error)
    res.status(500).json({
      error: 'Erro ao buscar item',
      message: error.message
    })
  }
})

/**
 * POST /api/itens-custos-mensais
 * Cria um novo item
 */
router.post('/', authenticateToken, requirePermission('obras:criar'), async (req, res) => {
  try {
    const { error: validationError, value } = itemSchema.validate(req.body)

    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: validationError.details.map(d => d.message)
      })
    }

    // Verificar se o código já existe
    const { data: existingItem } = await supabaseAdmin
      .from('itens_custos_mensais')
      .select('id')
      .eq('codigo', value.codigo)
      .single()

    if (existingItem) {
      return res.status(400).json({
        error: 'Código já existe',
        message: `Já existe um item com o código ${value.codigo}`
      })
    }

    const { data, error } = await supabaseAdmin
      .from('itens_custos_mensais')
      .insert({
        ...value,
        created_by: req.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar item:', error)
      return res.status(500).json({
        error: 'Erro ao criar item',
        message: error.message
      })
    }

    res.status(201).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao criar item:', error)
    res.status(500).json({
      error: 'Erro ao criar item',
      message: error.message
    })
  }
})

/**
 * PUT /api/itens-custos-mensais/:id
 * Atualiza um item
 */
router.put('/:id', authenticateToken, requirePermission('obras:editar'), async (req, res) => {
  try {
    const { id } = req.params
    const { error: validationError, value } = updateItemSchema.validate(req.body)

    if (validationError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: validationError.details.map(d => d.message)
      })
    }

    // Se estiver atualizando o código, verificar se não existe outro item com o mesmo código
    if (value.codigo) {
      const { data: existingItem } = await supabaseAdmin
        .from('itens_custos_mensais')
        .select('id')
        .eq('codigo', value.codigo)
        .neq('id', id)
        .single()

      if (existingItem) {
        return res.status(400).json({
          error: 'Código já existe',
          message: `Já existe outro item com o código ${value.codigo}`
        })
      }
    }

    const { data, error } = await supabaseAdmin
      .from('itens_custos_mensais')
      .update({
        ...value,
        updated_by: req.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Item não encontrado'
        })
      }
      console.error('Erro ao atualizar item:', error)
      return res.status(500).json({
        error: 'Erro ao atualizar item',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao atualizar item:', error)
    res.status(500).json({
      error: 'Erro ao atualizar item',
      message: error.message
    })
  }
})

/**
 * DELETE /api/itens-custos-mensais/:id
 * Deleta um item (soft delete - marca como inativo)
 */
router.delete('/:id', authenticateToken, requirePermission('obras:deletar'), async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('itens_custos_mensais')
      .update({
        ativo: false,
        updated_by: req.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Item não encontrado'
        })
      }
      console.error('Erro ao deletar item:', error)
      return res.status(500).json({
        error: 'Erro ao deletar item',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao deletar item:', error)
    res.status(500).json({
      error: 'Erro ao deletar item',
      message: error.message
    })
  }
})

export default router





