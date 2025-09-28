import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';

const router = express.Router();

// Schema de validação para manifesto
const manifestoSchema = Joi.object({
  numero_manifesto: Joi.string().min(1).max(50).required(),
  data_emissao: Joi.date().required(),
  motorista_id: Joi.number().integer().positive().required(),
  veiculo_id: Joi.number().integer().positive().optional(),
  origem: Joi.string().min(1).max(255).required(),
  destino: Joi.string().min(1).max(255).required(),
  status: Joi.string().valid('pendente', 'em_transito', 'entregue', 'cancelado').default('pendente'),
  observacoes: Joi.string().optional()
});

// Schema de validação para item do manifesto
const manifestoItemSchema = Joi.object({
  grua_id: Joi.string().required(),
  obra_origem_id: Joi.number().integer().positive().optional(),
  obra_destino_id: Joi.number().integer().positive().optional(),
  peso: Joi.number().min(0).optional(),
  dimensoes: Joi.string().max(100).optional(),
  observacoes: Joi.string().optional()
});

// Schema de validação para veículo
const veiculoSchema = Joi.object({
  placa: Joi.string().min(1).max(10).required(),
  modelo: Joi.string().min(1).max(100).required(),
  marca: Joi.string().min(1).max(50).required(),
  tipo: Joi.string().min(1).max(50).required(),
  capacidade: Joi.number().min(0).optional(),
  ano: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).optional(),
  status: Joi.string().valid('ativo', 'inativo', 'manutencao').default('ativo')
});

// ===== ROTAS DE MANIFESTOS =====

// GET /api/manifestos - Listar manifestos
router.get('/manifestos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('logistica_manifestos')
      .select(`
        *,
        funcionarios(nome, telefone)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar manifestos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/manifestos - Criar manifesto
router.post('/manifestos', async (req, res) => {
  try {
    const { error: validationError, value } = manifestoSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('logistica_manifestos')
      .insert([value])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Manifesto criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar manifesto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/manifestos/:id - Obter manifesto específico
router.get('/manifestos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('logistica_manifestos')
      .select(`
        *,
        funcionarios(nome, telefone, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Manifesto não encontrado'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao obter manifesto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/manifestos/:id - Atualizar manifesto
router.put('/manifestos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = manifestoSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('logistica_manifestos')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Manifesto não encontrado'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Manifesto atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar manifesto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/manifestos/:id - Excluir manifesto
router.delete('/manifestos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('logistica_manifestos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Manifesto excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir manifesto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/manifestos/:id/itens - Listar itens do manifesto
router.get('/manifestos/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('logistica_manifestos_itens')
      .select(`
        *,
        gruas(id, modelo, fabricante),
        obras_origem:obras!logistica_manifestos_itens_obra_origem_id_fkey(nome, endereco),
        obras_destino:obras!logistica_manifestos_itens_obra_destino_id_fkey(nome, endereco)
      `)
      .eq('manifesto_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar itens do manifesto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/manifestos/:id/itens - Adicionar item ao manifesto
router.post('/manifestos/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = manifestoItemSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const itemData = {
      ...value,
      manifesto_id: parseInt(id)
    };

    const { data, error } = await supabase
      .from('logistica_manifestos_itens')
      .insert([itemData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Item adicionado ao manifesto com sucesso'
    });
  } catch (error) {
    console.error('Erro ao adicionar item ao manifesto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== ROTAS DE VEÍCULOS =====

// GET /api/veiculos - Listar veículos
router.get('/veiculos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('veiculos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar veículos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/veiculos - Criar veículo
router.post('/veiculos', async (req, res) => {
  try {
    const { error: validationError, value } = veiculoSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('veiculos')
      .insert([value])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Veículo criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar veículo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/veiculos/:id - Obter veículo específico
router.get('/veiculos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('veiculos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Veículo não encontrado'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao obter veículo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/veiculos/:id - Atualizar veículo
router.put('/veiculos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = veiculoSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('veiculos')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Veículo não encontrado'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Veículo atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar veículo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/veiculos/:id - Excluir veículo
router.delete('/veiculos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('veiculos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Veículo excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir veículo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
