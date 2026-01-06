"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  MapPin, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Truck,
  Users,
  ArrowRight
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { obrasApi, Obra } from "@/lib/api-obras"
import { clientesApi } from "@/lib/api-clientes"

export default function PWAObrasPage() {
  const router = useRouter()
  const [obras, setObras] = useState<Obra[]>([])
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

  // Carregar obras
  useEffect(() => {
    if (user?.id || isOnline) {
      carregarObras()
    }
  }, [user, isOnline])

  const carregarObras = async () => {
    setIsLoading(true)
    try {
      // Carregar do cache primeiro se offline
      if (!isOnline) {
        const cachedObras = localStorage.getItem('cached_obras')
        
        if (cachedObras) {
          setObras(JSON.parse(cachedObras))
        }
        
        return
      }

      // Verificar se é cliente (não funcionário)
      const userDataStr = localStorage.getItem('user_data')
      if (!userDataStr) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }

      const userData = JSON.parse(userDataStr)
      const userId = userData?.user?.id || userData?.id

      if (!userId) {
        toast({
          title: "Erro",
          description: "ID do usuário não encontrado",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }

      // Buscar cliente pelo usuario_id
      const clienteResponse = await clientesApi.buscarPorUsuarioId(userId)
      
      if (!clienteResponse.success || !clienteResponse.data) {
        // Se não for cliente, pode ser funcionário - buscar obras do funcionário
        // Por enquanto, retornar vazio se não for cliente
        setObras([])
        setIsLoading(false)
        return
      }

      const cliente = clienteResponse.data

      // Buscar apenas obras do cliente logado
      const response = await obrasApi.listarObras({ 
        cliente_id: cliente.id,
        limit: 100,
        status: 'Em Andamento' // Filtrar apenas obras em andamento
      })
      
      if (response.success) {
        // Filtrar apenas obras do cliente (garantia extra)
        const obrasDoCliente = response.data.filter(obra => obra.cliente_id === cliente.id)
        setObras(obrasDoCliente)
        // Salvar no cache
        localStorage.setItem('cached_obras', JSON.stringify(obrasDoCliente))
      }

    } catch (error: any) {
      console.error('Erro ao carregar obras:', error)
      
      // Tentar carregar do cache em caso de erro
      const cachedObras = localStorage.getItem('cached_obras')
      
      if (cachedObras) {
        setObras(JSON.parse(cachedObras))
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as obras",
          variant: "destructive"
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Planejamento': { className: 'bg-gray-100 text-gray-800', text: 'Planejamento', icon: Clock },
      'Em Andamento': { className: 'bg-blue-100 text-blue-800', text: 'Em Andamento', icon: CheckCircle },
      'Pausada': { className: 'bg-yellow-100 text-yellow-800', text: 'Pausada', icon: AlertCircle },
      'Concluída': { className: 'bg-green-100 text-green-800', text: 'Concluída', icon: CheckCircle },
      'Cancelada': { className: 'bg-red-100 text-red-800', text: 'Cancelada', icon: AlertCircle }
    }
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.Planejamento
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
    <ProtectedRoute permission="obras:visualizar">
      <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Obras</h1>
          <p className="text-gray-600">Obras sob sua responsabilidade</p>
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
            onClick={carregarObras}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Lista de obras */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando obras...</p>
          </div>
        </div>
      ) : obras.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma obra encontrada</h3>
            <p className="text-gray-600">Você não está associado a nenhuma obra no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {obras.map((obra) => {
            const statusConfig = getStatusBadge(obra.status)
            const StatusIcon = statusConfig.icon
            const gruasCount = obra.grua_obra?.length || 0

            return (
              <Card key={obra.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{obra.nome}</CardTitle>
                      <CardDescription className="text-sm">
                        {obra.tipo} • {obra.cidade}, {obra.estado}
                      </CardDescription>
                    </div>
                    <Badge className={statusConfig.className}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.text}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Cliente */}
                  {obra.clientes && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Cliente:</span>
                      <span>{obra.clientes.nome}</span>
                    </div>
                  )}
                  
                  {/* Endereço */}
                  {obra.endereco && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Endereço:</span>
                      <span>{obra.endereco}</span>
                    </div>
                  )}

                  {/* Gruas */}
                  {gruasCount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Truck className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Gruas:</span>
                      <span>{gruasCount} {gruasCount === 1 ? 'grua' : 'gruas'}</span>
                    </div>
                  )}

                  {/* Datas */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Data de início</p>
                      <p className="text-sm font-medium text-gray-700">
                        {formatarData(obra.data_inicio)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Data de fim</p>
                      <p className="text-sm font-medium text-gray-700">
                        {formatarData(obra.data_fim)}
                      </p>
                    </div>
                  </div>

                  {/* Botão para acessar detalhes da obra */}
                  <div className="pt-3 border-t border-gray-100">
                    <Button
                      onClick={() => router.push(`/pwa/obras/${obra.id}`)}
                      className="w-full"
                      variant="outline"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Ver Detalhes da Obra
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
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
                <p className="text-sm">Os dados das obras serão sincronizados quando a conexão for restabelecida.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </ProtectedRoute>
  )
}

