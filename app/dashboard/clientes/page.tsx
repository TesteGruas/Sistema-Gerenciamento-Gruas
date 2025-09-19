"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Building2, 
  Plus, 
  Search, 
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
  Calendar
} from "lucide-react"
import { mockClientes, getObrasByCliente } from "@/lib/mock-data"

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [clienteFormData, setClienteFormData] = useState({
    name: '',
    email: '',
    telefone: '',
    cnpj: '',
    endereco: {
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    contato: {
      nome: '',
      cargo: '',
      telefone: '',
      email: ''
    },
    status: 'ativo',
    observacoes: ''
  })

  const filteredClientes = mockClientes.filter(cliente => {
    const matchesSearch = cliente.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.cnpj.includes(searchTerm)
    const matchesStatus = selectedStatus === "all" || cliente.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800'
      case 'inativo': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo': return <CheckCircle className="w-4 h-4" />
      case 'inativo': return <XCircle className="w-4 h-4" />
      default: return <XCircle className="w-4 h-4" />
    }
  }

  const handleViewDetails = (cliente: any) => {
    setSelectedCliente(cliente)
    setIsDetailsDialogOpen(true)
  }

  const handleEdit = (cliente: any) => {
    setSelectedCliente(cliente)
    setClienteFormData({
      name: cliente.name,
      email: cliente.email,
      telefone: cliente.telefone,
      cnpj: cliente.cnpj,
      endereco: cliente.endereco,
      contato: cliente.contato,
      status: cliente.status,
      observacoes: cliente.observacoes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleCreateCliente = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simular criação do cliente
    const newCliente = {
      id: (mockClientes.length + 1).toString(),
      ...clienteFormData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Em uma aplicação real, isso seria uma chamada para a API
    console.log('Novo cliente criado:', newCliente)
    
    // Resetar formulário e fechar dialog
    setClienteFormData({
      name: '',
      email: '',
      telefone: '',
      cnpj: '',
      endereco: {
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: ''
      },
      contato: {
        nome: '',
        cargo: '',
        telefone: '',
        email: ''
      },
      status: 'ativo',
      observacoes: ''
    })
    setIsCreateDialogOpen(false)
    
    // Mostrar mensagem de sucesso (simulado)
    alert('Cliente criado com sucesso!')
  }

  const handleUpdateCliente = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simular atualização do cliente
    const updatedCliente = {
      ...selectedCliente,
      ...clienteFormData,
      updatedAt: new Date().toISOString()
    }

    // Em uma aplicação real, isso seria uma chamada para a API
    console.log('Cliente atualizado:', updatedCliente)
    
    setIsEditDialogOpen(false)
    
    // Mostrar mensagem de sucesso (simulado)
    alert('Cliente atualizado com sucesso!')
  }

  const stats = [
    { 
      title: "Total de Clientes", 
      value: mockClientes.length, 
      icon: Building2, 
      color: "bg-blue-500" 
    },
    { 
      title: "Clientes Ativos", 
      value: mockClientes.filter(c => c.status === 'ativo').length, 
      icon: CheckCircle, 
      color: "bg-green-500" 
    },
    { 
      title: "Clientes Inativos", 
      value: mockClientes.filter(c => c.status === 'inativo').length, 
      icon: XCircle, 
      color: "bg-gray-500" 
    },
    { 
      title: "Obras Ativas", 
      value: mockClientes.filter(c => c.status === 'ativo').reduce((sum, cliente) => {
        return sum + getObrasByCliente(cliente.id).filter(obra => obra.status === 'ativa').length
      }, 0), 
      icon: FileText, 
      color: "bg-purple-500" 
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gerenciamento de clientes e suas obras</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
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
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar clientes</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Nome, email ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setSelectedStatus("all")
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClientes.map((cliente) => {
          const obras = getObrasByCliente(cliente.id)
          const obrasAtivas = obras.filter(obra => obra.status === 'ativa')
          
          return (
            <Card key={cliente.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{cliente.name}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(cliente.status)}>
                    {getStatusIcon(cliente.status)}
                    <span className="ml-1 capitalize">{cliente.status}</span>
                  </Badge>
                </div>
                <CardDescription>{cliente.cnpj}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{cliente.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{cliente.telefone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{cliente.endereco.cidade}, {cliente.endereco.estado}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{cliente.contato.nome} - {cliente.contato.cargo}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Obras</h4>
                      <Badge variant="outline">
                        {obras.length} total
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Ativas:</span>
                        <span className="font-medium text-green-600">{obrasAtivas.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Concluídas:</span>
                        <span className="font-medium text-gray-600">{obras.length - obrasAtivas.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(cliente)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(cliente)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialog de Criação de Cliente */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Novo Cliente
            </DialogTitle>
          </DialogHeader>
          <ClienteForm 
            formData={clienteFormData}
            setFormData={setClienteFormData}
            onSubmit={handleCreateCliente}
            onClose={() => setIsCreateDialogOpen(false)}
            isEdit={false}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Cliente */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Cliente
            </DialogTitle>
          </DialogHeader>
          <ClienteForm 
            formData={clienteFormData}
            setFormData={setClienteFormData}
            onSubmit={handleUpdateCliente}
            onClose={() => setIsEditDialogOpen(false)}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes do Cliente */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalhes do Cliente
            </DialogTitle>
          </DialogHeader>
          {selectedCliente && <ClienteDetails cliente={selectedCliente} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ClienteForm({ formData, setFormData, onSubmit, onClose, isEdit }: { 
  formData: any; 
  setFormData: (data: any) => void; 
  onSubmit: (e: React.FormEvent) => void; 
  onClose: () => void;
  isEdit: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informações Básicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Construtora ABC Ltda"
              required
            />
          </div>
          <div>
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contato@empresa.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone *</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
              required
            />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="rua">Rua *</Label>
            <Input
              id="rua"
              value={formData.endereco.rua}
              onChange={(e) => setFormData({ 
                ...formData, 
                endereco: { ...formData.endereco, rua: e.target.value }
              })}
              placeholder="Nome da rua"
              required
            />
          </div>
          <div>
            <Label htmlFor="numero">Número *</Label>
            <Input
              id="numero"
              value={formData.endereco.numero}
              onChange={(e) => setFormData({ 
                ...formData, 
                endereco: { ...formData.endereco, numero: e.target.value }
              })}
              placeholder="123"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="complemento">Complemento</Label>
            <Input
              id="complemento"
              value={formData.endereco.complemento}
              onChange={(e) => setFormData({ 
                ...formData, 
                endereco: { ...formData.endereco, complemento: e.target.value }
              })}
              placeholder="Sala 45"
            />
          </div>
          <div>
            <Label htmlFor="bairro">Bairro *</Label>
            <Input
              id="bairro"
              value={formData.endereco.bairro}
              onChange={(e) => setFormData({ 
                ...formData, 
                endereco: { ...formData.endereco, bairro: e.target.value }
              })}
              placeholder="Centro"
              required
            />
          </div>
          <div>
            <Label htmlFor="cep">CEP *</Label>
            <Input
              id="cep"
              value={formData.endereco.cep}
              onChange={(e) => setFormData({ 
                ...formData, 
                endereco: { ...formData.endereco, cep: e.target.value }
              })}
              placeholder="01234-567"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cidade">Cidade *</Label>
            <Input
              id="cidade"
              value={formData.endereco.cidade}
              onChange={(e) => setFormData({ 
                ...formData, 
                endereco: { ...formData.endereco, cidade: e.target.value }
              })}
              placeholder="São Paulo"
              required
            />
          </div>
          <div>
            <Label htmlFor="estado">Estado *</Label>
            <Input
              id="estado"
              value={formData.endereco.estado}
              onChange={(e) => setFormData({ 
                ...formData, 
                endereco: { ...formData.endereco, estado: e.target.value }
              })}
              placeholder="SP"
              required
            />
          </div>
        </div>
      </div>

      {/* Contato */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pessoa de Contato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contatoNome">Nome *</Label>
            <Input
              id="contatoNome"
              value={formData.contato.nome}
              onChange={(e) => setFormData({ 
                ...formData, 
                contato: { ...formData.contato, nome: e.target.value }
              })}
              placeholder="João Silva"
              required
            />
          </div>
          <div>
            <Label htmlFor="contatoCargo">Cargo *</Label>
            <Input
              id="contatoCargo"
              value={formData.contato.cargo}
              onChange={(e) => setFormData({ 
                ...formData, 
                contato: { ...formData.contato, cargo: e.target.value }
              })}
              placeholder="Gerente de Projetos"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contatoEmail">Email *</Label>
            <Input
              id="contatoEmail"
              type="email"
              value={formData.contato.email}
              onChange={(e) => setFormData({ 
                ...formData, 
                contato: { ...formData.contato, email: e.target.value }
              })}
              placeholder="joao.silva@empresa.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="contatoTelefone">Telefone *</Label>
            <Input
              id="contatoTelefone"
              value={formData.contato.telefone}
              onChange={(e) => setFormData({ 
                ...formData, 
                contato: { ...formData.contato, telefone: e.target.value }
              })}
              placeholder="(11) 88888-8888"
              required
            />
          </div>
        </div>
      </div>

      {/* Status e Observações */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Status e Observações</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            placeholder="Observações sobre o cliente..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {isEdit ? 'Atualizar' : 'Criar'} Cliente
        </Button>
      </div>
    </form>
  )
}

function ClienteDetails({ cliente }: { cliente: any }) {
  const obras = getObrasByCliente(cliente.id)
  
  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Informações da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Nome:</span>
              <span className="text-sm font-medium">{cliente.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">CNPJ:</span>
              <span className="text-sm">{cliente.cnpj}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Email:</span>
              <span className="text-sm">{cliente.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Telefone:</span>
              <span className="text-sm">{cliente.telefone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge className={cliente.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {cliente.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              {cliente.endereco.rua}, {cliente.endereco.numero}
              {cliente.endereco.complemento && `, ${cliente.endereco.complemento}`}
            </p>
            <p className="text-sm">
              {cliente.endereco.bairro} - {cliente.endereco.cidade}/{cliente.endereco.estado}
            </p>
            <p className="text-sm">CEP: {cliente.endereco.cep}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pessoa de Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pessoa de Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Nome:</span>
            <span className="text-sm font-medium">{cliente.contato.nome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Cargo:</span>
            <span className="text-sm">{cliente.contato.cargo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Email:</span>
            <span className="text-sm">{cliente.contato.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Telefone:</span>
            <span className="text-sm">{cliente.contato.telefone}</span>
          </div>
        </CardContent>
      </Card>

      {/* Obras do Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Obras ({obras.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {obras.length > 0 ? (
            <div className="space-y-2">
              {obras.map((obra) => (
                <div key={obra.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium">{obra.name}</p>
                    <p className="text-xs text-gray-500">{obra.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={obra.status === 'ativa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {obra.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(obra.startDate).toLocaleDateString('pt-BR')} - 
                      {obra.endDate ? new Date(obra.endDate).toLocaleDateString('pt-BR') : 'Em andamento'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhuma obra encontrada para este cliente
            </p>
          )}
        </CardContent>
      </Card>

      {/* Observações */}
      {cliente.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{cliente.observacoes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
