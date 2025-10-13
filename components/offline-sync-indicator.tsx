'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Wifi, WifiOff, Sync, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SyncStatus {
  isOnline: boolean
  pendingActions: number
  lastSync: Date | null
  isSyncing: boolean
}

interface PendingAction {
  id: string
  type: 'ponto' | 'documento' | 'assinatura'
  data: any
  timestamp: Date
  retryCount: number
}

export function OfflineSyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    pendingActions: 0,
    lastSync: null,
    isSyncing: false
  })
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  const { toast } = useToast()

  useEffect(() => {
    // Verificar status de conectividade
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }))
      toast({
        title: "Conexão restaurada",
        description: "Sincronizando dados pendentes...",
      })
      syncPendingActions()
    }

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }))
      toast({
        title: "Modo offline",
        description: "Suas ações serão sincronizadas quando a conexão voltar",
        variant: "destructive"
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Carregar ações pendentes do localStorage
    loadPendingActions()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadPendingActions = () => {
    try {
      const stored = localStorage.getItem('offline-actions')
      if (stored) {
        const actions: PendingAction[] = JSON.parse(stored)
        setPendingActions(actions)
        setStatus(prev => ({ ...prev, pendingActions: actions.length }))
      }
    } catch (error) {
      console.error('Erro ao carregar ações pendentes:', error)
    }
  }

  const savePendingActions = (actions: PendingAction[]) => {
    try {
      localStorage.setItem('offline-actions', JSON.stringify(actions))
      setPendingActions(actions)
      setStatus(prev => ({ ...prev, pendingActions: actions.length }))
    } catch (error) {
      console.error('Erro ao salvar ações pendentes:', error)
    }
  }

  const addPendingAction = (action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>) => {
    const newAction: PendingAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: new Date(),
      retryCount: 0
    }
    
    const updatedActions = [...pendingActions, newAction]
    savePendingActions(updatedActions)
  }

  const syncPendingActions = async () => {
    if (!status.isOnline || pendingActions.length === 0) return

    setStatus(prev => ({ ...prev, isSyncing: true }))

    try {
      const successfulActions: string[] = []
      const failedActions: PendingAction[] = []

      for (const action of pendingActions) {
        try {
          await syncAction(action)
          successfulActions.push(action.id)
        } catch (error) {
          console.error(`Erro ao sincronizar ação ${action.id}:`, error)
          failedActions.push({
            ...action,
            retryCount: action.retryCount + 1
          })
        }
      }

      // Remover ações bem-sucedidas
      const remainingActions = failedActions.filter(
        action => action.retryCount < 3 // Máximo 3 tentativas
      )
      
      savePendingActions(remainingActions)
      setStatus(prev => ({ 
        ...prev, 
        lastSync: new Date(),
        isSyncing: false 
      }))

      if (successfulActions.length > 0) {
        toast({
          title: "Sincronização concluída",
          description: `${successfulActions.length} ação(ões) sincronizada(s) com sucesso`,
        })
      }

    } catch (error) {
      console.error('Erro na sincronização:', error)
      setStatus(prev => ({ ...prev, isSyncing: false }))
    }
  }

  const syncAction = async (action: PendingAction) => {
    // Simular sincronização com API
    const token = localStorage.getItem('access_token')
    
    switch (action.type) {
      case 'ponto':
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ponto-eletronico`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(action.data)
        })
        break
      
      case 'documento':
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documentos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(action.data)
        })
        break
      
      case 'assinatura':
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assinaturas`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(action.data)
        })
        break
    }
  }

  const retryFailedActions = () => {
    if (status.isOnline) {
      syncPendingActions()
    }
  }

  const clearAllPendingActions = () => {
    savePendingActions([])
    toast({
      title: "Ações pendentes removidas",
      description: "Todas as ações pendentes foram removidas",
    })
  }

  const getStatusIcon = () => {
    if (status.isSyncing) return <Sync className="w-4 h-4 animate-spin" />
    if (status.isOnline) return <Wifi className="w-4 h-4 text-green-500" />
    return <WifiOff className="w-4 h-4 text-red-500" />
  }

  const getStatusText = () => {
    if (status.isSyncing) return 'Sincronizando...'
    if (status.isOnline) return 'Online'
    return 'Offline'
  }

  const getStatusColor = () => {
    if (status.isSyncing) return 'bg-blue-100 text-blue-800'
    if (status.isOnline) return 'bg-green-100 text-green-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-4">
      {/* Indicador de Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className="font-medium">{getStatusText()}</p>
                <p className="text-sm text-gray-500">
                  {status.lastSync 
                    ? `Última sincronização: ${status.lastSync.toLocaleString('pt-BR')}`
                    : 'Nunca sincronizado'
                  }
                </p>
              </div>
            </div>
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Ações Pendentes */}
      {pendingActions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <h3 className="font-medium">Ações Pendentes</h3>
                <Badge variant="outline">{pendingActions.length}</Badge>
              </div>
              <div className="flex gap-2">
                {status.isOnline && (
                  <Button size="sm" onClick={retryFailedActions}>
                    <Sync className="w-4 h-4 mr-2" />
                    Sincronizar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={clearAllPendingActions}>
                  Limpar
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              {pendingActions.slice(0, 5).map(action => (
                <div key={action.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {action.type === 'ponto' && 'Registro de Ponto'}
                      {action.type === 'documento' && 'Assinatura de Documento'}
                      {action.type === 'assinatura' && 'Assinatura Digital'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {action.timestamp.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  {action.retryCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {action.retryCount} tentativas
                    </Badge>
                  )}
                </div>
              ))}
              
              {pendingActions.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  +{pendingActions.length - 5} mais ações pendentes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções Offline */}
      {!status.isOnline && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-800">Modo Offline</h3>
                <p className="text-sm text-orange-700 mt-1">
                  Você está offline. Suas ações serão salvas localmente e sincronizadas 
                  automaticamente quando a conexão for restaurada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}