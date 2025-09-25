"use client"

import { useState } from "react"
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
  FileBarChart, 
  Plus, 
  Search, 
  Eye,
  Edit,
  Download,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Filter,
  MoreHorizontal,
  Package,
  Truck,
  Receipt,
  FileSpreadsheet,
  Printer,
  BarChart3,
  PieChart
} from "lucide-react"

// Mock data para demonstração
const mockRelatorioFinanceiro = [
  {
    mes: "Janeiro 2024",
    receitas: 250000,
    despesas: 180000,
    saldo: 70000,
    crescimento: 15
  },
  {
    mes: "Fevereiro 2024",
    receitas: 280000,
    despesas: 195000,
    saldo: 85000,
    crescimento: 12
  }
]

const mockRelatorioVendas = [
  {
    cliente: "Construtora ABC Ltda",
    totalVendas: 150000,
    quantidade: 5,
    ticketMedio: 30000,
    ultimaVenda: "2024-01-15"
  },
  {
    cliente: "Engenharia XYZ S/A",
    totalVendas: 120000,
    quantidade: 3,
    ticketMedio: 40000,
    ultimaVenda: "2024-01-14"
  }
]

const mockRelatorioContratos = [
  {
    numero: "CT-001",
    cliente: "Construtora ABC Ltda",
    valorTotal: 180000,
    valorMensal: 15000,
    inicio: "2024-01-01",
    fim: "2024-12-31",
    status: "ativo"
  }
]

const mockRelatorioFaturamento = [
  {
    mes: "Janeiro 2024",
    vendas: 150000,
    locacoes: 100000,
    servicos: 50000,
    total: 300000
  }
]

const mockRelatorioLocacoes = [
  {
    equipamento: "Grua 25t",
    cliente: "Construtora ABC Ltda",
    diasLocados: 30,
    valorTotal: 15000,
    aditivos: 2500,
    status: "ativa"
  }
]

const mockRelatorioEstoque = [
  {
    produto: "Grua 25t",
    categoria: "equipamentos",
    estoque: 3,
    valorUnitario: 15000,
    valorTotal: 45000,
    ultimaMovimentacao: "2024-01-15"
  }
]

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState('financeiro')
  const [selectedPeriod, setSelectedPeriod] = useState('mes')
  const [selectedCliente, setSelectedCliente] = useState('all')
  const [selectedCategoria, setSelectedCategoria] = useState('all')
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)

  const stats = [
    { 
      title: "Relatórios Gerados", 
      value: "24", 
      icon: FileBarChart, 
      color: "bg-blue-500",
      change: "3 esta semana"
    },
    { 
      title: "Exportações", 
      value: "156", 
      icon: Download, 
      color: "bg-green-500",
      change: "12 hoje"
    },
    { 
      title: "Impressões", 
      value: "89", 
      icon: Printer, 
      color: "bg-purple-500",
      change: "5 hoje"
    },
    { 
      title: "Relatórios Pendentes", 
      value: "3", 
      icon: Clock, 
      color: "bg-orange-500",
      change: "2 vencem hoje"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800'
      case 'inativo':
        return 'bg-red-100 text-red-800'
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'equipamentos':
        return 'bg-blue-100 text-blue-800'
      case 'materiais':
        return 'bg-green-100 text-green-800'
      case 'servicos':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulo de Relatórios</h1>
          <p className="text-gray-600">Relatórios e análises personalizadas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Todos
          </Button>
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Todos
          </Button>
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Gerar Relatório Personalizado</DialogTitle>
                <DialogDescription>
                  Configure e gere um relatório personalizado
                </DialogDescription>
              </DialogHeader>
              <RelatorioForm onClose={() => setIsGenerateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="locacoes">Locações</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
        </TabsList>

        {/* Relatório Financeiro */}
        <TabsContent value="financeiro" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Relatório Financeiro
              </CardTitle>
              <CardDescription>Fluxo de caixa diário e mensal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="periodo">Período</Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mes">Este Mês</SelectItem>
                        <SelectItem value="trimestre">Este Trimestre</SelectItem>
                        <SelectItem value="ano">Este Ano</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo de Relatório</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fluxo-caixa">Fluxo de Caixa</SelectItem>
                        <SelectItem value="dre">DRE</SelectItem>
                        <SelectItem value="balanco">Balanço</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="formato">Formato</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button>
                    <FileBarChart className="w-4 h-4 mr-2" />
                    Gerar Relatório
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                  <Button variant="outline">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead>Receitas</TableHead>
                      <TableHead>Despesas</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Crescimento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockRelatorioFinanceiro.map((relatorio, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{relatorio.mes}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          R$ {relatorio.receitas.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-semibold text-red-600">
                          R$ {relatorio.despesas.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-bold text-lg">
                          R$ {relatorio.saldo.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            +{relatorio.crescimento}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
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
        </TabsContent>

        {/* Relatório de Vendas */}
        <TabsContent value="vendas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Vendas</CardTitle>
              <CardDescription>Análise de vendas por cliente e período</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total Vendas</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Ticket Médio</TableHead>
                    <TableHead>Última Venda</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRelatorioVendas.map((venda, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{venda.cliente}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {venda.totalVendas.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{venda.quantidade}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {venda.ticketMedio.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{new Date(venda.ultimaVenda).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Contratos */}
        <TabsContent value="contratos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Contratos</CardTitle>
              <CardDescription>Análise de contratos ativos e inativos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRelatorioContratos.map((contrato, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{contrato.numero}</TableCell>
                      <TableCell>{contrato.cliente}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {contrato.valorTotal.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {contrato.valorMensal.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {new Date(contrato.inicio).toLocaleDateString('pt-BR')} - {new Date(contrato.fim).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contrato.status)}>
                          {contrato.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Faturamento */}
        <TabsContent value="faturamento" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Faturamento</CardTitle>
              <CardDescription>Análise de faturamento por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Locações</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRelatorioFaturamento.map((faturamento, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{faturamento.mes}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {faturamento.vendas.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {faturamento.locacoes.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {faturamento.servicos.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-bold text-lg">
                        R$ {faturamento.total.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Locações */}
        <TabsContent value="locacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Locações</CardTitle>
              <CardDescription>Equipamentos locados, aditivos e pagamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Dias Locados</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Aditivos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRelatorioLocacoes.map((locacao, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{locacao.equipamento}</TableCell>
                      <TableCell>{locacao.cliente}</TableCell>
                      <TableCell>{locacao.diasLocados}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {locacao.valorTotal.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {locacao.aditivos.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(locacao.status)}>
                          {locacao.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Estoque */}
        <TabsContent value="estoque" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Estoque</CardTitle>
              <CardDescription>Análise de estoque e movimentações</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Valor Unitário</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Última Movimentação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRelatorioEstoque.map((estoque, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{estoque.produto}</TableCell>
                      <TableCell>
                        <Badge className={getCategoriaColor(estoque.categoria)}>
                          {estoque.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell>{estoque.estoque}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {estoque.valorUnitario.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-bold">
                        R$ {estoque.valorTotal.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{new Date(estoque.ultimaMovimentacao).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RelatorioForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    tipo: '',
    periodo: '',
    formato: 'pdf',
    filtros: '',
    observacoes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Gerando relatório:', formData)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipo">Tipo de Relatório</Label>
          <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financeiro">Financeiro</SelectItem>
              <SelectItem value="vendas">Vendas</SelectItem>
              <SelectItem value="contratos">Contratos</SelectItem>
              <SelectItem value="faturamento">Faturamento</SelectItem>
              <SelectItem value="locacoes">Locações</SelectItem>
              <SelectItem value="estoque">Estoque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="periodo">Período</Label>
          <Select value={formData.periodo} onValueChange={(value) => setFormData({ ...formData, periodo: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="trimestre">Este Trimestre</SelectItem>
              <SelectItem value="ano">Este Ano</SelectItem>
              <SelectItem value="personalizado">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="formato">Formato</Label>
          <Select value={formData.formato} onValueChange={(value) => setFormData({ ...formData, formato: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="filtros">Filtros Adicionais</Label>
          <Input
            id="filtros"
            value={formData.filtros}
            onChange={(e) => setFormData({ ...formData, filtros: e.target.value })}
            placeholder="Ex: cliente, categoria, status..."
          />
        </div>
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          rows={3}
          placeholder="Observações adicionais para o relatório..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Gerar Relatório
        </Button>
      </div>
    </form>
  )
}
