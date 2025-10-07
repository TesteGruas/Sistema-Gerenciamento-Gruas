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
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  UserCheck,
  UserX,
  Building2,
  Shield,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Grid3X3,
  List,
  Filter,
  Download,
  Clock,
  Calculator,
  DollarSign,
  Gift,
  FileText,
  History,
  TrendingUp,
  BarChart3,
  PieChart,
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  User,
  Upload
} from "lucide-react"
import { apiRH } from "@/lib/api-rh"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface FuncionarioRH {
  id: number
  nome: string
  cpf: string
  cargo: string
  departamento: string
  salario: number
  data_admissao: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  status: 'ativo' | 'inativo' | 'férias' | 'licença'
  obra_atual?: string
  turno?: 'manhã' | 'tarde' | 'noite' | 'integral'
  observacoes?: string
}

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

export default function RHPage() {
  const [funcionarios, setFuncionarios] = useState<FuncionarioRH[]>([])
  const [salarios, setSalarios] = useState<SalarioFuncionario[]>([])
  const [pontos, setPontos] = useState<PontoRegistro[]>([])
  const [vales, setVales] = useState<ValeFuncionario[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [filtroNome, setFiltroNome] = useState("")
  const [filtroCargo, setFiltroCargo] = useState("all")
  const [filtroStatus, setFiltroStatus] = useState("all")
  const [isDescontoDialogOpen, setIsDescontoDialogOpen] = useState(false)
  const [isBeneficioDialogOpen, setIsBeneficioDialogOpen] = useState(false)
  const [isEditFuncionarioDialogOpen, setIsEditFuncionarioDialogOpen] = useState(false)
  const [isEditSalarioDialogOpen, setIsEditSalarioDialogOpen] = useState(false)
  const [isEditBeneficioDialogOpen, setIsEditBeneficioDialogOpen] = useState(false)
  const [isEditPontoDialogOpen, setIsEditPontoDialogOpen] = useState(false)
  const [isUploadDocumentoDialogOpen, setIsUploadDocumentoDialogOpen] = useState(false)
  const [selectedFuncionario, setSelectedFuncionario] = useState<FuncionarioRH | null>(null)
  const [selectedSalario, setSelectedSalario] = useState<SalarioFuncionario | null>(null)
  const [selectedBeneficio, setSelectedBeneficio] = useState<any>(null)
  const [selectedPonto, setSelectedPonto] = useState<PontoRegistro | null>(null)
  const { toast } = useToast()

  // Dados mockados para demonstração
  useEffect(() => {
    setFuncionarios([
      {
        id: 1,
        nome: "Carlos Eduardo Menezes",
        cpf: "123.456.789-00",
        cargo: "Supervisor",
        departamento: "Operações",
        salario: 5000,
        data_admissao: "2024-10-23",
        telefone: "(11) 99999-9999",
        email: "carlos.menezes@construtoraatlantica.com.br",
        endereco: "Rua das Flores, 123",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01234-567",
        status: "ativo",
        obra_atual: "Residencial Atlântica",
        turno: "integral",
        observacoes: "Supervisor experiente"
      },
      {
        id: 2,
        nome: "João Marcos Ferreira da Silva",
        cpf: "987.654.321-00",
        cargo: "Sinaleiro",
        departamento: "Operações",
        salario: 3500,
        data_admissao: "2024-10-08",
        telefone: "(11) 88888-8888",
        email: "joao.ferreira@empresaexemplo.com",
        endereco: "Av. Principal, 456",
        cidade: "São Paulo",
        estado: "SP",
        cep: "04567-890",
        status: "ativo",
        obra_atual: "Residencial Atlântica",
        turno: "manhã",
        observacoes: "Sinaleiro especializado"
      },
      {
        id: 3,
        nome: "Ana Paula",
        cpf: "456.789.123-00",
        cargo: "Supervisor",
        departamento: "Operações",
        salario: 4500,
        data_admissao: "2023-03-19",
        telefone: "(11) 77777-7777",
        email: "ana@empresa.com",
        endereco: "Rua das Palmeiras, 789",
        cidade: "São Paulo",
        estado: "SP",
        cep: "07890-123",
        status: "ativo",
        obra_atual: "Shopping Center",
        turno: "tarde",
        observacoes: "Supervisora de qualidade"
      }
    ])

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
      }
    ])

    setPontos([
      {
        id: "1",
        funcionario: {
          id: 1,
          nome: "Carlos Eduardo Menezes"
        },
        data: "2024-11-15",
        entrada: "08:00",
        saida: "17:00",
        entradaAlmoco: "12:00",
        saidaAlmoco: "13:00",
        horasTrabalhadas: 8,
        horasExtras: 0,
        obra: {
          id: 1,
          nome: "Residencial Atlântica"
        },
        status: "normal"
      },
      {
        id: "2",
        funcionario: {
          id: 2,
          nome: "João Marcos Ferreira da Silva"
        },
        data: "2024-11-15",
        entrada: "08:15",
        saida: "17:30",
        entradaAlmoco: "12:00",
        saidaAlmoco: "13:00",
        horasTrabalhadas: 8.25,
        horasExtras: 0.25,
        obra: {
          id: 1,
          nome: "Residencial Atlântica"
        },
        status: "atraso"
      }
    ])

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
        aprovadoPor: "Ana Silva"
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
      }
    ])
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800'
      case 'inativo': return 'bg-gray-100 text-gray-800'
      case 'férias': return 'bg-blue-100 text-blue-800'
      case 'licença': return 'bg-yellow-100 text-yellow-800'
      case 'calculado': return 'bg-blue-100 text-blue-800'
      case 'pago': return 'bg-green-100 text-green-800'
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'normal': return 'bg-green-100 text-green-800'
      case 'atraso': return 'bg-yellow-100 text-yellow-800'
      case 'falta': return 'bg-red-100 text-red-800'
      case 'hora-extra': return 'bg-blue-100 text-blue-800'
      case 'solicitado': return 'bg-yellow-100 text-yellow-800'
      case 'aprovado': return 'bg-blue-100 text-blue-800'
      case 'rejeitado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo': return <UserCheck className="w-4 h-4" />
      case 'inativo': return <UserX className="w-4 h-4" />
      case 'férias': return <Calendar className="w-4 h-4" />
      case 'licença': return <AlertCircle className="w-4 h-4" />
      case 'calculado': return <Calculator className="w-4 h-4" />
      case 'pago': return <CheckCircle className="w-4 h-4" />
      case 'pendente': return <AlertCircle className="w-4 h-4" />
      case 'normal': return <CheckCircle className="w-4 h-4" />
      case 'atraso': return <AlertCircle className="w-4 h-4" />
      case 'falta': return <AlertCircle className="w-4 h-4" />
      case 'hora-extra': return <TrendingUp className="w-4 h-4" />
      case 'solicitado': return <AlertCircle className="w-4 h-4" />
      case 'aprovado': return <CheckCircle className="w-4 h-4" />
      case 'rejeitado': return <AlertCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleViewDetails = (funcionario: FuncionarioRH) => {
    window.location.href = `/dashboard/rh/${funcionario.id}`
  }

  const handleEdit = (funcionario: FuncionarioRH) => {
    window.location.href = `/dashboard/funcionarios/${funcionario.id}`
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

  const aprovarVale = async (valeId: string) => {
    setLoading(true)
    try {
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

  const handleEditFuncionario = (funcionario: FuncionarioRH) => {
    setSelectedFuncionario(funcionario)
    setIsEditFuncionarioDialogOpen(true)
  }

  const handleSaveFuncionario = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Funcionário Atualizado",
        description: "Informações do funcionário atualizadas com sucesso!",
      })
      setIsEditFuncionarioDialogOpen(false)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar funcionário",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditSalario = (salario: SalarioFuncionario) => {
    setSelectedSalario(salario)
    setIsEditSalarioDialogOpen(true)
  }

  const handleSaveSalario = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Salário Atualizado",
        description: "Salário atualizado com sucesso!",
      })
      setIsEditSalarioDialogOpen(false)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar salário",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddBeneficio = () => {
    setSelectedBeneficio(null)
    setIsEditBeneficioDialogOpen(true)
  }

  const handleEditBeneficio = (beneficio: any) => {
    setSelectedBeneficio(beneficio)
    setIsEditBeneficioDialogOpen(true)
  }

  const handleDeleteBeneficio = async (beneficioId: string) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Benefício Removido",
        description: "Benefício removido com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover benefício",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBeneficio = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: selectedBeneficio ? "Benefício Atualizado" : "Benefício Adicionado",
        description: selectedBeneficio ? "Benefício atualizado com sucesso!" : "Benefício adicionado com sucesso!",
      })
      setIsEditBeneficioDialogOpen(false)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar benefício",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditPonto = (ponto: PontoRegistro) => {
    setSelectedPonto(ponto)
    setIsEditPontoDialogOpen(true)
  }

  const handleDeletePonto = async (pontoId: string) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Ponto Removido",
        description: "Registro de ponto removido com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover ponto",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePonto = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: selectedPonto ? "Ponto Atualizado" : "Ponto Adicionado",
        description: selectedPonto ? "Registro de ponto atualizado com sucesso!" : "Registro de ponto adicionado com sucesso!",
      })
      setIsEditPontoDialogOpen(false)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar ponto",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUploadDocumento = () => {
    setIsUploadDocumentoDialogOpen(true)
  }

  const handleSaveDocumento = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Documento Enviado",
        description: "Documento enviado com sucesso!",
      })
      setIsUploadDocumentoDialogOpen(false)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar documento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const exportarRelatorio = () => {
    toast({
      title: "Exportar",
      description: "Iniciando exportação do relatório...",
    })
  }

  const filteredFuncionarios = funcionarios.filter(funcionario => {
    const matchesNome = !filtroNome || funcionario.nome.toLowerCase().includes(filtroNome.toLowerCase())
    const matchesCargo = filtroCargo === "all" || funcionario.cargo.toLowerCase().includes(filtroCargo.toLowerCase())
    const matchesStatus = filtroStatus === "all" || funcionario.status === filtroStatus
    return matchesNome && matchesCargo && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recursos Humanos</h1>
          <p className="text-gray-600">Gestão completa de funcionários, salários, pontos e benefícios</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportarRelatorio}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Funcionário
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
                <p className="text-2xl font-bold text-gray-900">{funcionarios.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <Users className="w-6 h-6 text-white" />
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
                  {pontos.reduce((acc, p) => acc + p.horasTrabalhadas, 0)}h
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
                <p className="text-sm font-medium text-gray-600">Total Salários</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {salarios.reduce((acc, s) => acc + s.totalProventos, 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <DollarSign className="w-6 h-6 text-white" />
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
              <div className="p-3 rounded-full bg-orange-500">
                <Gift className="w-6 h-6 text-white" />
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
              <Label htmlFor="nome">Nome</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="nome"
                  placeholder="Nome do funcionário..."
                  value={filtroNome}
                  onChange={(e) => setFiltroNome(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cargo">Cargo</Label>
              <Select value={filtroCargo} onValueChange={setFiltroCargo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Cargos</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="sinaleiro">Sinaleiro</SelectItem>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="mecanico">Mecânico</SelectItem>
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
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="férias">Férias</SelectItem>
                  <SelectItem value="licença">Licença</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFiltroNome("")
                  setFiltroCargo("all")
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

      {/* Tabs Principais */}
      <Tabs defaultValue="funcionarios" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="salarios">Salários</TabsTrigger>
          <TabsTrigger value="pontos">Pontos</TabsTrigger>
          <TabsTrigger value="vales">Vales</TabsTrigger>
          <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
          <TabsTrigger value="custos">Custos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        {/* Tab Funcionários */}
        <TabsContent value="funcionarios" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFuncionarios.map((funcionario) => (
                <Card key={funcionario.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={`/api/avatar/${funcionario.id}`} />
                          <AvatarFallback className="bg-blue-100 text-blue-800">
                            {getInitials(funcionario.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {funcionario.nome}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {funcionario.email || '-'}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(funcionario.status)} border`}>
                        {getStatusIcon(funcionario.status)}
                        <span className="ml-1">{funcionario.status}</span>
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Shield className="w-4 h-4" />
                        <span>{funcionario.cargo}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span>{funcionario.obra_atual || 'Sem obra'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Admissão: {format(new Date(funcionario.data_admissao), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(funcionario)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(funcionario)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Funcionário</TableHead>
                      <TableHead className="w-[150px]">Cargo</TableHead>
                      <TableHead className="w-[120px]">Departamento</TableHead>
                      <TableHead className="w-[180px]">Obra Atual</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[100px]">Admissão</TableHead>
                      <TableHead className="w-[120px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFuncionarios.map((funcionario) => (
                      <TableRow key={funcionario.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={`/api/avatar/${funcionario.id}`} />
                              <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                                {getInitials(funcionario.nome)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="max-w-[100px]">
                              <div className="font-medium truncate">{funcionario.nome}</div>
                              <div className="text-sm text-gray-500 truncate">{funcionario.email || '-'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(funcionario.cargo)} border`}>
                            {getStatusIcon(funcionario.cargo)}
                            <span className="ml-1">{funcionario.cargo}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>{funcionario.departamento}</TableCell>
                        <TableCell>{funcionario.obra_atual || '-'}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(funcionario.status)} border`}>
                            {getStatusIcon(funcionario.status)}
                            <span className="ml-1">{funcionario.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(funcionario.data_admissao), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(funcionario)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditFuncionario(funcionario)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleUploadDocumento}
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Salários */}
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
                  {salarios.map((salario) => (
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
                          <div className="text-orange-600">R$ {salario.valorHoraExtra.toFixed(2)}/h</div>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSalario(salario)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
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

        {/* Tab Pontos */}
        <TabsContent value="pontos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Horas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {pontos.reduce((acc, p) => acc + p.horasTrabalhadas, 0)}h
                    </p>
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
                    <p className="text-sm font-medium text-gray-600">Horas Extras</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {pontos.reduce((acc, p) => acc + p.horasExtras, 0)}h
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
                    <p className="text-sm font-medium text-gray-600">Atrasos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {pontos.filter(p => p.status === 'atraso').length}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-red-500">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registros de Ponto</CardTitle>
              <CardDescription>Controle de frequência e horas trabalhadas</CardDescription>
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
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ...pontos,
                    {
                      id: "3",
                      funcionario: {
                        id: 3,
                        nome: "Ana Paula"
                      },
                      data: "2024-11-15",
                      entrada: "08:00",
                      saida: "17:00",
                      entradaAlmoco: "12:00",
                      saidaAlmoco: "13:00",
                      horasTrabalhadas: 8,
                      horasExtras: 0,
                      obra: {
                        id: 2,
                        nome: "Shopping Center"
                      },
                      status: "normal"
                    },
                    {
                      id: "4",
                      funcionario: {
                        id: 4,
                        nome: "Roberto Silva"
                      },
                      data: "2024-11-15",
                      entrada: "08:30",
                      saida: "17:30",
                      entradaAlmoco: "12:00",
                      saidaAlmoco: "13:00",
                      horasTrabalhadas: 8,
                      horasExtras: 0.5,
                      obra: {
                        id: 1,
                        nome: "Residencial Atlântica"
                      },
                      status: "atraso"
                    }
                  ].map((ponto) => (
                    <TableRow key={ponto.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={`/api/avatar/${ponto.funcionario.id}`} />
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                              {getInitials(ponto.funcionario.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{ponto.funcionario.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(ponto.data), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{ponto.entrada}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{ponto.saida}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {ponto.entradaAlmoco && ponto.saidaAlmoco 
                            ? `${ponto.entradaAlmoco} - ${ponto.saidaAlmoco}`
                            : '-'
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{ponto.horasTrabalhadas}h</div>
                          {ponto.horasExtras > 0 && (
                            <div className="text-orange-600">+{ponto.horasExtras}h extra</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Building2 className="w-3 h-3" />
                          <span>{ponto.obra?.nome || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(ponto.status)} border`}>
                          {getStatusIcon(ponto.status)}
                          <span className="ml-1">{ponto.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPonto(ponto)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePonto(ponto.id)}
                          >
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

        {/* Tab Vales */}
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
                  {vales.map((vale) => (
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
                        <Badge className="bg-blue-100 text-blue-800 border">
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

        {/* Tab Benefícios */}
        <TabsContent value="beneficios" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Benefícios dos Funcionários</CardTitle>
                  <CardDescription>Gestão de benefícios oferecidos aos funcionários</CardDescription>
                </div>
                <Button onClick={handleAddBeneficio}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Benefício
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      Plano de Saúde
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Valor Mensal:</span>
                        <span className="font-semibold">R$ 200,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Funcionários:</span>
                        <span className="font-semibold">15</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      Vale Refeição
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Valor Mensal:</span>
                        <span className="font-semibold">R$ 300,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Funcionários:</span>
                        <span className="font-semibold">25</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      Vale Transporte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Valor Mensal:</span>
                        <span className="font-semibold">R$ 150,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Funcionários:</span>
                        <span className="font-semibold">30</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Custos */}
        <TabsContent value="custos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Custo Total RH</p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ 45.000,00
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-500">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Salários</p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ 35.000,00
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-500">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Benefícios</p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ 8.500,00
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-500">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Outros Custos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      R$ 1.500,00
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-500">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento de Custos</CardTitle>
                <CardDescription>Breakdown dos custos por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Salários Base</span>
                    <span className="font-semibold">R$ 30.000,00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Horas Extras</span>
                    <span className="font-semibold">R$ 5.000,00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Plano de Saúde</span>
                    <span className="font-semibold">R$ 3.000,00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vale Transporte</span>
                    <span className="font-semibold">R$ 4.500,00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vale Refeição</span>
                    <span className="font-semibold">R$ 1.000,00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Treinamentos</span>
                    <span className="font-semibold">R$ 1.500,00</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custos por Funcionário</CardTitle>
                <CardDescription>Distribuição de custos individuais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { nome: "Carlos Eduardo Menezes", cargo: "Supervisor", custo: "R$ 8.500,00" },
                    { nome: "João Marcos Ferreira da Silva", cargo: "Sinaleiro", custo: "R$ 6.200,00" },
                    { nome: "Ana Paula", cargo: "Supervisor", custo: "R$ 7.800,00" },
                    { nome: "Roberto Silva", cargo: "Técnico", custo: "R$ 5.500,00" },
                    { nome: "TESTE DEV 2409", cargo: "Mecânico", custo: "R$ 4.800,00" }
                  ].map((funcionario, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium">{funcionario.nome}</span>
                        <p className="text-xs text-gray-500">{funcionario.cargo}</p>
                      </div>
                      <span className="font-semibold">{funcionario.custo}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolução de Custos</CardTitle>
              <CardDescription>Histórico mensal de custos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead>Salários</TableHead>
                    <TableHead>Benefícios</TableHead>
                    <TableHead>Outros</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Variação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { mes: "2024-11", salarios: 35000, beneficios: 8500, outros: 1500, total: 45000, variacao: "+5%" },
                    { mes: "2024-10", salarios: 33000, beneficios: 8000, outros: 1200, total: 42200, variacao: "+2%" },
                    { mes: "2024-09", salarios: 32000, beneficios: 7500, outros: 1000, total: 40500, variacao: "-1%" },
                    { mes: "2024-08", salarios: 32500, beneficios: 7800, outros: 1100, total: 41400, variacao: "+3%" }
                  ].map((custo, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <span className="font-medium">{custo.mes}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">R$ {custo.salarios.toLocaleString('pt-BR')}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">R$ {custo.beneficios.toLocaleString('pt-BR')}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">R$ {custo.outros.toLocaleString('pt-BR')}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold">R$ {custo.total.toLocaleString('pt-BR')}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          custo.variacao.startsWith('+') ? 'bg-green-100 text-green-800' :
                          custo.variacao.startsWith('-') ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {custo.variacao}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Histórico */}
        <TabsContent value="historico" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Eventos</CardTitle>
              <CardDescription>Timeline de eventos e mudanças dos funcionários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    data: "2024-11-15",
                    evento: "Admissão",
                    funcionario: "Carlos Eduardo Menezes",
                    descricao: "Funcionário admitido como Supervisor",
                    tipo: "admissao",
                    status: "concluido"
                  },
                  {
                    id: 2,
                    data: "2024-11-10",
                    evento: "Promoção",
                    funcionario: "João Marcos Ferreira da Silva",
                    descricao: "Promovido de Operador para Sinaleiro",
                    tipo: "promocao",
                    status: "concluido"
                  },
                  {
                    id: 3,
                    data: "2024-11-08",
                    evento: "Alteração Salarial",
                    funcionario: "Ana Paula",
                    descricao: "Aumento salarial de R$ 4.000 para R$ 4.500",
                    tipo: "salario",
                    status: "concluido"
                  },
                  {
                    id: 4,
                    data: "2024-11-05",
                    evento: "Férias",
                    funcionario: "Roberto Silva",
                    descricao: "Início das férias de 30 dias",
                    tipo: "ferias",
                    status: "em-andamento"
                  },
                  {
                    id: 5,
                    data: "2024-11-01",
                    evento: "Treinamento",
                    funcionario: "TESTE DEV 2409",
                    descricao: "Concluído treinamento de segurança",
                    tipo: "treinamento",
                    status: "concluido"
                  }
                ].map((evento) => (
                  <div key={evento.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        evento.status === 'concluido' ? 'bg-green-500' : 
                        evento.status === 'em-andamento' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{evento.evento}</h4>
                        <Badge className={
                          evento.tipo === 'admissao' ? 'bg-green-100 text-green-800' :
                          evento.tipo === 'promocao' ? 'bg-blue-100 text-blue-800' :
                          evento.tipo === 'salario' ? 'bg-purple-100 text-purple-800' :
                          evento.tipo === 'ferias' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {evento.tipo}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{evento.descricao}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {evento.funcionario}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(evento.data), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Relatórios */}
        <TabsContent value="relatorios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Relatórios Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Relatório de Funcionários
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Relatório de Salários
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Clock className="w-4 h-4 mr-2" />
                    Relatório de Pontos
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Gift className="w-4 h-4 mr-2" />
                    Relatório de Vales
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Funcionários Ativos</span>
                    <span className="font-semibold text-green-600">
                      {funcionarios.filter(f => f.status === 'ativo').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total de Horas</span>
                    <span className="font-semibold text-blue-600">
                      {pontos.reduce((acc, p) => acc + p.horasTrabalhadas, 0)}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vales Pendentes</span>
                    <span className="font-semibold text-yellow-600">
                      {vales.filter(v => v.status === 'solicitado').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Edição de Funcionário */}
      <Dialog open={isEditFuncionarioDialogOpen} onOpenChange={setIsEditFuncionarioDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome Completo</Label>
                <Input id="nome" defaultValue={selectedFuncionario?.nome} />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" defaultValue={selectedFuncionario?.cpf} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cargo">Cargo</Label>
                <Input id="cargo" defaultValue={selectedFuncionario?.cargo} />
              </div>
              <div>
                <Label htmlFor="departamento">Departamento</Label>
                <Input id="departamento" defaultValue={selectedFuncionario?.departamento} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salario">Salário</Label>
                <Input id="salario" type="number" defaultValue={selectedFuncionario?.salario} />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" defaultValue={selectedFuncionario?.telefone} />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={selectedFuncionario?.email} />
            </div>
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" defaultValue={selectedFuncionario?.endereco} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" defaultValue={selectedFuncionario?.cidade} />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input id="estado" defaultValue={selectedFuncionario?.estado} />
              </div>
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input id="cep" defaultValue={selectedFuncionario?.cep} />
              </div>
            </div>
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" defaultValue={selectedFuncionario?.observacoes} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditFuncionarioDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveFuncionario} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Salário */}
      <Dialog open={isEditSalarioDialogOpen} onOpenChange={setIsEditSalarioDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Salário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salarioBase">Salário Base</Label>
                <Input id="salarioBase" type="number" defaultValue={selectedSalario?.salarioBase} />
              </div>
              <div>
                <Label htmlFor="horasTrabalhadas">Horas Trabalhadas</Label>
                <Input id="horasTrabalhadas" type="number" defaultValue={selectedSalario?.horasTrabalhadas} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="horasExtras">Horas Extras</Label>
                <Input id="horasExtras" type="number" defaultValue={selectedSalario?.horasExtras} />
              </div>
              <div>
                <Label htmlFor="valorHoraExtra">Valor Hora Extra</Label>
                <Input id="valorHoraExtra" type="number" defaultValue={selectedSalario?.valorHoraExtra} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalProventos">Total Proventos</Label>
                <Input id="totalProventos" type="number" defaultValue={selectedSalario?.totalProventos} />
              </div>
              <div>
                <Label htmlFor="totalDescontos">Total Descontos</Label>
                <Input id="totalDescontos" type="number" defaultValue={selectedSalario?.totalDescontos} />
              </div>
            </div>
            <div>
              <Label htmlFor="salarioLiquido">Salário Líquido</Label>
              <Input id="salarioLiquido" type="number" defaultValue={selectedSalario?.salarioLiquido} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditSalarioDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveSalario} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Benefício */}
      <Dialog open={isEditBeneficioDialogOpen} onOpenChange={setIsEditBeneficioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBeneficio ? 'Editar Benefício' : 'Novo Benefício'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tipoBeneficio">Tipo de Benefício</Label>
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
              <Label htmlFor="descricaoBeneficio">Descrição</Label>
              <Input id="descricaoBeneficio" placeholder="Descrição do benefício" />
            </div>
            <div>
              <Label htmlFor="valorBeneficio">Valor (R$)</Label>
              <Input id="valorBeneficio" type="number" placeholder="0.00" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditBeneficioDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveBeneficio} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Ponto */}
      <Dialog open={isEditPontoDialogOpen} onOpenChange={setIsEditPontoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPonto ? 'Editar Ponto' : 'Novo Ponto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataPonto">Data</Label>
                <Input id="dataPonto" type="date" defaultValue={selectedPonto?.data} />
              </div>
              <div>
                <Label htmlFor="funcionarioPonto">Funcionário</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios.map((func) => (
                      <SelectItem key={func.id} value={func.id.toString()}>
                        {func.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entradaPonto">Entrada</Label>
                <Input id="entradaPonto" type="time" defaultValue={selectedPonto?.entrada} />
              </div>
              <div>
                <Label htmlFor="saidaPonto">Saída</Label>
                <Input id="saidaPonto" type="time" defaultValue={selectedPonto?.saida} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entradaAlmoco">Entrada Almoço</Label>
                <Input id="entradaAlmoco" type="time" defaultValue={selectedPonto?.entradaAlmoco} />
              </div>
              <div>
                <Label htmlFor="saidaAlmoco">Saída Almoço</Label>
                <Input id="saidaAlmoco" type="time" defaultValue={selectedPonto?.saidaAlmoco} />
              </div>
            </div>
            <div>
              <Label htmlFor="observacoesPonto">Observações</Label>
              <Textarea id="observacoesPonto" placeholder="Observações sobre o ponto" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditPontoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePonto} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Upload de Documento */}
      <Dialog open={isUploadDocumentoDialogOpen} onOpenChange={setIsUploadDocumentoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rg">RG</SelectItem>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="ctps">CTPS</SelectItem>
                  <SelectItem value="pis">PIS</SelectItem>
                  <SelectItem value="titulo-eleitor">Título de Eleitor</SelectItem>
                  <SelectItem value="certificado-reservista">Certificado de Reservista</SelectItem>
                  <SelectItem value="comprovante-residencia">Comprovante de Residência</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nomeDocumento">Nome do Documento</Label>
              <Input id="nomeDocumento" placeholder="Nome do documento" />
            </div>
            <div>
              <Label htmlFor="numeroDocumento">Número</Label>
              <Input id="numeroDocumento" placeholder="Número do documento" />
            </div>
            <div>
              <Label htmlFor="arquivoDocumento">Arquivo</Label>
              <Input id="arquivoDocumento" type="file" accept=".pdf,.jpg,.jpeg,.png" />
            </div>
            <div>
              <Label htmlFor="observacoesDocumento">Observações</Label>
              <Textarea id="observacoesDocumento" placeholder="Observações sobre o documento" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUploadDocumentoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveDocumento} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}