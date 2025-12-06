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
  Users,
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
  Building2,
  ChevronDown
} from "lucide-react"
import PWAInstallPrompt from "@/components/pwa-install-prompt"
import { PWAAuthGuard } from "@/components/pwa-auth-guard"
import { OfflineSyncIndicator } from "@/components/offline-sync-indicator"
import { PWAErrorBoundary } from "@/components/pwa-error-boundary"
import { usePersistentSession } from "@/hooks/use-persistent-session"
import { useAuthInterceptor } from "@/hooks/use-auth-interceptor"

interface PWALayoutProps {
  children: React.ReactNode
}

export default function PWALayout({ children }: PWALayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [user, setUser] = useState<{ id: number; nome: string; cargo?: string; profile?: any } | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [documentosPendentes, setDocumentosPendentes] = useState(0)
  
  // Hook de sessão persistente
  const {
    isAuthenticated,
    isLoading: sessionLoading,
    user: persistentUser,
    logout: persistentLogout
  } = usePersistentSession()
  
  // Hook de interceptor de autenticação
  const { isAuthenticated: authInterceptorAuthenticated, checkAuth } = useAuthInterceptor()
  
  // Função de permissão simplificada
  const hasPermission = (permission: string) => {
    if (!isClient) return true
    if (typeof window === 'undefined') return true
    
    try {
      const userData = localStorage.getItem('user_data')
      if (!userData) return true
      
      const user = JSON.parse(userData)
      const role = user.role || user.cargo
      
      if (role === 'admin' || role === 'diretor') return true
      if (role === 'encarregador' || role === 'supervisor') {
        return permission.includes('encarregador') || permission.includes('supervisor') || permission.includes('notificacoes') || permission.includes('ponto') || permission.includes('perfil')
      }
      if (role === 'funcionario' || role === 'operario') {
        return permission.includes('ponto') || permission.includes('perfil') || permission.includes('assinatura') || permission.includes('gruas')
      }
      
      return permission.includes('ponto') || permission.includes('perfil') || permission.includes('assinatura') || permission.includes('gruas')
    } catch (error) {
      console.warn('Erro ao verificar permissão:', error)
      return true
    }
  }
  
  // Verificar se estamos no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Verificar status de conexão
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Carregar dados do usuário
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const userData = localStorage.getItem('user_data')
    const userProfile = localStorage.getItem('user_profile')
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        
        if (userProfile) {
          const parsedProfile = JSON.parse(userProfile)
          parsedUser.profile = parsedProfile
        }
        
        setUser({
          id: parsedUser.id,
          nome: parsedUser.nome,
          cargo: parsedUser.cargo || parsedUser.role,
          ...(parsedUser.profile && { profile: parsedUser.profile })
        })
        
        carregarDocumentosPendentes(parsedUser.id)
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      }
    }
  }, [])

  const carregarDocumentosPendentes = async (userId: number) => {
    try {
      const cachedDocs = localStorage.getItem(`documentos_pendentes_${userId}`)
      if (cachedDocs) {
        const docs = JSON.parse(cachedDocs)
        setDocumentosPendentes(docs.length)
      } else {
        setDocumentosPendentes(0)
      }
    } catch (error) {
      console.error('Erro ao carregar documentos pendentes:', error)
      setDocumentosPendentes(0)
    }
  }

  const handleLogout = async () => {
    if (typeof window === 'undefined') return
    
    await persistentLogout()
    setUser(null)
    setDocumentosPendentes(0)
  }

  // Renderizar apenas no cliente
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Carregando...</h1>
        </div>
      </div>
    )
  }

  const navigationItems = [
    {
      name: "Ponto",
      href: "/pwa/ponto",
      icon: Clock,
      description: "Registrar ponto",
      permission: "ponto_eletronico:visualizar"
    },
    {
      name: "Espelho",
      href: "/pwa/espelho-ponto",
      icon: FileText,
      description: "Ver espelho de ponto",
      permission: "ponto_eletronico:visualizar"
    },
    {
      name: "Obras",
      href: "/pwa/obras",
      icon: Briefcase,
      description: "Minhas obras",
      permission: "obras:visualizar"
    },
    {
      name: "Docs",
      href: "/pwa/documentos",
      icon: FileSignature,
      description: "Documentos",
      permission: "assinatura_digital:visualizar"
    },
    {
      name: "Perfil",
      href: "/pwa/perfil",
      icon: UserCircle,
      description: "Meu perfil",
      permission: "perfil:visualizar"
    }
  ]

  // Adicionar itens de navegação baseado em permissões
  if (hasPermission("encarregador:visualizar")) {
    navigationItems.push({
      name: "Encarregador",
      href: "/pwa/encarregador",
      icon: User,
      description: "Gerenciar funcionários",
      permission: "encarregador:visualizar"
    })
  }

  if (hasPermission("supervisor:visualizar") || hasPermission("admin:visualizar")) {
    navigationItems.push({
      name: "Gerenciar",
      href: "/pwa/gerenciar-funcionarios",
      icon: Users,
      description: "Gerenciar funcionários",
      permission: "supervisor:visualizar"
    })
  }

  if (hasPermission("notificacoes:visualizar") && documentosPendentes > 0) {
    navigationItems.push({
      name: "Notif",
      href: "/pwa/notificacoes",
      icon: Bell,
      description: "Notificações",
      permission: "notificacoes:visualizar"
    })
  }

  // Filtrar itens de navegação
  const filteredNavigationItems = navigationItems.filter(item => {
    if (!item.permission) return true
    return hasPermission(item.permission)
  })

  // Rotas que não precisam do layout
  const noLayoutPaths = ['/pwa/login', '/pwa/redirect']
  const shouldShowLayout = !noLayoutPaths.some(path => pathname === path)

  return (
    <PWAErrorBoundary>
      <PWAAuthGuard>
        {shouldShowLayout ? (
          <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-40 shadow-lg safe-area-pt">
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
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

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/pwa')}
                      className="text-white hover:bg-white/20 p-2 rounded-xl"
                    >
                      <Home className="w-5 h-5" />
                    </Button>

                    {user && (
                      <div className="relative" data-user-menu>
                        <button
                          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                          className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-xl p-2 hover:bg-white/30 transition-all duration-200 shadow-lg"
                        >
                          <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        </button>

                        {isUserMenuOpen && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                            <div className="p-2">
                              <div className="px-3 py-2 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-900">{user.nome}</p>
                                <p className="text-xs text-gray-500">{user.cargo}</p>
                              </div>
                              
                              <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <LogOut className="w-4 h-4" />
                                Sair
                              </button>
                              
                              <div className="border-t border-gray-100 my-1"></div>
                              
                              <div className="px-3 py-2">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>PWA Ativo</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Conteúdo principal */}
            <main className="px-4 pt-4 pb-24">
              {children}
            </main>

            {/* Indicador de sincronização */}
            <div className="fixed bottom-16 left-0 right-0 z-40 px-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50">
                <OfflineSyncIndicator />
              </div>
            </div>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl z-50 safe-area-pb">
              <div className="grid grid-cols-5 h-16">
                {filteredNavigationItems.length > 0 ? (
                  filteredNavigationItems.slice(0, 5).map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <button
                        key={item.name}
                        onClick={() => router.push(item.href)}
                        className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                          isActive 
                            ? "text-blue-600" 
                            : "text-gray-500 active:bg-gray-100"
                        }`}
                      >
                        <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                          <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
                          {isActive && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full animate-pulse" />
                          )}
                        </div>
                        <span className="text-xs font-medium">{item.name}</span>
                      </button>
                    )
                  })
                ) : (
                  <div className="col-span-5 flex items-center justify-center text-gray-500 text-sm">
                    Carregando navegação...
                  </div>
                )}
              </div>
            </nav>

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
    </PWAErrorBoundary>
  )
}
