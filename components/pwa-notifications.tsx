"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  BellOff, 
  Clock, 
  FileSignature, 
  CheckCircle,
  AlertCircle,
  X,
  Loader2
} from "lucide-react"
import { NotificacoesAPI, type Notificacao } from "@/lib/api-notificacoes"
import { useToast } from "@/components/ui/use-toast"

export default function PWANotifications() {
  const [notifications, setNotifications] = useState<Notificacao[]>([])
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Verificar se notificações são suportadas
    if ('Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }

    // Carregar notificações da API
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await NotificacoesAPI.listar({ limit: 20, page: 1 })
      setNotifications(response.data)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar notificações'
      setError(errorMessage)
      console.error('Erro ao carregar notificações:', err)
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const requestNotificationPermission = async () => {
    if (!isSupported) return

    const permission = await Notification.requestPermission()
    setPermission(permission)

    if (permission === 'granted') {
      // Enviar notificação de teste
      new Notification('IRBANA PWA', {
        body: 'Notificações ativadas com sucesso!',
        icon: '/placeholder-logo.png',
        badge: '/placeholder-logo.png'
      })
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await NotificacoesAPI.marcarComoLida(id)
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, lida: true } : notif
        )
      )
    } catch (err: any) {
      console.error('Erro ao marcar notificação como lida:', err)
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar a notificação como lida',
        variant: 'destructive'
      })
    }
  }

  const removeNotification = async (id: string) => {
    try {
      await NotificacoesAPI.deletar(id)
      setNotifications(prev => prev.filter(notif => notif.id !== id))
      toast({
        title: 'Sucesso',
        description: 'Notificação removida com sucesso'
      })
    } catch (err: any) {
      console.error('Erro ao remover notificação:', err)
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a notificação',
        variant: 'destructive'
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'rh':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'grua':
        return <FileSignature className="w-5 h-5 text-purple-600" />
      case 'obra':
        return <FileSignature className="w-5 h-5 text-indigo-600" />
      case 'financeiro':
        return <FileSignature className="w-5 h-5 text-green-600" />
      case 'estoque':
        return <FileSignature className="w-5 h-5 text-orange-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'rh':
        return <Badge className="bg-blue-100 text-blue-800">RH</Badge>
      case 'grua':
        return <Badge className="bg-purple-100 text-purple-800">Grua</Badge>
      case 'obra':
        return <Badge className="bg-indigo-100 text-indigo-800">Obra</Badge>
      case 'financeiro':
        return <Badge className="bg-green-100 text-green-800">Financeiro</Badge>
      case 'estoque':
        return <Badge className="bg-orange-100 text-orange-800">Estoque</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Aviso</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erro</Badge>
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Geral</Badge>
    }
  }

  const unreadCount = notifications.filter(n => !n.lida).length

  if (!isSupported) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header das notificações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Notificações</h2>
          {unreadCount > 0 && (
            <Badge className="bg-red-100 text-red-800">
              {unreadCount}
            </Badge>
          )}
        </div>
        
        {permission !== 'granted' && (
          <Button
            size="sm"
            onClick={requestNotificationPermission}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Bell className="w-4 h-4 mr-1" />
            Ativar Notificações
          </Button>
        )}
      </div>

      {/* Status das notificações */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {permission === 'granted' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            <div>
              <p className="font-medium text-sm">
                {permission === 'granted' 
                  ? 'Notificações ativadas' 
                  : 'Notificações desativadas'
                }
              </p>
              <p className="text-xs text-gray-500">
                {permission === 'granted' 
                  ? 'Você receberá lembretes e atualizações'
                  : 'Ative as notificações para receber lembretes importantes'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de notificações */}
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Carregando notificações...</span>
          </div>
        )}
        
        {!loading && notifications.map((notification) => (
          <Card key={notification.id} className={!notification.lida ? "bg-blue-50 border-blue-200" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getNotificationIcon(notification.tipo)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-sm text-gray-900">
                        {notification.titulo}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.mensagem}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {getNotificationBadge(notification.tipo)}
                        <span className="text-xs text-gray-500">
                          {new Date(notification.data).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {!notification.lida && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeNotification(notification.id)}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {!loading && notifications.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma notificação
              </h3>
              <p className="text-gray-500">
                Você está em dia! Novas notificações aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={loadNotifications}
                className="mt-2"
              >
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
