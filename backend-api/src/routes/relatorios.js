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

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

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

export default router
