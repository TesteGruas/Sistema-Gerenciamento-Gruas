"use client"

import { useState, useEffect, useRef } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  FileSignature, 
  Download, 
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Wifi,
  WifiOff,
  PenTool,
  Trash2,
  Save,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as documentosApi from "@/lib/api-documentos"

type Documento = documentosApi.DocumentoFuncionario

export default function PWADocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [documentoSelecionado, setDocumentoSelecionado] = useState<Documento | null>(null)
  const [isAssinando, setIsAssinando] = useState(false)
  const [arquivoAssinado, setArquivoAssinado] = useState<File | null>(null)
  const [tipoAssinatura, setTipoAssinatura] = useState<'digital' | 'arquivo'>('digital')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const { toast } = useToast()

  // Carregar dados do usuário
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      }
    }
  }, [])

  // Verificar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Carregar documentos
  useEffect(() => {
    if (user?.id) {
      carregarDocumentos()
    }
  }, [user])

  // Sincronizar fila quando ficar online
  useEffect(() => {
    if (isOnline && user?.id) {
      sincronizarFilaDeAssinaturas()
    }
  }, [isOnline, user])

  const sincronizarFilaDeAssinaturas = async () => {
    const fila = JSON.parse(localStorage.getItem('fila_assinaturas_documentos') || '[]')
    
    if (fila.length === 0) return
    
    console.log(`Sincronizando ${fila.length} assinaturas de documentos pendentes...`)
    
    const filaComErros = []
    
    for (const item of fila) {
      try {
        await documentosApi.assinarDocumento(item.documentoId, {
          assinatura: item.assinatura,
          funcionario_id: item.funcionario_id,
          geoloc: item.geoloc,
          timestamp: item.timestamp
        })
      } catch (error) {
        console.error(`Erro ao sincronizar assinatura do documento ${item.documentoId}:`, error)
        filaComErros.push(item)
      }
    }
    
    // Atualizar fila apenas com itens que falharam
    localStorage.setItem('fila_assinaturas_documentos', JSON.stringify(filaComErros))
    
    if (filaComErros.length === 0) {
      toast({
        title: "Sincronização completa",
        description: `${fila.length} assinaturas sincronizadas com sucesso`,
        variant: "default"
      })
      
      // Recarregar dados atualizados
      carregarDocumentos()
    } else {
      toast({
        title: "Sincronização parcial",
        description: `${fila.length - filaComErros.length} de ${fila.length} assinaturas sincronizadas`,
        variant: "default"
      })
    }
  }

  const carregarDocumentos = async () => {
    setIsLoading(true)
    try {
      // Carregar do cache primeiro se offline
      if (!isOnline) {
        const cachedDocumentos = localStorage.getItem('cached_documentos_funcionario')
        
        if (cachedDocumentos) {
          setDocumentos(JSON.parse(cachedDocumentos))
          toast({
            title: "Modo Offline",
            description: "Exibindo documentos em cache. Conecte-se para atualizar.",
            variant: "default"
          })
        }
        
        return
      }

      // Buscar documentos pendentes de assinatura
      try {
        // Tentar primeiro com funcionario_id se disponível
        const funcionarioId = user.profile?.funcionario_id || user.funcionario_id
        if (funcionarioId) {
          console.log('🔍 [PWA Documentos] Usando funcionarioId:', funcionarioId, 'tipo:', typeof funcionarioId)
          const data = await documentosApi.getDocumentosFuncionario(funcionarioId)
          const documentosDoUsuario = data.filter((doc: any) => 
            doc.user_id === user.id.toString() && doc.status === 'aguardando'
          )
          setDocumentos(documentosDoUsuario)
        } else {
          // Fallback: usar API de documentos pendentes
          console.log('🔍 [PWA Documentos] Usando API de documentos pendentes')
          const data = await documentosApi.getDocumentosPendentes()
          setDocumentos(data)
        }
      } catch (error) {
        console.warn('Erro ao buscar documentos com funcionarioId, tentando API pendentes:', error)
        // Fallback: usar API de documentos pendentes
        const data = await documentosApi.getDocumentosPendentes()
        setDocumentos(data)
      }

    } catch (error: any) {
      console.error('Erro ao carregar documentos:', error)
      
      // Tentar carregar do cache em caso de erro
      const cachedDocumentos = localStorage.getItem('cached_documentos_funcionario')
      
      if (cachedDocumentos) {
        setDocumentos(JSON.parse(cachedDocumentos))
        toast({
          title: "Erro ao carregar documentos",
          description: "Exibindo documentos em cache. Verifique sua conexão.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Erro ao carregar documentos",
          description: error.message || "Não foi possível carregar os documentos. Verifique sua conexão.",
          variant: "destructive"
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const iniciarAssinatura = (documento: Documento) => {
    setDocumentoSelecionado(documento)
    setSignature(null)
  }

  const iniciarDesenho = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const desenhar = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000'
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const pararDesenho = () => {
    setIsDrawing(false)
  }

  const limparAssinatura = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignature(null)
  }

  const salvarAssinatura = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const signatureData = canvas.toDataURL('image/png')
    setSignature(signatureData)
  }

  const assinarDocumento = async () => {
    if (!documentoSelecionado) return

    // Verificar se tem assinatura digital ou arquivo
    if (tipoAssinatura === 'digital' && !signature) {
      toast({
        title: "Erro",
        description: "Por favor, faça a assinatura digital ou selecione um arquivo",
        variant: "destructive"
      })
      return
    }

    if (tipoAssinatura === 'arquivo' && !arquivoAssinado) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF para upload",
        variant: "destructive"
      })
      return
    }

    setIsAssinando(true)
    try {
      // Capturar geolocalização se disponível
      let geoloc: string | undefined
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          geoloc = `${position.coords.latitude}, ${position.coords.longitude}`
        } catch (error) {
          console.warn('Não foi possível obter geolocalização:', error)
        }
      }

      if (tipoAssinatura === 'digital') {
        // Assinatura digital - lógica original
        // Se offline, adicionar à fila de sincronização
        if (!isOnline) {
          const filaAssinaturas = JSON.parse(localStorage.getItem('fila_assinaturas_documentos') || '[]')
          filaAssinaturas.push({
            documentoId: documentoSelecionado.id,
            assinatura: signature,
            funcionario_id: user.profile?.funcionario_id || user.id,
            geoloc,
            timestamp: new Date().toISOString()
          })
          localStorage.setItem('fila_assinaturas_documentos', JSON.stringify(filaAssinaturas))
          
          // Atualizar UI localmente
          setDocumentos(prev => prev.map(doc => 
            doc.id === documentoSelecionado.id 
              ? { ...doc, status: 'assinado' as const, assinatura_url: signature || undefined }
              : doc
          ))
          
          // Atualizar cache
          const documentosAtualizados = documentos.map(doc => 
            doc.id === documentoSelecionado.id 
              ? { ...doc, status: 'assinado' as const, assinatura_url: signature || undefined }
              : doc
          )
          localStorage.setItem('cached_documentos_funcionario', JSON.stringify(documentosAtualizados))
          
          toast({
            title: "Assinatura pendente",
            description: "A assinatura será sincronizada quando você estiver online",
            variant: "default"
          })
          
          setDocumentoSelecionado(null)
          setSignature(null)
          setArquivoAssinado(null)
          setTipoAssinatura('digital')
          return
        }

        await documentosApi.assinarDocumento(documentoSelecionado.id, {
          assinatura: signature!,
          funcionario_id: user.funcionario_id || user.id,
          geoloc,
          timestamp: new Date().toISOString()
        })
      } else {
        // Upload de arquivo - nova funcionalidade
        if (!isOnline) {
          toast({
            title: "Erro",
            description: "Upload de arquivo requer conexão com internet",
            variant: "destructive"
          })
          return
        }

        // Importar a função de upload de assinaturas
        const { uploadArquivoAssinado } = await import('@/lib/api-assinaturas')
        
        // Usar o ID da assinatura diretamente
        await uploadArquivoAssinado(
          Number(documentoSelecionado.id),
          arquivoAssinado!,
          'Assinatura via PWA - Documentos'
        )
      }
      
      toast({
        title: "Documento assinado!",
        description: "O documento foi assinado com sucesso",
        variant: "default"
      })
      
      // Atualizar lista de documentos
      setDocumentos(prev => prev.map(doc => 
        doc.id === documentoSelecionado.id 
          ? { ...doc, status: 'assinado' as const, assinatura_url: tipoAssinatura === 'digital' ? (signature || undefined) : 'arquivo_assinado' }
          : doc
      ))
      
      // Atualizar cache
      const documentosAtualizados = documentos.map(doc => 
        doc.id === documentoSelecionado.id 
          ? { ...doc, status: 'assinado' as const, assinatura_url: tipoAssinatura === 'digital' ? (signature || undefined) : 'arquivo_assinado' }
          : doc
      )
      localStorage.setItem('cached_documentos_funcionario', JSON.stringify(documentosAtualizados))
      
      setDocumentoSelecionado(null)
      setSignature(null)
      setArquivoAssinado(null)
      setTipoAssinatura('digital')
      
    } catch (error: any) {
      console.error('Erro ao assinar documento:', error)
      toast({
        title: "Erro ao assinar documento",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive"
      })
    } finally {
      setIsAssinando(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendente': { className: 'bg-yellow-100 text-yellow-800', text: 'Pendente', icon: Clock },
      'aguardando': { className: 'bg-blue-100 text-blue-800', text: 'Aguardando', icon: Clock },
      'assinado': { className: 'bg-green-100 text-green-800', text: 'Assinado', icon: CheckCircle },
      'rejeitado': { className: 'bg-red-100 text-red-800', text: 'Rejeitado', icon: AlertCircle }
    }
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const isVencido = (documento: Documento) => {
    // Para obras_documento_assinaturas, não temos data de vencimento
    // Vamos usar a data de criação + 30 dias como exemplo
    if (!documento.created_at) return false
    const dataLimite = new Date(documento.created_at)
    dataLimite.setDate(dataLimite.getDate() + 30)
    return dataLimite < new Date()
  }

  const handleDownload = async (documento: Documento) => {
    try {
      const blob = await documentosApi.downloadDocumento(documento.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = documento.titulo || `documento_${documento.documento_id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Download iniciado",
        description: `Baixando ${documento.titulo || `Documento ${documento.documento_id}`}`,
        variant: "default"
      })
    } catch (error: any) {
      console.error('Erro ao baixar documento:', error)
      toast({
        title: "Erro ao baixar documento",
        description: error.message || "Tente novamente",
        variant: "destructive"
      })
    }
  }

  return (
    <ProtectedRoute permission="assinatura_digital:visualizar">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-600">Assine documentos pendentes</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-600" />
          )}
          <span className="text-sm text-gray-600">
            {isOnline ? "Online" : "Offline"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={carregarDocumentos}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Lista de documentos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando documentos...</p>
          </div>
        </div>
      ) : documentos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileSignature className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento encontrado</h3>
            <p className="text-gray-600">Não há documentos pendentes para assinatura.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documentos.map((documento) => {
            const statusConfig = getStatusBadge(documento.status)
            const StatusIcon = statusConfig.icon
            const vencido = isVencido(documento)

            return (
              <Card key={documento.id} className={`hover:shadow-md transition-shadow ${vencido ? 'border-red-200 bg-red-50' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileSignature className="w-5 h-5" />
                        {documento.titulo || `Documento ${documento.documento_id}`}
                        {vencido && <Badge className="bg-red-100 text-red-800">Vencido</Badge>}
                      </CardTitle>
                      <CardDescription>
                        {documento.tipo} • Ordem: {documento.ordem} • Criado em {formatarData(documento.created_at)}
                      </CardDescription>
                    </div>
                    <Badge className={statusConfig.className}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.text}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documento.descricao && (
                      <p className="text-sm text-gray-600">{documento.descricao}</p>
                    )}
                    
                    {documento.created_at && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Criado em: {formatarData(documento.created_at)}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {documento.status === 'aguardando' && (
                        <Button
                          onClick={() => iniciarAssinatura(documento)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <PenTool className="w-4 h-4 mr-2" />
                          Assinar
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(documento)}
                        disabled={!isOnline}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal de Assinatura */}
      {documentoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="w-5 h-5" />
                Assinar Documento
              </CardTitle>
              <CardDescription>
                {documentoSelecionado.titulo || `Documento ${documentoSelecionado.documento_id}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seletor de tipo de assinatura */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tipo de Assinatura
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={tipoAssinatura === 'digital' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTipoAssinatura('digital')}
                    className="flex-1"
                  >
                    <PenTool className="w-4 h-4 mr-1" />
                    Digital
                  </Button>
                  <Button
                    type="button"
                    variant={tipoAssinatura === 'arquivo' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTipoAssinatura('arquivo')}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Arquivo
                  </Button>
                </div>
              </div>

              {/* Assinatura Digital */}
              {tipoAssinatura === 'digital' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Assinatura Digital
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <canvas
                      ref={canvasRef}
                      width={300}
                      height={150}
                      className="border border-gray-200 rounded cursor-crosshair"
                      onMouseDown={iniciarDesenho}
                      onMouseMove={desenhar}
                      onMouseUp={pararDesenho}
                      onMouseLeave={pararDesenho}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={limparAssinatura}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Limpar
                    </Button>
                    <Button
                      onClick={salvarAssinatura}
                      variant="outline"
                      size="sm"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Salvar
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload de Arquivo */}
              {tipoAssinatura === 'arquivo' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Upload do Documento Assinado
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setArquivoAssinado(e.target.files?.[0] || null)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    
                    {arquivoAssinado && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 text-green-800">
                          <FileSignature className="w-4 h-4" />
                          <span className="font-medium">{arquivoAssinado.name}</span>
                          <span className="text-sm">({(arquivoAssinado.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      Faça o upload do documento PDF assinado fisicamente. Máximo 10MB.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={assinarDocumento}
                  disabled={
                    isAssinando || 
                    (tipoAssinatura === 'digital' && !signature) ||
                    (tipoAssinatura === 'arquivo' && !arquivoAssinado)
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isAssinando ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {isAssinando ? 'Assinando...' : 'Confirmar Assinatura'}
                </Button>
                <Button
                  onClick={() => {
                    setDocumentoSelecionado(null)
                    setSignature(null)
                    setArquivoAssinado(null)
                    setTipoAssinatura('digital')
                  }}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status de conexão */}
      {!isOnline && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <WifiOff className="w-5 h-5" />
              <div>
                <p className="font-medium">Modo Offline</p>
                <p className="text-sm">Os documentos serão sincronizados quando a conexão for restabelecida.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </ProtectedRoute>
  )
}
