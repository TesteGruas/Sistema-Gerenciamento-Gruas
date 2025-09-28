import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';
import { criarMovimentacoesVenda } from '../utils/movimentacoes-estoque.js';

const router = express.Router();

// Schema de validação para venda
const vendaSchema = Joi.object({
  cliente_id: Joi.number().integer().positive().required(),
  obra_id: Joi.number().integer().positive().optional(),
  numero_venda: Joi.string().min(1).max(50).required(),
  data_venda: Joi.date().required(),
  valor_total: Joi.number().min(0).required(),
  status: Joi.string().valid('pendente', 'confirmada', 'cancelada', 'finalizada').default('pendente'),
  tipo_venda: Joi.string().valid('equipamento', 'servico', 'locacao').required(),
  observacoes: Joi.string().optional()
});

// Schema de validação para item de venda
const vendaItemSchema = Joi.object({
  produto_id: Joi.string().optional(),
  grua_id: Joi.string().optional(),
  descricao: Joi.string().min(1).required(),
  quantidade: Joi.number().min(0).required(),
  valor_unitario: Joi.number().min(0).required()
});

// GET /api/vendas - Listar vendas
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vendas')
      .select(`
        *,
        clientes(nome, cnpj),
        obras(nome, endereco)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar vendas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/vendas - Criar venda
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = vendaSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('vendas')
      .insert([value])
      .select()
      .single();

    if (error) throw error;

    // Se a venda foi criada com status 'confirmada', criar movimentações de estoque
    if (value.status === 'confirmada') {
      console.log('🔄 Venda confirmada - criando movimentações de estoque...');
      
      // Buscar itens da venda (se existirem)
      const { data: itens, error: itensError } = await supabase
        .from('vendas_itens')
        .select('*')
        .eq('venda_id', data.id);

      if (itensError) {
        console.error('❌ Erro ao buscar itens da venda:', itensError);
      } else if (itens && itens.length > 0) {
        // Criar movimentações de estoque
        const movimentacoes = await criarMovimentacoesVenda(data, itens, 1); // TODO: usar ID do usuário logado
        console.log(`✅ Criadas ${movimentacoes.length} movimentações de estoque para a venda ${data.id}`);
      }
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Venda criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/vendas/:id - Obter venda específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('vendas')
      .select(`
        *,
        clientes(nome, cnpj, telefone, email),
        obras(nome, endereco, cidade, estado)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Venda não encontrada'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro ao obter venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/vendas/:id - Atualizar venda
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = vendaSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { data, error } = await supabase
      .from('vendas')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Venda não encontrada'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Venda atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/vendas/:id - Excluir venda
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('vendas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Venda excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/vendas/:id/itens - Listar itens da venda
router.get('/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('vendas_itens')
      .select(`
        *,
        produtos(nome, descricao),
        gruas(id, modelo, fabricante)
      `)
      .eq('venda_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Erro ao listar itens da venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/vendas/:id/itens - Adicionar item à venda
router.post('/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = vendaItemSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const itemData = {
      ...value,
      venda_id: parseInt(id)
    };

    const { data, error } = await supabase
      .from('vendas_itens')
      .insert([itemData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'Item adicionado à venda com sucesso'
    });
  } catch (error) {
    console.error('Erro ao adicionar item à venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/vendas/:id/confirmar - Confirmar venda e criar movimentações de estoque
router.post('/:id/confirmar', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar venda atual
    const { data: venda, error: vendaError } = await supabase
      .from('vendas')
      .select('*')
      .eq('id', id)
      .single();

    if (vendaError || !venda) {
      return res.status(404).json({
        success: false,
        message: 'Venda não encontrada'
      });
    }

    // Verificar se já está confirmada
    if (venda.status === 'confirmada') {
      return res.status(400).json({
        success: false,
        message: 'Venda já está confirmada'
      });
    }

    // Atualizar status da venda para confirmada
    const { data: vendaAtualizada, error: updateError } = await supabase
      .from('vendas')
      .update({ 
        status: 'confirmada',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Buscar itens da venda
    const { data: itens, error: itensError } = await supabase
      .from('vendas_itens')
      .select('*')
      .eq('venda_id', id);

    if (itensError) {
      console.error('❌ Erro ao buscar itens da venda:', itensError);
    }

    let movimentacoes = [];
    if (itens && itens.length > 0) {
      // Criar movimentações de estoque
      movimentacoes = await criarMovimentacoesVenda(vendaAtualizada, itens, 1); // TODO: usar ID do usuário logado
      console.log(`✅ Criadas ${movimentacoes.length} movimentações de estoque para a venda ${id}`);
    }

    res.json({
      success: true,
      data: {
        venda: vendaAtualizada,
        movimentacoes_criadas: movimentacoes.length,
        movimentacoes
      },
      message: 'Venda confirmada e movimentações de estoque criadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao confirmar venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/vendas/from-orcamento/:orcamentoId - Criar venda a partir de orçamento aprovado
router.post('/from-orcamento/:orcamentoId', async (req, res) => {
  try {
    const { orcamentoId } = req.params;

    // Buscar orçamento
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos')
      .select(`
        *,
        clientes:cliente_id (
          id,
          nome,
          cnpj,
          email
        ),
        orcamento_itens (*)
      `)
      .eq('id', orcamentoId)
      .single();

    if (orcamentoError || !orcamento) {
      return res.status(404).json({
        success: false,
        message: 'Orçamento não encontrado'
      });
    }

    // Verificar se o orçamento está aprovado
    if (orcamento.status !== 'aprovado') {
      return res.status(400).json({
        success: false,
        message: 'Apenas orçamentos aprovados podem ser convertidos em vendas'
      });
    }

    // Gerar número da venda
    const numeroVenda = `VEN-${Date.now()}`;

    // Criar venda baseada no orçamento
    const vendaData = {
      cliente_id: orcamento.cliente_id,
      obra_id: orcamento.obra_id || null,
      orcamento_id: orcamento.id,
      numero_venda: numeroVenda,
      data_venda: new Date().toISOString().split('T')[0],
      valor_total: orcamento.valor_total,
      status: 'pendente', // Venda criada como pendente
      tipo_venda: orcamento.tipo_orcamento,
      observacoes: `Venda criada a partir do orçamento ${orcamento.id}. ${orcamento.observacoes || ''}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: venda, error: vendaError } = await supabase
      .from('vendas')
      .insert([vendaData])
      .select()
      .single();

    if (vendaError) {
      throw vendaError;
    }

    // Criar itens da venda baseados nos itens do orçamento
    console.log('🔍 Orçamento itens:', orcamento.orcamento_itens);
    if (orcamento.orcamento_itens && orcamento.orcamento_itens.length > 0) {
      const itensVenda = orcamento.orcamento_itens.map(item => ({
        venda_id: venda.id,
        produto_id: item.produto_id || null, // Preservar produto_id do orçamento se existir
        descricao: item.produto_servico,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario
        // valor_total é uma coluna gerada, não precisa ser especificada
      }));

      console.log('📝 Itens da venda a serem inseridos:', itensVenda);

      const { error: itensError } = await supabase
        .from('vendas_itens')
        .insert(itensVenda);

      if (itensError) {
        console.error('❌ Erro ao criar itens da venda:', itensError);
        // Não falha a operação, apenas loga o erro
      } else {
        console.log('✅ Itens da venda criados com sucesso');
      }
    } else {
      console.log('⚠️ Orçamento não tem itens para copiar');
    }

    // Atualizar status do orçamento para "convertido"
    await supabase
      .from('orcamentos')
      .update({ 
        status: 'convertido',
        updated_at: new Date().toISOString()
      })
      .eq('id', orcamentoId);

    res.status(201).json({
      success: true,
      data: venda,
      message: 'Venda criada com sucesso a partir do orçamento'
    });
  } catch (error) {
    console.error('Erro ao criar venda a partir de orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;
