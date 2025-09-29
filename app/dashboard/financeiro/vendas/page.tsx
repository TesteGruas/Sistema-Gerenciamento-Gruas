"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  getVendas, 
  createVenda, 
  updateVenda,
  deleteVenda, 
  addVendaItem,
  confirmarVenda,
  createVendaFromOrcamento,
  getVendaItens,
  type Venda,
  type VendaItem,
  type CreateVendaItemData
} from "@/lib/api-financial"
import { 
  getOrcamentos, 
  createOrcamento, 
  deleteOrcamento,
  enviarOrcamento,
  aprovarOrcamento,
  rejeitarOrcamento,
  type Orcamento,
  type CreateOrcamentoData,
  formatarStatusOrcamento,
  formatarTipoOrcamento,
  podeEditarOrcamento,
  podeExcluirOrcamento,
  podeEnviarOrcamento,
  podeAprovarOrcamento
} from "@/lib/api-orcamentos"
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Plus, 
  Search, 
  Edit,
  Trash2, 
  Eye,
  Receipt,
  Calendar,
  DollarSign,
  Building2,
  Send,
  Check,
  X,
  FileText,
  Download,
  User,
  Filter,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  CheckCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { clientesApi } from "@/lib/api-clientes"
import { estoqueAPI, type Produto } from "@/lib/api-estoque"

// Função utilitária para cores de status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmada': return 'bg-green-500'
    case 'pendente': return 'bg-yellow-500'
    case 'cancelada': return 'bg-red-500'
    case 'finalizada': return 'bg-blue-500'
    default: return 'bg-gray-500'
  }
}

export default function VendasPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('vendas')
  
  // Estados para vendas
  const [vendas, setVendas] = useState<Venda[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estados para orçamentos
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [orcamentosLoading, setOrcamentosLoading] = useState(false)
  const [isCreateOrcamentoDialogOpen, setIsCreateOrcamentoDialogOpen] = useState(false)
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null)
  const [isEditOrcamentoDialogOpen, setIsEditOrcamentoDialogOpen] = useState(false)
  const [selectedVenda, setSelectedVenda] = useState<Venda | null>(null)
  const [isViewVendaDialogOpen, setIsViewVendaDialogOpen] = useState(false)
  const [isEditVendaDialogOpen, setIsEditVendaDialogOpen] = useState(false)
  const [orcamentoFilters, setOrcamentoFilters] = useState({
    page: 1,
    limit: 10,
    status: undefined as string | undefined,
    data_inicio: undefined as string | undefined,
    data_fim: undefined as string | undefined
  })
  const [orcamentoPagination, setOrcamentoPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Carregar vendas
  const loadVendas = async () => {
    try {
      setIsLoading(true)
      const data = await getVendas()
      setVendas(data)
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar vendas",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar orçamentos
  const loadOrcamentos = async () => {
    setOrcamentosLoading(true)
    try {
      const response = await getOrcamentos(orcamentoFilters)
      setOrcamentos(response.data)
      setOrcamentoPagination(response.pagination)
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar orçamentos",
        variant: "destructive"
      })
    } finally {
      setOrcamentosLoading(false)
    }
  }

  useEffect(() => {
    loadVendas()
  }, [])

  useEffect(() => {
    if (activeTab === 'orcamentos') {
      loadOrcamentos()
    }
  }, [activeTab, orcamentoFilters])

  // Filtrar vendas
  const filteredVendas = vendas.filter(venda =>
    venda.numero_venda.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venda.clientes?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venda.obras?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTipoVendaColor = (tipo: string) => {
    switch (tipo) {
      case 'equipamento': return 'bg-purple-500'
      case 'servico': return 'bg-orange-500'
      case 'locacao': return 'bg-indigo-500'
      default: return 'bg-gray-500'
    }
  }

  // Handlers para orçamentos
  const handleCreateOrcamento = async (data: CreateOrcamentoData) => {
    try {
      await createOrcamento(data)
      toast({
        title: "Sucesso",
        description: "Orçamento criado com sucesso"
      })
      setIsCreateOrcamentoDialogOpen(false)
      loadOrcamentos()
    } catch (error) {
      console.error('Erro ao criar orçamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar orçamento",
        variant: "destructive"
      })
    }
  }

  const handleDeleteOrcamento = async (id: number) => {
    try {
      await deleteOrcamento(id)
      toast({
        title: "Sucesso",
        description: "Orçamento excluído com sucesso"
      })
      loadOrcamentos()
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir orçamento",
        variant: "destructive"
      })
    }
  }

  const handleEnviarOrcamento = async (id: number) => {
    try {
      await enviarOrcamento(id)
      toast({
        title: "Sucesso",
        description: "Orçamento enviado com sucesso"
      })
      loadOrcamentos()
    } catch (error) {
      console.error('Erro ao enviar orçamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao enviar orçamento",
        variant: "destructive"
      })
    }
  }

  const handleAprovarOrcamento = async (id: number) => {
    try {
      await aprovarOrcamento(id)
      toast({
        title: "Sucesso",
        description: "Orçamento aprovado com sucesso"
      })
      loadOrcamentos()
    } catch (error) {
      console.error('Erro ao aprovar orçamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao aprovar orçamento",
        variant: "destructive"
      })
    }
  }

  const handleCriarVendaFromOrcamento = async (orcamentoId: number) => {
    try {
      const venda = await createVendaFromOrcamento(orcamentoId)
      toast({
        title: "Sucesso",
        description: `Venda criada com sucesso! Número: ${venda.numero_venda}`,
      })
      loadOrcamentos()
      loadVendas() // Recarregar lista de vendas
    } catch (error) {
      console.error('Erro ao criar venda a partir de orçamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar venda a partir do orçamento",
        variant: "destructive",
      })
    }
  }

  const handleEditOrcamento = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento)
    setIsEditOrcamentoDialogOpen(true)
  }

  const handleViewVenda = (venda: Venda) => {
    setSelectedVenda(venda)
    setIsViewVendaDialogOpen(true)
  }

  const handleEditVenda = (venda: Venda) => {
    setSelectedVenda(venda)
    setIsEditVendaDialogOpen(true)
  }

  const handleConfirmarVenda = async (venda: Venda) => {
    try {
      await confirmarVenda(venda.id)
      toast({
        title: "Venda confirmada",
        description: "A venda foi confirmada e as movimentações de estoque foram criadas.",
      })
      loadVendas()
    } catch (error) {
      console.error('Erro ao confirmar venda:', error)
      toast({
        title: "Erro",
        description: "Erro ao confirmar venda. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendas e Orçamentos</h1>
          <p className="text-gray-600">Gestão de vendas, contratos e orçamentos</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'vendas' ? (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Venda
              </Button>
          ) : (
            <Button onClick={() => setIsCreateOrcamentoDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Orçamento
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
        </TabsList>

        {/* Aba de Vendas */}
        <TabsContent value="vendas" className="space-y-4">
          {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Buscar</Label>
                      <Input
                        id="search"
                    placeholder="Buscar por número, cliente ou obra..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
            </CardContent>
          </Card>

          {/* Lista de Vendas */}
          <Card>
            <CardHeader>
              <CardTitle>Vendas ({filteredVendas.length})</CardTitle>
              <CardDescription>Lista de todas as vendas registradas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p>Carregando vendas...</p>
                  </div>
              ) : filteredVendas.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhuma venda encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Obra</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendas.map((venda) => (
                        <TableRow key={venda.id}>
                        <TableCell className="font-medium">{venda.id}</TableCell>
                        <TableCell className="font-medium">{venda.numero_venda}</TableCell>
                          <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {venda.clientes?.nome || 'N/A'}
                          </div>
                          </TableCell>
                        <TableCell>{venda.obras?.nome || 'N/A'}</TableCell>
                          <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(venda.data_venda).toLocaleDateString('pt-BR')}
                            </div>
                          </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            R$ {venda.valor_total.toLocaleString('pt-BR')}
              </div>
                      </TableCell>
                        <TableCell>
                          <Badge className={getTipoVendaColor(venda.tipo_venda)}>
                            {venda.tipo_venda}
                            </Badge>
                          </TableCell>
                          <TableCell>
                          <Badge className={getStatusColor(venda.status)}>
                            {venda.status}
                            </Badge>
                          </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleViewVenda(venda)}
                                  >
                                <Eye className="w-4 h-4" />
                              </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Visualizar Venda</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEditVenda(venda)}
                                  >
                                <Edit className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar Venda</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {venda.status === 'pendente' && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleConfirmarVenda(venda)}
                                      className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Confirmar Venda</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja excluir esta venda?')) {
                                  deleteVenda(venda.id).then(() => loadVendas())
                                }
                              }}
                            >
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

        {/* Aba de Orçamentos */}
        <TabsContent value="orcamentos" className="space-y-4">
          {/* Filtros de Orçamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={orcamentoFilters.status || 'todos'} 
                    onValueChange={(value) => setOrcamentoFilters({ ...orcamentoFilters, status: value === 'todos' ? undefined : value, page: 1 })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="enviado">Enviado</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="rejeitado">Rejeitado</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                          </div>
                <div>
                  <Label htmlFor="data_inicio">Data Início</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={orcamentoFilters.data_inicio || ''}
                    onChange={(e) => setOrcamentoFilters({ ...orcamentoFilters, data_inicio: e.target.value || undefined, page: 1 })}
                  />
                </div>
                <div>
                  <Label htmlFor="data_fim">Data Fim</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={orcamentoFilters.data_fim || ''}
                    onChange={(e) => setOrcamentoFilters({ ...orcamentoFilters, data_fim: e.target.value || undefined, page: 1 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Orçamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos ({orcamentoPagination.total})</CardTitle>
            </CardHeader>
            <CardContent>
              {orcamentosLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p>Carregando orçamentos...</p>
                </div>
              ) : orcamentos.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum orçamento encontrado</h3>
                  <p className="text-gray-500 mb-4">Comece criando seu primeiro orçamento</p>
                  <Button onClick={() => setIsCreateOrcamentoDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Orçamento
                  </Button>
                </div>
              ) : (
                <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                        <TableHead>Validade</TableHead>
                        <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                      {orcamentos.map((orcamento) => {
                        const statusInfo = formatarStatusOrcamento(orcamento.status)
                        return (
                          <TableRow key={orcamento.id}>
                            <TableCell className="font-medium">
                              #{orcamento.id.toString().padStart(4, '0')}
                      </TableCell>
                        <TableCell>
                              <div>
                                <p className="font-medium">{orcamento.clientes?.nome}</p>
                                <p className="text-sm text-gray-500">{orcamento.clientes?.email}</p>
                              </div>
                        </TableCell>
                        <TableCell>
                              {new Date(orcamento.data_orcamento).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                              {new Date(orcamento.data_validade).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                              {formatarTipoOrcamento(orcamento.tipo_orcamento)}
                            </TableCell>
                            <TableCell className="font-medium">
                              R$ {orcamento.valor_total.toLocaleString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusInfo.color}>
                                {statusInfo.label}
                          </Badge>
                        </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditOrcamento(orcamento)}
                                >
                              <Eye className="w-4 h-4" />
                            </Button>
                                {podeEditarOrcamento(orcamento.status) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditOrcamento(orcamento)}
                                  >
                              <Edit className="w-4 h-4" />
                            </Button>
                                )}
                                {podeEnviarOrcamento(orcamento.status) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEnviarOrcamento(orcamento.id)}
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
                                )}
                                {podeAprovarOrcamento(orcamento.status) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAprovarOrcamento(orcamento.id)}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                {orcamento.status === 'aprovado' && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => handleCriarVendaFromOrcamento(orcamento.id)}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <Receipt className="w-4 h-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Criar Venda</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {podeExcluirOrcamento(orcamento.status) && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="outline">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteOrcamento(orcamento.id)}
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                          </div>
                        </TableCell>
                      </TableRow>
                        )
                      })}
                </TableBody>
              </Table>

                  {/* Paginação */}
                  {orcamentoPagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-500">
                        Mostrando {((orcamentoPagination.page - 1) * orcamentoPagination.limit) + 1} a {Math.min(orcamentoPagination.page * orcamentoPagination.limit, orcamentoPagination.total)} de {orcamentoPagination.total} orçamentos
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOrcamentoFilters({ ...orcamentoFilters, page: orcamentoPagination.page - 1 })}
                          disabled={orcamentoPagination.page === 1}
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm">
                          Página {orcamentoPagination.page} de {orcamentoPagination.pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOrcamentoFilters({ ...orcamentoFilters, page: orcamentoPagination.page + 1 })}
                          disabled={orcamentoPagination.page === orcamentoPagination.pages}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Criação de Venda */}
      <CreateVendaDialog 
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          loadVendas()
        }}
      />

      {/* Dialog de Criação de Orçamento */}
      <Dialog open={isCreateOrcamentoDialogOpen} onOpenChange={setIsCreateOrcamentoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Orçamento</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo orçamento
            </DialogDescription>
          </DialogHeader>
          <OrcamentoForm
            onSubmit={handleCreateOrcamento}
            onCancel={() => setIsCreateOrcamentoDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Orçamento */}
      <Dialog open={isEditOrcamentoDialogOpen} onOpenChange={setIsEditOrcamentoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Orçamento</DialogTitle>
            <DialogDescription>
              Edite os dados do orçamento
            </DialogDescription>
          </DialogHeader>
          {selectedOrcamento && (
            <OrcamentoForm
              orcamento={selectedOrcamento}
              onSubmit={handleCreateOrcamento}
              onCancel={() => {
                setIsEditOrcamentoDialogOpen(false)
                setSelectedOrcamento(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização de Venda */}
      <ViewVendaDialog
        venda={selectedVenda}
        isOpen={isViewVendaDialogOpen}
        onClose={() => {
          setIsViewVendaDialogOpen(false)
          setSelectedVenda(null)
        }}
      />

      {/* Dialog de Edição de Venda */}
      <EditVendaDialog
        venda={selectedVenda}
        isOpen={isEditVendaDialogOpen}
        onClose={() => {
          setIsEditVendaDialogOpen(false)
          setSelectedVenda(null)
        }}
        onSuccess={() => {
          loadVendas()
          toast({
            title: "Sucesso",
            description: "Venda atualizada com sucesso!",
          })
        }}
      />
    </div>
  )
}

function CreateVendaDialog({ isOpen, onClose, onSuccess }: { 
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    cliente_id: '',
    obra_id: '',
    numero_venda: '',
    data_venda: new Date().toISOString().split('T')[0],
    desconto: 0,
    tipo_venda: 'equipamento',
    observacoes: ''
  })
  
  const [itens, setItens] = useState<CreateVendaItemData[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loadingProdutos, setLoadingProdutos] = useState(false)
  const [vendaCriada, setVendaCriada] = useState<number | null>(null)

  // Carregar produtos quando o dialog abrir ou tipo de venda mudar
  useEffect(() => {
    if (isOpen) {
      carregarProdutos()
    }
  }, [isOpen, formData.tipo_venda])

  const carregarProdutos = async () => {
    try {
      setLoadingProdutos(true)
      
      // Se tipo de venda for "equipamento", carregar apenas produtos do estoque
      if (formData.tipo_venda === 'equipamento') {
        const response = await estoqueAPI.listarProdutos({ limit: 100, status: 'Ativo' })
        setProdutos(response.data || [])
      } else {
        // Para outros tipos, não carregar produtos (será descrição livre)
        setProdutos([])
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setProdutos([])
    } finally {
      setLoadingProdutos(false)
    }
  }

  const adicionarItem = () => {
    setItens([...itens, {
      produto_id: '',
      descricao: '',
      quantidade: 1,
      valor_unitario: 0
    }])
  }

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const atualizarItem = (index: number, campo: keyof CreateVendaItemData, valor: any) => {
    const novosItens = [...itens]
    novosItens[index] = { ...novosItens[index], [campo]: valor }
    
    // Se mudou o produto, atualizar todos os campos do produto
    if (campo === 'produto_id') {
      const produto = produtos.find(p => p.id === valor)
      if (produto) {
        novosItens[index].descricao = produto.descricao || produto.nome
        novosItens[index].valor_unitario = produto.valor_unitario
      }
    }
    
    setItens(novosItens)
  }

  // Limpar itens quando tipo de venda mudar
  useEffect(() => {
    if (isOpen) {
      setItens([])
    }
  }, [formData.tipo_venda, isOpen])

  const calcularTotal = () => {
    return itens.reduce((total, item) => total + (item.quantidade * item.valor_unitario), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Calcular valor total dos itens
      const valorTotalItens = itens.reduce((total, item) => total + (item.quantidade * item.valor_unitario), 0)
      const valorTotalComDesconto = valorTotalItens - (formData.desconto || 0)
      
      // Criar venda primeiro
      const venda = await createVenda({
        cliente_id: parseInt(formData.cliente_id),
        obra_id: formData.obra_id ? parseInt(formData.obra_id) : undefined,
        numero_venda: formData.numero_venda,
        data_venda: formData.data_venda,
        valor_total: valorTotalComDesconto,
        status: 'pendente' as 'pendente' | 'confirmada' | 'cancelada' | 'finalizada',
        tipo_venda: formData.tipo_venda as 'equipamento' | 'servico' | 'locacao',
        observacoes: formData.observacoes || undefined
      })
      
      setVendaCriada(venda.id)
      
      // Adicionar itens se houver
      if (itens.length > 0) {
        for (const item of itens) {
          await addVendaItem(venda.id, item)
        }
      }
      
      onSuccess()
    } catch (error) {
      console.error('Erro ao criar venda:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Venda</DialogTitle>
          <DialogDescription>
            Registre uma nova venda no sistema
          </DialogDescription>
        </DialogHeader>
        
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
              <Label htmlFor="numero_venda">Número da Venda</Label>
              <Input
                id="numero_venda"
                value={formData.numero_venda}
                onChange={(e) => setFormData({ ...formData, numero_venda: e.target.value })}
                required
              />
        </div>
        <div>
              <Label htmlFor="data_venda">Data da Venda</Label>
          <Input
                id="data_venda"
            type="date"
                value={formData.data_venda}
                onChange={(e) => setFormData({ ...formData, data_venda: e.target.value })}
            required
          />
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
              <Label htmlFor="obra_id">ID da Obra (opcional)</Label>
          <Input
                id="obra_id"
                type="number"
                value={formData.obra_id}
                onChange={(e) => setFormData({ ...formData, obra_id: e.target.value })}
              />
            </div>
          </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
              <Label htmlFor="desconto">Desconto (R$)</Label>
          <Input
                id="desconto"
            type="number"
            step="0.01"
            min="0"
                value={formData.desconto || ''}
                onChange={(e) => setFormData({ ...formData, desconto: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
          />
        </div>
        <div>
              <Label htmlFor="tipo_venda">Tipo de Venda</Label>
              <Select value={formData.tipo_venda} onValueChange={(value) => setFormData({ ...formData, tipo_venda: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equipamento">Equipamento</SelectItem>
              <SelectItem value="servico">Serviço</SelectItem>
                  <SelectItem value="locacao">Locação</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Seção de Itens */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Itens da Venda</h3>
            <p className="text-sm text-gray-500 mt-1">
              {formData.tipo_venda === 'equipamento' 
                ? 'Selecione produtos do estoque para esta venda'
                : 'Adicione os itens desta venda'
              }
            </p>
          </div>
          <Button type="button" onClick={adicionarItem} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
        
        <div className="space-y-4">
          {itens.map((item, index) => (
            <Card key={index} className="w-full">
              <CardContent className="p-6">
                <div className="grid grid-cols-12 gap-4 items-end">
                  {/* Produto/Descrição - ocupa mais espaço */}
                  {formData.tipo_venda === 'equipamento' ? (
                    <div className="col-span-5">
                      <Label className="text-sm font-medium mb-2 block">Produto *</Label>
                      <Select
                        value={item.produto_id || ''}
                        onValueChange={(value) => atualizarItem(index, 'produto_id', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingProdutos ? (
                            <div className="p-2 text-sm text-gray-500 text-center">
                              Carregando produtos...
                            </div>
                          ) : (
                            produtos.map((produto) => (
                              <SelectItem key={produto.id} value={produto.id}>
                                {produto.nome} - R$ {produto.valor_unitario}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="col-span-5">
                      <Label className="text-sm font-medium mb-2 block">Descrição *</Label>
                      <Input
                        value={item.descricao}
                        onChange={(e) => atualizarItem(index, 'descricao', e.target.value)}
                        placeholder="Descrição do item"
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {/* Quantidade */}
                  <div className="col-span-2">
                    <Label className="text-sm font-medium mb-2 block">Quantidade *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantidade}
                      onChange={(e) => atualizarItem(index, 'quantidade', parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Valor Unitário */}
                  <div className="col-span-2">
                    <Label className="text-sm font-medium mb-2 block">Valor Unitário *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.valor_unitario}
                      onChange={(e) => atualizarItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Valor Total */}
                  <div className="col-span-2">
                    <Label className="text-sm font-medium mb-2 block">Valor Total</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.quantidade * item.valor_unitario}
                      disabled
                      className="w-full bg-gray-50 font-semibold"
                    />
                  </div>
                  
                  {/* Botão Remover */}
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removerItem(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resumo dos Itens */}
        {itens.length > 0 && (
          <Card className="mt-6 bg-gray-50">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{itens.length}</span> item{itens.length !== 1 ? 's' : ''} adicionado{itens.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Subtotal:</div>
                    <div className="text-lg font-bold text-gray-900">
                      R$ {calcularTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                
                {(formData.desconto || 0) > 0 && (
                  <div className="flex justify-between items-center border-t pt-2">
                    <div className="text-sm text-gray-600">Desconto:</div>
                    <div className="text-sm font-medium text-red-600">
                      - R$ {(formData.desconto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center border-t pt-2">
                  <div className="text-sm font-medium text-gray-900">Total:</div>
                  <div className="text-xl font-bold text-gray-900">
                    R$ {(calcularTotal() - (formData.desconto || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
              Criar Venda
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
        // Fallback para dados mockados
        setClientes([
          { id: 1, nome: 'Cliente Exemplo 1', cnpj: '12.345.678/0001-90', email: 'cliente1@exemplo.com' },
          { id: 2, nome: 'Cliente Exemplo 2', cnpj: '98.765.432/0001-10', email: 'cliente2@exemplo.com' }
        ])
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
                    <span className="text-xs text-gray-500">
                      {cliente.cnpj} • {cliente.email}
                    </span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-gray-500 text-center">
                {clienteFilter.trim() ? 'Nenhum cliente encontrado' : 'Nenhum cliente disponível'}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
      
      {clienteFilter.trim() && (
        <div className="text-xs text-gray-500">
          {clientesFiltrados.length} cliente(s) encontrado(s)
        </div>
      )}
      
      {!clienteFilter.trim() && clientes.length > 0 && (
        <div className="text-xs text-gray-500">
          {clientes.length} cliente(s) disponível(is)
        </div>
      )}

      {clienteSelecionado && (
        <div className="p-2 bg-blue-50 rounded-lg text-sm">
          <div className="font-medium text-blue-900">{clienteSelecionado.nome}</div>
          <div className="text-blue-700">
            {clienteSelecionado.cnpj} • {clienteSelecionado.email}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente de Formulário de Orçamento
function OrcamentoForm({ 
  orcamento, 
  onSubmit, 
  onCancel 
}: { 
  orcamento?: Orcamento
  onSubmit: (data: CreateOrcamentoData) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState<CreateOrcamentoData>({
    cliente_id: orcamento?.cliente_id || 0,
    data_orcamento: orcamento?.data_orcamento || new Date().toISOString().split('T')[0],
    data_validade: orcamento?.data_validade || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    valor_total: orcamento?.valor_total || 0,
    desconto: orcamento?.desconto || 0,
    observacoes: orcamento?.observacoes || '',
    status: orcamento?.status || 'rascunho',
    vendedor_id: orcamento?.vendedor_id || undefined,
    condicoes_pagamento: orcamento?.condicoes_pagamento || '',
    prazo_entrega: orcamento?.prazo_entrega || '',
    tipo_orcamento: orcamento?.tipo_orcamento || 'servico',
    itens: orcamento?.itens || []
  })

  const [itens, setItens] = useState<any[]>(formData.itens || [])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loadingProdutos, setLoadingProdutos] = useState(false)

  // Carregar produtos quando tipo de orçamento mudar
  useEffect(() => {
    carregarProdutos()
  }, [formData.tipo_orcamento])

  const carregarProdutos = async () => {
    try {
      setLoadingProdutos(true)
      
      // Se tipo de orçamento for "equipamento", carregar apenas produtos do estoque
      if (formData.tipo_orcamento === 'equipamento') {
        const response = await estoqueAPI.listarProdutos({ limit: 100, status: 'Ativo' })
        setProdutos(response.data || [])
      } else {
        // Para outros tipos, não carregar produtos (será descrição livre)
        setProdutos([])
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setProdutos([])
    } finally {
      setLoadingProdutos(false)
    }
  }

  // Limpar itens quando tipo de orçamento mudar
  useEffect(() => {
    setItens([])
  }, [formData.tipo_orcamento])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Calcular valor total dos itens
    const valorTotalItens = itens.reduce((total, item) => total + item.valor_total, 0)
    
    onSubmit({
      ...formData,
      valor_total: valorTotalItens - (formData.desconto || 0),
      itens
    })
  }

  const addItem = () => {
    setItens([...itens, {
      produto_id: '',
      produto_servico: '',
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
      tipo: 'servico',
      unidade: '',
      observacoes: ''
    }])
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItens = [...itens]
    newItens[index] = { ...newItens[index], [field]: value }
    
    // Se mudou o produto, atualizar todos os campos do produto
    if (field === 'produto_id') {
      const produto = produtos.find(p => p.id === value)
      if (produto) {
        newItens[index].produto_servico = produto.nome
        newItens[index].valor_unitario = produto.valor_unitario
        newItens[index].descricao = produto.descricao || produto.nome
        newItens[index].tipo = produto.categorias?.nome || 'equipamento'
        newItens[index].unidade = produto.unidade_medida || 'un'
        // Recalcular valor total com o novo valor unitário
        newItens[index].valor_total = newItens[index].quantidade * produto.valor_unitario
      }
    }
    
    // Recalcular valor total se necessário
    if (field === 'quantidade' || field === 'valor_unitario') {
      newItens[index].valor_total = newItens[index].quantidade * newItens[index].valor_unitario
    }
    
    setItens(newItens)
  }

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dados Básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cliente_id">Cliente *</Label>
          <ClienteSelector
            value={formData.cliente_id.toString()}
            onValueChange={(value) => setFormData({ ...formData, cliente_id: parseInt(value) })}
            placeholder="Selecione o cliente"
            required={true}
          />
        </div>
        <div>
          <Label htmlFor="tipo_orcamento">Tipo de Orçamento *</Label>
          <Select 
            value={formData.tipo_orcamento} 
            onValueChange={(value) => setFormData({ ...formData, tipo_orcamento: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equipamento">Equipamento</SelectItem>
              <SelectItem value="servico">Serviço</SelectItem>
              <SelectItem value="locacao">Locação</SelectItem>
              <SelectItem value="venda">Venda</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="data_orcamento">Data do Orçamento *</Label>
          <Input
            id="data_orcamento"
            type="date"
            value={formData.data_orcamento}
            onChange={(e) => setFormData({ ...formData, data_orcamento: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="data_validade">Data de Validade *</Label>
          <Input
            id="data_validade"
            type="date"
            value={formData.data_validade}
            onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="desconto">Desconto (R$)</Label>
          <Input
            id="desconto"
            type="number"
            step="0.01"
            value={formData.desconto}
            onChange={(e) => setFormData({ ...formData, desconto: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData({ ...formData, status: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="rejeitado">Rejeitado</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Condições e Prazos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="condicoes_pagamento">Condições de Pagamento</Label>
          <Input
            id="condicoes_pagamento"
            value={formData.condicoes_pagamento}
            onChange={(e) => setFormData({ ...formData, condicoes_pagamento: e.target.value })}
            placeholder="Ex: 30 dias, à vista, etc."
          />
        </div>
        <div>
          <Label htmlFor="prazo_entrega">Prazo de Entrega</Label>
          <Input
            id="prazo_entrega"
            value={formData.prazo_entrega}
            onChange={(e) => setFormData({ ...formData, prazo_entrega: e.target.value })}
            placeholder="Ex: 15 dias úteis"
          />
        </div>
      </div>

      {/* Observações */}
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          rows={3}
          placeholder="Observações adicionais sobre o orçamento"
        />
      </div>

      {/* Itens do Orçamento */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <Label>Itens do Orçamento</Label>
          <Button type="button" onClick={addItem} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
        
        <div className="space-y-4">
          {itens.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  {/* Produto - apenas para tipo equipamento */}
                  {formData.tipo_orcamento === 'equipamento' ? (
                    <div>
                      <Label>Produto *</Label>
                      <Select
                        value={item.produto_id || ''}
                        onValueChange={(value) => updateItem(index, 'produto_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingProdutos ? (
                            <div className="p-2 text-sm text-gray-500 text-center">
                              Carregando produtos...
                            </div>
                          ) : (
                            produtos.map((produto) => (
                              <SelectItem key={produto.id} value={produto.id}>
                                {produto.nome} - R$ {produto.valor_unitario}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <Label>Produto/Serviço *</Label>
                      <Input
                        value={item.produto_servico}
                        onChange={(e) => updateItem(index, 'produto_servico', e.target.value)}
                        placeholder="Nome do produto/serviço"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={item.descricao}
                      onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                      placeholder="Descrição detalhada"
                    />
                  </div>
                  <div>
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.quantidade}
                      onChange={(e) => updateItem(index, 'quantidade', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Valor Unitário *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.valor_unitario}
                      onChange={(e) => updateItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Valor Total</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.valor_total}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select 
                      value={item.tipo} 
                      onValueChange={(value) => updateItem(index, 'tipo', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="produto">Produto</SelectItem>
                        <SelectItem value="servico">Serviço</SelectItem>
                        <SelectItem value="equipamento">Equipamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Input
                      value={item.unidade || ''}
                      onChange={(e) => updateItem(index, 'unidade', e.target.value)}
                      placeholder="Ex: un, kg, m²"
                    />
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Input
                      value={item.observacoes || ''}
                      onChange={(e) => updateItem(index, 'observacoes', e.target.value)}
                      placeholder="Observações do item"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Resumo */}
          <Card>
            <CardHeader>
          <CardTitle>Resumo do Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>R$ {itens.reduce((total, item) => total + item.valor_total, 0).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span>Desconto:</span>
              <span>- R$ {(formData.desconto || 0).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>R$ {(itens.reduce((total, item) => total + item.valor_total, 0) - (formData.desconto || 0)).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões */}
                          <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
                            </Button>
        <Button type="submit">
          {orcamento ? 'Atualizar' : 'Criar'} Orçamento
                            </Button>
                          </div>
    </form>
  )
}

// Componente para visualizar venda
function ViewVendaDialog({ venda, isOpen, onClose }: {
  venda: Venda | null
  isOpen: boolean
  onClose: () => void
}) {
  const [vendaItens, setVendaItens] = useState<VendaItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (venda && isOpen) {
      loadVendaItens()
    }
  }, [venda, isOpen])

  const loadVendaItens = async () => {
    if (!venda) return
    
    try {
      setLoading(true)
      const itens = await getVendaItens(venda.id)
      setVendaItens(itens)
    } catch (error) {
      console.error('❌ Erro ao carregar itens da venda:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!venda) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Visualizar Venda</DialogTitle>
          <DialogDescription>
            Detalhes da venda {venda.numero_venda}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações da Venda */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Venda</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Número da Venda</Label>
                <p className="text-sm text-gray-600">{venda.numero_venda}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Data da Venda</Label>
                <p className="text-sm text-gray-600">{new Date(venda.data_venda).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Cliente</Label>
                <p className="text-sm text-gray-600">{venda.clientes?.nome || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge className={getStatusColor(venda.status)}>
                  {venda.status}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Tipo de Venda</Label>
                <p className="text-sm text-gray-600">{venda.tipo_venda}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Valor Total</Label>
                <p className="text-sm text-gray-600 font-semibold">
                  R$ {venda.valor_total.toLocaleString('pt-BR')}
                </p>
              </div>
              {venda.orcamento_id && (
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Orçamento Original</Label>
                  <p className="text-sm text-gray-600">ID: {venda.orcamento_id}</p>
                </div>
              )}
              {venda.observacoes && (
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Observações</Label>
                  <p className="text-sm text-gray-600">{venda.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens da Venda */}
          <Card>
            <CardHeader>
              <CardTitle>Itens da Venda</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Carregando itens...</p>
                </div>
              ) : vendaItens.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Valor Unitário</TableHead>
                      <TableHead>Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {vendaItens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell>{item.quantidade}</TableCell>
                        <TableCell>R$ {Number(item.valor_unitario).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>R$ {Number(item.valor_total).toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
              </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Nenhum item encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
    </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Componente para editar venda
function EditVendaDialog({ venda, isOpen, onClose, onSuccess }: {
  venda: Venda | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    numero_venda: '',
    data_venda: '',
    valor_total: '',
    tipo_venda: 'equipamento',
    observacoes: ''
  })

  useEffect(() => {
    if (venda) {
      setFormData({
        numero_venda: venda.numero_venda,
        data_venda: venda.data_venda,
        valor_total: venda.valor_total.toString(),
        tipo_venda: venda.tipo_venda,
        observacoes: venda.observacoes || ''
      })
    }
  }, [venda])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!venda) return

    try {
      await updateVenda(venda.id, {
        numero_venda: formData.numero_venda,
        data_venda: formData.data_venda,
        valor_total: parseFloat(formData.valor_total),
        tipo_venda: formData.tipo_venda as 'equipamento' | 'servico' | 'locacao',
        observacoes: formData.observacoes || undefined
      })
      onSuccess()
    onClose()
    } catch (error) {
      console.error('Erro ao atualizar venda:', error)
    }
  }

  if (!venda) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Venda</DialogTitle>
          <DialogDescription>
            Edite as informações da venda {venda.numero_venda}
          </DialogDescription>
        </DialogHeader>
        
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
              <Label htmlFor="numero_venda">Número da Venda</Label>
              <Input
                id="numero_venda"
                value={formData.numero_venda}
                onChange={(e) => setFormData({ ...formData, numero_venda: e.target.value })}
                required
              />
        </div>
        <div>
              <Label htmlFor="data_venda">Data da Venda</Label>
          <Input
                id="data_venda"
            type="date"
                value={formData.data_venda}
                onChange={(e) => setFormData({ ...formData, data_venda: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
              <Label htmlFor="valor_total">Valor Total (R$)</Label>
          <Input
                id="valor_total"
            type="number"
            step="0.01"
                value={formData.valor_total}
                onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
            required
          />
        </div>
        <div>
              <Label htmlFor="tipo_venda">Tipo de Venda</Label>
              <Select 
                value={formData.tipo_venda} 
                onValueChange={(value) => setFormData({ ...formData, tipo_venda: value })}
              >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equipamento">Equipamento</SelectItem>
              <SelectItem value="servico">Serviço</SelectItem>
                  <SelectItem value="locacao">Locação</SelectItem>
            </SelectContent>
          </Select>
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

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
              Atualizar Venda
        </Button>
      </div>
    </form>
      </DialogContent>
    </Dialog>
  )
}