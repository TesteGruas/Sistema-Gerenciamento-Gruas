"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  UserCheck,
  UserX,
  Building2,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Filter,
  Download,
  RefreshCw,
  User
} from "lucide-react"
import { apiRH } from "@/lib/api-rh"
import { funcionariosApi, type FuncionarioCreateData } from "@/lib/api-funcionarios"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CardLoader, ButtonLoader } from "@/components/ui/loader"

interface FuncionarioRH {
  id: number
  nome: string
  cpf: string
  cargo: string
  departamento: string
  salario: number
  data_admissao: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  status: 'Ativo' | 'Inativo' | 'Afastado' | 'Demitido' | 'Férias'
  turno?: 'Manhã' | 'Tarde' | 'Noite' | 'Integral' | 'Diurno' | 'Noturno' | 'Sob Demanda'
  observacoes?: string
  created_at: string
  updated_at: string
  usuario?: {
    id: number
    nome: string
    email: string
    status: string
  }
  obra_atual?: {
    id: number
    nome: string
    status: string
    cliente: {
      nome: string
    }
  }
}

export default function RHPage() {
  const [funcionarios, setFuncionarios] = useState<FuncionarioRH[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroNome, setFiltroNome] = useState("")
  const [filtroCargo, setFiltroCargo] = useState("all")
  const [filtroStatus, setFiltroStatus] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [funcionarioFormData, setFuncionarioFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    role: 'Operador' as 'Operador' | 'Sinaleiro' | 'Técnico Manutenção' | 'Supervisor' | 'Mecânico' | 'Engenheiro' | 'Chefe de Obras',
    status: 'Ativo' as 'Ativo' | 'Inativo' | 'Férias',
    turno: 'Diurno' as 'Diurno' | 'Noturno' | 'Sob Demanda',
    salary: '',
    hireDate: '',
    observations: '',
    criar_usuario: true,
    usuario_senha: ''
  })
  const [selectedFuncionario, setSelectedFuncionario] = useState<FuncionarioRH | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Carregar funcionários
  useEffect(() => {
    carregarFuncionarios()
  }, [])

  const carregarFuncionarios = async () => {
    try {
      setLoading(true)
      const response = await funcionariosApi.listarFuncionarios({
        page: 1,
        limit: 100
      })
      
      if (response.success && response.data) {
        // Mapear dados do backend para o formato esperado
        const funcionariosMapeados: FuncionarioRH[] = response.data.map(func => ({
          id: func.id,
          nome: func.nome,
          cpf: func.cpf || '',
          cargo: func.cargo,
          departamento: '',
          salario: func.salario || 0,
          data_admissao: func.data_admissao || '',
          telefone: func.telefone,
          email: func.email,
          endereco: '',
          cidade: '',
          estado: '',
          cep: '',
          status: func.status as any,
          turno: func.turno as any,
          observacoes: func.observacoes,
          created_at: func.created_at,
          updated_at: func.updated_at,
          usuario: Array.isArray(func.usuario) && func.usuario.length > 0 ? func.usuario[0] : undefined,
          obra_atual: undefined
        }))
        
        setFuncionarios(funcionariosMapeados)
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
      toast({
        title: "Erro ao carregar funcionários",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para criar funcionário
  const handleCreateFuncionario = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      
      const funcionarioData: FuncionarioCreateData = {
        nome: funcionarioFormData.name,
        cargo: funcionarioFormData.role,
        telefone: funcionarioFormData.phone,
        email: funcionarioFormData.email,
        cpf: funcionarioFormData.cpf,
        turno: funcionarioFormData.turno,
        status: funcionarioFormData.status,
        data_admissao: funcionarioFormData.hireDate,
        salario: parseFloat(funcionarioFormData.salary) || 0,
        observacoes: funcionarioFormData.observations,
        criar_usuario: funcionarioFormData.criar_usuario,
        usuario_senha: funcionarioFormData.criar_usuario ? funcionarioFormData.usuario_senha : undefined
      }
      
      const response = await funcionariosApi.criarFuncionario(funcionarioData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Funcionário criado com sucesso!",
        })
        
        // Recarregar lista
        await carregarFuncionarios()
        
        // Fechar dialog e limpar formulário
        setIsCreateDialogOpen(false)
        setFuncionarioFormData({
          name: '',
          email: '',
          phone: '',
          cpf: '',
          role: 'Operador',
          status: 'Ativo',
          turno: 'Diurno',
          salary: '',
          hireDate: '',
          observations: '',
          criar_usuario: true,
          usuario_senha: ''
        })
      } else {
        toast({
          title: "Erro",
          description: "Erro ao criar funcionário",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Erro ao criar funcionário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar funcionário",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Função para atualizar funcionário
  const handleUpdateFuncionario = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFuncionario) return
    
    try {
      setSubmitting(true)
      
      const funcionarioData: any = {
        nome: funcionarioFormData.name,
        cargo: funcionarioFormData.role,
        telefone: funcionarioFormData.phone,
        email: funcionarioFormData.email,
        cpf: funcionarioFormData.cpf,
        turno: funcionarioFormData.turno,
        status: funcionarioFormData.status,
        data_admissao: funcionarioFormData.hireDate,
        salario: parseFloat(funcionarioFormData.salary) || 0,
        observacoes: funcionarioFormData.observations
      }
      
      const response = await funcionariosApi.atualizarFuncionario(selectedFuncionario.id, funcionarioData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Funcionário atualizado com sucesso!",
        })
        
        // Recarregar lista
        await carregarFuncionarios()
        
        // Fechar dialog
        setIsEditDialogOpen(false)
        setSelectedFuncionario(null)
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar funcionário",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Erro ao atualizar funcionário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar funcionário",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Função para deletar funcionário
  const handleDeleteFuncionario = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) {
      return
    }
    
    try {
      // TODO: Implementar método deletarFuncionario na API
      toast({
        title: "Aviso",
        description: "Funcionalidade em desenvolvimento",
        variant: "default"
      })
    } catch (error: any) {
      console.error('Erro ao excluir funcionário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir funcionário",
        variant: "destructive"
      })
    }
  }

  // Abrir dialog de edição
  const handleEditClick = (funcionario: FuncionarioRH) => {
    setSelectedFuncionario(funcionario)
    setFuncionarioFormData({
      name: funcionario.nome,
      email: funcionario.email || '',
      phone: funcionario.telefone || '',
      cpf: funcionario.cpf,
      role: funcionario.cargo as any,
      status: funcionario.status as any,
      turno: (funcionario.turno || 'Diurno') as any,
      salary: funcionario.salario?.toString() || '',
      hireDate: funcionario.data_admissao,
      observations: funcionario.observacoes || '',
      criar_usuario: false,
      usuario_senha: ''
    })
    setIsEditDialogOpen(true)
  }

  // Navegar para página de detalhes
  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/rh/${id}`)
  }

  // Filtrar funcionários
  const funcionariosFiltrados = funcionarios.filter(func => {
    const matchNome = func.nome.toLowerCase().includes(filtroNome.toLowerCase())
    const matchCargo = filtroCargo === "all" || func.cargo === filtroCargo
    const matchStatus = filtroStatus === "all" || func.status === filtroStatus
    return matchNome && matchCargo && matchStatus
  })

  // Obter status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativo':
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs"><UserCheck className="w-3 h-3 mr-1" /> Ativo</Badge>
      case 'Inativo':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs"><UserX className="w-3 h-3 mr-1" /> Inativo</Badge>
      case 'Afastado':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">Afastado</Badge>
      case 'Férias':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Férias</Badge>
      case 'Demitido':
        return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Demitido</Badge>
      default:
        return <Badge className="text-xs">{status}</Badge>
    }
  }

  // Cargos únicos para filtro
  const cargosUnicos = Array.from(new Set(funcionarios.map(f => f.cargo))).sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recursos Humanos</h1>
          <p className="text-gray-600 mt-1">Gerencie os funcionários da empresa</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Funcionários</p>
                <p className="text-2xl font-bold text-gray-900">{funcionarios.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {funcionarios.filter(f => f.status === 'Ativo').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inativos</p>
                <p className="text-2xl font-bold text-gray-600">
                  {funcionarios.filter(f => f.status === 'Inativo').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-gray-100">
                <UserX className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Afastados/Férias</p>
                <p className="text-2xl font-bold text-orange-600">
                  {funcionarios.filter(f => f.status === 'Afastado' || f.status === 'Férias').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Tabela */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Funcionários</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={carregarFuncionarios}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filtroCargo} onValueChange={setFiltroCargo}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cargos</SelectItem>
                {cargosUnicos.map(cargo => (
                  <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
                <SelectItem value="Afastado">Afastado</SelectItem>
                <SelectItem value="Férias">Férias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : funcionariosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum funcionário encontrado</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] max-w-[200px]">Nome</TableHead>
                    <TableHead className="w-[180px]">CPF</TableHead>
                    <TableHead className="w-[180px]">Telefone</TableHead>
                    <TableHead className="flex-1">Cargo</TableHead>
                    <TableHead className="w-[120px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funcionariosFiltrados.map((funcionario) => (
                    <TableRow key={funcionario.id} className="hover:bg-gray-50">
                      <TableCell className="w-[200px] max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${funcionario.nome}`} />
                            <AvatarFallback className="text-xs">
                              {funcionario.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm truncate" title={funcionario.nome}>
                              {funcionario.nome}
                            </p>
                            <div className="mt-0.5">
                              {getStatusBadge(funcionario.status)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="w-[20%]">
                        <span className="text-gray-600 text-sm">{funcionario.cpf || '-'}</span>
                      </TableCell>
                      <TableCell className="w-[20%]">
                        {funcionario.telefone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 text-sm">{funcionario.telefone}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="w-[20%]">
                        <div>
                          <p className="font-medium text-sm">{funcionario.cargo}</p>
                          {funcionario.turno && (
                            <p className="text-xs text-gray-500">{funcionario.turno}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="w-[10%] text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(funcionario.id)}
                            title="Ver detalhes"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(funcionario)}
                            title="Editar"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFuncionario(funcionario.id)}
                            title="Excluir"
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
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

      {/* Dialog Criar Funcionário */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Funcionário</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateFuncionario} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={funcionarioFormData.name}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={funcionarioFormData.cpf}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, cpf: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={funcionarioFormData.email}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={funcionarioFormData.phone}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Cargo *</Label>
                <Select
                  value={funcionarioFormData.role}
                  onValueChange={(value: any) => setFuncionarioFormData({ ...funcionarioFormData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operador">Operador</SelectItem>
                    <SelectItem value="Sinaleiro">Sinaleiro</SelectItem>
                    <SelectItem value="Técnico Manutenção">Técnico Manutenção</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Mecânico">Mecânico</SelectItem>
                    <SelectItem value="Engenheiro">Engenheiro</SelectItem>
                    <SelectItem value="Chefe de Obras">Chefe de Obras</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="turno">Turno *</Label>
                <Select
                  value={funcionarioFormData.turno}
                  onValueChange={(value: any) => setFuncionarioFormData({ ...funcionarioFormData, turno: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diurno">Diurno</SelectItem>
                    <SelectItem value="Noturno">Noturno</SelectItem>
                    <SelectItem value="Sob Demanda">Sob Demanda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salário</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  value={funcionarioFormData.salary}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, salary: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hireDate">Data de Admissão *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={funcionarioFormData.hireDate}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, hireDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={funcionarioFormData.status}
                  onValueChange={(value: any) => setFuncionarioFormData({ ...funcionarioFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Férias">Férias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={funcionarioFormData.observations}
                onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, observations: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="criar_usuario"
                  checked={funcionarioFormData.criar_usuario}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, criar_usuario: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="criar_usuario" className="cursor-pointer">
                  Criar usuário de acesso ao sistema
                </Label>
              </div>
            </div>

            {funcionarioFormData.criar_usuario && (
              <div className="space-y-2">
                <Label htmlFor="usuario_senha">Senha do Usuário *</Label>
                <Input
                  id="usuario_senha"
                  type="password"
                  value={funcionarioFormData.usuario_senha}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, usuario_senha: e.target.value })}
                  required={funcionarioFormData.criar_usuario}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Funcionário
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Funcionário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpdateFuncionario} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Completo *</Label>
                <Input
                  id="edit-name"
                  value={funcionarioFormData.name}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cpf">CPF *</Label>
                <Input
                  id="edit-cpf"
                  value={funcionarioFormData.cpf}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, cpf: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={funcionarioFormData.email}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={funcionarioFormData.phone}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Cargo *</Label>
                <Select
                  value={funcionarioFormData.role}
                  onValueChange={(value: any) => setFuncionarioFormData({ ...funcionarioFormData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operador">Operador</SelectItem>
                    <SelectItem value="Sinaleiro">Sinaleiro</SelectItem>
                    <SelectItem value="Técnico Manutenção">Técnico Manutenção</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Mecânico">Mecânico</SelectItem>
                    <SelectItem value="Engenheiro">Engenheiro</SelectItem>
                    <SelectItem value="Chefe de Obras">Chefe de Obras</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-turno">Turno *</Label>
                <Select
                  value={funcionarioFormData.turno}
                  onValueChange={(value: any) => setFuncionarioFormData({ ...funcionarioFormData, turno: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diurno">Diurno</SelectItem>
                    <SelectItem value="Noturno">Noturno</SelectItem>
                    <SelectItem value="Sob Demanda">Sob Demanda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-salary">Salário</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  step="0.01"
                  value={funcionarioFormData.salary}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, salary: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-hireDate">Data de Admissão *</Label>
                <Input
                  id="edit-hireDate"
                  type="date"
                  value={funcionarioFormData.hireDate}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, hireDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={funcionarioFormData.status}
                  onValueChange={(value: any) => setFuncionarioFormData({ ...funcionarioFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Férias">Férias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-observations">Observações</Label>
              <Textarea
                id="edit-observations"
                value={funcionarioFormData.observations}
                onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, observations: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
