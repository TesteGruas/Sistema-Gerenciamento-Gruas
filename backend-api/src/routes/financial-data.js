import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /api/financial-data - Obter dados financeiros para o dashboard
router.get('/', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    
    // Buscar dados de vendas para hoje
    const { data: vendasHoje, error: vendasError } = await supabase
      .from('vendas')
      .select('valor_total, status')
      .eq('data_venda', hoje)
      .eq('status', 'confirmada');

    if (vendasError) throw vendasError;

    // Buscar dados de compras para hoje
    const { data: comprasHoje, error: comprasError } = await supabase
      .from('compras')
      .select('valor_total, status')
      .eq('data_pedido', hoje)
      .eq('status', 'aprovado');

    if (comprasError) throw comprasError;

    // Buscar vendas em atraso (pendentes há mais de 7 dias)
    const dataLimiteAtraso = new Date();
    dataLimiteAtraso.setDate(dataLimiteAtraso.getDate() - 7);
    
    const { data: vendasAtraso, error: vendasAtrasoError } = await supabase
      .from('vendas')
      .select('valor_total')
      .eq('status', 'pendente')
      .lt('data_venda', dataLimiteAtraso.toISOString().split('T')[0]);

    if (vendasAtrasoError) throw vendasAtrasoError;

    // Buscar compras em atraso
    const { data: comprasAtraso, error: comprasAtrasoError } = await supabase
      .from('compras')
      .select('valor_total')
      .eq('status', 'pendente')
      .lt('data_pedido', dataLimiteAtraso.toISOString().split('T')[0]);

    if (comprasAtrasoError) throw comprasAtrasoError;

    // Calcular saldo atual das contas bancárias
    const { data: contasBancarias, error: contasError } = await supabase
      .from('contas_bancarias')
      .select('saldo_atual')
      .eq('status', 'ativa');

    if (contasError) throw contasError;

    // Buscar transferências recentes
    const { data: transferencias, error: transferenciasError } = await supabase
      .from('transferencias_bancarias')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (transferenciasError) throw transferenciasError;

    // Calcular fluxo de caixa dos últimos 6 meses
    const fluxoCaixa = [];
    for (let i = 5; i >= 0; i--) {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = hoje.getMonth() - i;
      
      // Ajustar ano se o mês for negativo
      const anoAjustado = mes < 0 ? ano - 1 : ano;
      const mesAjustado = mes < 0 ? mes + 12 : mes;
      
      const mesString = `${anoAjustado}-${String(mesAjustado + 1).padStart(2, '0')}`;
      
      // Buscar entradas do mês
      const { data: entradas, error: entradasError } = await supabase
        .from('transferencias_bancarias')
        .select('valor')
        .eq('tipo', 'entrada')
        .gte('data', `${mesString}-01`)
        .lt('data', `${anoAjustado}-${String(mesAjustado + 2).padStart(2, '0')}-01`);

      if (entradasError) throw entradasError;

      // Buscar saídas do mês
      const { data: saidas, error: saidasError } = await supabase
        .from('transferencias_bancarias')
        .select('valor')
        .eq('tipo', 'saida')
        .gte('data', `${mesString}-01`)
        .lt('data', `${anoAjustado}-${String(mesAjustado + 2).padStart(2, '0')}-01`);

      if (saidasError) throw saidasError;

      const totalEntradas = entradas?.reduce((sum, item) => sum + parseFloat(item.valor), 0) || 0;
      const totalSaidas = saidas?.reduce((sum, item) => sum + parseFloat(item.valor), 0) || 0;

      fluxoCaixa.push({
        mes: new Date(anoAjustado, mesAjustado).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        entrada: totalEntradas,
        saida: totalSaidas
      });
    }

    // Calcular totais
    const receberHoje = vendasHoje?.reduce((sum, item) => sum + parseFloat(item.valor_total), 0) || 0;
    const pagarHoje = comprasHoje?.reduce((sum, item) => sum + parseFloat(item.valor_total), 0) || 0;
    const recebimentosAtraso = vendasAtraso?.reduce((sum, item) => sum + parseFloat(item.valor_total), 0) || 0;
    const pagamentosAtraso = comprasAtraso?.reduce((sum, item) => sum + parseFloat(item.valor_total), 0) || 0;
    const saldoAtual = contasBancarias?.reduce((sum, conta) => sum + parseFloat(conta.saldo_atual), 0) || 0;

    const financialData = {
      receberHoje,
      pagarHoje,
      recebimentosAtraso,
      pagamentosAtraso,
      saldoAtual,
      fluxoCaixa,
      transferencias: transferencias || []
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

export default router;
