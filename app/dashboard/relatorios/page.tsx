"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { PerformanceGruasResumo } from "@/components/relatorios/performance-gruas-resumo"
import { PerformanceGruasTabela } from "@/components/relatorios/performance-gruas-tabela"
import { PerformanceGruasGraficos } from "@/components/relatorios/performance-gruas-graficos"
import { useToast } from "@/hooks/use-toast"
import { gruasApi } from "@/lib/api-gruas"
import { obrasApi } from "@/lib/api-obras"

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
  
  // Estados de loading para cada relatório
  const [loadingImpostos, setLoadingImpostos] = useState(false)
  const [loadingBoletos, setLoadingBoletos] = useState(false)
  const [loadingMedicoes, setLoadingMedicoes] = useState(false)
  const [loadingOrcamentos, setLoadingOrcamentos] = useState(false)
  const [loadingObras, setLoadingObras] = useState(false)
  const [loadingEstoque, setLoadingEstoque] = useState(false)
  const [loadingComplementos, setLoadingComplementos] = useState(false)
  
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

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados()
    carregarGruasEObras()
    carregarDadosPerformance()
  }, [])

  // Carregar relatórios automaticamente quando a aba mudar
  useEffect(() => {
    if (!loadedTabsRef.current.has(activeTab)) {
      switch (activeTab) {
        case "financeiro":
          carregarRelatorioFinanceiro(1)
          break
        case "impostos":
          carregarRelatorioImpostos()
          break
        case "boletos":
          carregarRelatorioBoletos(1)
          break
        case "medicoes":
          carregarRelatorioMedicoes(1)
          break
        case "orcamentos":
          carregarRelatorioOrcamentos(1)
          break
        case "obras":
          carregarRelatorioObras(1)
          break
        case "estoque":
          carregarRelatorioEstoque(1)
          break
        case "complemento":
          carregarRelatorioComplementos(1)
          break
        case "documentos":
          carregarRelatorioManutencao()
          break
      }
      loadedTabsRef.current.add(activeTab)
    }
  }, [activeTab])

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

  // Atualizar relatórios quando o período mudar
  useEffect(() => {
    if (relatorioUtilizacao || relatorioFinanceiro) {
      // Resetar paginação e recarregar dados
      setPaginaUtilizacao(1)
      setPaginaFinanceiro(1)
      carregarRelatorioUtilizacao(1)
      carregarRelatorioFinanceiro(1)
    }
  }, [selectedPeriod, startDate, endDate])

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
    try {
      const { dataInicio, dataFim } = calcularDatasPeriodo()
      
      const response = await apiRelatorios.financeiro({
        data_inicio: dataInicio,
        data_fim: dataFim,
        agrupar_por: 'obra',
        incluir_projecao: false,
        limite: Number(limitePorPagina),
        pagina: Number(pagina)
      })
      setRelatorioFinanceiro(response.data)
      setPaginaFinanceiro(pagina)
    } catch (error: any) {
      console.error('Erro ao carregar relatório financeiro:', error)
      setError(error.message)
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
      const hoje = new Date()
      const response = await apiRelatorios.impostos({
        mes: hoje.getMonth() + 1,
        ano: hoje.getFullYear()
      })
      setRelatorioImpostos(response.data)
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
      const response = await apiRelatorios.boletos({
        data_inicio: dataInicio,
        data_fim: dataFim,
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
      const response = await apiRelatorios.medicoes({
        data_inicio: dataInicio,
        data_fim: dataFim,
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
      const response = await apiRelatorios.orcamentos({
        data_inicio: dataInicio,
        data_fim: dataFim,
        page: pagina,
        limit: limitePorPagina
      })
      setRelatorioOrcamentos(response.data || [])
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

      {/* Filtros Compactos */}
      <Card>
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap w-full gap-1 p-1 h-auto">
          <TabsTrigger value="geral" className="flex-1 min-w-[80px]">Geral</TabsTrigger>
          <TabsTrigger value="gruas" className="flex-1 min-w-[80px]">Gruas</TabsTrigger>
          <TabsTrigger value="financeiro" className="flex-1 min-w-[80px]">Financeiro</TabsTrigger>
          <TabsTrigger value="impostos" className="flex-1 min-w-[80px]">Impostos</TabsTrigger>
          <TabsTrigger value="boletos" className="flex-1 min-w-[80px]">Boletos</TabsTrigger>
          <TabsTrigger value="medicoes" className="flex-1 min-w-[80px]">Medições</TabsTrigger>
          <TabsTrigger value="orcamentos" className="flex-1 min-w-[80px]">Orçamentos</TabsTrigger>
          <TabsTrigger value="obras" className="flex-1 min-w-[80px]">Obras</TabsTrigger>
          <TabsTrigger value="estoque" className="flex-1 min-w-[80px]">Estoque</TabsTrigger>
          <TabsTrigger value="complemento" className="flex-1 min-w-[80px]">Complemento</TabsTrigger>
          <TabsTrigger value="documentos" className="flex-1 min-w-[80px]">Manutenção</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Gruas</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData?.resumo_geral.total_gruas || 0}</p>
                    <p className="text-xs text-blue-600 mt-1">{dashboardData?.resumo_geral.gruas_ocupadas || 0} ocupadas</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-500">
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Utilização</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData?.resumo_geral.taxa_utilizacao || 0}%</p>
                    <p className="text-xs text-green-600 mt-1">{dashboardData?.resumo_geral.gruas_disponiveis || 0} disponíveis</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-500">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor do Parque</p>
                    <p className="text-2xl font-bold text-gray-900">R$ {dashboardData?.resumo_geral.valor_total_parque?.toLocaleString('pt-BR') || '0'}</p>
                    <p className="text-xs text-orange-600 mt-1">Valor total</p>
                  </div>
                  <div className="p-3 rounded-full bg-yellow-500">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Receita do Mês</p>
                    <p className="text-2xl font-bold text-gray-900">R$ {dashboardData?.resumo_geral.receita_mes_atual?.toLocaleString('pt-BR') || '0'}</p>
                    <p className="text-xs text-green-600 mt-1">Mês atual</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-500">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos Visuais - Distribuição por Status e Tipo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pizza - Distribuição por Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Distribuição por Status
                </CardTitle>
                <CardDescription>
                  Situação atual do parque de gruas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData?.distribuicao.por_status && Object.keys(dashboardData.distribuicao.por_status).length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={Object.entries(dashboardData.distribuicao.por_status).map(([status, count]) => ({
                          name: status,
                          value: count
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(dashboardData.distribuicao.por_status).map(([status], index) => (
                          <Cell key={`cell-${index}`} fill={
                            status === 'Operacional' ? '#10b981' : 
                            status === 'Manutenção' ? '#f59e0b' : 
                            status === 'Disponível' ? '#3b82f6' : '#94a3b8'
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

            {/* Gráfico de Barras - Distribuição por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Distribuição por Tipo
                </CardTitle>
                <CardDescription>
                  Quantidade de gruas por tipo de equipamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData?.distribuicao.por_tipo && Object.keys(dashboardData.distribuicao.por_tipo).length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart 
                      data={Object.entries(dashboardData.distribuicao.por_tipo).map(([tipo, count]) => ({
                        tipo,
                        quantidade: count
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tipo" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="quantidade" fill="#8b5cf6" name="Quantidade" />
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

        <TabsContent value="gruas" className="space-y-6">
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
            <Tabs defaultValue="resumo" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="resumo">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Resumo
                </TabsTrigger>
                <TabsTrigger value="detalhado">
                  <FileText className="w-4 h-4 mr-2" />
                  Detalhado
                </TabsTrigger>
                <TabsTrigger value="graficos">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Gráficos
                </TabsTrigger>
                <TabsTrigger value="comparativo">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Comparativo
                </TabsTrigger>
              </TabsList>

              {/* Tab: Resumo */}
              <TabsContent value="resumo" className="space-y-6">
                <PerformanceGruasResumo resumo={dadosPerformance?.resumo_geral || null} />
                
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Data Início</p>
                        <p className="font-medium">
                          {dadosPerformance?.periodo?.data_inicio 
                            ? new Date(dadosPerformance.periodo.data_inicio).toLocaleDateString('pt-BR')
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Data Fim</p>
                        <p className="font-medium">
                          {dadosPerformance?.periodo?.data_fim 
                            ? new Date(dadosPerformance.periodo.data_fim).toLocaleDateString('pt-BR')
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Dias Totais</p>
                        <p className="font-medium">{dadosPerformance?.periodo?.dias_totais || 0} dias</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Dias Úteis</p>
                        <p className="font-medium">{dadosPerformance?.periodo?.dias_uteis || 0} dias</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Detalhado */}
              <TabsContent value="detalhado" className="space-y-6">
                <PerformanceGruasTabela
                  dados={dadosPerformance?.performance_por_grua || []}
                  pagina={paginaPerformance}
                  totalPaginas={dadosPerformance?.paginacao?.total_paginas || 1}
                  limite={10}
                  onPaginaChange={setPaginaPerformance}
                />
              </TabsContent>

              {/* Tab: Gráficos */}
              <TabsContent value="graficos" className="space-y-6">
                <PerformanceGruasGraficos dados={dadosPerformance?.performance_por_grua || []} />
              </TabsContent>

              {/* Tab: Comparativo */}
              <TabsContent value="comparativo" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Comparativo com Período Anterior</CardTitle>
                    <CardDescription>
                      Análise de variação entre o período atual e o período anterior equivalente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {dadosPerformance?.performance_por_grua && Array.isArray(dadosPerformance.performance_por_grua) ? (
                        dadosPerformance.performance_por_grua
                          .filter(item => item.comparativo_periodo_anterior)
                          .map((item, index) => (
                            <Card key={index}>
                              <CardHeader>
                                <CardTitle className="text-base">{item.grua.nome}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {item.comparativo_periodo_anterior && (
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <p className="text-gray-600">Variação Horas Trabalhadas</p>
                                      <p className={`font-bold ${item.comparativo_periodo_anterior.horas_trabalhadas_variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.comparativo_periodo_anterior.horas_trabalhadas_variacao >= 0 ? '+' : ''}
                                        {item.comparativo_periodo_anterior.horas_trabalhadas_variacao.toFixed(1)}%
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">Variação Receita</p>
                                      <p className={`font-bold ${item.comparativo_periodo_anterior.receita_variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.comparativo_periodo_anterior.receita_variacao >= 0 ? '+' : ''}
                                        {item.comparativo_periodo_anterior.receita_variacao.toFixed(1)}%
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">Variação Utilização</p>
                                      <p className={`font-bold ${item.comparativo_periodo_anterior.utilizacao_variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.comparativo_periodo_anterior.utilizacao_variacao >= 0 ? '+' : ''}
                                        {item.comparativo_periodo_anterior.utilizacao_variacao.toFixed(1)}%
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))
                      ) : (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          <p>Nenhum dado comparativo disponível</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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

        <TabsContent value="financeiro" className="space-y-6">
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
              
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Carregando relatório financeiro...</p>
                </div>
              ) : relatorioFinanceiro ? (
                <div className="space-y-6">
                  {/* Resumo do relatório financeiro */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">R$ {relatorioFinanceiro.totais.receita_total_periodo.toLocaleString('pt-BR')}</p>
                          <p className="text-sm text-gray-600">Receita Total</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">R$ {relatorioFinanceiro.totais.total_compras.toLocaleString('pt-BR')}</p>
                          <p className="text-sm text-gray-600">Total Compras</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">R$ {relatorioFinanceiro.totais.lucro_bruto_total.toLocaleString('pt-BR')}</p>
                          <p className="text-sm text-gray-600">Lucro Bruto</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{relatorioFinanceiro.totais.total_vendas}</p>
                          <p className="text-sm text-gray-600">Total Vendas</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{relatorioFinanceiro.totais.total_orcamentos}</p>
                          <p className="text-sm text-gray-600">Total Orçamentos</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-indigo-600">{(relatorioFinanceiro.totais.margem_lucro || 0).toFixed(1)}%</p>
                          <p className="text-sm text-gray-600">Margem de Lucro</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tabela financeira */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agrupamento</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Receita</TableHead>
                        <TableHead>Compras</TableHead>
                        <TableHead>Lucro Bruto</TableHead>
                        <TableHead>Vendas</TableHead>
                        <TableHead>Orçamentos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorioFinanceiro.relatorio.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Badge variant="outline">{relatorioFinanceiro.agrupamento}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.nome}</TableCell>
                          <TableCell className="text-green-600 font-medium">R$ {item.total_receita.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-red-600">R$ {item.total_compras.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className={`font-medium ${item.lucro_bruto >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            R$ {item.lucro_bruto.toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>{item.total_vendas}</TableCell>
                          <TableCell>{item.total_orcamentos}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Controles de paginação */}
                  {relatorioFinanceiro.paginacao && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {((paginaFinanceiro - 1) * limitePorPagina) + 1} a {Math.min(paginaFinanceiro * limitePorPagina, relatorioFinanceiro.paginacao.total)} de {relatorioFinanceiro.paginacao.total} resultados
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={irParaPaginaAnteriorFinanceiro}
                          disabled={paginaFinanceiro <= 1}
                        >
                          Anterior
                        </Button>
                        <span className="text-sm text-gray-600">
                          Página {paginaFinanceiro} de {relatorioFinanceiro.paginacao.pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={irParaProximaPaginaFinanceiro}
                          disabled={paginaFinanceiro >= relatorioFinanceiro.paginacao.pages}
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Gráficos de Análise Financeira */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Gráfico de Barras - Receita vs Compras Top 10 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>📊 Receita vs Compras - Top 10</CardTitle>
                        <CardDescription>
                          Comparativo de receitas e compras por {relatorioFinanceiro.agrupamento}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsBarChart 
                            data={relatorioFinanceiro.relatorio
                              .sort((a, b) => b.total_receita - a.total_receita)
                              .slice(0, 10)
                              .map(item => ({
                                nome: item.nome.substring(0, 15),
                                receita: Number((item.total_receita / 1000).toFixed(1)),
                                compras: Number((item.total_compras / 1000).toFixed(1))
                              }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nome" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <RechartsTooltip formatter={(value: number) => [`R$ ${(value * 1000).toLocaleString('pt-BR')}`, '']} />
                            <Legend />
                            <Bar dataKey="receita" fill="#10b981" name="Receita (R$ mil)" />
                            <Bar dataKey="compras" fill="#ef4444" name="Compras (R$ mil)" />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Gráfico de Pizza - Distribuição de Lucro */}
                    <Card>
                      <CardHeader>
                        <CardTitle>🥧 Distribuição de Lucro Bruto</CardTitle>
                        <CardDescription>
                          Lucro por {relatorioFinanceiro.agrupamento} (Top 5)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsPieChart>
                            <Pie
                              data={relatorioFinanceiro.relatorio
                                .filter(item => item.lucro_bruto > 0)
                                .sort((a, b) => b.lucro_bruto - a.lucro_bruto)
                                .slice(0, 5)
                                .map(item => ({
                                  name: item.nome.substring(0, 20),
                                  value: item.lucro_bruto
                                }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {[0, 1, 2, 3, 4].map((index) => (
                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index]} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Lucro']} />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum dado disponível para o período selecionado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Impostos */}
        <TabsContent value="impostos" className="space-y-6">
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
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">R$ {relatorioImpostos.total_impostos?.toLocaleString('pt-BR') || '0'}</p>
                          <p className="text-sm text-gray-600">Total de Impostos</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">R$ {relatorioImpostos.total_pago?.toLocaleString('pt-BR') || '0'}</p>
                          <p className="text-sm text-gray-600">Total Pago</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">R$ {relatorioImpostos.total_pendente?.toLocaleString('pt-BR') || '0'}</p>
                          <p className="text-sm text-gray-600">Total Pendente</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {relatorioImpostos.impostos_por_tipo && relatorioImpostos.impostos_por_tipo.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={relatorioImpostos.impostos_por_tipo}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tipo" />
                        <YAxis />
                        <RechartsTooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
                        <Legend />
                        <Bar dataKey="valor_total" fill="#3b82f6" name="Total" />
                        <Bar dataKey="valor_pago" fill="#10b981" name="Pago" />
                        <Bar dataKey="valor_pendente" fill="#ef4444" name="Pendente" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
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
        <TabsContent value="boletos" className="space-y-6">
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
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{relatorioBoletos.length}</p>
                          <p className="text-sm text-gray-600">Total de Boletos</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {relatorioBoletos.filter((b: any) => b.status === 'pago').length}
                          </p>
                          <p className="text-sm text-gray-600">Pagos</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">
                            {relatorioBoletos.filter((b: any) => b.status === 'pendente').length}
                          </p>
                          <p className="text-sm text-gray-600">Pendentes</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            R$ {relatorioBoletos.reduce((sum: number, b: any) => sum + (parseFloat(b.valor) || 0), 0).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-600">Valor Total</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
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
        <TabsContent value="medicoes" className="space-y-6">
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
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{relatorioMedicoes.length}</p>
                          <p className="text-sm text-gray-600">Total de Medições</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            R$ {relatorioMedicoes.reduce((sum: number, m: any) => sum + (parseFloat(m.valor_total) || 0), 0).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-600">Valor Total</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {new Set(relatorioMedicoes.map((m: any) => m.obra_id)).size}
                          </p>
                          <p className="text-sm text-gray-600">Obras Únicas</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
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
                              medicao.status === 'aprovado' ? 'bg-green-100 text-green-800' :
                              medicao.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
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
        <TabsContent value="orcamentos" className="space-y-6">
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
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{relatorioOrcamentos.length}</p>
                          <p className="text-sm text-gray-600">Total de Orçamentos</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {relatorioOrcamentos.filter((o: any) => o.status === 'aprovado').length}
                          </p>
                          <p className="text-sm text-gray-600">Aprovados</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">
                            {relatorioOrcamentos.filter((o: any) => o.status === 'pendente').length}
                          </p>
                          <p className="text-sm text-gray-600">Pendentes</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            R$ {relatorioOrcamentos.reduce((sum: number, o: any) => sum + (parseFloat(o.valor_total) || 0), 0).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-600">Valor Total</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
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
                              orcamento.status === 'aprovado' ? 'bg-green-100 text-green-800' :
                              orcamento.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                              orcamento.status === 'rejeitado' ? 'bg-red-100 text-red-800' :
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
        <TabsContent value="obras" className="space-y-6">
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
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{relatorioObras.length}</p>
                          <p className="text-sm text-gray-600">Total de Obras</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {relatorioObras.filter((o: any) => o.status === 'ativa').length}
                          </p>
                          <p className="text-sm text-gray-600">Ativas</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">
                            {relatorioObras.filter((o: any) => o.status === 'pausada').length}
                          </p>
                          <p className="text-sm text-gray-600">Pausadas</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-600">
                            {relatorioObras.filter((o: any) => o.status === 'finalizada').length}
                          </p>
                          <p className="text-sm text-gray-600">Finalizadas</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
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
                              obra.status === 'ativa' ? 'bg-green-100 text-green-800' :
                              obra.status === 'pausada' ? 'bg-yellow-100 text-yellow-800' :
                              obra.status === 'finalizada' ? 'bg-gray-100 text-gray-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {obra.status || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{obra.data_inicio ? new Date(obra.data_inicio).toLocaleDateString('pt-BR') : 'N/A'}</TableCell>
                          <TableCell>{obra.gruas_obra?.length || 0}</TableCell>
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
        <TabsContent value="estoque" className="space-y-6">
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
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{relatorioEstoque.length}</p>
                          <p className="text-sm text-gray-600">Total de Itens</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {relatorioEstoque.reduce((sum: number, item: any) => {
                              const estoque = item.estoque?.[0] || item.estoque;
                              return sum + (parseFloat(estoque?.quantidade_atual || estoque?.quantidade_disponivel || 0));
                            }, 0)}
                          </p>
                          <p className="text-sm text-gray-600">Quantidade Total</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            R$ {relatorioEstoque.reduce((sum: number, item: any) => {
                              const estoque = item.estoque?.[0] || item.estoque;
                              return sum + (parseFloat(estoque?.valor_total || 0));
                            }, 0).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-600">Valor Total</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">
                            {new Set(relatorioEstoque.map((item: any) => item.categorias?.id || item.categoria_id)).size}
                          </p>
                          <p className="text-sm text-gray-600">Categorias</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
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
        <TabsContent value="complemento" className="space-y-6">
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
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{relatorioComplementos.length}</p>
                          <p className="text-sm text-gray-600">Total de Complementos</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {relatorioComplementos.filter((c: any) => c.tipo === 'acessorio').length}
                          </p>
                          <p className="text-sm text-gray-600">Acessórios</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {relatorioComplementos.filter((c: any) => c.tipo === 'servico').length}
                          </p>
                          <p className="text-sm text-gray-600">Serviços</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            R$ {relatorioComplementos.reduce((sum: number, c: any) => sum + (parseFloat(c.preco || c.valor || 0) || 0), 0).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-600">Valor Total</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
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
                          <TableCell className="text-green-600 font-medium">R$ {parseFloat(complemento.preco || complemento.valor || 0).toLocaleString('pt-BR')}</TableCell>
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

        <TabsContent value="documentos" className="space-y-6">
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
                <div className="space-y-6">
                  {/* Resumo do relatório de manutenção */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{relatorioManutencao.estatisticas.total_gruas_analisadas}</p>
                          <p className="text-sm text-gray-600">Gruas Analisadas</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">{relatorioManutencao.estatisticas.manutencoes_alta_prioridade}</p>
                          <p className="text-sm text-gray-600">Alta Prioridade</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">{relatorioManutencao.estatisticas.manutencoes_media_prioridade}</p>
                          <p className="text-sm text-gray-600">Média Prioridade</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">R$ {relatorioManutencao.estatisticas.valor_total_estimado.toLocaleString('pt-BR')}</p>
                          <p className="text-sm text-gray-600">Valor Estimado</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tabela de manutenções */}
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

                  {/* Gráficos de Análise de Manutenção */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Gráfico de Pizza - Distribuição por Prioridade */}
                    <Card>
                      <CardHeader>
                        <CardTitle>🥧 Distribuição por Prioridade</CardTitle>
                        <CardDescription>
                          Manutenções classificadas por nível de prioridade
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsPieChart>
                            <Pie
                              data={(() => {
                                const prioridades = relatorioManutencao.relatorio.reduce((acc, item) => {
                                  const prior = item.manutencao.prioridade
                                  acc[prior] = (acc[prior] || 0) + 1
                                  return acc
                                }, {} as Record<string, number>)
                                
                                return Object.entries(prioridades).map(([name, value]) => ({
                                  name,
                                  value
                                }))
                              })()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {(() => {
                                const prioridades = relatorioManutencao.relatorio.reduce((acc, item) => {
                                  const prior = item.manutencao.prioridade
                                  acc[prior] = (acc[prior] || 0) + 1
                                  return acc
                                }, {} as Record<string, number>)
                                
                                return Object.entries(prioridades).map(([name], index) => (
                                  <Cell key={`cell-${index}`} fill={
                                    name === 'Alta' ? '#ef4444' : 
                                    name === 'Média' ? '#f59e0b' : '#10b981'
                                  } />
                                ))
                              })()}
                            </Pie>
                            <RechartsTooltip formatter={(value: number) => [`${value} manutenções`, '']} />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Gráfico de Barras - Custo Estimado por Grua */}
                    <Card>
                      <CardHeader>
                        <CardTitle>💰 Custo Estimado por Grua - Top 10</CardTitle>
                        <CardDescription>
                          Gruas com maior custo estimado de manutenção
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsBarChart 
                            data={relatorioManutencao.relatorio
                              .sort((a, b) => b.manutencao.valor_estimado - a.manutencao.valor_estimado)
                              .slice(0, 10)
                              .map(item => ({
                                grua: item.grua.modelo.substring(0, 15),
                                valor: Number((item.manutencao.valor_estimado / 1000).toFixed(1))
                              }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="grua" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <RechartsTooltip formatter={(value: number) => [`R$ ${(value * 1000).toLocaleString('pt-BR')}`, 'Custo Estimado']} />
                            <Legend />
                            <Bar dataKey="valor" fill="#f59e0b" name="Custo (R$ mil)" />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
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