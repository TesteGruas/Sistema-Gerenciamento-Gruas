"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getFinancialData, createTransferencia, getVendas, type FinancialData, type Transferencia, type Venda } from "@/lib/api-financial"
import { medicoesApi, type Medicao } from "@/lib/api-medicoes"
import { receitasApi, type Receita } from "@/lib/api-receitas"
import { custosApi, type Custo } from "@/lib/api-custos"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { 
  DollarSign, 
  Plus, 
  Search, 
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  PieChart as PieChartIcon,
  BarChart3,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Banknote,
  Receipt,
  ShoppingCart,
  Truck,
  Calculator,
  FileSpreadsheet,
  Printer,
  Users,
  Package,
  Settings,
  FileBarChart,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Filter,
  MoreHorizontal
} from "lucide-react"
import { ExportButton } from "@/components/export-button"
import { Loading, PageLoading, TableLoading, CardLoading, useLoading } from "@/components/ui/loading"

// Interfaces já importadas do api-financial.ts

// Dados financeiros serão carregados da API

// Cores para gráficos
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const financeiroModules = [
  {
    id: 'vendas',
    title: 'Vendas',
    icon: Receipt,
    color: 'bg-green-500',
    description: 'Gestão de vendas, contratos e orçamentos',
    submodules: [
      { name: 'Orçamentos', href: '/dashboard/financeiro/orcamentos' },
      { name: 'Vendas e Orçamentos', href: '/dashboard/financeiro/vendas' }
    ]
  },
  {
    id: 'compras',
    title: 'Compras',
    icon: ShoppingCart,
    color: 'bg-blue-500',
    description: 'Gestão de compras e fornecedores',
    submodules: [
      { name: 'Gestão de Compras', href: '/dashboard/financeiro/compras' }
    ]
  },
  {
    id: 'locacoes',
    title: 'Locações',
    icon: Truck,
    color: 'bg-purple-500',
    description: 'Gestão de locações de gruas e plataformas',
    submodules: [
      { name: 'Gestão de Locações', href: '/dashboard/financeiro/locacoes' }
    ]
  },
  {
    id: 'alugueis',
    title: 'Aluguéis de Residências',
    icon: Building2,
    color: 'bg-indigo-500',
    description: 'Gestão de residências e aluguéis para funcionários',
    submodules: [
      { name: 'Gestão de Aluguéis', href: '/dashboard/financeiro/alugueis' }
    ]
  },
  {
    id: 'impostos',
    title: 'Impostos',
    icon: Calculator,
    color: 'bg-orange-500',
    description: 'Gestão de impostos e tributos',
    submodules: [
      { name: 'Gestão de Impostos', href: '/dashboard/financeiro/impostos' }
    ]
  },
  {
    id: 'logistica',
    title: 'Logística de Equipamentos',
    icon: Package,
    color: 'bg-indigo-500',
    description: 'Gestão logística e transporte',
    submodules: [
      { name: 'Gestão Logística', href: '/dashboard/financeiro/logistica' }
    ]
  },
  {
    id: 'cadastro',
    title: 'Cadastro',
    icon: Users,
    color: 'bg-teal-500',
    description: 'Cadastros gerais do sistema',
    submodules: [
      { name: 'Cadastros Gerais', href: '/dashboard/financeiro/cadastro' }
    ]
  },
  {
    id: 'relatorios',
    title: 'Relatórios',
    icon: FileBarChart,
    color: 'bg-red-500',
    description: 'Relatórios e análises financeiras',
    submodules: [
      { name: 'Relatórios Gerais', href: '/dashboard/financeiro/relatorios' }
    ]
  }
]

export default function FinanceiroPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [financialData, setFinancialData] = useState<FinancialData>({
    receberHoje: 0,
    pagarHoje: 0,
    recebimentosAtraso: 0,
    pagamentosAtraso: 0,
    saldoAtual: 0,
    fluxoCaixa: [],
    transferencias: []
  })

  // Função para carregar dados financeiros da API
  const loadFinancialData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔄 Carregando dados financeiros...')
      
      const data = await getFinancialData()
      setFinancialData(data)
      setLastUpdated(new Date())
      
      console.log('✅ Dados financeiros carregados:', data)
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados financeiros:', error)
      setError(error.message || 'Erro ao carregar dados financeiros')
    } finally {
      setIsLoading(false)
    }
  }

  const [selectedPeriod, setSelectedPeriod] = useState('mes')
  const [fluxoCaixaDiario, setFluxoCaixaDiario] = useState<any[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [medicoes, setMedicoes] = useState<Medicao[]>([])
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [custos, setCustos] = useState<Custo[]>([])

  // Função para carregar vendas
  const loadVendas = async () => {
    try {
      const data = await getVendas()
      setVendas(data)
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
    }
  }

  // Função para carregar medições
  const loadMedicoes = async () => {
    try {
      const data = await medicoesApi.list()
      setMedicoes(data.medicoes || [])
    } catch (error) {
      console.error('Erro ao carregar medições:', error)
    }
  }

  // Função para carregar receitas
  const loadReceitas = async () => {
    try {
      const data = await receitasApi.list()
      setReceitas(data.receitas || [])
    } catch (error) {
      console.error('Erro ao carregar receitas:', error)
    }
  }

  // Função para carregar custos
  const loadCustos = async () => {
    try {
      const data = await custosApi.list({ page: 1, limit: 100 })
      setCustos(data.custos || [])
    } catch (error) {
      console.error('Erro ao carregar custos:', error)
    }
  }

  // Função para carregar fluxo de caixa diário
  const loadDailyCashFlow = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'
      const token = localStorage.getItem('access_token')
      
      if (!token) return
      
      let url = `${apiUrl}/api/financial-data`
      
      // Adicionar parâmetros de período
      if (selectedPeriod === 'hoje') {
        url += '?periodo=hoje'
      } else if (selectedPeriod === 'semana') {
        url += '?periodo=semana'
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.data?.fluxoCaixa) {
          setFluxoCaixaDiario(data.data.fluxoCaixa)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar fluxo de caixa diário:', error)
    }
  }

  // Carregar dados quando o componente for montado ou quando o período mudar
  useEffect(() => {
    loadFinancialData()
    loadVendas()
    loadMedicoes()
    loadReceitas()
    loadCustos()
    if (selectedPeriod === 'hoje' || selectedPeriod === 'semana') {
      loadDailyCashFlow()
    }
  }, [selectedPeriod])

  const stats = [
    { 
      title: "A Receber Hoje", 
      value: `R$ ${financialData.receberHoje.toLocaleString('pt-BR')}`, 
      icon: ArrowUpRight, 
      color: "bg-green-500",
      change: "Carregando..."
    },
    { 
      title: "A Pagar Hoje", 
      value: `R$ ${financialData.pagarHoje.toLocaleString('pt-BR')}`, 
      icon: ArrowDownLeft, 
      color: "bg-red-500",
      change: "Carregando..."
    },
    { 
      title: "Recebimentos em Atraso", 
      value: `R$ ${financialData.recebimentosAtraso.toLocaleString('pt-BR')}`, 
      icon: AlertTriangle, 
      color: "bg-orange-500",
      change: "Carregando..."
    },
    { 
      title: "Pagamentos em Atraso", 
      value: `R$ ${financialData.pagamentosAtraso.toLocaleString('pt-BR')}`, 
      icon: Clock, 
      color: "bg-yellow-500",
      change: "Carregando..."
    },
    { 
      title: "Saldo Atual", 
      value: `R$ ${financialData.saldoAtual.toLocaleString('pt-BR')}`, 
      icon: Banknote, 
      color: "bg-blue-500",
      change: "Carregando..."
    }
  ]

  const handleExport = (type: string) => {
    console.log(`Exportando ${type}`)
    // Implementar lógica de exportação
  }

  const handleImport = () => {
    console.log('Importando planilha')
    // Implementar lógica de importação
  }

  const handlePrint = () => {
    window.print()
  }

  // Mostrar loading enquanto carrega os dados
  if (isLoading) {
    return (
      <ProtectedRoute permission="financeiro:visualizar">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div className="text-lg font-medium">Carregando dados financeiros...</div>
            <div className="text-sm text-gray-500">Aguarde enquanto buscamos as informações mais recentes</div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Mostrar erro se houver problema no carregamento
  if (error) {
    return (
      <ProtectedRoute permission="financeiro:visualizar">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-6xl">⚠️</div>
            <div className="text-lg font-medium text-red-600">Erro ao carregar dados</div>
            <div className="text-sm text-gray-500">{error}</div>
            <Button onClick={loadFinancialData} className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute permission="financeiro:visualizar">
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sistema Financeiro</h1>
            <p className="text-gray-600">Controle manual de entradas, saídas e saldo</p>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                Última atualização: {lastUpdated.toLocaleString('pt-BR')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadFinancialData}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <Search className="w-4 h-4" />
              )}
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsTransferDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Entrada/Saída
              </Button>
              <ExportButton
                dados={financialData.fluxoCaixa}
                tipo="financeiro"
                nomeArquivo="relatorio-financeiro"
                titulo="Relatório Financeiro"
                filtros={{ periodo: selectedPeriod }}
              />
              <Button variant="outline" onClick={handleImport}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Importar
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <div className="text-lg font-medium">Carregando dados financeiros...</div>
                <div className="text-sm text-gray-500">Aguarde enquanto buscamos as informações mais recentes</div>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="text-red-500 text-6xl">⚠️</div>
                <div className="text-lg font-medium text-red-600">Erro ao carregar dados</div>
                <div className="text-sm text-gray-500">{error}</div>
                <Button onClick={loadFinancialData} className="mt-4">
                  Tentar Novamente
                </Button>
              </div>
            </div>
          ) : (
            <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.color}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Seletor de Período */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Filtrar por Período
                </CardTitle>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="semana">Esta Semana</SelectItem>
                    <SelectItem value="mes">Últimos 6 Meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          {/* Tabs de Gráficos */}
          <Tabs defaultValue="fluxo-caixa" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="fluxo-caixa">Fluxo de Caixa</TabsTrigger>
              <TabsTrigger value="vendas">Vendas</TabsTrigger>
              <TabsTrigger value="medicoes">Medições</TabsTrigger>
              <TabsTrigger value="receitas-custos">Receitas & Custos</TabsTrigger>
            </TabsList>

            {/* Tab Fluxo de Caixa */}
            <TabsContent value="fluxo-caixa" className="space-y-2.5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Fluxo de Caixa {selectedPeriod === 'mes' ? 'Mensal' : selectedPeriod === 'semana' ? 'Semanal' : 'Diário'}
                </CardTitle>
                <CardDescription>
                  {selectedPeriod === 'mes' && 'Entradas e saídas por mês'}
                  {selectedPeriod === 'semana' && 'Entradas e saídas por dia da semana'}
                  {selectedPeriod === 'hoje' && 'Entradas e saídas do dia'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {((selectedPeriod === 'hoje' || selectedPeriod === 'semana') && fluxoCaixaDiario.length > 0 ? fluxoCaixaDiario : financialData.fluxoCaixa).length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={(selectedPeriod === 'hoje' || selectedPeriod === 'semana') && fluxoCaixaDiario.length > 0 ? fluxoCaixaDiario : financialData.fluxoCaixa}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={selectedPeriod === 'hoje' ? 'dia' : selectedPeriod === 'semana' ? 'dia' : 'mes'} />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      />
                      <Legend />
                      <Bar dataKey="entrada" fill="#10b981" name="Entradas" />
                      <Bar dataKey="saida" fill="#ef4444" name="Saídas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>Nenhum dado de fluxo de caixa disponível</p>
                    <p className="text-sm">Os dados serão carregados quando disponíveis</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Evolução Financeira
                </CardTitle>
                <CardDescription>Tendência de entradas e saídas</CardDescription>
              </CardHeader>
              <CardContent>
                {financialData.fluxoCaixa.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={financialData.fluxoCaixa}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="entrada" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Entradas"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="saida" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Saídas"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Movimentações Financeiras
                </CardTitle>
                <CardDescription>Últimas entradas e saídas registradas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {financialData.transferencias.length > 0 ? (
                    financialData.transferencias.map((transfer) => (
                      <div key={transfer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${transfer.tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div>
                            <p className="text-sm font-medium">{transfer.descricao}</p>
                            <p className="text-xs text-gray-500">{new Date(transfer.data).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${transfer.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {transfer.tipo === 'entrada' ? '+' : '-'}R$ {transfer.valor.toLocaleString('pt-BR')}
                          </p>
                          <Badge variant={transfer.status === 'confirmada' ? 'default' : 'secondary'}>
                            {transfer.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p>Nenhuma movimentação registrada</p>
                      <p className="text-sm">As entradas e saídas aparecerão aqui quando registradas</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
              </div>
            </TabsContent>

            {/* Tab Vendas */}
            <TabsContent value="vendas" className="space-y-2.5">
              {vendas.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Vendas por Mês
                      </CardTitle>
                      <CardDescription>Distribuição de vendas mensais</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={(() => {
                          const vendasPorMes = vendas.reduce((acc: any, venda) => {
                            const mes = new Date(venda.data_venda).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
                            const existing = acc.find((item: any) => item.mes === mes)
                            if (existing) {
                              existing.valor += Number(venda.valor_total)
                              existing.quantidade += 1
                            } else {
                              acc.push({ mes, valor: Number(venda.valor_total), quantidade: 1 })
                            }
                            return acc
                          }, [])
                          return vendasPorMes.slice(-6)
                        })()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number, name: string) => {
                              if (name === 'valor') return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor Total']
                              return [value, 'Quantidade']
                            }}
                          />
                          <Legend />
                          <Bar dataKey="valor" fill="#10b981" name="Valor (R$)" />
                          <Bar dataKey="quantidade" fill="#3b82f6" name="Quantidade" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Vendas por Status
                      </CardTitle>
                      <CardDescription>Distribuição por status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              const statusCount = vendas.reduce((acc: any, venda) => {
                                const status = venda.status
                                const existing = acc.find((item: any) => item.name === status)
                                if (existing) {
                                  existing.value += 1
                                } else {
                                  acc.push({ name: status, value: 1 })
                                }
                                return acc
                              }, [])
                              return statusCount
                            })()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {vendas.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Card informativo para preencher */}
                  <Card className="flex items-center justify-center">
                    <CardContent className="p-6 text-center">
                      <FileBarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <CardTitle className="text-lg mb-2">Análise de Vendas</CardTitle>
                      <CardDescription>
                        Visualize informações detalhadas sobre vendas, status e tendências
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>Nenhum dado de vendas disponível</p>
                </div>
              )}
            </TabsContent>

            {/* Tab Medições */}
            <TabsContent value="medicoes" className="space-y-2.5">
              {medicoes.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Medições por Período
                      </CardTitle>
                      <CardDescription>Valor total das medições por mês</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={(() => {
                          const medicoesPorPeriodo = medicoes
                            .filter(m => m.status === 'finalizada')
                            .reduce((acc: any, medicao) => {
                              const periodo = medicao.periodo
                              const existing = acc.find((item: any) => item.periodo === periodo)
                              if (existing) {
                                existing.valor += Number(medicao.valor_total)
                              } else {
                                acc.push({ periodo, valor: Number(medicao.valor_total) })
                              }
                              return acc
                            }, [])
                          return medicoesPorPeriodo.slice(-6)
                        })()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periodo" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          />
                          <Legend />
                          <Bar dataKey="valor" fill="#3b82f6" name="Valor Total (R$)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Evolução das Medições
                      </CardTitle>
                      <CardDescription>Valor ao longo do tempo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={(() => {
                          const medicoesPorPeriodo = medicoes
                            .filter(m => m.status === 'finalizada')
                            .reduce((acc: any, medicao) => {
                              const periodo = medicao.periodo
                              const existing = acc.find((item: any) => item.periodo === periodo)
                              if (existing) {
                                existing.valor += Number(medicao.valor_total)
                              } else {
                                acc.push({ periodo, valor: Number(medicao.valor_total) })
                              }
                              return acc
                            }, [])
                          return medicoesPorPeriodo.slice(-6)
                        })()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periodo" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="valor" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            name="Valor (R$)"
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Card informativo para preencher */}
                  <Card className="flex items-center justify-center">
                    <CardContent className="p-6 text-center">
                      <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <CardTitle className="text-lg mb-2">Análise de Medições</CardTitle>
                      <CardDescription>
                        Acompanhe o desempenho das medições e sua evolução ao longo do tempo
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>Nenhum dado de medições disponível</p>
                </div>
              )}
            </TabsContent>

            {/* Tab Receitas & Custos */}
            <TabsContent value="receitas-custos" className="space-y-2.5">
              {/* Primeira linha: Receitas */}
              {receitas.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Evolução de Receitas
                      </CardTitle>
                      <CardDescription>Receitas ao longo dos últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={(() => {
                          const receitasPorMes = receitas
                            .filter(r => r.status === 'confirmada')
                            .reduce((acc: any, receita) => {
                              const mes = new Date(receita.data_receita).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
                              const existing = acc.find((item: any) => item.mes === mes)
                              if (existing) {
                                existing.valor += Number(receita.valor)
                              } else {
                                acc.push({ mes, valor: Number(receita.valor) })
                              }
                              return acc
                            }, [])
                          return receitasPorMes.slice(-6)
                        })()}>
                          <defs>
                            <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          />
                          <Area type="monotone" dataKey="valor" stroke="#10b981" fillOpacity={1} fill="url(#colorReceita)" name="Receitas" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5" />
                        Receitas por Tipo
                      </CardTitle>
                      <CardDescription>Distribuição por tipo de receita</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              const tipoCount = receitas
                                .filter(r => r.status === 'confirmada')
                                .reduce((acc: any, receita) => {
                                  const tipo = receita.tipo === 'locacao' ? 'Locação' : receita.tipo === 'servico' ? 'Serviço' : 'Venda'
                                  const existing = acc.find((item: any) => item.name === tipo)
                                  if (existing) {
                                    existing.value += Number(receita.valor)
                                  } else {
                                    acc.push({ name: tipo, value: Number(receita.valor) })
                                  }
                                  return acc
                                }, [])
                              return tipoCount
                            })()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {receitas.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Card informativo para preencher primeira linha */}
                  <Card className="flex items-center justify-center">
                    <CardContent className="p-6 text-center">
                      <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <CardTitle className="text-lg mb-2">Receitas</CardTitle>
                      <CardDescription>
                        Acompanhe a evolução e distribuição das receitas
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>Nenhum dado de receitas disponível</p>
                </div>
              )}

              {/* Segunda linha: Custos */}
              {custos.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Custos por Mês
                      </CardTitle>
                      <CardDescription>Distribuição de custos mensais</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={(() => {
                          const custosPorMes = custos
                            .filter(c => c.status === 'confirmado')
                            .reduce((acc: any, custo) => {
                              const mes = new Date(custo.data_custo).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
                              const existing = acc.find((item: any) => item.mes === mes)
                              if (existing) {
                                existing.valor += Number(custo.valor)
                              } else {
                                acc.push({ mes, valor: Number(custo.valor) })
                              }
                              return acc
                            }, [])
                          return custosPorMes.slice(-6)
                        })()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          />
                          <Legend />
                          <Bar dataKey="valor" fill="#ef4444" name="Custos (R$)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5" />
                        Custos por Tipo
                      </CardTitle>
                      <CardDescription>Distribuição por tipo de custo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              const tipoCount = custos
                                .filter(c => c.status === 'confirmado')
                                .reduce((acc: any, custo) => {
                                  const tipo = custo.tipo === 'salario' ? 'Salário' : 
                                             custo.tipo === 'material' ? 'Material' : 
                                             custo.tipo === 'servico' ? 'Serviço' : 'Manutenção'
                                  const existing = acc.find((item: any) => item.name === tipo)
                                  if (existing) {
                                    existing.value += Number(custo.valor)
                                  } else {
                                    acc.push({ name: tipo, value: Number(custo.valor) })
                                  }
                                  return acc
                                }, [])
                              return tipoCount
                            })()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {custos.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Card informativo para preencher segunda linha */}
                  <Card className="flex items-center justify-center">
                    <CardContent className="p-6 text-center">
                      <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <CardTitle className="text-lg mb-2">Custos</CardTitle>
                      <CardDescription>
                        Monitore os custos e sua distribuição por tipo
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>Nenhum dado de custos disponível</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Cadastro Rápido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Cadastro Rápido
              </CardTitle>
              <CardDescription>Registre rapidamente transações financeiras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => router.push('/dashboard/financeiro/orcamentos')}
                >
                  <Receipt className="w-6 h-6" />
                  <span className="text-sm">Orçamento</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                  <FileText className="w-6 h-6" />
                  <span className="text-sm">Venda</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                  <FileText className="w-6 h-6" />
                  <span className="text-sm">Contrato</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  <span className="text-sm">Compra</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  <span className="text-sm">Receita/Despesa</span>
                </Button>
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </TabsContent>

        {/* Módulos */}
        <TabsContent value="modules" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {financeiroModules.map((module) => (
              <Card key={module.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${module.color}`}>
                      <module.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {module.submodules.slice(0, 3).map((submodule, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 cursor-pointer transition-colors"
                        onClick={() => router.push(submodule.href)}
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span>{submodule.name}</span>
                      </div>
                    ))}
                    {module.submodules.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{module.submodules.length - 3} mais opções
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => {
                      // Navegação para os módulos específicos usando Next.js Router
                      if (module.id === 'vendas') {
                        router.push('/dashboard/financeiro/vendas')
                      } else if (module.id === 'compras') {
                        router.push('/dashboard/financeiro/compras')
                      } else if (module.id === 'locacoes') {
                        router.push('/dashboard/financeiro/locacoes')
                      } else if (module.id === 'alugueis') {
                        router.push('/dashboard/financeiro/alugueis')
                      } else if (module.id === 'impostos') {
                        router.push('/dashboard/financeiro/impostos')
                      } else if (module.id === 'logistica') {
                        router.push('/dashboard/financeiro/logistica')
                      } else if (module.id === 'cadastro') {
                        router.push('/dashboard/financeiro/cadastro')
                      } else if (module.id === 'relatorios') {
                        router.push('/dashboard/financeiro/relatorios')
                      }
                    }}
                  >
                    Acessar Módulo
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

      </Tabs>

      {/* Dialog de Registro de Entrada/Saída */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Entrada/Saída</DialogTitle>
            <DialogDescription>
              Registre manualmente uma entrada ou saída financeira
            </DialogDescription>
          </DialogHeader>
          <TransferForm onClose={() => setIsTransferDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialog de Exportação */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Exportar Dados
            </DialogTitle>
            <DialogDescription>
              Escolha o tipo de exportação desejada
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleExport('receber')}
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-6 h-6" />
                <span>Pagamentos a Receber</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleExport('pagar')}
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <ArrowDownLeft className="w-6 h-6" />
                <span>Pagamentos a Pagar</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleExport('completo')}
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-6 h-6" />
                <span>Relatório Completo</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleExport('transferencias')}
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <CreditCard className="w-6 h-6" />
                <span>Movimentações</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </ProtectedRoute>
  )
}

function TransferForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    valor: '',
    tipo: 'entrada',
    descricao: '',
    observacoes: '',
    documento: null as File | null
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTransferencia({
        data: formData.data,
        valor: parseFloat(formData.valor),
        tipo: formData.tipo as 'entrada' | 'saida',
        descricao: formData.descricao,
        documento_comprobatório: formData.documento?.name,
        status: 'confirmada'
      })
      onClose()
      // Recarregar dados financeiros
      window.location.reload()
    } catch (error) {
      console.error('Erro ao salvar transferência:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="data">Data</Label>
          <Input
            id="data"
            type="date"
            value={formData.data}
            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="valor">Valor (R$)</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="tipo">Tipo de Movimentação</Label>
        <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="saida">Saída</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="descricao">Descrição *</Label>
        <Input
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder="Ex: Recebimento de cliente, Pagamento de fornecedor..."
          required
        />
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          rows={3}
          placeholder="Informações adicionais sobre a movimentação..."
        />
      </div>

      <div>
        <Label htmlFor="documento">Documento Comprobatório</Label>
        <div className="flex items-center gap-2">
          <Input
            id="documento"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFormData({ ...formData, documento: e.target.files?.[0] || null })}
          />
          <Button type="button" variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Registrar Movimentação
        </Button>
      </div>
    </form>
  )
}