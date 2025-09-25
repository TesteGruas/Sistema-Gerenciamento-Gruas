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
  Truck, 
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
  Calculator,
  Receipt,
  FileSpreadsheet
} from "lucide-react"

// Mock data para demonstração
const mockGruasLocadas = [
  {
    id: 1,
    numero: "GRU-001",
    cliente: "Construtora ABC Ltda",
    contrato: "CT-001",
    dataInicio: "2024-01-01",
    dataFim: "2024-12-31",
    valorMensal: 15000,
    medições: 12,
    aditivos: 2,
    status: "ativa"
  },
  {
    id: 2,
    numero: "GRU-002", 
    cliente: "Engenharia XYZ S/A",
    contrato: "CT-002",
    dataInicio: "2024-02-01",
    dataFim: "2024-08-31",
    valorMensal: 12000,
    medições: 6,
    aditivos: 1,
    status: "ativa"
  }
]

const mockPlataformasLocadas = [
  {
    id: 1,
    numero: "PLAT-001",
    cliente: "Construtora ABC Ltda",
    contrato: "CT-003",
    dataInicio: "2024-01-15",
    dataFim: "2024-06-15",
    valorMensal: 8000,
    medições: 5,
    aditivos: 0,
    status: "ativa"
  }
]

const mockMedicoes = [
  {
    id: 1,
    numero: "MED-001",
    cliente: "Construtora ABC Ltda",
    equipamento: "GRU-001",
    periodo: "Janeiro 2024",
    valorBase: 15000,
    aditivos: 2500,
    valorTotal: 17500,
    status: "finalizada"
  }
]

const mockOrcamentos = [
  {
    id: 1,
    numero: "ORC-LOC-001",
    cliente: "Construtora ABC Ltda",
    data: "2024-01-10",
    valor: 180000,
    validade: "2024-02-10",
    status: "aprovado",
    tipo: "locacao_grua"
  }
]

const mockNFe = [
  {
    id: 1,
    numero: "NF-LOC-001",
    serie: "1",
    cliente: "Construtora ABC Ltda",
    data: "2024-01-15",
    valor: 15000,
    status: "emitida",
    tipo: "entrada"
  }
]

const mockNotasDebito = [
  {
    id: 1,
    numero: "ND-001",
    cliente: "Construtora ABC Ltda",
    data: "2024-01-20",
    valor: 2500,
    descricao: "Aditivo por horas extras",
    status: "emitida"
  }
]

export default function LocacoesPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedTipo, setSelectedTipo] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const stats = [
    { 
      title: "Gruas Locadas", 
      value: "8", 
      icon: Truck, 
      color: "bg-blue-500",
      change: "2 novas este mês"
    },
    { 
      title: "Plataformas Locadas", 
      value: "5", 
      icon: Package, 
      color: "bg-green-500",
      change: "1 nova esta semana"
    },
    { 
      title: "Receita Mensal", 
      value: "R$ 125.000", 
      icon: DollarSign, 
      color: "bg-purple-500",
      change: "+12% vs mês anterior"
    },
    { 
      title: "Medições Pendentes", 
      value: "3", 
      icon: Clock, 
      color: "bg-orange-500",
      change: "2 vencem hoje"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
      case 'finalizada':
      case 'emitida':
        return 'bg-green-100 text-green-800'
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelada':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'locacao_grua':
        return 'bg-blue-100 text-blue-800'
      case 'locacao_plataforma':
        return 'bg-green-100 text-green-800'
      case 'entrada':
        return 'bg-green-100 text-green-800'
      case 'saida':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulo de Locações</h1>
          <p className="text-gray-600">Gestão de locações de gruas e plataformas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Locação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Locação</DialogTitle>
                <DialogDescription>
                  Registre uma nova locação de equipamento
                </DialogDescription>
              </DialogHeader>
              <LocacaoForm onClose={() => setIsCreateDialogOpen(false)} />
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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="gruas">Gruas</TabsTrigger>
          <TabsTrigger value="plataformas">Plataformas</TabsTrigger>
          <TabsTrigger value="medicoes">Medições</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
          <TabsTrigger value="nfe">NFe</TabsTrigger>
          <TabsTrigger value="notas-debito">Notas Débito</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Receita de Locações
                </CardTitle>
                <CardDescription>Projeção de receita mensal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Janeiro 2024</span>
                    <span className="font-bold text-green-600">R$ 125.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fevereiro 2024</span>
                    <span className="font-bold text-green-600">R$ 135.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Março 2024</span>
                    <span className="font-bold text-green-600">R$ 142.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Abril 2024</span>
                    <span className="font-bold text-green-600">R$ 138.000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Equipamentos Ativos
                </CardTitle>
                <CardDescription>Status dos equipamentos locados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Gruas Ativas</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">8</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Plataformas Ativas</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">Medições Pendentes</span>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gruas Locadas */}
        <TabsContent value="gruas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gruas Locadas</CardTitle>
              <CardDescription>Gestão de gruas em locação</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Medições</TableHead>
                    <TableHead>Aditivos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockGruasLocadas.map((grua) => (
                    <TableRow key={grua.id}>
                      <TableCell className="font-medium">{grua.numero}</TableCell>
                      <TableCell>{grua.cliente}</TableCell>
                      <TableCell>{grua.contrato}</TableCell>
                      <TableCell>
                        {new Date(grua.dataInicio).toLocaleDateString('pt-BR')} - {new Date(grua.dataFim).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {grua.valorMensal.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{grua.medições}</TableCell>
                      <TableCell>{grua.aditivos}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(grua.status)}>
                          {grua.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
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

        {/* Plataformas Locadas */}
        <TabsContent value="plataformas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plataformas Locadas</CardTitle>
              <CardDescription>Gestão de plataformas em locação</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Medições</TableHead>
                    <TableHead>Aditivos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPlataformasLocadas.map((plataforma) => (
                    <TableRow key={plataforma.id}>
                      <TableCell className="font-medium">{plataforma.numero}</TableCell>
                      <TableCell>{plataforma.cliente}</TableCell>
                      <TableCell>{plataforma.contrato}</TableCell>
                      <TableCell>
                        {new Date(plataforma.dataInicio).toLocaleDateString('pt-BR')} - {new Date(plataforma.dataFim).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {plataforma.valorMensal.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{plataforma.medições}</TableCell>
                      <TableCell>{plataforma.aditivos}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(plataforma.status)}>
                          {plataforma.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
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

        {/* Medições Finalizadas */}
        <TabsContent value="medicoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Medições Finalizadas</CardTitle>
              <CardDescription>Relatório de medições com filtros por período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="search"
                        placeholder="Número, cliente, equipamento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="finalizada">Finalizada</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Valor Base</TableHead>
                      <TableHead>Aditivos</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockMedicoes.map((medicao) => (
                      <TableRow key={medicao.id}>
                        <TableCell className="font-medium">{medicao.numero}</TableCell>
                        <TableCell>{medicao.cliente}</TableCell>
                        <TableCell>{medicao.equipamento}</TableCell>
                        <TableCell>{medicao.periodo}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {medicao.valorBase.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-semibold">
                          R$ {medicao.aditivos.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          R$ {medicao.valorTotal.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(medicao.status)}>
                            {medicao.status}
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

        {/* Orçamentos */}
        <TabsContent value="orcamentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos de Locação</CardTitle>
              <CardDescription>Gestão de orçamentos para locações</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockOrcamentos.map((orcamento) => (
                    <TableRow key={orcamento.id}>
                      <TableCell className="font-medium">{orcamento.numero}</TableCell>
                      <TableCell>{orcamento.cliente}</TableCell>
                      <TableCell>{new Date(orcamento.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {orcamento.valor.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{new Date(orcamento.validade).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(orcamento.status)}>
                          {orcamento.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTipoColor(orcamento.tipo)}>
                          {orcamento.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
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

        {/* NFe */}
        <TabsContent value="nfe" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notas Fiscais de Locação</CardTitle>
              <CardDescription>Gestão de NFe de entrada e saída</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockNFe.map((nf) => (
                    <TableRow key={nf.id}>
                      <TableCell className="font-medium">{nf.numero}</TableCell>
                      <TableCell>{nf.serie}</TableCell>
                      <TableCell>{nf.cliente}</TableCell>
                      <TableCell>{new Date(nf.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {nf.valor.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(nf.status)}>
                          {nf.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTipoColor(nf.tipo)}>
                          {nf.tipo}
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

        {/* Notas de Débito */}
        <TabsContent value="notas-debito" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notas de Débito</CardTitle>
              <CardDescription>Gestão de notas de débito</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockNotasDebito.map((nota) => (
                    <TableRow key={nota.id}>
                      <TableCell className="font-medium">{nota.numero}</TableCell>
                      <TableCell>{nota.cliente}</TableCell>
                      <TableCell>{new Date(nota.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {nota.valor.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{nota.descricao}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(nota.status)}>
                          {nota.status}
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

        {/* Relatório Detalhado */}
        <TabsContent value="relatorio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Detalhado de Locações</CardTitle>
              <CardDescription>Relatório completo com filtros personalizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="periodo">Período</Label>
                    <Select>
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
                  <div>
                    <Label htmlFor="equipamento">Equipamento</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os equipamentos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="gruas">Gruas</SelectItem>
                        <SelectItem value="plataformas">Plataformas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cliente">Cliente</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os clientes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="cliente1">Construtora ABC Ltda</SelectItem>
                        <SelectItem value="cliente2">Engenharia XYZ S/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Gerar Relatório
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Excel
                  </Button>
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LocacaoForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    cliente: '',
    equipamento: '',
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: '',
    valorMensal: '',
    tipo: 'grua'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Salvando locação:', formData)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cliente">Cliente</Label>
          <Select value={formData.cliente} onValueChange={(value) => setFormData({ ...formData, cliente: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cliente1">Construtora ABC Ltda</SelectItem>
              <SelectItem value="cliente2">Engenharia XYZ S/A</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tipo">Tipo de Equipamento</Label>
          <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grua">Grua</SelectItem>
              <SelectItem value="plataforma">Plataforma</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dataInicio">Data de Início</Label>
          <Input
            id="dataInicio"
            type="date"
            value={formData.dataInicio}
            onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="dataFim">Data de Fim</Label>
          <Input
            id="dataFim"
            type="date"
            value={formData.dataFim}
            onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="valorMensal">Valor Mensal (R$)</Label>
        <Input
          id="valorMensal"
          type="number"
          step="0.01"
          value={formData.valorMensal}
          onChange={(e) => setFormData({ ...formData, valorMensal: e.target.value })}
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar Locação
        </Button>
      </div>
    </form>
  )
}
