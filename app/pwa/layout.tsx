"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  FileSignature, 
  User, 
  LogOut, 
  Menu, 
  X,
  Smartphone,
  Wifi,
  WifiOff
} from "lucide-react"
import PWAInstallPrompt from "@/components/pwa-install-prompt"

interface PWALayoutProps {
  children: React.ReactNode
}

export default function PWALayout({ children }: PWALayoutProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<{ id: number; nome: string; cargo?: string } | null>(null)
  const router = useRouter()

  // Verificar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Verificar status inicial
    setIsOnline(navigator.onLine)

    // Simular usuário logado (em produção, isso viria do contexto de autenticação)
    setUser({
      id: 1,
      nome: "João Silva",
      cargo: "Operador"
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleLogout = () => {
    // Limpar dados do usuário
    setUser(null)
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
      name: "Assinatura",
      href: "/pwa/assinatura",
      icon: FileSignature,
      description: "Assinar documentos"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header PWA */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo e título */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">IRBANA PWA</h1>
                <p className="text-xs text-gray-500">Sistema de Ponto e Assinatura</p>
              </div>
            </div>

            {/* Status e controles */}
            <div className="flex items-center gap-3">
              {/* Status de conexão */}
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs text-gray-600">
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>

              {/* Menu mobile */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Informações do usuário */}
          {user && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{user.nome}</p>
                  <p className="text-xs text-gray-500">{user.cargo}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sair
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Navegação principal */}
      <nav className="bg-white border-b">
        <div className="px-4 py-2">
          <div className="flex gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(item.href)}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className="p-4">
        {children}
      </main>

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
  )
}
