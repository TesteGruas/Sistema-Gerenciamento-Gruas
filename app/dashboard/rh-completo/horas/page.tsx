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
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Calculator
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface HorasFuncionario {
  id: string
  funcionario: {
    id: number
    nome: string
    cargo: string
    avatar?: string
  }
  mes: string
  horasTrabalhadas: number
  horasExtras: number
  horasFaltas: number
  horasAtrasos: number
  diasTrabalhados: number
  diasUteis: number
  percentualFrequencia: number
  valorHora: number
  totalReceber: number
  status: 'calculado' | 'pago' | 'pendente'
}

interface ResumoHoras {
  mes: string
  totalFuncionarios: number
  totalHoras: number
  totalExtras: number
  totalFaltas: number
  mediaFrequencia: number
  valorTotal: number
}

export default function HorasTrabalhadasPage() {
  const [horasFuncionarios, setHorasFuncionarios] = useState<HorasFuncionario[]>([])
  const [resumos, setResumos] = useState<ResumoHoras[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroFuncionario, setFiltroFuncionario] = useState("")
  const [filtroMes, setFiltroMes] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("all")
  const { toast } = useToast()

  // Dados mockados para demonstração
  useEffect(() => {
    setHorasFuncionarios([
      {
        id: "1",
        funcionario: {
          id: 1,
          nome: "Carlos Eduardo Menezes",
          cargo: "Supervisor"
        },
        mes: "2024-11",
        horasTrabalhadas: 176,
        horasExtras: 8,
        horasFaltas: 0,
        horasAtrasos: 2,
        diasTrabalhados: 22,
        diasUteis: 22,
        percentualFrequencia: 100,
        valorHora: 25.00,
        totalReceber: 4600.00,
        status: "pago"
      },
      {
        id: "2",
        funcionario: {
          id: 2,
          nome: "João Marcos Ferreira da Silva",
          cargo: "Sinaleiro"
        },
        mes: "2024-11",
        horasTrabalhadas: 160,
        horasExtras: 4,
        horasFaltas: 16,
        horasAtrasos: 8,
        diasTrabalhados: 20,
        diasUteis: 22,
        percentualFrequencia: 90.9,
        valorHora: 18.00,
        totalReceber: 2952.00,
        status: "pago"
      },
      {
        id: "3",
        funcionario: {
          id: 3,
          nome: "Ana Paula",
          cargo: "Supervisor"
        },
        mes: "2024-11",
        horasTrabalhadas: 176,
        horasExtras: 12,
        horasFaltas: 0,
        horasAtrasos: 1,
        diasTrabalhados: 22,
        diasUteis: 22,
        percentualFrequencia: 100,
        valorHora: 28.00,
        totalReceber: 5264.00,
        status: "calculado"
      }
    ])

    setResumos([
      {
        mes: "2024-11",
        totalFuncionarios: 25,
        totalHoras: 4200,
        totalExtras: 180,
        totalFaltas: 120,
        mediaFrequencia: 95.2,
        valorTotal: 125000
      },
      {
        mes: "2024-10",
        totalFuncionarios: 24,
        totalHoras: 4080,
        totalExtras: 160,
        totalFaltas: 80,
        mediaFrequencia: 96.8,
        valorTotal: 118000
      }
    ])
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'calculado': return 'bg-blue-100 text-blue-800'
      case 'pago': return 'bg-green-100 text-green-800'
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'calculado': return <Calculator className="w-4 h-4" />
      case 'pago': return <CheckCircle className="w-4 h-4" />
      case 'pendente': return <AlertCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getFrequenciaColor = (percentual: number) => {
    if (percentual >= 95) return 'bg-green-100 text-green-800'
    if (percentual >= 90) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const calcularHoras = async (funcionarioId: number) => {
    setLoading(true)
    try {
      // Simular cálculo de horas
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Horas Calculadas",
        description: "Cálculo de horas realizado com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao calcular horas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const processarPagamento = async (funcionarioId: number) => {
    setLoading(true)
    try {
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Pagamento Processado",
        description: "Pagamento processado com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const exportarHoras = () => {
    toast({
      title: "Exportar",
      description: "Iniciando exportação das horas...",
    })
  }

  const filteredHoras = horasFuncionarios.filter(horas => {
    const matchesFuncionario = !filtroFuncionario || horas.funcionario.nome.toLowerCase().includes(filtroFuncionario.toLowerCase())
    const matchesMes = !filtroMes || horas.mes.includes(filtroMes)
    const matchesStatus = filtroStatus === "all" || horas.status === filtroStatus
    return matchesFuncionario && matchesMes && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Horas Trabalhadas</h1>
          <p className="text-gray-600">Controle e cálculo de horas por funcionário</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportarHoras}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => calcularHoras(1)} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
            Calcular Horas
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Funcionários</p>
                <p className="text-2xl font-bold text-gray-900">{horasFuncionarios.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Horas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {horasFuncionarios.reduce((acc, h) => acc + h.horasTrabalhadas, 0)}h
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <Clock className="w-6 h-6 text-white" />
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
                  {horasFuncionarios.reduce((acc, h) => acc + h.horasExtras, 0)}h
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-500">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Média Frequência</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(horasFuncionarios.reduce((acc, h) => acc + h.percentualFrequencia, 0) / horasFuncionarios.length).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <BarChart3 className="w-6 h-6 text-white" />
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
              <Label htmlFor="mes">Mês</Label>
              <Input
                id="mes"
                type="month"
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
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
                  <SelectItem value="calculado">Calculado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFiltroFuncionario("")
                  setFiltroMes("")
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

      {/* Tabs de Horas */}
      <Tabs defaultValue="funcionarios" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="funcionarios">Por Funcionário</TabsTrigger>
          <TabsTrigger value="resumos">Resumos</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="funcionarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Horas por Funcionário</CardTitle>
              <CardDescription>Detalhamento de horas trabalhadas por funcionário</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Mês</TableHead>
                    <TableHead>Horas Trabalhadas</TableHead>
                    <TableHead>Horas Extras</TableHead>
                    <TableHead>Faltas</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHoras.map((horas) => (
                    <TableRow key={horas.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={`/api/avatar/${horas.funcionario.id}`} />
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                              {getInitials(horas.funcionario.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{horas.funcionario.nome}</div>
                            <div className="text-sm text-gray-500">{horas.funcionario.cargo}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{horas.mes}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{horas.horasTrabalhadas}h</div>
                          <div className="text-gray-500">{horas.diasTrabalhados}/{horas.diasUteis} dias</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-orange-600">{horas.horasExtras}h</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-red-600">{horas.horasFaltas}h</div>
                          <div className="text-gray-500">{horas.horasAtrasos}h atrasos</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getFrequenciaColor(horas.percentualFrequencia)} border`}>
                          {horas.percentualFrequencia.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">R$ {horas.totalReceber.toLocaleString('pt-BR')}</div>
                          <div className="text-gray-500">R$ {horas.valorHora.toFixed(2)}/h</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(horas.status)} border`}>
                          {getStatusIcon(horas.status)}
                          <span className="ml-1">{horas.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {horas.status === 'calculado' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => processarPagamento(horas.funcionario.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => calcularHoras(horas.funcionario.id)}
                          >
                            <Calculator className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumos Mensais</CardTitle>
              <CardDescription>Resumo consolidado de horas por mês</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead>Funcionários</TableHead>
                    <TableHead>Total Horas</TableHead>
                    <TableHead>Horas Extras</TableHead>
                    <TableHead>Horas Faltas</TableHead>
                    <TableHead>Média Frequência</TableHead>
                    <TableHead>Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumos.map((resumo) => (
                    <TableRow key={resumo.mes}>
                      <TableCell>
                        <span className="font-medium">{resumo.mes}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{resumo.totalFuncionarios}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{resumo.totalHoras}h</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-orange-600">{resumo.totalExtras}h</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-red-600">{resumo.totalFaltas}h</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getFrequenciaColor(resumo.mediaFrequencia)} border`}>
                          {resumo.mediaFrequencia.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">R$ {resumo.valorTotal.toLocaleString('pt-BR')}</span>
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
                  <BarChart3 className="w-5 h-5" />
                  Horas por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Gráfico de horas por mês será implementado em breve</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Distribuição de Frequência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Funcionários com 100% de frequência</span>
                    <span className="font-semibold text-green-600">
                      {horasFuncionarios.filter(h => h.percentualFrequencia === 100).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Funcionários com 95-99% de frequência</span>
                    <span className="font-semibold text-yellow-600">
                      {horasFuncionarios.filter(h => h.percentualFrequencia >= 95 && h.percentualFrequencia < 100).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Funcionários com menos de 95% de frequência</span>
                    <span className="font-semibold text-red-600">
                      {horasFuncionarios.filter(h => h.percentualFrequencia < 95).length}
                    </span>
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
