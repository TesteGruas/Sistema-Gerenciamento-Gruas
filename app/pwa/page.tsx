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
  Receipt,
  Play
} from "lucide-react"
import { usePWAUser } from "@/hooks/use-pwa-user"
import { useToast } from "@/hooks/use-toast"
import * as pontoApi from "@/lib/api-ponto-eletronico"
import { getFuncionarioIdWithFallback } from "@/lib/get-funcionario-id"

export default function PWAMainPage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isRegistrandoPonto, setIsRegistrandoPonto] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  
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

  // Sistema de notificações de ponto
  useEffect(() => {
    if (!currentTime || !pwaUserData.user) return

    const verificarNotificacao = () => {
      const proximoRegistro = getProximoRegistro()
      if (!proximoRegistro) return

      const agora = new Date()
      const horaAtual = agora.getHours() * 60 + agora.getMinutes() // Minutos desde meia-noite
      
      // Horários esperados para cada tipo de registro (em minutos desde meia-noite)
      const horariosEsperados = {
        entrada: 8 * 60, // 08:00
        saida_almoco: 12 * 60, // 12:00
        volta_almoco: 13 * 60, // 13:00
        saida: 17 * 60 // 17:00
      }

      const horarioEsperado = horariosEsperados[proximoRegistro.tipo as keyof typeof horariosEsperados]
      if (!horarioEsperado) return

      // Verificar se está próximo do horário esperado (±15 minutos)
      const diferenca = Math.abs(horaAtual - horarioEsperado)
      const jaPassou = horaAtual > horarioEsperado
      
      // Mostrar notificação se:
      // 1. Está dentro de 15 minutos antes do horário esperado
      // 2. Já passou do horário esperado (atraso)
      if (diferenca <= 15 || (jaPassou && diferenca <= 60)) {
        const ultimaNotificacao = localStorage.getItem(`notificacao_ponto_${proximoRegistro.tipo}_${agora.toDateString()}`)
        
        // Só mostrar notificação uma vez por dia para cada tipo
        if (!ultimaNotificacao) {
          const mensagens = {
            entrada: {
              titulo: "⏰ Hora de registrar entrada!",
              descricao: "Não esqueça de registrar seu ponto de entrada"
            },
            saida_almoco: {
              titulo: "🍽️ Hora do almoço!",
              descricao: "Registre sua saída para almoço"
            },
            volta_almoco: {
              titulo: "⏰ Volta do almoço!",
              descricao: "Registre sua volta do intervalo de almoço"
            },
            saida: {
              titulo: "🏠 Hora de encerrar!",
              descricao: "Registre sua saída para finalizar o dia"
            }
          }

          const mensagem = mensagens[proximoRegistro.tipo as keyof typeof mensagens]
          
          if (mensagem) {
            toast({
              title: mensagem.titulo,
              description: mensagem.descricao,
              variant: jaPassou ? "destructive" : "default",
              duration: 10000,
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegistrarPonto}
                  className="h-8 px-2 text-xs"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Registrar Agora
                </Button>
              )
            })

            // Marcar que já mostrou a notificação hoje
            localStorage.setItem(`notificacao_ponto_${proximoRegistro.tipo}_${agora.toDateString()}`, 'true')
          }
        }
      }
    }

    // Verificar imediatamente
    verificarNotificacao()

    // Verificar a cada minuto
    const intervalId = setInterval(verificarNotificacao, 60 * 1000)

    return () => clearInterval(intervalId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, pwaUserData.pontoHoje])

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

  // Função auxiliar para formatar hora do ponto
  const formatarHoraPonto = (hora: string | Date | null | undefined): string => {
    if (!hora) return '--:--'
    
    // Se já é uma string no formato HH:MM, retornar diretamente
    if (typeof hora === 'string' && /^\d{2}:\d{2}$/.test(hora)) {
      return hora
    }
    
    // Se é uma data ISO, converter
    if (typeof hora === 'string' && hora.includes('T')) {
      try {
        return new Date(hora).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      } catch {
        return hora
      }
    }
    
    // Se é um objeto Date
    if (hora instanceof Date) {
      return hora.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
    
    return String(hora)
  }

  // Determinar qual é o próximo registro necessário
  const getProximoRegistro = () => {
    const registrosHoje = pwaUserData.pontoHoje || {}
    
    if (!registrosHoje.entrada) {
      return {
        tipo: 'entrada',
        label: 'Entrada',
        descricao: 'Iniciar jornada de trabalho'
      }
    }
    
    if (registrosHoje.entrada && !registrosHoje.saida_almoco && !registrosHoje.saida) {
      return {
        tipo: 'saida_almoco',
        label: 'Saída Almoço',
        descricao: 'Iniciar intervalo de almoço'
      }
    }
    
    if (registrosHoje.saida_almoco && !registrosHoje.volta_almoco && !registrosHoje.saida) {
      return {
        tipo: 'volta_almoco',
        label: 'Volta Almoço',
        descricao: 'Retornar do intervalo de almoço'
      }
    }
    
    if (registrosHoje.entrada && !registrosHoje.saida) {
      return {
        tipo: 'saida',
        label: 'Saída',
        descricao: 'Finalizar jornada de trabalho'
      }
    }
    
    return null // Jornada completa
  }

  // Função para registrar ponto
  const handleRegistrarPonto = async () => {
    const proximoRegistro = getProximoRegistro()
    
    if (!proximoRegistro) {
      toast({
        title: "Jornada completa",
        description: "Você já registrou todos os pontos do dia",
        variant: "default"
      })
      return
    }

    setIsRegistrandoPonto(true)
    
    try {
      // Obter dados do usuário
      const userData = localStorage.getItem('user_data')
      if (!userData) {
        throw new Error('Dados do usuário não encontrados')
      }
      
      const user = JSON.parse(userData)
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Token não encontrado')
      }
      
      console.log('[PWA Ponto] Dados do usuário:', {
        id: user.id,
        email: user.email,
        profile: user.profile,
        funcionario_id: user.funcionario_id
      })
      
      // Obter funcionarioId - tentar múltiplas abordagens
      let funcionarioId: number | null = null
      
      // Tentar 1: profile.funcionario_id
      if (user.profile?.funcionario_id) {
        funcionarioId = Number(user.profile.funcionario_id)
        console.log('[PWA Ponto] Funcionário ID encontrado em profile.funcionario_id:', funcionarioId)
      }
      
      // Tentar 2: funcionario_id direto
      if (!funcionarioId && user.funcionario_id) {
        funcionarioId = Number(user.funcionario_id)
        console.log('[PWA Ponto] Funcionário ID encontrado em funcionario_id:', funcionarioId)
      }
      
      // Tentar 3: user.id se for numérico
      if (!funcionarioId && user.id && !isNaN(Number(user.id)) && !user.id.toString().includes('-')) {
        funcionarioId = Number(user.id)
        console.log('[PWA Ponto] Funcionário ID encontrado em user.id:', funcionarioId)
      }
      
      // Tentar 4: usar a função utilitária
      if (!funcionarioId) {
        try {
          funcionarioId = await getFuncionarioIdWithFallback(
            user, 
            token, 
            'ID do funcionário não encontrado'
          )
          console.log('[PWA Ponto] Funcionário ID encontrado via getFuncionarioIdWithFallback:', funcionarioId)
        } catch (error) {
          console.warn('[PWA Ponto] Erro ao buscar ID via getFuncionarioIdWithFallback:', error)
          // Se falhar, tentar buscar na API
          console.warn('[PWA Ponto] Tentando buscar funcionário na API...')
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          try {
            const response = await fetch(
              `${apiUrl}/api/funcionarios?search=${encodeURIComponent(user.email || user.nome || '')}&limit=10`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            )
            
            if (response.ok) {
              const data = await response.json()
              const funcionarios = data.data || []
              console.log('[PWA Ponto] Funcionários encontrados:', funcionarios.length)
              
              const funcionario = funcionarios.find((f: any) => 
                f.usuario?.id === user.id || 
                f.usuario?.email === user.email ||
                f.email === user.email ||
                (f.nome && user.nome && f.nome.toLowerCase() === user.nome.toLowerCase())
              )
              
              if (funcionario && funcionario.id) {
                funcionarioId = Number(funcionario.id)
                console.log('[PWA Ponto] Funcionário ID encontrado via API:', funcionarioId)
              }
            } else {
              console.error('[PWA Ponto] Erro na resposta da API:', response.status, response.statusText)
            }
          } catch (apiError) {
            console.error('[PWA Ponto] Erro ao buscar funcionário na API:', apiError)
          }
        }
      }
      
      if (!funcionarioId) {
        console.error('[PWA Ponto] Não foi possível encontrar o ID do funcionário após todas as tentativas')
        throw new Error('Não foi possível identificar o ID do funcionário. Verifique se seu perfil está vinculado a um funcionário no sistema.')
      }
      
      console.log('[PWA Ponto] Usando funcionário ID:', funcionarioId)
      
      const agora = new Date()
      const horaAtual = agora.toTimeString().slice(0, 5)
      const hoje = agora.toISOString().split('T')[0]
      
      // Preparar dados para envio
      const campoTipo = proximoRegistro.tipo.toLowerCase().replace(' ', '_')
      const dadosRegistro: any = {
        funcionario_id: funcionarioId,
        data: hoje,
        [campoTipo]: horaAtual
      }

      // Se offline, adicionar à fila de sincronização
      if (!isOnline) {
        const filaRegistros = JSON.parse(localStorage.getItem('fila_registros_ponto') || '[]')
        filaRegistros.push({
          dados: dadosRegistro,
          timestamp: new Date().toISOString()
        })
        localStorage.setItem('fila_registros_ponto', JSON.stringify(filaRegistros))
        
        toast({
          title: "Ponto registrado offline",
          description: `${proximoRegistro.label} será sincronizada quando você estiver online`,
          variant: "default"
        })
        
        // Recarregar página após 1 segundo para atualizar dados
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        
        return
      }

      // Verificar se já existe registro para hoje
      const registrosExistentes = await pontoApi.getRegistros({
        funcionario_id: funcionarioId,
        data_inicio: hoje,
        data_fim: hoje
      })

      if (registrosExistentes && registrosExistentes.length > 0) {
        // Atualizar registro existente
        const registroId = registrosExistentes[0].id!
        await pontoApi.atualizarRegistro(registroId, {
          ...dadosRegistro,
          justificativa_alteracao: `Registro ${proximoRegistro.label} via PWA`
        })
      } else {
        // Criar novo registro
        await pontoApi.criarRegistro(dadosRegistro)
      }

      toast({
        title: "Ponto registrado!",
        description: `${proximoRegistro.label} registrada às ${horaAtual}`,
        variant: "default"
      })
      
      // Recarregar página após 1 segundo para atualizar dados
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error: any) {
      console.error('Erro ao registrar ponto:', error)
      toast({
        title: "Erro ao registrar ponto",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive"
      })
    } finally {
      setIsRegistrandoPonto(false)
    }
  }

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
            <div className="flex items-center gap-2">
              {getProximoRegistro() && (
                <button
                  onClick={handleRegistrarPonto}
                  disabled={isRegistrandoPonto}
                  className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200 shadow-lg ring-2 ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isRegistrandoPonto ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Registrar Ponto
                    </>
                  )}
                </button>
              )}
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
                {formatarHoraPonto(pwaUserData.pontoHoje?.entrada)}
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
              {formatarHoraPonto(pwaUserData.pontoHoje?.entrada)}
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
            <p className="text-base font-bold text-gray-900">
              {pwaUserData.pontoHoje?.saida
                ? formatarHoraPonto(pwaUserData.pontoHoje.saida)
                : pwaUserData.pontoHoje?.volta_almoco
                ? formatarHoraPonto(pwaUserData.pontoHoje.volta_almoco)
                : pwaUserData.pontoHoje?.saida_almoco
                ? formatarHoraPonto(pwaUserData.pontoHoje.saida_almoco)
                : '--:--'}
            </p>
            <p className="text-[10px] text-gray-500 font-medium">
              {pwaUserData.pontoHoje?.saida ? 'Última Saída' : 
               pwaUserData.pontoHoje?.volta_almoco ? 'Volta Almoço' :
               pwaUserData.pontoHoje?.saida_almoco ? 'Saída Almoço' :
               'Saída'}
            </p>
          </div>
        </div>
      </div>

      {/* Todas as Funcionalidades */}
      <div>
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

      {/* Ações Rápidas - Todos os itens */}
      <div>
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
