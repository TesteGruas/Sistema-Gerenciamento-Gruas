"use client"

import { useState, useEffect, useCallback } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SignaturePad } from "@/components/signature-pad"
import { 
  Download, 
  Eye, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Check
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { colaboradoresDocumentosApi } from "@/lib/api-colaboradores-documentos"
import { getFuncionarioIdWithFallback } from "@/lib/get-funcionario-id"
import { CardLoader } from "@/components/ui/loader"

interface Holerite {
  id: string
  funcionario_id: number
  mes_referencia: string
  arquivo: string
  assinatura_digital?: string
  assinado_por?: number
  assinado_em?: string
  recebido_em?: string
  created_at: string
  updated_at: string
}

export default function PWAHoleritesPage() {
  const { toast } = useToast()
  const [holerites, setHolerites] = useState<Holerite[]>([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isAssinaturaDialogOpen, setIsAssinaturaDialogOpen] = useState(false)
  const [isVisualizacaoDialogOpen, setIsVisualizacaoDialogOpen] = useState(false)
  const [holeriteSelecionado, setHoleriteSelecionado] = useState<Holerite | null>(null)
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState<string>('')
  const [isLoadingHolerites, setIsLoadingHolerites] = useState(false) // Flag para evitar múltiplas chamadas

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

  const carregarHolerites = useCallback(async () => {
    setLoading(true)
    try {
      // Carregar do cache primeiro se offline
      if (!isOnline) {
        const cachedHolerites = localStorage.getItem('cached_holerites')
        
        if (cachedHolerites) {
          setHolerites(JSON.parse(cachedHolerites))
          toast({
            title: "Modo Offline",
            description: "Exibindo holerites em cache. Conecte-se para atualizar.",
            variant: "default"
          })
        } else {
          setHolerites([])
          toast({
            title: "Sem conexão",
            description: "Não há holerites em cache. Conecte-se à internet para carregar seus holerites.",
            variant: "default"
          })
        }
        
        return
      }

      if (!user?.id) {
        throw new Error('Usuário não identificado. Faça login novamente.')
      }

      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.')
      }

      // Obter ID do funcionário
        let funcionarioId: number | null = null
        
        try {
          funcionarioId = await getFuncionarioIdWithFallback(
            user, 
            token, 
            'ID do funcionário não encontrado'
          )
        } catch (funcionarioError: any) {
        if (funcionarioError?.response?.status === 403 || funcionarioError?.status === 403) {
          throw new Error('Você não tem permissão para acessar holerites')
        }
        throw new Error(funcionarioError.message || 'Erro ao buscar ID do funcionário')
      }

        if (!funcionarioId) {
        throw new Error('ID do funcionário não encontrado')
        }

        // Buscar holerites
        const response = await colaboradoresDocumentosApi.holerites.listar(funcionarioId)
        
      if (response.success && response.data) {
          // Converter formato do backend para frontend
          const holeritesFormatados = response.data.map((h: any) => ({
            id: h.id,
            funcionario_id: h.funcionario_id,
            mes_referencia: h.mes_referencia,
            arquivo: h.arquivo,
            assinatura_digital: h.assinatura_digital,
            assinado_por: h.assinado_por,
            assinado_em: h.assinado_em,
            recebido_em: h.recebido_em,
            created_at: h.created_at,
            updated_at: h.updated_at
          }))
          
          setHolerites(holeritesFormatados)
          
          // Salvar no cache
          localStorage.setItem('cached_holerites', JSON.stringify(holeritesFormatados))
        
        if (holeritesFormatados.length === 0) {
          toast({
            title: "Nenhum holerite encontrado",
            description: "Você ainda não possui holerites disponíveis.",
            variant: "default"
          })
        }
        } else {
        setHolerites([])
        toast({
          title: "Nenhum holerite encontrado",
          description: "Você ainda não possui holerites disponíveis.",
          variant: "default"
        })
      }

    } catch (error: any) {
      console.error('Erro ao carregar holerites:', error)
      
      // Tentar carregar do cache em caso de erro
      const cachedHolerites = localStorage.getItem('cached_holerites')
      
      if (cachedHolerites) {
        setHolerites(JSON.parse(cachedHolerites))
        toast({
          title: "Erro ao carregar holerites",
          description: error.message || "Exibindo holerites em cache. Verifique sua conexão.",
          variant: "destructive"
        })
      } else {
        setHolerites([])
        toast({
          title: "Erro ao carregar holerites",
          description: error.message || "Não foi possível carregar seus holerites. Verifique sua conexão e tente novamente.",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id, isOnline]) // Dependências do useCallback

  // Carregar holerites
  useEffect(() => {
    // Evitar chamadas múltiplas
    if (isLoadingHolerites || loading) return
    
    setIsLoadingHolerites(true)
    // Sempre carregar (com dados mockados se necessário)
    carregarHolerites().finally(() => {
      setIsLoadingHolerites(false)
    })
  }, [carregarHolerites]) // Usar a função memoizada

  const formatarMesReferencia = (mesReferencia: string) => {
    try {
      const [ano, mes] = mesReferencia.split('-')
      const data = new Date(parseInt(ano), parseInt(mes) - 1, 1)
      return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    } catch {
      return mesReferencia
    }
  }

  const handleAssinar = async (holerite: Holerite) => {
    if (!assinaturaDataUrl) {
      toast({
        title: "Erro",
        description: "Por favor, assine o holerite",
        variant: "destructive"
      })
      return
    }

    try {
        await colaboradoresDocumentosApi.holerites.assinar(holerite.id, {
          assinatura_digital: assinaturaDataUrl
        })
        
        toast({
          title: "Sucesso",
          description: "Holerite assinado com sucesso"
        })
        
        // Recarregar holerites
        carregarHolerites()

      setIsAssinaturaDialogOpen(false)
      setAssinaturaDataUrl('')
      setHoleriteSelecionado(null)
    } catch (error: any) {
      console.error('Erro ao assinar holerite:', error)
      
      let errorMessage = "Erro ao assinar holerite"
      if (error?.response?.status === 401 || error?.status === 401) {
        errorMessage = "Sessão expirada. Faça login novamente."
      } else if (error?.response?.status === 403 || error?.status === 403) {
        errorMessage = "Você não tem permissão para assinar este holerite"
      } else if (error?.response?.status >= 500 || error?.status >= 500) {
        errorMessage = "Erro no servidor. Tente novamente mais tarde."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleDownload = async (holerite: Holerite) => {
    try {
      if (!holerite.arquivo) {
        throw new Error('Arquivo do holerite não disponível')
      }
      
      // Construir URL do arquivo
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'
      const arquivoUrl = holerite.arquivo.startsWith('http') 
        ? holerite.arquivo 
        : `${apiUrl}/uploads/${holerite.arquivo}`
      
      // Abrir em nova aba para download
      window.open(arquivoUrl, '_blank')
      
      // Confirmar recebimento automaticamente ao baixar
      await confirmarRecebimento(holerite)
    } catch (error: any) {
      console.error('Erro ao baixar holerite:', error)
      toast({
        title: "Erro ao baixar holerite",
        description: error.message || "Não foi possível baixar o holerite",
        variant: "destructive"
      })
    }
  }

  const handleVisualizar = async (holerite: Holerite) => {
    setHoleriteSelecionado(holerite)
    setIsVisualizacaoDialogOpen(true)
    
    // Confirmar recebimento ao visualizar
    await confirmarRecebimento(holerite)
  }

  const confirmarRecebimento = async (holerite: Holerite) => {
    try {
      // Se já foi recebido, não fazer nada
      if (holerite.recebido_em) {
        return
      }

      // Marcar como recebido (atualizar localmente)
      const holeritesAtualizados = holerites.map(h => 
        h.id === holerite.id 
          ? { ...h, recebido_em: new Date().toISOString() }
          : h
      )
      setHolerites(holeritesAtualizados)
      
      // Salvar no cache
      localStorage.setItem('cached_holerites', JSON.stringify(holeritesAtualizados))

      // Se online, tentar salvar no backend (opcional - pode ser apenas local)
      if (isOnline) {
        // TODO: Implementar endpoint de confirmação de recebimento no backend se necessário
        // await colaboradoresDocumentosApi.holerites.confirmarRecebimento(holerite.id)
      }

      toast({
        title: "Recebimento confirmado",
        description: `Holerite de ${formatarMesReferencia(holerite.mes_referencia)} marcado como recebido`,
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao confirmar recebimento:', error)
      // Não mostrar erro ao usuário, pois é uma ação secundária
    }
  }

  const estaAssinado = (holerite: Holerite) => {
    return !!holerite.assinatura_digital && !!holerite.assinado_em
  }

  const estaRecebido = (holerite: Holerite) => {
    return !!holerite.recebido_em
  }

  return (
    <ProtectedRoute permission="documentos:visualizar">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meus Holerites</h1>
            <p className="text-sm sm:text-base text-gray-600">Visualize, baixe e assine seus holerites</p>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            )}
            <span className="text-xs sm:text-sm text-gray-600">
              {isOnline ? "Online" : "Offline"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={carregarHolerites}
              disabled={loading}
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Status de conexão */}
        {!isOnline && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <WifiOff className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              Você está offline. Os dados serão sincronizados quando a conexão for restabelecida.
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de Holerites */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Holerites Mensais</CardTitle>
                <CardDescription>
                  {holerites.length} holerite(s) disponível(is)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <CardLoader />
            ) : holerites.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Nenhum holerite disponível</p>
                <p className="text-sm">Seus holerites aparecerão aqui quando estiverem disponíveis.</p>
              </div>
            ) : (
              <>
                {/* Layout Mobile - Cards */}
                <div className="block md:hidden space-y-3">
                  {holerites.map((holerite) => (
                    <Card key={holerite.id} className="border-2 hover:border-blue-200 transition-colors">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header do Card */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-900">
                                {formatarMesReferencia(holerite.mes_referencia)}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                Criado em {new Date(holerite.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            {estaAssinado(holerite) ? (
                              <Badge className="bg-green-500">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Assinado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                <Clock className="w-3 h-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </div>

                          {/* Status Info */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Assinatura</p>
                              {estaAssinado(holerite) ? (
                                <p className="text-xs text-gray-700 font-medium">
                                  {holerite.assinado_em 
                                    ? new Date(holerite.assinado_em).toLocaleDateString('pt-BR')
                                    : 'Assinado'
                                  }
                                </p>
                              ) : (
                                <p className="text-xs text-gray-400">Não assinado</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Recebimento</p>
                              {estaRecebido(holerite) ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
                                  <Check className="w-3 h-3 mr-1" />
                                  Recebido
                                </Badge>
                              ) : (
                                <p className="text-xs text-gray-400">Não confirmado</p>
                              )}
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 min-w-[80px]"
                              onClick={() => handleVisualizar(holerite)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 min-w-[80px]"
                              onClick={() => handleDownload(holerite)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Baixar
                            </Button>
                            {!estaAssinado(holerite) && (
                              <Button
                                variant="default"
                                size="sm"
                                className="flex-1 min-w-[100px] bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
                                  setHoleriteSelecionado(holerite)
                                  setIsAssinaturaDialogOpen(true)
                                }}
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                Assinar
                              </Button>
                            )}
                            {!estaRecebido(holerite) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 min-w-[120px]"
                                onClick={() => confirmarRecebimento(holerite)}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Confirmar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Layout Desktop - Tabela */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês/Ano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assinatura</TableHead>
                        <TableHead>Recebimento</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {holerites.map((holerite) => (
                        <TableRow key={holerite.id}>
                          <TableCell className="font-medium">
                            {formatarMesReferencia(holerite.mes_referencia)}
                          </TableCell>
                          <TableCell>
                            {estaAssinado(holerite) ? (
                              <Badge className="bg-green-500">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Assinado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                <Clock className="w-3 h-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {estaAssinado(holerite) ? (
                              <div className="text-xs text-gray-600">
                                {holerite.assinado_em 
                                  ? new Date(holerite.assinado_em).toLocaleDateString('pt-BR')
                                  : 'Assinado'
                                }
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">Não assinado</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {estaRecebido(holerite) ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                <Check className="w-3 h-3 mr-1" />
                                Recebido
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">Não confirmado</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVisualizar(holerite)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(holerite)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Baixar
                              </Button>
                              {!estaAssinado(holerite) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setHoleriteSelecionado(holerite)
                                    setIsAssinaturaDialogOpen(true)
                                  }}
                                >
                                  <FileText className="w-4 h-4 mr-1" />
                                  Assinar
                                </Button>
                              )}
                              {!estaRecebido(holerite) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => confirmarRecebimento(holerite)}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Confirmar Recebimento
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Assinatura */}
        <Dialog open={isAssinaturaDialogOpen} onOpenChange={setIsAssinaturaDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assinar Holerite</DialogTitle>
              <DialogDescription>
                Assine digitalmente o holerite de {holeriteSelecionado && formatarMesReferencia(holeriteSelecionado.mes_referencia)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <SignaturePad
                onSave={(signature) => {
                  setAssinaturaDataUrl(signature)
                  if (holeriteSelecionado) {
                    handleAssinar(holeriteSelecionado)
                  }
                }}
                onCancel={() => {
                  setIsAssinaturaDialogOpen(false)
                  setAssinaturaDataUrl('')
                  setHoleriteSelecionado(null)
                }}
                title="Assinar Holerite"
                description={`Assine digitalmente o holerite de ${holeriteSelecionado && formatarMesReferencia(holeriteSelecionado.mes_referencia)}`}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Visualização */}
        <Dialog open={isVisualizacaoDialogOpen} onOpenChange={setIsVisualizacaoDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Visualizar Holerite</DialogTitle>
              <DialogDescription>
                Holerite de {holeriteSelecionado && formatarMesReferencia(holeriteSelecionado.mes_referencia)}
              </DialogDescription>
            </DialogHeader>

            {holeriteSelecionado && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatarMesReferencia(holeriteSelecionado.mes_referencia)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Criado em {new Date(holeriteSelecionado.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {estaAssinado(holeriteSelecionado) && (
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Assinado
                      </Badge>
                    )}
                    {estaRecebido(holeriteSelecionado) && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                        <Check className="w-3 h-3 mr-1" />
                        Recebido
                      </Badge>
                    )}
                  </div>
                </div>

                {holeriteSelecionado.arquivo ? (
                  <div className="border rounded-lg p-4">
                    <iframe
                      src={holeriteSelecionado.arquivo.startsWith('http') 
                        ? holeriteSelecionado.arquivo 
                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'}/uploads/${holeriteSelecionado.arquivo}`
                      }
                      className="w-full h-[600px] border-0"
                      title="Visualização do Holerite"
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-8 bg-gray-50">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Arquivo não disponível</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        O arquivo PDF do holerite de {formatarMesReferencia(holeriteSelecionado.mes_referencia)} não está disponível.
                      </p>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Informações do Holerite:</p>
                        <div className="text-left space-y-1 text-sm">
                          <p><strong>Mês/Ano:</strong> {formatarMesReferencia(holeriteSelecionado.mes_referencia)}</p>
                          <p><strong>Status:</strong> {estaAssinado(holeriteSelecionado) ? 'Assinado' : 'Pendente de assinatura'}</p>
                          {estaAssinado(holeriteSelecionado) && holeriteSelecionado.assinado_em && (
                            <p><strong>Assinado em:</strong> {new Date(holeriteSelecionado.assinado_em).toLocaleDateString('pt-BR')}</p>
                          )}
                          <p><strong>Recebimento:</strong> {estaRecebido(holeriteSelecionado) ? 'Confirmado' : 'Não confirmado'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(holeriteSelecionado)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </Button>
                  {!estaAssinado(holeriteSelecionado) && (
                    <Button
                      onClick={() => {
                        setIsVisualizacaoDialogOpen(false)
                        setIsAssinaturaDialogOpen(true)
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Assinar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsVisualizacaoDialogOpen(false)
                      setHoleriteSelecionado(null)
                    }}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}

