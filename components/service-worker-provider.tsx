"use client"

import { useEffect, useState } from 'react'
import { initServiceWorker, getServiceWorkerManager } from '@/lib/service-worker-manager'
import { useToast } from '@/hooks/use-toast'

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [swReady, setSwReady] = useState(false)

  useEffect(() => {
    // Verificar suporte antes de tentar registrar
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Inicializar service worker
    initServiceWorker()
      .then((registration) => {
        if (registration) {
          setSwReady(true)
        }
      })
      .catch((error) => {
        // Apenas logar erros reais, não avisos de não suporte
        if (error?.message && !error.message.includes('não é suportado')) {
          console.error('❌ Erro ao inicializar Service Worker:', error)
        }
      })

    // Configurar listeners de sincronização
    const handleSyncAprovacoes = () => {
      // O componente de encarregador deve ter seu próprio listener
    }

    const handleSyncAssinaturas = () => {
      // O componente de assinaturas deve ter seu próprio listener
    }

    const handleSyncPonto = () => {
      // O componente de ponto deve ter seu próprio listener
    }

    window.addEventListener('sw-sync-aprovacoes', handleSyncAprovacoes)
    window.addEventListener('sw-sync-assinaturas', handleSyncAssinaturas)
    window.addEventListener('sw-sync-ponto', handleSyncPonto)

    // Listener para quando voltar online
    const handleOnline = () => {
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

