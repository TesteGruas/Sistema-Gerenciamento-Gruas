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
import { PWAErrorBoundary } from "@/components/pwa-error-boundary"
import { usePersistentSession } from "@/hooks/use-persistent-session"
import { useAuthInterceptor } from "@/hooks/use-auth-interceptor"
import { usePWAPermissions } from "@/hooks/use-pwa-permissions"
import { PWA_MENU_ITEMS } from "@/app/pwa/lib/permissions"
import { PageLoader } from "@/components/ui/loader"
import { EmpresaProvider, useEmpresa } from "@/hooks/use-empresa"
import Image from "next/image"

interface PWALayoutProps {
  children: React.ReactNode
}

function PWALayoutContent({ children }: PWALayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { empresa } = useEmpresa()
  const [isOnline, setIsOnline] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [user, setUser] = useState<{ id: number; nome: string; cargo?: string; profile?: any } | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [documentosPendentes, setDocumentosPendentes] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [previousPathname, setPreviousPathname] = useState<string | null>(null)
  
  // Hook de sessão persistente
  const {
    isAuthenticated,
    isLoading: sessionLoading,
    user: persistentUser,
    logout: persistentLogout
  } = usePersistentSession()
  
  // Hook de interceptor de autenticação
  const { isAuthenticated: authInterceptorAuthenticated, checkAuth } = useAuthInterceptor()
  
  // Hook de permissões PWA (Novo Sistema v2.0)
  const {
    menuItems: pwaMenuItems,
    hasPermission,
    canViewNotifications,
    userRole,
    loading: permissionsLoading
  } = usePWAPermissions()
  
  // Verificar se estamos no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Detectar mudanças de rota e ocultar loading quando a página carregar
  useEffect(() => {
    // Se é a primeira renderização, não fazer nada
    if (previousPathname === null) {
      setPreviousPathname(pathname)
      return
    }

    // Se a rota mudou e estamos navegando, ocultar loading após renderizar
    if (previousPathname !== pathname && isNavigating) {
      setPreviousPathname(pathname)
      
      // Ocultar loading após a página renderizar
      // Usar múltiplas estratégias para garantir que desaparece
      const hideLoading = () => {
        setIsNavigating(false)
      }
      
      // Estratégia 1: Aguardar o próximo frame de renderização (muito rápido)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Estratégia 2: Pequeno delay para garantir transição suave
          setTimeout(hideLoading, 150)
        })
      })
      
      // Fallback: timeout máximo para garantir que sempre desaparece (1s)
      const maxTimer = setTimeout(hideLoading, 1000)
      
      return () => {
        clearTimeout(maxTimer)
      }
    } else if (previousPathname !== pathname) {
      // Se a rota mudou mas não estávamos navegando, atualizar pathname
      setPreviousPathname(pathname)
    }
  }, [pathname, previousPathname, isNavigating])

  // Função wrapper para navegação com loading
  const handleNavigation = (href: string) => {
    // Mostrar loading IMEDIATAMENTE ao clicar
    setIsNavigating(true)
    setIsMenuOpen(false) // Fechar menu ao navegar
    
    // Usar setTimeout para garantir que o estado foi atualizado antes da navegação
    setTimeout(() => {
      router.push(href)
    }, 0)
  }

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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#871b0b] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Carregando...</h1>
        </div>
      </div>
    )
  }

  // Mapear TODOS os itens do menu PWA para formato de navegação
  // O hook usePWAPermissions já retorna os itens filtrados por permissões
  // Se houver poucos itens (apenas Perfil e Config) ou se for admin, usar todos os itens do menu PWA
  const itemsToUse = (pwaMenuItems.length <= 2 || userRole === 'Admin') 
    ? PWA_MENU_ITEMS 
    : pwaMenuItems
  
  const allNavigationItems = itemsToUse
    .filter(item => item && item.icon) // Filtrar itens inválidos ou sem ícone
    .map(item => {
      // Mapear labels para nomes mais curtos para o menu inferior
      const labelMap: Record<string, string> = {
        'Ponto Eletrônico': 'Ponto',
        'Espelho de Ponto': 'Espelho',
        'Documentos': 'Docs',
        'Notificações': 'Notif',
        'Configurações': 'Config',
        'Holerites': 'Holerite'
      }
      
      return {
        name: labelMap[item.label] || item.label,
        href: item.path,
        icon: item.icon, // Garantir que o ícone existe
        description: item.description || item.label,
        permission: Array.isArray(item.permission) ? item.permission[0] : item.permission,
        label: item.label // Manter label original
      }
    })
    .filter(item => item.icon) // Filtro adicional para garantir que o ícone existe

  // Debug: Log para verificar quantos itens estão disponíveis
  if (typeof window !== 'undefined' && allNavigationItems.length <= 2) {
    console.log('PWA Navigation Debug:', {
      pwaMenuItemsCount: pwaMenuItems.length,
      allNavigationItemsCount: allNavigationItems.length,
      userRole,
      pwaMenuItems: pwaMenuItems.map(i => i.label)
    })
  }

  // Adicionar notificações com badge se houver documentos pendentes
  if (canViewNotifications() && documentosPendentes > 0) {
    const notificacaoItem = pwaMenuItems.find(item => item.path === '/pwa/notificacoes')
    if (notificacaoItem && !allNavigationItems.find(item => item.href === '/pwa/notificacoes')) {
      allNavigationItems.push({
        name: "Notif",
        href: "/pwa/notificacoes",
        icon: Bell,
        description: "Notificações",
        permission: "notificacoes:visualizar",
        label: "Notificações"
      })
    }
  }

  // Ordenar itens para a navegação inferior
  // Prioridade: Itens principais primeiro, depois outros, e Perfil/Config sempre no final
  const priorityOrder = [
    'Ponto Eletrônico',
    'Espelho de Ponto',
    'Documentos',
    'Aprovações',
    'Gruas',
    'Holerites',
    'Notificações'
  ]

  // Separar itens por prioridade
  const priorityItems = allNavigationItems.filter(item => 
    priorityOrder.includes(item.label)
  ).sort((a, b) => {
    const indexA = priorityOrder.indexOf(a.label)
    const indexB = priorityOrder.indexOf(b.label)
    return indexA - indexB
  })

  // Itens que não estão na lista de prioridade
  const otherItems = allNavigationItems.filter(item => 
    !priorityOrder.includes(item.label) && 
    item.label !== 'Perfil' && 
    item.label !== 'Configurações'
  )

  // Itens sempre presentes no final: Perfil e Configurações
  const alwaysVisibleItems = allNavigationItems.filter(item => 
    item.label === 'Perfil' || item.label === 'Configurações'
  ).sort((a, b) => {
    // Perfil antes de Configurações
    if (a.label === 'Perfil') return -1
    if (b.label === 'Perfil') return 1
    return 0
  })

  // Itens essenciais da navbar inferior (5 itens: Ponto, Espelho, Home, Docs, Perfil)
  const essentialNavItems = [
    // Ponto
    allNavigationItems.find(item => item.href === '/pwa/ponto') || {
      name: 'Ponto',
      href: '/pwa/ponto',
      icon: Clock,
      label: 'Ponto',
      description: 'Registrar ponto'
    },
    // Espelho
    allNavigationItems.find(item => item.href === '/pwa/espelho-ponto') || {
      name: 'Espelho',
      href: '/pwa/espelho-ponto',
      icon: FileText,
      label: 'Espelho',
      description: 'Ver espelho de ponto'
    },
    // Home (no meio)
    {
      name: 'Home',
      href: '/pwa',
      icon: Home,
      label: 'Home',
      description: 'Página inicial'
    },
    // Docs
    allNavigationItems.find(item => item.href === '/pwa/documentos') || {
      name: 'Docs',
      href: '/pwa/documentos',
      icon: FileSignature,
      label: 'Docs',
      description: 'Documentos'
    },
    // Perfil
    allNavigationItems.find(item => item.href === '/pwa/perfil') || {
      name: 'Perfil',
      href: '/pwa/perfil',
      icon: UserCircle,
      label: 'Perfil',
      description: 'Meu perfil'
    }
  ].filter(Boolean) // Remove itens undefined

  // Usar apenas os 5 itens essenciais na navegação inferior
  const filteredNavigationItems = essentialNavItems.slice(0, 5)

  // Para o menu lateral (drawer), separar em "Principal" e "Mais"
  // Itens principais para o drawer (mesmos da prioridade)
  const drawerMainItems = priorityItems
  
  // Demais itens para o drawer (outros + sempre visíveis)
  const drawerSideItems = [...otherItems, ...alwaysVisibleItems]

  // Rotas que não precisam do layout
  const noLayoutPaths = ['/pwa/login', '/pwa/redirect']
  const shouldShowLayout = !noLayoutPaths.some(path => pathname === path)

  return (
    <PWAErrorBoundary>
      <PWAAuthGuard>
        {shouldShowLayout ? (
          <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
            {/* Header */}
            <header className="bg-gradient-to-r from-[#871b0b] to-[#6b1509] text-white sticky top-0 z-40 shadow-lg safe-area-pt">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  {/* Logo */}
                  <div className="flex items-center gap-3">
                    {empresa.logo ? (
                      <div className="w-12 h-12 relative">
                        <Image
                          src={empresa.logo}
                          alt={empresa.nome}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                        <Smartphone className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h1 className="font-bold text-lg">{empresa.nome || "IRBANA"}</h1>
                      <div className="flex items-center gap-2 text-xs text-red-100">
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

                  {/* Menu do Usuário */}
                  <div className="flex items-center gap-2">
                    {user && (
                      <div className="relative" data-user-menu>
                        <button
                          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                          className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-xl p-2 hover:bg-white/30 transition-all duration-200 shadow-lg"
                          aria-label="Menu do usuário"
                        >
                          <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        </button>

                        {isUserMenuOpen && (
                          <>
                            {/* Overlay para fechar ao clicar fora */}
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setIsUserMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                              <div className="p-2">
                                {/* Informações do usuário */}
                                <div className="px-3 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                  <p className="text-sm font-semibold text-gray-900">{user.nome}</p>
                                  {user.cargo && (
                                    <p className="text-xs text-gray-500 mt-0.5">{user.cargo}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-xs text-gray-500">PWA Ativo</span>
                                  </div>
                                </div>
                                
                                {/* Opções do menu */}
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      setIsUserMenuOpen(false)
                                      handleNavigation('/pwa/perfil')
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                  >
                                    <UserCircle className="w-4 h-4" />
                                    Meu Perfil
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      setIsUserMenuOpen(false)
                                      handleNavigation('/pwa')
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                  >
                                    <Home className="w-4 h-4" />
                                    Início
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      setIsUserMenuOpen(false)
                                      setIsMenuOpen(true)
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                  >
                                    <Menu className="w-4 h-4" />
                                    Menu
                                  </button>
                                  
                                  <div className="border-t border-gray-100 my-1"></div>
                                  
                                  <button
                                    onClick={() => {
                                      setIsUserMenuOpen(false)
                                      handleLogout()
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <LogOut className="w-4 h-4" />
                                    Sair
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Menu Lateral (Drawer) */}
            {isMenuOpen && (
              <>
                {/* Overlay */}
                <div 
                  className="fixed inset-0 bg-black/50 z-50 transition-opacity"
                  onClick={() => setIsMenuOpen(false)}
                />
                
                {/* Drawer */}
                <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto safe-area-pl">
                  <div className="p-4">
                    {/* Header do Drawer */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                      <button
                        onClick={() => setIsMenuOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>

                    {/* Todos os Itens do Menu */}
                    <div className="space-y-1">
                      {/* Itens Principais */}
                      {drawerMainItems.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                            Principal
                          </p>
                          {drawerMainItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            
                            return (
                              <button
                                key={item.href}
                                onClick={() => {
                                  handleNavigation(item.href)
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                                  isActive
                                    ? 'bg-red-50 text-[#871b0b] border border-red-200'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <div className={`p-2 rounded-lg ${
                                  isActive ? 'bg-red-100' : 'bg-gray-100'
                                }`}>
                                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#871b0b]' : 'text-gray-600'}`} />
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-medium text-sm">{item.label}</p>
                                  {item.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                                  )}
                                </div>
                                {isActive && (
                                  <div className="w-2 h-2 bg-[#871b0b] rounded-full" />
                                )}
                              </button>
                            )
                          })}
                        </>
                      )}

                      {/* Demais Itens */}
                      {drawerSideItems.length > 0 && (
                        <>
                          {drawerMainItems.length > 0 && (
                            <div className="my-4 border-t border-gray-200" />
                          )}
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                            Mais
                          </p>
                          {drawerSideItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            
                            return (
                              <button
                                key={item.href}
                                onClick={() => {
                                  handleNavigation(item.href)
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                                  isActive
                                    ? 'bg-red-50 text-[#871b0b] border border-red-200'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <div className={`p-2 rounded-lg ${
                                  isActive ? 'bg-red-100' : 'bg-gray-100'
                                }`}>
                                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#871b0b]' : 'text-gray-600'}`} />
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-medium text-sm">{item.label}</p>
                                  {item.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                                  )}
                                </div>
                                {isActive && (
                                  <div className="w-2 h-2 bg-[#871b0b] rounded-full" />
                                )}
                              </button>
                            )
                          })}
                        </>
                      )}

                      {/* Se não houver itens */}
                      {allNavigationItems.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">Nenhum item disponível</p>
                        </div>
                      )}
                    </div>

                    {/* Footer do Drawer */}
                    <div className="mt-8 pt-4 border-t border-gray-200">
                      <div className="px-3 py-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span>{isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Loading Overlay durante navegação */}
            {isNavigating && (
              <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[100] flex items-center justify-center">
                <PageLoader text="Carregando página..." />
              </div>
            )}

            {/* Conteúdo principal */}
            <main className={`px-4 pt-4 pb-24 transition-opacity duration-200 ${isNavigating ? 'opacity-50' : 'opacity-100'}`}>
              {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl z-50 safe-area-pb overflow-visible">
              <div className="grid grid-cols-5 h-16 relative">
                {filteredNavigationItems.length > 0 ? (
                  filteredNavigationItems
                    .filter(item => item && item.icon) // Filtrar itens sem ícone
                    .map((item, index) => {
                      const Icon = item.icon
                      if (!Icon) return null // Proteção adicional
                      
                      const isActive = pathname === item.href || (item.href === '/pwa' && pathname === '/pwa')
                      
                      return (
                        <button
                          key={item.name || item.href || index}
                          onClick={() => handleNavigation(item.href)}
                          className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 overflow-visible ${
                            isActive 
                              ? "text-[#871b0b]" 
                              : "text-gray-500 active:bg-gray-100"
                          }`}
                        >
                          {/* Meio círculo por cima quando item está ativo */}
                          {isActive && (
                            <div 
                              className="absolute -top-5 left-1/2 -translate-x-1/2 w-20 h-10 bg-white rounded-t-full border-t-2 border-l-2 border-r-2 border-[#871b0b] shadow-2xl transition-all duration-200"
                              style={{ 
                                zIndex: 0,
                                boxShadow: '0 -4px 12px rgba(135, 27, 11, 0.25)'
                              }}
                            />
                          )}
                          
                          <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform duration-200`} style={{ zIndex: isActive ? 10 : 1 }}>
                            <Icon className={`w-6 h-6 relative ${isActive ? 'stroke-[2.5]' : ''} ${isActive ? 'text-[#871b0b]' : ''}`} />
                          </div>
                          <span className={`text-xs font-medium whitespace-nowrap relative ${isActive ? 'font-semibold' : ''}`} style={{ zIndex: isActive ? 10 : 1 }}>
                            {item.name}
                          </span>
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

export default function PWALayout({ children }: PWALayoutProps) {
  return (
    <EmpresaProvider>
      <PWALayoutContent>{children}</PWALayoutContent>
    </EmpresaProvider>
  )
}
