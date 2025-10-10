import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/gruas-mensais - Lista gruas mensais com filtros
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { mes, ano, grua_id, status, obra_id } = req.query;

    let query = supabaseAdmin
      .from('gruas_mensais')
      .select(`
        *,
        grua:gruas(id, name, modelo, capacidade, status),
        obra:obras(id, nome)
      `);

    if (mes) query = query.eq('mes', mes);
    if (ano) query = query.eq('ano', parseInt(ano));
    if (grua_id) query = query.eq('grua_id', grua_id);
    if (status) query = query.eq('status', status);
    if (obra_id) query = query.eq('obra_id', parseInt(obra_id));

    query = query.order('ano', { ascending: false }).order('mes', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar gruas mensais:', error);
      return res.status(500).json({ 
        error: 'Erro ao buscar gruas mensais',
        message: error.message 
      });
    }

    // Formatar dados para incluir informações relacionadas
    const formattedData = data.map(item => ({
      ...item,
      grua_name: item.grua?.name || item.grua_id,
      grua_modelo: item.grua?.modelo || '',
      obra_name: item.obra?.nome || ''
    }));

    res.json(formattedData || []);
  } catch (error) {
    console.error('Erro ao buscar gruas mensais:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar gruas mensais',
      message: error.message 
    });
  }
});

// GET /api/gruas-mensais/:id - Busca grua mensal por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('gruas_mensais')
      .select(`
        *,
        grua:gruas(id, name, modelo, capacidade, status)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Grua mensal não encontrada' });
      }
      console.error('Erro ao buscar grua mensal:', error);
      return res.status(500).json({ 
        error: 'Erro ao buscar grua mensal',
        message: error.message 
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar grua mensal:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar grua mensal',
      message: error.message 
    });
  }
});

// POST /api/gruas-mensais - Cria novo registro mensal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const newData = req.body;

    const { data, error } = await supabaseAdmin
      .from('gruas_mensais')
      .insert(newData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar grua mensal:', error);
      return res.status(500).json({ 
        error: 'Erro ao criar grua mensal',
        message: error.message 
      });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar grua mensal:', error);
    res.status(500).json({ 
      error: 'Erro ao criar grua mensal',
      message: error.message 
    });
  }
});

// PUT /api/gruas-mensais/:id - Atualiza grua mensal
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('gruas_mensais')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Grua mensal não encontrada' });
      }
      console.error('Erro ao atualizar grua mensal:', error);
      return res.status(500).json({ 
        error: 'Erro ao atualizar grua mensal',
        message: error.message 
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar grua mensal:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar grua mensal',
      message: error.message 
    });
  }
});

// DELETE /api/gruas-mensais/:id - Deleta grua mensal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('gruas_mensais')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar grua mensal:', error);
      return res.status(500).json({ 
        error: 'Erro ao deletar grua mensal',
        message: error.message 
      });
    }

    res.json({ message: 'Grua mensal deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar grua mensal:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar grua mensal',
      message: error.message 
    });
  }
});

// GET /api/gruas-mensais/estatisticas/:mes - Estatísticas agregadas do mês
router.get('/estatisticas/:mes', authenticateToken, async (req, res) => {
  try {
    const { mes } = req.params;

    const { data, error } = await supabaseAdmin
      .from('gruas_mensais')
      .select('*')
      .eq('mes', mes);

    if (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return res.status(500).json({ 
        error: 'Erro ao buscar estatísticas',
        message: error.message 
      });
    }

    // Calcular estatísticas agregadas
    const stats = {
      total_gruas: data.length,
      total_horas_trabalhadas: data.reduce((sum, item) => sum + (item.horas_trabalhadas || 0), 0),
      total_horas_disponiveis: data.reduce((sum, item) => sum + (item.horas_disponiveis || 0), 0),
      total_custo: data.reduce((sum, item) => sum + (item.custo_total || 0), 0),
      total_receita: data.reduce((sum, item) => sum + (item.receita_gerada || 0), 0),
      eficiencia_media: data.length > 0 
        ? data.reduce((sum, item) => sum + (item.eficiencia || 0), 0) / data.length 
        : 0,
      utilizacao_media: data.length > 0 
        ? data.reduce((sum, item) => sum + (item.taxa_utilizacao || 0), 0) / data.length 
        : 0,
      gruas_em_obra: data.filter(item => item.status === 'em_obra').length,
      gruas_manutencao: data.filter(item => item.status === 'manutencao').length,
      gruas_disponiveis: data.filter(item => item.status === 'disponivel').length,
      gruas_inativas: data.filter(item => item.status === 'inativa').length
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      message: error.message 
    });
  }
});

// GET /api/gruas-mensais/ranking/:mes - Ranking de gruas
router.get('/ranking/:mes', authenticateToken, async (req, res) => {
  try {
    const { mes } = req.params;
    const { orderBy = 'eficiencia' } = req.query;

    let query = supabaseAdmin
      .from('gruas_mensais')
      .select(`
        *,
        grua:gruas(id, name, modelo)
      `)
      .eq('mes', mes);

    // Ordenar por campo especificado
    const orderField = orderBy === 'receita_gerada' ? 'receita_gerada' : 
                       orderBy === 'horas_trabalhadas' ? 'horas_trabalhadas' : 
                       'eficiencia';

    query = query.order(orderField, { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar ranking:', error);
      return res.status(500).json({ 
        error: 'Erro ao buscar ranking',
        message: error.message 
      });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar ranking',
      message: error.message 
    });
  }
});

// GET /api/gruas-mensais/grua/:gruaId/historico - Histórico de uma grua
router.get('/grua/:gruaId/historico', authenticateToken, async (req, res) => {
  try {
    const { gruaId } = req.params;
    const { limit = 12 } = req.query;

    const { data, error } = await supabaseAdmin
      .from('gruas_mensais')
      .select(`
        *,
        grua:gruas(id, name, modelo)
      `)
      .eq('grua_id', gruaId)
      .order('ano', { ascending: false })
      .order('mes', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return res.status(500).json({ 
        error: 'Erro ao buscar histórico',
        message: error.message 
      });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar histórico',
      message: error.message 
    });
  }
});

// POST /api/gruas-mensais/inicializar-mes - Inicializa mês para todas as gruas
router.post('/inicializar-mes', authenticateToken, async (req, res) => {
  try {
    const { mes, ano } = req.body;

    console.log('📅 Inicializar mês - Dados recebidos:', { mes, ano });

    if (!mes || !ano) {
      return res.status(400).json({ error: 'Mês e ano são obrigatórios' });
    }

    // Detectar se o mês já está formatado como YYYY-MM ou é apenas um número
    let mesNumero, anoNumero, mesFormatado;
    
    if (typeof mes === 'string' && mes.includes('-')) {
      // Formato YYYY-MM já recebido
      mesFormatado = mes;
      const partes = mes.split('-');
      anoNumero = parseInt(partes[0]);
      mesNumero = parseInt(partes[1]);
      console.log('📅 Mês recebido já formatado:', mesFormatado);
    } else {
      // Apenas número do mês recebido
      mesNumero = typeof mes === 'string' ? parseInt(mes) : mes;
      anoNumero = typeof ano === 'string' ? parseInt(ano) : ano;
      mesFormatado = `${anoNumero}-${String(mesNumero).padStart(2, '0')}`;
      console.log('📅 Mês formatado:', mesFormatado);
    }
    
    // Validar mês e ano
    if (mesNumero < 1 || mesNumero > 12) {
      return res.status(400).json({ 
        error: 'Mês inválido',
        message: `O mês deve estar entre 1 e 12. Recebido: ${mesNumero}` 
      });
    }
    
    if (anoNumero < 2000 || anoNumero > 2100) {
      return res.status(400).json({ 
        error: 'Ano inválido',
        message: `O ano deve estar entre 2000 e 2100. Recebido: ${anoNumero}` 
      });
    }

    // Verificar se já existe registro para este mês
    const { data: existentes, error: existentesError } = await supabaseAdmin
      .from('gruas_mensais')
      .select('id')
      .eq('mes', mesFormatado)
      .limit(1);

    if (existentesError) {
      console.error('Erro ao verificar registros existentes:', existentesError);
    }

    if (existentes && existentes.length > 0) {
      return res.status(400).json({ 
        error: 'Mês já inicializado',
        message: `Já existem registros para o mês ${mesFormatado}`
      });
    }

    // Buscar todas as gruas ativas
    const { data: gruas, error: gruasError } = await supabaseAdmin
      .from('gruas')
      .select('id')
      .in('status', ['disponivel', 'em_obra', 'Disponível', 'Operacional']);

    if (gruasError) {
      console.error('Erro ao buscar gruas:', gruasError);
      return res.status(500).json({ 
        error: 'Erro ao buscar gruas',
        message: gruasError.message 
      });
    }

    console.log(`📊 Total de gruas ativas encontradas: ${gruas.length}`);

    // Criar registros para cada grua
    const registros = gruas.map(grua => ({
      grua_id: grua.id,
      mes: mesFormatado,
      ano: anoNumero,
      horas_trabalhadas: 0,
      horas_disponiveis: 200,
      horas_manutencao: 0,
      manutencoes_realizadas: 0,
      custo_hora: 0,
      custo_total: 0,
      custo_operacional: 0,
      receita_gerada: 0,
      eficiencia: 100,
      taxa_utilizacao: 0,
      tempo_inatividade: 0,
      status: 'disponivel'
    }));

    console.log('📝 Exemplo de registro a ser inserido:', registros[0]);

    const { data, error } = await supabaseAdmin
      .from('gruas_mensais')
      .insert(registros)
      .select();

    if (error) {
      console.error('❌ Erro ao inicializar mês:', error);
      console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
      return res.status(500).json({ 
        error: 'Erro ao inicializar mês',
        message: error.message,
        details: error.details || 'Sem detalhes adicionais',
        hint: error.hint || 'Verifique se o formato do mês está correto (YYYY-MM)'
      });
    }

    console.log(`✅ Mês ${mesFormatado} inicializado com sucesso! Total de registros: ${data.length}`);
    res.json({ message: 'Mês inicializado com sucesso', registros: data });
  } catch (error) {
    console.error('Erro ao inicializar mês:', error);
    res.status(500).json({ 
      error: 'Erro ao inicializar mês',
      message: error.message 
    });
  }
});

export default router;
