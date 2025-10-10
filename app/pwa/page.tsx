"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  FileSignature, 
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
  Briefcase
} from "lucide-react"
import { usePWAUser } from "@/hooks/use-pwa-user"

export default function PWAMainPage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const router = useRouter()
  const { user, pontoHoje, documentosPendentes, horasTrabalhadas, loading: userLoading } = usePWAUser()

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
    if (typeof window === 'undefined') return
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const quickActions = [
    {
      title: "Registrar Ponto",
      description: "Entrada, saída e intervalos",
      icon: Clock,
      href: "/pwa/ponto",
      color: "bg-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Minhas Gruas",
      description: "Ver gruas sob responsabilidade",
      icon: Briefcase,
      href: "/pwa/gruas",
      color: "bg-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Documentos",
      description: "Assinar documentos",
      icon: FileSignature,
      href: "/pwa/documentos",
      color: "bg-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Notificações",
      description: "Ver alertas e lembretes",
      icon: Bell,
      href: "/pwa/notificacoes",
      color: "bg-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Meu Perfil",
      description: "Ver e editar informações",
      icon: UserCircle,
      href: "/pwa/perfil",
      color: "bg-indigo-600",
      bgColor: "bg-indigo-50"
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
      description: "Gerenciar funcionários e horas",
      icon: User,
      href: "/pwa/encarregador",
      color: "bg-orange-600",
      bgColor: "bg-orange-50"
    })
  }

  const stats = [
    {
      title: "Ponto Hoje",
      value: pontoHoje?.entrada 
        ? new Date(pontoHoje.entrada).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        : "--:--",
      subtitle: pontoHoje?.entrada ? "Entrada registrada" : "Não registrado",
      icon: CheckCircle,
      color: pontoHoje?.entrada ? "text-green-600" : "text-gray-400"
    },
    {
      title: "Horas Trabalhadas",
      value: horasTrabalhadas,
      subtitle: pontoHoje?.entrada ? "Tempo atual" : "Sem registro",
      icon: Clock,
      color: "text-blue-600"
    },
    {
      title: "Documentos Pendentes",
      value: documentosPendentes.toString(),
      subtitle: "Aguardando assinatura",
      icon: AlertCircle,
      color: documentosPendentes > 0 ? "text-orange-600" : "text-green-600"
    }
  ]

  // Mostrar loading enquanto carrega dados do usuário
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard PWA</h1>
          <p className="text-gray-600">Sistema de Ponto e Assinatura</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-600" />
          )}
          <span className="text-sm text-gray-600">
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* Relógio e data atual */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-blue-600 mb-2">
              {currentTime ? currentTime.toTimeString().slice(0, 8) : '--:--:--'}
            </div>
            <div className="text-lg text-gray-600">
              {currentTime ? currentTime.toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }) : 'Carregando...'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Card 
                key={action.title}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(action.href)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${action.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${action.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                    <div className="text-gray-400">
                      →
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Estatísticas */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Dia</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.subtitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Funcionalidades do PWA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Funcionalidades PWA
          </CardTitle>
          <CardDescription>
            Aproveite todas as funcionalidades do aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Funciona Offline</p>
                  <p className="text-xs text-gray-500">Acesse mesmo sem internet</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Instalável</p>
                  <p className="text-xs text-gray-500">Adicione à tela inicial</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Sincronização</p>
                  <p className="text-xs text-gray-500">Dados sincronizados automaticamente</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Notificações</p>
                  <p className="text-xs text-gray-500">Lembretes de ponto e documentos</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status de conexão */}
      {!isOnline && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <WifiOff className="w-5 h-5" />
              <div>
                <p className="font-medium">Modo Offline</p>
                <p className="text-sm">Algumas funcionalidades podem estar limitadas. Os dados serão sincronizados quando a conexão for restabelecida.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
