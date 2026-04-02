"use client"

import { useState, useEffect, useRef, useMemo, type ReactNode } from "react"
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  ChevronsRight,
  Banknote,
  Download,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { gruasApi, type GruaBackend, type TipoGrua } from "@/lib/api-gruas"
import { ExportButton } from "@/components/export-button"
import { Loading, PageLoading, TableLoading, CardLoading, useLoading } from "@/components/ui/loading"
import { ProtectedRoute } from "@/components/protected-route"
import { DebugButton } from "@/components/debug-button"

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

function PreviewField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-muted/25 px-3 py-2.5 transition-colors hover:bg-muted/40",
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold leading-snug text-foreground">{children}</div>
    </div>
  )
}

function PreviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-blue-600" /> : null}
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
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
  const [exportandoCsv, setExportandoCsv] = useState(false)
  
  const [gruaFormData, setGruaFormData] = useState<{
    name: string
    model: string
    fabricante: string
    capacity: string
    status: 'disponivel' | 'em_obra' | 'manutencao' | 'inativa'
    tipo: string
    lanca: string
    altura_final: string
    ano: string
    tipo_base: string
    capacidade_1_cabo: string
    capacidade_2_cabos: string
    potencia_instalada: string
    voltagem: string
    velocidade_rotacao: string
    velocidade_elevacao: string
    observacoes: string
    createdAt: string
    capacidade_ponta: string
    altura_trabalho: string
    localizacao: string
    horas_operacao: string
    valor_locacao: string
    valor_real: string
    valor_operacao: string
    valor_sinaleiro: string
    valor_manutencao: string
    ultima_manutencao: string
    ultima_manutencao_corretiva?: string
    proxima_manutencao: string
  }>({
    name: '',
    model: '',
    fabricante: '',
    capacity: '',
    status: 'disponivel',
    tipo: '',
    lanca: '',
    altura_final: '',
    ano: '',
    tipo_base: '',
    capacidade_1_cabo: '',
    capacidade_2_cabos: '',
    potencia_instalada: '',
    voltagem: '',
    velocidade_rotacao: '',
    velocidade_elevacao: '',
    observacoes: '',
    createdAt: '',
    capacidade_ponta: '',
    altura_trabalho: '',
    localizacao: '',
    horas_operacao: '',
    valor_locacao: '',
    valor_real: '',
    valor_operacao: '',
    valor_sinaleiro: '',
    valor_manutencao: '',
    ultima_manutencao: '',
    ultima_manutencao_corretiva: '',
    proxima_manutencao: ''
  })
  
  // Estados para API
  const [gruas, setGruas] = useState<GruaFrontend[]>([])
  const { loading, startLoading, stopLoading } = useLoading(true)
  const [error, setError] = useState<string | null>(null)
  
  // Flags para controlar carregamento e evitar chamadas duplicadas
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const loadingRef = useRef(false)
  const initialLoadDoneRef = useRef(false)
  const prevSelectedStatusRef = useRef(selectedStatus)
  const prevSelectedTipoRef = useRef(selectedTipo)
  const prevCurrentPageRef = useRef(currentPage)
  const prevItemsPerPageRef = useRef(itemsPerPage)
  const prevSearchTermRef = useRef(searchTerm)
  const { loading: creating, startLoading: startCreating, stopLoading: stopCreating, setLoading: setCreating } = useLoading()
  const { loading: updating, startLoading: startUpdating, stopLoading: stopUpdating, setLoading: setUpdating } = useLoading()
  const [deleting, setDeleting] = useState(false)

  const [tiposGrua, setTiposGrua] = useState<TipoGrua[]>([])
  const [isTipoModalOpen, setIsTipoModalOpen] = useState(false)
  const [novoTipoNome, setNovoTipoNome] = useState("")
  const [savingTipo, setSavingTipo] = useState(false)

  // Função auxiliar para converter dados do backend para o formato do componente
  const converterGruaBackend = (grua: any): GruaFrontend => {
    // Preservar TODOS os campos do backend primeiro, depois sobrescrever com campos específicos
    const converted: any = {
      // Primeiro, espalhar todos os campos do backend
      ...grua,
      // Depois, sobrescrever com campos específicos formatados
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

  const normalizarTextoOpcional = (valor: any): string => {
    if (valor === null || valor === undefined) return ''
    const texto = String(valor).trim()
    if (!texto) return ''
    if (texto.toLowerCase() === 'não informado' || texto.toLowerCase() === 'nao informado') return ''
    return texto
  }

  const escapeCsvCelula = (valor: unknown) => {
    const s = valor == null ? "" : String(valor)
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const montarParamsListagemGruas = (page: number, limit: number) => {
    const params: Record<string, unknown> = { page, limit }
    if (selectedStatus !== "all") params.status = selectedStatus
    if (selectedTipo !== "all") params.tipo = selectedTipo
    if (searchTerm.trim()) {
      params.search = searchTerm.trim()
      if (searchTerm.trim().match(/^G[A-Z0-9-]+$/)) {
        params.grua_id = searchTerm.trim()
        delete params.search
      }
    }
    return params
  }

  // Função para carregar gruas da API
  const carregarGruas = async () => {
    try {
      startLoading()
      setError(null)
      
      const params = montarParamsListagemGruas(currentPage, itemsPerPage) as any
      
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

  const carregarTiposGrua = async () => {
    try {
      const r = await gruasApi.listarTiposGrua()
      if (r.success) setTiposGrua(r.data)
    } catch (e) {
      console.error(e)
      toast({
        title: "Tipos de grua",
        description: "Não foi possível carregar a lista de tipos.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    carregarTiposGrua()
  }, [])

  
  // Carregar gruas quando o componente montar - apenas uma vez
  useEffect(() => {
    // Evitar carregamento duplo - só carregar uma vez
    if (initialLoadDoneRef.current) return
    
    if (!loadingRef.current) {
      initialLoadDoneRef.current = true
      loadingRef.current = true
      carregarGruas().finally(() => {
        setDadosIniciaisCarregados(true)
        loadingRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Carregar gruas quando filtros mudarem (com debounce)
  useEffect(() => {
    if (!dadosIniciaisCarregados) return
    
    // Verificar se houve mudança real nos parâmetros (não apenas no primeiro render)
    const statusChanged = prevSelectedStatusRef.current !== selectedStatus
    const tipoChanged = prevSelectedTipoRef.current !== selectedTipo
    const pageChanged = prevCurrentPageRef.current !== currentPage
    const itemsPerPageChanged = prevItemsPerPageRef.current !== itemsPerPage
    
    // Se não houve mudança real, não executar (evita carregamento duplo no primeiro render)
    if (!statusChanged && !tipoChanged && !pageChanged && !itemsPerPageChanged) {
      return
    }
    
    // Atualizar refs
    prevSelectedStatusRef.current = selectedStatus
    prevSelectedTipoRef.current = selectedTipo
    prevCurrentPageRef.current = currentPage
    prevItemsPerPageRef.current = itemsPerPage
    
    const timer = setTimeout(() => {
      if (!loadingRef.current) {
        loadingRef.current = true
        carregarGruas().finally(() => {
          loadingRef.current = false
        })
      }
    }, 300)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedTipo, currentPage, itemsPerPage, dadosIniciaisCarregados])

  // Debounce para pesquisa (otimizado)
  useEffect(() => {
    if (!dadosIniciaisCarregados) return
    
    // Verificar se houve mudança real no termo de busca (não apenas no primeiro render)
    const searchChanged = prevSearchTermRef.current !== searchTerm
    
    // Se não houve mudança real, não executar (evita carregamento duplo no primeiro render)
    if (!searchChanged) {
      return
    }
    
    // Atualizar ref
    prevSearchTermRef.current = searchTerm
    
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined && !loadingRef.current) {
        setCurrentPage(1) // Reset para primeira página ao pesquisar
        loadingRef.current = true
        carregarGruas().finally(() => {
          loadingRef.current = false
        })
      }
    }, 300) // Reduzido para 300ms

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, dadosIniciaisCarregados])

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

  // Funções auxiliares para formatar valores no modal de detalhes
  const formatValue = (value: any): string => {
    // Verifica se o valor é null ou undefined explicitamente
    if (value === null || value === undefined) return 'Não informado'
    
    // Para números (incluindo 0)
    if (typeof value === 'number') {
      return value.toString()
    }
    
    // Para strings (incluindo "1", "0", etc)
    if (typeof value === 'string') {
      const trimmed = value.trim()
      // String vazia retorna "Não informado", mas "0" ou "1" são válidos
      if (trimmed === '') return 'Não informado'
      return trimmed
    }
    
    // Para booleanos
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não'
    }
    
    // Para outros tipos, tenta converter para string
    return String(value)
  }

  const formatCurrency = (value: any): string => {
    // Verifica se o valor é null ou undefined explicitamente
    if (value === null || value === undefined) return 'Não informado'
    
    // Para strings vazias
    if (typeof value === 'string' && value.trim() === '') return 'Não informado'
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return 'Não informado'
    return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

  const salvarNovoTipoGrua = async () => {
    const nome = novoTipoNome.trim()
    if (!nome) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do novo tipo.",
        variant: "destructive",
      })
      return
    }
    try {
      setSavingTipo(true)
      const r = await gruasApi.criarTipoGrua(nome)
      await carregarTiposGrua()
      setGruaFormData((prev) => ({ ...prev, tipo: r.data.nome }))
      setNovoTipoNome("")
      setIsTipoModalOpen(false)
      toast({
        title: "Tipo adicionado",
        description: `"${r.data.nome}" está disponível na lista.`,
      })
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; error?: string } } }
      const msg =
        ax?.response?.data?.message ||
        ax?.response?.data?.error ||
        (err instanceof Error ? err.message : null) ||
        "Tente novamente."
      toast({
        title: "Não foi possível salvar",
        description: msg,
        variant: "destructive",
      })
    } finally {
      setSavingTipo(false)
    }
  }

  const tiposFiltroOpcoes = useMemo(() => {
    const s = new Set<string>()
    tiposGrua.forEach((t) => s.add(t.nome))
    gruas.forEach((g) => {
      const t = g.tipo
      if (t && t !== "Não informado") s.add(t)
    })
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [tiposGrua, gruas])

  const opcoesTipoFormulario = useMemo(() => {
    const nomes = new Set(tiposGrua.map((t) => t.nome))
    const extra =
      gruaFormData.tipo && !nomes.has(gruaFormData.tipo)
        ? [{ id: "__legacy__", nome: gruaFormData.tipo, ordem: -1 } as TipoGrua]
        : []
    return [...tiposGrua, ...extra]
  }, [tiposGrua, gruaFormData.tipo])

  const handleLancaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, lanca: e.target.value }))
  }

  const handleAlturaFinalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, altura_final: e.target.value }))
  }

  const handleAnoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, ano: e.target.value }))
  }

  const handleTipoBaseChange = (value: string) => {
    setGruaFormData(prev => ({ ...prev, tipo_base: value }))
  }

  const handleCapacidade1CaboChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, capacidade_1_cabo: e.target.value }))
  }

  const handleCapacidade2CabosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, capacidade_2_cabos: e.target.value }))
  }

  const handlePotenciaInstaladaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, potencia_instalada: e.target.value }))
  }

  const handleVoltagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, voltagem: e.target.value }))
  }

  const handleVelocidadeRotacaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, velocidade_rotacao: e.target.value }))
  }

  const handleVelocidadeElevacaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, velocidade_elevacao: e.target.value }))
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

  const handleCapacidadePontaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, capacidade_ponta: e.target.value }))
  }

  const handleAlturaTrabalhoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, altura_trabalho: e.target.value }))
  }

  const handleLocalizacaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, localizacao: e.target.value }))
  }

  const handleHorasOperacaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, horas_operacao: e.target.value }))
  }

  const handleValorLocacaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, valor_locacao: e.target.value }))
  }

  const handleValorRealChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, valor_real: e.target.value }))
  }

  const handleValorOperacaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, valor_operacao: e.target.value }))
  }

  const handleValorSinaleiroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, valor_sinaleiro: e.target.value }))
  }

  const handleValorManutencaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, valor_manutencao: e.target.value }))
  }

  const handleUltimaManutencaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, ultima_manutencao: e.target.value }))
  }

  const handleProximaManutencaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGruaFormData(prev => ({ ...prev, proxima_manutencao: e.target.value }))
  }

  const buscarTodasGruasParaExport = async (): Promise<GruaFrontend[]> => {
    const PAGE_SIZE = 100
    const todas: GruaFrontend[] = []
    let page = 1
    let totalPaginas = 1
    do {
      const response = (await gruasApi.listarGruas(
        montarParamsListagemGruas(page, PAGE_SIZE) as any,
      )) as unknown as GruasApiResponse
      if (!response.success || !response.data) break
      todas.push(...response.data.map(converterGruaBackend))
      totalPaginas = response.pagination?.pages ?? 1
      page += 1
    } while (page <= totalPaginas)
    return todas.filter(
      (grua) => selectedObra === "all" || grua.currentObraId === selectedObra,
    )
  }

  const exportarGruasCsvFiltrado = async () => {
    try {
      setExportandoCsv(true)
      const dados = await buscarTodasGruasParaExport()
      if (dados.length === 0) {
        toast({
          title: "Nada para exportar",
          description: "Não há gruas com os filtros atuais.",
        })
        return
      }
      const headers = [
        "Nome",
        "Modelo",
        "Fabricante",
        "Capacidade",
        "Status",
        "Tipo",
        "Obra atual",
        "Data criação",
      ]
      const linhas = dados.map((grua) =>
        [
          grua.name || "",
          grua.model || "",
          grua.fabricante || "",
          grua.capacity || "",
          grua.status || "",
          grua.tipo || "",
          grua.currentObraName || "",
          grua.createdAt ? new Date(grua.createdAt).toLocaleString("pt-BR") : "",
        ]
          .map(escapeCsvCelula)
          .join(","),
      )
      const csv = "\ufeff" + [headers.join(","), ...linhas].join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `gruas_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Exportação concluída",
        description: `${dados.length} grua(s) exportada(s) para CSV.`,
      })
    } catch (e) {
      console.error("Erro ao exportar gruas CSV:", e)
      toast({
        title: "Erro na exportação",
        description: e instanceof Error ? e.message : "Não foi possível gerar o CSV.",
        variant: "destructive",
      })
    } finally {
      setExportandoCsv(false)
    }
  }

  // Função para exportar gruas (PDF/Excel/CSV) respeitando os mesmos filtros da listagem
  const handleExportGruas = async (formato: 'pdf' | 'excel' | 'csv') => {
    try {
      const todasGruas = await buscarTodasGruasParaExport()
      if (todasGruas.length === 0) {
        toast({
          title: "Nada para exportar",
          description: "Não há gruas com os filtros atuais.",
          variant: "destructive",
        })
        return
      }
      await exportarLocal(todasGruas, formato)
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
      ].map(value => escapeCsvCelula(value)).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
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
      
      // Adicionar logos no cabeçalho
      const { adicionarLogosNoCabecalhoFrontend } = await import('@/lib/utils/pdf-logos-frontend')
      let yPos = await adicionarLogosNoCabecalhoFrontend(doc, 10)
      
      // Título
      doc.setFontSize(16)
      doc.text('Relatório de Gruas', 14, yPos)
      yPos += 8
      doc.setFontSize(10)
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, yPos)
      yPos += 6
      doc.text(`Total de gruas: ${dados.length}`, 14, yPos)
      yPos += 6

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
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })

      // Adicionar rodapé com informações da empresa
      const { adicionarRodapeEmpresaFrontend } = await import('@/lib/utils/pdf-rodape-frontend')
      adicionarRodapeEmpresaFrontend(doc)

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

  const handleEditGrua = async (grua: GruaFrontend) => {
    setIsViewDialogOpen(false)
    setGruaToEdit(grua)

    // Buscar dados completos da grua da API para garantir que temos todos os campos técnicos
    try {
      const response = await gruasApi.obterGrua(grua.id)
      if (response.success && response.data) {
        const gruaCompleta = response.data
        
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
          name: gruaCompleta.name || grua.name || '',
          model: gruaCompleta.model || gruaCompleta.modelo || grua.model || grua.modelo || '',
          fabricante: gruaCompleta.fabricante || grua.fabricante || '',
          capacity: gruaCompleta.capacity || gruaCompleta.capacidade || grua.capacity || grua.capacidade || '',
          status: normalizarStatus(gruaCompleta.status || grua.status),
          tipo: gruaCompleta.tipo || grua.tipo || '',
          lanca: gruaCompleta.lanca?.toString() || '',
          altura_final: gruaCompleta.altura_final?.toString() || '',
          ano: gruaCompleta.ano?.toString() || '',
          tipo_base: gruaCompleta.tipo_base || '',
          capacidade_1_cabo: gruaCompleta.capacidade_1_cabo?.toString() || '',
          capacidade_2_cabos: gruaCompleta.capacidade_2_cabos?.toString() || '',
          potencia_instalada: gruaCompleta.potencia_instalada?.toString() || '',
          voltagem: gruaCompleta.voltagem || '',
          velocidade_rotacao: gruaCompleta.velocidade_rotacao?.toString() || '',
          velocidade_elevacao: gruaCompleta.velocidade_elevacao?.toString() || '',
          observacoes: gruaCompleta.observacoes || grua.observacoes || '',
          createdAt: gruaCompleta.created_at || gruaCompleta.createdAt || grua.createdAt || grua.created_at || '',
          capacidade_ponta: gruaCompleta.capacidade_ponta || gruaCompleta.capacidadePonta || '',
          altura_trabalho: gruaCompleta.altura_trabalho || gruaCompleta.alturaTrabalho || '',
          localizacao: gruaCompleta.localizacao || '',
          horas_operacao: gruaCompleta.horas_operacao?.toString() || gruaCompleta.horasOperacao?.toString() || '',
          valor_locacao: gruaCompleta.valor_locacao?.toString() || gruaCompleta.valorLocacao?.toString() || '',
          valor_real: gruaCompleta.valor_real?.toString() || '',
          valor_operacao: gruaCompleta.valor_operacao?.toString() || gruaCompleta.valorOperacao?.toString() || '',
          valor_sinaleiro: gruaCompleta.valor_sinaleiro?.toString() || gruaCompleta.valorSinaleiro?.toString() || '',
          valor_manutencao: gruaCompleta.valor_manutencao?.toString() || gruaCompleta.valorManutencao?.toString() || '',
          ultima_manutencao: gruaCompleta.ultima_manutencao ? new Date(gruaCompleta.ultima_manutencao).toISOString().split('T')[0] : gruaCompleta.ultimaManutencao ? new Date(gruaCompleta.ultimaManutencao).toISOString().split('T')[0] : '',
          proxima_manutencao: gruaCompleta.proxima_manutencao ? new Date(gruaCompleta.proxima_manutencao).toISOString().split('T')[0] : gruaCompleta.proximaManutencao ? new Date(gruaCompleta.proximaManutencao).toISOString().split('T')[0] : ''
        })
      } else {
        // Fallback para dados locais se a API falhar
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
          lanca: (grua as any).lanca || '',
          altura_final: (grua as any).altura_final?.toString() || '',
          ano: (grua as any).ano?.toString() || '',
          tipo_base: (grua as any).tipo_base || '',
          capacidade_1_cabo: (grua as any).capacidade_1_cabo?.toString() || '',
          capacidade_2_cabos: (grua as any).capacidade_2_cabos?.toString() || '',
          potencia_instalada: (grua as any).potencia_instalada?.toString() || '',
          voltagem: (grua as any).voltagem || '',
          velocidade_rotacao: (grua as any).velocidade_rotacao?.toString() || '',
          velocidade_elevacao: (grua as any).velocidade_elevacao?.toString() || '',
          observacoes: normalizarTextoOpcional(grua.observacoes || (grua as any).observacoes),
          createdAt: grua.createdAt || grua.created_at || '',
          capacidade_ponta: normalizarTextoOpcional((grua as any).capacidade_ponta || (grua as any).capacidadePonta),
          altura_trabalho: normalizarTextoOpcional((grua as any).altura_trabalho || (grua as any).alturaTrabalho),
          localizacao: normalizarTextoOpcional((grua as any).localizacao),
          horas_operacao: (grua as any).horas_operacao?.toString() || (grua as any).horasOperacao?.toString() || '',
          valor_locacao: (grua as any).valor_locacao?.toString() || (grua as any).valorLocacao?.toString() || '',
          valor_real: (grua as any).valor_real?.toString() || '',
          valor_operacao: (grua as any).valor_operacao?.toString() || (grua as any).valorOperacao?.toString() || '',
          valor_sinaleiro: (grua as any).valor_sinaleiro?.toString() || (grua as any).valorSinaleiro?.toString() || '',
          valor_manutencao: (grua as any).valor_manutencao?.toString() || (grua as any).valorManutencao?.toString() || '',
          ultima_manutencao: (grua as any).ultima_manutencao ? new Date((grua as any).ultima_manutencao).toISOString().split('T')[0] : (grua as any).ultimaManutencao ? new Date((grua as any).ultimaManutencao).toISOString().split('T')[0] : '',
          proxima_manutencao: (grua as any).proxima_manutencao ? new Date((grua as any).proxima_manutencao).toISOString().split('T')[0] : (grua as any).proximaManutencao ? new Date((grua as any).proximaManutencao).toISOString().split('T')[0] : ''
        })
      }
    } catch (error) {
      console.error('Erro ao buscar dados completos da grua:', error)
      // Fallback para dados locais
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
        lanca: (grua as any).lanca || '',
        altura_final: (grua as any).altura_final?.toString() || '',
        ano: (grua as any).ano?.toString() || '',
        tipo_base: (grua as any).tipo_base || '',
        capacidade_1_cabo: (grua as any).capacidade_1_cabo?.toString() || '',
        capacidade_2_cabos: (grua as any).capacidade_2_cabos?.toString() || '',
        potencia_instalada: (grua as any).potencia_instalada?.toString() || '',
        voltagem: (grua as any).voltagem || '',
        velocidade_rotacao: (grua as any).velocidade_rotacao?.toString() || '',
        velocidade_elevacao: (grua as any).velocidade_elevacao?.toString() || '',
        observacoes: normalizarTextoOpcional(grua.observacoes || (grua as any).observacoes),
        createdAt: grua.createdAt || grua.created_at || '',
        capacidade_ponta: normalizarTextoOpcional((grua as any).capacidade_ponta || (grua as any).capacidadePonta),
        altura_trabalho: normalizarTextoOpcional((grua as any).altura_trabalho || (grua as any).alturaTrabalho),
        localizacao: normalizarTextoOpcional((grua as any).localizacao),
        horas_operacao: (grua as any).horas_operacao?.toString() || (grua as any).horasOperacao?.toString() || '',
        valor_locacao: (grua as any).valor_locacao?.toString() || (grua as any).valorLocacao?.toString() || '',
        valor_real: (grua as any).valor_real?.toString() || '',
        valor_operacao: (grua as any).valor_operacao?.toString() || (grua as any).valorOperacao?.toString() || '',
        valor_sinaleiro: (grua as any).valor_sinaleiro?.toString() || (grua as any).valorSinaleiro?.toString() || '',
        valor_manutencao: (grua as any).valor_manutencao?.toString() || (grua as any).valorManutencao?.toString() || '',
        ultima_manutencao: (grua as any).ultima_manutencao ? new Date((grua as any).ultima_manutencao).toISOString().split('T')[0] : (grua as any).ultimaManutencao ? new Date((grua as any).ultimaManutencao).toISOString().split('T')[0] : '',
        proxima_manutencao: (grua as any).proxima_manutencao ? new Date((grua as any).proxima_manutencao).toISOString().split('T')[0] : (grua as any).proximaManutencao ? new Date((grua as any).proximaManutencao).toISOString().split('T')[0] : ''
      })
    }
    
    setIsEditDialogOpen(true)
  }

  const handleDeleteGrua = (grua: GruaFrontend) => {
    setGruaToDelete(grua)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteGrua = async () => {
    if (!gruaToDelete) return

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

  const preencherDadosDebugGrua = () => {
    // Proteger função de debug - apenas em desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      console.warn('Função de debug desabilitada em produção')
      return
    }
    setGruaFormData({
      name: 'Grua Torre GT-500',
      model: 'GT-500',
      fabricante: 'Liebherr',
      capacity: '5000',
      status: 'disponivel',
      tipo: 'Grua Torre',
      lanca: '30',
      altura_final: '95',
      ano: '2020',
      tipo_base: 'Chumbador',
      capacidade_1_cabo: '2000',
      capacidade_2_cabos: '1300',
      potencia_instalada: '42',
      voltagem: '380V',
      velocidade_rotacao: '0.8',
      velocidade_elevacao: '0-25-062',
      observacoes: 'Grua em excelente estado de conservação. Última manutenção preventiva realizada há 2 meses.',
      createdAt: new Date().toISOString(),
      capacidade_ponta: '2000',
      altura_trabalho: '95',
      localizacao: 'Depósito Central',
      horas_operacao: '0',
      valor_locacao: '15000',
      valor_real: '15000',
      valor_operacao: '8000',
      valor_sinaleiro: '6000',
      valor_manutencao: '2000',
      ultima_manutencao: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      proxima_manutencao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
  }

  const preencherECriarGrua = async () => {
    try {
      // Preencher formulário com dados de validação
      setGruaFormData({
        name: 'validação 1',
        model: 'GT-500',
        fabricante: 'Liebherr',
        capacity: '5000',
        status: 'disponivel',
        tipo: 'Grua Torre',
        lanca: '30',
        altura_final: '95',
        ano: '2020',
        tipo_base: 'Chumbador',
        capacidade_1_cabo: '2000',
        capacidade_2_cabos: '1300',
        potencia_instalada: '42',
        voltagem: '380V',
        velocidade_rotacao: '0.8',
        velocidade_elevacao: '0-25-062',
        observacoes: 'Grua criada automaticamente para validação.',
        createdAt: new Date().toISOString(),
        capacidade_ponta: '2000',
        altura_trabalho: '95',
        localizacao: 'Depósito Central',
        horas_operacao: '0',
        valor_locacao: '15000',
        valor_real: '15000',
        valor_operacao: '8000',
        valor_sinaleiro: '6000',
        valor_manutencao: '2000',
        ultima_manutencao: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        proxima_manutencao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })

      // Aguardar um pouco para o estado atualizar
      await new Promise(resolve => setTimeout(resolve, 100))

      // Criar a grua diretamente
      startCreating()
      
      const gruaData = {
        name: 'validação 1',
        model: 'GT-500',
        capacity: '5000',
        status: 'disponivel',
        fabricante: 'Liebherr',
        tipo: 'Grua Torre',
        lanca: '30',
        altura_final: 95,
        ano: 2020,
        tipo_base: 'Chumbador',
        capacidade_1_cabo: 2000,
        capacidade_2_cabos: 1300,
        potencia_instalada: 42,
        voltagem: '380V',
        velocidade_rotacao: 0.8,
        velocidade_elevacao: '0-25-062',
        observacoes: 'Grua criada automaticamente para validação.',
        capacidade_ponta: '2000',
        altura_trabalho: '95',
        localizacao: 'Depósito Central',
        horas_operacao: 0,
        valor_locacao: 15000,
        valor_real: 15000,
        valor_operacao: 8000,
        valor_sinaleiro: 6000,
        valor_manutencao: 2000,
        ultima_manutencao: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        proxima_manutencao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }
      
      const response = await gruasApi.criarGrua(gruaData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Grua 'validação 1' criada com sucesso!",
        })
        
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
          lanca: '',
          altura_final: '',
          ano: '',
          tipo_base: '',
          capacidade_1_cabo: '',
          capacidade_2_cabos: '',
          potencia_instalada: '',
          voltagem: '',
          velocidade_rotacao: '',
          velocidade_elevacao: '',
          observacoes: '',
          createdAt: '',
          capacidade_ponta: '',
          altura_trabalho: '',
          localizacao: '',
          horas_operacao: '',
          valor_locacao: '',
          valor_real: '',
          valor_operacao: '',
          valor_sinaleiro: '',
          valor_manutencao: '',
          ultima_manutencao: '',
          proxima_manutencao: ''
        })
        
        setIsCreateDialogOpen(false)
      } else {
        throw new Error(response.error || 'Erro ao criar grua')
      }
    } catch (error: any) {
      console.error('Erro ao criar grua:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar grua. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      stopCreating()
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
        fabricante: gruaFormData.fabricante,
        tipo: gruaFormData.tipo,
        lanca: gruaFormData.lanca,
        altura_final: parseFloat(gruaFormData.altura_final) || 0,
        ano: parseInt(gruaFormData.ano) || new Date().getFullYear(),
        tipo_base: gruaFormData.tipo_base,
        capacidade_1_cabo: parseFloat(gruaFormData.capacidade_1_cabo) || 0,
        capacidade_2_cabos: parseFloat(gruaFormData.capacidade_2_cabos) || 0,
        potencia_instalada: parseFloat(gruaFormData.potencia_instalada) || 0,
        voltagem: gruaFormData.voltagem,
        velocidade_rotacao: parseFloat(gruaFormData.velocidade_rotacao) || 0,
        velocidade_elevacao: gruaFormData.velocidade_elevacao.trim(),
        observacoes: normalizarTextoOpcional(gruaFormData.observacoes) || undefined,
        capacidade_ponta: normalizarTextoOpcional(gruaFormData.capacidade_ponta) || undefined,
        altura_trabalho: normalizarTextoOpcional(gruaFormData.altura_trabalho) || undefined,
        localizacao: normalizarTextoOpcional(gruaFormData.localizacao) || undefined,
        horas_operacao: parseFloat(gruaFormData.horas_operacao) || 0,
        valor_locacao: gruaFormData.valor_locacao ? parseFloat(gruaFormData.valor_locacao) : undefined,
        valor_real: parseFloat(gruaFormData.valor_real) || 0,
        valor_operacao: parseFloat(gruaFormData.valor_operacao) || 0,
        valor_sinaleiro: parseFloat(gruaFormData.valor_sinaleiro) || 0,
        valor_manutencao: parseFloat(gruaFormData.valor_manutencao) || 0,
        ultima_manutencao: gruaFormData.ultima_manutencao || undefined,
        ultima_manutencao_corretiva: gruaFormData.ultima_manutencao_corretiva || undefined,
        proxima_manutencao: gruaFormData.proxima_manutencao || undefined,
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
          lanca: '',
          altura_final: '',
          ano: '',
          tipo_base: '',
          capacidade_1_cabo: '',
          capacidade_2_cabos: '',
          potencia_instalada: '',
          voltagem: '',
          velocidade_rotacao: '',
          velocidade_elevacao: '',
          observacoes: '',
          createdAt: '',
          capacidade_ponta: '',
          altura_trabalho: '',
          localizacao: '',
          horas_operacao: '',
          valor_locacao: '',
          valor_real: '',
          valor_operacao: '',
          valor_sinaleiro: '',
          valor_manutencao: '',
          ultima_manutencao: '',
          ultima_manutencao_corretiva: '',
          proxima_manutencao: ''
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
        fabricante: gruaFormData.fabricante,
        tipo: gruaFormData.tipo,
        lanca: gruaFormData.lanca,
        altura_final: parseFloat(gruaFormData.altura_final) || 0,
        ano: parseInt(gruaFormData.ano) || new Date().getFullYear(),
        tipo_base: gruaFormData.tipo_base,
        capacidade_1_cabo: parseFloat(gruaFormData.capacidade_1_cabo) || 0,
        capacidade_2_cabos: parseFloat(gruaFormData.capacidade_2_cabos) || 0,
        potencia_instalada: parseFloat(gruaFormData.potencia_instalada) || 0,
        voltagem: gruaFormData.voltagem,
        velocidade_rotacao: parseFloat(gruaFormData.velocidade_rotacao) || 0,
        velocidade_elevacao: gruaFormData.velocidade_elevacao.trim(),
        observacoes: normalizarTextoOpcional(gruaFormData.observacoes) || undefined,
        capacidade_ponta: normalizarTextoOpcional(gruaFormData.capacidade_ponta) || undefined,
        altura_trabalho: normalizarTextoOpcional(gruaFormData.altura_trabalho) || undefined,
        localizacao: normalizarTextoOpcional(gruaFormData.localizacao) || undefined,
        horas_operacao: parseFloat(gruaFormData.horas_operacao) || 0,
        valor_locacao: gruaFormData.valor_locacao ? parseFloat(gruaFormData.valor_locacao) : undefined,
        valor_real: parseFloat(gruaFormData.valor_real) || 0,
        valor_operacao: parseFloat(gruaFormData.valor_operacao) || 0,
        valor_sinaleiro: parseFloat(gruaFormData.valor_sinaleiro) || 0,
        valor_manutencao: parseFloat(gruaFormData.valor_manutencao) || 0,
        ultima_manutencao: gruaFormData.ultima_manutencao || undefined,
        ultima_manutencao_corretiva: gruaFormData.ultima_manutencao_corretiva || undefined,
        proxima_manutencao: gruaFormData.proxima_manutencao || undefined,
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
          lanca: '',
          altura_final: '',
          ano: '',
          tipo_base: '',
          capacidade_1_cabo: '',
          capacidade_2_cabos: '',
          potencia_instalada: '',
          voltagem: '',
          velocidade_rotacao: '',
          velocidade_elevacao: '',
          observacoes: '',
          createdAt: '',
          capacidade_ponta: '',
          altura_trabalho: '',
          localizacao: '',
          horas_operacao: '',
          valor_locacao: '',
          valor_real: '',
          valor_operacao: '',
          valor_sinaleiro: '',
          valor_manutencao: '',
          ultima_manutencao: '',
          ultima_manutencao_corretiva: '',
          proxima_manutencao: ''
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

  return (
    <ProtectedRoute permission="gruas:visualizar" showAccessDenied={true}>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Gruas</h1>
          <p className="text-gray-600">Gerenciamento de gruas e histórico de manutenção</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={loading || exportandoCsv}
            onClick={exportarGruasCsvFiltrado}
            title="Exportar todas as gruas que correspondem aos filtros atuais (várias páginas)"
          >
            {exportandoCsv ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
            ) : (
              <Download className="h-4 w-4 mr-2 shrink-0" />
            )}
            Exportar CSV
          </Button>
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

      {!error && (
        <Card>
          <CardHeader>
            <CardTitle>Gruas</CardTitle>
            <CardDescription>
              Filtros e lista em formato de tabela
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6 py-4 border-b">
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
                    <SelectTrigger id="status">
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
                    <SelectTrigger id="tipo">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {tiposFiltroOpcoes.map((nome) => (
                        <SelectItem key={nome} value={nome}>
                          {nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
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
            </div>

            <div className="px-6 py-4 border-b">
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
            </div>

            {loading ? (
              <div className="p-8">
                <Loading size="lg" text="Carregando gruas..." />
              </div>
            ) : filteredGruas.length === 0 ? (
              <div className="px-6 py-12 text-center text-muted-foreground">
                <Crane className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium text-foreground">Nenhuma grua encontrada</p>
                <p className="text-sm mt-1">Ajuste os filtros ou cadastre uma nova grua.</p>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-4">
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[160px]">Nome</TableHead>
                          <TableHead className="min-w-[120px]">Modelo / Cap.</TableHead>
                          <TableHead className="min-w-[140px]">Tipo</TableHead>
                          <TableHead className="min-w-[120px]">Obra</TableHead>
                          <TableHead className="text-center whitespace-nowrap">Status</TableHead>
                          <TableHead className="text-right whitespace-nowrap min-w-[420px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGruas.map((grua) => {
                          const obraNome = grua.currentObraName || "Sem obra"
                          return (
                            <TableRow key={grua.id} className="hover:bg-muted/50">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Crane className="w-4 h-4 shrink-0 text-blue-600" />
                                  <span className="truncate" title={grua.name}>
                                    {grua.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                <span className="whitespace-nowrap">
                                  {grua.model} — {grua.capacity}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm">
                                {grua.tipo ? (
                                  <span className="line-clamp-2" title={grua.tipo}>
                                    {grua.tipo}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {grua.currentObraId ? (
                                  <span className="line-clamp-2" title={obraNome}>
                                    {obraNome}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={getStatusColor(grua.status)}>
                                  {getStatusIcon(grua.status)}
                                  <span className="ml-1 capitalize">
                                    {grua.status.replace("_", " ")}
                                  </span>
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap p-2 align-middle">
                                <div className="flex flex-nowrap justify-end items-center gap-1 min-w-max ml-auto w-fit max-w-none">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    title="Ver detalhes"
                                    onClick={() => handleViewDetails(grua)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                    title="Editar"
                                    onClick={() => handleEditGrua(grua)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Excluir"
                                    onClick={() => handleDeleteGrua(grua)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs px-2 text-blue-600 whitespace-nowrap shrink-0"
                                    onClick={() =>
                                      (window.location.href = `/dashboard/gruas/${grua.id}/componentes`)
                                    }
                                  >
                                    <Package className="w-3.5 h-3.5 mr-1 shrink-0" />
                                    Componentes
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs px-2 text-purple-600 whitespace-nowrap shrink-0"
                                    onClick={() =>
                                      (window.location.href = `/dashboard/gruas/${grua.id}/configuracoes`)
                                    }
                                  >
                                    <Settings className="w-3.5 h-3.5 mr-1 shrink-0" />
                                    Especificações
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
                  <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600">
                    <span>
                      Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{" "}
                      {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} gruas
                    </span>
                    <div className="flex items-center gap-2">
                      <span>Itens por página:</span>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                          setItemsPerPage(parseInt(value, 10))
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

                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="hidden sm:flex"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="hidden sm:flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                          return (
                            <Button
                              key={pageNum}
                              type="button"
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      <div className="sm:hidden flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Página {currentPage} de {totalPages}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="hidden sm:flex"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de Criação de Grua */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crane className="w-5 h-5" />
              Nova Grua
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGrua} className="space-y-4">
            <div className="flex justify-end gap-2">
              <DebugButton onClick={preencherDadosDebugGrua} disabled={creating} />
              <Button 
                type="button"
                onClick={preencherECriarGrua} 
                disabled={creating}
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
              >
                Preencher e Criar (validação 1)
              </Button>
            </div>
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
                <Label htmlFor="fabricante">Fabricante *</Label>
                <Input
                  id="fabricante"
                  value={gruaFormData.fabricante}
                  onChange={handleFabricanteChange}
                  placeholder="Ex: Liebherr, Potain, etc."
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <div className="flex gap-2 mt-1.5">
                  <Select
                    value={gruaFormData.tipo}
                    onValueChange={handleTipoChange}
                    required
                  >
                    <SelectTrigger id="tipo" className="flex-1 min-w-0">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {opcoesTipoFormulario.map((t) => (
                        <SelectItem key={t.id} value={t.nome}>
                          {t.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-10 w-10"
                    title="Adicionar tipo de grua"
                    onClick={() => {
                      setNovoTipoNome("")
                      setIsTipoModalOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lanca">Lança (metros) *</Label>
                <Input
                  id="lanca"
                  type="number"
                  step="0.01"
                  min="0"
                  value={gruaFormData.lanca}
                  onChange={handleLancaChange}
                  placeholder="Ex: 50.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="altura_final">Altura Final (metros) *</Label>
                <Input
                  id="altura_final"
                  type="number"
                  step="0.01"
                  min="0"
                  value={gruaFormData.altura_final}
                  onChange={handleAlturaFinalChange}
                  placeholder="Ex: 100.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ano">Ano *</Label>
                <Input
                  id="ano"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={gruaFormData.ano}
                  onChange={handleAnoChange}
                  placeholder={`Ex: ${new Date().getFullYear()}`}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo_base">Tipo de Base *</Label>
                <Select
                  value={gruaFormData.tipo_base}
                  onValueChange={handleTipoBaseChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chumbador">Chumbador</SelectItem>
                    <SelectItem value="Fixa">Fixa</SelectItem>
                    <SelectItem value="Móvel">Móvel</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacidade_1_cabo">Capacidade 2 cabos (kg) - mínima *</Label>
                <Input
                  id="capacidade_1_cabo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={gruaFormData.capacidade_1_cabo}
                  onChange={handleCapacidade1CaboChange}
                  placeholder="Ex: 5000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="capacidade_2_cabos">Capacidade 4 cabos (kg) - máxima *</Label>
                <Input
                  id="capacidade_2_cabos"
                  type="number"
                  step="0.01"
                  min="0"
                  value={gruaFormData.capacidade_2_cabos}
                  onChange={handleCapacidade2CabosChange}
                  placeholder="Ex: 10000"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="potencia_instalada">Potência Instalada (KVA) *</Label>
                <Input
                  id="potencia_instalada"
                  type="number"
                  step="0.01"
                  min="0"
                  value={gruaFormData.potencia_instalada}
                  onChange={handlePotenciaInstaladaChange}
                  placeholder="Ex: 50.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="voltagem">Voltagem *</Label>
                <Input
                  id="voltagem"
                  value={gruaFormData.voltagem}
                  onChange={handleVoltagemChange}
                  placeholder="Ex: 380"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="velocidade_rotacao">Velocidade de Rotação (rpm) *</Label>
                <Input
                  id="velocidade_rotacao"
                  type="number"
                  step="0.01"
                  min="0"
                  value={gruaFormData.velocidade_rotacao}
                  onChange={handleVelocidadeRotacaoChange}
                  placeholder="Ex: 0.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="velocidade_elevacao">Velocidade de Elevação (m/min) *</Label>
                <Input
                  id="velocidade_elevacao"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  value={gruaFormData.velocidade_elevacao}
                  onChange={handleVelocidadeElevacaoChange}
                  placeholder="Ex: 0-25-062 ou 60"
                  required
                />
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

            {/* Campos complementares do cadastro */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="create-capacidade_ponta">Capacidade na Ponta</Label>
                  <Input
                    id="create-capacidade_ponta"
                    value={gruaFormData.capacidade_ponta}
                    onChange={handleCapacidadePontaChange}
                    placeholder="Ex: 1000 KGS"
                  />
                </div>
                <div>
                  <Label htmlFor="create-localizacao">Localização</Label>
                  <Input
                    id="create-localizacao"
                    value={gruaFormData.localizacao}
                    onChange={handleLocalizacaoChange}
                    placeholder="Ex: São Paulo, SP"
                  />
                </div>
                <div>
                  <Label htmlFor="create-ultima_manutencao_corretiva">Última Manutenção Corretiva</Label>
                  <Input
                    id="create-ultima_manutencao_corretiva"
                    type="date"
                    value={gruaFormData.ultima_manutencao_corretiva || ''}
                    onChange={(e) => setGruaFormData(prev => ({ ...prev, ultima_manutencao_corretiva: e.target.value }))}
                  />
                </div>
              </div>
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

      <Dialog open={isTipoModalOpen} onOpenChange={setIsTipoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo tipo de grua</DialogTitle>
            <DialogDescription>
              O nome será salvo no catálogo e poderá ser selecionado em novos cadastros.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="novo-tipo-nome">Nome do tipo</Label>
            <Input
              id="novo-tipo-nome"
              value={novoTipoNome}
              onChange={(e) => setNovoTipoNome(e.target.value)}
              placeholder="Ex: Grua de pórtico"
              maxLength={128}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  salvarNovoTipoGrua()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTipoModalOpen(false)}
              disabled={savingTipo}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={salvarNovoTipoGrua} disabled={savingTipo}>
              {savingTipo ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Grua */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <div className="flex gap-2 mt-1.5">
                  <Select
                    value={gruaFormData.tipo}
                    onValueChange={handleTipoChange}
                  >
                    <SelectTrigger id="edit-tipo" className="flex-1 min-w-0">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {opcoesTipoFormulario.map((t) => (
                        <SelectItem key={t.id} value={t.nome}>
                          {t.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-10 w-10"
                    title="Adicionar tipo de grua"
                    onClick={() => {
                      setNovoTipoNome("")
                      setIsTipoModalOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-lanca">Lança (metros) *</Label>
                <Input
                  id="edit-lanca"
                  type="number"
                  step="0.01"
                  min="0"
                  value={gruaFormData.lanca}
                  onChange={handleLancaChange}
                  placeholder="Ex: 50.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-altura_final">Altura Final (metros) *</Label>
                <Input
                  id="edit-altura_final"
                  type="number"
                  step="0.01"
                  min="0"
                  value={gruaFormData.altura_final}
                  onChange={handleAlturaFinalChange}
                  placeholder="Ex: 100.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-ano">Ano *</Label>
                <Input
                  id="edit-ano"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={gruaFormData.ano}
                  onChange={handleAnoChange}
                  placeholder={`Ex: ${new Date().getFullYear()}`}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-tipo_base">Tipo de Base *</Label>
                <Select
                  value={gruaFormData.tipo_base}
                  onValueChange={handleTipoBaseChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chumbador">Chumbador</SelectItem>
                    <SelectItem value="Fixa">Fixa</SelectItem>
                    <SelectItem value="Móvel">Móvel</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-capacidade_1_cabo">Capacidade 2 cabos (kg) - mínima *</Label>
                <Input
                  id="edit-capacidade_1_cabo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={gruaFormData.capacidade_1_cabo}
                  onChange={handleCapacidade1CaboChange}
                  placeholder="Ex: 5000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-capacidade_2_cabos">Capacidade 4 cabos (kg) - máxima *</Label>
                <Input
                  id="edit-capacidade_2_cabos"
                  type="number"
                  step="0.01"
                  min="0"
                  value={gruaFormData.capacidade_2_cabos}
                  onChange={handleCapacidade2CabosChange}
                  placeholder="Ex: 10000"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-potencia_instalada">Potência Instalada (KVA) *</Label>
                <Input
                  id="edit-potencia_instalada"
                  type="number"
                  step="0.01"
                  min="0"
                  value={gruaFormData.potencia_instalada}
                  onChange={handlePotenciaInstaladaChange}
                  placeholder="Ex: 50.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-voltagem">Voltagem *</Label>
                <Input
                  id="edit-voltagem"
                  value={gruaFormData.voltagem}
                  onChange={handleVoltagemChange}
                  placeholder="Ex: 380"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-velocidade_rotacao">Velocidade de Rotação (rpm) *</Label>
                <Input
                  id="edit-velocidade_rotacao"
                  type="number"
                  step="0.01"
                  min="0"
                  value={gruaFormData.velocidade_rotacao}
                  onChange={handleVelocidadeRotacaoChange}
                  placeholder="Ex: 0.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-velocidade_elevacao">Velocidade de Elevação (m/min) *</Label>
                <Input
                  id="edit-velocidade_elevacao"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  value={gruaFormData.velocidade_elevacao}
                  onChange={handleVelocidadeElevacaoChange}
                  placeholder="Ex: 0-25-062 ou 60"
                  required
                />
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

            {/* Campos Adicionais */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Informações Adicionais</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-capacidade_ponta">Capacidade na Ponta</Label>
                  <Input
                    id="edit-capacidade_ponta"
                    value={gruaFormData.capacidade_ponta}
                    onChange={handleCapacidadePontaChange}
                    placeholder="Ex: 1000 KGS"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-altura_trabalho">Altura de Trabalho</Label>
                  <Input
                    id="edit-altura_trabalho"
                    value={gruaFormData.altura_trabalho}
                    onChange={handleAlturaTrabalhoChange}
                    placeholder="Ex: 80 metros"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-localizacao">Localização</Label>
                  <Input
                    id="edit-localizacao"
                    value={gruaFormData.localizacao}
                    onChange={handleLocalizacaoChange}
                    placeholder="Ex: São Paulo, SP"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-horas_operacao">Horas de Operação</Label>
                  <Input
                    id="edit-horas_operacao"
                    type="number"
                    step="0.01"
                    min="0"
                    value={gruaFormData.horas_operacao}
                    onChange={handleHorasOperacaoChange}
                    placeholder="Ex: 1500"
                  />
                </div>
              </div>
            </div>

            {/* Informações Financeiras */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Informações Financeiras</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-valor_locacao">Valor de Locação (R$)</Label>
                  <Input
                    id="edit-valor_locacao"
                    type="number"
                    step="0.01"
                    min="0"
                    value={gruaFormData.valor_locacao}
                    onChange={handleValorLocacaoChange}
                    placeholder="Ex: 5000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-valor_real">Valor Real (R$)</Label>
                  <Input
                    id="edit-valor_real"
                    type="number"
                    step="0.01"
                    min="0"
                    value={gruaFormData.valor_real}
                    onChange={handleValorRealChange}
                    placeholder="Ex: 100000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-valor_operacao">Valor de Operação (R$)</Label>
                  <Input
                    id="edit-valor_operacao"
                    type="number"
                    step="0.01"
                    min="0"
                    value={gruaFormData.valor_operacao}
                    onChange={handleValorOperacaoChange}
                    placeholder="Ex: 2000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-valor_sinaleiro">Valor de Sinaleiro (R$)</Label>
                  <Input
                    id="edit-valor_sinaleiro"
                    type="number"
                    step="0.01"
                    min="0"
                    value={gruaFormData.valor_sinaleiro}
                    onChange={handleValorSinaleiroChange}
                    placeholder="Ex: 1500.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-valor_manutencao">Valor de Manutenção (R$)</Label>
                  <Input
                    id="edit-valor_manutencao"
                    type="number"
                    step="0.01"
                    min="0"
                    value={gruaFormData.valor_manutencao}
                    onChange={handleValorManutencaoChange}
                    placeholder="Ex: 3000.00"
                  />
                </div>
              </div>
            </div>

            {/* Manutenção */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Manutenção</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-ultima_manutencao">Última Manutenção</Label>
                  <Input
                    id="edit-ultima_manutencao"
                    type="date"
                    value={gruaFormData.ultima_manutencao}
                    onChange={handleUltimaManutencaoChange}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-proxima_manutencao">Próxima Manutenção</Label>
                  <Input
                    id="edit-proxima_manutencao"
                    type="date"
                    value={gruaFormData.proxima_manutencao}
                    onChange={handleProximaManutencaoChange}
                  />
                </div>
              </div>
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
                ⚠️ Esta grua aparece como "Em Obra". Se houver vínculo ativo válido, o backend poderá impedir a exclusão.
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
              disabled={deleting}
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
        <DialogContent className="flex h-[min(90vh,880px)] max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
          {gruaToView && (() => {
            const grua = gruaToView as any
            const subtitle = [gruaToView.model || grua.modelo, gruaToView.fabricante].filter(Boolean).join(" · ")

            return (
              <>
                <DialogHeader className="shrink-0 space-y-1 border-b bg-muted/40 px-5 py-4 pr-14 text-left sm:px-6">
                  <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Eye className="h-5 w-5 shrink-0 text-blue-600" />
                    Detalhes da Grua
                  </DialogTitle>
                  <DialogDescription className="line-clamp-2 text-left text-sm text-muted-foreground">
                    {subtitle || gruaToView.name}
                  </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
                  <div className="space-y-5">
                    <div className="relative overflow-hidden rounded-xl border border-blue-600/15 bg-gradient-to-br from-blue-600/[0.08] via-background to-muted/20 p-5 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                            <Crane className="h-7 w-7" />
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <h2 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{gruaToView.name}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {subtitle || "Modelo e fabricante não informados"}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(gruaToView.status)}
                            <Badge
                              variant={
                                gruaToView.status === "disponivel"
                                  ? "default"
                                  : gruaToView.status === "em_obra"
                                    ? "secondary"
                                    : gruaToView.status === "manutencao"
                                      ? "destructive"
                                      : "outline"
                              }
                              className="text-xs font-medium capitalize"
                            >
                              {gruaToView.status === "disponivel"
                                ? "Disponível"
                                : gruaToView.status === "em_obra"
                                  ? "Em Obra"
                                  : gruaToView.status === "manutencao"
                                    ? "Manutenção"
                                    : "Inativa"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 backdrop-blur-sm">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Capacidade</dt>
                          <dd className="mt-0.5 text-sm font-semibold">{formatValue(gruaToView.capacity || grua.capacidade)}</dd>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 backdrop-blur-sm">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Ano</dt>
                          <dd className="mt-0.5 text-sm font-semibold">{formatValue(grua.ano)}</dd>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 backdrop-blur-sm sm:col-span-1">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Tipo</dt>
                          <dd className="mt-0.5 truncate text-sm font-semibold" title={gruaToView.tipo || ""}>
                            {formatValue(gruaToView.tipo)}
                          </dd>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 backdrop-blur-sm sm:col-span-1">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Local</dt>
                          <dd className="mt-0.5 truncate text-sm font-semibold" title={grua.localizacao || ""}>
                            {formatValue(grua.localizacao)}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <PreviewSection title="Cadastro e operação" icon={Building2}>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        <PreviewField label="Modelo">{formatValue(gruaToView.model || grua.modelo)}</PreviewField>
                        <PreviewField label="Fabricante">{formatValue(gruaToView.fabricante)}</PreviewField>
                        <PreviewField label="Capacidade na ponta">{formatValue(grua.capacidade_ponta || grua.capacidadePonta)}</PreviewField>
                        {gruaToView.currentObraName ? (
                          <PreviewField label="Obra atual" className="sm:col-span-2 lg:col-span-1">
                            {gruaToView.currentObraName}
                          </PreviewField>
                        ) : null}
                        {gruaToView.createdAt ? (
                          <PreviewField label="Cadastrada em">
                            {new Date(gruaToView.createdAt).toLocaleDateString("pt-BR")}
                          </PreviewField>
                        ) : null}
                      </div>
                    </PreviewSection>

                    <PreviewSection title="Especificações técnicas" icon={Settings}>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        <PreviewField label="Lança">{formatValue(grua.lanca)}</PreviewField>
                        <PreviewField label="Altura final (m)">{formatValue(grua.altura_final)}</PreviewField>
                        <PreviewField label="Altura de trabalho">{formatValue(grua.altura_trabalho || grua.alturaTrabalho)}</PreviewField>
                        <PreviewField label="Tipo de base">{formatValue(grua.tipo_base)}</PreviewField>
                        <PreviewField label="Capacidade 2 cabos (mín.)">{formatValue(grua.capacidade_1_cabo)}</PreviewField>
                        <PreviewField label="Capacidade 4 cabos (máx.)">{formatValue(grua.capacidade_2_cabos)}</PreviewField>
                        <PreviewField label="Potência instalada">{formatValue(grua.potencia_instalada)}</PreviewField>
                        <PreviewField label="Voltagem">{formatValue(grua.voltagem)}</PreviewField>
                        <PreviewField label="Velocidade de rotação">{formatValue(grua.velocidade_rotacao)}</PreviewField>
                        <PreviewField label="Velocidade de elevação">{formatValue(grua.velocidade_elevacao)}</PreviewField>
                        <PreviewField label="Horas de operação">{formatValue(grua.horas_operacao || grua.horasOperacao)}</PreviewField>
                      </div>
                    </PreviewSection>

                    <PreviewSection title="Valores" icon={Banknote}>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        <PreviewField label="Valor de locação">{formatCurrency(grua.valor_locacao || grua.valorLocacao)}</PreviewField>
                        <PreviewField label="Valor real">{formatCurrency(grua.valor_real)}</PreviewField>
                        <PreviewField label="Valor de operação">{formatCurrency(grua.valor_operacao || grua.valorOperacao)}</PreviewField>
                        <PreviewField label="Valor de sinaleiro">{formatCurrency(grua.valor_sinaleiro || grua.valorSinaleiro)}</PreviewField>
                        <PreviewField label="Valor de manutenção">{formatCurrency(grua.valor_manutencao || grua.valorManutencao)}</PreviewField>
                      </div>
                    </PreviewSection>

                    <PreviewSection title="Manutenção" icon={Wrench}>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <PreviewField label="Última manutenção">
                          {grua.ultima_manutencao || grua.ultimaManutencao
                            ? new Date(grua.ultima_manutencao || grua.ultimaManutencao).toLocaleDateString("pt-BR")
                            : "Não informado"}
                        </PreviewField>
                        <PreviewField label="Próxima manutenção">
                          {grua.proxima_manutencao || grua.proximaManutencao
                            ? new Date(grua.proxima_manutencao || grua.proximaManutencao).toLocaleDateString("pt-BR")
                            : "Não informado"}
                        </PreviewField>
                      </div>
                    </PreviewSection>

                    <section className="overflow-hidden rounded-xl border border-border/80 bg-muted/15">
                      <div className="border-b border-border/60 bg-muted/25 px-4 py-2.5">
                        <h3 className="text-sm font-semibold tracking-tight">Observações</h3>
                      </div>
                      <p className="p-4 text-sm leading-relaxed text-foreground">
                        {gruaToView.observacoes || grua.observacoes || "Nenhuma observação registrada."}
                      </p>
                    </section>
                  </div>
                </div>

                <div className="shrink-0 border-t bg-muted/30 px-5 py-3 sm:px-6">
                  <div className="flex flex-nowrap justify-start gap-2 overflow-x-auto pb-0.5 sm:justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleEditGrua(gruaToView)} className="shrink-0">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Grua
                    </Button>
                    {gruaToView.currentObraId && gruaToView.currentObraName ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (window.location.href = `/dashboard/obras/${gruaToView.currentObraId}?tab=livro`)}
                        className="shrink-0"
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        Ver na Obra
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (window.location.href = `/dashboard/gruas/${gruaToView.id}/componentes`)}
                      className="shrink-0"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Componentes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (window.location.href = `/dashboard/gruas/${gruaToView.id}/configuracoes`)}
                      className="shrink-0 text-purple-600 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/40"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Especificações
                    </Button>
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
      </div>
    </ProtectedRoute>
  )
}

