"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Building2, 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Wrench,
  ConeIcon as Crane,
  X,
  Trash2,
  Loader2
} from "lucide-react"
import { mockObras, mockGruas, getGruasByObra, getCustosByObra, mockUsers, mockCustosMensais, CustoMensal, mockClientes, getClientesAtivos, Obra } from "@/lib/mock-data"
import { obrasApi, converterObraBackendParaFrontend, converterObraFrontendParaBackend, ObraBackend, checkAuthentication, ensureAuthenticated } from "@/lib/api-obras"

export default function ObrasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingObra, setEditingObra] = useState<any>(null)
  const [obraToDelete, setObraToDelete] = useState<any>(null)
  
  // Estados para integração com backend
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [obraFormData, setObraFormData] = useState({
    name: '',
    description: '',
    status: 'ativa',
    startDate: '',
    endDate: '',
    budget: '',
    location: '',
    clienteId: '',
    observations: '',
    // Dados da grua
    gruaId: '',
    gruaValue: '',
    monthlyFee: '',
    // Lista de funcionários
    funcionarios: [] as Array<{
      id: string
      userId: string
      role: string
      name: string
    }>
  })

  // Carregar obras do backend
  const carregarObras = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await obrasApi.listarObras({ limit: 100 })
      const obrasConvertidas = response.data.map(converterObraBackendParaFrontend)
      setObras(obrasConvertidas)
    } catch (err) {
      console.error('Erro ao carregar obras:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar obras')
      // Fallback para dados mockados em caso de erro
      setObras(mockObras)
    } finally {
      setLoading(false)
    }
  }

  // Verificar autenticação e carregar dados na inicialização
  useEffect(() => {
    const init = async () => {
      const isAuth = await ensureAuthenticated()
      if (isAuth) {
        carregarObras()
      }
    }
    init()
  }, [])

  const filteredObras = obras.filter(obra =>
    obra.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obra.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addFuncionario = () => {
    const newFuncionario = {
      id: Date.now().toString(),
      userId: '',
      role: '',
      name: ''
    }
    setObraFormData({
      ...obraFormData,
      funcionarios: [...obraFormData.funcionarios, newFuncionario]
    })
  }

  const removeFuncionario = (funcionarioId: string) => {
    setObraFormData({
      ...obraFormData,
      funcionarios: obraFormData.funcionarios.filter(f => f.id !== funcionarioId)
    })
  }

  const updateFuncionario = (funcionarioId: string, field: string, value: any) => {
    setObraFormData({
      ...obraFormData,
      funcionarios: obraFormData.funcionarios.map(f => 
        f.id === funcionarioId ? { ...f, [field]: value } : f
      )
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-100 text-green-800'
      case 'pausada': return 'bg-yellow-100 text-yellow-800'
      case 'concluida': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativa': return <CheckCircle className="w-4 h-4" />
      case 'pausada': return <Clock className="w-4 h-4" />
      case 'concluida': return <AlertCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }


  const criarCustosIniciais = (obraId: string, mesInicial: string): CustoMensal[] => {
    // Custos padrão que serão criados para toda nova obra
    const custosPadrao = [
      {
        item: '01.01',
        descricao: 'Locação de grua torre',
        unidade: 'mês',
        quantidadeOrcamento: 12, // 12 meses padrão
        valorUnitario: 25000, // Valor padrão
        tipo: 'contrato' as const
      },
      {
        item: '01.02',
        descricao: 'Chumbador e fixações',
        unidade: 'und',
        quantidadeOrcamento: 1,
        valorUnitario: 15000,
        tipo: 'contrato' as const
      },
      {
        item: '01.03',
        descricao: 'Custos de Operação',
        unidade: 'mês',
        quantidadeOrcamento: 12,
        valorUnitario: 5000,
        tipo: 'contrato' as const
      },
      {
        item: '01.04',
        descricao: 'Transporte e montagem',
        unidade: 'und',
        quantidadeOrcamento: 2,
        valorUnitario: 8000,
        tipo: 'contrato' as const
      }
    ]

    return custosPadrao.map((custo, index) => ({
      id: `cm_${Date.now()}_${index}`,
      obraId: obraId,
      item: custo.item,
      descricao: custo.descricao,
      unidade: custo.unidade,
      quantidadeOrcamento: custo.quantidadeOrcamento,
      valorUnitario: custo.valorUnitario,
      totalOrcamento: custo.quantidadeOrcamento * custo.valorUnitario,
      mes: mesInicial,
      quantidadeRealizada: 0,
      valorRealizado: 0,
      quantidadeAcumulada: 0,
      valorAcumulado: 0,
      quantidadeSaldo: custo.quantidadeOrcamento,
      valorSaldo: custo.quantidadeOrcamento * custo.valorUnitario,
      tipo: custo.tipo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }

  const handleCreateObra = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setCreating(true)
      
      // Buscar dados do cliente selecionado
      const clienteSelecionado = mockClientes.find(c => c.id === obraFormData.clienteId)
      
      // Preparar dados para o backend
      const obraData = {
        name: obraFormData.name,
        description: obraFormData.description,
        status: obraFormData.status,
        startDate: obraFormData.startDate,
        endDate: obraFormData.endDate,
        budget: obraFormData.budget,
        location: obraFormData.location,
        clienteId: obraFormData.clienteId,
        observations: obraFormData.observations,
        // Dados adicionais para criação automática de cliente se necessário
        cliente_nome: clienteSelecionado?.name,
        cliente_cnpj: clienteSelecionado?.cnpj,
        cliente_email: clienteSelecionado?.email,
        cliente_telefone: clienteSelecionado?.telefone,
        // Campos específicos do backend
        cidade: obraFormData.location?.split(',')[0]?.trim() || 'São Paulo',
        estado: obraFormData.location?.split(',')[1]?.trim() || 'SP',
        tipo: 'Residencial', // Valor padrão
        endereco: obraFormData.location || 'Endereço não informado'
      }

      // Converter para formato do backend
      const obraBackendData = converterObraFrontendParaBackend(obraData)
      
      // Criar obra no backend
      const response = await obrasApi.criarObra(obraBackendData)
      
      // Atualizar grua selecionada para estar em obra (ainda usando mock)
      const selectedGrua = mockGruas.find(g => g.id === obraFormData.gruaId)
      if (selectedGrua) {
        selectedGrua.status = 'em_obra'
        selectedGrua.currentObraId = response.data.id.toString()
        selectedGrua.currentObraName = obraFormData.name
        // Nota: As propriedades value e monthlyFee não existem no tipo Grua
        // Em uma implementação real, isso seria salvo em uma tabela separada
        console.log('Valor da grua:', parseFloat(obraFormData.gruaValue) || 0)
        console.log('Mensalidade:', parseFloat(obraFormData.monthlyFee) || 0)
      }

      // Criar custos iniciais automaticamente (ainda usando mock)
      const mesInicial = new Date(obraFormData.startDate).toISOString().slice(0, 7)
      const custosIniciais = criarCustosIniciais(response.data.id.toString(), mesInicial)
      mockCustosMensais.push(...custosIniciais)

      console.log('Nova obra criada no backend:', response.data)
      console.log('Grua selecionada:', selectedGrua)
      console.log('Funcionários:', obraFormData.funcionarios)
      console.log('Custos iniciais criados:', custosIniciais)
      
      // Recarregar lista de obras
      await carregarObras()
      
      // Resetar formulário e fechar dialog
      setObraFormData({
        name: '',
        description: '',
        status: 'ativa',
        startDate: '',
        endDate: '',
        budget: '',
        location: '',
        clienteId: '',
        observations: '',
        gruaId: '',
        gruaValue: '',
        monthlyFee: '',
        funcionarios: []
      })
      setIsCreateDialogOpen(false)
      
      // Mostrar mensagem de sucesso
      alert('Obra criada com sucesso! Custos iniciais foram configurados automaticamente.')
      
    } catch (err) {
      console.error('Erro ao criar obra:', err)
      alert(`Erro ao criar obra: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setCreating(false)
    }
  }

  const handleViewDetails = (obra: any) => {
    window.location.href = `/dashboard/obras/${obra.id}`
  }

  const handleDeleteObra = (obra: any) => {
    setObraToDelete(obra)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteObra = async () => {
    if (!obraToDelete) return

    try {
      setDeleting(true)

      // Verificar se a obra tem gruas vinculadas
      const gruasVinculadas = getGruasByObra(obraToDelete.id)
      if (gruasVinculadas.length > 0) {
        alert(`Não é possível excluir a obra "${obraToDelete.name}" pois ela possui ${gruasVinculadas.length} grua(s) vinculada(s). Remova as gruas primeiro.`)
        setIsDeleteDialogOpen(false)
        return
      }

      // Verificar se a obra tem custos
      const custos = getCustosByObra(obraToDelete.id)
      if (custos.length > 0) {
        alert(`Não é possível excluir a obra "${obraToDelete.name}" pois ela possui ${custos.length} custo(s) registrado(s). Remova os custos primeiro.`)
        setIsDeleteDialogOpen(false)
        return
      }

      // Excluir obra no backend
      await obrasApi.excluirObra(parseInt(obraToDelete.id))
      
      console.log('Obra excluída do backend:', obraToDelete)
      
      // Recarregar lista de obras
      await carregarObras()
      
      setIsDeleteDialogOpen(false)
      setObraToDelete(null)
      
      // Mostrar mensagem de sucesso
      alert(`Obra "${obraToDelete.name}" excluída com sucesso!`)
      
    } catch (err) {
      console.error('Erro ao excluir obra:', err)
      alert(`Erro ao excluir obra: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setDeleting(false)
    }
  }

  const handleEditObra = (obra: any) => {
    setEditingObra(obra)
    // Preencher formulário com dados da obra
    setObraFormData({
      name: obra.name,
      description: obra.description,
      status: obra.status,
      startDate: obra.startDate,
      endDate: obra.endDate || '',
      budget: obra.budget?.toString() || '',
      location: obra.location || '',
      clienteId: obra.clienteId || '',
      observations: obra.observations || '',
      // Dados da grua (buscar grua vinculada)
      gruaId: '',
      gruaValue: '',
      monthlyFee: '',
      funcionarios: []
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateObra = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setUpdating(true)
      
      // Buscar dados do cliente selecionado
      const clienteSelecionado = mockClientes.find(c => c.id === obraFormData.clienteId)
      
      // Preparar dados para o backend
      const obraData = {
        name: obraFormData.name,
        description: obraFormData.description,
        status: obraFormData.status,
        startDate: obraFormData.startDate,
        endDate: obraFormData.endDate,
        budget: obraFormData.budget,
        location: obraFormData.location,
        clienteId: obraFormData.clienteId,
        observations: obraFormData.observations,
        // Campos específicos do backend
        cidade: obraFormData.location?.split(',')[0]?.trim() || 'São Paulo',
        estado: obraFormData.location?.split(',')[1]?.trim() || 'SP',
        tipo: 'Residencial', // Valor padrão
        endereco: obraFormData.location || 'Endereço não informado'
      }

      // Converter para formato do backend
      const obraBackendData = converterObraFrontendParaBackend(obraData)
      
      // Atualizar obra no backend
      const response = await obrasApi.atualizarObra(parseInt(editingObra.id), obraBackendData)
      
      console.log('Obra atualizada no backend:', response.data)
      console.log('Funcionários:', obraFormData.funcionarios)
      
      // Recarregar lista de obras
      await carregarObras()
      
      // Fechar dialog e resetar
      setIsEditDialogOpen(false)
      setEditingObra(null)
      setObraFormData({
        name: '',
        description: '',
        status: 'ativa',
        startDate: '',
        endDate: '',
        budget: '',
        location: '',
        clienteId: '',
        observations: '',
        gruaId: '',
        gruaValue: '',
        monthlyFee: '',
        funcionarios: []
      })
      
      // Mostrar mensagem de sucesso
      alert('Obra atualizada com sucesso!')
      
    } catch (err) {
      console.error('Erro ao atualizar obra:', err)
      alert(`Erro ao atualizar obra: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setUpdating(false)
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Obras</h1>
          <p className="text-gray-600">Controle e acompanhamento de todas as obras</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Nova Obra
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Buscar obras</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Nome da obra ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicador de Loading */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Carregando obras...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicador de Erro */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>Erro ao carregar obras: {error}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={carregarObras}
              className="mt-2"
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de Obras */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredObras.map((obra) => {
          const gruasVinculadas = getGruasByObra(obra.id)
          const custos = getCustosByObra(obra.id)
          
          return (
            <Card key={obra.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{obra.name}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(obra.status)}>
                    {getStatusIcon(obra.status)}
                    <span className="ml-1 capitalize">{obra.status}</span>
                  </Badge>
                </div>
                <CardDescription>{obra.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(obra.startDate).toLocaleDateString('pt-BR')} - 
                      {obra.endDate ? new Date(obra.endDate).toLocaleDateString('pt-BR') : 'Em andamento'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Responsável: {obra.responsavelName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>Cliente: {obra.clienteName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Total: R$ {obra.totalCustos.toLocaleString('pt-BR')}</span>
                  </div>
                  
                  {/* Gruas e Histórico */}
                  {gruasVinculadas.length > 0 && (
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium mb-2">Gruas ({gruasVinculadas.length})</h4>
                      <div className="space-y-2">
                        {gruasVinculadas.slice(0, 2).map((grua) => (
                          <div key={grua.id} className="text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{grua.name}</span>
                              <Badge variant={grua.status === 'em_obra' ? 'default' : 'secondary'} className="text-xs">
                                {grua.status}
                              </Badge>
                            </div>
                            {grua.historico.length > 0 && (
                              <div className="mt-1 text-gray-500">
                                Último: {grua.historico[0].observacoes.substring(0, 50)}...
                              </div>
                            )}
                          </div>
                        ))}
                        {gruasVinculadas.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{gruasVinculadas.length - 2} mais...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(obra)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditObra(obra)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteObra(obra)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        </div>
      )}

      {/* Mensagem quando não há obras */}
      {!loading && !error && filteredObras.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma obra encontrada</p>
              {searchTerm && (
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Criação de Obra */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Nova Obra com Grua
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateObra} className="space-y-6">
            <Tabs defaultValue="obra" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="obra">Dados da Obra</TabsTrigger>
                <TabsTrigger value="grua">Grua</TabsTrigger>
                <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
              </TabsList>

              {/* Aba: Dados da Obra */}
              <TabsContent value="obra" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome da Obra *</Label>
                    <Input
                      id="name"
                      value={obraFormData.name}
                      onChange={(e) => setObraFormData({ ...obraFormData, name: e.target.value })}
                      placeholder="Ex: Torre Residencial Alpha"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={obraFormData.status}
                      onValueChange={(value) => setObraFormData({ ...obraFormData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="pausada">Pausada</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={obraFormData.description}
                    onChange={(e) => setObraFormData({ ...obraFormData, description: e.target.value })}
                    placeholder="Descreva os detalhes da obra..."
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data de Início *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={obraFormData.startDate}
                      onChange={(e) => setObraFormData({ ...obraFormData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Data de Conclusão Prevista</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={obraFormData.endDate}
                      onChange={(e) => setObraFormData({ ...obraFormData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget">Orçamento (R$)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={obraFormData.budget}
                      onChange={(e) => setObraFormData({ ...obraFormData, budget: e.target.value })}
                      placeholder="Ex: 1000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Localização</Label>
                    <Input
                      id="location"
                      value={obraFormData.location}
                      onChange={(e) => setObraFormData({ ...obraFormData, location: e.target.value })}
                      placeholder="Ex: São Paulo, SP"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="clienteId">Cliente *</Label>
                  <Select
                    value={obraFormData.clienteId}
                    onValueChange={(value) => setObraFormData({ ...obraFormData, clienteId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {getClientesAtivos().map(cliente => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.name} - {cliente.cnpj}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    O cliente deve ser criado antes de criar a obra
                  </p>
                </div>

                <div>
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={obraFormData.observations}
                    onChange={(e) => setObraFormData({ ...obraFormData, observations: e.target.value })}
                    placeholder="Observações adicionais sobre a obra..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* Aba: Grua */}
              <TabsContent value="grua" className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Crane className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Selecionar Grua</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    Selecione uma grua existente para atrelar a esta obra
                  </p>
                </div>

                <div>
                  <Label htmlFor="gruaId">Grua *</Label>
                  <Select
                    value={obraFormData.gruaId}
                    onValueChange={(value) => setObraFormData({ ...obraFormData, gruaId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma grua" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockGruas.filter(grua => grua.status === 'disponivel').map(grua => (
                        <SelectItem key={grua.id} value={grua.id}>
                          {grua.name} - {grua.model} ({grua.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gruaValue">Valor da Grua (R$) *</Label>
                    <Input
                      id="gruaValue"
                      type="number"
                      value={obraFormData.gruaValue}
                      onChange={(e) => setObraFormData({ ...obraFormData, gruaValue: e.target.value })}
                      placeholder="Ex: 500000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyFee">Mensalidade (R$) *</Label>
                    <Input
                      id="monthlyFee"
                      type="number"
                      value={obraFormData.monthlyFee}
                      onChange={(e) => setObraFormData({ ...obraFormData, monthlyFee: e.target.value })}
                      placeholder="Ex: 15000"
                      required
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Aba: Funcionários */}
              <TabsContent value="funcionarios" className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium text-green-900">Funcionários da Obra</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Adicione quantos funcionários desejar para esta obra
                  </p>
                </div>

                <div className="space-y-3">
                  {obraFormData.funcionarios.map((funcionario) => (
                    <div key={funcionario.id} className="flex gap-2 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Select
                          value={funcionario.userId}
                          onValueChange={(value) => {
                            const user = mockUsers.find(u => u.id === value)
                            updateFuncionario(funcionario.id, 'userId', value)
                            updateFuncionario(funcionario.id, 'name', user?.name || '')
                            updateFuncionario(funcionario.id, 'role', user?.role || '')
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um funcionário" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockUsers.filter(user => 
                              user.role === 'engenheiro' || 
                              user.role === 'chefe_obras' || 
                              user.role === 'funcionario'
                            ).map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={funcionario.role}
                          readOnly
                          placeholder="Cargo será preenchido automaticamente"
                          className="bg-gray-50"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFuncionario(funcionario.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addFuncionario}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Funcionário
                </Button>
              </TabsContent>

            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Obra e Grua'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Obra */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Obra
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateObra} className="space-y-6">
            <Tabs defaultValue="obra" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="obra">Dados da Obra</TabsTrigger>
                <TabsTrigger value="grua">Grua</TabsTrigger>
                <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
              </TabsList>

              {/* Aba: Dados da Obra */}
              <TabsContent value="obra" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Nome da Obra *</Label>
                    <Input
                      id="edit-name"
                      value={obraFormData.name}
                      onChange={(e) => setObraFormData({ ...obraFormData, name: e.target.value })}
                      placeholder="Ex: Torre Residencial Alpha"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status *</Label>
                    <Select
                      value={obraFormData.status}
                      onValueChange={(value) => setObraFormData({ ...obraFormData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="pausada">Pausada</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-description">Descrição *</Label>
                  <Textarea
                    id="edit-description"
                    value={obraFormData.description}
                    onChange={(e) => setObraFormData({ ...obraFormData, description: e.target.value })}
                    placeholder="Descreva os detalhes da obra..."
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-startDate">Data de Início *</Label>
                    <Input
                      id="edit-startDate"
                      type="date"
                      value={obraFormData.startDate}
                      onChange={(e) => setObraFormData({ ...obraFormData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-endDate">Data de Conclusão Prevista</Label>
                    <Input
                      id="edit-endDate"
                      type="date"
                      value={obraFormData.endDate}
                      onChange={(e) => setObraFormData({ ...obraFormData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-budget">Orçamento (R$)</Label>
                    <Input
                      id="edit-budget"
                      type="number"
                      value={obraFormData.budget}
                      onChange={(e) => setObraFormData({ ...obraFormData, budget: e.target.value })}
                      placeholder="Ex: 1000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-location">Localização</Label>
                    <Input
                      id="edit-location"
                      value={obraFormData.location}
                      onChange={(e) => setObraFormData({ ...obraFormData, location: e.target.value })}
                      placeholder="Ex: São Paulo, SP"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-clienteId">Cliente *</Label>
                  <Select
                    value={obraFormData.clienteId}
                    onValueChange={(value) => setObraFormData({ ...obraFormData, clienteId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {getClientesAtivos().map(cliente => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.name} - {cliente.cnpj}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    O cliente deve ser criado antes de criar a obra
                  </p>
                </div>

                <div>
                  <Label htmlFor="edit-observations">Observações</Label>
                  <Textarea
                    id="edit-observations"
                    value={obraFormData.observations}
                    onChange={(e) => setObraFormData({ ...obraFormData, observations: e.target.value })}
                    placeholder="Observações adicionais sobre a obra..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* Aba: Grua */}
              <TabsContent value="grua" className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Crane className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Selecionar Grua</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    Selecione uma grua existente para atrelar a esta obra
                  </p>
                </div>

                <div>
                  <Label htmlFor="edit-gruaId">Grua *</Label>
                  <Select
                    value={obraFormData.gruaId}
                    onValueChange={(value) => setObraFormData({ ...obraFormData, gruaId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma grua" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockGruas.filter(grua => grua.status === 'disponivel').map(grua => (
                        <SelectItem key={grua.id} value={grua.id}>
                          {grua.name} - {grua.model} ({grua.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-gruaValue">Valor da Grua (R$) *</Label>
                    <Input
                      id="edit-gruaValue"
                      type="number"
                      value={obraFormData.gruaValue}
                      onChange={(e) => setObraFormData({ ...obraFormData, gruaValue: e.target.value })}
                      placeholder="Ex: 500000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-monthlyFee">Mensalidade (R$) *</Label>
                    <Input
                      id="edit-monthlyFee"
                      type="number"
                      value={obraFormData.monthlyFee}
                      onChange={(e) => setObraFormData({ ...obraFormData, monthlyFee: e.target.value })}
                      placeholder="Ex: 15000"
                      required
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Aba: Funcionários */}
              <TabsContent value="funcionarios" className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium text-green-900">Funcionários da Obra</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Adicione quantos funcionários desejar para esta obra
                  </p>
                </div>

                <div className="space-y-3">
                  {obraFormData.funcionarios.map((funcionario) => (
                    <div key={funcionario.id} className="flex gap-2 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Select
                          value={funcionario.userId}
                          onValueChange={(value) => {
                            const user = mockUsers.find(u => u.id === value)
                            updateFuncionario(funcionario.id, 'userId', value)
                            updateFuncionario(funcionario.id, 'name', user?.name || '')
                            updateFuncionario(funcionario.id, 'role', user?.role || '')
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um funcionário" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockUsers.filter(user => 
                              user.role === 'engenheiro' || 
                              user.role === 'chefe_obras' || 
                              user.role === 'funcionario'
                            ).map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={funcionario.role}
                          readOnly
                          placeholder="Cargo será preenchido automaticamente"
                          className="bg-gray-50"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFuncionario(funcionario.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addFuncionario}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Funcionário
                </Button>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Atualizar Obra'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tem certeza que deseja excluir a obra <strong>{obraToDelete?.name}</strong>?
            </p>
            <p className="text-xs text-red-600">
              ⚠️ Esta ação não pode ser desfeita. A obra será permanentemente removida do sistema.
            </p>
            {obraToDelete && (getGruasByObra(obraToDelete.id).length > 0 || getCustosByObra(obraToDelete.id).length > 0) && (
              <p className="text-xs text-orange-600">
                ⚠️ Esta obra possui gruas ou custos vinculados. A exclusão será bloqueada.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteObra}
              disabled={deleting || (obraToDelete && (getGruasByObra(obraToDelete.id).length > 0 || getCustosByObra(obraToDelete.id).length > 0))}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}