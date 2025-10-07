"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Edit, 
  CheckCircle,
  XCircle,
  Search,
  User,
  ArrowLeft,
  Download,
  Filter,
  AlertTriangle,
  Clock,
  FileText,
  AlertCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { rhApi, Ferias, Afastamento } from "@/lib/api-rh-completo"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function FeriasPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Estados
  const [ferias, setFerias] = useState<Ferias[]>([])
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroFuncionario, setFiltroFuncionario] = useState("all")
  const [filtroStatus, setFiltroStatus] = useState("all")
  const [filtroTipo, setFiltroTipo] = useState("ferias")
  
  // Estados para modais
  const [isFeriasDialogOpen, setIsFeriasDialogOpen] = useState(false)
  const [isAfastamentoDialogOpen, setIsAfastamentoDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Ferias | Afastamento | null>(null)
  
  // Formulário de férias
  const [feriasForm, setFeriasForm] = useState({
    funcionario_id: '',
    data_inicio: '',
    data_fim: '',
    dias_solicitados: '',
    observacoes: ''
  })

  // Formulário de afastamento
  const [afastamentoForm, setAfastamentoForm] = useState({
    funcionario_id: '',
    tipo: 'Licença Médica' as 'Licença Médica' | 'Licença Maternidade' | 'Licença Paternidade' | 'Licença Sem Vencimento' | 'Suspensão' | 'Outro',
    data_inicio: '',
    data_fim: '',
    dias_solicitados: '',
    observacoes: '',
    documento_anexo: ''
  })

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
      
      // Simular carregamento de férias e afastamentos
      const feriasSimuladas: Ferias[] = [
        {
          id: 1,
          funcionario_id: 1,
          data_inicio: '2024-01-15',
          data_fim: '2024-01-30',
          dias_solicitados: 15,
          saldo_anterior: 30,
          saldo_restante: 15,
          status: 'Aprovado',
          observacoes: 'Férias de verão',
          aprovado_por: 1,
          data_aprovacao: '2024-01-10',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      setFerias(feriasSimuladas)
      
      const afastamentosSimulados: Afastamento[] = [
        {
          id: 1,
          funcionario_id: 1,
          tipo: 'Licença Médica',
          data_inicio: '2024-02-01',
          data_fim: '2024-02-15',
          dias_solicitados: 15,
          status: 'Aprovado',
          observacoes: 'Atestado médico',
          documento_anexo: 'atestado.pdf',
          aprovado_por: 1,
          data_aprovacao: '2024-01-30',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      setAfastamentos(afastamentosSimulados)
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de férias e afastamentos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar dados
  const feriasFiltradas = ferias.filter(item => {
    const funcionario = funcionarios.find(f => f.id === item.funcionario_id)
    const matchesSearch = !searchTerm || (funcionario?.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFuncionario = filtroFuncionario === "all" || item.funcionario_id.toString() === filtroFuncionario
    const matchesStatus = filtroStatus === "all" || item.status === filtroStatus
    
    return matchesSearch && matchesFuncionario && matchesStatus
  })

  const afastamentosFiltrados = afastamentos.filter(item => {
    const funcionario = funcionarios.find(f => f.id === item.funcionario_id)
    const matchesSearch = !searchTerm || (funcionario?.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFuncionario = filtroFuncionario === "all" || item.funcionario_id.toString() === filtroFuncionario
    const matchesStatus = filtroStatus === "all" || item.status === filtroStatus
    
    return matchesSearch && matchesFuncionario && matchesStatus
  })

  // Handlers
  const handleSolicitarFerias = async () => {
    try {
      const feriasData = {
        ...feriasForm,
        funcionario_id: parseInt(feriasForm.funcionario_id),
        dias_solicitados: parseInt(feriasForm.dias_solicitados),
        saldo_anterior: 30, // Simular saldo
        saldo_restante: 30 - parseInt(feriasForm.dias_solicitados)
      }

      const response = await rhApi.solicitarFerias(feriasData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Solicitação de férias enviada com sucesso!",
        })
        setIsFeriasDialogOpen(false)
        resetFeriasForm()
        await carregarDados()
      }
    } catch (error: any) {
      console.error('Erro ao solicitar férias:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao solicitar férias",
        variant: "destructive"
      })
    }
  }

  const handleSolicitarAfastamento = async () => {
    try {
      const afastamentoData = {
        ...afastamentoForm,
        funcionario_id: parseInt(afastamentoForm.funcionario_id),
        dias_solicitados: parseInt(afastamentoForm.dias_solicitados)
      }

      const response = await rhApi.solicitarAfastamento(afastamentoData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Solicitação de afastamento enviada com sucesso!",
        })
        setIsAfastamentoDialogOpen(false)
        resetAfastamentoForm()
        await carregarDados()
      }
    } catch (error: any) {
      console.error('Erro ao solicitar afastamento:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao solicitar afastamento",
        variant: "destructive"
      })
    }
  }

  const handleAprovarFerias = async (feriasId: number) => {
    try {
      const response = await rhApi.aprovarFerias(feriasId)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Férias aprovadas com sucesso!",
        })
        await carregarDados()
      }
    } catch (error: any) {
      console.error('Erro ao aprovar férias:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao aprovar férias",
        variant: "destructive"
      })
    }
  }

  const resetFeriasForm = () => {
    setFeriasForm({
      funcionario_id: '',
      data_inicio: '',
      data_fim: '',
      dias_solicitados: '',
      observacoes: ''
    })
  }

  const resetAfastamentoForm = () => {
    setAfastamentoForm({
      funcionario_id: '',
      tipo: 'Licença Médica',
      data_inicio: '',
      data_fim: '',
      dias_solicitados: '',
      observacoes: '',
      documento_anexo: ''
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'Solicitado': 'bg-yellow-100 text-yellow-800',
      'Aprovado': 'bg-green-100 text-green-800',
      'Em Andamento': 'bg-blue-100 text-blue-800',
      'Finalizado': 'bg-gray-100 text-gray-800',
      'Cancelado': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aprovado': return <CheckCircle className="w-3 h-3" />
      case 'Cancelado': return <XCircle className="w-3 h-3" />
      case 'Em Andamento': return <Clock className="w-3 h-3" />
      default: return <AlertTriangle className="w-3 h-3" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando dados de férias...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Férias e Afastamentos</h1>
            <p className="text-gray-600">Gerencie solicitações de férias, licenças e afastamentos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsAfastamentoDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Afastamento
          </Button>
          <Button onClick={() => setIsFeriasDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Solicitar Férias
          </Button>
        </div>
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
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Nome do funcionário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="funcionario">Funcionário</Label>
              <Select value={filtroFuncionario} onValueChange={setFiltroFuncionario}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os funcionários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {funcionarios.map((funcionario) => (
                    <SelectItem key={funcionario.id} value={funcionario.id.toString()}>
                      {funcionario.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Solicitado">Solicitado</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ferias">Férias</SelectItem>
                  <SelectItem value="afastamentos">Afastamentos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="ferias" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ferias">Férias</TabsTrigger>
          <TabsTrigger value="afastamentos">Afastamentos</TabsTrigger>
        </TabsList>

        {/* Tab Férias */}
        <TabsContent value="ferias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Férias</CardTitle>
              <CardDescription>
                Gerencie solicitações de férias dos funcionários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feriasFiltradas.map((feria) => {
                    const funcionario = funcionarios.find(f => f.id === feria.funcionario_id)
                    return (
                      <TableRow key={feria.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span>{funcionario?.nome || 'Funcionário não encontrado'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(feria.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}</div>
                            <div className="text-gray-500">até {format(new Date(feria.data_fim), 'dd/MM/yyyy', { locale: ptBR })}</div>
                          </div>
                        </TableCell>
                        <TableCell>{feria.dias_solicitados} dias</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Anterior: {feria.saldo_anterior}</div>
                            <div>Restante: {feria.saldo_restante}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(feria.status)}>
                            {getStatusIcon(feria.status)}
                            <span className="ml-1">{feria.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {feria.status === 'Solicitado' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAprovarFerias(feria.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {feriasFiltradas.length === 0 && (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhuma solicitação de férias encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Afastamentos */}
        <TabsContent value="afastamentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Afastamento</CardTitle>
              <CardDescription>
                Gerencie licenças médicas, maternidade e outros afastamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {afastamentosFiltrados.map((afastamento) => {
                    const funcionario = funcionarios.find(f => f.id === afastamento.funcionario_id)
                    return (
                      <TableRow key={afastamento.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span>{funcionario?.nome || 'Funcionário não encontrado'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{afastamento.tipo}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(afastamento.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}</div>
                            {afastamento.data_fim && (
                              <div className="text-gray-500">até {format(new Date(afastamento.data_fim), 'dd/MM/yyyy', { locale: ptBR })}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{afastamento.dias_solicitados} dias</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(afastamento.status)}>
                            {getStatusIcon(afastamento.status)}
                            <span className="ml-1">{afastamento.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {afastamento.documento_anexo && (
                              <Button size="sm" variant="outline">
                                <FileText className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {afastamentosFiltrados.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum afastamento encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Solicitação de Férias */}
      <Dialog open={isFeriasDialogOpen} onOpenChange={setIsFeriasDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Solicitar Férias</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="ferias_funcionario">Funcionário *</Label>
              <Select 
                value={feriasForm.funcionario_id} 
                onValueChange={(value) => setFeriasForm({ ...feriasForm, funcionario_id: value })}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ferias_data_inicio">Data de Início *</Label>
                <Input
                  id="ferias_data_inicio"
                  type="date"
                  value={feriasForm.data_inicio}
                  onChange={(e) => setFeriasForm({ ...feriasForm, data_inicio: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ferias_data_fim">Data de Fim *</Label>
                <Input
                  id="ferias_data_fim"
                  type="date"
                  value={feriasForm.data_fim}
                  onChange={(e) => setFeriasForm({ ...feriasForm, data_fim: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ferias_dias">Dias Solicitados *</Label>
              <Input
                id="ferias_dias"
                type="number"
                min="1"
                max="30"
                value={feriasForm.dias_solicitados}
                onChange={(e) => setFeriasForm({ ...feriasForm, dias_solicitados: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="ferias_observacoes">Observações</Label>
              <Textarea
                id="ferias_observacoes"
                value={feriasForm.observacoes}
                onChange={(e) => setFeriasForm({ ...feriasForm, observacoes: e.target.value })}
                rows={3}
                placeholder="Observações sobre a solicitação de férias..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsFeriasDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSolicitarFerias}>
                Solicitar Férias
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Solicitação de Afastamento */}
      <Dialog open={isAfastamentoDialogOpen} onOpenChange={setIsAfastamentoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Solicitar Afastamento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="afastamento_funcionario">Funcionário *</Label>
              <Select 
                value={afastamentoForm.funcionario_id} 
                onValueChange={(value) => setAfastamentoForm({ ...afastamentoForm, funcionario_id: value })}
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
              <Label htmlFor="afastamento_tipo">Tipo de Afastamento *</Label>
              <Select 
                value={afastamentoForm.tipo} 
                onValueChange={(value) => setAfastamentoForm({ ...afastamentoForm, tipo: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Licença Médica">Licença Médica</SelectItem>
                  <SelectItem value="Licença Maternidade">Licença Maternidade</SelectItem>
                  <SelectItem value="Licença Paternidade">Licença Paternidade</SelectItem>
                  <SelectItem value="Licença Sem Vencimento">Licença Sem Vencimento</SelectItem>
                  <SelectItem value="Suspensão">Suspensão</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="afastamento_data_inicio">Data de Início *</Label>
                <Input
                  id="afastamento_data_inicio"
                  type="date"
                  value={afastamentoForm.data_inicio}
                  onChange={(e) => setAfastamentoForm({ ...afastamentoForm, data_inicio: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="afastamento_data_fim">Data de Fim</Label>
                <Input
                  id="afastamento_data_fim"
                  type="date"
                  value={afastamentoForm.data_fim}
                  onChange={(e) => setAfastamentoForm({ ...afastamentoForm, data_fim: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="afastamento_dias">Dias Solicitados *</Label>
              <Input
                id="afastamento_dias"
                type="number"
                min="1"
                value={afastamentoForm.dias_solicitados}
                onChange={(e) => setAfastamentoForm({ ...afastamentoForm, dias_solicitados: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="afastamento_documento">Documento Anexo</Label>
              <Input
                id="afastamento_documento"
                value={afastamentoForm.documento_anexo}
                onChange={(e) => setAfastamentoForm({ ...afastamentoForm, documento_anexo: e.target.value })}
                placeholder="Nome do arquivo (ex: atestado.pdf)"
              />
            </div>

            <div>
              <Label htmlFor="afastamento_observacoes">Observações</Label>
              <Textarea
                id="afastamento_observacoes"
                value={afastamentoForm.observacoes}
                onChange={(e) => setAfastamentoForm({ ...afastamentoForm, observacoes: e.target.value })}
                rows={3}
                placeholder="Observações sobre o afastamento..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAfastamentoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSolicitarAfastamento}>
                Solicitar Afastamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
