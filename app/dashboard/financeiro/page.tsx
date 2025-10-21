"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getFinancialData, createTransferencia, type FinancialData, type Transferencia } from "@/lib/api-financial"
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
  ResponsiveContainer
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
  Mail,
  MessageSquare,
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

  // Carregar dados quando o componente for montado
  useEffect(() => {
    loadFinancialData()
  }, [])
  const [selectedPeriod, setSelectedPeriod] = useState('hoje')

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
            <p className="text-gray-600">Gestão completa das finanças da empresa</p>
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
                <CreditCard className="w-4 h-4 mr-2" />
                Transferência Bancária
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="integration">Integração Bancária</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
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

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Fluxo de Caixa Mensal
                </CardTitle>
                <CardDescription>Entradas e saídas por mês</CardDescription>
              </CardHeader>
              <CardContent>
                {financialData.fluxoCaixa.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={financialData.fluxoCaixa}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
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
          </div>

          {/* Segunda linha de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Transferências Bancárias
                </CardTitle>
                <CardDescription>Últimas transferências realizadas</CardDescription>
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
                      <p>Nenhuma transferência registrada</p>
                      <p className="text-sm">As transferências aparecerão aqui quando registradas</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

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

        {/* Integração Bancária */}
        <TabsContent value="integration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Contas Bancárias
                </CardTitle>
                <CardDescription>Sincronização com bancos parceiros</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Itaú</p>
                        <p className="text-sm text-gray-500">Conta Corrente - 12345-6</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">R$ 25.000,00</p>
                      <Badge variant="default">Sincronizado</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Santander</p>
                        <p className="text-sm text-gray-500">Conta Corrente - 78901-2</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">R$ 20.000,00</p>
                      <Badge variant="default">Sincronizado</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Sincronização Automática
                </CardTitle>
                <CardDescription>Configurações de sincronização</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sincronização Automática</p>
                      <p className="text-sm text-gray-500">Atualização a cada 30 minutos</p>
                    </div>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Última Sincronização</p>
                      <p className="text-sm text-gray-500">Há 15 minutos</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sincronizar Agora
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Integração E-mail e WhatsApp */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Integração de Comunicação
              </CardTitle>
              <CardDescription>Envio automático de documentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-mail
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Notas Fiscais</span>
                      <Badge variant="default">Ativo</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Notas de Débito</span>
                      <Badge variant="default">Ativo</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Boletos</span>
                      <Badge variant="default">Ativo</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Notas Fiscais</span>
                      <Badge variant="secondary">Inativo</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Notas de Débito</span>
                      <Badge variant="secondary">Inativo</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Boletos</span>
                      <Badge variant="secondary">Inativo</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Transferência Bancária */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Transferência Bancária</DialogTitle>
            <DialogDescription>
              Registre uma nova transferência bancária
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
                <span>Transferências</span>
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
    bancoOrigem: '',
    bancoDestino: '',
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
        banco_origem: formData.bancoOrigem,
        banco_destino: formData.bancoDestino,
        documento_comprobatório: formData.documento?.name,
        status: 'pendente'
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
        <Label htmlFor="tipo">Tipo de Transferência</Label>
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
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bancoOrigem">Banco de Origem</Label>
          <Input
            id="bancoOrigem"
            value={formData.bancoOrigem}
            onChange={(e) => setFormData({ ...formData, bancoOrigem: e.target.value })}
            placeholder="Ex: Itaú, Santander..."
          />
        </div>
        <div>
          <Label htmlFor="bancoDestino">Banco de Destino</Label>
          <Input
            id="bancoDestino"
            value={formData.bancoDestino}
            onChange={(e) => setFormData({ ...formData, bancoDestino: e.target.value })}
            placeholder="Ex: Cliente, Fornecedor..."
          />
        </div>
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
          Registrar Transferência
        </Button>
      </div>
    </form>
  )
}