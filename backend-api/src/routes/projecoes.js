import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/projecoes/fluxo-caixa:
 *   get:
 *     summary: Projeções de fluxo de caixa baseadas em histórico
 *     tags: [Projeções]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: meses_projecao
 *         schema:
 *           type: integer
 *           default: 3
 *           minimum: 1
 *           maximum: 12
 */
router.get('/fluxo-caixa', authenticateToken, requirePermission('financeiro:visualizar'), async (req, res) => {
  try {
    const { meses_projecao = 3 } = req.query;
    const meses = parseInt(meses_projecao);

    if (meses < 1 || meses > 12) {
      return res.status(400).json({
        success: false,
        error: 'meses_projecao deve estar entre 1 e 12'
      });
    }

    // Buscar histórico dos últimos 12 meses
    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - 12);
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];
    const hoje = new Date().toISOString().split('T')[0];

    // Buscar receitas dos últimos 12 meses
    const { data: receitas, error: receitasError } = await supabaseAdmin
      .from('receitas')
      .select('valor, data_receita')
      .eq('status', 'confirmada')
      .gte('data_receita', dataLimiteStr)
      .lte('data_receita', hoje);

    if (receitasError) {
      console.error('Erro ao buscar receitas:', receitasError);
    }

    // Buscar custos dos últimos 12 meses
    const { data: custos, error: custosError } = await supabaseAdmin
      .from('custos')
      .select('valor, data_custo')
      .eq('status', 'confirmado')
      .gte('data_custo', dataLimiteStr)
      .lte('data_custo', hoje);

    if (custosError) {
      console.error('Erro ao buscar custos:', custosError);
    }

    // Agrupar por mês
    const historico = {};
    
    for (let i = 11; i >= 0; i--) {
      const data = new Date();
      data.setMonth(data.getMonth() - i);
      const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      historico[mesAno] = {
        mes: data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        mes_ano: mesAno,
        entradas: 0,
        saidas: 0,
        saldo: 0
      };
    }

    // Calcular entradas
    receitas?.forEach(r => {
      const data = new Date(r.data_receita);
      const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      if (historico[mesAno]) {
        historico[mesAno].entradas += parseFloat(r.valor || 0);
      }
    });

    // Calcular saídas
    custos?.forEach(c => {
      const data = new Date(c.data_custo);
      const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      if (historico[mesAno]) {
        historico[mesAno].saidas += parseFloat(c.valor || 0);
      }
    });

    // Calcular saldo de cada mês
    Object.keys(historico).forEach(mesAno => {
      historico[mesAno].saldo = historico[mesAno].entradas - historico[mesAno].saidas;
    });

    const historicoArray = Object.values(historico);

    // Calcular médias e tendências
    const mediaEntradas = calcularMedia(historicoArray, 'entradas');
    const mediaSaidas = calcularMedia(historicoArray, 'saidas');
    const crescimentoEntradas = calcularTendencia(historicoArray, 'entradas');
    const crescimentoSaidas = calcularTendencia(historicoArray, 'saidas');

    // Gerar projeções
    const projecoes = [];
    for (let i = 1; i <= meses; i++) {
      const dataProjecao = new Date();
      dataProjecao.setMonth(dataProjecao.getMonth() + i);
      
      // Aplicar crescimento exponencial
      const projecaoEntradas = mediaEntradas * Math.pow(1 + crescimentoEntradas, i);
      const projecaoSaidas = mediaSaidas * Math.pow(1 + crescimentoSaidas, i);
      
      projecoes.push({
        mes: dataProjecao.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        mes_ano: `${dataProjecao.getFullYear()}-${String(dataProjecao.getMonth() + 1).padStart(2, '0')}`,
        entradas_projetadas: Math.max(0, projecaoEntradas),
        saidas_projetadas: Math.max(0, projecaoSaidas),
        saldo_projetado: projecaoEntradas - projecaoSaidas,
        confianca: calcularConfianca(historicoArray, i)
      });
    }

    res.json({
      success: true,
      historico: historicoArray,
      projecoes,
      analise: {
        media_entradas: mediaEntradas.toFixed(2),
        media_saidas: mediaSaidas.toFixed(2),
        crescimento_entradas: `${(crescimentoEntradas * 100).toFixed(2)}%`,
        crescimento_saidas: `${(crescimentoSaidas * 100).toFixed(2)}%`,
        saldo_medio: (mediaEntradas - mediaSaidas).toFixed(2)
      }
    });

  } catch (error) {
    console.error('Erro ao gerar projeções:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/projecoes/receitas:
 *   get:
 *     summary: Projeções de receitas por categoria
 */
router.get('/receitas', async (req, res) => {
  try {
    const { meses_projecao = 3 } = req.query;
    const meses = parseInt(meses_projecao);

    // Buscar histórico de receitas por tipo
    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - 12);
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];
    const hoje = new Date().toISOString().split('T')[0];

    const { data: receitas, error: receitasError } = await supabaseAdmin
      .from('receitas')
      .select('valor, data_receita, tipo')
      .eq('status', 'confirmada')
      .gte('data_receita', dataLimiteStr)
      .lte('data_receita', hoje);

    if (receitasError) {
      console.error('Erro ao buscar receitas:', receitasError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar receitas'
      });
    }

    // Agrupar por tipo
    const porTipo = {};
    receitas?.forEach(r => {
      const tipo = r.tipo || 'outros';
      if (!porTipo[tipo]) {
        porTipo[tipo] = [];
      }
      porTipo[tipo].push(parseFloat(r.valor || 0));
    });

    // Gerar projeções por tipo
    const projecoesPorTipo = {};
    Object.keys(porTipo).forEach(tipo => {
      const media = porTipo[tipo].reduce((sum, v) => sum + v, 0) / porTipo[tipo].length;
      const crescimento = calcularTendenciaArray(porTipo[tipo]);
      
      projecoesPorTipo[tipo] = [];
      for (let i = 1; i <= meses; i++) {
        const projecao = media * Math.pow(1 + crescimento, i);
        projecoesPorTipo[tipo].push({
          mes: i,
          valor_projetado: Math.max(0, projecao)
        });
      }
    });

    res.json({
      success: true,
      projecoes: projecoesPorTipo,
      historico: porTipo
    });

  } catch (error) {
    console.error('Erro ao gerar projeções de receitas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function calcularMedia(dados, campo) {
  if (!dados || dados.length === 0) return 0;
  const soma = dados.reduce((sum, item) => sum + (item[campo] || 0), 0);
  return soma / dados.length;
}

function calcularTendencia(dados, campo) {
  if (!dados || dados.length < 2) return 0;
  
  // Regressão linear simples
  const n = dados.length;
  let somaX = 0;
  let somaY = 0;
  let somaXY = 0;
  let somaX2 = 0;
  
  dados.forEach((item, index) => {
    const x = index;
    const y = item[campo] || 0;
    somaX += x;
    somaY += y;
    somaXY += x * y;
    somaX2 += x * x;
  });
  
  // Cálculo da inclinação (slope)
  const denominador = (n * somaX2) - (somaX * somaX);
  if (denominador === 0) return 0;
  
  const slope = ((n * somaXY) - (somaX * somaY)) / denominador;
  
  // Converter inclinação em taxa de crescimento
  const mediaY = somaY / n;
  const crescimento = mediaY !== 0 ? slope / mediaY : 0;
  
  return crescimento;
}

function calcularTendenciaArray(valores) {
  if (!valores || valores.length < 2) return 0;
  
  const n = valores.length;
  let somaX = 0;
  let somaY = 0;
  let somaXY = 0;
  let somaX2 = 0;
  
  valores.forEach((valor, index) => {
    const x = index;
    const y = valor;
    somaX += x;
    somaY += y;
    somaXY += x * y;
    somaX2 += x * x;
  });
  
  const denominador = (n * somaX2) - (somaX * somaX);
  if (denominador === 0) return 0;
  
  const slope = ((n * somaXY) - (somaX * somaY)) / denominador;
  const mediaY = somaY / n;
  
  return mediaY !== 0 ? slope / mediaY : 0;
}

function calcularConfianca(historico, mesProjecao) {
  if (!historico || historico.length < 6) return 50;
  
  // Calcular variância dos dados históricos
  const valores = historico.map(h => h.saldo);
  const media = valores.reduce((sum, v) => sum + v, 0) / valores.length;
  const variancia = valores.reduce((sum, v) => sum + Math.pow(v - media, 2), 0) / valores.length;
  const desvioPadrao = Math.sqrt(variancia);
  
  // Coeficiente de variação (CV)
  const cv = media !== 0 ? (desvioPadrao / Math.abs(media)) * 100 : 100;
  
  // Confiança baseada no CV e distância da projeção
  let confianca = 100 - cv;
  
  // Reduzir confiança quanto mais longe for a projeção
  confianca = confianca * (1 - (mesProjecao * 0.1));
  
  // Limitar entre 10% e 95%
  confianca = Math.max(10, Math.min(95, confianca));
  
  return confianca.toFixed(1);
}

export default router;

