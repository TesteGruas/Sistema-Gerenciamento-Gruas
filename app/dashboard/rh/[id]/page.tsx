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
import { apiRH } from "@/lib/api-rh"

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
  const [salarios, setSalarios] = useState<SalarioDetalhado[]>([])
  const [beneficios, setBeneficios] = useState<BeneficioFuncionario[]>([])
  const [documentos, setDocumentos] = useState<DocumentoFuncionario[]>([])
  const [pontos, setPontos] = useState<PontoDetalhado[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)

  // Dados mockados para demonstração
  useEffect(() => {
    const funcionarioId = params.id as string
    
    // Simular carregamento
    setTimeout(() => {
      setFuncionario({
        id: parseInt(funcionarioId),
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
      })

      setSalarios([
        {
          id: 1,
          mes: "2024-11",
          salarioBase: 5000,
          horasTrabalhadas: 176,
          horasExtras: 8,
          valorHoraExtra: 28.41,
          totalProventos: 5227.28,
          totalDescontos: 1045.46,
          salarioLiquido: 4181.82,
          status: "pago",
          dataPagamento: "2024-11-05",
          descontos: {
            inss: 550.00,
            irrf: 0,
            valeTransporte: 300.00,
            valeRefeicao: 195.46,
            outros: 0
          }
        },
        {
          id: 2,
          mes: "2024-10",
          salarioBase: 5000,
          horasTrabalhadas: 176,
          horasExtras: 4,
          valorHoraExtra: 28.41,
          totalProventos: 5113.64,
          totalDescontos: 1022.73,
          salarioLiquido: 4090.91,
          status: "pago",
          dataPagamento: "2024-10-05",
          descontos: {
            inss: 550.00,
            irrf: 0,
            valeTransporte: 300.00,
            valeRefeicao: 172.73,
            outros: 0
          }
        }
      ])

      setBeneficios([
        {
          id: "1",
          tipo: "plano-saude",
          descricao: "Plano de Saúde Unimed",
          valor: 200.00,
          dataInicio: "2024-10-01",
          ativo: true,
          observacoes: "Cobertura nacional"
        },
        {
          id: "2",
          tipo: "plano-odonto",
          descricao: "Plano Odontológico",
          valor: 50.00,
          dataInicio: "2024-10-01",
          ativo: true
        },
        {
          id: "3",
          tipo: "vale-transporte",
          descricao: "Vale Transporte",
          valor: 300.00,
          dataInicio: "2024-10-01",
          ativo: true
        }
      ])

      setDocumentos([
        {
          id: "1",
          tipo: "rg",
          nome: "Registro Geral",
          numero: "12.345.678-9",
          dataEmissao: "2020-01-15",
          dataVencimento: "2030-01-15"
        },
        {
          id: "2",
          tipo: "cpf",
          nome: "CPF",
          numero: "123.456.789-00",
          dataEmissao: "2018-03-10"
        },
        {
          id: "3",
          tipo: "ctps",
          nome: "Carteira de Trabalho",
          numero: "123456789",
          dataEmissao: "2019-05-20"
        }
      ])

      setPontos([
        {
          id: "1",
          data: "2024-11-15",
          entrada: "08:00",
          saida: "17:00",
          entradaAlmoco: "12:00",
          saidaAlmoco: "13:00",
          horasTrabalhadas: 8,
          horasExtras: 0,
          obra: "Residencial Atlântica",
          status: "normal"
        },
        {
          id: "2",
          data: "2024-11-14",
          entrada: "08:00",
          saida: "18:00",
          entradaAlmoco: "12:00",
          saidaAlmoco: "13:00",
          horasTrabalhadas: 8,
          horasExtras: 1,
          obra: "Residencial Atlântica",
          status: "hora-extra"
        }
      ])

      setLoading(false)
    }, 1000)
  }, [params.id])

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
            <p className="text-gray-600">{funcionario.cargo} • {funcionario.departamento}</p>
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
                    <p className="text-sm">{funcionario.departamento}</p>
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
                    <p className="text-sm">{format(new Date(funcionario.data_admissao), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Salário</Label>
                    <p className="text-sm font-semibold">R$ {funcionario.salario.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Obra Atual</Label>
                    <p className="text-sm">{funcionario.obra_atual || 'Sem obra'}</p>
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