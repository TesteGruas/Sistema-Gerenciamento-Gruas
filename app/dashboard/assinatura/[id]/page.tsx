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
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { mockDocumentos, mockUsers, Documento, AssinaturaOrdem } from '@/lib/mock-data'
import { useUser } from '@/lib/user-context'

export default function AssinaturaDocumentoPage() {
  const params = useParams()
  const router = useRouter()
  const { currentUser } = useUser()
  const [documento, setDocumento] = useState<Documento | null>(mockDocumentos[0] || null)
  const [assinaturaAtual, setAssinaturaAtual] = useState<AssinaturaOrdem | null>(mockDocumentos[0]?.ordemAssinatura[0] || null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [arquivoAssinado, setArquivoAssinado] = useState<File | null>(null)
  const [observacoes, setObservacoes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [expandedAssinatura, setExpandedAssinatura] = useState<string | null>(null)

  const documentoId = params.id as string

  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') return
    
    // Simular carregamento
    const timer = setTimeout(() => {
      if (mockDocumentos.length > 0) {
        console.log('Definindo primeiro documento para teste')
        setDocumento(mockDocumentos[0])
        setAssinaturaAtual(mockDocumentos[0].ordemAssinatura[0] || null)
      }
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

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

  if (!documento) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Documento não encontrado</h3>
          <p className="text-gray-600 mb-4">O documento solicitado não existe ou você não tem acesso a ele.</p>
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

  const canSign = assinaturaAtual?.status === 'aguardando' && assinaturaAtual.userId === currentUser.id
  const isAdmin = currentUser.role === 'admin'
  const progress = getProgressPercentage(documento)
  const nextSigner = getNextSigner(documento)
  const currentSigner = getCurrentSigner(documento)

  const handleUploadSignedDocument = async () => {
    if (!arquivoAssinado) return

    setIsLoading(true)
    try {
      // Simular upload do documento assinado
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Atualizar status da assinatura
      if (assinaturaAtual) {
        assinaturaAtual.status = 'assinado'
        assinaturaAtual.dataAssinatura = new Date().toISOString()
        assinaturaAtual.arquivoAssinado = arquivoAssinado.name
        assinaturaAtual.observacoes = observacoes
      }

      // Ativar próximo assinante se houver
      const nextAssinatura = documento.ordemAssinatura.find(a => a.ordem === (assinaturaAtual?.ordem || 0) + 1)
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
      assinaturaAtual.status = 'rejeitado'
      assinaturaAtual.observacoes = reason
      setDocumento({ ...documento })
      alert('Assinatura rejeitada')
    } catch (error) {
      alert('Erro ao rejeitar assinatura')
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{documento.titulo}</h1>
            <p className="text-gray-600">{documento.descricao}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(documento.status)}>
            {documento.status}
          </Badge>
          {isAdmin && (
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>
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
              <p className="text-sm text-gray-900">{documento.obraName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Criado em</Label>
              <p className="text-sm text-gray-900">
                {format(new Date(documento.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Status Atual</Label>
              <p className="text-sm text-gray-900">{documento.status}</p>
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
                  {assinaturaAtual.docuSignLink ? (
                    <a 
                      href={assinaturaAtual.docuSignLink} 
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
                  {assinaturaAtual.dataEnvio ? 
                    format(new Date(assinaturaAtual.dataEnvio), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 
                    'Não enviado'
                  }
                </p>
              </div>
            </div>

            {assinaturaAtual.arquivoAssinado && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Arquivo Assinado</Label>
                <p className="text-sm text-gray-900">{assinaturaAtual.arquivoAssinado}</p>
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
            {documento.ordemAssinatura
              .sort((a, b) => a.ordem - b.ordem)
              .map((assinatura, index) => {
                const user = mockUsers.find(u => u.id === assinatura.userId)
                const isCurrentUser = assinatura.userId === currentUser.id
                const isExpanded = expandedAssinatura === assinatura.userId
                
                return (
                  <div 
                    key={assinatura.userId}
                    className={`rounded-lg border ${
                      isCurrentUser ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    {/* Cabeçalho da assinatura */}
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setExpandedAssinatura(isExpanded ? null : assinatura.userId)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {assinatura.ordem}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user?.name || 'Usuário não encontrado'}
                          </p>
                          <p className="text-sm text-gray-600">{user?.role}</p>
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
                              <p className="text-sm text-gray-900">{user?.name || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Cargo</Label>
                              <p className="text-sm text-gray-900">{user?.role || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Email</Label>
                              <p className="text-sm text-gray-900">{user?.email || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Obra Vinculada</Label>
                              <p className="text-sm text-gray-900">{user?.obraName || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Status da assinatura */}
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Status da Assinatura</Label>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant={getStatusVariant(assinatura.status)}>
                                {assinatura.status}
                              </Badge>
                              {assinatura.dataEnvio && (
                                <span className="text-xs text-gray-500">
                                  Enviado em: {format(new Date(assinatura.dataEnvio), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </span>
                              )}
                              {assinatura.dataAssinatura && (
                                <span className="text-xs text-gray-500">
                                  Assinado em: {format(new Date(assinatura.dataAssinatura), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Link DocuSign */}
                          {assinatura.docuSignLink && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Link DocuSign</Label>
                              <div className="mt-1 flex items-center gap-2">
                                <Input
                                  value={assinatura.docuSignLink}
                                  readOnly
                                  className="text-xs font-mono"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(assinatura.docuSignLink, '_blank')}
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
                                      onClick={() => window.open(assinatura.docuSignLink, '_blank')}
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
                                    onClick={() => window.open(assinatura.docuSignLink, '_blank')}
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Ver no DocuSign
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Arquivo assinado */}
                          {assinatura.arquivoAssinado && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Arquivo Assinado</Label>
                              <div className="mt-1 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-900">{assinatura.arquivoAssinado}</span>
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
                                      onClick={() => window.open(assinatura.docuSignLink, '_blank')}
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
                          {assinatura.emailEnviado && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Notificação por Email</Label>
                              <div className="mt-1 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-gray-900">Email enviado</span>
                                {assinatura.dataEmailEnviado && (
                                  <span className="text-xs text-gray-500">
                                    em {format(new Date(assinatura.dataEmailEnviado), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
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
function getProgressPercentage(documento: Documento): number {
  const total = documento.ordemAssinatura.length
  const assinados = documento.ordemAssinatura.filter(a => a.status === 'assinado').length
  return total > 0 ? Math.round((assinados / total) * 100) : 0
}

function getNextSigner(documento: Documento): AssinaturaOrdem | null {
  return documento.ordemAssinatura.find(a => a.status === 'aguardando') || null
}

function getCurrentSigner(documento: Documento): AssinaturaOrdem | null {
  return documento.ordemAssinatura.find(a => a.status === 'aguardando') || null
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
