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
  Package, 
  Plus, 
  Search, 
  Eye,
  Edit,
  Download,
  FileText,
  Truck,
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
  Receipt,
  FileSpreadsheet,
  MapPin,
  Car,
  Route
} from "lucide-react"

// Mock data para demonstração
const mockManifestos = [
  {
    id: 1,
    numero: "MDF-001",
    serie: "1",
    data: "2024-01-15",
    status: "emitido",
    tipo: "entrada",
    valor: 15000,
    descricao: "Manifesto de entrada - Grua 25t"
  },
  {
    id: 2,
    numero: "MDF-002", 
    serie: "1",
    data: "2024-01-14",
    status: "cancelado",
    tipo: "saida",
    valor: 8500,
    descricao: "Manifesto de saída - Plataforma"
  }
]

const mockCTe = [
  {
    id: 1,
    numero: "CT-001",
    serie: "1",
    data: "2024-01-15",
    status: "emitido",
    tipo: "entrada",
    valor: 15000,
    descricao: "CT-e para transporte de grua"
  }
]

const mockMotoristas = [
  {
    id: 1,
    nome: "João Silva",
    cpf: "123.456.789-00",
    cnh: "12345678901",
    telefone: "(11) 99999-9999",
    email: "joao@email.com",
    veiculo: "Caminhão ABC-1234",
    status: "ativo",
    ultimaViagem: "2024-01-15"
  },
  {
    id: 2,
    nome: "Maria Santos",
    cpf: "987.654.321-00",
    cnh: "98765432109",
    telefone: "(11) 88888-8888",
    email: "maria@email.com",
    veiculo: "Caminhão XYZ-5678",
    status: "ativo",
    ultimaViagem: "2024-01-14"
  }
]

const mockViagens = [
  {
    id: 1,
    numero: "VIAG-001",
    motorista: "João Silva",
    veiculo: "Caminhão ABC-1234",
    origem: "São Paulo - SP",
    destino: "Rio de Janeiro - RJ",
    dataInicio: "2024-01-15",
    dataFim: "2024-01-16",
    carga: "Grua 25t",
    status: "concluida",
    distancia: 430,
    valor: 2500
  },
  {
    id: 2,
    numero: "VIAG-002",
    motorista: "Maria Santos",
    veiculo: "Caminhão XYZ-5678",
    origem: "São Paulo - SP",
    destino: "Belo Horizonte - MG",
    dataInicio: "2024-01-14",
    dataFim: "2024-01-15",
    carga: "Plataforma",
    status: "em_andamento",
    distancia: 580,
    valor: 3200
  }
]

export default function LogisticaPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedTipo, setSelectedTipo] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const stats = [
    { 
      title: "Manifestos Ativos", 
      value: "12", 
      icon: FileText, 
      color: "bg-blue-500",
      change: "3 emitidos hoje"
    },
    { 
      title: "CT-e Emitidos", 
      value: "8", 
      icon: Receipt, 
      color: "bg-green-500",
      change: "2 novos esta semana"
    },
    { 
      title: "Motoristas Ativos", 
      value: "5", 
      icon: User, 
      color: "bg-purple-500",
      change: "1 novo este mês"
    },
    { 
      title: "Viagens em Andamento", 
      value: "3", 
      icon: Truck, 
      color: "bg-orange-500",
      change: "2 concluídas hoje"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'emitido':
      case 'concluida':
      case 'ativo':
        return 'bg-green-100 text-green-800'
      case 'pendente':
      case 'em_andamento':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
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
          <h1 className="text-3xl font-bold text-gray-900">Logística de Equipamentos</h1>
          <p className="text-gray-600">Gestão logística e transporte de equipamentos</p>
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
                Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Registro</DialogTitle>
                <DialogDescription>
                  Registre um novo documento ou viagem
                </DialogDescription>
              </DialogHeader>
              <RegistroForm onClose={() => setIsCreateDialogOpen(false)} />
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
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="manifestos">Manifestos</TabsTrigger>
          <TabsTrigger value="cte">CT-e e MDF-e</TabsTrigger>
          <TabsTrigger value="motoristas">Motoristas</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Equipamentos em Trânsito
                </CardTitle>
                <CardDescription>Status dos equipamentos em transporte</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Grua 25t - GRU-001</p>
                        <p className="text-sm text-gray-500">São Paulo → Rio de Janeiro</p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Em Trânsito</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Plataforma - PLAT-001</p>
                        <p className="text-sm text-gray-500">São Paulo → Belo Horizonte</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Entregue</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Motoristas Ativos
                </CardTitle>
                <CardDescription>Status dos motoristas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockMotoristas.slice(0, 2).map((motorista) => (
                    <div key={motorista.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{motorista.nome}</p>
                        <p className="text-sm text-gray-500">{motorista.veiculo}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(motorista.status)}>
                          {motorista.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Última: {new Date(motorista.ultimaViagem).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Manifestos */}
        <TabsContent value="manifestos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manifestos Eletrônicos (MDF-e)</CardTitle>
              <CardDescription>Gestão de manifestos eletrônicos</CardDescription>
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
                        placeholder="Número, descrição..."
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
                        <SelectItem value="emitido">Emitido</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                        <SelectItem value="encerrado">Encerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Série</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockManifestos.map((manifesto) => (
                      <TableRow key={manifesto.id}>
                        <TableCell className="font-medium">{manifesto.numero}</TableCell>
                        <TableCell>{manifesto.serie}</TableCell>
                        <TableCell>{new Date(manifesto.data).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Badge className={getTipoColor(manifesto.tipo)}>
                            {manifesto.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          R$ {manifesto.valor.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(manifesto.status)}>
                            {manifesto.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{manifesto.descricao}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
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

        {/* CT-e e MDF-e */}
        <TabsContent value="cte" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CT-e e MDF-e</CardTitle>
              <CardDescription>Gestão de documentos fiscais de transporte</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCTe.map((cte) => (
                    <TableRow key={cte.id}>
                      <TableCell className="font-medium">{cte.numero}</TableCell>
                      <TableCell>{cte.serie}</TableCell>
                      <TableCell>{new Date(cte.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge className={getTipoColor(cte.tipo)}>
                          {cte.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {cte.valor.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(cte.status)}>
                          {cte.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{cte.descricao}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
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

        {/* Motoristas */}
        <TabsContent value="motoristas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Motoristas</CardTitle>
              <CardDescription>Gestão de motoristas e veículos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>CNH</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Viagem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMotoristas.map((motorista) => (
                    <TableRow key={motorista.id}>
                      <TableCell className="font-medium">{motorista.nome}</TableCell>
                      <TableCell>{motorista.cpf}</TableCell>
                      <TableCell>{motorista.cnh}</TableCell>
                      <TableCell>{motorista.telefone}</TableCell>
                      <TableCell>{motorista.email}</TableCell>
                      <TableCell>{motorista.veiculo}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(motorista.status)}>
                          {motorista.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(motorista.ultimaViagem).toLocaleDateString('pt-BR')}</TableCell>
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

          {/* Histórico de Viagens */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Viagens</CardTitle>
              <CardDescription>Registro de todas as viagens realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Carga</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Distância</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockViagens.map((viagem) => (
                    <TableRow key={viagem.id}>
                      <TableCell className="font-medium">{viagem.numero}</TableCell>
                      <TableCell>{viagem.motorista}</TableCell>
                      <TableCell>{viagem.veiculo}</TableCell>
                      <TableCell>{viagem.origem}</TableCell>
                      <TableCell>{viagem.destino}</TableCell>
                      <TableCell>
                        {new Date(viagem.dataInicio).toLocaleDateString('pt-BR')} - {new Date(viagem.dataFim).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{viagem.carga}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(viagem.status)}>
                          {viagem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{viagem.distancia} km</TableCell>
                      <TableCell className="font-semibold">
                        R$ {viagem.valor.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <MapPin className="w-4 h-4" />
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

function RegistroForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    tipo: '',
    numero: '',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: '',
    status: 'pendente'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Salvando registro:', formData)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipo">Tipo de Registro</Label>
          <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manifesto">Manifesto (MDF-e)</SelectItem>
              <SelectItem value="cte">CT-e</SelectItem>
              <SelectItem value="viagem">Viagem</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="numero">Número</Label>
          <Input
            id="numero"
            value={formData.numero}
            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
            required
          />
        </div>
      </div>

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
          />
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
          Salvar Registro
        </Button>
      </div>
    </form>
  )
}
