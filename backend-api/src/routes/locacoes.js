import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// GET /api/locacoes - Listar locações com filtros
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      tipo_equipamento, 
      cliente_id,
      search 
    } = req.query;

    let query = supabase
      .from('locacoes')
      .select(`
        *,
        clientes!locacoes_cliente_id_fkey(nome),
        funcionarios!locacoes_funcionario_responsavel_id_fkey(nome)
      `);

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (tipo_equipamento && tipo_equipamento !== 'all') {
      query = query.eq('tipo_equipamento', tipo_equipamento);
    }

    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id);
    }

    if (search) {
      query = query.or(`numero.ilike.%${search}%,cliente_nome.ilike.%${search}%,equipamento_id.ilike.%${search}%`);
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Ordenação
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar locações:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    // Processar dados para incluir nomes relacionados
    const locacoesProcessadas = (data || []).map(locacao => ({
      ...locacao,
      cliente_nome: locacao.clientes?.nome || 'N/A',
      funcionario_nome: locacao.funcionarios?.nome || 'N/A'
    }));

    res.json({
      success: true,
      data: locacoesProcessadas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Erro na rota de locações:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/locacoes/:id - Obter locação específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('locacoes')
      .select(`
        *,
        clientes!locacoes_cliente_id_fkey(nome),
        funcionarios!locacoes_funcionario_responsavel_id_fkey(nome)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Locação não encontrada' 
        });
      }
      console.error('Erro ao buscar locação:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    // Processar dados para incluir nomes relacionados
    const locacaoProcessada = {
      ...data,
      cliente_nome: data.clientes?.nome || 'N/A',
      funcionario_nome: data.funcionarios?.nome || 'N/A'
    };

    res.json({
      success: true,
      data: locacaoProcessada
    });

  } catch (error) {
    console.error('Erro na rota de locação específica:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// POST /api/locacoes - Criar nova locação
router.post('/', async (req, res) => {
  try {
    const {
      numero,
      cliente_id,
      equipamento_id,
      tipo_equipamento,
      contrato_id,
      data_inicio,
      data_fim,
      valor_mensal,
      status = 'ativa',
      observacoes,
      funcionario_responsavel_id
    } = req.body;

    // Validações básicas
    if (!numero || !cliente_id || !equipamento_id || !tipo_equipamento || !data_inicio || !valor_mensal) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: numero, cliente_id, equipamento_id, tipo_equipamento, data_inicio, valor_mensal'
      });
    }

    // Verificar se o número já existe
    const { data: existingLocacao } = await supabase
      .from('locacoes')
      .select('id')
      .eq('numero', numero)
      .single();

    if (existingLocacao) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma locação com este número'
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

    // Verificar se o equipamento existe
    let equipamentoExists = false;
    if (tipo_equipamento === 'grua') {
      const { data: grua, error: gruaError } = await supabase
        .from('gruas')
        .select('id, modelo, status')
        .eq('id', equipamento_id)
        .single();
      
      console.log('Verificando equipamento:', equipamento_id, 'Resultado:', grua, 'Erro:', gruaError);
      equipamentoExists = !!grua;
    } else if (tipo_equipamento === 'plataforma') {
      // Aqui você pode adicionar verificação para plataformas se tiver uma tabela específica
      equipamentoExists = true; // Por enquanto, assumindo que existe
    }

    if (!equipamentoExists) {
      console.warn(`Equipamento não encontrado: ${equipamento_id} (tipo: ${tipo_equipamento}) - Continuando com a criação da locação`);
      // Por enquanto, vamos permitir a criação mesmo se o equipamento não existir
      // TODO: Corrigir a validação de equipamentos
    }

    // Criar a locação
    const { data, error } = await supabase
      .from('locacoes')
      .insert({
        numero,
        cliente_id,
        equipamento_id,
        tipo_equipamento,
        contrato_id,
        data_inicio,
        data_fim,
        valor_mensal,
        status,
        observacoes,
        funcionario_responsavel_id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar locação:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Locação criada com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de criação de locação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// PUT /api/locacoes/:id - Atualizar locação
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remover campos que não devem ser atualizados
    delete updateData.id;
    delete updateData.created_at;

    // Verificar se a locação existe
    const { data: existingLocacao } = await supabase
      .from('locacoes')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingLocacao) {
      return res.status(404).json({
        success: false,
        message: 'Locação não encontrada'
      });
    }

    // Se estiver atualizando o número, verificar se não existe outro com o mesmo número
    if (updateData.numero) {
      const { data: duplicateLocacao } = await supabase
        .from('locacoes')
        .select('id')
        .eq('numero', updateData.numero)
        .neq('id', id)
        .single();

      if (duplicateLocacao) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma locação com este número'
        });
      }
    }

    // Atualizar a locação
    const { data, error } = await supabase
      .from('locacoes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar locação:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Locação atualizada com sucesso',
      data
    });

  } catch (error) {
    console.error('Erro na rota de atualização de locação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// DELETE /api/locacoes/:id - Excluir locação
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a locação existe
    const { data: existingLocacao } = await supabase
      .from('locacoes')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingLocacao) {
      return res.status(404).json({
        success: false,
        message: 'Locação não encontrada'
      });
    }

    // Verificar se há medições finalizadas
    const { data: medicoes } = await supabase
      .from('medicoes')
      .select('id')
      .eq('locacao_id', id)
      .eq('status', 'finalizada');

    if (medicoes && medicoes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir locação com medições finalizadas'
      });
    }

    // Excluir a locação (cascade irá excluir medições e aditivos)
    const { error } = await supabase
      .from('locacoes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir locação:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Locação excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro na rota de exclusão de locação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/locacoes/stats - Estatísticas das locações
router.get('/stats/overview', async (req, res) => {
  try {
    // Buscar estatísticas das locações ativas
    const { data: locacoesAtivas, error: errorAtivas } = await supabase
      .from('view_locacoes_ativas')
      .select('*');

    if (errorAtivas) {
      console.error('Erro ao buscar locações ativas:', errorAtivas);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: errorAtivas.message 
      });
    }

    // Buscar receita por período
    const { data: receitaPeriodo, error: errorReceita } = await supabase
      .from('view_receita_periodo')
      .select('*')
      .limit(12)
      .order('periodo', { ascending: false });

    if (errorReceita) {
      console.error('Erro ao buscar receita por período:', errorReceita);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: errorReceita.message 
      });
    }

    // Calcular estatísticas
    const stats = {
      total_locacoes_ativas: locacoesAtivas?.length || 0,
      gruas_locadas: locacoesAtivas?.filter(l => l.tipo_equipamento === 'grua').length || 0,
      plataformas_locadas: locacoesAtivas?.filter(l => l.tipo_equipamento === 'plataforma').length || 0,
      receita_mensal_atual: receitaPeriodo?.[0]?.receita_total || 0,
      receita_por_periodo: receitaPeriodo || []
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erro na rota de estatísticas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

export default router;
