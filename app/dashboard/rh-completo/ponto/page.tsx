"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Clock, 
  Search, 
  Filter, 
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Download,
  RefreshCw,
  MapPin,
  Building2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { apiRegistrosPonto, apiFuncionarios, utilsPonto } from "@/lib/api-ponto-eletronico"

interface PontoRegistro {
  id: string
  funcionario: {
    id: number
    nome: string
    avatar?: string
  }
  data: string
  entrada: string
  saida: string
  entradaAlmoco?: string
  saidaAlmoco?: string
  horasTrabalhadas: number
  horasExtras: number
  obra?: {
    id: number
    nome: string
  }
  status: 'normal' | 'atraso' | 'falta' | 'hora-extra'
  observacoes?: string
}

interface FuncionarioPonto {
  id: number
  nome: string
  cargo: string
  totalHoras: number
  horasExtras: number
  faltas: number
  atrasos: number
  ultimoPonto: string
}

export default function PontoEletronicoPage() {
  const [registros, setRegistros] = useState<PontoRegistro[]>([])
  const [funcionarios, setFuncionarios] = useState<FuncionarioPonto[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroFuncionario, setFiltroFuncionario] = useState("")
  const [filtroData, setFiltroData] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("all")
  const { toast } = useToast()

  // Carregar registros de ponto
  useEffect(() => {
    carregarDados()
  }, [filtroFuncionario, filtroData, filtroStatus])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const hoje = new Date()
      const filtros: any = {
        data_inicio: filtroData || format(hoje, 'yyyy-MM-dd'),
        data_fim: filtroData || format(hoje, 'yyyy-MM-dd'),
      }

      if (filtroFuncionario) {
        filtros.funcionario_id = parseInt(filtroFuncionario)
      }

      if (filtroStatus !== 'all') {
        filtros.status = filtroStatus
      }

      // ✨ ADICIONAR recalcular: true para corrigir horas zeradas automaticamente
      const { data: registrosData, recalculated } = await apiRegistrosPonto.listar({
        ...filtros,
        recalcular: true,
        // 🆕 NOVOS FILTROS DISPONÍVEIS:
        // search: 'termo de busca', // Busca textual em nome, data, status, observações
        // order_by: 'horas_extras', // Ordenar por: data, funcionario, horas_trabalhadas, horas_extras, status, created_at
        // order_direction: 'desc', // Direção: asc ou desc
        // obra_id: 123, // Filtrar por obra
        // cargo: 'Operador', // Filtrar por cargo
        // turno: 'Manhã', // Filtrar por turno
        // horas_extras_min: 2, // Mínimo de horas extras
        // horas_extras_max: 8, // Máximo de horas extras
      })

      // Mostrar notificação se houve recalculação
      if (recalculated) {
        toast({
          title: "Dados Atualizados",
          description: "Alguns registros foram recalculados automaticamente",
          duration: 3000
        })
      }
      
      // Transformar dados da API para o formato esperado pelo componente
      const registrosFormatados = registrosData.map((reg: any) => ({
        id: reg.id,
        funcionario: {
          id: reg.funcionario_id,
          nome: reg.funcionario?.nome || 'Desconhecido'
        },
        data: reg.data,
        entrada: reg.entrada || '',
        saida: reg.saida || '',
        entradaAlmoco: reg.volta_almoco || '',
        saidaAlmoco: reg.saida_almoco || '',
        horasTrabalhadas: reg.horas_trabalhadas || 0,
        horasExtras: reg.horas_extras || 0,
        status: mapearStatus(reg.status),
        observacoes: reg.observacoes
      }))

      setRegistros(registrosFormatados)

      // Carregar resumo dos funcionários (simplificado)
      const funcionariosUnicos = Array.from(new Set(registrosFormatados.map((r: any) => r.funcionario.id)))
      const funcionariosResumo = await Promise.all(
        funcionariosUnicos.map(async (id: any) => {
          const regs = registrosFormatados.filter((r: any) => r.funcionario.id === id)
          return {
            id,
            nome: regs[0].funcionario.nome,
            cargo: 'Funcionário',
            totalHoras: regs.reduce((sum: number, r: any) => sum + r.horasTrabalhadas, 0),
            horasExtras: regs.reduce((sum: number, r: any) => sum + r.horasExtras, 0),
            faltas: regs.filter((r: any) => r.status === 'falta').length,
            atrasos: regs.filter((r: any) => r.status === 'atraso').length,
            ultimoPonto: regs[0].data
          }
        })
      )

      setFuncionarios(funcionariosResumo)
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar registros de ponto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const mapearStatus = (status: string): 'normal' | 'atraso' | 'falta' | 'hora-extra' => {
    const statusMap: Record<string, 'normal' | 'atraso' | 'falta' | 'hora-extra'> = {
      'Completo': 'normal',
      'Atraso': 'atraso',
      'Falta': 'falta',
      'Aprovado': 'hora-extra',
      'Pendente Aprovação': 'hora-extra',
    }
    return statusMap[status] || 'normal'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800'
      case 'atraso': return 'bg-yellow-100 text-yellow-800'
      case 'falta': return 'bg-red-100 text-red-800'
      case 'hora-extra': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="w-4 h-4" />
      case 'atraso': return <AlertCircle className="w-4 h-4" />
      case 'falta': return <AlertCircle className="w-4 h-4" />
      case 'hora-extra': return <TrendingUp className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const registrarPonto = async (funcionarioId: number, tipo: 'entrada' | 'saida') => {
    setLoading(true)
    try {
      // TODO: Implementar endpoint POST /api/funcionarios/:id/ponto quando disponível
      // await api.post(`/funcionarios/${funcionarioId}/ponto`, { tipo })
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: `Endpoint de registro de ponto ainda não implementado no backend.`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar ponto",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const exportarPontos = () => {
    toast({
      title: "Exportar",
      description: "Iniciando exportação dos pontos...",
    })
  }

  const filteredRegistros = registros.filter(registro => {
    const matchesFuncionario = !filtroFuncionario || registro.funcionario.nome.toLowerCase().includes(filtroFuncionario.toLowerCase())
    const matchesData = !filtroData || registro.data.includes(filtroData)
    const matchesStatus = filtroStatus === "all" || registro.status === filtroStatus
    return matchesFuncionario && matchesData && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ponto Eletrônico</h1>
          <p className="text-gray-600">Controle de frequência e horas trabalhadas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportarPontos}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => registrarPonto(1, 'entrada')} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Registrar Ponto
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Registros</p>
                <p className="text-2xl font-bold text-gray-900">{registros.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horas Trabalhadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {registros.reduce((acc, r) => acc + r.horasTrabalhadas, 0)}h
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horas Extras</p>
                <p className="text-2xl font-bold text-gray-900">
                  {registros.reduce((acc, r) => acc + r.horasExtras, 0)}h
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-500">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Atrasos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {registros.filter(r => r.status === 'atraso').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-500">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="funcionario">Funcionário</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="funcionario"
                  placeholder="Nome do funcionário..."
                  value={filtroFuncionario}
                  onChange={(e) => setFiltroFuncionario(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="atraso">Atraso</SelectItem>
                  <SelectItem value="falta">Falta</SelectItem>
                  <SelectItem value="hora-extra">Hora Extra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFiltroFuncionario("")
                  setFiltroData("")
                  setFiltroStatus("all")
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Ponto */}
      <Tabs defaultValue="registros" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="registros">Registros</TabsTrigger>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="registros" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registros de Ponto</CardTitle>
              <CardDescription>Histórico de registros de entrada e saída</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Almoço</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistros.map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={`/api/avatar/${registro.funcionario.id}`} />
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                              {getInitials(registro.funcionario.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{registro.funcionario.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(registro.data), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{registro.entrada}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{registro.saida}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {registro.entradaAlmoco && registro.saidaAlmoco 
                            ? `${registro.entradaAlmoco} - ${registro.saidaAlmoco}`
                            : '-'
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{registro.horasTrabalhadas}h</div>
                          {registro.horasExtras > 0 && (
                            <div className="text-orange-600">+{registro.horasExtras}h extra</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Building2 className="w-3 h-3" />
                          <span>{registro.obra?.nome || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(registro.status)} border`}>
                          {getStatusIcon(registro.status)}
                          <span className="ml-1">{registro.status}</span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funcionarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo por Funcionário</CardTitle>
              <CardDescription>Estatísticas de frequência por funcionário</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Total Horas</TableHead>
                    <TableHead>Horas Extras</TableHead>
                    <TableHead>Faltas</TableHead>
                    <TableHead>Atrasos</TableHead>
                    <TableHead>Último Ponto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funcionarios.map((funcionario) => (
                    <TableRow key={funcionario.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={`/api/avatar/${funcionario.id}`} />
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                              {getInitials(funcionario.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{funcionario.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{funcionario.cargo}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{funcionario.totalHoras}h</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-orange-600">{funcionario.horasExtras}h</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-red-600">{funcionario.faltas}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-yellow-600">{funcionario.atrasos}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(funcionario.ultimoPonto), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Horas por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Gráfico de horas por mês será implementado em breve</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Frequência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Funcionários com 100% de frequência</span>
                    <span className="font-semibold text-green-600">15</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Funcionários com atrasos</span>
                    <span className="font-semibold text-yellow-600">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Funcionários com faltas</span>
                    <span className="font-semibold text-red-600">2</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}