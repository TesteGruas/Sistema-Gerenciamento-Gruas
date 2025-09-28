import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// GET /api/medicoes - Listar medições com filtros
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      locacao_id,
      periodo,
      search 
    } = req.query;

    let query = supabase
      .from('medicoes')
      .select(`
        *,
        locacoes!inner(
          id,
          numero,
          cliente_id,
          equipamento_id,
          tipo_equipamento,
          clientes!inner(nome)
        )
      `);

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (locacao_id) {
      query = query.eq('locacao_id', locacao_id);
    }

    if (periodo) {
      query = query.eq('periodo', periodo);
    }

    if (search) {
      query = query.or(`numero.ilike.%${search}%,periodo.ilike.%${search}%`);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Ordenação
    query = query.order('data_medicao', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar medições:', error);
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
    console.error('Erro na rota de medições:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/medicoes/:id - Obter medição específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('medicoes')
      .select(`
        *,
        locacoes!inner(
          id,
          numero,
          cliente_id,
          equipamento_id,
          tipo_equipamento,
          clientes!inner(nome)
        ),
        aditivos(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Medição não encontrada' 
        });
      }
      console.error('Erro ao buscar medição:', error);
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
    console.error('Erro na rota de medição específica:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// POST /api/medicoes - Criar nova medição
router.post('/', async (req, res) => {
  try {
    const {
      numero,
      locacao_id,
      periodo,
      data_medicao,
      valor_base,
      valor_aditivos = 0,
      status = 'pendente',
      observacoes
    } = req.body;

    // Validações básicas
    if (!numero || !locacao_id || !periodo || !data_medicao || !valor_base) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: numero, locacao_id, periodo, data_medicao, valor_base'
      });
    }

    // Verificar se o número já existe
    const { data: existingMedicao } = await supabase
      .from('medicoes')
      .select('id')
      .eq('numero', numero)
      .single();

    if (existingMedicao) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma medição com este número'
      });
    }

    // Verificar se a locação existe
    const { data: locacao } = await supabase
      .from('locacoes')
      .select('id, valor_mensal')
      .eq('id', locacao_id)
      .single();

    if (!locacao) {
      return res.status(400).json({
        success: false,
        message: 'Locação não encontrada'
      });
    }

    // Verificar se já existe medição para este período nesta locação
    const { data: existingPeriodo } = await supabase
      .from('medicoes')
      .select('id')
      .eq('locacao_id', locacao_id)
      .eq('periodo', periodo)
      .single();

    if (existingPeriodo) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma medição para este período nesta locação'
      });
    }

    // Calcular valor total
    const valor_total = parseFloat(valor_base) + parseFloat(valor_aditivos);

    // Criar a medição
    const { data, error } = await supabase
      .from('medicoes')
      .insert({
        numero,
        locacao_id,
        periodo,
        data_medicao,
        valor_base,
        valor_aditivos,
        valor_total,
        status,
        observacoes
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar medição:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Medição criada com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de criação de medição:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// PUT /api/medicoes/:id - Atualizar medição
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remover campos que não devem ser atualizados
    delete updateData.id;
    delete updateData.created_at;

    // Verificar se a medição existe
    const { data: existingMedicao } = await supabase
      .from('medicoes')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingMedicao) {
      return res.status(404).json({
        success: false,
        message: 'Medição não encontrada'
      });
    }

    // Não permitir edição de medições finalizadas
    if (existingMedicao.status === 'finalizada') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível editar medição finalizada'
      });
    }

    // Se estiver atualizando o número, verificar se não existe outro com o mesmo número
    if (updateData.numero) {
      const { data: duplicateMedicao } = await supabase
        .from('medicoes')
        .select('id')
        .eq('numero', updateData.numero)
        .neq('id', id)
        .single();

      if (duplicateMedicao) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma medição com este número'
        });
      }
    }

    // Recalcular valor total se necessário
    if (updateData.valor_base !== undefined || updateData.valor_aditivos !== undefined) {
      const valor_base = updateData.valor_base || existingMedicao.valor_base;
      const valor_aditivos = updateData.valor_aditivos || existingMedicao.valor_aditivos;
      updateData.valor_total = parseFloat(valor_base) + parseFloat(valor_aditivos);
    }

    // Atualizar a medição
    const { data, error } = await supabase
      .from('medicoes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar medição:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Medição atualizada com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de atualização de medição:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// DELETE /api/medicoes/:id - Excluir medição
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a medição existe
    const { data: existingMedicao } = await supabase
      .from('medicoes')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingMedicao) {
      return res.status(404).json({
        success: false,
        message: 'Medição não encontrada'
      });
    }

    // Não permitir exclusão de medições finalizadas
    if (existingMedicao.status === 'finalizada') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir medição finalizada'
      });
    }

    // Excluir a medição
    const { error } = await supabase
      .from('medicoes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir medição:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Medição excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro na rota de exclusão de medição:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// POST /api/medicoes/:id/finalizar - Finalizar medição
router.post('/:id/finalizar', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a medição existe
    const { data: existingMedicao } = await supabase
      .from('medicoes')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingMedicao) {
      return res.status(404).json({
        success: false,
        message: 'Medição não encontrada'
      });
    }

    if (existingMedicao.status === 'finalizada') {
      return res.status(400).json({
        success: false,
        message: 'Medição já está finalizada'
      });
    }

    // Finalizar a medição
    const { data, error } = await supabase
      .from('medicoes')
      .update({ status: 'finalizada' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao finalizar medição:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Medição finalizada com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de finalização de medição:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

export default router;
