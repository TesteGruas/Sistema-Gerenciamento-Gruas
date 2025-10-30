import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import Joi from 'joi';

const router = express.Router();

// Schema de validação
const rentabilidadeSchema = Joi.object({
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().required(),
  grua_id: Joi.string().allow('', null)
});

/**
 * @swagger
 * /api/rentabilidade/gruas:
 *   get:
 *     summary: Análise de rentabilidade por grua
 *     tags: [Rentabilidade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: data_inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: data_fim
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: grua_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Análise de rentabilidade das gruas
 */
router.get('/gruas', authenticateToken, requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    // Validar parâmetros
    const { error, value } = rentabilidadeSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        details: error.details[0].message
      });
    }

    const { data_inicio, data_fim, grua_id } = value;

    // Buscar gruas
    let gruasQuery = supabaseAdmin
      .from('gruas')
      .select('id, name, modelo, fabricante, tipo, valor_real, status');

    if (grua_id) {
      gruasQuery = gruasQuery.eq('id', grua_id);
    }

    const { data: gruas, error: gruasError } = await gruasQuery;

    if (gruasError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar gruas',
        message: gruasError.message
      });
    }

    // Analisar rentabilidade de cada grua
    const analiseGruas = await Promise.all(gruas.map(async (grua) => {
      // Buscar receitas vinculadas diretamente à grua
      const { data: receitasGrua, error: receitasError } = await supabaseAdmin
        .from('receitas')
        .select('valor, data_receita, tipo, descricao')
        .eq('grua_id', grua.id)
        .gte('data_receita', data_inicio)
        .lte('data_receita', data_fim);

      // Buscar custos vinculados diretamente à grua
      const { data: custosGrua, error: custosError } = await supabaseAdmin
        .from('custos')
        .select('valor, data_custo, tipo, descricao')
        .eq('grua_id', grua.id)
        .gte('data_custo', data_inicio)
        .lte('data_custo', data_fim);

      // Buscar obras onde a grua está alocada no período
      const { data: gruaObras } = await supabaseAdmin
        .from('grua_obra')
        .select('obra_id')
        .eq('grua_id', grua.id)
        .or(`data_inicio_locacao.lte.${data_fim},data_fim_locacao.gte.${data_inicio},data_fim_locacao.is.null`);

      const obrasIds = gruaObras?.map(go => go.obra_id) || [];

      // Buscar custos das obras (como backup se não houver custos diretos)
      let custosObra = [];
      if (obrasIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('custos')
          .select('valor, data_custo, tipo, descricao')
          .in('obra_id', obrasIds)
          .is('grua_id', null) // Apenas custos não vinculados a grua específica
          .gte('data_custo', data_inicio)
          .lte('data_custo', data_fim);
        
        custosObra = data || [];
      }

      // Combinar receitas e custos
      const receitas = receitasGrua || [];
      const custos = [...(custosGrua || []), ...custosObra];

      // Buscar locações da grua
      const { data: locacoes, error: locacoesError } = await supabaseAdmin
        .from('locacoes')
        .select('id, valor_mensal, data_inicio, data_fim, status')
        .eq('equipamento_id', grua.id)
        .eq('tipo_equipamento', 'grua')
        .or(`and(data_inicio.gte.${data_inicio},data_inicio.lte.${data_fim}),and(data_fim.gte.${data_inicio},data_fim.lte.${data_fim})`);

      // Buscar medições (faturamento real das locações)
      const { data: medicoes, error: medicoesError } = await supabaseAdmin
        .from('medicoes')
        .select('valor_total, periodo')
        .in('locacao_id', locacoes?.map(l => l.id) || [])
        .eq('status', 'finalizada');

      // Calcular totais
      const totalReceitas = receitas?.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0) || 0;
      const totalCustos = custos?.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0) || 0;
      const totalLocacoes = locacoes?.reduce((sum, l) => sum + parseFloat(l.valor_mensal || 0), 0) || 0;
      const totalMedicoes = medicoes?.reduce((sum, m) => sum + parseFloat(m.valor_total || 0), 0) || 0;

      // Log de debug
      console.log(`[Rentabilidade] Processando grua ${grua.id}:`, {
        receitasEncontradas: receitas.length,
        custosEncontrados: custos.length,
        custosGruaDiretos: custosGrua?.length || 0,
        custosObra: custosObra.length,
        totalReceitas,
        totalCustos,
        obrasVinculadas: obrasIds.length
      });

      // Usar medições se disponíveis, senão usar valor mensal das locações
      const receitaReal = totalMedicoes > 0 ? totalMedicoes : totalLocacoes;

      // Calcular métricas
      const lucro = receitaReal - totalCustos;
      const margemLucro = receitaReal > 0 ? (lucro / receitaReal) * 100 : 0;
      const roi = totalCustos > 0 ? (lucro / totalCustos) * 100 : 0;
      const custoOperacional = totalCustos;
      const receitaOperacional = receitaReal;

      // Calcular payback (em meses) se houver valor real da grua
      let paybackMeses = null;
      if (grua.valor_real && lucro > 0) {
        paybackMeses = parseFloat(grua.valor_real) / lucro;
      }

      // Calcular dias de operação no período
      const diasPeriodo = Math.ceil((new Date(data_fim) - new Date(data_inicio)) / (1000 * 60 * 60 * 24));
      const diasOperacao = locacoes?.reduce((sum, l) => {
        const inicio = new Date(l.data_inicio);
        const fim = l.data_fim ? new Date(l.data_fim) : new Date(data_fim);
        const dias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24));
        return sum + dias;
      }, 0) || 0;

      const taxaUtilizacao = diasPeriodo > 0 ? (diasOperacao / diasPeriodo) * 100 : 0;

      return {
        grua_id: grua.id,
        grua_nome: grua.name,
        modelo: grua.modelo,
        fabricante: grua.fabricante,
        tipo: grua.tipo,
        status: grua.status,
        receitas: receitaReal,
        custos: totalCustos,
        lucro,
        margem_lucro: margemLucro.toFixed(2),
        roi: roi.toFixed(2),
        valor_investimento: parseFloat(grua.valor_real || 0),
        payback_meses: paybackMeses ? paybackMeses.toFixed(1) : null,
        taxa_utilizacao: taxaUtilizacao.toFixed(2),
        dias_operacao: diasOperacao,
        dias_periodo: diasPeriodo,
        quantidade_locacoes: locacoes?.length || 0,
        quantidade_medicoes: medicoes?.length || 0,
        detalhes: {
          receitas_detalhadas: receitas || [],
          custos_detalhados: custos || [],
          locacoes_detalhadas: locacoes || []
        }
      };
    }));

    // Ordenar por rentabilidade (lucro)
    analiseGruas.sort((a, b) => b.lucro - a.lucro);

    // Calcular totais gerais
    const totais = analiseGruas.reduce((acc, grua) => {
      acc.receitas_total += grua.receitas;
      acc.custos_total += grua.custos;
      acc.lucro_total += grua.lucro;
      return acc;
    }, { receitas_total: 0, custos_total: 0, lucro_total: 0 });

    totais.margem_media = totais.receitas_total > 0 
      ? ((totais.lucro_total / totais.receitas_total) * 100).toFixed(2) 
      : 0;
    totais.roi_medio = totais.custos_total > 0 
      ? ((totais.lucro_total / totais.custos_total) * 100).toFixed(2) 
      : 0;

    res.json({
      success: true,
      data: analiseGruas,
      totais,
      periodo: {
        data_inicio,
        data_fim,
        dias: Math.ceil((new Date(data_fim) - new Date(data_inicio)) / (1000 * 60 * 60 * 24))
      }
    });

  } catch (error) {
    console.error('Erro ao analisar rentabilidade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/rentabilidade/gruas/{id}:
 *   get:
 *     summary: Análise detalhada de rentabilidade de uma grua específica
 */
router.get('/gruas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data_inicio, data_fim } = req.query;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: data_inicio e data_fim'
      });
    }

    // Redirecionar para a rota principal com filtro
    req.query.grua_id = id;
    return router.handle(req, res);

  } catch (error) {
    console.error('Erro ao analisar rentabilidade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/rentabilidade/comparativo:
 *   get:
 *     summary: Comparativo de rentabilidade entre períodos
 */
router.get('/comparativo', async (req, res) => {
  try {
    const { 
      periodo1_inicio, 
      periodo1_fim, 
      periodo2_inicio, 
      periodo2_fim 
    } = req.query;

    if (!periodo1_inicio || !periodo1_fim || !periodo2_inicio || !periodo2_fim) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: periodo1_inicio, periodo1_fim, periodo2_inicio, periodo2_fim'
      });
    }

    // Buscar análise do período 1
    const periodo1 = await analisarPeriodo(periodo1_inicio, periodo1_fim);
    
    // Buscar análise do período 2
    const periodo2 = await analisarPeriodo(periodo2_inicio, periodo2_fim);

    // Calcular variações
    const comparativo = periodo1.map((grua1, index) => {
      const grua2 = periodo2.find(g => g.grua_id === grua1.grua_id);
      
      if (!grua2) return { ...grua1, comparativo: null };

      const variacaoReceitas = grua1.receitas > 0 
        ? ((grua2.receitas - grua1.receitas) / grua1.receitas * 100).toFixed(2)
        : 0;
      
      const variacaoCustos = grua1.custos > 0
        ? ((grua2.custos - grua1.custos) / grua1.custos * 100).toFixed(2)
        : 0;
      
      const variacaoLucro = grua1.lucro > 0
        ? ((grua2.lucro - grua1.lucro) / grua1.lucro * 100).toFixed(2)
        : 0;

      return {
        grua_id: grua1.grua_id,
        grua_nome: grua1.grua_nome,
        periodo1: {
          receitas: grua1.receitas,
          custos: grua1.custos,
          lucro: grua1.lucro,
          roi: grua1.roi
        },
        periodo2: {
          receitas: grua2.receitas,
          custos: grua2.custos,
          lucro: grua2.lucro,
          roi: grua2.roi
        },
        variacao: {
          receitas: `${variacaoReceitas}%`,
          custos: `${variacaoCustos}%`,
          lucro: `${variacaoLucro}%`
        }
      };
    });

    res.json({
      success: true,
      data: comparativo,
      periodos: {
        periodo1: { inicio: periodo1_inicio, fim: periodo1_fim },
        periodo2: { inicio: periodo2_inicio, fim: periodo2_fim }
      }
    });

  } catch (error) {
    console.error('Erro ao comparar rentabilidade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// Função auxiliar para analisar período
async function analisarPeriodo(data_inicio, data_fim) {
  const { data: gruas } = await supabaseAdmin
    .from('gruas')
    .select('id, name');

  return Promise.all(gruas.map(async (grua) => {
    // Buscar receitas vinculadas diretamente à grua
    const { data: receitasGrua } = await supabaseAdmin
      .from('receitas')
      .select('valor')
      .eq('grua_id', grua.id)
      .gte('data_receita', data_inicio)
      .lte('data_receita', data_fim);

    // Buscar custos vinculados diretamente à grua
    const { data: custosGrua } = await supabaseAdmin
      .from('custos')
      .select('valor')
      .eq('grua_id', grua.id)
      .gte('data_custo', data_inicio)
      .lte('data_custo', data_fim);

    // Buscar obras onde a grua está alocada no período
    const { data: gruaObras } = await supabaseAdmin
      .from('grua_obra')
      .select('obra_id')
      .eq('grua_id', grua.id)
      .or(`data_inicio_locacao.lte.${data_fim},data_fim_locacao.gte.${data_inicio},data_fim_locacao.is.null`);

    const obrasIds = gruaObras?.map(go => go.obra_id) || [];

    // Buscar custos das obras (como backup se não houver custos diretos)
    let custosObra = [];
    if (obrasIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('custos')
        .select('valor')
        .in('obra_id', obrasIds)
        .is('grua_id', null)
        .gte('data_custo', data_inicio)
        .lte('data_custo', data_fim);
      
      custosObra = data || [];
    }

    const receitas = receitasGrua || [];
    const custos = [...(custosGrua || []), ...custosObra];

    const totalReceitas = receitas?.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0) || 0;
    const totalCustos = custos?.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0) || 0;
    const lucro = totalReceitas - totalCustos;
    const roi = totalCustos > 0 ? (lucro / totalCustos) * 100 : 0;

    return {
      grua_id: grua.id,
      grua_nome: grua.name,
      receitas: totalReceitas,
      custos: totalCustos,
      lucro,
      roi: roi.toFixed(2)
    };
  }));
}

export default router;

