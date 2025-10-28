import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/relatorios-impostos/{mes}/{ano}:
 *   get:
 *     summary: Relatório de impostos por mês/ano
 *     tags: [Relatórios Financeiros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mes
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^(0[1-9]|1[0-2])$'
 *         description: Mês no formato MM (01-12)
 *       - in: path
 *         name: ano
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{4}$'
 *         description: Ano no formato YYYY
 *     responses:
 *       200:
 *         description: Relatório de impostos gerado com sucesso
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:mes/:ano', authenticateToken, requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    const { mes, ano } = req.params;

    // Validar mês e ano
    const mesNum = parseInt(mes);
    const anoNum = parseInt(ano);

    if (mesNum < 1 || mesNum > 12) {
      return res.status(400).json({
        success: false,
        error: 'Mês inválido. Use valores entre 01 e 12'
      });
    }

    if (anoNum < 2000 || anoNum > 2100) {
      return res.status(400).json({
        success: false,
        error: 'Ano inválido'
      });
    }

    // Formatar competência no padrão YYYY-MM
    const competencia = `${ano}-${mes.padStart(2, '0')}`;

    // Buscar impostos da tabela impostos_financeiros
    const { data: impostosFinanceiros, error: impostosError } = await supabaseAdmin
      .from('impostos_financeiros')
      .select('*')
      .eq('competencia', competencia)
      .order('tipo', { ascending: true });

    if (impostosError) {
      console.error('Erro ao buscar impostos financeiros:', impostosError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar impostos',
        message: impostosError.message
      });
    }

    // Se não houver impostos cadastrados, calcular estimativa baseada nas vendas e serviços
    let impostosCalculados = [];
    
    if (!impostosFinanceiros || impostosFinanceiros.length === 0) {
      // Calcular data início e fim do mês
      const dataInicio = `${ano}-${mes.padStart(2, '0')}-01`;
      const ultimoDia = new Date(anoNum, mesNum, 0).getDate();
      const dataFim = `${ano}-${mes.padStart(2, '0')}-${ultimoDia}`;

      // Buscar vendas do mês
      const { data: vendas } = await supabaseAdmin
        .from('vendas')
        .select('valor_total, status')
        .gte('data_venda', dataInicio)
        .lte('data_venda', dataFim)
        .in('status', ['confirmada', 'finalizada']);

      const totalVendas = vendas?.reduce((sum, v) => sum + parseFloat(v.valor_total || 0), 0) || 0;

      // Buscar receitas de serviços do mês
      const { data: servicos } = await supabaseAdmin
        .from('receitas')
        .select('valor, tipo, status')
        .eq('tipo', 'servico')
        .gte('data_receita', dataInicio)
        .lte('data_receita', dataFim)
        .eq('status', 'confirmada');

      const totalServicos = servicos?.reduce((sum, s) => sum + parseFloat(s.valor || 0), 0) || 0;

      // Buscar locações (receita de locações)
      const { data: locacoes } = await supabaseAdmin
        .from('locacoes')
        .select('valor_mensal, status')
        .gte('data_inicio', dataInicio)
        .lte('data_inicio', dataFim)
        .in('status', ['ativa', 'finalizada']);

      const totalLocacoes = locacoes?.reduce((sum, l) => sum + parseFloat(l.valor_mensal || 0), 0) || 0;

      // Base de cálculo total
      const baseCalculo = totalVendas + totalServicos + totalLocacoes;

      // Calcular impostos estimados (usar alíquotas padrão)
      impostosCalculados = [
        {
          tipo: 'ICMS',
          descricao: 'ICMS sobre vendas (12%)',
          valor_base: totalVendas,
          aliquota: 12,
          valor: totalVendas * 0.12,
          competencia,
          status: 'estimado',
          is_estimativa: true
        },
        {
          tipo: 'ISS',
          descricao: 'ISS sobre serviços (5%)',
          valor_base: totalServicos,
          aliquota: 5,
          valor: totalServicos * 0.05,
          competencia,
          status: 'estimado',
          is_estimativa: true
        },
        {
          tipo: 'PIS',
          descricao: 'PIS sobre faturamento (1.65%)',
          valor_base: baseCalculo,
          aliquota: 1.65,
          valor: baseCalculo * 0.0165,
          competencia,
          status: 'estimado',
          is_estimativa: true
        },
        {
          tipo: 'COFINS',
          descricao: 'COFINS sobre faturamento (7.6%)',
          valor_base: baseCalculo,
          aliquota: 7.6,
          valor: baseCalculo * 0.076,
          competencia,
          status: 'estimado',
          is_estimativa: true
        }
      ];
    }

    // Usar dados reais da tabela se disponíveis, senão usar calculados
    const impostos = impostosFinanceiros && impostosFinanceiros.length > 0 
      ? impostosFinanceiros 
      : impostosCalculados;

    // Agrupar por tipo de imposto
    const impostosPorTipo = {};
    impostos.forEach(imposto => {
      const tipo = imposto.tipo?.toUpperCase() || 'OUTRO';
      if (!impostosPorTipo[tipo]) {
        impostosPorTipo[tipo] = {
          tipo,
          total: 0,
          total_pago: 0,
          total_pendente: 0,
          quantidade: 0,
          quantidade_paga: 0,
          quantidade_pendente: 0,
          impostos: []
        };
      }

      const valor = parseFloat(imposto.valor || 0);
      impostosPorTipo[tipo].total += valor;
      impostosPorTipo[tipo].quantidade += 1;
      impostosPorTipo[tipo].impostos.push(imposto);

      if (imposto.status === 'pago') {
        impostosPorTipo[tipo].total_pago += valor;
        impostosPorTipo[tipo].quantidade_paga += 1;
      } else if (imposto.status === 'pendente' || imposto.status === 'atrasado' || imposto.status === 'estimado') {
        impostosPorTipo[tipo].total_pendente += valor;
        impostosPorTipo[tipo].quantidade_pendente += 1;
      }
    });

    // Calcular totais gerais
    const totalGeral = impostos.reduce((sum, i) => sum + parseFloat(i.valor || 0), 0);
    const totalPago = impostos.filter(i => i.status === 'pago').reduce((sum, i) => sum + parseFloat(i.valor || 0), 0);
    const totalPendente = impostos.filter(i => ['pendente', 'atrasado', 'estimado'].includes(i.status)).reduce((sum, i) => sum + parseFloat(i.valor || 0), 0);

    // Contar impostos vencidos
    const hoje = new Date().toISOString().split('T')[0];
    const vencidos = impostos.filter(i => i.data_vencimento && i.data_vencimento < hoje && i.status !== 'pago');
    const totalVencido = vencidos.reduce((sum, i) => sum + parseFloat(i.valor || 0), 0);

    // Calcular próximos vencimentos (próximos 30 dias)
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 30);
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];
    const proximosVencimentos = impostos.filter(i => 
      i.data_vencimento && 
      i.data_vencimento >= hoje && 
      i.data_vencimento <= dataLimiteStr && 
      i.status !== 'pago'
    );

    res.json({
      success: true,
      data: {
        competencia,
        mes: mesNum,
        ano: anoNum,
        impostos: impostos || [],
        impostos_por_tipo: Object.values(impostosPorTipo),
        is_estimativa: impostosCalculados.length > 0,
        mensagem_estimativa: impostosCalculados.length > 0 
          ? 'Valores estimados. Configure os impostos reais na tabela impostos_financeiros.' 
          : null
      },
      resumo: {
        total_geral: totalGeral,
        total_pago: totalPago,
        total_pendente: totalPendente,
        total_vencido: totalVencido,
        quantidade_total: impostos.length,
        quantidade_paga: impostos.filter(i => i.status === 'pago').length,
        quantidade_pendente: impostos.filter(i => ['pendente', 'atrasado', 'estimado'].includes(i.status)).length,
        quantidade_vencida: vencidos.length,
        percentual_pago: totalGeral > 0 ? ((totalPago / totalGeral) * 100).toFixed(2) : 0
      },
      alertas: {
        vencidos: {
          quantidade: vencidos.length,
          total: totalVencido,
          impostos: vencidos
        },
        proximos_vencimentos: {
          quantidade: proximosVencimentos.length,
          total: proximosVencimentos.reduce((sum, i) => sum + parseFloat(i.valor || 0), 0),
          impostos: proximosVencimentos
        }
      }
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de impostos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/relatorios-impostos/periodo:
 *   get:
 *     summary: Relatório de impostos por período (vários meses)
 *     tags: [Relatórios Financeiros]
 */
router.get('/periodo', authenticateToken, requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: data_inicio (YYYY-MM) e data_fim (YYYY-MM)'
      });
    }

    // Buscar todos os impostos no período
    const { data: impostos, error } = await supabaseAdmin
      .from('impostos_financeiros')
      .select('*')
      .gte('competencia', data_inicio)
      .lte('competencia', data_fim)
      .order('competencia', { ascending: false })
      .order('tipo', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar impostos',
        message: error.message
      });
    }

    // Agrupar por competência
    const impostosPorCompetencia = {};
    impostos?.forEach(imposto => {
      const comp = imposto.competencia;
      if (!impostosPorCompetencia[comp]) {
        impostosPorCompetencia[comp] = {
          competencia: comp,
          total: 0,
          total_pago: 0,
          total_pendente: 0,
          impostos: []
        };
      }

      const valor = parseFloat(imposto.valor || 0);
      impostosPorCompetencia[comp].total += valor;
      impostosPorCompetencia[comp].impostos.push(imposto);

      if (imposto.status === 'pago') {
        impostosPorCompetencia[comp].total_pago += valor;
      } else {
        impostosPorCompetencia[comp].total_pendente += valor;
      }
    });

    // Calcular totais
    const totalGeral = impostos?.reduce((sum, i) => sum + parseFloat(i.valor || 0), 0) || 0;
    const totalPago = impostos?.filter(i => i.status === 'pago').reduce((sum, i) => sum + parseFloat(i.valor || 0), 0) || 0;
    const totalPendente = totalGeral - totalPago;

    res.json({
      success: true,
      data: Object.values(impostosPorCompetencia),
      periodo: {
        data_inicio,
        data_fim
      },
      resumo: {
        total_geral: totalGeral,
        total_pago: totalPago,
        total_pendente: totalPendente,
        quantidade_total: impostos?.length || 0
      }
    });

  } catch (error) {
    console.error('Erro ao gerar relatório por período:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/relatorios-impostos/anual/{ano}:
 *   get:
 *     summary: Relatório anual consolidado de impostos
 *     tags: [Relatórios Financeiros]
 */
router.get('/anual/:ano', authenticateToken, requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    const { ano } = req.params;

    if (!ano || ano.length !== 4) {
      return res.status(400).json({
        success: false,
        error: 'Ano inválido. Use formato YYYY'
      });
    }

    // Buscar impostos do ano inteiro
    const { data: impostos, error } = await supabaseAdmin
      .from('impostos_financeiros')
      .select('*')
      .gte('competencia', `${ano}-01`)
      .lte('competencia', `${ano}-12`)
      .order('competencia', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar impostos',
        message: error.message
      });
    }

    // Agrupar por mês
    const impostosPorMes = Array.from({ length: 12 }, (_, i) => {
      const mes = String(i + 1).padStart(2, '0');
      const competencia = `${ano}-${mes}`;
      return {
        mes: i + 1,
        competencia,
        nome_mes: new Date(ano, i).toLocaleDateString('pt-BR', { month: 'long' }),
        total: 0,
        total_pago: 0,
        total_pendente: 0,
        impostos: []
      };
    });

    impostos?.forEach(imposto => {
      const mesIndex = parseInt(imposto.competencia.split('-')[1]) - 1;
      if (mesIndex >= 0 && mesIndex < 12) {
        const valor = parseFloat(imposto.valor || 0);
        impostosPorMes[mesIndex].total += valor;
        impostosPorMes[mesIndex].impostos.push(imposto);

        if (imposto.status === 'pago') {
          impostosPorMes[mesIndex].total_pago += valor;
        } else {
          impostosPorMes[mesIndex].total_pendente += valor;
        }
      }
    });

    // Agrupar por tipo de imposto
    const impostosPorTipo = {};
    impostos?.forEach(imposto => {
      const tipo = imposto.tipo?.toUpperCase() || 'OUTRO';
      if (!impostosPorTipo[tipo]) {
        impostosPorTipo[tipo] = {
          tipo,
          total_anual: 0,
          media_mensal: 0,
          meses: []
        };
      }

      impostosPorTipo[tipo].total_anual += parseFloat(imposto.valor || 0);
      impostosPorTipo[tipo].meses.push({
        competencia: imposto.competencia,
        valor: imposto.valor
      });
    });

    // Calcular média mensal por tipo
    Object.values(impostosPorTipo).forEach(tipo => {
      tipo.media_mensal = tipo.total_anual / 12;
    });

    // Totais
    const totalAnual = impostos?.reduce((sum, i) => sum + parseFloat(i.valor || 0), 0) || 0;
    const totalPago = impostos?.filter(i => i.status === 'pago').reduce((sum, i) => sum + parseFloat(i.valor || 0), 0) || 0;

    res.json({
      success: true,
      ano: parseInt(ano),
      data: {
        por_mes: impostosPorMes,
        por_tipo: Object.values(impostosPorTipo)
      },
      resumo: {
        total_anual: totalAnual,
        total_pago: totalPago,
        total_pendente: totalAnual - totalPago,
        media_mensal: totalAnual / 12,
        quantidade_total: impostos?.length || 0
      }
    });

  } catch (error) {
    console.error('Erro ao gerar relatório anual:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

export default router;

