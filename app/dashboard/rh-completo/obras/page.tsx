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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  Building2, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Download,
  RefreshCw,
  Users,
  DollarSign
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getFuncionariosObras, type FuncionarioObra } from "@/lib/api-funcionarios-obras"

interface ObraFuncionario {
  id: string
  funcionario: {
    id: number
    nome: string
    cargo: string
    avatar?: string
  }
  obra: {
    id: number
    nome: string
    endereco: string
    cliente: string
    status: 'ativa' | 'pausada' | 'concluida'
  }
  dataInicio: string
  dataFim?: string
  horasTrabalhadas: number
  valorHora: number
  totalReceber: number
  status: 'ativo' | 'finalizado' | 'transferido'
  observacoes?: string
}

interface Obra {
  id: number
  nome: string
  endereco: string
  cliente: string
  status: 'ativa' | 'pausada' | 'concluida'
  funcionarios: number
  dataInicio: string
  dataFim?: string
  valorTotal: number
}

export default function ObrasRHPage() {
  const [alocacoes, setAlocacoes] = useState<ObraFuncionario[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroFuncionario, setFiltroFuncionario] = useState("")
  const [filtroObra, setFiltroObra] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("all")
  const [isAlocacaoDialogOpen, setIsAlocacaoDialogOpen] = useState(false)
  const { toast } = useToast()

  // Carregar alocações
  useEffect(() => {
    carregarDados()
  }, [])
  const carregarDados = async () => {
    setLoading(true)
    try {
      const { data } = await getFuncionariosObras({ limit: 100 })
      
      // Transformar dados para o formato esperado pelo componente
      const alocacoesFormatadas = (data || []).map((alocacao: FuncionarioObra) => ({
        id: alocacao.id.toString(),
        funcionario: {
          id: alocacao.funcionario_id,
          nome: alocacao.funcionarios?.nome || 'Desconhecido',
          cargo: alocacao.funcionarios?.cargo || 'N/A'
        },
        obra: {
          id: alocacao.obra_id,
          nome: alocacao.obras?.nome || 'Desconhecido',
          endereco: alocacao.obras?.endereco || '',
          cliente: 'Cliente',
          status: alocacao.obras?.status === 'ativa' ? 'ativa' as const : 'pausada' as const
        },
        dataInicio: alocacao.data_inicio,
        dataFim: alocacao.data_fim,
        horasTrabalhadas: alocacao.horas_trabalhadas,
        valorHora: alocacao.valor_hora || 0,
        totalReceber: alocacao.total_receber || 0,
        status: alocacao.status as 'ativo' | 'finalizado' | 'transferido',
        observacoes: alocacao.observacoes
      }))
      
      setAlocacoes(alocacoesFormatadas)

      // Extrair obras únicas
      const obrasUnicas = Array.from(
        new Map(alocacoesFormatadas.map(a => [a.obra.id, a.obra])).values()
      ).map(obra => ({
        id: obra.id,
        nome: obra.nome,
        endereco: obra.endereco,
        cliente: obra.cliente,
        status: obra.status,
        funcionarios: alocacoesFormatadas.filter(a => a.obra.id === obra.id).length,
        dataInicio: alocacoesFormatadas.filter(a => a.obra.id === obra.id)[0]?.dataInicio || '',
        dataFim: undefined,
        valorTotal: 0
      }))
      
      setObras(obrasUnicas)
      
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar alocações",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800'
      case 'finalizado': return 'bg-blue-100 text-blue-800'
      case 'transferido': return 'bg-yellow-100 text-yellow-800'
      case 'ativa': return 'bg-green-100 text-green-800'
      case 'pausada': return 'bg-yellow-100 text-yellow-800'
      case 'concluida': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo': return <CheckCircle className="w-4 h-4" />
      case 'finalizado': return <AlertCircle className="w-4 h-4" />
      case 'transferido': return <TrendingUp className="w-4 h-4" />
      case 'ativa': return <CheckCircle className="w-4 h-4" />
      case 'pausada': return <Clock className="w-4 h-4" />
      case 'concluida': return <CheckCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const alocarFuncionario = async () => {
    setLoading(true)
    try {
      // Simular alocação
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Funcionário Alocado",
        description: "Funcionário alocado na obra com sucesso!",
      })
      setIsAlocacaoDialogOpen(false)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alocar funcionário",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const transferirFuncionario = async (alocacaoId: string) => {
    setLoading(true)
    try {
      // Simular transferência
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Funcionário Transferido",
        description: "Funcionário transferido com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao transferir funcionário",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const finalizarAlocacao = async (alocacaoId: string) => {
    setLoading(true)
    try {
      // Simular finalização
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Alocação Finalizada",
        description: "Alocação finalizada com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao finalizar alocação",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const exportarObras = () => {
    toast({
      title: "Exportar",
      description: "Iniciando exportação das obras...",
    })
  }

  const filteredAlocacoes = alocacoes.filter(alocacao => {
    const matchesFuncionario = !filtroFuncionario || alocacao.funcionario.nome.toLowerCase().includes(filtroFuncionario.toLowerCase())
    const matchesObra = !filtroObra || alocacao.obra.nome.toLowerCase().includes(filtroObra.toLowerCase())
    const matchesStatus = filtroStatus === "all" || alocacao.status === filtroStatus
    return matchesFuncionario && matchesObra && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Obras e Alocações</h1>
          <p className="text-gray-600">Gestão de funcionários em obras</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportarObras}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={isAlocacaoDialogOpen} onOpenChange={setIsAlocacaoDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Alocação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alocar Funcionário em Obra</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="funcionario">Funcionário</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Carlos Eduardo Menezes</SelectItem>
                      <SelectItem value="2">João Marcos Ferreira da Silva</SelectItem>
                      <SelectItem value="3">Ana Paula</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="obra">Obra</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a obra" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Residencial Atlântica</SelectItem>
                      <SelectItem value="2">Shopping Center</SelectItem>
                      <SelectItem value="3">Condomínio Residencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="data-inicio">Data de Início</Label>
                  <Input id="data-inicio" type="date" />
                </div>
                <div>
                  <Label htmlFor="valor-hora">Valor por Hora (R$)</Label>
                  <Input id="valor-hora" type="number" placeholder="0.00" />
                </div>
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea id="observacoes" placeholder="Observações sobre a alocação" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAlocacaoDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={alocarFuncionario} disabled={loading}>
                    {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Alocar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Alocações</p>
                <p className="text-2xl font-bold text-gray-900">{alocacoes.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Obras Ativas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {obras.filter(o => o.status === 'ativa').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Funcionários Ativos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {alocacoes.filter(a => a.status === 'ativo').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-500">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {alocacoes.reduce((acc, a) => acc + a.totalReceber, 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <DollarSign className="w-6 h-6 text-white" />
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
              <Label htmlFor="obra">Obra</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="obra"
                  placeholder="Nome da obra..."
                  value={filtroObra}
                  onChange={(e) => setFiltroObra(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="transferido">Transferido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFiltroFuncionario("")
                  setFiltroObra("")
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

      {/* Tabs de Obras */}
      <Tabs defaultValue="alocacoes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alocacoes">Alocações</TabsTrigger>
          <TabsTrigger value="obras">Obras</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="alocacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alocações de Funcionários</CardTitle>
              <CardDescription>Funcionários alocados em obras</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Valor/Hora</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlocacoes.map((alocacao) => (
                    <TableRow key={alocacao.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={`/api/avatar/${alocacao.funcionario.id}`} />
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                              {getInitials(alocacao.funcionario.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{alocacao.funcionario.nome}</div>
                            <div className="text-sm text-gray-500">{alocacao.funcionario.cargo}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alocacao.obra.nome}</div>
                          <div className="text-sm text-gray-500">{alocacao.obra.cliente}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {alocacao.obra.endereco}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Início: {format(new Date(alocacao.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}</div>
                          {alocacao.dataFim && (
                            <div>Fim: {format(new Date(alocacao.dataFim), 'dd/MM/yyyy', { locale: ptBR })}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{alocacao.horasTrabalhadas}h</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">R$ {(alocacao.valorHora || 0).toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-green-600">
                          R$ {alocacao.totalReceber.toLocaleString('pt-BR')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(alocacao.status)} border`}>
                          {getStatusIcon(alocacao.status)}
                          <span className="ml-1">{alocacao.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {alocacao.status === 'ativo' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => transferirFuncionario(alocacao.id)}
                              >
                                <TrendingUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => finalizarAlocacao(alocacao.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
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

        <TabsContent value="obras" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Obras Disponíveis</CardTitle>
              <CardDescription>Lista de obras e funcionários alocados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Obra</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Funcionários</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {obras.map((obra) => (
                    <TableRow key={obra.id}>
                      <TableCell>
                        <div className="font-medium">{obra.nome}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{obra.cliente}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {obra.endereco}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{obra.funcionarios}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(obra.status)} border`}>
                          {getStatusIcon(obra.status)}
                          <span className="ml-1">{obra.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          R$ {obra.valorTotal.toLocaleString('pt-BR')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Users className="w-4 h-4" />
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

        <TabsContent value="relatorios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Resumo por Obra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {obras.map((obra) => (
                    <div key={obra.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{obra.nome}</span>
                      <span className="font-semibold">{obra.funcionarios} funcionários</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Valores por Funcionário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alocacoes.slice(0, 5).map((alocacao) => (
                    <div key={alocacao.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{alocacao.funcionario.nome}</span>
                      <span className="font-semibold text-green-600">
                        R$ {alocacao.totalReceber.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
