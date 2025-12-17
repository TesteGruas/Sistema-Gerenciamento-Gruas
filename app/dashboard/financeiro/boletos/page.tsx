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
  AlertTriangle,
  CreditCard
} from "lucide-react"
import { boletosApi, Boleto, BoletoCreate } from "@/lib/api-boletos"
import { clientesApi } from "@/lib/api-clientes"
import { obrasApi } from "@/lib/api-obras"
import { apiContasBancarias, ContaBancaria } from "@/lib/api-contas-bancarias"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Cliente {
  id: number
  nome: string
  cnpj?: string
}

interface Obra {
  id: number
  nome: string
  cliente_id?: number
}

export default function BoletosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'receber' | 'pagar' | 'todos' | 'medicoes' | 'independentes'>('receber')
  
  // Estados
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isCreateBancoDialogOpen, setIsCreateBancoDialogOpen] = useState(false)
  const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null)
  const [viewingBoleto, setViewingBoleto] = useState<Boleto | null>(null)
  const [uploadingBoleto, setUploadingBoleto] = useState<Boleto | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formFile, setFormFile] = useState<File | null>(null)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20
  
  // Dados para formulários
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([])
  
  // Formulário de banco
  const [bancoFormData, setBancoFormData] = useState({
    banco: '',
    agencia: '',
    conta: '',
    tipo_conta: 'corrente' as 'corrente' | 'poupanca' | 'investimento',
    saldo_atual: 0,
    status: 'ativa' as 'ativa' | 'inativa' | 'bloqueada'
  })
  
  // Formulário
  const [formData, setFormData] = useState<BoletoCreate>({
    numero_boleto: '',
    cliente_id: undefined,
    obra_id: undefined,
    medicao_id: undefined,
    descricao: '',
    valor: 0,
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: '',
    tipo: 'receber',
    forma_pagamento: '',
    banco_origem_id: undefined,
    observacoes: ''
  })

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    carregarBoletos()
  }, [activeTab, currentPage, statusFilter, searchTerm])

  const carregarDados = async () => {
    try {
      // Carregar clientes
      const clientesResponse = await clientesApi.listarClientes({ limit: 1000 })
      if (clientesResponse.success) {
        setClientes(clientesResponse.data || [])
      }
      
      // Carregar obras
      const obrasResponse = await obrasApi.listarObras({ limit: 1000 })
      if (obrasResponse.success) {
        setObras(obrasResponse.data || [])
      }
      
      // Carregar contas bancárias
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('access_token')
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const contasResponse = await fetch(`${apiUrl}/api/contas-bancarias`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const contasData = await contasResponse.json()
        if (contasData.success) {
          setContasBancarias(contasData.data || [])
        }
      } catch (error) {
        console.error('Erro ao carregar contas bancárias:', error)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const carregarBoletos = useCallback(async () => {
    try {
      setLoading(true)
      
      // Determinar tipo baseado na aba ativa
      let tipo: 'receber' | 'pagar' | undefined = undefined
      if (activeTab === 'receber') {
        tipo = 'receber'
      } else if (activeTab === 'pagar') {
        tipo = 'pagar'
      }
      
      const response = await boletosApi.list({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        tipo: tipo,
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage,
        include_medicoes: true
      })
      
      if (response.success) {
        let boletosFiltrados = response.data || []
        
        // Filtrar por aba (mantendo compatibilidade com abas antigas)
        if (activeTab === 'medicoes') {
          boletosFiltrados = boletosFiltrados.filter(b => b.medicao_id || (b as any).origem === 'medicao')
        } else if (activeTab === 'independentes') {
          boletosFiltrados = boletosFiltrados.filter(b => !b.medicao_id && (b as any).origem !== 'medicao')
        }
        
        setBoletos(boletosFiltrados)
        setTotalPages(response.pagination?.pages || 1)
        setTotalItems(response.pagination?.total || 0)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar boletos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [activeTab, currentPage, statusFilter, searchTerm, toast])

  const handleCreate = async () => {
    try {
      // Boletos podem ser criados sem cliente ou obra (opcional)
      const response = await boletosApi.create(formData)
      
      if (response.success) {
        // Se houver arquivo, fazer upload após criar
        if (formFile && response.data?.id) {
          try {
            await boletosApi.uploadFile(response.data.id, formFile)
            toast({
              title: "Sucesso",
              description: "Boleto criado e arquivo enviado com sucesso"
            })
          } catch (uploadError: any) {
            toast({
              title: "Aviso",
              description: "Boleto criado, mas houve erro ao enviar o arquivo: " + (uploadError.message || "Erro desconhecido"),
              variant: "destructive"
            })
          }
        } else {
          toast({
            title: "Sucesso",
            description: "Boleto criado com sucesso"
          })
        }
        setIsCreateDialogOpen(false)
        resetForm()
        await carregarBoletos()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar boleto",
        variant: "destructive"
      })
    }
  }

  const handleUpdate = async () => {
    if (!editingBoleto) return
    
    try {
      const response = await boletosApi.update(editingBoleto.id, formData)
      
      if (response.success) {
        // Se houver arquivo, fazer upload após atualizar
        if (formFile) {
          try {
            await boletosApi.uploadFile(editingBoleto.id, formFile)
            toast({
              title: "Sucesso",
              description: "Boleto atualizado e arquivo enviado com sucesso"
            })
          } catch (uploadError: any) {
            toast({
              title: "Aviso",
              description: "Boleto atualizado, mas houve erro ao enviar o arquivo: " + (uploadError.message || "Erro desconhecido"),
              variant: "destructive"
            })
          }
        } else {
          toast({
            title: "Sucesso",
            description: "Boleto atualizado com sucesso"
          })
        }
        setIsEditDialogOpen(false)
        setEditingBoleto(null)
        resetForm()
        await carregarBoletos()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar boleto",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await boletosApi.delete(id)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Boleto excluído com sucesso"
        })
        await carregarBoletos()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir boleto",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (boleto: Boleto) => {
    // Não permitir editar boletos de medições
    if ((boleto as any).origem === 'medicao' || boleto.id.toString().startsWith('medicao_')) {
      toast({
        title: "Aviso",
        description: "Boletos de medições não podem ser editados aqui",
        variant: "destructive"
      })
      return
    }

    setEditingBoleto(boleto)
    setFormData({
      numero_boleto: boleto.numero_boleto,
      cliente_id: boleto.cliente_id,
      obra_id: boleto.obra_id,
      descricao: boleto.descricao,
      valor: boleto.valor,
      data_emissao: boleto.data_emissao,
      data_vencimento: boleto.data_vencimento,
      tipo: boleto.tipo || 'receber',
      forma_pagamento: boleto.forma_pagamento || '',
      banco_origem_id: boleto.banco_origem_id,
      observacoes: boleto.observacoes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleView = (boleto: Boleto) => {
    setViewingBoleto(boleto)
    setIsViewDialogOpen(true)
  }

  const handleMarcarComoPago = async (id: number) => {
    try {
      const response = await boletosApi.marcarComoPago(id)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Boleto marcado como pago"
        })
        await carregarBoletos()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao marcar boleto como pago",
        variant: "destructive"
      })
    }
  }

  const handleUpload = (boleto: Boleto) => {
    setUploadingBoleto(boleto)
    setUploadFile(null)
    setIsUploadDialogOpen(true)
  }

  const handleFileUpload = async () => {
    if (!uploadingBoleto || !uploadFile) return

    try {
      setUploading(true)
      const response = await boletosApi.uploadFile(uploadingBoleto.id, uploadFile)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Arquivo enviado com sucesso"
        })
        setIsUploadDialogOpen(false)
        setUploadingBoleto(null)
        setUploadFile(null)
        await carregarBoletos()
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

  const handleDownload = async (boleto: Boleto) => {
    if (!boleto.arquivo_boleto) {
      toast({
        title: "Aviso",
        description: "Arquivo não disponível",
        variant: "destructive"
      })
      return
    }

    try {
      // Abrir arquivo em nova aba
      window.open(boleto.arquivo_boleto, '_blank')
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
      numero_boleto: '',
      cliente_id: undefined,
      obra_id: undefined,
      medicao_id: undefined,
      descricao: '',
      valor: 0,
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: '',
      tipo: activeTab === 'pagar' ? 'pagar' : 'receber',
      forma_pagamento: '',
      banco_origem_id: undefined,
      observacoes: ''
    })
    setFormFile(null)
  }
  
  const handleCreateBanco = async () => {
    try {
      // Usar a API diretamente do backend (contas-bancarias)
      const token = localStorage.getItem('token') || localStorage.getItem('access_token')
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/contas-bancarias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          banco: bancoFormData.banco,
          agencia: bancoFormData.agencia,
          conta: bancoFormData.conta,
          tipo_conta: bancoFormData.tipo_conta,
          saldo_atual: bancoFormData.saldo_atual,
          status: bancoFormData.status
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Banco criado com sucesso"
        })
        setIsCreateBancoDialogOpen(false)
        setBancoFormData({
          banco: '',
          agencia: '',
          conta: '',
          tipo_conta: 'corrente',
          saldo_atual: 0,
          status: 'ativa'
        })
        await carregarDados()
      } else {
        throw new Error(data.message || 'Erro ao criar banco')
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar banco",
        variant: "destructive"
      })
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
      pago: { label: "Pago", variant: "default" },
      vencido: { label: "Vencido", variant: "destructive" },
      cancelado: { label: "Cancelado", variant: "secondary" }
    }
    const statusInfo = statusMap[status] || statusMap.pendente
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const isVencido = (dataVencimento: string) => {
    return new Date(dataVencimento) < new Date() && new Date(dataVencimento).toDateString() !== new Date().toDateString()
  }

  // Filtrar boletos
  const filteredBoletos = useMemo(() => {
    return boletos
  }, [boletos])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Boletos</h1>
          <p className="text-gray-600">Gerenciamento de boletos a receber e a pagar</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsCreateBancoDialogOpen(true)}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Novo Banco
          </Button>
          <Button 
            onClick={() => {
              resetForm()
              setIsCreateDialogOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Boleto
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="receber">Boletos a Receber</TabsTrigger>
          <TabsTrigger value="pagar">Boletos a Pagar</TabsTrigger>
          <TabsTrigger value="todos">Todos os Boletos</TabsTrigger>
          <TabsTrigger value="medicoes">Boletos de Medições</TabsTrigger>
          <TabsTrigger value="independentes">Boletos Independentes</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'receber' ? 'Boletos a Receber' :
                 activeTab === 'pagar' ? 'Boletos a Pagar' :
                 activeTab === 'medicoes' ? 'Boletos de Medições' : 
                 activeTab === 'independentes' ? 'Boletos Independentes' : 
                 'Todos os Boletos'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'receber' ? 'Boletos que devem ser recebidos' :
                 activeTab === 'pagar' ? 'Boletos que devem ser pagos' :
                 activeTab === 'medicoes' ? 'Boletos vinculados às medições mensais' :
                 activeTab === 'independentes' ? 'Boletos criados independentemente de medições' :
                 'Todos os boletos do sistema'}
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
                        placeholder="Buscar por número, descrição, cliente..."
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
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={carregarBoletos}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </div>

              {/* Tabela */}
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : filteredBoletos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum boleto encontrado</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Banco</TableHead>
                        <TableHead>Emissão</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBoletos.map((boleto) => {
                        const vencido = isVencido(boleto.data_vencimento) && boleto.status === 'pendente'
                        const origem = (boleto as any).origem === 'medicao' ? 'Medição' : boleto.medicao_id ? 'Medição' : 'Independente'
                        
                        return (
                          <TableRow key={boleto.id} className={vencido ? 'bg-red-50' : ''}>
                            <TableCell className="font-medium">{boleto.numero_boleto}</TableCell>
                            <TableCell>{boleto.descricao}</TableCell>
                            <TableCell>
                              {boleto.clientes ? (
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-gray-400" />
                                  <span>{boleto.clientes.nome}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {origem === 'Medição' ? (
                                <div className="flex items-center gap-2">
                                  <Receipt className="w-4 h-4 text-blue-400" />
                                  <span className="text-sm">
                                    {boleto.medicoes ? `Medição ${boleto.medicoes.numero}` : 'Medição'}
                                  </span>
                                </div>
                              ) : (
                                <Badge variant="outline">Independente</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {boleto.contas_bancarias ? (
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">{boleto.contas_bancarias.banco}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(boleto.data_emissao)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {formatDate(boleto.data_vencimento)}
                                {vencido && <AlertTriangle className="w-4 h-4 text-red-500" />}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">{formatCurrency(boleto.valor)}</TableCell>
                            <TableCell>{getStatusBadge(boleto.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {boleto.arquivo_boleto ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(boleto)}
                                    title="Download do arquivo"
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUpload(boleto)}
                                    title="Upload do arquivo"
                                  >
                                    <Upload className="w-4 h-4" />
                                  </Button>
                                )}
                                {boleto.status === 'pendente' && !(boleto as any).origem && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarcarComoPago(boleto.id)}
                                    title="Marcar como pago"
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleView(boleto)}
                                  title="Visualizar"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {!(boleto as any).origem && !boleto.id.toString().startsWith('medicao_') && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(boleto)}
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
                                            Tem certeza que deseja excluir o boleto <strong>{boleto.numero_boleto}</strong>?
                                            Esta ação não pode ser desfeita.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDelete(boleto.id)}
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Excluir
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  
                  {/* Paginação */}
                  {!loading && filteredBoletos.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} boletos
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
          setEditingBoleto(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? 'Editar Boleto' : 'Novo Boleto'}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen ? 'Edite as informações do boleto' : 'Crie um novo boleto vinculado a cliente e/ou obra'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select 
                  value={formData.tipo || 'receber'} 
                  onValueChange={(value) => setFormData({ ...formData, tipo: value as 'receber' | 'pagar' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receber">A Receber</SelectItem>
                    <SelectItem value="pagar">A Pagar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="numero_boleto">Número do Boleto *</Label>
                <Input
                  id="numero_boleto"
                  value={formData.numero_boleto}
                  onChange={(e) => setFormData({ ...formData, numero_boleto: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cliente_id">Cliente (Opcional)</Label>
                <Select 
                  value={formData.cliente_id?.toString() || 'none'} 
                  onValueChange={(value) => setFormData({ ...formData, cliente_id: value && value !== 'none' ? parseInt(value) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum cliente</SelectItem>
                    {clientes.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id.toString()}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="obra_id">Obra (Opcional)</Label>
                <Select 
                  value={formData.obra_id?.toString() || 'none'} 
                  onValueChange={(value) => setFormData({ ...formData, obra_id: value && value !== 'none' ? parseInt(value) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a obra (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma obra</SelectItem>
                    {obras.map(obra => (
                      <SelectItem key={obra.id} value={obra.id.toString()}>
                        {obra.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="banco_origem_id">Banco de Origem</Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.banco_origem_id?.toString() || 'none'} 
                    onValueChange={(value) => setFormData({ ...formData, banco_origem_id: value && value !== 'none' ? parseInt(value) : undefined })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione o banco (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum banco</SelectItem>
                      {contasBancarias.map(conta => (
                        <SelectItem key={conta.id} value={conta.id.toString()}>
                          {conta.banco} - Ag: {conta.agencia} - Conta: {conta.conta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCreateBancoDialogOpen(true)}
                    title="Criar novo banco"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Input
                  id="forma_pagamento"
                  value={formData.forma_pagamento}
                  onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value })}
                  placeholder="Ex: Boleto bancário, PIX, etc."
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

            <div>
              <Label htmlFor="arquivo_boleto">Arquivo do Boleto (PDF, JPG ou PNG)</Label>
              <Input
                id="arquivo_boleto"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.PDF,.JPG,.JPEG,.PNG"
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
                    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
                    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png']
                    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
                    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
                      toast({
                        title: "Erro",
                        description: "Tipo de arquivo inválido. Use PDF, JPG ou PNG",
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
              {isEditDialogOpen && editingBoleto?.arquivo_boleto && !formFile && (
                <div className="mt-2">
                  <p className="text-sm text-green-600 flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" />
                    Arquivo atual: {editingBoleto.arquivo_boleto.split('/').pop() || 'Arquivo anexado'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(editingBoleto)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Arquivo Atual
                  </Button>
                </div>
              )}
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false)
              setIsEditDialogOpen(false)
              setEditingBoleto(null)
              resetForm()
            }}>
              Cancelar
            </Button>
            <Button onClick={isEditDialogOpen ? handleUpdate : handleCreate}>
              {isEditDialogOpen ? 'Atualizar' : 'Criar'} Boleto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Boleto</DialogTitle>
            <DialogDescription>
              Informações completas do boleto
            </DialogDescription>
          </DialogHeader>
          
          {viewingBoleto && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Número do Boleto</Label>
                  <p className="text-lg font-semibold">{viewingBoleto.numero_boleto}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Valor</Label>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(viewingBoleto.valor)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                <p className="text-lg">{viewingBoleto.descricao}</p>
              </div>

              {viewingBoleto.clientes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cliente</Label>
                  <p className="text-lg font-semibold">{viewingBoleto.clientes.nome}</p>
                  {viewingBoleto.clientes.cnpj && (
                    <p className="text-sm text-gray-600">CNPJ: {viewingBoleto.clientes.cnpj}</p>
                  )}
                </div>
              )}

              {viewingBoleto.obras && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Obra</Label>
                  <p className="text-lg">{viewingBoleto.obras.nome}</p>
                </div>
              )}

              {viewingBoleto.medicoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Medição Vinculada</Label>
                  <p className="text-lg">
                    {viewingBoleto.medicoes.numero} - {viewingBoleto.medicoes.periodo}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                  <p className="text-lg">
                    <Badge variant={viewingBoleto.tipo === 'pagar' ? 'destructive' : 'default'}>
                      {viewingBoleto.tipo === 'pagar' ? 'A Pagar' : 'A Receber'}
                    </Badge>
                  </p>
                </div>
                {viewingBoleto.contas_bancarias && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Banco de Origem</Label>
                    <p className="text-lg">
                      {viewingBoleto.contas_bancarias.banco} - Ag: {viewingBoleto.contas_bancarias.agencia} - Conta: {viewingBoleto.contas_bancarias.conta}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Emissão</Label>
                  <p className="text-lg">{formatDate(viewingBoleto.data_emissao)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Vencimento</Label>
                  <p className="text-lg">{formatDate(viewingBoleto.data_vencimento)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-2">{getStatusBadge(viewingBoleto.status)}</div>
                </div>
              </div>

              {viewingBoleto.data_pagamento && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Pagamento</Label>
                  <p className="text-lg">{formatDate(viewingBoleto.data_pagamento)}</p>
                </div>
              )}

              {viewingBoleto.observacoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Observações</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{viewingBoleto.observacoes}</p>
                </div>
              )}

              {viewingBoleto.arquivo_boleto && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Arquivo do Boleto</Label>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(viewingBoleto)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download do Arquivo
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
            <DialogTitle>Upload de Arquivo do Boleto</DialogTitle>
            <DialogDescription>
              Envie o arquivo do boleto (PDF ou imagem)
            </DialogDescription>
          </DialogHeader>
          
          {uploadingBoleto && (
            <div className="space-y-4">
              <div>
                <Label>Boleto</Label>
                <p className="text-sm text-gray-600">
                  {uploadingBoleto.numero_boleto} - {uploadingBoleto.descricao}
                </p>
              </div>
              
              <div>
                <Label htmlFor="arquivo">Arquivo (PDF ou Imagem) *</Label>
                <Input
                  id="arquivo"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.PDF,.JPG,.JPEG,.PNG"
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
                      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
                      if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().match(/\.(jpg|jpeg|png)$/i)) {
                        toast({
                          title: "Erro",
                          description: "Tipo de arquivo inválido. Use PDF ou imagem (JPG/PNG)",
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
                setUploadingBoleto(null)
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

      {/* Dialog de Criar Banco */}
      <Dialog open={isCreateBancoDialogOpen} onOpenChange={setIsCreateBancoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Banco</DialogTitle>
            <DialogDescription>
              Cadastre uma nova conta bancária
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="banco_nome">Nome do Banco *</Label>
              <Input
                id="banco_nome"
                value={bancoFormData.banco}
                onChange={(e) => setBancoFormData({ ...bancoFormData, banco: e.target.value })}
                placeholder="Ex: Banco do Brasil, Itaú, etc."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="banco_agencia">Agência *</Label>
                <Input
                  id="banco_agencia"
                  value={bancoFormData.agencia}
                  onChange={(e) => setBancoFormData({ ...bancoFormData, agencia: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="banco_conta">Conta *</Label>
                <Input
                  id="banco_conta"
                  value={bancoFormData.conta}
                  onChange={(e) => setBancoFormData({ ...bancoFormData, conta: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="banco_tipo">Tipo de Conta *</Label>
                <Select 
                  value={bancoFormData.tipo_conta} 
                  onValueChange={(value) => setBancoFormData({ ...bancoFormData, tipo_conta: value as 'corrente' | 'poupanca' | 'investimento' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Conta Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                    <SelectItem value="investimento">Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="banco_saldo">Saldo Inicial (R$)</Label>
                <Input
                  id="banco_saldo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={bancoFormData.saldo_atual}
                  onChange={(e) => setBancoFormData({ ...bancoFormData, saldo_atual: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateBancoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBanco}>
              Criar Banco
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

