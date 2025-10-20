import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Função auxiliar para obter período do mês atual
const getPeriodoMesAtual = () => {
  const hoje = new Date();
  const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
  const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
  return { dataInicio, dataFim };
};

// Função auxiliar para calcular período com base em parâmetros
const calcularPeriodo = (periodo, mes, ano) => {
  const hoje = new Date();
  let dataInicio, dataFim;

  if (mes && ano) {
    // Período específico
    dataInicio = `${ano}-${mes.toString().padStart(2, '0')}-01`;
    const ultimoDia = new Date(ano, mes, 0).getDate();
    dataFim = `${ano}-${mes.toString().padStart(2, '0')}-${ultimoDia}`;
  } else if (periodo) {
    // Período baseado no tipo
    switch (periodo) {
      case 'semana':
        const diaSemana = hoje.getDay();
        const primeiroDia = new Date(hoje);
        primeiroDia.setDate(hoje.getDate() - diaSemana);
        dataInicio = primeiroDia.toISOString().split('T')[0];
        
        const ultimoDiaSemana = new Date(primeiroDia);
        ultimoDiaSemana.setDate(primeiroDia.getDate() + 6);
        dataFim = ultimoDiaSemana.toISOString().split('T')[0];
        break;
      case 'trimestre':
        dataInicio = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3, 1).toISOString().split('T')[0];
        dataFim = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3 + 3, 0).toISOString().split('T')[0];
        break;
      case 'ano':
        dataInicio = `${hoje.getFullYear()}-01-01`;
        dataFim = `${hoje.getFullYear()}-12-31`;
        break;
      case 'mes':
      default:
        const { dataInicio: inicio, dataFim: fim } = getPeriodoMesAtual();
        dataInicio = inicio;
        dataFim = fim;
        break;
    }
  } else {
    // Padrão: mês atual
    const { dataInicio: inicio, dataFim: fim } = getPeriodoMesAtual();
    dataInicio = inicio;
    dataFim = fim;
  }

  return { dataInicio, dataFim };
};

/**
 * @swagger
 * /api/ponto-eletronico/graficos/horas-trabalhadas:
 *   get:
 *     summary: Dados para gráfico de horas trabalhadas por período
 *     tags: [Ponto Eletrônico - Gráficos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [semana, mes, trimestre, ano]
 *           default: mes
 *         description: Período dos dados
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário (opcional)
 *       - in: query
 *         name: agrupamento
 *         schema:
 *           type: string
 *           enum: [dia, semana, mes]
 *           default: dia
 *         description: Tipo de agrupamento dos dados
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *         description: Mês específico (1-12)
 *       - in: query
 *         name: ano
 *         schema:
 *           type: integer
 *         description: Ano específico
 *     responses:
 *       200:
 *         description: Dados de horas trabalhadas
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/horas-trabalhadas', async (req, res) => {
  try {
    const { 
      periodo = 'mes',
      funcionario_id,
      agrupamento = 'dia',
      mes,
      ano
    } = req.query;

    const { dataInicio, dataFim } = calcularPeriodo(periodo, mes, ano);

    let query = supabaseAdmin
      .from('registros_ponto')
      .select('data, horas_trabalhadas, horas_extras, funcionario_id')
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: true });

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar dados de horas trabalhadas:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

    // Agrupar dados por dia
    const dadosAgrupados = {};
    (data || []).forEach(registro => {
      const chave = registro.data;
      if (!dadosAgrupados[chave]) {
        dadosAgrupados[chave] = {
          dia: new Date(registro.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }),
          data: registro.data,
          horas: 0,
          extras: 0,
          total_registros: 0
        };
      }
      dadosAgrupados[chave].horas += parseFloat(registro.horas_trabalhadas || 0);
      dadosAgrupados[chave].extras += parseFloat(registro.horas_extras || 0);
      dadosAgrupados[chave].total_registros += 1;
    });

    const resultado = Object.values(dadosAgrupados).map(d => ({
      dia: d.dia,
      data: d.data,
      horas: parseFloat(d.horas.toFixed(2)),
      extras: parseFloat(d.extras.toFixed(2)),
      total_registros: d.total_registros
    }));

    res.json({
      success: true,
      data: resultado,
      periodo: {
        inicio: dataInicio,
        fim: dataFim
      }
    });

  } catch (error) {
    console.error('Erro na rota de gráfico de horas trabalhadas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/graficos/frequencia:
 *   get:
 *     summary: Dados para gráfico de frequência (presenças, faltas, atrasos)
 *     tags: [Ponto Eletrônico - Gráficos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [mes, trimestre, ano]
 *           default: mes
 *         description: Período dos dados
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário (opcional)
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *         description: Mês específico (1-12)
 *       - in: query
 *         name: ano
 *         schema:
 *           type: integer
 *         description: Ano específico
 *     responses:
 *       200:
 *         description: Dados de frequência
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/frequencia', async (req, res) => {
  try {
    const { 
      periodo = 'mes',
      funcionario_id,
      mes,
      ano
    } = req.query;

    const { dataInicio, dataFim } = calcularPeriodo(periodo, mes, ano);

    let query = supabaseAdmin
      .from('registros_ponto')
      .select(`
        status,
        horas_extras,
        funcionario_id,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, departamento)
      `)
      .gte('data', dataInicio)
      .lte('data', dataFim);

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar dados de frequência:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

    // Agrupar por funcionário
    const dadosPorFuncionario = {};
    (data || []).forEach(registro => {
      const funcId = registro.funcionario_id;
      if (!dadosPorFuncionario[funcId]) {
        dadosPorFuncionario[funcId] = {
          funcionario: registro.funcionario?.nome || 'Desconhecido',
          cargo: registro.funcionario?.cargo || '',
          departamento: registro.funcionario?.departamento || '',
          presencas: 0,
          faltas: 0,
          atrasos: 0,
          horas_extras: 0
        };
      }

      // Contar por status
      if (registro.status === 'Completo' || registro.status === 'Aprovado') {
        dadosPorFuncionario[funcId].presencas += 1;
      } else if (registro.status === 'Falta') {
        dadosPorFuncionario[funcId].faltas += 1;
      } else if (registro.status === 'Atraso') {
        dadosPorFuncionario[funcId].atrasos += 1;
      }

      dadosPorFuncionario[funcId].horas_extras += parseFloat(registro.horas_extras || 0);
    });

    const resultado = Object.values(dadosPorFuncionario).map(d => ({
      ...d,
      horas_extras: parseFloat(d.horas_extras.toFixed(2))
    }));

    res.json({
      success: true,
      data: resultado,
      periodo: {
        inicio: dataInicio,
        fim: dataFim
      }
    });

  } catch (error) {
    console.error('Erro na rota de gráfico de frequência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/graficos/status:
 *   get:
 *     summary: Distribuição de status por funcionário/departamento/cargo
 *     tags: [Ponto Eletrônico - Gráficos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [mes, trimestre, ano]
 *           default: mes
 *         description: Período dos dados
 *       - in: query
 *         name: agrupamento
 *         schema:
 *           type: string
 *           enum: [funcionario, departamento, cargo]
 *           default: funcionario
 *         description: Tipo de agrupamento
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *         description: Mês específico (1-12)
 *       - in: query
 *         name: ano
 *         schema:
 *           type: integer
 *         description: Ano específico
 *     responses:
 *       200:
 *         description: Distribuição de status
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/status', async (req, res) => {
  try {
    const { 
      periodo = 'mes',
      agrupamento = 'funcionario',
      mes,
      ano
    } = req.query;

    const { dataInicio, dataFim } = calcularPeriodo(periodo, mes, ano);

    const { data, error } = await supabaseAdmin
      .from('registros_ponto')
      .select(`
        status,
        horas_trabalhadas,
        funcionario_id,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, departamento)
      `)
      .gte('data', dataInicio)
      .lte('data', dataFim);

    if (error) {
      console.error('Erro ao buscar dados de status:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

    // Agrupar conforme solicitado
    const dadosAgrupados = {};
    (data || []).forEach(registro => {
      let chave;
      let label;

      switch (agrupamento) {
        case 'departamento':
          chave = registro.funcionario?.departamento || 'Sem departamento';
          label = chave;
          break;
        case 'cargo':
          chave = registro.funcionario?.cargo || 'Sem cargo';
          label = chave;
          break;
        case 'funcionario':
        default:
          chave = registro.funcionario_id;
          label = registro.funcionario?.nome || 'Desconhecido';
          break;
      }

      if (!dadosAgrupados[chave]) {
        dadosAgrupados[chave] = {
          [agrupamento]: label,
          horas: 0,
          status: 'completo',
          departamento: registro.funcionario?.departamento || '',
          cargo: registro.funcionario?.cargo || '',
          total_registros: 0
        };
      }

      dadosAgrupados[chave].horas += parseFloat(registro.horas_trabalhadas || 0);
      dadosAgrupados[chave].total_registros += 1;
    });

    const resultado = Object.values(dadosAgrupados).map(d => ({
      ...d,
      horas: parseFloat(d.horas.toFixed(2))
    }));

    res.json({
      success: true,
      data: resultado,
      periodo: {
        inicio: dataInicio,
        fim: dataFim
      }
    });

  } catch (error) {
    console.error('Erro na rota de gráfico de status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/graficos/horas-extras:
 *   get:
 *     summary: Evolução de horas extras por período
 *     tags: [Ponto Eletrônico - Gráficos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [mes, trimestre, ano]
 *           default: mes
 *         description: Período dos dados
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário (opcional)
 *       - in: query
 *         name: agrupamento
 *         schema:
 *           type: string
 *           enum: [dia, semana, mes]
 *           default: dia
 *         description: Tipo de agrupamento
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *         description: Mês específico (1-12)
 *       - in: query
 *         name: ano
 *         schema:
 *           type: integer
 *         description: Ano específico
 *     responses:
 *       200:
 *         description: Evolução de horas extras
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/horas-extras', async (req, res) => {
  try {
    const { 
      periodo = 'mes',
      funcionario_id,
      agrupamento = 'dia',
      mes,
      ano
    } = req.query;

    const { dataInicio, dataFim } = calcularPeriodo(periodo, mes, ano);

    let query = supabaseAdmin
      .from('registros_ponto')
      .select('data, horas_extras, status, funcionario_id')
      .gt('horas_extras', 0)
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: true });

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar dados de horas extras:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

    // Agrupar por dia
    const dadosAgrupados = {};
    (data || []).forEach(registro => {
      const chave = registro.data;
      if (!dadosAgrupados[chave]) {
        dadosAgrupados[chave] = {
          dia: new Date(registro.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }),
          data: registro.data,
          horas_extras: 0,
          total_registros: 0,
          aprovadas: 0,
          pendentes: 0,
          rejeitadas: 0
        };
      }
      dadosAgrupados[chave].horas_extras += parseFloat(registro.horas_extras || 0);
      dadosAgrupados[chave].total_registros += 1;

      if (registro.status === 'Aprovado') {
        dadosAgrupados[chave].aprovadas += 1;
      } else if (registro.status === 'Pendente Aprovação') {
        dadosAgrupados[chave].pendentes += 1;
      } else if (registro.status === 'Rejeitado') {
        dadosAgrupados[chave].rejeitadas += 1;
      }
    });

    const resultado = Object.values(dadosAgrupados).map(d => ({
      dia: d.dia,
      data: d.data,
      horas_extras: parseFloat(d.horas_extras.toFixed(2)),
      total_registros: d.total_registros,
      aprovadas: d.aprovadas,
      pendentes: d.pendentes,
      rejeitadas: d.rejeitadas
    }));

    res.json({
      success: true,
      data: resultado,
      periodo: {
        inicio: dataInicio,
        fim: dataFim
      }
    });

  } catch (error) {
    console.error('Erro na rota de gráfico de horas extras:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/graficos/atrasos:
 *   get:
 *     summary: Análise de atrasos por período
 *     tags: [Ponto Eletrônico - Gráficos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [mes, trimestre, ano]
 *           default: mes
 *         description: Período dos dados
 *       - in: query
 *         name: funcionario_id
 *         schema:
 *           type: integer
 *         description: ID do funcionário (opcional)
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *         description: Mês específico (1-12)
 *       - in: query
 *         name: ano
 *         schema:
 *           type: integer
 *         description: Ano específico
 *     responses:
 *       200:
 *         description: Análise de atrasos
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/atrasos', async (req, res) => {
  try {
    const { 
      periodo = 'mes',
      funcionario_id,
      mes,
      ano
    } = req.query;

    const { dataInicio, dataFim } = calcularPeriodo(periodo, mes, ano);

    let query = supabaseAdmin
      .from('registros_ponto')
      .select(`
        data,
        entrada,
        status,
        funcionario_id,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, departamento)
      `)
      .eq('status', 'Atraso')
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: true });

    if (funcionario_id) {
      query = query.eq('funcionario_id', funcionario_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar dados de atrasos:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

    // Agrupar por funcionário
    const atrasosPorFuncionario = {};
    (data || []).forEach(registro => {
      const funcId = registro.funcionario_id;
      if (!atrasosPorFuncionario[funcId]) {
        atrasosPorFuncionario[funcId] = {
          funcionario: registro.funcionario?.nome || 'Desconhecido',
          cargo: registro.funcionario?.cargo || '',
          departamento: registro.funcionario?.departamento || '',
          total_atrasos: 0,
          datas: []
        };
      }
      atrasosPorFuncionario[funcId].total_atrasos += 1;
      atrasosPorFuncionario[funcId].datas.push({
        data: registro.data,
        hora_entrada: registro.entrada
      });
    });

    const resultado = Object.values(atrasosPorFuncionario);

    // Calcular estatísticas gerais
    const estatisticas = {
      total_atrasos: (data || []).length,
      funcionarios_com_atraso: resultado.length,
      media_atrasos_por_funcionario: resultado.length > 0 
        ? parseFloat((resultado.reduce((sum, f) => sum + f.total_atrasos, 0) / resultado.length).toFixed(2))
        : 0
    };

    res.json({
      success: true,
      data: resultado,
      estatisticas,
      periodo: {
        inicio: dataInicio,
        fim: dataFim
      }
    });

  } catch (error) {
    console.error('Erro na rota de gráfico de atrasos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/ponto-eletronico/graficos/dashboard:
 *   get:
 *     summary: Dashboard geral com todos os dados consolidados
 *     tags: [Ponto Eletrônico - Gráficos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [hoje, semana, mes, trimestre, ano]
 *           default: mes
 *         description: Período dos dados
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *         description: Mês específico (1-12)
 *       - in: query
 *         name: ano
 *         schema:
 *           type: integer
 *         description: Ano específico
 *     responses:
 *       200:
 *         description: Dashboard consolidado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { 
      periodo = 'mes',
      mes,
      ano
    } = req.query;

    let dataInicio, dataFim;

    if (periodo === 'hoje') {
      const hoje = new Date().toISOString().split('T')[0];
      dataInicio = hoje;
      dataFim = hoje;
    } else {
      const periodoCalc = calcularPeriodo(periodo, mes, ano);
      dataInicio = periodoCalc.dataInicio;
      dataFim = periodoCalc.dataFim;
    }

    // Buscar todos os registros do período
    const { data, error } = await supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, departamento)
      `)
      .gte('data', dataInicio)
      .lte('data', dataFim);

    if (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }

    const registros = data || [];

    // Calcular estatísticas gerais
    const totalRegistros = registros.length;
    const totalHorasTrabalhadas = registros.reduce((sum, r) => sum + parseFloat(r.horas_trabalhadas || 0), 0);
    const totalHorasExtras = registros.reduce((sum, r) => sum + parseFloat(r.horas_extras || 0), 0);
    
    const presencas = registros.filter(r => r.status === 'Completo' || r.status === 'Aprovado').length;
    const faltas = registros.filter(r => r.status === 'Falta').length;
    const atrasos = registros.filter(r => r.status === 'Atraso').length;
    const pendentesAprovacao = registros.filter(r => r.status === 'Pendente Aprovação').length;

    const funcionariosUnicos = new Set(registros.map(r => r.funcionario_id)).size;

    // Top 5 funcionários com mais horas extras
    const horasExtrasPorFuncionario = {};
    registros.forEach(r => {
      if (r.horas_extras > 0) {
        if (!horasExtrasPorFuncionario[r.funcionario_id]) {
          horasExtrasPorFuncionario[r.funcionario_id] = {
            nome: r.funcionario?.nome || 'Desconhecido',
            cargo: r.funcionario?.cargo || '',
            total_horas_extras: 0
          };
        }
        horasExtrasPorFuncionario[r.funcionario_id].total_horas_extras += parseFloat(r.horas_extras || 0);
      }
    });

    const topHorasExtras = Object.values(horasExtrasPorFuncionario)
      .sort((a, b) => b.total_horas_extras - a.total_horas_extras)
      .slice(0, 5)
      .map(f => ({
        ...f,
        total_horas_extras: parseFloat(f.total_horas_extras.toFixed(2))
      }));

    res.json({
      success: true,
      data: {
        estatisticas: {
          total_registros: totalRegistros,
          total_horas_trabalhadas: parseFloat(totalHorasTrabalhadas.toFixed(2)),
          total_horas_extras: parseFloat(totalHorasExtras.toFixed(2)),
          presencas,
          faltas,
          atrasos,
          pendentes_aprovacao: pendentesAprovacao,
          funcionarios_ativos: funcionariosUnicos,
          media_horas_por_registro: totalRegistros > 0 
            ? parseFloat((totalHorasTrabalhadas / totalRegistros).toFixed(2))
            : 0
        },
        distribuicao_status: {
          completos: presencas,
          faltas,
          atrasos,
          pendentes: pendentesAprovacao
        },
        top_horas_extras: topHorasExtras
      },
      periodo: {
        tipo: periodo,
        inicio: dataInicio,
        fim: dataFim
      }
    });

  } catch (error) {
    console.error('Erro na rota de dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;

