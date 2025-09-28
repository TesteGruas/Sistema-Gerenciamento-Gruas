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

// GET /api/transferencias - Listar transferências
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

// POST /api/transferencias - Criar transferência
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

// GET /api/transferencias/:id - Obter transferência específica
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

// PUT /api/transferencias/:id - Atualizar transferência
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

// DELETE /api/transferencias/:id - Excluir transferência
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

// POST /api/transferencias/:id/confirmar - Confirmar transferência
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
