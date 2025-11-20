"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bell, 
  BellRing,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  RefreshCw
} from "lucide-react"
import { PWANotificationsManager } from "@/components/pwa-notifications-manager"
import { useToast } from "@/hooks/use-toast"
import { NotificacoesAPI, Notificacao as NotificacaoAPI } from "@/lib/api-notificacoes"

interface Notificacao {
  id: string
  tipo: 'info' | 'alerta' | 'sucesso' | 'erro'
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
  const { toast } = useToast()

  useEffect(() => {
    carregarNotificacoes()
  }, [filtro])

  const carregarNotificacoes = async () => {
    setLoading(true)
    try {
      // Buscar notificações reais da API
      const response = await NotificacoesAPI.listar({
        page: 1,
        limit: 50,
        lida: filtro === 'todas' ? undefined : false
      })

      if (response.success && response.data) {
        // Mapear notificações da API para o formato esperado
        const notificacoesMapeadas: Notificacao[] = response.data.map((notif: NotificacaoAPI) => {
          // Mapear tipos da API para tipos do componente
          let tipo: 'info' | 'alerta' | 'sucesso' | 'erro' = 'info'
          if (notif.tipo === 'warning' || notif.tipo === 'alerta') {
            tipo = 'alerta'
          } else if (notif.tipo === 'success' || notif.tipo === 'sucesso') {
            tipo = 'sucesso'
          } else if (notif.tipo === 'error' || notif.tipo === 'erro') {
            tipo = 'erro'
          }

          return {
            id: String(notif.id),
            tipo,
            titulo: notif.titulo,
            mensagem: notif.mensagem,
            lida: notif.lida,
            data: notif.data || notif.created_at || new Date().toISOString(),
            acao: notif.link
          }
        })

        setNotificacoes(notificacoesMapeadas)
      } else {
        console.warn('Resposta da API sem dados:', response)
        setNotificacoes([])
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as notificações",
        variant: "destructive"
      })
      setNotificacoes([])
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLida = async (id: string) => {
    try {
      await NotificacoesAPI.marcarComoLida(id)
      setNotificacoes(prev => 
        prev.map(n => n.id === id ? { ...n, lida: true } : n)
      )
      toast({
        title: "Sucesso",
        description: "Notificação marcada como lida",
      })
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida",
        variant: "destructive"
      })
    }
  }

  const excluirNotificacao = async (id: string) => {
    try {
      await NotificacoesAPI.deletar(id)
      setNotificacoes(prev => prev.filter(n => n.id !== id))
      toast({
        title: "Notificação excluída",
        description: "A notificação foi removida",
      })
    } catch (error) {
      console.error('Erro ao excluir notificação:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a notificação",
        variant: "destructive"
      })
    }
  }

  const marcarTodasComoLidas = async () => {
    try {
      await NotificacoesAPI.marcarTodasComoLidas()
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
      toast({
        title: "Todas marcadas como lidas",
        description: "Todas as notificações foram marcadas como lidas",
      })
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas as notificações como lidas",
        variant: "destructive"
      })
    }
  }

  const getIconeNotificacao = (tipo: string) => {
    switch (tipo) {
      case 'sucesso': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'alerta': return <AlertCircle className="w-5 h-5 text-orange-600" />
      case 'erro': return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const notificacoesFiltradas = notificacoes.filter(n => 
    filtro === 'todas' || !n.lida
  )

  const naoLidas = notificacoes.filter(n => !n.lida).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
        <p className="text-gray-600">Gerencie suas notificações e alertas</p>
      </div>

      {/* Gerenciador de Notificações PWA */}
      <PWANotificationsManager />

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{notificacoes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BellRing className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Não Lidas</p>
                <p className="text-2xl font-bold text-orange-600">{naoLidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                      <div className="flex items-start gap-3">
                        {getIconeNotificacao(notif.tipo)}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{notif.titulo}</h4>
                            {!notif.lida && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                Nova
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notif.mensagem}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(notif.data).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
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

                      {notif.acao && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = notif.acao!}
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

