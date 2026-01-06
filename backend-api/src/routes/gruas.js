import express from 'express'
import Joi from 'joi'
import { supabase, supabaseAdmin } from '../config/supabase.js'
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

// Função auxiliar para enriquecer dados da grua com informações calculadas
const enriquecerDadosGrua = async (grua) => {
  try {
    // Buscar obra atual da grua
    const { data: obraAtual, error: obraError } = await supabaseAdmin
      .from('grua_obra')
      .select(`
        obra_id,
        obra:obras(id, nome)
      `)
      .eq('grua_id', grua.id)
      .eq('status', 'Ativa')
      .single()

    // Enriquecer dados
    const gruaEnriquecida = {
      ...grua,
      // Campos calculados para compatibilidade com mocks
      name: grua.name || `Grua ${grua.id}`,
      model: grua.modelo, // modelo -> model para frontend
      fabricante: grua.fabricante, // fabricante -> fabricante para frontend
      tipo: grua.tipo, // tipo -> tipo para frontend
      capacity: grua.capacidade, // capacidade -> capacity para frontend
      currentObraId: obraAtual?.obra_id?.toString() || null,
      currentObraName: obraAtual?.obra?.nome || null,
      
      // Campos de compatibilidade com frontend
      alturaTrabalho: grua.altura_trabalho,
      capacidadePonta: grua.capacidade_ponta,
      valorLocacao: grua.valor_locacao,
      valorOperacao: grua.valor_operacao,
      valorSinaleiro: grua.valor_sinaleiro,
      valorManutencao: grua.valor_manutencao,
      horasOperacao: grua.horas_operacao,
      ultimaManutencao: grua.ultima_manutencao,
      proximaManutencao: grua.proxima_manutencao
    }

    return gruaEnriquecida
  } catch (error) {
    console.warn('Erro ao enriquecer dados da grua:', error.message)
    return {
      ...grua,
      name: grua.name || `Grua ${grua.id}`,
      model: grua.modelo, // modelo -> model para frontend
      fabricante: grua.fabricante, // fabricante -> fabricante para frontend
      tipo: grua.tipo, // tipo -> tipo para frontend
      capacity: grua.capacidade, // capacidade -> capacity para frontend
      currentObraId: null,
      currentObraName: null
    }
  }
}

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

// Schema de validação para gruas - baseado nos campos do frontend
const gruaSchema = Joi.object({
  // Campos obrigatórios (baseados no frontend)
  name: Joi.string().min(2).required(), // Nome da grua (ex: "Grua 001")
  model: Joi.string().min(2).required(), // Modelo da grua
  capacity: Joi.string().required(), // Capacidade da grua
  status: Joi.string().valid('Disponível', 'Operacional', 'Manutenção', 'Vendida', 'disponivel', 'em_obra', 'manutencao', 'inativa').default('disponivel'),
  
  // Campos técnicos obrigatórios
  fabricante: Joi.string().min(2).required().messages({
    'string.min': 'Fabricante é obrigatório',
    'any.required': 'Fabricante é obrigatório'
  }),
  tipo: Joi.string().valid('Grua Torre', 'Grua Torre Auto Estável', 'Grua Móvel').required().messages({
    'any.only': 'Tipo deve ser: Grua Torre, Grua Torre Auto Estável ou Grua Móvel',
    'any.required': 'Tipo é obrigatório'
  }),
  lanca: Joi.string().min(1).required().messages({
    'string.min': 'Lança é obrigatória',
    'any.required': 'Lança é obrigatória'
  }),
  altura_final: Joi.number().min(0).required().messages({
    'number.base': 'Altura final deve ser um número',
    'number.min': 'Altura final não pode ser negativa',
    'any.required': 'Altura final é obrigatória'
  }),
  ano: Joi.number().integer().min(1900).max(new Date().getFullYear()).required().messages({
    'number.base': 'Ano deve ser um número',
    'number.integer': 'Ano deve ser um número inteiro',
    'number.min': 'Ano deve ser maior ou igual a 1900',
    'number.max': `Ano deve ser menor ou igual a ${new Date().getFullYear()}`,
    'any.required': 'Ano é obrigatório'
  }),
  tipo_base: Joi.string().min(2).required().messages({
    'string.min': 'Tipo de base é obrigatório',
    'any.required': 'Tipo de base é obrigatório'
  }),
  capacidade_1_cabo: Joi.number().min(0).required().messages({
    'number.base': 'Capacidade com 2 cabos (mínima) deve ser um número',
    'number.min': 'Capacidade com 2 cabos (mínima) não pode ser negativa',
    'any.required': 'Capacidade com 2 cabos (mínima) é obrigatória'
  }),
  capacidade_2_cabos: Joi.number().min(0).required().messages({
    'number.base': 'Capacidade com 4 cabos (máxima) deve ser um número',
    'number.min': 'Capacidade com 4 cabos (máxima) não pode ser negativa',
    'any.required': 'Capacidade com 4 cabos (máxima) é obrigatória'
  }),
  potencia_instalada: Joi.number().min(0).required().messages({
    'number.base': 'Potência instalada deve ser um número',
    'number.min': 'Potência instalada não pode ser negativa',
    'any.required': 'Potência instalada é obrigatória'
  }),
  voltagem: Joi.string().min(1).required().messages({
    'string.min': 'Voltagem é obrigatória',
    'any.required': 'Voltagem é obrigatória'
  }),
  velocidade_rotacao: Joi.number().min(0).required().messages({
    'number.base': 'Velocidade de rotação deve ser um número',
    'number.min': 'Velocidade de rotação não pode ser negativa',
    'any.required': 'Velocidade de rotação é obrigatória'
  }),
  velocidade_elevacao: Joi.number().min(0).required().messages({
    'number.base': 'Velocidade de elevação deve ser um número',
    'number.min': 'Velocidade de elevação não pode ser negativa',
    'any.required': 'Velocidade de elevação é obrigatória'
  }),
  
  // Campos opcionais (baseados no frontend)
  obraId: Joi.string().allow(null, '').optional(), // ID da obra (opcional)
  observacoes: Joi.string().allow(null, '').optional(), // Observações (opcional)
  capacidade_ponta: Joi.string().allow(null, '').optional(),
  altura_trabalho: Joi.string().allow(null, '').optional(),
  localizacao: Joi.string().allow(null, '').optional(),
  horas_operacao: Joi.number().integer().min(0).default(0),
  valor_locacao: Joi.number().min(0).allow(null).optional(),
  valor_real: Joi.number().min(0).default(0),
  valor_operacao: Joi.number().min(0).default(0),
  valor_sinaleiro: Joi.number().min(0).default(0),
  valor_manutencao: Joi.number().min(0).default(0),
  ultima_manutencao: Joi.date().allow(null).optional(),
  proxima_manutencao: Joi.date().allow(null).optional(),
  
  // Campos adicionais para compatibilidade com mocks (serão calculados dinamicamente)
  currentObraId: Joi.string().allow(null, '').optional(), // ID da obra atual - obtido de grua_obra
  currentObraName: Joi.string().allow(null, '').optional() // Nome da obra atual - obtido de grua_obra
})

// Schema para dados de entrada (baseado nos campos do frontend)
const gruaInputSchema = Joi.object({
  // Campos obrigatórios (baseados no frontend)
  name: Joi.string().min(2).required(), // Nome da grua (ex: "Grua 001")
  model: Joi.string().min(2).required(), // Modelo da grua
  capacity: Joi.string().required(), // Capacidade da grua
  status: Joi.string().valid('Disponível', 'Operacional', 'Manutenção', 'Vendida', 'disponivel', 'em_obra', 'manutencao', 'inativa').default('disponivel'),
  
  // Campos técnicos obrigatórios
  fabricante: Joi.string().min(2).required().messages({
    'string.min': 'Fabricante é obrigatório',
    'any.required': 'Fabricante é obrigatório'
  }),
  tipo: Joi.string().valid('Grua Torre', 'Grua Torre Auto Estável', 'Grua Móvel').required().messages({
    'any.only': 'Tipo deve ser: Grua Torre, Grua Torre Auto Estável ou Grua Móvel',
    'any.required': 'Tipo é obrigatório'
  }),
  lanca: Joi.string().min(1).required().messages({
    'string.min': 'Lança é obrigatória',
    'any.required': 'Lança é obrigatória'
  }),
  altura_final: Joi.number().min(0).required().messages({
    'number.base': 'Altura final deve ser um número',
    'number.min': 'Altura final não pode ser negativa',
    'any.required': 'Altura final é obrigatória'
  }),
  ano: Joi.number().integer().min(1900).max(new Date().getFullYear()).required().messages({
    'number.base': 'Ano deve ser um número',
    'number.integer': 'Ano deve ser um número inteiro',
    'number.min': 'Ano deve ser maior ou igual a 1900',
    'number.max': `Ano deve ser menor ou igual a ${new Date().getFullYear()}`,
    'any.required': 'Ano é obrigatório'
  }),
  tipo_base: Joi.string().min(2).required().messages({
    'string.min': 'Tipo de base é obrigatório',
    'any.required': 'Tipo de base é obrigatório'
  }),
  capacidade_1_cabo: Joi.number().min(0).required().messages({
    'number.base': 'Capacidade com 2 cabos (mínima) deve ser um número',
    'number.min': 'Capacidade com 2 cabos (mínima) não pode ser negativa',
    'any.required': 'Capacidade com 2 cabos (mínima) é obrigatória'
  }),
  capacidade_2_cabos: Joi.number().min(0).required().messages({
    'number.base': 'Capacidade com 4 cabos (máxima) deve ser um número',
    'number.min': 'Capacidade com 4 cabos (máxima) não pode ser negativa',
    'any.required': 'Capacidade com 4 cabos (máxima) é obrigatória'
  }),
  potencia_instalada: Joi.number().min(0).required().messages({
    'number.base': 'Potência instalada deve ser um número',
    'number.min': 'Potência instalada não pode ser negativa',
    'any.required': 'Potência instalada é obrigatória'
  }),
  voltagem: Joi.string().min(1).required().messages({
    'string.min': 'Voltagem é obrigatória',
    'any.required': 'Voltagem é obrigatória'
  }),
  velocidade_rotacao: Joi.number().min(0).required().messages({
    'number.base': 'Velocidade de rotação deve ser um número',
    'number.min': 'Velocidade de rotação não pode ser negativa',
    'any.required': 'Velocidade de rotação é obrigatória'
  }),
  velocidade_elevacao: Joi.number().min(0).required().messages({
    'number.base': 'Velocidade de elevação deve ser um número',
    'number.min': 'Velocidade de elevação não pode ser negativa',
    'any.required': 'Velocidade de elevação é obrigatória'
  }),
  
  // Campos opcionais (baseados no frontend)
  obraId: Joi.string().allow(null, '').optional(), // ID da obra (opcional)
  observacoes: Joi.string().allow(null, '').optional(), // Observações (opcional)
  capacidade_ponta: Joi.string().allow(null, '').optional(),
  altura_trabalho: Joi.string().allow(null, '').optional(),
  localizacao: Joi.string().allow(null, '').optional(),
  horas_operacao: Joi.number().integer().min(0).default(0),
  valor_locacao: Joi.number().min(0).allow(null).optional(),
  valor_real: Joi.number().min(0).default(0),
  valor_operacao: Joi.number().min(0).default(0),
  valor_sinaleiro: Joi.number().min(0).default(0),
  valor_manutencao: Joi.number().min(0).default(0),
  ultima_manutencao: Joi.date().allow(null).optional(),
  proxima_manutencao: Joi.date().allow(null).optional(),
  
  // Campos adicionais para compatibilidade com mocks (serão calculados dinamicamente)
  currentObraId: Joi.string().allow(null, '').optional(), // ID da obra atual - obtido de grua_obra
  currentObraName: Joi.string().allow(null, '').optional(), // Nome da obra atual - obtido de grua_obra
  
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
    const { status, tipo, search } = req.query

    // Construir query simples (sem relacionamentos por enquanto)
    let query = supabaseAdmin
      .from('gruas')
      .select('*', { count: 'exact' })

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }
    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    // Aplicar busca por texto (search)
    if (search) {
      // Decodificar o termo de busca (pode vir com + ou %20 para espaços)
      let searchTerm = decodeURIComponent(search.replace(/\+/g, ' '))
      
      // Buscar em múltiplos campos: id, name, modelo, fabricante
      query = query.or(`id.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,modelo.ilike.%${searchTerm}%,fabricante.ilike.%${searchTerm}%`)
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

    // Enriquecer dados de cada grua
    const gruasEnriquecidas = (data || []).map(grua => ({
      ...grua,
      // Campos calculados para compatibilidade com mocks
      name: grua.name || `Grua ${grua.id}`,
      model: grua.modelo, // modelo -> model para frontend
      fabricante: grua.fabricante, // fabricante -> fabricante para frontend
      tipo: grua.tipo, // tipo -> tipo para frontend
      capacity: grua.capacidade, // capacidade -> capacity para frontend
      currentObraId: null,
      currentObraName: null,
      
      // Campos de compatibilidade com frontend
      alturaTrabalho: grua.altura_trabalho,
      capacidadePonta: grua.capacidade_ponta,
      valorLocacao: grua.valor_locacao,
      valorOperacao: grua.valor_operacao,
      valorSinaleiro: grua.valor_sinaleiro,
      valorManutencao: grua.valor_manutencao,
      horasOperacao: grua.horas_operacao,
      ultimaManutencao: grua.ultima_manutencao,
      proximaManutencao: grua.proxima_manutencao
    }))

    res.json({
      success: true,
      data: gruasEnriquecidas,
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
 * /api/gruas/funcionario/{funcionario_id}:
 *   get:
 *     summary: Listar gruas de um funcionário
 *     tags: [Gruas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: funcionario_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do funcionário
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Ativo, Inativo]
 *         description: Filtrar por status do relacionamento
 *     responses:
 *       200:
 *         description: Lista de gruas do funcionário
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
 *                       grua_id:
 *                         type: string
 *                       funcionario_id:
 *                         type: integer
 *                       obra_id:
 *                         type: integer
 *                       data_inicio:
 *                         type: string
 *                         format: date
 *                       data_fim:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                       grua:
 *                         type: object
 *                       obra:
 *                         type: object
 *       404:
 *         description: Funcionário não encontrado
 */
router.get('/funcionario/:funcionario_id', async (req, res) => {
  try {
    const { funcionario_id } = req.params
    const { status } = req.query

    if (!funcionario_id) {
      return res.status(400).json({
        error: 'ID do funcionário inválido',
        message: 'O ID do funcionário deve ser fornecido'
      })
    }

    // Buscar relacionamentos grua-funcionário
    let query = supabaseAdmin
      .from('grua_funcionario')
      .select(`
        *,
        grua:gruas(
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
        obra:obras(
          id,
          nome,
          status,
          endereco,
          cidade,
          estado
        )
      `)
      .eq('funcionario_id', funcionario_id)

    // Aplicar filtro de status se fornecido
    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('data_inicio', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar gruas do funcionário:', error)
      return res.status(500).json({
        error: 'Erro ao buscar gruas',
        message: error.message
      })
    }

    // Enriquecer dados das gruas
    const gruasEnriquecidas = (data || []).map((relacao) => ({
      ...relacao,
      grua: relacao.grua ? {
        ...relacao.grua,
        model: relacao.grua.modelo,
        capacity: relacao.grua.capacidade,
        currentObraId: relacao.obra_id?.toString() || null,
        currentObraName: relacao.obra?.nome || null
      } : null
    }))

    res.json({
      success: true,
      data: gruasEnriquecidas,
      total: gruasEnriquecidas.length
    })
  } catch (error) {
    console.error('Erro ao buscar gruas do funcionário:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /api/gruas/export:
 *   get:
 *     summary: Exportar todas as gruas (sem paginação)
 *     tags: [Gruas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Lista completa de gruas com relacionamentos
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
 *                 total:
 *                   type: integer
 *                   description: Total de registros retornados
 */
router.get('/export', async (req, res) => {
  try {
    const { status, tipo } = req.query

    // Construir query simples (sem relacionamentos por enquanto)
    let query = supabaseAdmin
      .from('gruas')
      .select('*', { count: 'exact' })

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }
    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    // Ordenar por data de criação (mais recentes primeiro)
    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({
        error: 'Erro ao exportar gruas',
        message: error.message
      })
    }

    // Enriquecer dados de cada grua (temporariamente simplificado para debug)
    const gruasEnriquecidas = (data || []).map(grua => ({
      ...grua,
      // Campos calculados para compatibilidade com mocks
      name: grua.name || `Grua ${grua.id}`,
      model: grua.modelo, // modelo -> model para frontend
      fabricante: grua.fabricante, // fabricante -> fabricante para frontend
      tipo: grua.tipo, // tipo -> tipo para frontend
      capacity: grua.capacidade, // capacidade -> capacity para frontend
      currentObraId: null,
      currentObraName: null,
      
      // Campos de compatibilidade com frontend
      alturaTrabalho: grua.altura_trabalho,
      capacidadePonta: grua.capacidade_ponta,
      valorLocacao: grua.valor_locacao,
      valorOperacao: grua.valor_operacao,
      valorSinaleiro: grua.valor_sinaleiro,
      valorManutencao: grua.valor_manutencao,
      horasOperacao: grua.horas_operacao,
      ultimaManutencao: grua.ultima_manutencao,
      proximaManutencao: grua.proxima_manutencao
    }))

    res.json({
      success: true,
      data: gruasEnriquecidas,
      total: count || 0
    })
  } catch (error) {
    console.error('Erro ao exportar gruas:', error)
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
    
    if (!id) {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'O ID ou código da grua deve ser fornecido'
      })
    }

    // IMPORTANTE: O campo 'id' pode ser alfanumérico (ex: "G0063")
    // Sempre tentar buscar por 'id' primeiro, independente de ser numérico ou não
    console.log(`[DEBUG] Buscando grua por ID: "${id}"`)
    
    // Buscar a grua primeiro (sem relacionamentos para ser mais rápido)
    let grua = null
    
    // Estratégia 1: Tentar buscar diretamente por ID (pode ser numérico ou alfanumérico)
    // Limpar o ID de espaços em branco antes de buscar
    const idLimpo = id.trim()
    
    console.log(`[DEBUG] Buscando grua por ID limpo: "${idLimpo}" (original: "${id}")`)
    
    let { data: gruaPorId, error: errorPorId } = await supabaseAdmin
      .from('gruas')
      .select('*')
      .eq('id', idLimpo)
      .maybeSingle()
    
    console.log(`[DEBUG] Resultado busca por ID - gruaPorId:`, gruaPorId ? `Encontrada (ID: ${gruaPorId.id}, name: ${gruaPorId.name})` : 'null')
    console.log(`[DEBUG] Resultado busca por ID - errorPorId:`, errorPorId)
    
    if (errorPorId) {
      console.error(`[DEBUG] Erro ao buscar grua por ID:`, errorPorId)
    }
    
    if (gruaPorId && !errorPorId) {
      console.log(`[DEBUG] Grua encontrada por ID: ${gruaPorId.name || gruaPorId.id} (ID: ${gruaPorId.id})`)
      grua = gruaPorId
    } else {
      // Se não encontrou por ID, tentar buscar por 'name' (fallback)
      console.log(`[DEBUG] Grua não encontrada por ID, tentando buscar por 'name': "${idLimpo}"`)
      // Buscar por código/nome alfanumérico - tentar múltiplas estratégias
      console.log(`[DEBUG] Buscando grua por código: "${idLimpo}"`)
      
      const idLimpoUpper = idLimpo.toUpperCase()
      
      // Estratégia 1: Buscar todas as gruas e filtrar manualmente (mais confiável)
      // Isso garante que vamos encontrar mesmo se houver problemas com a query do Supabase
      console.log(`[DEBUG] Estratégia 1: Buscando todas as gruas para filtro manual...`)
      const { data: todasGruas, error: errorTodas } = await supabaseAdmin
        .from('gruas')
        .select('id, name')
      
      if (!errorTodas && todasGruas && todasGruas.length > 0) {
        console.log(`[DEBUG] Total de gruas encontradas: ${todasGruas.length}`)
        console.log(`[DEBUG] Primeiras 5 gruas:`, todasGruas.slice(0, 5).map(g => ({ id: g.id, name: g.name })))
        
        // Buscar a grua que corresponde ao código
        const gruaEncontrada = todasGruas.find(g => {
          const name = (g.name || '').trim()
          const nameUpper = name.toUpperCase()
          
          // Verificar correspondência exata ou parcial
          return nameUpper === idLimpoUpper || 
                 nameUpper.includes(idLimpoUpper) ||
                 name === idLimpo ||
                 name.includes(idLimpo)
        })
        
        if (gruaEncontrada) {
          console.log(`[DEBUG] Grua encontrada com busca manual: "${gruaEncontrada.name}" (ID: ${gruaEncontrada.id})`)
          
          // Buscar a grua completa
          const { data: gruaCompleta, error: errorCompleta } = await supabaseAdmin
            .from('gruas')
            .select('*')
            .eq('id', gruaEncontrada.id)
            .single()
          
          if (gruaCompleta && !errorCompleta) {
            grua = gruaCompleta
          } else {
            console.error(`[DEBUG] Erro ao buscar grua completa:`, errorCompleta)
          }
        } else {
          console.log(`[DEBUG] Nenhuma grua encontrada com busca manual. Tentando outras estratégias...`)
          
          // Estratégia 2: Busca exata case-insensitive
          let { data: gruaExata, error: errorExata } = await supabaseAdmin
            .from('gruas')
            .select('*')
            .ilike('name', idLimpo)
            .limit(1)
            .maybeSingle()
          
          if (gruaExata && !errorExata) {
            console.log(`[DEBUG] Grua encontrada com busca exata ilike: ${gruaExata.name} (ID: ${gruaExata.id})`)
            grua = gruaExata
          } else {
            // Estratégia 3: Busca parcial case-insensitive
            let { data: gruaParcial, error: errorParcial } = await supabaseAdmin
              .from('gruas')
              .select('*')
              .ilike('name', `%${idLimpo}%`)
              .limit(1)
              .maybeSingle()
            
            if (gruaParcial && !errorParcial) {
              console.log(`[DEBUG] Grua encontrada com busca parcial: ${gruaParcial.name} (ID: ${gruaParcial.id})`)
              grua = gruaParcial
            } else {
              // Estratégia 4: Busca exata case-sensitive
              let { data: gruaCaseSensitive, error: errorCaseSensitive } = await supabaseAdmin
                .from('gruas')
                .select('*')
                .eq('name', idLimpo)
                .limit(1)
                .maybeSingle()
              
              if (gruaCaseSensitive && !errorCaseSensitive) {
                console.log(`[DEBUG] Grua encontrada com busca case-sensitive: ${gruaCaseSensitive.name} (ID: ${gruaCaseSensitive.id})`)
                grua = gruaCaseSensitive
              }
            }
          }
        }
      } else {
        console.error(`[DEBUG] Erro ao buscar todas as gruas:`, errorTodas)
      }
      
      if (!grua) {
        console.log(`[DEBUG] Grua não encontrada por ID nem por name para: "${id}"`)
        console.log(`[DEBUG] Erro ao buscar por ID:`, errorPorId?.message)
        console.log(`[DEBUG] Verifique se a grua existe no banco de dados com ID="${id}" ou name="${id}"`)
        return res.status(404).json({
          error: 'Grua não encontrada',
          message: `A grua com o ID ou código "${id}" não foi encontrada. Verifique se o código está correto.`
        })
      }
    }

    if (!grua) {
      return res.status(404).json({
        error: 'Grua não encontrada',
        message: `A grua com o ID ou código "${id}" não foi encontrada`
      })
    }
    
    // Garantir que o campo name existe e não é null
    if (!grua.name) {
      grua.name = `Grua ${grua.id}`
    }
    
    // Agora buscar relacionamentos usando o ID da grua encontrada
    const { data: relacionamentos, error: relacionamentosError } = await supabaseAdmin
      .from('gruas')
      .select(`
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
      .eq('id', grua.id)
      .single()
    
    // Mesclar dados da grua com relacionamentos
    if (relacionamentos && !relacionamentosError) {
      grua = {
        ...grua,
        ...relacionamentos
      }
    }

    // Enriquecer dados da grua
    const gruaEnriquecida = await enriquecerDadosGrua(grua)

    // Buscar histórico de manutenções
    const { data: manutencoes } = await supabaseAdmin
      .from('historico_manutencoes')
      .select('*')
      .eq('grua_id', grua.id)
      .order('data_manutencao', { ascending: false })
      .limit(10)

    // Buscar obra ativa da grua
    const { data: obraAtiva } = await supabaseAdmin
      .from('grua_obra')
      .select(`
        *,
        obra:obras(
          id,
          nome,
          cliente_id,
          status,
          endereco,
          cidade,
          estado,
          cliente:clientes(
            id,
            nome,
            cnpj,
            email,
            telefone
          )
        )
      `)
      .eq('grua_id', grua.id)
      .eq('status', 'Ativa')
      .single()

    const responseData = {
      ...gruaEnriquecida,
      // Histórico de manutenções
      historico_manutencoes: manutencoes || [],
      
      // Dados da obra ativa
      obra_ativa: obraAtiva?.obra || null,
      cliente_ativo: obraAtiva?.obra?.cliente || null,
      
      // Campos para compatibilidade com frontend
      alturaTrabalho: grua.altura_trabalho,
      capacidadePonta: grua.capacidade_ponta,
      valorLocacao: grua.valor_locacao,
      valorOperacao: grua.valor_operacao,
      valorSinaleiro: grua.valor_sinaleiro,
      valorManutencao: grua.valor_manutencao,
      horasOperacao: grua.horas_operacao,
      ultimaManutencao: grua.ultima_manutencao,
      proximaManutencao: grua.proxima_manutencao
    }

    res.json({
      success: true,
      data: responseData
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

    // Preparar dados da grua (mapear campos do frontend para campos do banco)
    const gruaData = {
      // Campos obrigatórios do frontend
      name: value.name, // Nome da grua
      modelo: value.model, // model -> modelo
      fabricante: value.fabricante,
      tipo: value.tipo,
      capacidade: value.capacity, // capacity -> capacidade
      capacidade_ponta: value.capacidade_ponta || value.capacity || 'Não informado', // garantir que não seja null
      lanca: value.lanca,
      altura_trabalho: value.altura_trabalho || 'Não informado',
      altura_final: value.altura_final,
      ano: value.ano,
      tipo_base: value.tipo_base,
      capacidade_1_cabo: value.capacidade_1_cabo,
      capacidade_2_cabos: value.capacidade_2_cabos,
      potencia_instalada: value.potencia_instalada,
      voltagem: value.voltagem,
      velocidade_rotacao: value.velocidade_rotacao,
      velocidade_elevacao: value.velocidade_elevacao,
      status: value.status,
      localizacao: value.localizacao || 'Não informado',
      horas_operacao: value.horas_operacao || 0,
      valor_locacao: value.valor_locacao || null,
      valor_real: value.valor_real || 0,
      valor_operacao: value.valor_operacao || 0,
      valor_sinaleiro: value.valor_sinaleiro || 0,
      valor_manutencao: value.valor_manutencao || 0,
      ultima_manutencao: value.ultima_manutencao || null,
      proxima_manutencao: value.proxima_manutencao || null,
      observacoes: value.observacoes || null,
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
    
    if (!id) {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'O ID ou código da grua deve ser fornecido'
      })
    }

    // IMPORTANTE: O campo 'id' pode ser alfanumérico (ex: "G0001")
    // Sempre tentar buscar por 'id' primeiro, independente de ser numérico ou não
    console.log(`[DEBUG PUT] Buscando grua por ID para atualização: "${id}"`)
    
    // Limpar o ID de espaços em branco antes de buscar
    const idLimpo = id.trim()
    
    // Primeiro, buscar a grua para obter o ID real
    let gruaId = null
    let gruaExistente = null
    
    // Estratégia 1: Tentar buscar diretamente por ID (pode ser numérico ou alfanumérico)
    let { data: gruaPorId, error: errorPorId } = await supabaseAdmin
      .from('gruas')
      .select('id')
      .eq('id', idLimpo)
      .maybeSingle()
    
    console.log(`[DEBUG PUT] Resultado busca por ID - gruaPorId:`, gruaPorId ? `Encontrada (ID: ${gruaPorId.id})` : 'null')
    console.log(`[DEBUG PUT] Resultado busca por ID - errorPorId:`, errorPorId)
    
    if (gruaPorId && !errorPorId) {
      console.log(`[DEBUG PUT] Grua encontrada por ID: ${gruaPorId.id}`)
      gruaExistente = gruaPorId
      gruaId = gruaPorId.id
    } else {
      // Se não encontrou por ID, tentar buscar por 'name' (fallback)
      console.log(`[DEBUG PUT] Grua não encontrada por ID, tentando buscar por 'name': "${idLimpo}"`)
      
      // Estratégia 2: Busca exata case-insensitive
      let { data: gruaExata, error: errorExata } = await supabaseAdmin
        .from('gruas')
        .select('id')
        .ilike('name', idLimpo)
        .limit(1)
        .maybeSingle()
      
      if (gruaExata && !errorExata) {
        console.log(`[DEBUG PUT] Grua encontrada por name (ilike): ${gruaExata.id}`)
        gruaExistente = gruaExata
        gruaId = gruaExata.id
      } else {
        // Estratégia 3: Busca parcial case-insensitive
        let { data: gruaParcial, error: errorParcial } = await supabaseAdmin
          .from('gruas')
          .select('id')
          .ilike('name', `%${idLimpo}%`)
          .limit(1)
          .maybeSingle()
        
        if (gruaParcial && !errorParcial) {
          console.log(`[DEBUG PUT] Grua encontrada por name (parcial): ${gruaParcial.id}`)
          gruaExistente = gruaParcial
          gruaId = gruaParcial.id
        } else {
          // Estratégia 4: Busca exata case-sensitive
          let { data: gruaCaseSensitive, error: errorCaseSensitive } = await supabaseAdmin
            .from('gruas')
            .select('id')
            .eq('name', idLimpo)
            .limit(1)
            .maybeSingle()
          
          if (gruaCaseSensitive && !errorCaseSensitive) {
            console.log(`[DEBUG PUT] Grua encontrada por name (case-sensitive): ${gruaCaseSensitive.id}`)
            gruaExistente = gruaCaseSensitive
            gruaId = gruaCaseSensitive.id
          }
        }
      }
      
      if (!gruaExistente) {
        console.log(`[DEBUG PUT] Grua não encontrada por ID nem por name para: "${idLimpo}"`)
        return res.status(404).json({
          error: 'Grua não encontrada',
          message: `A grua com o código "${id}" não foi encontrada. Verifique se o código está correto.`
        })
      }
    }

    // Verificação de segurança: garantir que gruaId foi definido
    if (!gruaId) {
      console.error(`[DEBUG PUT] Erro: gruaId não foi definido para: "${idLimpo}"`)
      return res.status(404).json({
        error: 'Grua não encontrada',
        message: `A grua com o código "${id}" não foi encontrada. Verifique se o código está correto.`
      })
    }

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

    // Preparar dados da grua (mapear campos do frontend para campos do banco)
    const updateData = {
      // Campos obrigatórios do frontend
      name: value.name, // Nome da grua
      modelo: value.model, // model -> modelo
      fabricante: value.fabricante,
      tipo: value.tipo,
      capacidade: value.capacity, // capacity -> capacidade
      capacidade_ponta: value.capacidade_ponta || value.capacity || 'Não informado', // garantir que não seja null
      lanca: value.lanca,
      altura_trabalho: value.altura_trabalho || 'Não informado',
      altura_final: value.altura_final,
      ano: value.ano,
      tipo_base: value.tipo_base,
      capacidade_1_cabo: value.capacidade_1_cabo,
      capacidade_2_cabos: value.capacidade_2_cabos,
      potencia_instalada: value.potencia_instalada,
      voltagem: value.voltagem,
      velocidade_rotacao: value.velocidade_rotacao,
      velocidade_elevacao: value.velocidade_elevacao,
      status: value.status,
      localizacao: value.localizacao || 'Não informado',
      horas_operacao: value.horas_operacao || 0,
      valor_locacao: value.valor_locacao || null,
      valor_real: value.valor_real || 0,
      valor_operacao: value.valor_operacao || 0,
      valor_sinaleiro: value.valor_sinaleiro || 0,
      valor_manutencao: value.valor_manutencao || 0,
      ultima_manutencao: value.ultima_manutencao || null,
      proxima_manutencao: value.proxima_manutencao || null,
      observacoes: value.observacoes || null,
      updated_at: new Date().toISOString()
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('gruas')
      .update(updateData)
      .eq('id', gruaId)
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
    
    if (!id) {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'O ID ou código da grua deve ser fornecido'
      })
    }

    // Determinar se é um ID numérico/UUID ou um código/nome alfanumérico
    const isNumericOrUUID = !isNaN(Number(id)) || id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    
    // Primeiro, buscar a grua para obter o ID real se necessário
    let gruaId = id
    if (!isNumericOrUUID) {
      // Limpar o ID de espaços em branco
      const idLimpo = id.trim()
      
      // Buscar por código/nome alfanumérico no campo 'name'
      // Tentar múltiplas estratégias de busca
      let gruaExistente = null
      
      // Estratégia 1: Busca exata case-insensitive
      let { data: gruaExata, error: errorExata } = await supabaseAdmin
        .from('gruas')
        .select('id')
        .ilike('name', idLimpo)
        .limit(1)
        .maybeSingle()
      
      if (gruaExata && !errorExata) {
        gruaExistente = gruaExata
      } else {
        // Estratégia 2: Busca parcial case-insensitive
        let { data: gruaParcial, error: errorParcial } = await supabaseAdmin
          .from('gruas')
          .select('id')
          .ilike('name', `%${idLimpo}%`)
          .limit(1)
          .maybeSingle()
        
        if (gruaParcial && !errorParcial) {
          gruaExistente = gruaParcial
        } else {
          // Estratégia 3: Busca exata case-sensitive
          let { data: gruaCaseSensitive, error: errorCaseSensitive } = await supabaseAdmin
            .from('gruas')
            .select('id')
            .eq('name', idLimpo)
            .limit(1)
            .maybeSingle()
          
          if (gruaCaseSensitive && !errorCaseSensitive) {
            gruaExistente = gruaCaseSensitive
          }
        }
      }
      
      if (!gruaExistente) {
        return res.status(404).json({
          error: 'Grua não encontrada',
          message: `A grua com o código "${id}" não foi encontrada. Verifique se o código está correto.`
        })
      }
      gruaId = gruaExistente.id
    }

    const { error } = await supabaseAdmin
      .from('gruas')
      .delete()
      .eq('id', gruaId)

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
 *         valor_real:
 *           type: number
 *           description: Valor real/comercial da grua
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
 *         - name
 *         - model
 *         - capacity
 *         - status
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           description: Nome da grua (ex: Grua 001)
 *         model:
 *           type: string
 *           minLength: 2
 *           description: Modelo da grua
 *         capacity:
 *           type: string
 *           description: Capacidade da grua
 *         status:
 *           type: string
 *           enum: [Disponível, Operacional, Manutenção, Vendida, disponivel, em_obra, manutencao, inativa]
 *           default: disponivel
 *           description: Status atual da grua
 *         obraId:
 *           type: string
 *           description: ID da obra (opcional)
 *         observacoes:
 *           type: string
 *           description: Observações sobre a grua (opcional)
 *         fabricante:
 *           type: string
 *           description: Fabricante da grua (opcional)
 *         tipo:
 *           type: string
 *           enum: [Grua Torre, Grua Móvel, Guincho, Outros]
 *           description: Tipo da grua (opcional)
 *         capacidade_ponta:
 *           type: string
 *           description: Capacidade na ponta da lança (opcional)
 *         lanca:
 *           type: string
 *           description: Comprimento da lança (opcional)
 *         altura_trabalho:
 *           type: string
 *           description: Altura máxima de trabalho
 *         ano:
 *           type: integer
 *           minimum: 1900
 *           maximum: 2025
 *           description: Ano de fabricação
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
 *         valor_real:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Valor real/comercial da grua
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

/**
 * GET /api/gruas/cliente/:cliente_id
 * Listar gruas de um cliente (através das obras)
 * Se o usuário for cliente, valida que o cliente_id corresponde ao usuário
 */
router.get('/cliente/:cliente_id', authenticateToken, async (req, res) => {
  try {
    const { cliente_id } = req.params
    const userId = req.user?.id

    // Se o usuário for cliente, verificar se o cliente_id corresponde ao usuário
    const userRole = req.user?.role?.toLowerCase() || ''
    if (userRole.includes('cliente') || req.user?.level === 1) {
      const { data: cliente, error: clienteError } = await supabaseAdmin
        .from('clientes')
        .select('id')
        .eq('contato_usuario_id', userId)
        .eq('id', cliente_id)
        .single()

      if (clienteError || !cliente) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não tem permissão para acessar estas gruas'
        })
      }
    }

    // Buscar obras do cliente
    const { data: obras, error: obrasError } = await supabaseAdmin
      .from('obras')
      .select('id')
      .eq('cliente_id', cliente_id)
      .eq('status', 'ativa')

    if (obrasError) {
      return res.status(500).json({
        error: 'Erro ao buscar obras do cliente',
        message: obrasError.message
      })
    }

    const obraIds = obras?.map(o => o.id) || []

    if (obraIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        total: 0
      })
    }

    // Buscar gruas vinculadas às obras através de grua_obras
    const { data: gruaObras, error: gruaObrasError } = await supabaseAdmin
      .from('grua_obras')
      .select(`
        grua_id,
        gruas:grua_id (
          id,
          name,
          modelo,
          fabricante,
          capacidade,
          status
        )
      `)
      .in('obra_id', obraIds)

    if (gruaObrasError) {
      return res.status(500).json({
        error: 'Erro ao buscar gruas',
        message: gruaObrasError.message
      })
    }

    // Extrair gruas únicas
    const gruasUnicas = new Map()
    gruaObras?.forEach((go) => {
      if (go.gruas && !gruasUnicas.has(go.grua_id)) {
        gruasUnicas.set(go.grua_id, go.gruas)
      }
    })

    res.json({
      success: true,
      data: Array.from(gruasUnicas.values()),
      total: gruasUnicas.size
    })
  } catch (error) {
    console.error('Erro ao buscar gruas do cliente:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
