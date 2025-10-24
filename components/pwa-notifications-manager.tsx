"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  BellOff, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Smartphone,
  Wifi,
  WifiOff
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NotificationPermission {
  granted: boolean
  denied: boolean
  default: boolean
}

export function PWANotificationsManager() {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true
  })
  const [isSupported, setIsSupported] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Verificar suporte a notificações
    if (typeof window !== 'undefined') {
      setIsSupported('Notification' in window)
      
      // Verificar status de conexão
      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)
      
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      setIsOnline(navigator.onLine)
      
      // Verificar permissão atual
      if ('Notification' in window) {
        const currentPermission = Notification.permission
        setPermission({
          granted: currentPermission === 'granted',
          denied: currentPermission === 'denied',
          default: currentPermission === 'default'
        })
      }
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta notificações",
        variant: "destructive",
        duration: 4000 // 4 segundos
      })
      return
    }

    try {
      const result = await Notification.requestPermission()
      
      if (result === 'granted') {
        setPermission({
          granted: true,
          denied: false,
          default: false
        })
        
        toast({
          title: "Permissão concedida!",
          description: "Você receberá notificações do sistema",
          variant: "default",
          duration: 3000 // 3 segundos
        })
        
        // Enviar notificação de teste
        new Notification('IRBANA PWA', {
          body: 'Notificações ativadas com sucesso!',
          icon: '/icon-192x192.png',
          badge: '/icon-72x72.png'
        })
      } else {
        setPermission({
          granted: false,
          denied: true,
          default: false
        })
        
        toast({
          title: "Permissão negada",
          description: "Você pode ativar as notificações nas configurações do navegador",
          variant: "destructive",
          duration: 4000 // 4 segundos
        })
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error)
      toast({
        title: "Erro",
        description: "Não foi possível solicitar permissão para notificações",
        variant: "destructive",
        duration: 4000 // 4 segundos
      })
    }
  }

  const sendTestNotification = () => {
    if (!permission.granted) {
      toast({
        title: "Permissão necessária",
        description: "Ative as notificações primeiro",
        variant: "destructive"
      })
      return
    }

    try {
      new Notification('IRBANA PWA - Teste', {
        body: 'Esta é uma notificação de teste do sistema IRBANA',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: 'test-notification',
        requireInteraction: true
      })
      
      toast({
        title: "Notificação enviada!",
        description: "Verifique se a notificação apareceu",
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar a notificação",
        variant: "destructive"
      })
    }
  }

  const getPermissionStatus = () => {
    if (permission.granted) {
      return {
        text: "Ativadas",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle
      }
    } else if (permission.denied) {
      return {
        text: "Negadas",
        color: "bg-red-100 text-red-800",
        icon: AlertCircle
      }
    } else {
      return {
        text: "Pendente",
        color: "bg-yellow-100 text-yellow-800",
        icon: Bell
      }
    }
  }

  const status = getPermissionStatus()
  const StatusIcon = status.icon

  if (!isSupported) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="font-medium text-orange-900">Notificações não suportadas</p>
              <p className="text-sm text-orange-700">
                Seu navegador não suporta notificações push
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notificações Push
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status atual */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Status das Notificações</p>
              <p className="text-sm text-gray-600">
                {permission.granted 
                  ? "Você receberá notificações do sistema"
                  : permission.denied
                  ? "Notificações foram negadas"
                  : "Permissão ainda não foi solicitada"
                }
              </p>
            </div>
          </div>
          <Badge className={status.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.text}
          </Badge>
        </div>

        {/* Status de conexão */}
        <div className="flex items-center gap-2 text-sm">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-green-700">Conectado</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-600" />
              <span className="text-red-700">Desconectado</span>
            </>
          )}
        </div>

        {/* Ações */}
        <div className="space-y-2">
          {!permission.granted && !permission.denied && (
            <Button 
              onClick={requestPermission}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Bell className="w-4 h-4 mr-2" />
              Ativar Notificações
            </Button>
          )}

          {permission.granted && (
            <div className="space-y-2">
              <Button 
                onClick={sendTestNotification}
                variant="outline"
                className="w-full"
              >
                <Bell className="w-4 h-4 mr-2" />
                Enviar Notificação de Teste
              </Button>
              
              <div className="text-xs text-gray-500 text-center">
                <p>✅ Notificações ativadas</p>
                <p>Você receberá alertas sobre:</p>
                <ul className="mt-1 space-y-0.5">
                  <li>• Registros de ponto</li>
                  <li>• Documentos pendentes</li>
                  <li>• Avisos importantes</li>
                </ul>
              </div>
            </div>
          )}

          {permission.denied && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Para ativar as notificações:
              </p>
              <ol className="text-xs text-gray-500 space-y-1">
                <li>1. Clique no ícone de notificações na barra de endereços</li>
                <li>2. Selecione "Permitir"</li>
                <li>3. Recarregue a página</li>
              </ol>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}