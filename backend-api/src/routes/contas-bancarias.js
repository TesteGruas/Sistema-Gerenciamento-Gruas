import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';

const router = express.Router();

// Schema de validação para conta bancária
const contaBancariaSchema = Joi.object({
  banco: Joi.string().min(1).max(100).required(),
  agencia: Joi.string().min(1).max(10).required(),
  conta: Joi.string().min(1).max(20).required(),
  tipo_conta: Joi.string().valid('corrente', 'poupanca', 'investimento').required(),
  saldo_atual: Joi.number().min(0).default(0),
  status: Joi.string().valid('ativa', 'inativa', 'bloqueada').default('ativa')
});

/**
 * @swagger
 * /api/contas-bancarias:
 *   get:
 *     summary: Lista todas as contas bancárias
 *     tags: [Contas Bancárias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de contas bancárias
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
 *                         description: ID da conta bancária
 *                       banco:
 *                         type: string
 *                         description: Nome do banco
 *                       agencia:
 *                         type: string
 *                         description: Número da agência
 *                       conta:
 *                         type: string
 *                         description: Número da conta
 *                       tipo_conta:
 *                         type: string
 *                         enum: [corrente, poupanca, investimento]
 *                         description: Tipo da conta
 *                       saldo_atual:
 *                         type: number
 *                         description: Saldo atual da conta
 *                       status:
 *                         type: string
 *                         enum: [ativa, inativa, bloqueada]
 *                         description: Status da conta
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Data de criação
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         description: Data de atualização
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contas_bancarias')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar contas bancárias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-bancarias:
 *   post:
 *     summary: Cria uma nova conta bancária
 *     tags: [Contas Bancárias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - banco
 *               - agencia
 *               - conta
 *               - tipo_conta
 *             properties:
 *               banco:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Nome do banco
 *               agencia:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 10
 *                 description: Número da agência
 *               conta:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 20
 *                 description: Número da conta
 *               tipo_conta:
 *                 type: string
 *                 enum: [corrente, poupanca, investimento]
 *                 description: Tipo da conta
 *               saldo_atual:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 description: Saldo atual da conta
 *               status:
 *                 type: string
 *                 enum: [ativa, inativa, bloqueada]
 *                 default: ativa
 *                 description: Status da conta
 *     responses:
 *       201:
 *         description: Conta bancária criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados da conta bancária criada
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = contaBancariaSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('contas_bancarias')
      .insert([value])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Conta bancária criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar conta bancária:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-bancarias/{id}:
 *   get:
 *     summary: Obtém uma conta bancária específica
 *     tags: [Contas Bancárias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da conta bancária
 *     responses:
 *       200:
 *         description: Dados da conta bancária
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
 *                       description: ID da conta bancária
 *                     banco:
 *                       type: string
 *                       description: Nome do banco
 *                     agencia:
 *                       type: string
 *                       description: Número da agência
 *                     conta:
 *                       type: string
 *                       description: Número da conta
 *                     tipo_conta:
 *                       type: string
 *                       enum: [corrente, poupanca, investimento]
 *                       description: Tipo da conta
 *                     saldo_atual:
 *                       type: number
 *                       description: Saldo atual da conta
 *                     status:
 *                       type: string
 *                       enum: [ativa, inativa, bloqueada]
 *                       description: Status da conta
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de atualização
 *       404:
 *         description: Conta bancária não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('contas_bancarias')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Conta bancária não encontrada'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao obter conta bancária:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-bancarias/{id}:
 *   put:
 *     summary: Atualiza uma conta bancária existente
 *     tags: [Contas Bancárias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da conta bancária
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - banco
 *               - agencia
 *               - conta
 *               - tipo_conta
 *             properties:
 *               banco:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Nome do banco
 *               agencia:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 10
 *                 description: Número da agência
 *               conta:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 20
 *                 description: Número da conta
 *               tipo_conta:
 *                 type: string
 *                 enum: [corrente, poupanca, investimento]
 *                 description: Tipo da conta
 *               saldo_atual:
 *                 type: number
 *                 minimum: 0
 *                 description: Saldo atual da conta
 *               status:
 *                 type: string
 *                 enum: [ativa, inativa, bloqueada]
 *                 description: Status da conta
 *     responses:
 *       200:
 *         description: Conta bancária atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados da conta bancária atualizada
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Conta bancária não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = contaBancariaSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('contas_bancarias')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Conta bancária não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Conta bancária atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar conta bancária:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-bancarias/{id}:
 *   delete:
 *     summary: Exclui uma conta bancária
 *     tags: [Contas Bancárias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da conta bancária
 *     responses:
 *       200:
 *         description: Conta bancária excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('contas_bancarias')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Conta bancária excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir conta bancária:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-bancarias/{id}/saldo:
 *   put:
 *     summary: Atualiza o saldo de uma conta bancária manualmente
 *     tags: [Contas Bancárias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da conta bancária
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - saldo_atual
 *             properties:
 *               saldo_atual:
 *                 type: number
 *                 minimum: 0
 *                 description: Novo saldo da conta
 *     responses:
 *       200:
 *         description: Saldo atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados da conta bancária com saldo atualizado
 *                 message:
 *                   type: string
 *       400:
 *         description: Saldo deve ser um número positivo
 *       404:
 *         description: Conta bancária não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id/saldo', async (req, res) => {
  try {
    const { id } = req.params;
    const { saldo_atual } = req.body;

    if (typeof saldo_atual !== 'number' || saldo_atual < 0) {
      return res.status(400).json({
        success: false,
        message: 'Saldo deve ser um número positivo'
      });
    }

    const { data, error } = await supabase
      .from('contas_bancarias')
      .update({ saldo_atual })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Conta bancária não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Saldo atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar saldo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Schema de validação para movimentação bancária
const movimentacaoSchema = Joi.object({
  conta_bancaria_id: Joi.number().integer().required(),
  tipo: Joi.string().valid('entrada', 'saida').required(),
  valor: Joi.number().positive().required(),
  descricao: Joi.string().min(1).max(255).required(),
  referencia: Joi.string().max(255).allow(null, '').optional(),
  data: Joi.date().required(),
  categoria: Joi.string().max(100).allow(null, '').optional(),
  observacoes: Joi.string().allow(null, '').optional()
});

/**
 * @swagger
 * /api/contas-bancarias/{id}/movimentacoes:
 *   get:
 *     summary: Lista movimentações de uma conta bancária
 *     tags: [Contas Bancárias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da conta bancária
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtro
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtro
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [entrada, saida]
 *         description: Tipo de movimentação
 *     responses:
 *       200:
 *         description: Lista de movimentações
 */
router.get('/:id/movimentacoes', async (req, res) => {
  try {
    const { id } = req.params;
    const { data_inicio, data_fim, tipo } = req.query;

    let query = supabase
      .from('movimentacoes_bancarias')
      .select('*')
      .eq('conta_bancaria_id', id)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false });

    if (data_inicio) {
      query = query.gte('data', data_inicio);
    }
    if (data_fim) {
      query = query.lte('data', data_fim);
    }
    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar movimentações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-bancarias/{id}/movimentacoes:
 *   post:
 *     summary: Cria uma nova movimentação bancária
 *     tags: [Contas Bancárias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da conta bancária
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *               - valor
 *               - descricao
 *               - data
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [entrada, saida]
 *               valor:
 *                 type: number
 *                 minimum: 0.01
 *               descricao:
 *                 type: string
 *               referencia:
 *                 type: string
 *               data:
 *                 type: string
 *                 format: date
 *               categoria:
 *                 type: string
 *               observacoes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Movimentação criada com sucesso
 */
router.post('/:id/movimentacoes', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('💰 [BACKEND] Dados recebidos para criar movimentação:', req.body);
    const movimentacaoData = {
      ...req.body,
      conta_bancaria_id: parseInt(id)
    };
    console.log('💰 [BACKEND] Dados após adicionar conta_bancaria_id:', movimentacaoData);

    const { error: validationError, value } = movimentacaoSchema.validate(movimentacaoData);
    console.log('💰 [BACKEND] Dados após validação Joi:', value);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    // Verificar se a conta bancária existe
    const { data: conta, error: contaError } = await supabase
      .from('contas_bancarias')
      .select('id')
      .eq('id', id)
      .single();

    if (contaError || !conta) {
      return res.status(404).json({
        success: false,
        message: 'Conta bancária não encontrada'
      });
    }

    // Garantir que categoria seja incluída corretamente
    // O Joi pode remover campos undefined, então precisamos garantir que categoria esteja presente
    const dadosParaInserir = {
      conta_bancaria_id: value.conta_bancaria_id,
      tipo: value.tipo,
      valor: value.valor,
      descricao: value.descricao,
      referencia: value.referencia || null,
      data: value.data,
      categoria: (value.categoria && value.categoria.trim && value.categoria.trim().length > 0) 
        ? value.categoria.trim() 
        : (req.body.categoria && req.body.categoria.trim && req.body.categoria.trim().length > 0)
          ? req.body.categoria.trim()
          : null,
      observacoes: value.observacoes || null
    };
    console.log('💰 [BACKEND] Dados finais para inserir no banco:', JSON.stringify(dadosParaInserir, null, 2));
    console.log('💰 [BACKEND] Categoria no req.body:', req.body.categoria);
    console.log('💰 [BACKEND] Categoria no objeto value:', value.categoria);
    console.log('💰 [BACKEND] Categoria no objeto dadosParaInserir:', dadosParaInserir.categoria);

    const { data, error } = await supabase
      .from('movimentacoes_bancarias')
      .insert([dadosParaInserir])
      .select()
      .single();

    if (error) {
      console.error('💰 [BACKEND] Erro ao inserir movimentação:', error);
      throw error;
    }
    
    console.log('💰 [BACKEND] Movimentação criada com sucesso:', data);

    res.status(201).json({
      success: true,
      data,
      message: 'Movimentação criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar movimentação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-bancarias/movimentacoes/{movimentacaoId}:
 *   put:
 *     summary: Atualiza uma movimentação bancária
 *     tags: [Contas Bancárias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movimentacaoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da movimentação
 *     responses:
 *       200:
 *         description: Movimentação atualizada com sucesso
 */
router.put('/movimentacoes/:movimentacaoId', async (req, res) => {
  try {
    const { movimentacaoId } = req.params;
    const updateData = req.body;

    // Buscar movimentação atual para obter conta_bancaria_id se não fornecido
    const { data: movimentacaoAtual, error: fetchError } = await supabase
      .from('movimentacoes_bancarias')
      .select('conta_bancaria_id')
      .eq('id', movimentacaoId)
      .single();

    if (fetchError) throw fetchError;

    const movimentacaoData = {
      ...updateData,
      conta_bancaria_id: updateData.conta_bancaria_id || movimentacaoAtual?.conta_bancaria_id
    };

    const { error: validationError, value } = movimentacaoSchema.validate(movimentacaoData);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('movimentacoes_bancarias')
      .update(value)
      .eq('id', movimentacaoId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Movimentação não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Movimentação atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar movimentação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-bancarias/movimentacoes/{movimentacaoId}:
 *   delete:
 *     summary: Exclui uma movimentação bancária
 *     tags: [Contas Bancárias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movimentacaoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da movimentação
 *     responses:
 *       200:
 *         description: Movimentação excluída com sucesso
 */
router.delete('/movimentacoes/:movimentacaoId', async (req, res) => {
  try {
    const { movimentacaoId } = req.params;

    const { error } = await supabase
      .from('movimentacoes_bancarias')
      .delete()
      .eq('id', movimentacaoId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Movimentação excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir movimentação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/contas-bancarias/movimentacoes:
 *   get:
 *     summary: Lista todas as movimentações bancárias (com filtros)
 *     tags: [Contas Bancárias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtro
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtro
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [entrada, saida]
 *         description: Tipo de movimentação
 *       - in: query
 *         name: conta_bancaria_id
 *         schema:
 *           type: integer
 *         description: ID da conta bancária
 *     responses:
 *       200:
 *         description: Lista de movimentações
 */
router.get('/movimentacoes/todas', async (req, res) => {
  try {
    const { data_inicio, data_fim, tipo, conta_bancaria_id } = req.query;

    let query = supabase
      .from('movimentacoes_bancarias')
      .select(`
        *,
        contas_bancarias (
          id,
          banco,
          agencia,
          conta,
          tipo_conta
        )
      `)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false });

    if (data_inicio) {
      query = query.gte('data', data_inicio);
    }
    if (data_fim) {
      query = query.lte('data', data_fim);
    }
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    if (conta_bancaria_id) {
      query = query.eq('conta_bancaria_id', conta_bancaria_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar movimentações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
