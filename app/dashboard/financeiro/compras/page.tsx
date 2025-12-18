"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getCompras, createCompra, updateCompra, deleteCompra, addCompraItem, receberCompra, getCompraItens, uploadCompraArquivo, type Compra, type CompraItem } from "@/lib/api-financial"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  ShoppingCart,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  Download,
  FileText,
  TrendingDown,
  Package,
  AlertTriangle,
  Upload,
  X
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { estoqueAPI, type Produto } from "@/lib/api-estoque"
import { fornecedoresApi, type Fornecedor } from "@/lib/api-fornecedores"

// Função utilitária para cores de status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'aprovado': return 'bg-green-500'
    case 'pendente': return 'bg-yellow-500'
    case 'enviado': return 'bg-blue-500'
    case 'recebido': return 'bg-purple-500'
    case 'cancelado': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

export default function ComprasPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [compras, setCompras] = useState<Compra[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterFornecedor, setFilterFornecedor] = useState<string>("all")
  const [filterPeriodo, setFilterPeriodo] = useState<string>("all")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null)
  const [isViewCompraDialogOpen, setIsViewCompraDialogOpen] = useState(false)
  const [isEditCompraDialogOpen, setIsEditCompraDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadingCompra, setUploadingCompra] = useState<Compra | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Carregar compras e fornecedores
  const loadCompras = async () => {
    try {
      setIsLoading(true)
      const [comprasData, fornecedoresData] = await Promise.all([
        getCompras(),
        fornecedoresApi.list({ limit: 1000 })
      ])
      setCompras(comprasData)
      setFornecedores(fornecedoresData.fornecedores)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar compras",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCompras()
  }, [])

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    const total = compras.length
    const valorTotal = compras.reduce((sum, c) => sum + c.valor_total, 0)
    const pendentes = compras.filter(c => c.status === 'pendente').length
    const valorPendente = compras.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valor_total, 0)
    const aprovadas = compras.filter(c => c.status === 'aprovado').length
    const recebidas = compras.filter(c => c.status === 'recebido').length
    const valorRecebido = compras.filter(c => c.status === 'recebido').reduce((sum, c) => sum + c.valor_total, 0)

    return {
      total,
      valorTotal,
      pendentes,
      valorPendente,
      aprovadas,
      recebidas,
      valorRecebido
    }
  }, [compras])

  // Filtrar compras
  const filteredCompras = useMemo(() => {
    let filtered = compras

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(compra =>
        compra.numero_pedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        compra.fornecedores?.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro de status
    if (filterStatus !== "all") {
      filtered = filtered.filter(compra => compra.status === filterStatus)
    }

    // Filtro de fornecedor
    if (filterFornecedor !== "all") {
      filtered = filtered.filter(compra => compra.fornecedor_id.toString() === filterFornecedor)
    }

    // Filtro de período
    if (filterPeriodo === "custom" && dataInicio && dataFim) {
      filtered = filtered.filter(compra => {
        const dataPedido = new Date(compra.data_pedido)
        const inicio = new Date(dataInicio)
        const fim = new Date(dataFim)
        return dataPedido >= inicio && dataPedido <= fim
      })
    } else if (filterPeriodo !== "all" && filterPeriodo !== "custom") {
      const hoje = new Date()
      const inicio = new Date()
      
      switch (filterPeriodo) {
        case "hoje":
          inicio.setHours(0, 0, 0, 0)
          break
        case "semana":
          inicio.setDate(hoje.getDate() - 7)
          break
        case "mes":
          inicio.setMonth(hoje.getMonth() - 1)
          break
        case "trimestre":
          inicio.setMonth(hoje.getMonth() - 3)
          break
        case "ano":
          inicio.setFullYear(hoje.getFullYear() - 1)
          break
      }

      filtered = filtered.filter(compra => {
        const dataPedido = new Date(compra.data_pedido)
        return dataPedido >= inicio && dataPedido <= hoje
      })
    }

    return filtered
  }, [compras, searchTerm, filterStatus, filterFornecedor, filterPeriodo, dataInicio, dataFim])

  // Paginação
  const totalPages = Math.ceil(filteredCompras.length / itemsPerPage)
  const paginatedCompras = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredCompras.slice(start, start + itemsPerPage)
  }, [filteredCompras, currentPage])


  const handleViewCompra = (compra: Compra) => {
    setSelectedCompra(compra)
    setIsViewCompraDialogOpen(true)
  }

  const handleEditCompra = (compra: Compra) => {
    setSelectedCompra(compra)
    setIsEditCompraDialogOpen(true)
  }

  const handleReceberCompra = async (compra: Compra) => {
    try {
      await receberCompra(compra.id)
      toast({
        title: "Compra recebida",
        description: "A compra foi marcada como recebida e as movimentações de estoque foram criadas.",
      })
      loadCompras()
    } catch (error) {
      console.error('Erro ao receber compra:', error)
      toast({
        title: "Erro",
        description: "Erro ao receber compra. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  const handleUpload = (compra: Compra) => {
    setUploadingCompra(compra)
    setUploadFile(null)
    setIsUploadDialogOpen(true)
  }

  const handleFileUpload = async () => {
    if (!uploadingCompra || !uploadFile) return

    try {
      setUploading(true)
      await uploadCompraArquivo(uploadingCompra.id, uploadFile)
      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso!",
      })
      setIsUploadDialogOpen(false)
      setUploadingCompra(null)
      setUploadFile(null)
      loadCompras()
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload do arquivo",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleExport = () => {
    // Criar CSV
    const headers = ['ID', 'Número Pedido', 'Fornecedor', 'Data Pedido', 'Data Entrega', 'Valor Total', 'Status']
    const rows = filteredCompras.map(c => [
      c.id,
      c.numero_pedido,
      c.fornecedores?.nome || 'N/A',
      new Date(c.data_pedido).toLocaleDateString('pt-BR'),
      c.data_entrega ? new Date(c.data_entrega).toLocaleDateString('pt-BR') : 'N/A',
      c.valor_total.toFixed(2),
      c.status
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `compras_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    toast({
      title: "Exportação realizada",
      description: "Arquivo CSV gerado com sucesso!",
    })
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
          <p className="text-gray-600">Gestão de compras e fornecedores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Compra
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Compras</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.total}</div>
            <p className="text-xs text-muted-foreground">
              R$ {estatisticas.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</div>
            <p className="text-xs text-muted-foreground">
              R$ {estatisticas.valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estatisticas.aprovadas}</div>
            <p className="text-xs text-muted-foreground">Aguardando envio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebidas</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{estatisticas.recebidas}</div>
            <p className="text-xs text-muted-foreground">
              R$ {estatisticas.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Número do pedido ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Select value={filterFornecedor} onValueChange={setFilterFornecedor}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os fornecedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {fornecedores.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="periodo">Período</Label>
              <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Últimos 7 dias</SelectItem>
                  <SelectItem value="mes">Último mês</SelectItem>
                  <SelectItem value="trimestre">Último trimestre</SelectItem>
                  <SelectItem value="ano">Último ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {filterPeriodo === "custom" && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="data_inicio">Data Início</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="data_fim">Data Fim</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm" onClick={() => {
              setSearchTerm("")
              setFilterStatus("all")
              setFilterFornecedor("all")
              setFilterPeriodo("all")
              setDataInicio("")
              setDataFim("")
            }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Compras */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Compras ({filteredCompras.length})</CardTitle>
              <CardDescription>Lista de todas as compras registradas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400 mb-4" />
              <p className="text-gray-500">Carregando compras...</p>
            </div>
          ) : filteredCompras.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhuma compra encontrada</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Número do Pedido</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Data do Pedido</TableHead>
                      <TableHead>Data de Entrega</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCompras.map((compra) => (
                  <TableRow key={compra.id}>
                    <TableCell className="font-medium">{compra.id}</TableCell>
                    <TableCell className="font-medium">{compra.numero_pedido}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        {compra.fornecedores?.nome || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(compra.data_pedido).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {compra.data_entrega ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(compra.data_entrega).toLocaleDateString('pt-BR')}
                        </div>
                      ) : (
                        <span className="text-gray-400">Não definida</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-red-600" />
                        R$ {compra.valor_total.toLocaleString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(compra.status)}>
                        {compra.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewCompra(compra)}
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditCompra(compra)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {compra.status !== 'recebido' && compra.status !== 'cancelado' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleReceberCompra(compra)}
                            className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                            title="Marcar como recebido"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpload(compra)}
                          className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                          title="Anexar arquivo"
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a compra {compra.numero_pedido}? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  try {
                                    await deleteCompra(compra.id)
                                    toast({
                                      title: "Sucesso",
                                      description: "Compra excluída com sucesso!",
                                    })
                                    loadCompras()
                                  } catch (error) {
                                    toast({
                                      title: "Erro",
                                      description: "Erro ao excluir compra",
                                      variant: "destructive"
                                    })
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
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
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredCompras.length)} de {filteredCompras.length} compras
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criação */}
      <CreateCompraDialog 
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          loadCompras()
        }}
      />

      {/* Dialog de Visualização */}
      <ViewCompraDialog
        compra={selectedCompra}
        isOpen={isViewCompraDialogOpen}
        onClose={() => {
          setIsViewCompraDialogOpen(false)
          setSelectedCompra(null)
        }}
      />

      {/* Dialog de Edição */}
      <EditCompraDialog
        compra={selectedCompra}
        isOpen={isEditCompraDialogOpen}
        onClose={() => {
          setIsEditCompraDialogOpen(false)
          setSelectedCompra(null)
        }}
        onSuccess={() => {
          loadCompras()
          toast({
            title: "Sucesso",
            description: "Compra atualizada com sucesso!",
          })
        }}
      />

      {/* Dialog de Upload */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload de Arquivo</DialogTitle>
            <DialogDescription>
              Anexe um arquivo à compra (boleto, nota fiscal, etc.)
            </DialogDescription>
          </DialogHeader>
          
          {uploadingCompra && (
            <div className="space-y-4">
              <div>
                <Label>Compra</Label>
                <p className="text-sm text-gray-600">
                  {uploadingCompra.numero_pedido} - {uploadingCompra.fornecedores?.nome}
                </p>
              </div>
              
              <div>
                <Label htmlFor="upload-file">Selecione o arquivo</Label>
                <Input
                  id="upload-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // Validar tamanho (10MB)
                      if (file.size > 10 * 1024 * 1024) {
                        toast({
                          title: "Erro",
                          description: "Arquivo muito grande. Tamanho máximo: 10MB",
                          variant: "destructive"
                        })
                        e.target.value = ''
                        return
                      }
                      // Validar tipo
                      const validTypes = [
                        'application/pdf',
                        'image/jpeg',
                        'image/jpg',
                        'image/png',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                      ]
                      const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx']
                      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
                      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
                        toast({
                          title: "Erro",
                          description: "Tipo de arquivo inválido. Use PDF, imagem, Word ou Excel",
                          variant: "destructive"
                        })
                        e.target.value = ''
                        return
                      }
                      setUploadFile(file)
                    } else {
                      setUploadFile(null)
                    }
                  }}
                />
                {uploadFile && (
                  <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false)
                setUploadingCompra(null)
                setUploadFile(null)
              }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFileUpload}
              disabled={!uploadFile || uploading}
            >
              {uploading ? 'Enviando...' : 'Enviar Arquivo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Interface para itens de compra
interface CreateCompraItemData {
  produto_id: string
  descricao: string
  quantidade: number
  valor_unitario: number
  valor_total: number
}

function CreateCompraDialog({ isOpen, onClose, onSuccess }: { 
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    fornecedor_id: '',
    numero_pedido: '',
    data_pedido: new Date().toISOString().split('T')[0],
    data_entrega: '',
    observacoes: ''
  })
  
  const [itens, setItens] = useState<CreateCompraItemData[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loadingProdutos, setLoadingProdutos] = useState(false)
  const [compraCriada, setCompraCriada] = useState<number | null>(null)
  const [formFile, setFormFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Carregar produtos quando o dialog abrir
  useEffect(() => {
    if (isOpen) {
      carregarProdutos()
    }
  }, [isOpen])

  const carregarProdutos = async () => {
    try {
      setLoadingProdutos(true)
      const response = await estoqueAPI.listarProdutos({ limit: 100, status: 'Ativo' })
      setProdutos(response.data || [])
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
      valor_unitario: 0,
      valor_total: 0
    }])
  }

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const atualizarItem = (index: number, campo: keyof CreateCompraItemData, valor: any) => {
    const novosItens = [...itens]
    novosItens[index] = { ...novosItens[index], [campo]: valor }
    
    // Se mudou o produto, atualizar todos os campos do produto
    if (campo === 'produto_id') {
      const produto = produtos.find(p => p.id === valor)
      if (produto) {
        novosItens[index].descricao = produto.descricao || produto.nome
        novosItens[index].valor_unitario = produto.valor_unitario
        novosItens[index].valor_total = novosItens[index].quantidade * produto.valor_unitario
      }
    }
    
    // Recalcular valor total se quantidade ou valor unitário mudaram
    if (campo === 'quantidade' || campo === 'valor_unitario') {
      novosItens[index].valor_total = novosItens[index].quantidade * novosItens[index].valor_unitario
    }
    
    setItens(novosItens)
  }

  // Limpar itens quando dialog fechar
  useEffect(() => {
    if (!isOpen) {
      setItens([])
      setCompraCriada(null)
      setFormFile(null)
    }
  }, [isOpen])

  const calcularTotal = () => {
    return itens.reduce((total, item) => total + (item.quantidade * item.valor_unitario), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Calcular valor total dos itens
      const valorTotalItens = itens.reduce((total, item) => total + (item.quantidade * item.valor_unitario), 0)
      
      // Criar compra primeiro
      const compra = await createCompra({
        fornecedor_id: parseInt(formData.fornecedor_id),
        numero_pedido: formData.numero_pedido,
        data_pedido: formData.data_pedido,
        data_entrega: formData.data_entrega || undefined,
        valor_total: valorTotalItens,
        status: 'pendente' as 'pendente' | 'aprovado' | 'enviado' | 'recebido' | 'cancelado',
        observacoes: formData.observacoes || undefined
      })
      
      setCompraCriada(compra.id)
      
      // Adicionar itens se houver
      if (itens.length > 0) {
        for (const item of itens) {
          await addCompraItem(compra.id, item)
        }
        
        // Criar movimentações de estoque automaticamente após adicionar itens
        try {
          await receberCompra(compra.id)
          toast({
            title: "Sucesso",
            description: "Compra criada e estoque atualizado automaticamente!",
          })
        } catch (error) {
          console.error('Erro ao criar movimentações de estoque:', error)
          toast({
            title: "Aviso",
            description: "Compra criada, mas houve um erro ao atualizar o estoque. Você pode marcar como recebida manualmente.",
            variant: "warning"
          })
        }
      }
      
      // Se houver arquivo, fazer upload após criar
      if (formFile) {
        try {
          setUploading(true)
          await uploadCompraArquivo(compra.id, formFile)
          toast({
            title: "Sucesso",
            description: "Compra criada e arquivo anexado com sucesso!",
          })
        } catch (uploadError: any) {
          console.error('Erro ao fazer upload:', uploadError)
          toast({
            title: "Aviso",
            description: "Compra criada, mas houve erro ao enviar o arquivo: " + (uploadError.message || "Erro desconhecido"),
            variant: "destructive"
          })
        } finally {
          setUploading(false)
        }
      } else {
        toast({
          title: "Sucesso",
          description: "Compra criada com sucesso!"
        })
      }
      
      onSuccess()
    } catch (error) {
      console.error('Erro ao criar compra:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar compra. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Compra</DialogTitle>
          <DialogDescription>
            Registre uma nova compra no sistema
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero_pedido">Número do Pedido</Label>
              <Input
                id="numero_pedido"
                value={formData.numero_pedido}
                onChange={(e) => setFormData({ ...formData, numero_pedido: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="fornecedor_id">Fornecedor *</Label>
              <FornecedorSelector
                value={formData.fornecedor_id}
                onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value })}
                placeholder="Selecione o fornecedor"
                required={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_pedido">Data do Pedido</Label>
              <Input
                id="data_pedido"
                type="date"
                value={formData.data_pedido}
                onChange={(e) => setFormData({ ...formData, data_pedido: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="data_entrega">Data de Entrega (opcional)</Label>
              <Input
                id="data_entrega"
                type="date"
                value={formData.data_entrega}
                onChange={(e) => setFormData({ ...formData, data_entrega: e.target.value })}
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

          {/* Upload de Arquivo */}
          <div>
            <Label htmlFor="arquivo_compra">Anexar Arquivo (Boleto, Nota Fiscal, etc.)</Label>
            <Input
              id="arquivo_compra"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // Validar tamanho (10MB)
                  if (file.size > 10 * 1024 * 1024) {
                    toast({
                      title: "Erro",
                      description: "Arquivo muito grande. Tamanho máximo: 10MB",
                      variant: "destructive"
                    })
                    e.target.value = ''
                    return
                  }
                  // Validar tipo
                  const validTypes = [
                    'application/pdf',
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  ]
                  const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx']
                  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
                  if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
                    toast({
                      title: "Erro",
                      description: "Tipo de arquivo inválido. Use PDF, imagem, Word ou Excel",
                      variant: "destructive"
                    })
                    e.target.value = ''
                    return
                  }
                  setFormFile(file)
                } else {
                  setFormFile(null)
                }
              }}
            />
            {formFile && (
              <div className="mt-2 p-2 bg-blue-50 rounded-md flex items-center justify-between">
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {formFile.name} ({(formFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFormFile(null)
                    const input = document.getElementById('arquivo_compra') as HTMLInputElement
                    if (input) input.value = ''
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Seção de Itens */}
          <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Itens da Compra</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Selecione produtos do estoque para esta compra
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
                      {/* Produto - ocupa mais espaço */}
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
                        <div className="text-sm text-gray-600">Total:</div>
                        <div className="text-lg font-bold text-gray-900">
                          R$ {calcularTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Salvando...' : 'Criar Compra'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Componente para Seleção de Fornecedores com Filtro
function FornecedorSelector({ 
  value, 
  onValueChange, 
  placeholder = "Selecione o fornecedor",
  required = false 
}: { 
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  required?: boolean
}) {
  const { toast } = useToast()
  const [fornecedores, setFornecedores] = useState<any[]>([])
  const [fornecedoresFiltrados, setFornecedoresFiltrados] = useState<any[]>([])
  const [fornecedorFilter, setFornecedorFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Função para carregar fornecedores
  const carregarFornecedores = async () => {
    try {
      setLoading(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')

      const response = await fetch(`${API_URL}/api/fornecedores`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFornecedores(data.data || data || [])
      } else {
        throw new Error('Erro ao carregar fornecedores')
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar fornecedores. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar fornecedores iniciais
  useEffect(() => {
    carregarFornecedores()
  }, [])

  // Buscar fornecedores dinamicamente
  const buscarFornecedores = async (termo: string) => {
    if (!termo || termo.length < 2) {
      setFornecedoresFiltrados([])
      return
    }

    try {
      setLoading(true)
      // Simular busca - você pode implementar uma API real aqui
      const resultados = fornecedores.filter(f => 
        f.nome.toLowerCase().includes(termo.toLowerCase()) ||
        f.cnpj.includes(termo) ||
        f.email.toLowerCase().includes(termo.toLowerCase())
      )
      setFornecedoresFiltrados(resultados)
    } catch (error) {
      console.error('Erro na busca de fornecedores:', error)
      setFornecedoresFiltrados([])
    } finally {
      setLoading(false)
    }
  }

  // Debounce para evitar muitas requisições
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscarFornecedores(fornecedorFilter)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [fornecedorFilter])

  // Filtrar fornecedores baseado no termo de busca
  const fornecedoresDisponiveis = fornecedorFilter.trim() 
    ? fornecedoresFiltrados 
    : fornecedores

  const fornecedorSelecionado = fornecedores.find(f => f.id.toString() === value)

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Input
          placeholder="Buscar fornecedor por nome, CNPJ ou email..."
          value={fornecedorFilter}
          onChange={(e) => setFornecedorFilter(e.target.value)}
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
                Carregando fornecedores...
              </div>
            ) : fornecedoresDisponiveis.length > 0 ? (
              fornecedoresDisponiveis.map(fornecedor => (
                <SelectItem key={fornecedor.id} value={fornecedor.id.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{fornecedor.nome}</span>
                    <span className="text-xs text-gray-500">
                      {fornecedor.cnpj} • {fornecedor.email}
                    </span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-gray-500 text-center">
                {fornecedorFilter.trim() ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor disponível'}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
      
      {fornecedorFilter.trim() && (
        <div className="text-xs text-gray-500">
          {fornecedoresFiltrados.length} fornecedor(es) encontrado(s)
        </div>
      )}
      
      {!fornecedorFilter.trim() && fornecedores.length > 0 && (
        <div className="text-xs text-gray-500">
          {fornecedores.length} fornecedor(es) disponível(is)
        </div>
      )}

      {fornecedorSelecionado && (
        <div className="p-2 bg-blue-50 rounded-lg text-sm">
          <div className="font-medium text-blue-900">{fornecedorSelecionado.nome}</div>
          <div className="text-blue-700">
            {fornecedorSelecionado.cnpj} • {fornecedorSelecionado.email}
          </div>
        </div>
      )}

      {/* Botão Novo Fornecedor */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsCreateDialogOpen(true)}
        className="w-full mt-2"
      >
        <Plus className="w-4 h-4 mr-2" />
        Novo Fornecedor
      </Button>

      {/* Dialog de Criação de Fornecedor */}
      <CreateFornecedorDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={async (novoFornecedor) => {
          // Recarregar lista de fornecedores
          await carregarFornecedores()
          // Selecionar o novo fornecedor automaticamente
          onValueChange(novoFornecedor.id.toString())
          setIsCreateDialogOpen(false)
        }}
      />
    </div>
  )
}

// Componente para criar novo fornecedor
function CreateFornecedorDialog({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: (fornecedor: Fornecedor) => void
}) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    contato: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    categoria: '',
    observacoes: '',
    status: 'ativo' as 'ativo' | 'inativo'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Função para formatar CNPJ
  const formatarCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  // Função para formatar CEP
  const formatarCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      return numbers.replace(/^(\d{5})(\d)/, '$1-$2')
    }
    return value
  }

  // Função para formatar telefone
  const formatarTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        return numbers.replace(/^(\d{2})(\d{4})(\d)/, '($1) $2-$3')
      } else {
        return numbers.replace(/^(\d{2})(\d{5})(\d)/, '($1) $2-$3')
      }
    }
    return value
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validar campos obrigatórios
      if (!formData.nome || !formData.cnpj) {
        toast({
          title: "Erro",
          description: "Nome e CNPJ são obrigatórios",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      // Criar fornecedor
      const novoFornecedor = await fornecedoresApi.create({
        nome: formData.nome,
        cnpj: formData.cnpj,
        contato: formData.contato || undefined,
        telefone: formData.telefone || undefined,
        email: formData.email || undefined,
        endereco: formData.endereco || undefined,
        cidade: formData.cidade || undefined,
        estado: formData.estado || undefined,
        cep: formData.cep || undefined,
        categoria: formData.categoria || undefined,
        observacoes: formData.observacoes || undefined,
        status: formData.status
      })

      toast({
        title: "Sucesso",
        description: "Fornecedor cadastrado com sucesso!",
      })

      // Limpar formulário
      setFormData({
        nome: '',
        cnpj: '',
        contato: '',
        telefone: '',
        email: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        categoria: '',
        observacoes: '',
        status: 'ativo'
      })

      onSuccess(novoFornecedor)
    } catch (error: any) {
      console.error('Erro ao criar fornecedor:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || error.message || "Erro ao criar fornecedor. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Fornecedor</DialogTitle>
          <DialogDescription>
            Cadastre um novo fornecedor no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome/Razão Social *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                placeholder="Nome completo ou razão social"
              />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: formatarCNPJ(e.target.value) })}
                required
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contato">Nome do Contato</Label>
              <Input
                id="contato"
                value={formData.contato}
                onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                placeholder="Nome da pessoa de contato"
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: formatarTelefone(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              placeholder="Rua, número, complemento"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Cidade"
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                placeholder="UF"
                maxLength={2}
              />
            </div>
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: formatarCEP(e.target.value) })}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Ex: Material de construção, Equipamentos, etc."
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'ativo' | 'inativo') => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
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
              placeholder="Informações adicionais sobre o fornecedor"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Cadastrar Fornecedor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Componente para visualizar compra
function ViewCompraDialog({ compra, isOpen, onClose }: {
  compra: Compra | null
  isOpen: boolean
  onClose: () => void
}) {
  const [compraItens, setCompraItens] = useState<CompraItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (compra && isOpen) {
      loadCompraItens()
    }
  }, [compra, isOpen])

  const loadCompraItens = async () => {
    if (!compra) return
    
    try {
      setLoading(true)
      const itens = await getCompraItens(compra.id)
      setCompraItens(itens)
    } catch (error) {
      console.error('❌ Erro ao carregar itens da compra:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!compra) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Visualizar Compra</DialogTitle>
          <DialogDescription>
            Detalhes da compra {compra.numero_pedido}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações da Compra */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Compra</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Número do Pedido</Label>
                <p className="text-sm text-gray-600">{compra.numero_pedido}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Data do Pedido</Label>
                <p className="text-sm text-gray-600">{new Date(compra.data_pedido).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Fornecedor</Label>
                <p className="text-sm text-gray-600">{compra.fornecedores?.nome || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge className={getStatusColor(compra.status)}>
                  {compra.status}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Valor Total</Label>
                <p className="text-sm text-gray-600 font-semibold">
                  R$ {compra.valor_total.toLocaleString('pt-BR')}
                </p>
              </div>
              {compra.data_entrega && (
                <div>
                  <Label className="text-sm font-medium">Data de Entrega</Label>
                  <p className="text-sm text-gray-600">{new Date(compra.data_entrega).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              {compra.observacoes && (
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Observações</Label>
                  <p className="text-sm text-gray-600">{compra.observacoes}</p>
                </div>
              )}
              {compra.arquivo_compra && (
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Arquivo Anexado</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <a
                      href={compra.arquivo_compra}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {compra.nome_arquivo || 'Ver arquivo'}
                    </a>
                    {compra.tamanho_arquivo && (
                      <span className="text-xs text-gray-500">
                        ({(compra.tamanho_arquivo / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(compra.arquivo_compra, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens da Compra */}
          <Card>
            <CardHeader>
              <CardTitle>Itens da Compra</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Carregando itens...</p>
                </div>
              ) : compraItens.length > 0 ? (
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
                    {compraItens.map((item) => (
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

// Componente para editar compra
function EditCompraDialog({ compra, isOpen, onClose, onSuccess }: {
  compra: Compra | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    numero_pedido: '',
    data_pedido: '',
    data_entrega: '',
    observacoes: ''
  })
  const [status, setStatus] = useState(compra?.status || 'pendente')

  useEffect(() => {
    if (compra) {
      setFormData({
        numero_pedido: compra.numero_pedido,
        data_pedido: compra.data_pedido.split('T')[0],
        data_entrega: compra.data_entrega ? compra.data_entrega.split('T')[0] : '',
        observacoes: compra.observacoes || ''
      })
      setStatus(compra.status)
    }
  }, [compra])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!compra) return

    try {
      await updateCompra(compra.id, {
        ...formData,
        status: status as any,
        data_entrega: formData.data_entrega || undefined
      })
      toast({
        title: "Sucesso",
        description: "Compra atualizada com sucesso!",
      })
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar compra:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar compra. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  if (!compra) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Compra</DialogTitle>
          <DialogDescription>
            Edite as informações da compra {compra.numero_pedido}
          </DialogDescription>
        </DialogHeader>
        
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="numero_pedido">Número do Pedido</Label>
          <Input
            id="numero_pedido"
            value={formData.numero_pedido}
            onChange={(e) => setFormData({ ...formData, numero_pedido: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="recebido">Recebido</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="data_pedido">Data do Pedido</Label>
          <Input
            id="data_pedido"
            type="date"
            value={formData.data_pedido}
            onChange={(e) => setFormData({ ...formData, data_pedido: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="data_entrega">Data de Entrega (opcional)</Label>
          <Input
            id="data_entrega"
            type="date"
            value={formData.data_entrega}
            onChange={(e) => setFormData({ ...formData, data_entrega: e.target.value })}
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

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
              Atualizar Compra
        </Button>
      </div>
    </form>
      </DialogContent>
    </Dialog>
  )
}