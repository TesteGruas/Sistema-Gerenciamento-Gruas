import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';

const router = express.Router();

// Schema de validação para imposto
const impostoSchema = Joi.object({
  tipo_imposto: Joi.string().min(1).max(50).required(),
  descricao: Joi.string().min(1).required(),
  valor: Joi.number().min(0).required(),
  data_vencimento: Joi.date().required(),
  data_pagamento: Joi.date().optional(),
  status: Joi.string().valid('pendente', 'pago', 'vencido', 'cancelado').default('pendente'),
  referencia: Joi.string().max(20).optional(),
  observacoes: Joi.string().optional()
});

/**
 * @swagger
 * /api/impostos:
 *   get:
 *     summary: Lista todos os impostos
 *     tags: [Impostos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de impostos
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
 *                         description: ID do imposto
 *                       tipo_imposto:
 *                         type: string
 *                         description: Tipo do imposto
 *                       descricao:
 *                         type: string
 *                         description: Descrição do imposto
 *                       valor:
 *                         type: number
 *                         description: Valor do imposto
 *                       data_vencimento:
 *                         type: string
 *                         format: date
 *                         description: Data de vencimento
 *                       data_pagamento:
 *                         type: string
 *                         format: date
 *                         description: Data de pagamento
 *                       status:
 *                         type: string
 *                         enum: [pendente, pago, vencido, cancelado]
 *                         description: Status do imposto
 *                       referencia:
 *                         type: string
 *                         description: Referência do imposto
 *                       observacoes:
 *                         type: string
 *                         description: Observações
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
      .from('impostos')
      .select('*')
      .order('data_vencimento', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar impostos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos:
 *   post:
 *     summary: Cria um novo imposto
 *     tags: [Impostos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_imposto
 *               - descricao
 *               - valor
 *               - data_vencimento
 *             properties:
 *               tipo_imposto:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: Tipo do imposto
 *               descricao:
 *                 type: string
 *                 minLength: 1
 *                 description: Descrição do imposto
 *               valor:
 *                 type: number
 *                 minimum: 0
 *                 description: Valor do imposto
 *               data_vencimento:
 *                 type: string
 *                 format: date
 *                 description: Data de vencimento
 *               data_pagamento:
 *                 type: string
 *                 format: date
 *                 description: Data de pagamento
 *               status:
 *                 type: string
 *                 enum: [pendente, pago, vencido, cancelado]
 *                 default: pendente
 *                 description: Status do imposto
 *               referencia:
 *                 type: string
 *                 maxLength: 20
 *                 description: Referência do imposto
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       201:
 *         description: Imposto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados do imposto criado
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = impostoSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('impostos')
      .insert([value])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Imposto registrado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar imposto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos/{id}:
 *   get:
 *     summary: Obtém um imposto específico
 *     tags: [Impostos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do imposto
 *     responses:
 *       200:
 *         description: Dados do imposto
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
 *                       description: ID do imposto
 *                     tipo_imposto:
 *                       type: string
 *                       description: Tipo do imposto
 *                     descricao:
 *                       type: string
 *                       description: Descrição do imposto
 *                     valor:
 *                       type: number
 *                       description: Valor do imposto
 *                     data_vencimento:
 *                       type: string
 *                       format: date
 *                       description: Data de vencimento
 *                     data_pagamento:
 *                       type: string
 *                       format: date
 *                       description: Data de pagamento
 *                     status:
 *                       type: string
 *                       enum: [pendente, pago, vencido, cancelado]
 *                       description: Status do imposto
 *                     referencia:
 *                       type: string
 *                       description: Referência do imposto
 *                     observacoes:
 *                       type: string
 *                       description: Observações
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de atualização
 *       404:
 *         description: Imposto não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('impostos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Imposto não encontrado'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao obter imposto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos/{id}:
 *   put:
 *     summary: Atualiza um imposto existente
 *     tags: [Impostos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do imposto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_imposto
 *               - descricao
 *               - valor
 *               - data_vencimento
 *             properties:
 *               tipo_imposto:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: Tipo do imposto
 *               descricao:
 *                 type: string
 *                 minLength: 1
 *                 description: Descrição do imposto
 *               valor:
 *                 type: number
 *                 minimum: 0
 *                 description: Valor do imposto
 *               data_vencimento:
 *                 type: string
 *                 format: date
 *                 description: Data de vencimento
 *               data_pagamento:
 *                 type: string
 *                 format: date
 *                 description: Data de pagamento
 *               status:
 *                 type: string
 *                 enum: [pendente, pago, vencido, cancelado]
 *                 description: Status do imposto
 *               referencia:
 *                 type: string
 *                 maxLength: 20
 *                 description: Referência do imposto
 *               observacoes:
 *                 type: string
 *                 description: Observações
 *     responses:
 *       200:
 *         description: Imposto atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados do imposto atualizado
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Imposto não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = impostoSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('impostos')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Imposto não encontrado'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Imposto atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar imposto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos/{id}:
 *   delete:
 *     summary: Exclui um imposto
 *     tags: [Impostos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do imposto
 *     responses:
 *       200:
 *         description: Imposto excluído com sucesso
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
      .from('impostos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Imposto excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir imposto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/impostos/{id}/pagar:
 *   post:
 *     summary: Marca um imposto como pago
 *     tags: [Impostos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do imposto
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data_pagamento:
 *                 type: string
 *                 format: date
 *                 description: Data de pagamento (opcional, usa data atual se não informada)
 *     responses:
 *       200:
 *         description: Imposto marcado como pago com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados do imposto atualizado
 *                 message:
 *                   type: string
 *       404:
 *         description: Imposto não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/pagar', async (req, res) => {
  try {
    const { id } = req.params;
    const { data_pagamento } = req.body;

    const updateData = {
      status: 'pago',
      data_pagamento: data_pagamento || new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase
      .from('impostos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Imposto não encontrado'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Imposto marcado como pago com sucesso'
    });
  } catch (error) {
    console.error('Erro ao marcar imposto como pago:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
