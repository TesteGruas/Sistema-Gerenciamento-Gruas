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
  DollarSign, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Trash2,
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Building2,
  Download,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface SalarioFuncionario {
  id: number
  funcionario: {
    id: number
    nome: string
    cargo: string
    avatar?: string
  }
  salarioBase: number
  horasTrabalhadas: number
  horasExtras: number
  valorHoraExtra: number
  totalProventos: number
  totalDescontos: number
  salarioLiquido: number
  mes: string
  status: 'calculado' | 'pago' | 'pendente'
  dataPagamento?: string
}

interface Desconto {
  id: string
  tipo: 'inss' | 'irrf' | 'vale-transporte' | 'vale-refeicao' | 'plano-saude' | 'outros'
  descricao: string
  valor: number
  percentual?: number
  obrigatorio: boolean
}

interface Beneficio {
  id: string
  tipo: 'vale-transporte' | 'vale-refeicao' | 'plano-saude' | 'plano-odonto' | 'seguro-vida' | 'outros'
  descricao: string
  valor: number
  percentual?: number
  ativo: boolean
}

export default function RemuneracaoPage() {
  const [salarios, setSalarios] = useState<SalarioFuncionario[]>([])
  const [descontos, setDescontos] = useState<Desconto[]>([])
  const [beneficios, setBeneficios] = useState<Beneficio[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroFuncionario, setFiltroFuncionario] = useState("")
  const [filtroMes, setFiltroMes] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("all")
  const [isDescontoDialogOpen, setIsDescontoDialogOpen] = useState(false)
  const [isBeneficioDialogOpen, setIsBeneficioDialogOpen] = useState(false)
  const { toast } = useToast()

  // Dados mockados para demonstração
  useEffect(() => {
    setSalarios([
      {
        id: 1,
        funcionario: {
          id: 1,
          nome: "Carlos Eduardo Menezes",
          cargo: "Supervisor"
        },
        salarioBase: 5000,
        horasTrabalhadas: 176,
        horasExtras: 8,
        valorHoraExtra: 28.41,
        totalProventos: 5227.28,
        totalDescontos: 1045.46,
        salarioLiquido: 4181.82,
        mes: "2024-11",
        status: "pago",
        dataPagamento: "2024-11-05"
      },
      {
        id: 2,
        funcionario: {
          id: 2,
          nome: "João Marcos Ferreira da Silva",
          cargo: "Sinaleiro"
        },
        salarioBase: 3500,
        horasTrabalhadas: 176,
        horasExtras: 4,
        valorHoraExtra: 19.89,
        totalProventos: 3579.56,
        totalDescontos: 715.91,
        salarioLiquido: 2863.65,
        mes: "2024-11",
        status: "pago",
        dataPagamento: "2024-11-05"
      },
      {
        id: 3,
        funcionario: {
          id: 3,
          nome: "Ana Paula",
          cargo: "Supervisor"
        },
        salarioBase: 4500,
        horasTrabalhadas: 176,
        horasExtras: 12,
        valorHoraExtra: 25.57,
        totalProventos: 4806.84,
        totalDescontos: 961.37,
        salarioLiquido: 3845.47,
        mes: "2024-11",
        status: "calculado"
      }
    ])

    setDescontos([
      {
        id: "1",
        tipo: "inss",
        descricao: "INSS",
        valor: 0,
        percentual: 11,
        obrigatorio: true
      },
      {
        id: "2",
        tipo: "irrf",
        descricao: "IRRF",
        valor: 0,
        percentual: 0,
        obrigatorio: true
      },
      {
        id: "3",
        tipo: "vale-transporte",
        descricao: "Vale Transporte",
        valor: 0,
        percentual: 6,
        obrigatorio: false
      },
      {
        id: "4",
        tipo: "vale-refeicao",
        descricao: "Vale Refeição",
        valor: 0,
        percentual: 8,
        obrigatorio: false
      }
    ])

    setBeneficios([
      {
        id: "1",
        tipo: "plano-saude",
        descricao: "Plano de Saúde",
        valor: 200,
        ativo: true
      },
      {
        id: "2",
        tipo: "plano-odonto",
        descricao: "Plano Odontológico",
        valor: 50,
        ativo: true
      },
      {
        id: "3",
        tipo: "seguro-vida",
        descricao: "Seguro de Vida",
        valor: 30,
        ativo: true
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

  const getTipoDescontoColor = (tipo: string) => {
    switch (tipo) {
      case 'inss': return 'bg-red-100 text-red-800'
      case 'irrf': return 'bg-orange-100 text-orange-800'
      case 'vale-transporte': return 'bg-blue-100 text-blue-800'
      case 'vale-refeicao': return 'bg-green-100 text-green-800'
      case 'plano-saude': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoBeneficioColor = (tipo: string) => {
    switch (tipo) {
      case 'plano-saude': return 'bg-green-100 text-green-800'
      case 'plano-odonto': return 'bg-blue-100 text-blue-800'
      case 'seguro-vida': return 'bg-purple-100 text-purple-800'
      case 'vale-transporte': return 'bg-orange-100 text-orange-800'
      case 'vale-refeicao': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const calcularSalario = async (funcionarioId: number) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Salário Calculado",
        description: "Cálculo de salário realizado com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao calcular salário",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const processarPagamento = async (funcionarioId: number) => {
    setLoading(true)
    try {
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

  const exportarFolha = () => {
    toast({
      title: "Exportar",
      description: "Iniciando exportação da folha de pagamento...",
    })
  }

  const filteredSalarios = salarios.filter(salario => {
    const matchesFuncionario = !filtroFuncionario || salario.funcionario.nome.toLowerCase().includes(filtroFuncionario.toLowerCase())
    const matchesMes = !filtroMes || salario.mes.includes(filtroMes)
    const matchesStatus = filtroStatus === "all" || salario.status === filtroStatus
    return matchesFuncionario && matchesMes && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Remuneração</h1>
          <p className="text-gray-600">Gestão de salários, descontos e benefícios</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportarFolha}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Folha
          </Button>
          <Button onClick={() => calcularSalario(1)} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
            Calcular Salários
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Funcionários</p>
                <p className="text-2xl font-bold text-gray-900">{salarios.length}</p>
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
                <p className="text-sm font-medium text-gray-600">Total Proventos</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {salarios.reduce((acc, s) => acc + s.totalProventos, 0).toLocaleString('pt-BR')}
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
                <p className="text-sm font-medium text-gray-600">Total Descontos</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {salarios.reduce((acc, s) => acc + s.totalDescontos, 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-500">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Salário Líquido</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {salarios.reduce((acc, s) => acc + s.salarioLiquido, 0).toLocaleString('pt-BR')}
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

      {/* Tabs de Remuneração */}
      <Tabs defaultValue="salarios" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="salarios">Salários</TabsTrigger>
          <TabsTrigger value="descontos">Descontos</TabsTrigger>
          <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="salarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Folha de Pagamento</CardTitle>
              <CardDescription>Controle de salários e pagamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Salário Base</TableHead>
                    <TableHead>Horas Extras</TableHead>
                    <TableHead>Proventos</TableHead>
                    <TableHead>Descontos</TableHead>
                    <TableHead>Líquido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSalarios.map((salario) => (
                    <TableRow key={salario.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={`/api/avatar/${salario.funcionario.id}`} />
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                              {getInitials(salario.funcionario.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{salario.funcionario.nome}</div>
                            <div className="text-sm text-gray-500">{salario.funcionario.cargo}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">R$ {salario.salarioBase.toLocaleString('pt-BR')}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{salario.horasExtras}h</div>
                          <div className="text-orange-600">R$ {(salario.valorHoraExtra || 0).toFixed(2)}/h</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          R$ {salario.totalProventos.toLocaleString('pt-BR')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-red-600">
                          R$ {salario.totalDescontos.toLocaleString('pt-BR')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-blue-600">
                          R$ {salario.salarioLiquido.toLocaleString('pt-BR')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(salario.status)} border`}>
                          {getStatusIcon(salario.status)}
                          <span className="ml-1">{salario.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {salario.status === 'calculado' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => processarPagamento(salario.funcionario.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => calcularSalario(salario.funcionario.id)}
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

        <TabsContent value="descontos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Descontos</CardTitle>
                  <CardDescription>Configuração de descontos obrigatórios e opcionais</CardDescription>
                </div>
                <Dialog open={isDescontoDialogOpen} onOpenChange={setIsDescontoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Desconto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Desconto</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tipo">Tipo de Desconto</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inss">INSS</SelectItem>
                            <SelectItem value="irrf">IRRF</SelectItem>
                            <SelectItem value="vale-transporte">Vale Transporte</SelectItem>
                            <SelectItem value="vale-refeicao">Vale Refeição</SelectItem>
                            <SelectItem value="plano-saude">Plano de Saúde</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="descricao">Descrição</Label>
                        <Input id="descricao" placeholder="Descrição do desconto" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="valor">Valor Fixo (R$)</Label>
                          <Input id="valor" type="number" placeholder="0.00" />
                        </div>
                        <div>
                          <Label htmlFor="percentual">Percentual (%)</Label>
                          <Input id="percentual" type="number" placeholder="0" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsDescontoDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={() => setIsDescontoDialogOpen(false)}>
                          Salvar
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor/Percentual</TableHead>
                    <TableHead>Obrigatório</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {descontos.map((desconto) => (
                    <TableRow key={desconto.id}>
                      <TableCell>
                        <Badge className={`${getTipoDescontoColor(desconto.tipo)} border`}>
                          {desconto.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{desconto.descricao}</TableCell>
                      <TableCell>
                        {desconto.valor > 0 ? (
                          <span>R$ {desconto.valor.toLocaleString('pt-BR')}</span>
                        ) : (
                          <span>{desconto.percentual}%</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={desconto.obrigatorio ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                          {desconto.obrigatorio ? 'Sim' : 'Não'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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

        <TabsContent value="beneficios" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Benefícios</CardTitle>
                  <CardDescription>Gestão de benefícios oferecidos aos funcionários</CardDescription>
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
                      <DialogTitle>Novo Benefício</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
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
                            <SelectItem value="vale-transporte">Vale Transporte</SelectItem>
                            <SelectItem value="vale-refeicao">Vale Refeição</SelectItem>
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
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsBeneficioDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={() => setIsBeneficioDialogOpen(false)}>
                          Salvar
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beneficios.map((beneficio) => (
                    <TableRow key={beneficio.id}>
                      <TableCell>
                        <Badge className={`${getTipoBeneficioColor(beneficio.tipo)} border`}>
                          {beneficio.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{beneficio.descricao}</TableCell>
                      <TableCell>
                        <span className="font-medium">R$ {beneficio.valor.toLocaleString('pt-BR')}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={beneficio.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {beneficio.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total de Proventos</span>
                    <span className="font-semibold text-green-600">
                      R$ {salarios.reduce((acc, s) => acc + s.totalProventos, 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total de Descontos</span>
                    <span className="font-semibold text-red-600">
                      R$ {salarios.reduce((acc, s) => acc + s.totalDescontos, 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Salário Líquido Total</span>
                    <span className="font-semibold text-blue-600">
                      R$ {salarios.reduce((acc, s) => acc + s.salarioLiquido, 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Benefícios Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {beneficios.filter(b => b.ativo).map((beneficio) => (
                    <div key={beneficio.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{beneficio.descricao}</span>
                      <span className="font-semibold">R$ {beneficio.valor.toLocaleString('pt-BR')}</span>
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
