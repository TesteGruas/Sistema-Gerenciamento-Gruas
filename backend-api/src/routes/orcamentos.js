import express from 'express';
import Joi from 'joi';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Schema de validação para orçamento (básico - usado em updates parciais)
const orcamentoSchema = Joi.object({
  cliente_id: Joi.number().integer().optional(),
  data_orcamento: Joi.date().optional(),
  data_validade: Joi.date().optional(),
  valor_total: Joi.number().precision(2).optional(),
  desconto: Joi.number().precision(2).optional(),
  observacoes: Joi.string().allow('').optional(),
  status: Joi.string().valid('rascunho', 'enviado', 'aprovado', 'rejeitado', 'vencido', 'convertido').optional(),
  vendedor_id: Joi.number().integer().allow(null).optional(),
  condicoes_pagamento: Joi.string().allow('').optional(),
  prazo_entrega: Joi.string().allow('').optional(),
  tipo_orcamento: Joi.string().valid('equipamento', 'servico', 'locacao', 'venda').optional(),
  numero: Joi.string().allow('').optional(),
  obra_id: Joi.number().integer().allow(null).optional(),
  obra_nome: Joi.string().allow('').optional(),
  obra_tipo: Joi.string().allow('').optional(),
  obra_endereco: Joi.string().allow('').optional(),
  obra_cidade: Joi.string().allow('').optional(),
  obra_bairro: Joi.string().allow('').optional(),
  obra_cep: Joi.string().allow('').optional(),
  obra_engenheiro_responsavel: Joi.string().allow('').optional(),
  obra_contato: Joi.string().allow('').optional(),
  grua_id: Joi.number().integer().allow(null).optional(),
  grua_modelo: Joi.string().allow('').optional(),
  grua_lanca: Joi.number().precision(2).allow(null).optional(),
  grua_altura_final: Joi.number().precision(2).allow(null).optional(),
  grua_tipo_base: Joi.string().allow('').optional(),
  grua_ano: Joi.number().integer().allow(null).optional(),
  grua_potencia: Joi.number().precision(2).allow(null).optional(),
  grua_capacidade_1_cabo: Joi.number().precision(2).allow(null).optional(),
  grua_capacidade_2_cabos: Joi.number().precision(2).allow(null).optional(),
  grua_voltagem: Joi.string().allow('').optional(),
  cliente_endereco: Joi.string().allow('').optional(),
  cliente_bairro: Joi.string().allow('').optional(),
  cliente_cep: Joi.string().allow('').optional(),
  cliente_cidade: Joi.string().allow('').optional(),
  cliente_estado: Joi.string().allow('').optional(),
  cliente_telefone: Joi.string().allow('').optional(),
  cliente_email: Joi.string().email().allow('').optional(),
  cliente_contato: Joi.string().allow('').optional(),
  prazo_locacao_meses: Joi.number().integer().allow(null).optional(),
  data_inicio_estimada: Joi.date().allow(null).optional(),
  tolerancia_dias: Joi.number().integer().optional(),
  escopo_incluso: Joi.string().allow('').optional(),
  responsabilidades_cliente: Joi.string().allow('').optional(),
  condicoes_comerciais: Joi.string().allow('').optional(),
  condicoes_gerais: Joi.string().allow('').optional(),
  logistica: Joi.string().allow('').optional(),
  garantias: Joi.string().allow('').optional()
});

// Schema de validação para criação de orçamento (inclui itens e novos campos)
const criarOrcamentoSchema = Joi.object({
  // Campos básicos
  cliente_id: Joi.number().integer().required(),
  data_orcamento: Joi.date().required(),
  data_validade: Joi.date().required(),
  valor_total: Joi.number().precision(2).required(),
  desconto: Joi.number().precision(2).default(0),
  observacoes: Joi.string().allow(''),
  status: Joi.string().valid('rascunho', 'enviado', 'aprovado', 'rejeitado', 'vencido', 'convertido').default('rascunho'),
  vendedor_id: Joi.number().integer().allow(null),
  condicoes_pagamento: Joi.string().allow(''),
  prazo_entrega: Joi.string().allow(''),
  tipo_orcamento: Joi.string().valid('equipamento', 'servico', 'locacao', 'venda').required(),
  numero: Joi.string().allow(''),
  
  // Campos de obra (opcional - não obrigatório para orçamentos de venda)
  // Para orçamentos de venda de complementos, a obra não é necessária
  obra_id: Joi.number().integer().allow(null),
  obra_nome: Joi.string().allow(''),
  obra_tipo: Joi.string().allow(''),
  obra_endereco: Joi.string().allow(''),
  obra_cidade: Joi.string().allow(''),
  obra_bairro: Joi.string().allow(''),
  obra_cep: Joi.string().allow(''),
  obra_engenheiro_responsavel: Joi.string().allow(''),
  obra_contato: Joi.string().allow(''),
  
  // Campos de grua
  grua_id: Joi.number().integer().allow(null),
  grua_modelo: Joi.string().allow(''),
  grua_lanca: Joi.number().precision(2).allow(null),
  grua_altura_final: Joi.number().precision(2).allow(null),
  grua_tipo_base: Joi.string().allow(''),
  grua_ano: Joi.number().integer().allow(null),
  grua_potencia: Joi.number().precision(2).allow(null),
  grua_capacidade_1_cabo: Joi.number().precision(2).allow(null),
  grua_capacidade_2_cabos: Joi.number().precision(2).allow(null),
  grua_voltagem: Joi.string().allow(''),
  
  // Campos de cliente expandidos
  cliente_endereco: Joi.string().allow(''),
  cliente_bairro: Joi.string().allow(''),
  cliente_cep: Joi.string().allow(''),
  cliente_cidade: Joi.string().allow(''),
  cliente_estado: Joi.string().allow(''),
  cliente_telefone: Joi.string().allow(''),
  cliente_email: Joi.string().email().allow(''),
  cliente_contato: Joi.string().allow(''),
  
  // Campos gerais
  prazo_locacao_meses: Joi.number().integer().allow(null),
  data_inicio_estimada: Joi.date().allow(null),
  tolerancia_dias: Joi.number().integer().default(15),
  escopo_incluso: Joi.string().allow(''),
  responsabilidades_cliente: Joi.string().allow(''),
  condicoes_comerciais: Joi.string().allow(''),
  condicoes_gerais: Joi.string().allow(''),
  logistica: Joi.string().allow(''),
  garantias: Joi.string().allow(''),
  
  // Arrays de itens relacionados
  valores_fixos: Joi.array().items(
    Joi.object({
      tipo: Joi.string().valid('Locação', 'Serviço').required(),
      descricao: Joi.string().required(),
      quantidade: Joi.number().precision(2).default(1),
      valor_unitario: Joi.number().precision(2).required(),
      valor_total: Joi.number().precision(2).required(),
      observacoes: Joi.string().allow('')
    })
  ).optional(),
  
  custos_mensais: Joi.array().items(
    Joi.object({
      tipo: Joi.string().required(),
      descricao: Joi.string().required(),
      valor_mensal: Joi.number().precision(2).required(),
      obrigatorio: Joi.boolean().default(true),
      observacoes: Joi.string().allow('')
    })
  ).optional(),
  
  horas_extras: Joi.array().items(
    Joi.object({
      tipo: Joi.string().valid('operador', 'sinaleiro', 'equipamento').required(),
      dia_semana: Joi.string().valid('sabado', 'domingo_feriado', 'normal').required(),
      valor_hora: Joi.number().precision(2).required()
    })
  ).optional(),
  
  servicos_adicionais: Joi.array().items(
    Joi.object({
      tipo: Joi.string().required(),
      descricao: Joi.string().required(),
      quantidade: Joi.number().precision(2).default(1),
      valor_unitario: Joi.number().precision(2).required(),
      valor_total: Joi.number().precision(2).required(),
      observacoes: Joi.string().allow('')
    })
  ).optional(),
  
  // Itens originais (mantidos para compatibilidade)
  itens: Joi.array().items(
    Joi.object({
      produto_id: Joi.string().allow('').optional(),
      produto_servico: Joi.string().required(),
      descricao: Joi.string().allow(''),
      quantidade: Joi.number().precision(2).required(),
      valor_unitario: Joi.number().precision(2).required(),
      valor_total: Joi.number().precision(2).required(),
      tipo: Joi.string().valid('produto', 'servico', 'equipamento').required(),
      unidade: Joi.string().allow(''),
      observacoes: Joi.string().allow(''),
      // Campos específicos de complementos
      codigo: Joi.string().allow('').optional(),
      estado: Joi.string().valid('novo', 'usado', 'recondicionado').optional(),
      medida_capacidade: Joi.string().allow('').optional(),
      peso: Joi.number().precision(2).optional(),
      frete: Joi.string().valid('CIF', 'FOB').optional(),
      icms_percentual: Joi.number().precision(2).optional(),
      desconto_percentual: Joi.number().precision(2).optional()
    })
  ).optional()
});

// Schema de validação para item do orçamento
const itemOrcamentoSchema = Joi.object({
  orcamento_id: Joi.number().integer().required(),
  produto_servico: Joi.string().required(),
  descricao: Joi.string().required(),
  quantidade: Joi.number().precision(2).required(),
  valor_unitario: Joi.number().precision(2).required(),
  valor_total: Joi.number().precision(2).required(),
  tipo: Joi.string().valid('produto', 'servico', 'equipamento').required(),
  unidade: Joi.string().allow(''),
  observacoes: Joi.string().allow(''),
  // Campos específicos de complementos
  codigo: Joi.string().allow('').optional(),
  estado: Joi.string().valid('novo', 'usado', 'recondicionado').optional(),
  medida_capacidade: Joi.string().allow('').optional(),
  peso: Joi.number().precision(2).optional(),
  frete: Joi.string().valid('CIF', 'FOB').optional(),
  icms_percentual: Joi.number().precision(2).optional(),
  desconto_percentual: Joi.number().precision(2).optional()
});

/**
 * @swagger
 * /api/orcamentos:
 *   get:
 *     summary: Lista orçamentos com filtros
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limite de itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [rascunho, enviado, aprovado, rejeitado, vencido, convertido]
 *         description: Status do orçamento
 *       - in: query
 *         name: cliente_id
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtro
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtro
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por número do orçamento, nome do cliente ou nome da obra
 *     responses:
 *       200:
 *         description: Lista de orçamentos
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
 *                         description: ID do orçamento
 *                       cliente_id:
 *                         type: integer
 *                         description: ID do cliente
 *                       data_orcamento:
 *                         type: string
 *                         format: date
 *                         description: Data do orçamento
 *                       data_validade:
 *                         type: string
 *                         format: date
 *                         description: Data de validade
 *                       valor_total:
 *                         type: number
 *                         description: Valor total do orçamento
 *                       desconto:
 *                         type: number
 *                         description: Valor do desconto
 *                       observacoes:
 *                         type: string
 *                         description: Observações
 *                       status:
 *                         type: string
 *                         enum: [rascunho, enviado, aprovado, rejeitado, vencido, convertido]
 *                         description: Status do orçamento
 *                       vendedor_id:
 *                         type: integer
 *                         description: ID do vendedor
 *                       condicoes_pagamento:
 *                         type: string
 *                         description: Condições de pagamento
 *                       prazo_entrega:
 *                         type: string
 *                         description: Prazo de entrega
 *                       tipo_orcamento:
 *                         type: string
 *                         enum: [equipamento, servico, locacao, venda]
 *                         description: Tipo do orçamento
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Data de criação
 *                       clientes:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                           email:
 *                             type: string
 *                           telefone:
 *                             type: string
 *                       funcionarios:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                       orcamento_itens:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             produto_servico:
 *                               type: string
 *                             descricao:
 *                               type: string
 *                             quantidade:
 *                               type: number
 *                             valor_unitario:
 *                               type: number
 *                             valor_total:
 *                               type: number
 *                             tipo:
 *                               type: string
 *                               enum: [produto, servico, equipamento]
 *                             unidade:
 *                               type: string
 *                             observacoes:
 *                               type: string
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
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, cliente_id, obra_id, data_inicio, data_fim, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orcamentos')
      .select(`
        *,
        clientes:cliente_id (
          id,
          nome,
          email,
          telefone,
          cnpj,
          contato_cpf,
          endereco
        ),
        funcionarios:vendedor_id (
          id,
          nome,
          email
        ),
        obras:obra_id (
          id,
          nome,
          endereco
        ),
        gruas:grua_id (
          id,
          name,
          modelo,
          fabricante
        ),
        orcamento_itens (*),
        orcamento_valores_fixos (*),
        orcamento_custos_mensais (*),
        orcamento_horas_extras (*),
        orcamento_servicos_adicionais (*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filtros
    if (status) {
      query = query.eq('status', status);
    }
    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id);
    }
    if (obra_id) {
      query = query.eq('obra_id', obra_id);
    }
    if (data_inicio) {
      query = query.gte('data_orcamento', data_inicio);
    }
    if (data_fim) {
      query = query.lte('data_orcamento', data_fim);
    }

    // Se houver busca, não aplicar paginação ainda (buscar todos para filtrar)
    // Caso contrário, aplicar paginação normalmente
    let orcamentosFiltrados = [];
    let totalCount = 0;

    if (search) {
      // Buscar todos os orçamentos (sem paginação) para poder filtrar
      const { data: allOrcamentos, error: allError, count: allCount } = await query;

      if (allError) throw allError;

      // Filtrar pelo termo de busca
      const searchLower = search.toLowerCase();
      orcamentosFiltrados = (allOrcamentos || []).filter((orc) => {
        const numeroMatch = orc.numero?.toLowerCase().includes(searchLower);
        const clienteMatch = orc.clientes?.nome?.toLowerCase().includes(searchLower);
        const obraMatch = orc.obras?.nome?.toLowerCase().includes(searchLower);
        return numeroMatch || clienteMatch || obraMatch;
      });

      totalCount = orcamentosFiltrados.length;

      // Aplicar paginação manualmente após filtrar
      orcamentosFiltrados = orcamentosFiltrados.slice(offset, offset + parseInt(limit));
    } else {
      // Sem busca, aplicar paginação normalmente
      query = query.range(offset, offset + limit - 1);

      const { data: orcamentos, error, count } = await query;

      if (error) throw error;

      orcamentosFiltrados = orcamentos || [];
      totalCount = count || 0;
    }

    res.json({
      success: true,
      data: orcamentosFiltrados,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orcamentos/{id}:
 *   get:
 *     summary: Busca um orçamento por ID
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     responses:
 *       200:
 *         description: Dados do orçamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID do orçamento
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     data_orcamento:
 *                       type: string
 *                       format: date
 *                       description: Data do orçamento
 *                     data_validade:
 *                       type: string
 *                       format: date
 *                       description: Data de validade
 *                     valor_total:
 *                       type: number
 *                       description: Valor total do orçamento
 *                     desconto:
 *                       type: number
 *                       description: Valor do desconto
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     status:
 *                       type: string
 *                       enum: [rascunho, enviado, aprovado, rejeitado, vencido, convertido]
 *                       description: Status do orçamento
 *                     vendedor_id:
 *                       type: integer
 *                       description: ID do vendedor
 *                     condicoes_pagamento:
 *                       type: string
 *                       description: Condições de pagamento
 *                     prazo_entrega:
 *                       type: string
 *                       description: Prazo de entrega
 *                     tipo_orcamento:
 *                       type: string
 *                       enum: [equipamento, servico, locacao, venda]
 *                       description: Tipo do orçamento
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *                     clientes:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nome:
 *                           type: string
 *                         email:
 *                           type: string
 *                         telefone:
 *                           type: string
 *                         endereco:
 *                           type: string
 *                         cnpj:
 *                           type: string
 *                         contato_cpf:
 *                           type: string
 *                     funcionarios:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         nome:
 *                           type: string
 *                         email:
 *                           type: string
 *                     itens:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           produto_servico:
 *                             type: string
 *                           descricao:
 *                             type: string
 *                           quantidade:
 *                             type: number
 *                           valor_unitario:
 *                             type: number
 *                           valor_total:
 *                             type: number
 *                           tipo:
 *                             type: string
 *                             enum: [produto, servico, equipamento]
 *                           unidade:
 *                             type: string
 *                           observacoes:
 *                             type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar orçamento com todos os relacionamentos
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos')
      .select(`
        *,
        clientes:cliente_id (
          id,
          nome,
          email,
          telefone,
          endereco,
          cnpj,
          contato_cpf
        ),
        funcionarios:vendedor_id (
          id,
          nome,
          email
        ),
        obras:obra_id (
          id,
          nome,
          endereco
        ),
        gruas:grua_id (
          id,
          name,
          modelo,
          fabricante
        )
      `)
      .eq('id', id)
      .single();

    if (orcamentoError) throw orcamentoError;

    // Buscar todos os itens relacionados
    const [
      { data: itens, error: itensError },
      { data: valoresFixos, error: valoresFixosError },
      { data: custosMensais, error: custosMensaisError },
      { data: horasExtras, error: horasExtrasError },
      { data: servicosAdicionais, error: servicosAdicionaisError }
    ] = await Promise.all([
      supabase.from('orcamento_itens').select('*').eq('orcamento_id', id).order('id'),
      supabase.from('orcamento_valores_fixos').select('*').eq('orcamento_id', id).order('id'),
      supabase.from('orcamento_custos_mensais').select('*').eq('orcamento_id', id).order('id'),
      supabase.from('orcamento_horas_extras').select('*').eq('orcamento_id', id).order('id'),
      supabase.from('orcamento_servicos_adicionais').select('*').eq('orcamento_id', id).order('id')
    ]);

    if (itensError) throw itensError;
    if (valoresFixosError) throw valoresFixosError;
    if (custosMensaisError) throw custosMensaisError;
    if (horasExtrasError) throw horasExtrasError;
    if (servicosAdicionaisError) throw servicosAdicionaisError;

    res.json({
      success: true,
      data: {
        ...orcamento,
        itens: itens || [],
        valores_fixos: valoresFixos || [],
        custos_mensais: custosMensais || [],
        horas_extras: horasExtras || [],
        servicos_adicionais: servicosAdicionais || []
      }
    });
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orcamentos:
 *   post:
 *     summary: Cria um novo orçamento
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cliente_id
 *               - data_orcamento
 *               - data_validade
 *               - valor_total
 *               - tipo_orcamento
 *               - itens
 *             properties:
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               data_orcamento:
 *                 type: string
 *                 format: date
 *                 description: Data do orçamento
 *               data_validade:
 *                 type: string
 *                 format: date
 *                 description: Data de validade
 *               valor_total:
 *                 type: number
 *                 description: Valor total do orçamento
 *               desconto:
 *                 type: number
 *                 default: 0
 *                 description: Valor do desconto
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *               status:
 *                 type: string
 *                 enum: [rascunho, enviado, aprovado, rejeitado, vencido, convertido]
 *                 default: rascunho
 *                 description: Status do orçamento
 *               vendedor_id:
 *                 type: integer
 *                 description: ID do vendedor
 *               condicoes_pagamento:
 *                 type: string
 *                 description: Condições de pagamento
 *               prazo_entrega:
 *                 type: string
 *                 description: Prazo de entrega
 *               tipo_orcamento:
 *                 type: string
 *                 enum: [equipamento, servico, locacao, venda]
 *                 description: Tipo do orçamento
 *               itens:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - produto_servico
 *                     - quantidade
 *                     - valor_unitario
 *                     - valor_total
 *                     - tipo
 *                   properties:
 *                     produto_id:
 *                       type: string
 *                       description: ID do produto
 *                     produto_servico:
 *                       type: string
 *                       description: Nome do produto/serviço
 *                     descricao:
 *                       type: string
 *                       description: Descrição do item
 *                     quantidade:
 *                       type: number
 *                       description: Quantidade
 *                     valor_unitario:
 *                       type: number
 *                       description: Valor unitário
 *                     valor_total:
 *                       type: number
 *                       description: Valor total do item
 *                     tipo:
 *                       type: string
 *                       enum: [produto, servico, equipamento]
 *                       description: Tipo do item
 *                     unidade:
 *                       type: string
 *                       description: Unidade de medida
 *                     observacoes:
 *                       type: string
 *                       description: Observações do item
 *     responses:
 *       201:
 *         description: Orçamento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID do orçamento criado
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     data_orcamento:
 *                       type: string
 *                       format: date
 *                       description: Data do orçamento
 *                     data_validade:
 *                       type: string
 *                       format: date
 *                       description: Data de validade
 *                     valor_total:
 *                       type: number
 *                       description: Valor total do orçamento
 *                     desconto:
 *                       type: number
 *                       description: Valor do desconto
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     status:
 *                       type: string
 *                       enum: [rascunho, enviado, aprovado, rejeitado, vencido, convertido]
 *                       description: Status do orçamento
 *                     vendedor_id:
 *                       type: integer
 *                       description: ID do vendedor
 *                     condicoes_pagamento:
 *                       type: string
 *                       description: Condições de pagamento
 *                     prazo_entrega:
 *                       type: string
 *                       description: Prazo de entrega
 *                     tipo_orcamento:
 *                       type: string
 *                       enum: [equipamento, servico, locacao, venda]
 *                       description: Tipo do orçamento
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = criarOrcamentoSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { 
      itens, 
      valores_fixos, 
      custos_mensais, 
      horas_extras, 
      servicos_adicionais,
      ...orcamentoData 
    } = req.body;

    // Verificar se o cliente existe
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', orcamentoData.cliente_id)
      .single();

    if (clienteError || !cliente) {
      return res.status(400).json({
        success: false,
        message: 'Cliente não encontrado',
        error: `Cliente com ID ${orcamentoData.cliente_id} não existe no banco de dados`
      });
    }

    // Verificar se a grua existe (se fornecida)
    if (orcamentoData.grua_id) {
      const { data: grua, error: gruaError } = await supabase
        .from('gruas')
        .select('id')
        .eq('id', orcamentoData.grua_id)
        .single();

      if (gruaError || !grua) {
        return res.status(400).json({
          success: false,
          message: 'Grua não encontrada',
          error: `Grua com ID ${orcamentoData.grua_id} não existe no banco de dados`
        });
      }
    }

    // Verificar se a obra existe (se fornecida)
    // NOTA: Para orçamentos de venda (tipo_orcamento: 'venda'), a obra não é obrigatória,
    // pois pode ser para clientes que não têm obras conosco ou para vendas de complementos
    if (orcamentoData.obra_id) {
      const { data: obra, error: obraError } = await supabase
        .from('obras')
        .select('id')
        .eq('id', orcamentoData.obra_id)
        .single();

      if (obraError || !obra) {
        return res.status(400).json({
          success: false,
          message: 'Obra não encontrada',
          error: `Obra com ID ${orcamentoData.obra_id} não existe no banco de dados`
        });
      }
    }

    // Gerar número do orçamento se não fornecido
    if (!orcamentoData.numero) {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const timestamp = Date.now().toString().slice(-4);
      orcamentoData.numero = `GR${ano}${mes}${timestamp}`;
    }

    // Criar orçamento
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos')
      .insert([orcamentoData])
      .select()
      .single();

    if (orcamentoError) throw orcamentoError;

    // Criar valores fixos se fornecidos
    if (valores_fixos && valores_fixos.length > 0) {
      const valoresFixosData = valores_fixos.map(item => ({
        ...item,
        orcamento_id: orcamento.id
      }));

      const { error: valoresFixosError } = await supabase
        .from('orcamento_valores_fixos')
        .insert(valoresFixosData);

      if (valoresFixosError) throw valoresFixosError;
    }

    // Criar custos mensais se fornecidos
    if (custos_mensais && custos_mensais.length > 0) {
      const custosMensaisData = custos_mensais.map(item => ({
        ...item,
        orcamento_id: orcamento.id
      }));

      const { error: custosMensaisError } = await supabase
        .from('orcamento_custos_mensais')
        .insert(custosMensaisData);

      if (custosMensaisError) throw custosMensaisError;
    }

    // Criar tabela de horas extras se fornecida
    if (horas_extras && horas_extras.length > 0) {
      const horasExtrasData = horas_extras.map(item => ({
        ...item,
        orcamento_id: orcamento.id
      }));

      const { error: horasExtrasError } = await supabase
        .from('orcamento_horas_extras')
        .insert(horasExtrasData);

      if (horasExtrasError) throw horasExtrasError;
    }

    // Criar serviços adicionais se fornecidos
    if (servicos_adicionais && servicos_adicionais.length > 0) {
      const servicosAdicionaisData = servicos_adicionais.map(item => ({
        ...item,
        orcamento_id: orcamento.id
      }));

      const { error: servicosAdicionaisError } = await supabase
        .from('orcamento_servicos_adicionais')
        .insert(servicosAdicionaisData);

      if (servicosAdicionaisError) throw servicosAdicionaisError;
    }

    // Criar itens do orçamento se fornecidos (mantido para compatibilidade)
    if (itens && itens.length > 0) {
      const itensData = itens.map(item => ({
        ...item,
        orcamento_id: orcamento.id
      }));

      const { error: itensError } = await supabase
        .from('orcamento_itens')
        .insert(itensData);

      if (itensError) throw itensError;
    }

    res.status(201).json({
      success: true,
      data: orcamento,
      message: 'Orçamento criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orcamentos/{id}:
 *   put:
 *     summary: Atualiza um orçamento existente
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cliente_id:
 *                 type: integer
 *                 description: ID do cliente
 *               data_orcamento:
 *                 type: string
 *                 format: date
 *                 description: Data do orçamento
 *               data_validade:
 *                 type: string
 *                 format: date
 *                 description: Data de validade
 *               valor_total:
 *                 type: number
 *                 description: Valor total do orçamento
 *               desconto:
 *                 type: number
 *                 description: Valor do desconto
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *               status:
 *                 type: string
 *                 enum: [rascunho, enviado, aprovado, rejeitado, vencido, convertido]
 *                 description: Status do orçamento
 *               vendedor_id:
 *                 type: integer
 *                 description: ID do vendedor
 *               condicoes_pagamento:
 *                 type: string
 *                 description: Condições de pagamento
 *               prazo_entrega:
 *                 type: string
 *                 description: Prazo de entrega
 *               tipo_orcamento:
 *                 type: string
 *                 enum: [equipamento, servico, locacao, venda]
 *                 description: Tipo do orçamento
 *               itens:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     produto_id:
 *                       type: string
 *                       description: ID do produto
 *                     produto_servico:
 *                       type: string
 *                       description: Nome do produto/serviço
 *                     descricao:
 *                       type: string
 *                       description: Descrição do item
 *                     quantidade:
 *                       type: number
 *                       description: Quantidade
 *                     valor_unitario:
 *                       type: number
 *                       description: Valor unitário
 *                     valor_total:
 *                       type: number
 *                       description: Valor total do item
 *                     tipo:
 *                       type: string
 *                       enum: [produto, servico, equipamento]
 *                       description: Tipo do item
 *                     unidade:
 *                       type: string
 *                       description: Unidade de medida
 *                     observacoes:
 *                       type: string
 *                       description: Observações do item
 *     responses:
 *       200:
 *         description: Orçamento atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID do orçamento
 *                     cliente_id:
 *                       type: integer
 *                       description: ID do cliente
 *                     data_orcamento:
 *                       type: string
 *                       format: date
 *                       description: Data do orçamento
 *                     data_validade:
 *                       type: string
 *                       format: date
 *                       description: Data de validade
 *                     valor_total:
 *                       type: number
 *                       description: Valor total do orçamento
 *                     desconto:
 *                       type: number
 *                       description: Valor do desconto
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     status:
 *                       type: string
 *                       enum: [rascunho, enviado, aprovado, rejeitado, vencido, convertido]
 *                       description: Status do orçamento
 *                     vendedor_id:
 *                       type: integer
 *                       description: ID do vendedor
 *                     condicoes_pagamento:
 *                       type: string
 *                       description: Condições de pagamento
 *                     prazo_entrega:
 *                       type: string
 *                       description: Prazo de entrega
 *                     tipo_orcamento:
 *                       type: string
 *                       enum: [equipamento, servico, locacao, venda]
 *                       description: Tipo do orçamento
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de atualização
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = criarOrcamentoSchema.validate(req.body, { abortEarly: false });
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { 
      itens, 
      valores_fixos, 
      custos_mensais, 
      horas_extras, 
      servicos_adicionais,
      ...orcamentoData 
    } = req.body;

    // Atualizar orçamento
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos')
      .update(orcamentoData)
      .eq('id', id)
      .select()
      .single();

    if (orcamentoError) throw orcamentoError;

    // Função auxiliar para atualizar arrays relacionados
    const atualizarArrayRelacionado = async (tabela, dados, orcamentoId) => {
      if (dados === undefined) return; // Se não foi fornecido, não atualiza
      
      // Remover registros existentes
      await supabase
        .from(tabela)
        .delete()
        .eq('orcamento_id', orcamentoId);

      // Inserir novos registros se houver
      if (dados && dados.length > 0) {
        const dadosComOrcamentoId = dados.map(item => ({
          ...item,
          orcamento_id: orcamentoId
        }));

        const { error } = await supabase
          .from(tabela)
          .insert(dadosComOrcamentoId);

        if (error) throw error;
      }
    };

    // Atualizar todos os arrays relacionados
    await Promise.all([
      atualizarArrayRelacionado('orcamento_valores_fixos', valores_fixos, id),
      atualizarArrayRelacionado('orcamento_custos_mensais', custos_mensais, id),
      atualizarArrayRelacionado('orcamento_horas_extras', horas_extras, id),
      atualizarArrayRelacionado('orcamento_servicos_adicionais', servicos_adicionais, id),
      atualizarArrayRelacionado('orcamento_itens', itens, id) // Mantido para compatibilidade
    ]);

    res.json({
      success: true,
      data: orcamento,
      message: 'Orçamento atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orcamentos/{id}:
 *   delete:
 *     summary: Exclui um orçamento
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     responses:
 *       200:
 *         description: Orçamento excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       400:
 *         description: Apenas orçamentos em rascunho podem ser excluídos
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o orçamento pode ser excluído (apenas rascunhos)
    const { data: orcamento, error: checkError } = await supabase
      .from('orcamentos')
      .select('status')
      .eq('id', id)
      .single();

    if (checkError) throw checkError;

    if (orcamento.status !== 'rascunho') {
      return res.status(400).json({
        success: false,
        message: 'Apenas orçamentos em rascunho podem ser excluídos'
      });
    }

    // Excluir todos os registros relacionados primeiro (CASCADE)
    await Promise.all([
      supabase.from('orcamento_itens').delete().eq('orcamento_id', id),
      supabase.from('orcamento_valores_fixos').delete().eq('orcamento_id', id),
      supabase.from('orcamento_custos_mensais').delete().eq('orcamento_id', id),
      supabase.from('orcamento_horas_extras').delete().eq('orcamento_id', id),
      supabase.from('orcamento_servicos_adicionais').delete().eq('orcamento_id', id)
    ]);

    // Excluir orçamento
    const { error } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Orçamento excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orcamentos/{id}/enviar:
 *   post:
 *     summary: Envia um orçamento
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email para envio
 *               observacoes:
 *                 type: string
 *                 description: Observações do envio
 *     responses:
 *       200:
 *         description: Orçamento enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID do orçamento
 *                     status:
 *                       type: string
 *                       enum: [enviado]
 *                       description: Status atualizado
 *                     data_envio:
 *                       type: string
 *                       format: date-time
 *                       description: Data de envio
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/enviar', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, observacoes } = req.body;

    // Atualizar status do orçamento
    const { data: orcamento, error: updateError } = await supabase
      .from('orcamentos')
      .update({ 
        status: 'enviado',
        data_envio: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Aqui você pode implementar o envio de email
    // Por enquanto, apenas retornamos sucesso
    res.json({
      success: true,
      data: orcamento,
      message: 'Orçamento enviado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao enviar orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orcamentos/{id}/aprovar:
 *   post:
 *     summary: Aprova um orçamento
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     responses:
 *       200:
 *         description: Orçamento aprovado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID do orçamento
 *                     status:
 *                       type: string
 *                       enum: [aprovado]
 *                       description: Status atualizado
 *                     data_aprovacao:
 *                       type: string
 *                       format: date-time
 *                       description: Data de aprovação
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/aprovar', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: orcamento, error } = await supabase
      .from('orcamentos')
      .update({ 
        status: 'aprovado',
        data_aprovacao: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: orcamento,
      message: 'Orçamento aprovado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao aprovar orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orcamentos/{id}/rejeitar:
 *   post:
 *     summary: Rejeita um orçamento
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo:
 *                 type: string
 *                 description: Motivo da rejeição
 *     responses:
 *       200:
 *         description: Orçamento rejeitado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID do orçamento
 *                     status:
 *                       type: string
 *                       enum: [rejeitado]
 *                       description: Status atualizado
 *                     data_rejeicao:
 *                       type: string
 *                       format: date-time
 *                       description: Data de rejeição
 *                     motivo_rejeicao:
 *                       type: string
 *                       description: Motivo da rejeição
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/rejeitar', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const { data: orcamento, error } = await supabase
      .from('orcamentos')
      .update({ 
        status: 'rejeitado',
        data_rejeicao: new Date().toISOString(),
        motivo_rejeicao: motivo
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: orcamento,
      message: 'Orçamento rejeitado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao rejeitar orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/orcamentos/{id}/pdf:
 *   get:
 *     summary: Gera PDF do orçamento
 *     tags: [Orçamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do orçamento
 *     responses:
 *       200:
 *         description: Dados do orçamento para geração de PDF
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     orcamento:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           description: ID do orçamento
 *                         cliente_id:
 *                           type: integer
 *                           description: ID do cliente
 *                         data_orcamento:
 *                           type: string
 *                           format: date
 *                           description: Data do orçamento
 *                         data_validade:
 *                           type: string
 *                           format: date
 *                           description: Data de validade
 *                         valor_total:
 *                           type: number
 *                           description: Valor total do orçamento
 *                         desconto:
 *                           type: number
 *                           description: Valor do desconto
 *                         observacoes:
 *                           type: string
 *                           description: Observações
 *                         status:
 *                           type: string
 *                           enum: [rascunho, enviado, aprovado, rejeitado, vencido, convertido]
 *                           description: Status do orçamento
 *                         vendedor_id:
 *                           type: integer
 *                           description: ID do vendedor
 *                         condicoes_pagamento:
 *                           type: string
 *                           description: Condições de pagamento
 *                         prazo_entrega:
 *                           type: string
 *                           description: Prazo de entrega
 *                         tipo_orcamento:
 *                           type: string
 *                           enum: [equipamento, servico, locacao, venda]
 *                           description: Tipo do orçamento
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           description: Data de criação
 *                         clientes:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             nome:
 *                               type: string
 *                             email:
 *                               type: string
 *                             telefone:
 *                               type: string
 *                             endereco:
 *                               type: string
 *                             cnpj:
 *                               type: string
 *                             contato_cpf:
 *                               type: string
 *                         funcionarios:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             nome:
 *                               type: string
 *                             email:
 *                               type: string
 *                     itens:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           produto_servico:
 *                             type: string
 *                           descricao:
 *                             type: string
 *                           quantidade:
 *                             type: number
 *                           valor_unitario:
 *                             type: number
 *                           valor_total:
 *                             type: number
 *                           tipo:
 *                             type: string
 *                             enum: [produto, servico, equipamento]
 *                           unidade:
 *                             type: string
 *                           observacoes:
 *                             type: string
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar dados completos do orçamento
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos')
      .select(`
        *,
        clientes:cliente_id (
          id,
          nome,
          email,
          telefone,
          endereco,
          cnpj,
          contato_cpf
        ),
        funcionarios:vendedor_id (
          id,
          nome,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (orcamentoError) throw orcamentoError;

    const { data: itens, error: itensError } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', id)
      .order('id');

    if (itensError) throw itensError;

    // Aqui você pode implementar a geração de PDF
    // Por enquanto, retornamos os dados em JSON
    res.json({
      success: true,
      data: {
        orcamento,
        itens
      },
      message: 'Dados do orçamento para PDF'
    });
  } catch (error) {
    console.error('Erro ao gerar PDF do orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;

