import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

/**
 * @swagger
 * /api/financial-data:
 *   get:
 *     summary: Obter dados financeiros para o dashboard
 *     tags: [Financial Data]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados financeiros do dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     receberHoje:
 *                       type: number
 *                       description: Valor total a receber hoje
 *                     pagarHoje:
 *                       type: number
 *                       description: Valor total a pagar hoje
 *                     recebimentosAtraso:
 *                       type: number
 *                       description: Valor total de recebimentos em atraso
 *                     pagamentosAtraso:
 *                       type: number
 *                       description: Valor total de pagamentos em atraso
 *                     saldoAtual:
 *                       type: number
 *                       description: Saldo atual das contas bancárias
 *                     fluxoCaixa:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           mes:
 *                             type: string
 *                             description: Mês/ano formatado
 *                           entrada:
 *                             type: number
 *                             description: Total de entradas no mês
 *                           saida:
 *                             type: number
 *                             description: Total de saídas no mês
 *                     transferencias:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Transferências bancárias recentes
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query; // Padrão: últimos 6 meses
    const hoje = new Date().toISOString().split('T')[0];
    
    // Buscar receitas para hoje
    const { data: receitasHoje, error: receitasError } = await supabaseAdmin
      .from('receitas')
      .select('valor, status')
      .eq('data_receita', hoje)
      .eq('status', 'confirmada');

    if (receitasError) {
      console.warn('Erro ao buscar receitas:', receitasError);
    }

    // Buscar custos para hoje
    const { data: custosHoje, error: custosError } = await supabaseAdmin
      .from('custos')
      .select('valor, status')
      .eq('data_custo', hoje)
      .eq('status', 'confirmado');

    if (custosError) {
      console.warn('Erro ao buscar custos:', custosError);
    }

    // Buscar receitas em atraso (pendentes há mais de 7 dias)
    const dataLimiteAtraso = new Date();
    dataLimiteAtraso.setDate(dataLimiteAtraso.getDate() - 7);
    
    const { data: receitasAtraso, error: receitasAtrasoError } = await supabaseAdmin
      .from('receitas')
      .select('valor')
      .eq('status', 'pendente')
      .lt('data_receita', dataLimiteAtraso.toISOString().split('T')[0]);

    if (receitasAtrasoError) {
      console.warn('Erro ao buscar receitas em atraso:', receitasAtrasoError);
    }

    // Buscar custos em atraso
    const { data: custosAtraso, error: custosAtrasoError } = await supabaseAdmin
      .from('custos')
      .select('valor')
      .eq('status', 'pendente')
      .lt('data_custo', dataLimiteAtraso.toISOString().split('T')[0]);

    if (custosAtrasoError) {
      console.warn('Erro ao buscar custos em atraso:', custosAtrasoError);
    }

    // Calcular fluxo de caixa conforme o período solicitado
    let fluxoCaixa = [];
    
    if (periodo === 'hoje') {
      // Fluxo de caixa do dia atual (agrupado por hora)
      const { data: receitasHoje, error: receitasHojeError } = await supabaseAdmin
        .from('receitas')
        .select('valor, created_at')
        .eq('status', 'confirmada')
        .gte('data_receita', hoje)
        .lte('data_receita', hoje);

      const { data: custosHoje, error: custosHojeError } = await supabaseAdmin
        .from('custos')
        .select('valor, created_at')
        .eq('status', 'confirmado')
        .gte('data_custo', hoje)
        .lte('data_custo', hoje);

      // Agrupar por hora
      const horasFluxo = {};
      const horaAtual = new Date().getHours();
      
      for (let h = 0; h <= horaAtual; h++) {
        horasFluxo[h] = { hora: `${String(h).padStart(2, '0')}:00`, entrada: 0, saida: 0 };
      }

      receitasHoje?.forEach(item => {
        const hora = new Date(item.created_at).getHours();
        if (horasFluxo[hora]) {
          horasFluxo[hora].entrada += parseFloat(item.valor || 0);
        }
      });

      custosHoje?.forEach(item => {
        const hora = new Date(item.created_at).getHours();
        if (horasFluxo[hora]) {
          horasFluxo[hora].saida += parseFloat(item.valor || 0);
        }
      });

      fluxoCaixa = Object.values(horasFluxo);
      
    } else if (periodo === 'semana') {
      // Fluxo de caixa dos últimos 7 dias
      for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        const dataString = data.toISOString().split('T')[0];
        
        // Buscar receitas do dia
        const { data: receitasDia } = await supabaseAdmin
          .from('receitas')
          .select('valor')
          .eq('status', 'confirmada')
          .eq('data_receita', dataString);

        // Buscar custos do dia
        const { data: custosDia } = await supabaseAdmin
          .from('custos')
          .select('valor')
          .eq('status', 'confirmado')
          .eq('data_custo', dataString);

        const totalEntradas = receitasDia?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0;
        const totalSaidas = custosDia?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0;

        fluxoCaixa.push({
          dia: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          entrada: totalEntradas,
          saida: totalSaidas
        });
      }
      
    } else {
      // Fluxo de caixa dos últimos 6 meses (padrão)
      for (let i = 5; i >= 0; i--) {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = hoje.getMonth() - i;
        
        // Ajustar ano se o mês for negativo
        const anoAjustado = mes < 0 ? ano - 1 : ano;
        const mesAjustado = mes < 0 ? mes + 12 : mes;
        
        const mesString = `${anoAjustado}-${String(mesAjustado + 1).padStart(2, '0')}`;
        
        // Buscar receitas do mês (entradas)
        const { data: receitasMes, error: receitasMesError } = await supabaseAdmin
          .from('receitas')
          .select('valor')
          .eq('status', 'confirmada')
          .gte('data_receita', `${mesString}-01`)
          .lt('data_receita', `${anoAjustado}-${String(mesAjustado + 2).padStart(2, '0')}-01`);

        if (receitasMesError) {
          console.warn(`Erro ao buscar receitas do mês ${mesString}:`, receitasMesError);
        }

        // Buscar custos do mês (saídas)
        const { data: custosMes, error: custosMesError } = await supabaseAdmin
          .from('custos')
          .select('valor')
          .eq('status', 'confirmado')
          .gte('data_custo', `${mesString}-01`)
          .lt('data_custo', `${anoAjustado}-${String(mesAjustado + 2).padStart(2, '0')}-01`);

        if (custosMesError) {
          console.warn(`Erro ao buscar custos do mês ${mesString}:`, custosMesError);
        }

        const totalEntradas = receitasMes?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0;
        const totalSaidas = custosMes?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0;

        fluxoCaixa.push({
          mes: new Date(anoAjustado, mesAjustado).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          entrada: totalEntradas,
          saida: totalSaidas
        });
      }
    }

    // Calcular totais
    const receberHoje = receitasHoje?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0;
    const pagarHoje = custosHoje?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0;
    const recebimentosAtraso = receitasAtraso?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0;
    const pagamentosAtraso = custosAtraso?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0;
    
    // Buscar saldo real das contas bancárias ativas
    const { data: contasBancarias, error: contasError } = await supabaseAdmin
      .from('contas_bancarias')
      .select('saldo_atual')
      .eq('status', 'ativa');

    if (contasError) {
      console.warn('Erro ao buscar contas bancárias:', contasError);
    }

    // Calcular saldo consolidado de todas as contas ativas
    const saldoAtual = contasBancarias?.reduce((sum, conta) => 
      sum + parseFloat(conta.saldo_atual || 0), 0) || 0;

    const financialData = {
      receberHoje,
      pagarHoje,
      recebimentosAtraso,
      pagamentosAtraso,
      saldoAtual,
      fluxoCaixa,
      transferencias: [] // Array vazio por enquanto
    };

    res.json({
      success: true,
      data: financialData
    });
  } catch (error) {
    console.error('Erro ao obter dados financeiros:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/financial-data/resumo:
 *   get:
 *     summary: Dashboard financeiro consolidado
 *     tags: [Financial Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (opcional, padrão início do mês atual)
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (opcional, padrão hoje)
 *     responses:
 *       200:
 *         description: Resumo financeiro consolidado
 */
router.get('/resumo', async (req, res) => {
  try {
    let { data_inicio, data_fim } = req.query;

    // Se não informados, usar mês atual
    if (!data_inicio || !data_fim) {
      const hoje = new Date();
      data_fim = hoje.toISOString().split('T')[0];
      
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      data_inicio = inicioMes.toISOString().split('T')[0];
    }

    // ========== RECEITAS ==========
    
    // Vendas
    const { data: vendas } = await supabaseAdmin
      .from('vendas')
      .select('valor_total, status')
      .gte('data_venda', data_inicio)
      .lte('data_venda', data_fim)
      .in('status', ['confirmada', 'finalizada']);

    const totalVendas = vendas?.reduce((sum, v) => sum + parseFloat(v.valor_total || 0), 0) || 0;

    // Locações (usar medições se disponíveis)
    const { data: medicoes } = await supabaseAdmin
      .from('medicoes')
      .select('valor_total, status')
      .gte('data_medicao', data_inicio)
      .lte('data_medicao', data_fim)
      .eq('status', 'finalizada');

    const totalMedicoes = medicoes?.reduce((sum, m) => sum + parseFloat(m.valor_total || 0), 0) || 0;

    // Locações sem medições
    const { data: locacoes } = await supabaseAdmin
      .from('locacoes')
      .select('valor_mensal, status, data_inicio')
      .gte('data_inicio', data_inicio)
      .lte('data_inicio', data_fim)
      .in('status', ['ativa', 'finalizada']);

    const totalLocacoes = totalMedicoes > 0 ? totalMedicoes : (locacoes?.reduce((sum, l) => sum + parseFloat(l.valor_mensal || 0), 0) || 0);

    // Receitas (outros)
    const { data: receitas } = await supabaseAdmin
      .from('receitas')
      .select('valor, tipo, status')
      .gte('data_receita', data_inicio)
      .lte('data_receita', data_fim)
      .eq('status', 'confirmada');

    const totalReceitas = receitas?.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0) || 0;

    // Contas recebidas (pagas no período)
    const { data: contasRecebidasPagas } = await supabaseAdmin
      .from('contas_receber')
      .select('valor, status')
      .gte('data_pagamento', data_inicio)
      .lte('data_pagamento', data_fim)
      .eq('status', 'pago');

    const totalContasRecebidas = contasRecebidasPagas?.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0) || 0;

    const totalReceitasGeral = totalVendas + totalLocacoes + totalReceitas + totalContasRecebidas;

    // ========== DESPESAS ==========

    // Custos operacionais
    const { data: custos } = await supabaseAdmin
      .from('custos')
      .select('valor, tipo, status')
      .gte('data_custo', data_inicio)
      .lte('data_custo', data_fim)
      .eq('status', 'confirmado');

    const custosSalarios = custos?.filter(c => c.tipo === 'salario').reduce((sum, c) => sum + parseFloat(c.valor || 0), 0) || 0;
    const custosMateriais = custos?.filter(c => c.tipo === 'material').reduce((sum, c) => sum + parseFloat(c.valor || 0), 0) || 0;
    const custosServicos = custos?.filter(c => c.tipo === 'servico').reduce((sum, c) => sum + parseFloat(c.valor || 0), 0) || 0;
    const custosManutencao = custos?.filter(c => c.tipo === 'manutencao').reduce((sum, c) => sum + parseFloat(c.valor || 0), 0) || 0;
    const totalCustos = custosSalarios + custosMateriais + custosServicos + custosManutencao;

    // Contas pagas
    const { data: contasPagas } = await supabaseAdmin
      .from('contas_pagar')
      .select('valor, status')
      .gte('data_pagamento', data_inicio)
      .lte('data_pagamento', data_fim)
      .eq('status', 'pago');

    const totalContasPagas = contasPagas?.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0) || 0;

    // Impostos pagos
    const { data: impostosPagos } = await supabaseAdmin
      .from('impostos_financeiros')
      .select('valor, status')
      .gte('data_pagamento', data_inicio)
      .lte('data_pagamento', data_fim)
      .eq('status', 'pago');

    const totalImpostosPagos = impostosPagos?.reduce((sum, i) => sum + parseFloat(i.valor || 0), 0) || 0;

    // Compras
    const { data: compras } = await supabaseAdmin
      .from('compras')
      .select('valor_total, status')
      .gte('data_pedido', data_inicio)
      .lte('data_pedido', data_fim)
      .neq('status', 'cancelado');

    const totalCompras = compras?.reduce((sum, c) => sum + parseFloat(c.valor_total || 0), 0) || 0;

    const totalDespesasGeral = totalCustos + totalContasPagas + totalImpostosPagos + totalCompras;

    // ========== CONTAS A PAGAR/RECEBER ==========

    const hoje = new Date().toISOString().split('T')[0];

    // Contas a receber pendentes
    const { data: contasReceberPendentes } = await supabaseAdmin
      .from('contas_receber')
      .select('valor, status')
      .in('status', ['pendente', 'vencido']);

    const totalContasReceber = contasReceberPendentes?.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0) || 0;

    // Contas a pagar pendentes
    const { data: contasPagarPendentes } = await supabaseAdmin
      .from('contas_pagar')
      .select('valor, status')
      .in('status', ['pendente', 'vencido']);

    const totalContasPagar = contasPagarPendentes?.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0) || 0;

    // Impostos pendentes
    const { data: impostosPendentes } = await supabaseAdmin
      .from('impostos_financeiros')
      .select('valor, status')
      .in('status', ['pendente', 'atrasado']);

    const totalImpostosPendentes = impostosPendentes?.reduce((sum, i) => sum + parseFloat(i.valor || 0), 0) || 0;

    // ========== SALDO BANCÁRIO ==========

    const { data: contasBancarias } = await supabaseAdmin
      .from('contas_bancarias')
      .select('saldo_atual, status')
      .eq('status', 'ativa');

    const saldoBancarioAtual = contasBancarias?.reduce((sum, c) => sum + parseFloat(c.saldo_atual || 0), 0) || 0;

    // ========== CÁLCULOS ==========

    const lucroOperacional = totalReceitasGeral - totalDespesasGeral;
    const margemLucro = totalReceitasGeral > 0 ? ((lucroOperacional / totalReceitasGeral) * 100).toFixed(2) : 0;
    const roi = totalDespesasGeral > 0 ? ((lucroOperacional / totalDespesasGeral) * 100).toFixed(2) : 0;
    
    // Liquidez = Ativo Circulante / Passivo Circulante
    // Ativo = Saldo + Contas a Receber
    // Passivo = Contas a Pagar + Impostos
    const ativoCirculante = saldoBancarioAtual + totalContasReceber;
    const passivoCirculante = totalContasPagar + totalImpostosPendentes;
    const liquidez = passivoCirculante > 0 ? (ativoCirculante / passivoCirculante).toFixed(2) : 0;

    // Capital de giro = Ativo Circulante - Passivo Circulante
    const capitalGiro = ativoCirculante - passivoCirculante;

    res.json({
      success: true,
      periodo: {
        data_inicio,
        data_fim
      },
      resumo: {
        // Receitas
        receitas: {
          vendas: totalVendas,
          locacoes: totalLocacoes,
          servicos: totalReceitas,
          contas_recebidas: totalContasRecebidas,
          total: totalReceitasGeral
        },
        // Despesas
        despesas: {
          custos_operacionais: {
            salarios: custosSalarios,
            materiais: custosMateriais,
            servicos: custosServicos,
            manutencao: custosManutencao,
            total: totalCustos
          },
          contas_pagas: totalContasPagas,
          impostos_pagos: totalImpostosPagos,
          compras: totalCompras,
          total: totalDespesasGeral
        },
        // Resultado
        resultado: {
          lucro_operacional: lucroOperacional,
          margem_lucro_percentual: margemLucro,
          roi_percentual: roi
        },
        // Contas
        contas: {
          a_receber: totalContasReceber,
          a_pagar: totalContasPagar,
          impostos_pendentes: totalImpostosPendentes
        },
        // Indicadores
        indicadores: {
          saldo_bancario: saldoBancarioAtual,
          liquidez_corrente: liquidez,
          capital_giro: capitalGiro,
          ativo_circulante: ativoCirculante,
          passivo_circulante: passivoCirculante
        }
      }
    });

  } catch (error) {
    console.error('Erro ao gerar resumo financeiro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

export default router;
