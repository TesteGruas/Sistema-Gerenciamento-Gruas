"use client"

import { useState, useEffect } from "react"
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
  Paperclip
} from "lucide-react"
import { mockObras, mockGruas, getGruasByObra, getCustosByObra, getHistoricoByGrua, getDocumentosByObra, mockUsers, getCustosMensaisByObra, getCustosMensaisByObraAndMes, getMesesDisponiveis, criarCustosParaNovoMes, CustoMensal, Obra } from "@/lib/mock-data"
import { Progress } from "@/components/ui/progress"
import { useParams } from "next/navigation"
import { obrasApi, converterObraBackendParaFrontend, ObraBackend, ensureAuthenticated } from "@/lib/api-obras"
import { Loader2, AlertCircle } from "lucide-react"

export default function ObraDetailsPage() {
  const params = useParams()
  const obraId = params.id as string
  
  // Estados para integração com backend
  const [obra, setObra] = useState<Obra | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gruasReais, setGruasReais] = useState<any[]>([])
  const [loadingGruas, setLoadingGruas] = useState(false)
  
  // Estados para filtros e nova entrada
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGrua, setSelectedGrua] = useState("all")
  const [selectedTipo, setSelectedTipo] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isNovaEntradaOpen, setIsNovaEntradaOpen] = useState(false)
  const [isVisualizarEntradaOpen, setIsVisualizarEntradaOpen] = useState(false)
  const [entradaSelecionada, setEntradaSelecionada] = useState<any>(null)
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
  
  // Estados para custos mensais
  const [mesSelecionado, setMesSelecionado] = useState('')
  const [custosMensais, setCustosMensais] = useState<CustoMensal[]>([])
  const [isNovoMesOpen, setIsNovoMesOpen] = useState(false)
  const [novoMesData, setNovoMesData] = useState({
    mes: ''
  })
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([])
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
  
  // Função para criar nova entrada
  const handleNovaEntrada = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!obra) return
    
    const novaEntrada = {
      id: Date.now().toString(),
      gruaId: novaEntradaData.gruaId,
      data: novaEntradaData.data,
      status: novaEntradaData.status as 'ok' | 'falha' | 'manutencao',
      observacoes: novaEntradaData.descricao,
      funcionarioId: novaEntradaData.funcionarioId,
      funcionarioName: mockUsers.find(u => u.id === novaEntradaData.funcionarioId)?.name || 'Funcionário não encontrado',
      tipo: novaEntradaData.tipo as 'checklist' | 'manutencao' | 'falha',
      notificacaoEnviada: false
    }
    
    // Em uma aplicação real, isso seria uma chamada para a API
    console.log('Nova entrada criada:', novaEntrada)
    
    // Resetar formulário e fechar dialog
    setNovaEntradaData({
      gruaId: '',
      funcionarioId: '',
      data: new Date().toISOString().split('T')[0],
      tipo: 'checklist',
      status: 'ok',
      descricao: '',
      responsavelResolucao: '',
      observacoes: ''
    })
    setIsNovaEntradaOpen(false)
    
    // Mostrar mensagem de sucesso (simulado)
    alert('Entrada adicionada com sucesso!')
  }

  const handleVisualizarEntrada = (entrada: any) => {
    setEntradaSelecionada(entrada)
    setIsVisualizarEntradaOpen(true)
  }

  const handleExportarEntradas = () => {
    if (!obra) return
    
    // Simular exportação para CSV
    const csvContent = [
      ['Data', 'Hora', 'Grua', 'Funcionário', 'Tipo', 'Status', 'Descrição', 'Responsável Resolução', 'Observações'],
      ...filteredEntradas.map(entrada => [
        new Date(entrada.data).toLocaleDateString('pt-BR'),
        new Date(entrada.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        entrada.gruaName,
        entrada.funcionarioName,
        entrada.tipo,
        entrada.status,
        entrada.descricao,
        entrada.responsavelResolucao || '-',
        entrada.observacoes || '-'
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `livro-grua-${obra.name}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImprimirEntradas = () => {
    window.print()
  }

  const handleNovoArquivo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!obra) return
    if (!novoArquivoData.arquivo) {
      alert('Por favor, selecione um arquivo')
      return
    }

    const novoArquivo = {
      id: Date.now().toString(),
      nome: novoArquivoData.nome,
      descricao: novoArquivoData.descricao,
      categoria: novoArquivoData.categoria,
      nomeArquivo: novoArquivoData.arquivo.name,
      tamanho: novoArquivoData.arquivo.size,
      tipo: novoArquivoData.arquivo.type,
      dataUpload: new Date().toISOString(),
      obraId: obra.id
    }

    setArquivosAdicionais([...arquivosAdicionais, novoArquivo])
    setNovoArquivoData({
      nome: '',
      descricao: '',
      categoria: 'geral',
      arquivo: null
    })
    setIsNovoArquivoOpen(false)
    alert('Arquivo adicionado com sucesso!')
  }

  const handleRemoverArquivo = (arquivoId: string) => {
    setArquivosAdicionais(arquivosAdicionais.filter(arq => arq.id !== arquivoId))
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
    alert('Item adicionado com sucesso!')
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
    alert('Aditivo adicionado com sucesso!')
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

  const handleNovoMes = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!obra) return
    if (!novoMesData.mes) {
      alert('Selecione um mês válido!')
      return
    }
    
    const novosCustos = criarCustosParaNovoMes(obra.id, novoMesData.mes)
    
    if (novosCustos.length === 0) {
      alert('Não há custos anteriores para replicar. Crie primeiro os custos iniciais da obra.')
      return
    }
    
    setCustosMensais([...custosMensais, ...novosCustos])
    setMesSelecionado(novoMesData.mes)
    setNovoMesData({ mes: '' })
    setIsNovoMesOpen(false)
    alert(`Custos criados para ${novoMesData.mes} com sucesso!`)
  }

  const handleAbrirNovoMes = () => {
    const meses = gerarMesesDisponiveis()
    setMesesDisponiveis(meses)
    setIsNovoMesOpen(true)
  }

  const handleAtualizarQuantidade = (custoId: string, novaQuantidade: number) => {
    const custosAtualizados = custosMensais.map(custo => {
      if (custo.id === custoId) {
        const novoValorRealizado = novaQuantidade * custo.valorUnitario
        const novaQuantidadeAcumulada = custo.quantidadeAcumulada - custo.quantidadeRealizada + novaQuantidade
        const novoValorAcumulado = custo.valorAcumulado - custo.valorRealizado + novoValorRealizado
        const novaQuantidadeSaldo = custo.quantidadeOrcamento - novaQuantidadeAcumulada
        const novoValorSaldo = custo.totalOrcamento - novoValorAcumulado
        
        return {
          ...custo,
          quantidadeRealizada: novaQuantidade,
          valorRealizado: novoValorRealizado,
          quantidadeAcumulada: novaQuantidadeAcumulada,
          valorAcumulado: novoValorAcumulado,
          quantidadeSaldo: novaQuantidadeSaldo,
          valorSaldo: novoValorSaldo,
          updatedAt: new Date().toISOString()
        }
      }
      return custo
    })
    
    setCustosMensais(custosAtualizados)
  }

  const carregarCustosMensais = () => {
    if (!obra) return
    
    if (mesSelecionado && mesSelecionado !== 'todos') {
      const custos = getCustosMensaisByObraAndMes(obra.id, mesSelecionado)
      setCustosMensais(custos)
    } else {
      const custos = getCustosMensaisByObra(obra.id)
      setCustosMensais(custos)
    }
  }

  const handleExportarCustos = (tipo: 'geral' | 'mes') => {
    if (!obra) return
    
    let dadosParaExportar = custosMensais
    
    if (tipo === 'mes' && mesSelecionado && mesSelecionado !== 'todos') {
      dadosParaExportar = getCustosMensaisByObraAndMes(obra.id, mesSelecionado)
    } else if (tipo === 'geral') {
      dadosParaExportar = getCustosMensaisByObra(obra.id)
    }

    if (dadosParaExportar.length === 0) {
      alert('Não há dados para exportar!')
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
      custo.quantidadeOrcamento.toFixed(2),
      custo.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      custo.totalOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      custo.quantidadeRealizada.toFixed(2),
      custo.valorRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      custo.quantidadeAcumulada.toFixed(2),
      custo.valorAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      custo.quantidadeSaldo.toFixed(2),
      custo.valorSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      new Date(custo.mes + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
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

    alert(`Arquivo ${nomeArquivo} baixado com sucesso!`)
  }

  // Carregar dados da obra do backend
  const carregarObra = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await obrasApi.obterObra(parseInt(obraId))
      const obraConvertida = converterObraBackendParaFrontend(response.data)
      setObra(obraConvertida)
    } catch (err) {
      console.error('Erro ao carregar obra:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar obra')
      // Fallback para dados mockados em caso de erro
      const obraMockada = mockObras.find(o => o.id === obraId)
      if (obraMockada) {
        setObra(obraMockada)
      }
    } finally {
      setLoading(false)
    }
  }

  // Carregar gruas vinculadas à obra
  const carregarGruasVinculadas = async () => {
    if (!obra) return
    
    try {
      setLoadingGruas(true)
      const response = await obrasApi.buscarGruasVinculadas(parseInt(obra.id))
      if (response.success) {
        setGruasReais(response.data)
      } else {
        console.warn('Erro ao carregar gruas vinculadas, usando dados mockados')
        setGruasReais([])
      }
    } catch (err) {
      console.error('Erro ao carregar gruas vinculadas:', err)
      setGruasReais([])
    } finally {
      setLoadingGruas(false)
    }
  }

  // Verificar autenticação e carregar obra na inicialização
  useEffect(() => {
    const init = async () => {
      const isAuth = await ensureAuthenticated()
      if (isAuth) {
        carregarObra()
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

  // Carregar custos mensais quando a obra ou mês mudar
  useEffect(() => {
    if (obra) {
      carregarCustosMensais()
    }
  }, [obra?.id, mesSelecionado])

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

  // Tratamento de loading e erro
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Carregando detalhes da obra...</span>
          </div>
        </div>
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
            <Button onClick={carregarObra} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }

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
  const documentos = getDocumentosByObra(obra.id)
  
  // Criar lista de entradas com dados expandidos
  const todasEntradas = gruasVinculadas.flatMap(grua => {
    const historico = getHistoricoByGrua(grua.id)
    return historico.map(entrada => ({
      ...entrada,
      gruaName: grua.name,
      gruaId: grua.id,
      descricao: entrada.observacoes || 'Sem descrição',
      responsavelResolucao: entrada.status === 'falha' ? 'A definir' : undefined
    }))
  }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  
  // Filtrar entradas
  const filteredEntradas = todasEntradas.filter(entrada => {
    const matchesSearch = searchTerm === "" || 
      (entrada.funcionarioName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entrada.descricao || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGrua = selectedGrua === "all" || entrada.gruaId === selectedGrua
    const matchesTipo = selectedTipo === "all" || entrada.tipo === selectedTipo
    const matchesStatus = selectedStatus === "all" || entrada.status === selectedStatus
    
    return matchesSearch && matchesGrua && matchesTipo && matchesStatus
  })

  return (
    <div className="space-y-6">
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
          <div className="grid grid-cols-2 gap-4">
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
                <CardTitle className="text-sm">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Custos Iniciais:</span>
                  <span className="text-sm font-medium">R$ {obra.custosIniciais.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Custos Adicionais:</span>
                  <span className="text-sm font-medium">R$ {obra.custosAdicionais.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-semibold">Total:</span>
                  <span className="text-sm font-bold">R$ {obra.totalCustos.toLocaleString('pt-BR')}</span>
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
                  {loadingGruas && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => window.location.href = `/dashboard/gruas?obra=${obra.id}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Vincular Grua
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingGruas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Carregando gruas vinculadas...</span>
                </div>
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
                              {isGruaReal ? grua.grua?.name || grua.name : grua.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {isGruaReal ? 
                                `${grua.grua?.manufacturer || 'N/A'} ${grua.grua?.model || 'N/A'}` : 
                                `${grua.model} - ${grua.capacity}`
                              }
                            </p>
                            {isGruaReal && (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-gray-500">
                                  <strong>Início da Locação:</strong> {new Date(grua.dataInicioLocacao).toLocaleDateString('pt-BR')}
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
                                {grua.grua?.type || 'N/A'}
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
                    onClick={() => window.location.href = `/dashboard/gruas?obra=${obra.id}`}
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
                      {getMesesDisponiveis(obra.id).map(mes => (
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
                    disabled={custosMensais.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Geral
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportarCustos('mes')}
                    disabled={custosMensais.length === 0 || (mesSelecionado === 'todos' || !mesSelecionado)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Mês
                  </Button>
                  <Button onClick={handleAbrirNovoMes}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Mês
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
                  <p className="text-lg font-bold text-blue-600">R$ {obra.custosIniciais.toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">Gastos Acumulados</Label>
                  <p className="text-lg font-bold text-green-600">
                    R$ {custosMensais.reduce((sum, custo) => sum + custo.valorAcumulado, 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">Gastos do Mês</Label>
                  <p className="text-lg font-bold text-yellow-600">
                    R$ {custosMensais.reduce((sum, custo) => sum + custo.valorRealizado, 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">Saldo Restante</Label>
                  <p className="text-lg font-bold text-red-600">
                    R$ {(obra.custosIniciais - custosMensais.reduce((sum, custo) => sum + custo.valorAcumulado, 0)).toLocaleString('pt-BR')}
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
                {custosMensais.length > 0 ? `${custosMensais.length} itens encontrados` : 'Nenhum custo encontrado para este período'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {custosMensais.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Item</TableHead>
                        <TableHead className="min-w-[200px]">Descrição</TableHead>
                        <TableHead className="w-[60px]">UND</TableHead>
                        <TableHead className="w-[100px]">Orçamento</TableHead>
                        <TableHead className="w-[100px]">Acumulado Anterior</TableHead>
                        <TableHead className="w-[120px]">Realizado Período</TableHead>
                        <TableHead className="w-[100px]">Acumulado Total</TableHead>
                        <TableHead className="w-[100px]">Saldo Contrato</TableHead>
                        <TableHead className="w-[60px]">Mês</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {custosMensais.map((custo) => (
                        <TableRow key={custo.id}>
                          <TableCell className="font-medium">{custo.item}</TableCell>
                          <TableCell>{custo.descricao}</TableCell>
                          <TableCell>{custo.unidade}</TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>Qtd: {custo.quantidadeOrcamento.toFixed(2)}</div>
                              <div>Unit: R$ {custo.valorUnitario.toLocaleString('pt-BR')}</div>
                              <div className="font-bold">Total: R$ {custo.totalOrcamento.toLocaleString('pt-BR')}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>Qtd: {(custo.quantidadeAcumulada - custo.quantidadeRealizada).toFixed(2)}</div>
                              <div>Valor: R$ {(custo.valorAcumulado - custo.valorRealizado).toLocaleString('pt-BR')}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Input
                                type="number"
                                step="0.01"
                                value={custo.quantidadeRealizada}
                                onChange={(e) => handleAtualizarQuantidade(custo.id, parseFloat(e.target.value) || 0)}
                                className="w-20 h-8 text-xs"
                              />
                              <div className="text-xs text-gray-600">
                                R$ {custo.valorRealizado.toLocaleString('pt-BR')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>Qtd: {custo.quantidadeAcumulada.toFixed(2)}</div>
                              <div>Valor: R$ {custo.valorAcumulado.toLocaleString('pt-BR')}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>Qtd: {custo.quantidadeSaldo.toFixed(2)}</div>
                              <div>Valor: R$ {custo.valorSaldo.toLocaleString('pt-BR')}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {new Date(custo.mes + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow className="bg-gray-50 font-bold">
                        <TableCell colSpan={3}>TOTAIS (R$)</TableCell>
                        <TableCell>
                          R$ {custosMensais.reduce((sum, custo) => sum + custo.totalOrcamento, 0).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          R$ {custosMensais.reduce((sum, custo) => sum + (custo.valorAcumulado - custo.valorRealizado), 0).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          R$ {custosMensais.reduce((sum, custo) => sum + custo.valorRealizado, 0).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          R$ {custosMensais.reduce((sum, custo) => sum + custo.valorAcumulado, 0).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          R$ {custosMensais.reduce((sum, custo) => sum + custo.valorSaldo, 0).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
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
                  <Button onClick={handleAbrirNovoMes}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Mês
                  </Button>
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
              {documentos.length > 0 ? (
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
                              <span>{new Date(documento.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Assinantes:</span>
                              <span>{documento.ordemAssinatura.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">Progresso:</span>
                              <span>{Math.round((documento.ordemAssinatura.filter(a => a.status === 'assinado').length / documento.ordemAssinatura.length) * 100)}%</span>
                            </div>
                          </div>

                          {/* Barra de progresso */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progresso das Assinaturas</span>
                              <span>{Math.round((documento.ordemAssinatura.filter(a => a.status === 'assinado').length / documento.ordemAssinatura.length) * 100)}%</span>
                            </div>
                            <Progress 
                              value={(documento.ordemAssinatura.filter(a => a.status === 'assinado').length / documento.ordemAssinatura.length) * 100} 
                              className="h-2"
                            />
                          </div>

                          {/* Lista de assinaturas */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-gray-700">Ordem de Assinaturas</h4>
                            <div className="space-y-2">
                              {documento.ordemAssinatura
                                .sort((a, b) => a.ordem - b.ordem)
                                .map((assinatura, index) => (
                                <div key={assinatura.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                                      {assinatura.ordem}
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{assinatura.userName}</p>
                                      <p className="text-xs text-gray-600">{assinatura.role}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={getSignatureStatusColor(assinatura.status)}>
                                      {assinatura.status}
                                    </Badge>
                                    {assinatura.arquivoAssinado && (
                                      <Button size="sm" variant="outline">
                                        <Download className="w-3 h-3 mr-1" />
                                        Baixar
                                      </Button>
                                    )}
                                    {assinatura.docuSignLink && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => window.open(assinatura.docuSignLink, '_blank')}
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

                          {/* Próximo assinante */}
                          {documento.proximoAssinante && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-800">
                                Próximo a assinar: <strong>{documento.ordemAssinatura.find(a => a.userId === documento.proximoAssinante)?.userName}</strong>
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
              {arquivosAdicionais.length > 0 ? (
                <div className="space-y-4">
                  {arquivosAdicionais.map((arquivo) => (
                    <Card key={arquivo.id} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <File className="w-5 h-5 text-green-600" />
                            <div>
                              <CardTitle className="text-lg">{arquivo.nome}</CardTitle>
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
                              onClick={() => {
                                // Simular download
                                console.log('Download arquivo:', arquivo.nomeArquivo)
                                alert('Download iniciado!')
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
                            <span className="font-medium">{arquivo.nomeArquivo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Upload:</span>
                            <span>{new Date(arquivo.dataUpload).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Tamanho:</span>
                            <span>{formatarTamanhoArquivo(arquivo.tamanho)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <File className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Tipo:</span>
                            <span>{arquivo.tipo}</span>
                          </div>
                        </div>
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
                  onClick={() => setIsNovaEntradaOpen(true)}
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

                  {/* Lista de Entradas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Entradas do Livro</CardTitle>
                      <CardDescription>
                        {filteredEntradas.length} entradas encontradas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {filteredEntradas.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[120px]">Data</TableHead>
                                <TableHead className="w-[150px]">Grua</TableHead>
                                <TableHead className="w-[150px]">Funcionário</TableHead>
                                <TableHead className="w-[100px]">Tipo</TableHead>
                                <TableHead className="w-[100px]">Status</TableHead>
                                <TableHead className="min-w-[200px]">Descrição</TableHead>
                                <TableHead className="w-[150px]">Responsável Resolução</TableHead>
                                <TableHead className="w-[80px]">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredEntradas.map((entrada, index) => (
                                <TableRow key={index} className="hover:bg-gray-50">
                                  <TableCell className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-gray-500" />
                                      <span>{new Date(entrada.data).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(entrada.data).toLocaleTimeString('pt-BR', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                      <Wrench className="w-4 h-4 text-blue-600" />
                                      <span>{entrada.gruaName}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4 text-gray-500" />
                                      <span>{entrada.funcionarioName}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        entrada.tipo === 'checklist' ? 'bg-green-100 text-green-800' :
                                        entrada.tipo === 'manutencao' ? 'bg-blue-100 text-blue-800' :
                                        entrada.tipo === 'falha' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {entrada.tipo}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        entrada.status === 'ok' ? 'bg-green-100 text-green-800' :
                                        entrada.status === 'manutencao' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {entrada.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    <div className="max-w-[200px] truncate" title={entrada.descricao}>
                                      {entrada.descricao}
                                    </div>
                                    {entrada.observacoes && (
                                      <div className="text-xs text-gray-500 mt-1 truncate" title={entrada.observacoes}>
                                        Obs: {entrada.observacoes}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {entrada.responsavelResolucao ? (
                                      <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-500" />
                                        <span className="text-xs">{entrada.responsavelResolucao}</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleVisualizarEntrada(entrada)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma entrada encontrada</h3>
                          <p className="text-gray-600 mb-4">
                            Não há entradas que correspondam aos filtros selecionados.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
                        {new Date(entradaSelecionada.data).toLocaleString('pt-BR')}
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
                          entradaSelecionada.tipo === 'checklist' ? 'bg-green-100 text-green-800' :
                          entradaSelecionada.tipo === 'manutencao' ? 'bg-blue-100 text-blue-800' :
                          entradaSelecionada.tipo === 'falha' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {entradaSelecionada.tipo}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          entradaSelecionada.status === 'ok' ? 'bg-green-100 text-green-800' :
                          entradaSelecionada.status === 'manutencao' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {entradaSelecionada.status}
                      </Badge>
                    </div>
                    {entradaSelecionada.responsavelResolucao && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Responsável pela Resolução</Label>
                        <p className="text-sm">{entradaSelecionada.responsavelResolucao}</p>
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
                    key={mes} 
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      novoMesData.mes === mes ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setNovoMesData({ ...novoMesData, mes })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {new Date(mes + '-01').toLocaleDateString('pt-BR', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {new Date(mes + '-01').toLocaleDateString('pt-BR', { 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        {novoMesData.mes === mes && (
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
    </div>
  )
}
