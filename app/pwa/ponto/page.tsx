"use client"

import { useState, useEffect } from "react"
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
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as pontoApi from "@/lib/api-ponto-eletronico"

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

  // Carregar dados do usuário
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      }
    }
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
  const obterLocalizacao = async () => {
    setIsGettingLocation(true)
    setLocationError(null)
    
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocalização não é suportada por este navegador')
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        })
      })

      const { latitude, longitude } = position.coords
      setLocation({ lat: latitude, lng: longitude })

      // Tentar obter endereço (opcional)
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY&language=pt&pretty=1`
        )
        if (response.ok) {
          const data = await response.json()
          if (data.results && data.results.length > 0) {
            setLocation(prev => ({
              ...prev!,
              address: data.results[0].formatted
            }))
          }
        }
      } catch (error) {
        console.log('Erro ao obter endereço:', error)
      }

      toast({
        title: "Localização obtida!",
        description: "Sua localização foi capturada com sucesso",
        variant: "default"
      })
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
      const data = await pontoApi.getRegistros({
        funcionario_id: user.id,
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
    setIsLoading(true)
    
    try {
      const agora = new Date()
      const horaAtual = agora.toTimeString().slice(0, 5)
      const hoje = agora.toISOString().split('T')[0]
      
      // Preparar dados para envio
      const campoTipo = tipo.toLowerCase().replace(' ', '_')
      const dadosRegistro: any = {
        funcionario_id: user.id,
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
            const registroHoje = registrosCache.find((r: any) => r.data === hoje && r.funcionario_id === user.id)
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
        funcionario_id: user.id,
        data_inicio: hoje,
        data_fim: hoje
      })

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

  const podeEntrada = !registrosHoje.entrada
  const podeSaida = registrosHoje.entrada && !registrosHoje.saida
  const podeSaidaAlmoco = registrosHoje.entrada && !registrosHoje.saida_almoco && !registrosHoje.saida
  const podeVoltaAlmoco = registrosHoje.saida_almoco && !registrosHoje.volta_almoco && !registrosHoje.saida

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ponto Eletrônico</h1>
          <p className="text-gray-600">Registre sua entrada e saída</p>
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

      {/* Relógio e data */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-5xl font-mono font-bold text-blue-600 mb-2">
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

      {/* Status dos registros */}
      <Card>
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
                <div className={`w-3 h-3 rounded-full ${
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
                <div className={`w-3 h-3 rounded-full ${
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
                <div className={`w-3 h-3 rounded-full ${
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
                <div className={`w-3 h-3 rounded-full ${
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

      {/* Botões de registro */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar Ponto</CardTitle>
          <CardDescription>
            Clique no botão correspondente ao seu registro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => registrarPonto("entrada")}
              disabled={!podeEntrada || isLoading}
              className={`h-16 flex flex-col gap-1 ${
                podeEntrada 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              <Play className="w-5 h-5" />
              <span className="text-sm">Entrada</span>
            </Button>

            <Button
              onClick={() => registrarPonto("saida")}
              disabled={!podeSaida || isLoading}
              className={`h-16 flex flex-col gap-1 ${
                podeSaida 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              <Square className="w-5 h-5" />
              <span className="text-sm">Saída</span>
            </Button>

            <Button
              onClick={() => registrarPonto("saida_almoco")}
              disabled={!podeSaidaAlmoco || isLoading}
              variant="outline"
              className={`h-16 flex flex-col gap-1 ${
                !podeSaidaAlmoco ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Coffee className="w-5 h-5" />
              <span className="text-sm">Saída Almoço</span>
            </Button>

            <Button
              onClick={() => registrarPonto("volta_almoco")}
              disabled={!podeVoltaAlmoco || isLoading}
              variant="outline"
              className={`h-16 flex flex-col gap-1 ${
                !podeVoltaAlmoco ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Coffee className="w-5 h-5" />
              <span className="text-sm">Volta Almoço</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Localização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Localização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {location ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Localização capturada</span>
                </div>
                <div className="text-xs text-gray-600">
                  <p>Lat: {location.lat.toFixed(6)}</p>
                  <p>Lng: {location.lng.toFixed(6)}</p>
                  {location.address && <p>Endereço: {location.address}</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Localização não capturada</span>
                </div>
                <Button
                  onClick={obterLocalizacao}
                  disabled={isGettingLocation}
                  size="sm"
                  variant="outline"
                >
                  {isGettingLocation ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4 mr-2" />
                  )}
                  {isGettingLocation ? 'Obtendo...' : 'Capturar Localização'}
                </Button>
              </div>
            )}
            {locationError && (
              <div className="text-xs text-red-600">
                <p>Erro: {locationError}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações do funcionário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{user?.nome || 'Carregando...'}</p>
                <p className="text-sm text-gray-500">{user?.cargo || user?.role || 'Carregando...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>Localização: {location ? 'Capturada' : 'Não capturada'}</span>
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
    </div>
  )
}
