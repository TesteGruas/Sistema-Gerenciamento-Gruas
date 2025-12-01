"use client"

import { useState, useEffect, useCallback, useMemo, useDeferredValue } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  MapPin, 
  Calendar,
  Building2,
  Loader2,
  Filter,
  Download,
  RefreshCw,
  User,
  Briefcase,
  Edit,
  Trash2
} from "lucide-react"
import { apiRH } from "@/lib/api-rh"
import { funcionariosApi, type FuncionarioCreateData } from "@/lib/api-funcionarios"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CardLoader, ButtonLoader } from "@/components/ui/loader"
import { CreateFuncionarioDialog } from "@/components/create-funcionario-dialog"
import { EditFuncionarioDialog } from "@/components/edit-funcionario-dialog"
import { FuncionarioRow } from "@/components/funcionario-row"
import { CreateCargoDialog } from "@/components/create-cargo-dialog"
import { EditCargoDialog } from "@/components/edit-cargo-dialog"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useCargos } from "@/hooks/use-cargos"
import { PaginationControl } from "@/components/ui/pagination-control"
import { cargosApi, type Cargo } from "@/lib/api/cargos-api"

interface FuncionarioRH {
  id: number
  nome: string
  cpf: string
  cargo: string
  cargo_id?: number // Adicionar ID do cargo
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
  const { cargosAtivos, criarCargo, carregarCargos } = useCargos()
  const [funcionarios, setFuncionarios] = useState<FuncionarioRH[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [filtroCargo, setFiltroCargo] = useState("all")
  const [filtroStatus, setFiltroStatus] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateCargoDialogOpen, setIsCreateCargoDialogOpen] = useState(false)
  const [isEditCargoDialogOpen, setIsEditCargoDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittingCargo, setSubmittingCargo] = useState(false)
  const [selectedFuncionario, setSelectedFuncionario] = useState<FuncionarioRH | null>(null)
  const [selectedCargo, setSelectedCargo] = useState<Cargo | null>(null)
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [loadingCargos, setLoadingCargos] = useState(false)
  const [activeTab, setActiveTab] = useState<'funcionarios' | 'cargos'>('funcionarios')
  const { toast } = useToast()
  const router = useRouter()

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Debounce do termo de busca
  const debouncedQuery = useDebouncedValue(query, 500)

  // Função para carregar funcionários
  const carregarFuncionarios = useCallback(async () => {
    try {
      setLoading(true)
      
      // Preparar parâmetros da API
      const params: {
        page: number
        limit: number
        cargo?: string
        status?: string
        search?: string
      } = {
        page: currentPage,
        limit: itemsPerPage
      }

      // Adicionar filtros se não forem "all"
      if (filtroCargo !== "all") {
        params.cargo = filtroCargo
      }
      if (filtroStatus !== "all") {
        params.status = filtroStatus
      }
      // Adicionar busca se houver termo
      if (debouncedQuery.trim().length > 0) {
        params.search = debouncedQuery.trim()
      }

      const response = await funcionariosApi.listarFuncionarios(params)
      
      if (response.success && response.data) {
        // Mapear dados do backend para o formato esperado
        const funcionariosMapeados: FuncionarioRH[] = response.data.map(func => ({
          id: func.id,
          nome: func.nome,
          cpf: func.cpf || '',
          cargo: func.cargo_info?.nome || func.cargo, // Priorizar JOIN, fallback para string
          cargo_id: func.cargo_id, // Adicionar ID do cargo
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
        
        // Atualizar informações de paginação
        if (response.pagination) {
          setTotalItems(response.pagination.total)
          setTotalPages(response.pagination.pages)
        }
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
  }, [currentPage, itemsPerPage, debouncedQuery, filtroCargo, filtroStatus, toast])

  // Carregar funcionários quando mudar página, itens por página, busca ou filtros
  useEffect(() => {
    carregarFuncionarios()
  }, [carregarFuncionarios])

  // Função para criar funcionário
  const handleCreateFuncionario = async (payload: FuncionarioCreateData & { usuario_senha?: string, criar_usuario: boolean }) => {
    try {
      setSubmitting(true)
      
      const response = await funcionariosApi.criarFuncionario(payload)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Funcionário criado com sucesso!",
        })
        
        // Recarregar lista
        await carregarFuncionarios()
        
        // Fechar dialog
        setIsCreateDialogOpen(false)
      } else {
        toast({
          title: "Erro",
          description: "Erro ao criar funcionário",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Erro ao criar funcionário:', error)
      
      // Extrair mensagem de erro mais amigável
      let mensagemErro = "Erro ao criar funcionário. Tente novamente."
      
      if (error.response?.data?.message) {
        mensagemErro = error.response.data.message
      } else if (error.response?.data?.details) {
        mensagemErro = error.response.data.details
      } else if (error.message) {
        mensagemErro = error.message
      }
      
      toast({
        title: "Erro",
        description: mensagemErro,
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Função para atualizar funcionário
  const handleUpdateFuncionario = async (payload: FuncionarioCreateData) => {
    if (!selectedFuncionario) return
    
    try {
      setSubmitting(true)
      
      const response = await funcionariosApi.atualizarFuncionario(selectedFuncionario.id, payload)
      
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


  // Navegar para página de detalhes
  const handleViewDetails = useCallback((id: number) => {
    router.push(`/dashboard/rh/${id}`)
  }, [router])

  // Abrir dialog de edição
  const handleEditClick = useCallback((funcionario: FuncionarioRH) => {
    setSelectedFuncionario(funcionario)
    setIsEditDialogOpen(true)
  }, [])

  // Função para deletar funcionário
  const handleDeleteFuncionario = useCallback(async (id: number) => {
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
  }, [toast])

  // Função para carregar cargos
  const carregarCargosLista = useCallback(async () => {
    try {
      setLoadingCargos(true)
      const response = await cargosApi.listarCargos({ limit: 100 })
      if (response.success) {
        setCargos(response.data || [])
      }
    } catch (error: any) {
      console.error('Erro ao carregar cargos:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar cargos",
        variant: "destructive"
      })
    } finally {
      setLoadingCargos(false)
    }
  }, [toast])

  // Carregar cargos quando tab de cargos for ativada
  useEffect(() => {
    if (activeTab === 'cargos') {
      carregarCargosLista()
    }
  }, [activeTab, carregarCargosLista])

  // Função para criar novo cargo
  const handleCreateCargo = useCallback(async (data: any) => {
    try {
      setSubmittingCargo(true)
      
      await criarCargo(data)
      
      // Recarregar cargos para atualizar todos os componentes
      await carregarCargos()
      await carregarCargosLista()
      
      toast({
        title: "Sucesso",
        description: "Cargo criado com sucesso!",
        variant: "default"
      })
      
      setIsCreateCargoDialogOpen(false)
      
    } catch (error: any) {
      console.error("Erro ao criar cargo:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar cargo",
        variant: "destructive"
      })
    } finally {
      setSubmittingCargo(false)
    }
  }, [criarCargo, carregarCargos, carregarCargosLista, toast])

  // Função para atualizar cargo
  const handleUpdateCargo = useCallback(async (data: any) => {
    if (!selectedCargo) return
    
    try {
      setSubmittingCargo(true)
      
      const response = await cargosApi.atualizarCargo(selectedCargo.id, data)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Cargo atualizado com sucesso!",
        })
        
        await carregarCargos()
        await carregarCargosLista()
        
        setIsEditCargoDialogOpen(false)
        setSelectedCargo(null)
      }
    } catch (error: any) {
      console.error('Erro ao atualizar cargo:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar cargo",
        variant: "destructive"
      })
    } finally {
      setSubmittingCargo(false)
    }
  }, [selectedCargo, carregarCargos, carregarCargosLista, toast])

  // Função para deletar/reativar cargo
  const handleDeleteCargo = useCallback(async (cargo: Cargo) => {
    const action = cargo.ativo ? 'desativar' : 'reativar'
    if (!confirm(`Tem certeza que deseja ${action} este cargo?`)) {
      return
    }
    
    try {
      if (cargo.ativo) {
        await cargosApi.deletarCargo(cargo.id)
        toast({
          title: "Sucesso",
          description: "Cargo desativado com sucesso!",
        })
      } else {
        await cargosApi.reativarCargo(cargo.id)
        toast({
          title: "Sucesso",
          description: "Cargo reativado com sucesso!",
        })
      }
      
      await carregarCargosLista()
    } catch (error: any) {
      console.error('Erro ao alterar status do cargo:', error)
      toast({
        title: "Erro",
        description: error.message || `Erro ao ${action} cargo`,
        variant: "destructive"
      })
    }
  }, [toast, carregarCargosLista])

  // Função para abrir dialog de edição de cargo
  const handleEditCargo = useCallback((cargo: Cargo) => {
    setSelectedCargo(cargo)
    setIsEditCargoDialogOpen(true)
  }, [])

  // Memoizar cálculos pesados - usar lista de cargos da API
  const cargosDisponiveis = useMemo(
    () => cargosAtivos.map(c => c.nome).sort(),
    [cargosAtivos]
  )

  // Handlers de paginação
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Resetar para primeira página ao mudar itens por página
  }, [])

  // Resetar página quando busca ou filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedQuery, filtroCargo, filtroStatus])


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recursos Humanos</h1>
          <p className="text-gray-600 mt-1">Gerencie os funcionários e cargos da empresa</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'cargos' ? (
            <Button onClick={() => setIsCreateCargoDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cargo
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsCreateCargoDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cargo
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Funcionário
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'funcionarios' | 'cargos')} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="funcionarios">
            <Users className="w-4 h-4 mr-2" />
            Funcionários
          </TabsTrigger>
          <TabsTrigger value="cargos">
            <Briefcase className="w-4 h-4 mr-2" />
            Cargos
          </TabsTrigger>
        </TabsList>

        {/* Tab: Funcionários */}
        <TabsContent value="funcionarios" className="space-y-0">
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
                    <User className="w-6 h-6 text-green-600" />
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
                    <User className="w-6 h-6 text-gray-600" />
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
          <Card className="mt-4">
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
                    placeholder="Buscar por nome, CPF, telefone ou cargo..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filtroCargo} onValueChange={setFiltroCargo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os cargos</SelectItem>
                    {cargosDisponiveis.map(cargo => (
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
              ) : funcionarios.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum funcionário encontrado</p>
                </div>
              ) : (
                <>
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
                        {funcionarios.map((funcionario) => (
                          <FuncionarioRow
                            key={funcionario.id}
                            funcionario={funcionario}
                            onView={handleViewDetails}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteFuncionario}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Controles de Paginação */}
                  {totalPages > 0 && (
                    <div className="mt-4">
                      <PaginationControl
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        itemsPerPageOptions={[10, 20, 50, 100]}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Cargos */}
        <TabsContent value="cargos" className="space-y-0">
          <Card className="mt-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cargos</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={carregarCargosLista} disabled={loadingCargos}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingCargos ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCargos ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : cargos.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum cargo cadastrado</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead>Perfil Associado</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cargos.map((cargo) => (
                        <TableRow key={cargo.id}>
                          <TableCell className="font-medium">{cargo.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{cargo.nivel}</Badge>
                          </TableCell>
                          <TableCell>
                            {cargo.perfil ? (
                              <div className="flex flex-col">
                                <span className="font-medium">{cargo.perfil.nome}</span>
                                <span className="text-xs text-gray-500">Nível {cargo.perfil.nivel_acesso}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Nenhum perfil</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={cargo.ativo ? "default" : "secondary"}>
                              {cargo.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCargo(cargo)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCargo(cargo)}
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
        </TabsContent>
      </Tabs>

      {/* Dialog Criar Funcionário */}
      <CreateFuncionarioDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        submitting={submitting}
        onSubmit={handleCreateFuncionario}
      />

      {/* Dialog Editar Funcionário */}
      <EditFuncionarioDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        submitting={submitting}
        onSubmit={handleUpdateFuncionario}
        funcionario={selectedFuncionario}
      />

      {/* Dialog Criar Cargo */}
      <CreateCargoDialog
        open={isCreateCargoDialogOpen}
        onOpenChange={setIsCreateCargoDialogOpen}
        submitting={submittingCargo}
        onSubmit={handleCreateCargo}
      />

      {/* Dialog Editar Cargo */}
      {selectedCargo && (
        <EditCargoDialog
          open={isEditCargoDialogOpen}
          onOpenChange={setIsEditCargoDialogOpen}
          submitting={submittingCargo}
          onSubmit={handleUpdateCargo}
          cargo={selectedCargo}
        />
      )}
    </div>
  )
}
