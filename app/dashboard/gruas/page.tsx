"use client"

import { useState, useEffect, useRef } from "react"
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
import { gruasApi, type GruaBackend } from "@/lib/api-gruas"
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
      velocidade_elevacao: '60',
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
        velocidade_elevacao: '60',
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
        velocidade_elevacao: 60,
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
        velocidade_elevacao: parseFloat(gruaFormData.velocidade_elevacao) || 0,
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
        velocidade_elevacao: parseFloat(gruaFormData.velocidade_elevacao) || 0,
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
          // Nome da obra deve vir da API de gruas
          const obraNome = grua.currentObraName || 'Sem obra'
          
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
                  {grua.currentObraId && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span>Obra: {obraNome}</span>
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
                        Especificações Técnicas
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
                <Select
                  value={gruaFormData.tipo}
                  onValueChange={handleTipoChange}
                  required
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
                  type="number"
                  step="0.01"
                  min="0"
                  value={gruaFormData.velocidade_elevacao}
                  onChange={handleVelocidadeElevacaoChange}
                  placeholder="Ex: 60.00"
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

            {/* Campos Adicionais */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Informações Adicionais</h3>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="create-altura_trabalho">Altura de Trabalho</Label>
                  <Input
                    id="create-altura_trabalho"
                    value={gruaFormData.altura_trabalho}
                    onChange={handleAlturaTrabalhoChange}
                    placeholder="Ex: 80 metros"
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
                  <Label htmlFor="create-horas_operacao">Horas de Operação</Label>
                  <Input
                    id="create-horas_operacao"
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
                  <Label htmlFor="create-valor_locacao">Valor de Locação (R$)</Label>
                  <Input
                    id="create-valor_locacao"
                    type="number"
                    step="0.01"
                    min="0"
                    value={gruaFormData.valor_locacao}
                    onChange={handleValorLocacaoChange}
                    placeholder="Ex: 5000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="create-valor_real">Valor Real (R$)</Label>
                  <Input
                    id="create-valor_real"
                    type="number"
                    step="0.01"
                    min="0"
                    value={gruaFormData.valor_real}
                    onChange={handleValorRealChange}
                    placeholder="Ex: 100000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="create-valor_operacao">Valor de Operação (R$)</Label>
                  <Input
                    id="create-valor_operacao"
                    type="number"
                    step="0.01"
                    min="0"
                    value={gruaFormData.valor_operacao}
                    onChange={handleValorOperacaoChange}
                    placeholder="Ex: 2000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="create-valor_sinaleiro">Valor de Sinaleiro (R$)</Label>
                  <Input
                    id="create-valor_sinaleiro"
                    type="number"
                    step="0.01"
                    min="0"
                    value={gruaFormData.valor_sinaleiro}
                    onChange={handleValorSinaleiroChange}
                    placeholder="Ex: 1500.00"
                  />
                </div>
                <div>
                  <Label htmlFor="create-valor_manutencao">Valor de Manutenção (R$)</Label>
                  <Input
                    id="create-valor_manutencao"
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
                  <Label htmlFor="create-ultima_manutencao">Última Manutenção</Label>
                  <Input
                    id="create-ultima_manutencao"
                    type="date"
                    value={gruaFormData.ultima_manutencao}
                    onChange={handleUltimaManutencaoChange}
                  />
                </div>
                <div>
                  <Label htmlFor="create-proxima_manutencao">Próxima Manutenção</Label>
                  <Input
                    id="create-proxima_manutencao"
                    type="date"
                    value={gruaFormData.proxima_manutencao}
                    onChange={handleProximaManutencaoChange}
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
                  type="number"
                  step="0.01"
                  min="0"
                  value={gruaFormData.velocidade_elevacao}
                  onChange={handleVelocidadeElevacaoChange}
                  placeholder="Ex: 60.00"
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
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Detalhes da Grua
            </DialogTitle>
          </DialogHeader>
          
          {gruaToView && (() => {
            const grua = gruaToView as any
            
            return (
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
                      <p className="text-base">{formatValue(gruaToView.model || grua.modelo)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Fabricante</Label>
                      <p className="text-base">{formatValue(gruaToView.fabricante)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Capacidade</Label>
                      <p className="text-base">{formatValue(gruaToView.capacity || grua.capacidade)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Capacidade na Ponta</Label>
                      <p className="text-base">{formatValue(grua.capacidade_ponta || grua.capacidadePonta)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Ano</Label>
                      <p className="text-base">{formatValue(grua.ano)}</p>
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
                      <p className="text-base">{formatValue(gruaToView.tipo)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Localização</Label>
                      <p className="text-base">{formatValue(grua.localizacao)}</p>
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
                
                {/* Especificações Técnicas */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Especificações Técnicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Lança</Label>
                      <p className="text-base">{formatValue(grua.lanca)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Altura Final (m)</Label>
                      <p className="text-base">{formatValue(grua.altura_final)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Altura de Trabalho</Label>
                      <p className="text-base">{formatValue(grua.altura_trabalho || grua.alturaTrabalho)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Tipo de Base</Label>
                      <p className="text-base">{formatValue(grua.tipo_base)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Capacidade 2 Cabos (mínima)</Label>
                      <p className="text-base">{formatValue(grua.capacidade_1_cabo)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Capacidade 4 Cabos (máxima)</Label>
                      <p className="text-base">{formatValue(grua.capacidade_2_cabos)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Potência Instalada</Label>
                      <p className="text-base">{formatValue(grua.potencia_instalada)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Voltagem</Label>
                      <p className="text-base">{formatValue(grua.voltagem)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Velocidade de Rotação</Label>
                      <p className="text-base">{formatValue(grua.velocidade_rotacao)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Velocidade de Elevação</Label>
                      <p className="text-base">{formatValue(grua.velocidade_elevacao)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Horas de Operação</Label>
                      <p className="text-base">{formatValue(grua.horas_operacao || grua.horasOperacao)}</p>
                    </div>
                  </div>
                </div>
              
                {/* Informações Financeiras */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Informações Financeiras</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Valor de Locação</Label>
                      <p className="text-base">
                        {formatCurrency(grua.valor_locacao || grua.valorLocacao)}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Valor Real</Label>
                      <p className="text-base">
                        {formatCurrency(grua.valor_real)}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Valor de Operação</Label>
                      <p className="text-base">
                        {formatCurrency(grua.valor_operacao || grua.valorOperacao)}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Valor de Sinaleiro</Label>
                      <p className="text-base">
                        {formatCurrency(grua.valor_sinaleiro || grua.valorSinaleiro)}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Valor de Manutenção</Label>
                      <p className="text-base">
                        {formatCurrency(grua.valor_manutencao || grua.valorManutencao)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Informações de Manutenção */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Manutenção</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Última Manutenção</Label>
                      <p className="text-base">
                        {grua.ultima_manutencao || grua.ultimaManutencao
                          ? new Date(grua.ultima_manutencao || grua.ultimaManutencao).toLocaleDateString('pt-BR')
                          : 'Não informado'}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Próxima Manutenção</Label>
                      <p className="text-base">
                        {grua.proxima_manutencao || grua.proximaManutencao
                          ? new Date(grua.proxima_manutencao || grua.proximaManutencao).toLocaleDateString('pt-BR')
                          : 'Não informado'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Observações */}
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-gray-600">Observações</Label>
                  <p className="text-base mt-1 p-3 bg-gray-50 rounded-md">
                    {gruaToView.observacoes || grua.observacoes || 'Nenhuma observação registrada'}
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
                  
                  {gruaToView.currentObraId && gruaToView.currentObraName && (
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
            )
          })()}
        </DialogContent>
      </Dialog>
      </div>
    </ProtectedRoute>
  )
}

