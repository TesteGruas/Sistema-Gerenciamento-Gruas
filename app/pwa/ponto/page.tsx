"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  Play, 
  Square, 
  Coffee, 
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

export default function PWAPontoPage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [registrosHoje, setRegistrosHoje] = useState({
    entrada: null as string | null,
    saida_almoco: null as string | null,
    volta_almoco: null as string | null,
    saida: null as string | null
  })
  const [isLoading, setIsLoading] = useState(false)
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
              
              // Validar proximidade com a obra
              const validacao = validarProximidadeObra(coordenadas, obraSelecionada)
              setValidacaoLocalizacao(validacao)
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
      toast({
        title: "Sincronização completa",
        description: `${fila.length} registros sincronizados com sucesso`,
        variant: "default"
      })
      
      // Recarregar dados atualizados
      carregarRegistrosHoje()
    } else {
      toast({
        title: "Sincronização parcial",
        description: `${fila.length - filaComErros.length} de ${fila.length} registros sincronizados`,
        variant: "default"
      })
    }
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

      // Validar proximidade com a obra
      if (obra) {
        const validacao = validarProximidadeObra(coordenadas, obra)
        setValidacaoLocalizacao(validacao)

        if (validacao.valido) {
          toast({
            title: "✅ Localização validada!",
            description: validacao.mensagem,
            variant: "default"
          })
        } else {
          toast({
            title: "⚠️ Fora da área permitida",
            description: validacao.mensagem,
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "Localização obtida!",
          description: "Sua localização foi capturada com sucesso",
          variant: "default"
        })
      }
    } catch (error: any) {
      console.error('Erro ao obter localização:', error)
      setLocationError(error.message)
      toast({
        title: "Erro na localização",
        description: error.message || "Não foi possível obter sua localização",
        variant: "destructive"
      })
    } finally {
      setIsGettingLocation(false)
    }
  }

  // Carregar registros do dia
  const carregarRegistrosHoje = async () => {
    try {
      // Carregar do cache primeiro se offline
      if (!isOnline) {
        const cachedRegistros = localStorage.getItem('cached_registros_ponto_hoje')
        
        if (cachedRegistros) {
          const registros = JSON.parse(cachedRegistros)
          setRegistrosHoje(registros)
          toast({
            title: "Modo Offline",
            description: "Exibindo registros em cache.",
            variant: "default"
          })
        }
        
        return
      }

      const hoje = new Date().toISOString().split('T')[0]
      const token = localStorage.getItem('access_token')
      if (!token) return
      
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
          saida: registro.saida || null
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
          saida: null
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
        toast({
          title: "Erro ao carregar registros",
          description: "Exibindo registros em cache.",
          variant: "destructive"
        })
      }
    }
  }

  const registrarPonto = async (tipo: string) => {
    // Mostrar modal de confirmação primeiro
    setTipoRegistroConfirmacao(tipo)
    setShowConfirmacaoDialog(true)
  }

  const confirmarRegistroPonto = async () => {
    if (!tipoRegistroConfirmacao) return
    
    setShowConfirmacaoDialog(false)
    setIsLoading(true)
    const tipo = tipoRegistroConfirmacao
    
    // Obter localização atual antes de registrar (se ainda não tiver)
    if (!location) {
      try {
        const coordenadas = await obterLocalizacaoAtual({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
        setLocation(coordenadas)
        
        // Validar proximidade com a obra se disponível
        if (obra) {
          const validacao = validarProximidadeObra(coordenadas, obra)
          setValidacaoLocalizacao(validacao)
          
          // Se estiver fora do range, mostrar aviso mas não bloquear ainda (o backend vai bloquear)
          if (!validacao.valido) {
            toast({
              title: "⚠️ Atenção",
              description: `Você está a ${Math.round(validacao.distancia)}m da obra. O limite é ${obra.raio_permitido || 4000}m. O registro será bloqueado se você estiver fora do range.`,
              variant: "default",
              duration: 5000
            })
          }
        }
      } catch (error: any) {
        console.warn('Não foi possível obter localização:', error)
        // Continuar mesmo sem localização (não bloqueia)
      }
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
      const hoje = agora.toISOString().split('T')[0]
      
      // Calcular horas extras se for saída
      if (tipo === 'saida' && registrosHoje.entrada) {
        const entradaParts = registrosHoje.entrada.split(':')
        const saidaParts = horaAtual.split(':')
        
        const entradaMinutos = parseInt(entradaParts[0]) * 60 + parseInt(entradaParts[1])
        const saidaMinutos = parseInt(saidaParts[0]) * 60 + parseInt(saidaParts[1])
        
        // Considerar intervalo de almoço (1h)
        const totalMinutos = saidaMinutos - entradaMinutos - 60
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
      
      // Validar localização ANTES de enviar (se tiver validação disponível)
      if (validacaoLocalizacao && !validacaoLocalizacao.valido) {
        toast({
          title: "⚠️ Fora da área permitida",
          description: `${validacaoLocalizacao.mensagem}. Você precisa estar dentro de ${obra?.raio_permitido || 4000}m (${(obra?.raio_permitido || 4000) / 1000}km) para registrar o ponto.`,
          variant: "destructive",
          duration: 8000
        })
        setIsLoading(false)
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
        
        toast({
          title: "Ponto registrado offline",
          description: `${tipo} será sincronizada quando você estiver online`,
          variant: "default"
        })
        
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
        // Tratar erro específico de geolocalização
        if (apiError.response?.status === 403 && apiError.response?.data?.error === 'FORA_DO_PERIMETRO') {
          const errorData = apiError.response.data
          const tipoAlvo = errorData.tipo === 'grua' ? 'da grua' : 'da obra'
          const nomeAlvo = errorData.alvo || errorData.obra || 'localização'
          
          toast({
            title: "⚠️ Fora da área permitida",
            description: errorData.message || `Você está a ${errorData.distancia}m ${tipoAlvo} (${nomeAlvo}). O limite é ${errorData.raio_permitido}m (${errorData.raio_permitido / 1000}km). Aproxime-se para registrar o ponto.`,
            variant: "destructive",
            duration: 8000
          })
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

      toast({
        title: "Ponto registrado!",
        description: `${tipo} registrada às ${horaAtual}`,
        variant: "default"
      })
      
    } catch (error: any) {
      console.error('Erro ao registrar ponto:', error)
      toast({
        title: "Erro ao registrar ponto",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive"
      })
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

      const agora = new Date()
      const horaAtual = agora.toTimeString().slice(0, 5)
      const hoje = agora.toISOString().split('T')[0]
      
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
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ponto-eletronico/registros?funcionario_id=${funcionarioId}&data_inicio=${hoje}&data_fim=${hoje}`,
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
          // Atualizar registro existente
          const registroId = dataExistente.data[0].id
          response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ponto-eletronico/registros/${registroId}`,
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

      if (response && response.ok) {
        // Atualizar registros localmente
        setRegistrosHoje(prev => ({
          ...prev,
          [tipo.toLowerCase().replace(' ', '_')]: horaAtual
        }))

        toast({
          title: "✅ Ponto registrado com hora extra!",
          description: `${tipo} às ${horaAtual} - ${horasExtras.toFixed(1)}h extras (aguardando aprovação)`,
          variant: "default"
        })
        
        // Resetar estados
        setHorasExtras(0)
        setTipoRegistroPendente(null)
        setAssinaturaDataUrl(null)
      }
    } catch (error: any) {
      console.error('Erro ao registrar ponto:', error)
      toast({
        title: "Erro ao registrar ponto",
        description: error.message || "Tente novamente em alguns instantes",
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
    
    if (registrosHoje.entrada && !registrosHoje.saida_almoco && !registrosHoje.saida) {
      return {
        tipo: 'saida_almoco',
        label: 'Saída Almoço',
        descricao: 'Iniciar intervalo de almoço',
        icone: Coffee,
        cor: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
        corTexto: 'text-yellow-700'
      }
    }
    
    if (registrosHoje.saida_almoco && !registrosHoje.volta_almoco && !registrosHoje.saida) {
      return {
        tipo: 'volta_almoco',
        label: 'Volta Almoço',
        descricao: 'Retornar do intervalo de almoço',
        icone: Coffee,
        cor: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
        corTexto: 'text-yellow-700'
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
