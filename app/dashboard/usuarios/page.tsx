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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { apiPerfis, apiPermissoes, apiPerfilPermissoes, utilsPermissoes, type Perfil, type Permissao, type PerfilPermissao } from "@/lib/api-permissoes"
import { apiUsuarios, utilsUsuarios, type Usuario } from "@/lib/api-usuarios"
import { CardLoader, ButtonLoader } from "@/components/ui/loader"
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
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  Key,
  Lock,
  Unlock,
  ChevronRight,
  Save,
  X
} from "lucide-react"

// Tipos para compatibilidade com o frontend
interface UsuarioFrontend {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string | null;
  permissions: string[];
  perfil?: {
    id: number;
    nome: string;
    nivel_acesso: number;
    descricao?: string;
  };
}

const roleLabels = {
  admin: "Administrador",
  gestor: "Gestor",
  cliente: "Cliente", 
  funcionario_nivel_1: "Funcionário Nível 1",
  funcionario_nivel_2: "Funcionário Nível 2",
  funcionario_nivel_3: "Funcionário Nível 3",
  administrador: "Administrador",
  gerente: "Gerente",
  supervisor: "Supervisor",
  operador: "Operador",
  visualizador: "Visualizador",
  user: "Usuário"
}

const roleColors = {
  admin: "bg-red-100 text-red-800",
  gestor: "bg-purple-100 text-purple-800", 
  cliente: "bg-blue-100 text-blue-800",
  funcionario_nivel_1: "bg-green-100 text-green-800",
  funcionario_nivel_2: "bg-yellow-100 text-yellow-800",
  funcionario_nivel_3: "bg-orange-100 text-orange-800",
  administrador: "bg-red-100 text-red-800",
  gerente: "bg-purple-100 text-purple-800",
  supervisor: "bg-blue-100 text-blue-800",
  operador: "bg-green-100 text-green-800",
  visualizador: "bg-gray-100 text-gray-800",
  user: "bg-gray-100 text-gray-800"
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
  const { toast } = useToast()
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
  
  const [usuarios, setUsuarios] = useState<UsuarioFrontend[]>([])
  const [usuariosBackend, setUsuariosBackend] = useState<Usuario[]>([])

  // Estados para o sistema de permissões
  const [isPermissoesSidebarOpen, setIsPermissoesSidebarOpen] = useState(false)
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [permissoes, setPermissoes] = useState<Permissao[]>([])
  const [perfilSelecionado, setPerfilSelecionado] = useState<Perfil | null>(null)
  const [permissoesPerfil, setPermissoesPerfil] = useState<PerfilPermissao[]>([])
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<number[]>([])
  const [loadingPermissoes, setLoadingPermissoes] = useState(false)
  const [savingPermissoes, setSavingPermissoes] = useState(false)
  
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
    administrador: ["all"],
    gerente: ["obras", "gruas", "funcionarios", "financeiro", "estoque", "relatorios"],
    supervisor: ["obras", "gruas", "funcionarios_read"],
    operador: ["obras_read", "gruas_read"],
    visualizador: ["obras_read", "gruas_read"],
    // Manter compatibilidade com roles antigos
    admin: ["all"],
    gestor: ["obras", "gruas", "funcionarios", "financeiro", "estoque", "relatorios"],
    funcionario_nivel_1: ["obras_read", "gruas_read"],
    funcionario_nivel_2: ["obras", "gruas", "funcionarios_read"],
    funcionario_nivel_3: ["obras", "gruas", "funcionarios", "financeiro_read"],
    cliente: ["obras_read", "gruas_read"]
  }

  // Funções para o sistema de permissões
  const carregarDadosPermissoes = async () => {
    try {
      setLoadingPermissoes(true)
      
      // Verificar se já temos os dados carregados
      if (perfis.length > 0 && permissoes.length > 0) {
        setLoadingPermissoes(false)
        return
      }
      
      const [perfisData, permissoesData] = await Promise.all([
        apiPerfis.listar(),
        apiPermissoes.listar()
      ])
      setPerfis(perfisData)
      setPermissoes(utilsPermissoes.filtrarAtivas(permissoesData))
    } catch (error: any) {
      console.error('Erro ao carregar dados de permissões:', error)
      
      // Se for erro de autenticação, redirecionar para login
      if (error.message?.includes('Token de acesso requerido') || 
          error.message?.includes('401') || 
          error.message?.includes('403')) {
        toast({
          title: "Sessão Expirada",
          description: "Sua sessão expirou. Faça login novamente.",
          variant: "destructive"
        })
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
        return
      }
      
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de permissões",
        variant: "destructive"
      })
    } finally {
      setLoadingPermissoes(false)
    }
  }

  const carregarPermissoesPerfil = async (perfilId: number) => {
    try {
      const permissoesData = await apiPerfilPermissoes.obterPermissoes(perfilId)
      setPermissoesPerfil(permissoesData)
      
      // Mapear permissões selecionadas
      const selecionadas = permissoesData
        .filter(pp => pp.status === 'Ativa')
        .map(pp => pp.permissao_id)
      setPermissoesSelecionadas(selecionadas)
    } catch (error) {
      console.error('Erro ao carregar permissões do perfil:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar permissões do perfil",
        variant: "destructive"
      })
    }
  }

  const handlePerfilChange = async (perfilId: string) => {
    const perfil = perfis.find(p => p.id === parseInt(perfilId))
    setPerfilSelecionado(perfil || null)
    
    if (perfil) {
      await carregarPermissoesPerfil(perfil.id)
    } else {
      setPermissoesPerfil([])
      setPermissoesSelecionadas([])
    }
  }

  const handlePermissaoToggle = (permissaoId: number, checked: boolean) => {
    if (checked) {
      setPermissoesSelecionadas(prev => [...prev, permissaoId])
    } else {
      setPermissoesSelecionadas(prev => prev.filter(id => id !== permissaoId))
    }
  }

  const salvarPermissoes = async () => {
    if (!perfilSelecionado) return

    try {
      setSavingPermissoes(true)
      await apiPerfilPermissoes.atualizarPermissoes(perfilSelecionado.id, permissoesSelecionadas)
      
      toast({
        title: "Sucesso",
        description: "Permissões salvas com sucesso"
      })
      
      // Recarregar permissões do perfil
      await carregarPermissoesPerfil(perfilSelecionado.id)
    } catch (error) {
      console.error('Erro ao salvar permissões:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar permissões",
        variant: "destructive"
      })
    } finally {
      setSavingPermissoes(false)
    }
  }

  const abrirSidebarPermissoes = () => {
    setIsPermissoesSidebarOpen(true)
    // Só carregar dados se ainda não foram carregados
    if (perfis.length === 0 || permissoes.length === 0) {
      carregarDadosPermissoes()
    }
  }

  // Funções para carregar dados reais do backend
  // Função para mapear role para perfil_id
  const getPerfilIdByRole = (role: string): number | null => {
    const roleToPerfilMap: { [key: string]: number } = {
      'admin': 1,        // Administrador
      'gerente': 2,      // Gerente
      'supervisor': 3,   // Supervisor
      'operador': 4,     // Operador
      'visualizador': 5, // Visualizador
      'administrador': 1, // Administrador (alternativo)
      'gestor': 2,       // Gerente (alternativo)
      'cliente': 5,      // Cliente como Visualizador
      'funcionario_nivel_1': 4, // Operador
      'funcionario_nivel_2': 3, // Supervisor
      'funcionario_nivel_3': 2  // Gerente
    }
    console.log('🔍 DEBUG: Mapeando role:', role, '-> perfil_id:', roleToPerfilMap[role] || null)
    return roleToPerfilMap[role] || null
  }

  const carregarUsuarios = async () => {
    try {
      setLoading(true)
      const response = await apiUsuarios.listar()
      setUsuariosBackend(response.data)
      
      // Converter dados do backend para formato do frontend
      const usuariosFrontend = response.data.map(usuario => {
        // Extrair perfil do usuário (pode ser um array ou objeto único)
        const usuarioWithPerfil = usuario as any
        const perfilData = usuarioWithPerfil.usuario_perfis?.[0]?.perfis || usuarioWithPerfil.usuario_perfis?.perfis
        
        return {
          id: usuario.id.toString(),
          name: usuario.nome,
          email: usuario.email,
          phone: usuario.telefone || '',
          role: perfilData?.nome?.toLowerCase() || 'user',
          status: usuario.status.toLowerCase(),
          createdAt: usuario.created_at,
          lastLogin: usuario.ultimo_acesso || null,
          permissions: [], // Será carregado do sistema de permissões
          perfil: perfilData ? {
            id: perfilData.id,
            nome: perfilData.nome,
            nivel_acesso: perfilData.nivel_acesso,
            descricao: perfilData.descricao
          } : undefined
        }
      })
      
      setUsuarios(usuariosFrontend)
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error)
      
      // Se for erro de autenticação, redirecionar para login
      if (error.message?.includes('Token de acesso requerido') || 
          error.message?.includes('401') || 
          error.message?.includes('403')) {
        toast({
          title: "Sessão Expirada",
          description: "Sua sessão expirou. Faça login novamente.",
          variant: "destructive"
        })
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
        return
      }
      
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados quando o componente montar
  useEffect(() => {
    carregarUsuarios()
  }, [])

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
      
      // Converter dados do frontend para formato do backend
      const perfilId = getPerfilIdByRole(userFormData.role)
      const dadosBackend = {
        nome: userFormData.name,
        email: userFormData.email,
        telefone: userFormData.phone,
        status: (userFormData.status === 'active' ? 'Ativo' : 
                userFormData.status === 'inactive' ? 'Inativo' : 
                userFormData.status === 'suspended' ? 'Bloqueado' : 'Pendente') as 'Ativo' | 'Inativo' | 'Bloqueado' | 'Pendente',
        ...(perfilId && { perfil_id: perfilId })
      }
      
      const novoUsuario = await apiUsuarios.criar(dadosBackend)
      
      // Recarregar lista de usuários
      await carregarUsuarios()
      
      setIsCreateDialogOpen(false)
      resetForm()
      
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!"
      })
      
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário",
        variant: "destructive"
      })
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
    
    if (!editingUser) return
    
    try {
      setUpdating(true)
      
      // Converter dados do frontend para formato do backend
      const perfilId = getPerfilIdByRole(userFormData.role)
      console.log('🔍 DEBUG: Role selecionado:', userFormData.role)
      console.log('🔍 DEBUG: Perfil ID mapeado:', perfilId)
      
      const dadosBackend = {
        nome: userFormData.name,
        email: userFormData.email,
        telefone: userFormData.phone,
        status: (userFormData.status === 'active' ? 'Ativo' : 
                userFormData.status === 'inactive' ? 'Inativo' : 
                userFormData.status === 'suspended' ? 'Bloqueado' : 'Pendente') as 'Ativo' | 'Inativo' | 'Bloqueado' | 'Pendente',
        ...(perfilId && { perfil_id: perfilId })
      }
      
      console.log('🔍 DEBUG: Payload enviado:', dadosBackend)
      
      await apiUsuarios.atualizar(parseInt(editingUser.id), dadosBackend)
      
      // Recarregar lista de usuários
      await carregarUsuarios()
      
      setIsEditDialogOpen(false)
      setEditingUser(null)
      resetForm()
      
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!"
      })
      
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar usuário",
        variant: "destructive"
      })
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
      
      await apiUsuarios.excluir(parseInt(userToDelete.id))
      
      // Recarregar lista de usuários
      await carregarUsuarios()
      
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      
      toast({
        title: "Sucesso",
        description: `Usuário "${userToDelete.name}" excluído com sucesso!`
      })
      
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir usuário",
        variant: "destructive"
      })
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
    const statusBackend = newStatus === 'active' ? 'Ativo' : 'Inativo'
    
    try {
      await apiUsuarios.atualizarStatus(parseInt(usuario.id), statusBackend)
      
      // Recarregar lista de usuários
      await carregarUsuarios()
      
      toast({
        title: "Sucesso",
        description: `Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`
      })
      
    } catch (error: any) {
      console.error('Erro ao alterar status do usuário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar status do usuário",
        variant: "destructive"
      })
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
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={abrirSidebarPermissoes}
          >
            <Shield className="w-4 h-4" />
            Permissões
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </Button>
        </div>
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
          {loading ? (
            <CardLoader text="Carregando usuários..." />
          ) : (
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
                      <div className="space-y-2">
                        {usuario.perfil ? (
                          <div>
                            <Badge variant="secondary" className="text-xs">
                              {usuario.perfil.nome}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              Nível: {usuario.perfil.nivel_acesso}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Sem perfil
                          </Badge>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {usuario.permissions.slice(0, 2).map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {availablePermissions[permission as keyof typeof availablePermissions] || permission}
                            </Badge>
                          ))}
                          {usuario.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{usuario.permissions.length - 2} mais
                            </Badge>
                          )}
                        </div>
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
          )}
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
                      <SelectItem value="administrador">Administrador</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                      <SelectItem value="visualizador">Visualizador</SelectItem>
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
                  <ButtonLoader text="Criando..." />
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
                      <SelectItem value="administrador">Administrador</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                      <SelectItem value="visualizador">Visualizador</SelectItem>
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
                  <ButtonLoader text="Atualizando..." />
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
                <ButtonLoader text="Excluindo..." />
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

      {/* Sidebar de Permissões */}
      <Sheet open={isPermissoesSidebarOpen} onOpenChange={setIsPermissoesSidebarOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Gerenciar Permissões
            </SheetTitle>
            <SheetDescription>
              Configure as permissões para cada perfil de usuário
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 mx-6 space-y-6">
            {/* Seleção de Perfil */}
            <div className="space-y-2">
              <Label htmlFor="perfil-select">Selecionar Perfil</Label>
              <Select onValueChange={handlePerfilChange} disabled={loadingPermissoes}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um perfil para gerenciar" />
                </SelectTrigger>
                <SelectContent>
                  {perfis.map((perfil) => (
                    <SelectItem key={perfil.id} value={perfil.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{perfil.nome}</span>
                        <Badge variant="outline" className="ml-2">
                          Nível {perfil.nivel_acesso}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {perfilSelecionado && (
              <>
                <Separator />
                
                {/* Informações do Perfil */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-lg">{perfilSelecionado.nome}</h3>
                  {perfilSelecionado.descricao && (
                    <p className="text-sm text-gray-600 mt-1">{perfilSelecionado.descricao}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="outline">
                      Nível {perfilSelecionado.nivel_acesso}
                    </Badge>
                    <Badge variant={perfilSelecionado.status === 'Ativo' ? 'default' : 'secondary'}>
                      {perfilSelecionado.status}
                    </Badge>
                  </div>
                </div>

                {/* Lista de Permissões */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Permissões</h3>
                    <Badge variant="outline">
                      {permissoesSelecionadas.length} selecionadas
                    </Badge>
                  </div>

                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {(() => {
                        const permissoesAgrupadas = utilsPermissoes.agruparPorModulo(permissoes)
                        const modulos = utilsPermissoes.obterModulos(permissoes)
                        
                        return modulos.map((modulo) => (
                          <div key={modulo} className="space-y-2">
                            <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                              {modulo}
                            </h4>
                            <div className="space-y-2 pl-4">
                              {permissoesAgrupadas[modulo].map((permissao) => (
                                <div key={permissao.id} className="flex items-center space-x-3">
                                  <Checkbox
                                    id={`permissao-${permissao.id}`}
                                    checked={permissoesSelecionadas.includes(permissao.id)}
                                    onCheckedChange={(checked) => 
                                      handlePermissaoToggle(permissao.id, checked as boolean)
                                    }
                                  />
                                  <div className="flex-1">
                                    <Label 
                                      htmlFor={`permissao-${permissao.id}`}
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      {permissao.nome}
                                    </Label>
                                    {permissao.descricao && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {permissao.descricao}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  </ScrollArea>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsPermissoesSidebarOpen(false)}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={salvarPermissoes}
                    disabled={savingPermissoes}
                    className="flex-1"
                  >
                    {savingPermissoes ? (
                      <ButtonLoader text="Salvando..." />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Permissões
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {loadingPermissoes && (
              <CardLoader text="Carregando permissões..." />
            )}
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </AdminGuard>
  )
}
