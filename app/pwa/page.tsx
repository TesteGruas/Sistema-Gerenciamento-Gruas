"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  FileSignature, 
  FileText,
  Settings,
  User, 
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Wifi,
  WifiOff,
  Bell,
  UserCircle,
  Briefcase,
  ChevronRight,
  Zap,
  Receipt
} from "lucide-react"
import { usePWAUser } from "@/hooks/use-pwa-user"

export default function PWAMainPage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  // Hook de usuário sempre chamado (mas com fallback interno)
  const pwaUserData = usePWAUser()

  // Função de navegação com loading imediato
  const handleNavigation = (href: string) => {
    setIsNavigating(true)
    setTimeout(() => {
      router.push(href)
    }, 0)
  }

  // Ocultar loading quando a navegação terminar (página mudou)
  useEffect(() => {
    if (isNavigating) {
      // Ocultar loading após um pequeno delay para garantir que a página renderizou
      const timer = setTimeout(() => {
        setIsNavigating(false)
      }, 200)
      
      return () => clearTimeout(timer)
    }
  }, [pathname, isNavigating])

  // Verificar se estamos no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Autenticação é gerenciada pelo PWAAuthGuard no layout

  // Atualizar relógio
  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Verificar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      setIsOnline(navigator.onLine)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const quickActions = [
    {
      title: "Ponto",
      description: "Registrar entrada e saída",
      icon: Clock,
      href: "/pwa/ponto",
      color: "text-[#871b0b]",
      bgColor: "bg-red-50",
      borderColor: "border-red-100",
      priority: true
    },
    {
      title: "Espelho",
      description: "Ver espelho de ponto",
      icon: FileText,
      href: "/pwa/espelho-ponto",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-100",
      priority: true
    },
    {
      title: "Gruas",
      description: "Ver minhas gruas",
      icon: Briefcase,
      href: "/pwa/gruas",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100"
    },
    {
      title: "Documentos",
      description: "Assinar documentos",
      icon: FileSignature,
      href: "/pwa/documentos",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100"
    },
    {
      title: "Perfil",
      description: "Meus dados",
      icon: UserCircle,
      href: "/pwa/perfil",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-100"
    },
    {
      title: "Config",
      description: "Configurações",
      icon: Settings,
      href: "/pwa/configuracoes",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-100"
    },
    {
      title: "Aprovações",
      description: "Minhas horas extras",
      icon: CheckCircle,
      href: "/pwa/aprovacoes",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100",
      priority: true
    },
    {
      title: "Holerites",
      description: "Visualizar e assinar holerites",
      icon: Receipt,
      href: "/pwa/holerites",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-100"
    }
  ]

  // Adicionar ação de encarregador se aplicável
  const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null
  let isEncarregador = false
  if (userData) {
    try {
      const parsedUser = JSON.parse(userData)
      isEncarregador = parsedUser?.cargo?.toLowerCase().includes('encarregador') || 
                      parsedUser?.cargo?.toLowerCase().includes('supervisor') ||
                      parsedUser?.cargo?.toLowerCase().includes('chefe')
    } catch (error) {
      console.error('Erro ao parsear dados do usuário:', error)
    }
  }

  if (isEncarregador) {
    quickActions.push({
      title: "Encarregador",
      description: "Gerenciar equipe",
      icon: User,
      href: "/pwa/encarregador",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-100"
    })
  }

  // Mostrar loading enquanto carrega dados do usuário ou durante navegação
  if (pwaUserData.loading || isNavigating) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#871b0b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute permission="dashboard:visualizar">
      <div className="space-y-4 animate-in fade-in duration-500">
      {/* Card de Boas-vindas com Relógio */}
      <div className="relative bg-gradient-to-br from-[#871b0b] via-[#6b1509] to-[#4d0f06] text-white rounded-3xl p-6 shadow-xl overflow-hidden">
        {/* Padrão decorativo */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-16 -mb-16" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-red-100 mb-1">Bem-vindo(a),</p>
              <h2 className="text-2xl font-bold">{pwaUserData.user?.nome?.split(' ')[0] || 'Usuário'}!</h2>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center ring-2 ring-white/30 shadow-lg">
              <Zap className="w-6 h-6" />
            </div>
          </div>
          
          <div className="space-y-1 mb-4">
            <p className="text-5xl font-bold tracking-tight">
              {currentTime ? currentTime.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }) : '--:--'}
            </p>
            <p className="text-sm text-red-100 capitalize">
              {currentTime ? currentTime.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: '2-digit', 
                month: 'long' 
              }) : ''}
            </p>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg">
              <p className="text-[10px] text-red-100 font-medium mb-1">Ponto</p>
              <p className="text-sm font-bold">
                {pwaUserData.pontoHoje?.entrada 
                  ? new Date(pwaUserData.pontoHoje.entrada).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  : '--:--'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg">
              <p className="text-[10px] text-red-100 font-medium mb-1">Horas</p>
              <p className="text-sm font-bold">{pwaUserData.horasTrabalhadas.split(' ')[0]}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg">
              <p className="text-[10px] text-red-100 font-medium mb-1">Docs</p>
              <p className="text-sm font-bold">{pwaUserData.documentosPendentes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Rápido */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
          <div className="flex flex-col items-center text-center">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 shadow-md ${
              pwaUserData.pontoHoje?.entrada ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <CheckCircle className={`w-6 h-6 ${
                pwaUserData.pontoHoje?.entrada ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
            <p className="text-base font-bold text-gray-900">
              {pwaUserData.pontoHoje?.entrada ? '✓' : '−'}
            </p>
            <p className="text-[10px] text-gray-500 font-medium">Entrada</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
          <div className="flex flex-col items-center text-center">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 shadow-md ${
              pwaUserData.documentosPendentes > 0 ? 'bg-orange-100 animate-pulse' : 'bg-gray-100'
            }`}>
              <FileSignature className={`w-6 h-6 ${
                pwaUserData.documentosPendentes > 0 ? 'text-orange-600' : 'text-gray-400'
              }`} />
            </div>
            <p className="text-base font-bold text-gray-900">{pwaUserData.documentosPendentes}</p>
            <p className="text-[10px] text-gray-500 font-medium">Pendentes</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center mb-2 shadow-md">
              <Clock className="w-6 h-6 text-[#871b0b]" />
            </div>
            <p className="text-base font-bold text-gray-900">{pwaUserData.horasTrabalhadas.split('h')[0]}</p>
            <p className="text-[10px] text-gray-500 font-medium">Horas</p>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Acesso Rápido</h2>
          <Button variant="ghost" size="sm" className="text-xs text-[#871b0b] h-auto p-0">
            Ver tudo
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {/* Todos os cards com mesmo tamanho, dois por linha */}
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              
              return (
                <div
                  key={action.title}
                  onClick={() => handleNavigation(action.href)}
                  className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer border-2 border-transparent hover:border-red-100 relative overflow-hidden group"
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {/* Efeito de hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10">
                    <div className={`${action.bgColor} w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border ${action.borderColor} group-hover:scale-110 transition-transform shadow-md`}>
                      <Icon className={`w-6 h-6 ${action.color}`} />
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 mb-0.5">{action.title}</h3>
                    <p className="text-[11px] text-gray-500 leading-tight line-clamp-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Informações de Funcionalidades */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">Funcionalidades</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Card de Assinatura de Documentos */}
          <div 
            onClick={() => handleNavigation('/pwa/documentos')}
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all active:scale-95 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <FileSignature className="w-5 h-5 text-orange-600" />
              </div>
              {pwaUserData.documentosPendentes > 0 && (
                <Badge className="bg-orange-100 text-orange-800 text-xs">
                  {pwaUserData.documentosPendentes}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm text-gray-900 mb-1">Assinatura Digital</h3>
            <p className="text-xs text-gray-500 mb-2">
              {pwaUserData.documentosPendentes > 0 
                ? `${pwaUserData.documentosPendentes} documento${pwaUserData.documentosPendentes > 1 ? 's' : ''} aguardando`
                : 'Nenhum documento pendente'}
            </p>
            <div className="flex items-center text-xs text-[#871b0b] font-medium">
              Ver documentos
              <ChevronRight className="w-3 h-3 ml-1" />
            </div>
          </div>

          {/* Card de Aprovações */}
          <div 
            onClick={() => handleNavigation('/pwa/aprovacoes')}
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all active:scale-95 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <h3 className="font-semibold text-sm text-gray-900 mb-1">Aprovações</h3>
            <p className="text-xs text-gray-500 mb-2">
              Horas extras e solicitações
            </p>
            <div className="flex items-center text-xs text-[#871b0b] font-medium">
              Ver aprovações
              <ChevronRight className="w-3 h-3 ml-1" />
            </div>
          </div>

          {/* Card de Holerites */}
          <div 
            onClick={() => handleNavigation('/pwa/holerites')}
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all active:scale-95 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <h3 className="font-semibold text-sm text-gray-900 mb-1">Holerites</h3>
            <p className="text-xs text-gray-500 mb-2">
              Visualizar e assinar holerites
            </p>
            <div className="flex items-center text-xs text-[#871b0b] font-medium">
              Ver holerites
              <ChevronRight className="w-3 h-3 ml-1" />
            </div>
          </div>

          {/* Card de Espelho de Ponto */}
          <div 
            onClick={() => handleNavigation('/pwa/espelho-ponto')}
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all active:scale-95 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <h3 className="font-semibold text-sm text-gray-900 mb-1">Espelho de Ponto</h3>
            <p className="text-xs text-gray-500 mb-2">
              Consultar registros de ponto
            </p>
            <div className="flex items-center text-xs text-[#871b0b] font-medium">
              Ver espelho
              <ChevronRight className="w-3 h-3 ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Dica ou Alerta */}
      {pwaUserData.documentosPendentes > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-500">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-orange-900 mb-1">
              {pwaUserData.documentosPendentes} documento{pwaUserData.documentosPendentes > 1 ? 's' : ''} pendente{pwaUserData.documentosPendentes > 1 ? 's' : ''}
            </h3>
            <p className="text-xs text-orange-700 mb-2">
              Você tem documentos aguardando sua assinatura digital
            </p>
            <Button 
              size="sm" 
              onClick={() => handleNavigation('/pwa/documentos')}
              className="bg-orange-600 hover:bg-orange-700 text-white h-8 text-xs"
            >
              Ver documentos
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  )
}
