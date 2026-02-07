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
  FileText,
  Building2,
  Receipt,
  Download,
  Upload,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  CreditCard
} from "lucide-react"
import { boletosApi, Boleto } from "@/lib/api-boletos"
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
  const [activeTab, setActiveTab] = useState<'entrada' | 'saida'>('saida')
  
  // Estados
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [loading, setLoading] = useState(true)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isCreateBancoDialogOpen, setIsCreateBancoDialogOpen] = useState(false)
  const [viewingBoleto, setViewingBoleto] = useState<Boleto | null>(null)
  const [uploadingBoleto, setUploadingBoleto] = useState<Boleto | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  
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
      // Boletos de ENTRADA = tipo 'receber' (a receber) - vinculados a notas fiscais de SAÍDA
      // Boletos de SAÍDA = tipo 'pagar' (a pagar) - vinculados a notas fiscais de ENTRADA
      const tipo = activeTab === 'entrada' ? 'receber' : 'pagar'
      console.log('🔍 [BOLETOS] Carregando boletos - activeTab:', activeTab, 'tipo a buscar:', tipo)
      
      const response = await boletosApi.list({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        tipo: tipo,
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage,
        include_medicoes: activeTab === 'saida' // Incluir medições apenas em boletos de saída
      })
      
      console.log('🔍 [BOLETOS] Resposta da API - total:', response.data?.length || 0, 'tipo buscado:', tipo)
      
      if (response.success) {
        let boletosFiltrados = response.data || []
        
        // Filtrar apenas boletos vinculados a notas fiscais ou medições
        // Remover boletos independentes (sem nota_fiscal_id e sem medicao_id)
        boletosFiltrados = boletosFiltrados.filter((b: Boleto) => {
          // Incluir boletos de medições (apenas em saída)
          if (b.medicao_id) {
            return activeTab === 'saida'
          }
          // Incluir apenas boletos vinculados a notas fiscais
          // Verificar tanto nota_fiscal_id quanto o objeto relacionado notas_fiscais
          const temNotaFiscal = b.nota_fiscal_id !== null && b.nota_fiscal_id !== undefined
          return temNotaFiscal
        })
        
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
    // Filtrar por tipo da nota fiscal vinculada
    // Boletos de ENTRADA (tipo "receber") devem mostrar boletos vinculados a notas fiscais de SAÍDA
    // Boletos de SAÍDA (tipo "pagar") devem mostrar boletos vinculados a notas fiscais de ENTRADA
    const tipoNotaEsperado = activeTab === 'entrada' ? 'saida' : 'entrada'
    
    console.log('🔍 [BOLETOS] Filtrando boletos - activeTab:', activeTab, 'tipoNotaEsperado:', tipoNotaEsperado, 'total boletos:', boletos.length)
    
    const filtrados = boletos.filter(b => {
      // Se o boleto tem nota fiscal vinculada, verificar o tipo da nota
      if ((b as any).notas_fiscais) {
        const tipoNota = (b as any).notas_fiscais.tipo
        const match = tipoNota === tipoNotaEsperado
        console.log('🔍 [BOLETOS] Boleto ID:', b.id, 'tipoNota:', tipoNota, 'tipoNotaEsperado:', tipoNotaEsperado, 'match:', match)
        return match
      }
      // Se não tem objeto notas_fiscais mas tem nota_fiscal_id, incluir baseado no tipo do boleto
      // Boletos tipo "receber" são de entrada (vinculados a notas de saída)
      // Boletos tipo "pagar" são de saída (vinculados a notas de entrada)
      if (b.nota_fiscal_id) {
        if (activeTab === 'entrada') {
          const match = b.tipo === 'receber'
          console.log('🔍 [BOLETOS] Boleto ID:', b.id, 'tipo:', b.tipo, 'activeTab: entrada, match:', match)
          return match
        } else {
          const match = b.tipo === 'pagar'
          console.log('🔍 [BOLETOS] Boleto ID:', b.id, 'tipo:', b.tipo, 'activeTab: saida, match:', match)
          return match
        }
      }
      // Se não tem nota fiscal vinculada, incluir apenas se for de medição (apenas em saída)
      if ((b as any).origem === 'medicao' || b.medicao_id) {
        return activeTab === 'saida'
      }
      // Caso contrário, não incluir (boletos sem origem definida)
      return false
    })
    
    console.log('🔍 [BOLETOS] Boletos filtrados:', filtrados.length)
    return filtrados
  }, [boletos, activeTab])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Boletos</h1>
          <p className="text-gray-600">Boletos vinculados a notas fiscais de entrada ou saída e medições</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsCreateBancoDialogOpen(true)}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Novo Banco
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => {
        console.log('🔍 [BOLETOS] Mudando aba de', activeTab, 'para', v)
        setActiveTab(v as any)
      }}>
        <TabsList>
          <TabsTrigger value="saida">Boletos de Saída</TabsTrigger>
          <TabsTrigger value="entrada">Boletos de Entrada</TabsTrigger>
        </TabsList>

        {/* Tab: Boletos de Saída */}
        <TabsContent value="saida" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Boletos de Saída</CardTitle>
              <CardDescription>
                Boletos vinculados a notas fiscais de saída e medições (contas a receber)
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
                        const origem = (boleto as any).origem === 'medicao' || boleto.medicao_id 
                          ? 'Medição' 
                          : (boleto as any).notas_fiscais 
                            ? `NF ${(boleto as any).notas_fiscais.numero_nf || (boleto as any).notas_fiscais.numero_nf || 'N/A'}` 
                            : (boleto as any).nota_fiscal_id 
                              ? `NF #${(boleto as any).nota_fiscal_id}` 
                              : 'Nota Fiscal'
                        
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
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-green-400" />
                                  <span className="text-sm">{origem}</span>
                                </div>
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
                                {boleto.status === 'pendente' && (
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

        {/* Tab: Boletos de Entrada */}
        <TabsContent value="entrada" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Boletos de Entrada</CardTitle>
              <CardDescription>
                Boletos vinculados a notas fiscais de entrada (contas a pagar)
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
                        placeholder="Buscar por número, descrição, fornecedor..."
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
                        <TableHead>Fornecedor</TableHead>
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
                        const origem = (boleto as any).notas_fiscais 
                          ? `NF ${(boleto as any).notas_fiscais.numero_nf || 'N/A'}` 
                          : (boleto as any).nota_fiscal_id 
                            ? `NF #${(boleto as any).nota_fiscal_id}` 
                            : 'Nota Fiscal'
                        
                        return (
                          <TableRow key={boleto.id} className={vencido ? 'bg-red-50' : ''}>
                            <TableCell className="font-medium">{boleto.numero_boleto}</TableCell>
                            <TableCell>{boleto.descricao}</TableCell>
                            <TableCell>
                              {(boleto as any).fornecedores ? (
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-gray-400" />
                                  <span>{(boleto as any).fornecedores.nome}</span>
                                </div>
                              ) : (boleto as any).clientes ? (
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-gray-400" />
                                  <span>{(boleto as any).clientes.nome}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-green-400" />
                                <span className="text-sm">{origem}</span>
                              </div>
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
                                {boleto.status === 'pendente' && (
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

              {(viewingBoleto as any).notas_fiscais && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nota Fiscal Vinculada</Label>
                  <p className="text-lg">
                    NF {(viewingBoleto as any).notas_fiscais.numero_nf || (viewingBoleto as any).notas_fiscais.numero_nf || 'N/A'}
                    {(viewingBoleto as any).notas_fiscais.serie && ` - Série ${(viewingBoleto as any).notas_fiscais.serie}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tipo: {(viewingBoleto as any).notas_fiscais.tipo === 'entrada' ? 'Entrada' : 'Saída'}
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

