"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Shield,
  Download,
  Loader2,
} from "lucide-react"
import { obrasApi, converterObraBackendParaFrontend, converterObraFrontendParaBackend, ObraBackend, checkAuthentication, ensureAuthenticated } from "@/lib/api-obras"
import ClienteSearch from "@/components/cliente-search"
import GruaSearch from "@/components/grua-search"
import FuncionarioSearch from "@/components/funcionario-search"
import { CardLoader, ButtonLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { ExportButton } from "@/components/export-button"
import { Loading, PageLoading, TableLoading, CardLoading, useLoading } from "@/components/ui/loading"
import { ValorMonetarioOculto } from "@/components/valor-oculto"

function formatObraPreviewValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—"
  return String(v)
}

function safeObraDateLabel(d: string | undefined | null): string {
  if (!d) return "—"
  const t = new Date(d).getTime()
  if (Number.isNaN(t)) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

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
  const { loading, startLoading, stopLoading } = useLoading(true)
  const [error, setError] = useState<string | null>(null)
  const { loading: creating, startLoading: startCreating, stopLoading: stopCreating } = useLoading()
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    pages: 0
  })
  const [exportandoCsv, setExportandoCsv] = useState(false)
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
    // Documentos obrigatórios
    cno: '',
    art_numero: '',
    art_arquivo: '',
    apolice_numero: '',
    apolice_arquivo: '',
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
  const [gruasSelecionadas, setGruasSelecionadas] = useState<any[]>([]) // Múltiplas gruas
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<any[]>([])
  const [responsavelSelecionado, setResponsavelSelecionado] = useState<any>(null)
  
  // Tipo local para valores
  interface CustoMensal {
    id: string
    obraId: string
    item: string
    descricao: string
    unidade: string
    quantidadeOrcamento: number
    valorUnitario: number
    totalOrcamento: number
    mes: string
    quantidadeRealizada: number
    valorRealizado: number
    quantidadeAcumulada: number
    valorAcumulado: number
    quantidadeSaldo: number
    valorSaldo: number
    tipo: string
    createdAt: string
    updatedAt: string
  }
  
  // Estados para valores
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

  // Flags para controlar carregamento e evitar chamadas duplicadas
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const loadingRef = useRef(false)
  const initialLoadDoneRef = useRef(false)
  const prevPageRef = useRef(currentPage)
  const prevItemsPerPageRef = useRef(itemsPerPage)

  // Carregar obras do backend com paginação
  const carregarObras = async () => {
    try {
      startLoading()
      setError(null)
      const response = await obrasApi.listarObras({ 
        page: currentPage,
        limit: itemsPerPage
      })
      
      // Converter obras - os relacionamentos já vêm incluídos no endpoint
      const obrasComRelacionamentos = await Promise.all(
        response.data.map(async (obraBackend: any) => {
          // Debug: verificar se grua_obra está presente
          if (obraBackend.grua_obra && obraBackend.grua_obra.length > 0) {
            // Gruas encontradas na listagem
          }
          
          const obraConvertida = converterObraBackendParaFrontend(obraBackend)
          
          // Se não houver gruas na listagem, buscar separadamente via grua_obra (fallback)
          // Isso resolve casos onde o relacionamento não veio na query inicial
          if (!obraConvertida.gruasVinculadas || obraConvertida.gruasVinculadas.length === 0) {
            try {
              const gruasResponse = await obrasApi.buscarGruasVinculadas(obraBackend.id)
              
              if (gruasResponse.success && gruasResponse.data && gruasResponse.data.length > 0) {
                
                // Converter formato para o esperado pela renderização
                const gruasFormatadas = gruasResponse.data.map((grua: any) => ({
                  id: grua.id?.toString() || '',
                  gruaId: grua.gruaId || grua.grua?.id || '',
                  obraId: obraBackend.id.toString(),
                  dataInicioLocacao: grua.dataInicioLocacao || '',
                  dataFimLocacao: grua.dataFimLocacao || null,
                  valorLocacaoMensal: grua.valorLocacaoMensal || 0,
                  status: grua.status === 'ativa' ? 'Ativa' : grua.status === 'concluida' ? 'Concluída' : grua.status === 'suspensa' ? 'Suspensa' : 'Ativa',
                  observacoes: grua.observacoes || '',
                  createdAt: grua.createdAt || '',
                  updatedAt: grua.updatedAt || '',
                  grua: grua.grua ? {
                    id: grua.grua.id,
                    modelo: grua.grua.model || grua.grua.modelo || '',
                    fabricante: grua.grua.manufacturer || grua.grua.fabricante || '',
                    tipo: grua.grua.type || grua.grua.tipo || ''
                  } : null
                }))
                
                obraConvertida.gruasVinculadas = gruasFormatadas
              }
            } catch (error) {
              console.error(`❌ Erro ao buscar gruas para obra ${obraBackend.id}:`, error)
              // Continuar sem as gruas se houver erro
            }
          }
          
          // Debug: verificar se gruasVinculadas foi convertido corretamente
          if (obraConvertida.gruasVinculadas && obraConvertida.gruasVinculadas.length > 0) {
            // Gruas convertidas com sucesso
          }
          
          return obraConvertida
        })
      )
      
      setObras(obrasComRelacionamentos)
      
      // Atualizar informações de paginação da API
      if (response.pagination) {
        setPagination(response.pagination)
      }
    } catch (err) {
      console.error('Erro ao carregar obras:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar obras')
      setObras([])
    } finally {
      stopLoading()
    }
  }

  // Funções para valores
  const adicionarCustoMensal = () => {
    const novoCusto: CustoMensal = {
      id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      obraId: editingObra?.id || '', // Será preenchido quando a obra for criada
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
    
    console.log('💰 DEBUG - Adicionando custo mensal:', novoCusto)
    const novosCustos = [...custosMensais, novoCusto]
    console.log('💰 DEBUG - Lista de custos atualizada:', novosCustos)
    setCustosMensais(novosCustos)
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

  const duplicarCustosParaMes = (novoMes: string) => {
    // Pegar o mês mais recente dos custos existentes
    const mesesDosCustos = [...new Set(custosMensais.map(c => c.mes))].sort()
    const mesBase = mesesDosCustos[mesesDosCustos.length - 1] || custoForm.mes
    
    // Filtrar apenas custos do mês base
    const custosDoMesAtual = custosMensais.filter(custo => custo.mes === mesBase)
    
    console.log('📅 Duplicando custos:', {
      mesOrigem: mesBase,
      mesDestino: novoMes,
      quantidadeCustos: custosDoMesAtual.length,
      custosOriginais: custosDoMesAtual
    })
    
    if (custosDoMesAtual.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há custos para duplicar",
        variant: "destructive"
      })
      return
    }
    
    const custosDuplicados = custosDoMesAtual.map(custo => ({
      ...custo,
      id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mes: novoMes,
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
    
    toast({
      title: "Sucesso",
      description: `${custosDuplicados.length} custo(s) duplicado(s) para ${novoMes}`
    })
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

  // Função para lidar com seleção de grua (para criação - mantém compatibilidade)
  const handleGruaSelect = (grua: any) => {
    console.log('🔧 DEBUG - Grua selecionada:', grua)
    setGruaSelecionada(grua)
    if (grua) {
      const newFormData = {
        ...obraFormData,
        gruaId: grua.id,
        gruaValue: grua.valorLocacao || grua.valor || '', // tente ambos os campos
        monthlyFee: grua.taxaMensal || grua.mensalidade || '' // tente ambos os campos
      }
      console.log('🔧 DEBUG - Atualizando obraFormData com grua:', newFormData)
      setObraFormData(newFormData)
    } else {
      const newFormData = {
        ...obraFormData,
        gruaId: '',
        gruaValue: '',
        monthlyFee: ''
      }
      console.log('🔧 DEBUG - Limpando dados da grua:', newFormData)
      setObraFormData(newFormData)
    }
  }

  // Função para adicionar grua à lista de selecionadas (para edição com múltiplas gruas)
  const handleAdicionarGruaSelecionada = (grua: any, valorLocacao?: number, taxaMensal?: number) => {
    console.log('🔧 DEBUG - Adicionando grua à lista:', grua)
    
    // Verificar se a grua já está na lista
    if (gruasSelecionadas.find(g => g.id === grua.id)) {
      toast({
        title: "Atenção",
        description: "Esta grua já está vinculada à obra",
        variant: "destructive"
      })
      return
    }
    
    const novaGrua = {
      id: grua.id,
      name: grua.name || grua.modelo || `Grua ${grua.id}`,
      model: grua.model || grua.modelo,
      manufacturer: grua.manufacturer || grua.fabricante,
      capacity: grua.capacity || grua.capacidade,
      valor_locacao: valorLocacao || parseFloat(obraFormData.gruaValue) || 0,
      taxa_mensal: taxaMensal || parseFloat(obraFormData.monthlyFee) || 0
    }
    
    setGruasSelecionadas([...gruasSelecionadas, novaGrua])
    
    // Limpar formulário de grua
    setGruaSelecionada(null)
    setObraFormData({
      ...obraFormData,
      gruaId: '',
      gruaValue: '',
      monthlyFee: ''
    })
    
    toast({
      title: "Sucesso",
      description: "Grua adicionada à lista",
      variant: "default"
    })
  }

  // Função para remover grua da lista de selecionadas
  const handleRemoverGruaSelecionada = (gruaId: string) => {
    console.log('🔧 DEBUG - Removendo grua da lista:', gruaId)
    setGruasSelecionadas(gruasSelecionadas.filter(g => g.id !== gruaId))
    toast({
      title: "Sucesso",
      description: "Grua removida da lista",
      variant: "default"
    })
  }

  // Função para adicionar funcionário selecionado
  const handleFuncionarioSelect = (funcionario: any) => {
    console.log('👥 DEBUG - Funcionário selecionado:', funcionario)
    if (funcionario && !funcionariosSelecionados.find(f => f.userId === funcionario.id)) {
      const novoFuncionario = {
        id: Date.now().toString(),
        userId: funcionario.id,
        role: funcionario.role,
        name: funcionario.name,
        isSupervisor: false,
        gruaId: obraFormData.gruaId // Associar funcionário à grua selecionada
      }
      console.log('👥 DEBUG - Novo funcionário criado:', novoFuncionario)
      const novosFuncionarios = [...funcionariosSelecionados, novoFuncionario]
      console.log('👥 DEBUG - Lista de funcionários atualizada:', novosFuncionarios)
      setFuncionariosSelecionados(novosFuncionarios)
      setObraFormData({
        ...obraFormData,
        funcionarios: [...obraFormData.funcionarios, novoFuncionario]
      })
    }
  }

  // Função para alternar status de supervisor
  const handleToggleSupervisor = (funcionarioId: string) => {
    const funcionariosAtualizados = funcionariosSelecionados.map(f => 
      f.id === funcionarioId ? { ...f, isSupervisor: !f.isSupervisor } : f
    )
    setFuncionariosSelecionados(funcionariosAtualizados)
    setObraFormData({
      ...obraFormData,
      funcionarios: obraFormData.funcionarios.map(f => 
        f.id === funcionarioId ? { ...f, isSupervisor: !f.isSupervisor } : f
      )
    })
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

  // Verificar autenticação e carregar dados na inicialização - apenas uma vez
  useEffect(() => {
    const init = async () => {
      const isAuth = await ensureAuthenticated()
      // Evitar carregamento duplo - só carregar uma vez
      if (isAuth && !initialLoadDoneRef.current && !loadingRef.current) {
        initialLoadDoneRef.current = true
        loadingRef.current = true
        carregarObras().finally(() => {
          setDadosIniciaisCarregados(true)
          loadingRef.current = false
        })
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recarregar obras quando página ou itens por página mudarem (com debounce)
  useEffect(() => {
    if (!dadosIniciaisCarregados) return
    if (currentPage <= 0 || itemsPerPage <= 0) return
    
    // Verificar se houve mudança real nos parâmetros (não apenas no primeiro render)
    const pageChanged = prevPageRef.current !== currentPage
    const itemsPerPageChanged = prevItemsPerPageRef.current !== itemsPerPage
    
    // Se não houve mudança real, não executar (evita carregamento duplo no primeiro render)
    if (!pageChanged && !itemsPerPageChanged) {
      return
    }
    
    // Atualizar refs
    prevPageRef.current = currentPage
    prevItemsPerPageRef.current = itemsPerPage
    
    const timer = setTimeout(() => {
      if (!loadingRef.current) {
        loadingRef.current = true
        carregarObras().finally(() => {
          loadingRef.current = false
        })
      }
    }, 300)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, dadosIniciaisCarregados])

  // Função de busca via API
  const buscarObras = async () => {
    try {
      startLoading()
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
      setObras([])
    } finally {
      stopLoading()
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

  // Função para resetar página quando termo de busca muda e buscar obras (com debounce)
  useEffect(() => {
    if (!dadosIniciaisCarregados) return
    
    const timer = setTimeout(() => {
      if (!loadingRef.current) {
        setCurrentPage(1)
        loadingRef.current = true
        if (searchTerm.trim()) {
          buscarObras().finally(() => {
            loadingRef.current = false
          })
        } else {
          carregarObras().finally(() => {
            loadingRef.current = false
          })
        }
      }
    }, 300)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, dadosIniciaisCarregados])

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
    
    // Determinar clienteId - usar clienteSelecionado como fallback
    const clienteIdFinal = obraFormData.clienteId || clienteSelecionado?.id || clienteSelecionado?.cliente_id
    
    // Validação dos campos obrigatórios
    if (!obraFormData.name || !obraFormData.description || !clienteIdFinal) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios (Nome, Descrição, Cliente)",
        variant: "destructive"
      })
      return
    }
    
    try {
      startCreating()
      
      // Usar cliente selecionado do estado (já carregado via ClienteSearch)
      // Se não houver no estado, usar os dados do formulário
      
            // Preparar dados para o backend
            const obraData = {
              name: obraFormData.name,
              description: obraFormData.description,
              status: obraFormData.status,
              startDate: obraFormData.startDate,
              endDate: obraFormData.endDate,
              budget: obraFormData.budget,
              location: obraFormData.location,
              clienteId: clienteIdFinal,
              observations: obraFormData.observations,
              // Dados do responsável
              responsavelId: obraFormData.responsavelId,
              responsavelName: obraFormData.responsavelName,
              // Dados da grua selecionada - usar dados do estado atual
              gruaId: gruaSelecionada?.id || obraFormData.gruaId || '',
              gruaValue: obraFormData.gruaValue || '',
              monthlyFee: obraFormData.monthlyFee || '',
              // Dados dos funcionários selecionados
              funcionarios: funcionariosSelecionados && funcionariosSelecionados.length > 0 ? funcionariosSelecionados : [],
              // Valores - usar diretamente do estado custosMensais
              custos_mensais: custosMensais.map(custo => ({
                item: custo.item,
                descricao: custo.descricao,
                unidade: custo.unidade,
                quantidadeOrcamento: custo.quantidadeOrcamento,
                valorUnitario: custo.valorUnitario,
                totalOrcamento: custo.totalOrcamento,
                mes: custo.mes,
                tipo: custo.tipo || 'contrato'
              })),
              // Dados adicionais para criação automática de cliente se necessário
              cliente_nome: clienteSelecionado?.nome || clienteSelecionado?.name,
              cliente_cnpj: clienteSelecionado?.cnpj,
              cliente_email: clienteSelecionado?.email,
              cliente_telefone: clienteSelecionado?.telefone,
              // Campos específicos do backend
              cidade: obraFormData.location?.split(',')[0]?.trim() || 'São Paulo',
              estado: obraFormData.location?.split(',')[1]?.trim() || 'SP',
              tipo: 'Residencial', // Valor padrão
              endereco: obraFormData.location || 'Endereço não informado'
            }

      // Debug: Log dos dados antes da conversão
      console.log('🔍 DEBUG - Dados antes da conversão:', obraData)
      console.log('🔍 DEBUG - Valores:', custosMensais)
      console.log('🔍 DEBUG - Funcionários selecionados:', funcionariosSelecionados)
      console.log('🔍 DEBUG - Grua selecionada:', gruaSelecionada)
      console.log('🔍 DEBUG - Dados da grua no obraData:', {
        gruaId: obraData.gruaId,
        gruaValue: obraData.gruaValue,
        monthlyFee: obraData.monthlyFee
      })
      console.log('🔍 DEBUG - Estado completo do form:', obraFormData)
      console.log('🔍 DEBUG - Valores processados:', obraData.custos_mensais)
      console.log('🔍 DEBUG - Quantidade de valores:', custosMensais.length)
      console.log('🔍 DEBUG - Primeiro custo mensal:', custosMensais[0])
      
      // Debug adicional para verificar se os dados estão sendo montados corretamente
      console.log('🔍 DEBUG - Verificação de campos obrigatórios:')
      console.log('  - gruaId:', obraData.gruaId)
      console.log('  - gruaValue:', obraData.gruaValue)
      console.log('  - monthlyFee:', obraData.monthlyFee)
      console.log('  - custos_mensais.length:', obraData.custos_mensais.length)
      console.log('  - funcionarios.length:', obraData.funcionarios.length)
      
      // Verificação adicional dos dados
      if (!obraData.gruaId && gruaSelecionada) {
        console.warn('⚠️ WARNING - Grua selecionada mas gruaId vazio!')
        console.log('  - gruaSelecionada:', gruaSelecionada)
        console.log('  - obraFormData.gruaId:', obraFormData.gruaId)
      }
      
      if (obraData.custos_mensais.length === 0 && custosMensais.length > 0) {
        console.warn('⚠️ WARNING - Valores no estado mas vazios no objeto!')
        console.log('  - custosMensais.length:', custosMensais.length)
        console.log('  - obraData.custos_mensais.length:', obraData.custos_mensais.length)
      }
      
      // Debug final dos dados que serão enviados
      console.log('🚀 DEBUG - Dados finais que serão enviados:')
      console.log('  - gruaId:', obraData.gruaId)
      console.log('  - gruaValue:', obraData.gruaValue)
      console.log('  - monthlyFee:', obraData.monthlyFee)
      console.log('  - custos_mensais:', obraData.custos_mensais)
      console.log('  - funcionarios:', obraData.funcionarios)
      
      // Debug do estado atual
      console.log('🔍 DEBUG - Estado atual do componente:')
      console.log('  - custosMensais.length:', custosMensais.length)
      console.log('  - funcionariosSelecionados.length:', funcionariosSelecionados.length)
      console.log('  - gruaSelecionada:', gruaSelecionada)
      console.log('  - obraFormData.gruaId:', obraFormData.gruaId)
      console.log('  - obraFormData.gruaValue:', obraFormData.gruaValue)
      console.log('  - obraFormData.monthlyFee:', obraFormData.monthlyFee)

      // Converter para formato do backend
      const obraBackendData = converterObraFrontendParaBackend(obraData)
      
      // Debug: Log dos dados após conversão
      console.log('🔍 DEBUG - Dados após conversão:', obraBackendData)
      
      // Criar obra no backend (a grua será atualizada automaticamente via relação grua_obra)
      const response = await obrasApi.criarObra(obraBackendData)
      
      // Os custos mensais já foram incluídos no payload e serão criados pelo backend
      // A grua será vinculada à obra através da relação grua_obra criada pelo backend
      console.log('Nova obra criada no backend:', response.data)
      console.log('Grua selecionada:', gruaSelecionada)
      console.log('Funcionários:', obraFormData.funcionarios)
      console.log('Custos mensais enviados:', obraData.custos_mensais)
      
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
        cno: '',
        art_numero: '',
        art_arquivo: '',
        apolice_numero: '',
        apolice_arquivo: '',
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
      stopCreating()
    }
  }

  const handleDeleteObra = (obra: any) => {
    setObraToDelete(obra)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteObra = async () => {
    if (!obraToDelete) return

    try {
      setDeleting(true)

      // Verificar se a obra tem gruas vinculadas (usar dados da API)
      const obraCompleta = obras.find(o => o.id === obraToDelete.id)
      const gruasVinculadas = obraCompleta?.grua_obra || obraCompleta?.gruas || []
      if (gruasVinculadas.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: `A obra "${obraToDelete.name}" possui ${gruasVinculadas.length} grua(s) vinculada(s). Remova as gruas primeiro.`,
          variant: "destructive"
        })
        setIsDeleteDialogOpen(false)
        return
      }

      // Verificar se a obra tem custos (usar dados da API)
      const custosMensais = obraCompleta?.custos_mensais || []
      const custosGerais = obraCompleta?.total_custos || obraCompleta?.total_custos_mensais || 0
      if (custosMensais.length > 0 || custosGerais > 0) {
        toast({
          title: "Não é possível excluir",
          description: `A obra "${obraToDelete.name}" possui custo(s) registrado(s). Remova os custos primeiro.`,
          variant: "destructive"
        })
        setIsDeleteDialogOpen(false)
        return
      }

      // Verificar se é a última obra da página atual
      const obrasNaPaginaAtual = obras.length
      const precisaVoltarPagina = obrasNaPaginaAtual === 1 && currentPage > 1
      const paginaParaCarregar = precisaVoltarPagina ? currentPage - 1 : currentPage

      // Excluir obra no backend
      await obrasApi.excluirObra(parseInt(obraToDelete.id))
      
      // Se era a última obra da página e não é a primeira página, voltar para página anterior
      if (precisaVoltarPagina) {
        setCurrentPage(paginaParaCarregar)
      }
      
      // Recarregar lista de obras com a página correta
      try {
        startLoading()
        setError(null)
        const response = await obrasApi.listarObras({ 
          page: paginaParaCarregar,
          limit: itemsPerPage
        })
        
        // Converter obras - os relacionamentos já vêm incluídos no endpoint
        const obrasComRelacionamentos = await Promise.all(
          response.data.map(async (obraBackend: any) => {
            const obraConvertida = converterObraBackendParaFrontend(obraBackend)
            
            // Se não houver gruas na listagem, buscar separadamente via grua_obra (fallback)
            if (!obraConvertida.gruasVinculadas || obraConvertida.gruasVinculadas.length === 0) {
              try {
                const gruasResponse = await obrasApi.buscarGruasVinculadas(obraBackend.id)
                
                if (gruasResponse.success && gruasResponse.data && gruasResponse.data.length > 0) {
                  const gruasFormatadas = gruasResponse.data.map((grua: any) => ({
                    id: grua.id?.toString() || '',
                    gruaId: grua.gruaId || grua.grua?.id || '',
                    obraId: obraBackend.id.toString(),
                    dataInicioLocacao: grua.dataInicioLocacao || '',
                    dataFimLocacao: grua.dataFimLocacao || null,
                    valorLocacaoMensal: grua.valorLocacaoMensal || 0,
                    status: grua.status === 'ativa' ? 'Ativa' : grua.status === 'concluida' ? 'Concluída' : grua.status === 'suspensa' ? 'Suspensa' : 'Ativa',
                    observacoes: grua.observacoes || '',
                    createdAt: grua.createdAt || '',
                    updatedAt: grua.updatedAt || '',
                    grua: grua.grua ? {
                      id: grua.grua.id,
                      modelo: grua.grua.model || grua.grua.modelo || '',
                      fabricante: grua.grua.manufacturer || grua.grua.fabricante || '',
                      tipo: grua.grua.type || grua.grua.tipo || ''
                    } : null
                  }))
                  
                  obraConvertida.gruasVinculadas = gruasFormatadas
                }
              } catch (error) {
                console.error(`❌ Erro ao buscar gruas para obra ${obraBackend.id}:`, error)
              }
            }
            
            return obraConvertida
          })
        )
        
        setObras(obrasComRelacionamentos)
        
        // Atualizar informações de paginação da API
        if (response.pagination) {
          setPagination(response.pagination)
        }
      } catch (err) {
        console.error('Erro ao recarregar obras:', err)
        setError(err instanceof Error ? err.message : 'Erro ao recarregar obras')
        setObras([])
      } finally {
        stopLoading()
      }
      
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
    // Prevenir múltiplas chamadas simultâneas
    if (loadingEdit) {
      console.log('⚠️ Já está carregando, ignorando chamada duplicada')
      return
    }
    
    setEditingObra(obra)
    setLoadingEdit(true)
    
    // LIMPAR TODOS OS ESTADOS ANTES de carregar novos dados
    console.log('🧹 Limpando estados antes de carregar...')
    setCustosMensais([])
    setGruasSelecionadas([])
    setFuncionariosSelecionados([])
    setGruaSelecionada(null)
    setResponsavelSelecionado(null)
    setClienteSelecionado(null)
    
    // Carregar relacionamentos da obra
    try {
      const [gruasResponse, funcionariosResponse, custosResponse] = await Promise.all([
        obrasApi.buscarGruasVinculadas(parseInt(obra.id)),
        obrasApi.buscarFuncionariosVinculados(parseInt(obra.id)),
        obrasApi.obterObra(parseInt(obra.id)) // Buscar detalhes completos incluindo custos
      ])
      
      // Carregar TODAS as gruas vinculadas
      const gruasVinculadas = gruasResponse.data?.map((gruaVinculada: any) => ({
        id: gruaVinculada.gruaId,
        name: gruaVinculada.grua?.modelo || `Grua ${gruaVinculada.gruaId}`,
        model: gruaVinculada.grua?.modelo || 'Modelo não disponível',
        manufacturer: gruaVinculada.grua?.fabricante || 'Fabricante não disponível',
        capacity: gruaVinculada.grua?.tipo || 'Tipo não disponível',
        // Usar valor real ou undefined (não 0)
        valor_locacao: parseFloat(gruaVinculada.valorLocacao) || undefined,
        taxa_mensal: parseFloat(gruaVinculada.valorLocacaoMensal) || 0
      })) || []
      
      console.log('✅ Gruas vinculadas carregadas:', gruasVinculadas)
      
      // Atualizar estado de gruas selecionadas
      setGruasSelecionadas(gruasVinculadas)
      
      // Preencher dados dos funcionários se existirem
      const funcionarios = funcionariosResponse.data?.map((func: any) => ({
        id: func.id.toString(),
        userId: func.userId || func.funcionarioId.toString(),
        role: func.role || 'Cargo não informado',
        name: func.name || 'Funcionário',
        isSupervisor: func.isSupervisor === true,
        gruaId: func.gruaId
      })) || []
      
      console.log('✅ Funcionários carregados:', funcionarios)

      // Carregar valores da obra
      console.log('📦 Resposta completa da obra:', custosResponse.data)
      const custosBackend = custosResponse.data?.custos_mensais || []
      console.log('📦 Custos do backend:', custosBackend)
      
      const custosFormatados: CustoMensal[] = custosBackend.map((custo: any) => ({
        id: custo.id.toString(),
        obraId: custo.obra_id?.toString() || obra.id.toString(),
        item: custo.item,
        descricao: custo.descricao,
        unidade: custo.unidade,
        quantidadeOrcamento: parseFloat(custo.quantidade_orcamento) || 0,
        valorUnitario: parseFloat(custo.valor_unitario) || 0,
        totalOrcamento: parseFloat(custo.total_orcamento) || 0,
        mes: custo.mes,
        quantidadeRealizada: parseFloat(custo.quantidade_realizada) || 0,
        valorRealizado: parseFloat(custo.valor_realizado) || 0,
        quantidadeAcumulada: parseFloat(custo.quantidade_acumulada) || 0,
        valorAcumulado: parseFloat(custo.valor_acumulado) || 0,
        quantidadeSaldo: parseFloat(custo.quantidade_saldo) || 0,
        valorSaldo: parseFloat(custo.valor_saldo) || 0,
        tipo: custo.tipo || 'contrato',
        createdAt: custo.created_at || new Date().toISOString(),
        updatedAt: custo.updated_at || new Date().toISOString()
      }))

      console.log('✅ Valores formatados:', custosFormatados)
      console.log('📊 Quantidade de custos:', custosFormatados.length)
      
      // Atualizar estados ANTES de abrir o dialog
      console.log('🔄 Atualizando estado de custos...')
      setCustosMensais(custosFormatados)
      console.log('✔️ Estado de custos atualizado')
      setFuncionariosSelecionados(funcionarios)
      setGruaSelecionada(null)
      
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
        // Limpar campos de grua única (serão usadas as múltiplas)
        gruaId: '',
        gruaValue: '',
        monthlyFee: '',
        // Dados do responsável
        responsavelId: obra.responsavelId || '',
        responsavelName: obra.responsavelName || '',
        // Documentos obrigatórios
        cno: obra.cno || '',
        art_numero: obra.art_numero || '',
        art_arquivo: obra.art_arquivo || '',
        apolice_numero: obra.apolice_numero || '',
        apolice_arquivo: obra.apolice_arquivo || '',
        funcionarios: funcionarios
      })
      
      // Carregar responsável se existir
      if (obra.responsavelId && obra.responsavelName) {
        setResponsavelSelecionado({
          id: obra.responsavelId,
          name: obra.responsavelName,
          nome: obra.responsavelName
        })
      }
      
      // Aguardar um tick para garantir que os estados foram atualizados
      setTimeout(() => {
        setIsEditDialogOpen(true)
        setLoadingEdit(false)
        console.log('✅ Dialog aberto com custos:', custosFormatados.length)
      }, 100)
      
    } catch (error) {
      setLoadingEdit(false)
      console.error('❌ Erro ao carregar relacionamentos da obra:', error)
      
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
        cno: obra.cno || '',
        art_numero: obra.art_numero || '',
        art_arquivo: obra.art_arquivo || '',
        apolice_numero: obra.apolice_numero || '',
        apolice_arquivo: obra.apolice_arquivo || '',
        funcionarios: []
      })
      
      // Em caso de erro, abrir o dialog sem os relacionamentos
      setTimeout(() => {
        setIsEditDialogOpen(true)
        console.log('⚠️ Dialog aberto com erro - sem relacionamentos')
      }, 100)
    } finally {
      // Garantir que loading seja resetado mesmo em caso de erro
      if (!isEditDialogOpen) {
        setTimeout(() => setLoadingEdit(false), 150)
      }
    }
  }

  const handleUpdateObra = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setUpdating(true)
      
      // Usar cliente selecionado do estado (já carregado via ClienteSearch)
      
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
        // Documentos obrigatórios
        cno: obraFormData.cno,
        art_numero: obraFormData.art_numero,
        art_arquivo: obraFormData.art_arquivo,
        apolice_numero: obraFormData.apolice_numero,
        apolice_arquivo: obraFormData.apolice_arquivo,
        // MÚLTIPLAS GRUAS - enviar todas as gruas selecionadas
        gruasSelecionadas: gruasSelecionadas.map(grua => {
          const gruaData: any = {
            id: grua.id,
            taxa_mensal: grua.taxa_mensal || 0
          }
          // Só incluir valor_locacao se for maior que 0
          if (grua.valor_locacao && grua.valor_locacao > 0) {
            gruaData.valor_locacao = grua.valor_locacao
          }
          return gruaData
        }),
        // Mantém campos para compatibilidade (caso seja adicionada nova grua via formulário)
        gruaId: obraFormData.gruaId || null,
        gruaValue: obraFormData.gruaValue ? parseFloat(obraFormData.gruaValue) : null,
        monthlyFee: obraFormData.monthlyFee ? parseFloat(obraFormData.monthlyFee) : null,
        // Funcionários
        funcionarios: funcionariosSelecionados && funcionariosSelecionados.length > 0 ? funcionariosSelecionados : [],
        // Valores
        custos_mensais: custosMensais && custosMensais.length > 0 ? custosMensais.map(custo => ({
          item: custo.item,
          descricao: custo.descricao,
          unidade: custo.unidade,
          quantidadeOrcamento: custo.quantidadeOrcamento,
          valorUnitario: custo.valorUnitario,
          totalOrcamento: custo.totalOrcamento,
          mes: custo.mes,
          tipo: custo.tipo || 'contrato'
        })) : [],
        // Campos específicos do backend
        cidade: obraFormData.location?.split(',')[0]?.trim() || 'São Paulo',
        estado: obraFormData.location?.split(',')[1]?.trim() || 'SP',
        tipo: 'Residencial', // Valor padrão
        endereco: obraFormData.location || 'Endereço não informado'
      }

      console.log('📋 Dados preparados para o backend:', obraData)
      console.log('🏗️ Gruas selecionadas:', gruasSelecionadas)
      console.log('👥 Funcionários selecionados:', funcionariosSelecionados)
      console.log('💰 Valores:', custosMensais)
      
      // Converter para formato do backend
      const obraBackendData = converterObraFrontendParaBackend(obraData)
      
      console.log('🔄 Dados após conversão:', obraBackendData)
      
      // Atualizar obra no backend
      const response = await obrasApi.atualizarObra(parseInt(editingObra.id), obraBackendData)
      
      // Recarregar lista de obras
      await carregarObras()
      
      // Fechar dialog e resetar
      setIsEditDialogOpen(false)
      setEditingObra(null)
      
      // Limpar todos os estados relacionados
      setCustosMensais([])
      setGruasSelecionadas([])
      setFuncionariosSelecionados([])
      setGruaSelecionada(null)
      setResponsavelSelecionado(null)
      setClienteSelecionado(null)
      
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
        cno: '',
        art_numero: '',
        art_arquivo: '',
        apolice_numero: '',
        apolice_arquivo: '',
        funcionarios: []
      })
      setClienteSelecionado(null)
      setGruaSelecionada(null)
      setGruasSelecionadas([]) // Limpar lista de gruas
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

  const escapeCsvCelula = (valor: unknown) => {
    const s = valor == null ? "" : String(valor)
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const filtrarObrasPorBuscaLocal = (lista: any[]) => {
    const t = searchTerm.trim().toLowerCase()
    if (!t) return lista
    return lista.filter(
      (obra: any) =>
        (obra.name || "").toLowerCase().includes(t) ||
        (obra.description || "").toLowerCase().includes(t),
    )
  }

  const buscarTodasObrasParaExport = async () => {
    const PAGE_SIZE = 100
    const todas: any[] = []
    let page = 1
    let totalPaginas = 1
    do {
      const res = await obrasApi.listarObras({ page, limit: PAGE_SIZE })
      const lote = (res.data || []).map((obraBackend: ObraBackend) =>
        converterObraBackendParaFrontend(obraBackend),
      )
      todas.push(...lote)
      totalPaginas = res.pagination?.pages ?? 1
      page += 1
    } while (page <= totalPaginas)
    return filtrarObrasPorBuscaLocal(todas)
  }

  const exportarObrasCsv = async () => {
    try {
      setExportandoCsv(true)
      const lista = await buscarTodasObrasParaExport()
      if (lista.length === 0) {
        toast({
          title: "Nada para exportar",
          description: searchTerm.trim()
            ? "Nenhuma obra corresponde à busca atual."
            : "Não há obras cadastradas.",
        })
        return
      }
      const cabecalho = [
        "ID",
        "Nome",
        "Descrição",
        "Status",
        "Data início",
        "Data fim",
        "Cliente",
        "Responsável",
        "Orçamento",
        "Cidade",
        "UF",
        "Qtd. gruas",
      ]
      const linhas = lista.map((obra: any) => {
        const budgetNum =
          typeof obra.budget === "string" ? parseFloat(obra.budget) || 0 : obra.budget || 0
        const gruasList = obra.gruasVinculadas || []
        const nGruas = Array.isArray(gruasList) ? gruasList.length : 0
        return [
          obra.id,
          obra.name,
          obra.description,
          obra.status,
          obra.startDate ? safeObraDateLabel(obra.startDate) : "",
          obra.endDate ? safeObraDateLabel(obra.endDate) : "",
          obra.clienteName,
          obra.responsavelName,
          Number.isFinite(budgetNum) ? budgetNum.toFixed(2) : "",
          obra.cidade,
          obra.estado,
          nGruas,
        ]
          .map(escapeCsvCelula)
          .join(",")
      })
      const csv = "\ufeff" + [cabecalho.join(","), ...linhas].join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `obras_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Exportação concluída",
        description: `${lista.length} obra(s) exportada(s) para CSV.`,
      })
    } catch (e) {
      console.error("Erro ao exportar obras CSV:", e)
      toast({
        title: "Erro na exportação",
        description: e instanceof Error ? e.message : "Não foi possível gerar o CSV.",
        variant: "destructive",
      })
    } finally {
      setExportandoCsv(false)
    }
  }

  return (
    <ProtectedRoute permission="obras:visualizar">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Obras</h1>
          <p className="text-gray-600">Controle e acompanhamento de todas as obras</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={loading || exportandoCsv}
              onClick={exportarObrasCsv}
              title="Baixar todas as obras (com o filtro de busca atual) em CSV"
            >
              {exportandoCsv ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
              ) : (
                <Download className="h-4 w-4 mr-2 shrink-0" />
              )}
              Exportar CSV
            </Button>
            <ExportButton
              dados={paginatedObras}
              tipo="obras"
              nomeArquivo="relatorio-obras"
              titulo="Relatório de Obras"
            />
            <Button 
              className="flex items-center gap-2"
              onClick={() => router.push('/dashboard/obras/nova')}
            >
              <Plus className="w-4 h-4" />
              Nova Obra
            </Button>
          </div>
        </div>
      </div>

      {/* Indicador de Loading */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <Loading size="lg" text="Carregando obras..." />
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

      {/* Lista de Obras: busca + tabela no mesmo card */}
      {!loading && !error && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="border-b px-4 py-4 sm:px-6 sm:py-5">
              <Label htmlFor="busca-obras" className="text-sm font-medium">
                Buscar obras
              </Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="busca-obras"
                  placeholder="Nome da obra ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredObras.length > 0 ? (
              <>
            <div className="overflow-x-auto px-4 py-4 sm:px-6 sm:py-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Obra</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="min-w-[160px] whitespace-nowrap">Período</TableHead>
                    <TableHead className="min-w-[140px]">Cliente</TableHead>
                    <TableHead className="min-w-[120px] hidden md:table-cell">Responsável</TableHead>
                    <TableHead className="text-right whitespace-nowrap min-w-[120px]">Orçamento</TableHead>
                    <TableHead className="text-center whitespace-nowrap w-[88px]">Gruas</TableHead>
                    <TableHead className="text-right min-w-[140px] whitespace-nowrap">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedObras.map((obra) => {
                    const o = obra as any
                    const gruasList = o.gruasVinculadas || []
                    const nGruas = Array.isArray(gruasList) ? gruasList.length : 0
                    const periodo = `${safeObraDateLabel(obra.startDate)} — ${obra.endDate ? safeObraDateLabel(obra.endDate) : "Em andamento"}`
                    const budgetNum =
                      typeof obra.budget === "string" ? parseFloat(obra.budget) || 0 : obra.budget || 0

                    return (
                      <TableRow
                        key={obra.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(`/dashboard/obras/${obra.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-start gap-2 min-w-0">
                            <Building2 className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate" title={obra.name}>
                                {obra.name}
                              </p>
                              {obra.description ? (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5" title={obra.description}>
                                  {obra.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(obra.status)}>
                            {getStatusIcon(obra.status)}
                            <span className="ml-1 capitalize whitespace-nowrap">{obra.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{periodo}</TableCell>
                        <TableCell className="text-sm max-w-[200px]">
                          <span className="line-clamp-2" title={obra.clienteName || ""}>
                            {formatObraPreviewValue(obra.clienteName)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[160px] hidden md:table-cell">
                          <span className="line-clamp-2" title={obra.responsavelName || ""}>
                            {formatObraPreviewValue(obra.responsavelName)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm whitespace-nowrap">
                          <ValorMonetarioOculto valor={budgetNum} />
                        </TableCell>
                        <TableCell className="text-center">
                          {nGruas > 0 ? (
                            <Badge variant="secondary" className="tabular-nums">
                              {nGruas}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell
                          className="text-right whitespace-nowrap p-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-nowrap justify-end items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Ver obra"
                              onClick={() => router.push(`/dashboard/obras/${obra.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Excluir"
                              onClick={() => handleDeleteObra(obra)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600">
                  <span>
                    Mostrando {startIndex} a {endIndex} de {pagination.total || filteredObras.length} obras
                  </span>
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
                  <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="hidden sm:flex items-center gap-1">
                    {(() => {
                      const pages: ReactNode[] = []
                      const totalPagesCount = totalPages
                      const currentPageNum = currentPage
                      let startPage = Math.max(1, currentPageNum - 2)
                      let endPage = Math.min(totalPagesCount, startPage + 4)
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
                          </Button>,
                        )
                      }
                      return pages
                    })()}
                  </div>
                  <div className="sm:hidden flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
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
              </>
            ) : (
              <div className="px-6 py-12 text-center text-muted-foreground">
                <Building2 className="mx-auto mb-4 h-12 w-12 opacity-40" />
                <p className="font-medium text-foreground">Nenhuma obra encontrada</p>
                {searchTerm ? (
                  <p className="mt-1 text-sm">Tente ajustar o termo de busca</p>
                ) : (
                  <p className="mt-1 text-sm">Cadastre uma nova obra para começar</p>
                )}
              </div>
            )}
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
                      <div key={funcionario.id} className={`flex gap-2 p-3 border rounded-lg ${funcionario.isSupervisor ? 'bg-blue-50 border-blue-200' : 'bg-green-50'}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {funcionario.isSupervisor ? (
                              <Shield className="w-4 h-4 text-blue-600" />
                            ) : (
                              <User className="w-4 h-4 text-green-600" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`font-medium ${funcionario.isSupervisor ? 'text-blue-900' : 'text-green-900'}`}>{funcionario.name}</p>
                                {funcionario.isSupervisor && (
                                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                    Supervisor
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-sm ${funcionario.isSupervisor ? 'text-blue-700' : 'text-green-700'}`}>{funcionario.role}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`supervisor-${funcionario.id}`}
                              checked={funcionario.isSupervisor === true}
                              onCheckedChange={() => handleToggleSupervisor(funcionario.id)}
                            />
                            <Label 
                              htmlFor={`supervisor-${funcionario.id}`}
                              className="text-sm cursor-pointer flex items-center gap-1"
                            >
                              <Shield className="w-3 h-3" />
                              Supervisor
                            </Label>
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
                        // Usar o mês dos custos existentes (não o custoForm.mes)
                        const mesesDosCustos = [...new Set(custosMensais.map(c => c.mes))].sort()
                        const mesBase = mesesDosCustos[mesesDosCustos.length - 1] || custoForm.mes
                        
                        console.log('📅 Meses existentes:', mesesDosCustos)
                        console.log('📅 Mês base para duplicar:', mesBase)
                        
                        const dataAtual = new Date(mesBase + '-01')
                        console.log('📅 Data atual criada:', dataAtual)
                        dataAtual.setMonth(dataAtual.getMonth() + 1)
                        console.log('📅 Data após +1 mês:', dataAtual)
                        const proximoMesStr = dataAtual.toISOString().slice(0, 7)
                        console.log('📅 String do próximo mês:', proximoMesStr)
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
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Limpar estados apenas quando fechar
            setCustosMensais([])
            setGruasSelecionadas([])
            setFuncionariosSelecionados([])
            setGruaSelecionada(null)
            setResponsavelSelecionado(null)
            setClienteSelecionado(null)
            setEditingObra(null)
          }
          setIsEditDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Obra
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateObra} className="space-y-6">
            <Tabs defaultValue="obra" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="obra">Dados da Obra</TabsTrigger>
                <TabsTrigger value="documentos">Documentos</TabsTrigger>
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

              {/* Aba: Documentos Obrigatórios */}
              <TabsContent value="documentos" className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    <h3 className="font-medium text-amber-900">Documentos Obrigatórios</h3>
                  </div>
                  <p className="text-sm text-amber-700">
                    Preencha os documentos obrigatórios da obra (CNO, ART e Apólice de Seguro)
                  </p>
                </div>

                <div className="space-y-4">
                  {/* CNO */}
                  <div>
                    <Label htmlFor="edit-cno">CNO (Cadastro Nacional de Obras)</Label>
                    <Input
                      id="edit-cno"
                      value={obraFormData.cno}
                      onChange={(e) => setObraFormData({ ...obraFormData, cno: e.target.value })}
                      placeholder="Ex: 123456789012"
                    />
                  </div>

                  {/* ART */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-art-numero">ART (Anotação de Responsabilidade Técnica) - Número</Label>
                    <Input
                      id="edit-art-numero"
                      value={obraFormData.art_numero}
                      onChange={(e) => setObraFormData({ ...obraFormData, art_numero: e.target.value })}
                      placeholder="Ex: 123456789012345"
                    />
                    {obraFormData.art_arquivo && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>Arquivo: {obraFormData.art_arquivo.split('/').pop()}</span>
                      </div>
                    )}
                  </div>

                  {/* Apólice */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-apolice-numero">Apólice de Seguro - Número</Label>
                    <Input
                      id="edit-apolice-numero"
                      value={obraFormData.apolice_numero}
                      onChange={(e) => setObraFormData({ ...obraFormData, apolice_numero: e.target.value })}
                      placeholder="Ex: 987654321098765"
                    />
                    {obraFormData.apolice_arquivo && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>Arquivo: {obraFormData.apolice_arquivo.split('/').pop()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Aba: Grua - Com suporte a múltiplas gruas */}
              <TabsContent value="grua" className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Crane className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Gerenciar Gruas</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    Adicione ou remova gruas vinculadas a esta obra. Você pode ter múltiplas gruas na mesma obra.
                  </p>
                </div>

                {/* Gruas já vinculadas */}
                {gruasSelecionadas.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Gruas Vinculadas ({gruasSelecionadas.length})</h4>
                    {gruasSelecionadas.map((grua) => (
                      <div key={grua.id} className="flex gap-2 p-3 border rounded-lg bg-blue-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Crane className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="font-medium text-blue-900">{grua.name || grua.model}</p>
                              <p className="text-sm text-blue-700">
                                {grua.manufacturer} - {grua.capacity}
                              </p>
                              <p className="text-xs text-blue-600">
                                Mensalidade: R$ {(grua.taxa_mensal || 0).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoverGruaSelecionada(grua.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Adicionar nova grua */}
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-medium text-sm">Adicionar Nova Grua</h4>
                  
                  <div>
                    <Label htmlFor="edit-gruaId">Buscar Grua</Label>
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
                      <Label htmlFor="edit-gruaValue">Valor da Grua (R$)</Label>
                      <Input
                        id="edit-gruaValue"
                        type="number"
                        value={obraFormData.gruaValue}
                        onChange={(e) => setObraFormData({ ...obraFormData, gruaValue: e.target.value })}
                        placeholder="Ex: 500000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-monthlyFee">Mensalidade (R$)</Label>
                      <Input
                        id="edit-monthlyFee"
                        type="number"
                        value={obraFormData.monthlyFee}
                        onChange={(e) => setObraFormData({ ...obraFormData, monthlyFee: e.target.value })}
                        placeholder="Ex: 15000"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      if (!gruaSelecionada) {
                        toast({
                          title: "Atenção",
                          description: "Selecione uma grua primeiro",
                          variant: "destructive"
                        })
                        return
                      }
                      handleAdicionarGruaSelecionada(
                        gruaSelecionada,
                        parseFloat(obraFormData.gruaValue) || 0,
                        parseFloat(obraFormData.monthlyFee) || 0
                      )
                    }}
                    disabled={!gruaSelecionada}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Grua à Lista
                  </Button>
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
                      <div key={funcionario.id} className={`flex gap-2 p-3 border rounded-lg ${funcionario.isSupervisor ? 'bg-blue-50 border-blue-200' : 'bg-green-50'}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {funcionario.isSupervisor ? (
                              <Shield className="w-4 h-4 text-blue-600" />
                            ) : (
                              <User className="w-4 h-4 text-green-600" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`font-medium ${funcionario.isSupervisor ? 'text-blue-900' : 'text-green-900'}`}>{funcionario.name}</p>
                                {funcionario.isSupervisor && (
                                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                    Supervisor
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-sm ${funcionario.isSupervisor ? 'text-blue-700' : 'text-green-700'}`}>{funcionario.role}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`supervisor-${funcionario.id}`}
                              checked={funcionario.isSupervisor === true}
                              onCheckedChange={() => handleToggleSupervisor(funcionario.id)}
                            />
                            <Label 
                              htmlFor={`supervisor-${funcionario.id}`}
                              className="text-sm cursor-pointer flex items-center gap-1"
                            >
                              <Shield className="w-3 h-3" />
                              Supervisor
                            </Label>
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
                        // Usar o mês dos custos existentes (não o custoForm.mes)
                        const mesesDosCustos = [...new Set(custosMensais.map(c => c.mes))].sort()
                        const mesBase = mesesDosCustos[mesesDosCustos.length - 1] || custoForm.mes
                        
                        console.log('📅 Meses existentes:', mesesDosCustos)
                        console.log('📅 Mês base para duplicar:', mesBase)
                        
                        const dataAtual = new Date(mesBase + '-01')
                        console.log('📅 Data atual criada:', dataAtual)
                        dataAtual.setMonth(dataAtual.getMonth() + 1)
                        console.log('📅 Data após +1 mês:', dataAtual)
                        const proximoMesStr = dataAtual.toISOString().slice(0, 7)
                        console.log('📅 String do próximo mês:', proximoMesStr)
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
            {obraToDelete && (() => {
              const obraCompleta = obras.find(o => o.id === obraToDelete.id)
              const gruasVinculadas = obraCompleta?.grua_obra || obraCompleta?.gruas || []
              const custos = obraCompleta?.custos_mensais || []
              return (gruasVinculadas.length > 0 || custos.length > 0)
            })() && (
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
              disabled={deleting || (obraToDelete && (() => {
                const obraCompleta = obras.find(o => o.id === obraToDelete.id)
                const gruasVinculadas = obraCompleta?.grua_obra || obraCompleta?.gruas || []
                const custos = obraCompleta?.custos_mensais || []
                return gruasVinculadas.length > 0 || custos.length > 0
              })())}
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
                    custosMensais.reduce((acc: Record<string, CustoMensal[]>, custo: CustoMensal) => {
                      if (!acc[custo.mes]) acc[custo.mes] = []
                      acc[custo.mes].push(custo)
                      return acc
                    }, {} as Record<string, CustoMensal[]>)
                  ).map(([mes, custos]: [string, CustoMensal[]]) => (
                    <div key={mes} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-900">{mes}</h5>
                        <span className="text-sm text-gray-600">
                          {custos.length} item(s) - R$ {custos.reduce((total: number, c: CustoMensal) => total + c.totalOrcamento, 0).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {custos.map((custo: CustoMensal) => (
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
    </ProtectedRoute>
  )
}