"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  FileText,
  Building2,
  Truck,
  Receipt,
  Download,
  Upload,
  Filter,
  RefreshCw,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react"
import { notasFiscaisApi, NotaFiscal, NotaFiscalCreate } from "@/lib/api-notas-fiscais"
import { clientesApi } from "@/lib/api-clientes"
import { fornecedoresApi } from "@/lib/api-fornecedores"
import { medicoesMensaisApi } from "@/lib/api-medicoes-mensais"
import { locacoesApi } from "@/lib/api-locacoes"
import { apiCompras } from "@/lib/api-compras"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Cliente {
  id: number
  nome: string
  cnpj?: string
}

interface Fornecedor {
  id: number
  nome: string
  cnpj?: string
}

interface Medicao {
  id: number
  numero: string
  periodo: string
}

interface Locacao {
  id: number
  numero: string
}

interface Compra {
  id: number
  numero_pedido: string
}

export default function NotasFiscaisPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'saida' | 'entrada'>('saida')
  
  // Estados
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [editingNota, setEditingNota] = useState<NotaFiscal | null>(null)
  const [viewingNota, setViewingNota] = useState<NotaFiscal | null>(null)
  const [uploadingNota, setUploadingNota] = useState<NotaFiscal | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formFile, setFormFile] = useState<File | null>(null)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tipoNotaFilter, setTipoNotaFilter] = useState("all")
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20
  
  // Dados para formulários
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [medicoes, setMedicoes] = useState<Medicao[]>([])
  const [locacoes, setLocacoes] = useState<Locacao[]>([])
  const [compras, setCompras] = useState<Compra[]>([])
  
  // Formulário
  const [formData, setFormData] = useState<NotaFiscalCreate>({
    numero_nf: '',
    serie: '',
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: '',
    valor_total: 0,
    tipo: 'saida',
    status: 'pendente',
    tipo_nota: 'locacao',
    observacoes: ''
  })

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    carregarNotasFiscais()
  }, [activeTab, currentPage, statusFilter, searchTerm])

  const carregarDados = async () => {
    try {
      // Carregar clientes
      const clientesResponse = await clientesApi.listarClientes({ limit: 1000 })
      if (clientesResponse.success) {
        setClientes(clientesResponse.data || [])
      }
      
      // Carregar fornecedores
      const fornecedoresResponse = await fornecedoresApi.list({ limit: 1000 })
      const fornecedoresData = fornecedoresResponse.fornecedores || []
      setFornecedores(fornecedoresData.map((f: any) => ({
        id: typeof f.id === 'string' ? parseInt(f.id) : f.id,
        nome: f.nome,
        cnpj: f.cnpj
      })))
      
      // Carregar medições
      const medicoesResponse = await medicoesMensaisApi.listar({ limit: 1000 })
      if (medicoesResponse.success) {
        setMedicoes(medicoesResponse.data || [])
      }
      
      // Carregar locações
      const locacoesResponse = await locacoesApi.list({ limit: 1000 })
      if (locacoesResponse.success) {
        setLocacoes(locacoesResponse.data || [])
      } else if (locacoesResponse.data) {
        setLocacoes(locacoesResponse.data || [])
      }
      
      // Carregar compras
      const comprasResponse = await apiCompras.listar({ limit: 1000 })
      if (comprasResponse.success) {
        setCompras(comprasResponse.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const carregarNotasFiscais = useCallback(async () => {
    try {
      setLoading(true)
      const response = await notasFiscaisApi.list({
        tipo: activeTab,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage
      })
      
      if (response.success) {
        setNotasFiscais(response.data || [])
        // TODO: Adicionar paginação quando a API retornar
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar notas fiscais",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [activeTab, currentPage, statusFilter, searchTerm, toast])

  const handleCreate = async () => {
    try {
      const response = await notasFiscaisApi.create({
        ...formData,
        tipo: activeTab
      })
      
      if (response.success) {
        // Se houver arquivo, fazer upload após criar
        if (formFile && response.data?.id) {
          try {
            await notasFiscaisApi.uploadFile(response.data.id, formFile)
            toast({
              title: "Sucesso",
              description: "Nota fiscal criada e arquivo enviado com sucesso"
            })
          } catch (uploadError: any) {
            toast({
              title: "Aviso",
              description: "Nota fiscal criada, mas houve erro ao enviar o arquivo: " + (uploadError.message || "Erro desconhecido"),
              variant: "destructive"
            })
          }
        } else {
          toast({
            title: "Sucesso",
            description: "Nota fiscal criada com sucesso"
          })
        }
        setIsCreateDialogOpen(false)
        resetForm()
        await carregarNotasFiscais()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar nota fiscal",
        variant: "destructive"
      })
    }
  }

  const handleUpdate = async () => {
    if (!editingNota) return
    
    try {
      const response = await notasFiscaisApi.update(editingNota.id, formData)
      
      if (response.success) {
        // Se houver arquivo, fazer upload após atualizar
        if (formFile) {
          try {
            await notasFiscaisApi.uploadFile(editingNota.id, formFile)
            toast({
              title: "Sucesso",
              description: "Nota fiscal atualizada e arquivo enviado com sucesso"
            })
          } catch (uploadError: any) {
            toast({
              title: "Aviso",
              description: "Nota fiscal atualizada, mas houve erro ao enviar o arquivo: " + (uploadError.message || "Erro desconhecido"),
              variant: "destructive"
            })
          }
        } else {
          toast({
            title: "Sucesso",
            description: "Nota fiscal atualizada com sucesso"
          })
        }
        setIsEditDialogOpen(false)
        setEditingNota(null)
        resetForm()
        await carregarNotasFiscais()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar nota fiscal",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await notasFiscaisApi.delete(id)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Nota fiscal excluída com sucesso"
        })
        await carregarNotasFiscais()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir nota fiscal",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (nota: NotaFiscal) => {
    setEditingNota(nota)
    setFormData({
      numero_nf: nota.numero_nf,
      serie: nota.serie || '',
      data_emissao: nota.data_emissao,
      data_vencimento: nota.data_vencimento || '',
      valor_total: nota.valor_total,
      tipo: nota.tipo,
      status: nota.status,
      cliente_id: nota.cliente_id,
      fornecedor_id: nota.fornecedor_id,
      medicao_id: nota.medicao_id,
      locacao_id: nota.locacao_id,
      compra_id: nota.compra_id,
      tipo_nota: nota.tipo_nota,
      observacoes: nota.observacoes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleView = (nota: NotaFiscal) => {
    setViewingNota(nota)
    setIsViewDialogOpen(true)
  }

  const handleUpload = (nota: NotaFiscal) => {
    setUploadingNota(nota)
    setUploadFile(null)
    setIsUploadDialogOpen(true)
  }

  const handleFileUpload = async () => {
    if (!uploadingNota || !uploadFile) return

    try {
      setUploading(true)
      const response = await notasFiscaisApi.uploadFile(uploadingNota.id, uploadFile)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Arquivo enviado com sucesso"
        })
        setIsUploadDialogOpen(false)
        setUploadingNota(null)
        setUploadFile(null)
        await carregarNotasFiscais()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload do arquivo",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (nota: NotaFiscal) => {
    if (!nota.arquivo_nf) {
      toast({
        title: "Aviso",
        description: "Arquivo não disponível",
        variant: "destructive"
      })
      return
    }

    try {
      // Abrir arquivo em nova aba
      window.open(nota.arquivo_nf, '_blank')
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer download do arquivo",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      numero_nf: '',
      serie: '',
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: '',
      valor_total: 0,
      tipo: activeTab,
      status: 'pendente',
      tipo_nota: activeTab === 'saida' ? 'locacao' : 'fornecedor',
      observacoes: ''
    })
    setFormFile(null)
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
      paga: { label: "Paga", variant: "default" },
      vencida: { label: "Vencida", variant: "destructive" },
      cancelada: { label: "Cancelada", variant: "secondary" }
    }
    const statusInfo = statusMap[status] || statusMap.pendente
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getTipoNotaLabel = (tipo?: string) => {
    const tipos: Record<string, string> = {
      locacao: 'Locação',
      circulacao_equipamentos: 'Circulação de Equipamentos',
      outros_equipamentos: 'Outros Equipamentos',
      medicao: 'Medição',
      fornecedor: 'Fornecedor'
    }
    return tipos[tipo || ''] || tipo || '-'
  }

  // Filtrar notas fiscais
  const filteredNotas = useMemo(() => {
    let filtered = notasFiscais
    
    if (tipoNotaFilter !== 'all') {
      filtered = filtered.filter(nf => nf.tipo_nota === tipoNotaFilter)
    }
    
    return filtered
  }, [notasFiscais, tipoNotaFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notas Fiscais</h1>
          <p className="text-gray-600">Gerenciamento de notas fiscais de entrada e saída</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              resetForm()
              setFormData(prev => ({ ...prev, tipo: 'saida' }))
              setIsCreateDialogOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Nota de Saída
          </Button>
          <Button 
            onClick={() => {
              resetForm()
              setFormData(prev => ({ ...prev, tipo: 'entrada' }))
              setIsCreateDialogOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Nota de Entrada
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'saida' | 'entrada')}>
        <TabsList>
          <TabsTrigger value="saida">Notas Fiscais de Saída</TabsTrigger>
          <TabsTrigger value="entrada">Notas Fiscais de Entrada</TabsTrigger>
        </TabsList>

        {/* Tab: Notas Fiscais de Saída */}
        <TabsContent value="saida" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notas Fiscais de Saída</CardTitle>
              <CardDescription>
                Notas de locações, circulação de equipamentos, outros equipamentos e medições
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5" />
                  <h3 className="font-semibold">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-end">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por número, série, cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="paga">Paga</SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tipoNotaFilter} onValueChange={setTipoNotaFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de Nota" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      <SelectItem value="locacao">Locação</SelectItem>
                      <SelectItem value="circulacao_equipamentos">Circulação de Equipamentos</SelectItem>
                      <SelectItem value="outros_equipamentos">Outros Equipamentos</SelectItem>
                      <SelectItem value="medicao">Medição</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={carregarNotasFiscais}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </div>

              {/* Tabela */}
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : filteredNotas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma nota fiscal encontrada</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Série</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Data Emissão</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotas.map((nota) => (
                        <TableRow key={nota.id}>
                          <TableCell className="font-medium">{nota.numero_nf}</TableCell>
                          <TableCell>{nota.serie || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getTipoNotaLabel(nota.tipo_nota)}</Badge>
                          </TableCell>
                          <TableCell>
                            {nota.clientes ? (
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span>{nota.clientes.nome}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {nota.medicoes && (
                              <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">Medição: {nota.medicoes.numero}</span>
                              </div>
                            )}
                            {nota.locacoes && (
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">Locação: {nota.locacoes.numero}</span>
                              </div>
                            )}
                            {!nota.medicoes && !nota.locacoes && (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(nota.data_emissao)}</TableCell>
                          <TableCell>
                            {nota.data_vencimento ? formatDate(nota.data_vencimento) : '-'}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(nota.valor_total)}</TableCell>
                          <TableCell>{getStatusBadge(nota.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {nota.arquivo_nf ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownload(nota)}
                                  title="Download do arquivo"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpload(nota)}
                                  title="Upload do arquivo"
                                >
                                  <Upload className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(nota)}
                                title="Visualizar"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(nota)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a nota fiscal <strong>{nota.numero_nf}</strong>?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(nota.id)}
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
                  
                  {/* Paginação */}
                  {!loading && filteredNotas.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} notas fiscais
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

        {/* Tab: Notas Fiscais de Entrada */}
        <TabsContent value="entrada" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notas Fiscais de Entrada</CardTitle>
              <CardDescription>
                Notas fiscais de fornecedores de cada compra que a empresa faz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5" />
                  <h3 className="font-semibold">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-end">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por número, série, fornecedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="paga">Paga</SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={carregarNotasFiscais}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </div>

              {/* Tabela */}
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : filteredNotas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma nota fiscal encontrada</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Série</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Compra</TableHead>
                        <TableHead>Data Emissão</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotas.map((nota) => (
                        <TableRow key={nota.id}>
                          <TableCell className="font-medium">{nota.numero_nf}</TableCell>
                          <TableCell>{nota.serie || '-'}</TableCell>
                          <TableCell>
                            {nota.fornecedores ? (
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span>{nota.fornecedores.nome}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {nota.compras ? (
                              <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{nota.compras.numero_pedido}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(nota.data_emissao)}</TableCell>
                          <TableCell>
                            {nota.data_vencimento ? formatDate(nota.data_vencimento) : '-'}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(nota.valor_total)}</TableCell>
                          <TableCell>{getStatusBadge(nota.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {nota.arquivo_nf ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownload(nota)}
                                  title="Download do arquivo"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpload(nota)}
                                  title="Upload do arquivo"
                                >
                                  <Upload className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(nota)}
                                title="Visualizar"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(nota)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a nota fiscal <strong>{nota.numero_nf}</strong>?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(nota.id)}
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
                  
                  {/* Paginação */}
                  {!loading && filteredNotas.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} notas fiscais
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
      </Tabs>

      {/* Dialog de Criação/Edição */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false)
          setIsEditDialogOpen(false)
          setEditingNota(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? 'Editar Nota Fiscal' : activeTab === 'saida' ? 'Nova Nota Fiscal de Saída' : 'Nova Nota Fiscal de Entrada'}
            </DialogTitle>
            <DialogDescription>
              {activeTab === 'saida' 
                ? 'Preencha os dados da nota fiscal de saída (locação, circulação de equipamentos, outros equipamentos ou medição)'
                : 'Preencha os dados da nota fiscal de entrada (fornecedor)'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero_nf">Número da Nota Fiscal *</Label>
                <Input
                  id="numero_nf"
                  value={formData.numero_nf}
                  onChange={(e) => setFormData({ ...formData, numero_nf: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="serie">Série</Label>
                <Input
                  id="serie"
                  value={formData.serie}
                  onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                />
              </div>
            </div>

            {activeTab === 'saida' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo_nota">Tipo de Nota *</Label>
                    <Select 
                      value={formData.tipo_nota || 'locacao'} 
                      onValueChange={(value) => setFormData({ ...formData, tipo_nota: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="locacao">Locação</SelectItem>
                        <SelectItem value="circulacao_equipamentos">Circulação de Equipamentos</SelectItem>
                        <SelectItem value="outros_equipamentos">Outros Equipamentos</SelectItem>
                        <SelectItem value="medicao">Medição</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cliente_id">Cliente *</Label>
                    <Select 
                      value={formData.cliente_id?.toString() || ''} 
                      onValueChange={(value) => setFormData({ ...formData, cliente_id: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map(cliente => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(formData.tipo_nota === 'medicao' || formData.tipo_nota === 'locacao') && (
                  <div className="grid grid-cols-2 gap-4">
                    {formData.tipo_nota === 'medicao' && (
                      <div>
                        <Label htmlFor="medicao_id">Medição</Label>
                        <Select 
                          value={formData.medicao_id?.toString() || ''} 
                          onValueChange={(value) => setFormData({ ...formData, medicao_id: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a medição" />
                          </SelectTrigger>
                          <SelectContent>
                            {medicoes.map(medicao => (
                              <SelectItem key={medicao.id} value={medicao.id.toString()}>
                                {medicao.numero} - {medicao.periodo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {formData.tipo_nota === 'locacao' && (
                      <div>
                        <Label htmlFor="locacao_id">Locação</Label>
                        <Select 
                          value={formData.locacao_id?.toString() || ''} 
                          onValueChange={(value) => setFormData({ ...formData, locacao_id: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a locação" />
                          </SelectTrigger>
                          <SelectContent>
                            {locacoes.map(locacao => (
                              <SelectItem key={locacao.id} value={locacao.id.toString()}>
                                {locacao.numero}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'entrada' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fornecedor_id">Fornecedor *</Label>
                  <Select 
                    value={formData.fornecedor_id?.toString() || ''} 
                    onValueChange={(value) => setFormData({ ...formData, fornecedor_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map(fornecedor => (
                        <SelectItem key={fornecedor.id} value={fornecedor.id.toString()}>
                          {fornecedor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="compra_id">Compra</Label>
                  <Select 
                    value={formData.compra_id?.toString() || ''} 
                    onValueChange={(value) => setFormData({ ...formData, compra_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a compra" />
                    </SelectTrigger>
                    <SelectContent>
                      {compras.map(compra => (
                        <SelectItem key={compra.id} value={compra.id.toString()}>
                          {compra.numero_pedido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="data_emissao">Data de Emissão *</Label>
                <Input
                  id="data_emissao"
                  type="date"
                  value={formData.data_emissao}
                  onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="valor_total">Valor Total (R$) *</Label>
                <Input
                  id="valor_total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_total}
                  onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status || 'pendente'} 
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="paga">Paga</SelectItem>
                    <SelectItem value="vencida">Vencida</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
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

            <div>
              <Label htmlFor="arquivo_nf">Arquivo da Nota Fiscal (PDF ou XML)</Label>
              <Input
                id="arquivo_nf"
                type="file"
                accept=".pdf,.xml,.PDF,.XML"
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
                    const validTypes = ['application/pdf', 'application/xml', 'text/xml']
                    const validExtensions = ['.pdf', '.xml']
                    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
                    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
                      toast({
                        title: "Erro",
                        description: "Tipo de arquivo inválido. Use PDF ou XML",
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
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Arquivo selecionado: {formFile.name} ({(formFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              {isEditDialogOpen && editingNota?.arquivo_nf && !formFile && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Arquivo atual: {editingNota.nome_arquivo || 'Arquivo anexado'}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false)
              setIsEditDialogOpen(false)
              setEditingNota(null)
              resetForm()
            }}>
              Cancelar
            </Button>
            <Button onClick={isEditDialogOpen ? handleUpdate : handleCreate}>
              {isEditDialogOpen ? 'Atualizar' : 'Criar'} Nota Fiscal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
            <DialogDescription>
              Informações completas da nota fiscal
            </DialogDescription>
          </DialogHeader>
          
          {viewingNota && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Número</Label>
                  <p className="text-lg font-semibold">{viewingNota.numero_nf}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Série</Label>
                  <p className="text-lg">{viewingNota.serie || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                  <p className="text-lg">{viewingNota.tipo === 'saida' ? 'Saída' : 'Entrada'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo de Nota</Label>
                  <p className="text-lg">{getTipoNotaLabel(viewingNota.tipo_nota)}</p>
                </div>
              </div>

              {viewingNota.tipo === 'saida' && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cliente</Label>
                  <p className="text-lg font-semibold">
                    {viewingNota.clientes?.nome || '-'}
                  </p>
                  {viewingNota.clientes?.cnpj && (
                    <p className="text-sm text-gray-600">CNPJ: {viewingNota.clientes.cnpj}</p>
                  )}
                </div>
              )}

              {viewingNota.tipo === 'entrada' && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Fornecedor</Label>
                  <p className="text-lg font-semibold">
                    {viewingNota.fornecedores?.nome || '-'}
                  </p>
                  {viewingNota.fornecedores?.cnpj && (
                    <p className="text-sm text-gray-600">CNPJ: {viewingNota.fornecedores.cnpj}</p>
                  )}
                </div>
              )}

              {viewingNota.medicoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Medição Vinculada</Label>
                  <p className="text-lg">
                    {viewingNota.medicoes.numero} - {viewingNota.medicoes.periodo}
                  </p>
                </div>
              )}

              {viewingNota.locacoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Locação Vinculada</Label>
                  <p className="text-lg">{viewingNota.locacoes.numero}</p>
                </div>
              )}

              {viewingNota.compras && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Compra Vinculada</Label>
                  <p className="text-lg">{viewingNota.compras.numero_pedido}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Emissão</Label>
                  <p className="text-lg">{formatDate(viewingNota.data_emissao)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Vencimento</Label>
                  <p className="text-lg">{viewingNota.data_vencimento ? formatDate(viewingNota.data_vencimento) : '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Valor Total</Label>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(viewingNota.valor_total)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <div className="mt-2">{getStatusBadge(viewingNota.status)}</div>
              </div>

              {viewingNota.observacoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Observações</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{viewingNota.observacoes}</p>
                </div>
              )}

              {viewingNota.arquivo_nf && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Arquivo da Nota Fiscal</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{viewingNota.nome_arquivo || 'Arquivo anexado'}</span>
                    {viewingNota.tamanho_arquivo && (
                      <span className="text-xs text-gray-500">
                        ({(viewingNota.tamanho_arquivo / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(viewingNota)}
                      className="ml-auto"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Upload */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Arquivo</DialogTitle>
            <DialogDescription>
              Envie o arquivo da nota fiscal (PDF ou XML)
            </DialogDescription>
          </DialogHeader>
          
          {uploadingNota && (
            <div className="space-y-4">
              <div>
                <Label>Nota Fiscal</Label>
                <p className="text-sm text-gray-600">
                  {uploadingNota.numero_nf} {uploadingNota.serie && `- Série ${uploadingNota.serie}`}
                </p>
              </div>
              
              <div>
                <Label htmlFor="arquivo">Arquivo (PDF ou XML) *</Label>
                <Input
                  id="arquivo"
                  type="file"
                  accept=".pdf,.xml,.PDF,.XML"
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
                        return
                      }
                      // Validar tipo
                      const validTypes = ['application/pdf', 'application/xml', 'text/xml']
                      if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.xml')) {
                        toast({
                          title: "Erro",
                          description: "Tipo de arquivo inválido. Use PDF ou XML",
                          variant: "destructive"
                        })
                        return
                      }
                      setUploadFile(file)
                    }
                  }}
                />
                {uploadFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Arquivo selecionado: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsUploadDialogOpen(false)
                setUploadingNota(null)
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

