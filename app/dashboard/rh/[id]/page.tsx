"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft, 
  Edit, 
  User,
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  UserCheck,
  UserX,
  Building2,
  Shield,
  DollarSign,
  Clock,
  FileText,
  Briefcase,
  History,
  Award,
  AlertCircle,
  Loader2,
  Calculator,
  Gift,
  Download,
  Upload,
  Eye,
  Plus,
  Trash2,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { funcionariosApi } from "@/lib/api-funcionarios"

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
  status: 'Ativo' | 'Inativo' | 'Afastado' | 'Demitido'
  turno?: 'Manhã' | 'Tarde' | 'Noite' | 'Integral'
  observacoes?: string
  created_at: string
  updated_at: string
  usuario?: {
    id: number
    nome: string
    email: string
    status: string
  }
  obra_atual?: {
    id: number
    nome: string
    status: string
    cliente: {
      nome: string
    }
  }
}

interface SalarioDetalhado {
  id: number
  mes: string
  salarioBase: number
  horasTrabalhadas: number
  horasExtras: number
  valorHoraExtra: number
  totalProventos: number
  totalDescontos: number
  salarioLiquido: number
  status: 'calculado' | 'pago' | 'pendente'
  dataPagamento?: string
  descontos: {
    inss: number
    irrf: number
    valeTransporte: number
    valeRefeicao: number
    outros: number
  }
}

interface BeneficioFuncionario {
  id: string
  tipo: 'plano-saude' | 'plano-odonto' | 'seguro-vida' | 'vale-transporte' | 'vale-refeicao' | 'outros'
  descricao: string
  valor: number
  dataInicio: string
  dataFim?: string
  ativo: boolean
  observacoes?: string
}

interface DocumentoFuncionario {
  id: string
  tipo: 'rg' | 'cpf' | 'ctps' | 'pis' | 'titulo-eleitor' | 'certificado-reservista' | 'comprovante-residencia' | 'outros'
  nome: string
  numero: string
  dataEmissao: string
  dataVencimento?: string
  arquivo?: string
  observacoes?: string
}

interface PontoDetalhado {
  id: string
  data: string
  entrada: string
  saida: string
  entradaAlmoco?: string
  saidaAlmoco?: string
  horasTrabalhadas: number
  horasExtras: number
  obra?: string
  status: 'normal' | 'atraso' | 'falta' | 'hora-extra'
  observacoes?: string
}

export default function FuncionarioDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [funcionario, setFuncionario] = useState<FuncionarioRH | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)

  // Dados mockados
  const [salarios] = useState<SalarioDetalhado[]>([
    {
      id: 1,
      mes: 'Outubro/2024',
      salarioBase: 3500,
      horasTrabalhadas: 220,
      horasExtras: 20,
      valorHoraExtra: 25.50,
      totalProventos: 4010,
      totalDescontos: 890.50,
      salarioLiquido: 3119.50,
      status: 'pago',
      dataPagamento: '2024-10-05',
      descontos: {
        inss: 385,
        irrf: 125.50,
        valeTransporte: 280,
        valeRefeicao: 100,
        outros: 0
      }
    },
    {
      id: 2,
      mes: 'Setembro/2024',
      salarioBase: 3500,
      horasTrabalhadas: 220,
      horasExtras: 15,
      valorHoraExtra: 25.50,
      totalProventos: 3882.50,
      totalDescontos: 890.50,
      salarioLiquido: 2992,
      status: 'pago',
      dataPagamento: '2024-09-05',
      descontos: {
        inss: 385,
        irrf: 125.50,
        valeTransporte: 280,
        valeRefeicao: 100,
        outros: 0
      }
    },
    {
      id: 3,
      mes: 'Agosto/2024',
      salarioBase: 3500,
      horasTrabalhadas: 220,
      horasExtras: 25,
      valorHoraExtra: 25.50,
      totalProventos: 4137.50,
      totalDescontos: 890.50,
      salarioLiquido: 3247,
      status: 'pago',
      dataPagamento: '2024-08-05',
      descontos: {
        inss: 385,
        irrf: 125.50,
        valeTransporte: 280,
        valeRefeicao: 100,
        outros: 0
      }
    }
  ])

  const [beneficios] = useState<BeneficioFuncionario[]>([
    {
      id: '1',
      tipo: 'plano-saude',
      descricao: 'Plano de Saúde Unimed - Enfermaria',
      valor: 450,
      dataInicio: '2024-01-01',
      ativo: true,
      observacoes: 'Plano familiar com 2 dependentes'
    },
    {
      id: '2',
      tipo: 'vale-transporte',
      descricao: 'Vale Transporte',
      valor: 280,
      dataInicio: '2024-01-01',
      ativo: true
    },
    {
      id: '3',
      tipo: 'vale-refeicao',
      descricao: 'Vale Refeição Ticket',
      valor: 100,
      dataInicio: '2024-01-01',
      ativo: true
    },
    {
      id: '4',
      tipo: 'seguro-vida',
      descricao: 'Seguro de Vida em Grupo',
      valor: 50,
      dataInicio: '2024-01-01',
      ativo: true,
      observacoes: 'Cobertura de R$ 100.000'
    }
  ])

  const [documentos] = useState<DocumentoFuncionario[]>([
    {
      id: '1',
      tipo: 'rg',
      nome: 'RG',
      numero: '12.345.678-9',
      dataEmissao: '2015-05-10',
      observacoes: 'SSP/PE'
    },
    {
      id: '2',
      tipo: 'cpf',
      nome: 'CPF',
      numero: '123.456.789-00',
      dataEmissao: '2000-01-01'
    },
    {
      id: '3',
      tipo: 'ctps',
      nome: 'Carteira de Trabalho',
      numero: '987654/001-2',
      dataEmissao: '2018-03-15',
      observacoes: 'Digital'
    },
    {
      id: '4',
      tipo: 'pis',
      nome: 'PIS/PASEP',
      numero: '123.45678.90-1',
      dataEmissao: '2018-03-20'
    },
    {
      id: '5',
      tipo: 'comprovante-residencia',
      nome: 'Comprovante de Residência',
      numero: 'Conta de Luz',
      dataEmissao: '2024-10-01',
      observacoes: 'Atualizado mensalmente'
    }
  ])

  const [pontos] = useState<PontoDetalhado[]>([
    {
      id: '1',
      data: '2024-10-08',
      entrada: '08:00',
      saida: '17:00',
      entradaAlmoco: '12:00',
      saidaAlmoco: '13:00',
      horasTrabalhadas: 8,
      horasExtras: 0,
      obra: 'Edifício Centro',
      status: 'normal'
    },
    {
      id: '2',
      data: '2024-10-07',
      entrada: '08:00',
      saida: '18:30',
      entradaAlmoco: '12:00',
      saidaAlmoco: '13:00',
      horasTrabalhadas: 9.5,
      horasExtras: 1.5,
      obra: 'Edifício Centro',
      status: 'hora-extra'
    },
    {
      id: '3',
      data: '2024-10-06',
      entrada: '08:15',
      saida: '17:00',
      entradaAlmoco: '12:00',
      saidaAlmoco: '13:00',
      horasTrabalhadas: 7.75,
      horasExtras: 0,
      obra: 'Edifício Centro',
      status: 'atraso',
      observacoes: 'Atraso de 15 minutos justificado'
    },
    {
      id: '4',
      data: '2024-10-05',
      entrada: '08:00',
      saida: '17:00',
      entradaAlmoco: '12:00',
      saidaAlmoco: '13:00',
      horasTrabalhadas: 8,
      horasExtras: 0,
      obra: 'Shopping Sul',
      status: 'normal'
    },
    {
      id: '5',
      data: '2024-10-04',
      entrada: '08:00',
      saida: '19:00',
      entradaAlmoco: '12:00',
      saidaAlmoco: '13:00',
      horasTrabalhadas: 10,
      horasExtras: 2,
      obra: 'Shopping Sul',
      status: 'hora-extra'
    }
  ])

  // Carregar dados reais do funcionário
  useEffect(() => {
    const carregarFuncionario = async () => {
      try {
        setLoading(true)
        const funcionarioId = parseInt(params.id as string)
        const response = await funcionariosApi.obterFuncionario(funcionarioId)
        
        if (response.success && response.data) {
          const func = response.data
          
          // Mapear dados do backend para o formato esperado
          const funcionarioMapeado: FuncionarioRH = {
            id: func.id,
            nome: func.nome,
            cpf: func.cpf || '',
            cargo: func.cargo,
            departamento: func.departamento || '',
            salario: func.salario || 0,
            data_admissao: func.data_admissao || '',
            telefone: func.telefone,
            email: func.email,
            endereco: func.endereco,
            cidade: func.cidade,
            estado: func.estado,
            cep: func.cep,
            status: func.status,
            turno: func.turno as any,
            observacoes: func.observacoes,
            created_at: func.created_at,
            updated_at: func.updated_at,
            usuario: func.usuario && func.usuario.length > 0 ? func.usuario[0] : undefined,
            obra_atual: func.obra_atual || undefined
          }
          
          setFuncionario(funcionarioMapeado)
        } else {
          throw new Error('Funcionário não encontrado')
        }
        
      } catch (error) {
        console.error('Erro ao carregar funcionário:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do funcionário",
          variant: "destructive"
        })
        router.push('/dashboard/rh')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      carregarFuncionario()
    }
  }, [params.id, toast, router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800'
      case 'Inativo': return 'bg-gray-100 text-gray-800'
      case 'Afastado': return 'bg-yellow-100 text-yellow-800'
      case 'Demitido': return 'bg-red-100 text-red-800'
      case 'calculado': return 'bg-blue-100 text-blue-800'
      case 'pago': return 'bg-green-100 text-green-800'
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'normal': return 'bg-green-100 text-green-800'
      case 'atraso': return 'bg-yellow-100 text-yellow-800'
      case 'falta': return 'bg-red-100 text-red-800'
      case 'hora-extra': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ativo': return <UserCheck className="w-4 h-4" />
      case 'Inativo': return <UserX className="w-4 h-4" />
      case 'Afastado': return <AlertCircle className="w-4 h-4" />
      case 'Demitido': return <UserX className="w-4 h-4" />
      case 'calculado': return <Calculator className="w-4 h-4" />
      case 'pago': return <CheckCircle className="w-4 h-4" />
      case 'pendente': return <AlertCircle className="w-4 h-4" />
      case 'normal': return <CheckCircle className="w-4 h-4" />
      case 'atraso': return <AlertCircle className="w-4 h-4" />
      case 'falta': return <AlertCircle className="w-4 h-4" />
      case 'hora-extra': return <TrendingUp className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getTipoDocumentoColor = (tipo: string) => {
    switch (tipo) {
      case 'rg': return 'bg-blue-100 text-blue-800'
      case 'cpf': return 'bg-green-100 text-green-800'
      case 'ctps': return 'bg-purple-100 text-purple-800'
      case 'pis': return 'bg-orange-100 text-orange-800'
      case 'titulo-eleitor': return 'bg-red-100 text-red-800'
      case 'certificado-reservista': return 'bg-yellow-100 text-yellow-800'
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

  const handleEdit = () => {
    setIsEditMode(!isEditMode)
    toast({
      title: isEditMode ? "Modo Visualização" : "Modo Edição",
      description: isEditMode ? "Alterações canceladas" : "Agora você pode editar as informações",
    })
  }

  const handleSave = () => {
    setIsEditMode(false)
    toast({
      title: "Salvo",
      description: "Informações atualizadas com sucesso!",
    })
  }

  const calcularSalario = async () => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Carregando informações do funcionário...</p>
        </div>
      </div>
    )
  }

  if (!funcionario) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">Funcionário não encontrado</h2>
        <p className="text-gray-600 mb-4">O funcionário solicitado não foi encontrado.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{funcionario.nome}</h1>
            <p className="text-gray-600">{funcionario.cargo}{funcionario.departamento ? ` • ${funcionario.departamento}` : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            {isEditMode ? 'Cancelar' : 'Editar'}
          </Button>
          {isEditMode && (
            <Button onClick={handleSave}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          )}
        </div>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={`/api/avatar/${funcionario.id}`} />
              <AvatarFallback className="bg-blue-100 text-blue-800 text-xl">
                {getInitials(funcionario.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nome Completo</Label>
                    <p className="text-lg font-semibold">{funcionario.nome}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">CPF</Label>
                    <p className="text-sm">{funcionario.cpf}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Cargo</Label>
                    <p className="text-sm">{funcionario.cargo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Departamento</Label>
                    <p className="text-sm">{funcionario.departamento || '-'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div className="mt-1">
                      <Badge className={`${getStatusColor(funcionario.status)} border`}>
                        {getStatusIcon(funcionario.status)}
                        <span className="ml-1">{funcionario.status}</span>
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Data de Admissão</Label>
                    <p className="text-sm">{funcionario.data_admissao ? format(new Date(funcionario.data_admissao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Salário</Label>
                    <p className="text-sm font-semibold">R$ {(funcionario.salario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Obra Atual</Label>
                    <p className="text-sm">{funcionario.obra_atual?.nome || 'Sem obra'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Usuário do Sistema</Label>
                    <div className="flex items-center gap-2">
                      {funcionario.usuario ? (
                        <>
                          <UserCheck className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">{funcionario.usuario.email}</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Sem usuário</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Detalhes */}
      <Tabs defaultValue="informacoes" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="salarios">Salários</TabsTrigger>
          <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="pontos">Pontos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* Tab Informações */}
        <TabsContent value="informacoes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm">{funcionario.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                  <p className="text-sm">{funcionario.telefone || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                  <p className="text-sm">{funcionario.endereco || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cidade/Estado</Label>
                  <p className="text-sm">{funcionario.cidade || '-'} / {funcionario.estado || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">CEP</Label>
                  <p className="text-sm">{funcionario.cep || '-'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Dados Profissionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Turno</Label>
                  <p className="text-sm">{funcionario.turno || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Observações</Label>
                  <p className="text-sm">{funcionario.observacoes || '-'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Salários */}
        <TabsContent value="salarios" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Histórico de Salários</CardTitle>
                  <CardDescription>Controle de salários e pagamentos</CardDescription>
                </div>
                <Button onClick={calcularSalario} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                  Calcular Salário
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {salarios.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
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
                          <span className="font-medium">
                            {format(new Date(salario.mes + '-01'), 'MMM/yyyy', { locale: ptBR })}
                          </span>
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
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum registro de salário encontrado</p>
                  <p className="text-sm">Os dados de salários serão implementados em breve</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Benefícios */}
        <TabsContent value="beneficios" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Benefícios do Funcionário</CardTitle>
                  <CardDescription>Benefícios oferecidos ao funcionário</CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Benefício
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {beneficios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {beneficios.map((beneficio) => (
                    <Card key={beneficio.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Gift className="w-5 h-5" />
                          {beneficio.descricao}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Valor:</span>
                            <span className="font-semibold">R$ {beneficio.valor.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Data Início:</span>
                            <span className="text-sm">{format(new Date(beneficio.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <Badge className={beneficio.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {beneficio.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          {beneficio.observacoes && (
                            <div>
                              <span className="text-sm text-gray-600">Observações:</span>
                              <p className="text-sm">{beneficio.observacoes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum benefício cadastrado</p>
                  <p className="text-sm">Os benefícios serão implementados em breve</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Documentos */}
        <TabsContent value="documentos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Documentos do Funcionário</CardTitle>
                  <CardDescription>Documentos pessoais e profissionais</CardDescription>
                </div>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Novo Documento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documentos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Data Emissão</TableHead>
                      <TableHead>Data Vencimento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentos.map((documento) => (
                      <TableRow key={documento.id}>
                        <TableCell>
                          <Badge className={`${getTipoDocumentoColor(documento.tipo)} border`}>
                            {documento.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{documento.nome}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{documento.numero}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {format(new Date(documento.dataEmissao), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {documento.dataVencimento ? format(new Date(documento.dataVencimento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum documento cadastrado</p>
                  <p className="text-sm">Os documentos serão implementados em breve</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Pontos */}
        <TabsContent value="pontos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registros de Ponto</CardTitle>
              <CardDescription>Controle de frequência e horas trabalhadas</CardDescription>
            </CardHeader>
            <CardContent>
              {pontos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
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
                    {pontos.map((ponto) => (
                      <TableRow key={ponto.id}>
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
                            <span>{ponto.obra || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(ponto.status)} border`}>
                            {getStatusIcon(ponto.status)}
                            <span className="ml-1">{ponto.status}</span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum registro de ponto encontrado</p>
                  <p className="text-sm">Os registros de ponto serão implementados em breve</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Histórico */}
        <TabsContent value="historico" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Eventos</CardTitle>
              <CardDescription>Timeline de eventos e mudanças</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Histórico de eventos será implementado em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}