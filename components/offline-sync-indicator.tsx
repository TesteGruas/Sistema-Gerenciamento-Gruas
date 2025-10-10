"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle,
  AlertCircle 
} from "lucide-react"
import { offlineSync } from "@/lib/offline-sync"
import { useToast } from "@/hooks/use-toast"

export function OfflineSyncIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [queueLength, setQueueLength] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Verificar status da conexão
    setIsOnline(navigator.onLine)
    setQueueLength(offlineSync.getQueueLength())

    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: "Conexão restaurada",
        description: "Sincronizando dados pendentes...",
      })
      handleSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "Sem conexão",
        description: "Suas ações serão sincronizadas quando voltar online",
        variant: "destructive"
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Iniciar sincronização automática
    offlineSync.startAutoSync(5)

    // Atualizar contador da fila periodicamente
    const interval = setInterval(() => {
      setQueueLength(offlineSync.getQueueLength())
    }, 10000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      offlineSync.stopAutoSync()
      clearInterval(interval)
    }
  }, [])

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const result = await offlineSync.processQueue()
      setQueueLength(offlineSync.getQueueLength())
      
      if (result.success > 0) {
        toast({
          title: "Sincronização concluída",
          description: `${result.success} ação(ões) sincronizada(s) com sucesso`,
        })
      }
      
      if (result.failed > 0) {
        toast({
          title: "Algumas ações falharam",
          description: `${result.failed} ação(ões) não puderam ser sincronizadas`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error)
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar os dados",
        variant: "destructive"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  if (isOnline && queueLength === 0) {
    return (
      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
        <Cloud className="w-3 h-3 mr-1" />
        Online
      </Badge>
    )
  }

  if (!isOnline) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CloudOff className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-900">Modo Offline</p>
                {queueLength > 0 && (
                  <p className="text-xs text-orange-700">
                    {queueLength} ação(ões) aguardando sincronização
                  </p>
                )}
              </div>
            </div>
            {queueLength > 0 && (
              <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                {queueLength}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (queueLength > 0) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Dados pendentes</p>
                <p className="text-xs text-blue-700">
                  {queueLength} ação(ões) aguardando sincronização
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={isSyncing}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Sincronizar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}

