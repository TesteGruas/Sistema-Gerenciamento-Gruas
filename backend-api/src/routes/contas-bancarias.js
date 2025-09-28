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

// GET /api/contas-bancarias - Listar contas
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

// POST /api/contas-bancarias - Criar conta
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

// GET /api/contas-bancarias/:id - Obter conta específica
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

// PUT /api/contas-bancarias/:id - Atualizar conta
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

// DELETE /api/contas-bancarias/:id - Excluir conta
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

// PUT /api/contas-bancarias/:id/saldo - Atualizar saldo manualmente
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
