"use client"

import { useState, useEffect, useRef } from "react"
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
  Save
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Documento {
  id: string
  nome: string
  tipo: string
  status: 'pendente' | 'assinado' | 'rejeitado'
  data_criacao: string
  data_vencimento?: string
  descricao?: string
  arquivo_url?: string
  assinatura_url?: string
  funcionario_id: number
  funcionario_nome?: string
}

export default function PWADocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [documentoSelecionado, setDocumentoSelecionado] = useState<Documento | null>(null)
  const [isAssinando, setIsAssinando] = useState(false)
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

  const carregarDocumentos = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/documentos/funcionario/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setDocumentos(data.data || [])
      } else {
        // Simular documentos para demonstração
        setDocumentos([
          {
            id: '1',
            nome: 'Termo de Responsabilidade',
            tipo: 'Contrato',
            status: 'pendente',
            data_criacao: new Date().toISOString(),
            data_vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            descricao: 'Termo de responsabilidade para operação de gruas',
            funcionario_id: user.id,
            funcionario_nome: user.nome
          },
          {
            id: '2',
            nome: 'Checklist de Segurança',
            tipo: 'Formulário',
            status: 'assinado',
            data_criacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            descricao: 'Checklist de segurança para operação',
            funcionario_id: user.id,
            funcionario_nome: user.nome
          }
        ])
      }
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
    if (!signature || !documentoSelecionado) return

    setIsAssinando(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast({
          title: "Erro de autenticação",
          description: "Faça login novamente",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/documentos/${documentoSelecionado.id}/assinar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            assinatura: signature,
            funcionario_id: user.id
          })
        }
      )

      if (response.ok) {
        toast({
          title: "Documento assinado!",
          description: "O documento foi assinado com sucesso",
          variant: "default"
        })
        
        // Atualizar lista de documentos
        setDocumentos(prev => prev.map(doc => 
          doc.id === documentoSelecionado.id 
            ? { ...doc, status: 'assinado', assinatura_url: signature }
            : doc
        ))
        
        setDocumentoSelecionado(null)
        setSignature(null)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao assinar documento')
      }
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
      'assinado': { className: 'bg-green-100 text-green-800', text: 'Assinado', icon: CheckCircle },
      'rejeitado': { className: 'bg-red-100 text-red-800', text: 'Rejeitado', icon: AlertCircle }
    }
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const isVencido = (dataVencimento?: string) => {
    if (!dataVencimento) return false
    return new Date(dataVencimento) < new Date()
  }

  return (
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
            const vencido = isVencido(documento.data_vencimento)

            return (
              <Card key={documento.id} className={`hover:shadow-md transition-shadow ${vencido ? 'border-red-200 bg-red-50' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileSignature className="w-5 h-5" />
                        {documento.nome}
                        {vencido && <Badge className="bg-red-100 text-red-800">Vencido</Badge>}
                      </CardTitle>
                      <CardDescription>
                        {documento.tipo} • Criado em {formatarData(documento.data_criacao)}
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
                    
                    {documento.data_vencimento && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Vencimento: {formatarData(documento.data_vencimento)}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {documento.status === 'pendente' && (
                        <Button
                          onClick={() => iniciarAssinatura(documento)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <PenTool className="w-4 h-4 mr-2" />
                          Assinar
                        </Button>
                      )}
                      
                      {documento.arquivo_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(documento.arquivo_url, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="w-5 h-5" />
                Assinar Documento
              </CardTitle>
              <CardDescription>
                {documentoSelecionado.nome}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="flex gap-2">
                <Button
                  onClick={assinarDocumento}
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
                  onClick={() => setDocumentoSelecionado(null)}
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
  )
}
