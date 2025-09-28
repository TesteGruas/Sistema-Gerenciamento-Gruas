import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// GET /api/notas-debito - Listar notas de débito com filtros
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      tipo,
      cliente_id,
      locacao_id,
      search 
    } = req.query;

    let query = supabase
      .from('notas_debito')
      .select(`
        *,
        clientes!inner(nome, cnpj),
        locacoes(
          id,
          numero,
          equipamento_id,
          tipo_equipamento
        )
      `);

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (tipo && tipo !== 'all') {
      query = query.eq('tipo', tipo);
    }

    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id);
    }

    if (locacao_id) {
      query = query.eq('locacao_id', locacao_id);
    }

    if (search) {
      query = query.or(`numero.ilike.%${search}%,descricao.ilike.%${search}%`);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Ordenação
    query = query.order('data_emissao', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar notas de débito:', error);
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
    console.error('Erro na rota de notas de débito:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/notas-debito/:id - Obter nota de débito específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notas_debito')
      .select(`
        *,
        clientes!inner(nome, cnpj, contato, telefone, email),
        locacoes(
          id,
          numero,
          equipamento_id,
          tipo_equipamento
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Nota de débito não encontrada' 
        });
      }
      console.error('Erro ao buscar nota de débito:', error);
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
    console.error('Erro na rota de nota de débito específica:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// POST /api/notas-debito - Criar nova nota de débito
router.post('/', async (req, res) => {
  try {
    const {
      numero,
      cliente_id,
      locacao_id,
      data_emissao,
      valor,
      descricao,
      tipo,
      status = 'pendente',
      observacoes
    } = req.body;

    // Validações básicas
    if (!numero || !cliente_id || !data_emissao || !valor || !descricao || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: numero, cliente_id, data_emissao, valor, descricao, tipo'
      });
    }

    // Verificar se o número já existe
    const { data: existingNota } = await supabase
      .from('notas_debito')
      .select('id')
      .eq('numero', numero)
      .single();

    if (existingNota) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma nota de débito com este número'
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

    // Se locacao_id foi fornecido, verificar se existe
    if (locacao_id) {
      const { data: locacao } = await supabase
        .from('locacoes')
        .select('id, cliente_id')
        .eq('id', locacao_id)
        .single();

      if (!locacao) {
        return res.status(400).json({
          success: false,
          message: 'Locação não encontrada'
        });
      }

      // Verificar se a locação pertence ao cliente
      if (locacao.cliente_id !== parseInt(cliente_id)) {
        return res.status(400).json({
          success: false,
          message: 'A locação não pertence ao cliente especificado'
        });
      }
    }

    // Criar a nota de débito
    const { data, error } = await supabase
      .from('notas_debito')
      .insert({
        numero,
        cliente_id,
        locacao_id,
        data_emissao,
        valor,
        descricao,
        tipo,
        status,
        observacoes
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar nota de débito:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Nota de débito criada com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de criação de nota de débito:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// PUT /api/notas-debito/:id - Atualizar nota de débito
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remover campos que não devem ser atualizados
    delete updateData.id;
    delete updateData.created_at;

    // Verificar se a nota de débito existe
    const { data: existingNota } = await supabase
      .from('notas_debito')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingNota) {
      return res.status(404).json({
        success: false,
        message: 'Nota de débito não encontrada'
      });
    }

    // Não permitir edição de notas de débito pagas
    if (existingNota.status === 'paga') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível editar nota de débito paga'
      });
    }

    // Se estiver atualizando o número, verificar se não existe outro com o mesmo número
    if (updateData.numero) {
      const { data: duplicateNota } = await supabase
        .from('notas_debito')
        .select('id')
        .eq('numero', updateData.numero)
        .neq('id', id)
        .single();

      if (duplicateNota) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma nota de débito com este número'
        });
      }
    }

    // Atualizar a nota de débito
    const { data, error } = await supabase
      .from('notas_debito')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar nota de débito:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Nota de débito atualizada com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de atualização de nota de débito:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// DELETE /api/notas-debito/:id - Excluir nota de débito
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a nota de débito existe
    const { data: existingNota } = await supabase
      .from('notas_debito')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingNota) {
      return res.status(404).json({
        success: false,
        message: 'Nota de débito não encontrada'
      });
    }

    // Não permitir exclusão de notas de débito pagas
    if (existingNota.status === 'paga') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir nota de débito paga'
      });
    }

    // Excluir a nota de débito
    const { error } = await supabase
      .from('notas_debito')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir nota de débito:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Nota de débito excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro na rota de exclusão de nota de débito:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// POST /api/notas-debito/:id/emitir - Emitir nota de débito
router.post('/:id/emitir', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a nota de débito existe
    const { data: existingNota } = await supabase
      .from('notas_debito')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingNota) {
      return res.status(404).json({
        success: false,
        message: 'Nota de débito não encontrada'
      });
    }

    if (existingNota.status === 'emitida') {
      return res.status(400).json({
        success: false,
        message: 'Nota de débito já está emitida'
      });
    }

    // Emitir a nota de débito
    const { data, error } = await supabase
      .from('notas_debito')
      .update({ status: 'emitida' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao emitir nota de débito:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Nota de débito emitida com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de emissão de nota de débito:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// POST /api/notas-debito/:id/marcar-paga - Marcar nota de débito como paga
router.post('/:id/marcar-paga', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a nota de débito existe
    const { data: existingNota } = await supabase
      .from('notas_debito')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingNota) {
      return res.status(404).json({
        success: false,
        message: 'Nota de débito não encontrada'
      });
    }

    if (existingNota.status === 'paga') {
      return res.status(400).json({
        success: false,
        message: 'Nota de débito já está marcada como paga'
      });
    }

    // Marcar como paga
    const { data, error } = await supabase
      .from('notas_debito')
      .update({ status: 'paga' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao marcar nota de débito como paga:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Nota de débito marcada como paga com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de marcação de nota de débito como paga:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

export default router;
