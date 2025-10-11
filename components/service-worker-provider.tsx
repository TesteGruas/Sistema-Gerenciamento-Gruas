"use client"

import { useEffect, useState } from 'react'
import { initServiceWorker, getServiceWorkerManager } from '@/lib/service-worker-manager'
import { useToast } from '@/hooks/use-toast'

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [swReady, setSwReady] = useState(false)

  useEffect(() => {
    // Inicializar service worker
    initServiceWorker()
      .then((registration) => {
        if (registration) {
          console.log('✅ Service Worker inicializado com sucesso')
          setSwReady(true)
        }
      })
      .catch((error) => {
        console.error('❌ Erro ao inicializar Service Worker:', error)
      })

    // Configurar listeners de sincronização
    const handleSyncAprovacoes = () => {
      console.log('🔄 Evento de sincronização de aprovações recebido')
      // O componente de encarregador deve ter seu próprio listener
    }

    const handleSyncAssinaturas = () => {
      console.log('🔄 Evento de sincronização de assinaturas recebido')
      // O componente de assinaturas deve ter seu próprio listener
    }

    const handleSyncPonto = () => {
      console.log('🔄 Evento de sincronização de ponto recebido')
      // O componente de ponto deve ter seu próprio listener
    }

    window.addEventListener('sw-sync-aprovacoes', handleSyncAprovacoes)
    window.addEventListener('sw-sync-assinaturas', handleSyncAssinaturas)
    window.addEventListener('sw-sync-ponto', handleSyncPonto)

    // Listener para quando voltar online
    const handleOnline = () => {
      console.log('🌐 Conexão restaurada')
      
      toast({
        title: "Conexão restaurada",
        description: "Sincronizando dados pendentes...",
        variant: "default"
      })

      // Registrar sincronizações
      const manager = getServiceWorkerManager()
      manager.syncAll()
    }

    const handleOffline = () => {
      console.log('📴 Conexão perdida')
      
      toast({
        title: "Modo Offline",
        description: "Você está sem conexão. As alterações serão sincronizadas quando reconectar.",
        variant: "default"
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup
    return () => {
      window.removeEventListener('sw-sync-aprovacoes', handleSyncAprovacoes)
      window.removeEventListener('sw-sync-assinaturas', handleSyncAssinaturas)
      window.removeEventListener('sw-sync-ponto', handleSyncPonto)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [toast])

  return <>{children}</>
}

