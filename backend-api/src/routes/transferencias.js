import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';

const router = express.Router();

// Schema de validação para transferência
const transferenciaSchema = Joi.object({
  data: Joi.date().required(),
  valor: Joi.number().min(0).required(),
  tipo: Joi.string().valid('entrada', 'saida').required(),
  descricao: Joi.string().min(1).required(),
  banco_origem: Joi.string().optional(),
  banco_destino: Joi.string().optional(),
  documento_comprobatório: Joi.string().optional()
});

/**
 * @swagger
 * /api/transferencias:
 *   get:
 *     summary: Lista todas as transferências bancárias
 *     tags: [Transferências]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de transferências bancárias
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
 *                         description: ID da transferência
 *                       data:
 *                         type: string
 *                         format: date
 *                         description: Data da transferência
 *                       valor:
 *                         type: number
 *                         description: Valor da transferência
 *                       tipo:
 *                         type: string
 *                         enum: [entrada, saida]
 *                         description: Tipo da transferência
 *                       descricao:
 *                         type: string
 *                         description: Descrição da transferência
 *                       banco_origem:
 *                         type: string
 *                         description: Banco de origem
 *                       banco_destino:
 *                         type: string
 *                         description: Banco de destino
 *                       documento_comprobatório:
 *                         type: string
 *                         description: Documento comprobatório
 *                       status:
 *                         type: string
 *                         description: Status da transferência
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
      .from('transferencias_bancarias')
      .select('*')
      .order('data', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar transferências:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/transferencias:
 *   post:
 *     summary: Cria uma nova transferência bancária
 *     tags: [Transferências]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *               - valor
 *               - tipo
 *               - descricao
 *             properties:
 *               data:
 *                 type: string
 *                 format: date
 *                 description: Data da transferência
 *               valor:
 *                 type: number
 *                 minimum: 0
 *                 description: Valor da transferência
 *               tipo:
 *                 type: string
 *                 enum: [entrada, saida]
 *                 description: Tipo da transferência
 *               descricao:
 *                 type: string
 *                 minLength: 1
 *                 description: Descrição da transferência
 *               banco_origem:
 *                 type: string
 *                 description: Banco de origem
 *               banco_destino:
 *                 type: string
 *                 description: Banco de destino
 *               documento_comprobatório:
 *                 type: string
 *                 description: Documento comprobatório
 *     responses:
 *       201:
 *         description: Transferência criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados da transferência criada
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = transferenciaSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('transferencias_bancarias')
      .insert([value])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Transferência registrada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar transferência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/transferencias/{id}:
 *   get:
 *     summary: Obtém uma transferência bancária específica
 *     tags: [Transferências]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da transferência
 *     responses:
 *       200:
 *         description: Dados da transferência
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
 *                       description: ID da transferência
 *                     data:
 *                       type: string
 *                       format: date
 *                       description: Data da transferência
 *                     valor:
 *                       type: number
 *                       description: Valor da transferência
 *                     tipo:
 *                       type: string
 *                       enum: [entrada, saida]
 *                       description: Tipo da transferência
 *                     descricao:
 *                       type: string
 *                       description: Descrição da transferência
 *                     banco_origem:
 *                       type: string
 *                       description: Banco de origem
 *                     banco_destino:
 *                       type: string
 *                       description: Banco de destino
 *                     documento_comprobatório:
 *                       type: string
 *                       description: Documento comprobatório
 *                     status:
 *                       type: string
 *                       description: Status da transferência
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de atualização
 *       404:
 *         description: Transferência não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('transferencias_bancarias')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Transferência não encontrada'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao obter transferência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/transferencias/{id}:
 *   put:
 *     summary: Atualiza uma transferência bancária existente
 *     tags: [Transferências]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da transferência
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *               - valor
 *               - tipo
 *               - descricao
 *             properties:
 *               data:
 *                 type: string
 *                 format: date
 *                 description: Data da transferência
 *               valor:
 *                 type: number
 *                 minimum: 0
 *                 description: Valor da transferência
 *               tipo:
 *                 type: string
 *                 enum: [entrada, saida]
 *                 description: Tipo da transferência
 *               descricao:
 *                 type: string
 *                 minLength: 1
 *                 description: Descrição da transferência
 *               banco_origem:
 *                 type: string
 *                 description: Banco de origem
 *               banco_destino:
 *                 type: string
 *                 description: Banco de destino
 *               documento_comprobatório:
 *                 type: string
 *                 description: Documento comprobatório
 *     responses:
 *       200:
 *         description: Transferência atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados da transferência atualizada
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Transferência não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = transferenciaSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('transferencias_bancarias')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Transferência não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Transferência atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar transferência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/transferencias/{id}:
 *   delete:
 *     summary: Exclui uma transferência bancária
 *     tags: [Transferências]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da transferência
 *     responses:
 *       200:
 *         description: Transferência excluída com sucesso
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
      .from('transferencias_bancarias')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Transferência excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir transferência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/transferencias/{id}/confirmar:
 *   post:
 *     summary: Confirma uma transferência bancária
 *     tags: [Transferências]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da transferência
 *     responses:
 *       200:
 *         description: Transferência confirmada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados da transferência confirmada
 *                 message:
 *                   type: string
 *       404:
 *         description: Transferência não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/confirmar', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('transferencias_bancarias')
      .update({ status: 'confirmada' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Transferência não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Transferência confirmada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao confirmar transferência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
