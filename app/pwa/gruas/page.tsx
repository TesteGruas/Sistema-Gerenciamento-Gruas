"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  Clock, 
  Wrench, 
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Truck,
  Building2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { gruasApi, Grua } from "@/lib/api-gruas"

export default function PWAGruasPage() {
  const [gruas, setGruas] = useState<Grua[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

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

  // Carregar gruas do funcionário
  useEffect(() => {
    if (user?.id || isOnline) {
      carregarGruas()
    }
  }, [user, isOnline])

  const carregarGruas = async () => {
    setIsLoading(true)
    try {
      // Carregar do cache primeiro se offline
      if (!isOnline) {
        const cachedGruas = localStorage.getItem('cached_gruas')
        
        if (cachedGruas) {
          setGruas(JSON.parse(cachedGruas))
          toast({
            title: "Modo Offline",
            description: "Exibindo gruas em cache. Conecte-se para atualizar.",
            variant: "default"
          })
        }
        
        return
      }

      let data: Grua[] = []

      // Tentar buscar gruas do funcionário
      if (user?.id) {
        try {
          const response = await gruasApi.listarGruasFuncionario(user.id)
          data = response.data
        } catch (error) {
          console.log('Endpoint de funcionário não disponível, buscando gruas em obra')
        }
      }

      // Se não encontrou, buscar todas as gruas em obra
      if (data.length === 0) {
        const response = await gruasApi.listarGruas({ status: 'em_obra' })
        data = response.data
      }

      setGruas(data)
      
      // Salvar no cache
      localStorage.setItem('cached_gruas', JSON.stringify(data))

    } catch (error: any) {
      console.error('Erro ao carregar gruas:', error)
      
      // Tentar carregar do cache em caso de erro
      const cachedGruas = localStorage.getItem('cached_gruas')
      
      if (cachedGruas) {
        setGruas(JSON.parse(cachedGruas))
        toast({
          title: "Erro ao carregar gruas",
          description: "Exibindo gruas em cache. Verifique sua conexão.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Erro ao carregar gruas",
          description: error.message || "Não foi possível carregar as gruas. Verifique sua conexão.",
          variant: "destructive"
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'disponivel': { className: 'bg-green-100 text-green-800', text: 'Disponível', icon: CheckCircle },
      'em_obra': { className: 'bg-blue-100 text-blue-800', text: 'Em Obra', icon: Truck },
      'manutencao': { className: 'bg-yellow-100 text-yellow-800', text: 'Manutenção', icon: Wrench },
      'inativa': { className: 'bg-gray-100 text-gray-800', text: 'Inativa', icon: AlertCircle }
    }
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.inativa
  }

  const formatarData = (data: string | undefined) => {
    if (!data) return 'Não informado'
    try {
      const dataObj = new Date(data)
      if (isNaN(dataObj.getTime())) return 'Não informado'
      return dataObj.toLocaleDateString('pt-BR')
    } catch {
      return 'Não informado'
    }
  }

  return (
    <ProtectedRoute permission="gruas:visualizar">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Gruas</h1>
          <p className="text-gray-600">Gruas sob sua responsabilidade</p>
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
          <Button
            variant="outline"
            size="sm"
            onClick={carregarGruas}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Informações do funcionário */}
      {user && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{user.nome}</p>
                <p className="text-sm text-gray-500">{user.cargo || user.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de gruas */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando gruas...</p>
          </div>
        </div>
      ) : gruas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma grua encontrada</h3>
            <p className="text-gray-600">Você não está associado a nenhuma grua no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {gruas.map((grua) => {
            const statusConfig = getStatusBadge(grua.status)
            const StatusIcon = statusConfig.icon

            return (
              <Card key={grua.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{grua.name || `Grua ${grua.id}`}</CardTitle>
                      <CardDescription className="text-sm">
                        {grua.modelo || 'Modelo não informado'} • {grua.capacidade || 'Capacidade não informada'}
                      </CardDescription>
                    </div>
                    <Badge className={statusConfig.className}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.text}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Obra/Localização */}
                  {grua.current_obra_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Obra:</span>
                      <span>{grua.current_obra_name}</span>
                    </div>
                  )}
                  
                  {grua.localizacao && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Localização:</span>
                      <span>{grua.localizacao}</span>
                    </div>
                  )}

                  {/* Horas de operação */}
                  {grua.horas_operacao !== undefined && grua.horas_operacao !== null && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Horas de operação:</span>
                      <span>{grua.horas_operacao}h</span>
                    </div>
                  )}

                  {/* Manutenções */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Última manutenção</p>
                      <p className="text-sm font-medium text-gray-700">
                        {formatarData(grua.ultima_manutencao)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Próxima manutenção</p>
                      <p className="text-sm font-medium text-gray-700">
                        {formatarData(grua.proxima_manutencao)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Status de conexão */}
      {!isOnline && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <WifiOff className="w-5 h-5" />
              <div>
                <p className="font-medium">Modo Offline</p>
                <p className="text-sm">Os dados das gruas serão sincronizados quando a conexão for restabelecida.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </ProtectedRoute>
  )
}
