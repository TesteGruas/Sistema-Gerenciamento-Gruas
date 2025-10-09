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
  History, 
  Search, 
  Filter, 
  Calendar,
  User,
  Building2,
  Clock,
  DollarSign,
  Award,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  BarChart3
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { rhApi, HistoricoRH } from "@/lib/api-rh-completo"

interface HistoricoEvento extends HistoricoRH {
  funcionario?: {
    id: number
    nome: string
  }
}

export default function HistoricoRHPage() {
  const [eventos, setEventos] = useState<HistoricoEvento[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState("all")
  const [filtroFuncionario, setFiltroFuncionario] = useState("")
  const [filtroData, setFiltroData] = useState("")
  const { toast } = useToast()

  // Formulário de novo evento
  const [eventoForm, setEventoForm] = useState({
    funcionario_id: '',
    tipo_evento: 'promocao' as 'admissao' | 'demissao' | 'promocao' | 'transferencia' | 'ferias' | 'ajuste_salarial' | 'outros',
    titulo: '',
    descricao: '',
    data_evento: '',
    valor: '',
    observacoes: ''
  })

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [filtroTipo, filtroData])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar funcionários
      const funcionariosResponse = await rhApi.listarFuncionariosCompletos({ limit: 100 })
      setFuncionarios(funcionariosResponse.data || [])
      
      // Carregar histórico
      const params: any = {}
      if (filtroTipo && filtroTipo !== 'all') {
        params.tipo_evento = filtroTipo
      }
      if (filtroData) {
        params.data_inicio = filtroData
        params.data_fim = filtroData
      }
      
      const historicoResponse = await rhApi.listarHistoricoRH(params)
      setEventos(historicoResponse.data || [])
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico RH",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getFuncionarioNome = (funcionario_id: number) => {
    const funcionario = funcionarios.find(f => f.id === funcionario_id)
    return funcionario?.nome || 'Funcionário não encontrado'
  }

  const handleCriarEvento = async () => {
    try {
      if (!eventoForm.funcionario_id || !eventoForm.tipo_evento || !eventoForm.titulo || !eventoForm.data_evento) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        })
        return
      }

      setLoading(true)
      
      const eventoData = {
        funcionario_id: parseInt(eventoForm.funcionario_id),
        tipo_evento: eventoForm.tipo_evento,
        titulo: eventoForm.titulo,
        descricao: eventoForm.descricao,
        data_evento: eventoForm.data_evento,
        valor: eventoForm.valor ? parseFloat(eventoForm.valor) : undefined,
        observacoes: eventoForm.observacoes
      }

      const response = await rhApi.criarHistoricoRH(eventoData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Evento registrado com sucesso!",
        })
        resetEventoForm()
        await carregarDados()
      }
    } catch (error: any) {
      console.error('Erro ao criar evento:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar evento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetEventoForm = () => {
    setEventoForm({
      funcionario_id: '',
      tipo_evento: 'promocao',
      titulo: '',
      descricao: '',
      data_evento: '',
      valor: '',
      observacoes: ''
    })
  }

  const tiposEvento = [
    { value: "all", label: "Todos os Eventos" },
    { value: "admissao", label: "Admissões" },
    { value: "promocao", label: "Promoções" },
    { value: "transferencia", label: "Transferências" },
    { value: "obra", label: "Alocações em Obras" },
    { value: "salario", label: "Ajustes Salariais" },
    { value: "ferias", label: "Férias" },
    { value: "demissao", label: "Demissões" }
  ]

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'admissao': return <User className="w-4 h-4" />
      case 'promocao': return <Award className="w-4 h-4" />
      case 'transferencia': return <Building2 className="w-4 h-4" />
      case 'obra': return <Building2 className="w-4 h-4" />
      case 'salario': return <DollarSign className="w-4 h-4" />
      case 'ferias': return <Calendar className="w-4 h-4" />
      case 'demissao': return <AlertCircle className="w-4 h-4" />
      default: return <History className="w-4 h-4" />
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'admissao': return 'bg-green-100 text-green-800 border-green-200'
      case 'promocao': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'transferencia': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'obra': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'salario': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ferias': return 'bg-cyan-100 text-cyan-800 border-cyan-200'
      case 'demissao': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800'
      case 'inativo': return 'bg-gray-100 text-gray-800'
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const filteredEventos = eventos.filter(evento => {
    const funcionarioNome = getFuncionarioNome(evento.funcionario_id)
    const matchesTipo = filtroTipo === "all" || evento.tipo_evento === filtroTipo
    const matchesFuncionario = !filtroFuncionario || funcionarioNome.toLowerCase().includes(filtroFuncionario.toLowerCase())
    const matchesData = !filtroData || evento.data_evento.includes(filtroData)
    return matchesTipo && matchesFuncionario && matchesData
  })

  const exportarHistorico = () => {
    toast({
      title: "Exportar",
      description: "Iniciando exportação do histórico...",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Histórico RH</h1>
          <p className="text-gray-600">Histórico completo de eventos e mudanças</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportarHistorico}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Eventos</p>
                <p className="text-2xl font-bold text-gray-900">{eventos.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <History className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admissões</p>
                <p className="text-2xl font-bold text-gray-900">
                  {eventos.filter(e => e.tipo === 'admissao').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promoções</p>
                <p className="text-2xl font-bold text-gray-900">
                  {eventos.filter(e => e.tipo === 'promocao').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alocações</p>
                <p className="text-2xl font-bold text-gray-900">
                  {eventos.filter(e => e.tipo === 'obra').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-500">
                <Building2 className="w-6 h-6 text-white" />
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
              <Label htmlFor="tipo">Tipo de Evento</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposEvento.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFiltroTipo("all")
                  setFiltroFuncionario("")
                  setFiltroData("")
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Histórico */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tabela">Tabela</TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline de Eventos</CardTitle>
              <CardDescription>Histórico cronológico de eventos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {filteredEventos.map((evento, index) => (
                  <div key={evento.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full ${getTipoColor(evento.tipo)}`}>
                        {getTipoIcon(evento.tipo)}
                      </div>
                      {index < filteredEventos.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={`/api/avatar/${evento.funcionario.id}`} />
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                              {getInitials(evento.funcionario.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{evento.titulo}</h3>
                            <p className="text-sm text-gray-600">{evento.descricao}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {format(new Date(evento.data), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          <Badge className={`${getStatusColor(evento.status)} mt-1`}>
                            {evento.status}
                          </Badge>
                        </div>
                      </div>
                      {evento.obra && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                          <Building2 className="w-4 h-4" />
                          <span>Obra: {evento.obra.nome}</span>
                        </div>
                      )}
                      {evento.valor && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>Valor: R$ {evento.valor.toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tabela" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico em Tabela</CardTitle>
              <CardDescription>Lista detalhada de todos os eventos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEventos.map((evento) => (
                    <TableRow key={evento.id}>
                      <TableCell>
                        <Badge className={`${getTipoColor(evento.tipo)} border`}>
                          {getTipoIcon(evento.tipo)}
                          <span className="ml-1">{evento.titulo}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={`/api/avatar/${evento.funcionario.id}`} />
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                              {getInitials(evento.funcionario.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{evento.funcionario.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{evento.descricao}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(evento.data), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(evento.status)}>
                          {evento.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{evento.obra?.nome || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {evento.valor ? `R$ ${evento.valor.toLocaleString('pt-BR')}` : '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estatisticas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Eventos por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Gráfico de eventos por mês será implementado em breve</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Resumo de Atividades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Admissões este mês</span>
                    <span className="font-semibold">{eventos.filter(e => e.tipo === 'admissao').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Promoções este mês</span>
                    <span className="font-semibold">{eventos.filter(e => e.tipo === 'promocao').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Alocações em obras</span>
                    <span className="font-semibold">{eventos.filter(e => e.tipo === 'obra').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ajustes salariais</span>
                    <span className="font-semibold">{eventos.filter(e => e.tipo === 'salario').length}</span>
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
