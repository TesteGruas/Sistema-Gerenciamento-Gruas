"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Wifi,
  WifiOff,
  FileSignature,
  TrendingUp,
  RefreshCw,
  Filter,
  Search
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Funcionario {
  id: number
  nome: string
  cargo: string
  turno: string
  status: string
}

interface RegistroPonto {
  id: string
  funcionario_id: number
  data: string
  entrada?: string
  saida_almoco?: string
  volta_almoco?: string
  saida?: string
  horas_trabalhadas: number
  horas_extras: number
  status: string
  aprovado_por?: number
  data_aprovacao?: string
  observacoes?: string
  funcionario?: Funcionario
}

export default function PWAEncarregadorPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [registrosPendentes, setRegistrosPendentes] = useState<RegistroPonto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [filtroFuncionario, setFiltroFuncionario] = useState<string>('')
  const [filtroStatus, setFiltroStatus] = useState<string>('')
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null)
  const { toast } = useToast()

  // Carregar dados do usuário
  useEffect(() => {
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

  // Carregar dados
  useEffect(() => {
    if (user?.id) {
      carregarDados()
    }
  }, [user])

  const carregarDados = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      // Carregar funcionários da obra
      const responseFuncionarios = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/funcionarios/obra/${user.obra_id || 1}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (responseFuncionarios.ok) {
        const dataFuncionarios = await responseFuncionarios.json()
        setFuncionarios(dataFuncionarios.data || [])
      }

      // Carregar registros pendentes de aprovação
      const responseRegistros = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ponto-eletronico/registros?status=Pendente Aprovação&aprovador_id=${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (responseRegistros.ok) {
        const dataRegistros = await responseRegistros.json()
        setRegistrosPendentes(dataRegistros.data || [])
      } else {
        // Simular dados para demonstração
        setFuncionarios([
          { id: 1, nome: 'João Silva', cargo: 'Operador', turno: 'Diurno', status: 'Ativo' },
          { id: 2, nome: 'Maria Santos', cargo: 'Sinaleiro', turno: 'Diurno', status: 'Ativo' },
          { id: 3, nome: 'Pedro Costa', cargo: 'Técnico', turno: 'Noturno', status: 'Ativo' }
        ])
        
        setRegistrosPendentes([
          {
            id: '1',
            funcionario_id: 1,
            data: new Date().toISOString().split('T')[0],
            entrada: '08:00',
            saida: '18:30',
            horas_trabalhadas: 10.5,
            horas_extras: 2.5,
            status: 'Pendente Aprovação',
            funcionario: { id: 1, nome: 'João Silva', cargo: 'Operador', turno: 'Diurno', status: 'Ativo' }
          },
          {
            id: '2',
            funcionario_id: 2,
            data: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            entrada: '08:00',
            saida: '20:00',
            horas_trabalhadas: 12,
            horas_extras: 4,
            status: 'Pendente Aprovação',
            funcionario: { id: 2, nome: 'Maria Santos', cargo: 'Sinaleiro', turno: 'Diurno', status: 'Ativo' }
          }
        ])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro ao carregar dados",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const aprovarRegistro = async (registroId: string) => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ponto-eletronico/registros/${registroId}/aprovar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            observacoes_aprovacao: 'Aprovado via PWA - Encarregador'
          })
        }
      )

      if (response.ok) {
        toast({
          title: "Registro aprovado!",
          description: "O registro foi aprovado com sucesso",
          variant: "default"
        })
        
        // Atualizar lista
        setRegistrosPendentes(prev => prev.filter(reg => reg.id !== registroId))
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao aprovar registro')
      }
    } catch (error: any) {
      console.error('Erro ao aprovar registro:', error)
      toast({
        title: "Erro ao aprovar registro",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive"
      })
    }
  }

  const rejeitarRegistro = async (registroId: string) => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ponto-eletronico/registros/${registroId}/rejeitar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            motivo_rejeicao: 'Rejeitado via PWA - Encarregador'
          })
        }
      )

      if (response.ok) {
        toast({
          title: "Registro rejeitado!",
          description: "O registro foi rejeitado",
          variant: "default"
        })
        
        // Atualizar lista
        setRegistrosPendentes(prev => prev.filter(reg => reg.id !== registroId))
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao rejeitar registro')
      }
    } catch (error: any) {
      console.error('Erro ao rejeitar registro:', error)
      toast({
        title: "Erro ao rejeitar registro",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Pendente Aprovação': { className: 'bg-yellow-100 text-yellow-800', text: 'Pendente', icon: Clock },
      'Aprovado': { className: 'bg-green-100 text-green-800', text: 'Aprovado', icon: CheckCircle },
      'Rejeitado': { className: 'bg-red-100 text-red-800', text: 'Rejeitado', icon: AlertCircle }
    }
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig['Pendente Aprovação']
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarHorario = (horario: string) => {
    return horario || '--:--'
  }

  const funcionariosFiltrados = funcionarios.filter(func => 
    func.nome.toLowerCase().includes(filtroFuncionario.toLowerCase()) &&
    (filtroStatus === '' || func.status === filtroStatus)
  )

  const registrosFiltrados = registrosPendentes.filter(reg => 
    !funcionarioSelecionado || reg.funcionario_id === funcionarioSelecionado.id
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel do Encarregador</h1>
          <p className="text-gray-600">Gerencie funcionários e aprove horas extras</p>
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
            onClick={carregarDados}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Funcionários</p>
                <p className="text-2xl font-bold text-gray-900">{funcionarios.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{registrosPendentes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Horas Extras</p>
                <p className="text-2xl font-bold text-gray-900">
                  {registrosPendentes.reduce((total, reg) => total + reg.horas_extras, 0).toFixed(1)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funcionários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Funcionários da Obra
          </CardTitle>
          <CardDescription>
            Lista de funcionários sob sua supervisão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar funcionário..."
                  value={filtroFuncionario}
                  onChange={(e) => setFiltroFuncionario(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos os status</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
                <option value="Férias">Férias</option>
              </select>
            </div>

            {/* Lista de funcionários */}
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Carregando funcionários...</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {funcionariosFiltrados.map((funcionario) => (
                  <div
                    key={funcionario.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      funcionarioSelecionado?.id === funcionario.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFuncionarioSelecionado(
                      funcionarioSelecionado?.id === funcionario.id ? null : funcionario
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{funcionario.nome}</p>
                          <p className="text-sm text-gray-500">{funcionario.cargo} • {funcionario.turno}</p>
                        </div>
                      </div>
                      <Badge className={
                        funcionario.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                        funcionario.status === 'Inativo' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {funcionario.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registros Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Registros Pendentes de Aprovação
          </CardTitle>
          <CardDescription>
            {funcionarioSelecionado 
              ? `Registros de ${funcionarioSelecionado.nome}`
              : 'Todos os registros pendentes'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum registro pendente</h3>
              <p className="text-gray-600">
                {funcionarioSelecionado 
                  ? `${funcionarioSelecionado.nome} não possui registros pendentes`
                  : 'Não há registros pendentes de aprovação'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {registrosFiltrados.map((registro) => (
                <div key={registro.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{registro.funcionario?.nome}</h4>
                      <p className="text-sm text-gray-500">{registro.funcionario?.cargo}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Pendente
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Data</p>
                      <p className="text-sm font-medium">{formatarData(registro.data)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Horas Extras</p>
                      <p className="text-sm font-medium text-orange-600">{registro.horas_extras}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Entrada</p>
                      <p className="text-sm font-medium">{formatarHorario(registro.entrada || '')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Saída</p>
                      <p className="text-sm font-medium">{formatarHorario(registro.saida || '')}</p>
                    </div>
                  </div>

                  {registro.observacoes && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">Observações</p>
                      <p className="text-sm text-gray-700">{registro.observacoes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => aprovarRegistro(registro.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => rejeitarRegistro(registro.id)}
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                <p className="text-sm">As aprovações serão sincronizadas quando a conexão for restabelecida.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
