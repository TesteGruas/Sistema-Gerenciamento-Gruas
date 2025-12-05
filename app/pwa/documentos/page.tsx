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
import { getFuncionarioIdWithFallback } from "@/lib/get-funcionario-id"
import * as documentosApi from "@/lib/api-documentos"
import { downloadDocumento } from "@/lib/api-assinaturas"

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
        const token = localStorage.getItem('access_token')
        if (token) {
          const funcionarioId = await getFuncionarioIdWithFallback(
            user, 
            token, 
            'ID do funcionário não encontrado'
          )
          console.log('🔍 [PWA Documentos] Usando funcionarioId:', funcionarioId, 'tipo:', typeof funcionarioId)
          
          // Buscar documentos do funcionário
          const response = await documentosApi.getDocumentosFuncionario(funcionarioId)
          
          // A API retorna documentos de obras com estrutura diferente
          // Mapear para o formato esperado pelo componente
          const documentosMapeados = (Array.isArray(response) ? response : response.data || []).map((doc: any) => {
            // Verificar se tem assinatura pendente ou aguardando
            const assinatura = doc.assinatura || {}
            const statusAssinatura = assinatura.status || 'pendente'
            const isPendente = ['pendente', 'aguardando'].includes(statusAssinatura)
            
            return {
              id: doc.id?.toString() || assinatura.documento_id?.toString(),
              documento_id: doc.id,
              titulo: doc.titulo || 'Documento sem título',
              descricao: doc.descricao,
              tipo: assinatura.tipo || 'interno',
              ordem: assinatura.ordem || 1,
              status: statusAssinatura,
              user_id: assinatura.user_id?.toString(),
              data_assinatura: assinatura.data_assinatura,
              arquivo_assinado: assinatura.arquivo_assinado,
              observacoes: assinatura.observacoes,
              created_at: doc.created_at || assinatura.created_at,
              updated_at: doc.updated_at || assinatura.updated_at,
              obra_id: doc.obra_id,
              obra_nome: doc.obra_nome,
              arquivo_original: doc.arquivo_original,
              caminho_arquivo: doc.caminho_arquivo
            }
          }).filter((doc: any) => {
            // Filtrar documentos do usuário atual (pendentes, aguardando ou já assinados)
            const docUserId = doc.user_id?.toString() || ''
            const userFuncionarioId = funcionarioId.toString()
            const userFuncionarioIdUuid = `00000000-0000-0000-0000-${userFuncionarioId.padStart(12, '0')}`
            const userAuthId = user?.id?.toString() || ''
            
            const userIdMatch = docUserId === userFuncionarioId || 
                               docUserId === userFuncionarioIdUuid ||
                               docUserId === userAuthId
            
            // Incluir documentos pendentes, aguardando ou já assinados pelo usuário
            const statusMatch = ['pendente', 'aguardando', 'assinado'].includes(doc.status)
            
            console.log(`🔍 [PWA Documentos] Filtro - doc.user_id: ${docUserId}, funcionarioId: ${userFuncionarioId}, match: ${userIdMatch}, status: ${doc.status}, statusMatch: ${statusMatch}`)
            
            return userIdMatch && statusMatch
          })
          
          console.log('📄 [PWA Documentos] Documentos mapeados:', documentosMapeados.length)
          setDocumentos(documentosMapeados)
          
          // Salvar no cache
          if (documentosMapeados.length > 0) {
            localStorage.setItem('cached_documentos_funcionario', JSON.stringify(documentosMapeados))
          }
        } else {
          // Fallback: usar API de documentos pendentes
          console.log('🔍 [PWA Documentos] Usando API de documentos pendentes')
          const data = await documentosApi.getDocumentosPendentes()
          setDocumentos(data)
        }
      } catch (error) {
        console.warn('Erro ao buscar documentos com funcionarioId, tentando API pendentes:', error)
        // Fallback: usar API de documentos pendentes
        try {
        const data = await documentosApi.getDocumentosPendentes()
        setDocumentos(data)
        } catch (fallbackError) {
          console.error('Erro ao buscar documentos pendentes:', fallbackError)
        }
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
    console.log('🔍 [PWA Documentos] Iniciando assinatura para documento:', documento)
    setDocumentoSelecionado(documento)
    setSignature(null)
    setArquivoAssinado(null)
    setTipoAssinatura('digital')
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
      // Obter funcionarioId
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Token não encontrado')
      }
      
      const funcionarioId = await getFuncionarioIdWithFallback(
        user, 
        token, 
        'ID do funcionário não encontrado'
      )
      
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
        // Assinatura digital - adicionar ao PDF pelo backend
        if (!isOnline) {
          toast({
            title: "Erro",
            description: "Assinatura digital requer conexão com internet",
            variant: "destructive"
          })
          setIsAssinando(false)
          return
        }

        // Usar a nova API que adiciona assinatura ao PDF
        const { assinarDocumentoComPDF } = await import('@/lib/api-assinaturas')
        await assinarDocumentoComPDF(Number(documentoSelecionado.documento_id), {
          assinatura: signature!,
          geoloc,
          timestamp: new Date().toISOString(),
          observacoes: 'Assinatura digital via PWA'
        })
        
        toast({
          title: "Documento assinado!",
          description: "A assinatura foi adicionada ao PDF com sucesso",
          variant: "default"
        })
      } else {
        // Upload de arquivo assinado
        if (!isOnline) {
          toast({
            title: "Erro",
            description: "Upload de arquivo requer conexão com internet",
            variant: "destructive"
          })
          setIsAssinando(false)
          return
        }

        // Buscar a assinatura do documento para fazer upload
        const { uploadArquivoAssinado, getDocumentoById } = await import('@/lib/api-assinaturas')
        
        // Buscar o documento para obter a assinatura
        const documentoId = Number(documentoSelecionado.documento_id)
        const documentoCompleto = await getDocumentoById(documentoId)
        
        // Encontrar a assinatura do usuário atual
        const assinaturaUsuario = documentoCompleto.assinaturas?.find((ass: any) => {
          const assUserId = ass.user_id?.toString() || ''
          const userFuncionarioId = funcionarioId.toString()
          const userFuncionarioIdUuid = `00000000-0000-0000-0000-${userFuncionarioId.padStart(12, '0')}`
          return assUserId === userFuncionarioId || assUserId === userFuncionarioIdUuid
        })
        
        if (!assinaturaUsuario) {
          throw new Error('Assinatura não encontrada para este documento')
        }
        
        await uploadArquivoAssinado(
          assinaturaUsuario.id,
          arquivoAssinado!,
          'Documento assinado via PWA - Upload'
        )
      
      toast({
        title: "Documento assinado!",
          description: "O documento assinado foi enviado com sucesso",
        variant: "default"
      })
      }
      
      // Recarregar documentos
      await carregarDocumentos()
      
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

  const handleDownload = async (documento: Documento, comAssinaturas: boolean = false) => {
    try {
      // Verificar se documento tem assinaturas para sugerir download com assinaturas
      const temAssinaturas = documento.status === 'assinado' || documento.assinatura_url
      
      // Usar documento_id (ID do documento de obra) para o download
      const documentoId = documento.documento_id || documento.id
      
      // Usar a nova API que suporta assinaturas
      const blob = await downloadDocumento(Number(documentoId), comAssinaturas && temAssinaturas)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const sufixo = comAssinaturas && temAssinaturas ? '_assinado' : ''
      a.download = `${documento.titulo || `documento_${documento.documento_id}`}${sufixo}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Download iniciado",
        description: `Baixando ${documento.titulo || `Documento ${documento.documento_id}`}${comAssinaturas && temAssinaturas ? ' com assinaturas' : ''}`,
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
      <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-600">Assine documentos pendentes</p>
        </div>
        <div className="flex items-center gap-2">
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
                      {(documento.status === 'aguardando' || documento.status === 'pendente') && (
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
                        onClick={() => handleDownload(documento, false)}
                        disabled={!isOnline}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                      
                      {(documento.status === 'assinado' || documento.assinatura_url) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(documento, true)}
                          disabled={!isOnline}
                          className="bg-green-50 hover:bg-green-100 border-green-300"
                        >
                          <FileSignature className="w-4 h-4 mr-2" />
                          Assinado
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

      {/* Modal de Assinatura */}
      {documentoSelecionado && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            // Fechar modal ao clicar fora
            if (e.target === e.currentTarget) {
              setDocumentoSelecionado(null)
              setSignature(null)
              setArquivoAssinado(null)
            }
          }}
        >
          <Card className="w-full max-w-md mx-auto my-4 sm:my-8">
            <CardHeader className="px-4 sm:px-6 pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <PenTool className="w-4 h-4 sm:w-5 sm:h-5" />
                Assinar Documento
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                {documentoSelecionado.titulo || `Documento ${documentoSelecionado.documento_id}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              {/* Botão de Download */}
              <div className="bg-blue-50 p-2.5 sm:p-3 rounded-lg border border-blue-200">
                <p className="text-xs sm:text-sm text-blue-800 mb-2 leading-tight">
                  <strong>Passo 1:</strong> Baixe o PDF para revisar antes de assinar
                </p>
                <Button
                  onClick={() => handleDownload(documentoSelecionado, false)}
                  variant="outline"
                  size="sm"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-100 text-xs sm:text-sm h-8 sm:h-9"
                  disabled={!isOnline}
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Baixar PDF Original
                </Button>
              </div>

              {/* Seletor de tipo de assinatura */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">
                  <strong>Passo 2:</strong> Escolha o tipo de assinatura
                </label>
                <div className="flex flex-row gap-2">
                  <Button
                    type="button"
                    variant={tipoAssinatura === 'digital' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTipoAssinatura('digital')}
                    className="flex-1 text-xs sm:text-sm"
                    style={{ padding: '10px' }}
                  >
                    <PenTool className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Digital (Adiciona ao PDF)</span>
                    <span className="sm:hidden">Digital</span>
                  </Button>
                  <Button
                    type="button"
                    variant={tipoAssinatura === 'arquivo' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTipoAssinatura('arquivo')}
                    className="flex-1 text-xs sm:text-sm"
                    style={{ padding: '10px' }}
                  >
                    <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Upload Assinado</span>
                    <span className="sm:hidden">Upload</span>
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-tight">
                  {tipoAssinatura === 'digital' 
                    ? 'Assine digitalmente e a assinatura será adicionada ao PDF automaticamente'
                    : 'Faça upload do PDF já assinado fisicamente'}
                </p>
              </div>

              {/* Assinatura Digital */}
              {tipoAssinatura === 'digital' && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">
                    Assinatura Digital
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 sm:p-4 overflow-x-auto">
                    <div className="flex justify-center">
                    <canvas
                      ref={canvasRef}
                      width={300}
                      height={150}
                        className="border border-gray-200 rounded cursor-crosshair w-full max-w-full"
                        style={{ maxWidth: '100%', height: 'auto' }}
                      onMouseDown={iniciarDesenho}
                      onMouseMove={desenhar}
                      onMouseUp={pararDesenho}
                      onMouseLeave={pararDesenho}
                        onTouchStart={(e) => {
                          e.preventDefault()
                          const touch = e.touches[0]
                          const canvas = canvasRef.current
                          if (!canvas) return
                          const rect = canvas.getBoundingClientRect()
                          const x = touch.clientX - rect.left
                          const y = touch.clientY - rect.top
                          const ctx = canvas.getContext('2d')
                          if (!ctx) return
                          setIsDrawing(true)
                          ctx.beginPath()
                          ctx.moveTo(x, y)
                        }}
                        onTouchMove={(e) => {
                          e.preventDefault()
                          if (!isDrawing) return
                          const canvas = canvasRef.current
                          if (!canvas) return
                          const touch = e.touches[0]
                          const rect = canvas.getBoundingClientRect()
                          const x = touch.clientX - rect.left
                          const y = touch.clientY - rect.top
                          const ctx = canvas.getContext('2d')
                          if (!ctx) return
                          ctx.lineWidth = 2
                          ctx.lineCap = 'round'
                          ctx.strokeStyle = '#000'
                          ctx.lineTo(x, y)
                          ctx.stroke()
                          ctx.beginPath()
                          ctx.moveTo(x, y)
                        }}
                        onTouchEnd={() => {
                          setIsDrawing(false)
                        }}
                    />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={limparAssinatura}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs sm:text-sm h-8 sm:h-8"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                      Limpar
                    </Button>
                    <Button
                      onClick={salvarAssinatura}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs sm:text-sm h-8 sm:h-8"
                    >
                      <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                      Salvar
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload de Arquivo */}
              {tipoAssinatura === 'arquivo' && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">
                    Upload do Documento Assinado
                  </label>
                  <div className="space-y-2 sm:space-y-3">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setArquivoAssinado(e.target.files?.[0] || null)}
                      className="w-full p-2 text-xs sm:text-sm border border-gray-300 rounded-md file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    
                    {arquivoAssinado && (
                      <div className="bg-green-50 p-2.5 sm:p-3 rounded-lg border border-green-200">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-green-800">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <FileSignature className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="font-medium text-xs sm:text-sm truncate">{arquivoAssinado.name}</span>
                          </div>
                          <span className="text-xs">({(arquivoAssinado.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 leading-tight">
                      Faça o upload do documento PDF assinado fisicamente. Máximo 10MB.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-200">
                <Button
                  onClick={assinarDocumento}
                  disabled={
                    isAssinando || 
                    (tipoAssinatura === 'digital' && !signature) ||
                    (tipoAssinatura === 'arquivo' && !arquivoAssinado)
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm h-9 sm:h-9 order-2 sm:order-1"
                >
                  {isAssinando ? (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5 sm:mr-2" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">{isAssinando ? 'Assinando...' : 'Confirmar Assinatura'}</span>
                  <span className="sm:hidden">{isAssinando ? 'Assinando...' : 'Confirmar'}</span>
                </Button>
                <Button
                  onClick={() => {
                    setDocumentoSelecionado(null)
                    setSignature(null)
                    setArquivoAssinado(null)
                    setTipoAssinatura('digital')
                  }}
                  variant="outline"
                  className="text-xs sm:text-sm h-9 sm:h-9 order-1 sm:order-2"
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
