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

export default router;
