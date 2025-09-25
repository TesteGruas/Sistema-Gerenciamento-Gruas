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
  Users, 
  Plus, 
  Search, 
  Eye,
  Edit,
  Download,
  FileText,
  Building2,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Filter,
  MoreHorizontal,
  Package,
  Truck,
  Phone,
  Mail,
  MapPin
} from "lucide-react"

// Mock data para demonstração
const mockClientes = [
  {
    id: 1,
    nome: "Construtora ABC Ltda",
    cnpj: "12.345.678/0001-90",
    contato: "João Silva",
    telefone: "(11) 99999-9999",
    email: "joao@construtoraabc.com",
    endereco: "Rua das Flores, 123 - São Paulo/SP",
    totalCompras: 250000,
    ultimaCompra: "2024-01-15"
  },
  {
    id: 2,
    nome: "Engenharia XYZ S/A",
    cnpj: "98.765.432/0001-10",
    contato: "Maria Santos",
    telefone: "(11) 88888-8888",
    email: "maria@engenhariaxyz.com",
    endereco: "Av. Paulista, 456 - São Paulo/SP",
    totalCompras: 180000,
    ultimaCompra: "2024-01-14"
  }
]

const mockFornecedores = [
  {
    id: 1,
    nome: "Fornecedor ABC Ltda",
    cnpj: "11.222.333/0001-44",
    contato: "Pedro Oliveira",
    telefone: "(11) 77777-7777",
    email: "pedro@fornecedorabc.com",
    endereco: "Rua Industrial, 789 - São Paulo/SP",
    totalCompras: 125000,
    ultimaCompra: "2024-01-15"
  }
]

const mockProdutos = [
  {
    id: 1,
    nome: "Grua 25t",
    categoria: "equipamentos",
    tipo: "locacao",
    preco: 15000,
    estoque: 3,
    fornecedor: "Fornecedor ABC Ltda",
    ultimaVenda: "2024-01-15"
  },
  {
    id: 2,
    nome: "Plataforma 20m",
    categoria: "equipamentos",
    tipo: "locacao",
    preco: 8000,
    estoque: 5,
    fornecedor: "Fornecedor XYZ S/A",
    ultimaVenda: "2024-01-14"
  }
]

const mockFuncionarios = [
  {
    id: 1,
    nome: "Carlos Silva",
    cpf: "123.456.789-00",
    cargo: "Operador de Grua",
    telefone: "(11) 66666-6666",
    email: "carlos@empresa.com",
    salario: 3500,
    dataAdmissao: "2023-01-15",
    status: "ativo"
  },
  {
    id: 2,
    nome: "Ana Costa",
    cpf: "987.654.321-00",
    cargo: "Gerente Financeiro",
    telefone: "(11) 55555-5555",
    email: "ana@empresa.com",
    salario: 8000,
    dataAdmissao: "2022-06-01",
    status: "ativo"
  }
]

export default function CadastroPage() {
  const [activeTab, setActiveTab] = useState('clientes')
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedCategoria, setSelectedCategoria] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const stats = [
    { 
      title: "Clientes Ativos", 
      value: "25", 
      icon: Building2, 
      color: "bg-blue-500",
      change: "3 novos este mês"
    },
    { 
      title: "Fornecedores", 
      value: "12", 
      icon: Users, 
      color: "bg-green-500",
      change: "1 novo esta semana"
    },
    { 
      title: "Produtos/Equipamentos", 
      value: "45", 
      icon: Package, 
      color: "bg-purple-500",
      change: "5 novos este mês"
    },
    { 
      title: "Funcionários", 
      value: "18", 
      icon: User, 
      color: "bg-orange-500",
      change: "2 novos este mês"
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
          <h1 className="text-3xl font-bold text-gray-900">Módulo de Cadastro</h1>
          <p className="text-gray-600">Gestão de cadastros gerais do sistema</p>
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
                Novo Cadastro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Cadastro</DialogTitle>
                <DialogDescription>
                  Cadastre um novo item no sistema
                </DialogDescription>
              </DialogHeader>
              <CadastroForm onClose={() => setIsCreateDialogOpen(false)} />
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="produtos">Produtos/Equipamentos</TabsTrigger>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
        </TabsList>

        {/* Clientes */}
        <TabsContent value="clientes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>Gestão de clientes para vendas e locações</CardDescription>
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
                        placeholder="Nome, CNPJ, contato..."
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
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Total Compras</TableHead>
                      <TableHead>Última Compra</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockClientes.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">{cliente.nome}</TableCell>
                        <TableCell>{cliente.cnpj}</TableCell>
                        <TableCell>{cliente.contato}</TableCell>
                        <TableCell>{cliente.telefone}</TableCell>
                        <TableCell>{cliente.email}</TableCell>
                        <TableCell className="max-w-xs truncate">{cliente.endereco}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {cliente.totalCompras.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>{new Date(cliente.ultimaCompra).toLocaleDateString('pt-BR')}</TableCell>
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
              <CardDescription>Gestão de fornecedores para compras e serviços</CardDescription>
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
                    <TableHead>Endereço</TableHead>
                    <TableHead>Total Compras</TableHead>
                    <TableHead>Última Compra</TableHead>
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
                      <TableCell className="max-w-xs truncate">{fornecedor.endereco}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {fornecedor.totalCompras.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{new Date(fornecedor.ultimaCompra).toLocaleDateString('pt-BR')}</TableCell>
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

        {/* Produtos e Equipamentos */}
        <TabsContent value="produtos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Produtos e Equipamentos</CardTitle>
              <CardDescription>Gestão de itens vendidos ou locados</CardDescription>
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
                        placeholder="Nome, categoria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="equipamentos">Equipamentos</SelectItem>
                        <SelectItem value="materiais">Materiais</SelectItem>
                        <SelectItem value="servicos">Serviços</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Última Venda</TableHead>
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
                        <TableCell>
                          <Badge variant="outline">
                            {produto.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          R$ {produto.preco.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>{produto.estoque}</TableCell>
                        <TableCell>{produto.fornecedor}</TableCell>
                        <TableCell>{new Date(produto.ultimaVenda).toLocaleDateString('pt-BR')}</TableCell>
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

        {/* Funcionários */}
        <TabsContent value="funcionarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Funcionários</CardTitle>
              <CardDescription>Gestão de colaboradores da empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Salário</TableHead>
                    <TableHead>Data Admissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockFuncionarios.map((funcionario) => (
                    <TableRow key={funcionario.id}>
                      <TableCell className="font-medium">{funcionario.nome}</TableCell>
                      <TableCell>{funcionario.cpf}</TableCell>
                      <TableCell>{funcionario.cargo}</TableCell>
                      <TableCell>{funcionario.telefone}</TableCell>
                      <TableCell>{funcionario.email}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {funcionario.salario.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{new Date(funcionario.dataAdmissao).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(funcionario.status)}>
                          {funcionario.status}
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

function CadastroForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    tipo: '',
    nome: '',
    documento: '',
    contato: '',
    telefone: '',
    email: '',
    endereco: '',
    status: 'ativo'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Salvando cadastro:', formData)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="tipo">Tipo de Cadastro</Label>
        <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cliente">Cliente</SelectItem>
            <SelectItem value="fornecedor">Fornecedor</SelectItem>
            <SelectItem value="produto">Produto/Equipamento</SelectItem>
            <SelectItem value="funcionario">Funcionário</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nome">Nome/Razão Social</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="documento">CPF/CNPJ</Label>
          <Input
            id="documento"
            value={formData.documento}
            onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contato">Contato</Label>
          <Input
            id="contato"
            value={formData.contato}
            onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="endereco">Endereço</Label>
        <Textarea
          id="endereco"
          value={formData.endereco}
          onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar Cadastro
        </Button>
      </div>
    </form>
  )
}
