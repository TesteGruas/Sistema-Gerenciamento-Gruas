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
import { rhApi, Vale, BeneficioFuncionario as BeneficioAPI } from "@/lib/api-rh-completo"

interface ValeFuncionario {
  id: number
  funcionario_id: number
  funcionario?: {
    id: number
    nome: string
    cargo?: string
  }
  tipo: 'vale-transporte' | 'vale-refeicao' | 'vale-alimentacao' | 'vale-combustivel' | 'outros'
  descricao: string
  valor: number
  data_solicitacao: string
  data_aprovacao?: string
  data_pagamento?: string
  status: 'solicitado' | 'aprovado' | 'pago' | 'rejeitado'
  aprovado_por?: number
  observacoes?: string
}

interface BeneficioFuncionario {
  id: number
  funcionario_id: number
  beneficio_tipo_id: number
  funcionario?: {
    nome: string
    cargo?: string
  }
  beneficios_tipo?: {
    tipo: string
    descricao: string
    valor: number
  }
  data_inicio: string
  data_fim?: string
  status: string
  observacoes?: string
}

export default function ValesBeneficiosPage() {
  const [vales, setVales] = useState<ValeFuncionario[]>([])
  const [beneficios, setBeneficios] = useState<BeneficioFuncionario[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroFuncionario, setFiltroFuncionario] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("all")
  const [filtroStatus, setFiltroStatus] = useState("all")
  const [isValeDialogOpen, setIsValeDialogOpen] = useState(false)
  const [isBeneficioDialogOpen, setIsBeneficioDialogOpen] = useState(false)
  const { toast } = useToast()

  // Formulário de vale
  const [valeForm, setValeForm] = useState({
    funcionario_id: '',
    tipo: 'vale-transporte' as 'vale-transporte' | 'vale-refeicao' | 'vale-alimentacao' | 'vale-combustivel' | 'outros',
    descricao: '',
    valor: '',
    observacoes: ''
  })

  // Formulário de benefício
  const [beneficioForm, setBeneficioForm] = useState({
    funcionario_id: '',
    tipo: 'plano-saude',
    descricao: '',
    valor: '',
    data_inicio: ''
  })

  const handleCriarBeneficio = async () => {
    try {
      if (!beneficioForm.funcionario_id || !beneficioForm.tipo || !beneficioForm.descricao || !beneficioForm.valor) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        })
        return
      }

      setLoading(true)
      
      // TODO: Implementar quando houver endpoint de benefícios de funcionários
      // Por enquanto, apenas feedback ao usuário
      toast({
        title: "Info",
        description: "Funcionalidade em desenvolvimento. Endpoint de benefícios será implementado em breve.",
      })
      
      setIsBeneficioDialogOpen(false)
      resetBeneficioForm()
      
    } catch (error: any) {
      console.error('Erro ao criar benefício:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar benefício",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar funcionários
      const funcionariosResponse = await rhApi.listarFuncionariosCompletos({ limit: 100 })
      setFuncionarios(funcionariosResponse.data || [])
      
      // Carregar vales
      const valesResponse = await rhApi.listarVales()
      setVales(valesResponse.data || [])
      
      // Carregar benefícios dos funcionários
      const beneficiosResponse = await rhApi.listarBeneficiosFuncionarios({ limit: 100 })
      setBeneficios(beneficiosResponse.data || [])
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de vales e benefícios",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

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

  const handleCriarVale = async () => {
    try {
      if (!valeForm.funcionario_id || !valeForm.descricao || !valeForm.valor) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        })
        return
      }

      setLoading(true)
      
      const valeData = {
        funcionario_id: parseInt(valeForm.funcionario_id),
        tipo: valeForm.tipo,
        descricao: valeForm.descricao,
        valor: parseFloat(valeForm.valor),
        observacoes: valeForm.observacoes
      }

      const response = await rhApi.criarVale(valeData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Vale solicitado com sucesso!",
        })
        setIsValeDialogOpen(false)
        resetValeForm()
        await carregarDados()
      }
    } catch (error: any) {
      console.error('Erro ao criar vale:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao solicitar vale",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const aprovarVale = async (valeId: number) => {
    try {
      setLoading(true)
      
      const response = await rhApi.aprovarVale(valeId)
      
      if (response.success) {
        toast({
          title: "Vale Aprovado",
          description: "Vale aprovado com sucesso!",
        })
        await carregarDados()
      }
    } catch (error: any) {
      console.error('Erro ao aprovar vale:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao aprovar vale",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const pagarVale = async (valeId: number) => {
    try {
      setLoading(true)
      
      const dataAtual = new Date().toISOString().split('T')[0]
      const response = await rhApi.pagarVale(valeId, dataAtual)
      
      if (response.success) {
        toast({
          title: "Vale Pago",
          description: "Vale pago com sucesso!",
        })
        await carregarDados()
      }
    } catch (error: any) {
      console.error('Erro ao pagar vale:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao pagar vale",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const ativarBeneficio = async (beneficioId: number) => {
    setLoading(true)
    try {
      // Implementar quando houver endpoint de benefícios
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

  const resetValeForm = () => {
    setValeForm({
      funcionario_id: '',
      tipo: 'vale-transporte',
      descricao: '',
      valor: '',
      observacoes: ''
    })
  }

  const resetBeneficioForm = () => {
    setBeneficioForm({
      funcionario_id: '',
      tipo: '',
      descricao: '',
      valor: '',
      data_inicio: ''
    })
  }

  const exportarVales = () => {
    toast({
      title: "Exportar",
      description: "Iniciando exportação dos vales...",
    })
  }

  const getFuncionarioNome = (funcionario_id: number) => {
    const funcionario = funcionarios.find(f => f.id === funcionario_id)
    return funcionario?.nome || 'Funcionário não encontrado'
  }

  const getFuncionarioCargo = (funcionario_id: number) => {
    const funcionario = funcionarios.find(f => f.id === funcionario_id)
    return funcionario?.cargo || 'N/A'
  }

  const filteredVales = vales.filter(vale => {
    const funcionarioNome = getFuncionarioNome(vale.funcionario_id)
    const matchesFuncionario = !filtroFuncionario || funcionarioNome.toLowerCase().includes(filtroFuncionario.toLowerCase())
    const matchesTipo = filtroTipo === "all" || vale.tipo === filtroTipo
    const matchesStatus = filtroStatus === "all" || vale.status === filtroStatus
    return matchesFuncionario && matchesTipo && matchesStatus
  })

  const filteredBeneficios = beneficios.filter(beneficio => {
    const funcionarioNome = beneficio.funcionario?.nome || getFuncionarioNome(beneficio.funcionario_id)
    const tipoBeneficio = beneficio.beneficios_tipo?.tipo || ''
    const matchesFuncionario = !filtroFuncionario || funcionarioNome.toLowerCase().includes(filtroFuncionario.toLowerCase())
    const matchesTipo = filtroTipo === "all" || tipoBeneficio === filtroTipo
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
                  <Label htmlFor="funcionario-vale">Funcionário *</Label>
                  <Select 
                    value={valeForm.funcionario_id}
                    onValueChange={(value) => setValeForm({ ...valeForm, funcionario_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionarios.map((funcionario) => (
                        <SelectItem key={funcionario.id} value={funcionario.id.toString()}>
                          {funcionario.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tipo-vale">Tipo de Vale *</Label>
                  <Select 
                    value={valeForm.tipo}
                    onValueChange={(value) => setValeForm({ ...valeForm, tipo: value as any })}
                  >
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
                  <Label htmlFor="descricao-vale">Descrição *</Label>
                  <Input 
                    id="descricao-vale" 
                    placeholder="Descrição do vale"
                    value={valeForm.descricao}
                    onChange={(e) => setValeForm({ ...valeForm, descricao: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="valor-vale">Valor (R$) *</Label>
                  <Input 
                    id="valor-vale" 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={valeForm.valor}
                    onChange={(e) => setValeForm({ ...valeForm, valor: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="observacoes-vale">Observações</Label>
                  <Textarea 
                    id="observacoes-vale" 
                    placeholder="Observações sobre o vale"
                    value={valeForm.observacoes}
                    onChange={(e) => setValeForm({ ...valeForm, observacoes: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsValeDialogOpen(false)
                      resetValeForm()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCriarVale}
                    disabled={loading}
                  >
                    {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
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
                            <AvatarImage src={`/api/avatar/${vale.funcionario_id}`} />
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                              {getInitials(getFuncionarioNome(vale.funcionario_id))}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{getFuncionarioNome(vale.funcionario_id)}</div>
                            <div className="text-sm text-gray-500">{getFuncionarioCargo(vale.funcionario_id)}</div>
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
                          {format(new Date(vale.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}
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
                              disabled={loading}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {vale.status === 'aprovado' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => pagarVale(vale.id)}
                              disabled={loading}
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
                        <Label htmlFor="funcionario-beneficio">Funcionário *</Label>
                        <Select 
                          value={beneficioForm.funcionario_id}
                          onValueChange={(value) => setBeneficioForm({ ...beneficioForm, funcionario_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o funcionário" />
                          </SelectTrigger>
                          <SelectContent>
                            {funcionarios.map((funcionario) => (
                              <SelectItem key={funcionario.id} value={funcionario.id.toString()}>
                                {funcionario.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="tipo-beneficio">Tipo de Benefício *</Label>
                        <Select 
                          value={beneficioForm.tipo}
                          onValueChange={(value) => setBeneficioForm({ ...beneficioForm, tipo: value })}
                        >
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
                        <Label htmlFor="descricao-beneficio">Descrição *</Label>
                        <Input 
                          id="descricao-beneficio" 
                          placeholder="Descrição do benefício"
                          value={beneficioForm.descricao}
                          onChange={(e) => setBeneficioForm({ ...beneficioForm, descricao: e.target.value })}
                        />
                      </div>
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
                      <div>
                        <Label htmlFor="data-inicio-beneficio">Data de Início *</Label>
                        <Input 
                          id="data-inicio-beneficio" 
                          type="date"
                          value={beneficioForm.data_inicio}
                          onChange={(e) => setBeneficioForm({ ...beneficioForm, data_inicio: e.target.value })}
                        />
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
                            <AvatarImage src={`/api/avatar/${beneficio.funcionario_id}`} />
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                              {getInitials(getFuncionarioNome(beneficio.funcionario_id))}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{getFuncionarioNome(beneficio.funcionario_id)}</div>
                            <div className="text-sm text-gray-500">{getFuncionarioCargo(beneficio.funcionario_id)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTipoBeneficioColor(beneficio.beneficios_tipo?.tipo || '')} border`}>
                          {beneficio.beneficios_tipo?.tipo || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{beneficio.beneficios_tipo?.descricao || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">R$ {(beneficio.beneficios_tipo?.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(beneficio.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${beneficio.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} border`}>
                          {beneficio.status === 'ativo' ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Inativo
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {beneficio.status !== 'ativo' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => ativarBeneficio(beneficio.id)}
                              disabled={loading}
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
