"use client"

import { useState, useEffect, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Building2, 
  ArrowLeft,
  Calendar, 
  Users, 
  DollarSign,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Eye,
  BookOpen,
  FileSignature,
  ExternalLink,
  Upload,
  Download,
  FileText,
  Send,
  RefreshCw,
  Search,
  Printer,
  ChevronDown,
  ChevronRight,
  Edit,
  Folder,
  File,
  Trash2,
  Paperclip,
  X
} from "lucide-react"
import { mockObras, mockGruas, getGruasByObra, getCustosByObra, getHistoricoByGrua, getDocumentosByObra, mockUsers, getCustosMensaisByObra, getCustosMensaisByObraAndMes, getMesesDisponiveis, criarCustosParaNovoMes, CustoMensal, Obra } from "@/lib/mock-data"
import { custosMensaisApi, CustoMensal as CustoMensalApi, CustoMensalCreate, formatarMes, formatarValor, formatarQuantidade } from "@/lib/api-custos-mensais"
import { livroGruaApi, EntradaLivroGrua, EntradaLivroGruaCompleta, FiltrosLivroGrua } from "@/lib/api-livro-grua"
import { obrasDocumentosApi, DocumentoObra, DocumentoCreate } from "@/lib/api-obras-documentos"
import { obrasArquivosApi, ArquivoObra, ArquivoCreate } from "@/lib/api-obras-arquivos"
import LivroGruaForm from "@/components/livro-grua-form"
import LivroGruaList from "@/components/livro-grua-list"
import { Progress } from "@/components/ui/progress"
import { useParams } from "next/navigation"
import { obrasApi, converterObraBackendParaFrontend, ObraBackend, ensureAuthenticated } from "@/lib/api-obras"
import { PageLoader, CardLoader, InlineLoader } from "@/components/ui/loader"
import { AlertCircle } from "lucide-react"
import GruaSearch from "@/components/grua-search"
import { gruasApi, converterGruaBackendParaFrontend } from "@/lib/api-gruas"
import { obraGruasApi } from "@/lib/api-obra-gruas"
import { useObraStore, useObraStoreDebug, debugCustosMensais } from "@/lib/obra-store"
import { ObraStoreDebug } from "@/components/obra-store-debug"

function ObraDetailsPageContent() {
  const { toast } = useToast()
  const params = useParams()
  const obraId = params.id as string
  
  // Usar store de obra com debug
  const {
    obra,
    loading,
    error,
    custosMensais,
    loadingCustos,
    errorCustos,
    carregarObra,
    carregarCustosMensais,
    lastUpdated,
    lastCustosUpdated
  } = useObraStoreDebug()
  
  // Estados locais para dados não armazenados no store
  const [documentos, setDocumentos] = useState<any[]>([])
  const [arquivos, setArquivos] = useState<any[]>([])
  const [loadingDocumentos, setLoadingDocumentos] = useState(false)
  const [loadingArquivos, setLoadingArquivos] = useState(false)
  const [errorDocumentos, setErrorDocumentos] = useState<string | null>(null)
  const [errorArquivos, setErrorArquivos] = useState<string | null>(null)
  
  // Funções para carregar documentos e arquivos
  const carregarDocumentos = async () => {
    if (!obraId) return
    
    setLoadingDocumentos(true)
    setErrorDocumentos(null)
    
    try {
      const response = await obrasDocumentosApi.listarPorObra(parseInt(obraId))
      if (response.success && response.data) {
        setDocumentos(Array.isArray(response.data) ? response.data : [response.data])
      } else {
        setErrorDocumentos('Erro ao carregar documentos')
      }
    } catch (error) {
      setErrorDocumentos('Erro ao carregar documentos')
    } finally {
      setLoadingDocumentos(false)
    }
  }
  
  const carregarArquivos = async () => {
    if (!obraId) return
    
    setLoadingArquivos(true)
    setErrorArquivos(null)
    
    try {
      const response = await obrasArquivosApi.listarPorObra(parseInt(obraId))
      if (response.success && response.data) {
        setArquivos(Array.isArray(response.data) ? response.data : [response.data])
      } else {
        setErrorArquivos('Erro ao carregar arquivos')
      }
    } catch (error) {
      setErrorArquivos('Erro ao carregar arquivos')
    } finally {
      setLoadingArquivos(false)
    }
  }
  
  // Estados locais que não estão no store
  const [gruasReais, setGruasReais] = useState<any[]>([])
  const [loadingGruas, setLoadingGruas] = useState(false)
  
  // Estados para modal de adicionar grua
  const [isAdicionarGruaOpen, setIsAdicionarGruaOpen] = useState(false)
  const [gruasSelecionadas, setGruasSelecionadas] = useState<any[]>([])
  const [novaGruaData, setNovaGruaData] = useState({
    dataInicioLocacao: '',
    dataFimLocacao: '',
    observacoes: ''
  })
  
  // Estados para documentos e arquivos - agora no store
  
  // Estados para livro da grua
  const [isEditarEntradaOpen, setIsEditarEntradaOpen] = useState(false)
  const [entradaSelecionada, setEntradaSelecionada] = useState<EntradaLivroGruaCompleta | null>(null)
  
  // Estados para filtros e nova entrada
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGrua, setSelectedGrua] = useState("all")
  const [selectedTipo, setSelectedTipo] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isNovaEntradaOpen, setIsNovaEntradaOpen] = useState(false)
  const [isVisualizarEntradaOpen, setIsVisualizarEntradaOpen] = useState(false)
  const [isNovoArquivoOpen, setIsNovoArquivoOpen] = useState(false)
  const [arquivosAdicionais, setArquivosAdicionais] = useState<any[]>([])
  const [novoArquivoData, setNovoArquivoData] = useState({
    nome: '',
    descricao: '',
    categoria: 'geral',
    arquivo: null as File | null
  })
  const [isNovoItemOpen, setIsNovoItemOpen] = useState(false)
  const [isNovoAditivoOpen, setIsNovoAditivoOpen] = useState(false)
  const [itensContrato, setItensContrato] = useState<any[]>([])
  const [aditivos, setAditivos] = useState<any[]>([])
  const [novoItemData, setNovoItemData] = useState({
    item: '',
    descricao: '',
    unidade: 'mês',
    quantidadeOrcamento: 0,
    valorUnitario: 0,
    quantidadeAnterior: 0,
    valorAnterior: 0,
    quantidadePeriodo: 0,
    valorPeriodo: 0
  })
  
  // Estados para custos mensais - agora no store
  const [mesSelecionado, setMesSelecionado] = useState('')
  const [isNovoMesOpen, setIsNovoMesOpen] = useState(false)
  const [novoMesData, setNovoMesData] = useState({
    mes: ''
  })
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([])
  const [isNovoCustoOpen, setIsNovoCustoOpen] = useState(false)
  const [isEditandoCusto, setIsEditandoCusto] = useState(false)
  const [custoSelecionado, setCustoSelecionado] = useState<CustoMensalApi | null>(null)
  const [novoCustoData, setNovoCustoData] = useState({
    item: '',
    descricao: '',
    unidade: 'mês',
    quantidade_orcamento: 0,
    valor_unitario: 0,
    quantidade_realizada: 0,
    quantidade_acumulada: 0,
    valor_acumulado: 0,
    tipo: 'contrato' as 'contrato' | 'aditivo'
  })
  const [isCustosIniciaisOpen, setIsCustosIniciaisOpen] = useState(false)
  const [custosIniciaisData, setCustosIniciaisData] = useState({
    mes: '',
    custos: [{
      item: '',
      descricao: '',
      unidade: 'mês',
      quantidade_orcamento: 0,
      valor_unitario: 0,
      tipo: 'contrato' as 'contrato' | 'aditivo'
    }]
  })
  const [novaEntradaData, setNovaEntradaData] = useState({
    gruaId: '',
    funcionarioId: '',
    data: new Date().toISOString().split('T')[0],
    tipo: 'checklist',
    status: 'ok',
    descricao: '',
    responsavelResolucao: '',
    observacoes: ''
  })
  
  // Estas variáveis serão definidas dentro do return principal
  
  // Função para abrir modal de nova entrada
  const handleNovaEntrada = () => {
    setEntradaSelecionada(null)
    setIsNovaEntradaOpen(true)
  }

  const handleVisualizarEntrada = (entrada: any) => {
    setEntradaSelecionada(entrada)
    setIsVisualizarEntradaOpen(true)
  }

  const handleExportarEntradas = async () => {
    if (!gruasReais.length) return
    
    try {
      // Exportar para cada grua vinculada
      for (const grua of gruasReais) {
        await livroGruaApi.baixarCSV(grua.id.toString())
      }
      
      toast({
        title: "Informação",
        description: "Arquivos CSV baixados com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      console.error('Erro ao exportar entradas:', error)
      toast({
        title: "Informação",
        description: "Erro ao exportar entradas",
        variant: "default"
      })
    }
  }

  const handleImprimirEntradas = () => {
    window.print()
  }

  const handleNovoArquivo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!obra) return
    if (!novoArquivoData.arquivo) {
      toast({
        title: "Informação",
        description: "Por favor, selecione um arquivo",
        variant: "default"
      })
      return
    }

    try {
      const dadosArquivo: ArquivoCreate = {
        obra_id: parseInt(obra.id),
        nome_original: novoArquivoData.arquivo.name,
        descricao: novoArquivoData.descricao,
        categoria: novoArquivoData.categoria as any,
        arquivo: novoArquivoData.arquivo
      }

      await obrasArquivosApi.upload(dadosArquivo)
      await carregarArquivos()
      
      setNovoArquivoData({
        nome: '',
        descricao: '',
        categoria: 'geral',
        arquivo: null
      })
      setIsNovoArquivoOpen(false)
      toast({
        title: "Informação",
        description: "Arquivo adicionado com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      console.error('Erro ao adicionar arquivo:', error)
      toast({
        title: "Informação",
        description: "Erro ao adicionar arquivo: ${error.message}",
        variant: "default"
      })
    }
  }

  const handleRemoverArquivo = async (arquivoId: number) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) return

    try {
      await obrasArquivosApi.excluir(arquivoId)
      await carregarArquivos()
      toast({
        title: "Informação",
        description: "Arquivo excluído com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      console.error('Erro ao excluir arquivo:', error)
      toast({
        title: "Informação",
        description: "Erro ao excluir arquivo: ${error.message}",
        variant: "default"
      })
    }
  }

  const formatarTamanhoArquivo = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleNovoItem = (e: React.FormEvent) => {
    e.preventDefault()
    
    const novoItem = {
      id: Date.now().toString(),
      item: novoItemData.item,
      descricao: novoItemData.descricao,
      unidade: novoItemData.unidade,
      quantidadeOrcamento: novoItemData.quantidadeOrcamento,
      valorUnitario: novoItemData.valorUnitario,
      totalOrcamento: novoItemData.quantidadeOrcamento * novoItemData.valorUnitario,
      quantidadeAnterior: novoItemData.quantidadeAnterior,
      valorAnterior: novoItemData.valorAnterior,
      quantidadePeriodo: novoItemData.quantidadePeriodo,
      valorPeriodo: novoItemData.valorPeriodo,
      quantidadeAcumulada: novoItemData.quantidadeAnterior + novoItemData.quantidadePeriodo,
      valorAcumulado: novoItemData.valorAnterior + novoItemData.valorPeriodo,
      quantidadeSaldo: novoItemData.quantidadeOrcamento - (novoItemData.quantidadeAnterior + novoItemData.quantidadePeriodo),
      valorSaldo: (novoItemData.quantidadeOrcamento * novoItemData.valorUnitario) - (novoItemData.valorAnterior + novoItemData.valorPeriodo)
    }

    setItensContrato([...itensContrato, novoItem])
    setNovoItemData({
      item: '',
      descricao: '',
      unidade: 'mês',
      quantidadeOrcamento: 0,
      valorUnitario: 0,
      quantidadeAnterior: 0,
      valorAnterior: 0,
      quantidadePeriodo: 0,
      valorPeriodo: 0
    })
    setIsNovoItemOpen(false)
    toast({
        title: "Informação",
        description: "Item adicionado com sucesso!",
        variant: "default"
      })
  }

  const handleNovoAditivo = (e: React.FormEvent) => {
    e.preventDefault()
    
    const novoAditivo = {
      id: Date.now().toString(),
      item: novoItemData.item,
      descricao: novoItemData.descricao,
      unidade: novoItemData.unidade,
      quantidadeOrcamento: novoItemData.quantidadeOrcamento,
      valorUnitario: novoItemData.valorUnitario,
      totalOrcamento: novoItemData.quantidadeOrcamento * novoItemData.valorUnitario,
      quantidadeAnterior: novoItemData.quantidadeAnterior,
      valorAnterior: novoItemData.valorAnterior,
      quantidadePeriodo: novoItemData.quantidadePeriodo,
      valorPeriodo: novoItemData.valorPeriodo,
      quantidadeAcumulada: novoItemData.quantidadeAnterior + novoItemData.quantidadePeriodo,
      valorAcumulado: novoItemData.valorAnterior + novoItemData.valorPeriodo,
      quantidadeSaldo: novoItemData.quantidadeOrcamento - (novoItemData.quantidadeAnterior + novoItemData.quantidadePeriodo),
      valorSaldo: (novoItemData.quantidadeOrcamento * novoItemData.valorUnitario) - (novoItemData.valorAnterior + novoItemData.valorPeriodo)
    }

    setAditivos([...aditivos, novoAditivo])
    setNovoItemData({
      item: '',
      descricao: '',
      unidade: 'mês',
      quantidadeOrcamento: 0,
      valorUnitario: 0,
      quantidadeAnterior: 0,
      valorAnterior: 0,
      quantidadePeriodo: 0,
      valorPeriodo: 0
    })
    setIsNovoAditivoOpen(false)
    toast({
        title: "Informação",
        description: "Aditivo adicionado com sucesso!",
        variant: "default"
      })
  }

  // Funções para custos mensais
  const gerarMesesDisponiveis = () => {
    if (!obra) return []
    
    const mesesExistentes = getMesesDisponiveis(obra.id)
    const mesesDisponiveis: string[] = []
    
    // Gerar próximos 12 meses a partir do mês atual
    const hoje = new Date()
    for (let i = 0; i < 12; i++) {
      const mes = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
      const mesStr = mes.toISOString().slice(0, 7)
      
      // Só adicionar se não existir ainda
      if (!mesesExistentes.includes(mesStr)) {
        mesesDisponiveis.push(mesStr)
      }
    }
    
    return mesesDisponiveis
  }

  // Função para extrair meses dos dados reais da API
  const getMesesDisponiveisDaAPI = () => {
    if (!custosMensais || custosMensais.length === 0) return []
    
    const meses = [...new Set(custosMensais.map(custo => custo.mes))]
    return meses.sort()
  }

  // Custos filtrados baseados no mês selecionado
  const custosFiltrados = useMemo(() => {
    if (!custosMensais || custosMensais.length === 0) return []
    
    if (mesSelecionado === 'todos' || !mesSelecionado) {
      return custosMensais
    }
    
    return custosMensais.filter(custo => custo.mes === mesSelecionado)
  }, [custosMensais, mesSelecionado])

  const handleNovoMes = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!obra) return
    if (!novoMesData.mes) {
      toast({
        title: "Informação",
        description: "Selecione um mês válido!",
        variant: "default"
      })
      return
    }
    
    try {
      // Buscar o último mês com custos para replicar
      const mesesExistentes = await custosMensaisApi.obterMesesDisponiveis(parseInt(obra.id))
      if (mesesExistentes.length === 0) {
        toast({
        title: "Informação",
        description: "Não há custos anteriores para replicar. Crie primeiro os custos iniciais da obra.",
        variant: "default"
      })
        return
      }
      
      const ultimoMes = mesesExistentes[mesesExistentes.length - 1]
      
      await custosMensaisApi.replicar({
        obra_id: parseInt(obra.id),
        mes_origem: ultimoMes,
        mes_destino: novoMesData.mes
      })
      
      await carregarCustosMensais(obraId)
      setMesSelecionado(novoMesData.mes)
      setNovoMesData({ mes: '' })
      setIsNovoMesOpen(false)
      toast({
        title: "Informação",
        description: "Custos criados para ${formatarMes(novoMesData.mes)} com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      console.error('Erro ao criar novo mês:', error)
      toast({
        title: "Informação",
        description: "Erro ao criar novo mês: ${error.message}",
        variant: "default"
      })
    }
  }

  const handleAbrirNovoMes = async () => {
    if (!obra) return
    
    try {
      const mesesExistentes = await custosMensaisApi.obterMesesDisponiveis(parseInt(obra.id))
      const meses = custosMensaisApi.gerarProximosMeses(mesesExistentes)
      setMesesDisponiveis(meses)
      setIsNovoMesOpen(true)
    } catch (error: any) {
      console.error('Erro ao obter meses disponíveis:', error)
      // Fallback para função mockada
      const meses = gerarMesesDisponiveis()
      setMesesDisponiveis(meses)
      setIsNovoMesOpen(true)
    }
  }

  const handleAtualizarQuantidade = async (custoId: number, novaQuantidade: number) => {
    try {
      await custosMensaisApi.atualizarQuantidadeRealizada(custoId, novaQuantidade)
      
      // Recarregar custos no store
      await carregarCustosMensais(obraId)
      
      // Refresh da página para garantir que todos os dados sejam atualizados
      window.location.reload()
      
    } catch (error: any) {
      console.error('Erro ao atualizar quantidade:', error)
      toast({
        title: "Erro",
        description: `Erro ao atualizar quantidade: ${error.message}`,
        variant: "destructive"
      })
    }
  }

  const handleNovoCusto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!obra) return

    try {
      const dadosCusto: CustoMensalCreate = {
        obra_id: parseInt(obra.id),
        item: novoCustoData.item,
        descricao: novoCustoData.descricao,
        unidade: novoCustoData.unidade,
        quantidade_orcamento: novoCustoData.quantidade_orcamento,
        valor_unitario: novoCustoData.valor_unitario,
        mes: mesSelecionado || new Date().toISOString().slice(0, 7),
        quantidade_realizada: novoCustoData.quantidade_realizada,
        quantidade_acumulada: novoCustoData.quantidade_acumulada,
        valor_acumulado: novoCustoData.valor_acumulado,
        tipo: novoCustoData.tipo
      }

      await custosMensaisApi.criar(dadosCusto)
      await carregarCustosMensais(obraId)
      
      // Refresh da página para garantir que todos os dados sejam atualizados
      window.location.reload()
      
      // Resetar formulário
      setNovoCustoData({
        item: '',
        descricao: '',
        unidade: 'mês',
        quantidade_orcamento: 0,
        valor_unitario: 0,
        quantidade_realizada: 0,
        quantidade_acumulada: 0,
        valor_acumulado: 0,
        tipo: 'contrato'
      })
      setIsNovoCustoOpen(false)
      toast({
        title: "Informação",
        description: "Custo criado com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      console.error('Erro ao criar custo:', error)
      toast({
        title: "Informação",
        description: "Erro ao criar custo: ${error.message}",
        variant: "default"
      })
    }
  }

  const handleEditarCusto = (custo: CustoMensalApi) => {
    setCustoSelecionado(custo)
    setNovoCustoData({
      item: custo.item,
      descricao: custo.descricao,
      unidade: custo.unidade,
      quantidade_orcamento: custo.quantidade_orcamento,
      valor_unitario: custo.valor_unitario,
      quantidade_realizada: custo.quantidade_realizada,
      quantidade_acumulada: custo.quantidade_acumulada,
      valor_acumulado: custo.valor_acumulado,
      tipo: custo.tipo
    })
    setIsEditandoCusto(true)
    setIsNovoCustoOpen(true)
  }

  const handleAtualizarCusto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!custoSelecionado) return

    try {
      await custosMensaisApi.atualizar(custoSelecionado.id, novoCustoData)
      await carregarCustosMensais(obraId)
      
      // Refresh da página para garantir que todos os dados sejam atualizados
      window.location.reload()
      
      // Resetar formulário
      setCustoSelecionado(null)
      setNovoCustoData({
        item: '',
        descricao: '',
        unidade: 'mês',
        quantidade_orcamento: 0,
        valor_unitario: 0,
        quantidade_realizada: 0,
        quantidade_acumulada: 0,
        valor_acumulado: 0,
        tipo: 'contrato'
      })
      setIsEditandoCusto(false)
      setIsNovoCustoOpen(false)
      toast({
        title: "Informação",
        description: "Custo atualizado com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      console.error('Erro ao atualizar custo:', error)
      toast({
        title: "Informação",
        description: "Erro ao atualizar custo: ${error.message}",
        variant: "default"
      })
    }
  }

  const handleExcluirCusto = async (custoId: number) => {
    if (!confirm('Tem certeza que deseja excluir este custo?')) return

    try {
      await custosMensaisApi.excluir(custoId)
      await carregarCustosMensais(obraId)
      
      // Refresh da página para garantir que todos os dados sejam atualizados
      window.location.reload()
      
      toast({
        title: "Informação",
        description: "Custo excluído com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      console.error('Erro ao excluir custo:', error)
      toast({
        title: "Informação",
        description: "Erro ao excluir custo: ${error.message}",
        variant: "default"
      })
    }
  }

  // Funções para custos iniciais
  const handleAbrirCustosIniciais = () => {
    const mesAtual = new Date().toISOString().slice(0, 7) // YYYY-MM
    setCustosIniciaisData({
      mes: mesAtual,
      custos: [{
        item: '',
        descricao: '',
        unidade: 'mês',
        quantidade_orcamento: 0,
        valor_unitario: 0,
        tipo: 'contrato'
      }]
    })
    setIsCustosIniciaisOpen(true)
  }

  const handleAdicionarCustoInicial = () => {
    setCustosIniciaisData(prev => ({
      ...prev,
      custos: [...prev.custos, {
        item: '',
        descricao: '',
        unidade: 'mês',
        quantidade_orcamento: 0,
        valor_unitario: 0,
        tipo: 'contrato'
      }]
    }))
  }

  const handleRemoverCustoInicial = (index: number) => {
    if (custosIniciaisData.custos.length > 1) {
      setCustosIniciaisData(prev => ({
        ...prev,
        custos: prev.custos.filter((_, i) => i !== index)
      }))
    }
  }

  const handleAtualizarCustoInicial = (index: number, campo: string, valor: any) => {
    setCustosIniciaisData(prev => ({
      ...prev,
      custos: prev.custos.map((custo, i) => 
        i === index ? { ...custo, [campo]: valor } : custo
      )
    }))
  }

  const handleCriarCustosIniciais = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!obra) return

    try {
      // Validar dados
      const custosValidos = custosIniciaisData.custos.filter(custo => 
        custo.item && custo.descricao && custo.quantidade_orcamento > 0 && custo.valor_unitario > 0
      )

      if (custosValidos.length === 0) {
        toast({
        title: "Informação",
        description: "Adicione pelo menos um custo válido!",
        variant: "default"
      })
        return
      }

      // Criar cada custo
      for (const custo of custosValidos) {
        const dadosCusto: CustoMensalCreate = {
          obra_id: parseInt(obra.id),
          item: custo.item,
          descricao: custo.descricao,
          unidade: custo.unidade,
          quantidade_orcamento: custo.quantidade_orcamento,
          valor_unitario: custo.valor_unitario,
          mes: custosIniciaisData.mes,
          quantidade_realizada: 0,
          quantidade_acumulada: 0,
          valor_acumulado: 0,
          tipo: custo.tipo
        }

        await custosMensaisApi.criar(dadosCusto)
      }

      await carregarCustosMensais(obraId)
      setMesSelecionado(custosIniciaisData.mes)
      setIsCustosIniciaisOpen(false)
      toast({
        title: "Informação",
        description: "${custosValidos.length} custos iniciais criados com sucesso!",
        variant: "default"
      })
    } catch (error: any) {
      console.error('Erro ao criar custos iniciais:', error)
      toast({
        title: "Informação",
        description: "Erro ao criar custos iniciais: ${error.message}",
        variant: "default"
      })
    }
  }

  // Funções para adicionar grua
  const handleAdicionarGrua = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (gruasSelecionadas.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma grua para adicionar",
        variant: "destructive"
      })
      return
    }

    try {
      setLoadingGruas(true)
      
      // Vincular cada grua selecionada à obra
      const promises = gruasSelecionadas.map(async (grua) => {
        const payload = {
          obra_id: parseInt(obraId),
          grua_id: grua.id,
          data_instalacao: novaGruaData.dataInicioLocacao || new Date().toISOString().split('T')[0],
          observacoes: novaGruaData.observacoes || `Valor locação: R$ ${grua.valorLocacao || 0}, Taxa mensal: R$ ${grua.taxaMensal || 0}`
        }
        
        console.log('Enviando payload para API:', payload)
        return obraGruasApi.adicionarGruaObra(payload)
      })
      
      const results = await Promise.all(promises)
      
      // Verificar se todas as operações foram bem-sucedidas
      const sucessos = results.filter(result => result.success).length
      const falhas = results.length - sucessos
      
      if (sucessos > 0) {
        toast({
          title: "Sucesso",
          description: `${sucessos} grua(s) adicionada(s) à obra com sucesso!${falhas > 0 ? ` (${falhas} falharam)` : ''}`,
        })
      }
      
      if (falhas > 0) {
        toast({
          title: "Atenção",
          description: `${falhas} grua(s) não puderam ser adicionadas. Verifique se já estão vinculadas à obra.`,
          variant: "destructive"
        })
      }
      
      // Fechar modal e limpar dados
      setIsAdicionarGruaOpen(false)
      setGruasSelecionadas([])
      setNovaGruaData({
        dataInicioLocacao: '',
        dataFimLocacao: '',
        observacoes: ''
      })
      
      // Recarregar gruas vinculadas
      await carregarGruasVinculadas()
      
    } catch (error) {
      console.error('Erro ao adicionar gruas:', error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar gruas à obra",
        variant: "destructive"
      })
    } finally {
      setLoadingGruas(false)
    }
  }

  const handleCancelarAdicionarGrua = () => {
    setIsAdicionarGruaOpen(false)
    setGruasSelecionadas([])
    setNovaGruaData({
      dataInicioLocacao: '',
      dataFimLocacao: '',
      observacoes: ''
    })
  }

  const handleGruaSelect = (grua: any) => {
    if (!gruasSelecionadas.find(g => g.id === grua.id)) {
      setGruasSelecionadas([...gruasSelecionadas, {
        ...grua,
        valorLocacao: 0,
        taxaMensal: 0
      }])
    }
  }

  const handleRemoverGrua = (gruaId: string) => {
    setGruasSelecionadas(gruasSelecionadas.filter(g => g.id !== gruaId))
  }

  const handleAtualizarGrua = (gruaId: string, campo: string, valor: number) => {
    setGruasSelecionadas(gruasSelecionadas.map(g => 
      g.id === gruaId ? { ...g, [campo]: valor } : g
    ))
  }

  const calcularResumo = () => {
    const totalGruas = gruasSelecionadas.length
    const valorTotalLocacao = gruasSelecionadas.reduce((sum, g) => sum + (g.valorLocacao || 0), 0)
    const taxaMensalTotal = gruasSelecionadas.reduce((sum, g) => sum + (g.taxaMensal || 0), 0)
    
    return {
      totalGruas,
      valorTotalLocacao,
      taxaMensalTotal
    }
  }

  // Função carregarCustosMensais agora está no store

  const handleExportarCustos = (tipo: 'geral' | 'mes') => {
    if (!obra) return
    
    let dadosParaExportar = custosMensais
    
    if (dadosParaExportar.length === 0) {
      toast({
        title: "Informação",
        description: "Não há dados para exportar!",
        variant: "default"
      })
      return
    }

    // Cabeçalho do CSV
    const cabecalho = [
      'Item',
      'Descrição',
      'Unidade',
      'Qtd Orçamento',
      'Valor Unitário',
      'Total Orçamento',
      'Qtd Realizada',
      'Valor Realizado',
      'Qtd Acumulada',
      'Valor Acumulado',
      'Qtd Saldo',
      'Valor Saldo',
      'Mês',
      'Tipo'
    ]

    // Dados do CSV
    const linhas = dadosParaExportar.map(custo => [
      custo.item,
      custo.descricao,
      custo.unidade,
      formatarQuantidade(custo.quantidade_orcamento),
      formatarValor(custo.valor_unitario),
      formatarValor(custo.total_orcamento),
      formatarQuantidade(custo.quantidade_realizada),
      formatarValor(custo.valor_realizado),
      formatarQuantidade(custo.quantidade_acumulada),
      formatarValor(custo.valor_acumulado),
      formatarQuantidade(custo.quantidade_saldo),
      formatarValor(custo.valor_saldo),
      formatarMes(custo.mes),
      custo.tipo
    ])

    // Criar CSV
    const csvContent = [cabecalho, ...linhas]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    
    const nomeArquivo = tipo === 'geral' 
      ? `custos_geral_${obra.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
      : `custos_${mesSelecionado}_${obra.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    
    link.setAttribute('download', nomeArquivo)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
        title: "Informação",
        description: "Arquivo ${nomeArquivo} baixado com sucesso!",
        variant: "default"
      })
  }

  // Função carregarObra agora está no store

  // Carregar gruas vinculadas à obra
  const carregarGruasVinculadas = async () => {
    if (!obra) return
    
    try {
      setLoadingGruas(true)
      
      console.log('Buscando gruas para obra ID:', obra.id)
      
      // Usar o endpoint de obras que já inclui os relacionamentos
      const response = await obrasApi.obterObra(parseInt(obra.id))
      console.log('Resposta da API de obras:', response)
      
      if (response.success && response.data) {
        const obraData = response.data
        console.log('🔍 DEBUG - Dados completos da obra:', obraData)
        
        // Extrair gruas do relacionamento grua_obra
        const gruasVinculadas = obraData.grua_obra || []
        console.log('🔍 DEBUG - Gruas encontradas no relacionamento:', gruasVinculadas)
        console.log('🔍 DEBUG - Tipo de gruasVinculadas:', typeof gruasVinculadas, Array.isArray(gruasVinculadas))
        
        if (gruasVinculadas.length > 0) {
          // Converter dados das gruas vinculadas
          const gruasConvertidas = gruasVinculadas.map((relacao: any, index: number) => {
            console.log(`🔍 DEBUG - Processando grua ${index}:`, relacao)
            const gruaData = relacao.grua || {}
            console.log(`🔍 DEBUG - Dados da grua ${index}:`, gruaData)
            
            const gruaConvertida = {
              id: relacao.grua_id,
              name: gruaData.name || `${gruaData.fabricante || 'Grua'} ${gruaData.modelo || relacao.grua_id}`,
              modelo: gruaData.modelo || 'Modelo não informado',
              fabricante: gruaData.fabricante || 'Fabricante não informado',
              tipo: gruaData.tipo || 'Tipo não informado',
              capacidade: gruaData.capacidade || 'Capacidade não informada',
              status: relacao.status || 'Ativa',
              data_instalacao: relacao.data_inicio_locacao,
              data_inicio_locacao: relacao.data_inicio_locacao,
              dataFimLocacao: relacao.data_fim_locacao,
              valor_locacao_mensal: relacao.valor_locacao_mensal || 0,
              valorLocacaoMensal: relacao.valor_locacao_mensal || 0,
              observacoes: relacao.observacoes,
              // Campos adicionais para compatibilidade
              status_legacy: relacao.status === 'Ativa' ? 'Ativa' : relacao.status,
              // Dados da grua para exibição
              grua: {
                id: relacao.grua_id,
                modelo: gruaData.modelo,
                fabricante: gruaData.fabricante,
                tipo: gruaData.tipo
              }
            }
            
            console.log(`🔍 DEBUG - Grua convertida ${index}:`, gruaConvertida)
            return gruaConvertida
          })
          
          setGruasReais(gruasConvertidas)
          console.log('✅ Gruas carregadas e convertidas:', gruasConvertidas)
        } else {
          console.warn('⚠️ Nenhuma grua encontrada no relacionamento')
          setGruasReais([])
        }
      } else {
        console.warn('❌ Erro ao carregar obra ou obra não encontrada')
        console.log('🔍 DEBUG - Response:', response)
        setGruasReais([])
      }
    } catch (err) {
      console.error('Erro ao carregar gruas vinculadas:', err)
      setGruasReais([])
    } finally {
      setLoadingGruas(false)
    }
  }

  // Carregar documentos da obra
  // Função movida para o store
  const carregarDocumentosLocal = async () => {
    if (!obra) return
    
    try {
      setLoadingDocumentos(true)
      const response = await obrasDocumentosApi.listarPorObra(parseInt(obra.id))
      setDocumentos(Array.isArray(response.data) ? response.data : [response.data])
    } catch (error: any) {
      console.error('Erro ao carregar documentos:', error)
      // Fallback para dados mockados
      const documentosMockados = getDocumentosByObra(obra.id)
      setDocumentos(documentosMockados.map(doc => ({
        id: parseInt(doc.id),
        obra_id: parseInt(obra.id),
        obra_nome: obra.name,
        titulo: doc.titulo,
        descricao: doc.descricao,
        arquivo_original: doc.arquivoOriginal,
        arquivo_assinado: doc.arquivo,
        caminho_arquivo: doc.arquivo,
        docu_sign_link: doc.docuSignLink,
        docu_sign_envelope_id: '',
        status: doc.status as any,
        proximo_assinante_id: undefined,
        proximo_assinante_nome: doc.proximoAssinante,
        created_by: 1,
        created_by_nome: 'Usuário',
        created_at: doc.createdAt,
        updated_at: doc.updatedAt,
        total_assinantes: doc.ordemAssinatura.length,
        assinaturas_concluidas: doc.ordemAssinatura.filter(a => a.status === 'assinado').length,
        progresso_percentual: Math.round((doc.ordemAssinatura.filter(a => a.status === 'assinado').length / doc.ordemAssinatura.length) * 100),
        assinaturas: doc.ordemAssinatura.map(ass => ({
          id: 1,
          documento_id: parseInt(doc.id),
          user_id: parseInt(ass.userId),
          ordem: ass.ordem,
          status: ass.status as any,
          docu_sign_link: ass.docuSignLink,
          docu_sign_envelope_id: '',
          data_envio: undefined,
          data_assinatura: undefined,
          arquivo_assinado: ass.arquivoAssinado,
          observacoes: '',
          email_enviado: false,
          data_email_enviado: undefined,
          created_at: doc.createdAt,
          updated_at: doc.updatedAt,
          usuario: {
            id: parseInt(ass.userId),
            nome: ass.userName,
            email: '',
            role: ass.role
          }
        })),
        historico: doc.historicoAssinaturas.map(h => ({
          id: 1,
          documento_id: parseInt(doc.id),
          user_id: 1,
          acao: 'criado' as any,
          data_acao: doc.createdAt,
          arquivo_gerado: '',
          observacoes: '',
          ip_address: undefined,
          user_agent: '',
          user_nome: h.userName,
          user_email: '',
          user_role: h.role
        }))
      })))
    } finally {
      setLoadingDocumentos(false)
    }
  }

  // Carregar arquivos da obra
  // Função movida para o store
  const carregarArquivosLocal = async () => {
    if (!obra) return
    
    try {
      setLoadingArquivos(true)
      const response = await obrasArquivosApi.listarPorObra(parseInt(obra.id))
      setArquivos(Array.isArray(response.data) ? response.data : [response.data])
    } catch (error: any) {
      console.error('Erro ao carregar arquivos:', error)
      setArquivos([])
    } finally {
      setLoadingArquivos(false)
    }
  }

  // Handlers para livro da grua
  const handleEditarEntrada = (entrada: EntradaLivroGruaCompleta) => {
    setEntradaSelecionada(entrada)
    setIsEditarEntradaOpen(true)
  }

  const handleSucessoEntrada = () => {
    setIsNovaEntradaOpen(false)
    setIsEditarEntradaOpen(false)
    // Recarregar a página para atualizar os dados
    window.location.reload()
  }

  // Verificar autenticação e carregar obra na inicialização
  useEffect(() => {
    const init = async () => {
      const isAuth = await ensureAuthenticated()
      if (isAuth) {
        await carregarObra(obraId)
        
        // Carregar documentos e arquivos em paralelo
        await Promise.all([
          carregarDocumentos(),
          carregarArquivos()
        ])
      }
    }
    init()
  }, [obraId])

  // Carregar gruas quando a obra for carregada
  useEffect(() => {
    if (obra) {
      carregarGruasVinculadas()
    }
  }, [obra])


  // Definir mês padrão após carregar custos
  useEffect(() => {
    if (custosMensais && custosMensais.length > 0) {
      // Obter todos os meses disponíveis e ordenar
      const mesesDisponiveis = [...new Set(custosMensais.map(custo => custo.mes))].sort()
      // Definir o último mês como padrão
      const ultimoMes = mesesDisponiveis[mesesDisponiveis.length - 1]
      setMesSelecionado(ultimoMes)
    }
  }, [custosMensais])

  // Filtro de custos agora é feito via useMemo com custosFiltrados

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Andamento': return 'bg-green-100 text-green-800'
      case 'Pausada': return 'bg-yellow-100 text-yellow-800'
      case 'Concluída': return 'bg-blue-100 text-blue-800'
      case 'Planejamento': return 'bg-gray-100 text-gray-800'
      case 'Cancelada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'assinado': return 'bg-green-100 text-green-800'
      case 'em_assinatura': return 'bg-blue-100 text-blue-800'
      case 'aguardando_assinatura': return 'bg-yellow-100 text-yellow-800'
      case 'rejeitado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSignatureStatusColor = (status: string) => {
    switch (status) {
      case 'assinado': return 'bg-green-100 text-green-800'
      case 'aguardando': return 'bg-yellow-100 text-yellow-800'
      case 'pendente': return 'bg-gray-100 text-gray-800'
      case 'rejeitado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativa': return <CheckCircle className="w-4 h-4" />
      case 'pausada': return <Clock className="w-4 h-4" />
      case 'concluida': return <AlertTriangle className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  // Cálculos memoizados para evitar re-renderizações desnecessárias
  const gastosMesPassado = useMemo(() => {
    if (!custosMensais || custosMensais.length === 0) return 0
    
    // Obter todos os meses disponíveis e ordenar
    const mesesDisponiveis = [...new Set(custosMensais.map(custo => custo.mes))].sort()
    
    if (mesesDisponiveis.length < 2) return 0 // Precisa de pelo menos 2 meses
    
    // Pegar o penúltimo mês (mês passado)
    const mesPassado = mesesDisponiveis[mesesDisponiveis.length - 2]
    
    
    const gastos = custosMensais
      .filter(custo => custo.mes === mesPassado)
      .reduce((total, custo) => {
        const valor = custo.total_orcamento || custo.valor_realizado || custo.valor || custo.valor_unitario || 0
        return total + valor
      }, 0)
    
    return gastos
  }, [custosMensais])

  const gastosMesAtual = useMemo(() => {
    if (!custosFiltrados || custosFiltrados.length === 0) return 0
    
    const gastos = custosFiltrados
      .reduce((total, custo) => {
        const valor = custo.total_orcamento || custo.valor_realizado || custo.valor || custo.valor_unitario || 0
        return total + valor
      }, 0)
    
    
    return gastos
  }, [custosFiltrados, mesSelecionado])

  // Total de todos os custos (todos os meses)
  const totalTodosCustos = useMemo(() => {
    if (!custosMensais || custosMensais.length === 0) return 0
    
    const total = custosMensais.reduce((sum, custo) => {
      const valor = custo.total_orcamento || custo.valor_realizado || custo.valor || custo.valor_unitario || 0
      return sum + valor
    }, 0)
    
    
    return total
  }, [custosMensais])

  // Tratamento de loading e erro
  if (loading) {
    return (
      <div className="space-y-6">
        <PageLoader text="Carregando detalhes da obra..." />
      </div>
    )
  }

  if (error && !obra) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Erro ao carregar obra</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => carregarObra(obraId)} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Componente de debug do store (apenas em desenvolvimento)
  const showDebug = process.env.NODE_ENV === 'development'

  if (!obra) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Obra não encontrada</h2>
            <p className="text-gray-600">A obra com ID {obraId} não foi encontrada.</p>
          </div>
        </div>
      </div>
    )
  }

  // Definir variáveis que dependem de obra
  const gruasVinculadas = gruasReais.length > 0 ? gruasReais : getGruasByObra(obra.id)
  const custos = getCustosByObra(obra.id)
  

  return (
    <div className="space-y-6">
      {/* Debug do Store (apenas em desenvolvimento) */}
      {showDebug && <ObraStoreDebug />}
      
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{obra.name}</h1>
          <p className="text-gray-600">{obra.description}</p>
        </div>
      </div>

      <Tabs defaultValue="geral" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="geral">Geral</TabsTrigger>
        <TabsTrigger value="gruas">Gruas</TabsTrigger>
        <TabsTrigger value="custos">Custos</TabsTrigger>
        <TabsTrigger value="documentos">Documentos</TabsTrigger>
        <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
        <TabsTrigger value="livro-grua">Livro da Grua</TabsTrigger>
      </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <div className="flex flex-col gap-4 w-full" style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge className={getStatusColor(obra.status)}>
                    {getStatusIcon(obra.status)}
                    <span className="ml-1 capitalize">{obra.status}</span>
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Início:</span>
                  <span className="text-sm">{new Date(obra.startDate).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fim:</span>
                  <span className="text-sm">{obra.endDate ? new Date(obra.endDate).toLocaleDateString('pt-BR') : 'Em andamento'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Responsável:</span>
                  <span className="text-sm">{obra.responsavelName}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {obra.cliente ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Nome:</span>
                      <span className="text-sm font-medium">{obra.cliente.nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">CNPJ:</span>
                      <span className="text-sm">{obra.cliente.cnpj}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm">{obra.cliente.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Telefone:</span>
                      <span className="text-sm">{obra.cliente.telefone}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-sm text-gray-500 py-4">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Informações do cliente não disponíveis</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor Total da Obra:</span>
                  <span className="text-sm font-medium text-blue-600">R$ {(obra.valorTotalObra || 0).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gastos do Mês Passado:</span>
                  <span className="text-sm font-medium text-orange-600">R$ {gastosMesPassado.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gastos do Mês:</span>
                  <span className="text-sm font-medium text-red-600">R$ {gastosMesAtual.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-semibold">Saldo Restante:</span>
                  <span className={`text-sm font-bold ${
                    (obra.orcamento || 0) - totalTodosCustos >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    R$ {((obra.orcamento || 0) - totalTodosCustos).toLocaleString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gruas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">
                  Gruas Vinculadas ({gruasVinculadas.length})
                  {loadingGruas && <InlineLoader size="sm" />}
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => setIsAdicionarGruaOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Vincular Grua
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingGruas ? (
                <CardLoader text="Carregando gruas vinculadas..." />
              ) : gruasVinculadas.length > 0 ? (
                <div className="space-y-6">
                  {gruasVinculadas.map((grua) => {
                    const historico = getHistoricoByGrua(grua.id)
                    const isGruaReal = gruasReais.some(gr => gr.id === grua.id)
                    
                    return (
                      <div key={grua.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {isGruaReal ? grua.name : grua.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {isGruaReal ? 
                                `${grua.fabricante} ${grua.modelo}` : 
                                `${grua.model} - ${grua.capacity}`
                              }
                            </p>
                            {isGruaReal && (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-gray-500">
                                  <strong>Início da Locação:</strong> {grua.data_instalacao ? new Date(grua.data_instalacao).toLocaleDateString('pt-BR') : 'Não informado'}
                                </p>
                                {grua.dataFimLocacao && (
                                  <p className="text-xs text-gray-500">
                                    <strong>Fim da Locação:</strong> {new Date(grua.dataFimLocacao).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                                {grua.valorLocacaoMensal && (
                                  <p className="text-xs text-gray-500">
                                    <strong>Valor Mensal:</strong> R$ {grua.valorLocacaoMensal.toLocaleString('pt-BR')}
                                  </p>
                                )}
                                {grua.observacoes && (
                                  <p className="text-xs text-gray-500">
                                    <strong>Observações:</strong> {grua.observacoes}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge 
                              variant={grua.status === 'em_obra' || grua.status === 'ativa' ? 'default' : 'secondary'}
                              className={grua.status === 'ativa' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {grua.status}
                            </Badge>
                            {isGruaReal && (
                              <Badge variant="outline" className="text-xs">
                                {grua.tipo || 'Tipo não informado'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Histórico da Grua */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-sm">Livro da Grua</h4>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.location.href = `/dashboard/gruas/${grua.id}/livro`}
                            >
                              <BookOpen className="w-4 h-4 mr-1" />
                              Abrir Livro
                            </Button>
                          </div>
                          {historico.length > 0 ? (
                            <div className="space-y-2">
                              {historico.slice(0, 5).map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      entry.status === 'ok' ? 'bg-green-500' : 
                                      entry.status === 'falha' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`} />
                                    <span className="text-sm">{entry.observacoes}</span>
                                    {entry.status === 'falha' && (
                                      <AlertTriangle className="w-4 h-4 text-red-500" />
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(entry.data).toLocaleDateString('pt-BR')}
                                  </div>
                                </div>
                              ))}
                              {historico.length > 5 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{historico.length - 5} entradas anteriores
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Nenhum histórico registrado</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma grua vinculada</h3>
                  <p className="text-gray-600 mb-4">Esta obra ainda não possui gruas vinculadas.</p>
                  <Button 
                    onClick={() => setIsAdicionarGruaOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Vincular Primeira Grua
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custos" className="space-y-4">
          {/* Controles de Mês */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Custos Mensais - {obra.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Selecionar mês" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os meses</SelectItem>
                      {getMesesDisponiveisDaAPI().map(mes => (
                        <SelectItem key={mes} value={mes}>
                          {new Date(mes + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportarCustos('geral')}
                    disabled={custosFiltrados.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Geral
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportarCustos('mes')}
                    disabled={custosFiltrados.length === 0 || (mesSelecionado === 'todos' || !mesSelecionado)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Mês
                  </Button>
                  <Button 
                    variant="default"
                    onClick={handleAbrirCustosIniciais}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Custos Iniciais
                  </Button>
                  <Button onClick={handleAbrirNovoMes}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Mês
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsNovoCustoOpen(true)}
                    disabled={!mesSelecionado || mesSelecionado === 'todos'}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Custo
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Resumo Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">Valor Total da Obra</Label>
                  <p className="text-lg font-bold text-blue-600">R$ {(obra.valorTotalObra || 0).toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">Gastos do Mês Passado</Label>
                  <p className="text-lg font-bold text-orange-600">
                    R$ {gastosMesPassado.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">Gastos do Mês</Label>
                  <p className="text-lg font-bold text-yellow-600">
                    R$ {gastosMesAtual.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">Saldo Restante</Label>
                  <p className={`text-lg font-bold ${
                    (obra.orcamento || 0) - totalTodosCustos >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    R$ {((obra.orcamento || 0) - totalTodosCustos).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custos Mensais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Custos Mensais {mesSelecionado && mesSelecionado !== 'todos' && `- ${new Date(mesSelecionado + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}
              </CardTitle>
              <CardDescription>
                {custosFiltrados.length > 0 ? `${custosFiltrados.length} itens encontrados` : 'Nenhum custo encontrado para este período'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCustos ? (
                <CardLoader text="Carregando custos mensais..." />
              ) : errorCustos ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-red-700 mb-2">Erro ao carregar custos</h3>
                  <p className="text-red-600 mb-4">{errorCustos}</p>
                  <Button onClick={() => carregarCustosMensais(obraId)} variant="outline">
                    Tentar novamente
                  </Button>
                </div>
              ) : custosFiltrados.length > 0 ? (
                <div className="space-y-4">
                  {/* Tabela Desktop */}
                  <div className="hidden lg:block overflow-x-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                          <TableHead className="w-[100px] font-semibold text-blue-900 text-center">Item</TableHead>
                          <TableHead className="min-w-[180px] font-semibold text-blue-900">Descrição</TableHead>
                          <TableHead className="w-[80px] font-semibold text-blue-900 text-center">UND</TableHead>
                          <TableHead className="w-[140px] font-semibold text-blue-900 text-center">Orçamento</TableHead>
                          <TableHead className="w-[140px] font-semibold text-blue-900 text-center">Acumulado Anterior</TableHead>
                          <TableHead className="w-[140px] font-semibold text-blue-900 text-center">Saldo Contrato</TableHead>
                          <TableHead className="w-[100px] font-semibold text-blue-900 text-center">Mês</TableHead>
                          <TableHead className="w-[120px] font-semibold text-blue-900 text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {custosFiltrados.map((custo, index) => (
                        <TableRow key={custo.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                          <TableCell className="font-semibold text-center text-blue-700">
                            <div className="flex flex-col items-center gap-1">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {custo.item}
                              </Badge>
                              {/* Indicador de status */}
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  custo.valor_acumulado === 0 ? 'bg-gray-400' :
                                  custo.valor_acumulado < custo.total_orcamento * 0.5 ? 'bg-yellow-400' :
                                  custo.valor_acumulado < custo.total_orcamento * 0.9 ? 'bg-blue-400' :
                                  'bg-green-400'
                                }`}></div>
                                <span className="text-xs text-gray-600">
                                  {custo.valor_acumulado === 0 ? 'Não iniciado' :
                                   custo.valor_acumulado < custo.total_orcamento * 0.5 ? 'Iniciado' :
                                   custo.valor_acumulado < custo.total_orcamento * 0.9 ? 'Em andamento' :
                                   'Quase concluído'}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-gray-800">
                            {custo.descricao}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-xs">
                              {custo.unidade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                              <div className="text-xs text-blue-600 mb-1">Qtd: {formatarQuantidade(custo.quantidade_orcamento)}</div>
                              <div className="text-xs text-blue-600 mb-1">Unit: R$ {formatarValor(custo.valor_unitario)}</div>
                              <div className="text-sm font-bold text-blue-800">Total: R$ {formatarValor(custo.total_orcamento)}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                              <div className="text-xs text-gray-600 mb-1">Qtd: {formatarQuantidade(custo.quantidade_acumulada - custo.quantidade_realizada)}</div>
                              <div className="text-sm font-medium text-gray-800">R$ {formatarValor(custo.valor_acumulado - custo.valor_realizado)}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className={`p-2 rounded-lg border ${custo.valor_saldo >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <div className="text-xs mb-1">Qtd: {formatarQuantidade(custo.quantidade_saldo)}</div>
                              <div className={`text-sm font-medium ${custo.valor_saldo >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                                R$ {formatarValor(custo.valor_saldo)}
                              </div>
                              {/* Barra de progresso */}
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                      custo.valor_saldo >= 0 ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                    style={{ 
                                      width: `${Math.min(100, Math.max(0, (custo.valor_acumulado / custo.total_orcamento) * 100))}%` 
                                    }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {Math.round((custo.valor_acumulado / custo.total_orcamento) * 100)}% executado
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                              {new Date(custo.mes + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-1 justify-center">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600"
                                onClick={() => handleEditarCusto(custo)}
                                title="Editar custo"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                                onClick={() => handleExcluirCusto(custo.id)}
                                title="Excluir custo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow className="bg-gradient-to-r from-gray-100 to-gray-200 border-t-2 border-gray-300">
                        <TableCell colSpan={3} className="font-bold text-lg text-gray-800 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            TOTAIS (R$)
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="bg-blue-100 p-2 rounded-lg border-2 border-blue-300">
                            <div className="text-sm font-bold text-blue-900">
                              R$ {formatarValor(custosMensais.reduce((sum, custo) => sum + custo.total_orcamento, 0))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="bg-gray-100 p-2 rounded-lg border-2 border-gray-300">
                            <div className="text-sm font-bold text-gray-900">
                              R$ {formatarValor(custosMensais.reduce((sum, custo) => sum + (custo.valor_acumulado - custo.valor_realizado), 0))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={`p-2 rounded-lg border-2 ${custosMensais.reduce((sum, custo) => sum + custo.valor_saldo, 0) >= 0 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                            <div className={`text-sm font-bold ${custosMensais.reduce((sum, custo) => sum + custo.valor_saldo, 0) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                              R$ {formatarValor(custosMensais.reduce((sum, custo) => sum + custo.valor_saldo, 0))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Cards Mobile/Tablet */}
                <div className="lg:hidden space-y-4">
                  {custosFiltrados.map((custo, index) => (
                    <Card key={custo.id} className="p-4">
                      <div className="space-y-4">
                        {/* Header do Card */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {custo.item}
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${
                              custo.valor_acumulado === 0 ? 'bg-gray-400' :
                              custo.valor_acumulado < custo.total_orcamento * 0.5 ? 'bg-yellow-400' :
                              custo.valor_acumulado < custo.total_orcamento * 0.9 ? 'bg-blue-400' :
                              'bg-green-400'
                            }`}></div>
                            <span className="text-xs text-gray-600">
                              {custo.valor_acumulado === 0 ? 'Não iniciado' :
                               custo.valor_acumulado < custo.total_orcamento * 0.5 ? 'Iniciado' :
                               custo.valor_acumulado < custo.total_orcamento * 0.9 ? 'Em andamento' :
                               'Quase concluído'}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600"
                              onClick={() => handleEditarCusto(custo)}
                              title="Editar custo"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                              onClick={() => handleExcluirCusto(custo.id)}
                              title="Excluir custo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Descrição */}
                        <div>
                          <p className="font-medium text-gray-800">{custo.descricao}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {custo.unidade}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                              {new Date(custo.mes + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                            </Badge>
                          </div>
                        </div>

                        {/* Valores em Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="text-xs text-blue-600 mb-1">Orçamento</div>
                            <div className="text-xs text-blue-600 mb-1">Qtd: {formatarQuantidade(custo.quantidade_orcamento)}</div>
                            <div className="text-xs text-blue-600 mb-1">Unit: R$ {formatarValor(custo.valor_unitario)}</div>
                            <div className="text-sm font-bold text-blue-800">Total: R$ {formatarValor(custo.total_orcamento)}</div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="text-xs text-gray-600 mb-1">Acumulado Anterior</div>
                            <div className="text-xs text-gray-600 mb-1">Qtd: {formatarQuantidade(custo.quantidade_acumulada - custo.quantidade_realizada)}</div>
                            <div className="text-sm font-medium text-gray-800">R$ {formatarValor(custo.valor_acumulado - custo.valor_realizado)}</div>
                          </div>

                        </div>

                        {/* Saldo e Progresso */}
                        <div className={`p-3 rounded-lg border ${custo.valor_saldo >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="text-xs mb-1">Saldo Contrato</div>
                          <div className="text-xs mb-1">Qtd: {formatarQuantidade(custo.quantidade_saldo)}</div>
                          <div className={`text-sm font-medium mb-2 ${custo.valor_saldo >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                            R$ {formatarValor(custo.valor_saldo)}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                custo.valor_saldo >= 0 ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ 
                                width: `${Math.min(100, Math.max(0, (custo.valor_acumulado / custo.total_orcamento) * 100))}%` 
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.round((custo.valor_acumulado / custo.total_orcamento) * 100)}% executado
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Resumo Mobile */}
                  <Card className="p-4 bg-gradient-to-r from-gray-100 to-gray-200">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <DollarSign className="w-5 h-5" />
                      <span className="font-bold text-lg text-gray-800">TOTAIS (R$)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-blue-100 p-3 rounded-lg border-2 border-blue-300">
                        <div className="text-blue-600 font-medium mb-1">Orçamento</div>
                        <div className="font-bold text-blue-900">
                          R$ {formatarValor(custosMensais.reduce((sum, custo) => sum + custo.total_orcamento, 0))}
                        </div>
                      </div>
                      <div className="bg-gray-100 p-3 rounded-lg border-2 border-gray-300">
                        <div className="text-gray-600 font-medium mb-1">Acumulado Anterior</div>
                        <div className="font-bold text-gray-900">
                          R$ {formatarValor(custosMensais.reduce((sum, custo) => sum + (custo.valor_acumulado - custo.valor_realizado), 0))}
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg border-2 col-span-2 ${custosMensais.reduce((sum, custo) => sum + custo.valor_saldo, 0) >= 0 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                        <div className={`font-medium mb-1 ${custosMensais.reduce((sum, custo) => sum + custo.valor_saldo, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>Saldo Contrato</div>
                        <div className={`font-bold ${custosMensais.reduce((sum, custo) => sum + custo.valor_saldo, 0) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                          R$ {formatarValor(custosMensais.reduce((sum, custo) => sum + custo.valor_saldo, 0))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum custo encontrado</h3>
                  <p className="text-gray-600 mb-4">
                    {mesSelecionado && mesSelecionado !== 'todos'
                      ? `Não há custos registrados para ${new Date(mesSelecionado + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
                      : 'Esta obra ainda não possui custos mensais registrados.'
                    }
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleAbrirCustosIniciais} className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Custos Iniciais
                    </Button>
                    <Button onClick={handleAbrirNovoMes} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Mês
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="w-5 h-5" />
                  Documentos da Obra
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => window.location.href = `/dashboard/assinatura?obra=${obra.id}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Documento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingDocumentos ? (
                <CardLoader text="Carregando documentos..." />
              ) : documentos.length > 0 ? (
                <div className="space-y-4">
                  {documentos.map((documento) => (
                    <Card key={documento.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <CardTitle className="text-lg">{documento.titulo}</CardTitle>
                              <CardDescription className="mt-1">{documento.descricao}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getDocumentStatusColor(documento.status)}>
                              {documento.status.replace('_', ' ')}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = `/dashboard/assinatura/${documento.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Informações do documento */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Criado em:</span>
                              <span>{new Date(documento.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Assinantes:</span>
                              <span>{documento.assinaturas?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Progresso:</span>
                              <span>{documento.assinaturas?.length > 0 ? Math.round((documento.assinaturas.filter(a => a.status === 'assinado').length / documento.assinaturas.length) * 100) : 0}%</span>
                            </div>
                          </div>

                          {/* Barra de progresso */}
                          {documento.assinaturas?.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progresso das Assinaturas</span>
                                <span>{Math.round((documento.assinaturas.filter(a => a.status === 'assinado').length / documento.assinaturas.length) * 100)}%</span>
                              </div>
                              <Progress 
                                value={(documento.assinaturas.filter(a => a.status === 'assinado').length / documento.assinaturas.length) * 100} 
                                className="h-2" 
                              />
                            </div>
                          )}

                          {/* Lista de assinaturas */}
                          {documento.assinaturas?.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700">Ordem de Assinaturas</h4>
                              <div className="space-y-2">
                                {documento.assinaturas
                                  .sort((a, b) => a.ordem - b.ordem)
                                  .map((assinatura, index) => (
                                  <div key={assinatura.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                                        {assinatura.ordem}
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">{assinatura.usuario?.nome || 'Usuário'}</p>
                                        <p className="text-xs text-gray-600">{assinatura.usuario?.role || 'N/A'}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge className={getSignatureStatusColor(assinatura.status)}>
                                        {assinatura.status}
                                      </Badge>
                                      {assinatura.arquivo_assinado && (
                                        <Button size="sm" variant="outline">
                                          <Download className="w-3 h-3 mr-1" />
                                          Baixar
                                        </Button>
                                      )}
                                      {assinatura.docu_sign_link && (
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => window.open(assinatura.docu_sign_link, '_blank')}
                                        >
                                          <ExternalLink className="w-3 h-3 mr-1" />
                                          DocuSign
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Próximo assinante */}
                          {documento.proximo_assinante_id && documento.assinaturas && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-800">
                                Próximo a assinar: <strong>{documento.assinaturas.find(a => a.user_id === documento.proximo_assinante_id)?.usuario?.nome || 'Usuário'}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileSignature className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento encontrado</h3>
                  <p className="text-gray-600 mb-4">Esta obra ainda não possui documentos para assinatura.</p>
                  <Button 
                    onClick={() => window.location.href = `/dashboard/assinatura?obra=${obra.id}`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Documento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Arquivos */}
        <TabsContent value="arquivos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Folder className="w-5 h-5" />
                  Arquivos Adicionais - {obra.name}
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => setIsNovoArquivoOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Arquivo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingArquivos ? (
                <CardLoader text="Carregando arquivos..." />
              ) : arquivos.length > 0 ? (
                <div className="space-y-4">
                  {arquivos.map((arquivo) => (
                    <Card key={arquivo.id} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <File className="w-5 h-5 text-green-600" />
                            <div>
                              <CardTitle className="text-lg">{arquivo.nome_original}</CardTitle>
                              <CardDescription className="mt-1">{arquivo.descricao}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              {arquivo.categoria}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await obrasArquivosApi.baixar(parseInt(obra.id), arquivo.id)
                                } catch (error: any) {
                                  console.error('Erro ao baixar arquivo:', error)
                                  toast({
        title: "Informação",
        description: "Erro ao baixar arquivo: ${error.message}",
        variant: "default"
      })
                                }
                              }}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Baixar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoverArquivo(arquivo.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Arquivo:</span>
                            <span className="font-medium">{arquivo.nome_arquivo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Upload:</span>
                            <span>{new Date(arquivo.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Tamanho:</span>
                            <span>{formatarTamanhoArquivo(arquivo.tamanho)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <File className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Tipo:</span>
                            <span>{arquivo.tipo_mime}</span>
                          </div>
                        </div>
                        {arquivo.download_count > 0 && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                            <span>Downloads: {arquivo.download_count}</span>
                            {arquivo.last_download_at && (
                              <span className="ml-4">
                                Último download: {new Date(arquivo.last_download_at).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum arquivo encontrado</h3>
                  <p className="text-gray-600 mb-4">Esta obra ainda não possui arquivos adicionais.</p>
                  <Button 
                    onClick={() => setIsNovoArquivoOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Arquivo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Livro da Grua */}
        <TabsContent value="livro-grua" className="space-y-4">
          <Card>
            <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Livro da Grua - {obra.name}
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={handleExportarEntradas}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={handleImprimirEntradas}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button 
                  size="sm"
                  onClick={handleNovaEntrada}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Entrada
                </Button>
              </div>
            </div>
            </CardHeader>
            <CardContent>
              {gruasVinculadas.length > 0 ? (
                <div className="space-y-6">
                  {/* Filtros */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label>Buscar entradas</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              placeholder="Funcionário, descrição..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Grua</Label>
                          <Select value={selectedGrua} onValueChange={setSelectedGrua}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Todas as gruas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas as gruas</SelectItem>
                              {gruasVinculadas.map(grua => (
                                <SelectItem key={grua.id} value={grua.id}>
                                  {grua.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Tipo</Label>
                          <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="checklist">Checklist</SelectItem>
                              <SelectItem value="manutencao">Manutenção</SelectItem>
                              <SelectItem value="falha">Falha</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="ok">OK</SelectItem>
                              <SelectItem value="manutencao">Manutenção</SelectItem>
                              <SelectItem value="falha">Falha</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lista de Entradas por Grua */}
                  {gruasVinculadas.map((grua) => (
                    <Card key={grua.id} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Wrench className="w-5 h-5" />
                          {grua.name}
                        </CardTitle>
                        <CardDescription>
                          {grua.fabricante} {grua.modelo} - {grua.capacidade}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <LivroGruaList
                          gruaId={grua.id.toString()}
                          onNovaEntrada={handleNovaEntrada}
                          onEditarEntrada={handleEditarEntrada}
                          onVisualizarEntrada={handleVisualizarEntrada}
                          modoCompacto={true}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma grua vinculada</h3>
                  <p className="text-gray-600 mb-4">
                    Esta obra ainda não possui gruas vinculadas para exibir o livro de histórico.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para Nova Entrada */}
      <Dialog open={isNovaEntradaOpen} onOpenChange={setIsNovaEntradaOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nova Entrada no Livro da Grua
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNovaEntrada} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gruaId">Grua *</Label>
                <Select
                  value={novaEntradaData.gruaId}
                  onValueChange={(value) => setNovaEntradaData({ ...novaEntradaData, gruaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma grua" />
                  </SelectTrigger>
                  <SelectContent>
                    {gruasVinculadas.map(grua => (
                      <SelectItem key={grua.id} value={grua.id}>
                        {grua.name} - {grua.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="funcionarioId">Funcionário *</Label>
                <Select
                  value={novaEntradaData.funcionarioId}
                  onValueChange={(value) => setNovaEntradaData({ ...novaEntradaData, funcionarioId: value })}
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={novaEntradaData.data}
                  onChange={(e) => setNovaEntradaData({ ...novaEntradaData, data: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={novaEntradaData.tipo}
                  onValueChange={(value) => setNovaEntradaData({ ...novaEntradaData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checklist">Checklist Diário</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="falha">Falha/Problema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={novaEntradaData.status}
                  onValueChange={(value) => setNovaEntradaData({ ...novaEntradaData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ok">OK</SelectItem>
                    <SelectItem value="manutencao">Em Manutenção</SelectItem>
                    <SelectItem value="falha">Falha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={novaEntradaData.descricao}
                onChange={(e) => setNovaEntradaData({ ...novaEntradaData, descricao: e.target.value })}
                placeholder="Descreva a atividade realizada, problema encontrado ou manutenção executada..."
                rows={4}
                required
              />
            </div>

            {novaEntradaData.status === 'falha' && (
              <div>
                <Label htmlFor="responsavelResolucao">Responsável pela Resolução *</Label>
                <Select
                  value={novaEntradaData.responsavelResolucao}
                  onValueChange={(value) => setNovaEntradaData({ ...novaEntradaData, responsavelResolucao: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers.filter(user => 
                      user.role === 'engenheiro' || 
                      user.role === 'chefe_obras' || 
                      user.role === 'funcionario'
                    ).map(user => (
                      <SelectItem key={user.id} value={user.name}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="observacoes">Observações Adicionais</Label>
              <Textarea
                id="observacoes"
                value={novaEntradaData.observacoes}
                onChange={(e) => setNovaEntradaData({ ...novaEntradaData, observacoes: e.target.value })}
                placeholder="Observações complementares, recomendações, próximos passos..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsNovaEntradaOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Adicionar Entrada
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Entrada */}
      <Dialog open={isVisualizarEntradaOpen} onOpenChange={setIsVisualizarEntradaOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalhes da Entrada
            </DialogTitle>
          </DialogHeader>
          {entradaSelecionada && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Data e Hora</Label>
                      <p className="text-sm">
                        {new Date(entradaSelecionada.data_entrada).toLocaleDateString('pt-BR')} {entradaSelecionada.hora_entrada && `às ${entradaSelecionada.hora_entrada}`}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Grua</Label>
                      <p className="text-sm font-medium">{entradaSelecionada.gruaName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Funcionário</Label>
                      <p className="text-sm">{entradaSelecionada.funcionarioName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Tipo</Label>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          entradaSelecionada.tipo_entrada === 'checklist' ? 'bg-green-100 text-green-800' :
                          entradaSelecionada.tipo_entrada === 'manutencao' ? 'bg-blue-100 text-blue-800' :
                          entradaSelecionada.tipo_entrada === 'falha' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {entradaSelecionada.tipo_entrada}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          entradaSelecionada.status_entrada === 'ok' ? 'bg-green-100 text-green-800' :
                          entradaSelecionada.status_entrada === 'manutencao' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {entradaSelecionada.status_entrada}
                      </Badge>
                    </div>
                    {entradaSelecionada.responsavel_resolucao && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Responsável pela Resolução</Label>
                        <p className="text-sm">{entradaSelecionada.responsavel_resolucao}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Descrição */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {entradaSelecionada.descricao}
                  </p>
                </CardContent>
              </Card>

              {/* Observações */}
              {entradaSelecionada.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {entradaSelecionada.observacoes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Ações */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsVisualizarEntradaOpen(false)}
                >
                  Fechar
                </Button>
                <Button 
                  onClick={() => {
                    // Aqui poderia implementar edição da entrada
                    console.log('Editar entrada:', entradaSelecionada)
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Arquivo */}
      <Dialog open={isNovoArquivoOpen} onOpenChange={setIsNovoArquivoOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Novo Arquivo
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNovoArquivo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome do Arquivo *</Label>
                <Input
                  id="nome"
                  value={novoArquivoData.nome}
                  onChange={(e) => setNovoArquivoData({ ...novoArquivoData, nome: e.target.value })}
                  placeholder="Ex: Manual de Operação"
                  required
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Select
                  value={novoArquivoData.categoria}
                  onValueChange={(value) => setNovoArquivoData({ ...novoArquivoData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="certificado">Certificado</SelectItem>
                    <SelectItem value="licenca">Licença</SelectItem>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="relatorio">Relatório</SelectItem>
                    <SelectItem value="foto">Foto</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={novoArquivoData.descricao}
                onChange={(e) => setNovoArquivoData({ ...novoArquivoData, descricao: e.target.value })}
                placeholder="Descreva o conteúdo do arquivo..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="arquivo">Selecionar Arquivo *</Label>
              <div className="mt-2">
                <Input
                  id="arquivo"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setNovoArquivoData({ ...novoArquivoData, arquivo: file })
                    }
                  }}
                  accept="*/*"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, etc.
                </p>
              </div>
            </div>

            {novoArquivoData.arquivo && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm">{novoArquivoData.arquivo.name}</p>
                    <p className="text-xs text-gray-600">
                      {formatarTamanhoArquivo(novoArquivoData.arquivo.size)} • {novoArquivoData.arquivo.type}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsNovoArquivoOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Upload className="w-4 h-4 mr-2" />
                Adicionar Arquivo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para adicionar grua */}
      <Dialog open={isAdicionarGruaOpen} onOpenChange={setIsAdicionarGruaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vincular Gruas à Obra</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdicionarGrua} className="space-y-6">
            <div className="space-y-4">
              {/* Busca de Grua */}
              <div>
                <Label htmlFor="gruaSearch">Buscar Grua</Label>
                <GruaSearch
                  onGruaSelect={handleGruaSelect}
                  selectedGrua={null}
                  placeholder="Digite o nome ou modelo da grua para buscar"
                  onlyAvailable={true}
                />
              </div>

              {/* Gruas Selecionadas */}
              {gruasSelecionadas.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Gruas Selecionadas ({gruasSelecionadas.length})</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {gruasSelecionadas.map((grua) => (
                      <Card key={grua.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Wrench className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium">{grua.name}</p>
                              <p className="text-sm text-gray-600">
                                {grua.manufacturer} {grua.model} - {grua.capacity}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoverGrua(grua.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`valorLocacao-${grua.id}`}>Valor da Locação (R$)</Label>
                            <Input
                              id={`valorLocacao-${grua.id}`}
                              type="text"
                              value={grua.valorLocacao ? grua.valorLocacao.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
                              onChange={(e) => {
                                const valor = parseFloat(e.target.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0
                                handleAtualizarGrua(grua.id, 'valorLocacao', valor)
                              }}
                              placeholder="0,00"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`taxaMensal-${grua.id}`}>Taxa Mensal (R$)</Label>
                            <Input
                              id={`taxaMensal-${grua.id}`}
                              type="text"
                              value={grua.taxaMensal ? grua.taxaMensal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
                              onChange={(e) => {
                                const valor = parseFloat(e.target.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0
                                handleAtualizarGrua(grua.id, 'taxaMensal', valor)
                              }}
                              placeholder="0,00"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Dados Gerais da Locação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataInicioLocacao">Data Início Locação *</Label>
                  <Input
                    id="dataInicioLocacao"
                    type="date"
                    value={novaGruaData.dataInicioLocacao}
                    onChange={(e) => setNovaGruaData({...novaGruaData, dataInicioLocacao: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dataFimLocacao">Data Fim Locação</Label>
                  <Input
                    id="dataFimLocacao"
                    type="date"
                    value={novaGruaData.dataFimLocacao}
                    onChange={(e) => setNovaGruaData({...novaGruaData, dataFimLocacao: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={novaGruaData.observacoes}
                  onChange={(e) => setNovaGruaData({...novaGruaData, observacoes: e.target.value})}
                  placeholder="Observações sobre a locação..."
                  rows={3}
                />
              </div>

              {/* Resumo das Gruas */}
              {gruasSelecionadas.length > 0 && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <h3 className="text-lg font-medium text-blue-900 mb-3">Resumo das Gruas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Total de Gruas:</span>
                      <p className="text-blue-900 font-semibold">{calcularResumo().totalGruas}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Valor Total de Locação:</span>
                      <p className="text-blue-900 font-semibold">
                        R$ {calcularResumo().valorTotalLocacao.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Taxa Mensal Total:</span>
                      <p className="text-blue-900 font-semibold">
                        R$ {calcularResumo().taxaMensalTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancelarAdicionarGrua}>
                Cancelar
              </Button>
              <Button type="submit" disabled={gruasSelecionadas.length === 0 || loadingGruas}>
                {loadingGruas ? (
                  <>
                    <InlineLoader size="sm" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Gruas ({gruasSelecionadas.length})
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Mês */}
      <Dialog open={isNovoMesOpen} onOpenChange={setIsNovoMesOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Criar Novo Mês
            </DialogTitle>
            <CardDescription>
              Selecione um mês para criar os custos. Os custos do mês anterior serão replicados automaticamente.
            </CardDescription>
          </DialogHeader>
          
          {mesesDisponiveis.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {mesesDisponiveis.map((mes) => (
                  <Card 
                    key={mes.value} 
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      novoMesData.mes === mes.value ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setNovoMesData({ ...novoMesData, mes: mes.value })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {mes.label}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {new Date(mes.value + '-01').toLocaleDateString('pt-BR', { 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        {novoMesData.mes === mes.value && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => {
                  setIsNovoMesOpen(false)
                  setNovoMesData({ mes: '' })
                }}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleNovoMes}
                  disabled={!novoMesData.mes}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Mês
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Todos os meses já foram criados</h3>
              <p className="text-gray-600 mb-4">
                Não há mais meses disponíveis para criar nos próximos 12 meses.
              </p>
              <Button variant="outline" onClick={() => setIsNovoMesOpen(false)}>
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Item */}
      <Dialog open={isNovoItemOpen} onOpenChange={setIsNovoItemOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Item do Contrato
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNovoItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="item">Item *</Label>
                <Input
                  id="item"
                  value={novoItemData.item}
                  onChange={(e) => setNovoItemData({ ...novoItemData, item: e.target.value })}
                  placeholder="Ex: 01.16"
                  required
                />
              </div>
              <div>
                <Label htmlFor="unidade">Unidade *</Label>
                <Select
                  value={novoItemData.unidade}
                  onValueChange={(value) => setNovoItemData({ ...novoItemData, unidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mês">mês</SelectItem>
                    <SelectItem value="und">und</SelectItem>
                    <SelectItem value="und.">und.</SelectItem>
                    <SelectItem value="km">km</SelectItem>
                    <SelectItem value="h">h</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="m²">m²</SelectItem>
                    <SelectItem value="m³">m³</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={novoItemData.descricao}
                  onChange={(e) => setNovoItemData({ ...novoItemData, descricao: e.target.value })}
                  placeholder="Ex: Hora Extra Operador"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantidadeOrcamento">Quantidade Orçamento *</Label>
                <Input
                  id="quantidadeOrcamento"
                  type="number"
                  step="0.01"
                  value={novoItemData.quantidadeOrcamento}
                  onChange={(e) => setNovoItemData({ ...novoItemData, quantidadeOrcamento: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="valorUnitario">Valor Unitário *</Label>
                <Input
                  id="valorUnitario"
                  type="number"
                  step="0.01"
                  value={novoItemData.valorUnitario}
                  onChange={(e) => setNovoItemData({ ...novoItemData, valorUnitario: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label>Total Orçamento</Label>
                <Input
                  value={`R$ ${(novoItemData.quantidadeOrcamento * novoItemData.valorUnitario).toLocaleString('pt-BR')}`}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantidadeAnterior">Quantidade Acumulado Anterior</Label>
                <Input
                  id="quantidadeAnterior"
                  type="number"
                  step="0.01"
                  value={novoItemData.quantidadeAnterior}
                  onChange={(e) => setNovoItemData({ ...novoItemData, quantidadeAnterior: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="valorAnterior">Valor Acumulado Anterior</Label>
                <Input
                  id="valorAnterior"
                  type="number"
                  step="0.01"
                  value={novoItemData.valorAnterior}
                  onChange={(e) => setNovoItemData({ ...novoItemData, valorAnterior: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantidadePeriodo">Quantidade Realizado Período</Label>
                <Input
                  id="quantidadePeriodo"
                  type="number"
                  step="0.01"
                  value={novoItemData.quantidadePeriodo}
                  onChange={(e) => setNovoItemData({ ...novoItemData, quantidadePeriodo: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="valorPeriodo">Valor Realizado Período</Label>
                <Input
                  id="valorPeriodo"
                  type="number"
                  step="0.01"
                  value={novoItemData.valorPeriodo}
                  onChange={(e) => setNovoItemData({ ...novoItemData, valorPeriodo: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsNovoItemOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Aditivo */}
      <Dialog open={isNovoAditivoOpen} onOpenChange={setIsNovoAditivoOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Aditivo
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNovoAditivo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="item">Item *</Label>
                <Input
                  id="item"
                  value={novoItemData.item}
                  onChange={(e) => setNovoItemData({ ...novoItemData, item: e.target.value })}
                  placeholder="Ex: 01.20"
                  required
                />
              </div>
              <div>
                <Label htmlFor="unidade">Unidade *</Label>
                <Select
                  value={novoItemData.unidade}
                  onValueChange={(value) => setNovoItemData({ ...novoItemData, unidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mês">mês</SelectItem>
                    <SelectItem value="und">und</SelectItem>
                    <SelectItem value="und.">und.</SelectItem>
                    <SelectItem value="km">km</SelectItem>
                    <SelectItem value="h">h</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="m²">m²</SelectItem>
                    <SelectItem value="m³">m³</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={novoItemData.descricao}
                  onChange={(e) => setNovoItemData({ ...novoItemData, descricao: e.target.value })}
                  placeholder="Ex: Caixão de grua"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantidadeOrcamento">Quantidade Orçamento *</Label>
                <Input
                  id="quantidadeOrcamento"
                  type="number"
                  step="0.01"
                  value={novoItemData.quantidadeOrcamento}
                  onChange={(e) => setNovoItemData({ ...novoItemData, quantidadeOrcamento: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="valorUnitario">Valor Unitário *</Label>
                <Input
                  id="valorUnitario"
                  type="number"
                  step="0.01"
                  value={novoItemData.valorUnitario}
                  onChange={(e) => setNovoItemData({ ...novoItemData, valorUnitario: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label>Total Orçamento</Label>
                <Input
                  value={`R$ ${(novoItemData.quantidadeOrcamento * novoItemData.valorUnitario).toLocaleString('pt-BR')}`}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantidadeAnterior">Quantidade Acumulado Anterior</Label>
                <Input
                  id="quantidadeAnterior"
                  type="number"
                  step="0.01"
                  value={novoItemData.quantidadeAnterior}
                  onChange={(e) => setNovoItemData({ ...novoItemData, quantidadeAnterior: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="valorAnterior">Valor Acumulado Anterior</Label>
                <Input
                  id="valorAnterior"
                  type="number"
                  step="0.01"
                  value={novoItemData.valorAnterior}
                  onChange={(e) => setNovoItemData({ ...novoItemData, valorAnterior: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantidadePeriodo">Quantidade Realizado Período</Label>
                <Input
                  id="quantidadePeriodo"
                  type="number"
                  step="0.01"
                  value={novoItemData.quantidadePeriodo}
                  onChange={(e) => setNovoItemData({ ...novoItemData, quantidadePeriodo: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="valorPeriodo">Valor Realizado Período</Label>
                <Input
                  id="valorPeriodo"
                  type="number"
                  step="0.01"
                  value={novoItemData.valorPeriodo}
                  onChange={(e) => setNovoItemData({ ...novoItemData, valorPeriodo: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsNovoAditivoOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Aditivo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Novo/Editar Custo Mensal */}
      <Dialog open={isNovoCustoOpen} onOpenChange={setIsNovoCustoOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {isEditandoCusto ? 'Editar Custo Mensal' : 'Novo Custo Mensal'}
            </DialogTitle>
            <CardDescription>
              {isEditandoCusto 
                ? 'Edite as informações do custo mensal'
                : `Adicione um novo custo para ${mesSelecionado ? formatarMes(mesSelecionado) : 'o mês selecionado'}`
              }
            </CardDescription>
          </DialogHeader>
          <form onSubmit={isEditandoCusto ? handleAtualizarCusto : handleNovoCusto} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="item">Item *</Label>
                <Input
                  id="item"
                  value={novoCustoData.item}
                  onChange={(e) => setNovoCustoData({ ...novoCustoData, item: e.target.value })}
                  placeholder="Ex: 01.01"
                  required
                />
              </div>
              <div>
                <Label htmlFor="unidade">Unidade *</Label>
                <Select
                  value={novoCustoData.unidade}
                  onValueChange={(value) => setNovoCustoData({ ...novoCustoData, unidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mês">mês</SelectItem>
                    <SelectItem value="und">und</SelectItem>
                    <SelectItem value="und.">und.</SelectItem>
                    <SelectItem value="km">km</SelectItem>
                    <SelectItem value="h">h</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="m²">m²</SelectItem>
                    <SelectItem value="m³">m³</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={novoCustoData.tipo}
                  onValueChange={(value: 'contrato' | 'aditivo') => setNovoCustoData({ ...novoCustoData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="aditivo">Aditivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={novoCustoData.descricao}
                onChange={(e) => setNovoCustoData({ ...novoCustoData, descricao: e.target.value })}
                placeholder="Ex: Locação de grua torre PINGON BR47"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantidade_orcamento">Quantidade Orçamento *</Label>
                <Input
                  id="quantidade_orcamento"
                  type="number"
                  step="0.01"
                  value={novoCustoData.quantidade_orcamento}
                  onChange={(e) => setNovoCustoData({ ...novoCustoData, quantidade_orcamento: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="valor_unitario">Valor Unitário *</Label>
                <Input
                  id="valor_unitario"
                  type="number"
                  step="0.01"
                  value={novoCustoData.valor_unitario}
                  onChange={(e) => setNovoCustoData({ ...novoCustoData, valor_unitario: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label>Total Orçamento</Label>
                <Input
                  value={`R$ ${formatarValor(novoCustoData.quantidade_orcamento * novoCustoData.valor_unitario)}`}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantidade_realizada">Quantidade Realizada</Label>
                <Input
                  id="quantidade_realizada"
                  type="number"
                  step="0.01"
                  value={novoCustoData.quantidade_realizada}
                  onChange={(e) => setNovoCustoData({ ...novoCustoData, quantidade_realizada: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="quantidade_acumulada">Quantidade Acumulada</Label>
                <Input
                  id="quantidade_acumulada"
                  type="number"
                  step="0.01"
                  value={novoCustoData.quantidade_acumulada}
                  onChange={(e) => setNovoCustoData({ ...novoCustoData, quantidade_acumulada: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="valor_acumulado">Valor Acumulado</Label>
              <Input
                id="valor_acumulado"
                type="number"
                step="0.01"
                value={novoCustoData.valor_acumulado}
                onChange={(e) => setNovoCustoData({ ...novoCustoData, valor_acumulado: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsNovoCustoOpen(false)
                  setIsEditandoCusto(false)
                  setCustoSelecionado(null)
                  setNovoCustoData({
                    item: '',
                    descricao: '',
                    unidade: 'mês',
                    quantidade_orcamento: 0,
                    valor_unitario: 0,
                    quantidade_realizada: 0,
                    quantidade_acumulada: 0,
                    valor_acumulado: 0,
                    tipo: 'contrato'
                  })
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditandoCusto ? 'Atualizar Custo' : 'Criar Custo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Entrada Livro da Grua */}
      <Dialog open={isNovaEntradaOpen} onOpenChange={setIsNovaEntradaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Entrada no Livro da Grua</DialogTitle>
          </DialogHeader>
          <LivroGruaForm
            gruaId={gruasVinculadas.length > 0 ? (gruasVinculadas[0].grua?.id?.toString() || gruasVinculadas[0].id.toString()) : ''}
            onSave={handleSucessoEntrada}
            onCancel={() => setIsNovaEntradaOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Editar Entrada Livro da Grua */}
      <Dialog open={isEditarEntradaOpen} onOpenChange={setIsEditarEntradaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Entrada do Livro da Grua</DialogTitle>
          </DialogHeader>
          <LivroGruaForm
            gruaId={entradaSelecionada?.grua_id || ''}
            modoEdicao={true}
            entrada={entradaSelecionada as any}
            onSave={handleSucessoEntrada}
            onCancel={() => setIsEditarEntradaOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Visualizar Entrada Livro da Grua */}
      <Dialog open={isVisualizarEntradaOpen} onOpenChange={setIsVisualizarEntradaOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalhes da Entrada
            </DialogTitle>
          </DialogHeader>
          {entradaSelecionada && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Data e Hora</Label>
                      <p className="text-sm">
                        {new Date(entradaSelecionada.data_entrada).toLocaleDateString('pt-BR')} {entradaSelecionada.hora_entrada && `às ${entradaSelecionada.hora_entrada}`}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Grua</Label>
                      <p className="text-sm font-medium">{entradaSelecionada.grua_id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Funcionário</Label>
                      <p className="text-sm">{entradaSelecionada.funcionario_id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Tipo</Label>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          entradaSelecionada.tipo_entrada === 'checklist' ? 'bg-green-100 text-green-800' :
                          entradaSelecionada.tipo_entrada === 'manutencao' ? 'bg-blue-100 text-blue-800' :
                          entradaSelecionada.tipo_entrada === 'falha' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {entradaSelecionada.tipo_entrada}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          entradaSelecionada.status_entrada === 'ok' ? 'bg-green-100 text-green-800' :
                          entradaSelecionada.status_entrada === 'manutencao' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {entradaSelecionada.status_entrada}
                      </Badge>
                    </div>
                    {entradaSelecionada.responsavel_resolucao && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Responsável pela Resolução</Label>
                        <p className="text-sm">{entradaSelecionada.responsavel_resolucao}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {entradaSelecionada.descricao}
                  </p>
                </CardContent>
              </Card>
              {entradaSelecionada.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {entradaSelecionada.observacoes}
                    </p>
                  </CardContent>
                </Card>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsVisualizarEntradaOpen(false)}
                >
                  Fechar
                </Button>
                <Button 
                  onClick={() => {
                    setIsVisualizarEntradaOpen(false)
                    handleEditarEntrada(entradaSelecionada)
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Custos Iniciais */}
      <Dialog open={isCustosIniciaisOpen} onOpenChange={setIsCustosIniciaisOpen}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Criar Custos Iniciais da Obra
            </DialogTitle>
            <CardDescription>
              Crie os custos iniciais da obra. Estes custos serão replicados automaticamente para os próximos meses.
            </CardDescription>
          </DialogHeader>
          
          <form onSubmit={handleCriarCustosIniciais} className="space-y-6">
            {/* Seleção do Mês */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mes">Mês Inicial *</Label>
                <Input
                  id="mes"
                  type="month"
                  value={custosIniciaisData.mes}
                  onChange={(e) => setCustosIniciaisData(prev => ({ ...prev, mes: e.target.value }))}
                  required
                />
              </div>
              <div className="flex items-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAdicionarCustoInicial}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Custo
                </Button>
              </div>
            </div>

            {/* Lista de Custos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Custos da Obra</h3>
              {custosIniciaisData.custos.map((custo, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Custo {index + 1}</h4>
                    {custosIniciaisData.custos.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoverCustoInicial(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Item *</Label>
                      <Input
                        value={custo.item}
                        onChange={(e) => handleAtualizarCustoInicial(index, 'item', e.target.value)}
                        placeholder="Ex: 01.01"
                        required
                      />
                    </div>
                    <div>
                      <Label>Unidade *</Label>
                      <Select
                        value={custo.unidade}
                        onValueChange={(value) => handleAtualizarCustoInicial(index, 'unidade', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mês">mês</SelectItem>
                          <SelectItem value="und">und</SelectItem>
                          <SelectItem value="und.">und.</SelectItem>
                          <SelectItem value="km">km</SelectItem>
                          <SelectItem value="h">h</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="m²">m²</SelectItem>
                          <SelectItem value="m³">m³</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tipo *</Label>
                      <Select
                        value={custo.tipo}
                        onValueChange={(value: 'contrato' | 'aditivo') => handleAtualizarCustoInicial(index, 'tipo', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contrato">Contrato</SelectItem>
                          <SelectItem value="aditivo">Aditivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label>Descrição *</Label>
                    <Input
                      value={custo.descricao}
                      onChange={(e) => handleAtualizarCustoInicial(index, 'descricao', e.target.value)}
                      placeholder="Ex: Locação de grua torre PINGON BR47"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Quantidade Orçamento *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={custo.quantidade_orcamento}
                        onChange={(e) => handleAtualizarCustoInicial(index, 'quantidade_orcamento', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Valor Unitário *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={custo.valor_unitario}
                        onChange={(e) => handleAtualizarCustoInicial(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <strong>Total Orçamento:</strong> R$ {formatarValor(custo.quantidade_orcamento * custo.valor_unitario)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Resumo Total */}
            <Card className="p-4 bg-blue-50">
              <h3 className="font-medium text-blue-900 mb-2">Resumo dos Custos Iniciais</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Total de Itens:</span>
                  <span className="ml-2 font-medium">{custosIniciaisData.custos.length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Valor Total:</span>
                  <span className="ml-2 font-medium">
                    R$ {formatarValor(
                      custosIniciaisData.custos.reduce((sum, custo) => 
                        sum + (custo.quantidade_orcamento * custo.valor_unitario), 0
                      )
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Mês:</span>
                  <span className="ml-2 font-medium">
                    {custosIniciaisData.mes ? formatarMes(custosIniciaisData.mes) : 'Não selecionado'}
                  </span>
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCustosIniciaisOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Custos Iniciais
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ObraDetailsPage() {
  return <ObraDetailsPageContent />
}

