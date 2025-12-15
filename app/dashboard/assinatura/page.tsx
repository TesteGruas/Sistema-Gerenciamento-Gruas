"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  FileSignature, 
  Plus, 
  Search, 
  Upload,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  Calendar,
  FileText,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Send,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"
import { obrasDocumentosApi, DocumentoObra } from "@/lib/api-obras-documentos"
import { obrasApi } from "@/lib/api-obras"
import api from "@/lib/api"
import { isAdmin } from "@/lib/user-utils"
import { getResumoMensalAssinaturas } from "@/lib/api-assinaturas"

export default function AssinaturaPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { currentUser } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedObra, setSelectedObra] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Estados para integração com backend
  const [documentos, setDocumentos] = useState<DocumentoObra[]>([])
  const [obras, setObras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para resumo mensal de assinaturas
  const [mesResumoAssinaturas, setMesResumoAssinaturas] = useState(new Date().getMonth() + 1)
  const [anoResumoAssinaturas, setAnoResumoAssinaturas] = useState(new Date().getFullYear())
  const [resumoAssinaturas, setResumoAssinaturas] = useState<any>(null)
  const [loadingResumoAssinaturas, setLoadingResumoAssinaturas] = useState(false)

  // Função para carregar documentos do backend
  const carregarDocumentos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('[Assinaturas] Carregando documentos...')
      console.log('[Assinaturas] Usuário atual:', currentUser)
      
      // Carregar todas as obras primeiro
      const obrasResponse = await obrasApi.listarObras()
      console.log('[Assinaturas] Obras carregadas:', obrasResponse.data?.length)
      setObras(obrasResponse.data)
      
      // Carregar todos os documentos de uma vez
      const response = await obrasDocumentosApi.listarTodos()
      const todosDocumentos = Array.isArray(response.data) ? response.data : [response.data]
      console.log('[Assinaturas] Documentos carregados:', todosDocumentos.length)
      console.log('[Assinaturas] Documentos completos:', todosDocumentos)
      
      setDocumentos(todosDocumentos)
    } catch (error: any) {
      console.error('[Assinaturas] Erro ao carregar documentos:', error)
      setError(error.message || 'Erro ao carregar documentos')
      setDocumentos([])
      setObras([])
      toast({
        title: "Erro ao carregar documentos",
        description: error.message || "Não foi possível carregar os documentos. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Função para carregar resumo mensal de assinaturas
  const carregarResumoAssinaturas = async () => {
    try {
      setLoadingResumoAssinaturas(true)
      const resumo = await getResumoMensalAssinaturas({
        mes: mesResumoAssinaturas,
        ano: anoResumoAssinaturas
      })
      setResumoAssinaturas(resumo.data)
    } catch (error: any) {
      console.error('Erro ao carregar resumo de assinaturas:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o resumo de assinaturas",
        variant: "destructive"
      })
    } finally {
      setLoadingResumoAssinaturas(false)
    }
  }

  // Função para verificar se o usuário pode ver o documento
  const canViewDocument = (doc: any) => {
    if (!currentUser) {
      console.log('[Assinaturas] canViewDocument: Sem usuário')
      return false
    }
    
    console.log('[Assinaturas] canViewDocument - Doc ID:', doc.id)
    console.log('[Assinaturas] canViewDocument - currentUser.role:', currentUser.role)
    console.log('[Assinaturas] canViewDocument - currentUser.id:', currentUser.id)
    
    // Verificar admin de múltiplas formas (máxima compatibilidade)
    const userRole = currentUser.role?.toLowerCase() || ''
    const isAdminUser = userRole === 'admin' || 
                        userRole === 'administrador' ||
                        userRole.includes('admin') ||
                        isAdmin(currentUser)
    
    console.log('[Assinaturas] canViewDocument - isAdminUser:', isAdminUser)
    
    // Admin pode ver todos os documentos
    if (isAdminUser) {
      console.log('[Assinaturas] ✅ Usuário é admin, pode ver documento', doc.id)
      return true
    }
    
    // Outros usuários só podem ver documentos onde são assinantes
    const hasAssinaturas = doc.assinaturas && Array.isArray(doc.assinaturas)
    const hasOrdemAssinatura = doc.ordemAssinatura && Array.isArray(doc.ordemAssinatura)
    
    console.log('[Assinaturas] canViewDocument - Documento tem assinaturas?', hasAssinaturas)
    console.log('[Assinaturas] canViewDocument - Documento tem ordemAssinatura?', hasOrdemAssinatura)
    
    const isAssinante = (hasAssinaturas && doc.assinaturas.some((assinatura: any) => {
      const match = assinatura.user_id === parseInt(currentUser.id)
      console.log(`[Assinaturas] Verificando assinatura: user_id=${assinatura.user_id}, currentUser.id=${currentUser.id}, match=${match}`)
      return match
    })) ||
    (hasOrdemAssinatura && doc.ordemAssinatura.some((assinatura: any) => {
      const match = assinatura.userId === parseInt(currentUser.id)
      console.log(`[Assinaturas] Verificando ordemAssinatura: userId=${assinatura.userId}, currentUser.id=${currentUser.id}, match=${match}`)
      return match
    }))
    
    console.log('[Assinaturas] canViewDocument - Resultado final:', doc.id, isAssinante ? '✅ SIM' : '❌ NÃO')
    return isAssinante
  }

  // Função para verificar se o usuário pode criar documentos
  const canCreateDocument = () => {
    return isAdmin(currentUser)
  }

  // Função para verificar se o usuário pode assinar o documento
  const canSignDocument = (doc: any) => {
    if (!currentUser) return false
    
    // Encontrar a assinatura do usuário atual
    const userAssinatura = doc.assinaturas?.find((assinatura: any) => assinatura.user_id === currentUser.id) ||
                          doc.ordemAssinatura?.find((assinatura: any) => assinatura.userId === currentUser.id)
    if (!userAssinatura) return false
    
    // Só pode assinar se estiver aguardando
    return userAssinatura.status === 'aguardando'
  }

  // Carregar dados na inicialização quando o usuário estiver disponível
  useEffect(() => {
    if (currentUser) {
      carregarDocumentos()
    }
  }, [currentUser])

  console.log('[Assinaturas] Estado atual:', {
    totalDocumentos: documentos.length,
    currentUser,
    loading,
    error
  })

  const filteredDocumentos = documentos.filter(doc => {
    const matchesSearch = (doc.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.descricao || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || doc.status === selectedStatus
    const matchesObra = selectedObra === "all" || doc.obra_id.toString() === selectedObra
    const canView = canViewDocument(doc)
    
    console.log(`[Assinaturas] Filtro do documento ${doc.id}:`, {
      matchesSearch,
      matchesStatus,
      matchesObra,
      canView,
      resultado: matchesSearch && matchesStatus && matchesObra && canView
    })
    
    return matchesSearch && matchesStatus && matchesObra && canView
  })

  // Lógica de paginação
  const totalPages = Math.ceil(filteredDocumentos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDocumentos = filteredDocumentos.slice(startIndex, endIndex)

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedStatus, selectedObra])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho': return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'aguardando_assinatura': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'em_assinatura': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'assinado': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'rejeitado': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'rascunho': return <FileText className="w-4 h-4" />
      case 'aguardando_assinatura': return <Clock className="w-4 h-4" />
      case 'em_assinatura': return <RefreshCw className="w-4 h-4" />
      case 'assinado': return <CheckCircle className="w-4 h-4" />
      case 'rejeitado': return <XCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getProgressPercentage = (documento: any) => {
    const assinaturas = documento.assinaturas || documento.ordemAssinatura || []
    const totalAssinaturas = assinaturas.length
    if (totalAssinaturas === 0) return 0
    const assinaturasConcluidas = assinaturas.filter((a: any) => a.status === 'assinado').length
    return (assinaturasConcluidas / totalAssinaturas) * 100
  }

  const getNextSigner = (documento: any) => {
    const assinaturas = documento.assinaturas || documento.ordemAssinatura || []
    return assinaturas.find((a: any) => a.status === 'aguardando')
  }

  const getCurrentSigner = (documento: any) => {
    const assinaturas = documento.assinaturas || documento.ordemAssinatura || []
    return assinaturas.find((a: any) => a.status === 'aguardando')
  }


  const handleSendToDocuSign = async (documento: any) => {
    // TODO: Implementar integração real com DocuSign quando disponível
    try {
      // Se houver endpoint para enviar para DocuSign:
      // await obrasDocumentosApi.enviarParaDocuSign(documento.obra_id, documento.id)
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Integração com DocuSign será implementada em breve.",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar para DocuSign",
        variant: "destructive"
      })
    }
  }

  const handleSendIndividualLink = async (documento: any, assinante: any) => {
    // TODO: Implementar envio real de link quando DocuSign estiver integrado
    try {
      // await obrasDocumentosApi.enviarLinkDocuSign(documento.id, assinante.id)
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Envio de links individuais será implementado em breve.",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o link",
        variant: "destructive"
      })
    }
  }

  const handleGenerateDocuSignLinks = async (documento: any) => {
    // TODO: Implementar geração real de links quando DocuSign estiver integrado
    try {
      // await obrasDocumentosApi.gerarLinksDocuSign(documento.id)
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Geração de links DocuSign será implementada em breve.",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar os links",
        variant: "destructive"
      })
    }
  }

  const stats = [
    { 
      title: "Total de Documentos", 
      value: documentos.length, 
      icon: FileText, 
      color: "bg-blue-500" 
    },
    { 
      title: "Em Assinatura", 
      value: documentos.filter(d => d.status === 'em_assinatura').length, 
      icon: RefreshCw, 
      color: "bg-yellow-500" 
    },
    { 
      title: "Assinados", 
      value: documentos.filter(d => d.status === 'assinado').length, 
      icon: CheckCircle, 
      color: "bg-green-500" 
    },
    { 
      title: "Aguardando", 
      value: documentos.filter(d => d.status === 'aguardando_assinatura').length, 
      icon: Clock, 
      color: "bg-orange-500" 
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assinatura Digital</h1>
          <p className="text-gray-600">Gerenciamento de documentos e fluxo de assinaturas</p>
          {currentUser && (
            <div className="mt-2 flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                {currentUser.role}
              </Badge>
              <span className="text-sm text-gray-600">
                Logado como: {currentUser.name}
              </span>
              {currentUser.obraName && (
                <span className="text-sm text-gray-500">
                  • Obra: {currentUser.obraName}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {!currentUser ? (
            <Button 
              className="flex items-center gap-2"
              onClick={() => setIsLoginDialogOpen(true)}
            >
              <Users className="w-4 h-4" />
              Fazer Login
            </Button>
          ) : (
            <>
              {canCreateDocument() && (
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Novo Documento
                </Button>
              )}
              <Button 
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4" />
                Logout
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações do Admin */}
      {isAdmin(currentUser) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Acesso Administrativo</h3>
                <p className="text-sm text-blue-700">
                  Como administrador, você pode ver todos os {documentos.length} documentos do sistema.
                  {filteredDocumentos.length !== documentos.length && 
                    ` ${filteredDocumentos.length} documentos visíveis com os filtros aplicados.`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Mensal de Assinaturas */}
      {currentUser && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resumo de Assinaturas do Mês</CardTitle>
                <CardDescription>Visualize todas as assinaturas realizadas no mês</CardDescription>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="mes-resumo-assinaturas">Mês:</Label>
                <Select value={mesResumoAssinaturas.toString()} onValueChange={(value) => setMesResumoAssinaturas(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Janeiro</SelectItem>
                    <SelectItem value="2">Fevereiro</SelectItem>
                    <SelectItem value="3">Março</SelectItem>
                    <SelectItem value="4">Abril</SelectItem>
                    <SelectItem value="5">Maio</SelectItem>
                    <SelectItem value="6">Junho</SelectItem>
                    <SelectItem value="7">Julho</SelectItem>
                    <SelectItem value="8">Agosto</SelectItem>
                    <SelectItem value="9">Setembro</SelectItem>
                    <SelectItem value="10">Outubro</SelectItem>
                    <SelectItem value="11">Novembro</SelectItem>
                    <SelectItem value="12">Dezembro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="ano-resumo-assinaturas">Ano:</Label>
                <Select value={anoResumoAssinaturas.toString()} onValueChange={(value) => setAnoResumoAssinaturas(parseInt(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={carregarResumoAssinaturas} variant="outline" size="sm" disabled={loadingResumoAssinaturas}>
                <Calendar className="w-4 h-4 mr-2" />
                {loadingResumoAssinaturas ? "Carregando..." : "Carregar Resumo"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingResumoAssinaturas ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : resumoAssinaturas ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total de Assinaturas</p>
                      <p className="text-3xl font-bold text-blue-600">{resumoAssinaturas.total_assinaturas}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Período</p>
                      <p className="text-sm font-medium">
                        {new Date(resumoAssinaturas.periodo.data_inicio).toLocaleDateString('pt-BR')} - {new Date(resumoAssinaturas.periodo.data_fim).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                {resumoAssinaturas.assinaturas && resumoAssinaturas.assinaturas.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700">Lista de Assinaturas</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Documento</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Obra</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resumoAssinaturas.assinaturas.map((assinatura: any) => (
                          <TableRow key={assinatura.id}>
                            <TableCell>
                              {new Date(assinatura.data_assinatura).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="font-medium">
                              {assinatura.documento?.nome || 'Documento não encontrado'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{assinatura.documento?.tipo || '-'}</Badge>
                            </TableCell>
                            <TableCell>
                              {assinatura.documento?.obra?.nome || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma assinatura encontrada para este período</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Selecione um mês e ano e clique em "Carregar Resumo" para visualizar suas assinaturas
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar documentos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="aguardando_assinatura">Aguardando</SelectItem>
                  <SelectItem value="em_assinatura">Em Assinatura</SelectItem>
                  <SelectItem value="assinado">Assinado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="obra">Obra</Label>
              <Select value={selectedObra} onValueChange={setSelectedObra}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as obras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {obras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id.toString()}>
                      {obra.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setSelectedStatus("all")
                  setSelectedObra("all")
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {(loading || !currentUser) && (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-blue-600 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {!currentUser ? 'Carregando informações do usuário...' : 'Carregando documentos...'}
            </h3>
            <p className="text-gray-600">
              {!currentUser ? 'Aguarde enquanto verificamos suas credenciais.' : 'Aguarde enquanto buscamos os documentos do sistema.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Erro ao carregar documentos</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={carregarDocumentos}
                  className="mt-2 text-red-600 border-red-300 hover:bg-red-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Documentos */}
      {!loading && !error && filteredDocumentos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileSignature className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {!currentUser ? 'Faça login para ver os documentos' : 'Nenhum documento encontrado'}
            </h3>
            <p className="text-gray-600 mb-4">
              {!currentUser 
                ? 'Você precisa fazer login para acessar os documentos de assinatura.'
                : 'Não há documentos disponíveis com os filtros aplicados.'
              }
            </p>
            {!currentUser && (
              <Button onClick={() => setIsLoginDialogOpen(true)}>
                <Users className="w-4 h-4 mr-2" />
                Fazer Login
              </Button>
            )}
          </CardContent>
        </Card>
      ) : !loading && !error ? (
        <div className="space-y-4">
          {/* Controles de Paginação Superior */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredDocumentos.length)} de {filteredDocumentos.length} documentos
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="items-per-page" className="text-sm">Itens por página:</Label>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(parseInt(value))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Lista de Documentos em Formato de Tabela */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDocumentos.map((documento) => {
                    const progress = getProgressPercentage(documento)
                    const nextSigner = getNextSigner(documento)
                    const currentSigner = getCurrentSigner(documento)
                    const assinaturas = documento.assinaturas || documento.ordemAssinatura || []
                    
                    return (
                      <TableRow key={documento.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <FileSignature className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900">{documento.titulo}</div>
                              <div className="text-sm text-gray-500">{documento.descricao}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{documento.obra_nome}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(documento.status)}>
                            {getStatusIcon(documento.status)}
                            <span className="ml-1 capitalize">{documento.status.replace('_', ' ')}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress 
                              value={progress} 
                              className={`h-2 w-20 ${Math.round(progress) === 100 ? '[&>div]:bg-green-500' : ''}`}
                            />
                            <div className="text-xs text-gray-500">
                              {assinaturas.filter((a: any) => a.status === 'assinado').length} de {assinaturas.length}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {new Date(documento.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/assinatura/${documento.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {canSignDocument(documento) ? 'Assinar' : 'Ver'}
                            </Button>
                            {documento.docu_sign_link && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(documento.docu_sign_link, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Controles de Paginação Inferior */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {/* Números das páginas */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber
                    if (totalPages <= 5) {
                      pageNumber = i + 1
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i
                    } else {
                      pageNumber = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Dialog de Criação */}
      {isCreateDialogOpen && (
        <CreateDocumentDialog 
          onClose={() => setIsCreateDialogOpen(false)}
          obras={obras}
          onDocumentCreated={carregarDocumentos}
        />
      )}


      {/* Dialog de Login */}
      {isLoginDialogOpen && (
        <LoginDialog 
          onClose={() => setIsLoginDialogOpen(false)} 
        />
      )}
    </div>
  )
}

function DocumentoDetails({ documento, onClose, obras }: { documento: any; onClose: () => void; obras: any[] }) {
  const { toast } = useToast()
  const obra = obras.find(o => o.id === documento.obra_id || o.id === documento.obraId)
  const progress = getProgressPercentage(documento)
  const currentSigner = documento.ordemAssinatura?.find((a: any) => a.status === 'aguardando')

  const handleGenerateDocuSignLinks = async (documento: any) => {
    // TODO: Implementar geração real de links quando DocuSign estiver integrado
    try {
      // await obrasDocumentosApi.gerarLinksDocuSign(documento.id)
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Geração de links DocuSign será implementada em breve.",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar os links",
        variant: "destructive"
      })
    }
  }

  const handleSendIndividualLink = async (documento: any, assinante: any) => {
    // TODO: Implementar envio real de link quando DocuSign estiver integrado
    try {
      // await obrasDocumentosApi.enviarLinkDocuSign(documento.id, assinante.id)
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Envio de links individuais será implementado em breve.",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o link",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{documento.titulo}</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
            
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="assinaturas">Assinaturas</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Informações do Documento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Obra:</span>
                        <span className="text-sm">{obra?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge className={getStatusColor(documento.status)}>
                          {documento.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Criado em:</span>
                        <span className="text-sm">{new Date(documento.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Arquivo Original:</span>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Baixar
                        </Button>
                      </div>
                      {documento.docuSignLink && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">DocuSign:</span>
                          <a 
                            href={documento.docuSignLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            <ExternalLink className="w-4 h-4 inline mr-1" />
                            Abrir Link
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Progresso das Assinaturas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress 
                        value={progress} 
                        className={`h-2 ${Math.round(progress) === 100 ? '[&>div]:bg-green-500' : ''}`}
                      />
                      <div className="text-sm text-gray-600">
                        {documento.ordemAssinatura.filter((a: any) => a.status === 'assinado').length} de {documento.ordemAssinatura.length} assinaturas concluídas
                      </div>
                      {currentSigner && (
                        <div className="text-sm text-blue-600">
                          Próximo: {currentSigner.userName} ({currentSigner.role})
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="assinaturas" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">Ordem de Assinatura</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateDocuSignLinks(documento)}
                        className="text-blue-600"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Gerar Todos os Links
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ordem</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Papel</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Link DocuSign</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Data Envio</TableHead>
                          <TableHead>Data Assinatura</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documento.ordemAssinatura?.map((assinatura: any, index: number) => {
                          // O usuário já vem na resposta da API ou pode ser buscado se necessário
                          const userName = assinatura.userName || assinatura.user_nome || `Usuário ${assinatura.userId}`
                          const userRole = assinatura.role || assinatura.user_role || 'N/A'
                          return (
                            <TableRow key={assinatura.userId}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{userName}</TableCell>
                              <TableCell>{userRole}</TableCell>
                              <TableCell>
                                <Badge className={assinatura.status === 'assinado' ? 'bg-green-100 text-green-800' : 
                                                 assinatura.status === 'aguardando' ? 'bg-blue-100 text-blue-800' :
                                                 assinatura.status === 'rejeitado' ? 'bg-red-100 text-red-800' : 
                                                 'bg-yellow-100 text-yellow-800'}>
                                  {assinatura.status === 'assinado' && <CheckCircle className="w-3 h-3 mr-1" />}
                                  {assinatura.status === 'aguardando' && <Clock className="w-3 h-3 mr-1" />}
                                  {assinatura.status === 'rejeitado' && <XCircle className="w-3 h-3 mr-1" />}
                                  {assinatura.status === 'pendente' && <Clock className="w-3 h-3 mr-1" />}
                                  <span className="capitalize">{assinatura.status}</span>
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {assinatura.docuSignLink ? (
                                  <div className="flex items-center gap-2">
                                    <a 
                                      href={assinatura.docuSignLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      Abrir
                                    </a>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSendIndividualLink(documento, assinatura)}
                                      className="text-xs"
                                    >
                                      <Send className="w-3 h-3 mr-1" />
                                      Reenviar
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSendIndividualLink(documento, assinatura)}
                                    className="text-xs"
                                  >
                                    <Send className="w-3 h-3 mr-1" />
                                    Gerar Link
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {assinatura.emailEnviado ? (
                                    <div className="flex items-center gap-1 text-green-600">
                                      <CheckCircle className="w-3 h-3" />
                                      <span className="text-xs">Enviado</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-gray-400">
                                      <Clock className="w-3 h-3" />
                                      <span className="text-xs">Pendente</span>
                                    </div>
                                  )}
                                </div>
                                {assinatura.dataEmailEnviado && (
                                  <div className="text-xs text-gray-500">
                                    {new Date(assinatura.dataEmailEnviado).toLocaleDateString('pt-BR')}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {assinatura.dataEnvio ? new Date(assinatura.dataEnvio).toLocaleDateString('pt-BR') : '-'}
                              </TableCell>
                              <TableCell>
                                {assinatura.dataAssinatura ? new Date(assinatura.dataAssinatura).toLocaleDateString('pt-BR') : '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {assinatura.arquivoAssinado && (
                                    <Button variant="outline" size="sm">
                                      <Download className="w-3 h-3 mr-1" />
                                      Baixar
                                    </Button>
                                  )}
                                  {assinatura.user_email && (
                                    <Button variant="outline" size="sm" title={`Email: ${assinatura.user_email}`}>
                                      <Users className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historico" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Histórico de Assinaturas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {documento.historicoAssinaturas.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Ação</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Arquivo</TableHead>
                            <TableHead>Observações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {documento.historicoAssinaturas.map((historico: any) => (
                            <TableRow key={historico.id}>
                              <TableCell>{historico.userName}</TableCell>
                              <TableCell>
                                <Badge className={historico.acao === 'assinou' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {historico.acao === 'assinou' ? 'Assinou' : 'Rejeitou'}
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(historico.data).toLocaleDateString('pt-BR')}</TableCell>
                              <TableCell>
                                {historico.arquivoAssinado && (
                                  <Button variant="outline" size="sm">
                                    <Download className="w-4 h-4 mr-1" />
                                    Baixar
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell>{historico.observacoes || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">Nenhuma assinatura registrada ainda</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

function SignDialog({ documento, onClose }: { documento: any; onClose: () => void }) {
  const [observacoes, setObservacoes] = useState("")
  const [arquivoAssinado, setArquivoAssinado] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { toast } = useToast()
  const currentSigner = documento.ordemAssinatura.find((a: any) => a.status === 'aguardando')

  // Função para gerar preview do PDF
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setArquivoAssinado(file)
    
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!arquivoAssinado) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF para upload",
        variant: "destructive"
      })
      return
    }

    if (!currentSigner) {
      toast({
        title: "Erro",
        description: "Assinante não encontrado",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    try {
      // Importar a função de upload
      const { uploadArquivoAssinado } = await import('@/lib/api-assinaturas')
      
      const response = await uploadArquivoAssinado(
        currentSigner.id, // ID da assinatura
        arquivoAssinado,
        observacoes
      )

      if (response.success) {
        toast({
          title: "Sucesso",
          description: response.message || "Arquivo assinado enviado com sucesso!",
          variant: "default"
        })
        onClose()
      } else {
        toast({
          title: "Erro",
          description: response.message || "Erro ao enviar arquivo assinado",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro interno do servidor",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Assinar Documento</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-900">{documento.titulo}</h3>
              <p className="text-sm text-blue-700">{documento.descricao}</p>
              {currentSigner && (
                <p className="text-sm text-blue-600">Assinando como: {currentSigner.userName} ({currentSigner.role})</p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                  placeholder="Adicione observações sobre a assinatura..."
                />
              </div>

              <div>
                <Label htmlFor="arquivo">Upload do Documento Assinado *</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      id="arquivo"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required
                      disabled={isUploading}
                    />
                  </div>
                  
                  {arquivoAssinado && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <FileSignature className="w-4 h-4" />
                        <span className="font-medium">{arquivoAssinado.name}</span>
                        <span className="text-sm">({(arquivoAssinado.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      {previewUrl && (
                        <div className="mt-2">
                          <p className="text-sm text-green-700 mb-2">Preview do arquivo:</p>
                          <iframe
                            src={previewUrl}
                            className="w-full h-64 border border-green-300 rounded"
                            title="Preview do PDF"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Faça o upload do documento PDF assinado fisicamente. Máximo 10MB.
                  </p>
                </div>
              </div>

              {documento.docuSignLink && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Link DocuSign</h4>
                  <a 
                    href={documento.docuSignLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir no DocuSign para assinar
                  </a>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isUploading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isUploading || !arquivoAssinado}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FileSignature className="w-4 h-4 mr-2" />
                      Confirmar Assinatura
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'rascunho': return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'aguardando_assinatura': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'em_assinatura': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'assinado': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'rejeitado': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

function CreateDocumentDialog({ onClose, obras, onDocumentCreated }: { 
  onClose: () => void
  obras: any[]
  onDocumentCreated: () => void
}) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    obraId: '',
    arquivo: null as File | null,
    linkAssinatura: ''
  })
  const [assinantes, setAssinantes] = useState<Array<{
    userId: string, 
    ordem: number, 
    status: 'pendente' | 'aguardando' | 'assinado' | 'rejeitado',
    tipo: 'interno' | 'cliente',
    userInfo?: {
      id: number,
      nome: string,
      email: string,
      cargo?: string,
      role?: string
    }
  }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [obraFilter, setObraFilter] = useState('')
  
  // Estados para filtros de assinantes
  const [tipoAssinante, setTipoAssinante] = useState<'interno' | 'cliente' | ''>('')
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [assinanteFilter, setAssinanteFilter] = useState('')

  // Carregar funcionários e clientes
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Verificar se há token de autenticação
        const token = localStorage.getItem('access_token')
        console.log('Token disponível:', !!token)
        
        // Carregar funcionários (usuários internos) usando api com autenticação
        try {
          const funcionariosResponse = await api.get('/funcionarios?limit=100')
          setFuncionarios(funcionariosResponse.data.data || [])
        } catch (funcionariosError) {
          console.warn('Erro ao carregar funcionários:', funcionariosError)
          setFuncionarios([])
          toast({
            title: "Aviso",
            description: "Não foi possível carregar funcionários. Algumas funcionalidades podem estar limitadas.",
            variant: "default"
          })
        }
        
        // Carregar clientes - tentar API primeiro, depois usar dados das obras
        try {
          const clientesResponse = await api.get('/clientes?limit=100')
          setClientes(clientesResponse.data.data || [])
        } catch (clientesError) {
          console.warn('Erro ao carregar clientes via API, usando dados das obras:', clientesError)
          // Extrair clientes únicos das obras
          console.log('Extraindo clientes das obras:', obras)
          const clientesUnicos = obras.reduce((acc, obra) => {
            console.log('Processando obra:', obra.nome, 'cliente:', obra.clientes)
            if (obra.clientes && !acc.find((c: any) => c.id === obra.clientes.id)) {
              acc.push(obra.clientes)
            }
            return acc
          }, [] as any[])
          console.log('Clientes extraídos:', clientesUnicos)
          setClientes(clientesUnicos)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        setFuncionarios([])
        setClientes([])
        toast({
          title: "Erro",
          description: "Não foi possível carregar todos os dados. Tente recarregar a página.",
          variant: "destructive"
        })
      }
    }
    
    carregarDados()
  }, [obras]) // Adicionar obras como dependência

  // Estado para assinantes filtrados dinamicamente
  const [assinantesFiltrados, setAssinantesFiltrados] = useState<any[]>([])

  // Função para buscar assinantes dinamicamente
  const buscarAssinantes = async (termo: string) => {
    if (!tipoAssinante || !termo.trim()) {
      setAssinantesFiltrados([])
      return
    }

    try {
      let response
      if (tipoAssinante === 'interno') {
        response = await api.get(`/funcionarios?search=${encodeURIComponent(termo)}&limit=50`)
      } else if (tipoAssinante === 'cliente') {
        response = await api.get(`/clientes?search=${encodeURIComponent(termo)}&limit=50`)
      }
      
      if (response?.data?.data) {
        setAssinantesFiltrados(response.data.data)
        console.log(`Busca ${tipoAssinante} por "${termo}":`, response.data.data.length, 'resultados')
      }
    } catch (error) {
      console.error('Erro na busca de assinantes:', error)
      setAssinantesFiltrados([])
    }
  }

  // Debounce para evitar muitas requisições
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscarAssinantes(assinanteFilter)
    }, 300) // 300ms de delay

    return () => clearTimeout(timeoutId)
  }, [assinanteFilter, tipoAssinante])

  // Filtrar obras baseado no termo de busca
  const obrasFiltradas = (obras || []).filter(obra => {
    if (!obra || !obra.nome) {
      console.log('Obra inválida:', obra)
      return false
    }
    
    // Se não há filtro, mostrar todas as obras
    if (!obraFilter.trim()) return true
    
    const searchTerm = obraFilter.toLowerCase()
    const nomeMatch = obra.nome.toLowerCase().includes(searchTerm)
    const enderecoMatch = obra.endereco && obra.endereco.toLowerCase().includes(searchTerm)
    const cidadeMatch = obra.cidade && obra.cidade.toLowerCase().includes(searchTerm)
    
    const matches = nomeMatch || enderecoMatch || cidadeMatch
    
    if (matches) {
      console.log('Obra encontrada:', obra.nome, 'por termo:', searchTerm)
    }
    
    return matches
  })

  // Debug: verificar se as obras estão sendo passadas
  console.log('CreateDocumentDialog - obras recebidas:', obras)
  console.log('CreateDocumentDialog - obraFilter:', obraFilter)
  console.log('CreateDocumentDialog - obrasFiltradas:', obrasFiltradas)
  console.log('Nomes das obras:', obras.map(o => o.nome))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      console.log('=== DEBUG CRIAÇÃO DE DOCUMENTO ===')
      console.log('Dados do formulário:', formData)
      console.log('Arquivo selecionado:', formData.arquivo)
      console.log('Nome do arquivo:', formData.arquivo?.name)
      console.log('Tamanho do arquivo:', formData.arquivo?.size)
      console.log('Tipo do arquivo:', formData.arquivo?.type)
      console.log('Assinantes:', assinantes)
      
      // Validar se arquivo foi selecionado
      if (!formData.arquivo) {
        console.error('❌ ERRO: Nenhum arquivo selecionado!')
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo para upload",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }
      
      console.log('✅ Arquivo validado:', {
        nome: formData.arquivo.name,
        tamanho: formData.arquivo.size,
        tipo: formData.arquivo.type
      })
      
      // Criar FormData para upload
      const formDataUpload = new FormData()
      formDataUpload.append('titulo', formData.titulo)
      formDataUpload.append('descricao', formData.descricao || '')
      formDataUpload.append('arquivo', formData.arquivo)
      formDataUpload.append('ordem_assinatura', JSON.stringify(assinantes.map(ass => ({
        user_id: ass.userId,
        ordem: ass.ordem,
        tipo: ass.tipo,
        status: ass.status
      }))))
      
      console.log('FormData criado:', {
        titulo: formDataUpload.get('titulo'),
        descricao: formDataUpload.get('descricao'),
        arquivo: formDataUpload.get('arquivo'),
        ordem_assinatura: formDataUpload.get('ordem_assinatura')
      })
      
      console.log('Enviando para API...')
      console.log('Obra ID:', formData.obraId)
      console.log('FormData entries:')
      for (let [key, value] of formDataUpload.entries()) {
        console.log(`${key}:`, value)
      }
      
      // Se obraId estiver vazio, usar endpoint sem obra
      const endpoint = formData.obraId && formData.obraId.trim() !== ''
        ? `/obras-documentos/${formData.obraId}/documentos`
        : `/obras-documentos/documentos`
      
      console.log('Endpoint escolhido:', endpoint)
      
      const response = await api.post(endpoint, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      console.log('=== RESPOSTA DA API ===')
      console.log('Status:', response.status)
      console.log('Response data:', response.data)
      console.log('Success:', response.data?.success)
      console.log('Message:', response.data?.message)
      
      if (response.data?.success) {
        console.log('✅ Documento criado com sucesso!')
        toast({
          title: "Sucesso",
          description: "Documento criado com sucesso!",
          variant: "default"
        })
        onDocumentCreated()
        onClose()
      } else {
        console.error('❌ Erro na criação:', response.data?.message)
        toast({
          title: "Erro",
          description: response.data?.message || "Erro ao criar documento",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Erro ao criar documento:', error)
      toast({
        title: "Informação",
        description: "Erro ao criar documento: ${error.message}",
        variant: "default"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addAssinante = () => {
    setAssinantes([...assinantes, { 
      userId: '', 
      ordem: assinantes.length + 1, 
      status: 'pendente',
      tipo: 'interno' as 'interno' | 'cliente'
    }])
  }

  const removeAssinante = (index: number) => {
    const novosAssinantes = assinantes.filter((_, i) => i !== index)
    // Reordenar
    const reordenados = novosAssinantes.map((a, i) => ({ ...a, ordem: i + 1 }))
    setAssinantes(reordenados)
  }

  const updateAssinante = (index: number, field: string, value: string) => {
    const novosAssinantes = [...assinantes]
    novosAssinantes[index] = { ...novosAssinantes[index], [field]: value }
    setAssinantes(novosAssinantes)
  }

  const moveAssinante = (index: number, direction: 'up' | 'down') => {
    const novosAssinantes = [...assinantes]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < novosAssinantes.length) {
      [novosAssinantes[index], novosAssinantes[targetIndex]] = [novosAssinantes[targetIndex], novosAssinantes[index]]
      
      // Reordenar
      const reordenados = novosAssinantes.map((a, i) => ({ ...a, ordem: i + 1 }))
      setAssinantes(reordenados)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Criar Novo Documento</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
            
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <FileSignature className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Configuração Manual de Links DocuSign</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Para cada assinante, você deve preencher:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• <strong>Ordem:</strong> Sequência de assinatura (1, 2, 3...)</li>
                    <li>• <strong>Assinante:</strong> Selecionar usuário da lista</li>
                    <li>• <strong>Link DocuSign:</strong> URL do envelope no DocuSign</li>
                    <li>• <strong>Status:</strong> Pendente, Aguardando, Assinado ou Rejeitado</li>
                  </ul>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="titulo">Título do Documento *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    placeholder="Ex: Contrato de Prestação de Serviços"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="obra">Obra (Opcional)</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Buscar obra por nome, endereço ou cidade..."
                      value={obraFilter}
                      onChange={(e) => setObraFilter(e.target.value)}
                      className="text-sm"
                    />
                    <Select value={formData.obraId || 'none'} onValueChange={(value) => setFormData({...formData, obraId: value === 'none' ? '' : value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a obra (opcional)" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="none">Nenhuma obra (documento geral)</SelectItem>
                        {!obras || obras.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500 text-center">
                            Carregando obras...
                          </div>
                        ) : obrasFiltradas.length > 0 ? (
                          obrasFiltradas.map(obra => (
                            <SelectItem key={obra.id} value={obra.id.toString()}>
                              <div className="flex flex-col">
                                <span className="font-medium">{obra.nome || 'Obra sem nome'}</span>
                                <span className="text-xs text-gray-500">
                                  {obra.endereco && obra.cidade ? `${obra.endereco}, ${obra.cidade}` : obra.endereco || obra.cidade || 'Sem localização'}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500 text-center">
                            Nenhuma obra encontrada
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-gray-500">
                      {obraFilter.trim() 
                        ? `${obrasFiltradas.length} obra(s) encontrada(s)` 
                        : `${obras?.length || 0} obra(s) disponível(is)`} • Deixe em branco para documento sem obra
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Descreva o conteúdo e propósito do documento..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="arquivo">Arquivo Original *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="arquivo"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      console.log('=== DEBUG UPLOAD ===')
                      console.log('Arquivo selecionado:', file)
                      console.log('Nome:', file?.name)
                      console.log('Tamanho:', file?.size)
                      console.log('Tipo:', file?.type)
                      console.log('Última modificação:', file?.lastModified)
                      setFormData({...formData, arquivo: file})
                    }}
                    required
                  />
                  <Button type="button" variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: PDF, DOC, DOCX
                </p>
                {formData.arquivo && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    ✅ Arquivo selecionado: {formData.arquivo.name} ({(formData.arquivo.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="link-assinatura">Link para Assinatura (Opcional)</Label>
                <Input
                  id="link-assinatura"
                  type="url"
                  value={formData.linkAssinatura || ''}
                  onChange={(e) => setFormData({...formData, linkAssinatura: e.target.value})}
                  placeholder="https://exemplo.com/assinatura"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Link externo onde o usuário pode acessar e assinar o documento (opcional)
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Ordem de Assinatura</Label>
                  <div className="text-sm text-gray-500">
                    Use os filtros abaixo para adicionar assinantes
                  </div>
                </div>

                {/* Pré-filtros para seleção de assinantes */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Filtros para Seleção de Assinantes</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Tipo de Assinante */}
                    <div>
                      <Label htmlFor="tipo-assinante">Tipo de Assinante *</Label>
                      <Select value={tipoAssinante} onValueChange={(value) => setTipoAssinante(value as 'interno' | 'cliente' | '')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interno">Interno (Funcionários/Usuários)</SelectItem>
                          <SelectItem value="cliente">Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtro de Busca */}
                    {tipoAssinante && (
                      <div>
                        <Label htmlFor="filtro-assinante">
                          Buscar {tipoAssinante === 'interno' ? 'Funcionário' : 'Cliente'}
                        </Label>
                        <Input
                          id="filtro-assinante"
                          placeholder={`Buscar por nome, email ou função...`}
                          value={assinanteFilter}
                          onChange={(e) => setAssinanteFilter(e.target.value)}
                        />
                      </div>
                    )}

           {/* Contador */}
           {tipoAssinante && assinanteFilter && (
             <div className="flex items-end">
               <div className="text-sm text-gray-600">
                 {assinantesFiltrados.length} {tipoAssinante === 'interno' ? 'funcionário(s)' : 'cliente(s)'} encontrado(s)
               </div>
             </div>
           )}
                  </div>

         {/* Lista de Assinantes Disponíveis */}
         {tipoAssinante && assinanteFilter && (
           <div className="mt-4">
             <Label className="text-sm font-medium text-gray-700">
               {tipoAssinante === 'interno' ? 'Funcionários' : 'Clientes'} Encontrados:
             </Label>
             {assinantesFiltrados.length > 0 ? (
               <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
                 {assinantesFiltrados.map((item) => (
                   <div key={item.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                     <div className="flex items-center justify-between">
                       <div>
                         <div className="font-medium text-sm">{item.nome || item.name}</div>
                         <div className="text-xs text-gray-500">{item.email}</div>
                         <div className="text-xs text-gray-400">{item.cargo || item.role}</div>
                       </div>
                       <Button
                         type="button"
                         size="sm"
                         variant="outline"
                         onClick={() => {
                           console.log('Adicionando assinante:', item)
                           console.log('Assinantes atuais:', assinantes)
                           
                           const novoAssinante = {
                             userId: item.id.toString(),
                             ordem: assinantes.length + 1,
                             status: 'pendente' as const,
                             tipo: tipoAssinante as 'interno' | 'cliente',
                             userInfo: {
                               id: item.id,
                               nome: item.nome || item.name,
                               email: item.email,
                               cargo: item.cargo,
                               role: item.role
                             }
                           }
                           
                           console.log('Novo assinante:', novoAssinante)
                           setAssinantes([...assinantes, novoAssinante])
                           console.log('Assinantes após adição:', [...assinantes, novoAssinante])
                         }}
                         disabled={(() => {
                           const jaAdicionado = assinantes.some(a => a.userId === item.id.toString())
                           console.log(`Verificando se ${item.id} já foi adicionado:`, jaAdicionado, 'Assinantes:', assinantes.map(a => a.userId))
                           return jaAdicionado
                         })()}
                       >
                         {assinantes.some(a => a.userId === item.id.toString()) ? 'Adicionado' : 'Adicionar'}
                       </Button>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="mt-2 p-3 text-center text-gray-500 text-sm border rounded-lg">
                 Nenhum {tipoAssinante === 'interno' ? 'funcionário' : 'cliente'} encontrado para "{assinanteFilter}"
               </div>
             )}
           </div>
         )}

         {tipoAssinante && !assinanteFilter && (
           <div className="mt-4 p-3 text-center text-gray-500 text-sm border rounded-lg">
             Digite um termo de busca para encontrar {tipoAssinante === 'interno' ? 'funcionários' : 'clientes'}
           </div>
         )}

         {/* Lista de Assinantes Adicionados */}
         {assinantes.length > 0 && (
           <div className="mt-4">
             <Label className="text-sm font-medium text-gray-700 mb-3 block">
               Assinantes Adicionados ({assinantes.length}):
             </Label>
             <div className="space-y-3">
               {assinantes.map((assinante, index) => {
                 return (
                   <div key={index} className="p-4 border rounded-lg bg-white">
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center gap-2">
                         <Badge variant="outline">{assinante.ordem}</Badge>
                         <span className="text-sm font-medium text-gray-700">
                           {assinante.userInfo?.nome || `Usuário ${assinante.userId}`}
                         </span>
                         <Badge variant="secondary" className="text-xs">
                           {assinante.tipo === 'interno' ? 'Interno' : 'Cliente'}
                         </Badge>
                       </div>
                       <div className="flex items-center gap-1">
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => moveAssinante(index, 'up')}
                           disabled={index === 0}
                           title="Mover para cima"
                         >
                           ↑
                         </Button>
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => moveAssinante(index, 'down')}
                           disabled={index === assinantes.length - 1}
                           title="Mover para baixo"
                         >
                           ↓
                         </Button>
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => removeAssinante(index)}
                           className="text-red-600 hover:text-red-700"
                           title="Remover assinante"
                         >
                           ✕
                         </Button>
                       </div>
                     </div>
                     
                     <div className="text-xs text-gray-500 mb-3">
                       {assinante.userInfo?.email || 'Email não disponível'}
                     </div>


                     {/* Status */}
                     <div>
                       <Label htmlFor={`status-${index}`} className="text-sm font-medium">
                         Status *
                       </Label>
                       <Select 
                         value={assinante.status} 
                         onValueChange={(value) => {
                           const novosAssinantes = [...assinantes]
                           novosAssinantes[index].status = value as any
                           setAssinantes(novosAssinantes)
                         }}
                       >
                         <SelectTrigger className="mt-1">
                           <SelectValue placeholder="Selecione o status" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="pendente">Pendente</SelectItem>
                           <SelectItem value="aguardando">Aguardando</SelectItem>
                           <SelectItem value="assinado">Assinado</SelectItem>
                           <SelectItem value="rejeitado">Rejeitado</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                 )
               })}
             </div>
           </div>
         )}
                </div>
                
                {assinantes.length === 0 && (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Nenhum assinante adicionado</p>
                    <p className="text-sm">Use os filtros acima para encontrar e adicionar assinantes</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || assinantes.length === 0 || assinantes.some(a => !a.userId)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Criando Documento...
                    </>
                  ) : (
                    <>
                      <FileSignature className="w-4 h-4 mr-2" />
                      Criar Documento
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginDialog({ onClose }: { onClose: () => void }) {
  const { login } = useUser()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // TODO: Substituir por chamada real de API quando endpoint estiver disponível
    const success = await login(email, password)
    if (success) {
      onClose()
    } else {
      setError("Email ou senha inválidos")
    }

    setIsLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Fazer Login</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 p-3 rounded">
                <h4 className="font-medium text-blue-900 mb-2">Usuários de Teste:</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div><strong>Admin:</strong> joao.silva@irbana.com</div>
                  <div><strong>Engenheiro:</strong> maria.santos@irbana.com</div>
                  <div><strong>Cliente:</strong> cliente@alpha.com</div>
                  <div><strong>Funcionário:</strong> ana.oliveira@irbana.com</div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Entrar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function getProgressPercentage(documento: any) {
  const totalAssinaturas = documento.ordemAssinatura.length
  const assinaturasConcluidas = documento.ordemAssinatura.filter((a: any) => a.status === 'assinado').length
  return (assinaturasConcluidas / totalAssinaturas) * 100
}