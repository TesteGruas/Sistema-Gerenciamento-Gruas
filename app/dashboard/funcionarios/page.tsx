"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  UserCheck,
  UserX,
  Building2
} from "lucide-react"
import { mockUsers } from "@/lib/mock-data"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function FuncionariosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingFuncionario, setEditingFuncionario] = useState<any>(null)
  const [funcionarioToDelete, setFuncionarioToDelete] = useState<any>(null)
  const [funcionarioFormData, setFuncionarioFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'funcionario',
    status: 'ativo',
    address: '',
    salary: '',
    hireDate: '',
    observations: '',
    obraId: '',
    obraName: ''
  })

  const filteredFuncionarios = mockUsers.filter(funcionario =>
    (funcionario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     funcionario.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedRole === "all" || funcionario.role === selectedRole) &&
    (selectedStatus === "all" || funcionario.status === selectedStatus)
  )

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'engenheiro': return 'bg-blue-100 text-blue-800'
      case 'chefe_obras': return 'bg-green-100 text-green-800'
      case 'funcionario': return 'bg-gray-100 text-gray-800'
      case 'diretor': return 'bg-purple-100 text-purple-800'
      case 'cliente': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800'
      case 'inativo': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'engenheiro': return 'Engenheiro'
      case 'chefe_obras': return 'Chefe de Obras'
      case 'funcionario': return 'Funcionário'
      case 'diretor': return 'Diretor'
      case 'cliente': return 'Cliente'
      default: return role
    }
  }

  const handleCreateFuncionario = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simular criação do funcionário
    const newFuncionario = {
      id: (mockUsers.length + 1).toString(),
      name: funcionarioFormData.name,
      email: funcionarioFormData.email,
      phone: funcionarioFormData.phone,
      role: funcionarioFormData.role as any,
      status: funcionarioFormData.status as 'ativo' | 'inativo',
      address: funcionarioFormData.address,
      salary: parseFloat(funcionarioFormData.salary) || 0,
      hireDate: funcionarioFormData.hireDate,
      observations: funcionarioFormData.observations,
      obraId: funcionarioFormData.obraId || null,
      obraName: funcionarioFormData.obraName || null,
      createdAt: new Date().toISOString(),
      lastLogin: null
    }

    // Em uma aplicação real, isso seria uma chamada para a API
    console.log('Novo funcionário criado:', newFuncionario)
    
    // Resetar formulário e fechar dialog
    setFuncionarioFormData({
      name: '',
      email: '',
      phone: '',
      role: 'funcionario',
      status: 'ativo',
      address: '',
      salary: '',
      hireDate: '',
      observations: '',
      obraId: '',
      obraName: ''
    })
    setIsCreateDialogOpen(false)
    
    // Mostrar mensagem de sucesso (simulado)
    alert('Funcionário criado com sucesso!')
  }

  const handleEditFuncionario = (funcionario: any) => {
    setEditingFuncionario(funcionario)
    setFuncionarioFormData({
      name: funcionario.name,
      email: funcionario.email,
      phone: funcionario.phone || '',
      role: funcionario.role,
      status: funcionario.status,
      address: funcionario.address || '',
      salary: funcionario.salary?.toString() || '',
      hireDate: funcionario.hireDate || '',
      observations: funcionario.observations || '',
      obraId: funcionario.obraId || '',
      obraName: funcionario.obraName || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateFuncionario = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simular atualização do funcionário
    const updatedFuncionario = {
      ...editingFuncionario,
      name: funcionarioFormData.name,
      email: funcionarioFormData.email,
      phone: funcionarioFormData.phone,
      role: funcionarioFormData.role,
      status: funcionarioFormData.status,
      address: funcionarioFormData.address,
      salary: parseFloat(funcionarioFormData.salary) || 0,
      hireDate: funcionarioFormData.hireDate,
      observations: funcionarioFormData.observations,
      obraId: funcionarioFormData.obraId || null,
      obraName: funcionarioFormData.obraName || null,
      updatedAt: new Date().toISOString()
    }

    // Em uma aplicação real, isso seria uma chamada para a API
    console.log('Funcionário atualizado:', updatedFuncionario)
    
    // Fechar dialog e resetar
    setIsEditDialogOpen(false)
    setEditingFuncionario(null)
    setFuncionarioFormData({
      name: '',
      email: '',
      phone: '',
      role: 'funcionario',
      status: 'ativo',
      address: '',
      salary: '',
      hireDate: '',
      observations: '',
      obraId: '',
      obraName: ''
    })
    
    // Mostrar mensagem de sucesso (simulado)
    alert('Funcionário atualizado com sucesso!')
  }

  const handleDeleteFuncionario = (funcionario: any) => {
    setFuncionarioToDelete(funcionario)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteFuncionario = () => {
    if (!funcionarioToDelete) return

    // Verificar se o funcionário está vinculado a uma obra
    if (funcionarioToDelete.obraId) {
      alert(`Não é possível excluir o funcionário "${funcionarioToDelete.name}" pois ele está vinculado à obra "${funcionarioToDelete.obraName}". Remova-o da obra primeiro.`)
      setIsDeleteDialogOpen(false)
      return
    }

    // Simular exclusão do funcionário
    console.log('Funcionário excluído:', funcionarioToDelete)
    
    setIsDeleteDialogOpen(false)
    setFuncionarioToDelete(null)
    
    // Mostrar mensagem de sucesso (simulado)
    alert(`Funcionário "${funcionarioToDelete.name}" excluído com sucesso!`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Funcionários</h1>
          <p className="text-gray-600">Controle e acompanhamento de todos os funcionários</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Buscar funcionários</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Nome ou email do funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Cargo</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cargos</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="engenheiro">Engenheiro</SelectItem>
                  <SelectItem value="chefe_obras">Chefe de Obras</SelectItem>
                  <SelectItem value="funcionario">Funcionário</SelectItem>
                  <SelectItem value="diretor">Diretor</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
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
        </CardContent>
      </Card>

      {/* Lista de Funcionários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFuncionarios.map((funcionario) => (
          <Card key={funcionario.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{funcionario.name}</CardTitle>
                    <CardDescription className="text-sm">{funcionario.email}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditFuncionario(funcionario)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteFuncionario(funcionario)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getRoleColor(funcionario.role)}>
                  {getRoleLabel(funcionario.role)}
                </Badge>
                <Badge variant="outline" className={getStatusColor(funcionario.status)}>
                  {funcionario.status === 'ativo' ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
                  {funcionario.status}
                </Badge>
              </div>

              {funcionario.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{funcionario.phone}</span>
                </div>
              )}

              {funcionario.obraName && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>Obra: {funcionario.obraName}</span>
                </div>
              )}

              {funcionario.lastLogin && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Último login: {format(new Date(funcionario.lastLogin), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
              )}

              <div className="pt-2 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Criação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Funcionário
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFuncionario} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={funcionarioFormData.name}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, name: e.target.value })}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={funcionarioFormData.email}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, email: e.target.value })}
                  placeholder="Ex: joao@empresa.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={funcionarioFormData.phone}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, phone: e.target.value })}
                  placeholder="Ex: (11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="role">Cargo *</Label>
                <Select
                  value={funcionarioFormData.role}
                  onValueChange={(value) => setFuncionarioFormData({ ...funcionarioFormData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="engenheiro">Engenheiro</SelectItem>
                    <SelectItem value="chefe_obras">Chefe de Obras</SelectItem>
                    <SelectItem value="funcionario">Funcionário</SelectItem>
                    <SelectItem value="diretor">Diretor</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={funcionarioFormData.status}
                  onValueChange={(value) => setFuncionarioFormData({ ...funcionarioFormData, status: value })}
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
              <div>
                <Label htmlFor="salary">Salário (R$)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={funcionarioFormData.salary}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, salary: e.target.value })}
                  placeholder="Ex: 5000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={funcionarioFormData.address}
                onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, address: e.target.value })}
                placeholder="Ex: Rua das Flores, 123 - São Paulo, SP"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hireDate">Data de Contratação</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={funcionarioFormData.hireDate}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, hireDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="obraId">Obra Vinculada (Opcional)</Label>
                <Input
                  id="obraId"
                  value={funcionarioFormData.obraName}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, obraName: e.target.value })}
                  placeholder="Nome da obra"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={funcionarioFormData.observations}
                onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, observations: e.target.value })}
                placeholder="Observações sobre o funcionário..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Funcionário
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Funcionário
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateFuncionario} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome Completo *</Label>
                <Input
                  id="edit-name"
                  value={funcionarioFormData.name}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, name: e.target.value })}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={funcionarioFormData.email}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, email: e.target.value })}
                  placeholder="Ex: joao@empresa.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={funcionarioFormData.phone}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, phone: e.target.value })}
                  placeholder="Ex: (11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Cargo *</Label>
                <Select
                  value={funcionarioFormData.role}
                  onValueChange={(value) => setFuncionarioFormData({ ...funcionarioFormData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="engenheiro">Engenheiro</SelectItem>
                    <SelectItem value="chefe_obras">Chefe de Obras</SelectItem>
                    <SelectItem value="funcionario">Funcionário</SelectItem>
                    <SelectItem value="diretor">Diretor</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={funcionarioFormData.status}
                  onValueChange={(value) => setFuncionarioFormData({ ...funcionarioFormData, status: value })}
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
              <div>
                <Label htmlFor="edit-salary">Salário (R$)</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  value={funcionarioFormData.salary}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, salary: e.target.value })}
                  placeholder="Ex: 5000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-address">Endereço</Label>
              <Input
                id="edit-address"
                value={funcionarioFormData.address}
                onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, address: e.target.value })}
                placeholder="Ex: Rua das Flores, 123 - São Paulo, SP"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-hireDate">Data de Contratação</Label>
                <Input
                  id="edit-hireDate"
                  type="date"
                  value={funcionarioFormData.hireDate}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, hireDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-obraId">Obra Vinculada (Opcional)</Label>
                <Input
                  id="edit-obraId"
                  value={funcionarioFormData.obraName}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, obraName: e.target.value })}
                  placeholder="Nome da obra"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-observations">Observações</Label>
              <Textarea
                id="edit-observations"
                value={funcionarioFormData.observations}
                onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, observations: e.target.value })}
                placeholder="Observações sobre o funcionário..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Atualizar Funcionário
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tem certeza que deseja excluir o funcionário <strong>{funcionarioToDelete?.name}</strong>?
            </p>
            <p className="text-xs text-red-600">
              ⚠️ Esta ação não pode ser desfeita. O funcionário será permanentemente removido do sistema.
            </p>
            {funcionarioToDelete?.obraId && (
              <p className="text-xs text-orange-600">
                ⚠️ Este funcionário está vinculado à obra "{funcionarioToDelete.obraName}". A exclusão será bloqueada.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteFuncionario}
              disabled={funcionarioToDelete?.obraId}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
