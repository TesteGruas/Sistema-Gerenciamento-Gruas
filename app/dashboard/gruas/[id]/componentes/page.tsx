"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Search, 
  Edit,
  Trash2, 
  Eye,
  Package,
  Settings,
  ArrowLeft,
  RefreshCw,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiComponentes, ComponenteGrua, MovimentacaoComponente } from "@/lib/api-componentes"
import apiGruas from "@/lib/api-gruas"

interface ConfiguracaoGrua {
  id: string
  grua_id: string
  nome: string
  descricao: string
  componentes: Array<{
    componente_id: string
    quantidade: number
  }>
  altura_total: number
  capacidade_total: number
  created_at: string
}

export default function ComponentesGruaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const gruaId = params.id as string
  
  // Estados
  const [componentes, setComponentes] = useState<ComponenteGrua[]>([])
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoGrua[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterTipo, setFilterTipo] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isMovimentacaoDialogOpen, setIsMovimentacaoDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingComponente, setEditingComponente] = useState<ComponenteGrua | null>(null)
  const [gruaInfo, setGruaInfo] = useState<any>(null)
  const [estatisticas, setEstatisticas] = useState<any>(null)

  // Formulário para componente
  const [componenteForm, setComponenteForm] = useState({
    nome: '',
    tipo: '' as ComponenteGrua['tipo'],
    modelo: '',
    fabricante: '',
    numero_serie: '',
    capacidade: '',
    unidade_medida: 'unidade',
    quantidade_total: 1,
    quantidade_disponivel: 1,
    quantidade_em_uso: 0,
    quantidade_danificada: 0,
    status: 'Disponível' as ComponenteGrua['status'],
    localizacao: '',
    valor_unitario: 0,
    data_instalacao: '',
    data_ultima_manutencao: '',
    data_proxima_manutencao: '',
    observacoes: ''
  })

  // Formulário para movimentação
  const [movimentacaoForm, setMovimentacaoForm] = useState({
    tipo_movimentacao: 'Instalação' as MovimentacaoComponente['tipo_movimentacao'],
    quantidade_movimentada: 1,
    motivo: '',
    obra_id: '',
    grua_origem_id: '',
    grua_destino_id: '',
    funcionario_responsavel_id: '',
    observacoes: ''
  })


  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [gruaId])

  // Recarregar dados quando filtros mudarem
  useEffect(() => {
    if (!loading) {
      carregarDados()
    }
  }, [searchTerm, filterStatus, filterTipo])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar informações da grua
      const gruaResponse = await apiGruas.obterGrua(gruaId)
      setGruaInfo(gruaResponse.data)
      
      // Carregar componentes da grua com filtros aplicados
      const componentesResponse = await apiComponentes.buscarPorGrua(gruaId, {
        page: 1,
        limit: 1000, // Aumentar limite para carregar todos os componentes
        search: searchTerm || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        tipo: filterTipo !== 'all' ? filterTipo : undefined
      })
      setComponentes(componentesResponse.data)
      
      // Carregar estatísticas
      const stats = await apiComponentes.obterEstatisticas(gruaId)
      setEstatisticas(stats)
      
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao carregar componentes da grua",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Os componentes já vêm filtrados da API
  const filteredComponentes = componentes

  // Handlers
  const handleCreateComponente = async () => {
    try {
      const response = await apiComponentes.criar({
        grua_id: gruaId,
        ...componenteForm
      })

      setIsCreateDialogOpen(false)
      resetComponenteForm()
      
      // Recarregar dados para atualizar lista e estatísticas
      await carregarDados()

      toast({
        title: "Sucesso",
        description: response.message || "Componente adicionado com sucesso"
      })
    } catch (error: any) {
      console.error('Erro ao criar componente:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao criar componente",
        variant: "destructive"
      })
    }
  }

  const handleUpdateComponente = async () => {
    if (!editingComponente) return

    try {
      const response = await apiComponentes.atualizar(editingComponente.id, {
        ...componenteForm
      })

      setIsEditDialogOpen(false)
      setEditingComponente(null)
      resetComponenteForm()
      
      // Recarregar dados para atualizar lista e estatísticas
      await carregarDados()

      toast({
        title: "Sucesso",
        description: response.message || "Componente atualizado com sucesso"
      })
    } catch (error: any) {
      console.error('Erro ao atualizar componente:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao atualizar componente",
        variant: "destructive"
      })
    }
  }

  const handleMovimentarComponente = async () => {
    if (!editingComponente) return

    try {
      const movimentacaoData = {
        ...movimentacaoForm,
        obra_id: movimentacaoForm.obra_id ? parseInt(movimentacaoForm.obra_id) : undefined,
        funcionario_responsavel_id: movimentacaoForm.funcionario_responsavel_id ? parseInt(movimentacaoForm.funcionario_responsavel_id) : undefined
      }

      const response = await apiComponentes.movimentar(editingComponente.id, movimentacaoData)
      
      setIsMovimentacaoDialogOpen(false)
      setEditingComponente(null)
      resetMovimentacaoForm()
      
      // Recarregar dados para atualizar lista e estatísticas
      await carregarDados()

      toast({
        title: "Sucesso",
        description: response.message || "Movimentação registrada com sucesso"
      })
    } catch (error: any) {
      console.error('Erro ao movimentar componente:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao movimentar componente",
        variant: "destructive"
      })
    }
  }

  const handleDeleteComponente = async (id: number) => {
    try {
      const response = await apiComponentes.excluir(id)
      
      // Recarregar dados para atualizar lista e estatísticas
      await carregarDados()
      
      toast({
        title: "Sucesso",
        description: response.message || "Componente removido com sucesso"
      })
    } catch (error: any) {
      console.error('Erro ao remover componente:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao remover componente",
        variant: "destructive"
      })
    }
  }

  // Funções auxiliares
  const resetComponenteForm = () => {
    setComponenteForm({
      nome: '',
      tipo: '' as ComponenteGrua['tipo'],
      modelo: '',
      fabricante: '',
      numero_serie: '',
      capacidade: '',
      unidade_medida: 'unidade',
      quantidade_total: 1,
      quantidade_disponivel: 1,
      quantidade_em_uso: 0,
      quantidade_danificada: 0,
      status: 'Disponível' as ComponenteGrua['status'],
      localizacao: '',
      valor_unitario: 0,
      data_instalacao: '',
      data_ultima_manutencao: '',
      data_proxima_manutencao: '',
      observacoes: ''
    })
  }

  const resetMovimentacaoForm = () => {
    setMovimentacaoForm({
      tipo_movimentacao: 'Instalação' as MovimentacaoComponente['tipo_movimentacao'],
      quantidade_movimentada: 1,
      motivo: '',
      obra_id: '',
      grua_origem_id: '',
      grua_destino_id: '',
      funcionario_responsavel_id: '',
      observacoes: ''
    })
  }

  const openEditDialog = (componente: ComponenteGrua) => {
    setEditingComponente(componente)
    setComponenteForm({
      nome: componente.nome,
      tipo: componente.tipo,
      modelo: componente.modelo || '',
      fabricante: componente.fabricante || '',
      numero_serie: componente.numero_serie || '',
      capacidade: componente.capacidade || '',
      unidade_medida: componente.unidade_medida,
      quantidade_total: componente.quantidade_total,
      quantidade_disponivel: componente.quantidade_disponivel,
      quantidade_em_uso: componente.quantidade_em_uso,
      quantidade_danificada: componente.quantidade_danificada,
      status: componente.status,
      localizacao: componente.localizacao || '',
      valor_unitario: componente.valor_unitario,
      data_instalacao: componente.data_instalacao || '',
      data_ultima_manutencao: componente.data_ultima_manutencao || '',
      data_proxima_manutencao: componente.data_proxima_manutencao || '',
      observacoes: componente.observacoes || ''
    })
    setIsEditDialogOpen(true)
  }

  const openMovimentacaoDialog = (componente: ComponenteGrua) => {
    setEditingComponente(componente)
    resetMovimentacaoForm()
    setIsMovimentacaoDialogOpen(true)
  }

  const openViewDialog = (componente: ComponenteGrua) => {
    setEditingComponente(componente)
    setIsViewDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponível': return 'bg-green-500'
      case 'Em uso': return 'bg-blue-500'
      case 'Manutenção': return 'bg-yellow-500'
      case 'Danificado': return 'bg-red-500'
      case 'Descontinuado': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    return status
  }

  const getTipoLabel = (tipo: string) => {
    return tipo
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando componentes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Componentes da Grua
          </h1>
          <p className="text-gray-600">
            {gruaInfo?.nome} - {gruaInfo?.modelo}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/dashboard/gruas/${gruaId}/configuracoes`)}>
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Componente
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Componentes</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Disponíveis</p>
                  <p className="text-2xl font-bold text-green-600">{estatisticas.disponivel}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Em Uso</p>
                  <p className="text-2xl font-bold text-blue-600">{estatisticas.em_uso}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-purple-600">
                    R$ {estatisticas.valor_total.toLocaleString('pt-BR')}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                placeholder="Buscar por nome, tipo, modelo..."
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
                  <SelectItem value="Disponível">Disponível</SelectItem>
                  <SelectItem value="Em uso">Em Uso</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Danificado">Danificado</SelectItem>
                  <SelectItem value="Descontinuado">Descontinuado</SelectItem>
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
                  <SelectItem value="Estrutural">Estrutural</SelectItem>
                  <SelectItem value="Hidráulico">Hidráulico</SelectItem>
                  <SelectItem value="Elétrico">Elétrico</SelectItem>
                  <SelectItem value="Mecânico">Mecânico</SelectItem>
                  <SelectItem value="Segurança">Segurança</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Lista de Componentes */}
      <Card>
        <CardHeader>
          <CardTitle>Componentes ({filteredComponentes.length})</CardTitle>
          <CardDescription>
            Lista de todos os componentes desta grua
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredComponentes.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum componente encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modelo/Fabricante</TableHead>
                  <TableHead>Quantidades</TableHead>
                  <TableHead>Valor Unitário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComponentes.map((componente) => (
                  <TableRow key={componente.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{componente.nome}</div>
                        {componente.localizacao && (
                          <div className="text-sm text-gray-500">{componente.localizacao}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTipoLabel(componente.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {componente.modelo && <div><strong>Modelo:</strong> {componente.modelo}</div>}
                        {componente.fabricante && <div><strong>Fabricante:</strong> {componente.fabricante}</div>}
                        {componente.numero_serie && <div><strong>Série:</strong> {componente.numero_serie}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div><strong>Total:</strong> {componente.quantidade_total}</div>
                        <div><strong>Disponível:</strong> {componente.quantidade_disponivel}</div>
                        <div><strong>Em uso:</strong> {componente.quantidade_em_uso}</div>
                        {componente.quantidade_danificada > 0 && (
                          <div className="text-red-600"><strong>Danificado:</strong> {componente.quantidade_danificada}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      R$ {componente.valor_unitario.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(componente.status)}>
                        {getStatusLabel(componente.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openViewDialog(componente)}
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openMovimentacaoDialog(componente)}
                          title="Movimentar"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditDialog(componente)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" title="Excluir">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Componente</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o componente "{componente.nome}"? Esta ação não pode ser desfeita.
                                {componente.quantidade_em_uso > 0 && (
                                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                    <strong>Atenção:</strong> Este componente possui {componente.quantidade_em_uso} unidades em uso.
                                  </div>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteComponente(componente.id)}
                                className="bg-red-600 hover:bg-red-700"
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

      {/* Dialog de Criação de Componente */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Componente</DialogTitle>
            <DialogDescription>
              Adicione um novo componente para esta grua
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleCreateComponente(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome do Componente *</Label>
                <Input
                  id="nome"
                  value={componenteForm.nome}
                  onChange={(e) => setComponenteForm({ ...componenteForm, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select 
                  value={componenteForm.tipo} 
                  onValueChange={(value) => setComponenteForm({ ...componenteForm, tipo: value as ComponenteGrua['tipo'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estrutural">Estrutural</SelectItem>
                    <SelectItem value="Hidráulico">Hidráulico</SelectItem>
                    <SelectItem value="Elétrico">Elétrico</SelectItem>
                    <SelectItem value="Mecânico">Mecânico</SelectItem>
                    <SelectItem value="Segurança">Segurança</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  value={componenteForm.modelo}
                  onChange={(e) => setComponenteForm({ ...componenteForm, modelo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="fabricante">Fabricante</Label>
                <Input
                  id="fabricante"
                  value={componenteForm.fabricante}
                  onChange={(e) => setComponenteForm({ ...componenteForm, fabricante: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="numero_serie">Número de Série</Label>
                <Input
                  id="numero_serie"
                  value={componenteForm.numero_serie}
                  onChange={(e) => setComponenteForm({ ...componenteForm, numero_serie: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="capacidade">Capacidade</Label>
                <Input
                  id="capacidade"
                  value={componenteForm.capacidade}
                  onChange={(e) => setComponenteForm({ ...componenteForm, capacidade: e.target.value })}
                  placeholder="Ex: 5 toneladas"
                />
              </div>
              <div>
                <Label htmlFor="unidade_medida">Unidade de Medida</Label>
                <Select 
                  value={componenteForm.unidade_medida} 
                  onValueChange={(value) => setComponenteForm({ ...componenteForm, unidade_medida: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidade">Unidade</SelectItem>
                    <SelectItem value="metro">Metro</SelectItem>
                    <SelectItem value="quilograma">Quilograma</SelectItem>
                    <SelectItem value="metro_quadrado">Metro Quadrado</SelectItem>
                    <SelectItem value="metro_cubico">Metro Cúbico</SelectItem>
                    <SelectItem value="litro">Litro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="localizacao">Localização</Label>
                <Input
                  id="localizacao"
                  value={componenteForm.localizacao}
                  onChange={(e) => setComponenteForm({ ...componenteForm, localizacao: e.target.value })}
                  placeholder="Ex: Torre principal"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="quantidade_total">Quantidade Total *</Label>
                <Input
                  id="quantidade_total"
                  type="number"
                  min="1"
                  value={componenteForm.quantidade_total}
                  onChange={(e) => setComponenteForm({ ...componenteForm, quantidade_total: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantidade_disponivel">Disponível *</Label>
                <Input
                  id="quantidade_disponivel"
                  type="number"
                  min="0"
                  value={componenteForm.quantidade_disponivel}
                  onChange={(e) => setComponenteForm({ ...componenteForm, quantidade_disponivel: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantidade_em_uso">Em Uso</Label>
                <Input
                  id="quantidade_em_uso"
                  type="number"
                  min="0"
                  value={componenteForm.quantidade_em_uso}
                  onChange={(e) => setComponenteForm({ ...componenteForm, quantidade_em_uso: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="quantidade_danificada">Danificada</Label>
                <Input
                  id="quantidade_danificada"
                  type="number"
                  min="0"
                  value={componenteForm.quantidade_danificada}
                  onChange={(e) => setComponenteForm({ ...componenteForm, quantidade_danificada: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valor_unitario">Valor Unitário (R$) *</Label>
                <Input
                  id="valor_unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={componenteForm.valor_unitario}
                  onChange={(e) => setComponenteForm({ ...componenteForm, valor_unitario: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={componenteForm.status} 
                  onValueChange={(value) => setComponenteForm({ ...componenteForm, status: value as ComponenteGrua['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Em uso">Em uso</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Danificado">Danificado</SelectItem>
                    <SelectItem value="Descontinuado">Descontinuado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="data_instalacao">Data de Instalação</Label>
                <Input
                  id="data_instalacao"
                  type="date"
                  value={componenteForm.data_instalacao}
                  onChange={(e) => setComponenteForm({ ...componenteForm, data_instalacao: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="data_ultima_manutencao">Última Manutenção</Label>
                <Input
                  id="data_ultima_manutencao"
                  type="date"
                  value={componenteForm.data_ultima_manutencao}
                  onChange={(e) => setComponenteForm({ ...componenteForm, data_ultima_manutencao: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="data_proxima_manutencao">Próxima Manutenção</Label>
                <Input
                  id="data_proxima_manutencao"
                  type="date"
                  value={componenteForm.data_proxima_manutencao}
                  onChange={(e) => setComponenteForm({ ...componenteForm, data_proxima_manutencao: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={componenteForm.observacoes}
                onChange={(e) => setComponenteForm({ ...componenteForm, observacoes: e.target.value })}
                rows={3}
                placeholder="Informações adicionais sobre o componente..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Adicionar Componente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Componente */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Componente</DialogTitle>
            <DialogDescription>
              Edite as informações do componente
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateComponente(); }} className="space-y-4">
            {/* Mesmo formulário da criação, mas com dados preenchidos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_nome">Nome do Componente *</Label>
                <Input
                  id="edit_nome"
                  value={componenteForm.nome}
                  onChange={(e) => setComponenteForm({ ...componenteForm, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_tipo">Tipo *</Label>
                <Select 
                  value={componenteForm.tipo} 
                  onValueChange={(value) => setComponenteForm({ ...componenteForm, tipo: value as ComponenteGrua['tipo'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estrutural">Estrutural</SelectItem>
                    <SelectItem value="Hidráulico">Hidráulico</SelectItem>
                    <SelectItem value="Elétrico">Elétrico</SelectItem>
                    <SelectItem value="Mecânico">Mecânico</SelectItem>
                    <SelectItem value="Segurança">Segurança</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_modelo">Modelo</Label>
                <Input
                  id="edit_modelo"
                  value={componenteForm.modelo}
                  onChange={(e) => setComponenteForm({ ...componenteForm, modelo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_fabricante">Fabricante</Label>
                <Input
                  id="edit_fabricante"
                  value={componenteForm.fabricante}
                  onChange={(e) => setComponenteForm({ ...componenteForm, fabricante: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_numero_serie">Número de Série</Label>
                <Input
                  id="edit_numero_serie"
                  value={componenteForm.numero_serie}
                  onChange={(e) => setComponenteForm({ ...componenteForm, numero_serie: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="edit_quantidade_total">Quantidade Total *</Label>
                <Input
                  id="edit_quantidade_total"
                  type="number"
                  min="1"
                  value={componenteForm.quantidade_total}
                  onChange={(e) => setComponenteForm({ ...componenteForm, quantidade_total: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_quantidade_disponivel">Disponível *</Label>
                <Input
                  id="edit_quantidade_disponivel"
                  type="number"
                  min="0"
                  value={componenteForm.quantidade_disponivel}
                  onChange={(e) => setComponenteForm({ ...componenteForm, quantidade_disponivel: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_quantidade_em_uso">Em Uso</Label>
                <Input
                  id="edit_quantidade_em_uso"
                  type="number"
                  min="0"
                  value={componenteForm.quantidade_em_uso}
                  onChange={(e) => setComponenteForm({ ...componenteForm, quantidade_em_uso: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit_quantidade_danificada">Danificada</Label>
                <Input
                  id="edit_quantidade_danificada"
                  type="number"
                  min="0"
                  value={componenteForm.quantidade_danificada}
                  onChange={(e) => setComponenteForm({ ...componenteForm, quantidade_danificada: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_valor_unitario">Valor Unitário (R$) *</Label>
                <Input
                  id="edit_valor_unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={componenteForm.valor_unitario}
                  onChange={(e) => setComponenteForm({ ...componenteForm, valor_unitario: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_status">Status</Label>
                <Select 
                  value={componenteForm.status} 
                  onValueChange={(value) => setComponenteForm({ ...componenteForm, status: value as ComponenteGrua['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Em uso">Em uso</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Danificado">Danificado</SelectItem>
                    <SelectItem value="Descontinuado">Descontinuado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit_observacoes">Observações</Label>
              <Textarea
                id="edit_observacoes"
                value={componenteForm.observacoes}
                onChange={(e) => setComponenteForm({ ...componenteForm, observacoes: e.target.value })}
                rows={3}
                placeholder="Informações adicionais sobre o componente..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Movimentação */}
      <Dialog open={isMovimentacaoDialogOpen} onOpenChange={setIsMovimentacaoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Movimentar Componente</DialogTitle>
            <DialogDescription>
              Registre uma movimentação para o componente: {editingComponente?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleMovimentarComponente(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mov_tipo">Tipo de Movimentação *</Label>
                <Select 
                  value={movimentacaoForm.tipo_movimentacao} 
                  onValueChange={(value) => setMovimentacaoForm({ ...movimentacaoForm, tipo_movimentacao: value as MovimentacaoComponente['tipo_movimentacao'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instalação">Instalação</SelectItem>
                    <SelectItem value="Remoção">Remoção</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Substituição">Substituição</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                    <SelectItem value="Ajuste">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mov_quantidade">Quantidade Movimentada *</Label>
                <Input
                  id="mov_quantidade"
                  type="number"
                  min="1"
                  max={editingComponente?.quantidade_disponivel || 1}
                  value={movimentacaoForm.quantidade_movimentada}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, quantidade_movimentada: parseInt(e.target.value) || 1 })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Disponível: {editingComponente?.quantidade_disponivel || 0}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="mov_motivo">Motivo *</Label>
              <Input
                id="mov_motivo"
                value={movimentacaoForm.motivo}
                onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, motivo: e.target.value })}
                placeholder="Descreva o motivo da movimentação..."
                required
              />
            </div>

            {movimentacaoForm.tipo_movimentacao === 'Transferência' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mov_grua_origem">Grua de Origem</Label>
                  <Input
                    id="mov_grua_origem"
                    value={movimentacaoForm.grua_origem_id}
                    onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, grua_origem_id: e.target.value })}
                    placeholder="ID da grua de origem"
                  />
                </div>
                <div>
                  <Label htmlFor="mov_grua_destino">Grua de Destino</Label>
                  <Input
                    id="mov_grua_destino"
                    value={movimentacaoForm.grua_destino_id}
                    onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, grua_destino_id: e.target.value })}
                    placeholder="ID da grua de destino"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="mov_observacoes">Observações</Label>
              <Textarea
                id="mov_observacoes"
                value={movimentacaoForm.observacoes}
                onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, observacoes: e.target.value })}
                rows={3}
                placeholder="Observações adicionais sobre a movimentação..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsMovimentacaoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Movimentação
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


      {/* Dialog de Visualização de Componente */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Componente</DialogTitle>
            <DialogDescription>
              Informações completas do componente: {editingComponente?.nome}
            </DialogDescription>
          </DialogHeader>
          
          {editingComponente && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informações Básicas</h3>
                  <div className="space-y-2">
                    <div><strong>Nome:</strong> {editingComponente.nome}</div>
                    <div><strong>Tipo:</strong> <Badge variant="outline">{editingComponente.tipo}</Badge></div>
                    <div><strong>Status:</strong> <Badge className={getStatusColor(editingComponente.status)}>{editingComponente.status}</Badge></div>
                    {editingComponente.modelo && <div><strong>Modelo:</strong> {editingComponente.modelo}</div>}
                    {editingComponente.fabricante && <div><strong>Fabricante:</strong> {editingComponente.fabricante}</div>}
                    {editingComponente.numero_serie && <div><strong>Número de Série:</strong> {editingComponente.numero_serie}</div>}
                    {editingComponente.capacidade && <div><strong>Capacidade:</strong> {editingComponente.capacidade}</div>}
                    <div><strong>Unidade de Medida:</strong> {editingComponente.unidade_medida}</div>
                    {editingComponente.localizacao && <div><strong>Localização:</strong> {editingComponente.localizacao}</div>}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Quantidades</h3>
                  <div className="space-y-2">
                    <div><strong>Total:</strong> {editingComponente.quantidade_total}</div>
                    <div><strong>Disponível:</strong> {editingComponente.quantidade_disponivel}</div>
                    <div><strong>Em Uso:</strong> {editingComponente.quantidade_em_uso}</div>
                    <div><strong>Danificada:</strong> {editingComponente.quantidade_danificada}</div>
                    <div><strong>Valor Unitário:</strong> R$ {editingComponente.valor_unitario.toLocaleString('pt-BR')}</div>
                    <div><strong>Valor Total:</strong> R$ {(editingComponente.valor_unitario * editingComponente.quantidade_total).toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              </div>

              {/* Datas */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Datas Importantes</h3>
                <div className="grid grid-cols-3 gap-4">
                  {editingComponente.data_instalacao && (
                    <div>
                      <strong>Data de Instalação:</strong>
                      <div className="text-sm text-gray-600">{new Date(editingComponente.data_instalacao).toLocaleDateString('pt-BR')}</div>
                    </div>
                  )}
                  {editingComponente.data_ultima_manutencao && (
                    <div>
                      <strong>Última Manutenção:</strong>
                      <div className="text-sm text-gray-600">{new Date(editingComponente.data_ultima_manutencao).toLocaleDateString('pt-BR')}</div>
                    </div>
                  )}
                  {editingComponente.data_proxima_manutencao && (
                    <div>
                      <strong>Próxima Manutenção:</strong>
                      <div className="text-sm text-gray-600">{new Date(editingComponente.data_proxima_manutencao).toLocaleDateString('pt-BR')}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              {editingComponente.observacoes && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Observações</h3>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {editingComponente.observacoes}
                  </div>
                </div>
              )}

              {/* Informações do Sistema */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Informações do Sistema</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div><strong>Criado em:</strong> {new Date(editingComponente.created_at).toLocaleString('pt-BR')}</div>
                  <div><strong>Atualizado em:</strong> {new Date(editingComponente.updated_at).toLocaleString('pt-BR')}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false)
              openEditDialog(editingComponente!)
            }}>
              Editar Componente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
