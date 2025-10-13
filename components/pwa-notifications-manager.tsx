'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Bell, BellOff, Settings, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface NotificationSettings {
  pontoLembrete: boolean
  documentoPendente: boolean
  aprovacaoPendente: boolean
  horarioAlmoco: boolean
  horarioSaida: boolean
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  timestamp: Date
  read: boolean
}

export function PWANotificationsManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [settings, setSettings] = useState<NotificationSettings>({
    pontoLembrete: true,
    documentoPendente: true,
    aprovacaoPendente: true,
    horarioAlmoco: true,
    horarioSaida: true
  })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { toast } = useToast()

  useEffect(() => {
    checkNotificationPermission()
    loadNotifications()
    setupNotificationListeners()
  }, [])

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      
      if (permission === 'granted') {
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá lembretes importantes",
        })
      } else {
        toast({
          title: "Notificações negadas",
          description: "Você pode ativar manualmente nas configurações do navegador",
          variant: "destructive"
        })
      }
    }
  }

  const loadNotifications = () => {
    // Simular notificações (em produção viria da API)
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Lembrete de Ponto',
        message: 'Não esqueça de registrar sua saída às 18:00',
        type: 'info',
        timestamp: new Date(),
        read: false
      },
      {
        id: '2',
        title: 'Documento Pendente',
        message: 'Você tem 2 documentos aguardando assinatura',
        type: 'warning',
        timestamp: new Date(Date.now() - 3600000),
        read: false
      },
      {
        id: '3',
        title: 'Aprovação Concluída',
        message: 'Suas horas extras foram aprovadas pelo gestor',
        type: 'success',
        timestamp: new Date(Date.now() - 7200000),
        read: true
      }
    ]
    setNotifications(mockNotifications)
  }

  const setupNotificationListeners = () => {
    // Configurar lembretes automáticos
    if (settings.horarioAlmoco) {
      // Lembrete de almoço às 12:00
      scheduleNotification('Lembrete de Almoço', 'Hora do almoço! Registre sua saída.', '12:00')
    }
    
    if (settings.horarioSaida) {
      // Lembrete de saída às 18:00
      scheduleNotification('Lembrete de Saída', 'Hora de encerrar o expediente! Registre sua saída.', '18:00')
    }
  }

  const scheduleNotification = (title: string, message: string, time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const now = new Date()
    const scheduledTime = new Date()
    scheduledTime.setHours(hours, minutes, 0, 0)
    
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }
    
    const timeUntilNotification = scheduledTime.getTime() - now.getTime()
    
    setTimeout(() => {
      if (permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/placeholder-logo.png',
          tag: 'pwa-reminder'
        })
      }
    }, timeUntilNotification)
  }

  const sendTestNotification = () => {
    if (permission === 'granted') {
      new Notification('Teste de Notificação', {
        body: 'Esta é uma notificação de teste do sistema PWA',
        icon: '/placeholder-logo.png',
        tag: 'test'
      })
    } else {
      toast({
        title: "Permissão necessária",
        description: "Ative as notificações primeiro",
        variant: "destructive"
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

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Bell className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Configurações de Permissão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Permissão de Notificações</p>
              <p className="text-sm text-gray-500">
                {permission === 'granted' ? 'Ativada' : 
                 permission === 'denied' ? 'Negada' : 'Não solicitada'}
              </p>
            </div>
            {permission !== 'granted' && (
              <Button onClick={requestNotificationPermission}>
                <Bell className="w-4 h-4 mr-2" />
                Ativar Notificações
              </Button>
            )}
          </div>
          
          {permission === 'granted' && (
            <Button variant="outline" onClick={sendTestNotification}>
              <Bell className="w-4 h-4 mr-2" />
              Enviar Notificação de Teste
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Configurações de Lembretes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Lembretes Automáticos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Lembrete de Ponto</p>
              <p className="text-sm text-gray-500">Lembretes para registrar entrada e saída</p>
            </div>
            <Switch
              checked={settings.pontoLembrete}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, pontoLembrete: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Documentos Pendentes</p>
              <p className="text-sm text-gray-500">Alertas sobre documentos para assinar</p>
            </div>
            <Switch
              checked={settings.documentoPendente}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, documentoPendente: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Aprovações Pendentes</p>
              <p className="text-sm text-gray-500">Notificações sobre aprovações</p>
            </div>
            <Switch
              checked={settings.aprovacaoPendente}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, aprovacaoPendente: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Lembrete de Almoço</p>
              <p className="text-sm text-gray-500">Lembrete às 12:00</p>
            </div>
            <Switch
              checked={settings.horarioAlmoco}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, horarioAlmoco: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Lembrete de Saída</p>
              <p className="text-sm text-gray-500">Lembrete às 18:00</p>
            </div>
            <Switch
              checked={settings.horarioSaida}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, horarioSaida: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Notificações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </CardTitle>
            <Button variant="outline" size="sm" onClick={clearAllNotifications}>
              Limpar Todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BellOff className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    notification.read ? 'bg-gray-50' : 'bg-white border-blue-200'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{notification.title}</h4>
                        {!notification.read && (
                          <Badge variant="default" className="text-xs">Nova</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.timestamp.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}