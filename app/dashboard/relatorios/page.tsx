"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  BarChart3, 
  Download, 
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  PieChart,
  FileText,
  Clock,
  Filter,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Wrench,
  Building2,
  DollarSign,
  Users,
  Loader2
} from "lucide-react"
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { apiRelatorios, RelatorioUtilizacao, RelatorioFinanceiro, RelatorioManutencao, DashboardRelatorios } from "@/lib/api-relatorios"
import { performanceGruasApi, type PerformanceGruasFiltros } from "@/lib/api-relatorios-performance"
import { PerformanceGruasFiltros as FiltrosComponent } from "@/components/relatorios/performance-gruas-filtros"
import { PerformanceGruasTabela } from "@/components/relatorios/performance-gruas-tabela"
import { useToast } from "@/hooks/use-toast"
import { gruasApi } from "@/lib/api-gruas"
import { obrasApi } from "@/lib/api-obras"
import api from "@/lib/api"
import { medicoesMensaisApi } from "@/lib/api-medicoes-mensais"
import { notasFiscaisApi } from "@/lib/api-notas-fiscais"
import { impostosApi } from "@/lib/api-impostos"
import { AlugueisAPI } from "@/lib/api-alugueis-residencias"
import { apiContasBancarias } from "@/lib/api-contas-bancarias"

export default function RelatoriosPage() {
  const { toast } = useToast()
  const [selectedObra, setSelectedObra] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  
  // Estados para dados reais
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardRelatorios | null>(null)
  const [relatorioUtilizacao, setRelatorioUtilizacao] = useState<RelatorioUtilizacao | null>(null)
  const [relatorioFinanceiro, setRelatorioFinanceiro] = useState<RelatorioFinanceiro | null>(null)
  const [financeiroIntegrado, setFinanceiroIntegrado] = useState<any[]>([])
  const [resumoFinanceiroConsolidado, setResumoFinanceiroConsolidado] = useState<any>(null)
  const [relatorioManutencao, setRelatorioManutencao] = useState<RelatorioManutencao | null>(null)
  
  // Estados para novos relatórios
  const [relatorioImpostos, setRelatorioImpostos] = useState<any>(null)
  const [relatorioBoletos, setRelatorioBoletos] = useState<any[]>([])
  const [relatorioMedicoes, setRelatorioMedicoes] = useState<any[]>([])
  const [relatorioOrcamentos, setRelatorioOrcamentos] = useState<any[]>([])
  const [relatorioObras, setRelatorioObras] = useState<any[]>([])
  const [relatorioEstoque, setRelatorioEstoque] = useState<any[]>([])
  const [relatorioComplementos, setRelatorioComplementos] = useState<any[]>([])
  
  // Estados para paginação
  const [paginaUtilizacao, setPaginaUtilizacao] = useState(1)
  const [paginaFinanceiro, setPaginaFinanceiro] = useState(1)
  const [paginaBoletos, setPaginaBoletos] = useState(1)
  const [paginaMedicoes, setPaginaMedicoes] = useState(1)
  const [paginaOrcamentos, setPaginaOrcamentos] = useState(1)
  const [paginaObras, setPaginaObras] = useState(1)
  const [paginaEstoque, setPaginaEstoque] = useState(1)
  const [paginaComplementos, setPaginaComplementos] = useState(1)
  const [limitePorPagina, setLimitePorPagina] = useState(10)

  const [financeiroFiltroStatus, setFinanceiroFiltroStatus] = useState("all")
  const [financeiroFiltroNatureza, setFinanceiroFiltroNatureza] = useState("all")
  
  // Estados de loading para cada relatório
  const [loadingImpostos, setLoadingImpostos] = useState(false)
  const [loadingBoletos, setLoadingBoletos] = useState(false)
  const [loadingMedicoes, setLoadingMedicoes] = useState(false)
  const [loadingOrcamentos, setLoadingOrcamentos] = useState(false)
  const [loadingObras, setLoadingObras] = useState(false)
  const [loadingEstoque, setLoadingEstoque] = useState(false)
  const [loadingComplementos, setLoadingComplementos] = useState(false)
  const [loadingResumoFinanceiro, setLoadingResumoFinanceiro] = useState(false)
  
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState("geral")
  
  // Ref para controlar se já carregou cada relatório (evitar recarregar desnecessariamente)
  const loadedTabsRef = useRef<Set<string>>(new Set(["geral"]))

  // Estados para Performance de Gruas
  const [loadingPerformance, setLoadingPerformance] = useState(false)
  const [dadosPerformance, setDadosPerformance] = useState<any>(null)
  const [gruas, setGruas] = useState<Array<{ id: number; nome: string; modelo: string }>>([])
  const [obras, setObras] = useState<Array<{ id: number; nome: string }>>([])
  const [paginaPerformance, setPaginaPerformance] = useState(1)
  const [filtrosPerformance, setFiltrosPerformance] = useState<PerformanceGruasFiltros>({
    data_inicio: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    data_fim: format(new Date(), 'yyyy-MM-dd'),
    ordenar_por: 'taxa_utilizacao',
    ordem: 'desc'
  })

  const obterObraIdSelecionada = () => {
    if (selectedObra === "all") return undefined
    const id = Number(selectedObra)
    return Number.isNaN(id) ? undefined : id
  }

  const normalizarStatus = (valor?: string) =>
    (valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()

  const normalizarStatusObra = (status?: string) => {
    const s = normalizarStatus(status)
    if (s.includes("andamento") || s.includes("ativa") || s.includes("planejamento")) return "ativa"
    if (s.includes("pausada")) return "pausada"
    if (s.includes("concluida") || s.includes("finalizada")) return "finalizada"
    if (s.includes("cancelada")) return "cancelada"
    return s
  }

  const obterValorComplemento = (item: any) => {
    const valorDireto = parseFloat(item?.preco ?? item?.valor ?? 0)
    if (!Number.isNaN(valorDireto) && valorDireto > 0) return valorDireto
    const valorCentavos = Number(item?.preco_unitario_centavos ?? 0)
    return Number.isNaN(valorCentavos) ? 0 : valorCentavos / 100
  }

  const toNumber = (valor: any) => {
    const parsed = Number(valor ?? 0)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const formatarMoeda = (valor: any) => `R$ ${toNumber(valor).toLocaleString('pt-BR')}`

  const toArray = (payload: any): any[] => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.impostos)) return payload.impostos
    if (Array.isArray(payload?.receitas)) return payload.receitas
    if (Array.isArray(payload?.custos)) return payload.custos
    return []
  }

  const isDataNoPeriodo = (dataStr: any, dataInicio: string, dataFim: string) => {
    if (!dataStr) return false
    const data = new Date(`${String(dataStr).slice(0, 10)}T12:00:00`)
    if (Number.isNaN(data.getTime())) return false
    const inicio = new Date(`${dataInicio}T00:00:00`)
    const fim = new Date(`${dataFim}T23:59:59`)
    return data >= inicio && data <= fim
  }

  const carregarFinanceiroIntegrado = async (dataInicio: string, dataFim: string) => {
    try {
      const [
        medicoesResp,
        notasResp,
        impostosResp,
        contasReceberResp,
        contasPagarResp,
        alugueisResp,
        bancosResp,
        movimentacoesResp
      ] = await Promise.all([
        medicoesMensaisApi.listar({ data_inicio: dataInicio, data_fim: dataFim, page: 1, limit: 200 }).catch(() => ({ success: false, data: [] as any[] })),
        notasFiscaisApi.list({ page: 1, limit: 200 }).catch(() => ({ data: [] as any[] })),
        impostosApi.list({ page: 1, limit: 200 }).catch(() => ({ impostos: [] as any[] })),
        api.get('/contas-receber?limite=200').catch(() => ({ data: { data: [] as any[] } })),
        api.get('/contas-pagar?limite=200').catch(() => ({ data: { data: [] as any[] } })),
        AlugueisAPI.listar().catch(() => [] as any[]),
        apiContasBancarias.listar({ ativa: true } as any).catch(() => [] as any[]),
        api.get('/contas-bancarias/movimentacoes/todas?limite=200').catch(() => ({ data: { data: [] as any[] } }))
      ])

      const medicoes = toArray(medicoesResp?.data ?? medicoesResp)
      const notas = toArray(notasResp)
      const impostos = toArray(impostosResp?.impostos ? impostosResp : impostosResp?.data ?? impostosResp)
      const contasReceber = toArray(contasReceberResp?.data)
      const contasPagar = toArray(contasPagarResp?.data)
      const alugueis = toArray(alugueisResp)
      const bancos = toArray(bancosResp)
      const movimentacoes = toArray(movimentacoesResp?.data)

      const linhasMedicoes = medicoes
        .filter((m: any) => isDataNoPeriodo(m.data_medicao || m.created_at, dataInicio, dataFim))
        .map((m: any) => ({
          origem: "Medição",
          referencia: m.numero || `MED-${m.id}`,
          descricao: m.obras?.nome || m.orcamentos?.clientes?.nome || "Medição mensal",
          valor: toNumber(m.valor_total),
          data: m.data_medicao || m.created_at,
          status: m.status || "pendente",
          natureza: "entrada"
        }))

      const linhasNotas = notas
        .filter((n: any) => isDataNoPeriodo(n.data_emissao || n.created_at, dataInicio, dataFim))
        .map((n: any) => ({
          origem: "Nota Fiscal",
          referencia: n.numero_nf || `NF-${n.id}`,
          descricao: n.clientes?.nome || n.fornecedores?.nome || "Nota fiscal",
          valor: toNumber(n.valor_total),
          data: n.data_emissao || n.created_at,
          status: n.status || "pendente",
          natureza: n.tipo === "entrada" ? "saida" : "entrada"
        }))

      const linhasImpostos = impostos
        .filter((i: any) => isDataNoPeriodo(i.data_vencimento || i.created_at, dataInicio, dataFim))
        .map((i: any) => ({
          origem: "Imposto",
          referencia: i.tipo || i.tipo_imposto || i.competencia || `IMP-${i.id}`,
          descricao: i.descricao || "Imposto",
          valor: toNumber(i.valor),
          data: i.data_vencimento || i.created_at,
          status: i.status || "pendente",
          natureza: "saida"
        }))

      const linhasReceber = contasReceber
        .filter((c: any) => isDataNoPeriodo(c.data_vencimento || c.created_at, dataInicio, dataFim))
        .map((c: any) => ({
          origem: "Contas a Receber",
          referencia: c.numero_nf || c.numero || `CR-${c.id}`,
          descricao: c.descricao || c.cliente?.nome || "Conta a receber",
          valor: toNumber(c.valor || c.valor_total),
          data: c.data_vencimento || c.created_at,
          status: c.status || "pendente",
          natureza: "entrada"
        }))

      const linhasPagar = contasPagar
        .filter((c: any) => isDataNoPeriodo(c.data_vencimento || c.created_at, dataInicio, dataFim))
        .map((c: any) => ({
          origem: "Contas a Pagar",
          referencia: c.numero_nf || c.numero || `CP-${c.id}`,
          descricao: c.descricao || c.fornecedor?.nome || "Conta a pagar",
          valor: toNumber(c.valor || c.valor_total),
          data: c.data_vencimento || c.created_at,
          status: c.status || "pendente",
          natureza: "saida"
        }))

      const linhasAlugueis = alugueis
        .filter((a: any) => isDataNoPeriodo(a.contrato?.dataInicio || a.createdAt, dataInicio, dataFim))
        .map((a: any) => ({
          origem: "Aluguel",
          referencia: a.residencia?.nome || `ALUG-${a.id}`,
          descricao: a.funcionario?.nome ? `Funcionário: ${a.funcionario.nome}` : "Aluguel residência",
          valor: toNumber(a.contrato?.valorMensal),
          data: a.contrato?.dataInicio || a.createdAt,
          status: a.status || "ativo",
          natureza: "saida"
        }))

      const linhasBancos = bancos
        .filter((b: any) => isDataNoPeriodo(b.created_at || b.updated_at, dataInicio, dataFim))
        .map((b: any) => ({
          origem: "Bancos",
          referencia: b.nome || b.banco || `BANCO-${b.id}`,
          descricao: `${b.banco || "Banco"} - Conta ${b.conta || "-"}`,
          valor: toNumber(b.saldo_atual),
          data: b.updated_at || b.created_at,
          status: b.ativa === false ? "inativa" : (b.status || "ativa"),
          natureza: "saldo"
        }))

      const linhasMovimentacoes = movimentacoes
        .filter((m: any) => isDataNoPeriodo(m.data || m.created_at, dataInicio, dataFim))
        .map((m: any) => ({
          origem: "Bancos",
          referencia: m.contas_bancarias?.banco || `MOV-${m.id}`,
          descricao: m.descricao || m.referencia || "Movimentação bancária",
          valor: toNumber(m.valor),
          data: m.data || m.created_at,
          status: m.tipo || "movimentação",
          natureza: m.tipo === "entrada" ? "entrada" : "saida"
        }))

      const linhas = [
        ...linhasMedicoes,
        ...linhasNotas,
        ...linhasImpostos,
        ...linhasReceber,
        ...linhasPagar,
        ...linhasAlugueis,
        ...linhasBancos,
        ...linhasMovimentacoes
      ].sort((a, b) => {
        const da = new Date(`${String(a.data).slice(0, 10)}T12:00:00`).getTime()
        const db = new Date(`${String(b.data).slice(0, 10)}T12:00:00`).getTime()
        return db - da
      })

      setFinanceiroIntegrado(linhas)
    } catch (error) {
      console.error('Erro ao carregar financeiro integrado:', error)
      setFinanceiroIntegrado([])
    }
  }

  const normalizarRelatorioImpostos = (response: any) => {
    const data = response?.data || {}
    const resumo = response?.resumo || {}
    const impostosPorTipo = Array.isArray(data.impostos_por_tipo)
      ? data.impostos_por_tipo.map((item: any) => ({
          ...item,
          valor_total: Number(item?.valor_total ?? item?.total ?? 0),
          valor_pago: Number(item?.valor_pago ?? item?.total_pago ?? 0),
          valor_pendente: Number(item?.valor_pendente ?? item?.total_pendente ?? 0)
        }))
      : []

    return {
      ...data,
      total_impostos: Number(data?.total_impostos ?? resumo?.total_geral ?? 0),
      total_pago: Number(data?.total_pago ?? resumo?.total_pago ?? 0),
      total_pendente: Number(data?.total_pendente ?? resumo?.total_pendente ?? 0),
      impostos_por_tipo: impostosPorTipo
    }
  }

  const carregarDadosTab = async (tab: string) => {
    switch (tab) {
      case "financeiro":
        await carregarRelatorioFinanceiro(1)
        break
      case "impostos":
        await carregarRelatorioImpostos()
        break
      case "boletos":
        await carregarRelatorioBoletos(1)
        break
      case "medicoes":
        await carregarRelatorioMedicoes(1)
        break
      case "orcamentos":
        await carregarRelatorioOrcamentos(1)
        break
      case "obras":
        await carregarRelatorioObras(1)
        break
      case "estoque":
        await carregarRelatorioEstoque(1)
        break
      case "complemento":
        await carregarRelatorioComplementos(1)
        break
      case "documentos":
        await carregarRelatorioManutencao()
        break
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados()
    carregarGruasEObras()
    carregarDadosPerformance()
  }, [])

  // Carregar relatórios automaticamente quando a aba mudar
  useEffect(() => {
    if (!loadedTabsRef.current.has(activeTab)) {
      carregarDadosTab(activeTab).finally(() => {
        loadedTabsRef.current.add(activeTab)
      })
    }
  }, [activeTab])

  // Na aba Geral, pré-carrega as outras fontes para montar os gráficos consolidados
  useEffect(() => {
    if (activeTab !== "geral" || loading) return

    const tabsResumoGeral = ["financeiro", "impostos", "boletos", "orcamentos", "obras"]

    tabsResumoGeral.forEach((tab) => {
      if (!loadedTabsRef.current.has(tab)) {
        carregarDadosTab(tab).finally(() => {
          loadedTabsRef.current.add(tab)
        })
      }
    })
  }, [activeTab, loading])

  // Carregar gruas e obras para filtros
  const carregarGruasEObras = async () => {
    try {
      const [gruasResponse, obrasResponse] = await Promise.all([
        gruasApi.listarGruas({ limit: 100 }),
        obrasApi.listarObras({ limit: 100 })
      ])
      
      setGruas((gruasResponse.data || []).map((g: any) => ({
        id: g.id,
        nome: g.nome || `${g.fabricante} ${g.modelo}`,
        modelo: g.modelo || ''
      })))
      
      setObras((obrasResponse.data || []).map((o: any) => ({
        id: o.id,
        nome: o.nome || 'Obra sem nome'
      })))
    } catch (error) {
      console.error('Erro ao carregar gruas e obras:', error)
    }
  }

  // Carregar dados de performance
  const carregarDadosPerformance = async () => {
    try {
      setLoadingPerformance(true)
      const response = await performanceGruasApi.obterRelatorio(filtrosPerformance)
      
      if (response.success) {
        setDadosPerformance(response.data)
      } else {
        throw new Error('Erro ao carregar dados')
      }
    } catch (error: any) {
      console.error('Erro ao carregar relatório de performance:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar relatório de performance",
        variant: "destructive"
      })
    } finally {
      setLoadingPerformance(false)
    }
  }

  const handleAplicarFiltrosPerformance = () => {
    setPaginaPerformance(1)
    carregarDadosPerformance()
  }

  const handleLimparFiltrosPerformance = () => {
    setFiltrosPerformance({
      data_inicio: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
      data_fim: format(new Date(), 'yyyy-MM-dd'),
      ordenar_por: 'taxa_utilizacao',
      ordem: 'desc'
    })
    setPaginaPerformance(1)
  }

  const handleExportPerformance = async (formato: 'pdf' | 'excel' | 'csv') => {
    try {
      let blob: Blob
      
      if (formato === 'pdf') {
        blob = await performanceGruasApi.exportarPDF(filtrosPerformance)
      } else if (formato === 'excel') {
        blob = await performanceGruasApi.exportarExcel(filtrosPerformance)
      } else {
        blob = await performanceGruasApi.exportarCSV(filtrosPerformance)
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-gruas-${format(new Date(), 'yyyy-MM-dd')}.${formato === 'pdf' ? 'pdf' : formato === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Sucesso",
        description: `Relatório exportado em formato ${formato.toUpperCase()}`,
      })
    } catch (error: any) {
      console.error('Erro ao exportar:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao exportar relatório",
        variant: "destructive"
      })
    }
  }

  // Atualizar relatórios quando filtros globais mudarem
  useEffect(() => {
    if (loading) return

    setPaginaUtilizacao(1)
    setPaginaFinanceiro(1)
    setPaginaBoletos(1)
    setPaginaMedicoes(1)
    setPaginaOrcamentos(1)
    setPaginaObras(1)
    setPaginaEstoque(1)
    setPaginaComplementos(1)

    carregarRelatorioUtilizacao(1)
    loadedTabsRef.current = new Set(["geral"])

    if (activeTab !== "geral") {
      carregarDadosTab(activeTab).finally(() => {
        loadedTabsRef.current.add(activeTab)
      })
    }
  }, [selectedPeriod, startDate, endDate, selectedObra, limitePorPagina, loading])

  const carregarDados = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Carregar dashboard geral
      const dashboardResponse = await apiRelatorios.dashboard()
      setDashboardData(dashboardResponse.data)
      
      // Carregar relatórios específicos se necessário
      // (pode ser carregado sob demanda baseado na aba ativa)
      
    } catch (error: any) {
      console.error('Erro ao carregar relatórios:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Função para calcular datas baseadas no período selecionado
  const calcularDatasPeriodo = () => {
    const hoje = new Date()
    let dataInicio: Date
    let dataFim: Date = hoje

    switch (selectedPeriod) {
      case 'week':
        dataInicio = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        dataInicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        dataInicio = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        dataInicio = new Date(hoje.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        dataInicio = startDate || new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
        dataFim = endDate || hoje
        break
      default:
        dataInicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Garantir que as datas sejam objetos Date válidos antes de formatar
    const dataInicioDate = dataInicio instanceof Date ? dataInicio : new Date(dataInicio)
    const dataFimDate = dataFim instanceof Date ? dataFim : new Date(dataFim)

    return {
      dataInicio: format(dataInicioDate, 'yyyy-MM-dd'),
      dataFim: format(dataFimDate, 'yyyy-MM-dd')
    }
  }

  const carregarRelatorioUtilizacao = async (pagina: number = paginaUtilizacao) => {
    try {
      const { dataInicio, dataFim } = calcularDatasPeriodo()
      
      const response = await apiRelatorios.utilizacao({
        data_inicio: dataInicio,
        data_fim: dataFim,
        ordenar_por: 'utilizacao',
        limite: Number(limitePorPagina),
        pagina: Number(pagina)
      })
      setRelatorioUtilizacao(response.data)
      setPaginaUtilizacao(pagina)
    } catch (error: any) {
      console.error('Erro ao carregar relatório de utilização:', error)
      setError(error.message)
    }
  }

  const carregarRelatorioFinanceiro = async (pagina: number = paginaFinanceiro) => {
    const { dataInicio, dataFim } = calcularDatasPeriodo()
    try {
      setLoadingResumoFinanceiro(true)

      const [response, resumoResponse] = await Promise.all([
        apiRelatorios.financeiro({
          data_inicio: dataInicio,
          data_fim: dataFim,
          agrupar_por: 'obra',
          incluir_projecao: false,
          limite: Number(limitePorPagina),
          pagina: Number(pagina)
        }).catch(() => null),
        apiRelatorios.dashboardConsolidado({
          data_inicio: dataInicio,
          data_fim: dataFim
        }).catch(() => null)
      ])

      setRelatorioFinanceiro(response?.data || null)
      setResumoFinanceiroConsolidado(resumoResponse?.resumo || null)
      setPaginaFinanceiro(pagina)
      await carregarFinanceiroIntegrado(dataInicio, dataFim)
    } catch (error: any) {
      console.error('Erro ao carregar relatório financeiro:', error)
      setError(error.message)
      await carregarFinanceiroIntegrado(dataInicio, dataFim)
    } finally {
      setLoadingResumoFinanceiro(false)
    }
  }

  const carregarRelatorioManutencao = async () => {
    try {
      const response = await apiRelatorios.manutencao({
        dias_antecedencia: 30,
        status_grua: 'Todas',
        tipo_manutencao: 'Todas'
      })
      setRelatorioManutencao(response.data)
    } catch (error: any) {
      console.error('Erro ao carregar relatório de manutenção:', error)
      setError(error.message)
    }
  }

  const carregarRelatorioImpostos = async () => {
    try {
      setLoadingImpostos(true)
      const { dataFim } = calcularDatasPeriodo()
      const dataReferencia = new Date(`${dataFim}T12:00:00`)
      const response = await apiRelatorios.impostos({
        mes: dataReferencia.getMonth() + 1,
        ano: dataReferencia.getFullYear()
      })
      setRelatorioImpostos(normalizarRelatorioImpostos(response))
    } catch (error: any) {
      console.error('Erro ao carregar relatório de impostos:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar relatório de impostos",
        variant: "destructive"
      })
    } finally {
      setLoadingImpostos(false)
    }
  }

  const carregarRelatorioBoletos = async (pagina: number = paginaBoletos) => {
    try {
      setLoadingBoletos(true)
      const { dataInicio, dataFim } = calcularDatasPeriodo()
      const obraIdSelecionada = obterObraIdSelecionada()
      const response = await apiRelatorios.boletos({
        data_inicio: dataInicio,
        data_fim: dataFim,
        obra_id: obraIdSelecionada,
        page: pagina,
        limit: limitePorPagina
      })
      setRelatorioBoletos(response.data || [])
      setPaginaBoletos(pagina)
    } catch (error: any) {
      console.error('Erro ao carregar relatório de boletos:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar relatório de boletos",
        variant: "destructive"
      })
    } finally {
      setLoadingBoletos(false)
    }
  }

  const carregarRelatorioMedicoes = async (pagina: number = paginaMedicoes) => {
    try {
      setLoadingMedicoes(true)
      const { dataInicio, dataFim } = calcularDatasPeriodo()
      const obraIdSelecionada = obterObraIdSelecionada()
      const response = await apiRelatorios.medicoes({
        data_inicio: dataInicio,
        data_fim: dataFim,
        obra_id: obraIdSelecionada,
        page: pagina,
        limit: limitePorPagina
      })
      setRelatorioMedicoes(response.data || [])
      setPaginaMedicoes(pagina)
    } catch (error: any) {
      console.error('Erro ao carregar relatório de medições:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar relatório de medições",
        variant: "destructive"
      })
    } finally {
      setLoadingMedicoes(false)
    }
  }

  const carregarRelatorioOrcamentos = async (pagina: number = paginaOrcamentos) => {
    try {
      setLoadingOrcamentos(true)
      const { dataInicio, dataFim } = calcularDatasPeriodo()
      const obraIdSelecionada = obterObraIdSelecionada()
      const paramsBase = {
        obra_id: obraIdSelecionada,
        page: pagina,
        limit: limitePorPagina
      }

      let response = await apiRelatorios.orcamentos({
        data_inicio: dataInicio,
        data_fim: dataFim,
        ...paramsBase
      })

      // Fallback: se o período filtrado não retornar itens, tenta sem período
      const semResultadosNoPeriodo = !Array.isArray(response?.data) || response.data.length === 0
      if (semResultadosNoPeriodo && selectedPeriod !== "custom") {
        response = await apiRelatorios.orcamentos(paramsBase)
      }

      setRelatorioOrcamentos(response?.data || [])
      setPaginaOrcamentos(pagina)
    } catch (error: any) {
      console.error('Erro ao carregar relatório de orçamentos:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar relatório de orçamentos",
        variant: "destructive"
      })
    } finally {
      setLoadingOrcamentos(false)
    }
  }

  const carregarRelatorioObras = async (pagina: number = paginaObras) => {
    try {
      setLoadingObras(true)
      const response = await apiRelatorios.obras({
        page: pagina,
        limit: limitePorPagina
      })
      setRelatorioObras(response.data || [])
      setPaginaObras(pagina)
    } catch (error: any) {
      console.error('Erro ao carregar relatório de obras:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar relatório de obras",
        variant: "destructive"
      })
    } finally {
      setLoadingObras(false)
    }
  }

  const carregarRelatorioEstoque = async (pagina: number = paginaEstoque) => {
    try {
      setLoadingEstoque(true)
      const response = await apiRelatorios.estoque({
        page: pagina,
        limit: limitePorPagina
      })
      setRelatorioEstoque(response.data || [])
      setPaginaEstoque(pagina)
    } catch (error: any) {
      console.error('Erro ao carregar relatório de estoque:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar relatório de estoque",
        variant: "destructive"
      })
    } finally {
      setLoadingEstoque(false)
    }
  }

  const carregarRelatorioComplementos = async (pagina: number = paginaComplementos) => {
    try {
      setLoadingComplementos(true)
      const response = await apiRelatorios.complementos({
        ativo: true,
        page: pagina,
        limit: limitePorPagina
      })
      setRelatorioComplementos(response.data || [])
      setPaginaComplementos(pagina)
    } catch (error: any) {
      console.error('Erro ao carregar relatório de complementos:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar relatório de complementos",
        variant: "destructive"
      })
    } finally {
      setLoadingComplementos(false)
    }
  }

  // Funções wrapper para os botões de paginação
  const irParaPaginaAnteriorUtilizacao = () => {
    if (paginaUtilizacao > 1) {
      carregarRelatorioUtilizacao(paginaUtilizacao - 1)
    }
  }

  const irParaProximaPaginaUtilizacao = () => {
    if (relatorioUtilizacao?.paginacao && paginaUtilizacao < relatorioUtilizacao.paginacao.pages) {
      carregarRelatorioUtilizacao(paginaUtilizacao + 1)
    }
  }

  const irParaPaginaAnteriorFinanceiro = () => {
    if (paginaFinanceiro > 1) {
      carregarRelatorioFinanceiro(paginaFinanceiro - 1)
    }
  }

  const irParaProximaPaginaFinanceiro = () => {
    if (relatorioFinanceiro?.paginacao && paginaFinanceiro < relatorioFinanceiro.paginacao.pages) {
      carregarRelatorioFinanceiro(paginaFinanceiro + 1)
    }
  }

  const handleExport = (tipo: string) => {
    // Aqui seria a lógica para exportar relatórios
    console.log(`Exportando relatório: ${tipo}`)
  }

  const aplicarFiltrosGlobais = async () => {
    if (activeTab === "geral") {
      await carregarRelatorioUtilizacao(1)
    } else {
      await carregarDadosTab(activeTab)
    }
  }

  const limparFiltrosGlobais = () => {
    setSelectedObra("all")
    setSelectedPeriod("month")
    setStartDate(undefined)
    setEndDate(undefined)
    setLimitePorPagina(10)
    setFinanceiroFiltroStatus("all")
    setFinanceiroFiltroNatureza("all")
  }

  const financeiroIntegradoFiltrado = useMemo(() => {
    let rows = financeiroIntegrado
    if (financeiroFiltroNatureza !== "all") {
      const alvo = normalizarStatus(financeiroFiltroNatureza)
      rows = rows.filter((item) => normalizarStatus(item?.natureza) === alvo)
    }
    if (financeiroFiltroStatus !== "all") {
      rows = rows.filter((item) => {
        const s = normalizarStatus(item?.status)
        switch (financeiroFiltroStatus) {
          case "pendente":
            return s.includes("pend")
          case "pago":
            return s.includes("pago") || s.includes("paga")
          case "entrada":
            return s === "entrada" || s.includes("entrada")
          case "saida":
            return s === "saida" || s.includes("saida")
          case "encerrado":
            return s.includes("encerr")
          case "ativo":
            return (s.includes("ativ") || s.includes("ativa")) && !s.includes("inativ")
          case "inativo":
            return s.includes("inativ")
          default:
            return s === normalizarStatus(financeiroFiltroStatus)
        }
      })
    }
    return rows
  }, [financeiroIntegrado, financeiroFiltroStatus, financeiroFiltroNatureza])

  const dadosGraficoGruasStatus = dashboardData?.distribuicao?.por_status
    ? Object.entries(dashboardData.distribuicao.por_status).map(([status, count]) => ({
        name: status,
        value: toNumber(count)
      }))
    : []

  const dadosGraficoFinanceiroFluxo = [
    { name: "Entradas", valor: toNumber(relatorioFinanceiro?.totais?.receita_total_periodo) },
    { name: "Saídas", valor: toNumber(relatorioFinanceiro?.totais?.total_compras) },
    { name: "A Receber", valor: toNumber(resumoFinanceiroConsolidado?.contas?.a_receber) },
    { name: "A Pagar", valor: toNumber(resumoFinanceiroConsolidado?.contas?.a_pagar) },
    { name: "Impostos", valor: toNumber(resumoFinanceiroConsolidado?.contas?.impostos_pendentes) }
  ]

  const dadosGraficoImpostos = [
    { name: "Pago", valor: toNumber(relatorioImpostos?.total_pago) },
    { name: "Pendente", valor: toNumber(relatorioImpostos?.total_pendente) }
  ]

  const dadosGraficoBoletosStatus = [
    { name: "Pago", total: relatorioBoletos.filter((b: any) => normalizarStatus(b.status).includes("pago")).length },
    { name: "Pendente", total: relatorioBoletos.filter((b: any) => normalizarStatus(b.status).includes("pend")).length },
    { name: "Outros", total: relatorioBoletos.filter((b: any) => {
      const status = normalizarStatus(b.status)
      return !status.includes("pago") && !status.includes("pend")
    }).length }
  ]

  const dadosGraficoOrcamentosStatus = [
    { name: "Aprovado", total: relatorioOrcamentos.filter((o: any) => normalizarStatus(o.status).includes("aprov")).length },
    { name: "Pendente", total: relatorioOrcamentos.filter((o: any) => ["rascunho", "enviado", "pendente"].includes(normalizarStatus(o.status))).length },
    { name: "Rejeitado", total: relatorioOrcamentos.filter((o: any) => normalizarStatus(o.status).includes("rejeit")).length }
  ]

  const dadosGraficoObrasStatus = [
    { name: "Ativas", total: relatorioObras.filter((o: any) => normalizarStatusObra(o.status) === "ativa").length },
    { name: "Pausadas", total: relatorioObras.filter((o: any) => normalizarStatusObra(o.status) === "pausada").length },
    { name: "Finalizadas", total: relatorioObras.filter((o: any) => normalizarStatusObra(o.status) === "finalizada").length }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análise e relatórios do sistema</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Erro ao carregar relatórios</p>
                <p className="text-sm text-red-700">{error}</p>
                <button 
                  onClick={carregarDados}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análise e relatórios do sistema</p>
          {dashboardData && (
            <p className="text-sm text-gray-500 mt-1">
              Última atualização: {new Date(dashboardData.ultima_atualizacao).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('geral')}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Geral
          </Button>
          <Button onClick={() => handleExport('completo')}>
            <FileText className="w-4 h-4 mr-2" />
            Relatório Completo
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Toolbar única: filtros + tabs */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Filtros em linha única */}
            <div className="flex flex-col lg:flex-row gap-3 items-end">
            {/* Obra */}
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Obra</label>
              <Select value={selectedObra} onValueChange={setSelectedObra}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todas as obras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {obras.map((obra) => (
                    <SelectItem key={obra.id} value={obra.id.toString()}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="quarter">Último trimestre</SelectItem>
                  <SelectItem value="year">Último ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Itens por página */}
            <div className="flex-1 min-w-[120px]">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Itens/página</label>
              <Select value={limitePorPagina.toString()} onValueChange={(value) => setLimitePorPagina(parseInt(value))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Datas personalizadas */}
            {selectedPeriod === 'custom' && (
              <>
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Data Início</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-9 w-full justify-start text-left font-normal text-xs">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Data Fim</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-9 w-full justify-start text-left font-normal text-xs">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            {/* Indicador do período atual */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                <CalendarIcon className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Período:</span>
                <span className="text-xs text-blue-700">
                  {(() => {
                    const { dataInicio, dataFim } = calcularDatasPeriodo()
                    return `${format(new Date(dataInicio), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(dataFim), 'dd/MM/yyyy', { locale: ptBR })}`
                  })()}
                </span>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  carregarRelatorioUtilizacao()
                  carregarRelatorioFinanceiro()
                }}
                disabled={loading}
                size="sm"
                className="h-9"
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedPeriod('month')
                  setStartDate(undefined)
                  setEndDate(undefined)
                }}
                size="sm"
                className="h-9"
              >
                <Clock className="w-3 h-3 mr-1" />
                Resetar
              </Button>
            </div>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <TabsList className="flex flex-wrap w-full gap-2 p-0 h-auto bg-transparent border-0 rounded-none">
                <TabsTrigger value="geral" className="flex-1 min-w-[120px] rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white">Geral</TabsTrigger>
                <TabsTrigger value="gruas" className="flex-1 min-w-[120px] rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white">Gruas</TabsTrigger>
                <TabsTrigger value="financeiro" className="flex-1 min-w-[120px] rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white">Financeiro</TabsTrigger>
                <TabsTrigger value="impostos" className="flex-1 min-w-[120px] rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white">Impostos</TabsTrigger>
                <TabsTrigger value="boletos" className="flex-1 min-w-[120px] rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white">Boletos</TabsTrigger>
                <TabsTrigger value="medicoes" className="flex-1 min-w-[120px] rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white">Medições</TabsTrigger>
                <TabsTrigger value="orcamentos" className="flex-1 min-w-[120px] rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white">Orçamentos</TabsTrigger>
                <TabsTrigger value="obras" className="flex-1 min-w-[120px] rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white">Obras</TabsTrigger>
                <TabsTrigger value="estoque" className="flex-1 min-w-[120px] rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white">Estoque</TabsTrigger>
                <TabsTrigger value="complemento" className="flex-1 min-w-[120px] rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white">Complemento</TabsTrigger>
                <TabsTrigger value="documentos" className="flex-1 min-w-[120px] rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white">Manutenção</TabsTrigger>
              </TabsList>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="geral" className="space-y-6 bg-white border border-gray-200 rounded-md shadow-sm p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Gruas por Status
                </CardTitle>
                <CardDescription>
                  Visão consolidada da aba de gruas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dadosGraficoGruasStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={dadosGraficoGruasStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {dadosGraficoGruasStatus.map((item, index) => (
                          <Cell key={`cell-${index}`} fill={
                            item.name === "Operacional" ? "#10b981" :
                            item.name === "Manutenção" ? "#f59e0b" :
                            item.name === "Disponível" ? "#3b82f6" : "#94a3b8"
                          } />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <p>Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financeiro Consolidado
                </CardTitle>
                <CardDescription>
                  Entradas, saídas e contas do financeiro
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dadosGraficoFinanceiroFluxo.some((item) => item.valor > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={dadosGraficoFinanceiroFluxo}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value: number) => [formatarMoeda(value), "Valor"]} />
                      <Bar dataKey="valor" fill="#2563eb" name="Valor (R$)" radius={[6, 6, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <p>Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Impostos: Pago x Pendente
                </CardTitle>
                <CardDescription>
                  Resumo da aba de impostos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dadosGraficoImpostos.some((item) => item.valor > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={dadosGraficoImpostos}
                        dataKey="valor"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => [formatarMoeda(value), "Valor"]} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <p>Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Boletos por Status
                </CardTitle>
                <CardDescription>
                  Resumo da aba de boletos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dadosGraficoBoletosStatus.some((item) => item.total > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={dadosGraficoBoletosStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="total" fill="#7c3aed" name="Quantidade" radius={[6, 6, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <p>Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Orçamentos por Status
                </CardTitle>
                <CardDescription>
                  Resumo da aba de orçamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dadosGraficoOrcamentosStatus.some((item) => item.total > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={dadosGraficoOrcamentosStatus}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#eab308" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <p>Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Obras por Status
                </CardTitle>
                <CardDescription>
                  Resumo da aba de obras
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dadosGraficoObrasStatus.some((item) => item.total > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={dadosGraficoObrasStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="total" fill="#0ea5e9" name="Quantidade" radius={[6, 6, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <p>Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gruas" className="space-y-6 bg-white border border-gray-200 rounded-md shadow-sm p-4">
          {/* Header do Relatório de Performance */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Performance de Gruas</h2>
              <p className="text-gray-600">Análise detalhada da performance operacional e financeira</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExportPerformance('pdf')} disabled={loadingPerformance}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => handleExportPerformance('excel')} disabled={loadingPerformance}>
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" onClick={() => handleExportPerformance('csv')} disabled={loadingPerformance}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <FiltrosComponent
            filtros={filtrosPerformance}
            onFiltrosChange={setFiltrosPerformance}
            onAplicar={handleAplicarFiltrosPerformance}
            onLimpar={handleLimparFiltrosPerformance}
            loading={loadingPerformance}
            gruas={gruas}
            obras={obras}
          />

          {/* Loading State */}
          {loadingPerformance && !dadosPerformance && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="ml-3 text-gray-600">Carregando relatório...</p>
            </div>
          )}

          {/* Conteúdo do Relatório */}
          {!loadingPerformance && dadosPerformance && (
            <div className="space-y-4">
              <PerformanceGruasTabela
                dados={dadosPerformance?.performance_por_grua || []}
                pagina={paginaPerformance}
                totalPaginas={dadosPerformance?.paginacao?.total_paginas || 1}
                limite={10}
                onPaginaChange={setPaginaPerformance}
              />
            </div>
          )}

          {/* Erro State */}
          {!loadingPerformance && !dadosPerformance && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Erro ao carregar relatório</p>
                    <p className="text-sm text-red-700">Não foi possível carregar os dados do relatório</p>
                    <Button 
                      onClick={carregarDadosPerformance}
                      className="mt-2"
                      variant="outline"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-6 bg-white border border-gray-200 rounded-md shadow-sm p-4">
          <FiltrosDemaisTabs
            selectedObra={selectedObra}
            setSelectedObra={setSelectedObra}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            limitePorPagina={limitePorPagina}
            setLimitePorPagina={setLimitePorPagina}
            obras={obras}
            onAplicar={aplicarFiltrosGlobais}
            onLimpar={limparFiltrosGlobais}
            loading={loadingResumoFinanceiro}
            filtroStatus={financeiroFiltroStatus}
            setFiltroStatus={setFinanceiroFiltroStatus}
            filtroNatureza={financeiroFiltroNatureza}
            setFiltroNatureza={setFinanceiroFiltroNatureza}
          />
          {/* Relatório Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Relatório Financeiro
              </CardTitle>
              <CardDescription>
                Análise financeira por grua, obra ou cliente no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6 justify-end">
                <Button variant="outline" onClick={() => handleExport('financeiro')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
              
              {loadingResumoFinanceiro ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Carregando relatório financeiro...</p>
                </div>
              ) : financeiroIntegrado.length > 0 ? (
                <div className="space-y-4">
                  {financeiroIntegradoFiltrado.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-md">
                      <Filter className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium text-gray-700">Nenhum lançamento com status e natureza selecionados</p>
                      <p className="text-sm mt-1">Ajuste os filtros acima ou clique em Limpar Filtros.</p>
                    </div>
                  ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Origem</TableHead>
                        <TableHead>Referência</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Natureza</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financeiroIntegradoFiltrado.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Badge variant="outline">{item.origem}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.referencia || "N/A"}</TableCell>
                          <TableCell>{item.descricao || "N/A"}</TableCell>
                          <TableCell>
                            {item.data ? new Date(item.data).toLocaleDateString("pt-BR") : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              normalizarStatus(item.status).includes("pago") || normalizarStatus(item.status).includes("finaliz")
                                ? "bg-green-100 text-green-800"
                                : normalizarStatus(item.status).includes("venc") || normalizarStatus(item.status).includes("atras")
                                ? "bg-red-100 text-red-800"
                                : normalizarStatus(item.status).includes("cancel")
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                            }>
                              {item.status || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              item.natureza === "entrada"
                                ? "bg-green-100 text-green-800"
                                : item.natureza === "saida"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }>
                              {item.natureza || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-medium ${item.natureza === "saida" ? "text-red-700" : "text-green-700"}`}>
                            {formatarMoeda(item.valor)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum dado financeiro encontrado no período/filtros selecionados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Impostos */}
        <TabsContent value="impostos" className="space-y-6 bg-white border border-gray-200 rounded-md shadow-sm p-4">
          <FiltrosDemaisTabs
            selectedObra={selectedObra}
            setSelectedObra={setSelectedObra}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            limitePorPagina={limitePorPagina}
            setLimitePorPagina={setLimitePorPagina}
            obras={obras}
            onAplicar={aplicarFiltrosGlobais}
            onLimpar={limparFiltrosGlobais}
            loading={loadingImpostos}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Relatório de Impostos
              </CardTitle>
              <CardDescription>
                Análise de impostos por competência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6 justify-end">
                <Button variant="outline" onClick={() => handleExport('impostos')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
              
              {loadingImpostos ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Carregando relatório de impostos...</p>
                </div>
              ) : relatorioImpostos ? (
                <div className="space-y-4">
                  {relatorioImpostos.impostos_por_tipo && relatorioImpostos.impostos_por_tipo.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Pago</TableHead>
                          <TableHead>Pendente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relatorioImpostos.impostos_por_tipo.map((item: any, index: number) => (
                          <TableRow key={`${item.tipo || "tipo"}-${index}`}>
                            <TableCell className="font-medium">{item.tipo || "N/A"}</TableCell>
                            <TableCell className="text-blue-700 font-medium">{formatarMoeda(item.valor_total)}</TableCell>
                            <TableCell className="text-green-700">{formatarMoeda(item.valor_pago)}</TableCell>
                            <TableCell className="text-red-700">{formatarMoeda(item.valor_pendente)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Nenhum item de imposto disponível</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum dado disponível para o período selecionado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Boletos */}
        <TabsContent value="boletos" className="space-y-6 bg-white border border-gray-200 rounded-md shadow-sm p-4">
          <FiltrosDemaisTabs
            selectedObra={selectedObra}
            setSelectedObra={setSelectedObra}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            limitePorPagina={limitePorPagina}
            setLimitePorPagina={setLimitePorPagina}
            obras={obras}
            onAplicar={aplicarFiltrosGlobais}
            onLimpar={limparFiltrosGlobais}
            loading={loadingBoletos}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Relatório de Boletos
              </CardTitle>
              <CardDescription>
                Análise de boletos por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6 justify-end">
                <Button variant="outline" onClick={() => handleExport('boletos')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
              
              {loadingBoletos ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Carregando relatório de boletos...</p>
                </div>
              ) : relatorioBoletos.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Obra</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorioBoletos.map((boleto: any, index: number) => (
                        <TableRow key={boleto.id || index}>
                          <TableCell className="font-medium">{boleto.numero_boleto || 'N/A'}</TableCell>
                          <TableCell>{boleto.descricao || 'N/A'}</TableCell>
                          <TableCell className="text-green-600 font-medium">R$ {parseFloat(boleto.valor || 0).toLocaleString('pt-BR')}</TableCell>
                          <TableCell>{boleto.data_vencimento ? new Date(boleto.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={
                              boleto.status === 'pago' ? 'bg-green-100 text-green-800' :
                              boleto.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {boleto.status || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{boleto.obras?.nome || boleto.medicoes?.obras?.nome || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum dado disponível para o período selecionado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Medições */}
        <TabsContent value="medicoes" className="space-y-6 bg-white border border-gray-200 rounded-md shadow-sm p-4">
          <FiltrosDemaisTabs
            selectedObra={selectedObra}
            setSelectedObra={setSelectedObra}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            limitePorPagina={limitePorPagina}
            setLimitePorPagina={setLimitePorPagina}
            obras={obras}
            onAplicar={aplicarFiltrosGlobais}
            onLimpar={limparFiltrosGlobais}
            loading={loadingMedicoes}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Relatório de Medições
              </CardTitle>
              <CardDescription>
                Análise de medições mensais por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6 justify-end">
                <Button variant="outline" onClick={() => handleExport('medicoes')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
              
              {loadingMedicoes ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Carregando relatório de medições...</p>
                </div>
              ) : relatorioMedicoes.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Obra</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorioMedicoes.map((medicao: any, index: number) => (
                        <TableRow key={medicao.id || index}>
                          <TableCell className="font-medium">{medicao.numero || `MED-${medicao.id}`}</TableCell>
                          <TableCell>{medicao.periodo || 'N/A'}</TableCell>
                          <TableCell>{medicao.obras?.nome || 'N/A'}</TableCell>
                          <TableCell className="text-green-600 font-medium">R$ {parseFloat(medicao.valor_total || 0).toLocaleString('pt-BR')}</TableCell>
                          <TableCell>
                            <Badge className={
                              normalizarStatus(medicao.status).includes('aprov') ? 'bg-green-100 text-green-800' :
                              normalizarStatus(medicao.status).includes('rejeit') ? 'bg-red-100 text-red-800' :
                              normalizarStatus(medicao.status).includes('pend') ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {medicao.status || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{medicao.created_at ? new Date(medicao.created_at).toLocaleDateString('pt-BR') : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum dado disponível para o período selecionado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Orçamentos */}
        <TabsContent value="orcamentos" className="space-y-6 bg-white border border-gray-200 rounded-md shadow-sm p-4">
          <FiltrosDemaisTabs
            selectedObra={selectedObra}
            setSelectedObra={setSelectedObra}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            limitePorPagina={limitePorPagina}
            setLimitePorPagina={setLimitePorPagina}
            obras={obras}
            onAplicar={aplicarFiltrosGlobais}
            onLimpar={limparFiltrosGlobais}
            loading={loadingOrcamentos}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Relatório de Orçamentos
              </CardTitle>
              <CardDescription>
                Análise de orçamentos por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6 justify-end">
                <Button variant="outline" onClick={() => handleExport('orcamentos')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
              
              {loadingOrcamentos ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Carregando relatório de orçamentos...</p>
                </div>
              ) : relatorioOrcamentos.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Obra</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorioOrcamentos.map((orcamento: any, index: number) => (
                        <TableRow key={orcamento.id || index}>
                          <TableCell className="font-medium">{orcamento.numero || `ORC-${orcamento.id}`}</TableCell>
                          <TableCell>{orcamento.clientes?.nome || 'N/A'}</TableCell>
                          <TableCell>{orcamento.obras?.nome || 'N/A'}</TableCell>
                          <TableCell className="text-green-600 font-medium">R$ {parseFloat(orcamento.valor_total || 0).toLocaleString('pt-BR')}</TableCell>
                          <TableCell>
                            <Badge className={
                              normalizarStatus(orcamento.status).includes('aprov') ? 'bg-green-100 text-green-800' :
                              ['rascunho', 'enviado', 'pendente'].includes(normalizarStatus(orcamento.status)) ? 'bg-yellow-100 text-yellow-800' :
                              normalizarStatus(orcamento.status).includes('rejeit') ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {orcamento.status || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{orcamento.created_at ? new Date(orcamento.created_at).toLocaleDateString('pt-BR') : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum dado disponível para o período selecionado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Obras */}
        <TabsContent value="obras" className="space-y-6 bg-white border border-gray-200 rounded-md shadow-sm p-4">
          <FiltrosDemaisTabs
            selectedObra={selectedObra}
            setSelectedObra={setSelectedObra}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            limitePorPagina={limitePorPagina}
            setLimitePorPagina={setLimitePorPagina}
            obras={obras}
            onAplicar={aplicarFiltrosGlobais}
            onLimpar={limparFiltrosGlobais}
            loading={loadingObras}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Relatório de Obras
              </CardTitle>
              <CardDescription>
                Análise de obras e seus status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6 justify-end">
                <Button variant="outline" onClick={() => handleExport('obras')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
              
              {loadingObras ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Carregando relatório de obras...</p>
                </div>
              ) : relatorioObras.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data Início</TableHead>
                        <TableHead>Gruas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorioObras.map((obra: any, index: number) => (
                        <TableRow key={obra.id || index}>
                          <TableCell className="font-medium">{obra.nome || 'N/A'}</TableCell>
                          <TableCell>{obra.clientes?.nome || 'N/A'}</TableCell>
                          <TableCell>{obra.endereco || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={
                              normalizarStatusObra(obra.status) === 'ativa' ? 'bg-green-100 text-green-800' :
                              normalizarStatusObra(obra.status) === 'pausada' ? 'bg-yellow-100 text-yellow-800' :
                              normalizarStatusObra(obra.status) === 'finalizada' ? 'bg-gray-100 text-gray-800' :
                              normalizarStatusObra(obra.status) === 'cancelada' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {obra.status || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{obra.data_inicio ? new Date(obra.data_inicio).toLocaleDateString('pt-BR') : 'N/A'}</TableCell>
                          <TableCell>{obra.grua_obra?.length || obra.gruas_obra?.length || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Estoque */}
        <TabsContent value="estoque" className="space-y-6 bg-white border border-gray-200 rounded-md shadow-sm p-4">
          <FiltrosDemaisTabs
            selectedObra={selectedObra}
            setSelectedObra={setSelectedObra}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            limitePorPagina={limitePorPagina}
            setLimitePorPagina={setLimitePorPagina}
            obras={obras}
            onAplicar={aplicarFiltrosGlobais}
            onLimpar={limparFiltrosGlobais}
            loading={loadingEstoque}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Relatório de Estoque
              </CardTitle>
              <CardDescription>
                Análise de produtos e componentes em estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6 justify-end">
                <Button variant="outline" onClick={() => handleExport('estoque')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
              
              {loadingEstoque ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Carregando relatório de estoque...</p>
                </div>
              ) : relatorioEstoque.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Valor Unitário</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorioEstoque.map((item: any, index: number) => {
                        const estoque = item.estoque?.[0] || item.estoque || {};
                        return (
                          <TableRow key={item.id || index}>
                            <TableCell className="font-medium">{item.nome || item.name || 'N/A'}</TableCell>
                            <TableCell>{item.categorias?.nome || item.categoria || 'N/A'}</TableCell>
                            <TableCell>{estoque.quantidade_atual || estoque.quantidade_disponivel || 0}</TableCell>
                            <TableCell>R$ {parseFloat(item.preco || item.valor_unitario || 0).toLocaleString('pt-BR')}</TableCell>
                            <TableCell className="text-green-600 font-medium">R$ {parseFloat(estoque.valor_total || 0).toLocaleString('pt-BR')}</TableCell>
                            <TableCell>
                              <Badge className={
                                item.status === 'Ativo' || item.ativo ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {item.status || (item.ativo ? 'Ativo' : 'Inativo')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Complementos */}
        <TabsContent value="complemento" className="space-y-6 bg-white border border-gray-200 rounded-md shadow-sm p-4">
          <FiltrosDemaisTabs
            selectedObra={selectedObra}
            setSelectedObra={setSelectedObra}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            limitePorPagina={limitePorPagina}
            setLimitePorPagina={setLimitePorPagina}
            obras={obras}
            onAplicar={aplicarFiltrosGlobais}
            onLimpar={limparFiltrosGlobais}
            loading={loadingComplementos}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Relatório de Complementos
              </CardTitle>
              <CardDescription>
                Análise de complementos do catálogo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6 justify-end">
                <Button variant="outline" onClick={() => handleExport('complementos')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
              
              {loadingComplementos ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Carregando relatório de complementos...</p>
                </div>
              ) : relatorioComplementos.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Descrição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorioComplementos.map((complemento: any, index: number) => (
                        <TableRow key={complemento.id || index}>
                          <TableCell className="font-medium">{complemento.nome || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={
                              complemento.tipo === 'acessorio' ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }>
                              {complemento.tipo || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{complemento.sku || 'N/A'}</TableCell>
                          <TableCell className="text-green-600 font-medium">R$ {obterValorComplemento(complemento).toLocaleString('pt-BR')}</TableCell>
                          <TableCell>
                            <Badge className={
                              complemento.ativo ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {complemento.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{complemento.descricao || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-6 bg-white border border-gray-200 rounded-md shadow-sm p-4">
          <FiltrosDemaisTabs
            selectedObra={selectedObra}
            setSelectedObra={setSelectedObra}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            limitePorPagina={limitePorPagina}
            setLimitePorPagina={setLimitePorPagina}
            obras={obras}
            onAplicar={aplicarFiltrosGlobais}
            onLimpar={limparFiltrosGlobais}
            loading={loading}
          />
          {/* Relatório de Manutenção */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Relatório de Manutenção
              </CardTitle>
              <CardDescription>
                Análise de manutenções programadas e status das gruas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6 justify-end">
                <Button variant="outline" onClick={() => handleExport('manutencao')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Carregando relatório de manutenção...</p>
                </div>
              ) : relatorioManutencao ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grua</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Próxima Manutenção</TableHead>
                        <TableHead>Dias Restantes</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Valor Estimado</TableHead>
                        <TableHead>Obra Atual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorioManutencao.relatorio.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.grua.modelo} - {item.grua.fabricante}
                          </TableCell>
                          <TableCell>
                            <Badge className={item.grua.status === 'Operacional' ? 'bg-green-100 text-green-800' : 
                                             item.grua.status === 'Manutenção' ? 'bg-yellow-100 text-yellow-800' : 
                                             'bg-gray-100 text-gray-800'}>
                              {item.grua.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(item.manutencao.proxima_manutencao).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>
                            <Badge className={item.manutencao.dias_restantes <= 7 ? 'bg-red-100 text-red-800' : 
                                             item.manutencao.dias_restantes <= 30 ? 'bg-yellow-100 text-yellow-800' : 
                                             'bg-green-100 text-green-800'}>
                              {item.manutencao.dias_restantes} dias
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={item.manutencao.prioridade === 'Alta' ? 'bg-red-100 text-red-800' : 
                                             item.manutencao.prioridade === 'Média' ? 'bg-yellow-100 text-yellow-800' : 
                                             'bg-green-100 text-green-800'}>
                              {item.manutencao.prioridade}
                            </Badge>
                          </TableCell>
                          <TableCell>R$ {item.manutencao.valor_estimado.toLocaleString('pt-BR')}</TableCell>
                          <TableCell>{item.obra_atual?.nome || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Estrutura em lista (substitui visual de cards)
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`w-full border border-gray-200 rounded-md bg-white ${className || ''}`}>
      {children}
    </section>
  )
}

function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 py-3 border-b border-gray-200 space-y-1 ${className || ''}`}>
      {children}
    </div>
  )
}

function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 py-3 ${className || ''}`}>
      {children}
    </div>
  )
}

function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-sm font-semibold ${className || ''}`}>
      {children}
    </h3>
  )
}

function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-xs text-gray-600 ${className || ''}`}>
      {children}
    </p>
  )
}

type ResumoLinha = {
  label: string
  valor: React.ReactNode
  tone?: "default" | "green" | "red" | "blue" | "purple" | "orange" | "yellow"
}

function ResumoLista({ titulo, itens }: { titulo: string; itens: ResumoLinha[] }) {
  const toneClass: Record<NonNullable<ResumoLinha["tone"]>, string> = {
    default: "text-gray-900",
    green: "text-green-700",
    red: "text-red-700",
    blue: "text-blue-700",
    purple: "text-purple-700",
    orange: "text-orange-700",
    yellow: "text-yellow-700"
  }

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
        <p className="text-sm font-semibold text-gray-900">{titulo}</p>
      </div>
      <div className="divide-y divide-gray-200">
        {itens.map((item) => (
          <div key={item.label} className="px-4 py-2 flex items-center justify-between text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className={`font-semibold ${toneClass[item.tone || "default"]}`}>{item.valor}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FiltrosDemaisTabs({
  selectedObra,
  setSelectedObra,
  selectedPeriod,
  setSelectedPeriod,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  limitePorPagina,
  setLimitePorPagina,
  obras,
  onAplicar,
  onLimpar,
  loading,
  filtroStatus,
  setFiltroStatus,
  filtroNatureza,
  setFiltroNatureza
}: {
  selectedObra: string
  setSelectedObra: (value: string) => void
  selectedPeriod: string
  setSelectedPeriod: (value: string) => void
  startDate: Date | undefined
  setStartDate: (value: Date | undefined) => void
  endDate: Date | undefined
  setEndDate: (value: Date | undefined) => void
  limitePorPagina: number
  setLimitePorPagina: (value: number) => void
  obras: Array<{ id: number; nome: string }>
  onAplicar: () => void
  onLimpar: () => void
  loading?: boolean
  filtroStatus?: string
  setFiltroStatus?: (value: string) => void
  filtroNatureza?: string
  setFiltroNatureza?: (value: string) => void
}) {
  const mostrarFiltrosFinanceiro =
    filtroStatus !== undefined &&
    setFiltroStatus &&
    filtroNatureza !== undefined &&
    setFiltroNatureza

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className={`${mostrarFiltrosFinanceiro ? "min-w-[1180px]" : "min-w-[900px]"} flex items-end gap-3`}>
          <div className="min-w-[140px] flex-1">
            <label className="text-sm font-medium block mb-1">Período</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="quarter">Último Trimestre</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[160px] flex-1">
            <label className="text-sm font-medium block mb-1">Data Início</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date)
                    setSelectedPeriod("custom")
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="min-w-[160px] flex-1">
            <label className="text-sm font-medium block mb-1">Data Fim</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date)
                    setSelectedPeriod("custom")
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="min-w-[180px] flex-1">
            <label className="text-sm font-medium block mb-1">Obra</label>
            <Select value={selectedObra} onValueChange={setSelectedObra}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as obras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as obras</SelectItem>
                {obras.map((obra) => (
                  <SelectItem key={obra.id} value={obra.id.toString()}>
                    {obra.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mostrarFiltrosFinanceiro && (
            <>
              <div className="min-w-[150px] flex-1">
                <label className="text-sm font-medium block mb-1">Status</label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago / Paga</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                    <SelectItem value="ativo">Ativo / Ativa</SelectItem>
                    <SelectItem value="inativo">Inativo / Inativa</SelectItem>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[140px] flex-1">
                <label className="text-sm font-medium block mb-1">Natureza</label>
                <Select value={filtroNatureza} onValueChange={setFiltroNatureza}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="saldo">Saldo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="min-w-[120px]">
            <label className="text-sm font-medium block mb-1">Itens</label>
            <Select value={limitePorPagina.toString()} onValueChange={(v) => setLimitePorPagina(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 shrink-0 ml-auto">
            <Button onClick={onAplicar} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={onLimpar} disabled={loading}>
              Limpar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de tabela simples para os relatórios
function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {children}
      </table>
    </div>
  )
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-gray-50">
      {children}
    </thead>
  )
}

function TableBody({ children }: { children: React.ReactNode }) {
  return (
    <tbody className="divide-y divide-gray-200">
      {children}
    </tbody>
  )
}

function TableRow({ children }: { children: React.ReactNode }) {
  return (
    <tr className="hover:bg-gray-50">
      {children}
    </tr>
  )
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      {children}
    </th>
  )
}

function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className || ''}`}>
      {children}
    </td>
  )
}