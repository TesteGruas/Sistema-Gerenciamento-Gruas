import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/relatorios-faturamento:
 *   get:
 *     summary: Relatório de faturamento separado por tipo
 *     tags: [Relatórios Financeiros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: data_inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial do período
 *       - in: query
 *         name: data_fim
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final do período
 *       - in: query
 *         name: agrupar_por
 *         schema:
 *           type: string
 *           enum: [mes, dia]
 *           default: mes
 *         description: Agrupar resultado por mês ou dia
 *     responses:
 *       200:
 *         description: Relatório de faturamento gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       periodo:
 *                         type: string
 *                       vendas:
 *                         type: number
 *                       locacoes:
 *                         type: number
 *                       servicos:
 *                         type: number
 *                       total:
 *                         type: number
 *                 resumo:
 *                   type: object
 *                   properties:
 *                     total_vendas:
 *                       type: number
 *                     total_locacoes:
 *                       type: number
 *                     total_servicos:
 *                       type: number
 *                     total_geral:
 *                       type: number
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', authenticateToken, requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    const { data_inicio, data_fim, agrupar_por = 'mes' } = req.query;

    // Validar parâmetros obrigatórios
    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: data_inicio e data_fim'
      });
    }

    // Validar formato de datas
    const dataInicioDate = new Date(data_inicio);
    const dataFimDate = new Date(data_fim);
    
    if (isNaN(dataInicioDate.getTime()) || isNaN(dataFimDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Formato de data inválido. Use YYYY-MM-DD'
      });
    }

    if (dataInicioDate > dataFimDate) {
      return res.status(400).json({
        success: false,
        error: 'Data de início deve ser anterior à data de fim'
      });
    }

    // Buscar vendas no período
    const { data: vendas, error: vendasError } = await supabaseAdmin
      .from('vendas')
      .select('data_venda, valor_total, status, tipo_venda')
      .gte('data_venda', data_inicio)
      .lte('data_venda', data_fim)
      .in('status', ['confirmada', 'finalizada']);

    if (vendasError) {
      console.error('Erro ao buscar vendas:', vendasError);
    }

    // Buscar locações no período
    const { data: locacoes, error: locacoesError } = await supabaseAdmin
      .from('locacoes')
      .select('data_inicio, valor_mensal, status')
      .gte('data_inicio', data_inicio)
      .lte('data_inicio', data_fim)
      .in('status', ['ativa', 'finalizada']);

    if (locacoesError) {
      console.error('Erro ao buscar locações:', locacoesError);
    }

    // Buscar medições (faturamento real das locações)
    const { data: medicoes, error: medicoesError } = await supabaseAdmin
      .from('medicoes')
      .select('data_medicao, valor_total, status')
      .gte('data_medicao', data_inicio)
      .lte('data_medicao', data_fim)
      .eq('status', 'finalizada');

    if (medicoesError) {
      console.error('Erro ao buscar medições:', medicoesError);
    }

    // Buscar receitas de serviços
    const { data: receitas, error: receitasError } = await supabaseAdmin
      .from('receitas')
      .select('data_receita, valor, tipo, status')
      .gte('data_receita', data_inicio)
      .lte('data_receita', data_fim)
      .eq('status', 'confirmada');

    if (receitasError) {
      console.error('Erro ao buscar receitas:', receitasError);
    }

    // Agrupar dados por período
    const faturamentoPorPeriodo = new Map();

    // Função auxiliar para formatar período
    const formatarPeriodo = (data) => {
      const date = new Date(data);
      if (agrupar_por === 'dia') {
        return date.toLocaleDateString('pt-BR');
      } else {
        // Agrupar por mês
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      }
    };

    // Processar vendas
    vendas?.forEach(venda => {
      const periodo = formatarPeriodo(venda.data_venda);
      if (!faturamentoPorPeriodo.has(periodo)) {
        faturamentoPorPeriodo.set(periodo, { 
          periodo, 
          vendas: 0, 
          locacoes: 0, 
          servicos: 0, 
          total: 0,
          quantidade_vendas: 0,
          quantidade_locacoes: 0,
          quantidade_servicos: 0
        });
      }
      const item = faturamentoPorPeriodo.get(periodo);
      item.vendas += parseFloat(venda.valor_total || 0);
      item.quantidade_vendas += 1;
    });

    // Processar locações (usar medições se disponíveis)
    if (medicoes && medicoes.length > 0) {
      medicoes.forEach(medicao => {
        const periodo = formatarPeriodo(medicao.data_medicao);
        if (!faturamentoPorPeriodo.has(periodo)) {
          faturamentoPorPeriodo.set(periodo, { 
            periodo, 
            vendas: 0, 
            locacoes: 0, 
            servicos: 0, 
            total: 0,
            quantidade_vendas: 0,
            quantidade_locacoes: 0,
            quantidade_servicos: 0
          });
        }
        const item = faturamentoPorPeriodo.get(periodo);
        item.locacoes += parseFloat(medicao.valor_total || 0);
        item.quantidade_locacoes += 1;
      });
    } else {
      // Se não houver medições, usar valor mensal das locações
      locacoes?.forEach(locacao => {
        const periodo = formatarPeriodo(locacao.data_inicio);
        if (!faturamentoPorPeriodo.has(periodo)) {
          faturamentoPorPeriodo.set(periodo, { 
            periodo, 
            vendas: 0, 
            locacoes: 0, 
            servicos: 0, 
            total: 0,
            quantidade_vendas: 0,
            quantidade_locacoes: 0,
            quantidade_servicos: 0
          });
        }
        const item = faturamentoPorPeriodo.get(periodo);
        item.locacoes += parseFloat(locacao.valor_mensal || 0);
        item.quantidade_locacoes += 1;
      });
    }

    // Processar serviços (receitas com tipo 'servico')
    receitas?.forEach(receita => {
      const tipo = receita.tipo?.toLowerCase() || '';
      if (tipo.includes('serviço') || tipo.includes('servico')) {
        const periodo = formatarPeriodo(receita.data_receita);
        if (!faturamentoPorPeriodo.has(periodo)) {
          faturamentoPorPeriodo.set(periodo, { 
            periodo, 
            vendas: 0, 
            locacoes: 0, 
            servicos: 0, 
            total: 0,
            quantidade_vendas: 0,
            quantidade_locacoes: 0,
            quantidade_servicos: 0
          });
        }
        const item = faturamentoPorPeriodo.get(periodo);
        item.servicos += parseFloat(receita.valor || 0);
        item.quantidade_servicos += 1;
      }
    });

    // Calcular totais por período
    const dadosFaturamento = Array.from(faturamentoPorPeriodo.values()).map(item => ({
      ...item,
      total: item.vendas + item.locacoes + item.servicos
    }));

    // Ordenar por período (mais recente primeiro)
    dadosFaturamento.sort((a, b) => {
      const dateA = new Date(a.periodo.split('/').reverse().join('-'));
      const dateB = new Date(b.periodo.split('/').reverse().join('-'));
      return dateB - dateA;
    });

    // Calcular resumo geral
    const resumo = dadosFaturamento.reduce((acc, item) => {
      acc.total_vendas += item.vendas;
      acc.total_locacoes += item.locacoes;
      acc.total_servicos += item.servicos;
      acc.total_geral += item.total;
      acc.quantidade_total_vendas += item.quantidade_vendas;
      acc.quantidade_total_locacoes += item.quantidade_locacoes;
      acc.quantidade_total_servicos += item.quantidade_servicos;
      return acc;
    }, { 
      total_vendas: 0, 
      total_locacoes: 0, 
      total_servicos: 0, 
      total_geral: 0,
      quantidade_total_vendas: 0,
      quantidade_total_locacoes: 0,
      quantidade_total_servicos: 0
    });

    // Calcular percentuais
    resumo.percentual_vendas = resumo.total_geral > 0 
      ? ((resumo.total_vendas / resumo.total_geral) * 100).toFixed(2) 
      : 0;
    resumo.percentual_locacoes = resumo.total_geral > 0 
      ? ((resumo.total_locacoes / resumo.total_geral) * 100).toFixed(2) 
      : 0;
    resumo.percentual_servicos = resumo.total_geral > 0 
      ? ((resumo.total_servicos / resumo.total_geral) * 100).toFixed(2) 
      : 0;

    // Calcular ticket médio
    resumo.ticket_medio_vendas = resumo.quantidade_total_vendas > 0
      ? (resumo.total_vendas / resumo.quantidade_total_vendas).toFixed(2)
      : 0;
    resumo.ticket_medio_locacoes = resumo.quantidade_total_locacoes > 0
      ? (resumo.total_locacoes / resumo.quantidade_total_locacoes).toFixed(2)
      : 0;
    resumo.ticket_medio_servicos = resumo.quantidade_total_servicos > 0
      ? (resumo.total_servicos / resumo.quantidade_total_servicos).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: dadosFaturamento,
      resumo,
      periodo: {
        data_inicio,
        data_fim,
        agrupamento: agrupar_por
      }
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de faturamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/relatorios-faturamento/por-tipo:
 *   get:
 *     summary: Faturamento detalhado por tipo de operação
 *     tags: [Relatórios Financeiros]
 */
router.get('/por-tipo', authenticateToken, requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: data_inicio e data_fim'
      });
    }

    // Buscar vendas detalhadas por tipo
    const { data: vendas } = await supabaseAdmin
      .from('vendas')
      .select('tipo_venda, valor_total, data_venda')
      .gte('data_venda', data_inicio)
      .lte('data_venda', data_fim)
      .in('status', ['confirmada', 'finalizada']);

    // Buscar locações por tipo de equipamento
    const { data: locacoes } = await supabaseAdmin
      .from('locacoes')
      .select('tipo_equipamento, valor_mensal, data_inicio')
      .gte('data_inicio', data_inicio)
      .lte('data_inicio', data_fim)
      .in('status', ['ativa', 'finalizada']);

    // Agrupar vendas por tipo
    const vendasPorTipo = {};
    vendas?.forEach(venda => {
      const tipo = venda.tipo_venda || 'Não especificado';
      if (!vendasPorTipo[tipo]) {
        vendasPorTipo[tipo] = { tipo, total: 0, quantidade: 0 };
      }
      vendasPorTipo[tipo].total += parseFloat(venda.valor_total || 0);
      vendasPorTipo[tipo].quantidade += 1;
    });

    // Agrupar locações por tipo de equipamento
    const locacoesPorTipo = {};
    locacoes?.forEach(locacao => {
      const tipo = locacao.tipo_equipamento || 'Não especificado';
      if (!locacoesPorTipo[tipo]) {
        locacoesPorTipo[tipo] = { tipo, total: 0, quantidade: 0 };
      }
      locacoesPorTipo[tipo].total += parseFloat(locacao.valor_mensal || 0);
      locacoesPorTipo[tipo].quantidade += 1;
    });

    res.json({
      success: true,
      data: {
        vendas_por_tipo: Object.values(vendasPorTipo),
        locacoes_por_tipo: Object.values(locacoesPorTipo)
      },
      periodo: { data_inicio, data_fim }
    });

  } catch (error) {
    console.error('Erro ao gerar relatório por tipo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

export default router;

