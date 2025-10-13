"use client"

import { useState, useEffect } from "react"
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

export default function RelatoriosPage() {
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
  
  // Estados para paginação
  const [paginaUtilizacao, setPaginaUtilizacao] = useState(1)
  const [paginaFinanceiro, setPaginaFinanceiro] = useState(1)
  const [limitePorPagina, setLimitePorPagina] = useState(10)

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados()
  }, [])

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

    return {
      dataInicio: format(dataInicio, 'yyyy-MM-dd'),
      dataFim: format(dataFim, 'yyyy-MM-dd')
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
                  {/* TODO: Carregar obras do backend */}
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

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="gruas">Gruas</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="documentos">Manutenção</TabsTrigger>
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
          {/* Botão para carregar relatório de utilização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Relatório de Utilização de Gruas
              </CardTitle>
              <CardDescription>
                Análise de performance e utilização das gruas no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Button onClick={() => carregarRelatorioUtilizacao(1)} disabled={loading}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Carregar Relatório
                </Button>
                <Button variant="outline" onClick={() => handleExport('utilizacao')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
              
              {relatorioUtilizacao ? (
                <div className="space-y-6">
                  {/* Resumo do relatório */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{relatorioUtilizacao.totais.total_gruas}</p>
                          <p className="text-sm text-gray-600">Total de Gruas</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{(relatorioUtilizacao.totais.taxa_utilizacao_media || 0).toFixed(1)}%</p>
                          <p className="text-sm text-gray-600">Taxa Média</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">R$ {relatorioUtilizacao.totais.receita_total_periodo.toLocaleString('pt-BR')}</p>
                          <p className="text-sm text-gray-600">Receita Total</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{relatorioUtilizacao.totais.dias_total_locacao}</p>
                          <p className="text-sm text-gray-600">Dias de Locação</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tabela de performance */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grua</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Locações</TableHead>
                        <TableHead>Dias Total</TableHead>
                        <TableHead>Receita</TableHead>
                        <TableHead>Obras</TableHead>
                        <TableHead>Taxa Utilização</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorioUtilizacao.relatorio.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.grua.modelo} - {item.grua.fabricante}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.grua.tipo}</Badge>
                          </TableCell>
                          <TableCell>{item.total_locacoes}</TableCell>
                          <TableCell>{item.dias_total_locacao}</TableCell>
                          <TableCell>R$ {item.receita_total.toLocaleString('pt-BR')}</TableCell>
                          <TableCell>{item.obras_visitadas}</TableCell>
                          <TableCell>
                            <Badge className={item.taxa_utilizacao >= 80 ? 'bg-green-100 text-green-800' : 
                                             item.taxa_utilizacao >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                                             'bg-red-100 text-red-800'}>
                              {(item.taxa_utilizacao || 0).toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Controles de paginação */}
                  {relatorioUtilizacao.paginacao && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {((paginaUtilizacao - 1) * limitePorPagina) + 1} a {Math.min(paginaUtilizacao * limitePorPagina, relatorioUtilizacao.paginacao.total)} de {relatorioUtilizacao.paginacao.total} resultados
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={irParaPaginaAnteriorUtilizacao}
                          disabled={paginaUtilizacao <= 1}
                        >
                          Anterior
                        </Button>
                        <span className="text-sm text-gray-600">
                          Página {paginaUtilizacao} de {relatorioUtilizacao.paginacao.pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={irParaProximaPaginaUtilizacao}
                          disabled={paginaUtilizacao >= relatorioUtilizacao.paginacao.pages}
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Gráficos de Análise de Utilização */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Gráfico de Barras - Taxa de Utilização Top 10 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>📊 Taxa de Utilização - Top 10</CardTitle>
                        <CardDescription>
                          Gruas com maior taxa de utilização
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsBarChart 
                            data={relatorioUtilizacao.relatorio
                              .sort((a, b) => (b.taxa_utilizacao || 0) - (a.taxa_utilizacao || 0))
                              .slice(0, 10)
                              .map(item => ({
                                grua: item.grua.modelo.substring(0, 15),
                                taxa: Number((item.taxa_utilizacao || 0).toFixed(1))
                              }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="grua" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <RechartsTooltip formatter={(value: number) => [`${value}%`, 'Taxa de Utilização']} />
                            <Legend />
                            <Bar dataKey="taxa" fill="#10b981" name="Taxa de Utilização (%)" />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Gráfico de Barras - Receita por Grua Top 10 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>💰 Receita por Grua - Top 10</CardTitle>
                        <CardDescription>
                          Gruas que mais geraram receita
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsBarChart 
                            data={relatorioUtilizacao.relatorio
                              .sort((a, b) => b.receita_total - a.receita_total)
                              .slice(0, 10)
                              .map(item => ({
                                grua: item.grua.modelo.substring(0, 15),
                                receita: Number((item.receita_total / 1000).toFixed(1))
                              }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="grua" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <RechartsTooltip formatter={(value: number) => [`R$ ${(value * 1000).toLocaleString('pt-BR')}`, 'Receita']} />
                            <Legend />
                            <Bar dataKey="receita" fill="#3b82f6" name="Receita (R$ mil)" />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Clique em "Carregar Relatório" para ver a análise de utilização das gruas</p>
                </div>
              )}
            </CardContent>
          </Card>
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
              <div className="flex gap-4 mb-6">
                <Button onClick={() => carregarRelatorioFinanceiro(1)} disabled={loading}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Carregar Relatório
                </Button>
                <Button variant="outline" onClick={() => handleExport('financeiro')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
              
              {relatorioFinanceiro ? (
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
                  <p>Clique em "Carregar Relatório" para ver a análise financeira</p>
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
              <div className="flex gap-4 mb-6">
                <Button onClick={carregarRelatorioManutencao} disabled={loading}>
                  <Wrench className="w-4 h-4 mr-2" />
                  Carregar Relatório
                </Button>
                <Button variant="outline" onClick={() => handleExport('manutencao')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
              
              {relatorioManutencao ? (
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
                  <p>Clique em "Carregar Relatório" para ver a análise de manutenções</p>
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