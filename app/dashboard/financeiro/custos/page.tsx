"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Search, 
  Edit,
  Trash2, 
  Eye,
  DollarSign,
  Calendar,
  Building2,
  Filter,
  RefreshCw,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  Receipt,
  User,
  Wrench,
  Package,
  Briefcase
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { custosApi, useCustos, custosUtils, type Custo, type CustoCreate, type CustoUpdate, type CustoFilters } from "@/lib/api-custos"
import apiObras from "@/lib/api-obras"
import { funcionariosApi } from "@/lib/api-funcionarios"

// Tipos para obras e funcionários
interface Obra {
  id: number
  nome: string
  cliente_id: number
  endereco?: string
  cidade?: string
  clientes?: {
    id: number
    nome: string
  }
}

interface Funcionario {
  id: number
  nome: string
  cargo: string
}

// Estender o tipo Custo para incluir relacionamentos
interface CustoComRelacionamentos extends Custo {
  obras?: Obra
  funcionarios?: Funcionario
}

export default function CustosPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Estados
  const [custos, setCustos] = useState<CustoComRelacionamentos[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterTipo, setFilterTipo] = useState("all")
  const [filterObra, setFilterObra] = useState("all")
  const [filterPeriodo, setFilterPeriodo] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCusto, setEditingCusto] = useState<CustoComRelacionamentos | null>(null)
  const [resumoFinanceiro, setResumoFinanceiro] = useState<any>(null)

  // Formulário
  const [custoForm, setCustoForm] = useState({
    obra_id: '',
    tipo: 'salario' as 'salario' | 'material' | 'servico' | 'manutencao',
    descricao: '',
    valor: 0,
    data_custo: new Date().toISOString().split('T')[0],
    funcionario_id: '',
    observacoes: ''
  })
  const [obraFilter, setObraFilter] = useState('')

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [])

  // Filtrar obras
  const obrasFiltradas = obras.filter(obra => {
    if (!obraFilter) return true
    const searchTerm = obraFilter.toLowerCase()
    return (
      obra.nome?.toLowerCase().includes(searchTerm) ||
      obra.endereco?.toLowerCase().includes(searchTerm) ||
      obra.cidade?.toLowerCase().includes(searchTerm)
    )
  })

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar custos com filtros
      const filters: CustoFilters = {
        page: 1,
        limit: 10
      }
      
      const custosData = await custosApi.list(filters)
      setCustos(custosData.custos || [])
      
      // Carregar obras para filtros
      const obrasData = await apiObras.listarObras()
      setObras(obrasData.data || [])
      
      // Carregar funcionários para filtros
      const funcionariosData = await funcionariosApi.listarFuncionarios()
      setFuncionarios(funcionariosData.data || [])
      
      // Calcular resumo financeiro
      calcularResumoFinanceiro(custosData.custos || [])
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar custos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calcularResumoFinanceiro = (custosData: CustoComRelacionamentos[]) => {
    const totalCustos = custosData.reduce((sum, custo) => sum + (custo.valor || 0), 0)
    const totalReceitas = 25000 // Simular receitas
    const saldo = totalReceitas - totalCustos
    
    setResumoFinanceiro({
      totalCustos,
      totalReceitas,
      saldo,
      custosPorObra: custosData.reduce((acc, custo) => {
        const obraNome = custo.obras?.nome || 'Sem obra'
        acc[obraNome] = (acc[obraNome] || 0) + (custo.valor || 0)
        return acc
      }, {} as Record<string, number>)
    })
  }

  // Filtrar custos
  const filteredCustos = (custos || []).filter(custo => {
    const matchesSearch = (custo.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (custo.obras?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (custo.funcionarios?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || custo.status === filterStatus
    const matchesTipo = filterTipo === 'all' || custo.tipo === filterTipo
    const matchesObra = filterObra === 'all' || custo.obra_id?.toString() === filterObra
    const matchesPeriodo = !filterPeriodo || (custo.data_custo || '').startsWith(filterPeriodo)
    return matchesSearch && matchesStatus && matchesTipo && matchesObra && matchesPeriodo
  })

  // Handlers
  const handleCreateCusto = async () => {
    try {
      const custoData: CustoCreate = {
        obra_id: parseInt(custoForm.obra_id),
        tipo: custoForm.tipo,
        descricao: custoForm.descricao,
        valor: custoForm.valor,
        data_custo: custoForm.data_custo,
        funcionario_id: custoForm.funcionario_id ? parseInt(custoForm.funcionario_id) : undefined,
        status: 'pendente',
        observacoes: custoForm.observacoes.trim() || undefined
      }

      const novoCusto = await custosApi.create(custoData)
      setCustos([novoCusto, ...(custos || [])])
      setIsCreateDialogOpen(false)
      resetForm()

      toast({
        title: "Sucesso",
        description: "Custo criado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao criar custo:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar custo",
        variant: "destructive"
      })
    }
  }

  const handleEditCusto = (custo: CustoComRelacionamentos) => {
    setEditingCusto(custo)
    setCustoForm({
      obra_id: custo.obra_id.toString(),
      tipo: custo.tipo,
      descricao: custo.descricao,
      valor: custo.valor,
      data_custo: custo.data_custo,
      funcionario_id: custo.funcionario_id?.toString() || '',
      observacoes: custo.observacoes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateCusto = async () => {
    try {
      if (!editingCusto) return

      const custoData: CustoUpdate = {
        tipo: custoForm.tipo,
        descricao: custoForm.descricao,
        valor: custoForm.valor,
        data_custo: custoForm.data_custo,
        funcionario_id: custoForm.funcionario_id ? parseInt(custoForm.funcionario_id) : undefined,
        observacoes: custoForm.observacoes.trim() || undefined
      }

      const custoAtualizado = await custosApi.update(editingCusto.id, custoData)
      
      setCustos((custos || []).map(custo => 
        custo.id === editingCusto.id ? custoAtualizado : custo
      ))
      
      setIsEditDialogOpen(false)
      setEditingCusto(null)
      resetForm()

      toast({
        title: "Sucesso",
        description: "Custo atualizado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao atualizar custo:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar custo",
        variant: "destructive"
      })
    }
  }

  const handleDeleteCusto = async (id: string) => {
    try {
      await custosApi.delete(id)
      setCustos((custos || []).filter(c => c.id !== id))
      toast({
        title: "Sucesso",
        description: "Custo removido com sucesso"
      })
    } catch (error) {
      console.error('Erro ao remover custo:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover custo",
        variant: "destructive"
      })
    }
  }

  const handleConfirmCusto = async (id: string) => {
    try {
      const custoAtualizado = await custosApi.confirm(id)
      setCustos((custos || []).map(custo => 
        custo.id === id ? custoAtualizado : custo
      ))
      toast({
        title: "Sucesso",
        description: "Custo confirmado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao confirmar custo:', error)
      toast({
        title: "Erro",
        description: "Erro ao confirmar custo",
        variant: "destructive"
      })
    }
  }

  const handleCancelCusto = async (id: string) => {
    try {
      const custoAtualizado = await custosApi.cancel(id)
      setCustos((custos || []).map(custo => 
        custo.id === id ? custoAtualizado : custo
      ))
      toast({
        title: "Sucesso",
        description: "Custo cancelado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao cancelar custo:', error)
      toast({
        title: "Erro",
        description: "Erro ao cancelar custo",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setCustoForm({
      obra_id: '',
      tipo: 'salario',
      descricao: '',
      valor: 0,
      data_custo: new Date().toISOString().split('T')[0],
      funcionario_id: '',
      observacoes: ''
    })
    setObraFilter('')
  }

  const getStatusColor = (status: string) => {
    return custosUtils.getStatusColor(status)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmado': return <CheckCircle className="w-4 h-4" />
      case 'pendente': return <Clock className="w-4 h-4" />
      case 'cancelado': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getTipoColor = (tipo: string) => {
    return custosUtils.getTipoColor(tipo)
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'salario': return <User className="w-4 h-4" />
      case 'material': return <Package className="w-4 h-4" />
      case 'servico': return <Briefcase className="w-4 h-4" />
      case 'manutencao': return <Wrench className="w-4 h-4" />
      default: return <Receipt className="w-4 h-4" />
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'salario': return 'Salário'
      case 'material': return 'Material'
      case 'servico': return 'Serviço'
      case 'manutencao': return 'Manutenção'
      default: return tipo
    }
  }

  // Calcular totais
  const totalCustos = filteredCustos.reduce((total, custo) => total + (custo.valor || 0), 0)
  const totalConfirmados = filteredCustos
    .filter(c => c.status === 'confirmado')
    .reduce((total, custo) => total + (custo.valor || 0), 0)
  const totalPendentes = filteredCustos
    .filter(c => c.status === 'pendente')
    .reduce((total, custo) => total + (custo.valor || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando custos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Custos</h1>
          <p className="text-gray-600">Gestão de custos operacionais</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={async () => {
              try {
                const filters: CustoFilters = {
                  obra_id: filterObra !== 'all' ? parseInt(filterObra) : undefined,
                  tipo: filterTipo !== 'all' ? filterTipo : undefined,
                  status: filterStatus !== 'all' ? filterStatus : undefined,
                  data_inicio: filterPeriodo ? `${filterPeriodo}-01` : undefined,
                  data_fim: filterPeriodo ? `${filterPeriodo}-31` : undefined
                }
                const blob = await custosApi.export(filters, 'csv')
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `custos-${new Date().toISOString().split('T')[0]}.csv`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast({
                  title: "Sucesso",
                  description: "Arquivo exportado com sucesso"
                })
              } catch (error) {
                toast({
                  title: "Erro",
                  description: "Erro ao exportar custos",
                  variant: "destructive"
                })
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Custo
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Custos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {custosUtils.formatCurrency(totalCustos)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Confirmados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {custosUtils.formatCurrency(totalConfirmados)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {custosUtils.formatCurrency(totalPendentes)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Registros</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredCustos.length}
                </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por descrição, obra ou funcionário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="salario">Salário</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="servico">Serviço</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="obra">Obra</Label>
              <Select value={filterObra} onValueChange={setFilterObra}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {obras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id.toString()}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="periodo">Período</Label>
              <Input
                id="periodo"
                type="month"
                value={filterPeriodo}
                onChange={(e) => setFilterPeriodo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={carregarDados}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      {resumoFinanceiro && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                Total de Custos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R$ {resumoFinanceiro.totalCustos.toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Total de Receitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {resumoFinanceiro.totalReceitas.toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-500" />
                Saldo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${resumoFinanceiro.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {resumoFinanceiro.saldo.toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custos por Obra */}
      {resumoFinanceiro && Object.keys(resumoFinanceiro.custosPorObra).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Custos por Obra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(resumoFinanceiro.custosPorObra).map(([obra, valor]) => (
                <div key={obra} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{obra}</span>
                  <span className="text-red-600 font-bold">
                    R$ {(valor as number).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Custos */}
      <Card>
        <CardHeader>
          <CardTitle>Custos ({filteredCustos.length})</CardTitle>
          <CardDescription>Lista de todos os custos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCustos.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum custo encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustos.map((custo) => (
                  <TableRow key={custo.id}>
                    <TableCell>
                      <Badge className={getTipoColor(custo.tipo)}>
                        <div className="flex items-center gap-1">
                          {getTipoIcon(custo.tipo)}
                          {getTipoLabel(custo.tipo)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {custo.descricao}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {custo.obras?.nome || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {custo.funcionarios ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{custo.funcionarios.nome}</div>
                            <div className="text-sm text-gray-500">{custo.funcionarios.cargo}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {custosUtils.formatDate(custo.data_custo)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-red-600" />
                        {custosUtils.formatCurrency(custo.valor)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(custo.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(custo.status)}
                          {custo.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditCusto(custo)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {custo.status === 'pendente' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleConfirmCusto(custo.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {custo.status === 'pendente' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCancelCusto(custo.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Custo</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este custo? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCusto(custo.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criação de Custo */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Custo</DialogTitle>
            <DialogDescription>
              Registre um novo custo no sistema
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleCreateCusto(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="obra_id">Obra *</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Buscar obra por nome, endereço ou cidade..."
                    value={obraFilter}
                    onChange={(e) => setObraFilter(e.target.value)}
                    className="text-sm"
                  />
                  <Select 
                    value={custoForm.obra_id} 
                    onValueChange={(value) => setCustoForm({ ...custoForm, obra_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a obra" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {!obras || obras.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          Carregando obras...
                        </div>
                      ) : obrasFiltradas.length > 0 ? (
                        obrasFiltradas.map(obra => (
                          <SelectItem key={obra.id} value={obra.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{obra.nome || 'Obra sem nome'}</span>
                              <span className="text-xs text-gray-500">
                                {obra.endereco && obra.cidade ? `${obra.endereco}, ${obra.cidade}` : obra.endereco || obra.cidade || 'Sem localização'}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          Nenhuma obra encontrada
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select 
                  value={custoForm.tipo} 
                  onValueChange={(value) => setCustoForm({ ...custoForm, tipo: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salario">Salário</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={custoForm.descricao}
                onChange={(e) => setCustoForm({ ...custoForm, descricao: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={custoForm.valor}
                  onChange={(e) => setCustoForm({ ...custoForm, valor: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="data_custo">Data do Custo *</Label>
                <Input
                  id="data_custo"
                  type="date"
                  value={custoForm.data_custo}
                  onChange={(e) => setCustoForm({ ...custoForm, data_custo: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="funcionario_id">Funcionário (opcional)</Label>
              <Select 
                value={custoForm.funcionario_id} 
                onValueChange={(value) => setCustoForm({ ...custoForm, funcionario_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.map(funcionario => (
                    <SelectItem key={funcionario.id} value={funcionario.id.toString()}>
                      {funcionario.nome} - {funcionario.cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={custoForm.observacoes}
                onChange={(e) => setCustoForm({ ...custoForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateDialogOpen(false)
                resetForm()
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Custo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Custo */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Custo</DialogTitle>
            <DialogDescription>
              Edite as informações do custo
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateCusto(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_obra_id">Obra *</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Buscar obra por nome, endereço ou cidade..."
                    value={obraFilter}
                    onChange={(e) => setObraFilter(e.target.value)}
                    className="text-sm"
                  />
                  <Select 
                    value={custoForm.obra_id} 
                    onValueChange={(value) => setCustoForm({ ...custoForm, obra_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a obra" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {!obras || obras.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          Carregando obras...
                        </div>
                      ) : obrasFiltradas.length > 0 ? (
                        obrasFiltradas.map(obra => (
                          <SelectItem key={obra.id} value={obra.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{obra.nome || 'Obra sem nome'}</span>
                              <span className="text-xs text-gray-500">
                                {obra.endereco && obra.cidade ? `${obra.endereco}, ${obra.cidade}` : obra.endereco || obra.cidade || 'Sem localização'}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          Nenhuma obra encontrada
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit_tipo">Tipo *</Label>
                <Select 
                  value={custoForm.tipo} 
                  onValueChange={(value) => setCustoForm({ ...custoForm, tipo: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salario">Salário</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit_descricao">Descrição *</Label>
              <Input
                id="edit_descricao"
                value={custoForm.descricao}
                onChange={(e) => setCustoForm({ ...custoForm, descricao: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_valor">Valor (R$) *</Label>
                <Input
                  id="edit_valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={custoForm.valor}
                  onChange={(e) => setCustoForm({ ...custoForm, valor: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_data_custo">Data do Custo *</Label>
                <Input
                  id="edit_data_custo"
                  type="date"
                  value={custoForm.data_custo}
                  onChange={(e) => setCustoForm({ ...custoForm, data_custo: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_funcionario_id">Funcionário (opcional)</Label>
              <Select 
                value={custoForm.funcionario_id} 
                onValueChange={(value) => setCustoForm({ ...custoForm, funcionario_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.map(funcionario => (
                    <SelectItem key={funcionario.id} value={funcionario.id.toString()}>
                      {funcionario.nome} - {funcionario.cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_observacoes">Observações</Label>
              <Textarea
                id="edit_observacoes"
                value={custoForm.observacoes}
                onChange={(e) => setCustoForm({ ...custoForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditDialogOpen(false)
                setEditingCusto(null)
                resetForm()
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                Atualizar Custo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
