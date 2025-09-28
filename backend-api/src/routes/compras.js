import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';
import { criarMovimentacoesCompra } from '../utils/movimentacoes-estoque.js';

const router = express.Router();

// Schema de validação para compra
const compraSchema = Joi.object({
  fornecedor_id: Joi.number().integer().positive().required(),
  numero_pedido: Joi.string().min(1).max(50).required(),
  data_pedido: Joi.date().required(),
  data_entrega: Joi.date().optional(),
  valor_total: Joi.number().min(0).required(),
  status: Joi.string().valid('pendente', 'aprovado', 'enviado', 'recebido', 'cancelado').default('pendente'),
  observacoes: Joi.string().optional()
});

// Schema de validação para item de compra
const compraItemSchema = Joi.object({
  produto_id: Joi.string().optional(),
  descricao: Joi.string().min(1).required(),
  quantidade: Joi.number().min(0).required(),
  valor_unitario: Joi.number().min(0).required()
});

// GET /api/compras - Listar compras
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('compras')
      .select(`
        *,
        fornecedores(nome, cnpj, telefone, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar compras:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/compras - Criar compra
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = compraSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('compras')
      .insert([value])
      .select()
      .single();

    if (error) throw error;

    // Se a compra foi criada com status 'recebido', criar movimentações de estoque
    if (value.status === 'recebido') {
      console.log('🔄 Compra recebida - criando movimentações de estoque...');
      
      // Buscar itens da compra (se existirem)
      const { data: itens, error: itensError } = await supabase
        .from('compras_itens')
        .select('*')
        .eq('compra_id', data.id);

      if (itensError) {
        console.error('❌ Erro ao buscar itens da compra:', itensError);
      } else if (itens && itens.length > 0) {
        // Criar movimentações de estoque
        const movimentacoes = await criarMovimentacoesCompra(data, itens, 1); // TODO: usar ID do usuário logado
        console.log(`✅ Criadas ${movimentacoes.length} movimentações de estoque para a compra ${data.id}`);
      }
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Compra criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/compras/:id - Obter compra específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('compras')
      .select(`
        *,
        fornecedores(nome, cnpj, telefone, email, endereco, cidade, estado)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Compra não encontrada'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao obter compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/compras/:id - Atualizar compra
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = compraSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('compras')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Compra não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Compra atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/compras/:id - Excluir compra
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('compras')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Compra excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/compras/:id/itens - Listar itens da compra
router.get('/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('compras_itens')
      .select(`
        *,
        produtos(nome, descricao, unidade_medida)
      `)
      .eq('compra_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar itens da compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/compras/:id/itens - Adicionar item à compra
router.post('/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = compraItemSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const itemData = {
      ...value,
      compra_id: parseInt(id)
    };

    const { data, error } = await supabase
      .from('compras_itens')
      .insert([itemData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Item adicionado à compra com sucesso'
    });
  } catch (error) {
    console.error('Erro ao adicionar item à compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/compras/:id/receber - Marcar compra como recebida e criar movimentações de estoque
router.post('/:id/receber', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar compra atual
    const { data: compra, error: compraError } = await supabase
      .from('compras')
      .select('*')
      .eq('id', id)
      .single();

    if (compraError || !compra) {
      return res.status(404).json({
        success: false,
        message: 'Compra não encontrada'
      });
    }

    // Verificar se já está recebida
    if (compra.status === 'recebido') {
      return res.status(400).json({
        success: false,
        message: 'Compra já está marcada como recebida'
      });
    }

    // Atualizar status da compra para recebido
    const { data: compraAtualizada, error: updateError } = await supabase
      .from('compras')
      .update({ 
        status: 'recebido',
        data_entrega: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Buscar itens da compra
    const { data: itens, error: itensError } = await supabase
      .from('compras_itens')
      .select('*')
      .eq('compra_id', id);

    if (itensError) {
      console.error('❌ Erro ao buscar itens da compra:', itensError);
    }

    let movimentacoes = [];
    if (itens && itens.length > 0) {
      // Criar movimentações de estoque
      movimentacoes = await criarMovimentacoesCompra(compraAtualizada, itens, 1); // TODO: usar ID do usuário logado
      console.log(`✅ Criadas ${movimentacoes.length} movimentações de estoque para a compra ${id}`);
    }

    res.json({
      success: true,
      data: {
        compra: compraAtualizada,
        movimentacoes_criadas: movimentacoes.length,
        movimentacoes
      },
      message: 'Compra marcada como recebida e movimentações de estoque criadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao marcar compra como recebida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
