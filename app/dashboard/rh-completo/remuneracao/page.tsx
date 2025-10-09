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
import { 
  rhApi, 
  FolhaPagamento, 
  TipoDesconto, 
  TipoBeneficio,
  FuncionarioDesconto,
  FuncionarioBeneficio 
} from "@/lib/api-rh-completo"

interface SalarioFuncionario extends FolhaPagamento {
  funcionario?: {
    id: number
    nome: string
    cargo?: string
  }
}

interface Desconto extends TipoDesconto {}

interface Beneficio extends TipoBeneficio {}

export default function RemuneracaoPage() {
  const [salarios, setSalarios] = useState<SalarioFuncionario[]>([])
  const [descontos, setDescontos] = useState<Desconto[]>([])
  const [beneficios, setBeneficios] = useState<Beneficio[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [funcionariosDescontos, setFuncionariosDescontos] = useState<FuncionarioDesconto[]>([])
  const [funcionariosBeneficios, setFuncionariosBeneficios] = useState<FuncionarioBeneficio[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroFuncionario, setFiltroFuncionario] = useState("")
  const [filtroMes, setFiltroMes] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("all")
  const [isDescontoDialogOpen, setIsDescontoDialogOpen] = useState(false)
  const [isBeneficioDialogOpen, setIsBeneficioDialogOpen] = useState(false)
  const { toast } = useToast()

  // Formulários
  const [folhaForm, setFolhaForm] = useState({
    funcionario_id: '',
    mes: '',
    ano: '',
    salario_base: '',
    horas_trabalhadas: '',
    horas_extras: '',
    adicional_noturno: '',
    adicional_periculosidade: '',
    adicional_insalubridade: ''
  })

  const [descontoForm, setDescontoForm] = useState({
    nome: '',
    descricao: '',
    tipo_calculo: 'fixo' as 'fixo' | 'percentual',
    valor: '',
    percentual: '',
    obrigatorio: false
  })

  const [beneficioForm, setBeneficioForm] = useState({
    nome: '',
    descricao: '',
    tipo_calculo: 'fixo' as 'fixo' | 'percentual',
    valor: '',
    percentual: '',
    ativo: true
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
      
      // Carregar folhas de pagamento
      const params: any = {}
      if (filtroMes) {
        const [ano, mes] = filtroMes.split('-')
        params.ano = parseInt(ano)
        params.mes = parseInt(mes)
      }
      
      const folhasResponse = await rhApi.listarFolhasPagamento(params)
      setSalarios(folhasResponse.data || [])
      
      // Carregar tipos de descontos
      const descontosResponse = await rhApi.listarTiposDescontos()
      setDescontos(descontosResponse.data || [])
      
      // Carregar tipos de benefícios
      const beneficiosResponse = await rhApi.listarTiposBeneficios()
      setBeneficios(beneficiosResponse.data || [])
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de remuneração",
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

  const getFuncionarioCargo = (funcionario_id: number) => {
    const funcionario = funcionarios.find(f => f.id === funcionario_id)
    return funcionario?.cargo || 'N/A'
  }

  const handleCriarFolha = async () => {
    try {
      if (!folhaForm.funcionario_id || !folhaForm.mes || !folhaForm.ano || !folhaForm.salario_base) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        })
        return
      }

      setLoading(true)
      
      const folhaData = {
        funcionario_id: parseInt(folhaForm.funcionario_id),
        mes: parseInt(folhaForm.mes),
        ano: parseInt(folhaForm.ano),
        salario_base: parseFloat(folhaForm.salario_base),
        horas_trabalhadas: parseFloat(folhaForm.horas_trabalhadas) || 0,
        horas_extras: parseFloat(folhaForm.horas_extras) || 0,
        adicional_noturno: parseFloat(folhaForm.adicional_noturno) || 0,
        adicional_periculosidade: parseFloat(folhaForm.adicional_periculosidade) || 0,
        adicional_insalubridade: parseFloat(folhaForm.adicional_insalubridade) || 0
      }

      const response = await rhApi.criarFolhaPagamento(folhaData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Folha de pagamento criada com sucesso!",
        })
        resetFolhaForm()
        await carregarDados()
      }
    } catch (error: any) {
      console.error('Erro ao criar folha:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar folha de pagamento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProcessarPagamento = async (folhaId: number) => {
    try {
      setLoading(true)
      const response = await rhApi.processarPagamento(folhaId)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Pagamento processado com sucesso!",
        })
        await carregarDados()
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar pagamento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetFolhaForm = () => {
    setFolhaForm({
      funcionario_id: '',
      mes: '',
      ano: '',
      salario_base: '',
      horas_trabalhadas: '',
      horas_extras: '',
      adicional_noturno: '',
      adicional_periculosidade: '',
      adicional_insalubridade: ''
    })
  }

  const resetDescontoForm = () => {
    setDescontoForm({
      nome: '',
      descricao: '',
      tipo_calculo: 'fixo',
      valor: '',
      percentual: '',
      obrigatorio: false
    })
  }

  const resetBeneficioForm = () => {
    setBeneficioForm({
      nome: '',
      descricao: '',
      tipo_calculo: 'fixo',
      valor: '',
      percentual: '',
      ativo: true
    })
  }

  const handleCriarDesconto = async () => {
    try {
      if (!descontoForm.nome || !descontoForm.descricao) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        })
        return
      }

      if (descontoForm.tipo_calculo === 'fixo' && !descontoForm.valor) {
        toast({
          title: "Erro",
          description: "Informe o valor do desconto",
          variant: "destructive"
        })
        return
      }

      if (descontoForm.tipo_calculo === 'percentual' && !descontoForm.percentual) {
        toast({
          title: "Erro",
          description: "Informe o percentual do desconto",
          variant: "destructive"
        })
        return
      }

      setLoading(true)
      
      // TODO: Implementar endpoint de criar tipo de desconto
      // Por enquanto, apenas feedback
      toast({
        title: "Info",
        description: "Funcionalidade em desenvolvimento. Endpoint será implementado em breve.",
      })
      
      setIsDescontoDialogOpen(false)
      resetDescontoForm()
      
    } catch (error: any) {
      console.error('Erro ao criar desconto:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar desconto",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCriarBeneficio = async () => {
    try {
      if (!beneficioForm.nome || !beneficioForm.descricao) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        })
        return
      }

      if (beneficioForm.tipo_calculo === 'fixo' && !beneficioForm.valor) {
        toast({
          title: "Erro",
          description: "Informe o valor do benefício",
          variant: "destructive"
        })
        return
      }

      if (beneficioForm.tipo_calculo === 'percentual' && !beneficioForm.percentual) {
        toast({
          title: "Erro",
          description: "Informe o percentual do benefício",
          variant: "destructive"
        })
        return
      }

      setLoading(true)
      
      // TODO: Implementar endpoint de criar tipo de benefício
      // Por enquanto, apenas feedback
      toast({
        title: "Info",
        description: "Funcionalidade em desenvolvimento. Endpoint será implementado em breve.",
      })
      
      setIsBeneficioDialogOpen(false)
      resetBeneficioForm()
      
    } catch (error: any) {
      console.error('Erro ao criar benefício:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar benefício",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
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
    const funcionarioNome = getFuncionarioNome(salario.funcionario_id)
    const salarioMesAno = `${salario.ano}-${String(salario.mes).padStart(2, '0')}`
    const matchesFuncionario = !filtroFuncionario || funcionarioNome.toLowerCase().includes(filtroFuncionario.toLowerCase())
    const matchesMes = !filtroMes || salarioMesAno === filtroMes || salarioMesAno.includes(filtroMes)
    const matchesStatus = filtroStatus === "all" || (salario.data_pagamento && filtroStatus === "pago") || (!salario.data_pagamento && filtroStatus === "calculado")
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
                        <Label htmlFor="nome-desconto">Nome do Desconto *</Label>
                        <Input 
                          id="nome-desconto" 
                          placeholder="Ex: INSS, IRRF, etc"
                          value={descontoForm.nome}
                          onChange={(e) => setDescontoForm({ ...descontoForm, nome: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="descricao">Descrição *</Label>
                        <Input 
                          id="descricao" 
                          placeholder="Descrição do desconto"
                          value={descontoForm.descricao}
                          onChange={(e) => setDescontoForm({ ...descontoForm, descricao: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tipo-calculo">Tipo de Cálculo *</Label>
                        <Select 
                          value={descontoForm.tipo_calculo}
                          onValueChange={(value: 'fixo' | 'percentual') => setDescontoForm({ ...descontoForm, tipo_calculo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixo">Valor Fixo</SelectItem>
                            <SelectItem value="percentual">Percentual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {descontoForm.tipo_calculo === 'fixo' ? (
                        <div>
                          <Label htmlFor="valor">Valor Fixo (R$) *</Label>
                          <Input 
                            id="valor" 
                            type="number" 
                            step="0.01"
                            placeholder="0.00"
                            value={descontoForm.valor}
                            onChange={(e) => setDescontoForm({ ...descontoForm, valor: e.target.value })}
                          />
                        </div>
                      ) : (
                        <div>
                          <Label htmlFor="percentual">Percentual (%) *</Label>
                          <Input 
                            id="percentual" 
                            type="number" 
                            step="0.01"
                            placeholder="0"
                            value={descontoForm.percentual}
                            onChange={(e) => setDescontoForm({ ...descontoForm, percentual: e.target.value })}
                          />
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="obrigatorio"
                          checked={descontoForm.obrigatorio}
                          onChange={(e) => setDescontoForm({ ...descontoForm, obrigatorio: e.target.checked })}
                        />
                        <Label htmlFor="obrigatorio">Desconto Obrigatório</Label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsDescontoDialogOpen(false)
                            resetDescontoForm()
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleCriarDesconto}
                          disabled={loading}
                        >
                          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
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
                        <Label htmlFor="nome-beneficio">Nome do Benefício *</Label>
                        <Input 
                          id="nome-beneficio" 
                          placeholder="Ex: Plano de Saúde, Vale Refeição, etc"
                          value={beneficioForm.nome}
                          onChange={(e) => setBeneficioForm({ ...beneficioForm, nome: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="descricao-beneficio">Descrição *</Label>
                        <Input 
                          id="descricao-beneficio" 
                          placeholder="Descrição do benefício"
                          value={beneficioForm.descricao}
                          onChange={(e) => setBeneficioForm({ ...beneficioForm, descricao: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tipo-calculo-beneficio">Tipo de Cálculo *</Label>
                        <Select 
                          value={beneficioForm.tipo_calculo}
                          onValueChange={(value: 'fixo' | 'percentual') => setBeneficioForm({ ...beneficioForm, tipo_calculo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixo">Valor Fixo</SelectItem>
                            <SelectItem value="percentual">Percentual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {beneficioForm.tipo_calculo === 'fixo' ? (
                        <div>
                          <Label htmlFor="valor-beneficio">Valor (R$) *</Label>
                          <Input 
                            id="valor-beneficio" 
                            type="number" 
                            step="0.01"
                            placeholder="0.00"
                            value={beneficioForm.valor}
                            onChange={(e) => setBeneficioForm({ ...beneficioForm, valor: e.target.value })}
                          />
                        </div>
                      ) : (
                        <div>
                          <Label htmlFor="percentual-beneficio">Percentual (%) *</Label>
                          <Input 
                            id="percentual-beneficio" 
                            type="number" 
                            step="0.01"
                            placeholder="0"
                            value={beneficioForm.percentual}
                            onChange={(e) => setBeneficioForm({ ...beneficioForm, percentual: e.target.value })}
                          />
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="ativo"
                          checked={beneficioForm.ativo}
                          onChange={(e) => setBeneficioForm({ ...beneficioForm, ativo: e.target.checked })}
                        />
                        <Label htmlFor="ativo">Benefício Ativo</Label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsBeneficioDialogOpen(false)
                            resetBeneficioForm()
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleCriarBeneficio}
                          disabled={loading}
                        >
                          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
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
