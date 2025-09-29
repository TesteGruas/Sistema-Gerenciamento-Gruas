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

// Tipos para medições
interface Medicao {
  id: string
  numero: string
  obra_id: string
  grua_id: string
  periodo: string
  data_medicao: string
  altura_medida: number
  quantidade_medida: number
  valor_unitario: number
  valor_base: number
  valor_aditivos: number
  valor_total: number
  status: 'pendente' | 'aprovada' | 'finalizada' | 'cancelada'
  observacoes?: string
  created_at: string
  updated_at: string
  obras?: {
    id: string
    nome: string
    cliente_id: string
  }
  gruas?: {
    id: string
    nome: string
    modelo: string
  }
}

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
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPeriodo, setFilterPeriodo] = useState("")
  
  // Estados para receitas
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [isCreateReceitaDialogOpen, setIsCreateReceitaDialogOpen] = useState(false)
  
  // Estados para custos
  const [custos, setCustos] = useState<Custo[]>([])
  const [isCreateCustoDialogOpen, setIsCreateCustoDialogOpen] = useState(false)

  // Formulários
  const [medicaoForm, setMedicaoForm] = useState({
    numero: '',
    obra_id: '',
    grua_id: '',
    periodo: '',
    data_medicao: new Date().toISOString().split('T')[0],
    altura_medida: 0,
    quantidade_medida: 0,
    valor_unitario: 0,
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
  }, [])

  const carregarDados = async () => {
    try {
      setIsLoading(true)
      
      // Simular carregamento de dados (substituir por chamadas reais da API)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Dados mockados para demonstração
      const mockMedicoes: Medicao[] = [
        {
          id: '1',
          numero: 'MED-001',
          obra_id: '1',
          grua_id: '1',
          periodo: '2025-01',
          data_medicao: '2025-01-15',
          altura_medida: 15,
          quantidade_medida: 1,
          valor_unitario: 25000,
          valor_base: 25000,
          valor_aditivos: 5000,
          valor_total: 30000,
          status: 'aprovada',
          observacoes: 'Medição mensal padrão',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          obras: { id: '1', nome: 'Obra Jardim das Flores', cliente_id: '1' },
          gruas: { id: '1', nome: 'Grua STT293', modelo: 'Potain MDT 178' }
        },
        {
          id: '2',
          numero: 'MED-002',
          obra_id: '2',
          grua_id: '2',
          periodo: '2025-01',
          data_medicao: '2025-01-20',
          altura_medida: 20,
          quantidade_medida: 1,
          valor_unitario: 30000,
          valor_base: 30000,
          valor_aditivos: 0,
          valor_total: 30000,
          status: 'pendente',
          observacoes: 'Medição com altura adicional',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          obras: { id: '2', nome: 'Shopping Center Norte', cliente_id: '2' },
          gruas: { id: '2', nome: 'Grua Liebherr', modelo: '132 EC-H' }
        }
      ]

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

      setMedicoes(mockMedicoes)
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

  // Filtrar medições
  const filteredMedicoes = medicoes.filter(medicao => {
    const matchesSearch = medicao.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicao.obras?.nome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || medicao.status === filterStatus
    const matchesPeriodo = !filterPeriodo || medicao.periodo === filterPeriodo
    return matchesSearch && matchesStatus && matchesPeriodo
  })

  // Handlers
  const handleCreateMedicao = async () => {
    try {
      const valorBase = medicaoForm.altura_medida * medicaoForm.quantidade_medida * medicaoForm.valor_unitario
      const valorTotal = valorBase

      const novaMedicao: Medicao = {
        id: Date.now().toString(),
        numero: medicaoForm.numero,
        obra_id: medicaoForm.obra_id,
        grua_id: medicaoForm.grua_id,
        periodo: medicaoForm.periodo,
        data_medicao: medicaoForm.data_medicao,
        altura_medida: medicaoForm.altura_medida,
        quantidade_medida: medicaoForm.quantidade_medida,
        valor_unitario: medicaoForm.valor_unitario,
        valor_base: valorBase,
        valor_aditivos: 0,
        valor_total: valorTotal,
        status: 'pendente',
        observacoes: medicaoForm.observacoes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setMedicoes([...medicoes, novaMedicao])
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
      numero: '',
      obra_id: '',
      grua_id: '',
      periodo: '',
      data_medicao: new Date().toISOString().split('T')[0],
      altura_medida: 0,
      quantidade_medida: 0,
      valor_unitario: 0,
      observacoes: ''
    })
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
    switch (status) {
      case 'aprovada':
      case 'confirmada':
      case 'finalizada': return 'bg-green-500'
      case 'pendente': return 'bg-yellow-500'
      case 'cancelada':
      case 'cancelado': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovada':
      case 'confirmada':
      case 'finalizada': return <CheckCircle className="w-4 h-4" />
      case 'pendente': return <Clock className="w-4 h-4" />
      case 'cancelada':
      case 'cancelado': return <XCircle className="w-4 h-4" />
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="Buscar por número ou obra..."
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
                      <SelectItem value="aprovada">Aprovada</SelectItem>
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
                      <TableHead>Obra</TableHead>
                      <TableHead>Grua</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Altura</TableHead>
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
                            {medicao.obras?.nome || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>{medicao.gruas?.nome || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {medicao.periodo}
                          </div>
                        </TableCell>
                        <TableCell>{medicao.altura_medida}m</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            R$ {medicao.valor_total.toLocaleString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(medicao.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(medicao.status)}
                              {medicao.status}
                            </div>
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
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-4 h-4" />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="obra_id">Obra *</Label>
                <Select 
                  value={medicaoForm.obra_id} 
                  onValueChange={(value) => setMedicaoForm({ ...medicaoForm, obra_id: value })}
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
                <Label htmlFor="grua_id">Grua *</Label>
                <Select 
                  value={medicaoForm.grua_id} 
                  onValueChange={(value) => setMedicaoForm({ ...medicaoForm, grua_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a grua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Grua STT293</SelectItem>
                    <SelectItem value="2">Grua Liebherr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="altura_medida">Altura Medida (m) *</Label>
                <Input
                  id="altura_medida"
                  type="number"
                  step="0.1"
                  min="0"
                  value={medicaoForm.altura_medida}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, altura_medida: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantidade_medida">Quantidade *</Label>
                <Input
                  id="quantidade_medida"
                  type="number"
                  min="0"
                  value={medicaoForm.quantidade_medida}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, quantidade_medida: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="valor_unitario">Valor Unitário (R$) *</Label>
                <Input
                  id="valor_unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={medicaoForm.valor_unitario}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, valor_unitario: parseFloat(e.target.value) || 0 })}
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
