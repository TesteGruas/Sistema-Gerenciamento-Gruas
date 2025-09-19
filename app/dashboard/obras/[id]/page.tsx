"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  RefreshCw
} from "lucide-react"
import { mockObras, mockGruas, getGruasByObra, getCustosByObra, getHistoricoByGrua, getDocumentosByObra } from "@/lib/mock-data"
import { Progress } from "@/components/ui/progress"
import { useParams } from "next/navigation"

export default function ObraDetailsPage() {
  const params = useParams()
  const obraId = params.id as string
  const obra = mockObras.find(o => o.id === obraId)
  
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="gruas">Gruas</TabsTrigger>
          <TabsTrigger value="custos">Custos</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
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
      </Tabs>
    </div>
  )
}
