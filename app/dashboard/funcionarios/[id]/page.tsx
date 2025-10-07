"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Save, 
  X,
  User,
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  UserCheck,
  UserX,
  Building2,
  DollarSign,
  Clock,
  FileText,
  Briefcase,
  History,
  Award,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { 
  funcionariosApi, 
  converterFuncionarioBackendParaFrontend, 
  converterFuncionarioFrontendParaBackend,
  FuncionarioBackend 
} from "@/lib/api-funcionarios"

export default function FuncionarioDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const funcionarioId = params.id as string

  // Estados
  const [funcionario, setFuncionario] = useState<FuncionarioBackend | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Formulário de edição
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    role: 'Operador' as 'Operador' | 'Sinaleiro' | 'Técnico Manutenção' | 'Supervisor' | 'Mecânico',
    status: 'Ativo' as 'Ativo' | 'Inativo' | 'Férias',
    turno: 'Diurno' as 'Diurno' | 'Noturno' | 'Sob Demanda',
    salary: '',
    hireDate: '',
    observations: ''
  })

  // Carregar dados do funcionário
  useEffect(() => {
    carregarFuncionario()
  }, [funcionarioId])

  const carregarFuncionario = async () => {
    try {
      setLoading(true)
      const response = await funcionariosApi.obterFuncionario(funcionarioId)
      
      if (response.success) {
        setFuncionario(response.data)
        setFormData({
          name: response.data.nome,
          email: response.data.email || '',
          phone: response.data.telefone || '',
          cpf: response.data.cpf || '',
          role: response.data.cargo,
          status: response.data.status,
          turno: response.data.turno,
          salary: response.data.salario?.toString() || '',
          hireDate: response.data.data_admissao || '',
          observations: response.data.observacoes || ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar funcionário:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do funcionário",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!funcionario) return

    try {
      setSubmitting(true)
      
      const funcionarioData = converterFuncionarioFrontendParaBackend({
        ...formData,
        salary: parseFloat(formData.salary) || 0
      })
      
      const response = await funcionariosApi.atualizarFuncionario(funcionario.id, funcionarioData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Funcionário atualizado com sucesso!",
        })
        
        // Recarregar dados
        await carregarFuncionario()
        setIsEditMode(false)
      }
    } catch (error: any) {
      console.error('Erro ao atualizar funcionário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar funcionário",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!funcionario) return

    try {
      setSubmitting(true)
      
      const response = await funcionariosApi.excluirFuncionario(funcionario.id)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: `Funcionário "${funcionario.nome}" excluído com sucesso!`,
        })
        
        // Redirecionar para lista
        router.push('/dashboard/funcionarios')
      }
    } catch (error: any) {
      console.error('Erro ao excluir funcionário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir funcionário",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getRoleColor = (role: string) => {
    const colors = {
      'Operador': 'bg-blue-100 text-blue-800',
      'Sinaleiro': 'bg-green-100 text-green-800',
      'Técnico Manutenção': 'bg-orange-100 text-orange-800',
      'Supervisor': 'bg-purple-100 text-purple-800',
      'Mecânico': 'bg-red-100 text-red-800'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'Ativo': 'bg-green-100 text-green-800',
      'Inativo': 'bg-red-100 text-red-800',
      'Férias': 'bg-yellow-100 text-yellow-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTurnoColor = (turno: string) => {
    const colors = {
      'Diurno': 'bg-yellow-100 text-yellow-800',
      'Noturno': 'bg-indigo-100 text-indigo-800',
      'Sob Demanda': 'bg-gray-100 text-gray-800'
    }
    return colors[turno as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando funcionário...</span>
      </div>
    )
  }

  if (!funcionario) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Funcionário não encontrado</h3>
        <p className="text-gray-600 mb-4">O funcionário solicitado não foi encontrado.</p>
        <Button onClick={() => router.push('/dashboard/funcionarios')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Funcionários
        </Button>
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
            <h1 className="text-3xl font-bold text-gray-900">{funcionario.nome}</h1>
            <p className="text-gray-600">{funcionario.cargo}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditMode ? (
            <>
              <Button onClick={() => setIsEditMode(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Funcionário</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o funcionário "{funcionario.nome}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={submitting}
                    >
                      {submitting ? 'Excluindo...' : 'Excluir'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditMode(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={submitting}>
                <Save className="w-4 h-4 mr-2" />
                {submitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Básicas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditMode}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditMode}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditMode}
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  disabled={!isEditMode}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                disabled={!isEditMode}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status e Cargo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Status e Cargo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="role">Cargo</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value as any })}
                disabled={!isEditMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operador">Operador</SelectItem>
                  <SelectItem value="Sinaleiro">Sinaleiro</SelectItem>
                  <SelectItem value="Técnico Manutenção">Técnico Manutenção</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Mecânico">Mecânico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                disabled={!isEditMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Férias">Férias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="turno">Turno</Label>
              <Select 
                value={formData.turno} 
                onValueChange={(value) => setFormData({ ...formData, turno: value as any })}
                disabled={!isEditMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diurno">Diurno</SelectItem>
                  <SelectItem value="Noturno">Noturno</SelectItem>
                  <SelectItem value="Sob Demanda">Sob Demanda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="salary">Salário (R$)</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                disabled={!isEditMode}
              />
            </div>

            <div>
              <Label htmlFor="hireDate">Data de Admissão</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                disabled={!isEditMode}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges de Status */}
      <div className="flex gap-2 flex-wrap">
        <Badge className={getRoleColor(funcionario.cargo)}>
          {funcionario.cargo}
        </Badge>
        <Badge className={getStatusColor(funcionario.status)}>
          {funcionario.status === 'Ativo' ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
          {funcionario.status}
        </Badge>
        <Badge className={getTurnoColor(funcionario.turno)}>
          <Clock className="w-3 h-3 mr-1" />
          {funcionario.turno}
        </Badge>
      </div>

      {/* Tabs com Informações Detalhadas */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações de Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {funcionario.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{funcionario.email}</span>
                  </div>
                )}
                {funcionario.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{funcionario.telefone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações Financeiras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {funcionario.salario && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span>Salário: R$ {funcionario.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {funcionario.data_admissao && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>Admissão: {format(new Date(funcionario.data_admissao), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Obras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Histórico de obras será implementado em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Relatórios serão implementados em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
