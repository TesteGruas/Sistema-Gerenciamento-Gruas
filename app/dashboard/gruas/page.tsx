"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ConeIcon as Crane, 
  Plus, 
  Search, 
  Edit,
  Eye,
  CheckCircle,
  Clock,
  Wrench,
  Building2,
  Calendar,
  Trash2,
  Package,
  Settings,
  Users,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"
import { mockObras, mockUsers } from "@/lib/mock-data"
import { gruasApi, converterGruaBackendParaFrontend, converterGruaFrontendParaBackend, GruaBackend } from "@/lib/api-gruas"

export default function GruasPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedObra, setSelectedObra] = useState("all")
  const [selectedTipo, setSelectedTipo] = useState("all")
  const [selectedGrua, setSelectedGrua] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [gruaToDelete, setGruaToDelete] = useState<any>(null)
  const [gruaToEdit, setGruaToEdit] = useState<any>(null)
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(9)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  const [gruaFormData, setGruaFormData] = useState({
    name: '',
    model: '',
    fabricante: '',
    capacity: '',
    status: 'disponivel',
    tipo: '',
    obraId: '',
    observacoes: '',
    createdAt: ''
  })
  
  // Estados para API
  const [gruas, setGruas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Função para carregar gruas da API
  const carregarGruas = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {
        page: currentPage,
        limit: itemsPerPage
      }
      
      // Adicionar filtros para a API (conforme documentação)
      if (selectedStatus !== "all") {
        params.status = selectedStatus
      }
      
      if (selectedTipo !== "all") {
        params.tipo = selectedTipo
      }
      
      // Nota: obra_id e search não estão na documentação da API
      // Mantendo apenas os parâmetros documentados: page, limit, status, tipo
      
      console.log('Parâmetros enviados para API:', params)
      
      const response = await gruasApi.listarGruas(params)
      
      if (response.success) {
        const gruasConvertidas = response.data.map(converterGruaBackendParaFrontend)
        setGruas(gruasConvertidas)
        
        // Atualizar informações de paginação se disponíveis na resposta
        if (response.pagination) {
          setTotalItems(response.pagination.total)
          setTotalPages(response.pagination.pages)
        } else {
          // Fallback: calcular baseado nos dados recebidos
          setTotalItems(gruasConvertidas.length)
          setTotalPages(1)
        }
      } else {
        setError('Erro ao carregar gruas')
      }
    } catch (err) {
      console.error('Erro ao carregar gruas:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar gruas')
    } finally {
      setLoading(false)
    }
  }

  
  // Carregar gruas quando o componente montar ou filtros mudarem
  useEffect(() => {
    carregarGruas()
  }, [selectedStatus, selectedTipo, currentPage, itemsPerPage])

  // Aplicar filtros da URL
  useEffect(() => {
    const obraParam = searchParams.get('obra')
    
    if (obraParam) {
      setSelectedObra(obraParam)
    }
  }, [searchParams])

  // Aplicar filtros locais para campos não suportados pela API
  const filteredGruas = gruas.filter(grua => {
    // Filtro por busca (nome ou modelo) - aplicado localmente
    const matchesSearch = searchTerm.trim() === "" || 
      (grua.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (grua.model || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro por obra - aplicado localmente
    const matchesObra = selectedObra === "all" || grua.currentObraId === selectedObra
    
    return matchesSearch && matchesObra
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel': return 'bg-green-100 text-green-800'
      case 'em_obra': return 'bg-blue-100 text-blue-800'
      case 'manutencao': return 'bg-yellow-100 text-yellow-800'
      case 'inativa': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'disponivel': return <CheckCircle className="w-4 h-4" />
      case 'em_obra': return <Building2 className="w-4 h-4" />
      case 'manutencao': return <Wrench className="w-4 h-4" />
      case 'inativa': return <Clock className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const handleViewDetails = (grua: any) => {
    setSelectedGrua(grua)
  }

  const handleEditGrua = (grua: any) => {
    setGruaToEdit(grua)
    setGruaFormData({
      name: grua.name || '',
      model: grua.model || '',
      fabricante: grua.fabricante || '',
      capacity: grua.capacity || '',
      status: grua.status || 'disponivel',
      tipo: grua.tipo || '',
      obraId: grua.currentObraId || '',
      observacoes: grua.observacoes || '',
      createdAt: grua.createdAt || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleDeleteGrua = (grua: any) => {
    setGruaToDelete(grua)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteGrua = async () => {
    if (!gruaToDelete) return

    // Verificar se a grua está em obra
    if (gruaToDelete.status === 'em_obra') {
      toast({
        title: "Informação",
        description: `Não é possível excluir a grua "${gruaToDelete.name}" pois ela está atualmente em obra. Remova-a da obra primeiro.`,
        variant: "default"
      })
      setIsDeleteDialogOpen(false)
      return
    }

    try {
      setDeleting(true)
      
      const response = await gruasApi.excluirGrua(gruaToDelete.id)
      
      if (response.success) {
        // Recarregar a lista de gruas
        await carregarGruas()
        setIsDeleteDialogOpen(false)
        setGruaToDelete(null)
        toast({
        title: "Informação",
        description: `Grua "${gruaToDelete.name}" excluída com sucesso!`,
        variant: "default"
      })
      } else {
        toast({
        title: "Informação",
        description: "Erro ao excluir grua",
        variant: "default"
      })
      }
    } catch (err) {
      console.error('Erro ao excluir grua:', err)
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : 'Erro ao excluir grua',
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleCreateGrua = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setCreating(true)
      
      // Converter dados do frontend para o formato do backend
      const gruaData = converterGruaFrontendParaBackend(gruaFormData)
      
      const response = await gruasApi.criarGrua(gruaData)
      
      if (response.success) {
        // Recarregar a lista de gruas
        await carregarGruas()
        
        // Resetar formulário e fechar dialog
        setGruaFormData({
          name: '',
          model: '',
          fabricante: '',
          capacity: '',
          status: 'disponivel',
          tipo: '',
          obraId: '',
          observacoes: '',
          createdAt: ''
        })
        setIsCreateDialogOpen(false)
        
        toast({
        title: "Informação",
        description: "Grua criada com sucesso!",
        variant: "default"
      })
      } else {
        toast({
        title: "Informação",
        description: "Erro ao criar grua",
        variant: "default"
      })
      }
    } catch (err) {
      console.error('Erro ao criar grua:', err)
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : 'Erro ao criar grua',
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateGrua = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!gruaToEdit) return
    
    try {
      setUpdating(true)
      
      // Converter dados do frontend para o formato do backend
      const gruaData = converterGruaFrontendParaBackend(gruaFormData)
      
      const response = await gruasApi.atualizarGrua(gruaToEdit.id, gruaData)
      
      if (response.success) {
        // Recarregar a lista de gruas
        await carregarGruas()
        
        // Resetar formulário e fechar dialog
        setGruaFormData({
          name: '',
          model: '',
          fabricante: '',
          capacity: '',
          status: 'disponivel',
          tipo: '',
          obraId: '',
          observacoes: '',
          createdAt: ''
        })
        setIsEditDialogOpen(false)
        setGruaToEdit(null)
        
        toast({
        title: "Informação",
        description: "Grua atualizada com sucesso!",
        variant: "default"
      })
      } else {
        toast({
        title: "Informação",
        description: "Erro ao atualizar grua",
        variant: "default"
      })
      }
    } catch (err) {
      console.error('Erro ao atualizar grua:', err)
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : 'Erro ao atualizar grua',
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  const stats = [
    { 
      title: "Total de Gruas", 
      value: gruas.length, 
      icon: Crane, 
      color: "bg-blue-500" 
    },
    { 
      title: "Em Obra", 
      value: gruas.filter(g => g.status === 'em_obra').length, 
      icon: Building2, 
      color: "bg-green-500" 
    },
    { 
      title: "Em Manutenção", 
      value: gruas.filter(g => g.status === 'manutencao').length, 
      icon: Wrench, 
      color: "bg-yellow-500" 
    },
    { 
      title: "Disponíveis", 
      value: gruas.filter(g => g.status === 'disponivel').length, 
      icon: CheckCircle, 
      color: "bg-purple-500" 
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Gruas</h1>
          <p className="text-gray-600">Gerenciamento de gruas e histórico de manutenção</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Nova Grua
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar gruas</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Nome ou modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Disponível">Disponível</SelectItem>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Vendida">Vendida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="Grua Torre">Grua Torre</SelectItem>
                  <SelectItem value="Grua Móvel">Grua Móvel</SelectItem>
                  <SelectItem value="Guincho">Guincho</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setSelectedStatus("all")
                  setSelectedObra("all")
                  setSelectedTipo("all")
                  setCurrentPage(1)
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estados de Loading e Error */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Carregando gruas...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-red-600">
              <span>❌ {error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={carregarGruas}
                className="ml-4"
              >
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Gruas */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGruas.map((grua) => {
          const obra = mockObras.find(o => o.id === grua.currentObraId)
          
          return (
            <Card key={grua.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Crane className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{grua.name}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(grua.status)}>
                    {getStatusIcon(grua.status)}
                    <span className="ml-1 capitalize">{grua.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
                <CardDescription>{grua.model} - {grua.capacity}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {obra && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span>Obra: {obra.name}</span>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Criada em: {new Date(grua.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Ações Principais */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/dashboard/obras/${grua.currentObraId}?tab=livro`}
                        className="flex-1"
                        disabled={!grua.currentObraId}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver na Obra
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditGrua(grua)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteGrua(grua)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Novas Funcionalidades */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/dashboard/gruas/${grua.id}/componentes`}
                        className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Package className="w-4 h-4 mr-1" />
                        Componentes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/dashboard/gruas/${grua.id}/configuracoes`}
                        className="flex-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Configurações
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        </div>
      )}

      {/* Paginação */}
      {!loading && !error && totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600">
                <span>
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} gruas
                </span>
                <div className="flex items-center gap-2">
                  <span>Itens por página:</span>
                  <Select 
                    value={itemsPerPage.toString()} 
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="hidden sm:flex"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="sm:hidden flex items-center gap-2">
                  <span className="text-sm text-gray-600">Página {currentPage} de {totalPages}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="hidden sm:flex"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Criação de Grua */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crane className="w-5 h-5" />
              Nova Grua
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGrua} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Grua *</Label>
                <Input
                  id="name"
                  value={gruaFormData.name}
                  onChange={(e) => setGruaFormData({ ...gruaFormData, name: e.target.value })}
                  placeholder="Ex: Grua 001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  value={gruaFormData.model}
                  onChange={(e) => setGruaFormData({ ...gruaFormData, model: e.target.value })}
                  placeholder="Ex: Liebherr 200HC"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fabricante">Fabricante</Label>
                <Input
                  id="fabricante"
                  value={gruaFormData.fabricante}
                  onChange={(e) => setGruaFormData({ ...gruaFormData, fabricante: e.target.value })}
                  placeholder="Ex: Liebherr, Potain, etc."
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={gruaFormData.tipo}
                  onValueChange={(value) => setGruaFormData({ ...gruaFormData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grua Torre">Grua Torre</SelectItem>
                    <SelectItem value="Grua Móvel">Grua Móvel</SelectItem>
                    <SelectItem value="Guincho">Guincho</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity">Capacidade *</Label>
                <Input
                  id="capacity"
                  value={gruaFormData.capacity}
                  onChange={(e) => setGruaFormData({ ...gruaFormData, capacity: e.target.value })}
                  placeholder="Ex: 200 ton"
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={gruaFormData.status}
                  onValueChange={(value) => setGruaFormData({ ...gruaFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="em_obra">Em Obra</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="inativa">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="obraId">Obra (Opcional)</Label>
              <Select
                value={gruaFormData.obraId || "none"}
                onValueChange={(value) => setGruaFormData({ ...gruaFormData, obraId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma obra (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma obra</SelectItem>
                  {mockObras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Uma grua pode ser criada sem estar atrelada a uma obra
              </p>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={gruaFormData.observacoes}
                onChange={(e) => setGruaFormData({ ...gruaFormData, observacoes: e.target.value })}
                placeholder="Observações sobre a grua..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  'Criar Grua'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Grua */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Grua
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateGrua} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome da Grua *</Label>
                <Input
                  id="edit-name"
                  value={gruaFormData.name}
                  onChange={(e) => setGruaFormData({ ...gruaFormData, name: e.target.value })}
                  placeholder="Ex: Grua 001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-model">Modelo *</Label>
                <Input
                  id="edit-model"
                  value={gruaFormData.model}
                  onChange={(e) => setGruaFormData({ ...gruaFormData, model: e.target.value })}
                  placeholder="Ex: Liebherr 200HC"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-fabricante">Fabricante</Label>
                <Input
                  id="edit-fabricante"
                  value={gruaFormData.fabricante}
                  onChange={(e) => setGruaFormData({ ...gruaFormData, fabricante: e.target.value })}
                  placeholder="Ex: Liebherr, Potain, etc."
                />
              </div>
              <div>
                <Label htmlFor="edit-tipo">Tipo</Label>
                <Select
                  value={gruaFormData.tipo}
                  onValueChange={(value) => setGruaFormData({ ...gruaFormData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grua Torre">Grua Torre</SelectItem>
                    <SelectItem value="Grua Móvel">Grua Móvel</SelectItem>
                    <SelectItem value="Guincho">Guincho</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-capacity">Capacidade *</Label>
                <Input
                  id="edit-capacity"
                  value={gruaFormData.capacity}
                  onChange={(e) => setGruaFormData({ ...gruaFormData, capacity: e.target.value })}
                  placeholder="Ex: 200 ton"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={gruaFormData.status}
                  onValueChange={(value) => setGruaFormData({ ...gruaFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="em_obra">Em Obra</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="inativa">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-obraId">Obra (Opcional)</Label>
              <Select
                value={gruaFormData.obraId || "none"}
                onValueChange={(value) => setGruaFormData({ ...gruaFormData, obraId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma obra (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma obra</SelectItem>
                  {mockObras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Uma grua pode ser editada sem estar atrelada a uma obra
              </p>
            </div>

            <div>
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea
                id="edit-observacoes"
                value={gruaFormData.observacoes}
                onChange={(e) => setGruaFormData({ ...gruaFormData, observacoes: e.target.value })}
                placeholder="Observações sobre a grua..."
                rows={3}
              />
            </div>

            {gruaFormData.createdAt && (
              <div>
                <Label htmlFor="edit-createdAt">Criada em</Label>
                <Input
                  id="edit-createdAt"
                  value={new Date(gruaFormData.createdAt).toLocaleDateString('pt-BR')}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setGruaToEdit(null)
                }}
                disabled={updating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Atualizando...
                  </>
                ) : (
                  'Atualizar Grua'
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
              Tem certeza que deseja excluir a grua <strong>{gruaToDelete?.name}</strong>?
            </p>
            <p className="text-xs text-red-600">
              ⚠️ Esta ação não pode ser desfeita. A grua será permanentemente removida do sistema.
            </p>
            {gruaToDelete?.status === 'em_obra' && (
              <p className="text-xs text-orange-600">
                ⚠️ Esta grua está atualmente em obra. A exclusão será bloqueada.
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
              onClick={confirmDeleteGrua}
              disabled={gruaToDelete?.status === 'em_obra' || deleting}
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

