"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Settings, 
  Bell, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Download, 
  Trash2,
  ArrowLeft,
  User,
  Shield,
  Info,
  RefreshCw
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { PWANotificationsManager } from "@/components/pwa-notifications-manager"

export default function PWAConfiguracoesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [autoSync, setAutoSync] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [locationTracking, setLocationTracking] = useState(true)
  const [cacheSize, setCacheSize] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Carregar dados do usuário
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      }
    }

    // Verificar status de conexão
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    // Carregar configurações salvas
    const savedAutoSync = localStorage.getItem('pwa_auto_sync')
    const savedNotifications = localStorage.getItem('pwa_notifications')
    const savedLocation = localStorage.getItem('pwa_location_tracking')
    
    setAutoSync(savedAutoSync !== 'false')
    setNotifications(savedNotifications !== 'false')
    setLocationTracking(savedLocation !== 'false')

    // Calcular tamanho do cache
    calculateCacheSize()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const calculateCacheSize = () => {
    try {
      let totalSize = 0
      
      // Calcular tamanho do localStorage
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length
        }
      }
      
      setCacheSize(Math.round(totalSize / 1024)) // Em KB
    } catch (error) {
      console.error('Erro ao calcular tamanho do cache:', error)
    }
  }

  const handleAutoSyncChange = (checked: boolean) => {
    setAutoSync(checked)
    localStorage.setItem('pwa_auto_sync', checked.toString())
    
  }

  const handleNotificationsChange = (checked: boolean) => {
    setNotifications(checked)
    localStorage.setItem('pwa_notifications', checked.toString())
    
  }

  const handleLocationChange = (checked: boolean) => {
    setLocationTracking(checked)
    localStorage.setItem('pwa_location_tracking', checked.toString())
    
  }

  const clearCache = () => {
    try {
      // Limpar dados não essenciais
      const keysToKeep = ['access_token', 'user_data', 'refresh_token']
      const keysToRemove = []
      
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && !keysToKeep.includes(key)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      calculateCacheSize()

    } catch (error) {
      console.error('Erro ao limpar cache:', error)
      
    }
  }

  const forceSync = () => {

    // Simular sincronização
    setTimeout(() => {
      
    }, 2000)
  }

  const exportData = () => {
    try {
      const userData = localStorage.getItem('user_data')
      const registros = localStorage.getItem('cached_registros_ponto_hoje')
      
      const exportData = {
        user: userData ? JSON.parse(userData) : null,
        registros: registros ? JSON.parse(registros) : null,
        timestamp: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `irbana-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Erro ao exportar dados:', error)
      
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Gerencie suas preferências</p>
        </div>
      </div>

      {/* Configurações de notificações */}
      <PWANotificationsManager />

      {/* Configurações gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-sync">Sincronização Automática</Label>
              <p className="text-sm text-gray-600">
                Sincronizar dados automaticamente quando online
              </p>
            </div>
            <Switch
              id="auto-sync"
              checked={autoSync}
              onCheckedChange={handleAutoSyncChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Notificações do Sistema</Label>
              <p className="text-sm text-gray-600">
                Receber alertas e lembretes importantes
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={handleNotificationsChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="location">Rastreamento de Localização</Label>
              <p className="text-sm text-gray-600">
                Usar GPS para validar registros de ponto
              </p>
            </div>
            <Switch
              id="location"
              checked={locationTracking}
              onCheckedChange={handleLocationChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Gerenciamento de dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Gerenciamento de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Tamanho do Cache</p>
              <p className="text-sm text-gray-600">
                {cacheSize} KB de dados armazenados localmente
              </p>
            </div>
            <Button
              onClick={clearCache}
              variant="outline"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Exportar Dados</p>
              <p className="text-sm text-gray-600">
                Fazer backup dos seus dados
              </p>
            </div>
            <Button
              onClick={exportData}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações do app */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Informações do App
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Versão</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Plataforma</span>
            <span className="font-medium">PWA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Última atualização</span>
            <span className="font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
