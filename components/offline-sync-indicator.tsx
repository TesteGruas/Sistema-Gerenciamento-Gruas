'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface RefreshCwStatus {
  isOnline: boolean
  pendingActions: number
  lastRefreshCw: Date | null
  isRefreshCwing: boolean
}

interface PendingAction {
  id: string
  type: 'ponto' | 'documento' | 'assinatura'
  data: any
  timestamp: Date
  retryCount: number
}

export function OfflineSyncIndicator() {
  const [status, setStatus] = useState<RefreshCwStatus>({
    isOnline: navigator.onLine,
    pendingActions: 0,
    lastRefreshCw: null,
    isRefreshCwing: false
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

    setStatus(prev => ({ ...prev, isRefreshCwing: true }))

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
        lastRefreshCw: new Date(),
        isRefreshCwing: false 
      }))

      if (successfulActions.length > 0) {
        toast({
          title: "Sincronização concluída",
          description: `${successfulActions.length} ação(ões) sincronizada(s) com sucesso`,
        })
      }

    } catch (error) {
      console.error('Erro na sincronização:', error)
      setStatus(prev => ({ ...prev, isRefreshCwing: false }))
    }
  }

  const syncAction = async (action: PendingAction) => {
    // Simular sincronização com API
    const token = localStorage.getItem('access_token')
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    
    switch (action.type) {
      case 'ponto':
        await fetch(`${apiUrl}/api/ponto-eletronico`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(action.data)
        })
        break
      
      case 'documento':
        await fetch(`${apiUrl}/api/documentos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(action.data)
        })
        break
      
      case 'assinatura':
        await fetch(`${apiUrl}/api/assinaturas`, {
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
    if (status.isRefreshCwing) return <RefreshCw className="w-4 h-4 animate-spin" />
    if (status.isOnline) return <Wifi className="w-4 h-4 text-green-500" />
    return <WifiOff className="w-4 h-4 text-red-500" />
  }

  const getStatusText = () => {
    if (status.isRefreshCwing) return 'Sincronizando...'
    if (status.isOnline) return 'Online'
    return 'Offline'
  }

  const getStatusColor = () => {
    if (status.isRefreshCwing) return 'bg-blue-100 text-blue-800'
    if (status.isOnline) return 'bg-green-100 text-green-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="px-3 py-2">
      {/* Indicador de Status Discreto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <p className="text-sm font-medium">{getStatusText()}</p>
            {pendingActions.length > 0 && (
              <p className="text-xs text-gray-500">
                {pendingActions.length} ação(ões) pendente(s)
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingActions.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {pendingActions.length}
            </Badge>
          )}
          <Badge className={`text-xs ${getStatusColor()}`}>
            {getStatusText()}
          </Badge>
        </div>
      </div>

    </div>
  )
}