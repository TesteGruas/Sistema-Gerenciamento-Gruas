"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  ConeIcon as Crane,
  FileText,
  PieChart,
  Filter,
  RefreshCw,
  Eye,
  Settings,
  Plus,
} from "lucide-react"

// Dados simulados para relatórios
const dadosOperacionais = {
  gruas: {
    total: 12,
    operacionais: 9,
    manutencao: 2,
    disponivel: 1,
    horasOperacao: 2450,
    eficiencia: 87.5,
    custoOperacional: 145000,
    receitaGerada: 285000,
    lucratividade: 49.1,
  },
  estoque: {
    totalItens: 247,
    valorTotal: 125400,
    estoqueBaixo: 8,
    movimentacoes: 45,
    giroEstoque: 2.3,
    custoArmazenagem: 8500,
    perdas: 2400,
    acuracidade: 96.2,
  },
  funcionarios: {
    total: 45,
    ativos: 43,
    ferias: 1,
    afastados: 1,
    horasTrabalhadas: 7200,
    produtividade: 92.1,
    custoFolha: 254000,
    rotatividade: 8.5,
    satisfacao: 87.3,
  },
}

const dadosFinanceiros = {
  receitas: 285000,
  despesas: 198000,
  lucro: 87000,
  margem: 30.5,
  contasReceber: 45000,
  contasPagar: 28000,
  fluxoCaixa: 156000,
  roi: 15.8,
  ebitda: 95000,
  liquidez: 2.1,
}

const dadosHistoricos = [
  { mes: "Jan", receitas: 245000, despesas: 180000, lucro: 65000 },
  { mes: "Fev", receitas: 268000, despesas: 185000, lucro: 83000 },
  { mes: "Mar", receitas: 285000, despesas: 198000, lucro: 87000 },
  { mes: "Abr", receitas: 295000, despesas: 205000, lucro: 90000 },
  { mes: "Mai", receitas: 310000, despesas: 215000, lucro: 95000 },
  { mes: "Jun", receitas: 325000, despesas: 220000, lucro: 105000 },
]

const relatoriosPersonalizados = [
  {
    id: "custom1",
    nome: "Análise de Lucratividade por Grua",
    descricao: "Receita e custos detalhados por equipamento",
    categoria: "Personalizado",
    campos: ["Grua", "Receita", "Custos", "Margem", "Horas Operação"],
    filtros: ["Período", "Status", "Cliente"],
  },
  {
    id: "custom2",
    nome: "Relatório de Eficiência Operacional",
    descricao: "KPIs operacionais e comparativos",
    categoria: "Personalizado",
    campos: ["Indicador", "Meta", "Realizado", "Variação", "Tendência"],
    filtros: ["Departamento", "Período", "Tipo Indicador"],
  },
  {
    id: "custom3",
    nome: "Dashboard de Custos por Centro",
    descricao: "Análise detalhada de custos por centro de custo",
    categoria: "Personalizado",
    campos: ["Centro Custo", "Orçado", "Realizado", "Variação", "Principais Itens"],
    filtros: ["Centro Custo", "Categoria", "Período"],
  },
]

const relatoriosDisponiveis = [
  {
    id: "operacional",
    nome: "Relatório Operacional",
    descricao: "Desempenho de gruas, estoque e operações",
    categoria: "Operacional",
    ultimaAtualizacao: "2024-01-22",
  },
  {
    id: "financeiro",
    nome: "Relatório Financeiro",
    descricao: "Receitas, despesas e fluxo de caixa",
    categoria: "Financeiro",
    ultimaAtualizacao: "2024-01-22",
  },
  {
    id: "rh",
    nome: "Relatório de RH",
    descricao: "Funcionários, ponto e avaliações",
    categoria: "Recursos Humanos",
    ultimaAtualizacao: "2024-01-22",
  },
  {
    id: "executivo",
    nome: "Dashboard Executivo",
    descricao: "Visão geral dos indicadores principais",
    categoria: "Executivo",
    ultimaAtualizacao: "2024-01-22",
  },
]

export default function RelatoriosPage() {
  const [periodoInicio, setPeriodoInicio] = useState("2024-01-01")
  const [periodoFim, setPeriodoFim] = useState("2024-01-31")
  const [tipoRelatorio, setTipoRelatorio] = useState("todos")
  const [departamento, setDepartamento] = useState("todos")
  const [formato, setFormato] = useState("pdf")
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false)

  const exportarRelatorio = (formato: string, relatorio: string) => {
    // Simulação de exportação
    alert(`Exportando ${relatorio} em formato ${formato.toUpperCase()}`)
  }

  const gerarRelatorio = () => {
    alert("Gerando relatório personalizado...")
  }

  const kpis = [
    {
      titulo: "Eficiência Operacional",
      valor: "87.5%",
      variacao: "+2.3%",
      tipo: "positivo",
      icon: Crane,
      meta: "85%",
      status: "acima",
    },
    {
      titulo: "Margem EBITDA",
      valor: "33.3%",
      variacao: "+1.8%",
      tipo: "positivo",
      icon: DollarSign,
      meta: "30%",
      status: "acima",
    },
    {
      titulo: "Produtividade RH",
      valor: "92.1%",
      variacao: "-0.5%",
      tipo: "negativo",
      icon: Users,
      meta: "90%",
      status: "acima",
    },
    {
      titulo: "ROI",
      valor: "15.8%",
      variacao: "+0.8%",
      tipo: "positivo",
      icon: TrendingUp,
      meta: "15%",
      status: "acima",
    },
    {
      titulo: "Giro de Estoque",
      valor: "2.3x",
      variacao: "+0.2x",
      tipo: "positivo",
      icon: Package,
      meta: "2.0x",
      status: "acima",
    },
    {
      titulo: "Liquidez Corrente",
      valor: "2.1",
      variacao: "-0.1",
      tipo: "negativo",
      icon: BarChart3,
      meta: "2.0",
      status: "acima",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Relatórios Avançado</h1>
          <p className="text-gray-600">Análises detalhadas e relatórios gerenciais completos</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => exportarRelatorio("pdf", "Dashboard Executivo")}>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => exportarRelatorio("excel", "Dados Completos")}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsCustomDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Relatório Personalizado
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros Avançados de Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inicio">Data Início</Label>
              <Input id="inicio" type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fim">Data Fim</Label>
              <Input id="fim" type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Relatório</Label>
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="operacional">Operacional</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="rh">Recursos Humanos</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento</Label>
              <Select value={departamento} onValueChange={setDepartamento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="operacoes">Operações</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="administrativo">Administrativo</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="formato">Formato</Label>
              <Select value={formato} onValueChange={setFormato}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="powerbi">Power BI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={gerarRelatorio} className="w-full bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index} className={kpi.status === "acima" ? "border-green-200" : "border-yellow-200"}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{kpi.titulo}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.valor}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      {kpi.tipo === "positivo" ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm ${kpi.tipo === "positivo" ? "text-green-600" : "text-red-600"}`}>
                        {kpi.variacao}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">vs meta: {kpi.meta}</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <kpi.icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Meta: {kpi.meta}</span>
                  <span className={kpi.status === "acima" ? "text-green-600" : "text-yellow-600"}>
                    {kpi.status === "acima" ? "Acima da meta" : "Dentro da meta"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${kpi.status === "acima" ? "bg-green-500" : "bg-yellow-500"}`}
                    style={{ width: "85%" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="operacional">Operacional</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="rh">RH</TabsTrigger>
          <TabsTrigger value="tendencias">Tendências</TabsTrigger>
          <TabsTrigger value="personalizado">Personalizado</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Receitas vs Despesas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Receitas vs Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Receitas</span>
                    <span className="font-medium text-green-600">R$ {dadosFinanceiros.receitas.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{
                        width: `${(dadosFinanceiros.receitas / (dadosFinanceiros.receitas + dadosFinanceiros.despesas)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Despesas</span>
                    <span className="font-medium text-red-600">R$ {dadosFinanceiros.despesas.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full"
                      style={{
                        width: `${(dadosFinanceiros.despesas / (dadosFinanceiros.receitas + dadosFinanceiros.despesas)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Lucro Líquido</span>
                      <span className="font-bold text-blue-600">R$ {dadosFinanceiros.lucro.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status das Gruas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Status das Gruas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-sm">Operacionais</span>
                    </div>
                    <span className="font-medium">{dadosOperacionais.gruas.operacionais}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-sm">Em Manutenção</span>
                    </div>
                    <span className="font-medium">{dadosOperacionais.gruas.manutencao}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-sm">Disponíveis</span>
                    </div>
                    <span className="font-medium">{dadosOperacionais.gruas.disponivel}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Total de Gruas</span>
                      <span className="font-bold text-blue-600">{dadosOperacionais.gruas.total}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Indicadores de Estoque */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Indicadores de Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total de Itens</span>
                    <span className="font-medium">{dadosOperacionais.estoque.totalItens}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Valor Total</span>
                    <span className="font-medium">R$ {dadosOperacionais.estoque.valorTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Estoque Baixo</span>
                    <Badge className="bg-red-100 text-red-800">{dadosOperacionais.estoque.estoqueBaixo}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Giro de Estoque</span>
                    <span className="font-medium">{dadosOperacionais.estoque.giroEstoque}x</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Indicadores de RH */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Indicadores de RH
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Funcionários Ativos</span>
                    <span className="font-medium">{dadosOperacionais.funcionarios.ativos}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Horas Trabalhadas</span>
                    <span className="font-medium">{dadosOperacionais.funcionarios.horasTrabalhadas}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Produtividade</span>
                    <span className="font-medium text-green-600">{dadosOperacionais.funcionarios.produtividade}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Em Férias/Afastados</span>
                    <span className="font-medium">
                      {dadosOperacionais.funcionarios.ferias + dadosOperacionais.funcionarios.afastados}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operacional">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Operacional Detalhado</CardTitle>
              <CardDescription>Análise completa das operações da empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Seção Gruas */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Controle de Gruas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{dadosOperacionais.gruas.total}</p>
                          <p className="text-sm text-gray-600">Total de Gruas</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{dadosOperacionais.gruas.eficiencia}%</p>
                          <p className="text-sm text-gray-600">Eficiência Operacional</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{dadosOperacionais.gruas.horasOperacao}h</p>
                          <p className="text-sm text-gray-600">Horas de Operação</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Seção Estoque */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Controle de Estoque</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{dadosOperacionais.estoque.totalItens}</p>
                          <p className="text-sm text-gray-600">Itens em Estoque</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{dadosOperacionais.estoque.movimentacoes}</p>
                          <p className="text-sm text-gray-600">Movimentações</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">{dadosOperacionais.estoque.estoqueBaixo}</p>
                          <p className="text-sm text-gray-600">Itens com Estoque Baixo</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Financeiro Detalhado</CardTitle>
              <CardDescription>Análise completa da situação financeira</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          R$ {dadosFinanceiros.receitas.toLocaleString()}
                        </p>
                        <p className="text-sm text-green-800">Receitas Totais</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">
                          R$ {dadosFinanceiros.despesas.toLocaleString()}
                        </p>
                        <p className="text-sm text-red-800">Despesas Totais</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">R$ {dadosFinanceiros.lucro.toLocaleString()}</p>
                        <p className="text-sm text-blue-800">Lucro Líquido</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{dadosFinanceiros.margem}%</p>
                        <p className="text-sm text-purple-800">Margem de Lucro</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contas a Receber</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">
                          R$ {dadosFinanceiros.contasReceber.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">Valores pendentes de recebimento</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Contas a Pagar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-red-600">
                          R$ {dadosFinanceiros.contasPagar.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">Valores pendentes de pagamento</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rh">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Recursos Humanos</CardTitle>
              <CardDescription>Análise completa dos recursos humanos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{dadosOperacionais.funcionarios.total}</p>
                        <p className="text-sm text-gray-600">Total Funcionários</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{dadosOperacionais.funcionarios.ativos}</p>
                        <p className="text-sm text-gray-600">Funcionários Ativos</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {dadosOperacionais.funcionarios.horasTrabalhadas}h
                        </p>
                        <p className="text-sm text-gray-600">Horas Trabalhadas</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">
                          {dadosOperacionais.funcionarios.produtividade}%
                        </p>
                        <p className="text-sm text-gray-600">Produtividade</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Departamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Operações</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: "60%" }} />
                          </div>
                          <span className="text-sm font-medium">27</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Manutenção</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: "25%" }} />
                          </div>
                          <span className="text-sm font-medium">11</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Administrativo</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: "15%" }} />
                          </div>
                          <span className="text-sm font-medium">7</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tendencias">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Análise de Tendências
              </CardTitle>
              <CardDescription>Evolução histórica dos principais indicadores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Gráfico de Evolução Financeira */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Evolução Financeira (6 meses)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dadosHistoricos.map((item, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4 items-center">
                          <div className="font-medium">{item.mes}</div>
                          <div className="text-green-600">R$ {item.receitas.toLocaleString()}</div>
                          <div className="text-red-600">R$ {item.despesas.toLocaleString()}</div>
                          <div className="text-blue-600 font-medium">R$ {item.lucro.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-green-800">Crescimento Receitas</p>
                          <p className="text-2xl font-bold text-green-900">+32.7%</p>
                          <p className="text-xs text-green-700">vs período anterior</p>
                        </CardContent>
                      </Card>
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-blue-800">Crescimento Lucro</p>
                          <p className="text-2xl font-bold text-blue-900">+61.5%</p>
                          <p className="text-xs text-blue-700">vs período anterior</p>
                        </CardContent>
                      </Card>
                      <Card className="border-purple-200 bg-purple-50">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-purple-800">Margem Média</p>
                          <p className="text-2xl font-bold text-purple-900">29.8%</p>
                          <p className="text-xs text-purple-700">últimos 6 meses</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Previsões */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Projeções para Próximos 3 Meses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-sm text-gray-600">Receita Projetada</p>
                        <p className="text-2xl font-bold text-green-600">R$ 980.000</p>
                        <p className="text-xs text-gray-500">Jul-Set 2024</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-sm text-gray-600">Lucro Projetado</p>
                        <p className="text-2xl font-bold text-blue-600">R$ 294.000</p>
                        <p className="text-xs text-gray-500">Jul-Set 2024</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-sm text-gray-600">Margem Projetada</p>
                        <p className="text-2xl font-bold text-purple-600">30.0%</p>
                        <p className="text-xs text-gray-500">Jul-Set 2024</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personalizado">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Relatórios Personalizados
              </CardTitle>
              <CardDescription>Crie e configure relatórios específicos para suas necessidades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatoriosPersonalizados.map((relatorio) => (
                    <Card
                      key={relatorio.id}
                      className="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-lg">{relatorio.nome}</h3>
                            <p className="text-sm text-gray-600">{relatorio.descricao}</p>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Campos Inclusos:</p>
                            <div className="flex flex-wrap gap-1">
                              {relatorio.campos.map((campo, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {campo}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Filtros Disponíveis:</p>
                            <div className="flex flex-wrap gap-1">
                              {relatorio.filtros.map((filtro, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {filtro}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button size="sm" className="flex-1" onClick={() => alert(`Gerando ${relatorio.nome}...`)}>
                              <Eye className="w-4 h-4 mr-1" />
                              Visualizar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportarRelatorio("pdf", relatorio.nome)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-6 text-center">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">Criar Novo Relatório</h3>
                        <p className="text-sm text-blue-700">
                          Configure um relatório personalizado com os campos e filtros que você precisa
                        </p>
                      </div>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => alert("Abrindo construtor de relatórios...")}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Construir Relatório
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lista de Relatórios Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Disponíveis</CardTitle>
          <CardDescription>Acesse e exporte relatórios específicos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Relatório</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatoriosDisponiveis.map((relatorio) => (
                  <TableRow key={relatorio.id}>
                    <TableCell className="font-medium">{relatorio.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{relatorio.categoria}</Badge>
                    </TableCell>
                    <TableCell>{relatorio.descricao}</TableCell>
                    <TableCell>{new Date(relatorio.ultimaAtualizacao).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => exportarRelatorio("pdf", relatorio.nome)}>
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => exportarRelatorio("excel", relatorio.nome)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
