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
  TrendingUp,
  Receipt
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { receitasApi, Receita, ReceitaCreate, ReceitaUpdate } from "@/lib/api-receitas"
import { receitasUtils } from "@/lib/receitas-utils"
import apiObras from "@/lib/api-obras"
import { funcionariosApi } from "@/lib/api-funcionarios"

// Interface local para obras com campos adicionais
interface Obra {
  id: number
  nome: string
  endereco?: string
  cidade?: string
  cliente_id: number
  clientes?: {
    id: number
    nome: string
  }
}

// Interface estendida para receitas com relacionamentos
interface ReceitaComRelacionamentos extends Receita {
  obras?: {
    id: number
    nome: string
    clientes?: {
      id: number
      nome: string
    }
  }
  funcionarios?: {
    id: number
    nome: string
    cargo: string
  }
}

export default function ReceitasPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Estados
  const [receitas, setReceitas] = useState<ReceitaComRelacionamentos[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterTipo, setFilterTipo] = useState("all")
  const [filterObra, setFilterObra] = useState("all")
  const [filterPeriodo, setFilterPeriodo] = useState("")
  const [obraFilter, setObraFilter] = useState("")
  const [obraSearchFilter, setObraSearchFilter] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingReceita, setEditingReceita] = useState<ReceitaComRelacionamentos | null>(null)

  // Formulário
  const [receitaForm, setReceitaForm] = useState({
    obra_id: '',
    tipo: 'locacao' as 'locacao' | 'servico' | 'venda',
    descricao: '',
    valor: 0,
    data_receita: new Date().toISOString().split('T')[0],
    funcionario_id: 'none',
    observacoes: ''
  })

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar receitas, obras e funcionários em paralelo
      const [receitasData, obrasData, funcionariosData] = await Promise.all([
        receitasApi.list(),
        apiObras.listarObras(),
        funcionariosApi.listarFuncionarios()
      ])

      setReceitas(receitasData.receitas || [])
      setObras(obrasData.data || [])
      setFuncionarios(funcionariosData.data || [])
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar obras para seleção nos formulários
  const obrasFiltradas = obras.filter(obra => {
    if (!obraFilter) return true
    const searchTerm = obraFilter.toLowerCase()
    return (
      obra.nome?.toLowerCase().includes(searchTerm) ||
      obra.endereco?.toLowerCase().includes(searchTerm) ||
      obra.cidade?.toLowerCase().includes(searchTerm)
    )
  })

  // Filtrar obras para o filtro principal
  const obrasFiltradasParaFiltro = obras.filter(obra => {
    if (!obraSearchFilter) return true
    const searchTerm = obraSearchFilter.toLowerCase()
    return (
      obra.nome?.toLowerCase().includes(searchTerm) ||
      obra.endereco?.toLowerCase().includes(searchTerm) ||
      obra.cidade?.toLowerCase().includes(searchTerm)
    )
  })

  // Filtrar receitas
  const filteredReceitas = (receitas || []).filter(receita => {
    const matchesSearch = (receita.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (receita.obras?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (receita.obras?.clientes?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || receita.status === filterStatus
    const matchesTipo = filterTipo === 'all' || receita.tipo === filterTipo
    const matchesObra = filterObra === 'all' || receita.obra_id?.toString() === filterObra
    const matchesPeriodo = !filterPeriodo || (receita.data_receita || '').startsWith(filterPeriodo)
    return matchesSearch && matchesStatus && matchesTipo && matchesObra && matchesPeriodo
  })

  // Handlers
  const handleCreateReceita = async () => {
    try {
      const receitaData: ReceitaCreate = {
        obra_id: parseInt(receitaForm.obra_id),
        tipo: receitaForm.tipo,
        descricao: receitaForm.descricao,
        valor: receitaForm.valor,
        data_receita: receitaForm.data_receita,
        funcionario_id: receitaForm.funcionario_id && receitaForm.funcionario_id !== 'none' ? parseInt(receitaForm.funcionario_id) : undefined,
        observacoes: receitaForm.observacoes.trim() || undefined
      }

      const novaReceita = await receitasApi.create(receitaData)
      setReceitas([novaReceita, ...(receitas || [])])
      setIsCreateDialogOpen(false)
      resetForm()

      toast({
        title: "Sucesso",
        description: "Receita criada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao criar receita:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar receita",
        variant: "destructive"
      })
    }
  }

  const handleEditReceita = (receita: ReceitaComRelacionamentos) => {
    setEditingReceita(receita)
    setReceitaForm({
      obra_id: receita.obra_id.toString(),
      tipo: receita.tipo,
      descricao: receita.descricao,
      valor: receita.valor,
      data_receita: receita.data_receita,
      funcionario_id: receita.funcionario_id?.toString() || 'none',
      observacoes: receita.observacoes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateReceita = async () => {
    try {
      if (!editingReceita) return

      const receitaData: ReceitaUpdate = {
        obra_id: parseInt(receitaForm.obra_id),
        tipo: receitaForm.tipo,
        descricao: receitaForm.descricao,
        valor: receitaForm.valor,
        data_receita: receitaForm.data_receita,
        funcionario_id: receitaForm.funcionario_id && receitaForm.funcionario_id !== 'none' ? parseInt(receitaForm.funcionario_id) : undefined,
        observacoes: receitaForm.observacoes.trim() || undefined
      }

      const receitaAtualizada = await receitasApi.update(editingReceita.id, receitaData)
      
      setReceitas((receitas || []).map(receita => 
        receita.id === editingReceita.id ? receitaAtualizada : receita
      ))
      
      setIsEditDialogOpen(false)
      setEditingReceita(null)
      resetForm()

      toast({
        title: "Sucesso",
        description: "Receita atualizada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao atualizar receita:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar receita",
        variant: "destructive"
      })
    }
  }

  const handleDeleteReceita = async (id: string) => {
    try {
      await receitasApi.delete(id)
      setReceitas((receitas || []).filter(r => r.id !== id))
      toast({
        title: "Sucesso",
        description: "Receita removida com sucesso"
      })
    } catch (error) {
      console.error('Erro ao remover receita:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover receita",
        variant: "destructive"
      })
    }
  }

  const handleConfirmReceita = async (id: string) => {
    try {
      const receitaAtualizada = await receitasApi.confirm(id)
      setReceitas((receitas || []).map(receita => 
        receita.id === id ? receitaAtualizada : receita
      ))
      toast({
        title: "Sucesso",
        description: "Receita confirmada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao confirmar receita:', error)
      toast({
        title: "Erro",
        description: "Erro ao confirmar receita",
        variant: "destructive"
      })
    }
  }

  const handleCancelReceita = async (id: string) => {
    try {
      const receitaAtualizada = await receitasApi.cancel(id)
      setReceitas((receitas || []).map(receita => 
        receita.id === id ? receitaAtualizada : receita
      ))
      toast({
        title: "Sucesso",
        description: "Receita cancelada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao cancelar receita:', error)
      toast({
        title: "Erro",
        description: "Erro ao cancelar receita",
        variant: "destructive"
      })
    }
  }

  const handleExportReceitas = async () => {
    try {
      await receitasApi.export({
        obra_id: filterObra !== 'all' ? parseInt(filterObra) : undefined,
        tipo: filterTipo !== 'all' ? filterTipo : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        data_inicio: filterPeriodo ? `${filterPeriodo}-01` : undefined,
        data_fim: filterPeriodo ? `${filterPeriodo}-31` : undefined
      })
      toast({
        title: "Sucesso",
        description: "Receitas exportadas com sucesso"
      })
    } catch (error) {
      console.error('Erro ao exportar receitas:', error)
      toast({
        title: "Erro",
        description: "Erro ao exportar receitas",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setReceitaForm({
      obra_id: '',
      tipo: 'locacao',
      descricao: '',
      valor: 0,
      data_receita: new Date().toISOString().split('T')[0],
      funcionario_id: 'none',
      observacoes: ''
    })
    setObraFilter('')
    setObraSearchFilter('')
  }

  // Usar utilitários para formatação
  const getStatusColor = receitasUtils.getStatusColor
  const getStatusIcon = (status: string) => {
    const IconComponent = receitasUtils.getStatusIcon(status)
    switch (IconComponent) {
      case 'CheckCircle': return <CheckCircle className="w-4 h-4" />
      case 'Clock': return <Clock className="w-4 h-4" />
      case 'XCircle': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }
  const getTipoColor = receitasUtils.getTipoColor
  const getTipoLabel = receitasUtils.getTipoLabel

  // Calcular totais usando utilitários
  const { total: totalReceitas, confirmadas: totalConfirmadas, pendentes: totalPendentes } = receitasUtils.calculateTotals(filteredReceitas)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando receitas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receitas</h1>
          <p className="text-gray-600">Gestão de receitas e faturamento</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReceitas}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Receita
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Receitas</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {totalReceitas.toLocaleString('pt-BR')}
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
                <p className="text-sm font-medium text-gray-600">Confirmadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {totalConfirmadas.toLocaleString('pt-BR')}
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
                  R$ {totalPendentes.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Registros</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredReceitas.length}
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por descrição, obra ou cliente..."
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
                  <SelectItem value="confirmada">Confirmada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
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
                  <SelectItem value="locacao">Locação</SelectItem>
                  <SelectItem value="servico">Serviço</SelectItem>
                  <SelectItem value="venda">Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="obra">Obra</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Buscar obra por nome, endereço ou cidade..."
                  value={obraSearchFilter}
                  onChange={(e) => setObraSearchFilter(e.target.value)}
                  className="text-sm"
                />
                <Select value={filterObra} onValueChange={setFilterObra}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a obra" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">Todas as obras</SelectItem>
                    {!obras || obras.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        Carregando obras...
                      </div>
                    ) : obrasFiltradasParaFiltro.length > 0 ? (
                      obrasFiltradasParaFiltro.map(obra => (
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
              <Label htmlFor="periodo">Período</Label>
              <Input
                id="periodo"
                type="month"
                value={filterPeriodo}
                onChange={(e) => setFilterPeriodo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={carregarDados}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Receitas */}
      <Card>
        <CardHeader>
          <CardTitle>Receitas ({filteredReceitas.length})</CardTitle>
          <CardDescription>Lista de todas as receitas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReceitas.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhuma receita encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceitas.map((receita) => (
                  <TableRow key={receita.id}>
                    <TableCell>
                      <Badge className={getTipoColor(receita.tipo)}>
                        {getTipoLabel(receita.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {receita.descricao}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {receita.obras?.nome || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {receita.obras?.clientes?.nome || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(receita.data_receita).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        {receitasUtils.formatCurrency(receita.valor || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(receita.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(receita.status)}
                          {receita.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditReceita(receita)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {receita.status === 'pendente' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleConfirmReceita(receita.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCancelReceita(receita.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Receita</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteReceita(receita.id)}
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

      {/* Dialog de Criação de Receita */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Receita</DialogTitle>
            <DialogDescription>
              Registre uma nova receita no sistema
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleCreateReceita(); }} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Buscar obra por nome, endereço ou cidade..."
                value={obraFilter}
                onChange={(e) => setObraFilter(e.target.value)}
                className="text-sm"
              />
              <Select 
                value={receitaForm.obra_id} 
                onValueChange={(value) => setReceitaForm({ ...receitaForm, obra_id: value })}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select 
                  value={receitaForm.tipo} 
                  onValueChange={(value) => setReceitaForm({ ...receitaForm, tipo: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="locacao">Locação</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="venda">Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="funcionario_id">Funcionário Responsável</Label>
                <Select 
                  value={receitaForm.funcionario_id} 
                  onValueChange={(value) => setReceitaForm({ ...receitaForm, funcionario_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {funcionarios.map(funcionario => (
                      <SelectItem key={funcionario.id} value={funcionario.id.toString()}>
                        {funcionario.nome} - {funcionario.cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={receitaForm.descricao}
                onChange={(e) => setReceitaForm({ ...receitaForm, descricao: e.target.value })}
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
                  value={receitaForm.valor}
                  onChange={(e) => setReceitaForm({ ...receitaForm, valor: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="data_receita">Data da Receita *</Label>
                <Input
                  id="data_receita"
                  type="date"
                  value={receitaForm.data_receita}
                  onChange={(e) => setReceitaForm({ ...receitaForm, data_receita: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={receitaForm.observacoes}
                onChange={(e) => setReceitaForm({ ...receitaForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Receita
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Receita */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Receita</DialogTitle>
            <DialogDescription>
              Edite as informações da receita
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateReceita(); }} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Buscar obra por nome, endereço ou cidade..."
                value={obraFilter}
                onChange={(e) => setObraFilter(e.target.value)}
                className="text-sm"
              />
              <Select 
                value={receitaForm.obra_id} 
                onValueChange={(value) => setReceitaForm({ ...receitaForm, obra_id: value })}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_tipo">Tipo *</Label>
                <Select 
                  value={receitaForm.tipo} 
                  onValueChange={(value) => setReceitaForm({ ...receitaForm, tipo: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="locacao">Locação</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="venda">Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_funcionario_id">Funcionário Responsável</Label>
                <Select 
                  value={receitaForm.funcionario_id} 
                  onValueChange={(value) => setReceitaForm({ ...receitaForm, funcionario_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {funcionarios.map(funcionario => (
                      <SelectItem key={funcionario.id} value={funcionario.id.toString()}>
                        {funcionario.nome} - {funcionario.cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit_descricao">Descrição *</Label>
              <Input
                id="edit_descricao"
                value={receitaForm.descricao}
                onChange={(e) => setReceitaForm({ ...receitaForm, descricao: e.target.value })}
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
                  value={receitaForm.valor}
                  onChange={(e) => setReceitaForm({ ...receitaForm, valor: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_data_receita">Data da Receita *</Label>
                <Input
                  id="edit_data_receita"
                  type="date"
                  value={receitaForm.data_receita}
                  onChange={(e) => setReceitaForm({ ...receitaForm, data_receita: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_observacoes">Observações</Label>
              <Textarea
                id="edit_observacoes"
                value={receitaForm.observacoes}
                onChange={(e) => setReceitaForm({ ...receitaForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Atualizar Receita
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
