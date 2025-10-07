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
  X
} from "lucide-react"

interface NotificationData {
  id: string
  title: string
  message: string
  type: 'ponto' | 'assinatura' | 'geral'
  timestamp: Date
  read: boolean
}

export default function PWANotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Verificar se notificações são suportadas
    if ('Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }

    // Simular notificações (em produção, viria de uma API)
    const mockNotifications: NotificationData[] = [
      {
        id: '1',
        title: 'Lembrete de Ponto',
        message: 'Não esqueça de registrar sua saída às 18:00',
        type: 'ponto',
        timestamp: new Date(),
        read: false
      },
      {
        id: '2',
        title: 'Documento Pendente',
        message: 'Você tem 3 documentos aguardando assinatura',
        type: 'assinatura',
        timestamp: new Date(Date.now() - 3600000), // 1 hora atrás
        read: false
      },
      {
        id: '3',
        title: 'Sistema Atualizado',
        message: 'Nova versão do PWA disponível',
        type: 'geral',
        timestamp: new Date(Date.now() - 7200000), // 2 horas atrás
        read: true
      }
    ]
    setNotifications(mockNotifications)
  }, [])

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

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ponto':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'assinatura':
        return <FileSignature className="w-5 h-5 text-green-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'ponto':
        return <Badge className="bg-blue-100 text-blue-800">Ponto</Badge>
      case 'assinatura':
        return <Badge className="bg-green-100 text-green-800">Assinatura</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Geral</Badge>
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

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
        {notifications.map((notification) => (
          <Card key={notification.id} className={!notification.read ? "bg-blue-50 border-blue-200" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-sm text-gray-900">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {getNotificationBadge(notification.type)}
                        <span className="text-xs text-gray-500">
                          {notification.timestamp.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {!notification.read && (
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
        
        {notifications.length === 0 && (
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
      </div>
    </div>
  )
}
