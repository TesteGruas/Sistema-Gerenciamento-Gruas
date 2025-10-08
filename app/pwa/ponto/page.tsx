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
      const token = localStorage.getItem('access_token')
      if (!token) return

      const hoje = new Date().toISOString().split('T')[0]
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ponto-eletronico/registros?funcionario_id=${user.id}&data_inicio=${hoje}&data_fim=${hoje}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          const registro = data.data[0]
          setRegistrosHoje({
            entrada: registro.entrada,
            saida_almoco: registro.saida_almoco,
            volta_almoco: registro.volta_almoco,
            saida: registro.saida
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error)
    }
  }

  const registrarPonto = async (tipo: string) => {
    setIsLoading(true)
    
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast({
          title: "Erro de autenticação",
          description: "Faça login novamente",
          variant: "destructive"
        })
        return
      }

      const agora = new Date()
      const horaAtual = agora.toTimeString().slice(0, 5)
      const hoje = agora.toISOString().split('T')[0]
      
      // Preparar dados para envio
      const dadosRegistro = {
        funcionario_id: user.id,
        data: hoje,
        [tipo.toLowerCase().replace(' ', '_')]: horaAtual,
        localizacao: location ? `${location.lat}, ${location.lng}` : null
      }

      // Verificar se já existe registro para hoje
      const responseExistente = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ponto-eletronico/registros?funcionario_id=${user.id}&data_inicio=${hoje}&data_fim=${hoje}`,
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
                justificativa_alteracao: `Registro ${tipo} via PWA`
              })
            }
          )
        } else {
          // Criar novo registro
          response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ponto-eletronico/registros`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(dadosRegistro)
            }
          )
        }
      } else {
        // Criar novo registro
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ponto-eletronico/registros`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosRegistro)
          }
        )
      }

      if (response.ok) {
        // Atualizar registros localmente
        setRegistrosHoje(prev => ({
          ...prev,
          [tipo.toLowerCase().replace(' ', '_')]: horaAtual
        }))

        toast({
          title: "Ponto registrado!",
          description: `${tipo} registrada às ${horaAtual}`,
          variant: "default"
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao registrar ponto')
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
