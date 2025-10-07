"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Download, Smartphone, CheckCircle } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        return
      }
      
      // Verificar se está em modo standalone no iOS
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true)
        return
      }
    }

    checkIfInstalled()

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('PWA instalado pelo usuário')
    } else {
      console.log('PWA não foi instalado')
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
  }

  // Não mostrar se já estiver instalado
  if (isInstalled) {
    return null
  }

  // Não mostrar se não houver prompt disponível
  if (!showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Card className="bg-blue-50 border-blue-200 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Instalar IRBANA PWA
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                Adicione o aplicativo à sua tela inicial para acesso rápido e funcionalidade offline.
              </p>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Instalar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Agora não
                </Button>
              </div>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-blue-600 hover:text-blue-700 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
