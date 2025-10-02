"use client"

import { useState, useEffect } from "react"
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
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CardLoader, ButtonLoader } from "@/components/ui/loader"
import { 
  funcionariosApi, 
  converterFuncionarioBackendParaFrontend, 
  converterFuncionarioFrontendParaBackend,
  FuncionarioBackend 
} from "@/lib/api-funcionarios"
import { useToast } from "@/hooks/use-toast"

export default function FuncionariosPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedTurno, setSelectedTurno] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingFuncionario, setEditingFuncionario] = useState<FuncionarioBackend | null>(null)
  const [funcionarioToDelete, setFuncionarioToDelete] = useState<FuncionarioBackend | null>(null)
  const [funcionarios, setFuncionarios] = useState<FuncionarioBackend[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [funcionarioFormData, setFuncionarioFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    role: 'Operador' as 'Operador' | 'Sinaleiro' | 'Técnico Manutenção' | 'Supervisor' | 'Mecânico',
    status: 'Ativo' as 'Ativo' | 'Inativo' | 'Férias',
    turno: 'Diurno' as 'Diurno' | 'Noturno' | 'Sob Demanda',
    salary: '',
    hireDate: '',
    observations: ''
  })

  // Carregar funcionários do backend
  useEffect(() => {
    carregarFuncionarios()
  }, [])

  const carregarFuncionarios = async (page: number = pagination.page) => {
    try {
      setLoading(true)
      const response = await funcionariosApi.listarFuncionarios({
        page,
        limit: pagination.limit,
        cargo: selectedRole !== "all" ? selectedRole : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        turno: selectedTurno !== "all" ? selectedTurno : undefined
      })
      
      if (response.success) {
        setFuncionarios(response.data)
        if (response.pagination) {
          setPagination(response.pagination)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar funcionários. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Recarregar quando filtros mudarem
  useEffect(() => {
    if (!loading) {
      carregarFuncionarios(1) // Reset para primeira página quando filtros mudarem
    }
  }, [selectedRole, selectedStatus, selectedTurno])

  // Função para mudar de página
  const handlePageChange = (newPage: number) => {
    carregarFuncionarios(newPage)
  }

  // Função para mudar limite por página
  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit }))
    carregarFuncionarios(1) // Reset para primeira página
  }

  // Busca local nos resultados (opcional - para busca mais rápida)
  const filteredFuncionarios = funcionarios.filter(funcionario =>
    searchTerm === "" || (
      (funcionario.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (funcionario.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (funcionario.cpf || '').includes(searchTerm) ||
      (funcionario.telefone || '').includes(searchTerm)
    )
  )

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Operador': return 'bg-blue-100 text-blue-800'
      case 'Sinaleiro': return 'bg-green-100 text-green-800'
      case 'Técnico Manutenção': return 'bg-purple-100 text-purple-800'
      case 'Supervisor': return 'bg-orange-100 text-orange-800'
      case 'Mecânico': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800'
      case 'Inativo': return 'bg-red-100 text-red-800'
      case 'Férias': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTurnoColor = (turno: string) => {
    switch (turno) {
      case 'Diurno': return 'bg-yellow-100 text-yellow-800'
      case 'Noturno': return 'bg-indigo-100 text-indigo-800'
      case 'Sob Demanda': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreateFuncionario = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      
      const funcionarioData = converterFuncionarioFrontendParaBackend({
        ...funcionarioFormData,
        salary: parseFloat(funcionarioFormData.salary) || 0
      })
      
      const response = await funcionariosApi.criarFuncionario(funcionarioData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Funcionário criado com sucesso! Redirecionando para a primeira página...",
        })
        
        // Recarregar lista de funcionários (primeira página para mostrar o novo funcionário)
        await carregarFuncionarios(1)
        
        // Resetar formulário e fechar dialog
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
          observations: ''
        })
        setIsCreateDialogOpen(false)
      }
    } catch (error: any) {
      console.error('Erro ao criar funcionário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar funcionário. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditFuncionario = (funcionario: FuncionarioBackend) => {
    setEditingFuncionario(funcionario)
    setFuncionarioFormData({
      name: funcionario.nome,
      email: funcionario.email || '',
      phone: funcionario.telefone || '',
      cpf: funcionario.cpf || '',
      role: funcionario.cargo,
      status: funcionario.status,
      turno: funcionario.turno,
      salary: funcionario.salario?.toString() || '',
      hireDate: funcionario.data_admissao || '',
      observations: funcionario.observacoes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateFuncionario = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingFuncionario) return
    
    try {
      setSubmitting(true)
      
      const funcionarioData = converterFuncionarioFrontendParaBackend({
        ...funcionarioFormData,
        salary: parseFloat(funcionarioFormData.salary) || 0
      })
      
      const response = await funcionariosApi.atualizarFuncionario(editingFuncionario.id, funcionarioData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Funcionário atualizado com sucesso!",
        })
        
        // Recarregar lista de funcionários (página atual)
        await carregarFuncionarios(pagination.page)
        
        // Fechar dialog e resetar
        setIsEditDialogOpen(false)
        setEditingFuncionario(null)
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
          observations: ''
        })
      }
    } catch (error: any) {
      console.error('Erro ao atualizar funcionário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar funcionário. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteFuncionario = (funcionario: FuncionarioBackend) => {
    setFuncionarioToDelete(funcionario)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteFuncionario = async () => {
    if (!funcionarioToDelete) return

    try {
      setSubmitting(true)
      
      const response = await funcionariosApi.excluirFuncionario(funcionarioToDelete.id)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: `Funcionário "${funcionarioToDelete.nome}" excluído com sucesso!`,
        })
        
        // Recarregar lista de funcionários (página atual ou anterior se necessário)
        const currentPage = pagination.page
        const shouldGoToPreviousPage = funcionarios.length === 1 && currentPage > 1
        await carregarFuncionarios(shouldGoToPreviousPage ? currentPage - 1 : currentPage)
        
        setIsDeleteDialogOpen(false)
        setFuncionarioToDelete(null)
      }
    } catch (error: any) {
      console.error('Erro ao excluir funcionário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir funcionário. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
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
                  <SelectItem value="Operador">Operador</SelectItem>
                  <SelectItem value="Sinaleiro">Sinaleiro</SelectItem>
                  <SelectItem value="Técnico Manutenção">Técnico Manutenção</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Mecânico">Mecânico</SelectItem>
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
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Férias">Férias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Turno</Label>
              <Select value={selectedTurno} onValueChange={setSelectedTurno}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Diurno">Diurno</SelectItem>
                  <SelectItem value="Noturno">Noturno</SelectItem>
                  <SelectItem value="Sob Demanda">Sob Demanda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Por página</Label>
              <Select value={pagination.limit.toString()} onValueChange={(value) => handleLimitChange(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Paginação */}
      {!loading && funcionarios.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} funcionários
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Funcionários */}
      {loading ? (
        <CardLoader text="Carregando funcionários..." />
      ) : filteredFuncionarios.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum funcionário encontrado</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando seu primeiro funcionário.'}
            </p>
          </CardContent>
        </Card>
      ) : (
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
                      <CardTitle className="text-lg">{funcionario.nome}</CardTitle>
                      <CardDescription className="text-sm">{funcionario.email || 'Sem email'}</CardDescription>
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
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={getRoleColor(funcionario.cargo)}>
                    {funcionario.cargo}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(funcionario.status)}>
                    {funcionario.status === 'Ativo' ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
                    {funcionario.status}
                  </Badge>
                  <Badge variant="outline" className={getTurnoColor(funcionario.turno)}>
                    {funcionario.turno}
                  </Badge>
                </div>

                {funcionario.telefone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{funcionario.telefone}</span>
                  </div>
                )}

                {funcionario.cpf && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>CPF: {funcionario.cpf}</span>
                  </div>
                )}

                {funcionario.data_admissao && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Admissão: {format(new Date(funcionario.data_admissao), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                )}

                {funcionario.salario && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Salário: R$ {funcionario.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
      )}

      {/* Controles de Paginação Avançados */}
      {!loading && funcionarios.length > 0 && pagination.pages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page <= 1}
              >
                Primeira
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Anterior
              </Button>
              
              {/* Mostrar páginas próximas */}
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const startPage = Math.max(1, pagination.page - 2)
                const pageNum = startPage + i
                if (pageNum > pagination.pages) return null
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                )
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                Próxima
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.pages)}
                disabled={pagination.page >= pagination.pages}
              >
                Última
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={funcionarioFormData.cpf}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, cpf: e.target.value })}
                  placeholder="Ex: 000.000.000-00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Cargo *</Label>
                <Select
                  value={funcionarioFormData.role}
                  onValueChange={(value) => setFuncionarioFormData({ ...funcionarioFormData, role: value as any })}
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
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="turno">Turno *</Label>
                <Select
                  value={funcionarioFormData.turno}
                  onValueChange={(value) => setFuncionarioFormData({ ...funcionarioFormData, turno: value as any })}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={funcionarioFormData.status}
                  onValueChange={(value) => setFuncionarioFormData({ ...funcionarioFormData, status: value as any })}
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
              <div>
                <Label htmlFor="salary">Salário (R$)</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  min="0"
                  value={funcionarioFormData.salary}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, salary: e.target.value })}
                  placeholder="Ex: 5000.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hireDate">Data de Admissão</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={funcionarioFormData.hireDate}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, hireDate: e.target.value })}
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
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <ButtonLoader text="Criando..." />
                ) : (
                  'Criar Funcionário'
                )}
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
                <Label htmlFor="edit-cpf">CPF</Label>
                <Input
                  id="edit-cpf"
                  value={funcionarioFormData.cpf}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, cpf: e.target.value })}
                  placeholder="Ex: 000.000.000-00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-role">Cargo *</Label>
                <Select
                  value={funcionarioFormData.role}
                  onValueChange={(value) => setFuncionarioFormData({ ...funcionarioFormData, role: value as any })}
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
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-turno">Turno *</Label>
                <Select
                  value={funcionarioFormData.turno}
                  onValueChange={(value) => setFuncionarioFormData({ ...funcionarioFormData, turno: value as any })}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={funcionarioFormData.status}
                  onValueChange={(value) => setFuncionarioFormData({ ...funcionarioFormData, status: value as any })}
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
              <div>
                <Label htmlFor="edit-salary">Salário (R$)</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  step="0.01"
                  min="0"
                  value={funcionarioFormData.salary}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, salary: e.target.value })}
                  placeholder="Ex: 5000.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-hireDate">Data de Admissão</Label>
                <Input
                  id="edit-hireDate"
                  type="date"
                  value={funcionarioFormData.hireDate}
                  onChange={(e) => setFuncionarioFormData({ ...funcionarioFormData, hireDate: e.target.value })}
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
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <ButtonLoader text="Atualizando..." />
                ) : (
                  'Atualizar Funcionário'
                )}
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
              Tem certeza que deseja excluir o funcionário <strong>{funcionarioToDelete?.nome}</strong>?
            </p>
            <p className="text-xs text-red-600">
              ⚠️ Esta ação não pode ser desfeita. O funcionário será permanentemente removido do sistema.
            </p>
            <p className="text-xs text-orange-600">
              ⚠️ Se o funcionário estiver associado a alguma grua ativa, a exclusão será bloqueada pelo sistema.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteFuncionario}
              disabled={submitting}
            >
              {submitting ? (
                <ButtonLoader text="Excluindo..." />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
