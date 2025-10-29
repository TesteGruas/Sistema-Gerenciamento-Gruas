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
import { gruasApi, type GruaBackend } from "@/lib/api-gruas"
import { ExportButton } from "@/components/export-button"
import { Loading, PageLoading, TableLoading, CardLoading, useLoading } from "@/components/ui/loading"
import { ProtectedRoute } from "@/components/protected-route"

// Interface para o formato da grua usado no componente
interface GruaFrontend extends GruaBackend {
  createdAt?: string
  observacoes?: string
}

// Interface para a resposta da API com paginação
interface GruasApiResponse {
  success: boolean
  data: any[]
  pagination?: {
    total: number
    pages: number
    page: number
    limit: number
  }
}

export default function GruasPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedObra, setSelectedObra] = useState("all")
  const [selectedTipo, setSelectedTipo] = useState("all")
  
  // Verificação de segurança para API
  if (!gruasApi) {
    console.error('gruasApi não está definido!')
  }
  const [selectedGrua, setSelectedGrua] = useState<GruaFrontend | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [gruaToDelete, setGruaToDelete] = useState<GruaFrontend | null>(null)
  const [gruaToEdit, setGruaToEdit] = useState<GruaFrontend | null>(null)
  const [gruaToView, setGruaToView] = useState<GruaFrontend | null>(null)
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(9)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  const [gruaFormData, setGruaFormData] = useState<{
    name: string
    model: string
    fabricante: string
    capacity: string
    status: 'disponivel' | 'em_obra' | 'manutencao' | 'inativa'
    tipo: string
    observacoes: string
    createdAt: string
  }>({
    name: '',
    model: '',
    fabricante: '',
    capacity: '',
    status: 'disponivel',
    tipo: '',
    observacoes: '',
    createdAt: ''
  })
  
  // Estados para API
  const [gruas, setGruas] = useState<GruaFrontend[]>([])
  const { loading, startLoading, stopLoading } = useLoading(true)
  const [error, setError] = useState<string | null>(null)
  const { loading: creating, startLoading: startCreating, stopLoading: stopCreating, setLoading: setCreating } = useLoading()
  const { loading: updating, startLoading: startUpdating, stopLoading: stopUpdating, setLoading: setUpdating } = useLoading()
  const [deleting, setDeleting] = useState(false)

  // Função auxiliar para converter dados do backend para o formato do componente
  const converterGruaBackend = (grua: any): GruaFrontend => {
    const converted = {
      id: grua.id,
      name: grua.name || grua.nome,
      model: grua.model || grua.modelo,
      modelo: grua.modelo || grua.model,
      fabricante: grua.fabricante || 'Não informado',
      tipo: grua.tipo || 'Não informado',
      capacity: grua.capacity || grua.capacidade,
      capacidade: grua.capacidade || grua.capacity,
      status: grua.status || 'disponivel',
      currentObraId: grua.current_obra_id || grua.currentObraId || grua.obra_id,
      currentObraName: grua.current_obra_name || grua.currentObraName,
      observacoes: grua.observacoes || 'Nenhuma observação registrada',
      createdAt: grua.created_at || grua.createdAt,
      created_at: grua.created_at || grua.createdAt,
      updated_at: grua.updated_at || grua.updatedAt,
    }
    
    return converted
  }

  // Função para carregar gruas da API
  const carregarGruas = async () => {
    try {
      startLoading()
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
      
      // Adicionar parâmetros de pesquisa se fornecidos
      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      
      // Adicionar filtro por grua_id se fornecido
      if (searchTerm.trim() && searchTerm.match(/^G[A-Z0-9-]+$/)) {
        // Se o termo de busca parece ser um ID de grua (começa com G e tem formato específico)
        params.grua_id = searchTerm.trim()
        delete params.search // Remover search se for um ID
      }
      
      const response = await gruasApi.listarGruas(params) as unknown as GruasApiResponse
      
      if (response.success) {
        const gruasConvertidas = response.data.map(converterGruaBackend)
        setGruas(gruasConvertidas)
        
        // Atualizar informações de paginação se disponíveis na resposta
        if (response.pagination) {
          setTotalItems(response.pagination.total)
          setTotalPages(response.pagination.pages)
        } else {
          // Fallback: calcular baseado nos dados recebidos
          setTotalItems(gruasConvertidas.length)
          setTotalPages(Math.ceil(gruasConvertidas.length / itemsPerPage))
        }
      } else {
        setError('Erro ao carregar gruas')
      }
    } catch (err) {
      console.error('Erro ao carregar gruas:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar gruas')
    } finally {
      stopLoading()
    }
  }

  
  // Carregar gruas quando o componente montar ou filtros mudarem
  useEffect(() => {
    carregarGruas()
  }, [selectedStatus, selectedTipo, currentPage, itemsPerPage])

  // Debounce para pesquisa
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        setCurrentPage(1) // Reset para primeira página ao pesquisar
        carregarGruas()
      }
    }, 500) // 500ms de delay

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Aplicar filtros da URL
  useEffect(() => {
    const obraParam = searchParams.get('obra')
    
    if (obraParam) {
      setSelectedObra(obraParam)
    }
  }, [searchParams])

  // Aplicar filtros locais apenas para campos não suportados pela API
  const filteredGruas = gruas.filter(grua => {
    // Filtro por obra - aplicado localmente (não suportado pela API)
    const matchesObra = selectedObra === "all" || grua.currentObraId === selectedObra
    
    return matchesObra
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

  const handleViewDetails = async (grua: GruaFrontend) => {
    try {
      // Fazer GET específico da grua para obter dados completos
      const response = await gruasApi.obterGrua(grua.id)
      
      if (response.success && response.data) {
        const gruaCompleta = converterGruaBackend(response.data)
        setGruaToView(gruaCompleta)
        setIsViewDialogOpen(true)
      } else {
        // Fallback para dados locais
        setGruaToView(grua)
        setIsViewDialogOpen(true)
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da grua:', error)
      // Fallback para dados locais
      setGruaToView(grua)
      setIsViewDialogOpen(true)
    }
  }

  // Funções simplificadas para atualizar o formulário
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, name: e.target.value }))
  }

  const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, model: e.target.value }))
  }

  const handleFabricanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, fabricante: e.target.value }))
  }

  const handleTipoChange = (value: string) => {
    setGruaFormData(prev => ({ ...prev, tipo: value }))
  }

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, capacity: e.target.value }))
  }

  const handleStatusChange = (value: string) => {
    setGruaFormData(prev => ({ ...prev, status: value as 'disponivel' | 'em_obra' | 'manutencao' | 'inativa' }))
  }

  const handleObservacoesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGruaFormData(prev => ({ ...prev, observacoes: e.target.value }))
  }


  // Função para exportar gruas com GET de 9999 itens
  const handleExportGruas = async (formato: 'pdf' | 'excel' | 'csv') => {
    try {
      // Fazer GET com limite de 9999 itens
      const response = await gruasApi.listarGruas({ 
        limit: 9999,
        page: 1
      }) as unknown as GruasApiResponse
      
      if (response.success && response.data) {
        const todasGruas = response.data.map(converterGruaBackend)
        
        // Exportar usando a função local do ExportButton
        await exportarLocal(todasGruas, formato)
      } else {
        throw new Error('Erro ao carregar dados para exportação')
      }
    } catch (error) {
      console.error('Erro ao exportar gruas:', error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar as gruas.",
        variant: "destructive"
      })
    }
  }

  // Função para exportação local
  const exportarLocal = async (dados: GruaFrontend[], formato: 'pdf' | 'excel' | 'csv') => {
    if (formato === 'csv') {
      exportarCSV(dados)
    } else if (formato === 'excel') {
      await exportarExcel(dados)
    } else if (formato === 'pdf') {
      await exportarPDF(dados)
    }
  }

  const exportarCSV = (dados: GruaFrontend[]) => {
    const headers = ['Nome', 'Modelo', 'Fabricante', 'Capacidade', 'Status', 'Tipo', 'Obra Atual', 'Data Criação']
    const csvContent = [
      headers.join(','),
      ...dados.map(grua => [
        grua.name || '',
        grua.model || '',
        grua.fabricante || '',
        grua.capacity || '',
        grua.status || '',
        grua.tipo || '',
        grua.currentObraName || '',
        grua.createdAt ? new Date(grua.createdAt).toLocaleDateString('pt-BR') : ''
      ].map(value => typeof value === 'string' && value.includes(',') ? `"${value}"` : value).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-gruas-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: "Exportação concluída!",
      description: "Arquivo CSV baixado com sucesso.",
    })
  }

  const exportarExcel = async (dados: GruaFrontend[]) => {
    try {
      const XLSX = await import('xlsx')
      
      const worksheet = XLSX.utils.json_to_sheet(dados.map(grua => ({
        'Nome': grua.name || '',
        'Modelo': grua.model || '',
        'Fabricante': grua.fabricante || '',
        'Capacidade': grua.capacity || '',
        'Status': grua.status || '',
        'Tipo': grua.tipo || '',
        'Obra Atual': grua.currentObraName || '',
        'Data Criação': grua.createdAt ? new Date(grua.createdAt).toLocaleDateString('pt-BR') : ''
      })))

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Gruas')
      
      XLSX.writeFile(workbook, `relatorio-gruas-${new Date().toISOString().split('T')[0]}.xlsx`)

      toast({
        title: "Exportação concluída!",
        description: "Arquivo Excel baixado com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      throw error
    }
  }

  const exportarPDF = async (dados: GruaFrontend[]) => {
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF()
      
      // Título
      doc.setFontSize(16)
      doc.text('Relatório de Gruas', 14, 22)
      doc.setFontSize(10)
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30)
      doc.text(`Total de gruas: ${dados.length}`, 14, 36)

      // Dados da tabela
      const headers = ['Nome', 'Modelo', 'Fabricante', 'Capacidade', 'Status', 'Tipo', 'Obra Atual', 'Data Criação']
      const tableData = dados.map(grua => [
        grua.name || '',
        grua.model || '',
        grua.fabricante || '',
        grua.capacity || '',
        grua.status || '',
        grua.tipo || '',
        grua.currentObraName || '',
        grua.createdAt ? new Date(grua.createdAt).toLocaleDateString('pt-BR') : ''
      ])

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })

      doc.save(`relatorio-gruas-${new Date().toISOString().split('T')[0]}.pdf`)

      toast({
        title: "Exportação concluída!",
        description: "Arquivo PDF baixado com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      throw error
    }
  }

  const handleEditGrua = (grua: GruaFrontend) => {
    setGruaToEdit(grua)
    
    // Normalizar status para os valores aceitos
    const normalizarStatus = (status: any): 'disponivel' | 'em_obra' | 'manutencao' | 'inativa' => {
      const statusMap: Record<string, 'disponivel' | 'em_obra' | 'manutencao' | 'inativa'> = {
        'disponivel': 'disponivel',
        'Disponível': 'disponivel',
        'em_obra': 'em_obra',
        'Operacional': 'em_obra',
        'manutencao': 'manutencao',
        'Manutenção': 'manutencao',
        'inativa': 'inativa',
        'Vendida': 'inativa',
      }
      return statusMap[status] || 'disponivel'
    }
    
    setGruaFormData({
      name: grua.name || '',
      model: grua.model || grua.modelo || '',
      fabricante: grua.fabricante || '',
      capacity: grua.capacity || grua.capacidade || '',
      status: normalizarStatus(grua.status),
      tipo: grua.tipo || '',
      observacoes: grua.observacoes || '',
      createdAt: grua.createdAt || grua.created_at || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleDeleteGrua = (grua: GruaFrontend) => {
    setGruaToDelete(grua)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteGrua = async () => {
    if (!gruaToDelete) return

    // Normalizar o status para comparação
    const statusNormalizado = gruaToDelete.status?.toLowerCase().replace(/\s/g, '_')
    
    // Verificar se a grua está em obra
    if (statusNormalizado === 'em_obra' || gruaToDelete.status === 'Operacional') {
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
      
      const response = await gruasApi.deletarGrua(gruaToDelete.id)
      
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
      startCreating()
      
      // Converter dados do formulário para o formato do backend
      const gruaData = {
        name: gruaFormData.name,
        model: gruaFormData.model,
        capacity: gruaFormData.capacity,
        status: gruaFormData.status,
        fabricante: gruaFormData.fabricante || undefined,
        tipo: gruaFormData.tipo || undefined,
        observacoes: gruaFormData.observacoes || undefined,
      }
      
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
      stopCreating()
    }
  }

  const handleUpdateGrua = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!gruaToEdit) return
    
    try {
      startUpdating()
      
      // Converter dados do formulário para o formato do backend
      const gruaData = {
        name: gruaFormData.name,
        model: gruaFormData.model,
        capacity: gruaFormData.capacity,
        status: gruaFormData.status,
        fabricante: gruaFormData.fabricante || undefined,
        tipo: gruaFormData.tipo || undefined,
        observacoes: gruaFormData.observacoes || undefined,
      }
      
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
      stopUpdating()
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
    <ProtectedRoute permission="gruas:visualizar" showAccessDenied={true}>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Gruas</h1>
          <p className="text-gray-600">Gerenciamento de gruas e histórico de manutenção</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            dados={gruas}
            tipo="gruas"
            nomeArquivo="relatorio-gruas"
            titulo="Relatório de Gruas"
            onExport={handleExportGruas}
          />
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Nova Grua
          </Button>
        </div>
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
                  placeholder="Nome, modelo ou ID da grua (ex: G001)..."
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
                  <SelectItem value="Grua Torre Auto Estável">Grua Torre Auto Estável</SelectItem>
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
            <Loading size="lg" text="Carregando gruas..." />
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

      {/* Descrição das Funcionalidades */}
      {!loading && !error && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Componentes</h3>
                  <p className="text-sm text-gray-600">
                    Gerencie os componentes e peças da grua, incluindo cabos, ganchos, 
                    sistemas hidráulicos e outros equipamentos essenciais para o funcionamento.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Configurações</h3>
                  <p className="text-sm text-gray-600">
                    Configure parâmetros técnicos, limites de operação, especificações 
                    de segurança e outras configurações específicas da grua.
                  </p>
                </div>
              </div>
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
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(grua.status)}>
                      {getStatusIcon(grua.status)}
                      <span className="ml-1 capitalize">{grua.status.replace('_', ' ')}</span>
                    </Badge>
                    
                    {/* Ações com ícones */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(grua)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Ver Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditGrua(grua)}
                        className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGrua(grua)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardDescription>{grua.model} - {grua.capacity}</CardDescription>
                {grua.tipo && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Package className="w-4 h-4" />
                    <span>Tipo: {grua.tipo}</span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {obra && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span>Obra: {obra.name}</span>
                    </div>
                  )}
                  
                  {grua.createdAt && (
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Criada em: {new Date(grua.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {/* Funcionalidades */}
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
                      <SelectItem value="9">9</SelectItem>
                      <SelectItem value="18">18</SelectItem>
                      <SelectItem value="27">27</SelectItem>
                      <SelectItem value="36">36</SelectItem>
                      <SelectItem value="45">45</SelectItem>
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
                  onChange={handleNameChange}
                  placeholder="Ex: Grua 001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  value={gruaFormData.model}
                  onChange={handleModelChange}
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
                  onChange={handleFabricanteChange}
                  placeholder="Ex: Liebherr, Potain, etc."
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={gruaFormData.tipo}
                  onValueChange={handleTipoChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grua Torre">Grua Torre</SelectItem>
                    <SelectItem value="Grua Torre Auto Estável">Grua Torre Auto Estável</SelectItem>
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
                  onChange={handleCapacityChange}
                  placeholder="Ex: 200 ton"
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={gruaFormData.status}
                  onValueChange={handleStatusChange}
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
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={gruaFormData.observacoes}
                onChange={handleObservacoesChange}
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
                  onChange={handleNameChange}
                  placeholder="Ex: Grua 001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-model">Modelo *</Label>
                <Input
                  id="edit-model"
                  value={gruaFormData.model}
                  onChange={handleModelChange}
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
                  onChange={handleFabricanteChange}
                  placeholder="Ex: Liebherr, Potain, etc."
                />
              </div>
              <div>
                <Label htmlFor="edit-tipo">Tipo</Label>
                <Select
                  value={gruaFormData.tipo}
                  onValueChange={handleTipoChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grua Torre">Grua Torre</SelectItem>
                    <SelectItem value="Grua Torre Auto Estável">Grua Torre Auto Estável</SelectItem>
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
                  onChange={handleCapacityChange}
                  placeholder="Ex: 200 ton"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={gruaFormData.status}
                  onValueChange={handleStatusChange}
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
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea
                id="edit-observacoes"
                value={gruaFormData.observacoes}
                onChange={handleObservacoesChange}
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

      {/* Dialog de Visualização de Detalhes */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Detalhes da Grua
            </DialogTitle>
          </DialogHeader>
          
          {gruaToView && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nome</Label>
                    <p className="text-lg font-semibold">{gruaToView.name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Modelo</Label>
                    <p className="text-base">{gruaToView.model}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Fabricante</Label>
                    <p className="text-base">{gruaToView.fabricante || 'Não informado'}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Capacidade</Label>
                    <p className="text-base">{gruaToView.capacity}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(gruaToView.status)}
                      <Badge 
                        variant={gruaToView.status === 'disponivel' ? 'default' : 
                                gruaToView.status === 'em_obra' ? 'secondary' :
                                gruaToView.status === 'manutencao' ? 'destructive' : 'outline'}
                        className="text-xs"
                      >
                        {gruaToView.status === 'disponivel' ? 'Disponível' :
                         gruaToView.status === 'em_obra' ? 'Em Obra' :
                         gruaToView.status === 'manutencao' ? 'Manutenção' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Tipo</Label>
                    <p className="text-base">{gruaToView.tipo || 'Não informado'}</p>
                  </div>
                  
                  {gruaToView.currentObraName && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Obra Atual</Label>
                      <p className="text-base">{gruaToView.currentObraName}</p>
                    </div>
                  )}
                  
                  {gruaToView.createdAt && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Data de Criação</Label>
                      <p className="text-base">{new Date(gruaToView.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Observações */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Observações</Label>
                <p className="text-base mt-1 p-3 bg-gray-50 rounded-md">
                  {gruaToView.observacoes || 'Nenhuma observação registrada'}
                </p>
              </div>
              
              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleEditGrua(gruaToView)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Grua
                </Button>
                
                {gruaToView.currentObraId && (
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = `/dashboard/obras/${gruaToView.currentObraId}?tab=livro`}
                    className="flex-1"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Ver na Obra
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => window.location.href = `/dashboard/gruas/${gruaToView.id}/componentes`}
                  className="flex-1"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Componentes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </ProtectedRoute>
  )
}

