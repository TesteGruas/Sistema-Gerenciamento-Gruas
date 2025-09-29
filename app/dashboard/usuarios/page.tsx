"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AdminGuard from "@/components/admin-guard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Shield, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  Key,
  Lock,
  Unlock
} from "lucide-react"

// Mock data para usuários
const mockUsuarios = [
  {
    id: "1",
    name: "João Silva",
    email: "joao.silva@empresa.com",
    phone: "(11) 99999-9999",
    role: "admin",
    status: "active",
    createdAt: "2024-01-15",
    lastLogin: "2024-01-20",
    permissions: ["all"]
  },
  {
    id: "2", 
    name: "Maria Santos",
    email: "maria.santos@empresa.com",
    phone: "(11) 88888-8888",
    role: "gestor",
    status: "active",
    createdAt: "2024-01-16",
    lastLogin: "2024-01-19",
    permissions: ["obras", "gruas", "funcionarios", "financeiro"]
  },
  {
    id: "3",
    name: "Pedro Costa",
    email: "pedro.costa@empresa.com", 
    phone: "(11) 77777-7777",
    role: "funcionario_nivel_1",
    status: "active",
    createdAt: "2024-01-17",
    lastLogin: "2024-01-18",
    permissions: ["obras_read", "gruas_read"]
  },
  {
    id: "4",
    name: "Ana Oliveira",
    email: "ana.oliveira@empresa.com",
    phone: "(11) 66666-6666", 
    role: "funcionario_nivel_2",
    status: "inactive",
    createdAt: "2024-01-18",
    lastLogin: "2024-01-15",
    permissions: ["obras", "gruas", "funcionarios_read"]
  },
  {
    id: "5",
    name: "Carlos Ferreira",
    email: "carlos.ferreira@empresa.com",
    phone: "(11) 55555-5555",
    role: "funcionario_nivel_3", 
    status: "active",
    createdAt: "2024-01-19",
    lastLogin: "2024-01-20",
    permissions: ["obras", "gruas", "funcionarios", "financeiro_read"]
  },
  {
    id: "6",
    name: "Cliente ABC Construtora",
    email: "contato@abcconstrutora.com",
    phone: "(11) 44444-4444",
    role: "cliente",
    status: "active", 
    createdAt: "2024-01-20",
    lastLogin: "2024-01-20",
    permissions: ["obras_read", "gruas_read"]
  }
]

const roleLabels = {
  admin: "Administrador",
  gestor: "Gestor",
  cliente: "Cliente", 
  funcionario_nivel_1: "Funcionário Nível 1",
  funcionario_nivel_2: "Funcionário Nível 2",
  funcionario_nivel_3: "Funcionário Nível 3"
}

const roleColors = {
  admin: "bg-red-100 text-red-800",
  gestor: "bg-purple-100 text-purple-800", 
  cliente: "bg-blue-100 text-blue-800",
  funcionario_nivel_1: "bg-green-100 text-green-800",
  funcionario_nivel_2: "bg-yellow-100 text-yellow-800",
  funcionario_nivel_3: "bg-orange-100 text-orange-800"
}

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  suspended: "bg-red-100 text-red-800"
}

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo", 
  suspended: "Suspenso"
}

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const [usuarios, setUsuarios] = useState(mockUsuarios)
  
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    status: 'active',
    permissions: [] as string[]
  })

  const availablePermissions = {
    all: "Acesso Total",
    obras: "Gerenciar Obras",
    obras_read: "Visualizar Obras",
    gruas: "Gerenciar Gruas", 
    gruas_read: "Visualizar Gruas",
    funcionarios: "Gerenciar Funcionários",
    funcionarios_read: "Visualizar Funcionários",
    financeiro: "Gerenciar Financeiro",
    financeiro_read: "Visualizar Financeiro",
    estoque: "Gerenciar Estoque",
    estoque_read: "Visualizar Estoque",
    relatorios: "Gerenciar Relatórios",
    relatorios_read: "Visualizar Relatórios",
    usuarios: "Gerenciar Usuários",
    usuarios_read: "Visualizar Usuários"
  }

  const rolePermissions = {
    admin: ["all"],
    gestor: ["obras", "gruas", "funcionarios", "financeiro", "estoque", "relatorios"],
    funcionario_nivel_1: ["obras_read", "gruas_read"],
    funcionario_nivel_2: ["obras", "gruas", "funcionarios_read"],
    funcionario_nivel_3: ["obras", "gruas", "funcionarios", "financeiro_read"],
    cliente: ["obras_read", "gruas_read"]
  }

  const filteredUsuarios = usuarios.filter(usuario =>
    (usuario.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (usuario.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (usuario.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />
      case 'gestor': return <Settings className="w-4 h-4" />
      case 'cliente': return <UserCheck className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'inactive': return <UserX className="w-4 h-4" />
      case 'suspended': return <Lock className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setCreating(true)
      
      const newUser = {
        id: Date.now().toString(),
        ...userFormData,
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: null,
        permissions: rolePermissions[userFormData.role as keyof typeof rolePermissions] || []
      }
      
      setUsuarios([...usuarios, newUser])
      setIsCreateDialogOpen(false)
      resetForm()
      
      alert('Usuário criado com sucesso!')
      
    } catch (err) {
      console.error('Erro ao criar usuário:', err)
      alert('Erro ao criar usuário')
    } finally {
      setCreating(false)
    }
  }

  const handleEditUser = (usuario: any) => {
    setEditingUser(usuario)
    setUserFormData({
      name: usuario.name,
      email: usuario.email,
      phone: usuario.phone,
      role: usuario.role,
      status: usuario.status,
      permissions: usuario.permissions
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setUpdating(true)
      
      const updatedUser = {
        ...editingUser,
        ...userFormData,
        permissions: rolePermissions[userFormData.role as keyof typeof rolePermissions] || []
      }
      
      setUsuarios(usuarios.map(u => u.id === editingUser.id ? updatedUser : u))
      setIsEditDialogOpen(false)
      setEditingUser(null)
      resetForm()
      
      alert('Usuário atualizado com sucesso!')
      
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err)
      alert('Erro ao atualizar usuário')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteUser = (usuario: any) => {
    setUserToDelete(usuario)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setDeleting(true)
      
      setUsuarios(usuarios.filter(u => u.id !== userToDelete.id))
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      
      alert(`Usuário "${userToDelete.name}" excluído com sucesso!`)
      
    } catch (err) {
      console.error('Erro ao excluir usuário:', err)
      alert('Erro ao excluir usuário')
    } finally {
      setDeleting(false)
    }
  }

  const resetForm = () => {
    setUserFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      status: 'active',
      permissions: []
    })
  }

  const toggleUserStatus = async (usuario: any) => {
    const newStatus = usuario.status === 'active' ? 'inactive' : 'active'
    
    try {
      setUsuarios(usuarios.map(u => 
        u.id === usuario.id ? { ...u, status: newStatus } : u
      ))
      
      alert(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`)
      
    } catch (err) {
      console.error('Erro ao alterar status do usuário:', err)
      alert('Erro ao alterar status do usuário')
    }
  }

  return (
    <AdminGuard>
      <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="text-gray-600">Controle de acesso e permissões do sistema</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold">{usuarios.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold">{usuarios.filter(u => u.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Administradores</p>
                <p className="text-2xl font-bold">{usuarios.filter(u => u.role === 'admin').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Gestores</p>
                <p className="text-2xl font-bold">{usuarios.filter(u => u.role === 'gestor').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Buscar usuários</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Nome, email ou função..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuários do Sistema
          </CardTitle>
          <CardDescription>
            Gerencie usuários, permissões e acessos ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{usuario.name}</p>
                          <p className="text-sm text-gray-500">{usuario.email}</p>
                          <p className="text-xs text-gray-400">{usuario.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[usuario.role as keyof typeof roleColors]}>
                        {getRoleIcon(usuario.role)}
                        <span className="ml-1">{roleLabels[usuario.role as keyof typeof roleLabels]}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[usuario.status as keyof typeof statusColors]}>
                        {getStatusIcon(usuario.status)}
                        <span className="ml-1">{statusLabels[usuario.status as keyof typeof statusLabels]}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{usuario.lastLogin ? new Date(usuario.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}</p>
                        <p className="text-xs text-gray-500">
                          Criado: {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {usuario.permissions.slice(0, 3).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {availablePermissions[permission as keyof typeof availablePermissions] || permission}
                          </Badge>
                        ))}
                        {usuario.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{usuario.permissions.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(usuario)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(usuario)}
                          className={usuario.status === 'active' ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {usuario.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(usuario)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Dialog de Criação de Usuário */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Usuário
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-6">
            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="acesso">Acesso e Permissões</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                      placeholder="Ex: João Silva"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
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
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                      placeholder="Ex: (11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={userFormData.status}
                      onValueChange={(value) => setUserFormData({ ...userFormData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="suspended">Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="acesso" className="space-y-4">
                <div>
                  <Label htmlFor="role">Função no Sistema *</Label>
                  <Select
                    value={userFormData.role}
                    onValueChange={(value) => setUserFormData({ ...userFormData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="funcionario_nivel_1">Funcionário Nível 1</SelectItem>
                      <SelectItem value="funcionario_nivel_2">Funcionário Nível 2</SelectItem>
                      <SelectItem value="funcionario_nivel_3">Funcionário Nível 3</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {userFormData.role && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Permissões Automáticas</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      As seguintes permissões serão atribuídas automaticamente baseadas na função selecionada:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(rolePermissions[userFormData.role as keyof typeof rolePermissions] || []).map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {availablePermissions[permission as keyof typeof availablePermissions] || permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Usuário'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Usuário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Usuário
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-6">
            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="acesso">Acesso e Permissões</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Nome Completo *</Label>
                    <Input
                      id="edit-name"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                      placeholder="Ex: João Silva"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
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
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                      placeholder="Ex: (11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status *</Label>
                    <Select
                      value={userFormData.status}
                      onValueChange={(value) => setUserFormData({ ...userFormData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="suspended">Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="acesso" className="space-y-4">
                <div>
                  <Label htmlFor="edit-role">Função no Sistema *</Label>
                  <Select
                    value={userFormData.role}
                    onValueChange={(value) => setUserFormData({ ...userFormData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="funcionario_nivel_1">Funcionário Nível 1</SelectItem>
                      <SelectItem value="funcionario_nivel_2">Funcionário Nível 2</SelectItem>
                      <SelectItem value="funcionario_nivel_3">Funcionário Nível 3</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {userFormData.role && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Permissões Automáticas</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      As seguintes permissões serão atribuídas automaticamente baseadas na função selecionada:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(rolePermissions[userFormData.role as keyof typeof rolePermissions] || []).map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {availablePermissions[permission as keyof typeof availablePermissions] || permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Atualizar Usuário'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.name}</strong>?
              <br />
              <span className="text-red-600 text-sm">
                ⚠️ Esta ação não pode ser desfeita. O usuário será permanentemente removido do sistema.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminGuard>
  )
}
