import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

/**
 * GET /api/whatsapp-logs
 * Lista logs de mensagens WhatsApp enviadas
 * Requer autenticação
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      data_inicio,
      data_fim,
      status,
      tipo,
      aprovacao_id
    } = req.query;

    // Construir query - buscar logs com dados básicos da aprovação
    let query = supabaseAdmin
      .from('whatsapp_logs')
      .select(`
        *,
        aprovacoes_horas_extras (
          id,
          funcionario_id,
          data_trabalho,
          horas_extras,
          registro_ponto_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1000);

    // Aplicar filtros
    if (data_inicio) {
      query = query.gte('created_at', data_inicio);
    }
    if (data_fim) {
      // Adicionar 23:59:59 ao final do dia
      const dataFimCompleta = new Date(data_fim);
      dataFimCompleta.setHours(23, 59, 59, 999);
      query = query.lte('created_at', dataFimCompleta.toISOString());
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (tipo && tipo !== 'all') {
      query = query.eq('tipo', tipo);
    }
    if (aprovacao_id) {
      query = query.eq('aprovacao_id', aprovacao_id);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('[whatsapp-logs] Erro ao buscar logs:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar logs',
        message: error.message
      });
    }

    // Buscar informações adicionais dos funcionários e obras se houver aprovações
    const aprovacaoIds = [...new Set((logs || [])
      .filter(log => log.aprovacao_id)
      .map(log => log.aprovacao_id))];

    let funcionariosMap = {};
    let obrasMap = {};

    if (aprovacaoIds.length > 0) {
      // Buscar aprovações com funcionários
      const { data: aprovacoesComFuncionarios, error: errorAprovacoes } = await supabaseAdmin
        .from('aprovacoes_horas_extras')
        .select(`
          id,
          funcionario_id,
          registro_ponto_id,
          observacoes
        `)
        .in('id', aprovacaoIds);

      if (errorAprovacoes) {
        console.error('[whatsapp-logs] Erro ao buscar aprovações:', errorAprovacoes);
      }

      // Buscar funcionários diretamente pelos IDs
      const funcionarioIds = [...new Set((aprovacoesComFuncionarios || [])
        .filter(a => a.funcionario_id)
        .map(a => a.funcionario_id))];

      if (funcionarioIds.length > 0) {
        const { data: funcionarios, error: errorFuncionarios } = await supabaseAdmin
          .from('funcionarios')
          .select('id, nome')
          .in('id', funcionarioIds);

        if (errorFuncionarios) {
          console.error('[whatsapp-logs] Erro ao buscar funcionários:', errorFuncionarios);
        } else {
          // Criar mapa de funcionários por ID
          const funcionariosPorId = {};
          (funcionarios || []).forEach(func => {
            funcionariosPorId[func.id] = func;
          });

          // Associar funcionários às aprovações
          (aprovacoesComFuncionarios || []).forEach(apr => {
            if (apr.funcionario_id && funcionariosPorId[apr.funcionario_id]) {
              funcionariosMap[apr.id] = funcionariosPorId[apr.funcionario_id];
            }
          });
        }
      }

      // Tentar buscar obras através do ID do registro nas observações
      // O ID real do registro está nas observações no formato "Registro original: TEST666854D5JN"
      const registroIdsReais = [];
      (aprovacoesComFuncionarios || []).forEach(apr => {
        if (apr.observacoes) {
          const match = apr.observacoes.match(/Registro original:\s*([A-Z0-9]+)/i);
          if (match && match[1]) {
            registroIdsReais.push({ aprovacao_id: apr.id, registro_id: match[1] });
          }
        }
      });

      if (registroIdsReais.length > 0) {
        const idsParaBuscar = registroIdsReais.map(r => r.registro_id);
        const { data: registrosComObras, error: errorRegistros } = await supabaseAdmin
          .from('registros_ponto')
          .select(`
            id,
            obra_id,
            obras:obra_id (
              id,
              nome
            )
          `)
          .in('id', idsParaBuscar);

        if (errorRegistros) {
          console.error('[whatsapp-logs] Erro ao buscar registros:', errorRegistros);
        } else {
          // Criar mapa de obras por registro_id
          const obrasPorRegistroId = {};
          (registrosComObras || []).forEach(reg => {
            if (reg.obra_id && reg.obras) {
              obrasPorRegistroId[reg.id] = reg.obras;
            }
          });

          // Associar obras às aprovações
          registroIdsReais.forEach(({ aprovacao_id, registro_id }) => {
            if (obrasPorRegistroId[registro_id]) {
              obrasMap[aprovacao_id] = obrasPorRegistroId[registro_id];
            }
          });
        }
      }
    }

    // Formatar dados para o frontend
    const logsFormatados = (logs || []).map(log => {
      const aprovacao = log.aprovacoes_horas_extras;
      const funcionario = aprovacao ? funcionariosMap[aprovacao.id] : null;
      const obra = aprovacao ? obrasMap[aprovacao.id] : null;

      return {
        id: log.id,
        aprovacao_id: log.aprovacao_id,
        telefone_destino: log.telefone_destino || log.destinatario_telefone,
        mensagem: log.mensagem,
        status: log.status || log.status_envio,
        status_detalhes: log.erro_detalhes || log.status_detalhes,
        tipo: log.tipo || log.tipo_envio,
        tentativa: log.tentativas || log.tentativa || 1,
        created_at: log.created_at || log.data_envio,
        updated_at: log.updated_at,
        aprovacao: aprovacao ? {
          id: aprovacao.id,
          funcionario_nome: funcionario?.nome || null,
          obra_nome: obra?.nome || null,
          data: aprovacao.data_trabalho,
          horas_extras: aprovacao.horas_extras
        } : null
      };
    });

    res.json({
      success: true,
      data: logsFormatados
    });
  } catch (error) {
    console.error('[whatsapp-logs] Erro ao processar requisição:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/whatsapp-logs/estatisticas
 * Retorna estatísticas dos logs
 */
router.get('/estatisticas', authenticateToken, async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;

    let query = supabaseAdmin
      .from('whatsapp_logs')
      .select('status, tipo');

    if (data_inicio) {
      query = query.gte('created_at', data_inicio);
    }
    if (data_fim) {
      const dataFimCompleta = new Date(data_fim);
      dataFimCompleta.setHours(23, 59, 59, 999);
      query = query.lte('created_at', dataFimCompleta.toISOString());
    }

    const { data: logs, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar estatísticas',
        message: error.message
      });
    }

    const total_enviadas = logs.length;
    const total_entregues = logs.filter(l => (l.status || l.status_envio) === 'entregue' || (l.status || l.status_envio) === 'lido').length;
    const total_lidas = logs.filter(l => (l.status || l.status_envio) === 'lido').length;
    const total_erros = logs.filter(l => (l.status || l.status_envio) === 'erro' || (l.status || l.status_envio) === 'falha').length;

    const estatisticas = {
      total_enviadas,
      total_entregues,
      total_lidas,
      total_erros,
      taxa_entrega: total_enviadas > 0 ? (total_entregues / total_enviadas) * 100 : 0,
      taxa_leitura: total_enviadas > 0 ? (total_lidas / total_enviadas) * 100 : 0,
      tempo_medio_resposta: 0 // TODO: calcular se houver dados de resposta
    };

    res.json({
      success: true,
      data: estatisticas
    });
  } catch (error) {
    console.error('[whatsapp-logs] Erro ao processar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/whatsapp-logs/export
 * Exporta logs em CSV
 */
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const {
      data_inicio,
      data_fim,
      status,
      tipo
    } = req.query;

    let query = supabaseAdmin
      .from('whatsapp_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (data_inicio) {
      query = query.gte('created_at', data_inicio);
    }
    if (data_fim) {
      const dataFimCompleta = new Date(data_fim);
      dataFimCompleta.setHours(23, 59, 59, 999);
      query = query.lte('created_at', dataFimCompleta.toISOString());
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (tipo && tipo !== 'all') {
      query = query.eq('tipo', tipo);
    }

    const { data: logs, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao exportar logs',
        message: error.message
      });
    }

    // Gerar CSV
    const headers = ['ID', 'Data/Hora', 'Tipo', 'Telefone', 'Status', 'Tentativas', 'Mensagem'];
    const rows = logs.map(log => [
      log.id,
      new Date(log.created_at || log.data_envio).toLocaleString('pt-BR'),
      log.tipo || log.tipo_envio || '-',
      log.telefone_destino || log.destinatario_telefone || '-',
      log.status || log.status_envio || '-',
      log.tentativas || log.tentativa || 1,
      (log.mensagem || '').replace(/"/g, '""').substring(0, 100)
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="whatsapp-logs-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\ufeff' + csv); // BOM para Excel
  } catch (error) {
    console.error('[whatsapp-logs] Erro ao exportar:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

export default router;

