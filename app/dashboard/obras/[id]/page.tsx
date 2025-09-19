"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Building2, 
  ArrowLeft,
  Calendar, 
  Users, 
  DollarSign,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Eye,
  BookOpen,
  FileSignature,
  ExternalLink,
  Upload,
  Download,
  FileText,
  Send,
  RefreshCw,
  Search,
  Printer,
  ChevronDown,
  ChevronRight,
  Edit
} from "lucide-react"
import { mockObras, mockGruas, getGruasByObra, getCustosByObra, getHistoricoByGrua, getDocumentosByObra, mockUsers } from "@/lib/mock-data"
import { Progress } from "@/components/ui/progress"
import { useParams } from "next/navigation"

export default function ObraDetailsPage() {
  const params = useParams()
  const obraId = params.id as string
  const obra = mockObras.find(o => o.id === obraId)
  
  // Estados para filtros e nova entrada
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGrua, setSelectedGrua] = useState("all")
  const [selectedTipo, setSelectedTipo] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isNovaEntradaOpen, setIsNovaEntradaOpen] = useState(false)
  const [isVisualizarEntradaOpen, setIsVisualizarEntradaOpen] = useState(false)
  const [entradaSelecionada, setEntradaSelecionada] = useState<any>(null)
  const [novaEntradaData, setNovaEntradaData] = useState({
    gruaId: '',
    funcionarioId: '',
    data: new Date().toISOString().split('T')[0],
    tipo: 'checklist',
    status: 'ok',
    descricao: '',
    responsavelResolucao: '',
    observacoes: ''
  })
  
  if (!obra) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Obra não encontrada</h2>
          <p className="text-gray-600">A obra solicitada não existe ou foi removida.</p>
        </div>
      </div>
    )
  }

  const gruasVinculadas = getGruasByObra(obra.id)
  const custos = getCustosByObra(obra.id)
  const documentos = getDocumentosByObra(obra.id)
  
  // Criar lista de entradas com dados expandidos
  const todasEntradas = gruasVinculadas.flatMap(grua => {
    const historico = getHistoricoByGrua(grua.id)
    return historico.map(entrada => ({
      ...entrada,
      gruaName: grua.name,
      gruaId: grua.id,
      descricao: entrada.observacoes || 'Sem descrição',
      responsavelResolucao: entrada.status === 'falha' ? 'A definir' : undefined
    }))
  }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  
  // Filtrar entradas
  const filteredEntradas = todasEntradas.filter(entrada => {
    const matchesSearch = searchTerm === "" || 
      entrada.funcionarioName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrada.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGrua = selectedGrua === "all" || entrada.gruaId === selectedGrua
    const matchesTipo = selectedTipo === "all" || entrada.tipo === selectedTipo
    const matchesStatus = selectedStatus === "all" || entrada.status === selectedStatus
    
    return matchesSearch && matchesGrua && matchesTipo && matchesStatus
  })
  
  // Função para criar nova entrada
  const handleNovaEntrada = (e: React.FormEvent) => {
    e.preventDefault()
    
    const novaEntrada = {
      id: Date.now().toString(),
      gruaId: novaEntradaData.gruaId,
      data: novaEntradaData.data,
      status: novaEntradaData.status as 'ok' | 'falha' | 'manutencao',
      observacoes: novaEntradaData.descricao,
      funcionarioId: novaEntradaData.funcionarioId,
      funcionarioName: mockUsers.find(u => u.id === novaEntradaData.funcionarioId)?.name || 'Funcionário não encontrado',
      tipo: novaEntradaData.tipo as 'checklist' | 'manutencao' | 'falha',
      notificacaoEnviada: false
    }
    
    // Em uma aplicação real, isso seria uma chamada para a API
    console.log('Nova entrada criada:', novaEntrada)
    
    // Resetar formulário e fechar dialog
    setNovaEntradaData({
      gruaId: '',
      funcionarioId: '',
      data: new Date().toISOString().split('T')[0],
      tipo: 'checklist',
      status: 'ok',
      descricao: '',
      responsavelResolucao: '',
      observacoes: ''
    })
    setIsNovaEntradaOpen(false)
    
    // Mostrar mensagem de sucesso (simulado)
    alert('Entrada adicionada com sucesso!')
  }

  const handleVisualizarEntrada = (entrada: any) => {
    setEntradaSelecionada(entrada)
    setIsVisualizarEntradaOpen(true)
  }

  const handleExportarEntradas = () => {
    // Simular exportação para CSV
    const csvContent = [
      ['Data', 'Hora', 'Grua', 'Funcionário', 'Tipo', 'Status', 'Descrição', 'Responsável Resolução', 'Observações'],
      ...filteredEntradas.map(entrada => [
        new Date(entrada.data).toLocaleDateString('pt-BR'),
        new Date(entrada.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        entrada.gruaName,
        entrada.funcionarioName,
        entrada.tipo,
        entrada.status,
        entrada.descricao,
        entrada.responsavelResolucao || '-',
        entrada.observacoes || '-'
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `livro-grua-${obra?.name}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImprimirEntradas = () => {
    window.print()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-100 text-green-800'
      case 'pausada': return 'bg-yellow-100 text-yellow-800'
      case 'concluida': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'assinado': return 'bg-green-100 text-green-800'
      case 'em_assinatura': return 'bg-blue-100 text-blue-800'
      case 'aguardando_assinatura': return 'bg-yellow-100 text-yellow-800'
      case 'rejeitado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSignatureStatusColor = (status: string) => {
    switch (status) {
      case 'assinado': return 'bg-green-100 text-green-800'
      case 'aguardando': return 'bg-yellow-100 text-yellow-800'
      case 'pendente': return 'bg-gray-100 text-gray-800'
      case 'rejeitado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativa': return <CheckCircle className="w-4 h-4" />
      case 'pausada': return <Clock className="w-4 h-4" />
      case 'concluida': return <AlertTriangle className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{obra.name}</h1>
          <p className="text-gray-600">{obra.description}</p>
        </div>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="gruas">Gruas</TabsTrigger>
          <TabsTrigger value="custos">Custos</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="livro-grua">Livro da Grua</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge className={getStatusColor(obra.status)}>
                    {getStatusIcon(obra.status)}
                    <span className="ml-1 capitalize">{obra.status}</span>
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Início:</span>
                  <span className="text-sm">{new Date(obra.startDate).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fim:</span>
                  <span className="text-sm">{obra.endDate ? new Date(obra.endDate).toLocaleDateString('pt-BR') : 'Em andamento'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Responsável:</span>
                  <span className="text-sm">{obra.responsavelName}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Custos Iniciais:</span>
                  <span className="text-sm font-medium">R$ {obra.custosIniciais.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Custos Adicionais:</span>
                  <span className="text-sm font-medium">R$ {obra.custosAdicionais.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-semibold">Total:</span>
                  <span className="text-sm font-bold">R$ {obra.totalCustos.toLocaleString('pt-BR')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gruas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">Gruas Vinculadas ({gruasVinculadas.length})</CardTitle>
                <Button 
                  size="sm"
                  onClick={() => window.location.href = `/dashboard/gruas?obra=${obra.id}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Entrada
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {gruasVinculadas.length > 0 ? (
                <div className="space-y-6">
                  {gruasVinculadas.map((grua) => {
                    const historico = getHistoricoByGrua(grua.id)
                    return (
                      <div key={grua.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{grua.name}</h3>
                            <p className="text-sm text-gray-600">{grua.model} - {grua.capacity}</p>
                          </div>
                          <Badge variant={grua.status === 'em_obra' ? 'default' : 'secondary'}>
                            {grua.status}
                          </Badge>
                        </div>
                        
                        {/* Histórico da Grua */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-sm">Livro da Grua</h4>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.location.href = `/dashboard/gruas/${grua.id}/livro`}
                            >
                              <BookOpen className="w-4 h-4 mr-1" />
                              Abrir Livro
                            </Button>
                          </div>
                          {historico.length > 0 ? (
                            <div className="space-y-2">
                              {historico.slice(0, 5).map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      entry.status === 'ok' ? 'bg-green-500' : 
                                      entry.status === 'falha' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`} />
                                    <span className="text-sm">{entry.observacoes}</span>
                                    {entry.status === 'falha' && (
                                      <AlertTriangle className="w-4 h-4 text-red-500" />
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(entry.data).toLocaleDateString('pt-BR')}
                                  </div>
                                </div>
                              ))}
                              {historico.length > 5 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{historico.length - 5} entradas anteriores
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Nenhum histórico registrado</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Nenhuma grua vinculada a esta obra</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">Histórico de Custos ({custos.length})</CardTitle>
                <Button 
                  size="sm"
                  onClick={() => window.location.href = `/dashboard/financeiro?obra=${obra.id}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Custo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {custos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {custos.map((custo) => (
                      <TableRow key={custo.id}>
                        <TableCell>{custo.descricao}</TableCell>
                        <TableCell>
                          <Badge variant={custo.tipo === 'inicial' ? 'default' : 'secondary'}>
                            {custo.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{custo.categoria}</TableCell>
                        <TableCell>R$ {custo.valor.toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{new Date(custo.data).toLocaleDateString('pt-BR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum custo registrado para esta obra</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="w-5 h-5" />
                  Documentos da Obra
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => window.location.href = `/dashboard/assinatura?obra=${obra.id}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Documento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documentos.length > 0 ? (
                <div className="space-y-4">
                  {documentos.map((documento) => (
                    <Card key={documento.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <CardTitle className="text-lg">{documento.titulo}</CardTitle>
                              <CardDescription className="mt-1">{documento.descricao}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getDocumentStatusColor(documento.status)}>
                              {documento.status.replace('_', ' ')}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = `/dashboard/assinatura/${documento.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Informações do documento */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Criado em:</span>
                              <span>{new Date(documento.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Assinantes:</span>
                              <span>{documento.ordemAssinatura.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Progresso:</span>
                              <span>{Math.round((documento.ordemAssinatura.filter(a => a.status === 'assinado').length / documento.ordemAssinatura.length) * 100)}%</span>
                            </div>
                          </div>

                          {/* Barra de progresso */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progresso das Assinaturas</span>
                              <span>{Math.round((documento.ordemAssinatura.filter(a => a.status === 'assinado').length / documento.ordemAssinatura.length) * 100)}%</span>
                            </div>
                            <Progress 
                              value={(documento.ordemAssinatura.filter(a => a.status === 'assinado').length / documento.ordemAssinatura.length) * 100} 
                              className="h-2"
                            />
                          </div>

                          {/* Lista de assinaturas */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-gray-700">Ordem de Assinaturas</h4>
                            <div className="space-y-2">
                              {documento.ordemAssinatura
                                .sort((a, b) => a.ordem - b.ordem)
                                .map((assinatura, index) => (
                                <div key={assinatura.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                                      {assinatura.ordem}
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{assinatura.userName}</p>
                                      <p className="text-xs text-gray-600">{assinatura.role}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={getSignatureStatusColor(assinatura.status)}>
                                      {assinatura.status}
                                    </Badge>
                                    {assinatura.arquivoAssinado && (
                                      <Button size="sm" variant="outline">
                                        <Download className="w-3 h-3 mr-1" />
                                        Baixar
                                      </Button>
                                    )}
                                    {assinatura.docuSignLink && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => window.open(assinatura.docuSignLink, '_blank')}
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        DocuSign
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Próximo assinante */}
                          {documento.proximoAssinante && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-800">
                                Próximo a assinar: <strong>{documento.ordemAssinatura.find(a => a.userId === documento.proximoAssinante)?.userName}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileSignature className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento encontrado</h3>
                  <p className="text-gray-600 mb-4">Esta obra ainda não possui documentos para assinatura.</p>
                  <Button 
                    onClick={() => window.location.href = `/dashboard/assinatura?obra=${obra.id}`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Documento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Livro da Grua */}
        <TabsContent value="livro-grua" className="space-y-4">
          <Card>
            <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Livro da Grua - {obra.name}
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={handleExportarEntradas}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={handleImprimirEntradas}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setIsNovaEntradaOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Entrada
                </Button>
              </div>
            </div>
            </CardHeader>
            <CardContent>
              {gruasVinculadas.length > 0 ? (
                <div className="space-y-6">
                  {/* Filtros */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label>Buscar entradas</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              placeholder="Funcionário, descrição..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Grua</Label>
                          <Select value={selectedGrua} onValueChange={setSelectedGrua}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Todas as gruas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas as gruas</SelectItem>
                              {gruasVinculadas.map(grua => (
                                <SelectItem key={grua.id} value={grua.id}>
                                  {grua.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Tipo</Label>
                          <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="checklist">Checklist</SelectItem>
                              <SelectItem value="manutencao">Manutenção</SelectItem>
                              <SelectItem value="falha">Falha</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="ok">OK</SelectItem>
                              <SelectItem value="manutencao">Manutenção</SelectItem>
                              <SelectItem value="falha">Falha</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lista de Entradas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Entradas do Livro</CardTitle>
                      <CardDescription>
                        {filteredEntradas.length} entradas encontradas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {filteredEntradas.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[120px]">Data</TableHead>
                                <TableHead className="w-[150px]">Grua</TableHead>
                                <TableHead className="w-[150px]">Funcionário</TableHead>
                                <TableHead className="w-[100px]">Tipo</TableHead>
                                <TableHead className="w-[100px]">Status</TableHead>
                                <TableHead className="min-w-[200px]">Descrição</TableHead>
                                <TableHead className="w-[150px]">Responsável Resolução</TableHead>
                                <TableHead className="w-[80px]">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredEntradas.map((entrada, index) => (
                                <TableRow key={index} className="hover:bg-gray-50">
                                  <TableCell className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-gray-500" />
                                      <span>{new Date(entrada.data).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(entrada.data).toLocaleTimeString('pt-BR', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                      <Wrench className="w-4 h-4 text-blue-600" />
                                      <span>{entrada.gruaName}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4 text-gray-500" />
                                      <span>{entrada.funcionarioName}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        entrada.tipo === 'checklist' ? 'bg-green-100 text-green-800' :
                                        entrada.tipo === 'manutencao' ? 'bg-blue-100 text-blue-800' :
                                        entrada.tipo === 'falha' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {entrada.tipo}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        entrada.status === 'ok' ? 'bg-green-100 text-green-800' :
                                        entrada.status === 'manutencao' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {entrada.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    <div className="max-w-[200px] truncate" title={entrada.descricao}>
                                      {entrada.descricao}
                                    </div>
                                    {entrada.observacoes && (
                                      <div className="text-xs text-gray-500 mt-1 truncate" title={entrada.observacoes}>
                                        Obs: {entrada.observacoes}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {entrada.responsavelResolucao ? (
                                      <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-500" />
                                        <span className="text-xs">{entrada.responsavelResolucao}</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleVisualizarEntrada(entrada)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma entrada encontrada</h3>
                          <p className="text-gray-600 mb-4">
                            Não há entradas que correspondam aos filtros selecionados.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma grua vinculada</h3>
                  <p className="text-gray-600 mb-4">
                    Esta obra ainda não possui gruas vinculadas para exibir o livro de histórico.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para Nova Entrada */}
      <Dialog open={isNovaEntradaOpen} onOpenChange={setIsNovaEntradaOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nova Entrada no Livro da Grua
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNovaEntrada} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gruaId">Grua *</Label>
                <Select
                  value={novaEntradaData.gruaId}
                  onValueChange={(value) => setNovaEntradaData({ ...novaEntradaData, gruaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma grua" />
                  </SelectTrigger>
                  <SelectContent>
                    {gruasVinculadas.map(grua => (
                      <SelectItem key={grua.id} value={grua.id}>
                        {grua.name} - {grua.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="funcionarioId">Funcionário *</Label>
                <Select
                  value={novaEntradaData.funcionarioId}
                  onValueChange={(value) => setNovaEntradaData({ ...novaEntradaData, funcionarioId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers.filter(user => 
                      user.role === 'engenheiro' || 
                      user.role === 'chefe_obras' || 
                      user.role === 'funcionario'
                    ).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={novaEntradaData.data}
                  onChange={(e) => setNovaEntradaData({ ...novaEntradaData, data: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={novaEntradaData.tipo}
                  onValueChange={(value) => setNovaEntradaData({ ...novaEntradaData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checklist">Checklist Diário</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="falha">Falha/Problema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={novaEntradaData.status}
                  onValueChange={(value) => setNovaEntradaData({ ...novaEntradaData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ok">OK</SelectItem>
                    <SelectItem value="manutencao">Em Manutenção</SelectItem>
                    <SelectItem value="falha">Falha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={novaEntradaData.descricao}
                onChange={(e) => setNovaEntradaData({ ...novaEntradaData, descricao: e.target.value })}
                placeholder="Descreva a atividade realizada, problema encontrado ou manutenção executada..."
                rows={4}
                required
              />
            </div>

            {novaEntradaData.status === 'falha' && (
              <div>
                <Label htmlFor="responsavelResolucao">Responsável pela Resolução *</Label>
                <Select
                  value={novaEntradaData.responsavelResolucao}
                  onValueChange={(value) => setNovaEntradaData({ ...novaEntradaData, responsavelResolucao: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers.filter(user => 
                      user.role === 'engenheiro' || 
                      user.role === 'chefe_obras' || 
                      user.role === 'funcionario'
                    ).map(user => (
                      <SelectItem key={user.id} value={user.name}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="observacoes">Observações Adicionais</Label>
              <Textarea
                id="observacoes"
                value={novaEntradaData.observacoes}
                onChange={(e) => setNovaEntradaData({ ...novaEntradaData, observacoes: e.target.value })}
                placeholder="Observações complementares, recomendações, próximos passos..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsNovaEntradaOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Adicionar Entrada
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Entrada */}
      <Dialog open={isVisualizarEntradaOpen} onOpenChange={setIsVisualizarEntradaOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalhes da Entrada
            </DialogTitle>
          </DialogHeader>
          {entradaSelecionada && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Data e Hora</Label>
                      <p className="text-sm">
                        {new Date(entradaSelecionada.data).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Grua</Label>
                      <p className="text-sm font-medium">{entradaSelecionada.gruaName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Funcionário</Label>
                      <p className="text-sm">{entradaSelecionada.funcionarioName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Tipo</Label>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          entradaSelecionada.tipo === 'checklist' ? 'bg-green-100 text-green-800' :
                          entradaSelecionada.tipo === 'manutencao' ? 'bg-blue-100 text-blue-800' :
                          entradaSelecionada.tipo === 'falha' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {entradaSelecionada.tipo}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          entradaSelecionada.status === 'ok' ? 'bg-green-100 text-green-800' :
                          entradaSelecionada.status === 'manutencao' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {entradaSelecionada.status}
                      </Badge>
                    </div>
                    {entradaSelecionada.responsavelResolucao && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Responsável pela Resolução</Label>
                        <p className="text-sm">{entradaSelecionada.responsavelResolucao}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Descrição */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {entradaSelecionada.descricao}
                  </p>
                </CardContent>
              </Card>

              {/* Observações */}
              {entradaSelecionada.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {entradaSelecionada.observacoes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Ações */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsVisualizarEntradaOpen(false)}
                >
                  Fechar
                </Button>
                <Button 
                  onClick={() => {
                    // Aqui poderia implementar edição da entrada
                    console.log('Editar entrada:', entradaSelecionada)
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
