"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Bell, 
  BellRing,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  RefreshCw,
  Briefcase,
  Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { NotificacoesAPI, Notificacao as NotificacaoAPI } from "@/lib/api-notificacoes"
import { STORAGE_KEY_NOTIFICACOES_LOCAIS } from "@/hooks/use-vencimentos-documentos"

interface Notificacao {
  id: string
  tipo: 'info' | 'alerta' | 'sucesso' | 'erro'
  tipoOriginal?: string // Tipo original da API (grua, obra, etc)
  titulo: string
  mensagem: string
  lida: boolean
  data: string
  acao?: string
}

export default function PWANotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [filtro, setFiltro] = useState<'todas' | 'nao-lidas'>('todas')
  const [loading, setLoading] = useState(false)
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState<Notificacao | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  const carregarNotificacoes = useCallback(async () => {
    setLoading(true)
    try {
      // Buscar notificações reais da API
      const response = await NotificacoesAPI.listar({
        page: 1,
        limit: 50,
        lida: filtro === 'todas' ? undefined : false
      })

      // Buscar notificações locais (fallback para vencimentos)
      // IMPORTANTE: Usar a constante exportada do hook para garantir que é a mesma chave
      const notificacoesLocaisKey = STORAGE_KEY_NOTIFICACOES_LOCAIS
      const notificacoesLocaisStr = localStorage.getItem(notificacoesLocaisKey)
      let notificacoesLocais: any[] = []
      
      try {
        if (notificacoesLocaisStr) {
          const parsed = JSON.parse(notificacoesLocaisStr)
          // Garantir que é um array - se não for, algo está errado
          if (Array.isArray(parsed)) {
            notificacoesLocais = parsed
          } else {
            notificacoesLocais = []
          }
        } else {
          notificacoesLocais = []
        }
      } catch (parseError) {
        notificacoesLocais = []
      }

      // Mapear notificações da API para o formato esperado (mesmo que seja array vazio)
      const notificacoesMapeadas: Notificacao[] = (response.success && response.data && Array.isArray(response.data))
        ? response.data.map((notif: NotificacaoAPI) => {
          // Mapear tipos da API para tipos do componente
          let tipo: 'info' | 'alerta' | 'sucesso' | 'erro' = 'info'
          const tipoOriginal = notif.tipo
          if (tipoOriginal === 'warning') {
            tipo = 'alerta'
          } else if (tipoOriginal === 'success') {
            tipo = 'sucesso'
          } else if (tipoOriginal === 'error') {
            tipo = 'erro'
          }

          return {
            id: String(notif.id),
            tipo,
            tipoOriginal: notif.tipo, // Manter tipo original
            titulo: notif.titulo,
            mensagem: notif.mensagem,
            lida: notif.lida,
            data: notif.data || notif.created_at || new Date().toISOString(),
              acao: notif.link
            }
          })
        : []

      // Adicionar notificações locais ao final (sempre, mesmo se a API retornar vazio)
      const notificacoesLocaisMapeadas: Notificacao[] = notificacoesLocais
        .filter((n: any) => {
          // Validar que é um objeto válido
          if (!n || typeof n !== 'object') {
            return false
          }
          
          // Filtrar apenas notificações não lidas se o filtro for 'nao-lidas'
          if (filtro === 'nao-lidas' && n.lida) {
            return false
          }
          return true
        })
        .map((n: any) => {
          return {
            id: n.id || `local_${Date.now()}_${Math.random()}`,
            tipo: (n.tipo === 'warning' ? 'alerta' : 'info') as 'info' | 'alerta' | 'sucesso' | 'erro',
            tipoOriginal: n.tipo || 'warning',
            titulo: n.titulo || 'Notificação',
            mensagem: n.mensagem || '',
            lida: n.lida || false,
            data: n.data || new Date().toISOString(),
            acao: n.link || n.acao
          }
        })

      // Combinar notificações da API com notificações locais
      const todasNotificacoes = [...notificacoesMapeadas, ...notificacoesLocaisMapeadas]
      setNotificacoes(todasNotificacoes)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
      
      setNotificacoes([])
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => {
    carregarNotificacoes()
  }, [carregarNotificacoes])

  // Recarregar notificações quando houver mudanças no localStorage (notificações locais)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_NOTIFICACOES_LOCAIS) {
        carregarNotificacoes()
      }
    }
    
    // Listener para evento customizado (mesma aba)
    const handleNotificacoesAtualizadas = (e: CustomEvent) => {
      // Pequeno delay para garantir que o localStorage foi atualizado
      setTimeout(() => {
        carregarNotificacoes()
      }, 100)
    }

    // Listener para mudanças no localStorage (outras abas)
    window.addEventListener('storage', handleStorageChange)
    
    // Listener para evento customizado (mesma aba)
    window.addEventListener('notificacoes-locais-atualizadas', handleNotificacoesAtualizadas as EventListener)

    // Verificar mudanças periodicamente (mesma aba - storage event não funciona na mesma aba)
    const intervalId = setInterval(() => {
      try {
        const locaisStr = localStorage.getItem(STORAGE_KEY_NOTIFICACOES_LOCAIS)
        if (!locaisStr) {
          // Se não há notificações locais mas havia antes, recarregar para limpar
          if (notificacoes.some(n => n.id?.startsWith('local_'))) {
            carregarNotificacoes()
          }
          return
        }
        
        let locais: any[] = []
        try {
          const parsed = JSON.parse(locaisStr)
          locais = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? Object.values(parsed) : [])
        } catch (parseErr) {
          return
        }
        
        // Verificar se há notificações locais que não estão sendo exibidas
        if (locais.length > 0) {
          const temLocaisNaLista = notificacoes.some(n => n.id?.startsWith('local_'))
          const totalLocaisNaLista = notificacoes.filter(n => n.id?.startsWith('local_')).length
          
          // Se o número de notificações locais no localStorage é diferente do número na lista, recarregar
          if (totalLocaisNaLista !== locais.length || (!temLocaisNaLista && locais.length > 0)) {
            carregarNotificacoes()
          }
        } else {
          // Se não há notificações locais mas havia antes, recarregar para limpar
          if (notificacoes.some(n => n.id?.startsWith('local_'))) {
            carregarNotificacoes()
          }
        }
      } catch (err) {
        // Silenciar erros na verificação periódica
      }
    }, 2000) // Verificar a cada 2 segundos

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('notificacoes-locais-atualizadas', handleNotificacoesAtualizadas as EventListener)
      clearInterval(intervalId)
    }
  }, [notificacoes, carregarNotificacoes]) // Usar carregarNotificacoes como dependência

  const marcarComoLida = async (id: string) => {
    try {
      await NotificacoesAPI.marcarComoLida(id)
      setNotificacoes(prev => 
        prev.map(n => n.id === id ? { ...n, lida: true } : n)
      )
      
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      
    }
  }

  const excluirNotificacao = async (id: string) => {
    try {
      await NotificacoesAPI.deletar(id)
      setNotificacoes(prev => prev.filter(n => n.id !== id))
      
    } catch (error) {
      console.error('Erro ao excluir notificação:', error)
      
    }
  }

  const marcarTodasComoLidas = async () => {
    try {
      await NotificacoesAPI.marcarTodasComoLidas()
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
      
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      
    }
  }

  const getIconeNotificacao = (tipo: string, tipoOriginal?: string) => {
    // Se for tipo grua, usar ícone de grua
    if (tipoOriginal === 'grua') {
      return <Briefcase className="w-5 h-5 text-purple-600" />
    }
    
    switch (tipo) {
      case 'sucesso': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'alerta': return <AlertCircle className="w-5 h-5 text-orange-600" />
      case 'erro': return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return <Info className="w-5 h-5 text-blue-600" />
    }
  }
  
  const getBadgeTipo = (tipoOriginal?: string) => {
    if (!tipoOriginal) return null
    
    const badges: Record<string, { label: string; className: string }> = {
      'grua': { label: 'Grua', className: 'bg-purple-100 text-purple-700 border-purple-300' },
      'obra': { label: 'Obra', className: 'bg-blue-100 text-blue-700 border-blue-300' },
      'financeiro': { label: 'Financeiro', className: 'bg-green-100 text-green-700 border-green-300' },
      'rh': { label: 'RH', className: 'bg-pink-100 text-pink-700 border-pink-300' },
      'estoque': { label: 'Estoque', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' }
    }
    
    return badges[tipoOriginal]
  }

  const notificacoesFiltradas = notificacoes.filter(n => 
    filtro === 'todas' || !n.lida
  )

  const naoLidas = notificacoes.filter(n => !n.lida).length

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
        <p className="text-gray-600">Gerencie suas notificações e alertas</p>
      </div>

      {/* Lista de Notificações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Suas Notificações</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={carregarNotificacoes}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              {naoLidas > 0 && (
                <Button variant="outline" size="sm" onClick={marcarTodasComoLidas}>
                  Marcar todas como lidas
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filtro} onValueChange={(v) => setFiltro(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="todas">
                Todas ({notificacoes.length})
              </TabsTrigger>
              <TabsTrigger value="nao-lidas">
                Não Lidas ({naoLidas})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filtro}>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                  <p className="text-gray-600">Carregando notificações...</p>
                </div>
              ) : notificacoesFiltradas.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600">Nenhuma notificação</p>
                  <p className="text-sm text-gray-500">Você está em dia!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notificacoesFiltradas.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        notif.lida 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-white border-blue-200 shadow-sm'
                      }`}
                    >
                      {/* Conteúdo principal - título e texto ocupando 100% */}
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="font-medium text-gray-900 flex-1">{notif.titulo}</h4>
                          {!notif.lida && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              Nova
                            </Badge>
                          )}
                          {getBadgeTipo(notif.tipoOriginal) && (
                            <Badge className={`text-xs ${getBadgeTipo(notif.tipoOriginal)?.className}`}>
                              {getBadgeTipo(notif.tipoOriginal)?.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{notif.mensagem}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.data).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {/* Botões de ação na parte inferior */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNotificacaoSelecionada(notif)
                            setIsModalOpen(true)
                          }}
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!notif.lida && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => marcarComoLida(notif.id)}
                            title="Marcar como lida"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => excluirNotificacao(notif.id)}
                          title="Excluir"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Detalhes da Notificação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {notificacaoSelecionada && getIconeNotificacao(notificacaoSelecionada.tipo, notificacaoSelecionada.tipoOriginal)}
              Detalhes da Notificação
            </DialogTitle>
          </DialogHeader>
          
          {notificacaoSelecionada && (
            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {notificacaoSelecionada.mensagem}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(notificacaoSelecionada.data).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {notificacaoSelecionada.lida ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Lida
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    <BellRing className="w-3 h-3 mr-1" />
                    Não lida
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                {!notificacaoSelecionada.lida && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      marcarComoLida(notificacaoSelecionada.id)
                      setNotificacaoSelecionada(prev => prev ? { ...prev, lida: true } : null)
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar como lida
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    excluirNotificacao(notificacaoSelecionada.id)
                    setIsModalOpen(false)
                    setNotificacaoSelecionada(null)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

