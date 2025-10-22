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
  User
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
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useCargos } from "@/hooks/use-cargos"

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
  const { cargosAtivos, criarCargo } = useCargos()
  const [funcionarios, setFuncionarios] = useState<FuncionarioRH[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [filtroCargo, setFiltroCargo] = useState("all")
  const [filtroStatus, setFiltroStatus] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateCargoDialogOpen, setIsCreateCargoDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittingCargo, setSubmittingCargo] = useState(false)
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

  // Função para criar novo cargo
  const handleCreateCargo = useCallback(async (data: any) => {
    try {
      setSubmittingCargo(true)
      
      await criarCargo(data)
      
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
  }, [criarCargo, toast])

  // Memoizar cálculos pesados
  const cargosUnicos = useMemo(
    () => Array.from(new Set(funcionarios.map(f => f.cargo))).sort(),
    [funcionarios]
  )

  // Debounce do termo de busca
  const debouncedQuery = useDebouncedValue(query, 300)
  
  // Estado para funcionários filtrados da API
  const [funcionariosFiltrados, setFuncionariosFiltrados] = useState<FuncionarioRH[]>([])
  const [buscando, setBuscando] = useState(false)

  // Buscar funcionários na API quando o termo de busca mudar
  useEffect(() => {
    let abort = new AbortController()

    const run = async () => {
      // Termo curto → NÃO chame API; filtre localmente
      if (debouncedQuery.trim().length < 2) {
        const list = funcionarios.filter((f) => {
          const okCargo = filtroCargo === "all" || f.cargo === filtroCargo
          const okStatus = filtroStatus === "all" || f.status === filtroStatus
          return okCargo && okStatus
        })
        setFuncionariosFiltrados(list)
        return
      }

      try {
        setBuscando(true)
        const resp = await funcionariosApi.buscarFuncionarios(
          debouncedQuery,
          {
            cargo: filtroCargo !== "all" ? filtroCargo : undefined,
            status: filtroStatus !== "all" ? filtroStatus : undefined,
          },
          { signal: abort.signal }
        )

        if (resp?.success && resp.data) {
          const mapped: FuncionarioRH[] = resp.data.map((func: any) => ({
            id: func.id,
            nome: func.nome,
            cpf: func.cpf || "",
            cargo: func.cargo,
            departamento: "",
            salario: func.salario || 0,
            data_admissao: func.data_admissao || "",
            telefone: func.telefone,
            email: func.email,
            endereco: "",
            cidade: "",
            estado: "",
            cep: "",
            status: func.status as any,
            turno: func.turno as any,
            observacoes: func.observacoes,
            created_at: func.created_at,
            updated_at: func.updated_at,
            usuario: Array.isArray(func.usuario) && func.usuario.length > 0 ? func.usuario[0] : undefined,
            obra_atual: undefined,
          }))
          setFuncionariosFiltrados(mapped)
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          // fallback local se der erro
          const q = debouncedQuery.toLowerCase()
          const list = funcionarios.filter((f) => {
            const okNome = f.nome.toLowerCase().includes(q)
            const okCargo = filtroCargo === "all" || f.cargo === filtroCargo
            const okStatus = filtroStatus === "all" || f.status === filtroStatus
            return okNome && okCargo && okStatus
          })
          setFuncionariosFiltrados(list)
        }
      } finally {
        setBuscando(false)
      }
    }

    run()
    return () => abort.abort()
  }, [debouncedQuery, filtroCargo, filtroStatus, funcionarios])


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recursos Humanos</h1>
          <p className="text-gray-600 mt-1">Gerencie os funcionários da empresa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreateCargoDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Cargo
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Funcionário
          </Button>
        </div>
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
          ) : buscando ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">Buscando funcionários...</span>
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
          )}
        </CardContent>
      </Card>

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
    </div>
  )
}
