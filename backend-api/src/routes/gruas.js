import express from 'express'
import Joi from 'joi'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

/**
 * @swagger
 * /api/gruas/clientes/buscar:
 *   get:
 *     summary: Buscar clientes com autocomplete
 *     tags: [Gruas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Termo de busca (nome ou CNPJ)
 *     responses:
 *       200:
 *         description: Lista de clientes encontrados
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
 *                       cnpj:
 *                         type: string
 *                       email:
 *                         type: string
 *                       telefone:
 *                         type: string
 *                       contato:
 *                         type: string
 *       500:
 *         description: Erro interno do servidor
 */
// Endpoint para buscar clientes com autocomplete
router.get('/clientes/buscar', async (req, res) => {
  try {
    const { q } = req.query
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      })
    }

    const { data, error } = await supabaseAdmin
      .from('clientes')
      .select('id, nome, cnpj, email, telefone, contato')
      .or(`nome.ilike.%${q}%,cnpj.ilike.%${q}%`)
      .limit(10)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar clientes',
        message: error.message
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// Função auxiliar para buscar ou criar cliente
const buscarOuCriarCliente = async (clienteData) => {
  if (!clienteData.nome) return null

  // Validar dados do cliente
  const { error: validationError, value: validatedData } = clienteDataSchema.validate(clienteData)
  if (validationError) {
    console.error('Dados do cliente inválidos:', validationError)
    return null
  }

  // Primeiro, tentar buscar cliente existente por CNPJ ou nome
  let query = supabaseAdmin.from('clientes').select('*')
  
  if (validatedData.cnpj) {
    query = query.eq('cnpj', validatedData.cnpj)
  } else {
    query = query.ilike('nome', `%${validatedData.nome}%`)
  }

  const { data: clientesExistentes, error: buscaError } = await query

  if (buscaError) {
    console.error('Erro ao buscar cliente:', buscaError)
    return null
  }

  // Se encontrou cliente existente, retornar
  if (clientesExistentes && clientesExistentes.length > 0) {
    return clientesExistentes[0]
  }

  // Se não encontrou, criar novo cliente
  const novoCliente = {
    nome: validatedData.nome,
    cnpj: validatedData.cnpj || null,
    contato: validatedData.contato || null,
    telefone: validatedData.telefone || null,
    email: validatedData.email || null,
    endereco: validatedData.endereco || null,
    cidade: validatedData.cidade || null,
    estado: validatedData.estado || null,
    cep: validatedData.cep || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data: clienteCriado, error: createError } = await supabaseAdmin
    .from('clientes')
    .insert(novoCliente)
    .select()
    .single()

  if (createError) {
    console.error('Erro ao criar cliente:', createError)
    return null
  }

  return clienteCriado
}

// Schema de validação para gruas - baseado no schema real da tabela do Supabase
const gruaSchema = Joi.object({
  modelo: Joi.string().min(2).required(),
  fabricante: Joi.string().min(2).required(),
  tipo: Joi.string().valid('Grua Torre', 'Grua Móvel', 'Guincho', 'Outros').required(),
  capacidade: Joi.string().required(),
  capacidade_ponta: Joi.string().required(),
  lanca: Joi.string().required(),
  altura_trabalho: Joi.string().allow(null).optional(),
  ano: Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null).optional(),
  status: Joi.string().valid('Disponível', 'Operacional', 'Manutenção', 'Vendida').default('Disponível'),
  localizacao: Joi.string().allow(null).optional(),
  horas_operacao: Joi.number().integer().min(0).default(0),
  valor_locacao: Joi.number().positive().allow(null).optional(),
  valor_operacao: Joi.number().min(0).default(0),
  valor_sinaleiro: Joi.number().min(0).default(0),
  valor_manutencao: Joi.number().min(0).default(0),
  ultima_manutencao: Joi.date().allow(null).optional(),
  proxima_manutencao: Joi.date().allow(null).optional()
})

// Schema para dados de entrada (inclui campos de cliente para processamento)
const gruaInputSchema = Joi.object({
  modelo: Joi.string().min(2).required(),
  fabricante: Joi.string().min(2).required(),
  tipo: Joi.string().valid('Grua Torre', 'Grua Móvel', 'Guincho', 'Outros').required(),
  capacidade: Joi.string().required(),
  capacidade_ponta: Joi.string().required(),
  lanca: Joi.string().required(),
  altura_trabalho: Joi.string().allow(null).optional(),
  ano: Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null).optional(),
  status: Joi.string().valid('Disponível', 'Operacional', 'Manutenção', 'Vendida').default('Disponível'),
  localizacao: Joi.string().allow(null).optional(),
  horas_operacao: Joi.number().integer().min(0).default(0),
  valor_locacao: Joi.number().positive().allow(null).optional(),
  valor_operacao: Joi.number().min(0).default(0),
  valor_sinaleiro: Joi.number().min(0).default(0),
  valor_manutencao: Joi.number().min(0).default(0),
  ultima_manutencao: Joi.date().allow(null).optional(),
  proxima_manutencao: Joi.date().allow(null).optional(),
  // Campos de cliente enviados do frontend (usados internamente)
  cliente_nome: Joi.string().allow(null, '').optional(),
  cliente_documento: Joi.string().allow(null, '').optional(),
  cliente_email: Joi.string().email().allow(null, '').optional(),
  cliente_telefone: Joi.string().allow(null, '').optional()
})

// Schema para dados de cliente (usado internamente)
const clienteDataSchema = Joi.object({
  nome: Joi.string().min(2).required(),
  cnpj: Joi.string().allow(null, '').optional(),
  contato: Joi.string().allow(null, '').optional(),
  telefone: Joi.string().allow(null, '').optional(),
  email: Joi.string().email().allow(null, '').optional(),
  endereco: Joi.string().allow(null, '').optional(),
  cidade: Joi.string().allow(null, '').optional(),
  estado: Joi.string().allow(null, '').optional(),
  cep: Joi.string().allow(null, '').optional()
})

/**
 * @swagger
 * /api/gruas:
 *   get:
 *     summary: Listar todas as gruas
 *     tags: [Gruas]
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
 *           enum: [Disponível, Operacional, Manutenção, Vendida]
 *         description: Filtrar por status
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [Grua Torre, Grua Móvel, Guincho, Outros]
 *         description: Filtrar por tipo
 *     responses:
 *       200:
 *         description: Lista de gruas
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
 *                     $ref: '#/components/schemas/GruaComRelacionamentos'
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
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { status, tipo } = req.query

    // Construir query com relacionamentos
    let query = supabaseAdmin
      .from('gruas')
      .select(`
        *,
        grua_funcionarios:grua_funcionario(
          id,
          funcionario_id,
          obra_id,
          data_inicio,
          data_fim,
          status,
          observacoes,
          funcionario:funcionarios(
            id,
            nome,
            cargo,
            telefone,
            email,
            status
          ),
          obra:obras(
            id,
            nome,
            status
          )
        ),
        grua_equipamentos:grua_equipamento(
          id,
          equipamento_id,
          obra_id,
          data_inicio,
          data_fim,
          status,
          observacoes,
          equipamento:equipamentos_auxiliares(
            id,
            nome,
            tipo,
            capacidade,
            status
          ),
          obra:obras(
            id,
            nome,
            status
          )
        ),
        grua_obras:grua_obra(
          id,
          obra_id,
          data_inicio_locacao,
          data_fim_locacao,
          valor_locacao_mensal,
          status,
          observacoes,
          obra:obras(
            id,
            nome,
            cliente_id,
            status,
            tipo,
            contato_obra,
            telefone_obra,
            email_obra,
            cliente:clientes(
              id,
              nome,
              cnpj,
              email,
              telefone,
              contato
            )
          )
        )
      `, { count: 'exact' })

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }
    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar gruas',
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
    console.error('Erro ao listar gruas:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/gruas/{id}:
 *   get:
 *     summary: Obter grua por ID
 *     tags: [Gruas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da grua
 *     responses:
 *       200:
 *         description: Dados da grua
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GruaComRelacionamentos'
 *       404:
 *         description: Grua não encontrada
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('gruas')
      .select(`
        *,
        grua_funcionarios:grua_funcionario(
          id,
          funcionario_id,
          obra_id,
          data_inicio,
          data_fim,
          status,
          observacoes,
          funcionario:funcionarios(
            id,
            nome,
            cargo,
            telefone,
            email,
            status
          ),
          obra:obras(
            id,
            nome,
            status
          )
        ),
        grua_equipamentos:grua_equipamento(
          id,
          equipamento_id,
          obra_id,
          data_inicio,
          data_fim,
          status,
          observacoes,
          equipamento:equipamentos_auxiliares(
            id,
            nome,
            tipo,
            capacidade,
            status
          ),
          obra:obras(
            id,
            nome,
            status
          )
        ),
        grua_obras:grua_obra(
          id,
          obra_id,
          data_inicio_locacao,
          data_fim_locacao,
          valor_locacao_mensal,
          status,
          observacoes,
          obra:obras(
            id,
            nome,
            cliente_id,
            status,
            tipo,
            contato_obra,
            telefone_obra,
            email_obra,
            cliente:clientes(
              id,
              nome,
              cnpj,
              email,
              telefone,
              contato
            )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Grua não encontrada',
          message: 'A grua com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao buscar grua',
        message: error.message
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao buscar grua:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/gruas:
 *   post:
 *     summary: Criar nova grua
 *     tags: [Gruas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GruaInput'
 *     responses:
 *       201:
 *         description: Grua criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Permissão insuficiente
 */
router.post('/', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = gruaInputSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Buscar ou criar cliente se dados do cliente foram fornecidos
    let cliente = null
    if (value.cliente_nome) {
      cliente = await buscarOuCriarCliente({
        nome: value.cliente_nome,
        cnpj: value.cliente_documento,
        email: value.cliente_email,
        telefone: value.cliente_telefone
      })
    }

    // Preparar dados da grua (apenas campos que existem na tabela gruas)
    const gruaData = {
      modelo: value.modelo,
      fabricante: value.fabricante,
      tipo: value.tipo,
      capacidade: value.capacidade,
      capacidade_ponta: value.capacidade_ponta,
      lanca: value.lanca,
      altura_trabalho: value.altura_trabalho,
      ano: value.ano,
      status: value.status,
      localizacao: value.localizacao,
      horas_operacao: value.horas_operacao,
      valor_locacao: value.valor_locacao,
      valor_operacao: value.valor_operacao,
      valor_sinaleiro: value.valor_sinaleiro,
      valor_manutencao: value.valor_manutencao,
      ultima_manutencao: value.ultima_manutencao,
      proxima_manutencao: value.proxima_manutencao,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error: insertError } = await supabaseAdmin
      .from('gruas')
      .insert(gruaData)
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({
        error: 'Erro ao criar grua',
        message: insertError.message
      })
    }

    res.status(201).json({
      success: true,
      data: {
        ...data,
        cliente: cliente
      },
      message: 'Grua criada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar grua:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/gruas/{id}:
 *   put:
 *     summary: Atualizar grua
 *     tags: [Gruas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da grua
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GruaInput'
 *     responses:
 *       200:
 *         description: Grua atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Grua não encontrada
 *       403:
 *         description: Permissão insuficiente
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validar dados
    const { error, value } = gruaInputSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      })
    }

    // Buscar ou criar cliente se dados do cliente foram fornecidos
    let cliente = null
    if (value.cliente_nome) {
      cliente = await buscarOuCriarCliente({
        nome: value.cliente_nome,
        cnpj: value.cliente_documento,
        email: value.cliente_email,
        telefone: value.cliente_telefone
      })
    }

    // Preparar dados da grua (apenas campos que existem na tabela gruas)
    const updateData = {
      modelo: value.modelo,
      fabricante: value.fabricante,
      tipo: value.tipo,
      capacidade: value.capacidade,
      capacidade_ponta: value.capacidade_ponta,
      lanca: value.lanca,
      altura_trabalho: value.altura_trabalho,
      ano: value.ano,
      status: value.status,
      localizacao: value.localizacao,
      horas_operacao: value.horas_operacao,
      valor_locacao: value.valor_locacao,
      valor_operacao: value.valor_operacao,
      valor_sinaleiro: value.valor_sinaleiro,
      valor_manutencao: value.valor_manutencao,
      ultima_manutencao: value.ultima_manutencao,
      proxima_manutencao: value.proxima_manutencao,
      updated_at: new Date().toISOString()
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('gruas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Grua não encontrada',
          message: 'A grua com o ID especificado não existe'
        })
      }
      return res.status(500).json({
        error: 'Erro ao atualizar grua',
        message: updateError.message
      })
    }

    res.json({
      success: true,
      data: {
        ...data,
        cliente: cliente
      },
      message: 'Grua atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar grua:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/gruas/{id}:
 *   delete:
 *     summary: Excluir grua
 *     tags: [Gruas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da grua
 *     responses:
 *       200:
 *         description: Grua excluída com sucesso
 *       404:
 *         description: Grua não encontrada
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('gruas')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({
        error: 'Erro ao excluir grua',
        message: error.message
      })
    }

    res.json({
      success: true,
      message: 'Grua excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir grua:', error)
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
 *     Grua:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único da grua
 *         modelo:
 *           type: string
 *           description: Modelo da grua
 *         fabricante:
 *           type: string
 *           description: Fabricante da grua
 *         tipo:
 *           type: string
 *           enum: [Grua Torre, Grua Móvel, Guincho, Outros]
 *           description: Tipo da grua
 *         capacidade:
 *           type: string
 *           description: Capacidade máxima da grua
 *         capacidade_ponta:
 *           type: string
 *           description: Capacidade na ponta da lança
 *         lanca:
 *           type: string
 *           description: Comprimento da lança
 *         altura_trabalho:
 *           type: string
 *           description: Altura máxima de trabalho
 *         ano:
 *           type: integer
 *           description: Ano de fabricação
 *         status:
 *           type: string
 *           enum: [Disponível, Operacional, Manutenção, Vendida]
 *           description: Status atual da grua
 *         localizacao:
 *           type: string
 *           description: Localização atual da grua
 *         horas_operacao:
 *           type: integer
 *           description: Total de horas de operação
 *         valor_locacao:
 *           type: number
 *           description: Valor de locação por período
 *         valor_operacao:
 *           type: number
 *           description: Valor de operação
 *         valor_sinaleiro:
 *           type: number
 *           description: Valor do sinaleiro
 *         valor_manutencao:
 *           type: number
 *           description: Valor de manutenção
 *         ultima_manutencao:
 *           type: string
 *           format: date
 *           description: Data da última manutenção
 *         proxima_manutencao:
 *           type: string
 *           format: date
 *           description: Data da próxima manutenção
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *     
 *     GruaInput:
 *       type: object
 *       required:
 *         - modelo
 *         - fabricante
 *         - tipo
 *         - capacidade
 *         - capacidade_ponta
 *         - lanca
 *       properties:
 *         modelo:
 *           type: string
 *           minLength: 2
 *           description: Modelo da grua
 *         fabricante:
 *           type: string
 *           minLength: 2
 *           description: Fabricante da grua
 *         tipo:
 *           type: string
 *           enum: [Grua Torre, Grua Móvel, Guincho, Outros]
 *           description: Tipo da grua
 *         capacidade:
 *           type: string
 *           description: Capacidade máxima da grua
 *         capacidade_ponta:
 *           type: string
 *           description: Capacidade na ponta da lança
 *         lanca:
 *           type: string
 *           description: Comprimento da lança
 *         altura_trabalho:
 *           type: string
 *           description: Altura máxima de trabalho
 *         ano:
 *           type: integer
 *           minimum: 1900
 *           maximum: 2025
 *           description: Ano de fabricação
 *         status:
 *           type: string
 *           enum: [Disponível, Operacional, Manutenção, Vendida]
 *           default: Disponível
 *           description: Status atual da grua
 *         localizacao:
 *           type: string
 *           description: Localização atual da grua
 *         horas_operacao:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *           description: Total de horas de operação
 *         valor_locacao:
 *           type: number
 *           minimum: 0
 *           description: Valor de locação por período
 *         valor_operacao:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Valor de operação
 *         valor_sinaleiro:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Valor do sinaleiro
 *         valor_manutencao:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Valor de manutenção
 *         ultima_manutencao:
 *           type: string
 *           format: date
 *           description: Data da última manutenção
 *         proxima_manutencao:
 *           type: string
 *           format: date
 *           description: Data da próxima manutenção
 *         # Campos opcionais para criação de cliente
 *         cliente_nome:
 *           type: string
 *           description: Nome do cliente (opcional)
 *         cliente_documento:
 *           type: string
 *           description: CNPJ/CPF do cliente (opcional)
 *         cliente_email:
 *           type: string
 *           format: email
 *           description: Email do cliente (opcional)
 *         cliente_telefone:
 *           type: string
 *           description: Telefone do cliente (opcional)
 *     
 *     GruaComRelacionamentos:
 *       allOf:
 *         - $ref: '#/components/schemas/Grua'
 *         - type: object
 *           properties:
 *             grua_funcionarios:
 *               type: array
 *               description: Funcionários relacionados à grua
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   funcionario_id:
 *                     type: integer
 *                   obra_id:
 *                     type: integer
 *                   data_inicio:
 *                     type: string
 *                     format: date
 *                   data_fim:
 *                     type: string
 *                     format: date
 *                   status:
 *                     type: string
 *                     enum: [Ativo, Inativo]
 *                   observacoes:
 *                     type: string
 *                   funcionario:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       cargo:
 *                         type: string
 *                       telefone:
 *                         type: string
 *                       email:
 *                         type: string
 *                       status:
 *                         type: string
 *                   obra:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       status:
 *                         type: string
 *             grua_equipamentos:
 *               type: array
 *               description: Equipamentos relacionados à grua
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   equipamento_id:
 *                     type: integer
 *                   obra_id:
 *                     type: integer
 *                   data_inicio:
 *                     type: string
 *                     format: date
 *                   data_fim:
 *                     type: string
 *                     format: date
 *                   status:
 *                     type: string
 *                     enum: [Ativo, Inativo]
 *                   observacoes:
 *                     type: string
 *                   equipamento:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       tipo:
 *                         type: string
 *                       capacidade:
 *                         type: string
 *                       status:
 *                         type: string
 *                   obra:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       status:
 *                         type: string
 *             grua_obras:
 *               type: array
 *               description: Obras relacionadas à grua
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   obra_id:
 *                     type: integer
 *                   data_inicio_locacao:
 *                     type: string
 *                     format: date
 *                   data_fim_locacao:
 *                     type: string
 *                     format: date
 *                   valor_locacao_mensal:
 *                     type: number
 *                   status:
 *                     type: string
 *                     enum: [Ativa, Concluída, Suspensa]
 *                   observacoes:
 *                     type: string
 *                   obra:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       cliente_id:
 *                         type: integer
 *                       status:
 *                         type: string
 *                       tipo:
 *                         type: string
 *                       contato_obra:
 *                         type: string
 *                       telefone_obra:
 *                         type: string
 *                       email_obra:
 *                         type: string
 *                       cliente:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                           cnpj:
 *                             type: string
 *                           email:
 *                             type: string
 *                           telefone:
 *                             type: string
 *                           contato:
 *                             type: string
 */

export default router
