"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  BarChart3,
  RefreshCw,
  Filter,
  Loader2
} from "lucide-react"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { apiJustificativas } from "@/lib/api-ponto-eletronico"
import AdminGuard from "@/components/admin-guard"

interface RelatorioMensal {
  periodo: {
    mes: number
    ano: number
    data_inicio: string
    data_fim: string
  }
  resumo: {
    total_justificativas: number
    por_status: Record<string, number>
    por_tipo: Record<string, number>
    por_funcionario: Array<{
      funcionario_id: number
      nome: string
      total_justificativas: number
      por_status: Record<string, number>
      por_tipo: Record<string, number>
    }>
    tendencia_mensal: {
      crescimento: number
      comparacao_mes_anterior: string
    }
  }
  justificativas: any[]
}

interface RelatorioPeriodo {
  periodo: {
    data_inicio: string
    data_fim: string
    dias_uteis: number
    dias_totais: number
  }
  resumo: {
    total_justificativas: number
    media_diaria: string
    por_status: Record<string, number>
    por_tipo: Record<string, number>
    taxa_aprovacao: number
    funcionarios_com_justificativas: number
  }
  agrupamento: any
  justificativas: any[]
}

interface RelatorioEstatisticas {
  periodo: {
    data_inicio: string
    data_fim: string
  }
  estatisticas: {
    total_justificativas: number
    media_mensal: string
    tendencia: {
      crescimento_percentual: number
      comparacao_mes_anterior: string
    }
    distribuicao: {
      por_status: Record<string, number>
      por_tipo: Record<string, number>
      por_dia_semana: Record<string, number>
    }
    funcionarios: {
      total_com_justificativas: number
      maior_frequencia: {
        funcionario_id: number
        nome: string
        total_justificativas: number
      } | null
      media_por_funcionario: string
    }
    tempo_medio_aprovacao: {
      horas: number
      dias: number
    }
  }
}

const CORES = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export default function RelatoriosJustificativasPage() {
  const { toast } = useToast()
  
  // Estados dos filtros
  const [tipoRelatorio, setTipoRelatorio] = useState<'mensal' | 'periodo' | 'estatisticas'>('mensal')
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<string>('todos')
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos')
  const [periodoEstatisticas, setPeriodoEstatisticas] = useState<'ultimo_mes' | 'ultimos_3_meses' | 'ultimo_ano'>('ultimo_mes')
  const [agruparPor, setAgruparPor] = useState<string>('nenhum')

  // Estados dos dados
  const [loading, setLoading] = useState(false)
  const [relatorioMensal, setRelatorioMensal] = useState<RelatorioMensal | null>(null)
  const [relatorioPeriodo, setRelatorioPeriodo] = useState<RelatorioPeriodo | null>(null)
  const [relatorioEstatisticas, setRelatorioEstatisticas] = useState<RelatorioEstatisticas | null>(null)

  useEffect(() => {
    carregarRelatorio()
  }, [tipoRelatorio])

  const carregarRelatorio = async () => {
    try {
      setLoading(true)

      if (tipoRelatorio === 'mensal') {
        const params: any = { mes, ano }
        if (statusFiltro && statusFiltro !== 'todos') params.status = statusFiltro
        if (tipoFiltro && tipoFiltro !== 'todos') params.tipo = tipoFiltro

        const response = await apiJustificativas.relatorioMensal(params)
        setRelatorioMensal(response)
      } else if (tipoRelatorio === 'periodo') {
        if (!dataInicio || !dataFim) {
          toast({
            title: "Aviso",
            description: "Selecione data de início e fim",
            variant: "default"
          })
          return
        }

        const params: any = { data_inicio: dataInicio, data_fim: dataFim }
        if (statusFiltro && statusFiltro !== 'todos') params.status = statusFiltro
        if (tipoFiltro && tipoFiltro !== 'todos') params.tipo = tipoFiltro
        if (agruparPor && agruparPor !== 'nenhum') params.agrupar_por = agruparPor

        const response = await apiJustificativas.relatorioPeriodo(params)
        setRelatorioPeriodo(response)
      } else if (tipoRelatorio === 'estatisticas') {
        const response = await apiJustificativas.relatorioEstatisticas({
          periodo: periodoEstatisticas
        })
        setRelatorioEstatisticas(response)
      }

      toast({
        title: "Sucesso",
        description: "Relatório carregado com sucesso",
        variant: "default"
      })
    } catch (error) {
      console.error("Erro ao carregar relatório:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar relatório",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const exportarRelatorio = () => {
    let dados: any = null
    let filename = ''

    if (tipoRelatorio === 'mensal' && relatorioMensal) {
      dados = relatorioMensal
      filename = `relatorio-justificativas-${mes}-${ano}.json`
    } else if (tipoRelatorio === 'periodo' && relatorioPeriodo) {
      dados = relatorioPeriodo
      filename = `relatorio-justificativas-periodo.json`
    } else if (tipoRelatorio === 'estatisticas' && relatorioEstatisticas) {
      dados = relatorioEstatisticas
      filename = `relatorio-justificativas-estatisticas.json`
    }

    if (dados) {
      const dataStr = JSON.stringify(dados, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)

      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso",
        variant: "default"
      })
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      'Pendente': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      'Aprovada': { color: 'bg-green-100 text-green-800', label: 'Aprovada' },
      'Rejeitada': { color: 'bg-red-100 text-red-800', label: 'Rejeitada' }
    }
    const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', label: status }
    return <Badge className={badge.color}>{badge.label}</Badge>
  }

  const prepararDadosGraficoStatus = (porStatus: Record<string, number>) => {
    return Object.entries(porStatus).map(([status, total]) => ({
      name: status,
      value: total
    }))
  }

  const prepararDadosGraficoTipo = (porTipo: Record<string, number>) => {
    return Object.entries(porTipo).map(([tipo, total]) => ({
      name: tipo,
      value: total
    }))
  }

  const prepararDadosGraficoDiaSemana = (porDiaSemana: Record<string, number>) => {
    const ordem = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
    return ordem.map(dia => ({
      dia,
      total: porDiaSemana[dia] || 0
    }))
  }

  return (
    <AdminGuard>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Relatórios de Justificativas</h1>
            <p className="text-gray-600">Análises e estatísticas de justificativas de ponto</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={carregarRelatorio}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={exportarRelatorio}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Tabs de tipo de relatório */}
        <Tabs value={tipoRelatorio} onValueChange={(v) => setTipoRelatorio(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mensal">
              <Calendar className="w-4 h-4 mr-2" />
              Mensal
            </TabsTrigger>
            <TabsTrigger value="periodo">
              <BarChart3 className="w-4 h-4 mr-2" />
              Por Período
            </TabsTrigger>
            <TabsTrigger value="estatisticas">
              <TrendingUp className="w-4 h-4 mr-2" />
              Estatísticas
            </TabsTrigger>
          </TabsList>

          {/* Relatório Mensal */}
          <TabsContent value="mensal" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label>Mês</Label>
                    <Select value={mes.toString()} onValueChange={(v) => setMes(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <SelectItem key={m} value={m.toString()}>
                            {new Date(2024, m - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Ano</Label>
                    <Select value={ano.toString()} onValueChange={(v) => setAno(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Aprovada">Aprovada</SelectItem>
                        <SelectItem value="Rejeitada">Rejeitada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tipo</Label>
                    <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="Atraso">Atraso</SelectItem>
                        <SelectItem value="Falta">Falta</SelectItem>
                        <SelectItem value="Saída Antecipada">Saída Antecipada</SelectItem>
                        <SelectItem value="Ausência Parcial">Ausência Parcial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button onClick={carregarRelatorio} className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                      Gerar Relatório
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards de Estatísticas */}
            {relatorioMensal && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="text-2xl font-bold">{relatorioMensal.resumo.total_justificativas}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Pendentes</p>
                          <p className="text-2xl font-bold">{relatorioMensal.resumo.por_status['Pendente'] || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Aprovadas</p>
                          <p className="text-2xl font-bold">{relatorioMensal.resumo.por_status['Aprovada'] || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${relatorioMensal.resumo.tendencia_mensal.crescimento >= 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                          {relatorioMensal.resumo.tendencia_mensal.crescimento >= 0 
                            ? <TrendingUp className="w-5 h-5 text-red-600" />
                            : <TrendingDown className="w-5 h-5 text-green-600" />
                          }
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tendência</p>
                          <p className="text-2xl font-bold">{relatorioMensal.resumo.tendencia_mensal.crescimento}%</p>
                          <p className="text-xs text-gray-500">{relatorioMensal.resumo.tendencia_mensal.comparacao_mes_anterior}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={prepararDadosGraficoStatus(relatorioMensal.resumo.por_status)}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {prepararDadosGraficoStatus(relatorioMensal.resumo.por_status).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Tipo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={prepararDadosGraficoTipo(relatorioMensal.resumo.por_tipo)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="value" fill="#3B82F6" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Funcionários */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Funcionários com Justificativas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Funcionário</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Pendentes</TableHead>
                          <TableHead>Aprovadas</TableHead>
                          <TableHead>Rejeitadas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relatorioMensal.resumo.por_funcionario
                          .sort((a, b) => b.total_justificativas - a.total_justificativas)
                          .slice(0, 10)
                          .map((func) => (
                            <TableRow key={func.funcionario_id}>
                              <TableCell className="font-medium">{func.nome}</TableCell>
                              <TableCell>{func.total_justificativas}</TableCell>
                              <TableCell>{func.por_status['Pendente'] || 0}</TableCell>
                              <TableCell>{func.por_status['Aprovada'] || 0}</TableCell>
                              <TableCell>{func.por_status['Rejeitada'] || 0}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Relatório por Período */}
          <TabsContent value="periodo" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Aprovada">Aprovada</SelectItem>
                        <SelectItem value="Rejeitada">Rejeitada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tipo</Label>
                    <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="Atraso">Atraso</SelectItem>
                        <SelectItem value="Falta">Falta</SelectItem>
                        <SelectItem value="Saída Antecipada">Saída Antecipada</SelectItem>
                        <SelectItem value="Ausência Parcial">Ausência Parcial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Agrupar Por</Label>
                    <Select value={agruparPor} onValueChange={setAgruparPor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhum">Nenhum</SelectItem>
                        <SelectItem value="funcionario">Funcionário</SelectItem>
                        <SelectItem value="tipo">Tipo</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="dia">Dia</SelectItem>
                        <SelectItem value="semana">Semana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button onClick={carregarRelatorio} className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                      Gerar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards de Estatísticas */}
            {relatorioPeriodo && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="text-2xl font-bold">{relatorioPeriodo.resumo.total_justificativas}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Média Diária</p>
                          <p className="text-2xl font-bold">{relatorioPeriodo.resumo.media_diaria}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Taxa Aprovação</p>
                          <p className="text-2xl font-bold">{relatorioPeriodo.resumo.taxa_aprovacao.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Users className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Funcionários</p>
                          <p className="text-2xl font-bold">{relatorioPeriodo.resumo.funcionarios_com_justificativas}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Período */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Data Início</p>
                        <p className="font-medium">{formatarData(relatorioPeriodo.periodo.data_inicio)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Data Fim</p>
                        <p className="font-medium">{formatarData(relatorioPeriodo.periodo.data_fim)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Dias Úteis</p>
                        <p className="font-medium">{relatorioPeriodo.periodo.dias_uteis} dias</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Dias Totais</p>
                        <p className="font-medium">{relatorioPeriodo.periodo.dias_totais} dias</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gráficos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={prepararDadosGraficoStatus(relatorioPeriodo.resumo.por_status)}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {prepararDadosGraficoStatus(relatorioPeriodo.resumo.por_status).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Tipo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={prepararDadosGraficoTipo(relatorioPeriodo.resumo.por_tipo)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="value" fill="#10B981" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Estatísticas */}
          <TabsContent value="estatisticas" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Período</Label>
                    <Select value={periodoEstatisticas} onValueChange={(v) => setPeriodoEstatisticas(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ultimo_mes">Último Mês</SelectItem>
                        <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
                        <SelectItem value="ultimo_ano">Último Ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button onClick={carregarRelatorio} className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                      Gerar Estatísticas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards de Estatísticas */}
            {relatorioEstatisticas && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="text-2xl font-bold">{relatorioEstatisticas.estatisticas.total_justificativas}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Média Mensal</p>
                          <p className="text-2xl font-bold">{relatorioEstatisticas.estatisticas.media_mensal}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Clock className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tempo Médio Aprovação</p>
                          <p className="text-2xl font-bold">{relatorioEstatisticas.estatisticas.tempo_medio_aprovacao.horas.toFixed(1)}h</p>
                          <p className="text-xs text-gray-500">{relatorioEstatisticas.estatisticas.tempo_medio_aprovacao.dias.toFixed(1)} dias</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Users className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Funcionários</p>
                          <p className="text-2xl font-bold">{relatorioEstatisticas.estatisticas.funcionarios.total_com_justificativas}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Funcionário com maior frequência */}
                {relatorioEstatisticas.estatisticas.funcionarios.maior_frequencia && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Funcionário com Maior Frequência</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-red-100 rounded-lg">
                          <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-lg">{relatorioEstatisticas.estatisticas.funcionarios.maior_frequencia.nome}</p>
                          <p className="text-2xl font-bold text-red-600">
                            {relatorioEstatisticas.estatisticas.funcionarios.maior_frequencia.total_justificativas} justificativas
                          </p>
                          <p className="text-sm text-gray-600">
                            Média por funcionário: {relatorioEstatisticas.estatisticas.funcionarios.media_por_funcionario}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Gráficos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Dia da Semana</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={prepararDadosGraficoDiaSemana(relatorioEstatisticas.estatisticas.distribuicao.por_dia_semana)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="dia" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="total" fill="#8B5CF6" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={prepararDadosGraficoStatus(relatorioEstatisticas.estatisticas.distribuicao.por_status)}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {prepararDadosGraficoStatus(relatorioEstatisticas.estatisticas.distribuicao.por_status).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={prepararDadosGraficoTipo(relatorioEstatisticas.estatisticas.distribuicao.por_tipo)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="value" fill="#F59E0B" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminGuard>
  )
}

