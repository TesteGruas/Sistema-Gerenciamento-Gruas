"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Users, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Calendar,
  User,
  Filter,
  Download,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as pontoApi from "@/lib/api-ponto-eletronico"

interface Funcionario {
  id: string | number
  nome: string
  cargo: string
  obra_atual?: string
  status: string
}

interface RegistroPonto {
  id: string | number
  funcionario_id: string | number
  funcionario?: Funcionario
  data: string
  entrada?: string
  saida?: string
  horas_trabalhadas?: number
  horas_extras?: number
  status: string
  observacoes?: string
  aprovado_por?: string
  data_aprovacao?: string
}

export default function GerenciarFuncionariosPage() {
  const [user, setUser] = useState<any>(null)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [registrosPendentes, setRegistrosPendentes] = useState<RegistroPonto[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null)
  const [showEspelho, setShowEspelho] = useState(false)
  const [espelhoRegistros, setEspelhoRegistros] = useState<RegistroPonto[]>([])
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const { toast } = useToast()

  // Carregar dados do usuário
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const userData = localStorage.getItem('user_data')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    }
  }, [])

  // Carregar funcionários
  const carregarFuncionarios = async () => {
    setLoading(true)
    try {
      // Simular busca de funcionários (em produção, usar API real)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'}/api/funcionarios`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setFuncionarios(data.data || data)
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar funcionários",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar registros pendentes
  const carregarRegistrosPendentes = async () => {
    try {
      const response = await pontoApi.getRegistros({
        status: 'Pendente Aprovação',
        aprovador_id: user?.id
      })
      setRegistrosPendentes(response)
    } catch (error) {
      console.error('Erro ao carregar registros pendentes:', error)
    }
  }

  // Carregar espelho de ponto do funcionário
  const carregarEspelhoFuncionario = async (funcionarioId: string | number) => {
    setLoading(true)
    try {
      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
      
      const dataInicioFormatada = dataInicio || inicioMes.toISOString().split('T')[0]
      const dataFimFormatada = dataFim || fimMes.toISOString().split('T')[0]

      const response = await pontoApi.getRegistros({
        funcionario_id: funcionarioId,
        data_inicio: dataInicioFormatada,
        data_fim: dataFimFormatada
      })
      
      setEspelhoRegistros(response)
    } catch (error) {
      console.error('Erro ao carregar espelho:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar espelho de ponto",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Aprovar horas extras
  const aprovarHorasExtras = async (registroId: string | number, observacoes: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'}/api/ponto-eletronico/registros/${registroId}/aprovar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          observacoes_aprovacao: observacoes
        })
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Horas extras aprovadas com sucesso",
          variant: "default"
        })
        carregarRegistrosPendentes()
      } else {
        throw new Error('Erro ao aprovar horas extras')
      }
    } catch (error) {
      console.error('Erro ao aprovar horas extras:', error)
      toast({
        title: "Erro",
        description: "Erro ao aprovar horas extras",
        variant: "destructive"
      })
    }
  }

  // Rejeitar horas extras
  const rejeitarHorasExtras = async (registroId: string | number, motivo: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'}/api/ponto-eletronico/registros/${registroId}/rejeitar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          motivo_rejeicao: motivo
        })
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Horas extras rejeitadas",
          variant: "default"
        })
        carregarRegistrosPendentes()
      } else {
        throw new Error('Erro ao rejeitar horas extras')
      }
    } catch (error) {
      console.error('Erro ao rejeitar horas extras:', error)
      toast({
        title: "Erro",
        description: "Erro ao rejeitar horas extras",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    if (user) {
      carregarFuncionarios()
      carregarRegistrosPendentes()
    }
  }, [user])

  const funcionariosFiltrados = funcionarios.filter(funcionario =>
    funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    funcionario.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
      case 'Pendente Aprovação':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case 'Rejeitado':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Gerenciar Funcionários</h1>
              <p className="text-blue-100">Visualizar espelhos e aprovar horas extras</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                carregarFuncionarios()
                carregarRegistrosPendentes()
              }}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Busca de Funcionários */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Funcionários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar funcionário por nome ou cargo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid gap-3">
                  {funcionariosFiltrados.map((funcionario) => (
                    <div
                      key={funcionario.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{funcionario.nome}</p>
                          <p className="text-sm text-gray-500">{funcionario.cargo}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFuncionario(funcionario)
                          setShowEspelho(true)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Espelho
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registros Pendentes de Aprovação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Horas Extras Pendentes ({registrosPendentes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {registrosPendentes.map((registro) => (
                  <div key={registro.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">{registro.funcionario?.nome || 'Funcionário'}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(registro.data).toLocaleDateString('pt-BR')} - {registro.horas_extras?.toFixed(1)}h extras
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(registro.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const observacoes = prompt('Observações da aprovação:')
                          if (observacoes) {
                            aprovarHorasExtras(registro.id, observacoes)
                          }
                        }}
                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const motivo = prompt('Motivo da rejeição:')
                          if (motivo) {
                            rejeitarHorasExtras(registro.id, motivo)
                          }
                        }}
                        className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
                
                {registrosPendentes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma hora extra pendente de aprovação</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal Espelho de Ponto */}
        {showEspelho && selectedFuncionario && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    Espelho de Ponto - {selectedFuncionario.nome}
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => setShowEspelho(false)}
                  >
                    Fechar
                  </Button>
                </div>

                {/* Filtros de Data */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="dataInicio">Data Início</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataFim">Data Fim</Label>
                    <Input
                      id="dataFim"
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => carregarEspelhoFuncionario(selectedFuncionario.id)}
                  disabled={loading}
                  className="w-full mb-4"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-2" />
                  )}
                  Carregar Espelho
                </Button>

                {/* Lista de Registros */}
                <div className="space-y-3">
                  {espelhoRegistros.map((registro) => (
                    <div key={registro.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {new Date(registro.data).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {registro.entrada || '--:--'} - {registro.saida || '--:--'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{registro.horas_trabalhadas?.toFixed(1) || '0.0'}h</p>
                        <p className="text-sm text-green-600">
                          {registro.horas_extras?.toFixed(1) || '0.0'}h extras
                        </p>
                        {getStatusBadge(registro.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

