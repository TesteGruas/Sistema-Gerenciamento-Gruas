/**
 * Rotas para gerenciamento de funcionários
 * Sistema de Gerenciamento de Gruas
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// Schema de validação para funcionários
const funcionarioSchema = Joi.object({
  nome: Joi.string().min(2).max(255).required(),
  cargo: Joi.string().valid('Operador', 'Sinaleiro', 'Técnico Manutenção', 'Supervisor', 'Mecânico').required(),
  telefone: Joi.string().max(20).allow(null, '').optional(),
  email: Joi.string().email().allow(null, '').optional(),
  cpf: Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/).allow(null, '').optional(),
  turno: Joi.string().valid('Diurno', 'Noturno', 'Sob Demanda').default('Diurno'),
  status: Joi.string().valid('Ativo', 'Inativo', 'Férias').default('Ativo'),
  data_admissao: Joi.date().allow(null).optional(),
  salario: Joi.number().min(0).allow(null).optional(),
  observacoes: Joi.string().allow(null, '').optional()
})

// Schema para atualização (campos opcionais)
const funcionarioUpdateSchema = funcionarioSchema.fork(
  ['nome', 'cargo'], 
  (schema) => schema.optional()
)

/**
 * @swagger
 * /api/funcionarios:
 *   get:
 *     summary: Listar todos os funcionários
 *     tags: [Funcionários]
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
 *           default: 10
 *         description: Itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativo, Inativo, Férias]
 *         description: Filtrar por status
 *       - in: query
 *         name: cargo
 *         schema:
 *           type: string
 *           enum: [Operador, Sinaleiro, Técnico Manutenção, Supervisor, Mecânico]
 *         description: Filtrar por cargo
 *       - in: query
 *         name: turno
 *         schema:
 *           type: string
 *           enum: [Diurno, Noturno, Sob Demanda]
 *         description: Filtrar por turno
 *     responses:
 *       200:
 *         description: Lista de funcionários
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Funcionario'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const offset = (page - 1) * limit

    // Construir filtros
    let query = supabaseAdmin
      .from('funcionarios')
      .select('*', { count: 'exact' })

    // Aplicar filtros
    if (req.query.status) {
      query = query.eq('status', req.query.status)
    }
    if (req.query.cargo) {
      query = query.eq('cargo', req.query.cargo)
    }
    if (req.query.turno) {
      query = query.eq('turno', req.query.turno)
    }

    // Aplicar paginação e ordenação
    query = query.order('nome', { ascending: true }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar funcionários',
        message: error.message
      })
    }

    const totalPages = Math.ceil(count / limit)

    res.json({
      success: true,
      data: data || [],
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
 * /api/funcionarios/buscar:
 *   get:
 *     summary: Buscar funcionários para autocomplete
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Termo de busca (nome ou cargo)
 *       - in: query
 *         name: cargo
 *         schema:
 *           type: string
 *           enum: [Operador, Sinaleiro, Técnico Manutenção, Supervisor, Mecânico]
 *         description: Filtrar por cargo
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativo, Inativo, Férias]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de funcionários encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       cargo:
 *                         type: string
 *                       status:
 *                         type: string
 *       400:
 *         description: Parâmetro de busca não fornecido
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/buscar', async (req, res) => {
  try {
    const { q, cargo, status } = req.query

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Termo de busca inválido',
        message: 'O termo de busca deve ter pelo menos 2 caracteres'
      })
    }

    let query = supabaseAdmin
      .from('funcionarios')
      .select('id, nome, cargo, status')
      .or(`nome.ilike.%${q}%,cargo.ilike.%${q}%`)
      .limit(20)

    // Aplicar filtros adicionais
    if (cargo) {
      query = query.eq('cargo', cargo)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('nome')

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar funcionários',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/funcionarios/{id}:
 *   get:
 *     summary: Obter funcionário por ID
 *     tags: [Funcionários]
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Funcionario'
 *       404:
 *         description: Funcionário não encontrado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('funcionarios')
      .select('*')
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
      data
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
 * /api/funcionarios:
 *   post:
 *     summary: Criar novo funcionário
 *     tags: [Funcionários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FuncionarioInput'
 *     responses:
 *       201:
 *         description: Funcionário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Funcionario'
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = funcionarioSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se CPF já existe (se fornecido)
    if (value.cpf) {
      const { data: existingFuncionario } = await supabaseAdmin
        .from('funcionarios')
        .select('id')
        .eq('cpf', value.cpf)
        .single()

      if (existingFuncionario) {
        return res.status(400).json({
          error: 'CPF já cadastrado',
          message: 'Já existe um funcionário cadastrado com este CPF'
        })
      }
    }

    // Criar funcionário
    const { data, error: createError } = await supabaseAdmin
      .from('funcionarios')
      .insert([value])
      .select()
      .single()

    if (createError) {
      return res.status(500).json({
        error: 'Erro ao criar funcionário',
        message: createError.message
      })
    }

    res.status(201).json({
      success: true,
      data
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
 * /api/funcionarios/{id}:
 *   put:
 *     summary: Atualizar funcionário
 *     tags: [Funcionários]
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
 *             $ref: '#/components/schemas/FuncionarioInput'
 *     responses:
 *       200:
 *         description: Funcionário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Funcionario'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Funcionário não encontrado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validar dados
    const { error, value } = funcionarioUpdateSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se CPF já existe em outro funcionário (se fornecido)
    if (value.cpf) {
      const { data: existingFuncionario } = await supabaseAdmin
        .from('funcionarios')
        .select('id')
        .eq('cpf', value.cpf)
        .neq('id', id)
        .single()

      if (existingFuncionario) {
        return res.status(400).json({
          error: 'CPF já cadastrado',
          message: 'Já existe outro funcionário cadastrado com este CPF'
        })
      }
    }

    // Atualizar funcionário
    const { data, error: updateError } = await supabaseAdmin
      .from('funcionarios')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
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
      data
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
 * /api/funcionarios/{id}:
 *   delete:
 *     summary: Excluir funcionário
 *     tags: [Funcionários]
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
 *         description: Funcionário excluído com sucesso
 *       404:
 *         description: Funcionário não encontrado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se funcionário existe
    const { data: funcionario, error: checkError } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome')
      .eq('id', id)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Funcionário não encontrado',
          message: 'O funcionário com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao verificar funcionário',
        message: checkError.message
      })
    }

    // Verificar se funcionário está associado a alguma grua
    const { data: associacoes } = await supabaseAdmin
      .from('grua_funcionario')
      .select('id')
      .eq('funcionario_id', id)
      .eq('status', 'Ativo')

    if (associacoes && associacoes.length > 0) {
      return res.status(400).json({
        error: 'Funcionário em uso',
        message: 'Não é possível excluir o funcionário pois ele está associado a uma ou mais gruas ativas'
      })
    }

    // Excluir funcionário
    const { error: deleteError } = await supabaseAdmin
      .from('funcionarios')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return res.status(500).json({
        error: 'Erro ao excluir funcionário',
        message: deleteError.message
      })
    }

    res.json({
      success: true,
      message: `Funcionário ${funcionario.nome} excluído com sucesso`
    })
  } catch (error) {
    console.error('Erro ao excluir funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * components:
 *   schemas:
 *     Funcionario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do funcionário
 *         nome:
 *           type: string
 *           description: Nome completo do funcionário
 *         cargo:
 *           type: string
 *           enum: [Operador, Sinaleiro, Técnico Manutenção, Supervisor, Mecânico]
 *           description: Cargo do funcionário
 *         telefone:
 *           type: string
 *           description: Telefone de contato
 *         email:
 *           type: string
 *           format: email
 *           description: Email de contato
 *         cpf:
 *           type: string
 *           description: CPF do funcionário
 *         turno:
 *           type: string
 *           enum: [Diurno, Noturno, Sob Demanda]
 *           description: Turno de trabalho
 *         status:
 *           type: string
 *           enum: [Ativo, Inativo, Férias]
 *           description: Status do funcionário
 *         data_admissao:
 *           type: string
 *           format: date
 *           description: Data de admissão
 *         salario:
 *           type: number
 *           description: Salário do funcionário
 *         observacoes:
 *           type: string
 *           description: Observações adicionais
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *     
 *     FuncionarioInput:
 *       type: object
 *       required:
 *         - nome
 *         - cargo
 *       properties:
 *         nome:
 *           type: string
 *           minLength: 2
 *           maxLength: 255
 *           description: Nome completo do funcionário
 *         cargo:
 *           type: string
 *           enum: [Operador, Sinaleiro, Técnico Manutenção, Supervisor, Mecânico]
 *           description: Cargo do funcionário
 *         telefone:
 *           type: string
 *           maxLength: 20
 *           description: Telefone de contato
 *         email:
 *           type: string
 *           format: email
 *           description: Email de contato
 *         cpf:
 *           type: string
 *           pattern: '^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$'
 *           description: CPF do funcionário (formato: 000.000.000-00 ou 00000000000)
 *         turno:
 *           type: string
 *           enum: [Diurno, Noturno, Sob Demanda]
 *           default: Diurno
 *           description: Turno de trabalho
 *         status:
 *           type: string
 *           enum: [Ativo, Inativo, Férias]
 *           default: Ativo
 *           description: Status do funcionário
 *         data_admissao:
 *           type: string
 *           format: date
 *           description: Data de admissão
 *         salario:
 *           type: number
 *           minimum: 0
 *           description: Salário do funcionário
 *         observacoes:
 *           type: string
 *           description: Observações adicionais
 */

export default router
