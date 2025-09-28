import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// GET /api/orcamentos-locacao - Listar orçamentos de locação com filtros
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      tipo_orcamento,
      cliente_id,
      search 
    } = req.query;

    let query = supabase
      .from('orcamentos_locacao')
      .select(`
        *,
        clientes!inner(nome, cnpj),
        funcionarios!vendedor_id(nome)
      `);

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (tipo_orcamento && tipo_orcamento !== 'all') {
      query = query.eq('tipo_orcamento', tipo_orcamento);
    }

    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id);
    }

    if (search) {
      query = query.or(`numero.ilike.%${search}%,clientes.nome.ilike.%${search}%`);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Ordenação
    query = query.order('data_orcamento', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar orçamentos de locação:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Erro na rota de orçamentos de locação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/orcamentos-locacao/:id - Obter orçamento específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orcamentos_locacao')
      .select(`
        *,
        clientes!inner(nome, cnpj, contato, telefone, email),
        funcionarios!vendedor_id(nome, telefone, email),
        orcamento_itens_locacao(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Orçamento não encontrado' 
        });
      }
      console.error('Erro ao buscar orçamento:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Erro na rota de orçamento específico:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// POST /api/orcamentos-locacao - Criar novo orçamento
router.post('/', async (req, res) => {
  try {
    const {
      numero,
      cliente_id,
      data_orcamento,
      data_validade,
      valor_total,
      desconto = 0,
      status = 'rascunho',
      tipo_orcamento,
      vendedor_id,
      condicoes_pagamento,
      prazo_entrega,
      observacoes,
      itens = []
    } = req.body;

    // Validações básicas
    if (!numero || !cliente_id || !data_orcamento || !data_validade || !valor_total || !tipo_orcamento) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: numero, cliente_id, data_orcamento, data_validade, valor_total, tipo_orcamento'
      });
    }

    // Verificar se o número já existe
    const { data: existingOrcamento } = await supabase
      .from('orcamentos_locacao')
      .select('id')
      .eq('numero', numero)
      .single();

    if (existingOrcamento) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um orçamento com este número'
      });
    }

    // Verificar se o cliente existe
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', cliente_id)
      .single();

    if (!cliente) {
      return res.status(400).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }

    // Criar o orçamento
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos_locacao')
      .insert({
        numero,
        cliente_id,
        data_orcamento,
        data_validade,
        valor_total,
        desconto,
        status,
        tipo_orcamento,
        vendedor_id,
        condicoes_pagamento,
        prazo_entrega,
        observacoes
      })
      .select()
      .single();

    if (orcamentoError) {
      console.error('Erro ao criar orçamento:', orcamentoError);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: orcamentoError.message 
      });
    }

    // Criar os itens do orçamento
    if (itens && itens.length > 0) {
      const itensData = itens.map(item => ({
        orcamento_id: orcamento.id,
        produto_servico: item.produto_servico,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        tipo: item.tipo,
        unidade: item.unidade,
        observacoes: item.observacoes
      }));

      const { error: itensError } = await supabase
        .from('orcamento_itens_locacao')
        .insert(itensData);

      if (itensError) {
        console.error('Erro ao criar itens do orçamento:', itensError);
        // Se falhar ao criar itens, excluir o orçamento
        await supabase
          .from('orcamentos_locacao')
          .delete()
          .eq('id', orcamento.id);
        
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao criar itens do orçamento',
          error: itensError.message 
        });
      }
    }

    // Buscar o orçamento completo com itens
    const { data: orcamentoCompleto } = await supabase
      .from('orcamentos_locacao')
      .select(`
        *,
        clientes!inner(nome, cnpj),
        funcionarios!vendedor_id(nome),
        orcamento_itens_locacao(*)
      `)
      .eq('id', orcamento.id)
      .single();

    res.status(201).json({
      success: true,
      message: 'Orçamento criado com sucesso',
      data: orcamentoCompleto
    });

  } catch (error) {
    console.error('Erro na rota de criação de orçamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// PUT /api/orcamentos-locacao/:id - Atualizar orçamento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const { itens } = updateData;

    // Remover campos que não devem ser atualizados
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.itens;

    // Verificar se o orçamento existe
    const { data: existingOrcamento } = await supabase
      .from('orcamentos_locacao')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingOrcamento) {
      return res.status(404).json({
        success: false,
        message: 'Orçamento não encontrado'
      });
    }

    // Não permitir edição de orçamentos convertidos
    if (existingOrcamento.status === 'convertido') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível editar orçamento convertido'
      });
    }

    // Se estiver atualizando o número, verificar se não existe outro com o mesmo número
    if (updateData.numero) {
      const { data: duplicateOrcamento } = await supabase
        .from('orcamentos_locacao')
        .select('id')
        .eq('numero', updateData.numero)
        .neq('id', id)
        .single();

      if (duplicateOrcamento) {
        return res.status(400).json({
          success: false,
          message: 'Já existe um orçamento com este número'
        });
      }
    }

    // Atualizar o orçamento
    const { data, error } = await supabase
      .from('orcamentos_locacao')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar orçamento:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    // Atualizar itens se fornecidos
    if (itens) {
      // Excluir itens existentes
      await supabase
        .from('orcamento_itens_locacao')
        .delete()
        .eq('orcamento_id', id);

      // Inserir novos itens
      if (itens.length > 0) {
        const itensData = itens.map(item => ({
          orcamento_id: id,
          produto_servico: item.produto_servico,
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_total: item.valor_total,
          tipo: item.tipo,
          unidade: item.unidade,
          observacoes: item.observacoes
        }));

        const { error: itensError } = await supabase
          .from('orcamento_itens_locacao')
          .insert(itensData);

        if (itensError) {
          console.error('Erro ao atualizar itens do orçamento:', itensError);
          return res.status(500).json({ 
            success: false, 
            message: 'Erro ao atualizar itens do orçamento',
            error: itensError.message 
          });
        }
      }
    }

    // Buscar o orçamento completo com itens
    const { data: orcamentoCompleto } = await supabase
      .from('orcamentos_locacao')
      .select(`
        *,
        clientes!inner(nome, cnpj),
        funcionarios!vendedor_id(nome),
        orcamento_itens_locacao(*)
      `)
      .eq('id', id)
      .single();

    res.json({
      success: true,
      message: 'Orçamento atualizado com sucesso',
      data: orcamentoCompleto
    });

  } catch (error) {
    console.error('Erro na rota de atualização de orçamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// DELETE /api/orcamentos-locacao/:id - Excluir orçamento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o orçamento existe
    const { data: existingOrcamento } = await supabase
      .from('orcamentos_locacao')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingOrcamento) {
      return res.status(404).json({
        success: false,
        message: 'Orçamento não encontrado'
      });
    }

    // Não permitir exclusão de orçamentos convertidos
    if (existingOrcamento.status === 'convertido') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir orçamento convertido'
      });
    }

    // Excluir o orçamento (cascade irá excluir os itens)
    const { error } = await supabase
      .from('orcamentos_locacao')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir orçamento:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Orçamento excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro na rota de exclusão de orçamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// POST /api/orcamentos-locacao/:id/enviar - Enviar orçamento
router.post('/:id/enviar', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o orçamento existe
    const { data: existingOrcamento } = await supabase
      .from('orcamentos_locacao')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingOrcamento) {
      return res.status(404).json({
        success: false,
        message: 'Orçamento não encontrado'
      });
    }

    if (existingOrcamento.status !== 'rascunho') {
      return res.status(400).json({
        success: false,
        message: 'Apenas orçamentos em rascunho podem ser enviados'
      });
    }

    // Enviar o orçamento
    const { data, error } = await supabase
      .from('orcamentos_locacao')
      .update({ 
        status: 'enviado',
        data_envio: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao enviar orçamento:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Orçamento enviado com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de envio de orçamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// POST /api/orcamentos-locacao/:id/aprovar - Aprovar orçamento
router.post('/:id/aprovar', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o orçamento existe
    const { data: existingOrcamento } = await supabase
      .from('orcamentos_locacao')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingOrcamento) {
      return res.status(404).json({
        success: false,
        message: 'Orçamento não encontrado'
      });
    }

    if (existingOrcamento.status !== 'enviado') {
      return res.status(400).json({
        success: false,
        message: 'Apenas orçamentos enviados podem ser aprovados'
      });
    }

    // Aprovar o orçamento
    const { data, error } = await supabase
      .from('orcamentos_locacao')
      .update({ 
        status: 'aprovado',
        data_aprovacao: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao aprovar orçamento:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Orçamento aprovado com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de aprovação de orçamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

export default router;
