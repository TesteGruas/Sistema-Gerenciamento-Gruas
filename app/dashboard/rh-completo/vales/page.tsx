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
  Gift, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Receipt,
  TrendingUp,
  Download,
  RefreshCw,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ValeFuncionario {
  id: string
  funcionario: {
    id: number
    nome: string
    cargo: string
    avatar?: string
  }
  tipo: 'vale-transporte' | 'vale-refeicao' | 'vale-alimentacao' | 'vale-combustivel' | 'outros'
  descricao: string
  valor: number
  dataSolicitacao: string
  dataAprovacao?: string
  dataPagamento?: string
  status: 'solicitado' | 'aprovado' | 'pago' | 'rejeitado'
  aprovadoPor?: string
  observacoes?: string
}

interface BeneficioFuncionario {
  id: string
  funcionario: {
    id: number
    nome: string
    cargo: string
    avatar?: string
  }
  tipo: 'plano-saude' | 'plano-odonto' | 'seguro-vida' | 'auxilio-creche' | 'outros'
  descricao: string
  valor: number
  dataInicio: string
  dataFim?: string
  status: 'ativo' | 'inativo' | 'suspenso'
  observacoes?: string
}

export default function ValesBeneficiosPage() {
  const [vales, setVales] = useState<ValeFuncionario[]>([])
  const [beneficios, setBeneficios] = useState<BeneficioFuncionario[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroFuncionario, setFiltroFuncionario] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("all")
  const [filtroStatus, setFiltroStatus] = useState("all")
  const [isValeDialogOpen, setIsValeDialogOpen] = useState(false)
  const [isBeneficioDialogOpen, setIsBeneficioDialogOpen] = useState(false)
  const { toast } = useToast()

  // Dados mockados para demonstração
  useEffect(() => {
    setVales([
      {
        id: "1",
        funcionario: {
          id: 1,
          nome: "Carlos Eduardo Menezes",
          cargo: "Supervisor"
        },
        tipo: "vale-transporte",
        descricao: "Vale Transporte - Novembro 2024",
        valor: 200.00,
        dataSolicitacao: "2024-11-01",
        dataAprovacao: "2024-11-02",
        dataPagamento: "2024-11-05",
        status: "pago",
        aprovadoPor: "Ana Silva",
        observacoes: "Aprovado conforme política da empresa"
      },
      {
        id: "2",
        funcionario: {
          id: 2,
          nome: "João Marcos Ferreira da Silva",
          cargo: "Sinaleiro"
        },
        tipo: "vale-refeicao",
        descricao: "Vale Refeição - Novembro 2024",
        valor: 300.00,
        dataSolicitacao: "2024-11-01",
        dataAprovacao: "2024-11-02",
        status: "aprovado",
        aprovadoPor: "Ana Silva"
      },
      {
        id: "3",
        funcionario: {
          id: 3,
          nome: "Ana Paula",
          cargo: "Supervisor"
        },
        tipo: "vale-alimentacao",
        descricao: "Vale Alimentação - Novembro 2024",
        valor: 400.00,
        dataSolicitacao: "2024-11-01",
        status: "solicitado"
      }
    ])

    setBeneficios([
      {
        id: "1",
        funcionario: {
          id: 1,
          nome: "Carlos Eduardo Menezes",
          cargo: "Supervisor"
        },
        tipo: "plano-saude",
        descricao: "Plano de Saúde Unimed",
        valor: 200.00,
        dataInicio: "2024-01-01",
        status: "ativo"
      },
      {
        id: "2",
        funcionario: {
          id: 2,
          nome: "João Marcos Ferreira da Silva",
          cargo: "Sinaleiro"
        },
        tipo: "plano-odonto",
        descricao: "Plano Odontológico Sorriso",
        valor: 50.00,
        dataInicio: "2024-01-01",
        status: "ativo"
      },
      {
        id: "3",
        funcionario: {
          id: 3,
          nome: "Ana Paula",
          cargo: "Supervisor"
        },
        tipo: "auxilio-creche",
        descricao: "Auxílio Creche",
        valor: 300.00,
        dataInicio: "2024-06-01",
        status: "ativo"
      }
    ])
  }, [])

  const getTipoValeColor = (tipo: string) => {
    switch (tipo) {
      case 'vale-transporte': return 'bg-blue-100 text-blue-800'
      case 'vale-refeicao': return 'bg-green-100 text-green-800'
      case 'vale-alimentacao': return 'bg-orange-100 text-orange-800'
      case 'vale-combustivel': return 'bg-yellow-100 text-yellow-800'
      case 'outros': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoBeneficioColor = (tipo: string) => {
    switch (tipo) {
      case 'plano-saude': return 'bg-green-100 text-green-800'
      case 'plano-odonto': return 'bg-blue-100 text-blue-800'
      case 'seguro-vida': return 'bg-purple-100 text-purple-800'
      case 'auxilio-creche': return 'bg-pink-100 text-pink-800'
      case 'outros': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'solicitado': return 'bg-yellow-100 text-yellow-800'
      case 'aprovado': return 'bg-blue-100 text-blue-800'
      case 'pago': return 'bg-green-100 text-green-800'
      case 'rejeitado': return 'bg-red-100 text-red-800'
      case 'ativo': return 'bg-green-100 text-green-800'
      case 'inativo': return 'bg-gray-100 text-gray-800'
      case 'suspenso': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'solicitado': return <AlertCircle className="w-4 h-4" />
      case 'aprovado': return <CheckCircle className="w-4 h-4" />
      case 'pago': return <DollarSign className="w-4 h-4" />
      case 'rejeitado': return <AlertCircle className="w-4 h-4" />
      case 'ativo': return <CheckCircle className="w-4 h-4" />
      case 'inativo': return <AlertCircle className="w-4 h-4" />
      case 'suspenso': return <AlertCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const aprovarVale = async (valeId: string) => {
    setLoading(true)
    try {
      // Simular aprovação
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Vale Aprovado",
        description: "Vale aprovado com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao aprovar vale",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const pagarVale = async (valeId: string) => {
    setLoading(true)
    try {
      // Simular pagamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Vale Pago",
        description: "Vale pago com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao pagar vale",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const ativarBeneficio = async (beneficioId: string) => {
    setLoading(true)
    try {
      // Simular ativação
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Benefício Ativado",
        description: "Benefício ativado com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao ativar benefício",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const exportarVales = () => {
    toast({
      title: "Exportar",
      description: "Iniciando exportação dos vales...",
    })
  }

  const filteredVales = vales.filter(vale => {
    const matchesFuncionario = !filtroFuncionario || vale.funcionario.nome.toLowerCase().includes(filtroFuncionario.toLowerCase())
    const matchesTipo = filtroTipo === "all" || vale.tipo === filtroTipo
    const matchesStatus = filtroStatus === "all" || vale.status === filtroStatus
    return matchesFuncionario && matchesTipo && matchesStatus
  })

  const filteredBeneficios = beneficios.filter(beneficio => {
    const matchesFuncionario = !filtroFuncionario || beneficio.funcionario.nome.toLowerCase().includes(filtroFuncionario.toLowerCase())
    const matchesTipo = filtroTipo === "all" || beneficio.tipo === filtroTipo
    const matchesStatus = filtroStatus === "all" || beneficio.status === filtroStatus
    return matchesFuncionario && matchesTipo && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vales e Benefícios</h1>
          <p className="text-gray-600">Gestão de vales e benefícios dos funcionários</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportarVales}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={isValeDialogOpen} onOpenChange={setIsValeDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Vale
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Vale</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="funcionario-vale">Funcionário</Label>
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
                  <Label htmlFor="tipo-vale">Tipo de Vale</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vale-transporte">Vale Transporte</SelectItem>
                      <SelectItem value="vale-refeicao">Vale Refeição</SelectItem>
                      <SelectItem value="vale-alimentacao">Vale Alimentação</SelectItem>
                      <SelectItem value="vale-combustivel">Vale Combustível</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="descricao-vale">Descrição</Label>
                  <Input id="descricao-vale" placeholder="Descrição do vale" />
                </div>
                <div>
                  <Label htmlFor="valor-vale">Valor (R$)</Label>
                  <Input id="valor-vale" type="number" placeholder="0.00" />
                </div>
                <div>
                  <Label htmlFor="observacoes-vale">Observações</Label>
                  <Textarea id="observacoes-vale" placeholder="Observações sobre o vale" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsValeDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setIsValeDialogOpen(false)}>
                    Solicitar
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
                <p className="text-sm font-medium text-gray-600">Total de Vales</p>
                <p className="text-2xl font-bold text-gray-900">{vales.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vales Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vales.filter(v => v.status === 'solicitado').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-500">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Benefícios Ativos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {beneficios.filter(b => b.status === 'ativo').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <Gift className="w-6 h-6 text-white" />
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
                  R$ {(vales.reduce((acc, v) => acc + v.valor, 0) + beneficios.reduce((acc, b) => acc + b.valor, 0)).toLocaleString('pt-BR')}
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
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="vale-transporte">Vale Transporte</SelectItem>
                  <SelectItem value="vale-refeicao">Vale Refeição</SelectItem>
                  <SelectItem value="vale-alimentacao">Vale Alimentação</SelectItem>
                  <SelectItem value="plano-saude">Plano de Saúde</SelectItem>
                  <SelectItem value="plano-odonto">Plano Odontológico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="solicitado">Solicitado</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFiltroFuncionario("")
                  setFiltroTipo("all")
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

      {/* Tabs de Vales e Benefícios */}
      <Tabs defaultValue="vales" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vales">Vales</TabsTrigger>
          <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="vales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vales dos Funcionários</CardTitle>
              <CardDescription>Controle de vales solicitados e pagos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data Solicitação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVales.map((vale) => (
                    <TableRow key={vale.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={`/api/avatar/${vale.funcionario.id}`} />
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                              {getInitials(vale.funcionario.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{vale.funcionario.nome}</div>
                            <div className="text-sm text-gray-500">{vale.funcionario.cargo}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTipoValeColor(vale.tipo)} border`}>
                          {vale.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{vale.descricao}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">R$ {vale.valor.toLocaleString('pt-BR')}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(vale.dataSolicitacao), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(vale.status)} border`}>
                          {getStatusIcon(vale.status)}
                          <span className="ml-1">{vale.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {vale.status === 'solicitado' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => aprovarVale(vale.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {vale.status === 'aprovado' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => pagarVale(vale.id)}
                            >
                              <DollarSign className="w-4 h-4" />
                            </Button>
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

        <TabsContent value="beneficios" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Benefícios dos Funcionários</CardTitle>
                  <CardDescription>Gestão de benefícios oferecidos</CardDescription>
                </div>
                <Dialog open={isBeneficioDialogOpen} onOpenChange={setIsBeneficioDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Benefício
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Benefício</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="funcionario-beneficio">Funcionário</Label>
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
                        <Label htmlFor="tipo-beneficio">Tipo de Benefício</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="plano-saude">Plano de Saúde</SelectItem>
                            <SelectItem value="plano-odonto">Plano Odontológico</SelectItem>
                            <SelectItem value="seguro-vida">Seguro de Vida</SelectItem>
                            <SelectItem value="auxilio-creche">Auxílio Creche</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="descricao-beneficio">Descrição</Label>
                        <Input id="descricao-beneficio" placeholder="Descrição do benefício" />
                      </div>
                      <div>
                        <Label htmlFor="valor-beneficio">Valor (R$)</Label>
                        <Input id="valor-beneficio" type="number" placeholder="0.00" />
                      </div>
                      <div>
                        <Label htmlFor="data-inicio-beneficio">Data de Início</Label>
                        <Input id="data-inicio-beneficio" type="date" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsBeneficioDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={() => setIsBeneficioDialogOpen(false)}>
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBeneficios.map((beneficio) => (
                    <TableRow key={beneficio.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={`/api/avatar/${beneficio.funcionario.id}`} />
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                              {getInitials(beneficio.funcionario.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{beneficio.funcionario.nome}</div>
                            <div className="text-sm text-gray-500">{beneficio.funcionario.cargo}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTipoBeneficioColor(beneficio.tipo)} border`}>
                          {beneficio.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{beneficio.descricao}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">R$ {beneficio.valor.toLocaleString('pt-BR')}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(beneficio.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(beneficio.status)} border`}>
                          {getStatusIcon(beneficio.status)}
                          <span className="ml-1">{beneficio.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {beneficio.status === 'inativo' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => ativarBeneficio(beneficio.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
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
                  Resumo de Vales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total de Vales</span>
                    <span className="font-semibold">{vales.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vales Pagos</span>
                    <span className="font-semibold text-green-600">
                      {vales.filter(v => v.status === 'pago').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vales Pendentes</span>
                    <span className="font-semibold text-yellow-600">
                      {vales.filter(v => v.status === 'solicitado').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Total</span>
                    <span className="font-semibold text-blue-600">
                      R$ {vales.reduce((acc, v) => acc + v.valor, 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Resumo de Benefícios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Benefícios Ativos</span>
                    <span className="font-semibold text-green-600">
                      {beneficios.filter(b => b.status === 'ativo').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Benefícios Inativos</span>
                    <span className="font-semibold text-gray-600">
                      {beneficios.filter(b => b.status === 'inativo').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Total Mensal</span>
                    <span className="font-semibold text-purple-600">
                      R$ {beneficios.filter(b => b.status === 'ativo').reduce((acc, b) => acc + b.valor, 0).toLocaleString('pt-BR')}
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
