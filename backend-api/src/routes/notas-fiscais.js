import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';

const router = express.Router();

// Schema de validação para nota fiscal
const notaFiscalSchema = Joi.object({
  numero_nf: Joi.string().min(1).max(50).required(),
  serie: Joi.string().max(10).optional(),
  data_emissao: Joi.date().required(),
  data_vencimento: Joi.date().optional(),
  valor_total: Joi.number().min(0).required(),
  tipo: Joi.string().valid('entrada', 'saida').required(),
  status: Joi.string().valid('pendente', 'paga', 'vencida', 'cancelada').default('pendente'),
  cliente_id: Joi.number().integer().positive().optional(),
  fornecedor_id: Joi.number().integer().positive().optional(),
  venda_id: Joi.number().integer().positive().optional(),
  compra_id: Joi.number().integer().positive().optional(),
  observacoes: Joi.string().optional()
});

// GET /api/notas-fiscais - Listar notas fiscais
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notas_fiscais')
      .select(`
        *,
        clientes(nome, cnpj),
        fornecedores(nome, cnpj),
        vendas(numero_venda),
        compras(numero_pedido)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar notas fiscais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/notas-fiscais - Criar registro de nota fiscal
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = notaFiscalSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('notas_fiscais')
      .insert([value])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Nota fiscal registrada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/notas-fiscais/:id - Obter nota fiscal específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notas_fiscais')
      .select(`
        *,
        clientes(nome, cnpj, telefone, email),
        fornecedores(nome, cnpj, telefone, email),
        vendas(numero_venda, data_venda),
        compras(numero_pedido, data_pedido)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Nota fiscal não encontrada'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao obter nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/notas-fiscais/:id - Atualizar nota fiscal
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = notaFiscalSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('notas_fiscais')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Nota fiscal não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Nota fiscal atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/notas-fiscais/:id - Excluir nota fiscal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('notas_fiscais')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Nota fiscal excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir nota fiscal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/notas-fiscais/:id/upload - Upload de arquivo PDF/XML
router.post('/:id/upload', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_arquivo, tamanho_arquivo, tipo_arquivo } = req.body;

    if (!nome_arquivo || !tamanho_arquivo || !tipo_arquivo) {
      return res.status(400).json({
        success: false,
        message: 'Dados do arquivo são obrigatórios'
      });
    }

    const { data, error } = await supabase
      .from('notas_fiscais')
      .update({
        nome_arquivo,
        tamanho_arquivo: parseInt(tamanho_arquivo),
        tipo_arquivo
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Nota fiscal não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Arquivo vinculado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/notas-fiscais/:id/download - Download do arquivo
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notas_fiscais')
      .select('nome_arquivo, arquivo_nf')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Nota fiscal não encontrada'
      });
    }

    if (!data.arquivo_nf) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado'
      });
    }

    // Aqui você implementaria a lógica de download do arquivo
    // Por enquanto, retornamos as informações do arquivo
    res.json({
      success: true,
      data: {
        nome_arquivo: data.nome_arquivo,
        caminho: data.arquivo_nf
      }
    });
  } catch (error) {
    console.error('Erro ao fazer download do arquivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
