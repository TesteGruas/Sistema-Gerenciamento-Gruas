/**
 * Rotas para gerenciamento do Livro da Grua
 * Sistema de Gerenciamento de Gruas
 * 
 * Funcionalidades:
 * - Criar entradas no livro da grua
 * - Listar entradas por grua
 * - Atualizar entradas
 * - Excluir entradas
 * - Filtrar por tipo, status, data
 * - Exportar dados
 */

import express from 'express'
import Joi from 'joi'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

/**
 * GET /api/livro-grua/relacoes-grua-obra
 * Listar todas as relações grua-obra para funcionários
 */
router.get('/relacoes-grua-obra', async (req, res) => {
  try {
    const { funcionario_id } = req.query
    
    let query = supabase
      .from('grua_obra')
      .select(`
        id,
        grua_id,
        obra_id,
        data_inicio_locacao,
        data_fim_locacao,
        status,
        valor_locacao_mensal,
        observacoes,
        gruas (
          id,
          tipo,
          modelo,
          fabricante
        ),
        obras (
          id,
          nome,
          endereco,
          cidade,
          estado,
          status
        )
      `)
      .in('status', ['Ativa', 'Pausada'])
      .order('obras(nome)', { ascending: true })
      .order('gruas(id)', { ascending: true })

    // Se funcionario_id fornecido, filtrar apenas obras onde o funcionário trabalha
    if (funcionario_id) {
      // Primeiro buscar obras do funcionário
      const { data: obrasFuncionario, error: obrasError } = await supabase
        .from('funcionarios_obras')
        .select('obra_id')
        .eq('funcionario_id', funcionario_id)
        .eq('status', 'ativo')

      if (obrasError) {
        console.error('Erro ao buscar obras do funcionário:', obrasError)
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar obras do funcionário',
          error: obrasError.message
        })
      }

      if (obrasFuncionario && obrasFuncionario.length > 0) {
        const obraIds = obrasFuncionario.map(o => o.obra_id)
        query = query.in('obra_id', obraIds)
      } else {
        // Funcionário não está alocado em nenhuma obra
        return res.json({
          success: true,
          data: [],
          message: 'Funcionário não está alocado em nenhuma obra ativa'
        })
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar relações grua-obra:', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar relações',
        error: error.message
      })
    }

    console.log('Dados brutos do Supabase:', JSON.stringify(data, null, 2))

    // Transformar os dados para o formato esperado e filtrar dados inválidos
    const relacoes = data
      .filter(row => row.gruas && row.obras) // Filtrar apenas relações com dados válidos
      .map(row => ({
        id: row.id,
        grua_id: row.grua_id,
        obra_id: row.obra_id,
        data_inicio_locacao: row.data_inicio_locacao,
        data_fim_locacao: row.data_fim_locacao,
        status: row.status,
        valor_locacao_mensal: row.valor_locacao_mensal,
        observacoes: row.observacoes,
        grua: row.gruas,
        obra: row.obras
      }))

    console.log('Relações processadas:', JSON.stringify(relacoes, null, 2))

    res.json({
      success: true,
      data: relacoes
    })

  } catch (error) {
    console.error('Erro ao listar relações grua-obra:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

/**
 * GET /api/livro-grua/relacoes-grua-obra-debug
 * Endpoint de debug para testar sem filtro por funcionário
 */
router.get('/relacoes-grua-obra-debug', async (req, res) => {
  try {
    console.log('=== DEBUG: Buscando todas as relações sem filtro ===')
    
    const { data, error } = await supabase
      .from('grua_obra')
      .select(`
        id,
        grua_id,
        obra_id,
        data_inicio_locacao,
        data_fim_locacao,
        status,
        valor_locacao_mensal,
        observacoes,
        gruas (
          id,
          tipo,
          modelo,
          fabricante
        ),
        obras (
          id,
          nome,
          endereco,
          cidade,
          estado,
          status
        )
      `)
      .in('status', ['Ativa', 'Pausada'])
      .order('obras(nome)', { ascending: true })
      .order('gruas(id)', { ascending: true })

    if (error) {
      console.error('Erro ao buscar relações (debug):', error)
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar relações',
        error: error.message
      })
    }

    console.log('Dados brutos do Supabase (debug):', JSON.stringify(data, null, 2))

    // Transformar os dados para o formato esperado
    const relacoes = data
      .filter(row => row.gruas && row.obras)
      .map(row => ({
        id: row.id,
        grua_id: row.grua_id,
        obra_id: row.obra_id,
        data_inicio_locacao: row.data_inicio_locacao,
        data_fim_locacao: row.data_fim_locacao,
        status: row.status,
        valor_locacao_mensal: row.valor_locacao_mensal,
        observacoes: row.observacoes,
        grua: row.gruas,
        obra: row.obras
      }))

    console.log('Relações processadas (debug):', JSON.stringify(relacoes, null, 2))

    res.json({
      success: true,
      data: relacoes,
      debug: true
    })

  } catch (error) {
    console.error('Erro ao listar relações grua-obra (debug):', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    })
  }
})

// Schemas de validação - baseado nos campos do frontend
const entradaLivroSchema = Joi.object({
  // Campos obrigatórios (conforme frontend)
  grua_id: Joi.string().required(),
  funcionario_id: Joi.number().integer().positive().required(),
  data_entrada: Joi.date().required(),
  tipo_entrada: Joi.string().valid('checklist', 'manutencao', 'falha').required(),
  status_entrada: Joi.string().valid('ok', 'manutencao', 'falha').required(),
  descricao: Joi.string().min(1).required(),
  
  // Campos opcionais (conforme frontend)
  hora_entrada: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow('').optional(),
  observacoes: Joi.string().allow('', null).optional(),
  responsavel_resolucao: Joi.string().allow('', null).optional(),
  data_resolucao: Joi.date().allow(null).optional(),
  status_resolucao: Joi.string().valid('pendente', 'em_andamento', 'concluido', 'cancelado').allow('', null).optional(),
  anexos: Joi.array().items(Joi.object({
    nome: Joi.string().required(),
    tipo: Joi.string().required(),
    tamanho: Joi.number().positive().required(),
    url: Joi.string().uri().required()
  })).optional()
})

const filtrosSchema = Joi.object({
  grua_id: Joi.string().optional(),
  funcionario_id: Joi.number().integer().positive().optional(),
  data_inicio: Joi.date().optional(),
  data_fim: Joi.date().optional(),
  tipo_entrada: Joi.string().valid('checklist', 'manutencao', 'falha', 'inspecao', 'calibracao').optional(),
  status_entrada: Joi.string().valid('ok', 'manutencao', 'falha', 'pendente', 'concluido').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
})

/**
 * @swagger
 * /api/livro-grua:
 *   get:
 *     summary: Listar entradas do livro da grua
 *     tags: [Livro da Grua]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grua_id
 *         schema:
 *           type: string
 *         description: ID da grua
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do filtro
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do filtro
 *       - in: query
 *         name: tipo_entrada
 *         schema:
 *           type: string
 *           enum: [checklist, manutencao, falha, inspecao, calibracao]
 *         description: Tipo da entrada
 *       - in: query
 *         name: status_entrada
 *         schema:
 *           type: string
 *           enum: [ok, manutencao, falha, pendente, concluido]
 *         description: Status da entrada
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
 *     responses:
 *       200:
 *         description: Lista de entradas do livro
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/', async (req, res) => {
  try {
    // Validar parâmetros
    const { error, value } = filtrosSchema.validate(req.query)
    if (error) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: error.details[0].message
      })
    }

    const { 
      grua_id, 
      funcionario_id, 
      data_inicio, 
      data_fim, 
      tipo_entrada, 
      status_entrada, 
      page, 
      limit 
    } = value

    const offset = (page - 1) * limit

    // Construir query
    let query = supabase
      .from('livro_grua_completo')
      .select('*', { count: 'exact' })

    // Aplicar filtros
    if (grua_id) {
      query = query.eq('grua_id', grua_id)
    }
    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id)
    }
    if (data_inicio) {
      query = query.gte('data_entrada', data_inicio)
    }
    if (data_fim) {
      query = query.lte('data_entrada', data_fim)
    }
    if (tipo_entrada) {
      query = query.eq('tipo_entrada', tipo_entrada)
    }
    if (status_entrada) {
      query = query.eq('status_entrada', status_entrada)
    }

    // Aplicar paginação e ordenação
    query = query
      .order('data_entrada', { ascending: false })
      .order('hora_entrada', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error: queryError, count } = await query

    if (queryError) {
      return res.status(500).json({
        error: 'Erro ao buscar entradas do livro',
        message: queryError.message
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
    console.error('Erro ao listar entradas do livro:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/livro-grua/{id}:
 *   get:
 *     summary: Obter entrada específica do livro
 *     tags: [Livro da Grua]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da entrada
 *     responses:
 *       200:
 *         description: Dados da entrada
 *       404:
 *         description: Entrada não encontrada
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('livro_grua_completo')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Entrada não encontrada',
          message: 'A entrada especificada não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar entrada',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Erro ao buscar entrada:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/livro-grua:
 *   post:
 *     summary: Criar nova entrada no livro da grua
 *     tags: [Livro da Grua]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grua_id
 *               - funcionario_id
 *               - data_entrada
 *               - tipo_entrada
 *               - status_entrada
 *               - descricao
 *             properties:
 *               grua_id:
 *                 type: string
 *               funcionario_id:
 *                 type: integer
 *               data_entrada:
 *                 type: string
 *                 format: date
 *               hora_entrada:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               tipo_entrada:
 *                 type: string
 *                 enum: [checklist, manutencao, falha]
 *               status_entrada:
 *                 type: string
 *                 enum: [ok, manutencao, falha]
 *               descricao:
 *                 type: string
 *               observacoes:
 *                 type: string
 *               responsavel_resolucao:
 *                 type: string
 *               data_resolucao:
 *                 type: string
 *                 format: date
 *               status_resolucao:
 *                 type: string
 *                 enum: [pendente, em_andamento, concluido, cancelado]
 *               anexos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nome:
 *                       type: string
 *                     tipo:
 *                       type: string
 *                     tamanho:
 *                       type: number
 *                     url:
 *                       type: string
 *     responses:
 *       201:
 *         description: Entrada criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = entradaLivroSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se a grua existe
    const { data: grua, error: gruaError } = await supabaseAdmin
      .from('gruas')
      .select('id, modelo, fabricante')
      .eq('id', value.grua_id)
      .single()

    if (gruaError || !grua) {
      return res.status(404).json({
        error: 'Grua não encontrada',
        message: 'A grua especificada não existe'
      })
    }

    // Verificar se o funcionário existe
    const { data: funcionario, error: funcionarioError } = await supabase
      .from('funcionarios')
      .select('id, nome, cargo')
      .eq('id', value.funcionario_id)
      .single()

    if (funcionarioError || !funcionario) {
      return res.status(404).json({
        error: 'Funcionário não encontrado',
        message: 'O funcionário especificado não existe'
      })
    }

    // Preparar dados para inserção
    const entradaData = {
      ...value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: req.user?.id || null
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('livro_grua')
      .insert(entradaData)
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao criar entrada',
        message: insertError.message
      })
    }

    // Buscar dados completos da entrada criada
    const { data: entradaCompleta, error: buscaError } = await supabase
      .from('livro_grua_completo')
      .select('*')
      .eq('id', data.id)
      .single()

    res.status(201).json({
      success: true,
      data: entradaCompleta,
      message: 'Entrada criada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao criar entrada:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/livro-grua/{id}:
 *   put:
 *     summary: Atualizar entrada do livro da grua
 *     tags: [Livro da Grua]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da entrada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               funcionario_id:
 *                 type: integer
 *               data_entrada:
 *                 type: string
 *                 format: date
 *               hora_entrada:
 *                 type: string
 *               tipo_entrada:
 *                 type: string
 *                 enum: [checklist, manutencao, falha]
 *               status_entrada:
 *                 type: string
 *                 enum: [ok, manutencao, falha]
 *               descricao:
 *                 type: string
 *               observacoes:
 *                 type: string
 *               responsavel_resolucao:
 *                 type: string
 *               data_resolucao:
 *                 type: string
 *                 format: date
 *               status_resolucao:
 *                 type: string
 *                 enum: [pendente, em_andamento, concluido, cancelado]
 *               anexos:
 *                 type: array
 *     responses:
 *       200:
 *         description: Entrada atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Entrada não encontrada
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validar dados (todos os campos opcionais para atualização)
    const updateSchema = entradaLivroSchema.fork(Object.keys(entradaLivroSchema.describe().keys), (schema) => schema.optional())
    const { error, value } = updateSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Verificar se a entrada existe
    const { data: entradaExistente, error: buscaError } = await supabaseAdmin
      .from('livro_grua')
      .select('id')
      .eq('id', id)
      .single()

    if (buscaError || !entradaExistente) {
      return res.status(404).json({
        error: 'Entrada não encontrada',
        message: 'A entrada especificada não existe'
      })
    }

    // Preparar dados para atualização
    const updateData = {
      ...value,
      updated_at: new Date().toISOString(),
      updated_by: req.user?.id || null
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('livro_grua')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return res.status(500).json({
        error: 'Erro ao atualizar entrada',
        message: updateError.message
      })
    }

    // Buscar dados completos da entrada atualizada
    const { data: entradaCompleta, error: buscaCompletaError } = await supabase
      .from('livro_grua_completo')
      .select('*')
      .eq('id', id)
      .single()

    res.json({
      success: true,
      data: entradaCompleta,
      message: 'Entrada atualizada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar entrada:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/livro-grua/{id}:
 *   delete:
 *     summary: Excluir entrada do livro da grua
 *     tags: [Livro da Grua]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da entrada
 *     responses:
 *       200:
 *         description: Entrada excluída com sucesso
 *       404:
 *         description: Entrada não encontrada
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se a entrada existe
    const { data: entradaExistente, error: buscaError } = await supabaseAdmin
      .from('livro_grua')
      .select('id')
      .eq('id', id)
      .single()

    if (buscaError || !entradaExistente) {
      return res.status(404).json({
        error: 'Entrada não encontrada',
        message: 'A entrada especificada não existe'
      })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('livro_grua')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return res.status(500).json({
        error: 'Erro ao excluir entrada',
        message: deleteError.message
      })
    }

    res.json({
      success: true,
      message: 'Entrada excluída com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir entrada:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/livro-grua/export/{grua_id}:
 *   get:
 *     summary: Exportar entradas do livro da grua para CSV
 *     tags: [Livro da Grua]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grua_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da grua
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do filtro
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do filtro
 *     responses:
 *       200:
 *         description: Arquivo CSV gerado
 *       404:
 *         description: Grua não encontrada
 */
router.get('/export/:grua_id', async (req, res) => {
  try {
    const { grua_id } = req.params
    const { data_inicio, data_fim } = req.query

    // Verificar se a grua existe
    const { data: grua, error: gruaError } = await supabaseAdmin
      .from('gruas')
      .select('id, modelo, fabricante')
      .eq('id', grua_id)
      .single()

    if (gruaError || !grua) {
      return res.status(404).json({
        error: 'Grua não encontrada',
        message: 'A grua especificada não existe'
      })
    }

    // Buscar entradas
    let query = supabase
      .from('livro_grua_completo')
      .select('*')
      .eq('grua_id', grua_id)

    if (data_inicio) {
      query = query.gte('data_entrada', data_inicio)
    }
    if (data_fim) {
      query = query.lte('data_entrada', data_fim)
    }

    query = query.order('data_entrada', { ascending: false })

    const { data: entradas, error: queryError } = await query

    if (queryError) {
      return res.status(500).json({
        error: 'Erro ao buscar entradas',
        message: queryError.message
      })
    }

    // Gerar CSV
    const csvHeader = [
      'Data',
      'Hora',
      'Grua',
      'Funcionário',
      'Cargo',
      'Tipo',
      'Status',
      'Descrição',
      'Observações',
      'Responsável Resolução',
      'Data Resolução',
      'Status Resolução'
    ]

    const csvRows = entradas.map(entrada => [
      new Date(entrada.data_entrada).toLocaleDateString('pt-BR'),
      entrada.hora_entrada || '-',
      `${entrada.grua_modelo} - ${entrada.grua_fabricante}`,
      entrada.funcionario_nome || '-',
      entrada.funcionario_cargo || '-',
      entrada.tipo_entrada_display || entrada.tipo_entrada,
      entrada.status_entrada,
      entrada.descricao,
      entrada.observacoes || '-',
      entrada.responsavel_resolucao || '-',
      entrada.data_resolucao ? new Date(entrada.data_resolucao).toLocaleDateString('pt-BR') : '-',
      entrada.status_resolucao || '-'
    ])

    const csvContent = [csvHeader, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    // Configurar headers para download
    const filename = `livro-grua-${grua.modelo}-${new Date().toISOString().split('T')[0]}.csv`
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csvContent)

  } catch (error) {
    console.error('Erro ao exportar livro da grua:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/livro-grua/stats/{grua_id}:
 *   get:
 *     summary: Obter estatísticas do livro da grua
 *     tags: [Livro da Grua]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grua_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da grua
 *     responses:
 *       200:
 *         description: Estatísticas do livro da grua
 *       404:
 *         description: Grua não encontrada
 */
router.get('/stats/:grua_id', async (req, res) => {
  try {
    const { grua_id } = req.params

    // Verificar se a grua existe
    const { data: grua, error: gruaError } = await supabaseAdmin
      .from('gruas')
      .select('id, modelo, fabricante')
      .eq('id', grua_id)
      .single()

    if (gruaError || !grua) {
      return res.status(404).json({
        error: 'Grua não encontrada',
        message: 'A grua especificada não existe'
      })
    }

    // Buscar estatísticas
    const { data: entradas, error: queryError } = await supabase
      .from('livro_grua_completo')
      .select('tipo_entrada, status_entrada, data_entrada')
      .eq('grua_id', grua_id)

    if (queryError) {
      return res.status(500).json({
        error: 'Erro ao buscar estatísticas',
        message: queryError.message
      })
    }

    // Calcular estatísticas
    const stats = {
      total_entradas: entradas.length,
      por_tipo: {},
      por_status: {},
      ultima_entrada: null,
      primeira_entrada: null,
      entradas_ultimos_30_dias: 0
    }

    // Contar por tipo e status
    entradas.forEach(entrada => {
      stats.por_tipo[entrada.tipo_entrada] = (stats.por_tipo[entrada.tipo_entrada] || 0) + 1
      stats.por_status[entrada.status_entrada] = (stats.por_status[entrada.status_entrada] || 0) + 1
    })

    // Encontrar primeira e última entrada
    if (entradas.length > 0) {
      const datas = entradas.map(e => new Date(e.data_entrada)).sort()
      stats.primeira_entrada = datas[0].toISOString().split('T')[0]
      stats.ultima_entrada = datas[datas.length - 1].toISOString().split('T')[0]

      // Contar entradas dos últimos 30 dias
      const trintaDiasAtras = new Date()
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
      
      stats.entradas_ultimos_30_dias = entradas.filter(e => 
        new Date(e.data_entrada) >= trintaDiasAtras
      ).length
    }

    res.json({
      success: true,
      data: {
        grua,
        estatisticas: stats
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

/**
 * @swagger
 * /api/livro-grua/grua-by-relation/{id}:
 *   get:
 *     summary: Buscar grua pelo ID da relação grua_obra
 *     tags: [Livro da Grua]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da relação grua_obra
 *     responses:
 *       200:
 *         description: Dados da grua e relação
 *       404:
 *         description: Relação não encontrada
 */
router.get('/grua-by-relation/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Buscar a relação grua_obra
    const { data: relacao, error: relacaoError } = await supabaseAdmin
      .from('grua_obra')
      .select(`
        *,
        gruas (
          id,
          name,
          modelo,
          fabricante,
          tipo,
          capacidade,
          status,
          ano,
          created_at
        ),
        obras (
          id,
          nome,
          status
        )
      `)
      .eq('id', id)
      .single()

    if (relacaoError) {
      if (relacaoError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Relação não encontrada',
          message: 'A relação grua_obra com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar relação',
        message: relacaoError.message
      })
    }

    // Mapear dados da grua para compatibilidade com frontend
    const gruaMapeada = relacao.gruas ? {
      ...relacao.gruas,
      // Campos de compatibilidade com frontend
      model: relacao.gruas.modelo,
      capacity: relacao.gruas.capacidade,
      createdAt: relacao.gruas.created_at
    } : null

    res.json({
      success: true,
      data: {
        relacao,
        grua: gruaMapeada,
        obra: relacao.obras
      }
    })

  } catch (error) {
    console.error('Erro ao buscar grua por relação:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
