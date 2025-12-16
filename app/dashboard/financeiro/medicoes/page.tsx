"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
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
  Clock,
  TrendingUp,
  BarChart3 as BarChartIcon,
  Forklift,
  Send
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { medicoesMensaisApi, MedicaoMensal } from "@/lib/api-medicoes-mensais"
import { gruasApi } from "@/lib/api-gruas"
import { receitasApi } from "@/lib/api-receitas"
import { custosApi } from "@/lib/api-custos"
import { obrasApi } from "@/lib/api-obras"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Cores para gráficos
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

// Tipos importados das APIs
import type { Receita, ReceitaCreate } from "@/lib/api-receitas"
import type { Custo, CustoCreate } from "@/lib/api-custos"

interface Grua {
  id: string | number
  name: string
  modelo?: string
  fabricante?: string
}

interface Obra {
  id: number
  nome: string
  cliente_id?: number
  status?: string
}

export default function MedicoesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('medicoes')
  
  // Estados para medições
  const [medicoes, setMedicoes] = useState<MedicaoMensal[]>([])
  const [gruas, setGruas] = useState<Grua[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingGruas, setLoadingGruas] = useState(false)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [gruaFilter, setGruaFilter] = useState("all")
  const [filterPeriodo, setFilterPeriodo] = useState("")
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 100
  
  // Estados para receitas
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [isCreateReceitaDialogOpen, setIsCreateReceitaDialogOpen] = useState(false)
  
  // Estados para custos
  const [custos, setCustos] = useState<Custo[]>([])
  const [isCreateCustoDialogOpen, setIsCreateCustoDialogOpen] = useState(false)
  
  // Estados de diálogos
  const [selectedMedicao, setSelectedMedicao] = useState<MedicaoMensal | null>(null)
  const [isEnviarDialogOpen, setIsEnviarDialogOpen] = useState(false)
  const [emailEnvio, setEmailEnvio] = useState("")
  const [telefoneEnvio, setTelefoneEnvio] = useState("")
  const [enviando, setEnviando] = useState(false)

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

  useEffect(() => {
    carregarGruas()
    carregarObras()
  }, [])

  const carregarGruas = async () => {
    try {
      setLoadingGruas(true)
      const response = await gruasApi.listarGruas({ limit: 1000 })
      if (response.success) {
        setGruas(response.data || [])
      }
    } catch (error: any) {
      console.error("Erro ao carregar gruas:", error)
    } finally {
      setLoadingGruas(false)
    }
  }

  const carregarObras = async () => {
    try {
      const response = await obrasApi.listarObras({ limit: 1000 })
      if (response.success) {
        setObras(response.data || [])
      }
    } catch (error: any) {
      console.error("Erro ao carregar obras:", error)
    }
  }

  const carregarMedicoes = useCallback(async () => {
    try {
      setIsLoading(true)
      const filters: any = { 
        limit: itemsPerPage,
        page: currentPage
      }
      if (gruaFilter !== "all") {
        filters.grua_id = parseInt(gruaFilter)
      }
      if (filterPeriodo) {
        filters.periodo = filterPeriodo
      }
      if (filterStatus !== "all") {
        filters.status = filterStatus
      }
      if (searchTerm && searchTerm.trim()) {
        filters.search = searchTerm.trim()
      }
      
      const response = await medicoesMensaisApi.listar(filters)
      if (response.success) {
        setMedicoes(response.data || [])
        // Atualizar informações de paginação
        if (response.pagination) {
          setTotalPages(response.pagination.pages || 1)
          setTotalItems(response.pagination.total || 0)
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar medições",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [gruaFilter, filterPeriodo, filterStatus, searchTerm, currentPage, toast])

  // Recarregar medições quando os filtros mudarem (incluindo busca)
  useEffect(() => {
    // Resetar para primeira página quando filtros mudarem
    setCurrentPage(1)
  }, [gruaFilter, filterPeriodo, filterStatus, searchTerm])

  // Recarregar medições quando os filtros ou página mudarem
  useEffect(() => {
    // Debounce para busca por texto (aguardar 500ms após parar de digitar)
    const timeoutId = setTimeout(() => {
      carregarMedicoes()
    }, searchTerm ? 500 : 0)
    
    return () => clearTimeout(timeoutId)
  }, [carregarMedicoes, searchTerm])

  const carregarDados = async () => {
    try {
      await carregarMedicoes()
      
      // Carregar receitas
      const receitasData = await receitasApi.list({ limit: 100 })
      setReceitas(receitasData.receitas || [])
      
      // Carregar custos
      const custosData = await custosApi.list({ limit: 100 })
      setCustos(custosData.custos || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    }
  }

  // Os filtros são aplicados via API, então filteredMedicoes é igual a medicoes
  const filteredMedicoes = useMemo(() => {
    return medicoes
  }, [medicoes])

  const handleEditar = (medicao: MedicaoMensal) => {
    router.push(`/dashboard/medicoes/${medicao.id}/editar`)
  }

  const handleEnviar = async () => {
    if (!selectedMedicao) return

    try {
      setEnviando(true)
      const response = await medicoesMensaisApi.enviar(selectedMedicao.id, emailEnvio || undefined, telefoneEnvio || undefined)
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Medição enviada ao cliente com sucesso"
        })
        setIsEnviarDialogOpen(false)
        setEmailEnvio("")
        setTelefoneEnvio("")
        await carregarMedicoes()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar medição",
        variant: "destructive"
      })
    } finally {
      setEnviando(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente", variant: "outline" },
      finalizada: { label: "Finalizada", variant: "default" },
      enviada: { label: "Enviada", variant: "secondary" },
      cancelada: { label: "Cancelada", variant: "destructive" }
    }
    const statusInfo = statusMap[status] || statusMap.pendente
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getAprovacaoBadge = (statusAprovacao?: string | null) => {
    if (!statusAprovacao) return null
    const aprovacaoMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      pendente: { label: "Aguardando Aprovação", variant: "secondary" },
      aprovada: { label: "Aprovada", variant: "default" },
      rejeitada: { label: "Rejeitada", variant: "destructive" }
    }
    const aprovacaoInfo = aprovacaoMap[statusAprovacao] || aprovacaoMap.pendente
    return <Badge variant={aprovacaoInfo.variant}>{aprovacaoInfo.label}</Badge>
  }

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      pendente: "bg-yellow-500",
      finalizada: "bg-green-500",
      enviada: "bg-blue-500",
      cancelada: "bg-red-500"
    }
    return statusMap[status] || "bg-gray-500"
  }

  const handleCreateReceita = async () => {
    try {
      const receitaData: ReceitaCreate = {
        obra_id: parseInt(receitaForm.obra_id),
        tipo: receitaForm.tipo,
        descricao: receitaForm.descricao,
        valor: receitaForm.valor,
        data_receita: receitaForm.data_receita,
        observacoes: receitaForm.observacoes || undefined
      }

      const novaReceita = await receitasApi.create(receitaData)
      setReceitas([novaReceita, ...receitas])
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
      const custoData: CustoCreate = {
        obra_id: parseInt(custoForm.obra_id),
        tipo: custoForm.tipo,
        descricao: custoForm.descricao,
        valor: custoForm.valor,
        data_custo: custoForm.data_custo,
        funcionario_id: custoForm.funcionario_id ? parseInt(custoForm.funcionario_id) : undefined,
        observacoes: custoForm.observacoes || undefined
      }

      const novoCusto = await custosApi.create(custoData)
      setCustos([novoCusto, ...custos])
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
            <Button onClick={() => router.push('/dashboard/medicoes/nova')}>
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

      {/* Gráficos de Estatísticas */}
      {activeTab === 'medicoes' && medicoes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChartIcon className="w-5 h-5" />
                Medições por Período
              </CardTitle>
              <CardDescription>Valor total das medições por mês</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={(() => {
                  const medicoesPorPeriodo = medicoes
                    .filter(m => m.status === 'finalizada')
                    .reduce((acc: any, medicao) => {
                      const periodo = medicao.periodo
                      const existing = acc.find((item: any) => item.periodo === periodo)
                      if (existing) {
                        existing.valor += Number(medicao.valor_total)
                      } else {
                        acc.push({ periodo, valor: Number(medicao.valor_total) })
                      }
                      return acc
                    }, [])
                  return medicoesPorPeriodo.slice(-6)
                })()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Legend />
                  <Bar dataKey="valor" fill="#3b82f6" name="Valor Total (R$)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolução das Medições
              </CardTitle>
              <CardDescription>Valor ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={(() => {
                  const medicoesPorPeriodo = medicoes
                    .filter(m => m.status === 'finalizada')
                    .reduce((acc: any, medicao) => {
                      const periodo = medicao.periodo
                      const existing = acc.find((item: any) => item.periodo === periodo)
                      if (existing) {
                        existing.valor += Number(medicao.valor_total)
                      } else {
                        acc.push({ periodo, valor: Number(medicao.valor_total) })
                      }
                      return acc
                    }, [])
                  return medicoesPorPeriodo.slice(-6)
                })()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Valor (R$)"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

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
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 items-end">
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por número, período, obra ou grua..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="finalizada">Finalizada</SelectItem>
                    <SelectItem value="enviada">Enviada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={gruaFilter} onValueChange={setGruaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Grua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Gruas</SelectItem>
                    {gruas.map((grua) => (
                      <SelectItem key={grua.id} value={String(grua.id)}>
                        {grua.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div>
                  <Label className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-xs">Período (YYYY-MM)</Label>
                  <Input
                    type="text"
                    placeholder="2025-01"
                    value={filterPeriodo}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9-]/g, '')
                      if (value.length <= 7) {
                        setFilterPeriodo(value)
                      }
                    }}
                    pattern="\d{4}-\d{2}"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setFilterStatus("all")
                    setGruaFilter("all")
                    setFilterPeriodo("")
                  }}
                >
                  Limpar
                </Button>
                <Button variant="outline" onClick={carregarMedicoes}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
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
              {isLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : filteredMedicoes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma medição encontrada</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Grua</TableHead>
                        <TableHead>Obra</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aprovação</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMedicoes.map((medicao) => (
                        <TableRow key={medicao.id}>
                          <TableCell className="font-medium">{medicao.numero}</TableCell>
                          <TableCell>{medicao.periodo}</TableCell>
                          <TableCell>
                            {medicao.gruas ? (
                              <div className="flex items-center gap-2">
                                <Forklift className="w-4 h-4" />
                                <span>{medicao.gruas.name || medicao.gruas.nome}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {medicao.obras ? (
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                <span>{medicao.obras.nome}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(medicao.valor_total || 0)}</TableCell>
                          <TableCell>{getStatusBadge(medicao.status)}</TableCell>
                          <TableCell>{getAprovacaoBadge(medicao.status_aprovacao)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  router.push(`/dashboard/medicoes/${medicao.id}`)
                                }}
                                title="Ver detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditar(medicao)}
                                title="Editar medição"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMedicao(medicao)
                                  setIsEnviarDialogOpen(true)
                                }}
                                title={medicao.status === 'enviada' ? 'Reenviar medição' : 'Enviar medição'}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Paginação */}
                  {!isLoading && filteredMedicoes.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} medições
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          <PaginationItem>
                            <span className="px-4 text-sm text-muted-foreground">
                              Página {currentPage} de {totalPages}
                            </span>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
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
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
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

      {/* Dialog de Envio */}
      <Dialog open={isEnviarDialogOpen} onOpenChange={setIsEnviarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Medição ao Cliente</DialogTitle>
            <DialogDescription>
              Informe o e-mail e telefone para envio das notificações
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={emailEnvio}
                onChange={(e) => setEmailEnvio(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
              <Input
                id="telefone"
                value={telefoneEnvio}
                onChange={(e) => setTelefoneEnvio(e.target.value)}
                placeholder="5511999999999"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEnviarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEnviar} disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar"}
            </Button>
          </div>
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
                    {obras.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        Nenhuma obra disponível
                      </div>
                    ) : (
                      obras.map(obra => (
                        <SelectItem key={obra.id} value={obra.id.toString()}>
                          {obra.nome}
                        </SelectItem>
                      ))
                    )}
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
                    {obras.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        Nenhuma obra disponível
                      </div>
                    ) : (
                      obras.map(obra => (
                        <SelectItem key={obra.id} value={obra.id.toString()}>
                          {obra.nome}
                        </SelectItem>
                      ))
                    )}
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
