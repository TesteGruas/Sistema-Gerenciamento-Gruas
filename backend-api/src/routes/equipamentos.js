/**
 * Rotas para gerenciamento de equipamentos auxiliares
 * Sistema de Gerenciamento de Gruas
 */

import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// Schema de validação para equipamentos auxiliares
const equipamentoSchema = Joi.object({
  nome: Joi.string().min(2).max(255).required(),
  tipo: Joi.string().valid('Garfo Paleteiro', 'Balde Concreto', 'Caçamba Entulho', 'Plataforma Descarga', 'Garra', 'Outro').required(),
  capacidade: Joi.string().max(100).allow(null, '').optional(),
  status: Joi.string().valid('Disponível', 'Operacional', 'Manutenção').default('Disponível'),
  responsavel_id: Joi.number().integer().positive().allow(null).optional(),
  observacoes: Joi.string().allow(null, '').optional()
})

// Schema para atualização (campos opcionais)
const equipamentoUpdateSchema = equipamentoSchema.fork(
  ['nome', 'tipo'], 
  (schema) => schema.optional()
)

/**
 * @swagger
 * /api/equipamentos:
 *   get:
 *     summary: Listar todos os equipamentos auxiliares
 *     tags: [Equipamentos]
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
 *           enum: [Disponível, Operacional, Manutenção]
 *         description: Filtrar por status
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [Garfo Paleteiro, Balde Concreto, Caçamba Entulho, Plataforma Descarga, Garra, Outro]
 *         description: Filtrar por tipo
 *     responses:
 *       200:
 *         description: Lista de equipamentos auxiliares
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
 *                     $ref: '#/components/schemas/Equipamento'
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

    // Construir query com join para obter dados do responsável
    let query = supabaseAdmin
      .from('equipamentos_auxiliares')
      .select(`
        *,
        responsavel:funcionarios(id, nome, cargo)
      `, { count: 'exact' })

    // Aplicar filtros
    if (req.query.status) {
      query = query.eq('status', req.query.status)
    }
    if (req.query.tipo) {
      query = query.eq('tipo', req.query.tipo)
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1).order('nome')

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar equipamentos',
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
    console.error('Erro ao listar equipamentos:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/equipamentos/buscar:
 *   get:
 *     summary: Buscar equipamentos para autocomplete
 *     tags: [Equipamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Termo de busca (nome ou tipo)
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [Garfo Paleteiro, Balde Concreto, Caçamba Entulho, Plataforma Descarga, Garra, Outro]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Disponível, Operacional, Manutenção]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de equipamentos encontrados
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
 *                       tipo:
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
    const { q, tipo, status } = req.query

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Termo de busca inválido',
        message: 'O termo de busca deve ter pelo menos 2 caracteres'
      })
    }

    let query = supabaseAdmin
      .from('equipamentos_auxiliares')
      .select('id, nome, tipo, status')
      .or(`nome.ilike.%${q}%,tipo.ilike.%${q}%`)
      .limit(20)

    // Aplicar filtros adicionais
    if (tipo) {
      query = query.eq('tipo', tipo)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('nome')

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar equipamentos',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/equipamentos/{id}:
 *   get:
 *     summary: Obter equipamento por ID
 *     tags: [Equipamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do equipamento
 *     responses:
 *       200:
 *         description: Dados do equipamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Equipamento'
 *       404:
 *         description: Equipamento não encontrado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('equipamentos_auxiliares')
      .select(`
        *,
        responsavel:funcionarios(id, nome, cargo)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Equipamento não encontrado',
          message: 'O equipamento com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar equipamento',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar equipamento:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/equipamentos:
 *   post:
 *     summary: Criar novo equipamento auxiliar
 *     tags: [Equipamentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EquipamentoInput'
 *     responses:
 *       201:
 *         description: Equipamento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Equipamento'
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
    const { error, value } = equipamentoSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se responsável existe (se fornecido)
    if (value.responsavel_id) {
      const { data: responsavel } = await supabaseAdmin
        .from('funcionarios')
        .select('id')
        .eq('id', value.responsavel_id)
        .single()

      if (!responsavel) {
        return res.status(400).json({
          error: 'Responsável não encontrado',
          message: 'O funcionário responsável especificado não existe'
        })
      }
    }

    // Criar equipamento
    const { data, error: createError } = await supabaseAdmin
      .from('equipamentos_auxiliares')
      .insert([value])
      .select(`
        *,
        responsavel:funcionarios(id, nome, cargo)
      `)
      .single()

    if (createError) {
      return res.status(500).json({
        error: 'Erro ao criar equipamento',
        message: createError.message
      })
    }

    res.status(201).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao criar equipamento:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/equipamentos/{id}:
 *   put:
 *     summary: Atualizar equipamento auxiliar
 *     tags: [Equipamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do equipamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EquipamentoInput'
 *     responses:
 *       200:
 *         description: Equipamento atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Equipamento'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Equipamento não encontrado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validar dados
    const { error, value } = equipamentoUpdateSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se responsável existe (se fornecido)
    if (value.responsavel_id) {
      const { data: responsavel } = await supabaseAdmin
        .from('funcionarios')
        .select('id')
        .eq('id', value.responsavel_id)
        .single()

      if (!responsavel) {
        return res.status(400).json({
          error: 'Responsável não encontrado',
          message: 'O funcionário responsável especificado não existe'
        })
      }
    }

    // Atualizar equipamento
    const { data, error: updateError } = await supabaseAdmin
      .from('equipamentos_auxiliares')
      .update({
        ...value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        responsavel:funcionarios(id, nome, cargo)
      `)
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Equipamento não encontrado',
          message: 'O equipamento com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar equipamento',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao atualizar equipamento:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/equipamentos/{id}:
 *   delete:
 *     summary: Excluir equipamento auxiliar
 *     tags: [Equipamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do equipamento
 *     responses:
 *       200:
 *         description: Equipamento excluído com sucesso
 *       404:
 *         description: Equipamento não encontrado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se equipamento existe
    const { data: equipamento, error: checkError } = await supabaseAdmin
      .from('equipamentos_auxiliares')
      .select('id, nome')
      .eq('id', id)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Equipamento não encontrado',
          message: 'O equipamento com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao verificar equipamento',
        message: checkError.message
      })
    }

    // Verificar se equipamento está associado a alguma grua
    const { data: associacoes } = await supabaseAdmin
      .from('grua_equipamento')
      .select('id')
      .eq('equipamento_id', id)
      .eq('status', 'Ativo')

    if (associacoes && associacoes.length > 0) {
      return res.status(400).json({
        error: 'Equipamento em uso',
        message: 'Não é possível excluir o equipamento pois ele está associado a uma ou mais gruas ativas'
      })
    }

    // Excluir equipamento
    const { error: deleteError } = await supabaseAdmin
      .from('equipamentos_auxiliares')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return res.status(500).json({
        error: 'Erro ao excluir equipamento',
        message: deleteError.message
      })
    }

    res.json({
      success: true,
      message: `Equipamento ${equipamento.nome} excluído com sucesso`
    })
  } catch (error) {
    console.error('Erro ao excluir equipamento:', error)
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
 *     Equipamento:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do equipamento
 *         nome:
 *           type: string
 *           description: Nome do equipamento
 *         tipo:
 *           type: string
 *           enum: [Garfo Paleteiro, Balde Concreto, Caçamba Entulho, Plataforma Descarga, Garra, Outro]
 *           description: Tipo do equipamento
 *         capacidade:
 *           type: string
 *           description: Capacidade do equipamento
 *         status:
 *           type: string
 *           enum: [Disponível, Operacional, Manutenção]
 *           description: Status do equipamento
 *         responsavel_id:
 *           type: integer
 *           description: ID do funcionário responsável
 *         responsavel:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             nome:
 *               type: string
 *             cargo:
 *               type: string
 *           description: Dados do funcionário responsável
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
 *     EquipamentoInput:
 *       type: object
 *       required:
 *         - nome
 *         - tipo
 *       properties:
 *         nome:
 *           type: string
 *           minLength: 2
 *           maxLength: 255
 *           description: Nome do equipamento
 *         tipo:
 *           type: string
 *           enum: [Garfo Paleteiro, Balde Concreto, Caçamba Entulho, Plataforma Descarga, Garra, Outro]
 *           description: Tipo do equipamento
 *         capacidade:
 *           type: string
 *           maxLength: 100
 *           description: Capacidade do equipamento
 *         status:
 *           type: string
 *           enum: [Disponível, Operacional, Manutenção]
 *           default: Disponível
 *           description: Status do equipamento
 *         responsavel_id:
 *           type: integer
 *           minimum: 1
 *           description: ID do funcionário responsável
 *         observacoes:
 *           type: string
 *           description: Observações adicionais
 */

export default router
