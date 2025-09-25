"use client"

import { useState, useEffect } from "react"
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
  Receipt, 
  Plus, 
  Search, 
  Eye,
  Edit,
  Download,
  FileText,
  Calculator,
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
  MoreHorizontal
} from "lucide-react"

// Interfaces para os dados de vendas
interface Venda {
  id: number
  numero: string
  cliente: string
  data: string
  valor: number
  status: string
  tipo: string
  descricao: string
}

interface Contrato {
  id: number
  numero: string
  cliente: string
  dataInicio: string
  dataFim: string
  valorTotal: number
  valorMensal: number
  status: string
  tipo: string
}

interface Orcamento {
  id: number
  numero: string
  cliente: string
  data: string
  valor: number
  status: string
  validade: string
}

interface NotaFiscal {
  id: number
  numero: string
  serie: string
  cliente: string
  data: string
  valor: number
  status: string
  tipo: string
}

export default function VendasPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedTipo, setSelectedTipo] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  
  // Estados para os dados
  const [vendas, setVendas] = useState<Venda[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)

  // Funções para carregar dados da API
  const loadVendas = async () => {
    try {
      // const response = await fetch('/api/vendas')
      // const data = await response.json()
      // setVendas(data)
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
    }
  }

  const loadContratos = async () => {
    try {
      // const response = await fetch('/api/contratos')
      // const data = await response.json()
      // setContratos(data)
    } catch (error) {
      console.error('Erro ao carregar contratos:', error)
    }
  }

  const loadOrcamentos = async () => {
    try {
      // const response = await fetch('/api/orcamentos')
      // const data = await response.json()
      // setOrcamentos(data)
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
    }
  }

  const loadNotasFiscais = async () => {
    try {
      // const response = await fetch('/api/notas-fiscais')
      // const data = await response.json()
      // setNotasFiscais(data)
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error)
    }
  }

  // Carregar todos os dados
  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadVendas(),
        loadContratos(),
        loadOrcamentos(),
        loadNotasFiscais()
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  const stats = [
    { 
      title: "Vendas do Mês", 
      value: loading ? "Carregando..." : `R$ ${vendas.reduce((sum, v) => sum + v.valor, 0).toLocaleString('pt-BR')}`, 
      icon: TrendingUp, 
      color: "bg-green-500",
      change: "Carregando..."
    },
    { 
      title: "Contratos Ativos", 
      value: loading ? "Carregando..." : contratos.filter(c => c.status === 'ativo').length.toString(), 
      icon: FileText, 
      color: "bg-blue-500",
      change: "Carregando..."
    },
    { 
      title: "Orçamentos Pendentes", 
      value: loading ? "Carregando..." : orcamentos.filter(o => o.status === 'pendente').length.toString(), 
      icon: Clock, 
      color: "bg-orange-500",
      change: "Carregando..."
    },
    { 
      title: "NFs Emitidas", 
      value: loading ? "Carregando..." : notasFiscais.filter(nf => nf.status === 'emitida').length.toString(), 
      icon: Receipt, 
      color: "bg-purple-500",
      change: "Carregando..."
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovada':
      case 'ativo':
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
      case 'equipamento':
        return 'bg-blue-100 text-blue-800'
      case 'servico':
        return 'bg-purple-100 text-purple-800'
      case 'locacao_grua':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulo de Vendas</h1>
          <p className="text-gray-600">Gestão de vendas, contratos e orçamentos</p>
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
                Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Venda</DialogTitle>
                <DialogDescription>
                  Registre uma nova venda no sistema
                </DialogDescription>
              </DialogHeader>
              <VendaForm onClose={() => setIsCreateDialogOpen(false)} />
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
                  <p className="text-xs text-green-600 mt-1">{stat.change}</p>
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="ordem-servico">Ordem de Serviço</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
          <TabsTrigger value="notas-fiscais">Notas Fiscais</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Projeção de Recebimentos
                </CardTitle>
                <CardDescription>Valores a receber nos próximos meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Janeiro 2024</span>
                    <span className="font-bold text-green-600">R$ 45.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fevereiro 2024</span>
                    <span className="font-bold text-green-600">R$ 52.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Março 2024</span>
                    <span className="font-bold text-green-600">R$ 38.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Abril 2024</span>
                    <span className="font-bold text-green-600">R$ 41.000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Contratos em Andamento
                </CardTitle>
                <CardDescription>Status dos contratos ativos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>Carregando contratos...</p>
                    </div>
                  ) : contratos.length > 0 ? (
                    contratos.map((contrato) => (
                      <div key={contrato.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{contrato.numero}</p>
                          <p className="text-sm text-gray-500">{contrato.cliente}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">R$ {contrato.valorMensal.toLocaleString('pt-BR')}</p>
                          <Badge className={getStatusColor(contrato.status)}>
                            {contrato.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p>Nenhum contrato encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ordem de Serviço */}
        <TabsContent value="ordem-servico" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ordens de Serviço</CardTitle>
              <CardDescription>Gestão de ordens de serviço</CardDescription>
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
                        placeholder="Número, cliente..."
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
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="aprovada">Aprovada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <p>Carregando vendas...</p>
                        </TableCell>
                      </TableRow>
                    ) : vendas.length > 0 ? (
                      vendas.map((venda) => (
                        <TableRow key={venda.id}>
                          <TableCell className="font-medium">{venda.numero}</TableCell>
                          <TableCell>{venda.cliente}</TableCell>
                          <TableCell>{new Date(venda.data).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="font-semibold">
                            R$ {venda.valor.toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(venda.status)}>
                              {venda.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTipoColor(venda.tipo)}>
                              {venda.tipo}
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <p>Nenhuma venda encontrada</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contratos */}
        <TabsContent value="contratos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contratos</CardTitle>
              <CardDescription>Gestão de contratos de locação</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p>Carregando contratos...</p>
                      </TableCell>
                    </TableRow>
                  ) : contratos.length > 0 ? (
                    contratos.map((contrato) => (
                      <TableRow key={contrato.id}>
                        <TableCell className="font-medium">{contrato.numero}</TableCell>
                        <TableCell>{contrato.cliente}</TableCell>
                        <TableCell>
                          {new Date(contrato.dataInicio).toLocaleDateString('pt-BR')} - {new Date(contrato.dataFim).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-semibold">
                          R$ {contrato.valorTotal.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-semibold">
                          R$ {contrato.valorMensal.toLocaleString('pt-BR')}
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
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p>Nenhum contrato encontrado</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orçamentos */}
        <TabsContent value="orcamentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos</CardTitle>
              <CardDescription>Gestão de orçamentos e propostas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p>Carregando orçamentos...</p>
                      </TableCell>
                    </TableRow>
                  ) : orcamentos.length > 0 ? (
                    orcamentos.map((orcamento) => (
                      <TableRow key={orcamento.id}>
                        <TableCell className="font-medium">{orcamento.numero}</TableCell>
                        <TableCell>{orcamento.cliente}</TableCell>
                        <TableCell>{new Date(orcamento.data).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {orcamento.valor.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(orcamento.status)}>
                            {orcamento.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(orcamento.validade).toLocaleDateString('pt-BR')}</TableCell>
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p>Nenhum orçamento encontrado</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notas Fiscais */}
        <TabsContent value="notas-fiscais" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notas Fiscais</CardTitle>
              <CardDescription>Gestão de notas fiscais emitidas</CardDescription>
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <p>Carregando notas fiscais...</p>
                      </TableCell>
                    </TableRow>
                  ) : notasFiscais.length > 0 ? (
                    notasFiscais.map((nf) => (
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <p>Nenhuma nota fiscal encontrada</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function VendaForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    cliente: '',
    data: new Date().toISOString().split('T')[0],
    valor: '',
    tipo: 'equipamento',
    descricao: '',
    status: 'pendente'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Salvando venda:', formData)
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
          <Label htmlFor="data">Data</Label>
          <Input
            id="data"
            type="date"
            value={formData.data}
            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equipamento">Equipamento</SelectItem>
              <SelectItem value="servico">Serviço</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar Venda
        </Button>
      </div>
    </form>
  )
}
