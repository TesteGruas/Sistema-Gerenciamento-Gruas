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
  limite: Joi.number().integer().min(1).max(100).default(20)
})

const relatorioFinanceiroSchema = Joi.object({
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().required(),
  agrupar_por: Joi.string().valid('grua', 'obra', 'cliente', 'mes').default('grua'),
  incluir_projecao: Joi.boolean().default(false)
})

const relatorioManutencaoSchema = Joi.object({
  dias_antecedencia: Joi.number().integer().min(1).max(365).default(30),
  status_grua: Joi.string().valid('Todas', 'Disponível', 'Operacional', 'Manutenção', 'Vendida').default('Todas'),
  tipo_manutencao: Joi.string().valid('Todas', 'Preventiva', 'Corretiva', 'Preditiva').default('Todas')
})

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

/**
 * Calcular estatísticas de utilização de uma grua
 */
const calcularEstatisticasUtilizacao = async (gruaId, dataInicio, dataFim) => {
  // Buscar histórico de locações no período
  const { data: historico, error: historicoError } = await supabaseAdmin
    .from('historico_locacoes')
    .select('*')
    .eq('grua_id', gruaId)
    .gte('data_inicio', dataInicio)
    .lte('data_fim', dataFim)

  if (historicoError) {
    throw new Error(`Erro ao buscar histórico: ${historicoError.message}`)
  }

  // Calcular métricas
  const totalLocacoes = historico.length
  const diasTotalLocacao = historico.reduce((total, loc) => {
    if (loc.data_fim) {
      const inicio = new Date(loc.data_inicio)
      const fim = new Date(loc.data_fim)
      return total + Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24))
    }
    return total
  }, 0)

  const receitaTotal = historico.reduce((total, loc) => total + (loc.valor_locacao || 0), 0)
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

    const { data_inicio, data_fim, tipo_grua, ordenar_por, limite } = value

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

    // Limitar resultados
    const resultadosLimitados = relatorio.slice(0, limite)

    // Calcular totais gerais
    const totais = {
      total_gruas: gruas.length,
      gruas_analisadas: resultadosLimitados.length,
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
          limite
        },
        totais,
        relatorio: resultadosLimitados
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

    const { data_inicio, data_fim, agrupar_por, incluir_projecao } = value

    // Buscar dados financeiros
    let query = supabaseAdmin
      .from('historico_locacoes')
      .select(`
        *,
        grua:gruas(id, modelo, fabricante, tipo),
        obra:obras(id, nome, cliente_id, cliente:clientes(nome, cnpj))
      `)
      .gte('data_inicio', data_inicio)
      .lte('data_fim', data_fim)
      .not('valor_locacao', 'is', null)

    const { data: historico, error: historicoError } = await query

    if (historicoError) {
      return res.status(500).json({
        error: 'Erro ao buscar dados financeiros',
        message: historicoError.message
      })
    }

    // Agrupar dados conforme solicitado
    let relatorio = []
    const agrupamento = {}

    historico.forEach(item => {
      let chave = ''
      let nome = ''
      let detalhes = {}

      switch (agrupar_por) {
        case 'grua':
          chave = item.grua_id
          nome = `${item.grua?.modelo} - ${item.grua?.fabricante}`
          detalhes = {
            tipo: item.grua?.tipo,
            capacidade: item.grua?.capacidade
          }
          break
        case 'obra':
          chave = item.obra_id
          nome = item.obra?.nome
          detalhes = {
            cliente: item.obra?.cliente?.nome,
            cnpj: item.obra?.cliente?.cnpj
          }
          break
        case 'cliente':
          chave = item.obra?.cliente_id
          nome = item.obra?.cliente?.nome
          detalhes = {
            cnpj: item.obra?.cliente?.cnpj
          }
          break
        case 'mes':
          const data = new Date(item.data_inicio)
          chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
          nome = `${data.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`
          detalhes = {}
          break
      }

      if (!agrupamento[chave]) {
        agrupamento[chave] = {
          chave,
          nome,
          detalhes,
          total_receita: 0,
          total_locacoes: 0,
          dias_total_locacao: 0,
          valor_medio_locacao: 0,
          locacoes: []
        }
      }

      const diasLocacao = item.data_fim 
        ? Math.ceil((new Date(item.data_fim) - new Date(item.data_inicio)) / (1000 * 60 * 60 * 24))
        : 0

      agrupamento[chave].total_receita += item.valor_locacao || 0
      agrupamento[chave].total_locacoes += 1
      agrupamento[chave].dias_total_locacao += diasLocacao
      agrupamento[chave].locacoes.push(item)
    })

    // Calcular valores médios e ordenar
    relatorio = Object.values(agrupamento).map(item => {
      item.valor_medio_locacao = item.total_locacoes > 0 
        ? Math.round((item.total_receita / item.total_locacoes) * 100) / 100
        : 0
      return item
    }).sort((a, b) => b.total_receita - a.total_receita)

    // Calcular totais gerais
    const totais = {
      receita_total_periodo: relatorio.reduce((total, item) => total + item.total_receita, 0),
      total_locacoes: relatorio.reduce((total, item) => total + item.total_locacoes, 0),
      dias_total_locacao: relatorio.reduce((total, item) => total + item.dias_total_locacao, 0),
      valor_medio_geral: relatorio.length > 0 
        ? Math.round((relatorio.reduce((total, item) => total + item.total_receita, 0) / 
                     relatorio.reduce((total, item) => total + item.total_locacoes, 0)) * 100) / 100
        : 0
    }

    // Adicionar projeções se solicitado
    let projecoes = null
    if (incluir_projecao && agrupar_por === 'grua') {
      projecoes = await Promise.all(
        relatorio.slice(0, 10).map(async (item) => {
          const projecao = await calcularProjecaoFinanceira(item.chave, data_inicio, data_fim)
          return {
            grua_id: item.chave,
            grua_nome: item.nome,
            ...projecao
          }
        })
      )
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
        relatorio,
        projecoes
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
          gruas_ocupadas,
          gruas_disponiveis,
          taxa_utilizacao,
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

export default router
