"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Download, Smartphone, CheckCircle, Share, Plus } from "lucide-react"

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
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown')

  useEffect(() => {
    // Detectar tipo de dispositivo
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setDeviceType('ios')
      } else if (/android/.test(userAgent)) {
        setDeviceType('android')
      } else if (/windows|mac|linux/.test(userAgent)) {
        setDeviceType('desktop')
      } else {
        setDeviceType('unknown')
      }
    }

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

    detectDevice()
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

    // Mostrar prompt sempre na página de login (após 2 segundos)
    const showPromptAfterDelay = () => {
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallPrompt(true)
        }
      }, 2000)
    }

    showPromptAfterDelay()

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

  // Não mostrar se não estiver no prompt
  if (!showInstallPrompt) {
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
              
              {/* Instruções específicas por dispositivo */}
              {deviceType === 'ios' && (
                <div className="bg-blue-100 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Share className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">No iOS:</span>
                  </div>
                  <ol className="text-xs text-blue-800 space-y-1">
                    <li>1. Toque no botão <strong>Compartilhar</strong> (□↑) na parte inferior</li>
                    <li>2. Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></li>
                    <li>3. Toque em <strong>"Adicionar"</strong> no canto superior direito</li>
                  </ol>
                </div>
              )}
              
              {deviceType === 'android' && (
                <div className="bg-blue-100 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">No Android:</span>
                  </div>
                  <ol className="text-xs text-blue-800 space-y-1">
                    <li>1. Toque no menu (⋮) no navegador</li>
                    <li>2. Selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar app"</strong></li>
                    <li>3. Confirme a instalação</li>
                  </ol>
                </div>
              )}
              
              <div className="flex gap-2">
                {deferredPrompt ? (
                  <Button
                    size="sm"
                    onClick={handleInstallClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Instalar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Siga as instruções acima
                  </Button>
                )}
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
