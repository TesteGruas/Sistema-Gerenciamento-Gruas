"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  User,
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
  Package,
  Settings,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"
import { mockObras, mockGruas, getGruasByObra, getCustosByObra, mockUsers, mockCustosMensais, CustoMensal, mockClientes, getClientesAtivos } from "@/lib/mock-data"
import { obrasApi, converterObraBackendParaFrontend, converterObraFrontendParaBackend, ObraBackend, checkAuthentication, ensureAuthenticated } from "@/lib/api-obras"
import ClienteSearch from "@/components/cliente-search"
import GruaSearch from "@/components/grua-search"
import FuncionarioSearch from "@/components/funcionario-search"
import { CardLoader, ButtonLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"

export default function ObrasPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingObra, setEditingObra] = useState<any>(null)
  const [obraToDelete, setObraToDelete] = useState<any>(null)
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(9)
  
  // Estados para integração com backend
  const [obras, setObras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    pages: 0
  })
  const [obraFormData, setObraFormData] = useState({
    name: '',
    description: '',
    status: 'Em Andamento',
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
    // Dados do responsável
    responsavelId: '',
    responsavelName: '',
    // Lista de funcionários
    funcionarios: [] as Array<{
      id: string
      userId: string
      role: string
      name: string
      gruaId?: string
    }>
  })
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
  const [gruaSelecionada, setGruaSelecionada] = useState<any>(null)
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<any[]>([])
  const [responsavelSelecionado, setResponsavelSelecionado] = useState<any>(null)
  
  // Estados para custos mensais
  const [custosMensais, setCustosMensais] = useState<CustoMensal[]>([])
  const [isCustosDialogOpen, setIsCustosDialogOpen] = useState(false)
  const [custoForm, setCustoForm] = useState({
    item: '',
    descricao: '',
    unidade: '',
    quantidadeOrcamento: 0,
    valorUnitario: 0,
    totalOrcamento: 0,
    mes: new Date().toISOString().slice(0, 7)
  })

  // Carregar obras do backend com paginação
  const carregarObras = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await obrasApi.listarObras({ 
        page: currentPage,
        limit: itemsPerPage
      })
      
      // Converter obras - os relacionamentos já vêm incluídos no endpoint
      const obrasComRelacionamentos = response.data.map((obraBackend: any) => {
        return converterObraBackendParaFrontend(obraBackend)
      })
      
      setObras(obrasComRelacionamentos)
      
      // Atualizar informações de paginação da API
      if (response.pagination) {
        setPagination(response.pagination)
      }
    } catch (err) {
      console.error('Erro ao carregar obras:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar obras')
      // Fallback para dados mockados em caso de erro
      setObras(mockObras)
    } finally {
      setLoading(false)
    }
  }

  // Funções para custos mensais
  const adicionarCustoMensal = () => {
    const novoCusto: CustoMensal = {
      id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      obraId: editingObra?.id || '',
      item: custoForm.item,
      descricao: custoForm.descricao,
      unidade: custoForm.unidade,
      quantidadeOrcamento: custoForm.quantidadeOrcamento,
      valorUnitario: custoForm.valorUnitario,
      totalOrcamento: custoForm.quantidadeOrcamento * custoForm.valorUnitario,
      mes: custoForm.mes,
      quantidadeRealizada: 0,
      valorRealizado: 0,
      quantidadeAcumulada: 0,
      valorAcumulado: 0,
      quantidadeSaldo: custoForm.quantidadeOrcamento,
      valorSaldo: custoForm.quantidadeOrcamento * custoForm.valorUnitario,
      tipo: 'contrato',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setCustosMensais([...custosMensais, novoCusto])
    setCustoForm({
      item: '',
      descricao: '',
      unidade: '',
      quantidadeOrcamento: 0,
      valorUnitario: 0,
      totalOrcamento: 0,
      mes: new Date().toISOString().slice(0, 7)
    })
  }

  const removerCustoMensal = (id: string) => {
    setCustosMensais(custosMensais.filter(custo => custo.id !== id))
  }

  const duplicarCustosParaMes = (mes: string) => {
    const custosDuplicados = custosMensais.map(custo => ({
      ...custo,
      id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mes: mes,
      quantidadeRealizada: 0,
      valorRealizado: 0,
      quantidadeAcumulada: custo.quantidadeAcumulada,
      valorAcumulado: custo.valorAcumulado,
      quantidadeSaldo: custo.quantidadeOrcamento,
      valorSaldo: custo.totalOrcamento,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
    
    setCustosMensais([...custosMensais, ...custosDuplicados])
  }

  // Função para lidar com seleção de cliente
  const handleClienteSelect = (cliente: any) => {
    setClienteSelecionado(cliente)
    if (cliente) {
      setObraFormData({ ...obraFormData, clienteId: cliente.id })
    } else {
      setObraFormData({ ...obraFormData, clienteId: '' })
    }
  }

  // Função para lidar com seleção de grua
  const handleGruaSelect = (grua: any) => {
    setGruaSelecionada(grua)
    if (grua) {
      setObraFormData({ ...obraFormData, gruaId: grua.id })
    } else {
      setObraFormData({ ...obraFormData, gruaId: '' })
    }
  }

  // Função para adicionar funcionário selecionado
  const handleFuncionarioSelect = (funcionario: any) => {
    if (funcionario && !funcionariosSelecionados.find(f => f.userId === funcionario.id)) {
      const novoFuncionario = {
        id: Date.now().toString(),
        userId: funcionario.id,
        role: funcionario.role,
        name: funcionario.name,
        gruaId: obraFormData.gruaId // Associar funcionário à grua selecionada
      }
      setFuncionariosSelecionados([...funcionariosSelecionados, novoFuncionario])
      setObraFormData({
        ...obraFormData,
        funcionarios: [...obraFormData.funcionarios, novoFuncionario]
      })
    }
  }

  // Função para remover funcionário selecionado
  const removeFuncionarioSelecionado = (funcionarioId: string) => {
    setFuncionariosSelecionados(funcionariosSelecionados.filter(f => f.id !== funcionarioId))
    setObraFormData({
      ...obraFormData,
      funcionarios: obraFormData.funcionarios.filter(f => f.id !== funcionarioId)
    })
  }

  // Função para lidar com seleção de responsável
  const handleResponsavelSelect = (responsavel: any) => {
    setResponsavelSelecionado(responsavel)
    if (responsavel) {
      setObraFormData({
        ...obraFormData,
        responsavelId: responsavel.id,
        responsavelName: responsavel.name || responsavel.nome
      })
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

  // Recarregar obras quando página ou itens por página mudarem
  useEffect(() => {
    if (currentPage > 0 && itemsPerPage > 0) {
      carregarObras()
    }
  }, [currentPage, itemsPerPage])

  // Função de busca via API
  const buscarObras = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await obrasApi.listarObras({ 
        page: currentPage,
        limit: itemsPerPage,
        // Adicionar parâmetros de busca se a API suportar
        // Por enquanto, vamos fazer busca local após carregar
      })
      
      // Converter obras
      const obrasComRelacionamentos = response.data.map((obraBackend: any) => {
        return converterObraBackendParaFrontend(obraBackend)
      })
      
      // Aplicar filtro de busca localmente
      const obrasFiltradas = searchTerm.trim() 
        ? obrasComRelacionamentos.filter(obra =>
            (obra.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (obra.description || '').toLowerCase().includes(searchTerm.toLowerCase())
          )
        : obrasComRelacionamentos
      
      setObras(obrasFiltradas)
      
      // Atualizar informações de paginação da API
      if (response.pagination) {
        setPagination(response.pagination)
      }
    } catch (err) {
      console.error('Erro ao buscar obras:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar obras')
      setObras(mockObras)
    } finally {
      setLoading(false)
    }
  }

  // Como a paginação é feita no backend, não precisamos filtrar localmente
  // Apenas aplicamos filtro de busca se necessário
  const filteredObras = searchTerm.trim() 
    ? obras.filter(obra =>
        (obra.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (obra.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : obras

  // Usar dados de paginação da API
  const totalPages = pagination.pages || 1
  const startIndex = ((currentPage - 1) * itemsPerPage) + 1
  const endIndex = Math.min(currentPage * itemsPerPage, pagination.total || obras.length)
  const paginatedObras = filteredObras

  // Função para resetar página quando termo de busca muda e buscar obras
  useEffect(() => {
    setCurrentPage(1)
    if (searchTerm.trim()) {
      buscarObras()
    } else {
      carregarObras()
    }
  }, [searchTerm])

  // Funções de paginação completas
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)
  const goToPreviousPage = () => goToPage(currentPage - 1)
  const goToNextPage = () => goToPage(currentPage + 1)

  const changePageSize = (newLimit: number) => {
    setItemsPerPage(newLimit)
    setCurrentPage(1)
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
  }

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
      case 'Planejamento': return 'bg-blue-100 text-blue-800'
      case 'Em Andamento': return 'bg-green-100 text-green-800'
      case 'Pausada': return 'bg-yellow-100 text-yellow-800'
      case 'Concluída': return 'bg-gray-100 text-gray-800'
      case 'Cancelada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Planejamento': return <Clock className="w-4 h-4" />
      case 'Em Andamento': return <CheckCircle className="w-4 h-4" />
      case 'Pausada': return <Clock className="w-4 h-4" />
      case 'Concluída': return <CheckCircle className="w-4 h-4" />
      case 'Cancelada': return <AlertCircle className="w-4 h-4" />
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
              // Dados do responsável
              responsavelId: obraFormData.responsavelId,
              responsavelName: obraFormData.responsavelName,
              // Dados da grua selecionada
              gruaId: obraFormData.gruaId,
              gruaValue: obraFormData.gruaValue,
              monthlyFee: obraFormData.monthlyFee,
              // Dados dos funcionários selecionados
              funcionarios: funcionariosSelecionados,
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
        status: 'Em Andamento',
        startDate: '',
        endDate: '',
        budget: '',
        location: '',
        clienteId: '',
        observations: '',
        gruaId: '',
        gruaValue: '',
        monthlyFee: '',
        responsavelId: '',
        responsavelName: '',
        funcionarios: []
      })
      setClienteSelecionado(null)
      setGruaSelecionada(null)
      setFuncionariosSelecionados([])
      setIsCreateDialogOpen(false)
      
      // Mostrar mensagem de sucesso
      toast({
        title: "Sucesso",
        description: "Obra criada com sucesso! Custos iniciais foram configurados automaticamente.",
        variant: "default"
      })
      
    } catch (err) {
      console.error('Erro ao criar obra:', err)
      toast({
        title: "Erro",
        description: `Erro ao criar obra: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        variant: "destructive"
      })
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
        toast({
          title: "Não é possível excluir",
          description: `A obra "${obraToDelete.name}" possui ${gruasVinculadas.length} grua(s) vinculada(s). Remova as gruas primeiro.`,
          variant: "destructive"
        })
        setIsDeleteDialogOpen(false)
        return
      }

      // Verificar se a obra tem custos
      const custos = getCustosByObra(obraToDelete.id)
      if (custos.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: `A obra "${obraToDelete.name}" possui ${custos.length} custo(s) registrado(s). Remova os custos primeiro.`,
          variant: "destructive"
        })
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
      toast({
        title: "Sucesso",
        description: `Obra "${obraToDelete.name}" excluída com sucesso!`,
        variant: "default"
      })
      
    } catch (err) {
      console.error('Erro ao excluir obra:', err)
      toast({
        title: "Erro",
        description: `Erro ao excluir obra: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleEditObra = async (obra: any) => {
    setEditingObra(obra)
    
    // Carregar relacionamentos da obra
    try {
      const [gruasResponse, funcionariosResponse] = await Promise.all([
        obrasApi.buscarGruasVinculadas(parseInt(obra.id)),
        obrasApi.buscarFuncionariosVinculados(parseInt(obra.id))
      ])
      
      // Preencher dados da grua se existir
      let gruaId = ''
      let gruaValue = ''
      let monthlyFee = ''
      if (gruasResponse.data && gruasResponse.data.length > 0) {
        const gruaVinculada = gruasResponse.data[0]
        gruaId = gruaVinculada.gruaId
        monthlyFee = gruaVinculada.valorLocacaoMensal?.toString() || ''
        // O valor da grua não está disponível nos dados de relacionamento
        gruaValue = ''
      }
      
      // Preencher dados dos funcionários se existirem
      const funcionarios = funcionariosResponse.data?.map((func: any) => ({
        id: func.id.toString(),
        userId: func.funcionarioId.toString(),
        role: func.observacoes?.includes('(') ? 
          func.observacoes.split('(')[1]?.split(')')[0] || 'Funcionário' : 
          'Funcionário',
        name: func.observacoes?.includes('Funcionário') ? 
          func.observacoes.split('Funcionário ')[1]?.split(' (')[0] || 'Funcionário' : 
          'Funcionário',
        gruaId: func.gruaId
      })) || []
      
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
        // Dados da grua vinculada
        gruaId: gruaId,
        gruaValue: gruaValue,
        monthlyFee: monthlyFee,
        // Dados do responsável
        responsavelId: obra.responsavelId || '',
        responsavelName: obra.responsavelName || '',
        funcionarios: funcionarios
      })
      
      // Atualizar estados dos componentes de busca
      if (gruaId) {
        // Buscar dados completos da grua
        // Por enquanto, vamos usar dados básicos
        setGruaSelecionada({
          id: gruaId,
          name: `Grua ${gruaId}`,
          model: 'Modelo não disponível',
          manufacturer: 'Fabricante não disponível',
          capacity: 'Capacidade não disponível'
        })
      }
      
      setFuncionariosSelecionados(funcionarios)
      
      // Carregar responsável se existir
      if (obra.responsavelId && obra.responsavelName) {
        setResponsavelSelecionado({
          id: obra.responsavelId,
          name: obra.responsavelName,
          nome: obra.responsavelName
        })
      }
      
    } catch (error) {
      console.error('Erro ao carregar relacionamentos da obra:', error)
      
      // Preencher formulário básico em caso de erro
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
        gruaId: '',
        gruaValue: '',
        monthlyFee: '',
        responsavelId: '',
        responsavelName: '',
        funcionarios: []
      })
    }
    
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
        // Dados do responsável
        responsavelId: obraFormData.responsavelId,
        responsavelName: obraFormData.responsavelName,
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
        status: 'Em Andamento',
        startDate: '',
        endDate: '',
        budget: '',
        location: '',
        clienteId: '',
        observations: '',
        gruaId: '',
        gruaValue: '',
        monthlyFee: '',
        responsavelId: '',
        responsavelName: '',
        funcionarios: []
      })
      setClienteSelecionado(null)
      setGruaSelecionada(null)
      setFuncionariosSelecionados([])
      
      // Mostrar mensagem de sucesso
      toast({
        title: "Sucesso",
        description: "Obra atualizada com sucesso!",
        variant: "default"
      })
      
    } catch (err) {
      console.error('Erro ao atualizar obra:', err)
      toast({
        title: "Erro",
        description: `Erro ao atualizar obra: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        variant: "destructive"
      })
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
          onClick={() => router.push('/dashboard/obras/nova')}
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
            <CardLoader text="Carregando obras..." />
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
        <div className={`grid gap-6 ${
          paginatedObras.length >= 9 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : paginatedObras.length >= 6 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : paginatedObras.length >= 3
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 md:grid-cols-2'
        }`}>
          {paginatedObras.map((obra) => {
          const custos = getCustosByObra(obra.id)
          const obraComRelacionamentos = obra as any
          
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
                    <span>Orçamento: R$ {obra.budget.toLocaleString('pt-BR')}</span>
                  </div>
                  
                  {/* Gruas Vinculadas */}
                  {obraComRelacionamentos.gruasVinculadas && obraComRelacionamentos.gruasVinculadas.length > 0 && (
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Crane className="w-4 h-4 text-blue-600" />
                        Gruas ({obraComRelacionamentos.gruasVinculadas.length})
                      </h4>
                      <div className="space-y-2">
                        {obraComRelacionamentos.gruasVinculadas.slice(0, 2).map((grua: any) => (
                          <div key={grua.id} className="text-xs bg-blue-50 p-2 rounded border">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{grua.gruaId}</span>
                              <Badge variant="default" className="text-xs">
                                {grua.status}
                              </Badge>
                            </div>
                            <div className="mt-1 text-gray-600">
                              <div>Mensalidade: R$ {parseFloat(grua.valorLocacaoMensal).toLocaleString('pt-BR')}</div>
                              <div>Início: {new Date(grua.dataInicioLocacao).toLocaleDateString('pt-BR')}</div>
                            </div>
                          </div>
                        ))}
                        {obraComRelacionamentos.gruasVinculadas.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{obraComRelacionamentos.gruasVinculadas.length - 2} mais...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  
                  <div className="space-y-2">
                    {/* Ações Principais */}
                    <div className="flex gap-2">
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
                    
                    {/* Nova Funcionalidade - Múltiplas Gruas */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/dashboard/obras/${obra.id}?tab=gruas`}
                        className="flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200 font-medium bg-orange-50 shadow-sm"
                      >
                        <Crane className="w-4 h-4 mr-1" />
                        Gerenciar Gruas
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

      {/* Controles de Paginação */}
      {!loading && !error && filteredObras.length > 0 && totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Informações da paginação */}
              <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600">
                <span>
                  Mostrando {startIndex} a{' '}
                  {endIndex} de{' '}
                  {pagination.total || filteredObras.length} obras
                </span>
                
                {/* Seletor de itens por página */}
                <div className="flex items-center gap-2">
                  <span>Itens por página:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => changePageSize(Number(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">9</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="18">18</SelectItem>
                      <SelectItem value="21">21</SelectItem>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="27">27</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Controles de navegação */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="hidden sm:flex"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Números das páginas */}
                <div className="hidden sm:flex items-center gap-1">
                  {(() => {
                    const pages = []
                    const totalPagesCount = totalPages
                    const currentPageNum = currentPage
                    
                    // Mostrar até 5 páginas
                    let startPage = Math.max(1, currentPageNum - 2)
                    let endPage = Math.min(totalPagesCount, startPage + 4)
                    
                    // Ajustar se estivermos no final
                    if (endPage - startPage < 4) {
                      startPage = Math.max(1, endPage - 4)
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={currentPageNum === i ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(i)}
                          className="w-8 h-8 p-0"
                        >
                          {i}
                        </Button>
                      )
                    }
                    
                    return pages
                  })()}
                </div>

                {/* Indicador de página atual - Mobile */}
                <div className="sm:hidden flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="obra">Dados da Obra</TabsTrigger>
                <TabsTrigger value="grua">Grua</TabsTrigger>
                <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
                <TabsTrigger value="custos">Custos Mensais</TabsTrigger>
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
                        <SelectItem value="Planejamento">Planejamento</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Pausada">Pausada</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                        <SelectItem value="Cancelada">Cancelada</SelectItem>
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

                <div>
                  <Label htmlFor="responsavel">Responsável pela Obra *</Label>
                  <FuncionarioSearch
                    onFuncionarioSelect={handleResponsavelSelect}
                    selectedFuncionario={responsavelSelecionado}
                    placeholder="Buscar responsável por nome ou cargo..."
                    className="mt-1"
                    onlyActive={true}
                    allowedRoles={['Engenheiro', 'Chefe de Obras', 'Supervisor', 'Gerente', 'Operador']}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome ou cargo do responsável pela obra
                  </p>
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
                  <ClienteSearch
                    onClienteSelect={handleClienteSelect}
                    selectedCliente={clienteSelecionado}
                    placeholder="Buscar cliente por nome ou CNPJ..."
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome ou CNPJ do cliente para buscar
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
                  <GruaSearch
                    onGruaSelect={handleGruaSelect}
                    selectedGrua={gruaSelecionada}
                    placeholder="Buscar grua por nome, modelo ou fabricante..."
                    className="mt-1"
                    onlyAvailable={true}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome, modelo ou fabricante da grua para buscar
                  </p>
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
                    Busque e adicione funcionários para esta obra
                  </p>
                </div>

                <div>
                  <Label htmlFor="funcionarioSearch">Buscar Funcionário</Label>
                  <FuncionarioSearch
                    onFuncionarioSelect={handleFuncionarioSelect}
                    placeholder="Buscar funcionário por nome ou cargo..."
                    className="mt-1"
                    onlyActive={true}
                    allowedRoles={['Operador', 'Sinaleiro', 'Técnico Manutenção', 'Supervisor', 'Mecânico', 'Engenheiro', 'Chefe de Obras']}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome ou cargo do funcionário para buscar
                  </p>
                </div>

                {/* Lista de funcionários selecionados */}
                {funcionariosSelecionados.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Funcionários Selecionados ({funcionariosSelecionados.length})</h4>
                    {funcionariosSelecionados.map((funcionario) => (
                      <div key={funcionario.id} className="flex gap-2 p-3 border rounded-lg bg-green-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="font-medium text-green-900">{funcionario.name}</p>
                              <p className="text-sm text-green-700">{funcionario.role}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFuncionarioSelecionado(funcionario.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Aba: Custos Mensais */}
              <TabsContent value="custos" className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <h3 className="font-medium text-purple-900">Custos Mensais da Obra</h3>
                  </div>
                  <p className="text-sm text-purple-700">
                    Configure os custos mensais que serão aplicados a esta obra
                  </p>
                </div>

                {/* Formulário para adicionar custo */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-sm">Adicionar Novo Custo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="custoItem">Item *</Label>
                      <Input
                        id="custoItem"
                        value={custoForm.item}
                        onChange={(e) => setCustoForm({...custoForm, item: e.target.value})}
                        placeholder="Ex: 01.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custoDescricao">Descrição *</Label>
                      <Input
                        id="custoDescricao"
                        value={custoForm.descricao}
                        onChange={(e) => setCustoForm({...custoForm, descricao: e.target.value})}
                        placeholder="Ex: Locação de grua torre"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custoUnidade">Unidade *</Label>
                      <Select value={custoForm.unidade} onValueChange={(value) => setCustoForm({...custoForm, unidade: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mês">Mês</SelectItem>
                          <SelectItem value="dia">Dia</SelectItem>
                          <SelectItem value="hora">Hora</SelectItem>
                          <SelectItem value="un">Unidade</SelectItem>
                          <SelectItem value="kg">Quilograma</SelectItem>
                          <SelectItem value="m">Metro</SelectItem>
                          <SelectItem value="m²">Metro Quadrado</SelectItem>
                          <SelectItem value="m³">Metro Cúbico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="custoMes">Mês *</Label>
                      <Input
                        id="custoMes"
                        type="month"
                        value={custoForm.mes}
                        onChange={(e) => setCustoForm({...custoForm, mes: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="custoQuantidade">Quantidade Orçada *</Label>
                      <Input
                        id="custoQuantidade"
                        type="number"
                        min="0"
                        step="0.01"
                        value={custoForm.quantidadeOrcamento}
                        onChange={(e) => setCustoForm({...custoForm, quantidadeOrcamento: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="custoValorUnitario">Valor Unitário (R$) *</Label>
                      <Input
                        id="custoValorUnitario"
                        type="number"
                        min="0"
                        step="0.01"
                        value={custoForm.valorUnitario}
                        onChange={(e) => setCustoForm({...custoForm, valorUnitario: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" onClick={adicionarCustoMensal} disabled={!custoForm.item || !custoForm.descricao || !custoForm.unidade || custoForm.quantidadeOrcamento <= 0 || custoForm.valorUnitario <= 0}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Custo
                    </Button>
                  </div>
                </div>

                {/* Lista de custos mensais */}
                {custosMensais.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Custos Mensais Configurados ({custosMensais.length})</h4>
                    <div className="space-y-2">
                      {custosMensais.map((custo) => (
                        <div key={custo.id} className="flex gap-2 p-3 border rounded-lg bg-purple-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-purple-600" />
                              <div>
                                <p className="font-medium text-purple-900">{custo.item} - {custo.descricao}</p>
                                <p className="text-sm text-purple-700">
                                  {custo.quantidadeOrcamento} {custo.unidade} × R$ {custo.valorUnitario.toLocaleString('pt-BR')} = R$ {custo.totalOrcamento.toLocaleString('pt-BR')}
                                </p>
                                <p className="text-xs text-purple-600">Mês: {custo.mes}</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removerCustoMensal(custo.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botões de ação para custos */}
                {custosMensais.length > 0 && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        const proximoMes = new Date(custoForm.mes + '-01')
                        proximoMes.setMonth(proximoMes.getMonth() + 1)
                        const proximoMesStr = proximoMes.toISOString().slice(0, 7)
                        duplicarCustosParaMes(proximoMesStr)
                      }}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Duplicar para Próximo Mês
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCustosDialogOpen(true)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar Todos
                    </Button>
                  </div>
                )}
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
                  <ButtonLoader text="Criando..." />
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="obra">Dados da Obra</TabsTrigger>
                <TabsTrigger value="grua">Grua</TabsTrigger>
                <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
                <TabsTrigger value="custos">Custos Mensais</TabsTrigger>
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
                        <SelectItem value="Planejamento">Planejamento</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Pausada">Pausada</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                        <SelectItem value="Cancelada">Cancelada</SelectItem>
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

                <div>
                  <Label htmlFor="edit-responsavel">Responsável pela Obra *</Label>
                  <FuncionarioSearch
                    onFuncionarioSelect={handleResponsavelSelect}
                    selectedFuncionario={responsavelSelecionado}
                    placeholder="Buscar responsável por nome ou cargo..."
                    className="mt-1"
                    onlyActive={true}
                    allowedRoles={['Engenheiro', 'Chefe de Obras', 'Supervisor', 'Gerente', 'Operador']}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome ou cargo do responsável pela obra
                  </p>
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
                  <ClienteSearch
                    onClienteSelect={handleClienteSelect}
                    selectedCliente={clienteSelecionado}
                    placeholder="Buscar cliente por nome ou CNPJ..."
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome ou CNPJ do cliente para buscar
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
                  <GruaSearch
                    onGruaSelect={handleGruaSelect}
                    selectedGrua={gruaSelecionada}
                    placeholder="Buscar grua por nome, modelo ou fabricante..."
                    className="mt-1"
                    onlyAvailable={true}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome, modelo ou fabricante da grua para buscar
                  </p>
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
                    Busque e adicione funcionários para esta obra
                  </p>
                </div>

                <div>
                  <Label htmlFor="edit-funcionarioSearch">Buscar Funcionário</Label>
                  <FuncionarioSearch
                    onFuncionarioSelect={handleFuncionarioSelect}
                    placeholder="Buscar funcionário por nome ou cargo..."
                    className="mt-1"
                    onlyActive={true}
                    allowedRoles={['Operador', 'Sinaleiro', 'Técnico Manutenção', 'Supervisor', 'Mecânico', 'Engenheiro', 'Chefe de Obras']}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome ou cargo do funcionário para buscar
                  </p>
                </div>

                {/* Lista de funcionários selecionados */}
                {funcionariosSelecionados.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Funcionários Selecionados ({funcionariosSelecionados.length})</h4>
                    {funcionariosSelecionados.map((funcionario) => (
                      <div key={funcionario.id} className="flex gap-2 p-3 border rounded-lg bg-green-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="font-medium text-green-900">{funcionario.name}</p>
                              <p className="text-sm text-green-700">{funcionario.role}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFuncionarioSelecionado(funcionario.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Aba: Custos Mensais - Edição */}
              <TabsContent value="custos" className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <h3 className="font-medium text-purple-900">Custos Mensais da Obra</h3>
                  </div>
                  <p className="text-sm text-purple-700">
                    Configure os custos mensais que serão aplicados a esta obra
                  </p>
                </div>

                {/* Formulário para adicionar custo */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-sm">Adicionar Novo Custo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-custoItem">Item *</Label>
                      <Input
                        id="edit-custoItem"
                        value={custoForm.item}
                        onChange={(e) => setCustoForm({...custoForm, item: e.target.value})}
                        placeholder="Ex: 01.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-custoDescricao">Descrição *</Label>
                      <Input
                        id="edit-custoDescricao"
                        value={custoForm.descricao}
                        onChange={(e) => setCustoForm({...custoForm, descricao: e.target.value})}
                        placeholder="Ex: Locação de grua torre"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-custoUnidade">Unidade *</Label>
                      <Select value={custoForm.unidade} onValueChange={(value) => setCustoForm({...custoForm, unidade: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mês">Mês</SelectItem>
                          <SelectItem value="dia">Dia</SelectItem>
                          <SelectItem value="hora">Hora</SelectItem>
                          <SelectItem value="un">Unidade</SelectItem>
                          <SelectItem value="kg">Quilograma</SelectItem>
                          <SelectItem value="m">Metro</SelectItem>
                          <SelectItem value="m²">Metro Quadrado</SelectItem>
                          <SelectItem value="m³">Metro Cúbico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-custoMes">Mês *</Label>
                      <Input
                        id="edit-custoMes"
                        type="month"
                        value={custoForm.mes}
                        onChange={(e) => setCustoForm({...custoForm, mes: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-custoQuantidade">Quantidade Orçada *</Label>
                      <Input
                        id="edit-custoQuantidade"
                        type="number"
                        min="0"
                        step="0.01"
                        value={custoForm.quantidadeOrcamento}
                        onChange={(e) => setCustoForm({...custoForm, quantidadeOrcamento: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-custoValorUnitario">Valor Unitário (R$) *</Label>
                      <Input
                        id="edit-custoValorUnitario"
                        type="number"
                        min="0"
                        step="0.01"
                        value={custoForm.valorUnitario}
                        onChange={(e) => setCustoForm({...custoForm, valorUnitario: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" onClick={adicionarCustoMensal} disabled={!custoForm.item || !custoForm.descricao || !custoForm.unidade || custoForm.quantidadeOrcamento <= 0 || custoForm.valorUnitario <= 0}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Custo
                    </Button>
                  </div>
                </div>

                {/* Lista de custos mensais */}
                {custosMensais.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Custos Mensais Configurados ({custosMensais.length})</h4>
                    <div className="space-y-2">
                      {custosMensais.map((custo) => (
                        <div key={custo.id} className="flex gap-2 p-3 border rounded-lg bg-purple-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-purple-600" />
                              <div>
                                <p className="font-medium text-purple-900">{custo.item} - {custo.descricao}</p>
                                <p className="text-sm text-purple-700">
                                  {custo.quantidadeOrcamento} {custo.unidade} × R$ {custo.valorUnitario.toLocaleString('pt-BR')} = R$ {custo.totalOrcamento.toLocaleString('pt-BR')}
                                </p>
                                <p className="text-xs text-purple-600">Mês: {custo.mes}</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removerCustoMensal(custo.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botões de ação para custos */}
                {custosMensais.length > 0 && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        const proximoMes = new Date(custoForm.mes + '-01')
                        proximoMes.setMonth(proximoMes.getMonth() + 1)
                        const proximoMesStr = proximoMes.toISOString().slice(0, 7)
                        duplicarCustosParaMes(proximoMesStr)
                      }}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Duplicar para Próximo Mês
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCustosDialogOpen(true)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar Todos
                    </Button>
                  </div>
                )}
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
                  <ButtonLoader text="Atualizando..." />
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
                <ButtonLoader text="Excluindo..." />
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

      {/* Dialog para visualizar custos mensais */}
      <Dialog open={isCustosDialogOpen} onOpenChange={setIsCustosDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              Custos Mensais da Obra
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {custosMensais.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Nenhum custo mensal configurado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Resumo dos custos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900">Total de Itens</h4>
                    <p className="text-2xl font-bold text-purple-600">{custosMensais.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">Valor Total Orçado</h4>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {custosMensais.reduce((total, custo) => total + custo.totalOrcamento, 0).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">Meses Configurados</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {[...new Set(custosMensais.map(c => c.mes))].length}
                    </p>
                  </div>
                </div>

                {/* Lista detalhada dos custos */}
                <div className="space-y-3">
                  <h4 className="font-medium">Detalhamento dos Custos</h4>
                  {custosMensais.map((custo) => (
                    <div key={custo.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-purple-600" />
                            <h5 className="font-medium text-gray-900">{custo.item} - {custo.descricao}</h5>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Unidade:</span>
                              <p className="font-medium">{custo.unidade}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Quantidade:</span>
                              <p className="font-medium">{custo.quantidadeOrcamento}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Valor Unitário:</span>
                              <p className="font-medium">R$ {custo.valorUnitario.toLocaleString('pt-BR')}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Total:</span>
                              <p className="font-medium text-green-600">R$ {custo.totalOrcamento.toLocaleString('pt-BR')}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="text-gray-600 text-sm">Mês:</span>
                            <span className="ml-2 text-sm font-medium text-purple-600">{custo.mes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Agrupamento por mês */}
                <div className="space-y-3">
                  <h4 className="font-medium">Custos por Mês</h4>
                  {Object.entries(
                    custosMensais.reduce((acc, custo) => {
                      if (!acc[custo.mes]) acc[custo.mes] = []
                      acc[custo.mes].push(custo)
                      return acc
                    }, {} as Record<string, CustoMensal[]>)
                  ).map(([mes, custos]) => (
                    <div key={mes} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-900">{mes}</h5>
                        <span className="text-sm text-gray-600">
                          {custos.length} item(s) - R$ {custos.reduce((total, c) => total + c.totalOrcamento, 0).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {custos.map((custo) => (
                          <div key={custo.id} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                            <span>{custo.item} - {custo.descricao}</span>
                            <span className="font-medium">R$ {custo.totalOrcamento.toLocaleString('pt-BR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}