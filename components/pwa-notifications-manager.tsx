"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, BellRing, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { pwaNotifications } from "@/lib/pwa-notifications"

export function PWANotificationsManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const supported = pwaNotifications.isSupported()
    setIsSupported(supported)
    
    if (supported) {
      setPermission(pwaNotifications.getPermission())
    }
  }, [])

  const handleRequestPermission = async () => {
    setIsLoading(true)
    try {
      const newPermission = await pwaNotifications.requestPermission()
      setPermission(newPermission)

      if (newPermission === 'granted') {
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá lembretes de ponto e alertas de documentos",
        })

        // Agendar lembretes
        await pwaNotifications.scheduleAllReminders()
      } else {
        toast({
          title: "Permissão negada",
          description: "Você não receberá notificações do app",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error)
      toast({
        title: "Erro",
        description: "Não foi possível ativar as notificações",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = async () => {
    await pwaNotifications.showNotification('Teste de Notificação', {
      body: 'As notificações estão funcionando perfeitamente!',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png'
    })
  }

  if (!isSupported) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <BellOff className="w-6 h-6 text-gray-400" />
            <div>
              <p className="font-medium text-gray-700">Notificações não suportadas</p>
              <p className="text-sm text-gray-500">Seu navegador não suporta notificações</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {permission === 'granted' ? (
              <BellRing className="w-6 h-6 text-green-600" />
            ) : (
              <Bell className="w-6 h-6 text-gray-400" />
            )}
            <div>
              <CardTitle className="text-lg">Notificações</CardTitle>
              <CardDescription>
                {permission === 'granted' && 'Lembretes e alertas ativados'}
                {permission === 'denied' && 'Notificações bloqueadas'}
                {permission === 'default' && 'Ative para receber lembretes'}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant={permission === 'granted' ? 'default' : 'secondary'}
            className={
              permission === 'granted' 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : permission === 'denied'
                ? 'bg-red-100 text-red-800 border-red-200'
                : ''
            }
          >
            {permission === 'granted' ? (
              <CheckCircle className="w-3 h-3 mr-1" />
            ) : permission === 'denied' ? (
              <XCircle className="w-3 h-3 mr-1" />
            ) : null}
            {permission === 'granted' && 'Ativas'}
            {permission === 'denied' && 'Bloqueadas'}
            {permission === 'default' && 'Desativadas'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status e Lembretes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">Lembretes de Ponto</p>
            </div>
            <p className="text-xs text-blue-700">12:00 - Almoço</p>
            <p className="text-xs text-blue-700">18:00 - Saída</p>
          </div>
          
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-purple-600" />
              <p className="text-sm font-medium text-purple-900">Alertas</p>
            </div>
            <p className="text-xs text-purple-700">Documentos pendentes</p>
            <p className="text-xs text-purple-700">Atualizações importantes</p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          {permission !== 'granted' && (
            <Button 
              onClick={handleRequestPermission}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Solicitando...' : 'Ativar Notificações'}
            </Button>
          )}
          
          {permission === 'granted' && (
            <Button 
              variant="outline"
              onClick={handleTestNotification}
              className="flex-1"
            >
              <Bell className="w-4 h-4 mr-2" />
              Testar Notificação
            </Button>
          )}
        </div>

        {/* Instruções */}
        {permission === 'denied' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Notificações bloqueadas.</strong> Para ativar, vá em Configurações do navegador &gt; Permissões &gt; Notificações e permita para este site.
            </p>
          </div>
        )}

        {permission === 'granted' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-800">
              ✓ Você receberá notificações automáticas para registro de ponto e documentos pendentes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

