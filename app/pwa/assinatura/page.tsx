"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  FileSignature, 
  CheckCircle,
  Clock,
  User,
  Calendar,
  Download,
  Upload,
  Eye,
  Wifi,
  WifiOff,
  Search,
  Filter,
  PenTool,
  Trash2,
  Save,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  getTodosDocumentos, 
  assinarDocumento, 
  recusarDocumento,
  downloadDocumento,
  type DocumentoAssinatura 
} from "@/lib/api-assinaturas"

export default function PWAAssinaturaPage() {
  const [isOnline, setIsOnline] = useState(true)
  const [documentos, setDocumentos] = useState<DocumentoAssinatura[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("todos")
  const [isLoading, setIsLoading] = useState(false)
  const [documentoSelecionado, setDocumentoSelecionado] = useState<DocumentoAssinatura | null>(null)
  const [isAssinando, setIsAssinando] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [motivoRejeicao, setMotivoRejeicao] = useState("")
  const [mostrarRejeicao, setMostrarRejeicao] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

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
    carregarDocumentos()
  }, [])

  const carregarDocumentos = async () => {
    setIsLoading(true)
    try {
      const docs = await getTodosDocumentos()
      setDocumentos(docs)
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
      toast({
        title: "Erro ao carregar documentos",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Funções de desenho de assinatura
  const iniciarDesenho = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const x = clientX - rect.left
    const y = clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const desenhar = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const x = clientX - rect.left
    const y = clientY - rect.top

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
    
    toast({
      title: "Assinatura salva!",
      description: "Agora você pode confirmar a assinatura do documento",
      variant: "default"
    })
  }

  const iniciarAssinatura = (documento: DocumentoAssinatura) => {
    setDocumentoSelecionado(documento)
    setSignature(null)
    setMostrarRejeicao(false)
  }

  const confirmarAssinatura = async () => {
    if (!signature || !documentoSelecionado) return

    setIsAssinando(true)
    try {
      // Obter geolocalização se disponível
      let geoloc = undefined
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 60000
            })
          })
          geoloc = `${position.coords.latitude}, ${position.coords.longitude}`
        } catch (error) {
          console.log('Geolocalização não disponível:', error)
        }
      }

      await assinarDocumento(documentoSelecionado.id, {
        assinatura: signature,
        geoloc,
        timestamp: new Date().toISOString()
      })

      toast({
        title: "Documento assinado!",
        description: "Assinatura digital aplicada com sucesso",
        variant: "default"
      })

      // Recarregar documentos
      await carregarDocumentos()
      setDocumentoSelecionado(null)
      setSignature(null)
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

  const confirmarRejeicao = async () => {
    if (!documentoSelecionado || !motivoRejeicao.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo da rejeição",
        variant: "destructive"
      })
      return
    }

    setIsAssinando(true)
    try {
      await recusarDocumento(documentoSelecionado.id, {
        motivo: motivoRejeicao,
        observacoes: `Rejeitado via PWA em ${new Date().toLocaleString('pt-BR')}`
      })

      toast({
        title: "Documento rejeitado",
        description: "O documento foi marcado como rejeitado",
        variant: "default"
      })

      // Recarregar documentos
      await carregarDocumentos()
      setDocumentoSelecionado(null)
      setMotivoRejeicao("")
      setMostrarRejeicao(false)
    } catch (error: any) {
      console.error('Erro ao rejeitar documento:', error)
      toast({
        title: "Erro ao rejeitar documento",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive"
      })
    } finally {
      setIsAssinando(false)
    }
  }

  const handleDownload = async (documento: DocumentoAssinatura) => {
    try {
      const blob = await downloadDocumento(documento.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = documento.arquivo_original || 'documento.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download iniciado",
        description: `Baixando ${documento.titulo}`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Erro ao baixar documento",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case 'assinado':
        return <Badge className="bg-green-100 text-green-800">Assinado</Badge>
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const filteredDocumentos = documentos.filter(doc => {
    const descricaoText = doc.descricao || ''
    const matchesSearch = doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         descricaoText.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Mapear os status do banco para o filtro
    const statusMapeado = doc.status === 'aguardando_assinatura' || doc.status === 'em_assinatura' ? 'pendente' : doc.status
    const matchesFilter = filterStatus === "todos" || statusMapeado === filterStatus
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: documentos.length,
    pendentes: documentos.filter(d => d.status === 'aguardando_assinatura' || d.status === 'em_assinatura').length,
    assinados: documentos.filter(d => d.status === 'assinado').length,
    rejeitados: documentos.filter(d => d.status === 'rejeitado').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assinatura Digital</h1>
          <p className="text-gray-600">Gerencie documentos para assinatura</p>
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
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileSignature className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-xl font-bold">{stats.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Assinados</p>
                <p className="text-xl font-bold">{stats.assinados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileSignature className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejeitados</p>
                <p className="text-xl font-bold">{stats.rejeitados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar documentos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Digite o nome do documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Label htmlFor="filter">Filtrar por status</Label>
              <div className="relative">
                <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <select
                  id="filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos</option>
                  <option value="pendente">Pendentes</option>
                  <option value="assinado">Assinados</option>
                  <option value="rejeitado">Rejeitados</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de documentos */}
      <div className="space-y-4">
        {isLoading && !documentos.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Carregando documentos...</p>
            </div>
          </div>
        ) : filteredDocumentos.map((documento) => {
          const isPendente = documento.status === 'aguardando_assinatura' || documento.status === 'em_assinatura'
          
          return (
            <Card key={documento.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileSignature className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{documento.titulo}</h3>
                        <p className="text-sm text-gray-500">{documento.tipo || 'Documento'}</p>
                      </div>
                    </div>
                    
                    {documento.descricao && (
                      <p className="text-sm text-gray-600 mb-3">{documento.descricao}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(documento.data_criacao).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{documento.created_by}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(isPendente ? 'pendente' : documento.status)}
                    
                    {isPendente && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => iniciarAssinatura(documento)}
                          disabled={isLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Assinar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDocumentoSelecionado(documento)
                            setMostrarRejeicao(true)
                          }}
                          disabled={isLoading}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Rejeitar
                        </Button>
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-600 hover:text-gray-700"
                      onClick={() => handleDownload(documento)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        
        {filteredDocumentos.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileSignature className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum documento encontrado</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== "todos" 
                  ? "Tente ajustar os filtros de busca"
                  : "Não há documentos disponíveis no momento"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Assinatura */}
      {documentoSelecionado && !mostrarRejeicao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="w-5 h-5" />
                Assinar Documento
              </CardTitle>
              <CardDescription>
                {documentoSelecionado.titulo}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Assinatura Digital
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    className="border border-gray-200 rounded cursor-crosshair w-full touch-none"
                    onMouseDown={iniciarDesenho}
                    onMouseMove={desenhar}
                    onMouseUp={pararDesenho}
                    onMouseLeave={pararDesenho}
                    onTouchStart={iniciarDesenho}
                    onTouchMove={desenhar}
                    onTouchEnd={pararDesenho}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={limparAssinatura}
                    variant="outline"
                    size="sm"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                  <Button
                    onClick={salvarAssinatura}
                    variant="outline"
                    size="sm"
                    type="button"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Salvar
                  </Button>
                </div>
                {signature && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Assinatura salva com sucesso</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={confirmarAssinatura}
                  disabled={!signature || isAssinando}
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
                  }}
                  variant="outline"
                  disabled={isAssinando}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Rejeição */}
      {documentoSelecionado && mostrarRejeicao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Rejeitar Documento
              </CardTitle>
              <CardDescription>
                {documentoSelecionado.titulo}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="motivo">Motivo da Rejeição*</Label>
                <textarea
                  id="motivo"
                  value={motivoRejeicao}
                  onChange={(e) => setMotivoRejeicao(e.target.value)}
                  placeholder="Descreva o motivo da rejeição..."
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isAssinando}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={confirmarRejeicao}
                  disabled={!motivoRejeicao.trim() || isAssinando}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isAssinando ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  )}
                  {isAssinando ? 'Rejeitando...' : 'Confirmar Rejeição'}
                </Button>
                <Button
                  onClick={() => {
                    setDocumentoSelecionado(null)
                    setMostrarRejeicao(false)
                    setMotivoRejeicao("")
                  }}
                  variant="outline"
                  disabled={isAssinando}
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
                <p className="text-sm">As assinaturas serão sincronizadas quando a conexão for restabelecida.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
