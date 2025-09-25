"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  FileSignature, 
  Calendar, 
  Users, 
  ExternalLink, 
  Upload, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  Send,
  Eye,
  ChevronDown,
  ChevronRight,
  FileText,
  Edit,
  Save,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { mockDocumentos, mockUsers, Documento, AssinaturaOrdem } from '@/lib/mock-data'
import { useUser } from '@/lib/user-context'
import { obrasDocumentosApi, DocumentoObra, AssinaturaDocumento } from '@/lib/api-obras-documentos'
import { obrasApi } from '@/lib/api-obras'

export default function AssinaturaDocumentoPage() {
  const params = useParams()
  const router = useRouter()
  const { currentUser } = useUser()
  const [documento, setDocumento] = useState<DocumentoObra | null>(null)
  const [assinaturaAtual, setAssinaturaAtual] = useState<AssinaturaDocumento | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [arquivoAssinado, setArquivoAssinado] = useState<File | null>(null)
  const [observacoes, setObservacoes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedAssinatura, setExpandedAssinatura] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    titulo: '',
    descricao: '',
    status: ''
  })

  const documentoId = params.id as string

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const carregarDocumento = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Buscar documento específico
        const response = await obrasDocumentosApi.obterPorId(parseInt(documentoId))
        const docEncontrado = Array.isArray(response.data) ? response.data[0] : response.data
        
        if (docEncontrado) {
          setDocumento(docEncontrado)
          
          // Encontrar a assinatura do usuário atual
          const assinaturaUsuario = docEncontrado.assinaturas?.find(
            (ass: AssinaturaDocumento) => ass.user_id === parseInt(currentUser?.id?.toString() || '0')
          )
          setAssinaturaAtual(assinaturaUsuario || null)
        } else {
          setError('Documento não encontrado')
        }
      } catch (error: any) {
        console.error('Erro ao carregar documento:', error)
        setError(error.message || 'Erro ao carregar documento')
        
        // Fallback para mock data
        const mockDoc = mockDocumentos.find(doc => doc.id === documentoId)
        if (mockDoc) {
          setDocumento({
            id: parseInt(mockDoc.id),
            obra_id: parseInt(mockDoc.obraId),
            titulo: mockDoc.titulo,
            descricao: mockDoc.descricao,
            arquivo_original: mockDoc.arquivoOriginal,
            arquivo_assinado: mockDoc.arquivo,
            caminho_arquivo: mockDoc.arquivo,
            docu_sign_link: mockDoc.docuSignLink,
            docu_sign_envelope_id: undefined,
            status: mockDoc.status as any,
            proximo_assinante_id: undefined,
            created_by: 1,
            created_at: mockDoc.createdAt,
            updated_at: mockDoc.updatedAt,
            obra_nome: mockDoc.obraName,
            created_by_nome: 'Sistema',
            total_assinantes: mockDoc.ordemAssinatura.length,
            assinaturas_concluidas: mockDoc.ordemAssinatura.filter(a => a.status === 'assinado').length,
            progresso_percentual: Math.round((mockDoc.ordemAssinatura.filter(a => a.status === 'assinado').length / mockDoc.ordemAssinatura.length) * 100),
            assinaturas: mockDoc.ordemAssinatura.map(ass => ({
              id: parseInt(ass.userId),
              documento_id: parseInt(mockDoc.id),
              user_id: parseInt(ass.userId),
              ordem: ass.ordem,
              status: ass.status as any,
              tipo: 'interno' as 'interno' | 'cliente',
              docu_sign_link: ass.docuSignLink,
              docu_sign_envelope_id: undefined,
              data_envio: ass.dataEnvio ? new Date(ass.dataEnvio).toISOString() : undefined,
              data_assinatura: ass.dataAssinatura ? new Date(ass.dataAssinatura).toISOString() : undefined,
              arquivo_assinado: ass.arquivoAssinado,
              observacoes: ass.observacoes,
              email_enviado: ass.emailEnviado || false,
              data_email_enviado: ass.dataEmailEnviado ? new Date(ass.dataEmailEnviado).toISOString() : undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_nome: mockUsers.find(u => u.id === ass.userId)?.name || 'Usuário',
              user_email: mockUsers.find(u => u.id === ass.userId)?.email || '',
              user_cargo: mockUsers.find(u => u.id === ass.userId)?.role || ''
            })),
            historico: []
          })
          
          const assinaturaUsuario = mockDoc.ordemAssinatura.find(
            ass => ass.userId === currentUser?.id
          )
          if (assinaturaUsuario) {
            setAssinaturaAtual({
              id: parseInt(assinaturaUsuario.userId),
              documento_id: parseInt(mockDoc.id),
              user_id: parseInt(assinaturaUsuario.userId),
              ordem: assinaturaUsuario.ordem,
              status: assinaturaUsuario.status as any,
              tipo: 'interno' as 'interno' | 'cliente',
              docu_sign_link: assinaturaUsuario.docuSignLink,
              docu_sign_envelope_id: undefined,
              data_envio: assinaturaUsuario.dataEnvio ? new Date(assinaturaUsuario.dataEnvio).toISOString() : undefined,
              data_assinatura: assinaturaUsuario.dataAssinatura ? new Date(assinaturaUsuario.dataAssinatura).toISOString() : undefined,
              arquivo_assinado: assinaturaUsuario.arquivoAssinado,
              observacoes: assinaturaUsuario.observacoes,
              email_enviado: assinaturaUsuario.emailEnviado || false,
              data_email_enviado: assinaturaUsuario.dataEmailEnviado ? new Date(assinaturaUsuario.dataEmailEnviado).toISOString() : undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_nome: mockUsers.find(u => u.id === assinaturaUsuario.userId)?.name || 'Usuário',
              user_email: mockUsers.find(u => u.id === assinaturaUsuario.userId)?.email || '',
              user_cargo: mockUsers.find(u => u.id === assinaturaUsuario.userId)?.role || ''
            })
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (documentoId && currentUser) {
      carregarDocumento()
    }
  }, [documentoId, currentUser])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Carregando documento...</h3>
          <p className="text-gray-600">Aguarde enquanto buscamos o documento.</p>
        </div>
      </div>
    )
  }

  if (error || !documento) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error ? 'Erro ao carregar documento' : 'Documento não encontrado'}
          </h3>
          <p className="text-gray-600 mb-4">
            {error || 'O documento solicitado não existe ou você não tem acesso a ele.'}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso negado</h3>
          <p className="text-gray-600 mb-4">Você precisa estar logado para acessar este documento.</p>
          <Button onClick={() => router.push('/dashboard/assinatura')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Assinaturas
          </Button>
        </div>
      </div>
    )
  }

  const canSign = assinaturaAtual?.status === 'aguardando' && assinaturaAtual.user_id === parseInt(currentUser.id?.toString() || '0')
  const isAdmin = currentUser.role === 'admin'
  const progress = getProgressPercentage(documento)
  const nextSigner = getNextSigner(documento)
  const currentSigner = getCurrentSigner(documento)

  const handleUploadSignedDocument = async () => {
    if (!arquivoAssinado || !documento || !assinaturaAtual) return

    setIsLoading(true)
    try {
      // TODO: Implementar upload do documento assinado via API
      // Por enquanto, simular o upload
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Atualizar status da assinatura localmente
      if (assinaturaAtual) {
        assinaturaAtual.status = 'assinado'
        assinaturaAtual.data_assinatura = new Date().toISOString()
        assinaturaAtual.arquivo_assinado = arquivoAssinado.name
        assinaturaAtual.observacoes = observacoes
      }

      // Ativar próximo assinante se houver
      const nextAssinatura = documento.assinaturas?.find(a => a.ordem === (assinaturaAtual?.ordem || 0) + 1)
      if (nextAssinatura) {
        nextAssinatura.status = 'aguardando'
      }

      setDocumento({ ...documento })
      setIsUploadDialogOpen(false)
      setArquivoAssinado(null)
      setObservacoes('')
      
      // Mostrar sucesso
      alert('Documento assinado e enviado com sucesso!')
    } catch (error) {
      console.error('Erro ao enviar documento assinado:', error)
      alert('Erro ao enviar documento assinado')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectSignature = async () => {
    if (!assinaturaAtual) return

    const reason = prompt('Motivo da rejeição:')
    if (!reason) return

    setIsLoading(true)
    try {
      // TODO: Implementar rejeição via API
      assinaturaAtual.status = 'rejeitado'
      assinaturaAtual.observacoes = reason
      setDocumento({ ...documento })
      alert('Assinatura rejeitada')
    } catch (error) {
      console.error('Erro ao rejeitar assinatura:', error)
      alert('Erro ao rejeitar assinatura')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadDocument = async () => {
    if (!documento) return

    try {
      setIsLoading(true)
      const { download_url, nome_arquivo } = await obrasDocumentosApi.download(documento.obra_id, documento.id)
      
      // Abrir documento em nova aba
      window.open(download_url, '_blank')
    } catch (error) {
      console.error('Erro ao abrir documento:', error)
      alert('Erro ao abrir documento')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartEdit = () => {
    if (!documento) return
    
    setEditData({
      titulo: documento.titulo,
      descricao: documento.descricao || '',
      status: documento.status
    })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditData({
      titulo: '',
      descricao: '',
      status: ''
    })
  }

  const handleSaveEdit = async () => {
    if (!documento) return

    try {
      setIsLoading(true)
      const response = await obrasDocumentosApi.atualizar(documento.obra_id, documento.id, editData)
      
      // Atualizar documento local
      setDocumento({
        ...documento,
        titulo: editData.titulo,
        descricao: editData.descricao,
        status: editData.status as any,
        updated_at: new Date().toISOString()
      })
      
      setIsEditing(false)
      alert('Documento atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar documento:', error)
      alert('Erro ao atualizar documento')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editData.titulo}
                  onChange={(e) => setEditData({...editData, titulo: e.target.value})}
                  className="text-2xl font-bold border-0 p-0 h-auto"
                  placeholder="Título do documento"
                />
                <Textarea
                  value={editData.descricao}
                  onChange={(e) => setEditData({...editData, descricao: e.target.value})}
                  className="text-gray-600 border-0 p-0 h-auto resize-none"
                  placeholder="Descrição do documento"
                  rows={2}
                />
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900">{documento.titulo}</h1>
                <p className="text-gray-600">{documento.descricao}</p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(documento.status)}>
            {documento.status}
          </Badge>
          
          {/* Botão de Download */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownloadDocument}
            disabled={isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            Ver Documento
          </Button>
          
          {/* Botões de Edição (apenas para admin) */}
          {isAdmin && (
            <>
              {!isEditing ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleStartEdit}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isLoading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Informações do Documento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="w-5 h-5" />
            Informações do Documento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Obra</Label>
              <p className="text-sm text-gray-900">{documento.obra_nome}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Criado em</Label>
              <p className="text-sm text-gray-900">
                {format(new Date(documento.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Status Atual</Label>
              {isEditing ? (
                <Select 
                  value={editData.status} 
                  onValueChange={(value) => setEditData({...editData, status: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="aguardando_assinatura">Aguardando Assinatura</SelectItem>
                    <SelectItem value="em_assinatura">Em Assinatura</SelectItem>
                    <SelectItem value="assinado">Assinado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-900">{documento.status}</p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Progresso</Label>
              <p className="text-sm text-gray-900">{progress}% concluído</p>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-600">Progresso das Assinaturas</Label>
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sua Assinatura */}
      {assinaturaAtual && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sua Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Ordem</Label>
                <p className="text-sm text-gray-900">{assinaturaAtual.ordem}º</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <Badge variant={getStatusVariant(assinaturaAtual.status)}>
                  {assinaturaAtual.status}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Link DocuSign</Label>
                <p className="text-sm text-gray-900">
                  {assinaturaAtual.docu_sign_link ? (
                    <a 
                      href={assinaturaAtual.docu_sign_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir no DocuSign
                    </a>
                  ) : (
                    'Link não disponível'
                  )}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Data de Envio</Label>
                <p className="text-sm text-gray-900">
                  {assinaturaAtual.data_envio ? 
                    format(new Date(assinaturaAtual.data_envio), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 
                    'Não enviado'
                  }
                </p>
              </div>
            </div>

            {assinaturaAtual.arquivo_assinado && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Arquivo Assinado</Label>
                <p className="text-sm text-gray-900">{assinaturaAtual.arquivo_assinado}</p>
              </div>
            )}

            {assinaturaAtual.observacoes && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Observações</Label>
                <p className="text-sm text-gray-900">{assinaturaAtual.observacoes}</p>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-2 pt-4">
              {canSign && (
                <>
                  <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Upload className="w-4 h-4 mr-2" />
                        Enviar Documento Assinado
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Enviar Documento Assinado</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="arquivo">Arquivo Assinado *</Label>
                          <Input
                            id="arquivo"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setArquivoAssinado(e.target.files?.[0] || null)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="observacoes">Observações</Label>
                          <Textarea
                            id="observacoes"
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Observações sobre a assinatura..."
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleUploadSignedDocument}
                            disabled={!arquivoAssinado || isLoading}
                            className="flex-1"
                          >
                            {isLoading ? (
                              <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Enviar
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsUploadDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleRejectSignature}
                    disabled={isLoading}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Rejeitar
                  </Button>
                </>
              )}

              {assinaturaAtual.status === 'assinado' && (
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Documento
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ordem de Assinaturas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Ordem de Assinaturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documento.assinaturas
              ?.sort((a, b) => a.ordem - b.ordem)
              .map((assinatura, index) => {
                const isCurrentUser = assinatura.user_id === parseInt(currentUser.id?.toString() || '0')
                const isExpanded = expandedAssinatura === assinatura.user_id.toString()
                
                return (
                  <div 
                    key={assinatura.user_id}
                    className={`rounded-lg border ${
                      isCurrentUser ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    {/* Cabeçalho da assinatura */}
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setExpandedAssinatura(isExpanded ? null : assinatura.user_id.toString())}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {assinatura.ordem}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {assinatura.user_nome || 'Usuário não encontrado'}
                          </p>
                          <p className="text-sm text-gray-600">{assinatura.user_cargo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(assinatura.status)}>
                          {assinatura.status}
                        </Badge>
                        {isCurrentUser && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Você
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" className="p-1">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Detalhes expandidos */}
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t bg-white">
                        <div className="pt-3 space-y-4">
                          {/* Informações do usuário */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Nome Completo</Label>
                              <p className="text-sm text-gray-900">{assinatura.user_nome || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Cargo</Label>
                              <p className="text-sm text-gray-900">{assinatura.user_cargo || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Email</Label>
                              <p className="text-sm text-gray-900">{assinatura.user_email || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                              <Badge variant="outline" className="capitalize">
                                {assinatura.tipo}
                              </Badge>
                            </div>
                          </div>

                          {/* Status da assinatura */}
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Status da Assinatura</Label>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant={getStatusVariant(assinatura.status)}>
                                {assinatura.status}
                              </Badge>
                              {assinatura.data_envio && (
                                <span className="text-xs text-gray-500">
                                  Enviado em: {format(new Date(assinatura.data_envio), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </span>
                              )}
                              {assinatura.data_assinatura && (
                                <span className="text-xs text-gray-500">
                                  Assinado em: {format(new Date(assinatura.data_assinatura), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Link DocuSign */}
                          {assinatura.docu_sign_link && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Link DocuSign</Label>
                              <div className="mt-1 flex items-center gap-2">
                                <Input
                                  value={assinatura.docu_sign_link}
                                  readOnly
                                  className="text-xs font-mono"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(assinatura.docu_sign_link, '_blank')}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Ações de Assinatura */}
                          {isCurrentUser && assinatura.status === 'aguardando' && (
                            <div className="border-t pt-4">
                              <Label className="text-sm font-medium text-gray-700">Ações de Assinatura</Label>
                              <div className="mt-2 space-y-3">
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <p className="text-sm text-blue-800 font-medium mb-2">
                                    É sua vez de assinar este documento!
                                  </p>
                                  <p className="text-xs text-blue-600 mb-3">
                                    Acesse o link DocuSign acima, assine o documento e faça o upload do arquivo assinado.
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => window.open(assinatura.docu_sign_link, '_blank')}
                                      className="flex-1"
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      Abrir DocuSign
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setIsUploadDialogOpen(true)}
                                    >
                                      <Upload className="w-4 h-4 mr-2" />
                                      Upload Assinado
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Status de Aguardando */}
                          {isCurrentUser && assinatura.status === 'pendente' && (
                            <div className="border-t pt-4">
                              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-sm text-yellow-800 font-medium mb-1">
                                  Aguardando sua vez
                                </p>
                                <p className="text-xs text-yellow-600">
                                  Você será notificado quando for sua vez de assinar.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Status de Rejeitado */}
                          {isCurrentUser && assinatura.status === 'rejeitado' && (
                            <div className="border-t pt-4">
                              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-sm text-red-800 font-medium mb-1">
                                  ❌ Documento rejeitado
                                </p>
                                <p className="text-xs text-red-600 mb-3">
                                  Este documento foi rejeitado. Entre em contato com o administrador para mais informações.
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(assinatura.docu_sign_link, '_blank')}
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Ver no DocuSign
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Arquivo assinado */}
                          {assinatura.arquivo_assinado && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Arquivo Assinado</Label>
                              <div className="mt-1 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-900">{assinatura.arquivo_assinado}</span>
                                <Button size="sm" variant="outline">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Ações para usuários que já assinaram */}
                          {isCurrentUser && assinatura.status === 'assinado' && (
                            <div className="border-t pt-4">
                              <Label className="text-sm font-medium text-gray-700">Ações Disponíveis</Label>
                              <div className="mt-2 space-y-2">
                                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                  <p className="text-sm text-green-800 font-medium mb-2">
                                    ✅ Documento assinado com sucesso!
                                  </p>
                                  <p className="text-xs text-green-600 mb-3">
                                    Você já assinou este documento. Pode baixar o arquivo assinado.
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1"
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Baixar Assinado
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(assinatura.docu_sign_link, '_blank')}
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      Ver no DocuSign
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Observações */}
                          {assinatura.observacoes && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Observações</Label>
                              <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                                {assinatura.observacoes}
                              </p>
                            </div>
                          )}

                          {/* Histórico de emails */}
                          {assinatura.email_enviado && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Notificação por Email</Label>
                              <div className="mt-1 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-gray-900">Email enviado</span>
                                {assinatura.data_email_enviado && (
                                  <span className="text-xs text-gray-500">
                                    em {format(new Date(assinatura.data_email_enviado), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Funções auxiliares
function getProgressPercentage(documento: DocumentoObra): number {
  const total = documento.assinaturas?.length || 0
  const assinados = documento.assinaturas?.filter(a => a.status === 'assinado').length || 0
  return total > 0 ? Math.round((assinados / total) * 100) : 0
}

function getNextSigner(documento: DocumentoObra): AssinaturaDocumento | null {
  return documento.assinaturas?.find(a => a.status === 'aguardando') || null
}

function getCurrentSigner(documento: DocumentoObra): AssinaturaDocumento | null {
  return documento.assinaturas?.find(a => a.status === 'aguardando') || null
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'assinado':
      return 'default'
    case 'aguardando':
      return 'secondary'
    case 'rejeitado':
      return 'destructive'
    default:
      return 'outline'
  }
}
