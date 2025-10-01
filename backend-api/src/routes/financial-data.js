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

    // Calcular fluxo de caixa dos últimos 6 meses usando receitas e custos
    const fluxoCaixa = [];
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

    // Calcular totais
    const receberHoje = receitasHoje?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0;
    const pagarHoje = custosHoje?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0;
    const recebimentosAtraso = receitasAtraso?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0;
    const pagamentosAtraso = custosAtraso?.reduce((sum, item) => sum + parseFloat(item.valor || 0), 0) || 0;
    
    // Saldo atual simulado (pode ser implementado com contas bancárias depois)
    const saldoAtual = 50000; // Valor simulado

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

export default router;
