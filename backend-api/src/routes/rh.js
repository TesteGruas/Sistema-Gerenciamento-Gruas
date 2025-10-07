/**
 * Rotas para gerenciamento de RH (Recursos Humanos)
 * Sistema de Gerenciamento de Gruas
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Schema de validação para funcionários RH
const funcionarioRHSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required(),
  cpf: Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/).required(),
  cargo: Joi.string().min(2).max(100).required(),
  departamento: Joi.string().min(2).max(100).required(),
  salario: Joi.number().positive().required(),
  data_admissao: Joi.date().required(),
  telefone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  endereco: Joi.string().optional(),
  cidade: Joi.string().optional(),
  estado: Joi.string().length(2).optional(),
  cep: Joi.string().pattern(/^\d{5}-?\d{3}$/).optional(),
  status: Joi.string().valid('Ativo', 'Inativo', 'Afastado', 'Demitido').default('Ativo'),
  turno: Joi.string().valid('Manhã', 'Tarde', 'Noite', 'Integral').optional(),
  obra_atual_id: Joi.number().integer().positive().optional()
})

/**
 * @swagger
 * /api/rh/funcionarios:
 *   get:
 *     summary: Listar todos os funcionários do RH
 *     tags: [RH]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativo, Inativo, Afastado, Demitido]
 *         description: Filtrar por status
 *       - in: query
 *         name: departamento
 *         schema:
 *           type: string
 *         description: Filtrar por departamento
 *       - in: query
 *         name: cargo
 *         schema:
 *           type: string
 *         description: Filtrar por cargo
 *     responses:
 *       200:
 *         description: Lista de funcionários
 */
router.get('/funcionarios', authenticateToken, requirePermission('rh:visualizar'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const offset = (page - 1) * limit
    const { status, departamento, cargo } = req.query

    let query = supabaseAdmin
      .from('funcionarios')
      .select(`
        *,
        usuario:usuarios(id, nome, email, status),
        obra_atual:obras(id, nome, status, cliente:clientes(nome))
      `, { count: 'exact' })

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }
    if (departamento) {
      query = query.eq('departamento', departamento)
    }
    if (cargo) {
      query = query.eq('cargo', cargo)
    }

    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data: funcionarios, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar funcionários',
        message: error.message
      })
    }

    const totalPages = Math.ceil(count / limit)

    res.json({
      success: true,
      data: funcionarios || [],
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages
      }
    })
  } catch (error) {
    console.error('Erro ao listar funcionários:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/rh/funcionarios/{id}:
 *   get:
 *     summary: Obter funcionário por ID
 *     tags: [RH]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do funcionário
 *     responses:
 *       200:
 *         description: Dados do funcionário
 *       404:
 *         description: Funcionário não encontrado
 */
router.get('/funcionarios/:id', authenticateToken, requirePermission('rh:visualizar'), async (req, res) => {
  try {
    const { id } = req.params

    const { data: funcionario, error } = await supabaseAdmin
      .from('funcionarios')
      .select(`
        *,
        usuario:usuarios(id, nome, email, status),
        obra_atual:obras(id, nome, status, cliente:clientes(nome))
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Funcionário não encontrado',
          message: 'O funcionário com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar funcionário',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: funcionario
    })
  } catch (error) {
    console.error('Erro ao buscar funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/rh/funcionarios:
 *   post:
 *     summary: Criar novo funcionário
 *     tags: [RH]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - cpf
 *               - cargo
 *               - departamento
 *               - salario
 *               - data_admissao
 *             properties:
 *               nome:
 *                 type: string
 *               cpf:
 *                 type: string
 *               cargo:
 *                 type: string
 *               departamento:
 *                 type: string
 *               salario:
 *                 type: number
 *               data_admissao:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Funcionário criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/funcionarios', authenticateToken, requirePermission('rh:criar'), async (req, res) => {
  try {
    const { error, value } = funcionarioRHSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const funcionarioData = {
      ...value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('funcionarios')
      .insert(funcionarioData)
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao criar funcionário',
        message: insertError.message
      })
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Funcionário criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/rh/funcionarios/{id}:
 *   put:
 *     summary: Atualizar funcionário
 *     tags: [RH]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do funcionário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               cargo:
 *                 type: string
 *               departamento:
 *                 type: string
 *               salario:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Ativo, Inativo, Afastado, Demitido]
 *     responses:
 *       200:
 *         description: Funcionário atualizado com sucesso
 *       404:
 *         description: Funcionário não encontrado
 */
router.put('/funcionarios/:id', authenticateToken, requirePermission('rh:editar'), async (req, res) => {
  try {
    const { id } = req.params

    const { error, value } = funcionarioRHSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    const updateData = {
      ...value,
      updated_at: new Date().toISOString()
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('funcionarios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Funcionário não encontrado',
          message: 'O funcionário com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar funcionário',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data,
      message: 'Funcionário atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/rh/estatisticas:
 *   get:
 *     summary: Obter estatísticas do RH
 *     tags: [RH]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas do RH
 */
router.get('/estatisticas', authenticateToken, requirePermission('rh:visualizar'), async (req, res) => {
  try {
    // Total de funcionários por status
    const { data: porStatus, error: statusError } = await supabaseAdmin
      .from('funcionarios')
      .select('status')
      .not('status', 'is', null)

    // Total de funcionários por departamento
    const { data: porDepartamento, error: deptError } = await supabaseAdmin
      .from('funcionarios')
      .select('departamento')
      .not('departamento', 'is', null)

    // Total de funcionários por cargo
    const { data: porCargo, error: cargoError } = await supabaseAdmin
      .from('funcionarios')
      .select('cargo')
      .not('cargo', 'is', null)

    // Funcionários por obra
    const { data: porObra, error: obraError } = await supabaseAdmin
      .from('funcionarios')
      .select(`
        obra_atual_id,
        obra_atual:obras(nome, status, cliente:clientes(nome))
      `)
      .not('obra_atual_id', 'is', null)

    if (statusError || deptError || cargoError || obraError) {
      return res.status(500).json({
        error: 'Erro ao buscar estatísticas',
        message: 'Erro ao processar dados estatísticos'
      })
    }

    // Processar estatísticas
    const estatisticasStatus = porStatus.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {})

    const estatisticasDepartamento = porDepartamento.reduce((acc, item) => {
      acc[item.departamento] = (acc[item.departamento] || 0) + 1
      return acc
    }, {})

    const estatisticasCargo = porCargo.reduce((acc, item) => {
      acc[item.cargo] = (acc[item.cargo] || 0) + 1
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        por_status: estatisticasStatus,
        por_departamento: estatisticasDepartamento,
        por_cargo: estatisticasCargo,
        por_obra: porObra || []
      }
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
