"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Forklift,
  Eye,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { gruasApi, Grua } from "@/lib/api-gruas"
import { clientesApi } from "@/lib/api-clientes"

export default function PWAClienteGruasPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [gruas, setGruas] = useState<Grua[]>([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [clienteId, setClienteId] = useState<number | null>(null)

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

  useEffect(() => {
    if (isOnline) {
      carregarDados()
    }
  }, [isOnline])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Buscar dados do usuário
      const userDataStr = localStorage.getItem('user_data')
      if (!userDataStr) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        })
        router.push('/pwa/login')
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
        return
      }

      // Buscar cliente pelo usuario_id
      const clienteResponse = await clientesApi.buscarPorUsuarioId(userId)
      if (!clienteResponse.success || !clienteResponse.data) {
        toast({
          title: "Erro",
          description: "Cliente não encontrado para este usuário",
          variant: "destructive"
        })
        return
      }

      const cliente = clienteResponse.data
      setClienteId(cliente.id)

      // Buscar gruas do cliente
      const gruasResponse = await gruasApi.listarGruasCliente(cliente.id)
      if (gruasResponse.success) {
        setGruas(gruasResponse.data || [])
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar gruas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Carregando gruas...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Minhas Gruas</h1>
              <p className="text-gray-600">Gruas alocadas nas suas obras</p>
            </div>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={carregarDados}
                disabled={!isOnline}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Lista de Gruas */}
          {gruas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Forklift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">Nenhuma grua encontrada</p>
                <p className="text-sm text-gray-500 mt-2">
                  Não há gruas alocadas nas suas obras no momento
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gruas.map((grua) => (
                <Card key={grua.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Forklift className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{grua.name}</CardTitle>
                          {grua.modelo && (
                            <CardDescription>{grua.modelo}</CardDescription>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant={grua.status === 'em_obra' ? 'default' : 'secondary'}
                      >
                        {grua.status === 'em_obra' ? 'Em Obra' : grua.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {grua.fabricante && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fabricante:</span>
                          <span className="font-medium">{grua.fabricante}</span>
                        </div>
                      )}
                      {grua.capacidade && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capacidade:</span>
                          <span className="font-medium">{grua.capacidade}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push(`/pwa/cliente/gruas/${grua.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
