"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
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
  UserCircle,
  Briefcase,
  ChevronRight,
  Zap,
  Receipt,
  Play,
  Gift,
  Award,
  FileCheck,
  MapPin,
  Loader2,
  Calculator
} from "lucide-react"
import { usePWAUser } from "@/hooks/use-pwa-user"
import { useToast } from "@/hooks/use-toast"
import { usePWAPermissions } from "@/hooks/use-pwa-permissions"
import * as pontoApi from "@/lib/api-ponto-eletronico"
import { getFuncionarioIdWithFallback } from "@/lib/get-funcionario-id"
import { getAlocacoesAtivasFuncionario } from "@/lib/api-funcionarios-obras"
import { funcionariosApi } from "@/lib/api-funcionarios"
import { obterLocalizacaoAtual } from "@/lib/geolocation-validator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function PWAMainPage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [isRegistrandoPonto, setIsRegistrandoPonto] = useState(false)
  const [location, setLocation] = useState<{lat: number, lng: number, address?: string} | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [showConfirmacaoDialog, setShowConfirmacaoDialog] = useState(false)
  const [showFeriadoDialog, setShowFeriadoDialog] = useState(false)
  const [isFeriado, setIsFeriado] = useState<boolean | null>(null)
  const [tipoFeriado, setTipoFeriado] = useState<'nacional' | 'estadual' | 'local' | null>(null)
  const [isFacultativo, setIsFacultativo] = useState<boolean>(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  
  // Hook de usuário sempre chamado (mas com fallback interno)
  const pwaUserData = usePWAUser()
  
  // Hook de permissões para obter role do usuário e verificar permissões
  const { userRole, canApproveHoras, isClient: isClientRole, hasPermission, canAccessModule } = usePWAPermissions()
  
  // Obter role também do perfil (fallback)
  const [roleFromPerfil, setRoleFromPerfil] = useState<string | null>(null)
  const [roleFromUserData, setRoleFromUserData] = useState<string | null>(null)
  
  // Estado para verificar se funcionário tem obra ativa
  const [temObraAtiva, setTemObraAtiva] = useState<boolean | null>(null)
  const [loadingObra, setLoadingObra] = useState(true)
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      // Ler do perfil
      const perfilStr = localStorage.getItem('user_perfil')
      if (perfilStr) {
        const perfil = JSON.parse(perfilStr)
        setRoleFromPerfil(perfil?.nome || null)
      }
      
      // Ler do user_data também
      const userDataStr = localStorage.getItem('user_data')
      if (userDataStr) {
        const userData = JSON.parse(userDataStr)
        // Buscar cargo (supervisor não é mais um cargo, é uma atribuição)
        const cargo = userData?.user_metadata?.cargo || userData?.cargo || null
        const role = userData?.role || null
        setRoleFromUserData(cargo || role || null)
      }
    } catch (error) {
      console.warn('Erro ao ler perfil/user_data:', error)
    }
  }, [])
  
  // Determinar role atual (supervisor não é mais um cargo específico)
  const currentUserRole = roleFromPerfil || 
                         roleFromUserData ||
                         (userRole && String(userRole) !== 'authenticated' ? String(userRole) : null) || 
                         pwaUserData.user?.role || 
                         pwaUserData.user?.cargo

  // Função auxiliar para verificar se é cliente/dono da obra (quem aprova horas extras)
  // Supervisor não é mais um cargo, é uma atribuição. Quem aprova horas extras é o cliente da obra.
  const isSupervisorUser = useMemo(() => {
    if (typeof window === 'undefined') return false
    
    try {
      // Verificar se é cliente (level 1 ou role cliente)
      // Clientes são quem aprovam horas extras como donos das obras
      const userLevel = parseInt(localStorage.getItem('user_level') || '0', 10)
      const hookRole = userRole?.toLowerCase() || ''
      const roleFromPerfilLower = roleFromPerfil?.toLowerCase() || ''
      const roleFromUserDataLower = roleFromUserData?.toLowerCase() || ''
      const pwaRoleLower = pwaUserData.user?.role?.toLowerCase() || ''
      const currentRoleLower = currentUserRole?.toLowerCase() || ''
      
      const allRolesArray = [
        hookRole,
        roleFromPerfilLower,
        roleFromUserDataLower,
        currentRoleLower,
        pwaRoleLower
      ].filter(Boolean).filter((role, index, self) => self.indexOf(role) === index)
      
      // Verificar se é cliente
      const isCliente = userLevel === 1 || allRolesArray.some(role => {
        if (!role) return false
        const roleLower = String(role).toLowerCase()
        return roleLower.includes('cliente')
      })
      
      return isCliente
    } catch (error) {
      console.error('Erro ao verificar se é cliente/supervisor:', error)
      return false
    }
  }, [userRole, roleFromPerfil, roleFromUserData, currentUserRole, pwaUserData.user?.role])

  // Função de navegação direta
  const handleNavigation = (href: string) => {
    router.push(href)
  }

  // Verificar se estamos no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Verificar se funcionário tem obra ativa
  useEffect(() => {
    const verificarObraAtiva = async () => {
      if (typeof window === 'undefined') return
      
      try {
        // Verificar se é funcionário (não cliente)
        const userDataStr = localStorage.getItem('user_data')
        if (!userDataStr) {
          setLoadingObra(false)
          return
        }

        const userData = JSON.parse(userDataStr)
        
        // PRIORIDADE 1: Verificar se já temos dados do funcionário com obra_atual ou funcionarios_obras
        // Isso evita chamadas desnecessárias à API
        if (pwaUserData.user) {
          const funcionarioCompleto = pwaUserData.user
          
          // Verificar se tem obra_atual
          if (funcionarioCompleto.obra_atual && funcionarioCompleto.obra_atual.id) {
            console.log('[PWA] Obra ativa encontrada em obra_atual:', funcionarioCompleto.obra_atual.id)
            setTemObraAtiva(true)
            setLoadingObra(false)
            return
          }
          
          // Verificar se tem funcionarios_obras com status ativo
          if (funcionarioCompleto.funcionarios_obras && Array.isArray(funcionarioCompleto.funcionarios_obras)) {
            const temObraAtiva = funcionarioCompleto.funcionarios_obras.some(
              (alocacao: any) => alocacao.status === 'ativo' && alocacao.obra_id
            )
            if (temObraAtiva) {
              console.log('[PWA] Obra ativa encontrada em funcionarios_obras')
              setTemObraAtiva(true)
              setLoadingObra(false)
              return
            }
          }
          
          // Verificar se tem historico_obras com status ativo
          if (funcionarioCompleto.historico_obras && Array.isArray(funcionarioCompleto.historico_obras)) {
            const temObraAtiva = funcionarioCompleto.historico_obras.some(
              (alocacao: any) => alocacao.status === 'ativo' && alocacao.obra_id
            )
            if (temObraAtiva) {
              console.log('[PWA] Obra ativa encontrada em historico_obras')
              setTemObraAtiva(true)
              setLoadingObra(false)
              return
            }
          }
        }
        
        // PRIORIDADE: profile.funcionario_id primeiro (mais confiável)
        // Depois funcionario_id direto, depois user_metadata.funcionario_id
        let funcionarioId = userData?.profile?.funcionario_id || 
                              userData?.funcionario_id ||
                              userData?.user_metadata?.funcionario_id ||
                              pwaUserData.user?.id

        // Se não é funcionário (é cliente), não precisa verificar obra
        if (!funcionarioId) {
          setTemObraAtiva(true) // Clientes sempre podem ver
          setLoadingObra(false)
          return
        }

        // Tentar buscar dados completos do funcionário via API primeiro
        try {
          console.log('[PWA] Tentando buscar dados completos do funcionário via API:', funcionarioId)
          const response = await funcionariosApi.obterFuncionario(Number(funcionarioId))
          
          if (response.success && response.data) {
            const funcCompleto = response.data as any
            
            // Verificar obra_atual
            if (funcCompleto.obra_atual && funcCompleto.obra_atual.id) {
              console.log('[PWA] Obra ativa encontrada via API em obra_atual:', funcCompleto.obra_atual.id)
              setTemObraAtiva(true)
              setLoadingObra(false)
              return
            }
            
            // Verificar funcionarios_obras
            if (funcCompleto.funcionarios_obras && Array.isArray(funcCompleto.funcionarios_obras)) {
              const temObraAtiva = funcCompleto.funcionarios_obras.some(
                (alocacao: any) => alocacao.status === 'ativo' && alocacao.obra_id
              )
              if (temObraAtiva) {
                console.log('[PWA] Obra ativa encontrada via API em funcionarios_obras')
                setTemObraAtiva(true)
                setLoadingObra(false)
                return
              }
            }
          }
        } catch (apiError) {
          console.warn('[PWA] Erro ao buscar dados completos do funcionário via API, tentando alocações diretamente:', apiError)
        }

        // Se não encontrou, buscar alocações ativas do funcionário via API
        console.log('[PWA] Buscando alocações ativas via API para funcionário:', funcionarioId)
        const alocacoes = await getAlocacoesAtivasFuncionario(Number(funcionarioId))
        
        if (alocacoes.success && alocacoes.data && alocacoes.data.length > 0) {
          console.log('[PWA] Alocações ativas encontradas via API:', alocacoes.data.length)
          setTemObraAtiva(true)
        } else {
          console.log('[PWA] Nenhuma alocação ativa encontrada via API')
          setTemObraAtiva(false)
        }
      } catch (error) {
        console.error('Erro ao verificar obra ativa:', error)
        setTemObraAtiva(false) // Em caso de erro, considerar sem obra
      } finally {
        setLoadingObra(false)
      }
    }

    verificarObraAtiva()
  }, [pwaUserData.user])

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

  // Obter localização atual ao carregar a página
  useEffect(() => {
    if (!isClient) return

    let isMounted = true
    let abortController: AbortController | null = null

    const obterLocalizacao = async () => {
      if (!isMounted) return
      
      setIsGettingLocation(true)
      setLocationError(null)
      
      try {
        const coordenadas = await obterLocalizacaoAtual({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // Cache de 1 minuto
        })
        
        if (!isMounted) return
        
        setLocation({
          lat: coordenadas.lat,
          lng: coordenadas.lng
        })

        // Tentar obter endereço via reverse geocoding (opcional)
        try {
          abortController = new AbortController()
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordenadas.lat}&lon=${coordenadas.lng}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'Sistema-Gerenciamento-Gruas'
              },
              signal: abortController.signal
            }
          )
          
          if (!isMounted) return
          
          if (response.ok) {
            const data = await response.json()
            if (data.display_name && isMounted) {
              setLocation(prev => prev ? {
                ...prev,
                address: data.display_name
              } : null)
            }
          }
        } catch (geocodeError: any) {
          // Ignorar erro de geocoding, não é crítico
          if (geocodeError.name !== 'AbortError' && isMounted) {
            console.warn('Erro ao obter endereço:', geocodeError)
          }
        }
      } catch (error: any) {
        if (isMounted) {
          console.error('Erro ao obter localização:', error)
          setLocationError(error.message || 'Não foi possível obter sua localização')
        }
      } finally {
        if (isMounted) {
          setIsGettingLocation(false)
        }
      }
    }

    obterLocalizacao()

    return () => {
      isMounted = false
      if (abortController) {
        abortController.abort()
      }
    }
  }, [isClient])

  // Função para converter CEP em coordenadas usando o backend
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
      priority: true,
      requiresObra: true, // Requer obra ativa
      hideForClient: true // Ocultar para clientes
    },
    {
      title: "Espelho",
      description: "Ver espelho de ponto",
      icon: FileText,
      href: "/pwa/espelho-ponto",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-100",
      priority: true,
      hideForClient: true // Ocultar para clientes
    },
    {
      title: "Obras",
      description: "Ver minhas obras",
      icon: Briefcase,
      href: "/pwa/obras",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
      requiresObra: true // Requer obra ativa
    },
    {
      title: "Medições",
      description: "Medições das obras",
      icon: Calculator,
      href: "/pwa/cliente/medicoes",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      requiresObra: true // Requer obra ativa
    },
    {
      title: "Aprovações de horas",
      description: "Aprovar horas extras",
      icon: CheckCircle,
      href: "/pwa/aprovacoes",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100",
      priority: true,
      requiresSupervisor: true // Apenas Supervisor para cima
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
      title: "Holerites",
      description: "Visualizar e assinar holerites",
      icon: Receipt,
      href: "/pwa/holerites",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-100",
      hideForClient: true // Ocultar para clientes
    },
    {
      title: "Benefícios",
      description: "Meus benefícios",
      icon: Gift,
      href: "/pwa/perfil?tab=beneficios",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-100",
      hideForClient: true // Ocultar para clientes
    },
    {
      title: "Certificados",
      description: "Gerenciar certificados",
      icon: Award,
      href: "/pwa/perfil?tab=certificados",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      hideForClient: true // Ocultar para clientes
    },
    {
      title: "Documentos",
      description: "Documentos",
      icon: FileCheck,
      href: "/pwa/documentos",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-100"
    },
    {
      title: "Documentos da Obra",
      description: "Documentos das obras",
      icon: FileText,
      href: "/pwa/obras",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      requiresObra: true // Requer obra ativa
    },
    {
      title: "Config",
      description: "Configurações",
      icon: Settings,
      href: "/pwa/configuracoes",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-100"
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
      return
    }

    // Se for entrada e ainda não perguntou sobre feriado, perguntar primeiro
    if (proximoRegistro.tipo === 'entrada' && isFeriado === null) {
      setShowFeriadoDialog(true)
      return
    }

    // Mostrar modal de confirmação primeiro
    setShowConfirmacaoDialog(true)
  }

  const confirmarFeriado = () => {
    setShowFeriadoDialog(false)
    // Se não é feriado, continuar com o fluxo normal
    if (!isFeriado) {
      setShowConfirmacaoDialog(true)
      return
    }
    // Se é feriado mas não selecionou o tipo, mostrar erro
    if (isFeriado && !tipoFeriado) {
      toast({
        title: "Tipo de feriado obrigatório",
        description: "Por favor, selecione se é feriado nacional, estadual ou local.",
        variant: "destructive"
      })
      setShowFeriadoDialog(true)
      return
    }
    // Continuar com confirmação
    setShowConfirmacaoDialog(true)
  }

  const confirmarRegistroPonto = async () => {
    setShowConfirmacaoDialog(false)
    const proximoRegistro = getProximoRegistro()
    
    if (!proximoRegistro) {
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
          // Usar URL relativa para aproveitar o rewrite do Next.js
          try {
            const response = await fetch(
              `/api/funcionarios?search=${encodeURIComponent(user.email || user.nome || '')}&limit=10`,
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

      // Adicionar informações de feriado se for entrada
      if (proximoRegistro.tipo === 'entrada' && isFeriado !== null) {
        dadosRegistro.is_feriado = isFeriado
        dadosRegistro.is_facultativo = isFacultativo
        if (isFeriado && tipoFeriado) {
          dadosRegistro.feriado_tipo = tipoFeriado
        }
      }

      // Se offline, adicionar à fila de sincronização
      if (!isOnline) {
        const filaRegistros = JSON.parse(localStorage.getItem('fila_registros_ponto') || '[]')
        filaRegistros.push({
          dados: dadosRegistro,
          timestamp: new Date().toISOString()
        })
        localStorage.setItem('fila_registros_ponto', JSON.stringify(filaRegistros))
        
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

      // Recarregar página após 1 segundo para atualizar dados
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error: any) {
      console.error('Erro ao registrar ponto:', error)
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
  if (pwaUserData.loading) {
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
              <h2 className="text-2xl font-bold">
                {(() => {
                  // Buscar nome em diferentes locais possíveis
                  const user = pwaUserData.user
                  const nome = user?.nome || 
                              user?.name || 
                              user?.user_metadata?.nome || 
                              user?.user_metadata?.name ||
                              user?.profile?.nome ||
                              user?.profile?.name ||
                              'Usuário'
                  // Pegar apenas o primeiro nome
                  return nome.split(' ')[0]
                })()}!
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                // Verificação inline para garantir que funcione
                let cargoCheck: string | null = null
                if (typeof window !== 'undefined') {
                  try {
                    const userDataStr = localStorage.getItem('user_data')
                    if (userDataStr) {
                      const userData = JSON.parse(userDataStr)
                      cargoCheck = userData?.user_metadata?.cargo || userData?.cargo || null
                    }
                  } catch (e) {
                    // Ignorar erro
                  }
                }
                // Validação de supervisor removida - todos os funcionários podem bater ponto
                
                // Se não tiver próximo registro, não mostrar
                if (!getProximoRegistro()) {
                  return null
                }
                
                // Se não tiver obra ativa, não mostrar
                if (temObraAtiva === false) {
                  return null
                }
                
                // Validação de cargo removida - todos os funcionários podem bater ponto
                
                return (
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
                )
              })()}
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

          {/* Mini stats - Ocultar para clientes e funcionários sem obra ativa */}
          {(() => {
            // Se não tiver obra ativa, não renderizar o bloco
            if (temObraAtiva === false) {
              return null
            }
            
            // Verificar se é cliente
            const isClient = (() => {
              if (isClientRole()) return true
              try {
                const userDataStr = localStorage.getItem('user_data')
                if (userDataStr) {
                  const userData = JSON.parse(userDataStr)
                  const tipo = userData?.user_metadata?.tipo || userData?.user?.user_metadata?.tipo
                  if (tipo === 'cliente') return true
                }
              } catch (error) {
                // Ignorar erro
              }
              if (userRole === 'Clientes' || userRole === 'cliente') return true
              return false
            })()
            
            // Se for cliente, não renderizar o bloco
            if (isClient) {
              return null
            }
            
            // Verificação inline para garantir que funcione
            let cargoCheck: string | null = null
            if (typeof window !== 'undefined') {
              try {
                const userDataStr = localStorage.getItem('user_data')
                if (userDataStr) {
                  const userData = JSON.parse(userDataStr)
                  cargoCheck = userData?.user_metadata?.cargo || userData?.cargo || null
                }
              } catch (e) {
                // Ignorar erro
              }
            }
            const cargoLower = cargoCheck?.toLowerCase() || pwaUserData.user?.cargo?.toLowerCase() || ''
            const isSupervisorCheck = isSupervisorUser || cargoLower.includes('supervisor')
            
            return (
              <div className={`grid gap-2 mt-6 ${isSupervisorCheck ? 'grid-cols-3' : 'grid-cols-3'}`}>
                {!isSupervisorCheck && temObraAtiva !== false && (
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg">
                    <p className="text-[10px] text-red-100 font-medium mb-1">Ponto</p>
                    <p className="text-sm font-bold">
                      {formatarHoraPonto(pwaUserData.pontoHoje?.entrada)}
                    </p>
                  </div>
                )}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg">
                  <p className="text-[10px] text-red-100 font-medium mb-1">Horas</p>
                  <p className="text-sm font-bold">
                    {pwaUserData.horasTrabalhadas && typeof pwaUserData.horasTrabalhadas === 'string' 
                      ? pwaUserData.horasTrabalhadas.split(' ')[0] || '0h'
                      : '0h'}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg">
                  <p className="text-[10px] text-red-100 font-medium mb-1">Docs</p>
                  <p className="text-sm font-bold">{pwaUserData.documentosPendentes}</p>
                </div>
                {isSupervisorCheck && (
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg">
                    <p className="text-[10px] text-red-100 font-medium mb-1">Não lidas</p>
                    <p className="text-sm font-bold">0</p>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Status Rápido - Ocultar para clientes e funcionários sem obra ativa */}
      {(() => {
        // Se não tiver obra ativa, não renderizar o bloco
        if (temObraAtiva === false) {
          return null
        }
        
        // Verificar se é cliente
        const isClient = (() => {
          if (isClientRole()) return true
          try {
            const userDataStr = localStorage.getItem('user_data')
            if (userDataStr) {
              const userData = JSON.parse(userDataStr)
              const tipo = userData?.user_metadata?.tipo || userData?.user?.user_metadata?.tipo
              if (tipo === 'cliente') return true
            }
          } catch (error) {
            // Ignorar erro
          }
          if (userRole === 'Clientes' || userRole === 'cliente') return true
          return false
        })()
        
        // Se for cliente, não renderizar o bloco
        if (isClient) {
          return null
        }
        
        return (
          <div className={`grid gap-3 ${isSupervisorUser ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {!isSupervisorUser && (
              <>
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
              </>
            )}
          </div>
        )
      })()}

      {/* Ações Rápidas - Filtradas por permissões */}
      <div>
        <div className="grid grid-cols-2 gap-3">
          {quickActions
            .filter(action => {
              // Verificar se é cliente (múltiplas fontes)
              const isClient = (() => {
                // 1. Verificar pelo hook
                if (isClientRole()) return true
                
                // 2. Verificar user_metadata.tipo diretamente
                try {
                  const userDataStr = localStorage.getItem('user_data')
                  if (userDataStr) {
                    const userData = JSON.parse(userDataStr)
                    const tipo = userData?.user_metadata?.tipo || userData?.user?.user_metadata?.tipo
                    if (tipo === 'cliente') return true
                  }
                } catch (error) {
                  // Ignorar erro
                }
                
                // 3. Verificar role
                if (userRole === 'Clientes' || userRole === 'cliente') return true
                
                return false
              })()
              
              // Filtrar ações que devem ser ocultadas para clientes
              if (action.hideForClient && isClient) {
                return false
              }
              
              // Filtrar ações que requerem obra ativa (Ponto, Espelho)
              // NOTA: "Obras" NÃO deve ser filtrada por temObraAtiva porque o usuário precisa
              // ver suas obras mesmo que não esteja alocado em nenhuma no momento
              if (action.requiresObra || action.title === "Ponto" || action.title === "Espelho") {
                // Se não tem obra ativa, ocultar Ponto e Espelho
                if (temObraAtiva === false) {
                  return false
                }
                
                // Se ainda está carregando, não mostrar ainda
                if (loadingObra) {
                  return false
                }
              }
              
              // "Obras" deve ser mostrada baseado apenas em permissões, não em temObraAtiva
              if (action.title === "Obras") {
                // Verificar permissão usando o hook
                try {
                  const podeVerObras = hasPermission('obras:visualizar') || canAccessModule('obras')
                  if (!podeVerObras) {
                    return false
                  }
                  // Se tem permissão, mostrar independente de temObraAtiva
                  return true
                } catch (e) {
                  // Em caso de erro, verificar por role como fallback
                  const roleLower = (userRole || '').toLowerCase()
                  const podeVerObras = roleLower.includes('operador') || 
                                      roleLower.includes('operário') || 
                                      roleLower.includes('operario')
                  return podeVerObras
                }
              }
              
              // "Documentos da Obra" deve ser mostrada baseado apenas em permissões
              if (action.title === "Documentos da Obra") {
                // Verificar permissão usando o hook
                try {
                  const podeVerObras = hasPermission('obras:visualizar') || canAccessModule('obras')
                  if (!podeVerObras) {
                    return false
                  }
                  // Se tem permissão, mostrar independente de temObraAtiva
                  return true
                } catch (e) {
                  // Em caso de erro, verificar por role como fallback
                  const roleLower = (userRole || '').toLowerCase()
                  const podeVerObras = roleLower.includes('cliente') || 
                                      roleLower.includes('supervisor') ||
                                      roleLower.includes('operador') || 
                                      roleLower.includes('operário') || 
                                      roleLower.includes('operario')
                  return podeVerObras
                }
              }
              
              // Filtrar Ponto e Espelho - apenas Operários e Sinaleiros podem bater ponto
              if (action.title === "Ponto" || action.title === "Espelho") {
                // Obter cargo do user_metadata (mais confiável que perfil)
                let cargoFromMetadata: string | null = null
                try {
                  const userDataStr = localStorage.getItem('user_data')
                  if (userDataStr) {
                    const userData = JSON.parse(userDataStr)
                    cargoFromMetadata = userData?.user_metadata?.cargo || userData?.cargo || null
                  }
                } catch (e) {
                  // Ignorar erro
                }
                
                // Obter todos os roles possíveis de todas as fontes
                const hookRole = userRole?.toLowerCase() || ''
                const roleFromPerfilLower = roleFromPerfil?.toLowerCase() || ''
                const roleFromUserDataLower = roleFromUserData?.toLowerCase() || ''
                const cargoFromMetadataLower = cargoFromMetadata?.toLowerCase() || ''
                const pwaRoleLower = pwaUserData.user?.role?.toLowerCase() || ''
                const pwaCargoLower = pwaUserData.user?.cargo?.toLowerCase() || ''
                const currentRoleLower = currentUserRole?.toLowerCase() || ''
                
                // Criar array de todos os roles (sem duplicatas)
                const allRolesArray = [
                  cargoFromMetadataLower,
                  pwaCargoLower,
                  roleFromUserDataLower,
                  currentRoleLower,
                  hookRole,
                  roleFromPerfilLower,
                  pwaRoleLower
                ].filter(Boolean).filter((role, index, self) => self.indexOf(role) === index)
                
                // Validação de cargo removida - todos os funcionários podem bater ponto
                return true
              }
              
              // Filtrar Aprovações - apenas Supervisor para cima (NÃO para Operador)
              if (action.requiresSupervisor) {
                // Obter cargo do user_metadata (mais confiável que perfil)
                let cargoFromMetadata: string | null = null
                try {
                  const userDataStr = localStorage.getItem('user_data')
                  if (userDataStr) {
                    const userData = JSON.parse(userDataStr)
                    cargoFromMetadata = userData?.user_metadata?.cargo || userData?.cargo || null
                  }
                } catch (e) {
                  // Ignorar erro
                }
                
                // Obter todos os roles possíveis de todas as fontes
                const hookRole = userRole?.toLowerCase() || ''
                const roleFromPerfilLower = roleFromPerfil?.toLowerCase() || ''
                const roleFromUserDataLower = roleFromUserData?.toLowerCase() || ''
                const cargoFromMetadataLower = cargoFromMetadata?.toLowerCase() || ''
                const pwaRoleLower = pwaUserData.user?.role?.toLowerCase() || ''
                const pwaCargoLower = pwaUserData.user?.cargo?.toLowerCase() || ''
                const currentRoleLower = currentUserRole?.toLowerCase() || ''
                
                // Criar array de todos os roles (sem duplicatas)
                // PRIORIDADE: cargo do metadata primeiro
                const allRolesArray = [
                  cargoFromMetadataLower, // PRIORIDADE: cargo do user_metadata
                  pwaCargoLower,
                  roleFromUserDataLower,
                  currentRoleLower,
                  hookRole,
                  roleFromPerfilLower,
                  pwaRoleLower
                ].filter(Boolean).filter((role, index, self) => self.indexOf(role) === index)
                
                const roleLower = allRolesArray.join(' ')
                
                // PRIORIDADE 1: Verificar se o cargo contém "supervisor" (mesmo que perfil seja "Operador")
                if (cargoFromMetadataLower.includes('supervisor') || pwaCargoLower.includes('supervisor')) {
                  return true
                }
                
                // Verificar se tem permissão de aprovar horas (mais confiável)
                if (canApproveHoras()) {
                  return true
                }
                
                // Verificar role manualmente - PRIORIDADE: verificar se algum role contém "supervisor"
                const isSupervisorRole = allRolesArray.some(role => 
                  role.includes('supervisor') || 
                  role === 'supervisores' || 
                  role === 'supervisor'
                )
                
                if (isSupervisorRole) {
                  return true
                }
                
                // Verificar se é Operário (todas as variações) - se for, NÃO mostrar
                // MAS: só bloquear se NÃO tiver cargo com supervisor
                const isOperario = allRolesArray.some(role => 
                  (role.includes('operário') || 
                  role.includes('operario') || 
                  (role.includes('operador') && !role.includes('supervisor')) ||
                  role === 'operários' ||
                  role === 'operarios' ||
                  role === 'operador' ||
                  role === 'operador teste' ||
                  role === '4') && !role.includes('supervisor')
                )
                
                if (isOperario && !cargoFromMetadataLower.includes('supervisor') && !pwaCargoLower.includes('supervisor')) {
                  return false
                }
                
                // Verificar outros roles com permissão (Gestor, Admin)
                const canSee = allRolesArray.some(role =>
                  role.includes('gestor') ||
                  role.includes('admin') ||
                  role === 'gestores' || 
                  role === 'gestor' || 
                  role === 'admin' || 
                  role === 'administrador'
                )
                
                return canSee
                
                return canSee
              }
              return true
            })
            .map((action, index) => {
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

      {/* Mapa com Localização Atual */}
      {location && (
        <Card className="overflow-hidden py-0">
          <CardContent className="p-0">
            <div className="relative w-full h-64 md:h-80">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
                className="w-full h-full"
              />
              {/* Overlay com informações */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 max-w-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 mb-1">Sua Localização</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{location.address || `${location.lat}, ${location.lng}`}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dica ou Alerta */}
      {pwaUserData.documentosPendentes > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-500">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-blue-900 mb-1">
              {pwaUserData.documentosPendentes} notificação{pwaUserData.documentosPendentes > 1 ? 'ões' : ''} não lida{pwaUserData.documentosPendentes > 1 ? 's' : ''}
            </h3>
            <p className="text-xs text-blue-700 mb-2">
              Você tem notificações aguardando sua atenção
            </p>
            <Button 
              size="sm" 
              onClick={() => handleNavigation('/pwa/notificacoes')}
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
            >
              Ver notificações
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Diálogo de Pergunta sobre Feriado */}
      <Dialog open={showFeriadoDialog} onOpenChange={setShowFeriadoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Informação sobre o Dia
            </DialogTitle>
            <DialogDescription>
              Hoje é feriado?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div className="flex gap-3">
              <Button
                onClick={() => setIsFeriado(false)}
                variant={isFeriado === false ? "default" : "outline"}
                className={`flex-1 ${isFeriado === false ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              >
                Não
              </Button>
              <Button
                onClick={() => setIsFeriado(true)}
                variant={isFeriado === true ? "default" : "outline"}
                className={`flex-1 ${isFeriado === true ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              >
                Sim
              </Button>
            </div>

            {isFeriado === true && (
              <div className="space-y-3 pt-2 border-t">
                <p className="text-sm font-medium">Tipo de feriado:</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => setTipoFeriado('nacional')}
                    variant={tipoFeriado === 'nacional' ? "default" : "outline"}
                    size="sm"
                    className={tipoFeriado === 'nacional' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    Nacional
                  </Button>
                  <Button
                    onClick={() => setTipoFeriado('estadual')}
                    variant={tipoFeriado === 'estadual' ? "default" : "outline"}
                    size="sm"
                    className={tipoFeriado === 'estadual' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    Estadual
                  </Button>
                  <Button
                    onClick={() => setTipoFeriado('local')}
                    variant={tipoFeriado === 'local' ? "default" : "outline"}
                    size="sm"
                    className={tipoFeriado === 'local' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    Local
                  </Button>
                </div>
                
                {tipoFeriado && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      <strong>Importante:</strong> Dia facultativo NÃO é feriado oficial.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isFacultativo"
                        checked={isFacultativo}
                        onChange={(e) => setIsFacultativo(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="isFacultativo" className="text-sm font-medium cursor-pointer">
                        É um dia facultativo?
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowFeriadoDialog(false)
                  setIsFeriado(null)
                  setTipoFeriado(null)
                  setIsFacultativo(false)
                }}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmarFeriado}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isFeriado === null || (isFeriado === true && !tipoFeriado)}
              >
                Continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Registro */}
      <Dialog open={showConfirmacaoDialog} onOpenChange={setShowConfirmacaoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Confirmar Registro de Ponto
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                setShowConfirmacaoDialog(false)
              }}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarRegistroPonto}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Confirmar Registro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
