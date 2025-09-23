"use client"

import { useState, useEffect } from "react"
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
  ExternalLink,
  Send,
  RefreshCw
} from "lucide-react"
import { mockDocumentos, mockObras, mockUsers } from "@/lib/mock-data"

export default function AssinaturaPage() {
  const router = useRouter()
  const { currentUser } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedObra, setSelectedObra] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  // Função para verificar se o usuário pode ver o documento
  const canViewDocument = (doc: any) => {
    if (!currentUser) return false
    
    // Admin pode ver todos os documentos
    if (currentUser.role === 'admin') return true
    
    // Outros usuários só podem ver documentos onde são assinantes
    return doc.ordemAssinatura.some((assinatura: any) => assinatura.userId === currentUser.id)
  }

  // Função para verificar se o usuário pode criar documentos
  const canCreateDocument = () => {
    return currentUser?.role === 'admin'
  }

  // Função para verificar se o usuário pode assinar o documento
  const canSignDocument = (doc: any) => {
    if (!currentUser) return false
    
    // Encontrar a assinatura do usuário atual
    const userAssinatura = doc.ordemAssinatura.find((assinatura: any) => assinatura.userId === currentUser.id)
    if (!userAssinatura) return false
    
    // Só pode assinar se estiver aguardando
    return userAssinatura.status === 'aguardando'
  }

  const filteredDocumentos = mockDocumentos.filter(doc => {
    const matchesSearch = (doc.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.descricao || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || doc.status === selectedStatus
    const matchesObra = selectedObra === "all" || doc.obraId === selectedObra
    const canView = canViewDocument(doc)
    
    return matchesSearch && matchesStatus && matchesObra && canView
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho': return 'bg-gray-100 text-gray-800'
      case 'aguardando_assinatura': return 'bg-yellow-100 text-yellow-800'
      case 'em_assinatura': return 'bg-blue-100 text-blue-800'
      case 'assinado': return 'bg-green-100 text-green-800'
      case 'rejeitado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
    const totalAssinaturas = documento.ordemAssinatura.length
    const assinaturasConcluidas = documento.ordemAssinatura.filter((a: any) => a.status === 'assinado').length
    return (assinaturasConcluidas / totalAssinaturas) * 100
  }

  const getNextSigner = (documento: any) => {
    return documento.ordemAssinatura.find((a: any) => a.status === 'aguardando')
  }

  const getCurrentSigner = (documento: any) => {
    return documento.ordemAssinatura.find((a: any) => a.status === 'aguardando')
  }


  const handleSendToDocuSign = (documento: any) => {
    // Simular envio para DocuSign
    console.log('Enviando para DocuSign:', documento.id)
    alert('Documento enviado para DocuSign! Links individuais serão gerados e enviados por email para cada assinante.')
  }

  const handleSendIndividualLink = (documento: any, assinante: any) => {
    // Simular envio de link individual
    console.log('Enviando link individual:', { documentoId: documento.id, assinanteId: assinante.userId })
    alert(`Link do DocuSign enviado por email para ${assinante.userName}!`)
  }

  const handleGenerateDocuSignLinks = (documento: any) => {
    // Simular geração de todos os links
    console.log('Gerando links DocuSign para todos os assinantes:', documento.id)
    alert('Links do DocuSign gerados com sucesso! Emails serão enviados automaticamente.')
  }

  const stats = [
    { 
      title: "Total de Documentos", 
      value: mockDocumentos.length, 
      icon: FileText, 
      color: "bg-blue-500" 
    },
    { 
      title: "Em Assinatura", 
      value: mockDocumentos.filter(d => d.status === 'em_assinatura').length, 
      icon: RefreshCw, 
      color: "bg-yellow-500" 
    },
    { 
      title: "Assinados", 
      value: mockDocumentos.filter(d => d.status === 'assinado').length, 
      icon: CheckCircle, 
      color: "bg-green-500" 
    },
    { 
      title: "Aguardando", 
      value: mockDocumentos.filter(d => d.status === 'aguardando_assinatura').length, 
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
      {currentUser?.role === 'admin' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Acesso Administrativo</h3>
                <p className="text-sm text-blue-700">
                  Como administrador, você pode ver todos os {mockDocumentos.length} documentos do sistema.
                  {filteredDocumentos.length !== mockDocumentos.length && 
                    ` ${filteredDocumentos.length} documentos visíveis com os filtros aplicados.`
                  }
                </p>
              </div>
            </div>
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
                  <SelectItem value="aguardando_assinatura">Aguardando Assinatura</SelectItem>
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
                  {mockObras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>
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

      {/* Lista de Documentos */}
      {filteredDocumentos.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocumentos.map((documento) => {
          const progress = getProgressPercentage(documento)
          const nextSigner = getNextSigner(documento)
          const currentSigner = getCurrentSigner(documento)
          
          return (
            <Card key={documento.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{documento.titulo}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(documento.status)}>
                    {getStatusIcon(documento.status)}
                    <span className="ml-1 capitalize">{documento.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
                <CardDescription>{documento.descricao}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Criado em {new Date(documento.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso das Assinaturas</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {currentSigner && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Users className="w-4 h-4" />
                      <span>Próximo: {currentSigner.userName}</span>
                    </div>
                  )}

                  {documento.docuSignLink && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <ExternalLink className="w-4 h-4" />
                        <span>Links DocuSign Ativos</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {documento.ordemAssinatura.filter((a: any) => a.docuSignLink).length} de {documento.ordemAssinatura.length} links gerados
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/assinatura/${documento.id}`)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {canSignDocument(documento) ? 'Assinar' : 'Ver Detalhes'}
                    </Button>
                    {canCreateDocument() && documento.status === 'aguardando_assinatura' && (
                      <Button
                        size="sm"
                        onClick={() => handleSendToDocuSign(documento)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Enviar para DocuSign
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        </div>
      )}

      {/* Dialog de Criação */}
      {isCreateDialogOpen && (
        <CreateDocumentDialog 
          onClose={() => setIsCreateDialogOpen(false)} 
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

function DocumentoDetails({ documento, onClose }: { documento: any; onClose: () => void }) {
  const obra = mockObras.find(o => o.id === documento.obraId)
  const progress = getProgressPercentage(documento)
  const currentSigner = documento.ordemAssinatura.find((a: any) => a.status === 'aguardando')

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
                      <Progress value={progress} className="h-2" />
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
                        {documento.ordemAssinatura.map((assinatura: any, index: number) => {
                          const user = mockUsers.find(u => u.id === assinatura.userId)
                          return (
                            <TableRow key={assinatura.userId}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{assinatura.userName}</TableCell>
                              <TableCell>{assinatura.role}</TableCell>
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
                                  {user?.email && (
                                    <Button variant="outline" size="sm" title={`Email: ${user.email}`}>
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
  const currentSigner = documento.ordemAssinatura.find((a: any) => a.status === 'aguardando')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui seria a lógica para processar a assinatura
    console.log('Processando assinatura:', { 
      documentoId: documento.id, 
      observacoes, 
      arquivoAssinado: arquivoAssinado?.name 
    })
    alert('Assinatura processada com sucesso!')
    onClose()
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
                <div className="flex items-center gap-2">
                  <Input
                    id="arquivo"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setArquivoAssinado(e.target.files?.[0] || null)}
                    required
                  />
                  <Button type="button" variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Faça o download do documento assinado do DocuSign e faça o upload aqui
                </p>
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
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <FileSignature className="w-4 h-4 mr-2" />
                  Confirmar Assinatura
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
    case 'rascunho': return 'bg-gray-100 text-gray-800'
    case 'aguardando_assinatura': return 'bg-yellow-100 text-yellow-800'
    case 'em_assinatura': return 'bg-blue-100 text-blue-800'
    case 'assinado': return 'bg-green-100 text-green-800'
    case 'rejeitado': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function CreateDocumentDialog({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    obraId: '',
    arquivo: null as File | null
  })
  const [assinantes, setAssinantes] = useState<Array<{
    userId: string, 
    ordem: number, 
    docuSignLink: string, 
    status: 'pendente' | 'aguardando' | 'assinado' | 'rejeitado'
  }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simular criação do documento
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Validar se todos os assinantes têm links preenchidos
    const assinantesCompletos = assinantes.map((assinante) => {
      const user = mockUsers.find(u => u.id === assinante.userId)
      return {
        ...assinante,
        userName: user?.name || 'Usuário',
        role: user?.role || 'funcionario',
        docuSignEnvelopeId: assinante.docuSignLink.split('/').pop() || '',
        dataEnvio: assinante.status === 'aguardando' ? new Date().toISOString() : undefined,
        emailEnviado: assinante.status === 'aguardando',
        dataEmailEnviado: assinante.status === 'aguardando' ? new Date().toISOString() : undefined
      }
    })
    
    const documentoCompleto = {
      ...formData,
      assinantes: assinantesCompletos
    }
    
    console.log('Criando documento com links preenchidos:', documentoCompleto)
    alert('Documento criado com sucesso! Links do DocuSign configurados conforme preenchido.')
    
    setIsSubmitting(false)
    onClose()
  }

  const addAssinante = () => {
    setAssinantes([...assinantes, { 
      userId: '', 
      ordem: assinantes.length + 1, 
      docuSignLink: '', 
      status: 'pendente' 
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
                  <Label htmlFor="obra">Obra *</Label>
                  <Select value={formData.obraId} onValueChange={(value) => setFormData({...formData, obraId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a obra" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockObras.map(obra => (
                        <SelectItem key={obra.id} value={obra.id}>
                          {obra.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    onChange={(e) => setFormData({...formData, arquivo: e.target.files?.[0] || null})}
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
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Ordem de Assinatura</Label>
                  <Button type="button" onClick={addAssinante} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Assinante
                  </Button>
                </div>
                
                
                {assinantes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Nenhum assinante adicionado</p>
                    <p className="text-sm">Clique em "Adicionar Assinante" para começar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assinantes.map((assinante, index) => {
                      const user = mockUsers.find(u => u.id === assinante.userId)
                      return (
                        <div key={index} className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{assinante.ordem}</Badge>
                              <span className="text-sm font-medium text-gray-700">Ordem de Assinatura</span>
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
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`assinante-${index}`}>Assinante *</Label>
                              <Select 
                                value={assinante.userId} 
                                onValueChange={(value) => updateAssinante(index, 'userId', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o assinante" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mockUsers.filter(u => u.status === 'ativo').map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.name} ({user.role})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor={`status-${index}`}>Status *</Label>
                              <Select 
                                value={assinante.status} 
                                onValueChange={(value) => updateAssinante(index, 'status', value)}
                              >
                                <SelectTrigger>
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
                          
                          <div className="mt-4">
                            <Label htmlFor={`link-${index}`}>Link DocuSign *</Label>
                            <Input
                              id={`link-${index}`}
                              value={assinante.docuSignLink}
                              onChange={(e) => updateAssinante(index, 'docuSignLink', e.target.value)}
                              placeholder="https://demo.docusign.net/signing/documents/..."
                              className="font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Cole aqui o link completo do envelope no DocuSign
                            </p>
                          </div>
                          
                          {user && (
                            <div className="mt-3 p-2 bg-white rounded border">
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium">{user.email}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || assinantes.length === 0 || assinantes.some(a => !a.userId || !a.docuSignLink)}
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

    // Simular delay de login
    await new Promise(resolve => setTimeout(resolve, 1000))

    const success = login(email, password)
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