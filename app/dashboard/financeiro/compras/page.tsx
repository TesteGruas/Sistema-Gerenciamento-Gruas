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
  ShoppingCart, 
  Plus, 
  Search, 
  Eye,
  Edit,
  Download,
  FileText,
  TrendingDown,
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
  CreditCard
} from "lucide-react"

// Mock data para demonstração
const mockPedidos = [
  {
    id: 1,
    numero: "PED-001",
    fornecedor: "Fornecedor ABC Ltda",
    data: "2024-01-15",
    valor: 8500,
    status: "aprovado",
    categoria: "equipamentos",
    descricao: "Peças para grua 25t"
  },
  {
    id: 2,
    numero: "PED-002", 
    fornecedor: "Fornecedor XYZ S/A",
    data: "2024-01-14",
    valor: 3200,
    status: "pendente",
    categoria: "materiais",
    descricao: "Materiais de construção"
  }
]

const mockFornecedores = [
  {
    id: 1,
    nome: "Fornecedor ABC Ltda",
    cnpj: "12.345.678/0001-90",
    contato: "João Silva",
    telefone: "(11) 99999-9999",
    email: "joao@fornecedorabc.com",
    totalCompras: 125000,
    ultimaCompra: "2024-01-15"
  }
]

const mockProdutos = [
  {
    id: 1,
    nome: "Peça para Grua 25t",
    categoria: "equipamentos",
    fornecedor: "Fornecedor ABC Ltda",
    preco: 1500,
    estoque: 5,
    ultimaCompra: "2024-01-15"
  }
]

const mockContasPagar = [
  {
    id: 1,
    fornecedor: "Fornecedor ABC Ltda",
    descricao: "Peças para grua 25t",
    valor: 8500,
    vencimento: "2024-02-15",
    status: "pendente",
    categoria: "equipamentos"
  }
]

const mockNotasFiscais = [
  {
    id: 1,
    numero: "NF-001",
    serie: "1",
    fornecedor: "Fornecedor ABC Ltda",
    data: "2024-01-15",
    valor: 8500,
    status: "recebida",
    categoria: "equipamentos"
  }
]

export default function ComprasPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedCategoria, setSelectedCategoria] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const stats = [
    { 
      title: "Compras do Mês", 
      value: "R$ 45.000", 
      icon: TrendingDown, 
      color: "bg-red-500",
      change: "+8% vs mês anterior"
    },
    { 
      title: "Pedidos Pendentes", 
      value: "5", 
      icon: Clock, 
      color: "bg-orange-500",
      change: "2 aprovados hoje"
    },
    { 
      title: "Fornecedores Ativos", 
      value: "12", 
      icon: Building2, 
      color: "bg-blue-500",
      change: "1 novo este mês"
    },
    { 
      title: "Contas a Pagar", 
      value: "R$ 18.500", 
      icon: CreditCard, 
      color: "bg-purple-500",
      change: "3 vencem esta semana"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
      case 'recebida':
        return 'bg-green-100 text-green-800'
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelada':
        return 'bg-red-100 text-red-800'
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
          <h1 className="text-3xl font-bold text-gray-900">Módulo de Compras</h1>
          <p className="text-gray-600">Gestão de compras, fornecedores e contas a pagar</p>
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
                Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Pedido de Compra</DialogTitle>
                <DialogDescription>
                  Registre um novo pedido de compra
                </DialogDescription>
              </DialogHeader>
              <PedidoForm onClose={() => setIsCreateDialogOpen(false)} />
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="contas-pagar">Contas a Pagar</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  Projeção de Pagamentos
                </CardTitle>
                <CardDescription>Valores a pagar nos próximos meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Janeiro 2024</span>
                    <span className="font-bold text-red-600">R$ 25.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fevereiro 2024</span>
                    <span className="font-bold text-red-600">R$ 32.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Março 2024</span>
                    <span className="font-bold text-red-600">R$ 28.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Abril 2024</span>
                    <span className="font-bold text-red-600">R$ 35.000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Fornecedores Principais
                </CardTitle>
                <CardDescription>Fornecedores com maior volume de compras</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockFornecedores.map((fornecedor) => (
                    <div key={fornecedor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{fornecedor.nome}</p>
                        <p className="text-sm text-gray-500">{fornecedor.contato}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {fornecedor.totalCompras.toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-gray-500">
                          Última: {new Date(fornecedor.ultimaCompra).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pedidos de Compra */}
        <TabsContent value="pedidos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos de Compra</CardTitle>
              <CardDescription>Gestão de pedidos de compra</CardDescription>
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
                        placeholder="Número, fornecedor..."
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
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPedidos.map((pedido) => (
                      <TableRow key={pedido.id}>
                        <TableCell className="font-medium">{pedido.numero}</TableCell>
                        <TableCell>{pedido.fornecedor}</TableCell>
                        <TableCell>{new Date(pedido.data).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {pedido.valor.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(pedido.status)}>
                            {pedido.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoriaColor(pedido.categoria)}>
                            {pedido.categoria}
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fornecedores */}
        <TabsContent value="fornecedores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fornecedores</CardTitle>
              <CardDescription>Gestão de fornecedores</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total Compras</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockFornecedores.map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                      <TableCell>{fornecedor.cnpj}</TableCell>
                      <TableCell>{fornecedor.contato}</TableCell>
                      <TableCell>{fornecedor.telefone}</TableCell>
                      <TableCell>{fornecedor.email}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {fornecedor.totalCompras.toLocaleString('pt-BR')}
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

        {/* Produtos e Serviços */}
        <TabsContent value="produtos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Produtos e Serviços Comprados</CardTitle>
              <CardDescription>Registro de itens adquiridos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Última Compra</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProdutos.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell className="font-medium">{produto.nome}</TableCell>
                      <TableCell>
                        <Badge className={getCategoriaColor(produto.categoria)}>
                          {produto.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell>{produto.fornecedor}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {produto.preco.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{produto.estoque}</TableCell>
                      <TableCell>{new Date(produto.ultimaCompra).toLocaleDateString('pt-BR')}</TableCell>
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

        {/* Contas a Pagar */}
        <TabsContent value="contas-pagar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>Listagem de compras pendentes de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockContasPagar.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell className="font-medium">{conta.fornecedor}</TableCell>
                      <TableCell>{conta.descricao}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {conta.valor.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{new Date(conta.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(conta.status)}>
                          {conta.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoriaColor(conta.categoria)}>
                          {conta.categoria}
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
      </Tabs>
    </div>
  )
}

function PedidoForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    fornecedor: '',
    data: new Date().toISOString().split('T')[0],
    valor: '',
    categoria: 'equipamentos',
    descricao: '',
    status: 'pendente'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Salvando pedido:', formData)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fornecedor">Fornecedor</Label>
          <Select value={formData.fornecedor} onValueChange={(value) => setFormData({ ...formData, fornecedor: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o fornecedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fornecedor1">Fornecedor ABC Ltda</SelectItem>
              <SelectItem value="fornecedor2">Fornecedor XYZ S/A</SelectItem>
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
          <Label htmlFor="categoria">Categoria</Label>
          <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equipamentos">Equipamentos</SelectItem>
              <SelectItem value="materiais">Materiais</SelectItem>
              <SelectItem value="servicos">Serviços</SelectItem>
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
          Salvar Pedido
        </Button>
      </div>
    </form>
  )
}
