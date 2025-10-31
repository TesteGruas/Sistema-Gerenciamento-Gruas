"use client"

import { useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
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
import { useUser } from '@/lib/user-context'
import { obrasDocumentosApi, DocumentoObra, AssinaturaDocumento } from '@/lib/api-obras-documentos'
import { obrasApi } from '@/lib/api-obras'
import { isAdmin as checkIsAdmin } from '@/lib/user-utils'

export default function AssinaturaDocumentoPage() {
  const { toast } = useToast()
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
  const [uploadDialogOpen, setUploadDialogOpen] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadObservacoes, setUploadObservacoes] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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
        toast({
          title: "Erro ao carregar documento",
          description: error.message || "Não foi possível carregar o documento. Tente novamente.",
          variant: "destructive"
        })
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
  const isAdmin = checkIsAdmin(currentUser)
  const progress = getProgressPercentage(documento)
  const nextSigner = getNextSigner(documento)
  const currentSigner = getCurrentSigner(documento)

  const handleUploadSignedDocument = async () => {
    if (!arquivoAssinado || !documento || !assinaturaAtual) return

    setIsLoading(true)
    try {
      // Upload real do documento assinado via API
      const formData = new FormData()
      formData.append('arquivo', arquivoAssinado)
      if (observacoes) {
        formData.append('observacoes', observacoes)
      }

      // Fazer upload do arquivo assinado
      const uploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/obras-documentos/${documento.id}/assinaturas/${assinaturaAtual.id}/upload-assinado`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: formData
        }
      )

      if (!uploadResponse.ok) {
        throw new Error('Erro ao fazer upload do documento assinado')
      }

      const uploadData = await uploadResponse.json()
      
      // Recarregar documento atualizado
      const updatedDoc = await obrasDocumentosApi.obterPorId(documento.id)
      const docAtualizado = Array.isArray(updatedDoc.data) ? updatedDoc.data[0] : updatedDoc.data
      setDocumento(docAtualizado)
      
      // Atualizar assinatura atual
      const assinaturaUsuario = docAtualizado.assinaturas?.find(
        (ass: AssinaturaDocumento) => ass.user_id === parseInt(currentUser?.id?.toString() || '0')
      )
      setAssinaturaAtual(assinaturaUsuario || null)
      
      setIsUploadDialogOpen(false)
      setArquivoAssinado(null)
      setObservacoes('')
      
      // Mostrar sucesso
      toast({
        title: "Sucesso",
        description: "Documento assinado e enviado com sucesso!",
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao enviar documento assinado:', error)
      toast({
        title: "Erro",
        description: "Erro ao enviar documento assinado",
        variant: "destructive"
      })
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
      toast({
        title: "Informação",
        description: "Assinatura rejeitada",
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao rejeitar assinatura:', error)
      toast({
        title: "Informação",
        description: "Erro ao rejeitar assinatura",
        variant: "default"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadAssinatura = async (assinaturaId: string) => {
    if (!uploadFile) return

    setIsLoading(true)
    try {
      console.log('=== DEBUG UPLOAD ASSINATURA ===')
      console.log('Assinatura ID:', assinaturaId)
      console.log('Arquivo:', uploadFile.name)
      console.log('Observações:', uploadObservacoes)

      // Importar a função de upload
      const { uploadArquivoAssinado } = await import('@/lib/api-assinaturas')
      
      // Fazer upload real do arquivo assinado
      const response = await uploadArquivoAssinado(
        parseInt(assinaturaId), // ID da assinatura
        uploadFile,
        uploadObservacoes
      )

      if (response.success) {
        // Atualizar status da assinatura
        const assinatura = documento.assinaturas?.find(a => a.id.toString() === assinaturaId)
        if (assinatura) {
          assinatura.status = 'assinado'
          assinatura.data_assinatura = new Date().toISOString()
          assinatura.arquivo_assinado = response.data?.arquivo_assinado || uploadFile.name
          assinatura.observacoes = uploadObservacoes
        }

        // Ativar próximo assinante se houver
        const nextAssinatura = documento.assinaturas?.find(a => a.ordem === (assinatura?.ordem || 0) + 1)
        if (nextAssinatura) {
          nextAssinatura.status = 'aguardando'
        }

        // Atualizar status do documento
        const assinaturasCompletas = documento.assinaturas?.filter(a => a.status === 'assinado').length || 0
        const totalAssinaturas = documento.assinaturas?.length || 0
        
        if (assinaturasCompletas + 1 >= totalAssinaturas) {
          documento.status = 'assinado'
        } else {
          documento.status = 'em_assinatura'
        }

        setDocumento({ ...documento })
        setUploadDialogOpen(null)
        setUploadFile(null)
        setUploadObservacoes('')
        
        toast({
          title: "Sucesso",
          description: response.message || "Arquivo assinado enviado com sucesso!",
          variant: "default"
        })
      } else {
        toast({
          title: "Erro",
          description: response.message || "Erro ao enviar arquivo assinado",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Erro ao enviar arquivo assinado:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro interno do servidor",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Extrair nome legível do arquivo da URL
  const getArquivoNome = (arquivoUrl: string | undefined): string => {
    if (!arquivoUrl) return 'Arquivo não disponível'
    
    // Se for uma URL do Supabase Storage, extrair o nome do arquivo
    if (arquivoUrl.includes('supabase.co/storage')) {
      const parts = arquivoUrl.split('/')
      const filename = parts[parts.length - 1]
      // Remover o hash único e manter apenas a extensão
      const match = filename.match(/assinado_\d+_([^.]+)\.(.+)$/)
      if (match) {
        return `documento_assinado.${match[2]}`
      }
      return filename
    }
    
    // Se for apenas um nome de arquivo
    return arquivoUrl
  }

  const handleDownloadArquivoAssinado = async (arquivoUrl: string, nomeArquivo?: string) => {
    if (!arquivoUrl) return

    try {
      setIsLoading(true)
      
      // Se for uma URL completa, abrir diretamente
      if (arquivoUrl.startsWith('http')) {
        window.open(arquivoUrl, '_blank')
        toast({
          title: "Download",
          description: "Arquivo aberto em nova aba",
          variant: "default"
        })
        return
      }

      // Se for apenas nome do arquivo, tentar buscar da API
      toast({
        title: "Download",
        description: "Baixando arquivo assinado...",
        variant: "default"
      })
      
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error)
      toast({
        title: "Erro",
        description: "Não foi possível baixar o arquivo assinado",
        variant: "destructive"
      })
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
      toast({
        title: "Informação",
        description: "Erro ao abrir documento",
        variant: "default"
      })
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
    setIsEditDialogOpen(true)
  }

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
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
      
      setIsEditDialogOpen(false)
      toast({
        title: "Sucesso",
        description: "Documento atualizado com sucesso!",
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao atualizar documento:', error)
      toast({
        title: "Informação",
        description: "Erro ao atualizar documento",
        variant: "default"
      })
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
            <h1 className="text-3xl font-bold text-gray-900">{documento.titulo}</h1>
            <p className="text-gray-600">{documento.descricao}</p>
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleStartEdit}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
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
              <p className="text-sm text-gray-900">{documento.status}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Progresso</Label>
              <p className="text-sm text-gray-900">{progress}% concluído</p>
            </div>
            {/* Link de assinatura (apenas se preenchido) */}
            {documento.link_assinatura && (
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-600">Link para Assinatura</Label>
                <div className="mt-1 flex items-center gap-2">
                  <a 
                    href={documento.link_assinatura} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Acessar Link de Assinatura
                  </a>
                </div>
              </div>
            )}
          </div>
          
          {/* Arquivo Original */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium text-gray-600 mb-3 block">Arquivo Original</Label>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {documento.arquivo_original || 'documento.pdf'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Arquivo para assinatura
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownloadDocument}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Este é o documento original que deve ser assinado pelos usuários listados abaixo.
            </p>
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
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-600 mb-3 block">Arquivo Assinado</Label>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <FileSignature className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getArquivoNome(assinaturaAtual.arquivo_assinado)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Documento assinado por você
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-100"
                    onClick={() => handleDownloadArquivoAssinado(assinaturaAtual.arquivo_assinado || '')}
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </Button>
                </div>
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
                        Assinar Documento
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Assinar Documento</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Link de Assinatura (apenas se preenchido) */}
                        {documento.link_assinatura && (
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-3">
                              <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-medium text-blue-900 mb-2">Link para Assinatura</h4>
                                <p className="text-sm text-blue-700 mb-3">
                                  Acesse o link abaixo para assinar o documento externamente:
                                </p>
                                <a 
                                  href={documento.link_assinatura} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Abrir Link de Assinatura
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Upload do Arquivo Assinado */}
                        <div>
                          <Label htmlFor="arquivo" className="text-base font-medium">
                            Upload do Documento Assinado *
                          </Label>
                          <p className="text-sm text-gray-600 mb-3">
                            Faça o upload do documento já assinado (PDF, DOC, DOCX)
                          </p>
                          <Input
                            id="arquivo"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setArquivoAssinado(e.target.files?.[0] || null)}
                            className="mt-1"
                          />
                          {arquivoAssinado && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                              ✓ Arquivo selecionado: {arquivoAssinado.name}
                            </div>
                          )}
                        </div>

                        {/* Observações */}
                        <div>
                          <Label htmlFor="observacoes" className="text-base font-medium">
                            Observações (Opcional)
                          </Label>
                          <Textarea
                            id="observacoes"
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Adicione observações sobre a assinatura..."
                            className="mt-1"
                            rows={3}
                          />
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex gap-3 pt-4 border-t">
                          <Button 
                            onClick={handleUploadSignedDocument}
                            disabled={!arquivoAssinado || isLoading}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {isLoading ? (
                              <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Processando...
                              </>
                            ) : (
                              <>
                                <FileSignature className="w-4 h-4 mr-2" />
                                Confirmar Assinatura
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsUploadDialogOpen(false)
                              setArquivoAssinado(null)
                              setObservacoes('')
                            }}
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

                          {/* Upload de Arquivo Assinado */}
                          <div className="border-t pt-4">
                            <Label className="text-sm font-medium text-gray-700 mb-3 block">
                              Upload de Arquivo Assinado
                            </Label>
                            
                            {assinatura.arquivo_assinado ? (
                              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <FileSignature className="w-5 h-5 text-green-600" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {getArquivoNome(assinatura.arquivo_assinado)}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Arquivo assinado enviado
                                      </p>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-green-600 border-green-300 hover:bg-green-100"
                                    onClick={() => handleDownloadArquivoAssinado(assinatura.arquivo_assinado || '')}
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Baixar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <p className="text-sm text-blue-700 mb-2">
                                    Faça o upload do documento assinado por este responsável
                                  </p>
                                  <Button
                                    size="sm"
                                    onClick={() => setUploadDialogOpen(assinatura.id.toString())}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Enviar Arquivo Assinado
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

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
                                <span className="text-sm text-gray-900">{getArquivoNome(assinatura.arquivo_assinado)}</span>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDownloadArquivoAssinado(assinatura.arquivo_assinado || '')}
                                >
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
                                      onClick={() => handleDownloadArquivoAssinado(assinatura.arquivo_assinado || '')}
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

      {/* Diálogo de Edição de Documento */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Documento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Informações do Documento */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <FileSignature className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-2">Documento Atual</h4>
                  <p className="text-sm text-blue-700">
                    <strong>Título:</strong> {documento.titulo}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Status:</strong> {documento.status}
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Edite as informações abaixo conforme necessário
                  </p>
                </div>
              </div>
            </div>

            {/* Formulário de Edição */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-titulo" className="text-base font-medium">
                  Título do Documento *
                </Label>
                <Input
                  id="edit-titulo"
                  value={editData.titulo}
                  onChange={(e) => setEditData({...editData, titulo: e.target.value})}
                  placeholder="Ex: Contrato de Prestação de Serviços"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-descricao" className="text-base font-medium">
                  Descrição
                </Label>
                <Textarea
                  id="edit-descricao"
                  value={editData.descricao}
                  onChange={(e) => setEditData({...editData, descricao: e.target.value})}
                  placeholder="Descreva o conteúdo e propósito do documento..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-status" className="text-base font-medium">
                  Status do Documento *
                </Label>
                <Select 
                  value={editData.status} 
                  onValueChange={(value) => setEditData({...editData, status: value})}
                >
                  <SelectTrigger className="mt-1">
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
                <p className="text-xs text-gray-500 mt-1">
                  Altere o status do documento conforme necessário
                </p>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                onClick={handleSaveEdit}
                disabled={isLoading || !editData.titulo.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Upload de Arquivo Assinado */}
      <Dialog open={!!uploadDialogOpen} onOpenChange={(open) => !open && setUploadDialogOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload de Arquivo Assinado</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Informações do responsável */}
            {uploadDialogOpen && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-2">Responsável</h4>
                    <p className="text-sm text-blue-700">
                      {documento.assinaturas?.find(a => a.user_id.toString() === uploadDialogOpen)?.user_nome || 'Usuário'}
                    </p>
                    <p className="text-xs text-blue-600">
                      Faça o upload do documento assinado por este responsável
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload do Arquivo */}
            <div>
              <Label htmlFor="upload-file" className="text-base font-medium">
                Arquivo Assinado *
              </Label>
              <p className="text-sm text-gray-600 mb-3">
                Selecione o arquivo já assinado por este responsável
              </p>
              <Input
                id="upload-file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  console.log('=== DEBUG UPLOAD RESPONSÁVEL ===')
                  console.log('Arquivo selecionado:', file)
                  console.log('Nome:', file?.name)
                  console.log('Tamanho:', file?.size)
                  console.log('Tipo:', file?.type)
                  setUploadFile(file)
                }}
                className="mt-1"
              />
              {uploadFile && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  ✅ Arquivo selecionado: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="upload-observacoes" className="text-base font-medium">
                Observações (Opcional)
              </Label>
              <Textarea
                id="upload-observacoes"
                value={uploadObservacoes}
                onChange={(e) => setUploadObservacoes(e.target.value)}
                placeholder="Adicione observações sobre a assinatura..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                onClick={() => uploadDialogOpen && handleUploadAssinatura(uploadDialogOpen)}
                disabled={!uploadFile || isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <FileSignature className="w-4 h-4 mr-2" />
                    Confirmar Upload
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setUploadDialogOpen(null)
                  setUploadFile(null)
                  setUploadObservacoes('')
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
