import express from 'express';
import Joi from 'joi';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Schema de validação para orçamento
const orcamentoSchema = Joi.object({
  cliente_id: Joi.number().integer().required(),
  data_orcamento: Joi.date().required(),
  data_validade: Joi.date().required(),
  valor_total: Joi.number().precision(2).required(),
  desconto: Joi.number().precision(2).default(0),
  observacoes: Joi.string().allow(''),
  status: Joi.string().valid('rascunho', 'enviado', 'aprovado', 'rejeitado', 'vencido', 'convertido').default('rascunho'),
  vendedor_id: Joi.number().integer().allow(null),
  condicoes_pagamento: Joi.string().allow(''),
  prazo_entrega: Joi.string().allow(''),
  tipo_orcamento: Joi.string().valid('equipamento', 'servico', 'locacao', 'venda').required()
});

// Schema de validação para criação de orçamento (inclui itens)
const criarOrcamentoSchema = Joi.object({
  cliente_id: Joi.number().integer().required(),
  data_orcamento: Joi.date().required(),
  data_validade: Joi.date().required(),
  valor_total: Joi.number().precision(2).required(),
  desconto: Joi.number().precision(2).default(0),
  observacoes: Joi.string().allow(''),
  status: Joi.string().valid('rascunho', 'enviado', 'aprovado', 'rejeitado', 'vencido', 'convertido').default('rascunho'),
  vendedor_id: Joi.number().integer().allow(null),
  condicoes_pagamento: Joi.string().allow(''),
  prazo_entrega: Joi.string().allow(''),
  tipo_orcamento: Joi.string().valid('equipamento', 'servico', 'locacao', 'venda').required(),
  itens: Joi.array().items(
    Joi.object({
      produto_id: Joi.string().allow(''),
      produto_servico: Joi.string().required(),
      descricao: Joi.string().allow(''),
      quantidade: Joi.number().precision(2).required(),
      valor_unitario: Joi.number().precision(2).required(),
      valor_total: Joi.number().precision(2).required(),
      tipo: Joi.string().valid('produto', 'servico', 'equipamento').required(),
      unidade: Joi.string().allow(''),
      observacoes: Joi.string().allow('')
    })
  ).min(1).required()
});

// Schema de validação para item do orçamento
const itemOrcamentoSchema = Joi.object({
  orcamento_id: Joi.number().integer().required(),
  produto_servico: Joi.string().required(),
  descricao: Joi.string().required(),
  quantidade: Joi.number().precision(2).required(),
  valor_unitario: Joi.number().precision(2).required(),
  valor_total: Joi.number().precision(2).required(),
  tipo: Joi.string().valid('produto', 'servico', 'equipamento').required(),
  unidade: Joi.string().allow(''),
  observacoes: Joi.string().allow('')
});

// GET /api/orcamentos - Listar orçamentos
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, cliente_id, data_inicio, data_fim } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orcamentos')
      .select(`
        *,
        clientes:cliente_id (
          id,
          nome,
          email,
          telefone
        ),
        funcionarios:vendedor_id (
          id,
          nome
        ),
        orcamento_itens (*)
      `)
      .order('created_at', { ascending: false });

    // Filtros
    if (status) {
      query = query.eq('status', status);
    }
    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id);
    }
    if (data_inicio) {
      query = query.gte('data_orcamento', data_inicio);
    }
    if (data_fim) {
      query = query.lte('data_orcamento', data_fim);
    }

    // Paginação
    query = query.range(offset, offset + limit - 1);

    const { data: orcamentos, error } = await query;

    if (error) throw error;

    // Buscar total de registros para paginação
    const { count, error: countError } = await supabase
      .from('orcamentos')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    res.json({
      success: true,
      data: orcamentos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/orcamentos/:id - Buscar orçamento por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar orçamento
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos')
      .select(`
        *,
        clientes:cliente_id (
          id,
          nome,
          email,
          telefone,
          endereco,
          cnpj_cpf
        ),
        funcionarios:vendedor_id (
          id,
          nome,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (orcamentoError) throw orcamentoError;

    // Buscar itens do orçamento
    const { data: itens, error: itensError } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', id)
      .order('id');

    if (itensError) throw itensError;

    res.json({
      success: true,
      data: {
        ...orcamento,
        itens
      }
    });
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/orcamentos - Criar novo orçamento
router.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = criarOrcamentoSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { itens, ...orcamentoData } = req.body;

    // Criar orçamento
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos')
      .insert([orcamentoData])
      .select()
      .single();

    if (orcamentoError) throw orcamentoError;

    // Criar itens do orçamento se fornecidos
    if (itens && itens.length > 0) {
      const itensData = itens.map(item => ({
        ...item,
        orcamento_id: orcamento.id
      }));

      const { error: itensError } = await supabase
        .from('orcamento_itens')
        .insert(itensData);

      if (itensError) throw itensError;
    }

    res.status(201).json({
      success: true,
      data: orcamento,
      message: 'Orçamento criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/orcamentos/:id - Atualizar orçamento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = orcamentoSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationError.details
      });
    }

    const { itens, ...orcamentoData } = req.body;

    // Atualizar orçamento
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos')
      .update(orcamentoData)
      .eq('id', id)
      .select()
      .single();

    if (orcamentoError) throw orcamentoError;

    // Atualizar itens se fornecidos
    if (itens) {
      // Remover itens existentes
      await supabase
        .from('orcamento_itens')
        .delete()
        .eq('orcamento_id', id);

      // Inserir novos itens
      if (itens.length > 0) {
        const itensData = itens.map(item => ({
          ...item,
          orcamento_id: id
        }));

        const { error: itensError } = await supabase
          .from('orcamento_itens')
          .insert(itensData);

        if (itensError) throw itensError;
      }
    }

    res.json({
      success: true,
      data: orcamento,
      message: 'Orçamento atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/orcamentos/:id - Excluir orçamento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o orçamento pode ser excluído (apenas rascunhos)
    const { data: orcamento, error: checkError } = await supabase
      .from('orcamentos')
      .select('status')
      .eq('id', id)
      .single();

    if (checkError) throw checkError;

    if (orcamento.status !== 'rascunho') {
      return res.status(400).json({
        success: false,
        message: 'Apenas orçamentos em rascunho podem ser excluídos'
      });
    }

    // Excluir itens primeiro
    await supabase
      .from('orcamento_itens')
      .delete()
      .eq('orcamento_id', id);

    // Excluir orçamento
    const { error } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Orçamento excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/orcamentos/:id/enviar - Enviar orçamento
router.post('/:id/enviar', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, observacoes } = req.body;

    // Atualizar status do orçamento
    const { data: orcamento, error: updateError } = await supabase
      .from('orcamentos')
      .update({ 
        status: 'enviado',
        data_envio: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Aqui você pode implementar o envio de email
    // Por enquanto, apenas retornamos sucesso
    res.json({
      success: true,
      data: orcamento,
      message: 'Orçamento enviado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao enviar orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/orcamentos/:id/aprovar - Aprovar orçamento
router.post('/:id/aprovar', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: orcamento, error } = await supabase
      .from('orcamentos')
      .update({ 
        status: 'aprovado',
        data_aprovacao: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: orcamento,
      message: 'Orçamento aprovado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao aprovar orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/orcamentos/:id/rejeitar - Rejeitar orçamento
router.post('/:id/rejeitar', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const { data: orcamento, error } = await supabase
      .from('orcamentos')
      .update({ 
        status: 'rejeitado',
        data_rejeicao: new Date().toISOString(),
        motivo_rejeicao: motivo
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: orcamento,
      message: 'Orçamento rejeitado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao rejeitar orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/orcamentos/:id/pdf - Gerar PDF do orçamento
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar dados completos do orçamento
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos')
      .select(`
        *,
        clientes:cliente_id (
          id,
          nome,
          email,
          telefone,
          endereco,
          cnpj_cpf
        ),
        funcionarios:vendedor_id (
          id,
          nome,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (orcamentoError) throw orcamentoError;

    const { data: itens, error: itensError } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', id)
      .order('id');

    if (itensError) throw itensError;

    // Aqui você pode implementar a geração de PDF
    // Por enquanto, retornamos os dados em JSON
    res.json({
      success: true,
      data: {
        orcamento,
        itens
      },
      message: 'Dados do orçamento para PDF'
    });
  } catch (error) {
    console.error('Erro ao gerar PDF do orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;

