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
import { rhApi, HorasMensais } from "@/lib/api-rh-completo"

interface HorasFuncionario extends HorasMensais {
  funcionario?: {
    id: number
    nome: string
    cargo?: string
  }
}

interface ResumoHoras {
  mes: string
  total_funcionarios: number
  total_horas: number
  total_extras: number
  total_faltas: number
  media_frequencia: number
  valor_total: number
}

export default function HorasTrabalhadasPage() {
  const [horasFuncionarios, setHorasFuncionarios] = useState<HorasFuncionario[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [resumos, setResumos] = useState<ResumoHoras[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroFuncionario, setFiltroFuncionario] = useState("")
  const [filtroMes, setFiltroMes] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("all")
  const { toast } = useToast()

  // Formulário de horas
  const [horasForm, setHorasForm] = useState({
    funcionario_id: '',
    mes: '',
    ano: '',
    horas_trabalhadas: '',
    horas_extras: '',
    horas_faltas: '',
    horas_atrasos: '',
    dias_trabalhados: '',
    dias_uteis: ''
  })

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [filtroMes])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar funcionários
      const funcionariosResponse = await rhApi.listarFuncionariosCompletos({ limit: 100 })
      setFuncionarios(funcionariosResponse.data || [])
      
      // Carregar horas mensais
      const params: any = {}
      if (filtroMes) {
        const [ano, mes] = filtroMes.split('-')
        params.ano = parseInt(ano)
        params.mes = parseInt(mes)
      }
      
      const horasResponse = await rhApi.listarHorasMensais(params)
      setHorasFuncionarios(horasResponse.data || [])
      
      // Calcular resumos
      calcularResumos(horasResponse.data || [])
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de horas trabalhadas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calcularResumos = (horas: HorasFuncionario[]) => {
    const resumosPorMes: { [key: string]: ResumoHoras } = {}
    
    horas.forEach(h => {
      const mesAno = `${h.ano}-${String(h.mes).padStart(2, '0')}`
      
      if (!resumosPorMes[mesAno]) {
        resumosPorMes[mesAno] = {
          mes: mesAno,
          total_funcionarios: 0,
          total_horas: 0,
          total_extras: 0,
          total_faltas: 0,
          media_frequencia: 0,
          valor_total: 0
        }
      }
      
      resumosPorMes[mesAno].total_funcionarios++
      resumosPorMes[mesAno].total_horas += h.horas_trabalhadas
      resumosPorMes[mesAno].total_extras += h.horas_extras || 0
      resumosPorMes[mesAno].total_faltas += h.horas_faltas || 0
      resumosPorMes[mesAno].valor_total += h.total_a_receber || 0
    })
    
    // Calcular média de frequência
    Object.keys(resumosPorMes).forEach(mes => {
      const total = resumosPorMes[mes].total_funcionarios
      if (total > 0) {
        const horasComFrequencia = horas.filter(h => `${h.ano}-${String(h.mes).padStart(2, '0')}` === mes)
        const somaFrequencia = horasComFrequencia.reduce((sum, h) => sum + (h.percentual_frequencia || 0), 0)
        resumosPorMes[mes].media_frequencia = somaFrequencia / total
      }
    })
    
    setResumos(Object.values(resumosPorMes))
  }

  const getFuncionarioNome = (funcionario_id: number) => {
    const funcionario = funcionarios.find(f => f.id === funcionario_id)
    return funcionario?.nome || 'Funcionário não encontrado'
  }

  const getFuncionarioCargo = (funcionario_id: number) => {
    const funcionario = funcionarios.find(f => f.id === funcionario_id)
    return funcionario?.cargo || 'N/A'
  }

  const handleCalcularHoras = async (horaId: number) => {
    try {
      setLoading(true)
      const response = await rhApi.calcularHorasMensais(horaId)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Horas calculadas com sucesso!",
        })
        await carregarDados()
      }
    } catch (error: any) {
      console.error('Erro ao calcular horas:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao calcular horas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCriarHoras = async () => {
    try {
      if (!horasForm.funcionario_id || !horasForm.mes || !horasForm.ano) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        })
        return
      }

      setLoading(true)
      
      const horasData = {
        funcionario_id: parseInt(horasForm.funcionario_id),
        mes: parseInt(horasForm.mes),
        ano: parseInt(horasForm.ano),
        horas_trabalhadas: parseFloat(horasForm.horas_trabalhadas),
        horas_extras: parseFloat(horasForm.horas_extras) || 0,
        horas_faltas: parseFloat(horasForm.horas_faltas) || 0,
        horas_atrasos: parseFloat(horasForm.horas_atrasos) || 0,
        dias_trabalhados: parseInt(horasForm.dias_trabalhados),
        dias_uteis: parseInt(horasForm.dias_uteis)
      }

      const response = await rhApi.criarHorasMensais(horasData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Horas registradas com sucesso!",
        })
        resetHorasForm()
        await carregarDados()
      }
    } catch (error: any) {
      console.error('Erro ao criar horas:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar horas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetHorasForm = () => {
    setHorasForm({
      funcionario_id: '',
      mes: '',
      ano: '',
      horas_trabalhadas: '',
      horas_extras: '',
      horas_faltas: '',
      horas_atrasos: '',
      dias_trabalhados: '',
      dias_uteis: ''
    })
  }

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
      // TODO: Implementar endpoint POST /api/funcionarios/:id/horas/calcular quando disponível
      // await api.post(`/funcionarios/${funcionarioId}/horas/calcular`)
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Endpoint de cálculo de horas ainda não implementado no backend.",
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
      // TODO: Implementar endpoint POST /api/funcionarios/:id/pagamento/processar quando disponível
      // await api.post(`/funcionarios/${funcionarioId}/pagamento/processar`)
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Endpoint de processamento de pagamento ainda não implementado no backend.",
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
    const funcionarioNome = getFuncionarioNome(horas.funcionario_id)
    const horaMesAno = `${horas.ano}-${String(horas.mes).padStart(2, '0')}`
    const matchesFuncionario = !filtroFuncionario || funcionarioNome.toLowerCase().includes(filtroFuncionario.toLowerCase())
    const matchesMes = !filtroMes || horaMesAno === filtroMes || horaMesAno.includes(filtroMes)
    return matchesFuncionario && matchesMes
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
                  {(horasFuncionarios.reduce((acc, h) => acc + (h.percentualFrequencia || 0), 0) / horasFuncionarios.length).toFixed(1)}%
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
                          {(horas.percentualFrequencia || 0).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">R$ {horas.totalReceber.toLocaleString('pt-BR')}</div>
                          <div className="text-gray-500">R$ {(horas.valorHora || 0).toFixed(2)}/h</div>
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
                          {(resumo.mediaFrequencia || 0).toFixed(1)}%
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
