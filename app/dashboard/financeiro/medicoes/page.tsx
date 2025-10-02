"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Search, 
  Edit,
  Trash2, 
  Eye,
  Calculator,
  Calendar,
  DollarSign,
  Building2,
  Filter,
  RefreshCw,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { medicoesApi, Medicao, MedicaoCreate } from "@/lib/api-medicoes"
import { medicoesUtils } from "@/lib/medicoes-utils"
import { locacoesApi, Locacao } from "@/lib/api-locacoes"

// Tipos para receitas e custos (mantidos para compatibilidade)

interface Receita {
  id: string
  obra_id: string
  tipo: 'locacao' | 'servico' | 'venda'
  descricao: string
  valor: number
  data_receita: string
  status: 'pendente' | 'confirmada' | 'cancelada'
  observacoes?: string
  created_at: string
  obras?: {
    id: string
    nome: string
  }
}

interface Custo {
  id: string
  obra_id: string
  tipo: 'salario' | 'material' | 'servico' | 'manutencao'
  descricao: string
  valor: number
  data_custo: string
  funcionario_id?: string
  status: 'pendente' | 'confirmado' | 'cancelado'
  observacoes?: string
  created_at: string
  obras?: {
    id: string
    nome: string
  }
  funcionarios?: {
    id: string
    nome: string
  }
}

export default function MedicoesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('medicoes')
  
  // Estados para medições
  const [medicoes, setMedicoes] = useState<Medicao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingMedicao, setEditingMedicao] = useState<Medicao | null>(null)
  const [viewingMedicao, setViewingMedicao] = useState<Medicao | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPeriodo, setFilterPeriodo] = useState("")
  const [filterLocacao, setFilterLocacao] = useState("all")
  const [locacaoFilter, setLocacaoFilter] = useState("")
  
  // Estados para locações
  const [locacoes, setLocacoes] = useState<Locacao[]>([])
  
  // Estados para receitas
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [isCreateReceitaDialogOpen, setIsCreateReceitaDialogOpen] = useState(false)
  
  // Estados para custos
  const [custos, setCustos] = useState<Custo[]>([])
  const [isCreateCustoDialogOpen, setIsCreateCustoDialogOpen] = useState(false)

  // Formulários
  const [medicaoForm, setMedicaoForm] = useState({
    numero: '',
    locacao_id: '',
    periodo: '',
    data_medicao: new Date().toISOString().split('T')[0],
    valor_base: 0,
    valor_aditivos: 0,
    valor_total: 0,
    observacoes: ''
  })

  const [receitaForm, setReceitaForm] = useState({
    obra_id: '',
    tipo: 'locacao' as 'locacao' | 'servico' | 'venda',
    descricao: '',
    valor: 0,
    data_receita: new Date().toISOString().split('T')[0],
    observacoes: ''
  })

  const [custoForm, setCustoForm] = useState({
    obra_id: '',
    tipo: 'salario' as 'salario' | 'material' | 'servico' | 'manutencao',
    descricao: '',
    valor: 0,
    data_custo: new Date().toISOString().split('T')[0],
    funcionario_id: '',
    observacoes: ''
  })

  // Carregar dados
  useEffect(() => {
    carregarDados()
    // Inicializar formulário com valores padrão
    setMedicaoForm({
      numero: medicoesUtils.generateNumeroMedicao(),
      locacao_id: '',
      periodo: medicoesUtils.getPeriodoAtual(),
      data_medicao: new Date().toISOString().split('T')[0],
      valor_base: 0,
      valor_aditivos: 0,
      valor_total: 0,
      observacoes: ''
    })
  }, [])

  const carregarDados = async () => {
    try {
      setIsLoading(true)
      
      // Carregar medições
      const medicoesData = await medicoesApi.list()
      setMedicoes(medicoesData.medicoes || [])
      
      // Carregar locações
      const locacoesData = await locacoesApi.list({ limit: 100 })
      setLocacoes(locacoesData.data || [])
      
      // Dados mockados para receitas e custos (manter por enquanto)
      const mockReceitas: Receita[] = [
        {
          id: '1',
          obra_id: '1',
          tipo: 'locacao',
          descricao: 'Locação mensal da grua STT293',
          valor: 30000,
          data_receita: '2025-01-15',
          status: 'confirmada',
          created_at: new Date().toISOString(),
          obras: { id: '1', nome: 'Obra Jardim das Flores' }
        },
        {
          id: '2',
          obra_id: '1',
          tipo: 'servico',
          descricao: 'Serviço de montagem adicional',
          valor: 5000,
          data_receita: '2025-01-20',
          status: 'pendente',
          created_at: new Date().toISOString(),
          obras: { id: '1', nome: 'Obra Jardim das Flores' }
        }
      ]

      const mockCustos: Custo[] = [
        {
          id: '1',
          obra_id: '1',
          tipo: 'salario',
          descricao: 'Salário do operador da grua',
          valor: 8000,
          data_custo: '2025-01-15',
          funcionario_id: '1',
          status: 'confirmado',
          created_at: new Date().toISOString(),
          obras: { id: '1', nome: 'Obra Jardim das Flores' },
          funcionarios: { id: '1', nome: 'João Silva' }
        },
        {
          id: '2',
          obra_id: '1',
          tipo: 'material',
          descricao: 'Compra de peças de reposição',
          valor: 2500,
          data_custo: '2025-01-18',
          status: 'confirmado',
          created_at: new Date().toISOString(),
          obras: { id: '1', nome: 'Obra Jardim das Flores' }
        }
      ]

      setReceitas(mockReceitas)
      setCustos(mockCustos)
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar locações para o select
  const locacoesFiltradas = locacoes.filter(locacao => {
    if (!locacaoFilter) return true
    const searchTerm = locacaoFilter.toLowerCase()
    return (
      locacao.numero?.toLowerCase().includes(searchTerm) ||
      locacao.cliente_nome?.toLowerCase().includes(searchTerm) ||
      locacao.equipamento_id?.toLowerCase().includes(searchTerm)
    )
  })

  // Filtrar medições
  const filteredMedicoes = (medicoes || []).filter(medicao => {
    const matchesSearch = (medicao.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (medicao.locacoes?.clientes?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || medicao.status === filterStatus
    const matchesPeriodo = !filterPeriodo || medicao.periodo === filterPeriodo
    const matchesLocacao = filterLocacao === 'all' || medicao.locacao_id?.toString() === filterLocacao
    return matchesSearch && matchesStatus && matchesPeriodo && matchesLocacao
  })

  // Handlers
  const handleCreateMedicao = async () => {
    try {
      const medicaoData: MedicaoCreate = {
        numero: medicaoForm.numero,
        locacao_id: parseInt(medicaoForm.locacao_id),
        periodo: medicaoForm.periodo,
        data_medicao: medicaoForm.data_medicao,
        valor_base: medicaoForm.valor_base,
        valor_aditivos: medicaoForm.valor_aditivos,
        valor_total: medicaoForm.valor_total,
        observacoes: medicaoForm.observacoes.trim() || undefined
      }

      const novaMedicao = await medicoesApi.create(medicaoData)
      setMedicoes([novaMedicao, ...(medicoes || [])])
      setIsCreateDialogOpen(false)
      resetMedicaoForm()

      toast({
        title: "Sucesso",
        description: "Medição criada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao criar medição:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar medição",
        variant: "destructive"
      })
    }
  }

  const handleViewMedicao = (medicao: Medicao) => {
    setViewingMedicao(medicao)
    setIsViewDialogOpen(true)
  }

  const handleEditMedicao = (medicao: Medicao) => {
    setEditingMedicao(medicao)
    setMedicaoForm({
      numero: medicao.numero,
      locacao_id: medicao.locacao_id.toString(),
      periodo: medicao.periodo,
      data_medicao: medicao.data_medicao,
      valor_base: medicao.valor_base,
      valor_aditivos: medicao.valor_aditivos,
      valor_total: medicao.valor_total,
      observacoes: medicao.observacoes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateMedicao = async () => {
    if (!editingMedicao) return

    try {
      const medicaoData = {
        numero: medicaoForm.numero,
        locacao_id: parseInt(medicaoForm.locacao_id),
        periodo: medicaoForm.periodo,
        data_medicao: medicaoForm.data_medicao,
        valor_base: medicaoForm.valor_base,
        valor_aditivos: medicaoForm.valor_aditivos,
        valor_total: medicaoForm.valor_total,
        observacoes: medicaoForm.observacoes.trim() || undefined
      }

      const medicaoAtualizada = await medicoesApi.update(editingMedicao.id.toString(), medicaoData)
      
      setMedicoes(medicoes.map(m => m.id === editingMedicao.id ? medicaoAtualizada : m))
      setIsEditDialogOpen(false)
      setEditingMedicao(null)
      resetMedicaoForm()

      toast({
        title: "Sucesso",
        description: "Medição atualizada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao atualizar medição:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar medição",
        variant: "destructive"
      })
    }
  }

  const handleDeleteMedicao = async (medicao: Medicao) => {
    try {
      await medicoesApi.delete(medicao.id.toString())
      setMedicoes(medicoes.filter(m => m.id !== medicao.id))

      toast({
        title: "Sucesso",
        description: "Medição deletada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao deletar medição:', error)
      toast({
        title: "Erro",
        description: "Erro ao deletar medição",
        variant: "destructive"
      })
    }
  }

  const handleFinalizarMedicao = async (medicao: Medicao) => {
    try {
      const medicaoFinalizada = await medicoesApi.finalizar(medicao.id.toString())
      setMedicoes(medicoes.map(m => m.id === medicao.id ? medicaoFinalizada : m))

      toast({
        title: "Sucesso",
        description: "Medição finalizada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao finalizar medição:', error)
      toast({
        title: "Erro",
        description: "Erro ao finalizar medição",
        variant: "destructive"
      })
    }
  }

  const handleCreateReceita = async () => {
    try {
      const novaReceita: Receita = {
        id: Date.now().toString(),
        obra_id: receitaForm.obra_id,
        tipo: receitaForm.tipo,
        descricao: receitaForm.descricao,
        valor: receitaForm.valor,
        data_receita: receitaForm.data_receita,
        status: 'pendente',
        observacoes: receitaForm.observacoes,
        created_at: new Date().toISOString()
      }

      setReceitas([...receitas, novaReceita])
      setIsCreateReceitaDialogOpen(false)
      resetReceitaForm()

      toast({
        title: "Sucesso",
        description: "Receita criada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao criar receita:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar receita",
        variant: "destructive"
      })
    }
  }

  const handleCreateCusto = async () => {
    try {
      const novoCusto: Custo = {
        id: Date.now().toString(),
        obra_id: custoForm.obra_id,
        tipo: custoForm.tipo,
        descricao: custoForm.descricao,
        valor: custoForm.valor,
        data_custo: custoForm.data_custo,
        funcionario_id: custoForm.funcionario_id || undefined,
        status: 'pendente',
        observacoes: custoForm.observacoes,
        created_at: new Date().toISOString()
      }

      setCustos([...custos, novoCusto])
      setIsCreateCustoDialogOpen(false)
      resetCustoForm()

      toast({
        title: "Sucesso",
        description: "Custo criado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao criar custo:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar custo",
        variant: "destructive"
      })
    }
  }

  const resetMedicaoForm = () => {
    setMedicaoForm({
      numero: medicoesUtils.generateNumeroMedicao(),
      locacao_id: '',
      periodo: medicoesUtils.getPeriodoAtual(),
      data_medicao: new Date().toISOString().split('T')[0],
      valor_base: 0,
      valor_aditivos: 0,
      valor_total: 0,
      observacoes: ''
    })
    setLocacaoFilter('')
  }

  const resetReceitaForm = () => {
    setReceitaForm({
      obra_id: '',
      tipo: 'locacao',
      descricao: '',
      valor: 0,
      data_receita: new Date().toISOString().split('T')[0],
      observacoes: ''
    })
  }

  const resetCustoForm = () => {
    setCustoForm({
      obra_id: '',
      tipo: 'salario',
      descricao: '',
      valor: 0,
      data_custo: new Date().toISOString().split('T')[0],
      funcionario_id: '',
      observacoes: ''
    })
  }

  const getStatusColor = (status: string) => {
    return medicoesUtils.getStatusColor(status)
  }

  const getStatusIcon = (status: string) => {
    const iconType = medicoesUtils.getStatusIcon(status)
    switch (iconType) {
      case 'check-circle': return <CheckCircle className="w-4 h-4" />
      case 'clock': return <Clock className="w-4 h-4" />
      case 'x-circle': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando dados...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medições e Financeiro</h1>
          <p className="text-gray-600">Gestão de medições, receitas e custos</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'medicoes' && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Medição
            </Button>
          )}
          {activeTab === 'receitas' && (
            <Button onClick={() => setIsCreateReceitaDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Receita
            </Button>
          )}
          {activeTab === 'custos' && (
            <Button onClick={() => setIsCreateCustoDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Custo
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="medicoes">Medições</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="custos">Custos</TabsTrigger>
        </TabsList>

        {/* Aba de Medições */}
        <TabsContent value="medicoes" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="Buscar por número ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="periodo">Período</Label>
                  <Input
                    id="periodo"
                    type="month"
                    value={filterPeriodo}
                    onChange={(e) => setFilterPeriodo(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="locacao">Locação</Label>
                  <Select value={filterLocacao} onValueChange={setFilterLocacao}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as locações</SelectItem>
                      {locacoes.map(locacao => (
                        <SelectItem key={locacao.id} value={locacao.id.toString()}>
                          {locacao.numero} - {locacao.cliente_nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={carregarDados}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Medições */}
          <Card>
            <CardHeader>
              <CardTitle>Medições ({filteredMedicoes.length})</CardTitle>
              <CardDescription>Lista de todas as medições registradas</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredMedicoes.length === 0 ? (
                <div className="text-center py-8">
                  <Calculator className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhuma medição encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Locacao</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedicoes.map((medicao) => (
                      <TableRow key={medicao.id}>
                        <TableCell className="font-medium">{medicao.numero}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {medicao.locacoes?.numero || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>{medicao.locacoes?.clientes?.nome || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {medicoesUtils.formatPeriodo(medicao.periodo)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {medicoesUtils.formatDate(medicao.data_medicao)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            {medicoesUtils.formatCurrency(medicao.valor_total)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(medicao.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(medicao.status)}
                              {medicoesUtils.getStatusLabel(medicao.status)}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewMedicao(medicao)}
                              title="Visualizar medição"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditMedicao(medicao)}
                              title="Editar medição"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {medicao.status === 'pendente' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleFinalizarMedicao(medicao)}
                                title="Finalizar medição"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  title="Deletar medição"
                                >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja deletar a medição <strong>{medicao.numero}</strong>?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteMedicao(medicao)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Deletar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Receitas */}
        <TabsContent value="receitas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receitas ({receitas.length})</CardTitle>
              <CardDescription>Lista de todas as receitas registradas</CardDescription>
            </CardHeader>
            <CardContent>
              {receitas.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhuma receita encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Obra</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receitas.map((receita) => (
                      <TableRow key={receita.id}>
                        <TableCell>
                          <Badge variant="outline">{receita.tipo}</Badge>
                        </TableCell>
                        <TableCell>{receita.descricao}</TableCell>
                        <TableCell>{receita.obras?.nome || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(receita.data_receita).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            R$ {receita.valor.toLocaleString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(receita.status)}>
                            {receita.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Custos */}
        <TabsContent value="custos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custos ({custos.length})</CardTitle>
              <CardDescription>Lista de todos os custos registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {custos.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum custo encontrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Obra</TableHead>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {custos.map((custo) => (
                      <TableRow key={custo.id}>
                        <TableCell>
                          <Badge variant="outline">{custo.tipo}</Badge>
                        </TableCell>
                        <TableCell>{custo.descricao}</TableCell>
                        <TableCell>{custo.obras?.nome || 'N/A'}</TableCell>
                        <TableCell>{custo.funcionarios?.nome || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(custo.data_custo).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-red-600" />
                            R$ {custo.valor.toLocaleString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(custo.status)}>
                            {custo.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Criação de Medição */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Medição</DialogTitle>
            <DialogDescription>
              Registre uma nova medição no sistema
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleCreateMedicao(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero">Número da Medição *</Label>
                <Input
                  id="numero"
                  value={medicaoForm.numero}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, numero: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="periodo">Período *</Label>
                <Input
                  id="periodo"
                  type="month"
                  value={medicaoForm.periodo}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, periodo: e.target.value })}
                  required
                />
              </div>
            </div>

              <div>
              <Label htmlFor="locacao_id">Locação *</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Buscar locação por número, cliente ou equipamento..."
                  value={locacaoFilter}
                  onChange={(e) => setLocacaoFilter(e.target.value)}
                  className="text-sm"
                />
                <Select 
                  value={medicaoForm.locacao_id} 
                  onValueChange={(value) => setMedicaoForm({ ...medicaoForm, locacao_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a locação" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {!locacoes || locacoes.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        Carregando locações...
                      </div>
                    ) : locacoesFiltradas.length > 0 ? (
                      locacoesFiltradas.map(locacao => (
                        <SelectItem key={locacao.id} value={locacao.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{locacao.numero || 'Locação sem número'}</span>
                            <span className="text-xs text-gray-500">
                              {locacao.cliente_nome} - {locacao.equipamento_id}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        Nenhuma locação encontrada
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="valor_base">Valor Base (R$) *</Label>
                <Input
                  id="valor_base"
                  type="number"
                  step="0.01"
                  min="0"
                  value={medicaoForm.valor_base}
                  onChange={(e) => {
                    const valorBase = parseFloat(e.target.value) || 0
                    setMedicaoForm({ 
                      ...medicaoForm, 
                      valor_base: valorBase,
                      valor_total: valorBase + medicaoForm.valor_aditivos
                    })
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="valor_aditivos">Valor Aditivos (R$)</Label>
                <Input
                  id="valor_aditivos"
                  type="number"
                  step="0.01"
                  min="0"
                  value={medicaoForm.valor_aditivos}
                  onChange={(e) => {
                    const valorAditivos = parseFloat(e.target.value) || 0
                    setMedicaoForm({ 
                      ...medicaoForm, 
                      valor_aditivos: valorAditivos,
                      valor_total: medicaoForm.valor_base + valorAditivos
                    })
                  }}
                />
              </div>
              <div>
                <Label htmlFor="valor_total">Valor Total (R$) *</Label>
                <Input
                  id="valor_total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={medicaoForm.valor_total}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, valor_total: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="data_medicao">Data da Medição *</Label>
              <Input
                id="data_medicao"
                type="date"
                value={medicaoForm.data_medicao}
                onChange={(e) => setMedicaoForm({ ...medicaoForm, data_medicao: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={medicaoForm.observacoes}
                onChange={(e) => setMedicaoForm({ ...medicaoForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Medição
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização de Medição */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Medição</DialogTitle>
            <DialogDescription>
              Informações completas da medição
            </DialogDescription>
          </DialogHeader>
          
          {viewingMedicao && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Número</Label>
                  <p className="text-lg font-semibold">{viewingMedicao.numero}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(viewingMedicao.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(viewingMedicao.status)}
                        {medicoesUtils.getStatusLabel(viewingMedicao.status)}
                      </div>
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Período</Label>
                  <p className="text-lg">{medicoesUtils.formatPeriodo(viewingMedicao.periodo)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data da Medição</Label>
                  <p className="text-lg">{medicoesUtils.formatDate(viewingMedicao.data_medicao)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Locação</Label>
                <p className="text-lg font-semibold">
                  {viewingMedicao.locacoes?.numero || 'N/A'} - {viewingMedicao.locacoes?.clientes?.nome || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  Equipamento: {viewingMedicao.locacoes?.equipamento_id || 'N/A'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Valor Base</Label>
                  <p className="text-lg font-semibold text-blue-600">
                    {medicoesUtils.formatCurrency(viewingMedicao.valor_base)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Valor Aditivos</Label>
                  <p className="text-lg font-semibold text-orange-600">
                    {medicoesUtils.formatCurrency(viewingMedicao.valor_aditivos)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Valor Total</Label>
                  <p className="text-lg font-semibold text-green-600">
                    {medicoesUtils.formatCurrency(viewingMedicao.valor_total)}
                  </p>
                </div>
              </div>

              {viewingMedicao.observacoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Observações</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{viewingMedicao.observacoes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Criado em</Label>
                  <p>{medicoesUtils.formatDate(viewingMedicao.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Atualizado em</Label>
                  <p>{medicoesUtils.formatDate(viewingMedicao.updated_at)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Medição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Medição</DialogTitle>
            <DialogDescription>
              Atualize as informações da medição
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateMedicao(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_numero">Número da Medição *</Label>
                <Input
                  id="edit_numero"
                  value={medicaoForm.numero}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, numero: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_periodo">Período *</Label>
                <Input
                  id="edit_periodo"
                  type="month"
                  value={medicaoForm.periodo}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, periodo: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_locacao_id">Locação *</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Buscar locação por número, cliente ou equipamento..."
                  value={locacaoFilter}
                  onChange={(e) => setLocacaoFilter(e.target.value)}
                  className="text-sm"
                />
                <Select 
                  value={medicaoForm.locacao_id} 
                  onValueChange={(value) => setMedicaoForm({ ...medicaoForm, locacao_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a locação" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {!locacoes || locacoes.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        Carregando locações...
                      </div>
                    ) : locacoesFiltradas.length > 0 ? (
                      locacoesFiltradas.map(locacao => (
                        <SelectItem key={locacao.id} value={locacao.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{locacao.numero || 'Locação sem número'}</span>
                            <span className="text-xs text-gray-500">
                              {locacao.cliente_nome} - {locacao.equipamento_id}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        Nenhuma locação encontrada
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_valor_base">Valor Base (R$) *</Label>
                <Input
                  id="edit_valor_base"
                  type="number"
                  step="0.01"
                  min="0"
                  value={medicaoForm.valor_base}
                  onChange={(e) => {
                    const valorBase = parseFloat(e.target.value) || 0
                    setMedicaoForm({ 
                      ...medicaoForm, 
                      valor_base: valorBase,
                      valor_total: valorBase + medicaoForm.valor_aditivos
                    })
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_valor_aditivos">Valor Aditivos (R$)</Label>
                <Input
                  id="edit_valor_aditivos"
                  type="number"
                  step="0.01"
                  min="0"
                  value={medicaoForm.valor_aditivos}
                  onChange={(e) => {
                    const valorAditivos = parseFloat(e.target.value) || 0
                    setMedicaoForm({ 
                      ...medicaoForm, 
                      valor_aditivos: valorAditivos,
                      valor_total: medicaoForm.valor_base + valorAditivos
                    })
                  }}
                />
              </div>
              <div>
                <Label htmlFor="edit_valor_total">Valor Total (R$) *</Label>
                <Input
                  id="edit_valor_total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={medicaoForm.valor_total}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, valor_total: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_data_medicao">Data da Medição *</Label>
              <Input
                id="edit_data_medicao"
                type="date"
                value={medicaoForm.data_medicao}
                onChange={(e) => setMedicaoForm({ ...medicaoForm, data_medicao: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_observacoes">Observações</Label>
              <Textarea
                id="edit_observacoes"
                value={medicaoForm.observacoes}
                onChange={(e) => setMedicaoForm({ ...medicaoForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Atualizar Medição
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criação de Receita */}
      <Dialog open={isCreateReceitaDialogOpen} onOpenChange={setIsCreateReceitaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Receita</DialogTitle>
            <DialogDescription>
              Registre uma nova receita no sistema
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleCreateReceita(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receita_obra_id">Obra *</Label>
                <Select 
                  value={receitaForm.obra_id} 
                  onValueChange={(value) => setReceitaForm({ ...receitaForm, obra_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a obra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Obra Jardim das Flores</SelectItem>
                    <SelectItem value="2">Shopping Center Norte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="receita_tipo">Tipo *</Label>
                <Select 
                  value={receitaForm.tipo} 
                  onValueChange={(value) => setReceitaForm({ ...receitaForm, tipo: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="locacao">Locação</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="venda">Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="receita_descricao">Descrição *</Label>
              <Input
                id="receita_descricao"
                value={receitaForm.descricao}
                onChange={(e) => setReceitaForm({ ...receitaForm, descricao: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receita_valor">Valor (R$) *</Label>
                <Input
                  id="receita_valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={receitaForm.valor}
                  onChange={(e) => setReceitaForm({ ...receitaForm, valor: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="receita_data">Data da Receita *</Label>
                <Input
                  id="receita_data"
                  type="date"
                  value={receitaForm.data_receita}
                  onChange={(e) => setReceitaForm({ ...receitaForm, data_receita: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="receita_observacoes">Observações</Label>
              <Textarea
                id="receita_observacoes"
                value={receitaForm.observacoes}
                onChange={(e) => setReceitaForm({ ...receitaForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateReceitaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Receita
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criação de Custo */}
      <Dialog open={isCreateCustoDialogOpen} onOpenChange={setIsCreateCustoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Custo</DialogTitle>
            <DialogDescription>
              Registre um novo custo no sistema
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleCreateCusto(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="custo_obra_id">Obra *</Label>
                <Select 
                  value={custoForm.obra_id} 
                  onValueChange={(value) => setCustoForm({ ...custoForm, obra_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a obra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Obra Jardim das Flores</SelectItem>
                    <SelectItem value="2">Shopping Center Norte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="custo_tipo">Tipo *</Label>
                <Select 
                  value={custoForm.tipo} 
                  onValueChange={(value) => setCustoForm({ ...custoForm, tipo: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salario">Salário</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="custo_descricao">Descrição *</Label>
              <Input
                id="custo_descricao"
                value={custoForm.descricao}
                onChange={(e) => setCustoForm({ ...custoForm, descricao: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="custo_valor">Valor (R$) *</Label>
                <Input
                  id="custo_valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={custoForm.valor}
                  onChange={(e) => setCustoForm({ ...custoForm, valor: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="custo_data">Data do Custo *</Label>
                <Input
                  id="custo_data"
                  type="date"
                  value={custoForm.data_custo}
                  onChange={(e) => setCustoForm({ ...custoForm, data_custo: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="custo_funcionario">Funcionário (opcional)</Label>
              <Select 
                value={custoForm.funcionario_id} 
                onValueChange={(value) => setCustoForm({ ...custoForm, funcionario_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">João Silva</SelectItem>
                  <SelectItem value="2">Maria Santos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="custo_observacoes">Observações</Label>
              <Textarea
                id="custo_observacoes"
                value={custoForm.observacoes}
                onChange={(e) => setCustoForm({ ...custoForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateCustoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Custo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
