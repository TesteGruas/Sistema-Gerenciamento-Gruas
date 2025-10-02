"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Truck, 
  Plus, 
  Search, 
  Eye,
  Edit,
  Download,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Filter,
  MoreHorizontal,
  Package,
  Calculator,
  Receipt,
  FileSpreadsheet,
  X
} from "lucide-react"
import { locacoesApi, Locacao, LocacaoStats } from "@/lib/api-locacoes"
import { medicoesApi, Medicao } from "@/lib/api-medicoes"
import { aditivosApi, Aditivo } from "@/lib/api-aditivos"
import { orcamentosLocacaoApi, OrcamentoLocacao } from "@/lib/api-orcamentos-locacao"
import { notasDebitoApi, NotaDebito } from "@/lib/api-notas-debito"
import { notasFiscaisLocacaoApi, NotaFiscalLocacao } from "@/lib/api-notas-fiscais-locacao"
import { clientesApi } from "@/lib/api-clientes"
import { funcionariosApi } from "@/lib/api-funcionarios"
import { gruasApi } from "@/lib/api-gruas"
import { useToast } from "@/hooks/use-toast"
import { ButtonLoader } from "@/components/ui/loader"


export default function LocacoesPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedTipo, setSelectedTipo] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [selectedLocacao, setSelectedLocacao] = useState<any>(null)
  const [isViewLocacaoDialogOpen, setIsViewLocacaoDialogOpen] = useState(false)
  const [isEditLocacaoDialogOpen, setIsEditLocacaoDialogOpen] = useState(false)
  
  // Estados para dados da API
  const [locacoes, setLocacoes] = useState<Locacao[]>([])
  const [medicoes, setMedicoes] = useState<Medicao[]>([])
  const [aditivos, setAditivos] = useState<Aditivo[]>([])
  const [orcamentos, setOrcamentos] = useState<OrcamentoLocacao[]>([])
  const [notasDebito, setNotasDebito] = useState<NotaDebito[]>([])
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscalLocacao[]>([])
  const [stats, setStats] = useState<LocacaoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<any[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [gruas, setGruas] = useState<any[]>([])
  
  const { toast } = useToast()

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados em paralelo
      const [
        locacoesResponse,
        medicoesResponse,
        aditivosResponse,
        orcamentosResponse,
        notasDebitoResponse,
        notasFiscaisResponse,
        statsResponse,
        clientesResponse,
        funcionariosResponse,
        gruasResponse
      ] = await Promise.all([
        locacoesApi.list({ limit: 50 }),
        medicoesApi.list({ limit: 50 }),
        aditivosApi.list({ limit: 50 }),
        orcamentosLocacaoApi.list({ limit: 50 }),
        notasDebitoApi.list({ limit: 50 }),
        notasFiscaisLocacaoApi.list({ limit: 50 }),
        locacoesApi.getStats(),
        clientesApi.listarClientes({ limit: 100 }),
        funcionariosApi.listarFuncionarios({ limit: 100 }),
        gruasApi.listarGruas({ limit: 100 })
      ])

      setLocacoes(locacoesResponse.data || [])
      setMedicoes(medicoesResponse.data || [])
      setAditivos(aditivosResponse.data || [])
      setOrcamentos(orcamentosResponse.data || [])
      setNotasDebito(notasDebitoResponse.data || [])
      setNotasFiscais(notasFiscaisResponse.data || [])
      setStats(statsResponse.data)
      setClientes(clientesResponse.data || [])
      setFuncionarios(funcionariosResponse.data || [])
      setGruas(gruasResponse.data || [])

      // Debug logs para verificar se os dados foram carregados
      console.log('Dados carregados:')
      console.log('Clientes:', clientesResponse.data?.length || 0)
      console.log('Funcionários:', funcionariosResponse.data?.length || 0)
      console.log('Gruas:', gruasResponse.data?.length || 0)

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das locações",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    { 
      title: "Gruas Locadas", 
      value: stats?.gruas_locadas?.toString() || "0", 
      icon: Truck, 
      color: "bg-blue-500",
      change: "Ativas no sistema"
    },
    { 
      title: "Plataformas Locadas", 
      value: stats?.plataformas_locadas?.toString() || "0", 
      icon: Package, 
      color: "bg-green-500",
      change: "Ativas no sistema"
    },
    { 
      title: "Receita Mensal", 
      value: stats?.receita_mensal_atual ? `R$ ${stats.receita_mensal_atual.toLocaleString('pt-BR')}` : "R$ 0", 
      icon: DollarSign, 
      color: "bg-purple-500",
      change: "Receita atual"
    },
    { 
      title: "Total de Locações", 
      value: stats?.total_locacoes_ativas?.toString() || "0", 
      icon: Clock, 
      color: "bg-orange-500",
      change: "Locações ativas"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
      case 'finalizada':
      case 'emitida':
      case 'paga':
        return 'bg-green-100 text-green-800'
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelada':
      case 'vencida':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'locacao_grua':
        return 'bg-blue-100 text-blue-800'
      case 'locacao_plataforma':
        return 'bg-green-100 text-green-800'
      case 'entrada':
        return 'bg-green-100 text-green-800'
      case 'saida':
        return 'bg-red-100 text-red-800'
      case 'adicional':
        return 'bg-blue-100 text-blue-800'
      case 'multa':
        return 'bg-red-100 text-red-800'
      case 'desconto':
        return 'bg-green-100 text-green-800'
      case 'outros':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewLocacao = (locacao: any) => {
    setSelectedLocacao(locacao)
    setIsViewLocacaoDialogOpen(true)
  }

  const handleEditLocacao = (locacao: any) => {
    setSelectedLocacao(locacao)
    setIsEditLocacaoDialogOpen(true)
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulo de Locações</h1>
          <p className="text-gray-600">Gestão de locações de gruas e plataformas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Locação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Locação</DialogTitle>
                <DialogDescription>
                  Registre uma nova locação de equipamento
                </DialogDescription>
              </DialogHeader>
              <LocacaoForm 
                onClose={() => setIsCreateDialogOpen(false)} 
                clientes={clientes}
                funcionarios={funcionarios}
                gruas={gruas}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="gruas">Gruas</TabsTrigger>
          <TabsTrigger value="plataformas">Plataformas</TabsTrigger>
          <TabsTrigger value="medicoes">Medições</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
          <TabsTrigger value="nfe">NFe</TabsTrigger>
          <TabsTrigger value="notas-debito">Notas Débito</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Receita de Locações
                </CardTitle>
                <CardDescription>Projeção de receita mensal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Janeiro 2024</span>
                    <span className="font-bold text-green-600">R$ 125.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fevereiro 2024</span>
                    <span className="font-bold text-green-600">R$ 135.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Março 2024</span>
                    <span className="font-bold text-green-600">R$ 142.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Abril 2024</span>
                    <span className="font-bold text-green-600">R$ 138.000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Equipamentos Ativos
                </CardTitle>
                <CardDescription>Status dos equipamentos locados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Gruas Ativas</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">8</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Plataformas Ativas</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">Medições Pendentes</span>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gruas Locadas */}
        <TabsContent value="gruas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gruas Locadas</CardTitle>
              <CardDescription>Gestão de gruas em locação</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Medições</TableHead>
                    <TableHead>Aditivos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 9 }).map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    locacoes
                      .filter(locacao => locacao.tipo_equipamento === 'grua')
                      .map((locacao) => (
                        <TableRow key={locacao.id}>
                          <TableCell className="font-medium">{locacao.numero}</TableCell>
                          <TableCell>{locacao.cliente_nome || 'N/A'}</TableCell>
                          <TableCell>{locacao.numero_contrato || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(locacao.data_inicio).toLocaleDateString('pt-BR')} - {locacao.data_fim ? new Date(locacao.data_fim).toLocaleDateString('pt-BR') : 'Em andamento'}
                          </TableCell>
                          <TableCell className="font-semibold">
                            R$ {locacao.valor_mensal.toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>{locacao.total_medicoes || 0}</TableCell>
                          <TableCell>{locacao.total_aditivos || 0}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(locacao.status)}>
                              {locacao.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewLocacao(locacao)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditLocacao(locacao)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plataformas Locadas */}
        <TabsContent value="plataformas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plataformas Locadas</CardTitle>
              <CardDescription>Gestão de plataformas em locação</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Medições</TableHead>
                    <TableHead>Aditivos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 9 }).map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    locacoes
                      .filter(locacao => locacao.tipo_equipamento === 'plataforma')
                      .map((locacao) => (
                        <TableRow key={locacao.id}>
                          <TableCell className="font-medium">{locacao.numero}</TableCell>
                          <TableCell>{locacao.cliente_nome || 'N/A'}</TableCell>
                          <TableCell>{locacao.numero_contrato || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(locacao.data_inicio).toLocaleDateString('pt-BR')} - {locacao.data_fim ? new Date(locacao.data_fim).toLocaleDateString('pt-BR') : 'Em andamento'}
                          </TableCell>
                          <TableCell className="font-semibold">
                            R$ {locacao.valor_mensal.toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>{locacao.total_medicoes || 0}</TableCell>
                          <TableCell>{locacao.total_aditivos || 0}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(locacao.status)}>
                              {locacao.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewLocacao(locacao)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditLocacao(locacao)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medições Finalizadas */}
        <TabsContent value="medicoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Medições Finalizadas</CardTitle>
              <CardDescription>Relatório de medições com filtros por período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="search"
                        placeholder="Número, cliente, equipamento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="finalizada">Finalizada</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Valor Base</TableHead>
                      <TableHead>Aditivos</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={index}>
                          {Array.from({ length: 9 }).map((_, cellIndex) => (
                            <TableCell key={cellIndex}>
                              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      medicoes.map((medicao) => (
                        <TableRow key={medicao.id}>
                          <TableCell className="font-medium">{medicao.numero}</TableCell>
                          <TableCell>{medicao.locacoes?.clientes?.nome || 'N/A'}</TableCell>
                          <TableCell>{medicao.locacoes?.equipamento_id || 'N/A'}</TableCell>
                          <TableCell>{medicao.periodo}</TableCell>
                          <TableCell className="font-semibold">
                            R$ {medicao.valor_base.toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="font-semibold">
                            R$ {medicao.valor_aditivos.toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            R$ {medicao.valor_total.toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(medicao.status)}>
                              {medicao.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orçamentos */}
        <TabsContent value="orcamentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos de Locação</CardTitle>
              <CardDescription>Gestão de orçamentos para locações</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 8 }).map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    orcamentos.map((orcamento) => (
                      <TableRow key={orcamento.id}>
                        <TableCell className="font-medium">{orcamento.numero}</TableCell>
                        <TableCell>{orcamento.clientes?.nome || 'N/A'}</TableCell>
                        <TableCell>{new Date(orcamento.data_orcamento).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {orcamento.valor_total.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>{new Date(orcamento.data_validade).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(orcamento.status)}>
                            {orcamento.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTipoColor(orcamento.tipo_orcamento)}>
                            {orcamento.tipo_orcamento}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NFe */}
        <TabsContent value="nfe" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notas Fiscais de Locação</CardTitle>
              <CardDescription>Gestão de NFe de entrada e saída</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 8 }).map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    notasFiscais.map((nf) => (
                      <TableRow key={nf.id}>
                        <TableCell className="font-medium">{nf.numero_nf}</TableCell>
                        <TableCell>{nf.serie || 'N/A'}</TableCell>
                        <TableCell>{nf.clientes?.nome || 'N/A'}</TableCell>
                        <TableCell>{new Date(nf.data_emissao).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {nf.valor_total.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(nf.status)}>
                            {nf.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTipoColor(nf.tipo)}>
                            {nf.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notas de Débito */}
        <TabsContent value="notas-debito" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notas de Débito</CardTitle>
              <CardDescription>Gestão de notas de débito</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 7 }).map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    notasDebito.map((nota) => (
                      <TableRow key={nota.id}>
                        <TableCell className="font-medium">{nota.numero}</TableCell>
                        <TableCell>{nota.clientes?.nome || 'N/A'}</TableCell>
                        <TableCell>{new Date(nota.data_emissao).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {nota.valor.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{nota.descricao}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(nota.status)}>
                            {nota.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório Detalhado */}
        <TabsContent value="relatorio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Detalhado de Locações</CardTitle>
              <CardDescription>Relatório completo com filtros personalizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="periodo">Período</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mes">Este Mês</SelectItem>
                        <SelectItem value="trimestre">Este Trimestre</SelectItem>
                        <SelectItem value="ano">Este Ano</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="equipamento">Equipamento</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os equipamentos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="gruas">Gruas</SelectItem>
                        <SelectItem value="plataformas">Plataformas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cliente">Cliente</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os clientes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="cliente1">Construtora ABC Ltda</SelectItem>
                        <SelectItem value="cliente2">Engenharia XYZ S/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Gerar Relatório
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Excel
                  </Button>
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Visualização */}
      <ViewLocacaoDialog
        locacao={selectedLocacao}
        isOpen={isViewLocacaoDialogOpen}
        onClose={() => {
          setIsViewLocacaoDialogOpen(false)
          setSelectedLocacao(null)
        }}
      />

      {/* Dialog de Edição */}
      <EditLocacaoDialog
        locacao={selectedLocacao}
        isOpen={isEditLocacaoDialogOpen}
        onClose={() => {
          setIsEditLocacaoDialogOpen(false)
          setSelectedLocacao(null)
        }}
        onSuccess={() => {
          loadInitialData()
          setIsEditLocacaoDialogOpen(false)
          setSelectedLocacao(null)
          toast({
            title: "Sucesso",
            description: "Locação atualizada com sucesso!"
          })
        }}
      />
    </div>
  )
}

function LocacaoForm({ onClose, clientes, funcionarios, gruas }: { 
  onClose: () => void
  clientes: any[]
  funcionarios: any[]
  gruas: any[]
}) {
  const [formData, setFormData] = useState({
    numero: '',
    cliente_id: '',
    equipamento_id: '',
    tipo_equipamento: 'grua' as 'grua' | 'plataforma',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    valor_mensal: '',
    funcionario_responsavel_id: '',
    observacoes: ''
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Estados para filtros de busca
  // Estados para filtros (removidos - agora usando componentes dedicados)

  // Filtrar dados válidos (simplificado - filtros agora nos componentes)
  const clientesValidos = clientes.filter(cliente => 
    cliente.nome && cliente.nome.trim() !== ''
  )
  const funcionariosValidos = funcionarios.filter(funcionario => 
    funcionario.nome && 
    funcionario.nome.trim() !== '' && 
    funcionario.status === 'Ativo'
  )
  const gruasValidas = gruas.filter(grua => 
    grua.id && 
    grua.modelo && 
    grua.status === 'disponivel'
  )

  // Debug logs
  console.log('Clientes carregados:', clientes.length)
  console.log('Clientes válidos:', clientesValidos.length)
  console.log('Funcionários carregados:', funcionarios.length)
  console.log('Funcionários válidos:', funcionariosValidos.length)
  console.log('Gruas carregadas:', gruas.length)
  console.log('Gruas válidas:', gruasValidas.length)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações básicas
    if (!formData.numero || !formData.cliente_id || !formData.equipamento_id || !formData.valor_mensal) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    // Validações de dados disponíveis
    if (clientesValidos.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum cliente válido disponível",
        variant: "destructive"
      })
      return
    }

    if (gruasValidas.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum equipamento disponível para locação",
        variant: "destructive"
      })
      return
    }

    if (funcionariosValidos.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum funcionário ativo disponível",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      
      const data = {
        ...formData,
        cliente_id: parseInt(formData.cliente_id),
        equipamento_id: formData.equipamento_id,
        valor_mensal: parseFloat(formData.valor_mensal),
        funcionario_responsavel_id: formData.funcionario_responsavel_id ? parseInt(formData.funcionario_responsavel_id) : undefined,
        data_fim: formData.data_fim || undefined
      }

      await locacoesApi.create(data)
      
      toast({
        title: "Sucesso",
        description: "Locação criada com sucesso"
      })
      
      onClose()
    } catch (error) {
      console.error('Erro ao criar locação:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar locação",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="numero">Número da Locação</Label>
          <Input
            id="numero"
            value={formData.numero}
            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
            placeholder="Ex: LOC-001"
            required
          />
        </div>
        <div>
          <Label htmlFor="cliente_id">Cliente *</Label>
          <ClienteSelector
            value={formData.cliente_id}
            onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
            placeholder="Selecione o cliente"
            required={true}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipo_equipamento">Tipo de Equipamento</Label>
          <Select value={formData.tipo_equipamento} onValueChange={(value: 'grua' | 'plataforma') => {
            setFormData({ ...formData, tipo_equipamento: value, equipamento_id: '' })
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grua">Grua</SelectItem>
              <SelectItem value="plataforma">Plataforma</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="equipamento_id">Equipamento *</Label>
          <EquipamentoSelector
            value={formData.equipamento_id}
            onValueChange={(value) => setFormData({ ...formData, equipamento_id: value })}
            placeholder="Selecione o equipamento"
            required={true}
            tipoEquipamento={formData.tipo_equipamento}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="data_inicio">Data de Início</Label>
          <Input
            id="data_inicio"
            type="date"
            value={formData.data_inicio}
            onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="data_fim">Data de Fim</Label>
          <Input
            id="data_fim"
            type="date"
            value={formData.data_fim}
            onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
          <Input
            id="valor_mensal"
            type="number"
            step="0.01"
            value={formData.valor_mensal}
            onChange={(e) => setFormData({ ...formData, valor_mensal: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="funcionario_responsavel_id">Funcionário Responsável *</Label>
          <FuncionarioSelector
            value={formData.funcionario_responsavel_id}
            onValueChange={(value) => setFormData({ ...formData, funcionario_responsavel_id: value })}
            placeholder="Selecione o funcionário"
            required={true}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          placeholder="Observações adicionais..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <ButtonLoader text="Salvando..." />
          ) : (
            'Salvar Locação'
          )}
        </Button>
      </div>
    </form>
  )
}

// Componente para visualizar locação
function ViewLocacaoDialog({ locacao, isOpen, onClose }: {
  locacao: any | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!locacao) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Locação</DialogTitle>
          <DialogDescription>
            Informações completas da locação {locacao.numero}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Número da Locação</Label>
              <p className="text-lg font-semibold">{locacao.numero}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Status</Label>
              <Badge className="bg-green-100 text-green-800">
                {locacao.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Cliente</Label>
              <p className="text-lg">{locacao.cliente_nome || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Equipamento</Label>
              <p className="text-lg">{locacao.equipamento_id} - {locacao.tipo_equipamento}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Data de Início</Label>
              <p className="text-lg">{new Date(locacao.data_inicio).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Data de Fim</Label>
              <p className="text-lg">{locacao.data_fim ? new Date(locacao.data_fim).toLocaleDateString('pt-BR') : 'Em andamento'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Valor Mensal</Label>
              <p className="text-lg font-semibold text-green-600">
                R$ {locacao.valor_mensal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Funcionário Responsável</Label>
              <p className="text-lg">{locacao.funcionario_nome || 'N/A'}</p>
            </div>
          </div>

          {locacao.observacoes && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Observações</Label>
              <p className="text-lg bg-gray-50 p-3 rounded-md">{locacao.observacoes}</p>
            </div>
          )}

          {/* Informações de Contrato */}
          {locacao.numero_contrato && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Informações do Contrato</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Número do Contrato</Label>
                  <p className="text-lg">{locacao.numero_contrato}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data do Contrato</Label>
                  <p className="text-lg">{locacao.data_contrato ? new Date(locacao.data_contrato).toLocaleDateString('pt-BR') : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Componente para editar locação
function EditLocacaoDialog({ locacao, isOpen, onClose, onSuccess }: {
  locacao: any | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    numero: '',
    cliente_id: '',
    equipamento_id: '',
    tipo_equipamento: 'grua' as 'grua' | 'plataforma',
    data_inicio: '',
    data_fim: '',
    valor_mensal: '',
    status: 'ativa' as 'ativa' | 'finalizada' | 'cancelada',
    observacoes: '',
    funcionario_responsavel_id: ''
  })
  const [loading, setLoading] = useState(false)

  // Carregar dados da locação quando o dialog abrir
  useEffect(() => {
    if (locacao && isOpen) {
      setFormData({
        numero: locacao.numero || '',
        cliente_id: locacao.cliente_id?.toString() || '',
        equipamento_id: locacao.equipamento_id || '',
        tipo_equipamento: locacao.tipo_equipamento || 'grua',
        data_inicio: locacao.data_inicio || '',
        data_fim: locacao.data_fim || '',
        valor_mensal: locacao.valor_mensal?.toString() || '',
        status: locacao.status || 'ativa',
        observacoes: locacao.observacoes || '',
        funcionario_responsavel_id: locacao.funcionario_responsavel_id?.toString() || ''
      })
    }
  }, [locacao, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!locacao) return

    try {
      setLoading(true)
      
      await locacoesApi.update(locacao.id, {
        numero: formData.numero,
        cliente_id: parseInt(formData.cliente_id),
        equipamento_id: formData.equipamento_id,
        tipo_equipamento: formData.tipo_equipamento,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim || undefined,
        valor_mensal: parseFloat(formData.valor_mensal),
        status: formData.status,
        observacoes: formData.observacoes || undefined,
        funcionario_responsavel_id: parseInt(formData.funcionario_responsavel_id)
      })

      onSuccess()
      
    } catch (error) {
      console.error('Erro ao atualizar locação:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar locação. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!locacao) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Locação</DialogTitle>
          <DialogDescription>
            Edite as informações da locação {locacao.numero}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">Número da Locação</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'ativa' | 'finalizada' | 'cancelada') => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cliente_id">Cliente *</Label>
              <ClienteSelector
                value={formData.cliente_id}
                onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                placeholder="Selecione o cliente"
                required={true}
              />
            </div>
            <div>
              <Label htmlFor="equipamento_id">Equipamento *</Label>
              <EquipamentoSelector
                value={formData.equipamento_id}
                onValueChange={(value) => setFormData({ ...formData, equipamento_id: value })}
                placeholder="Selecione o equipamento"
                required={true}
                tipoEquipamento={formData.tipo_equipamento}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo_equipamento">Tipo de Equipamento</Label>
              <Select value={formData.tipo_equipamento} onValueChange={(value: 'grua' | 'plataforma') => {
                setFormData({ ...formData, tipo_equipamento: value, equipamento_id: '' })
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grua">Grua</SelectItem>
                  <SelectItem value="plataforma">Plataforma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="funcionario_responsavel_id">Funcionário Responsável *</Label>
              <FuncionarioSelector
                value={formData.funcionario_responsavel_id}
                onValueChange={(value) => setFormData({ ...formData, funcionario_responsavel_id: value })}
                placeholder="Selecione o funcionário"
                required={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="data_fim">Data de Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
              <Input
                id="valor_mensal"
                type="number"
                step="0.01"
                value={formData.valor_mensal}
                onChange={(e) => setFormData({ ...formData, valor_mensal: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Componente para Seleção de Clientes com Filtro
function ClienteSelector({ 
  value, 
  onValueChange, 
  placeholder = "Selecione o cliente",
  required = false 
}: { 
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  required?: boolean
}) {
  const [clientes, setClientes] = useState<any[]>([])
  const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([])
  const [clienteFilter, setClienteFilter] = useState('')
  const [loading, setLoading] = useState(false)

  // Carregar clientes iniciais
  useEffect(() => {
    const carregarClientes = async () => {
      try {
        setLoading(true)
        const response = await clientesApi.listarClientes({ limit: 100 })
        setClientes(response.data || [])
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
        setClientes([])
      } finally {
        setLoading(false)
      }
    }
    
    carregarClientes()
  }, [])

  // Buscar clientes dinamicamente
  const buscarClientes = async (termo: string) => {
    if (!termo || termo.length < 2) {
      setClientesFiltrados([])
      return
    }

    try {
      setLoading(true)
      const response = await clientesApi.buscarClientes(termo)
      setClientesFiltrados(response.data || [])
    } catch (error) {
      console.error('Erro na busca de clientes:', error)
      setClientesFiltrados([])
    } finally {
      setLoading(false)
    }
  }

  // Debounce para evitar muitas requisições
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscarClientes(clienteFilter)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [clienteFilter])

  // Filtrar clientes baseado no termo de busca
  const clientesDisponiveis = clienteFilter.trim() 
    ? clientesFiltrados 
    : clientes

  const clienteSelecionado = clientes.find(c => c.id.toString() === value)

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Input
          placeholder="Buscar cliente por nome, CNPJ ou email..."
          value={clienteFilter}
          onChange={(e) => setClienteFilter(e.target.value)}
          className="text-sm"
        />
        <Select 
          value={value} 
          onValueChange={onValueChange}
          required={required}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {loading ? (
              <div className="p-2 text-sm text-gray-500 text-center">
                Carregando clientes...
              </div>
            ) : clientesDisponiveis.length > 0 ? (
              clientesDisponiveis.map(cliente => (
                <SelectItem key={cliente.id} value={cliente.id.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{cliente.nome}</span>
                    {cliente.cnpj && (
                      <span className="text-xs text-gray-500">{cliente.cnpj}</span>
                    )}
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-gray-500 text-center">
                {clienteFilter ? 'Nenhum cliente encontrado' : 'Nenhum cliente disponível'}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
      {clienteSelecionado && (
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Selecionado:</strong> {clienteSelecionado.nome}
          {clienteSelecionado.cnpj && ` - ${clienteSelecionado.cnpj}`}
        </div>
      )}
    </div>
  )
}

// Componente para Seleção de Funcionários com Filtro
function FuncionarioSelector({ 
  value, 
  onValueChange, 
  placeholder = "Selecione o funcionário",
  required = false 
}: { 
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  required?: boolean
}) {
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [funcionariosFiltrados, setFuncionariosFiltrados] = useState<any[]>([])
  const [funcionarioFilter, setFuncionarioFilter] = useState('')
  const [loading, setLoading] = useState(false)

  // Carregar funcionários iniciais
  useEffect(() => {
    const carregarFuncionarios = async () => {
      try {
        setLoading(true)
        const response = await funcionariosApi.listarFuncionarios({ limit: 100, status: 'Ativo' })
        setFuncionarios(response.data || [])
      } catch (error) {
        console.error('Erro ao carregar funcionários:', error)
        setFuncionarios([])
      } finally {
        setLoading(false)
      }
    }
    
    carregarFuncionarios()
  }, [])

  // Buscar funcionários dinamicamente
  const buscarFuncionarios = async (termo: string) => {
    if (!termo || termo.length < 2) {
      setFuncionariosFiltrados([])
      return
    }

    try {
      setLoading(true)
      // Filtrar localmente por enquanto
      const resultados = funcionarios.filter(f => 
        f.nome.toLowerCase().includes(termo.toLowerCase()) ||
        f.cargo?.toLowerCase().includes(termo.toLowerCase())
      )
      setFuncionariosFiltrados(resultados)
    } catch (error) {
      console.error('Erro na busca de funcionários:', error)
      setFuncionariosFiltrados([])
    } finally {
      setLoading(false)
    }
  }

  // Debounce para evitar muitas requisições
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscarFuncionarios(funcionarioFilter)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [funcionarioFilter])

  // Filtrar funcionários baseado no termo de busca
  const funcionariosDisponiveis = funcionarioFilter.trim() 
    ? funcionariosFiltrados 
    : funcionarios

  const funcionarioSelecionado = funcionarios.find(f => f.id.toString() === value)

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Input
          placeholder="Buscar funcionário por nome ou cargo..."
          value={funcionarioFilter}
          onChange={(e) => setFuncionarioFilter(e.target.value)}
          className="text-sm"
        />
        <Select 
          value={value} 
          onValueChange={onValueChange}
          required={required}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {loading ? (
              <div className="p-2 text-sm text-gray-500 text-center">
                Carregando funcionários...
              </div>
            ) : funcionariosDisponiveis.length > 0 ? (
              funcionariosDisponiveis.map(funcionario => (
                <SelectItem key={funcionario.id} value={funcionario.id.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{funcionario.nome}</span>
                    {funcionario.cargo && (
                      <span className="text-xs text-gray-500">{funcionario.cargo}</span>
                    )}
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-gray-500 text-center">
                {funcionarioFilter ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário disponível'}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
      {funcionarioSelecionado && (
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Selecionado:</strong> {funcionarioSelecionado.nome}
          {funcionarioSelecionado.cargo && ` - ${funcionarioSelecionado.cargo}`}
        </div>
      )}
    </div>
  )
}

// Componente para Seleção de Equipamentos com Filtro
function EquipamentoSelector({ 
  value, 
  onValueChange, 
  placeholder = "Selecione o equipamento",
  required = false,
  tipoEquipamento = 'grua'
}: { 
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  required?: boolean
  tipoEquipamento?: string
}) {
  const [equipamentos, setEquipamentos] = useState<any[]>([])
  const [equipamentosFiltrados, setEquipamentosFiltrados] = useState<any[]>([])
  const [equipamentoFilter, setEquipamentoFilter] = useState('')
  const [loading, setLoading] = useState(false)

  // Carregar equipamentos iniciais
  useEffect(() => {
    const carregarEquipamentos = async () => {
      try {
        setLoading(true)
        const response = await gruasApi.listarGruas({ limit: 100, status: 'disponivel' })
        console.log('Equipamentos carregados:', response.data)
        setEquipamentos(response.data || [])
      } catch (error) {
        console.error('Erro ao carregar equipamentos:', error)
        setEquipamentos([])
      } finally {
        setLoading(false)
      }
    }
    
    carregarEquipamentos()
  }, [])

  // Buscar equipamentos dinamicamente
  const buscarEquipamentos = async (termo: string) => {
    if (!termo || termo.length < 2) {
      setEquipamentosFiltrados([])
      return
    }

    try {
      setLoading(true)
      // Filtrar localmente por enquanto
      const resultados = equipamentos.filter(e => 
        e.modelo?.toLowerCase().includes(termo.toLowerCase()) ||
        e.fabricante?.toLowerCase().includes(termo.toLowerCase()) ||
        e.tipo?.toLowerCase().includes(termo.toLowerCase()) ||
        e.id?.toString().includes(termo)
      )
      setEquipamentosFiltrados(resultados)
    } catch (error) {
      console.error('Erro na busca de equipamentos:', error)
      setEquipamentosFiltrados([])
    } finally {
      setLoading(false)
    }
  }

  // Debounce para evitar muitas requisições
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscarEquipamentos(equipamentoFilter)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [equipamentoFilter])

  // Filtrar equipamentos baseado no termo de busca e tipo
  const equipamentosDisponiveis = equipamentoFilter.trim() 
    ? equipamentosFiltrados 
    : equipamentos

  const equipamentoSelecionado = equipamentos.find(e => e.id.toString() === value)

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Input
          placeholder="Buscar equipamento por modelo, fabricante ou ID..."
          value={equipamentoFilter}
          onChange={(e) => setEquipamentoFilter(e.target.value)}
          className="text-sm"
        />
        <Select 
          value={value} 
          onValueChange={onValueChange}
          required={required}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {loading ? (
              <div className="p-2 text-sm text-gray-500 text-center">
                Carregando equipamentos...
              </div>
            ) : equipamentosDisponiveis.length > 0 ? (
              equipamentosDisponiveis.map(equipamento => (
                <SelectItem key={equipamento.id} value={equipamento.id.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{equipamento.modelo}</span>
                    <span className="text-xs text-gray-500">
                      {equipamento.fabricante} - {equipamento.tipo}
                    </span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-gray-500 text-center">
                {equipamentoFilter ? 'Nenhum equipamento encontrado' : 'Nenhum equipamento disponível'}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
      {equipamentoSelecionado && (
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Selecionado:</strong> {equipamentoSelecionado.modelo}
          {equipamentoSelecionado.fabricante && ` - ${equipamentoSelecionado.fabricante}`}
        </div>
      )}
    </div>
  )
}
