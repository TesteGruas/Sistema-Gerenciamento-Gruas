"use client"

import { useState, useEffect, useRef } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  Play, 
  Square, 
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  MapPin,
  Wifi,
  WifiOff,
  Navigation,
  RefreshCw,
  MapPinOff,
  Shield,
  FileSignature
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getFuncionarioIdWithFallback } from "@/lib/get-funcionario-id"
import * as pontoApi from "@/lib/api-ponto-eletronico"
import { 
  obterLocalizacaoAtual, 
  validarProximidadeObra, 
  formatarDistancia,
  buscarObrasFuncionario,
  type Coordenadas,
  type Obra
} from "@/lib/geolocation-validator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SignaturePad } from "@/components/signature-pad"
import { getApiBasePath } from "@/lib/runtime-config"

export default function PWAPontoPage() {
  const obterDataLocalISO = () => {
    const now = new Date()
    const ano = now.getFullYear()
    const mes = String(now.getMonth() + 1).padStart(2, '0')
    const dia = String(now.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [registrosHoje, setRegistrosHoje] = useState({
    entrada: null as string | null,
    saida_almoco: null as string | null,
    volta_almoco: null as string | null,
    saida: null as string | null,
    trabalho_corrido: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRegistros, setIsLoadingRegistros] = useState(true) // Loading específico para carregar registros
  const [user, setUser] = useState<any>(null)
  const [location, setLocation] = useState<{lat: number, lng: number, address?: string} | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [obra, setObra] = useState<Obra | null>(null)
  const [validacaoLocalizacao, setValidacaoLocalizacao] = useState<{valido: boolean, distancia: number, mensagem: string} | null>(null)
  const [showAssinaturaDialog, setShowAssinaturaDialog] = useState(false)
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState<string | null>(null)
  const [tipoRegistroPendente, setTipoRegistroPendente] = useState<string | null>(null)
  const [horasExtras, setHorasExtras] = useState<number>(0)
  const [showConfirmacaoDialog, setShowConfirmacaoDialog] = useState(false)
  const [tipoRegistroConfirmacao, setTipoRegistroConfirmacao] = useState<string | null>(null)
  const [showFeriadoDialog, setShowFeriadoDialog] = useState(false)
  const [isFeriado, setIsFeriado] = useState<boolean | null>(null)
  const [tipoFeriado, setTipoFeriado] = useState<'nacional' | 'estadual' | 'local' | null>(null)
  const [isFacultativo, setIsFacultativo] = useState<boolean>(false)
  const [isDisparandoDebugAlmoco, setIsDisparandoDebugAlmoco] = useState(false)
  const [isDisparandoDebugResponsavel, setIsDisparandoDebugResponsavel] = useState(false)
  const ultimaTentativaObraRef = useRef(0)
  const resolvendoObraRef = useRef(false)
  const { toast } = useToast()

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

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Carregar dados do usuário e obra
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const loadUserAndObras = async () => {
      const userData = localStorage.getItem('user_data')
      const userProfile = localStorage.getItem('user_profile')
      
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          
          // Adicionar dados do profile se existir
          if (userProfile) {
            const parsedProfile = JSON.parse(userProfile)
            parsedUser.profile = parsedProfile
          }
          
          console.log('🔍 [PWA Ponto] Dados do usuário carregados:', {
            user_id: parsedUser.id,
            funcionario_id: parsedUser.profile?.funcionario_id,
            profile: parsedUser.profile
          })
          
          setUser(parsedUser)
          
          // Carregar obras do funcionário
          const obras = await buscarObrasFuncionario(parsedUser.id)
          if (obras.length > 0) {
            const obraSelecionada = obras[0]
            setObra(obraSelecionada) // Usar primeira obra por padrão
            // Obter localização automaticamente quando a obra for carregada
            try {
              const coordenadas = await obterLocalizacaoAtual({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              })
              setLocation(coordenadas)
              
              // Validar proximidade com a obra quando houver coordenadas
              if (obraSelecionada.coordenadas) {
                const validacao = validarProximidadeObra(coordenadas, obraSelecionada)
                setValidacaoLocalizacao(validacao)
              } else {
                setValidacaoLocalizacao(null)
              }
            } catch (error) {
              console.warn('Não foi possível obter localização automaticamente:', error)
            }
          }
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error)
        }
      }
    }
    
    loadUserAndObras()
  }, [])

  // Carregar registros do dia
  useEffect(() => {
    if (user?.id) {
      carregarRegistrosHoje()
    }
  }, [user])

  // Sincronizar fila quando ficar online
  useEffect(() => {
    if (isOnline && user?.id) {
      sincronizarFilaDeRegistros()
    }
  }, [isOnline, user])

  const sincronizarFilaDeRegistros = async () => {
    const fila = JSON.parse(localStorage.getItem('fila_registros_ponto') || '[]')
    
    if (fila.length === 0) return
    
    console.log(`Sincronizando ${fila.length} registros de ponto pendentes...`)
    
    const filaComErros = []
    
    for (const item of fila) {
      try {
        if (item.registroId) {
          // Atualizar registro existente
          await pontoApi.atualizarRegistro(item.registroId, item.dados)
        } else {
          // Criar novo registro
          await pontoApi.criarRegistro(item.dados)
        }
      } catch (error) {
        console.error(`Erro ao sincronizar registro de ponto:`, error)
        filaComErros.push(item)
      }
    }
    
    // Atualizar fila apenas com itens que falharam
    localStorage.setItem('fila_registros_ponto', JSON.stringify(filaComErros))
    
    if (filaComErros.length === 0) {
      // Recarregar dados atualizados
      carregarRegistrosHoje()
    }
  }

  const garantirObraComCoordenadas = async () => {
    let obraAtual = obra

    // Se não houver obra em memória, tenta carregar.
    if (!obraAtual && user?.id) {
      const obras = await buscarObrasFuncionario(user.id)
      if (obras.length > 0) {
        obraAtual = obras[0]
        setObra(obraAtual)
      }
    }

    // Se obra existir, mas ainda sem coordenadas, força novo carregamento
    // para reaplicar geocoding automático por endereço.
    if (obraAtual && !obraAtual.coordenadas && user?.id) {
      const agora = Date.now()
      if (!resolvendoObraRef.current && (agora - ultimaTentativaObraRef.current) > 60000) {
        resolvendoObraRef.current = true
        ultimaTentativaObraRef.current = agora
        try {
          const obrasAtualizadas = await buscarObrasFuncionario(user.id)
          const obraAtualizada = obrasAtualizadas.find((item) => item.id === obraAtual?.id) || obraAtual
          obraAtual = obraAtualizada
          setObra(obraAtualizada)
        } finally {
          resolvendoObraRef.current = false
        }
      }
    }

    return obraAtual
  }

  // Obter localização atual
  // Obter localização atual e validar proximidade com a obra
  const obterLocalizacao = async () => {
    setIsGettingLocation(true)
    setLocationError(null)
    setValidacaoLocalizacao(null)
    
    try {
      const coordenadas = await obterLocalizacaoAtual()
      setLocation(coordenadas)

      const obraResolvida = await garantirObraComCoordenadas()

      // Validar proximidade com a obra
      if (obraResolvida?.coordenadas) {
        const validacao = validarProximidadeObra(coordenadas, obraResolvida)
        setValidacaoLocalizacao(validacao)

        // Validação realizada
      }
    } catch (error: any) {
      console.error('Erro ao obter localização:', error)
      setLocationError(error.message)
    } finally {
      setIsGettingLocation(false)
    }
  }

  // Carregar registros do dia
  const carregarRegistrosHoje = async () => {
    setIsLoadingRegistros(true) // Iniciar loading
    try {
      // Carregar do cache primeiro se offline
      if (!isOnline) {
        const cachedRegistros = localStorage.getItem('cached_registros_ponto_hoje')
        
        if (cachedRegistros) {
          const registros = JSON.parse(cachedRegistros)
          setRegistrosHoje(registros)
        } else {
          // Se não tem cache e está offline, definir valores vazios
          setRegistrosHoje({
            entrada: null,
            saida_almoco: null,
            volta_almoco: null,
            saida: null,
            trabalho_corrido: false
          })
        }
        setIsLoadingRegistros(false)
        return
      }

      const hoje = obterDataLocalISO()
      const token = localStorage.getItem('access_token')
      if (!token) {
        setIsLoadingRegistros(false)
        return
      }
      
      const funcionarioId = await getFuncionarioIdWithFallback(
        user, 
        token, 
        'ID do funcionário não encontrado'
      )
      console.log('🔍 [PWA Ponto] Fazendo chamada API com funcionario_id:', funcionarioId)
      
      const data = await pontoApi.getRegistros({
        funcionario_id: funcionarioId,
        data_inicio: hoje,
        data_fim: hoje
      })

      if (data && data.length > 0) {
        const registro = data[0]
        const registros = {
          entrada: registro.entrada || null,
          saida_almoco: registro.saida_almoco || null,
          volta_almoco: registro.volta_almoco || null,
          saida: registro.saida || null,
          trabalho_corrido: Boolean(registro.trabalho_corrido)
        }
        setRegistrosHoje(registros)
        
        // Salvar no cache
        localStorage.setItem('cached_registros_ponto_hoje', JSON.stringify(registros))
      } else {
        // Sem registros hoje
        const registrosVazios = {
          entrada: null,
          saida_almoco: null,
          volta_almoco: null,
          saida: null,
          trabalho_corrido: false
        }
        setRegistrosHoje(registrosVazios)
        localStorage.setItem('cached_registros_ponto_hoje', JSON.stringify(registrosVazios))
      }
    } catch (error: any) {
      console.error('Erro ao carregar registros:', error)
      
      // Tentar carregar do cache em caso de erro
      const cachedRegistros = localStorage.getItem('cached_registros_ponto_hoje')
      
      if (cachedRegistros) {
        setRegistrosHoje(JSON.parse(cachedRegistros))
      } else {
        // Se não tem cache, definir valores vazios
        setRegistrosHoje({
          entrada: null,
          saida_almoco: null,
          volta_almoco: null,
          saida: null,
          trabalho_corrido: false
        })
      }
    } finally {
      setIsLoadingRegistros(false) // Finalizar loading
    }
  }

  const dispararNotificacaoAlmocoDebug = async () => {
    setIsDisparandoDebugAlmoco(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('Token não encontrado')

      const funcionarioId = await getFuncionarioIdWithFallback(
        user,
        token,
        'ID do funcionário não encontrado'
      )
      const hoje = obterDataLocalISO()
      const apiUrl = getApiBasePath()

      const response = await fetch(`${apiUrl}/ponto-eletronico/debug/disparar-notificacao-almoco`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          funcionario_id: funcionarioId,
          data: hoje
        })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Falha ao disparar notificação de almoço')
      }

      const canais = data?.data?.canais || {}
      toast({
        title: "Debug executado",
        description: `Notificação enviada. App: ${canais.app ? 'sim' : 'não'} | WhatsApp: ${canais.whatsapp ? 'sim' : 'não'}`,
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Erro no debug de almoço",
        description: error.message || "Não foi possível disparar a notificação.",
        variant: "destructive"
      })
    } finally {
      setIsDisparandoDebugAlmoco(false)
    }
  }

  const dispararNotificacaoResponsavelDebug = async () => {
    setIsDisparandoDebugResponsavel(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('Token não encontrado')

      const funcionarioId = await getFuncionarioIdWithFallback(
        user,
        token,
        'ID do funcionário não encontrado'
      )
      const hoje = obterDataLocalISO()
      const apiUrl = getApiBasePath()

      const response = await fetch(`${apiUrl}/ponto-eletronico/debug/disparar-notificacao-responsavel-assinatura`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          funcionario_id: funcionarioId,
          data: hoje
        })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Falha ao disparar notificação do responsável')
      }

      const totalResponsaveis = data?.data?.total_responsaveis_notificados ?? 0
      toast({
        title: "Debug executado",
        description: `Notificação de assinatura disparada para ${totalResponsaveis} responsável(eis).`,
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Erro no debug do responsável",
        description: error.message || "Não foi possível disparar a notificação.",
        variant: "destructive"
      })
    } finally {
      setIsDisparandoDebugResponsavel(false)
    }
  }

  const estaNaJanelaTrabalhoCorrido = () => {
    if (!currentTime) return false

    const minutosAtuais = currentTime.getHours() * 60 + currentTime.getMinutes()
    const inicioJanela = 11 * 60 + 30 // 11:30
    const fimJanela = 12 * 60 // 12:00

    return minutosAtuais >= inicioJanela && minutosAtuais <= fimJanela
  }

  const podeSelecionarTrabalhoCorrido = () => {
    return Boolean(
      registrosHoje.entrada &&
      !registrosHoje.saida_almoco &&
      !registrosHoje.volta_almoco &&
      !registrosHoje.saida &&
      !registrosHoje.trabalho_corrido &&
      estaNaJanelaTrabalhoCorrido()
    )
  }

  const marcarTrabalhoCorrido = async () => {
    if (!podeSelecionarTrabalhoCorrido()) {
      toast({
        title: "Fora do horário",
        description: "A opção Dia corrido fica disponível apenas entre 11:30 e 12:00.",
        variant: "destructive"
      })
      return
    }

    if (!isOnline) {
      toast({
        title: "Sem conexão",
        description: "Para marcar Dia corrido, conecte-se à internet.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('Token não encontrado')

      const funcionarioId = await getFuncionarioIdWithFallback(
        user,
        token,
        'ID do funcionário não encontrado'
      )

      const hoje = obterDataLocalISO()
      const registrosExistentes = await pontoApi.getRegistros({
        funcionario_id: funcionarioId,
        data_inicio: hoje,
        data_fim: hoje
      })

      if (!registrosExistentes || registrosExistentes.length === 0) {
        throw new Error('Registre a entrada antes de selecionar Dia corrido.')
      }

      const registroAtualizado = await pontoApi.criarRegistro({
        funcionario_id: funcionarioId,
        data: hoje,
        trabalho_corrido: true,
        justificativa_alteracao: 'Dia corrido marcado via PWA'
      })

      if (!registroAtualizado?.trabalho_corrido) {
        const registrosPosAtualizacao = await pontoApi.getRegistros({
          funcionario_id: funcionarioId,
          data_inicio: hoje,
          data_fim: hoje
        })
        const registroHojeAtualizado = registrosPosAtualizacao?.[0]
        if (!registroHojeAtualizado?.trabalho_corrido) {
          throw new Error('O servidor não confirmou o Dia corrido para hoje. Tente novamente.')
        }
      }

      const novosRegistros = {
        ...registrosHoje,
        trabalho_corrido: true
      }

      setRegistrosHoje(novosRegistros)
      localStorage.setItem('cached_registros_ponto_hoje', JSON.stringify(novosRegistros))
      await carregarRegistrosHoje()

      toast({
        title: "Dia corrido selecionado",
        description: "Seu dia foi marcado como trabalho corrido (sem pausa automática de almoço).",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Erro ao marcar dia corrido",
        description: error.message || 'Não foi possível marcar o dia corrido.',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const registrarPonto = async (tipo: string) => {
    // VALIDAÇÃO: Verificar se já existe um registro completo (entrada + saída)
    if (registrosHoje.entrada && registrosHoje.saida) {
      toast({
        title: "Registro já completo",
        description: "Você já possui um registro completo para hoje (entrada e saída). Não é possível registrar novos pontos no mesmo dia.",
        variant: "destructive"
      })
      return
    }
    
    // Se for entrada e ainda não perguntou sobre feriado, perguntar primeiro
    if (tipo === 'entrada' && !registrosHoje.entrada && isFeriado === null) {
      setTipoRegistroConfirmacao(tipo)
      setShowFeriadoDialog(true)
      return
    }
    
    // Mostrar modal de confirmação
    setTipoRegistroConfirmacao(tipo)
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
    if (!tipoRegistroConfirmacao) return
    
    setShowConfirmacaoDialog(false)
    setIsLoading(true)
    const tipo = tipoRegistroConfirmacao
    
    // Reativado: localização é obrigatória para bater ponto.
    try {
      const coordenadas = await obterLocalizacaoAtual({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })
      setLocation(coordenadas)

      const obraResolvida = await garantirObraComCoordenadas()

      if (!obraResolvida) {
        throw new Error('Nenhuma obra ativa vinculada para validar localização do ponto.')
      }

      if (!obraResolvida.coordenadas) {
        throw new Error('A obra atual não possui coordenadas (latitude/longitude) configuradas.')
      }

      const validacao = validarProximidadeObra(coordenadas, obraResolvida)
      setValidacaoLocalizacao(validacao)

      if (!validacao.valido) {
        throw new Error(`Você está fora do raio permitido (${raioPermitidoFormatado}) da obra. Distância atual: ${formatarDistancia(validacao.distancia)}.`)
      }
    } catch (error: any) {
      setIsLoading(false)
      toast({
        title: "Localização obrigatória",
        description: error.message || "Não foi possível validar sua localização para registrar o ponto.",
        variant: "destructive"
      })
      return
    }
    
    try {
      // Obter funcionarioId
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Token não encontrado')
      }
      
      const funcionarioId = await getFuncionarioIdWithFallback(
        user, 
        token, 
        'ID do funcionário não encontrado'
      )
      const agora = new Date()
      const horaAtual = agora.toTimeString().slice(0, 5)
      const hoje = obterDataLocalISO()
      
      // VALIDAÇÃO: Verificar se já existe um registro completo (entrada + saída) para hoje
      if (isOnline) {
        const registrosExistentes = await pontoApi.getRegistros({
          funcionario_id: funcionarioId,
          data_inicio: hoje,
          data_fim: hoje
        })
        
        if (registrosExistentes && registrosExistentes.length > 0) {
          const registroExistente = registrosExistentes[0]
          
          // Se já existe entrada E saída, não permitir novos registros
          if (registroExistente.entrada && registroExistente.saida) {
            setIsLoading(false)
            toast({
              title: "Registro já completo",
              description: "Você já possui um registro completo para hoje (entrada e saída). Não é possível registrar novos pontos no mesmo dia.",
              variant: "destructive"
            })
            return
          }
        }
      } else {
        // Validação offline: verificar cache
        const cachedRegistrosStr = localStorage.getItem('cached_registros_ponto_hoje')
        if (cachedRegistrosStr) {
          const cachedRegistros = JSON.parse(cachedRegistrosStr)
          if (cachedRegistros.entrada && cachedRegistros.saida) {
            setIsLoading(false)
            toast({
              title: "Registro já completo",
              description: "Você já possui um registro completo para hoje (entrada e saída). Não é possível registrar novos pontos no mesmo dia.",
              variant: "destructive"
            })
            return
          }
        }
      }
      
      // Calcular horas extras se for saída
      if (tipo === 'saida' && registrosHoje.entrada) {
        const entradaParts = registrosHoje.entrada.split(':')
        const saidaParts = horaAtual.split(':')
        
        const entradaMinutos = parseInt(entradaParts[0]) * 60 + parseInt(entradaParts[1])
        const saidaMinutos = parseInt(saidaParts[0]) * 60 + parseInt(saidaParts[1])

        // Descontar intervalo apenas quando houver saída e retorno de almoço.
        const possuiIntervaloAlmoco = Boolean(registrosHoje.saida_almoco && registrosHoje.volta_almoco)
        const minutosIntervalo = possuiIntervaloAlmoco ? 60 : 0
        const totalMinutos = saidaMinutos - entradaMinutos - minutosIntervalo
        const horasTrabalhadas = totalMinutos / 60
        
        // Jornada normal é 8 horas
        const horasExtrasCalculadas = Math.max(0, horasTrabalhadas - 8)
        
        if (horasExtrasCalculadas > 0) {
          // Exigir assinatura para horas extras
          setHorasExtras(horasExtrasCalculadas)
          setTipoRegistroPendente(tipo)
          setShowAssinaturaDialog(true)
          setIsLoading(false)
          return
        }
      }
      
      // Validação defensiva antes de enviar.
      if (validacaoLocalizacao && !validacaoLocalizacao.valido) {
        setIsLoading(false)
        toast({
          title: "Fora do perímetro",
          description: `Você precisa estar em até ${raioPermitidoFormatado} da obra para registrar ponto. Distância atual: ${formatarDistancia(validacaoLocalizacao.distancia)}.`,
          variant: "destructive"
        })
        return
      }

      // Preparar dados para envio
      const campoTipo = tipo.toLowerCase().replace(' ', '_')
      const dadosRegistro: any = {
        funcionario_id: funcionarioId,
        data: hoje,
        [campoTipo]: horaAtual,
        localizacao: location ? `${location.lat}, ${location.lng}` : undefined
      }

      // Adicionar informações de feriado se for entrada
      if (tipo === 'entrada' && isFeriado !== null) {
        dadosRegistro.is_feriado = isFeriado
        dadosRegistro.is_facultativo = isFacultativo
        if (isFeriado && tipoFeriado) {
          dadosRegistro.feriado_tipo = tipoFeriado
        }
      }

      // Se offline, adicionar à fila de sincronização
      if (!isOnline) {
        const filaRegistros = JSON.parse(localStorage.getItem('fila_registros_ponto') || '[]')
        
        // Verificar se já existe registro do dia no cache
        const cachedRegistrosStr = localStorage.getItem('cached_registros_ponto_hoje')
        let registroExistenteId = null
        
        if (cachedRegistrosStr) {
          const cachedData = JSON.parse(cachedRegistrosStr)
          // Se tem algum registro, provavelmente temos um ID
          if (cachedData.entrada || cachedData.saida_almoco || cachedData.volta_almoco || cachedData.saida) {
            const registrosCache = JSON.parse(localStorage.getItem('registros_ponto_completo') || '[]')
            const registroHoje = registrosCache.find((r: any) => r.data === hoje && r.funcionario_id === (user.profile?.funcionario_id || user.id))
            if (registroHoje) {
              registroExistenteId = registroHoje.id
            }
          }
        }
        
        filaRegistros.push({
          registroId: registroExistenteId,
          dados: {
            ...dadosRegistro,
            justificativa_alteracao: registroExistenteId ? `Registro ${tipo} via PWA - Sincronizado` : undefined
          },
          timestamp: new Date().toISOString()
        })
        localStorage.setItem('fila_registros_ponto', JSON.stringify(filaRegistros))
        
        // Atualizar UI localmente
        setRegistrosHoje(prev => ({
          ...prev,
          [campoTipo]: horaAtual
        }))
        
        // Atualizar cache
        const novosRegistros = {
          ...registrosHoje,
          [campoTipo]: horaAtual
        }
        localStorage.setItem('cached_registros_ponto_hoje', JSON.stringify(novosRegistros))
        
        return
      }

      // Verificar se já existe registro para hoje
      const registrosExistentes = await pontoApi.getRegistros({
        funcionario_id: funcionarioId,
        data_inicio: hoje,
        data_fim: hoje
      })

      try {
        if (registrosExistentes && registrosExistentes.length > 0) {
          // Atualizar registro existente
          const registroId = registrosExistentes[0].id!
          await pontoApi.atualizarRegistro(registroId, {
            ...dadosRegistro,
            justificativa_alteracao: `Registro ${tipo} via PWA`
          })
        } else {
          // Criar novo registro
          await pontoApi.criarRegistro(dadosRegistro)
        }
      } catch (apiError: any) {
        // Tratar erro específico de registro completo (409 - Conflito)
        if (apiError.response?.status === 409) {
          const errorMessage = apiError.response?.data?.message || 'Já existe um registro completo para hoje. Não é possível registrar novos pontos no mesmo dia.'
          toast({
            title: "Registro já completo",
            description: errorMessage,
            variant: "destructive"
          })
          setIsLoading(false)
          return
        }
        
        // Tratar erro específico de geolocalização
        if (apiError.response?.status === 403 && apiError.response?.data?.error === 'FORA_DO_PERIMETRO') {
          const errorData = apiError.response.data
          const tipoAlvo = errorData.tipo === 'grua' ? 'da grua' : 'da obra'
          const nomeAlvo = errorData.alvo || errorData.obra || 'localização'
          
          throw new Error(errorData.message || `Você está fora da área permitida (${errorData.raio_permitido}m) para registrar ponto`)
        }
        throw apiError
      }

      // Atualizar registros localmente
      setRegistrosHoje(prev => ({
        ...prev,
        [campoTipo]: horaAtual
      }))
      
      // Atualizar cache
      const novosRegistros = {
        ...registrosHoje,
        [campoTipo]: horaAtual
      }
      localStorage.setItem('cached_registros_ponto_hoje', JSON.stringify(novosRegistros))
      
      // Mensagem de sucesso
      toast({
        title: "Ponto registrado",
        description: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrado com sucesso às ${horaAtual}`,
        variant: "default"
      })

    } catch (error: any) {
      console.error('Erro ao registrar ponto:', error)
      
      // Mostrar mensagem de erro se não foi tratado anteriormente
      if (error.message) {
        toast({
          title: "Erro ao registrar",
          description: error.message,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Erro ao registrar",
          description: "Ocorreu um erro ao registrar o ponto. Tente novamente.",
          variant: "destructive"
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Confirmar assinatura e completar registro
  const handleAssinaturaConfirmada = async (signatureDataUrl: string) => {
    setAssinaturaDataUrl(signatureDataUrl)
    setShowAssinaturaDialog(false)
    
    if (!tipoRegistroPendente) return
    
    await completarRegistroComAssinatura(tipoRegistroPendente, signatureDataUrl)
  }


  // Completar registro com assinatura de hora extra
  const completarRegistroComAssinatura = async (tipo: string, assinatura: string) => {
    setIsLoading(true)
    
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      // Também exige localização válida no fluxo com assinatura.
      const coordenadas = await obterLocalizacaoAtual({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })
      setLocation(coordenadas)

      const obraResolvida = await garantirObraComCoordenadas()

      if (!obraResolvida) {
        throw new Error('Nenhuma obra ativa vinculada para validar localização do ponto.')
      }

      if (!obraResolvida.coordenadas) {
        throw new Error('A obra atual não possui coordenadas (latitude/longitude) configuradas.')
      }

      const validacao = validarProximidadeObra(coordenadas, obraResolvida)
      setValidacaoLocalizacao(validacao)
      if (!validacao.valido) {
        throw new Error(`Você está fora do raio permitido (${raioPermitidoFormatado}) da obra. Distância atual: ${formatarDistancia(validacao.distancia)}.`)
      }

      const agora = new Date()
      const horaAtual = agora.toTimeString().slice(0, 5)
      const hoje = obterDataLocalISO()
      
      // Buscar ID numérico do funcionário usando função utilitária
      const funcionarioId = await getFuncionarioIdWithFallback(
        user, 
        token, 
        'ID do funcionário não encontrado'
      )

      // Preparar dados para envio
      const dadosRegistro = {
        funcionario_id: funcionarioId,
        data: hoje,
        [tipo.toLowerCase().replace(' ', '_')]: horaAtual,
        localizacao: location ? `${location.lat}, ${location.lng}` : null,
        horas_extras: horasExtras,
        assinatura_funcionario: assinatura,
        requer_aprovacao: true // Horas extras precisam de aprovação do encarregador
      }

      // Verificar se já existe registro para hoje
      const responseExistente = await fetch(
        `${getApiBasePath()}/ponto-eletronico/registros?funcionario_id=${funcionarioId}&data_inicio=${hoje}&data_fim=${hoje}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      let response
      if (responseExistente.ok) {
        const dataExistente = await responseExistente.json()
        if (dataExistente.data && dataExistente.data.length > 0) {
          const registroExistente = dataExistente.data[0]
          
          // VALIDAÇÃO: Se já existe um registro completo (entrada + saída), não permitir novos registros
          if (registroExistente.entrada && registroExistente.saida) {
            setIsLoading(false)
            toast({
              title: "Registro já completo",
              description: "Você já possui um registro completo para hoje (entrada e saída). Não é possível registrar novos pontos no mesmo dia.",
              variant: "destructive"
            })
            return
          }
          
          // Atualizar registro existente
          const registroId = registroExistente.id
          response = await fetch(
            `${getApiBasePath()}/ponto-eletronico/registros/${registroId}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                ...dadosRegistro,
                justificativa_alteracao: `Registro ${tipo} com ${horasExtras.toFixed(1)}h extras via PWA`
              })
            }
          )
        }
      }

      if (response) {
        if (response.ok) {
          // Atualizar registros localmente
          setRegistrosHoje(prev => ({
            ...prev,
            [tipo.toLowerCase().replace(' ', '_')]: horaAtual
          }))

          // Resetar estados
          setHorasExtras(0)
          setTipoRegistroPendente(null)
          setAssinaturaDataUrl(null)
          
          toast({
            title: "Registro realizado",
            description: `Ponto registrado com sucesso. ${horasExtras > 0 ? `${horasExtras.toFixed(1)}h extras aguardando aprovação.` : ''}`,
            variant: "default"
          })
        } else {
          // Tratar erros da API
          const errorData = await response.json().catch(() => ({}))
          
          if (response.status === 409) {
            // Registro já completo
            toast({
              title: "Registro já completo",
              description: errorData.message || 'Já existe um registro completo para hoje. Não é possível registrar novos pontos no mesmo dia.',
              variant: "destructive"
            })
          } else {
            toast({
              title: "Erro ao registrar",
              description: errorData.message || 'Ocorreu um erro ao registrar o ponto. Tente novamente.',
              variant: "destructive"
            })
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao registrar ponto:', error)
      toast({
        title: "Erro ao registrar",
        description: error.message || 'Ocorreu um erro ao registrar o ponto. Tente novamente.',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusRegistro = () => {
    const { entrada, saida_almoco, volta_almoco, saida } = registrosHoje
    
    if (!entrada) return { status: "Não iniciado", cor: "gray" }
    if (entrada && !saida_almoco && !volta_almoco && !saida) return { status: "Trabalhando", cor: "green" }
    if (entrada && saida_almoco && !volta_almoco && !saida) return { status: "Almoço", cor: "yellow" }
    if (entrada && saida_almoco && volta_almoco && !saida) return { status: "Trabalhando", cor: "green" }
    if (entrada && saida) return { status: "Finalizado", cor: "blue" }
    
    return { status: "Em andamento", cor: "orange" }
  }

  const status = getStatusRegistro()

  // Determinar automaticamente qual é o próximo registro necessário
  const getProximoRegistro = () => {
    if (!registrosHoje.entrada) {
      return {
        tipo: 'entrada',
        label: 'Entrada',
        descricao: 'Iniciar jornada de trabalho',
        icone: Play,
        cor: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
        corTexto: 'text-green-700'
      }
    }

    if (registrosHoje.entrada && !registrosHoje.saida) {
      return {
        tipo: 'saida',
        label: 'Saída',
        descricao: 'Finalizar jornada de trabalho',
        icone: Square,
        cor: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
        corTexto: 'text-red-700'
      }
    }
    
    return null // Jornada completa
  }

  const proximoRegistro = getProximoRegistro()
  const podeRegistrar = proximoRegistro !== null
  const raioPermitidoAtual = obra?.raio_permitido ?? 5000
  const raioPermitidoFormatado = formatarDistancia(raioPermitidoAtual)

  // Mostrar loading enquanto carrega os registros
  if (isLoadingRegistros) {
    return (
      <ProtectedRoute permission="ponto_eletronico:visualizar">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ponto Eletrônico</h1>
              <p className="text-gray-600">Registre sua entrada e saída</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isOnline 
                  ? "bg-green-100 text-green-700" 
                  : "bg-red-100 text-red-700"
              }`}>
                {isOnline ? (
                  <Wifi className="w-3 h-3" />
                ) : (
                  <WifiOff className="w-3 h-3" />
                )}
                <span>{isOnline ? "Online" : "Offline"}</span>
              </div>
            </div>
          </div>

          {/* Loading State */}
          <Card>
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900">Carregando registros...</p>
                  <p className="text-sm text-gray-600 mt-1">Aguarde enquanto buscamos seus registros do dia</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute permission="ponto_eletronico:visualizar">
      <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ponto Eletrônico</h1>
          <p className="text-gray-600">Registre sua entrada e saída</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isOnline 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          }`}>
            {isOnline ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span>{isOnline ? "Online" : "Offline"}</span>
          </div>
        </div>
      </div>

      {/* Relógio e data */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {currentTime ? currentTime.toTimeString().slice(0, 8) : '--:--:--'}
            </div>
            <div className="text-lg text-gray-600 mb-4">
              {currentTime ? currentTime.toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }) : 'Carregando...'}
            </div>
            <Badge 
              className={`${
                status.cor === 'green' ? 'bg-green-100 text-green-800' :
                status.cor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                status.cor === 'blue' ? 'bg-blue-100 text-blue-800' :
                status.cor === 'orange' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {status.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Botões de registro */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Registrar Ponto
          </CardTitle>
          <CardDescription>
            {proximoRegistro 
              ? `Próximo: ${proximoRegistro.label} - ${proximoRegistro.descricao}`
              : "Jornada completa - Todos os registros foram feitos hoje"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {registrosHoje.trabalho_corrido && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-semibold text-emerald-700">Dia corrido ativo</p>
                <p className="text-xs text-emerald-700/90">
                  Você optou por trabalho corrido hoje (sem pausa automática de almoço).
                </p>
              </div>
            )}

            {podeSelecionarTrabalhoCorrido() && !registrosHoje.trabalho_corrido && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-2">
                <p className="text-sm font-semibold text-amber-800">Opção de almoço disponível</p>
                <p className="text-xs text-amber-800/90">
                  Você pode escolher Dia corrido entre 11:30 e 12:00.
                </p>
                <Button
                  onClick={marcarTrabalhoCorrido}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full border-amber-300 text-amber-900 hover:bg-amber-100"
                >
                  Marcar Dia corrido
                </Button>
              </div>
            )}

            {/* Botão único baseado no próximo registro */}
            {proximoRegistro ? (
              <div className="flex justify-center">
                <Button
                  onClick={() => registrarPonto(proximoRegistro.tipo)}
                  disabled={isLoading}
                  className={`h-24 w-full max-w-sm flex flex-col gap-3 text-white font-semibold transition-all duration-200 bg-gradient-to-br ${proximoRegistro.cor} shadow-lg hover:shadow-xl active:scale-95`}
                >
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shadow-md">
                    <proximoRegistro.icone className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{proximoRegistro.label}</div>
                    <div className="text-sm opacity-90">{proximoRegistro.descricao}</div>
                  </div>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Jornada Completa</h3>
                <p className="text-gray-600">Você já registrou todos os pontos do dia</p>
              </div>
            )}

          </div>
        </CardContent>
      </Card>

      {/* Status dos registros */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Registros de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full shadow-sm ${
                  registrosHoje.entrada ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <div>
                  <p className="font-medium text-sm">Entrada</p>
                  <p className="text-lg font-bold">
                    {registrosHoje.entrada || '--:--'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full shadow-sm ${
                  registrosHoje.saida_almoco ? 'bg-yellow-500' : 'bg-gray-300'
                }`} />
                <div>
                  <p className="font-medium text-sm">Saída Almoço</p>
                  <p className="text-lg font-bold">
                    {registrosHoje.saida_almoco || '--:--'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full shadow-sm ${
                  registrosHoje.volta_almoco ? 'bg-yellow-500' : 'bg-gray-300'
                }`} />
                <div>
                  <p className="font-medium text-sm">Volta Almoço</p>
                  <p className="text-lg font-bold">
                    {registrosHoje.volta_almoco || '--:--'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full shadow-sm ${
                  registrosHoje.saida ? 'bg-red-500' : 'bg-gray-300'
                }`} />
                <div>
                  <p className="font-medium text-sm">Saída</p>
                  <p className="text-lg font-bold">
                    {registrosHoje.saida || '--:--'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full shadow-sm ${
                  registrosHoje.trabalho_corrido ? 'bg-emerald-500' : 'bg-gray-300'
                }`} />
                <div>
                  <p className="font-medium text-sm">Dia Corrido</p>
                  <p className="text-lg font-bold">
                    {registrosHoje.trabalho_corrido ? 'Sim' : 'Não'}
                  </p>
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
                <p className="text-sm">Seus registros serão sincronizados quando a conexão for restabelecida.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug - Disparo manual da notificação de almoço */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-sm">Debug de almoço</p>
              <p className="text-xs text-muted-foreground">
                Dispara agora notificação no app e WhatsApp para teste
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={dispararNotificacaoAlmocoDebug}
              disabled={isDisparandoDebugAlmoco}
            >
              {isDisparandoDebugAlmoco ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Disparando...
                </>
              ) : (
                'Disparar agora'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug - Disparo manual da notificação para responsável assinar */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-sm">Debug de assinatura do responsável</p>
              <p className="text-xs text-muted-foreground">
                Dispara agora WhatsApp + push para responsável da obra assinar o ponto
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={dispararNotificacaoResponsavelDebug}
              disabled={isDisparandoDebugResponsavel}
            >
              {isDisparandoDebugResponsavel ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Disparando...
                </>
              ) : (
                'Disparar agora'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug - Localização da obra x localização atual do usuário */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-sm">Debug de localização</p>
              <p className="text-xs text-muted-foreground">
                Mostra obra atual, localização do usuário e distância para validação de ponto
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={obterLocalizacao}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar local'
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-md border bg-white p-3 space-y-1">
              <p className="font-semibold text-slate-700">Obra atual</p>
              {obra ? (
                <>
                  <p><span className="text-muted-foreground">Nome:</span> {obra.nome}</p>
                  <p><span className="text-muted-foreground">Endereço:</span> {obra.endereco || 'N/A'}</p>
                  <p><span className="text-muted-foreground">Cidade/UF:</span> {[obra.cidade, obra.estado].filter(Boolean).join('/') || 'N/A'}</p>
                  {obra.coordenadas ? (
                    <>
                      <p><span className="text-muted-foreground">Latitude:</span> {obra.coordenadas.lat}</p>
                      <p><span className="text-muted-foreground">Longitude:</span> {obra.coordenadas.lng}</p>
                    </>
                  ) : (
                    <p className="text-amber-700">Obra carregada, mas sem latitude/longitude configuradas.</p>
                  )}
                  {obra.geocoding_status && (
                    <p className="text-muted-foreground">{obra.geocoding_status}</p>
                  )}
                  <p><span className="text-muted-foreground">Raio configurado:</span> {raioPermitidoFormatado} ({raioPermitidoAtual}m)</p>
                </>
              ) : (
                <p className="text-amber-700">Nenhuma obra ativa carregada.</p>
              )}
            </div>

            <div className="rounded-md border bg-white p-3 space-y-1">
              <p className="font-semibold text-slate-700">Usuário (GPS atual)</p>
              {location ? (
                <>
                  <p><span className="text-muted-foreground">Latitude:</span> {location.lat}</p>
                  <p><span className="text-muted-foreground">Longitude:</span> {location.lng}</p>
                </>
              ) : (
                <p className="text-amber-700">Localização ainda não capturada.</p>
              )}

              {locationError && (
                <p className="text-red-600">{locationError}</p>
              )}
            </div>
          </div>

          <div className="rounded-md border bg-white p-3 text-xs space-y-1">
            <p className="font-semibold text-slate-700">Resultado da validação</p>
            {validacaoLocalizacao ? (
              <>
                <p>
                  <span className="text-muted-foreground">Distância:</span> {formatarDistancia(validacaoLocalizacao.distancia)}
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <span className={validacaoLocalizacao.valido ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                    {validacaoLocalizacao.valido
                      ? `Dentro do raio (${raioPermitidoFormatado})`
                      : `Fora do raio (${raioPermitidoFormatado})`}
                  </span>
                </p>
                <p className="text-muted-foreground">{validacaoLocalizacao.mensagem}</p>
              </>
            ) : (
              <p className="text-muted-foreground">Clique em "Atualizar local" para executar a validação.</p>
            )}
          </div>
        </CardContent>
      </Card>

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
                  setTipoRegistroConfirmacao(null)
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
                setTipoRegistroConfirmacao(null)
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

      {/* Diálogo de Assinatura para Hora Extra */}
      <Dialog open={showAssinaturaDialog} onOpenChange={setShowAssinaturaDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5" />
              Assinatura de Hora Extra
            </DialogTitle>
            <DialogDescription>
              Você registrou <strong className="text-orange-600">{horasExtras.toFixed(1)} hora(s) extra(s)</strong>.
              <br />
              Para confirmar, assine digitalmente abaixo. Este registro será enviado para aprovação do encarregador.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Detalhes do Registro */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Funcionário</p>
                    <p className="font-medium">{user?.nome}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Data</p>
                    <p className="font-medium">{new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Entrada</p>
                    <p className="font-medium">{registrosHoje.entrada || '--:--'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Saída</p>
                    <p className="font-medium">{currentTime ? currentTime.toTimeString().slice(0, 5) : '--:--'}</p>
                  </div>
                  <div className="col-span-2 bg-orange-100 p-2 rounded">
                    <p className="text-gray-600">Horas Extras</p>
                    <p className="font-bold text-orange-700 text-lg">{horasExtras.toFixed(1)} horas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Canvas de Assinatura */}
            <SignaturePad
              title="Assine Aqui"
              description="Use seu dedo ou mouse para assinar"
              onSave={handleAssinaturaConfirmada}
              onCancel={() => {
                setShowAssinaturaDialog(false)
                setTipoRegistroPendente(null)
                setHorasExtras(0)
                setIsLoading(false)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

    </div>
    </ProtectedRoute>
  )
}
