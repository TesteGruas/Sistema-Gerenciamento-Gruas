/**
 * Rotas para relatórios e analytics
 * Sistema de Gerenciamento de Gruas
 * 
 * Funcionalidades:
 * - Relatório de utilização de gruas
 * - Relatório financeiro por grua/obra
 * - Relatório de manutenções programadas
 * - Dashboard de status do parque
 * - Analytics avançados
 */

import express from 'express'
import Joi from 'joi'
import PDFDocument from 'pdfkit'
import XLSX from 'xlsx'
import { supabaseAdmin } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// Schemas de validação
const relatorioUtilizacaoSchema = Joi.object({
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().required(),
  tipo_grua: Joi.string().valid('Grua Torre', 'Grua Torre Auto Estável', 'Grua Móvel').optional(),
  ordenar_por: Joi.string().valid('utilizacao', 'receita', 'dias_locacao', 'obras_visitadas').default('utilizacao'),
  limite: Joi.number().integer().min(1).max(100).default(20),
  pagina: Joi.number().integer().min(1).default(1)
})

const relatorioFinanceiroSchema = Joi.object({
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().required(),
  agrupar_por: Joi.string().valid('grua', 'obra', 'cliente', 'mes').default('grua'),
  incluir_projecao: Joi.boolean().default(false),
  limite: Joi.number().integer().min(1).max(100).default(20),
  pagina: Joi.number().integer().min(1).default(1)
})

const relatorioManutencaoSchema = Joi.object({
  dias_antecedencia: Joi.number().integer().min(1).max(365).default(30),
  status_grua: Joi.string().valid('Todas', 'Disponível', 'Operacional', 'Manutenção', 'Vendida').default('Todas'),
  tipo_manutencao: Joi.string().valid('Todas', 'Preventiva', 'Corretiva', 'Preditiva').default('Todas')
})

const relatorioPerformanceGruasSchema = Joi.object({
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().required(),
  grua_id: Joi.string().optional(),
  obra_id: Joi.number().integer().optional(),
  agrupar_por: Joi.string().valid('grua', 'obra', 'mes').default('grua'),
  incluir_projecao: Joi.boolean().default(false),
  limite: Joi.number().integer().min(1).max(100).default(20),
  pagina: Joi.number().integer().min(1).default(1),
  ordenar_por: Joi.string().valid('taxa_utilizacao', 'receita_total', 'lucro_bruto', 'roi_percentual', 'horas_trabalhadas').default('taxa_utilizacao'),
  ordem: Joi.string().valid('asc', 'desc').default('desc'),
  comparar_periodo_anterior: Joi.boolean().default(false)
})

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

// Cache simples em memória para performance-gruas (5 minutos)
const performanceCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos em milissegundos

/**
 * Limpar cache expirado
 */
function limparCacheExpirado() {
  const agora = Date.now()
  for (const [key, value] of performanceCache.entries()) {
    if (value.expiresAt < agora) {
      performanceCache.delete(key)
    }
  }
}

/**
 * Gerar chave de cache baseada nos parâmetros
 */
function gerarChaveCache(params) {
  return JSON.stringify({
    data_inicio: params.data_inicio,
    data_fim: params.data_fim,
    grua_id: params.grua_id || null,
    obra_id: params.obra_id || null,
    agrupar_por: params.agrupar_por || 'grua'
  })
}

/**
 * Calcular horas trabalhadas por grua baseado em grua_obra
 */
async function calcularHorasTrabalhadas(gruaId, dataInicio, dataFim) {
  try {
    const dataInicioISO = new Date(dataInicio).toISOString().split('T')[0]
    const dataFimISO = new Date(dataFim).toISOString().split('T')[0]

    // Buscar locações da grua no período
    const { data: locacoes, error } = await supabaseAdmin
      .from('grua_obra')
      .select('data_inicio_locacao, data_fim_locacao, status')
      .eq('grua_id', gruaId)
      .in('status', ['Ativa', 'Concluída'])
      .or(`data_inicio_locacao.lte.${dataFimISO},data_fim_locacao.gte.${dataInicioISO}`)

    if (error) {
      console.error('Erro ao buscar locações para cálculo de horas:', error)
      return 0
    }

    let horasTrabalhadas = 0

    for (const locacao of locacoes || []) {
      const inicio = new Date(Math.max(
        new Date(locacao.data_inicio_locacao).getTime(),
        new Date(dataInicioISO).getTime()
      ))
      const fim = new Date(Math.min(
        locacao.data_fim_locacao ? new Date(locacao.data_fim_locacao).getTime() : Date.now(),
        new Date(dataFimISO).getTime()
      ))

      if (fim > inicio) {
        const dias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24))
        horasTrabalhadas += dias * 24 // Assumindo 24h por dia de operação
      }
    }

    return horasTrabalhadas
  } catch (error) {
    console.error('Erro ao calcular horas trabalhadas:', error)
    return 0
  }
}

/**
 * Calcular receitas por grua baseado em medicoes_mensais e grua_obra
 */
async function calcularReceitas(gruaId, dataInicio, dataFim) {
  try {
    const dataInicioISO = new Date(dataInicio).toISOString().split('T')[0]
    const dataFimISO = new Date(dataFim).toISOString().split('T')[0]

    let receitaTotal = 0

    // Buscar receitas de medições mensais (via orcamentos que têm grua_id)
    // Primeiro buscar orcamentos com grua_id
    const { data: orcamentos, error: orcamentosError } = await supabaseAdmin
      .from('orcamentos')
      .select('id')
      .eq('grua_id', gruaId)

    if (!orcamentosError && orcamentos && orcamentos.length > 0) {
      const orcamentoIds = orcamentos.map(o => o.id)
      
      // Buscar medições desses orçamentos
      const { data: medicoes, error: medicoesError } = await supabaseAdmin
        .from('medicoes_mensais')
        .select('valor_total')
        .in('orcamento_id', orcamentoIds)
        .gte('data_medicao', dataInicioISO)
        .lte('data_medicao', dataFimISO)
        .eq('status', 'finalizada')

      if (!medicoesError && medicoes) {
        receitaTotal += medicoes.reduce((sum, m) => sum + (parseFloat(m.valor_total) || 0), 0)
      }
    }

    // Buscar receitas de locações diretas (grua_obra)
    const { data: locacoes, error: locacoesError } = await supabaseAdmin
      .from('grua_obra')
      .select('valor_locacao_mensal, data_inicio_locacao, data_fim_locacao')
      .eq('grua_id', gruaId)
      .in('status', ['Ativa', 'Concluída'])

    if (!locacoesError && locacoes) {
      for (const locacao of locacoes) {
        const inicio = new Date(Math.max(
          new Date(locacao.data_inicio_locacao).getTime(),
          new Date(dataInicioISO).getTime()
        ))
        const fim = new Date(Math.min(
          locacao.data_fim_locacao ? new Date(locacao.data_fim_locacao).getTime() : Date.now(),
          new Date(dataFimISO).getTime()
        ))

        if (fim > inicio) {
          const dias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24))
          const meses = dias / 30
          receitaTotal += (parseFloat(locacao.valor_locacao_mensal) || 0) * meses
        }
      }
    }

    return receitaTotal
  } catch (error) {
    console.error('Erro ao calcular receitas:', error)
    return 0
  }
}

/**
 * Calcular custos por grua baseado em custos operacionais
 */
async function calcularCustos(gruaId, dataInicio, dataFim) {
  try {
    const dataInicioISO = new Date(dataInicio).toISOString().split('T')[0]
    const dataFimISO = new Date(dataFim).toISOString().split('T')[0]

    let custoTotal = 0

    // Nota: Tabela manutencoes não existe no banco atual
    // Custos de manutenção serão calculados via valor_manutencao mensal da grua

    // Buscar custos operacionais (via orcamento_custos_mensais de orcamentos com grua_id)
    // Primeiro buscar orcamentos com grua_id
    const { data: orcamentosCustos, error: orcamentosCustosError } = await supabaseAdmin
      .from('orcamentos')
      .select('id')
      .eq('grua_id', gruaId)

    if (!orcamentosCustosError && orcamentosCustos && orcamentosCustos.length > 0) {
      const orcamentoIds = orcamentosCustos.map(o => o.id)
      
      // Buscar custos mensais desses orçamentos
      const { data: custosMensais, error: custosError } = await supabaseAdmin
        .from('orcamento_custos_mensais')
        .select('valor_mensal')
        .in('orcamento_id', orcamentoIds)

      if (!custosError && custosMensais) {
        // Calcular meses no período
        const diasPeriodo = Math.ceil((new Date(dataFimISO) - new Date(dataInicioISO)) / (1000 * 60 * 60 * 24))
        const meses = diasPeriodo / 30
        custoTotal += custosMensais.reduce((sum, c) => sum + (parseFloat(c.valor_mensal) || 0), 0) * meses
      }
    }

    // Adicionar custos fixos da grua (valor_manutencao como custo mensal estimado)
    const { data: grua, error: gruaError } = await supabaseAdmin
      .from('gruas')
      .select('valor_manutencao, valor_operacao, valor_sinaleiro')
      .eq('id', gruaId)
      .single()

    if (!gruaError && grua) {
      const diasPeriodo = Math.ceil((new Date(dataFimISO) - new Date(dataInicioISO)) / (1000 * 60 * 60 * 24))
      const meses = diasPeriodo / 30
      
      // Custo de manutenção mensal estimado
      if (grua.valor_manutencao) {
        custoTotal += (parseFloat(grua.valor_manutencao) || 0) * meses
      }
      
      // Custo de operação mensal (se houver)
      if (grua.valor_operacao) {
        custoTotal += (parseFloat(grua.valor_operacao) || 0) * meses
      }
      
      // Custo de sinaleiro mensal (se houver)
      if (grua.valor_sinaleiro) {
        custoTotal += (parseFloat(grua.valor_sinaleiro) || 0) * meses
      }
    }

    return custoTotal
  } catch (error) {
    console.error('Erro ao calcular custos:', error)
    return 0
  }
}

/**
 * Calcular métricas de performance (taxa utilização, margem lucro, etc.)
 */
function calcularMetricas(horasTrabalhadas, horasDisponiveis, receitaTotal, custoTotal) {
  const taxaUtilizacao = horasDisponiveis > 0 
    ? Math.round((horasTrabalhadas / horasDisponiveis) * 100 * 100) / 100 
    : 0

  const lucroBruto = receitaTotal - custoTotal
  const margemLucro = receitaTotal > 0 
    ? Math.round((lucroBruto / receitaTotal) * 100 * 100) / 100 
    : 0

  const receitaPorHora = horasTrabalhadas > 0 
    ? Math.round((receitaTotal / horasTrabalhadas) * 100) / 100 
    : 0

  const custoPorHora = horasTrabalhadas > 0 
    ? Math.round((custoTotal / horasTrabalhadas) * 100) / 100 
    : 0

  const lucroPorHora = horasTrabalhadas > 0 
    ? Math.round((lucroBruto / horasTrabalhadas) * 100) / 100 
    : 0

  return {
    taxa_utilizacao: taxaUtilizacao,
    margem_lucro: margemLucro,
    receita_por_hora: receitaPorHora,
    custo_por_hora: custoPorHora,
    lucro_por_hora: lucroPorHora
  }
}

/**
 * Calcular ROI e tempo de retorno
 */
async function calcularROI(gruaId, receitaAcumulada, custoAcumulado) {
  try {
    // Buscar investimento inicial (valor_real da grua)
    const { data: grua, error } = await supabaseAdmin
      .from('gruas')
      .select('valor_real')
      .eq('id', gruaId)
      .single()

    if (error || !grua || !grua.valor_real) {
      return {
        investimento_inicial: 0,
        roi_percentual: 0,
        tempo_retorno_meses: null
      }
    }

    const investimentoInicial = parseFloat(grua.valor_real) || 0

    if (investimentoInicial === 0) {
      return {
        investimento_inicial: 0,
        roi_percentual: 0,
        tempo_retorno_meses: null
      }
    }

    const roiPercentual = Math.round(((receitaAcumulada - custoAcumulado) / investimentoInicial) * 100 * 100) / 100

    // Calcular tempo de retorno (meses)
    const lucroMensalMedio = receitaAcumulada > 0 
      ? (receitaAcumulada - custoAcumulado) / 12 // Assumindo 12 meses de histórico
      : 0

    const tempoRetornoMeses = lucroMensalMedio > 0 
      ? Math.round((investimentoInicial / lucroMensalMedio) * 100) / 100 
      : null

    return {
      investimento_inicial: investimentoInicial,
      receita_acumulada: receitaAcumulada,
      custo_acumulado: custoAcumulado,
      roi_percentual: roiPercentual,
      tempo_retorno_meses: tempoRetornoMeses
    }
  } catch (error) {
    console.error('Erro ao calcular ROI:', error)
    return {
      investimento_inicial: 0,
      roi_percentual: 0,
      tempo_retorno_meses: null
    }
  }
}

/**
 * Buscar obras visitadas por grua
 */
async function buscarObrasVisitadas(gruaId, dataInicio, dataFim) {
  try {
    const dataInicioISO = new Date(dataInicio).toISOString().split('T')[0]
    const dataFimISO = new Date(dataFim).toISOString().split('T')[0]

    const { data: locacoes, error } = await supabaseAdmin
      .from('grua_obra')
      .select(`
        obra_id,
        data_inicio_locacao,
        data_fim_locacao,
        valor_locacao_mensal,
        obras(id, nome)
      `)
      .eq('grua_id', gruaId)
      .in('status', ['Ativa', 'Concluída'])
      .or(`data_inicio_locacao.lte.${dataFimISO},data_fim_locacao.gte.${dataInicioISO}`)

    if (error) {
      console.error('Erro ao buscar obras visitadas:', error)
      return []
    }

    const obrasVisitadas = (locacoes || []).map(locacao => {
      const inicio = new Date(locacao.data_inicio_locacao)
      const fim = locacao.data_fim_locacao ? new Date(locacao.data_fim_locacao) : new Date()
      const diasPermanencia = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24))

      return {
        obra_id: locacao.obra_id,
        obra_nome: locacao.obras?.nome || `Obra ${locacao.obra_id}`,
        dias_permanencia: diasPermanencia,
        receita_gerada: parseFloat(locacao.valor_locacao_mensal) || 0
      }
    })

    return obrasVisitadas
  } catch (error) {
    console.error('Erro ao buscar obras visitadas:', error)
    return []
  }
}

/**
 * Calcular estatísticas de utilização de uma grua
 */
const calcularEstatisticasUtilizacao = async (gruaId, dataInicio, dataFim) => {
  // Garantir que as datas estão no formato correto
  const dataInicioISO = new Date(dataInicio).toISOString().split('T')[0]
  const dataFimISO = new Date(dataFim).toISOString().split('T')[0]
  
  // Buscar locações ativas da grua no período
  const { data: historico, error: historicoError } = await supabaseAdmin
    .from('grua_obra')
    .select(`
      *,
      obra:obras(id, nome, cliente_id, cliente:clientes(nome))
    `)
    .eq('grua_id', gruaId)
    .eq('status', 'Ativa')
    .gte('data_inicio_locacao', dataInicioISO)
    .lte('data_inicio_locacao', dataFimISO)

  if (historicoError) {
    throw new Error(`Erro ao buscar histórico: ${historicoError.message}`)
  }

  // Calcular métricas
  const totalLocacoes = historico.length
  const diasTotalLocacao = historico.reduce((total, loc) => {
    const inicio = new Date(loc.data_inicio_locacao)
    const fim = loc.data_fim_locacao ? new Date(loc.data_fim_locacao) : new Date() // Se não tem data fim, usa hoje
    return total + Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24))
  }, 0)

  const receitaTotal = historico.reduce((total, loc) => total + (parseFloat(loc.valor_locacao_mensal) || 0), 0)
  const obrasVisitadas = [...new Set(historico.map(loc => loc.obra_id))].length

  // Calcular taxa de utilização
  const diasPeriodo = Math.ceil((new Date(dataFim) - new Date(dataInicio)) / (1000 * 60 * 60 * 24))
  const taxaUtilizacao = diasPeriodo > 0 ? (diasTotalLocacao / diasPeriodo * 100) : 0

  return {
    total_locacoes: totalLocacoes,
    dias_total_locacao: diasTotalLocacao,
    receita_total: receitaTotal,
    obras_visitadas: obrasVisitadas,
    taxa_utilizacao: Math.round(taxaUtilizacao * 100) / 100,
    receita_media_dia: diasTotalLocacao > 0 ? Math.round((receitaTotal / diasTotalLocacao) * 100) / 100 : 0
  }
}

/**
 * Calcular projeção financeira
 */
const calcularProjecaoFinanceira = async (gruaId, dataInicio, dataFim) => {
  const estatisticas = await calcularEstatisticasUtilizacao(gruaId, dataInicio, dataFim)
  
  // Projeção para próximos 30 dias
  const projecao30Dias = {
    receita_estimada: Math.round(estatisticas.receita_media_dia * 30 * 100) / 100,
    dias_estimados_locacao: Math.round(estatisticas.taxa_utilizacao * 30 / 100),
    confiabilidade: estatisticas.total_locacoes > 5 ? 'Alta' : estatisticas.total_locacoes > 2 ? 'Média' : 'Baixa'
  }

  // Projeção para próximos 90 dias
  const projecao90Dias = {
    receita_estimada: Math.round(estatisticas.receita_media_dia * 90 * 100) / 100,
    dias_estimados_locacao: Math.round(estatisticas.taxa_utilizacao * 90 / 100),
    confiabilidade: estatisticas.total_locacoes > 10 ? 'Alta' : estatisticas.total_locacoes > 5 ? 'Média' : 'Baixa'
  }

  return {
    projecao_30_dias: projecao30Dias,
    projecao_90_dias: projecao90Dias,
    base_calculo: {
      receita_media_dia: estatisticas.receita_media_dia,
      taxa_utilizacao: estatisticas.taxa_utilizacao,
      total_locacoes_analisadas: estatisticas.total_locacoes
    }
  }
}

// =====================================================
// RELATÓRIO DE UTILIZAÇÃO
// =====================================================

/**
 * @swagger
 * /api/relatorios/utilizacao:
 *   get:
 *     summary: Relatório de utilização de gruas
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: data_inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do período
 *       - in: query
 *         name: data_fim
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do período
 *       - in: query
 *         name: tipo_grua
 *         schema:
 *           type: string
 *           enum: [Grua Torre, Grua Móvel, Guincho, Outros]
 *         description: Filtrar por tipo de grua
 *       - in: query
 *         name: ordenar_por
 *         schema:
 *           type: string
 *           enum: [utilizacao, receita, dias_locacao, obras_visitadas]
 *           default: utilizacao
 *         description: Critério de ordenação
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Número máximo de resultados
 *     responses:
 *       200:
 *         description: Relatório de utilização
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/utilizacao', async (req, res) => {
  try {
    // Validar parâmetros
    const { error, value } = relatorioUtilizacaoSchema.validate(req.query)
    if (error) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: error.details[0].message
      })
    }

    const { data_inicio, data_fim, tipo_grua, ordenar_por, limite, pagina } = value

    // Buscar todas as gruas
    let query = supabaseAdmin
      .from('gruas')
      .select('*')

    if (tipo_grua) {
      query = query.eq('tipo', tipo_grua)
    }

    const { data: gruas, error: gruasError } = await query

    if (gruasError) {
      return res.status(500).json({
        error: 'Erro ao buscar gruas',
        message: gruasError.message
      })
    }

    // Calcular estatísticas para cada grua
    const relatorio = await Promise.all(
      gruas.map(async (grua) => {
        const estatisticas = await calcularEstatisticasUtilizacao(grua.id, data_inicio, data_fim)
        
        return {
          grua: {
            id: grua.id,
            modelo: grua.modelo,
            fabricante: grua.fabricante,
            tipo: grua.tipo,
            capacidade: grua.capacidade,
            status: grua.status
          },
          ...estatisticas
        }
      })
    )

    // Ordenar resultados
    relatorio.sort((a, b) => {
      switch (ordenar_por) {
        case 'receita':
          return b.receita_total - a.receita_total
        case 'dias_locacao':
          return b.dias_total_locacao - a.dias_total_locacao
        case 'obras_visitadas':
          return b.obras_visitadas - a.obras_visitadas
        case 'utilizacao':
        default:
          return b.taxa_utilizacao - a.taxa_utilizacao
      }
    })

    // Calcular paginação
    const total = relatorio.length
    const totalPages = Math.ceil(total / limite)
    const offset = (pagina - 1) * limite
    const relatorioPaginado = relatorio.slice(offset, offset + limite)

    // Calcular totais gerais
    const totais = {
      total_gruas: gruas.length,
      gruas_analisadas: relatorioPaginado.length,
      receita_total_periodo: relatorio.reduce((total, item) => total + item.receita_total, 0),
      dias_total_locacao: relatorio.reduce((total, item) => total + item.dias_total_locacao, 0),
      taxa_utilizacao_media: relatorio.length > 0 
        ? Math.round((relatorio.reduce((total, item) => total + item.taxa_utilizacao, 0) / relatorio.length) * 100) / 100
        : 0
    }

    res.json({
      success: true,
      data: {
        periodo: {
          data_inicio,
          data_fim
        },
        filtros: {
          tipo_grua,
          ordenar_por,
          limite,
          pagina
        },
        totais,
        relatorio: relatorioPaginado,
        paginacao: {
          page: pagina,
          limit: limite,
          total: total,
          pages: totalPages
        }
      }
    })

  } catch (error) {
    console.error('Erro ao gerar relatório de utilização:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// RELATÓRIO FINANCEIRO
// =====================================================

/**
 * @swagger
 * /api/relatorios/financeiro:
 *   get:
 *     summary: Relatório financeiro por grua/obra
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: data_inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do período
 *       - in: query
 *         name: data_fim
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do período
 *       - in: query
 *         name: agrupar_por
 *         schema:
 *           type: string
 *           enum: [grua, obra, cliente, mes]
 *           default: grua
 *         description: Critério de agrupamento
 *       - in: query
 *         name: incluir_projecao
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir projeções futuras
 *     responses:
 *       200:
 *         description: Relatório financeiro
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/financeiro', async (req, res) => {
  try {
    // Validar parâmetros
    const { error, value } = relatorioFinanceiroSchema.validate(req.query)
    if (error) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: error.details[0].message
      })
    }

    const { data_inicio, data_fim, agrupar_por, incluir_projecao, limite, pagina } = value

    // Garantir que as datas estão no formato correto
    const dataInicioISO = new Date(data_inicio).toISOString().split('T')[0]
    const dataFimISO = new Date(data_fim).toISOString().split('T')[0]
    
    // Buscar dados de vendas
    const { data: vendas, error: vendasError } = await supabaseAdmin
      .from('vendas')
      .select(`
        *,
        cliente:clientes(id, nome, cnpj)
      `)
      .gte('data_venda', dataInicioISO)
      .lte('data_venda', dataFimISO)
      .eq('status', 'confirmada')

    if (vendasError) {
      return res.status(500).json({
        error: 'Erro ao buscar vendas',
        message: vendasError.message
      })
    }

    // Buscar dados de compras
    const { data: compras, error: comprasError } = await supabaseAdmin
      .from('compras')
      .select(`
        *,
        fornecedor:fornecedores(id, nome, cnpj)
      `)
      .gte('data_pedido', dataInicioISO)
      .lte('data_pedido', dataFimISO)
      .eq('status', 'recebido')

    if (comprasError) {
      return res.status(500).json({
        error: 'Erro ao buscar compras',
        message: comprasError.message
      })
    }

    // Buscar dados de orçamentos
    const { data: orcamentos, error: orcamentosError } = await supabaseAdmin
      .from('orcamentos')
      .select(`
        *,
        cliente:clientes(id, nome, cnpj)
      `)
      .gte('data_orcamento', dataInicioISO)
      .lte('data_orcamento', dataFimISO)

    if (orcamentosError) {
      return res.status(500).json({
        error: 'Erro ao buscar orçamentos',
        message: orcamentosError.message
      })
    }

    // Agrupar dados conforme solicitado
    let relatorio = []
    const agrupamento = {}

    // Processar vendas
    vendas.forEach(item => {
      let chave = ''
      let nome = ''
      let detalhes = {}

      switch (agrupar_por) {
        case 'cliente':
          chave = item.cliente_id
          nome = item.cliente?.nome || 'Cliente não informado'
          detalhes = {
            cnpj: item.cliente?.cnpj
          }
          break
        case 'obra':
          chave = item.obra_id || 'sem_obra'
          nome = item.obra_id ? `Obra ${item.obra_id}` : 'Sem obra'
          detalhes = {
            cliente: item.cliente?.nome
          }
          break
        case 'mes':
          const data = new Date(item.data_venda)
          chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
          nome = `${data.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`
          detalhes = {}
          break
        case 'tipo':
        default:
          chave = item.tipo_venda
          nome = item.tipo_venda
          detalhes = {
            cliente: item.cliente?.nome
          }
          break
      }

      if (!agrupamento[chave]) {
        agrupamento[chave] = {
          chave,
          nome,
          detalhes,
          total_receita: 0,
          total_vendas: 0,
          total_compras: 0,
          total_orcamentos: 0,
          lucro_bruto: 0,
          vendas: [],
          compras: [],
          orcamentos: []
        }
      }

      agrupamento[chave].total_receita += parseFloat(item.valor_total) || 0
      agrupamento[chave].total_vendas += 1
      agrupamento[chave].vendas.push(item)
    })

    // Processar compras
    compras.forEach(item => {
      let chave = ''
      let nome = ''
      let detalhes = {}

      switch (agrupar_por) {
        case 'cliente':
          // Para compras, agrupamos por fornecedor
          chave = `fornecedor_${item.fornecedor_id}`
          nome = item.fornecedor?.nome || 'Fornecedor não informado'
          detalhes = {
            cnpj: item.fornecedor?.cnpj
          }
          break
        case 'mes':
          const data = new Date(item.data_pedido)
          chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
          nome = `${data.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`
          detalhes = {}
          break
        case 'tipo':
        default:
          chave = 'compras'
          nome = 'Compras'
          detalhes = {
            fornecedor: item.fornecedor?.nome
          }
          break
      }

      if (!agrupamento[chave]) {
        agrupamento[chave] = {
          chave,
          nome,
          detalhes,
          total_receita: 0,
          total_vendas: 0,
          total_compras: 0,
          total_orcamentos: 0,
          lucro_bruto: 0,
          vendas: [],
          compras: [],
          orcamentos: []
        }
      }

      agrupamento[chave].total_compras += parseFloat(item.valor_total) || 0
      agrupamento[chave].compras.push(item)
    })

    // Processar orçamentos
    orcamentos.forEach(item => {
      let chave = ''
      let nome = ''
      let detalhes = {}

      switch (agrupar_por) {
        case 'cliente':
          chave = item.cliente_id
          nome = item.cliente?.nome || 'Cliente não informado'
          detalhes = {
            cnpj: item.cliente?.cnpj
          }
          break
        case 'obra':
          chave = item.obra_id || 'sem_obra'
          nome = item.obra_id ? `Obra ${item.obra_id}` : 'Sem obra'
          detalhes = {
            cliente: item.cliente?.nome
          }
          break
        case 'mes':
          const data = new Date(item.data_orcamento)
          chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
          nome = `${data.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`
          detalhes = {}
          break
        case 'tipo':
        default:
          chave = item.tipo_orcamento
          nome = item.tipo_orcamento
          detalhes = {
            cliente: item.cliente?.nome
          }
          break
      }

      if (!agrupamento[chave]) {
        agrupamento[chave] = {
          chave,
          nome,
          detalhes,
          total_receita: 0,
          total_vendas: 0,
          total_compras: 0,
          total_orcamentos: 0,
          lucro_bruto: 0,
          vendas: [],
          compras: [],
          orcamentos: []
        }
      }

      agrupamento[chave].total_orcamentos += parseFloat(item.valor_total) || 0
      agrupamento[chave].orcamentos.push(item)
    })

    // Calcular lucro bruto e ordenar
    relatorio = Object.values(agrupamento).map(item => {
      item.lucro_bruto = item.total_receita - item.total_compras
      return item
    }).sort((a, b) => b.total_receita - a.total_receita)

    // Aplicar paginação
    const total = relatorio.length
    const totalPages = Math.ceil(total / limite)
    const offset = (pagina - 1) * limite
    const relatorioPaginado = relatorio.slice(offset, offset + limite)

    // Calcular totais gerais
    const totais = {
      receita_total_periodo: relatorio.reduce((total, item) => total + item.total_receita, 0),
      total_vendas: relatorio.reduce((total, item) => total + item.total_vendas, 0),
      total_compras: relatorio.reduce((total, item) => total + item.total_compras, 0),
      total_orcamentos: relatorio.reduce((total, item) => total + item.total_orcamentos, 0),
      lucro_bruto_total: relatorio.reduce((total, item) => total + item.lucro_bruto, 0),
      margem_lucro: relatorio.reduce((total, item) => total + item.total_receita, 0) > 0 
        ? Math.round((relatorio.reduce((total, item) => total + item.lucro_bruto, 0) / 
                     relatorio.reduce((total, item) => total + item.total_receita, 0)) * 100 * 100) / 100
        : 0
    }

    res.json({
      success: true,
      data: {
        periodo: {
          data_inicio,
          data_fim
        },
        agrupamento: agrupar_por,
        totais,
        relatorio: relatorioPaginado,
        projecoes: null,
        paginacao: {
          page: pagina,
          limit: limite,
          total: total,
          pages: totalPages
        }
      }
    })

  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// RELATÓRIO DE FATURAMENTO
// =====================================================

/**
 * @swagger
 * /api/relatorios/faturamento:
 *   get:
 *     summary: Relatório de faturamento consolidado
 *     tags: [Relatórios]
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
 *         name: agrupar_por
 *         schema:
 *           type: string
 *           enum: [mes, tipo, cliente]
 *           default: mes
 *     responses:
 *       200:
 *         description: Relatório de faturamento
 */
router.get('/faturamento', async (req, res) => {
  try {
    const { data_inicio, data_fim, agrupar_por = 'mes' } = req.query;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: data_inicio e data_fim'
      });
    }

    // Função auxiliar para agrupar por mês
    const agruparPorMes = (items, campoData) => {
      const agrupado = {};
      
      items?.forEach(item => {
        const data = new Date(item[campoData]);
        const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
        const mesNome = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        if (!agrupado[mesAno]) {
          agrupado[mesAno] = {
            mes: mesNome,
            mes_ano: mesAno,
            total: 0,
            quantidade: 0,
            itens: []
          };
        }
        
        agrupado[mesAno].total += parseFloat(item.valor_total || 0);
        agrupado[mesAno].quantidade += 1;
        agrupado[mesAno].itens.push(item);
      });
      
      return Object.values(agrupado).sort((a, b) => a.mes_ano.localeCompare(b.mes_ano));
    };

    // Buscar vendas confirmadas
    const { data: vendas, error: vendasError } = await supabaseAdmin
      .from('vendas')
      .select(`
        *,
        cliente:clientes(id, nome, cnpj)
      `)
      .gte('data_venda', data_inicio)
      .lte('data_venda', data_fim)
      .eq('status', 'confirmada');

    if (vendasError) {
      console.error('Erro ao buscar vendas:', vendasError);
    }

    // Buscar locações ativas
    const { data: locacoes, error: locacoesError } = await supabaseAdmin
      .from('locacoes')
      .select(`
        *,
        cliente:clientes(id, nome, cnpj)
      `)
      .gte('data_inicio', data_inicio)
      .lte('data_inicio', data_fim);

    if (locacoesError) {
      console.error('Erro ao buscar locações:', locacoesError);
    }

    // Buscar medições do período (faturamento de locações)
    const { data: medicoes, error: medicoesError } = await supabaseAdmin
      .from('medicoes')
      .select(`
        *,
        locacao:locacoes(
          id,
          numero,
          cliente:clientes(id, nome, cnpj)
        )
      `)
      .eq('status', 'finalizada')
      .ilike('periodo', `%${data_inicio.substring(0, 7)}%`);

    if (medicoesError) {
      console.error('Erro ao buscar medições:', medicoesError);
    }

    // Calcular totais
    const totalVendas = vendas?.reduce((sum, v) => sum + parseFloat(v.valor_total || 0), 0) || 0;
    const totalLocacoes = locacoes?.reduce((sum, l) => sum + parseFloat(l.valor_mensal || 0), 0) || 0;
    const totalMedicoes = medicoes?.reduce((sum, m) => sum + parseFloat(m.valor_total || 0), 0) || 0;

    // Separar vendas por tipo
    const vendasEquipamentos = vendas?.filter(v => v.tipo_venda === 'equipamento') || [];
    const vendasServicos = vendas?.filter(v => v.tipo_venda === 'servico') || [];

    const totalEquipamentos = vendasEquipamentos.reduce((sum, v) => sum + parseFloat(v.valor_total || 0), 0);
    const totalServicos = vendasServicos.reduce((sum, v) => sum + parseFloat(v.valor_total || 0), 0);

    let relatorio = {};

    if (agrupar_por === 'mes') {
      // Agrupar por mês
      relatorio = {
        vendas: agruparPorMes(vendas, 'data_venda'),
        locacoes: agruparPorMes(medicoes, 'created_at'),
        total_periodo: {
          vendas: totalVendas,
          locacoes: totalMedicoes,
          total: totalVendas + totalMedicoes
        }
      };
    } else if (agrupar_por === 'tipo') {
      // Agrupar por tipo de receita
      relatorio = {
        tipos: [
          {
            tipo: 'Vendas de Equipamentos',
            total: totalEquipamentos,
            quantidade: vendasEquipamentos.length,
            percentual: totalVendas > 0 ? (totalEquipamentos / totalVendas * 100).toFixed(2) : 0
          },
          {
            tipo: 'Vendas de Serviços',
            total: totalServicos,
            quantidade: vendasServicos.length,
            percentual: totalVendas > 0 ? (totalServicos / totalVendas * 100).toFixed(2) : 0
          },
          {
            tipo: 'Locações de Gruas',
            total: totalMedicoes,
            quantidade: medicoes?.length || 0,
            percentual: (totalVendas + totalMedicoes) > 0 ? (totalMedicoes / (totalVendas + totalMedicoes) * 100).toFixed(2) : 0
          }
        ],
        total_geral: totalVendas + totalMedicoes
      };
    } else if (agrupar_por === 'cliente') {
      // Agrupar por cliente
      const clientesMap = {};
      
      vendas?.forEach(v => {
        const clienteId = v.cliente_id;
        const clienteNome = v.cliente?.nome || 'Cliente não identificado';
        
        if (!clientesMap[clienteId]) {
          clientesMap[clienteId] = {
            cliente_id: clienteId,
            cliente_nome: clienteNome,
            total: 0,
            vendas: 0,
            locacoes: 0
          };
        }
        
        clientesMap[clienteId].total += parseFloat(v.valor_total || 0);
        clientesMap[clienteId].vendas += parseFloat(v.valor_total || 0);
      });

      medicoes?.forEach(m => {
        const clienteId = m.locacao?.cliente?.id;
        const clienteNome = m.locacao?.cliente?.nome || 'Cliente não identificado';
        
        if (!clientesMap[clienteId]) {
          clientesMap[clienteId] = {
            cliente_id: clienteId,
            cliente_nome: clienteNome,
            total: 0,
            vendas: 0,
            locacoes: 0
          };
        }
        
        clientesMap[clienteId].total += parseFloat(m.valor_total || 0);
        clientesMap[clienteId].locacoes += parseFloat(m.valor_total || 0);
      });

      relatorio = {
        clientes: Object.values(clientesMap).sort((a, b) => b.total - a.total),
        total_geral: totalVendas + totalMedicoes
      };
    }

    res.json({
      success: true,
      data: relatorio,
      resumo: {
        periodo: `${data_inicio} a ${data_fim}`,
        total_vendas: totalVendas,
        total_locacoes: totalMedicoes,
        total_faturamento: totalVendas + totalMedicoes,
        quantidade_vendas: vendas?.length || 0,
        quantidade_locacoes: medicoes?.length || 0
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

// =====================================================
// RELATÓRIO DE MANUTENÇÃO
// =====================================================

/**
 * @swagger
 * /api/relatorios/manutencao:
 *   get:
 *     summary: Relatório de manutenções programadas
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias_antecedencia
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Dias de antecedência para alertas
 *       - in: query
 *         name: status_grua
 *         schema:
 *           type: string
 *           enum: [Todas, Disponível, Operacional, Manutenção, Vendida]
 *           default: Todas
 *         description: Filtrar por status da grua
 *       - in: query
 *         name: tipo_manutencao
 *         schema:
 *           type: string
 *           enum: [Todas, Preventiva, Corretiva, Preditiva]
 *           default: Todas
 *         description: Filtrar por tipo de manutenção
 *     responses:
 *       200:
 *         description: Relatório de manutenções
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/manutencao', async (req, res) => {
  try {
    // Validar parâmetros
    const { error, value } = relatorioManutencaoSchema.validate(req.query)
    if (error) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: error.details[0].message
      })
    }

    const { dias_antecedencia, status_grua, tipo_manutencao } = value

    // Calcular data limite
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() + dias_antecedencia)

    // Buscar gruas com manutenções próximas
    let query = supabaseAdmin
      .from('gruas')
      .select(`
        *,
        locacao_atual:grua_obra(
          obra:obras(id, nome, status)
        )
      `)
      .not('proxima_manutencao', 'is', null)
      .lte('proxima_manutencao', dataLimite.toISOString().split('T')[0])

    if (status_grua !== 'Todas') {
      query = query.eq('status', status_grua)
    }

    const { data: gruas, error: gruasError } = await query

    if (gruasError) {
      return res.status(500).json({
        error: 'Erro ao buscar gruas',
        message: gruasError.message
      })
    }

    // Processar dados de manutenção
    const relatorio = gruas.map(grua => {
      const proximaManutencao = new Date(grua.proxima_manutencao)
      const hoje = new Date()
      const diasRestantes = Math.ceil((proximaManutencao - hoje) / (1000 * 60 * 60 * 24))

      // Determinar prioridade
      let prioridade = 'Baixa'
      if (diasRestantes <= 7) {
        prioridade = 'Alta'
      } else if (diasRestantes <= 15) {
        prioridade = 'Média'
      }

      // Determinar status da grua
      const statusGrua = grua.locacao_atual && grua.locacao_atual.length > 0 
        ? 'Ocupada' 
        : 'Disponível'

      return {
        grua: {
          id: grua.id,
          modelo: grua.modelo,
          fabricante: grua.fabricante,
          tipo: grua.tipo,
          capacidade: grua.capacidade,
          status: grua.status,
          status_operacional: statusGrua,
          horas_operacao: grua.horas_operacao,
          ultima_manutencao: grua.ultima_manutencao
        },
        manutencao: {
          proxima_manutencao: grua.proxima_manutencao,
          dias_restantes: diasRestantes,
          prioridade,
          tipo_manutencao: 'Preventiva', // Assumindo preventiva por padrão
          valor_estimado: grua.valor_manutencao || 0
        },
        obra_atual: grua.locacao_atual && grua.locacao_atual.length > 0 
          ? grua.locacao_atual[0].obra 
          : null
      }
    })

    // Filtrar por tipo de manutenção se especificado
    const relatorioFiltrado = tipo_manutencao !== 'Todas' 
      ? relatorio.filter(item => item.manutencao.tipo_manutencao === tipo_manutencao)
      : relatorio

    // Ordenar por prioridade e dias restantes
    relatorioFiltrado.sort((a, b) => {
      const prioridadeOrder = { 'Alta': 3, 'Média': 2, 'Baixa': 1 }
      if (prioridadeOrder[a.manutencao.prioridade] !== prioridadeOrder[b.manutencao.prioridade]) {
        return prioridadeOrder[b.manutencao.prioridade] - prioridadeOrder[a.manutencao.prioridade]
      }
      return a.manutencao.dias_restantes - b.manutencao.dias_restantes
    })

    // Calcular estatísticas
    const estatisticas = {
      total_gruas_analisadas: relatorioFiltrado.length,
      manutencoes_alta_prioridade: relatorioFiltrado.filter(item => item.manutencao.prioridade === 'Alta').length,
      manutencoes_media_prioridade: relatorioFiltrado.filter(item => item.manutencao.prioridade === 'Média').length,
      manutencoes_baixa_prioridade: relatorioFiltrado.filter(item => item.manutencao.prioridade === 'Baixa').length,
      gruas_ocupadas: relatorioFiltrado.filter(item => item.grua.status_operacional === 'Ocupada').length,
      valor_total_estimado: relatorioFiltrado.reduce((total, item) => total + item.manutencao.valor_estimado, 0)
    }

    res.json({
      success: true,
      data: {
        filtros: {
          dias_antecedencia,
          status_grua,
          tipo_manutencao
        },
        estatisticas,
        relatorio: relatorioFiltrado
      }
    })

  } catch (error) {
    console.error('Erro ao gerar relatório de manutenção:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// DASHBOARD DE STATUS
// =====================================================

/**
 * @swagger
 * /api/relatorios/dashboard:
 *   get:
 *     summary: Dashboard de status do parque de gruas
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard com visão geral
 */
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 Gerando dashboard de status...')

    // Buscar todas as gruas com relacionamentos
    const { data: gruas, error: gruasError } = await supabaseAdmin
      .from('gruas')
      .select(`
        *,
        locacao_atual:grua_obra(
          obra:obras(id, nome, status, cliente:clientes(nome))
        )
      `)

    if (gruasError) {
      return res.status(500).json({
        error: 'Erro ao buscar gruas',
        message: gruasError.message
      })
    }

    // Calcular métricas gerais
    const totalGruas = gruas.length
    const gruasPorStatus = gruas.reduce((acc, grua) => {
      acc[grua.status] = (acc[grua.status] || 0) + 1
      return acc
    }, {})

    const gruasPorTipo = gruas.reduce((acc, grua) => {
      acc[grua.tipo] = (acc[grua.tipo] || 0) + 1
      return acc
    }, {})

    // Calcular status operacional
    const gruasOcupadas = gruas.filter(grua => 
      grua.locacao_atual && grua.locacao_atual.length > 0
    ).length

    const gruasDisponiveis = totalGruas - gruasOcupadas
    const taxaUtilizacao = totalGruas > 0 ? Math.round((gruasOcupadas / totalGruas) * 100) : 0

    // Calcular valor total do parque
    const valorTotalParque = gruas.reduce((total, grua) => total + (grua.valor_real || 0), 0)

    // Buscar receita do mês atual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    const fimMes = new Date()
    fimMes.setMonth(fimMes.getMonth() + 1, 0)

    const { data: receitaMes, error: receitaError } = await supabaseAdmin
      .from('historico_locacoes')
      .select('valor_locacao')
      .gte('data_inicio', inicioMes.toISOString().split('T')[0])
      .lte('data_fim', fimMes.toISOString().split('T')[0])
      .not('valor_locacao', 'is', null)

    const receitaMesAtual = receitaMes ? 
      receitaMes.reduce((total, item) => total + (item.valor_locacao || 0), 0) : 0

    // Buscar manutenções próximas
    const proximaSemana = new Date()
    proximaSemana.setDate(proximaSemana.getDate() + 7)

    const manutencoesProximas = gruas.filter(grua => 
      grua.proxima_manutencao && 
      new Date(grua.proxima_manutencao) <= proximaSemana
    ).length

    // Top 5 gruas mais utilizadas (últimos 30 dias)
    const ultimos30Dias = new Date()
    ultimos30Dias.setDate(ultimos30Dias.getDate() - 30)

    const topGruas = await Promise.all(
      gruas.slice(0, 5).map(async (grua) => {
        const estatisticas = await calcularEstatisticasUtilizacao(
          grua.id, 
          ultimos30Dias.toISOString().split('T')[0], 
          new Date().toISOString().split('T')[0]
        )
        return {
          grua: {
            id: grua.id,
            modelo: grua.modelo,
            fabricante: grua.fabricante
          },
          ...estatisticas
        }
      })
    )

    // Buscar últimas atividades do histórico
    const ultimasAtividades = []
    
    // Últimas locações de gruas
    const { data: ultimasLocacoes, error: locacoesError } = await supabaseAdmin
      .from('historico_locacoes')
      .select(`
        *,
        obra:obras(nome, cliente:clientes(nome)),
        funcionario:funcionarios(nome),
        grua:gruas(name, modelo)
      `)
      .order('data_inicio', { ascending: false })
      .limit(3)

    if (!locacoesError && ultimasLocacoes) {
      ultimasLocacoes.forEach(locacao => {
        ultimasAtividades.push({
          tipo: 'locacao',
          acao: `Grua ${locacao.grua?.name} ${locacao.tipo_operacao === 'Locacao' ? 'locada' : 'transferida'}`,
          detalhes: locacao.obra?.nome ? `para obra ${locacao.obra.nome}` : '',
          timestamp: locacao.data_inicio,
          usuario: locacao.funcionario?.nome || 'Sistema'
        })
      })
    }

    // Últimos registros de ponto
    const { data: ultimosPontos, error: pontosError } = await supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios(nome, cargo)
      `)
      .order('data', { ascending: false })
      .limit(2)

    if (!pontosError && ultimosPontos) {
      ultimosPontos.forEach(ponto => {
        ultimasAtividades.push({
          tipo: 'ponto',
          acao: `Registro de ponto - ${ponto.funcionario?.nome}`,
          detalhes: `${ponto.entrada || 'N/A'} - ${ponto.saida || 'N/A'}`,
          timestamp: ponto.data,
          usuario: ponto.funcionario?.nome || 'Sistema'
        })
      })
    }

    // Últimos logs de auditoria
    const { data: ultimosLogs, error: logsError } = await supabaseAdmin
      .from('logs_auditoria')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(3)

    if (!logsError && ultimosLogs) {
      ultimosLogs.forEach(log => {
        ultimasAtividades.push({
          tipo: 'auditoria',
          acao: `${log.acao} em ${log.entidade}`,
          detalhes: log.entidade_id ? `ID: ${log.entidade_id}` : '',
          timestamp: log.timestamp,
          usuario: log.usuario_id ? `Usuário ${log.usuario_id}` : 'Sistema'
        })
      })
    }

    // Ordenar por timestamp e pegar as 5 mais recentes
    const atividadesOrdenadas = ultimasAtividades
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)

    // Alertas e notificações
    const alertas = []
    
    if (manutencoesProximas > 0) {
      alertas.push({
        tipo: 'manutencao',
        prioridade: 'alta',
        mensagem: `${manutencoesProximas} grua(s) com manutenção próxima`,
        acao: 'Verificar cronograma de manutenção'
      })
    }

    if (taxaUtilizacao < 50) {
      alertas.push({
        tipo: 'utilizacao',
        prioridade: 'media',
        mensagem: `Taxa de utilização baixa: ${taxaUtilizacao}%`,
        acao: 'Revisar estratégia comercial'
      })
    }

    const gruasComProblemas = gruas.filter(grua => grua.status === 'Manutenção').length
    if (gruasComProblemas > 0) {
      alertas.push({
        tipo: 'status',
        prioridade: 'alta',
        mensagem: `${gruasComProblemas} grua(s) em manutenção`,
        acao: 'Acompanhar status das manutenções'
      })
    }

    res.json({
      success: true,
      data: {
        resumo_geral: {
          total_gruas: totalGruas,
          gruas_ocupadas: gruasOcupadas,
          gruas_disponiveis: gruasDisponiveis,
          taxa_utilizacao: taxaUtilizacao,
          valor_total_parque: valorTotalParque,
          receita_mes_atual: receitaMesAtual
        },
        distribuicao: {
          por_status: gruasPorStatus,
          por_tipo: gruasPorTipo
        },
        manutencao: {
          manutencoes_proximas: manutencoesProximas,
          proxima_semana: proximaSemana.toISOString().split('T')[0]
        },
        top_gruas: topGruas.sort((a, b) => b.taxa_utilizacao - a.taxa_utilizacao),
        alertas,
        ultimas_atividades: atividadesOrdenadas,
        ultima_atualizacao: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro ao gerar dashboard:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// RELATÓRIO DE PERFORMANCE DE GRUAS
// =====================================================

/**
 * @swagger
 * /api/relatorios/performance-gruas:
 *   get:
 *     summary: Relatório de performance de gruas
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: data_inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início do período
 *       - in: query
 *         name: data_fim
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim do período
 *       - in: query
 *         name: grua_id
 *         schema:
 *           type: string
 *         description: Filtrar por ID da grua
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID da obra
 *       - in: query
 *         name: agrupar_por
 *         schema:
 *           type: string
 *           enum: [grua, obra, mes]
 *           default: grua
 *         description: Critério de agrupamento
 *       - in: query
 *         name: incluir_projecao
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir projeções futuras
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Limite de resultados por página
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: ordenar_por
 *         schema:
 *           type: string
 *           enum: [taxa_utilizacao, receita_total, lucro_bruto, roi_percentual, horas_trabalhadas]
 *           default: taxa_utilizacao
 *         description: Campo para ordenação
 *       - in: query
 *         name: ordem
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordem de classificação
 *       - in: query
 *         name: comparar_periodo_anterior
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Comparar com período anterior
 *     responses:
 *       200:
 *         description: Relatório de performance de gruas
 *       400:
 *         description: Parâmetros inválidos
 */
router.get('/performance-gruas', async (req, res) => {
  try {
    // Limpar cache expirado
    limparCacheExpirado()

    // Validar parâmetros
    const { error, value } = relatorioPerformanceGruasSchema.validate(req.query)
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        details: error.details[0].message
      })
    }

    const {
      data_inicio,
      data_fim,
      grua_id,
      obra_id,
      agrupar_por,
      incluir_projecao,
      limite,
      pagina,
      ordenar_por,
      ordem,
      comparar_periodo_anterior
    } = value

    // Verificar cache
    const cacheKey = gerarChaveCache(value)
    const cached = performanceCache.get(cacheKey)
    
    if (cached && cached.expiresAt > Date.now()) {
      return res.json({
        success: true,
        data: cached.data,
        cache: {
          cached: true,
          expires_at: new Date(cached.expiresAt).toISOString()
        }
      })
    }

    // Calcular período em dias
    const diasPeriodo = Math.ceil((new Date(data_fim) - new Date(data_inicio)) / (1000 * 60 * 60 * 24))
    const horasDisponiveis = diasPeriodo * 24

    // Buscar gruas
    let queryGruas = supabaseAdmin
      .from('gruas')
      .select('id, name, modelo, fabricante, tipo, status, valor_real')

    if (grua_id) {
      queryGruas = queryGruas.eq('id', grua_id)
    }

    const { data: gruas, error: gruasError } = await queryGruas

    if (gruasError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar gruas',
        message: gruasError.message
      })
    }

    // Otimização: Buscar dados de todas as gruas de uma vez quando possível
    const gruaIds = (gruas || []).map(g => g.id)
    
    // Filtrar por obra se especificado (otimização: fazer uma query única)
    let gruasFiltradas = gruas || []
    if (obra_id && gruaIds.length > 0) {
      const { data: locacoesObra } = await supabaseAdmin
        .from('grua_obra')
        .select('grua_id')
        .in('grua_id', gruaIds)
        .eq('obra_id', obra_id)
        .in('status', ['Ativa', 'Concluída'])

      const gruasComObra = new Set((locacoesObra || []).map(l => l.grua_id))
      gruasFiltradas = gruas.filter(g => gruasComObra.has(g.id))
    }

    // Calcular performance para cada grua (paralelizado com Promise.all)
    const relatorio = await Promise.all(
      gruasFiltradas.map(async (grua) => {
        // Executar cálculos em paralelo para cada grua
        const [horasTrabalhadas, receitaTotal, custoTotal, obrasVisitadas] = await Promise.all([
          calcularHorasTrabalhadas(grua.id, data_inicio, data_fim),
          calcularReceitas(grua.id, data_inicio, data_fim),
          calcularCustos(grua.id, data_inicio, data_fim),
          buscarObrasVisitadas(grua.id, data_inicio, data_fim)
        ])

        // Calcular ROI e métricas com valores obtidos
        const roiFinal = await calcularROI(grua.id, receitaTotal, custoTotal)
        const metricas = calcularMetricas(horasTrabalhadas, horasDisponiveis, receitaTotal, custoTotal)

        return {
          grua: {
            id: grua.id,
            nome: grua.name || `Grua ${grua.id}`,
            modelo: grua.modelo,
            fabricante: grua.fabricante,
            tipo: grua.tipo,
            status: grua.status
          },
          metricas: {
            horas_trabalhadas: horasTrabalhadas,
            horas_disponiveis: horasDisponiveis,
            horas_ociosas: horasDisponiveis - horasTrabalhadas,
            taxa_utilizacao: metricas.taxa_utilizacao,
            dias_em_operacao: Math.ceil(horasTrabalhadas / 24),
            dias_total_periodo: diasPeriodo
          },
          financeiro: {
            receita_total: Math.round(receitaTotal * 100) / 100,
            custo_operacao: Math.round(custoTotal * 100) / 100,
            custo_manutencao: 0, // Será calculado separadamente se necessário
            custo_total: Math.round(custoTotal * 100) / 100,
            lucro_bruto: Math.round((receitaTotal - custoTotal) * 100) / 100,
            margem_lucro: metricas.margem_lucro,
            receita_por_hora: metricas.receita_por_hora,
            custo_por_hora: metricas.custo_por_hora,
            lucro_por_hora: metricas.lucro_por_hora
          },
          roi: {
            investimento_inicial: roiFinal.investimento_inicial,
            receita_acumulada: receitaTotal,
            custo_acumulado: custoTotal,
            roi_percentual: roiFinal.roi_percentual,
            tempo_retorno_meses: roiFinal.tempo_retorno_meses
          },
          obras: {
            total_obras: obrasVisitadas.length,
            obras_visitadas: obrasVisitadas
          }
        }
      })
    )

    // Filtrar nulls (gruas que não atendem filtro de obra)
    const relatorioFiltrado = relatorio.filter(item => item !== null)

    // Ordenar resultados
    relatorioFiltrado.sort((a, b) => {
      let valorA, valorB

      switch (ordenar_por) {
        case 'receita_total':
          valorA = a.financeiro.receita_total
          valorB = b.financeiro.receita_total
          break
        case 'lucro_bruto':
          valorA = a.financeiro.lucro_bruto
          valorB = b.financeiro.lucro_bruto
          break
        case 'roi_percentual':
          valorA = a.roi.roi_percentual
          valorB = b.roi.roi_percentual
          break
        case 'horas_trabalhadas':
          valorA = a.metricas.horas_trabalhadas
          valorB = b.metricas.horas_trabalhadas
          break
        case 'taxa_utilizacao':
        default:
          valorA = a.metricas.taxa_utilizacao
          valorB = b.metricas.taxa_utilizacao
          break
      }

      return ordem === 'asc' ? valorA - valorB : valorB - valorA
    })

    // Calcular totais e resumo geral
    const totalHorasTrabalhadas = relatorioFiltrado.reduce((sum, item) => sum + item.metricas.horas_trabalhadas, 0)
    const totalHorasDisponiveis = relatorioFiltrado.reduce((sum, item) => sum + item.metricas.horas_disponiveis, 0)
    const receitaTotal = relatorioFiltrado.reduce((sum, item) => sum + item.financeiro.receita_total, 0)
    const custoTotal = relatorioFiltrado.reduce((sum, item) => sum + item.financeiro.custo_total, 0)
    const lucroTotal = relatorioFiltrado.reduce((sum, item) => sum + item.financeiro.lucro_bruto, 0)
    const taxaUtilizacaoMedia = relatorioFiltrado.length > 0
      ? Math.round((relatorioFiltrado.reduce((sum, item) => sum + item.metricas.taxa_utilizacao, 0) / relatorioFiltrado.length) * 100) / 100
      : 0
    
    // Calcular ROI médio
    const investimentoTotal = relatorioFiltrado.reduce((sum, item) => sum + (item.roi.investimento_inicial || 0), 0)
    const roiMedio = investimentoTotal > 0
      ? Math.round(((receitaTotal - custoTotal) / investimentoTotal) * 100 * 100) / 100
      : 0

    const resumoGeral = {
      total_gruas: relatorioFiltrado.length,
      total_horas_trabalhadas: Math.round(totalHorasTrabalhadas * 100) / 100,
      total_horas_disponiveis: Math.round(totalHorasDisponiveis * 100) / 100,
      taxa_utilizacao_media: taxaUtilizacaoMedia,
      receita_total: Math.round(receitaTotal * 100) / 100,
      custo_total: Math.round(custoTotal * 100) / 100,
      lucro_total: Math.round(lucroTotal * 100) / 100,
      roi_medio: roiMedio
    }

    // Calcular dias úteis (aproximadamente 70% dos dias totais)
    const diasUteis = Math.floor(diasPeriodo * 0.7)

    // Aplicar paginação
    const total = relatorioFiltrado.length
    const totalPages = Math.ceil(total / limite)
    const offset = (pagina - 1) * limite
    const relatorioPaginado = relatorioFiltrado.slice(offset, offset + limite)

    // Preparar resposta no formato esperado pelo frontend
    const responseData = {
      periodo: {
        data_inicio,
        data_fim,
        dias_totais: diasPeriodo,
        dias_uteis: diasUteis
      },
      resumo_geral: resumoGeral,
      performance_por_grua: relatorioPaginado,
      paginacao: {
        pagina_atual: pagina,
        total_paginas: totalPages,
        total_registros: total,
        limite: limite
      }
    }

    // Salvar no cache
    performanceCache.set(cacheKey, {
      data: responseData,
      expiresAt: Date.now() + CACHE_TTL
    })

    res.json({
      success: true,
      data: responseData,
      cache: {
        cached: false,
        expires_at: new Date(Date.now() + CACHE_TTL).toISOString()
      }
    })

  } catch (error) {
    console.error('Erro ao gerar relatório de performance de gruas:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// =====================================================
// EXPORTAÇÕES DE PERFORMANCE DE GRUAS
// =====================================================

/**
 * @swagger
 * /api/relatorios/performance-gruas/export/pdf:
 *   get:
 *     summary: Exportar relatório de performance de gruas em PDF
 *     tags: [Relatórios]
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
 *       - in: query
 *         name: obra_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PDF gerado com sucesso
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/performance-gruas/export/pdf', authenticateToken, async (req, res) => {
  try {
    // Reutilizar lógica do endpoint principal para obter dados
    const { error, value } = relatorioPerformanceGruasSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        details: error.details[0].message
      });
    }

    // Para exportação, vamos usar uma abordagem mais simples:
    // Chamar diretamente a função de gerar relatório (mas isso requer refatoração)
    // Por enquanto, vamos usar uma requisição interna com fetch
    // Nota: Em produção, considere refatorar para extrair a lógica em uma função helper
    
    // Importar fetch se necessário (Node 18+ tem fetch nativo)
    const fetchModule = await import('node-fetch').catch(() => null);
    const fetch = fetchModule?.default || global.fetch || require('node-fetch');
    
    const baseUrl = req.protocol + '://' + req.get('host');
    const queryString = new URLSearchParams(req.query).toString();
    
    const internalResponse = await fetch(`${baseUrl}/api/relatorios/performance-gruas?${queryString}`, {
      headers: {
        'Authorization': req.headers.authorization || ''
      }
    });

    if (!internalResponse.ok) {
      throw new Error('Erro ao buscar dados para exportação');
    }

    const responseData = await internalResponse.json();
    const data = responseData.data;

    // PDFDocument já está importado no topo do arquivo
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=performance-gruas-${value.data_inicio}-${value.data_fim}.pdf`);

    doc.pipe(res);

    // Constante para posição inicial após cabeçalho (padding de 150px do topo em novas páginas)
    const Y_POS_APOS_CABECALHO = 150;
    
    // Função auxiliar para adicionar nova página
    const adicionarNovaPagina = () => {
      doc.addPage();
      // Retornar posição Y para começar o conteúdo (150px do topo)
      return Y_POS_APOS_CABECALHO;
    };

    // Cabeçalho
    doc.fontSize(20).font('Helvetica-Bold').text('Relatório de Performance de Gruas', 50, 50, { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Período: ${value.data_inicio} a ${value.data_fim}`, 50, 80, { align: 'center' });
    doc.moveTo(50, 100).lineTo(550, 100).stroke();

    let yPos = 120;

    // Resumo geral
    if (data.resumo_geral) {
      doc.fontSize(14).font('Helvetica-Bold').text('Resumo Geral', 50, yPos);
      yPos += 20;
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total de Gruas: ${data.resumo_geral.total_gruas}`, 50, yPos);
      yPos += 15;
      doc.text(`Taxa de Utilização Média: ${(data.resumo_geral.taxa_utilizacao_media || 0).toFixed(2)}%`, 50, yPos);
      yPos += 15;
      doc.text(`Receita Total: R$ ${(data.resumo_geral.receita_total || 0).toFixed(2)}`, 50, yPos);
      yPos += 15;
      doc.text(`Lucro Total: R$ ${(data.resumo_geral.lucro_total || 0).toFixed(2)}`, 50, yPos);
      yPos += 20;
    }

    // Dados por grua
    if (data.performance_por_grua && data.performance_por_grua.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Performance por Grua', 50, yPos);
      yPos += 20;

      data.performance_por_grua.forEach((item, index) => {
        if (yPos > 750) {
          yPos = adicionarNovaPagina();
        }

        // O endpoint retorna estrutura complexa
        const gruaNome = item.grua?.nome || item.grua?.id || item.grua_id || `Grua ${index + 1}`;
        const metricas = item.metricas || {};
        const financeiro = item.financeiro || {};
        const roi = item.roi || {};

        doc.fontSize(11).font('Helvetica-Bold').text(`${index + 1}. ${gruaNome}`, 50, yPos);
        yPos += 15;
        doc.fontSize(9).font('Helvetica');
        doc.text(`Taxa de Utilização: ${(metricas.taxa_utilizacao || 0).toFixed(2)}%`, 60, yPos);
        yPos += 12;
        doc.text(`Receita Total: R$ ${(financeiro.receita_total || 0).toFixed(2)}`, 60, yPos);
        yPos += 12;
        doc.text(`Lucro Bruto: R$ ${(financeiro.lucro_bruto || 0).toFixed(2)}`, 60, yPos);
        yPos += 15;
      });
    }

    doc.end();
  } catch (error) {
    console.error('Erro ao exportar PDF de performance de gruas:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar PDF',
        message: error.message
      });
    }
  }
});

/**
 * @swagger
 * /api/relatorios/performance-gruas/export/excel:
 *   get:
 *     summary: Exportar relatório de performance de gruas em Excel
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 */
router.get('/performance-gruas/export/excel', authenticateToken, async (req, res) => {
  try {
    const { error, value } = relatorioPerformanceGruasSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        details: error.details[0].message
      });
    }

    // Para exportação, vamos usar uma abordagem mais simples:
    // Chamar diretamente a função de gerar relatório (mas isso requer refatoração)
    // Por enquanto, vamos usar uma requisição interna com fetch
    // Nota: Em produção, considere refatorar para extrair a lógica em uma função helper
    
    // Importar fetch se necessário (Node 18+ tem fetch nativo)
    const fetchModule = await import('node-fetch').catch(() => null);
    const fetch = fetchModule?.default || global.fetch || require('node-fetch');
    
    const baseUrl = req.protocol + '://' + req.get('host');
    const queryString = new URLSearchParams(req.query).toString();
    
    const internalResponse = await fetch(`${baseUrl}/api/relatorios/performance-gruas?${queryString}`, {
      headers: {
        'Authorization': req.headers.authorization || ''
      }
    });

    if (!internalResponse.ok) {
      throw new Error('Erro ao buscar dados para exportação');
    }

    const responseData = await internalResponse.json();
    const data = responseData.data;

    // XLSX já está importado no topo do arquivo
    const workbook = XLSX.utils.book_new();

    // Criar aba de resumo
    if (data.resumo_geral) {
      const resumoData = [
        ['Métrica', 'Valor'],
        ['Total de Gruas', data.resumo_geral.total_gruas],
        ['Taxa de Utilização Média (%)', (data.resumo_geral.taxa_utilizacao_media || 0).toFixed(2)],
        ['Receita Total', data.resumo_geral.receita_total],
        ['Custo Total', data.resumo_geral.custo_total],
        ['Lucro Total', data.resumo_geral.lucro_total],
        ['ROI Médio (%)', (data.resumo_geral.roi_medio || 0).toFixed(2)]
      ];
      const resumoSheet = XLSX.utils.aoa_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo');
    }

    // Criar aba de performance por grua
    if (data.performance_por_grua && data.performance_por_grua.length > 0) {
      const performanceData = data.performance_por_grua.map(item => {
        // O endpoint retorna estrutura complexa
        const gruaNome = item.grua?.nome || item.grua?.id || item.grua_id || 'N/A';
        const metricas = item.metricas || {};
        const financeiro = item.financeiro || {};
        const roi = item.roi || {};
        
        return {
          'Grua': gruaNome,
          'Taxa Utilização (%)': (metricas.taxa_utilizacao || 0).toFixed(2),
          'Receita Total': financeiro.receita_total || 0,
          'Custo Total': financeiro.custo_total || 0,
          'Lucro Bruto': financeiro.lucro_bruto || 0,
          'ROI (%)': (roi.roi_percentual || 0).toFixed(2),
          'Horas Trabalhadas': metricas.horas_trabalhadas || 0
        };
      });
      const performanceSheet = XLSX.utils.json_to_sheet(performanceData);
      XLSX.utils.book_append_sheet(workbook, performanceSheet, 'Performance por Grua');
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=performance-gruas-${value.data_inicio}-${value.data_fim}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Erro ao exportar Excel de performance de gruas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar Excel',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/relatorios/performance-gruas/export/csv:
 *   get:
 *     summary: Exportar relatório de performance de gruas em CSV
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 */
router.get('/performance-gruas/export/csv', authenticateToken, async (req, res) => {
  try {
    const { error, value } = relatorioPerformanceGruasSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        details: error.details[0].message
      });
    }

    // Para exportação, vamos usar uma abordagem mais simples:
    // Chamar diretamente a função de gerar relatório (mas isso requer refatoração)
    // Por enquanto, vamos usar uma requisição interna com fetch
    // Nota: Em produção, considere refatorar para extrair a lógica em uma função helper
    
    // Importar fetch se necessário (Node 18+ tem fetch nativo)
    const fetchModule = await import('node-fetch').catch(() => null);
    const fetch = fetchModule?.default || global.fetch || require('node-fetch');
    
    const baseUrl = req.protocol + '://' + req.get('host');
    const queryString = new URLSearchParams(req.query).toString();
    
    const internalResponse = await fetch(`${baseUrl}/api/relatorios/performance-gruas?${queryString}`, {
      headers: {
        'Authorization': req.headers.authorization || ''
      }
    });

    if (!internalResponse.ok) {
      throw new Error('Erro ao buscar dados para exportação');
    }

    const responseData = await internalResponse.json();
    const data = responseData.data;

    // Gerar CSV
    const headers = ['Grua', 'Taxa Utilização (%)', 'Receita Total', 'Custo Total', 'Lucro Bruto', 'ROI (%)', 'Horas Trabalhadas'];
    const rows = data.performance_por_grua?.map(item => [
      item.nome_grua || item.grua_id,
      (item.taxa_utilizacao || 0).toFixed(2),
      item.receita_total || 0,
      item.custo_total || 0,
      item.lucro_bruto || 0,
      (item.roi_percentual || 0).toFixed(2),
      item.horas_trabalhadas || 0
    ]) || [];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=performance-gruas-${value.data_inicio}-${value.data_fim}.csv`);
    res.send('\ufeff' + csvContent); // BOM para Excel
  } catch (error) {
    console.error('Erro ao exportar CSV de performance de gruas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar CSV',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/relatorios/dashboard/evolucao-mensal:
 *   get:
 *     summary: Obter dados de evolução mensal para o dashboard
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: meses
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Número de meses para retornar (padrão 6)
 *     responses:
 *       200:
 *         description: Dados de evolução mensal
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/dashboard/evolucao-mensal', async (req, res) => {
  try {
    const meses = parseInt(req.query.meses) || 6
    const hoje = new Date()
    const evolucaoMensal = []

    // Preparar todas as datas dos meses
    const mesesData = []
    for (let i = meses - 1; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const mesFim = new Date(data.getFullYear(), data.getMonth() + 1, 0)
      const mesFimStr = mesFim.toISOString().split('T')[0]
      const mesAno = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      
      mesesData.push({
        data,
        mesFimStr,
        mesAno
      })
    }

    // Processar todos os meses em paralelo
    const resultados = await Promise.all(
      mesesData.map(async ({ data, mesFimStr, mesAno }) => {
        // Executar as 3 queries em paralelo para cada mês
        const [obrasResult, clientesResult, gruasResult] = await Promise.all([
          supabaseAdmin
            .from('obras')
            .select('*', { count: 'exact', head: true })
            .lte('created_at', mesFimStr),
          supabaseAdmin
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .lte('created_at', mesFimStr),
          supabaseAdmin
            .from('gruas')
            .select('*', { count: 'exact', head: true })
            .lte('created_at', mesFimStr)
        ])

        return {
          mes: mesAno,
          mes_numero: data.getMonth() + 1,
          ano: data.getFullYear(),
          obras: obrasResult.count || 0,
          clientes: clientesResult.count || 0,
          gruas: gruasResult.count || 0,
          errors: {
            obras: obrasResult.error,
            clientes: clientesResult.error,
            gruas: gruasResult.error
          }
        }
      })
    )

    // Filtrar resultados com erros e construir resposta
    resultados.forEach(resultado => {
      const hasErrors = Object.values(resultado.errors).some(err => err !== null)
      if (!hasErrors) {
        evolucaoMensal.push({
          mes: resultado.mes,
          mes_numero: resultado.mes_numero,
          ano: resultado.ano,
          obras: resultado.obras,
          clientes: resultado.clientes,
          gruas: resultado.gruas
        })
      }
    })

    res.json({
      success: true,
      data: evolucaoMensal
    })
  } catch (error) {
    console.error('Erro ao buscar evolução mensal:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

export default router
