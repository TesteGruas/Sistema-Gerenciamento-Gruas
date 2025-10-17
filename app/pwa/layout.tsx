"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  FileSignature, 
  FileText,
  Settings,
  User, 
  LogOut, 
  Menu, 
  X,
  Smartphone,
  Wifi,
  WifiOff,
  Bell,
  UserCircle,
  Briefcase,
  Home,
  Building2
} from "lucide-react"
import PWAInstallPrompt from "@/components/pwa-install-prompt"
import { PWAAuthGuard } from "@/components/pwa-auth-guard"
import { OfflineSyncIndicator } from "@/components/offline-sync-indicator"

interface PWALayoutProps {
  children: React.ReactNode
}

export default function PWALayout({ children }: PWALayoutProps) {
  const pathname = usePathname()
  const [isOnline, setIsOnline] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<{ id: number; nome: string; cargo?: string } | null>(null)
  const router = useRouter()

  // Verificar status de conexão e carregar dados do usuário
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Verificar status inicial
    setIsOnline(navigator.onLine)

    // Carregar dados do usuário do localStorage
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser({
          id: parsedUser.id,
          nome: parsedUser.nome,
          cargo: parsedUser.cargo || parsedUser.role
        })
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleLogout = () => {
    if (typeof window === 'undefined') return
    
    // Limpar dados do usuário e localStorage
    setUser(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('refresh_token')
    // Redirecionar para login
    router.push('/pwa/login')
  }

  const navigationItems = [
    {
      name: "Ponto",
      href: "/pwa/ponto",
      icon: Clock,
      description: "Registrar ponto"
    },
    {
      name: "Espelho",
      href: "/pwa/espelho-ponto",
      icon: FileText,
      description: "Ver espelho de ponto"
    },
    {
      name: "Gruas",
      href: "/pwa/gruas",
      icon: Briefcase,
      description: "Minhas gruas"
    },
    {
      name: "Documentos",
      href: "/pwa/documentos",
      icon: FileSignature,
      description: "Assinar documentos"
    },
    {
      name: "Config",
      href: "/pwa/configuracoes",
      icon: Settings,
      description: "Configurações"
    }
  ]

  // Adicionar item de encarregador se o usuário for encarregador
  const isEncarregador = user?.cargo?.toLowerCase().includes('encarregador') || 
                        user?.cargo?.toLowerCase().includes('supervisor') ||
                        user?.cargo?.toLowerCase().includes('chefe')

  if (isEncarregador) {
    navigationItems.push({
      name: "Encarregador",
      href: "/pwa/encarregador",
      icon: User,
      description: "Gerenciar funcionários"
    })
  }

  // Rotas que não precisam do layout (login e redirect)
  const noLayoutPaths = ['/pwa/login', '/pwa/redirect']
  const shouldShowLayout = !noLayoutPaths.some(path => pathname === path)

  return (
    <PWAAuthGuard>
      {shouldShowLayout ? (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
          {/* Header Minimalista */}
          <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-40 shadow-lg">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                {/* Logo e título */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg">IRBANA</h1>
                    <div className="flex items-center gap-2 text-xs text-blue-100">
                      {isOnline ? (
                        <>
                          <Wifi className="w-3 h-3" />
                          <span>Online</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3 h-3" />
                          <span>Offline</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* User info */}
                {user && (
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Conteúdo principal */}
          <main className="px-4 pt-4 pb-24">
            {/* Indicador de sincronização offline */}
            <div className="mb-4">
              <OfflineSyncIndicator />
            </div>
            
            {children}
          </main>

          {/* Bottom Navigation - Típico de Apps */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
            <div className="grid grid-cols-5 h-16">
              {navigationItems.slice(0, 5).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`flex flex-col items-center justify-center gap-1 transition-all ${
                      isActive 
                        ? "text-blue-600" 
                        : "text-gray-500 active:bg-gray-100"
                    }`}
                  >
                    <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                      <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                      {item.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </nav>

      {/* Prompt de instalação PWA */}
      <PWAInstallPrompt />

      {/* Menu mobile overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="bg-white h-full w-80 shadow-xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.name}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-auto p-4"
                      onClick={() => {
                        router.push(item.href)
                        setIsMenuOpen(false)
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                    </Button>
                  )
                })}
              </div>

              <div className="mt-6 pt-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-red-600 hover:text-red-700"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  Sair do Sistema
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de status offline */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 z-40">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-yellow-800">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Você está offline. Algumas funcionalidades podem estar limitadas.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        </div>
      ) : (
        <div className="min-h-screen">
          {children}
        </div>
      )}
    </PWAAuthGuard>
  )
}
