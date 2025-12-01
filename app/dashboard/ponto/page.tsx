"use client"

import React, { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Play, Square, Coffee, User, AlertCircle, CheckCircle, Search, FileText, Check, X, MessageSquare, ChevronDown, ChevronUp, Download } from "lucide-react"
import { AprovacaoHorasExtrasDialog } from "@/components/aprovacao-horas-extras-dialog"
import { AuthService } from "@/app/lib/auth"
import { 
  apiFuncionarios, 
  apiRegistrosPonto, 
  apiJustificativas,
  apiRelatorios,
  apiHorasExtras,
  utilsPonto,
  type Funcionario,
  type RegistroPonto,
  type Justificativa
} from "@/lib/api-ponto-eletronico"
import { ExportButton } from "@/components/export-button"
import { Loading, PageLoading, TableLoading, CardLoading, useLoading } from "@/components/ui/loading"
import { AdvancedPagination } from "@/components/ui/advanced-pagination"
import { ProtectedRoute } from "@/components/protected-route"
import { WhatsAppTestButton } from "@/components/whatsapp-test-button"
import { PontoTestButtons } from "@/components/ponto-test-buttons"

// Estado inicial dos dados
const estadoInicial = {
  funcionarios: [] as Funcionario[],
  registrosPonto: [] as RegistroPonto[],
  justificativas: [] as Justificativa[],
  loading: false,
  error: null as string | null,
  isAdmin: false,
  usuarioAtual: null as { id: number, nome: string } | null
}

// Tipos para dados de gráficos

interface EstatisticasHorasExtras {
  total_registros: number
  total_horas_extras: number
  media_horas_extras: number
  max_horas_extras: number
  total_funcionarios: number
  media_por_funcionario: number
}

export default function PontoPage() {
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [selectedFuncionario, setSelectedFuncionario] = useState("")
  const [data, setData] = useState(estadoInicial)
  const [searchTerm, setSearchTerm] = useState("")
  const [isJustificativaOpen, setIsJustificativaOpen] = useState(false)
  const [justificativaData, setJustificativaData] = useState({
    funcionario_id: "",
    data: "",
    tipo: "",
    motivo: "",
  })
  
  // Estados para filtros e ordenação
  const [filtroFuncionario, setFiltroFuncionario] = useState("todos")
  const [filtroData, setFiltroData] = useState("")
  
  // Estados para aprovação de horas extras
  const [isAprovacaoOpen, setIsAprovacaoOpen] = useState(false)
  const [registroParaAprovacao, setRegistroParaAprovacao] = useState<RegistroPonto | null>(null)
  
  // Estados para modal de aprovação/rejeição
  const [isModalAprovacaoOpen, setIsModalAprovacaoOpen] = useState(false)
  const [registroParaModal, setRegistroParaModal] = useState<RegistroPonto | null>(null)
  const [tipoAcao, setTipoAcao] = useState<'aprovar' | 'rejeitar'>('aprovar')
  const [observacoesModal, setObservacoesModal] = useState('')
  const [justificativaModal, setJustificativaModal] = useState('')
  
  // Estados para edição de registros
  const [isEditarOpen, setIsEditarOpen] = useState(false)
  const [registroEditando, setRegistroEditando] = useState<RegistroPonto | null>(null)
  const [dadosEdicao, setDadosEdicao] = useState({
    entrada: "",
    saida_almoco: "",
    volta_almoco: "",
    saida: "",
    observacoes: "",
    justificativa_alteracao: "",
  })

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  // Estado para controlar justificativas expandidas
  const [justificativasExpandidas, setJustificativasExpandidas] = useState<Set<string | number>>(new Set())
  
  // Estado para filtro de busca por nome nas justificativas
  const [filtroNomeJustificativa, setFiltroNomeJustificativa] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  })

  // Estados para horas extras
  const [registrosHorasExtras, setRegistrosHorasExtras] = useState<RegistroPonto[]>([])
  const [estatisticasHorasExtras, setEstatisticasHorasExtras] = useState<EstatisticasHorasExtras | null>(null)
  const [loadingHorasExtras, setLoadingHorasExtras] = useState(false)
  const [registrosSelecionadosHorasExtras, setRegistrosSelecionadosHorasExtras] = useState<Set<string | number>>(new Set())


  // Estados para relatório mensal
  const [mesRelatorio, setMesRelatorio] = useState(new Date().getMonth() + 1)
  const [anoRelatorio, setAnoRelatorio] = useState(new Date().getFullYear())
  const [dadosRelatorioMensal, setDadosRelatorioMensal] = useState<any>(null)
  const [loadingRelatorioMensal, setLoadingRelatorioMensal] = useState(false)

  // Atualizar relógio a cada segundo (apenas no cliente)
  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Flag para controlar se já carregou dados iniciais
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const loadingRef = useRef(false)

  // Carregar dados iniciais apenas uma vez
  useEffect(() => {
    if (!dadosIniciaisCarregados && !loadingRef.current) {
      loadingRef.current = true
      carregarDados().finally(() => {
        setDadosIniciaisCarregados(true)
        loadingRef.current = false
      })
    }
  }, [dadosIniciaisCarregados])

  // Resetar página quando termo de busca mudar
  useEffect(() => {
    if (dadosIniciaisCarregados && searchTerm !== undefined) {
      setCurrentPage(1)
    }
  }, [searchTerm, dadosIniciaisCarregados])

  // Recarregar dados quando filtros ou paginação mudarem (com debounce)
  useEffect(() => {
    // Só recarregar se os dados iniciais já foram carregados
    if (!dadosIniciaisCarregados) return
    
    // Debounce para evitar múltiplas chamadas rápidas
    const timer = setTimeout(() => {
      if (!loadingRef.current) {
        loadingRef.current = true
        carregarDadosComFiltros().finally(() => {
          loadingRef.current = false
        })
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [filtroFuncionario, filtroData, searchTerm, currentPage, pageSize, dadosIniciaisCarregados])

  // Debug dos registros e filtros (apenas uma vez após carregar)
  useEffect(() => {
    if (data.registrosPonto.length > 0) {
      // Debug removido
    }
  }, [data.registrosPonto.length])

  // Função para carregar dados da API
  const carregarDados = async () => {
    setData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Obter ID do usuário atual via AuthService
      const currentUser = await AuthService.getCurrentUser()
      const usuarioId = currentUser.id
      
      // Carregar funcionários com verificação de admin e outros dados em paralelo
      // Recalcular apenas na primeira carga para melhor performance
      const [funcionariosResponse, registrosResponse, justificativasResponse] = await Promise.all([
        apiFuncionarios.listarParaPonto(usuarioId),
        apiRegistrosPonto.listar({ 
          page: currentPage, 
          limit: pageSize,
          recalcular: true // ✨ Recalcular apenas na primeira carga (sempre true aqui pois é a primeira)
        }),
        apiJustificativas.listar({})
      ])

      // Verificar se a resposta tem a estrutura esperada
      const isAdmin = funcionariosResponse?.isAdmin || false
      const funcionarios = funcionariosResponse?.funcionarios || []

      // Definir usuário atual (encontrar o funcionário que corresponde ao usuário logado)
      const usuarioAtual = funcionarios.find(f => f.id === usuarioId) || funcionarios[0] || null

      const registros = registrosResponse.data || []
      const paginationData = registrosResponse.pagination || { page: 1, limit: pageSize, total: registros.length, pages: 1 }
      
      setData(prev => ({
        ...prev,
        funcionarios: funcionarios,
        registrosPonto: registros,
        justificativas: justificativasResponse.data || [],
        isAdmin: isAdmin,
        usuarioAtual,
        loading: false
      }))
      
      setPagination(paginationData)

      // Definir funcionário selecionado padrão (usuário atual ou primeiro da lista)
      if (!selectedFuncionario && usuarioAtual) {
        setSelectedFuncionario(usuarioAtual.id.toString())
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar dados'
      }))
    }
  }

  // Função para carregar dados com filtros aplicados
  const carregarDadosComFiltros = async () => {
    try {
      // Construir parâmetros de filtro
      const filtros: any = {
        page: currentPage,
        limit: pageSize
      }

      // Adicionar filtros se não forem "todos" ou vazios
      if (filtroFuncionario !== "todos") {
        filtros.funcionario_id = filtroFuncionario
      }
      
      if (filtroData) {
        filtros.data = filtroData
      }

      // Adicionar busca textual se houver termo de pesquisa
      if (searchTerm && searchTerm.trim()) {
        filtros.search = searchTerm.trim()
      }

      // Carregar registros com filtros
      const registrosResponse = await apiRegistrosPonto.listar({
        ...filtros,
        recalcular: false, // ✨ Não recalcular em filtros para melhor performance
      })
      
      // Notificar se houve recalculação
      if (registrosResponse.recalculated) {
        toast({
          title: "✨ Dados Atualizados",
          description: "Alguns registros foram recalculados automaticamente"
        })
      }
      
      const registros = registrosResponse.data || []
      const paginationData = registrosResponse.pagination || { page: 1, limit: pageSize, total: registros.length, pages: 1 }

      // Atualizar apenas os registros e paginação, mantendo outros dados
      setData(prev => ({
        ...prev,
        registrosPonto: registros
      }))
      
      setPagination(paginationData)
    } catch (error) {
      console.error('Erro ao carregar dados com filtros:', error)
      toast({
        title: "Erro",
        description: "Erro ao aplicar filtros. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  // Função para limpar todos os filtros
  const limparFiltros = () => {
    setFiltroFuncionario("todos")
    setFiltroData("")
    setSearchTerm("")
    
    // Recarregar dados sem filtros
    carregarDados()
  }

  // Handlers para paginação
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset para primeira página
  }

  // Função para mapear tipos de registro para campos da API
  const mapearTipoParaCampo = (tipo: string) => {
    const mapeamento: { [key: string]: string } = {
      'Entrada': 'entrada',
      'Saída': 'saida',
      'Saída Almoço': 'saida_almoco',
      'Volta Almoço': 'volta_almoco'
    }
    return mapeamento[tipo] || tipo.toLowerCase().replace(' ', '_')
  }

  // Função para verificar o status do registro atual
  const getStatusRegistroAtual = () => {
    if (!selectedFuncionario) return null

    const agora = new Date()
    const dataAtual = agora.toISOString().split("T")[0]

    const registrosHoje = data.registrosPonto.filter(
      r => r.funcionario_id === parseInt(selectedFuncionario) && r.data === dataAtual
    )

    if (registrosHoje.length === 0) return null

    const registro = registrosHoje[0]
    return {
      temEntrada: !!registro.entrada,
      temSaida: !!registro.saida,
      temSaidaAlmoco: !!registro.saida_almoco,
      temVoltaAlmoco: !!registro.volta_almoco,
      registro
    }
  }

  const registrarPonto = async (tipo: string) => {
    if (!selectedFuncionario) {
      toast({
        title: "Informação",
        description: "Selecione um funcionário",
        variant: "default"
      })
      return
    }

    const agora = new Date()
    const horaAtual = agora.toTimeString().slice(0, 5)
    const dataAtual = agora.toISOString().split("T")[0]

    try {
      // Buscar registro existente para hoje
      const registrosHoje = data.registrosPonto.filter(
        r => r.funcionario_id === parseInt(selectedFuncionario) && r.data === dataAtual
      )

      let registroAtual = registrosHoje[0]

      if (!registroAtual) {
        // Criar novo registro
        const novoRegistro = await apiRegistrosPonto.criar({
          funcionario_id: parseInt(selectedFuncionario),
          data: dataAtual,
          [mapearTipoParaCampo(tipo)]: horaAtual,
          localizacao: "Sistema Web"
        })
        
        registroAtual = novoRegistro
        setData(prev => ({
          ...prev,
          registrosPonto: [novoRegistro, ...prev.registrosPonto]
        }))
      } else {
        // Atualizar registro existente
        const dadosAtualizacao: any = {
          [mapearTipoParaCampo(tipo)]: horaAtual,
          justificativa_alteracao: `Registro automático de ${tipo}`
        }

        const registroAtualizado = await apiRegistrosPonto.atualizar(registroAtual.id || '', dadosAtualizacao)
        
        setData(prev => ({
          ...prev,
          registrosPonto: prev.registrosPonto.map(r => 
            r.id === registroAtualizado.id ? registroAtualizado : r
          )
        }))
      }

      toast({
        title: "Sucesso",
        description: `Ponto registrado: ${tipo} às ${horaAtual}`,
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao registrar ponto:', error)
      toast({
        title: "Erro",
        description: "Erro ao registrar ponto. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  // ========================================
  // FUNÇÕES DE HORAS EXTRAS
  // ========================================

  // Carregar horas extras
  const carregarHorasExtras = async () => {
    setLoadingHorasExtras(true)
    try {
      const params: any = {
        page: 1,
        limit: 100
      }

      if (filtroFuncionario !== 'todos') {
        params.funcionario_id = filtroFuncionario
      }
      if (filtroData) {
        params.data = filtroData
      }

      // Buscar registros com os filtros aplicados
      const registros = await apiHorasExtras.listar(params)
      const registrosFiltrados = registros.data || []
      
      setRegistrosHorasExtras(registrosFiltrados)

      // Calcular estatísticas localmente baseado nos registros filtrados
      const estatisticasCalculadas = {
        total_registros: registrosFiltrados.length,
        total_horas_extras: registrosFiltrados.reduce((sum, r) => sum + (r.horas_extras || 0), 0),
        media_horas_extras: registrosFiltrados.length > 0 
          ? registrosFiltrados.reduce((sum, r) => sum + (r.horas_extras || 0), 0) / registrosFiltrados.length 
          : 0,
        max_horas_extras: registrosFiltrados.length > 0 
          ? Math.max(...registrosFiltrados.map(r => r.horas_extras || 0)) 
          : 0,
        total_funcionarios: new Set(registrosFiltrados.map(r => r.funcionario_id)).size,
        media_por_funcionario: 0
      }
      
      // Calcular média por funcionário
      if (estatisticasCalculadas.total_funcionarios > 0) {
        estatisticasCalculadas.media_por_funcionario = 
          estatisticasCalculadas.total_horas_extras / estatisticasCalculadas.total_funcionarios
      }

      setEstatisticasHorasExtras(estatisticasCalculadas)
    } catch (error) {
      console.error('Erro ao carregar horas extras:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as horas extras",
        variant: "destructive"
      })
    } finally {
      setLoadingHorasExtras(false)
    }
  }

  // Aprovar horas extras em lote
  const aprovarHorasExtrasLote = async (registroIds: (string | number)[]) => {
    try {
      const { message } = await apiHorasExtras.aprovarLote({
        registro_ids: registroIds,
        observacoes: "Aprovado em lote"
      })

      toast({
        title: "Sucesso",
        description: message
      })

      setRegistrosSelecionadosHorasExtras(new Set())
      carregarHorasExtras()
      carregarDadosComFiltros()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar os registros",
        variant: "destructive"
      })
    }
  }

  // Rejeitar horas extras em lote
  const rejeitarHorasExtrasLote = async (registroIds: (string | number)[], motivo: string) => {
    try {
      const { message } = await apiHorasExtras.rejeitarLote({
        registro_ids: registroIds,
        motivo
      })

      toast({
        title: "Sucesso",
        description: message
      })

      setRegistrosSelecionadosHorasExtras(new Set())
      carregarHorasExtras()
      carregarDadosComFiltros()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar os registros",
        variant: "destructive"
      })
    }
  }

  // Toggle seleção de registro de hora extra
  const toggleSelecionarHoraExtra = (id: string | number) => {
    const novoSet = new Set(registrosSelecionadosHorasExtras)
    if (novoSet.has(id)) {
      novoSet.delete(id)
    } else {
      novoSet.add(id)
    }
    setRegistrosSelecionadosHorasExtras(novoSet)
  }

  // Selecionar/desselecionar todos
  const toggleSelecionarTodosHorasExtras = () => {
    if (registrosSelecionadosHorasExtras.size === registrosHorasExtras.length) {
      setRegistrosSelecionadosHorasExtras(new Set())
    } else {
      const todosIds = new Set(registrosHorasExtras.map(r => r.id!))
      setRegistrosSelecionadosHorasExtras(todosIds)
    }
  }


  const carregarRelatorioMensal = async () => {
    try {
      setLoadingRelatorioMensal(true)
      
      // Buscar relatório mensal da API
      const relatorio = await apiRelatorios.mensal({
        mes: mesRelatorio,
        ano: anoRelatorio
      })
      
      setDadosRelatorioMensal(relatorio)
      
      toast({
        title: "Relatório Atualizado",
        description: `Dados carregados para ${mesRelatorio}/${anoRelatorio}`,
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao carregar relatório mensal:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o relatório mensal",
        variant: "destructive"
      })
    } finally {
      setLoadingRelatorioMensal(false)
    }
  }

  // ========================================
  // FUNÇÕES DE EXPORTAÇÃO
  // ========================================

  // Exportar relatório
  const exportarRelatorio = async (tipo: 'csv' | 'json' | 'pdf') => {
    try {
      const mes = mesRelatorio
      const ano = anoRelatorio

      if (tipo === 'pdf') {
        // Para PDF, fazer requisição direta para baixar o arquivo
        const token = localStorage.getItem('access_token')
        const response = await fetch(`/api/ponto-eletronico/relatorios/exportar?tipo=pdf&formato=mensal&mes=${mes}&ano=${ano}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Erro ao exportar PDF')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `relatorio_ponto_${mes}_${ano}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        const data = await apiRelatorios.exportar({
          tipo,
          formato: 'mensal',
          mes,
          ano
        })

        if (tipo === 'csv') {
          // Criar blob e fazer download
          const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `relatorio_ponto_${mes}_${ano}.csv`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }
      }

      toast({
        title: "Sucesso",
        description: `Relatório exportado em ${tipo.toUpperCase()}`
      })
    } catch (error) {
      console.error('Erro ao exportar relatório:', error)
      toast({
        title: "Erro",
        description: "Não foi possível exportar o relatório",
        variant: "destructive"
      })
    }
  }

  // Carregar horas extras quando os dados iniciais forem carregados
  useEffect(() => {
    if (dadosIniciaisCarregados && !loadingRef.current) {
      carregarHorasExtras()
    }
  }, [dadosIniciaisCarregados])

  // Carregar relatório mensal automaticamente quando os dados iniciais forem carregados
  useEffect(() => {
    if (dadosIniciaisCarregados && !loadingRelatorioMensal) {
      carregarRelatorioMensal()
    }
  }, [dadosIniciaisCarregados])

  // useEffect para carregar horas extras quando filtros mudarem (com debounce)
  useEffect(() => {
    // Só carregar se os dados iniciais já foram carregados
    if (!dadosIniciaisCarregados) return
    
    // Debounce para evitar múltiplas chamadas rápidas
    const timer = setTimeout(() => {
      if (!loadingRef.current) {
        carregarHorasExtras()
      }
    }, 400)
    
    return () => clearTimeout(timer)
  }, [filtroFuncionario, filtroData, dadosIniciaisCarregados])

  // Os dados já vêm filtrados da API, então não precisamos filtrar novamente
  const filteredRegistros = data.registrosPonto

  const sortedRegistros = filteredRegistros
    .sort((a, b) => {
      // Ordenação por data (mais recente primeiro)
      return new Date(b.data).getTime() - new Date(a.data).getTime()
    })

  const getStatusBadge = (status: string) => {
    // Tratar "Em Andamento" como "Incompleto"
    const statusTratado = status === 'Em Andamento' ? 'Incompleto' : status
    const badge = utilsPonto.obterBadgeStatus(statusTratado)
    return <Badge className={badge.className}>{badge.text}</Badge>
  }

  // Nova função para determinar status visual e ações baseadas nas horas extras
  const getRegistroStatusInfo = (registro: RegistroPonto) => {
    const horasTrabalhadas = registro.horas_trabalhadas || 0
    const horasExtras = registro.horas_extras || 0
    const status = registro.status || ''
    
    // Se foi aprovado - Verde / Ver Info
    if (status === 'Aprovado' || status === 'Autorizado') {
      return {
        status: 'aprovado',
        cor: 'green',
        badge: <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors whitespace-nowrap flex items-center gap-1">
          <span className="text-xs">✓</span>
          <span>Aprovado</span>
        </Badge>,
        acoes: [
          <Button
            key="info"
            size="sm"
            variant="outline"
            onClick={() => abrirEdicao(registro)}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            Ver Info
          </Button>
        ]
      }
    }
    
    // Se tem horas para aprovar - Laranja + Botão aprovar/reprovar
    if (horasExtras > 0 && (status === 'Pendente Aprovação' || status === 'Pendente')) {
      return {
        status: 'pendente_aprovacao',
        cor: 'orange',
        badge: <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 transition-colors whitespace-nowrap flex items-center gap-1">
          <span className="text-xs">⏳</span>
          <span>Pendente</span>
        </Badge>,
        acoes: [
          <Button
            key="aprovar"
            size="sm"
            onClick={() => abrirModalAprovacao(registro, 'aprovar')}
            className="bg-green-600 hover:bg-green-700 text-white hover:shadow-md transition-all"
          >
            ✓ Aprovar
          </Button>,
          <Button
            key="reprovar"
            size="sm"
            variant="outline"
            onClick={() => abrirModalAprovacao(registro, 'rejeitar')}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            ✗ Reprovar
          </Button>
        ]
      }
    }
    
    // Se estiver sem horas extras mas com horas = 8 - Cinza Escuro / Ver info
    if (horasTrabalhadas >= 8 && horasExtras === 0) {
      return {
        status: 'normal',
        cor: 'gray',
        badge: <Badge className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors whitespace-nowrap flex items-center gap-1">
          <span className="text-xs">📋</span>
          <span>Normal</span>
        </Badge>,
        acoes: [
          <Button
            key="info"
            size="sm"
            variant="outline"
            onClick={() => abrirEdicao(registro)}
            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
          >
            Ver Info
          </Button>
        ]
      }
    }
    
    // Se tiver horas negativas - Vermelho / Botão Justificar
    if (horasTrabalhadas < 8 && horasTrabalhadas > 0) {
      return {
        status: 'horas_negativas',
        cor: 'red',
        badge: <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-colors whitespace-nowrap flex items-center gap-1">
          <span className="text-xs">⚠️</span>
          <span>Insuficiente</span>
        </Badge>,
        acoes: [
          <Button
            key="justificar"
            size="sm"
            onClick={() => abrirJustificativa(registro)}
            className="bg-red-600 hover:bg-red-700 text-white hover:shadow-md transition-all"
          >
            Justificar
          </Button>
        ]
      }
    }
    
    // Se está em andamento - Amarelo / Incompleto
    if (status === 'Em Andamento') {
      return {
        status: 'incompleto',
        cor: 'yellow',
        badge: <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 transition-colors whitespace-nowrap flex items-center gap-1">
          <span className="text-xs">⚠️</span>
          <span>Incompleto</span>
        </Badge>,
        acoes: [
          <Button
            key="info"
            size="sm"
            variant="outline"
            onClick={() => abrirEdicao(registro)}
            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
          >
            Ver Info
          </Button>
        ]
      }
    }

    // Status padrão
    return {
      status: 'indefinido',
      cor: 'gray',
      badge: <Badge className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors whitespace-nowrap flex items-center gap-1">
        <span className="text-xs">❓</span>
        <span>{status || 'Indefinido'}</span>
      </Badge>,
      acoes: [
        <Button
          key="info"
          size="sm"
          variant="outline"
          onClick={() => abrirEdicao(registro)}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          Ver Info
        </Button>
      ]
    }
  }

  const handleJustificativa = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await apiJustificativas.criar({
        funcionario_id: parseInt(justificativaData.funcionario_id),
        data: justificativaData.data,
        tipo: justificativaData.tipo,
        motivo: justificativaData.motivo
      })

      toast({
        title: "Informação",
        description: "Justificativa enviada com sucesso!",
        variant: "default"
      })
      setJustificativaData({
        funcionario_id: "",
        data: "",
        tipo: "",
        motivo: "",
      })
      setIsJustificativaOpen(false)
      
      // Recarregar dados
      carregarDados()
    } catch (error) {
      console.error('Erro ao criar justificativa:', error)
      toast({
        title: "Informação",
        description: "Erro ao enviar justificativa. Tente novamente.",
        variant: "default"
      })
    }
  }

  const handleAprovarJustificativa = async (id: string) => {
    try {
      await apiJustificativas.aprovar(id)
      toast({
        title: "Informação",
        description: "Justificativa aprovada com sucesso!",
        variant: "default"
      })
      carregarDados()
    } catch (error) {
      console.error("Erro ao aprovar justificativa:", error)
      toast({
        title: "Informação",
        description: "Erro ao aprovar justificativa. Tente novamente.",
        variant: "default"
      })
    }
  }

  const handleRejeitarJustificativa = async (id: string) => {
    const motivoRejeicao = prompt("Digite o motivo da rejeição:")
    if (!motivoRejeicao) return

    try {
      await apiJustificativas.rejeitar(id, motivoRejeicao)
      toast({
        title: "Informação",
        description: "Justificativa rejeitada com sucesso!",
        variant: "default"
      })
      carregarDados()
    } catch (error) {
      console.error("Erro ao rejeitar justificativa:", error)
      toast({
        title: "Informação",
        description: "Erro ao rejeitar justificativa. Tente novamente.",
        variant: "default"
      })
    }
  }

  // Função para alternar expansão de justificativa
  const toggleJustificativa = (id: string | number) => {
    setJustificativasExpandidas(prev => {
      const novo = new Set(prev)
      if (novo.has(id)) {
        novo.delete(id)
      } else {
        novo.add(id)
      }
      return novo
    })
  }

  // Função para fazer download de arquivo de justificativa
  const handleDownloadArquivo = async (url: string, nomeArquivo: string) => {
    try {
      // Se a URL é relativa, construir a URL completa
      let urlCompleta = url
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
        urlCompleta = `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`
      }

      // Fazer download usando a API para incluir autenticação
      const token = localStorage.getItem('token') || localStorage.getItem('access_token')
      const response = await fetch(urlCompleta, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      })

      if (!response.ok) {
        throw new Error('Erro ao baixar arquivo')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = nomeArquivo
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      toast({
        title: "Sucesso",
        description: "Arquivo baixado com sucesso!",
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao fazer download:', error)
      toast({
        title: "Erro",
        description: "Não foi possível fazer o download do arquivo.",
        variant: "destructive"
      })
    }
  }

  // Função para abrir modal de edição
  const abrirEdicao = (registro: RegistroPonto) => {
    setRegistroEditando(registro)
    setDadosEdicao({
      entrada: registro.entrada || "",
      saida_almoco: registro.saida_almoco || "",
      volta_almoco: registro.volta_almoco || "",
      saida: registro.saida || "",
      observacoes: registro.observacoes || "",
      justificativa_alteracao: "",
    })
    setIsEditarOpen(true)
  }

  const abrirModalAprovacao = (registro: RegistroPonto, tipo: 'aprovar' | 'rejeitar') => {
    setRegistroParaModal(registro)
    setTipoAcao(tipo)
    setObservacoesModal('')
    setJustificativaModal('')
    setIsModalAprovacaoOpen(true)
  }

  const abrirJustificativa = (registro: RegistroPonto) => {
    setJustificativaData({
      funcionario_id: registro.funcionario_id.toString(),
      data: registro.data,
      tipo: "Falta de Horas",
      motivo: "",
    })
    setIsJustificativaOpen(true)
  }

  // Componente para toggle de entrada (mostra saída do almoço)
  const ToggleEntrada = ({ registro }: { registro: RegistroPonto }) => {
    const [isOpen, setIsOpen] = useState(false)
    
    if (!registro.entrada) {
      return <span className="text-gray-400">-</span>
    }

    return (
      <div className="relative">
        <button
          className="font-medium cursor-pointer"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {registro.entrada}
        </button>
        {isOpen && (
          <div className="absolute z-10 top-8 left-0 bg-white border rounded-lg shadow-lg p-3 min-w-[200px]">
            <div className="text-sm">
              <div className="font-medium text-gray-900 mb-1">Entrada</div>
              <div className="text-gray-600">{registro.entrada}</div>
              {registro.saida_almoco && (
                <>
                  <div className="font-medium text-gray-900 mt-2 mb-1">Saída Almoço</div>
                  <div className="text-gray-600">{registro.saida_almoco}</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Componente para toggle de saída (mostra volta do almoço)
  const ToggleSaida = ({ registro }: { registro: RegistroPonto }) => {
    const [isOpen, setIsOpen] = useState(false)
    
    if (!registro.saida) {
      return <span className="text-gray-400">-</span>
    }

    return (
      <div className="relative">
        <button
          className="font-medium cursor-pointer"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {registro.saida}
        </button>
        {isOpen && (
          <div className="absolute z-10 top-8 left-0 bg-white border rounded-lg shadow-lg p-3 min-w-[200px]">
            <div className="text-sm">
              <div className="font-medium text-gray-900 mb-1">Saída</div>
              <div className="text-gray-600">{registro.saida}</div>
              {registro.volta_almoco && (
                <>
                  <div className="font-medium text-gray-900 mt-2 mb-1">Volta Almoço</div>
                  <div className="text-gray-600">{registro.volta_almoco}</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Funções para aprovação de horas extras
  const abrirAprovacao = (registro: RegistroPonto) => {
    setRegistroParaAprovacao(registro)
    setIsAprovacaoOpen(true)
  }

  const fecharAprovacao = () => {
    setIsAprovacaoOpen(false)
    setRegistroParaAprovacao(null)
  }

  const handleAprovarHorasExtras = async (gestorId: number, observacoes: string) => {
    if (!registroParaAprovacao) return

    try {
      // Simular envio para aprovação
      // Em produção, isso chamaria a API real

      // Atualizar status do registro
      await apiRegistrosPonto.atualizar(registroParaAprovacao.id || '', {
        observacoes: observacoes,
        justificativa_alteracao: `Enviado para aprovação do gestor: ${observacoes}`
      })

      toast({
        title: "Sucesso",
        description: "Horas extras enviadas para aprovação do gestor",
        variant: "default"
      })

      carregarDados()
      fecharAprovacao()
    } catch (error) {
      console.error('Erro ao enviar para aprovação:', error)
      toast({
        title: "Erro",
        description: "Erro ao enviar para aprovação",
        variant: "destructive"
      })
    }
  }


  // Função para aprovar horas extras diretamente (para administradores)
  const handleAprovarDireto = async () => {
    if (!registroParaModal) return
    
    try {
      if (!justificativaModal.trim()) {
        toast({
          title: "Erro",
          description: "Justificativa da aprovação é obrigatória",
          variant: "destructive"
        })
        return
      }
      
      await apiRegistrosPonto.atualizar(registroParaModal.id || '', {
        observacoes: observacoesModal,
        justificativa_alteracao: justificativaModal,
        status: 'Aprovado'
      })

      toast({
        title: "Sucesso",
        description: "Horas extras aprovadas com sucesso!",
        variant: "default"
      })

      setIsModalAprovacaoOpen(false)
      carregarDados()
    } catch (error) {
      console.error('Erro ao aprovar horas extras:', error)
      toast({
        title: "Erro",
        description: "Erro ao aprovar horas extras",
        variant: "destructive"
      })
    }
  }

  // Função para rejeitar horas extras
  const handleRejeitarDireto = async () => {
    if (!registroParaModal) return
    
    try {
      if (!justificativaModal.trim()) {
        toast({
          title: "Erro",
          description: "Motivo da rejeição é obrigatório",
          variant: "destructive"
        })
        return
      }

      await apiRegistrosPonto.atualizar(registroParaModal.id || '', {
        observacoes: observacoesModal,
        justificativa_alteracao: `Rejeição: ${justificativaModal}`,
        status: 'Rejeitado'
      })

      toast({
        title: "Sucesso",
        description: "Horas extras rejeitadas",
        variant: "default"
      })

      setIsModalAprovacaoOpen(false)
      carregarDados()
    } catch (error) {
      console.error('Erro ao rejeitar horas extras:', error)
      toast({
        title: "Erro",
        description: "Erro ao rejeitar horas extras",
        variant: "destructive"
      })
    }
  }

  // Função para salvar edição
  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!registroEditando) return

    try {
      const registroAtualizado = await apiRegistrosPonto.atualizar(registroEditando.id || '', {
        entrada: dadosEdicao.entrada,
        saida_almoco: dadosEdicao.saida_almoco,
        volta_almoco: dadosEdicao.volta_almoco,
        saida: dadosEdicao.saida,
        observacoes: dadosEdicao.observacoes,
        justificativa_alteracao: dadosEdicao.justificativa_alteracao
      })
      
      // Atualizar estado local
      setData(prev => ({
        ...prev,
        registrosPonto: prev.registrosPonto.map(r => 
          r.id === registroAtualizado.id ? registroAtualizado : r
        )
      }))
      
      // Fechar modal e limpar dados
      setIsEditarOpen(false)
      setRegistroEditando(null)
      setDadosEdicao({
        entrada: "",
        saida_almoco: "",
        volta_almoco: "",
        saida: "",
        observacoes: "",
        justificativa_alteracao: "",
      })
      
      toast({
        title: "Informação",
        description: "Registro atualizado com sucesso!",
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao atualizar registro:', error)
      toast({
        title: "Informação",
        description: "Erro ao atualizar registro. Tente novamente.",
        variant: "default"
      })
    }
  }

  const stats = [
    {
      title: "Funcionários Presentes",
      value: data.registrosPonto.filter((r) => r.status === "Em Andamento" || r.status === "Completo").length,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Atrasos Hoje",
      value: data.registrosPonto.filter((r) => r.status === "Atraso").length,
      icon: AlertCircle,
      color: "bg-yellow-500",
    },
    {
      title: "Horas Extras Pendentes",
      value: data.registrosPonto.filter((r) => r.status === "Pendente Aprovação").length,
      icon: Clock,
      color: "bg-orange-500",
    },
    {
      title: "Total Horas Extras",
      value: data.registrosPonto.reduce((total, r) => total + (r.horas_extras || 0), 0),
      icon: Clock,
      color: "bg-purple-500",
    },
  ]

  return (
    <ProtectedRoute permission="ponto_eletronico:visualizar" showAccessDenied={true}>
      <div className="space-y-6">
        {/* Botões de Teste - Apenas em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <PontoTestButtons />
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ponto Eletrônico</h1>
          <p className="text-gray-600">Sistema de controle de frequência dos funcionários</p>
        </div>
        <div className="flex gap-2">
          <WhatsAppTestButton variant="outline" size="default" />
          <ExportButton
            dados={sortedRegistros}
            tipo="ponto"
            nomeArquivo="relatorio-ponto"
            titulo="Relatório de Ponto Eletrônico"
            onExport={async (formato) => {
              if (formato === 'pdf') {
                await exportarRelatorio('pdf')
              } else if (formato === 'csv') {
                await exportarRelatorio('csv')
              } else {
                // Excel/JSON
                await exportarRelatorio('json')
              }
            }}
          />
          <Dialog open={isJustificativaOpen} onOpenChange={setIsJustificativaOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent">
                <FileText className="w-4 h-4 mr-2" />
                Justificativa
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Justificativa</DialogTitle>
              <DialogDescription>Registre justificativas para atrasos, faltas ou saídas antecipadas</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleJustificativa} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="funcionario">Funcionário</Label>
                <Select
                  value={justificativaData.funcionario_id}
                  onValueChange={(value) => setJustificativaData({ ...justificativaData, funcionario_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                <SelectContent>
                  {data.funcionarios.map((func) => (
                    <SelectItem key={func.id} value={func.id.toString()}>
                      {func.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={justificativaData.data}
                    onChange={(e) => setJustificativaData({ ...justificativaData, data: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={justificativaData.tipo}
                    onValueChange={(value) => setJustificativaData({ ...justificativaData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Atraso">Atraso</SelectItem>
                      <SelectItem value="Falta">Falta</SelectItem>
                      <SelectItem value="Saída Antecipada">Saída Antecipada</SelectItem>
                      <SelectItem value="Ausência Parcial">Ausência Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo</Label>
                <Textarea
                  id="motivo"
                  value={justificativaData.motivo}
                  onChange={(e) => setJustificativaData({ ...justificativaData, motivo: e.target.value })}
                  placeholder="Descreva o motivo da justificativa..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsJustificativaOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Registrar
                </Button>
              </div>
            </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Modal de Edição de Registro */}
      <Dialog open={isEditarOpen} onOpenChange={setIsEditarOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Registro de Ponto</DialogTitle>
              <DialogDescription>
                Edite os horários e adicione justificativas para o registro
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={salvarEdicao} className="space-y-4">
              {/* Informações do funcionário */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Funcionário</h3>
                <p className="text-lg font-medium">{registroEditando?.funcionario?.nome || 'Funcionário não encontrado'}</p>
                <p className="text-sm text-gray-600">
                  Data: {registroEditando?.data && new Date(registroEditando.data).toLocaleDateString("pt-BR")}
                </p>
              </div>

              {/* Horários */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entrada">Entrada</Label>
                  <Input
                    id="entrada"
                    type="time"
                    value={dadosEdicao.entrada}
                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, entrada: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saida">Saída</Label>
                  <Input
                    id="saida"
                    type="time"
                    value={dadosEdicao.saida}
                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, saida: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saidaAlmoco">Saída Almoço</Label>
                  <Input
                    id="saidaAlmoco"
                    type="time"
                    value={dadosEdicao.saida_almoco}
                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, saida_almoco: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voltaAlmoco">Volta Almoço</Label>
                  <Input
                    id="voltaAlmoco"
                    type="time"
                    value={dadosEdicao.volta_almoco}
                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, volta_almoco: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Cálculo automático de horas */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Cálculo Automático</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Horas Trabalhadas:</span>
                    <span className="ml-2 font-medium">
                      {(utilsPonto.calcularHorasTrabalhadas(
                        dadosEdicao.entrada,
                        dadosEdicao.saida,
                        dadosEdicao.saida_almoco,
                        dadosEdicao.volta_almoco
                      ) || 0).toFixed(2)}h
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Horas Extras:</span>
                    {(() => {
                      const horasTrabalhadas = utilsPonto.calcularHorasTrabalhadas(
                        dadosEdicao.entrada,
                        dadosEdicao.saida,
                        dadosEdicao.saida_almoco,
                        dadosEdicao.volta_almoco
                      ) || 0;
                      const horasExtras = horasTrabalhadas - 8;
                      
                      if (horasExtras > 0) {
                        return (
                          <span className="ml-2 font-medium text-orange-600">
                            +{horasExtras.toFixed(2)}h
                          </span>
                        );
                      } else if (horasExtras < 0) {
                        return (
                          <span className="ml-2 font-medium text-red-600">
                            {horasExtras.toFixed(2)}h
                          </span>
                        );
                      } else {
                        return (
                          <span className="ml-2 font-medium text-gray-600">
                            {horasExtras.toFixed(2)}h
                          </span>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={dadosEdicao.observacoes}
                  onChange={(e) => setDadosEdicao({ ...dadosEdicao, observacoes: e.target.value })}
                  placeholder="Descreva as observações sobre o registro..."
                  rows={3}
                />
              </div>

              {/* Justificativa */}
              <div className="space-y-2">
                <Label htmlFor="justificativa">Justificativa da Alteração</Label>
                <Textarea
                  id="justificativa"
                  value={dadosEdicao.justificativa_alteracao}
                  onChange={(e) => setDadosEdicao({ ...dadosEdicao, justificativa_alteracao: e.target.value })}
                  placeholder="Explique o motivo da alteração nos horários..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditarOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registro de Ponto */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Registrar Ponto
            </CardTitle>
            <CardDescription>Registre entrada, saída e intervalos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Relógio Digital */}
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-blue-600">
                {isClient && currentTime ? currentTime.toTimeString().slice(0, 8) : '--:--:--'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {isClient && currentTime ? currentTime.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) : 'Carregando...'}
              </div>
            </div>

            {/* Status do Registro Atual */}
            {(() => {
              const status = getStatusRegistroAtual()
              if (!status) return null

              return (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Status do Registro de Hoje</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.temEntrada ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={status.temEntrada ? 'text-green-700' : 'text-gray-500'}>
                        Entrada: {status.temEntrada ? status.registro.entrada : 'Não registrada'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.temSaida ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                      <span className={status.temSaida ? 'text-red-700' : 'text-gray-500'}>
                        Saída: {status.temSaida ? status.registro.saida : 'Não registrada'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.temSaidaAlmoco ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                      <span className={status.temSaidaAlmoco ? 'text-yellow-700' : 'text-gray-500'}>
                        Saída Almoço: {status.temSaidaAlmoco ? status.registro.saida_almoco : 'Não registrada'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.temVoltaAlmoco ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                      <span className={status.temVoltaAlmoco ? 'text-yellow-700' : 'text-gray-500'}>
                        Volta Almoço: {status.temVoltaAlmoco ? status.registro.volta_almoco : 'Não registrada'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Seleção de Funcionário */}
            <div className="space-y-2">
              <Label htmlFor="funcionario">Funcionário</Label>
              <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {data.funcionarios.length > 0 ? (
                    data.funcionarios.map((func) => (
                      <SelectItem key={func.id} value={func.id.toString()}>
                        {func.nome} - {func.cargo || 'Sem cargo'}
                        {data.usuarioAtual?.id === func.id && ' (Você)'}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      Nenhum funcionário disponível
                    </div>
                  )}
                </SelectContent>
              </Select>
              {selectedFuncionario && data.usuarioAtual?.id === parseInt(selectedFuncionario) && (
                <p className="text-xs text-gray-500">Seu registro de ponto</p>
              )}
            </div>

            {/* Botões de Registro */}
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                const status = getStatusRegistroAtual()
                const podeEntrada = !status || (!status.temEntrada || status.temSaida)
                const podeSaida = status && status.temEntrada && !status.temSaida
                const podeSaidaAlmoco = status && status.temEntrada && !status.temSaidaAlmoco
                const podeVoltaAlmoco = status && status.temSaidaAlmoco && !status.temVoltaAlmoco

                return (
                  <>
                    <Button
                      onClick={() => registrarPonto("Entrada")}
                      disabled={!podeEntrada}
                      className={`flex items-center gap-2 ${
                        podeEntrada 
                          ? "bg-green-600 hover:bg-green-700" 
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      title={!podeEntrada ? "Já existe uma entrada sem saída registrada" : ""}
                    >
                      <Play className="w-4 h-4" />
                      Entrada
                    </Button>
                    <Button
                      onClick={() => registrarPonto("Saída")}
                      disabled={!podeSaida}
                      className={`flex items-center gap-2 ${
                        podeSaida 
                          ? "bg-red-600 hover:bg-red-700" 
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      title={!podeSaida ? "Registre a entrada primeiro" : ""}
                    >
                      <Square className="w-4 h-4" />
                      Saída
                    </Button>
                    <Button
                      onClick={() => registrarPonto("Saída Almoço")}
                      disabled={!podeSaidaAlmoco}
                      variant="outline"
                      className={`flex items-center gap-2 ${
                        !podeSaidaAlmoco ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      title={!podeSaidaAlmoco ? "Registre a entrada primeiro" : ""}
                    >
                      <Coffee className="w-4 h-4" />
                      Saída Almoço
                    </Button>
                    <Button
                      onClick={() => registrarPonto("Volta Almoço")}
                      disabled={!podeVoltaAlmoco}
                      variant="outline"
                      className={`flex items-center gap-2 ${
                        !podeVoltaAlmoco ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      title={!podeVoltaAlmoco ? "Registre a saída para almoço primeiro" : ""}
                    >
                      <Coffee className="w-4 h-4" />
                      Volta Almoço
                    </Button>
                  </>
                )
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Registros Recentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registros de Hoje</CardTitle>
            <CardDescription>Acompanhe os registros de ponto do dia atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.registrosPonto.slice(0, 4).map((registro) => (
                <div key={registro.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{registro.funcionario?.nome || 'Funcionário não encontrado'}</p>
                      <p className="text-sm text-gray-500">
                        Entrada: {registro.entrada || 'Não registrada'} | Saída: {registro.saida || "Em andamento"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(registro.status || '')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="registros">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="registros">Registros de Ponto</TabsTrigger>
          <TabsTrigger value="horas-extras">Controle de Horas Extras</TabsTrigger>
          <TabsTrigger value="justificativas">Justificativas</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório Mensal</TabsTrigger>
        </TabsList>

        <TabsContent value="registros">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Registros</CardTitle>
              <CardDescription>Visualize todos os registros de ponto dos funcionários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {/* Barra de busca */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por funcionário, data ou status..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filtros avançados */}
                <div className="flex items-end gap-4">
                  {/* Filtro por funcionário */}
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="filtro-funcionario">Funcionário</Label>
                    <Select
                      value={filtroFuncionario}
                      onValueChange={setFiltroFuncionario}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os funcionários" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os funcionários</SelectItem>
                        {data.funcionarios.map((func) => (
                          <SelectItem key={func.id} value={func.id.toString()}>
                            {func.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por data */}
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="filtro-data">Data</Label>
                    <Input
                      id="filtro-data"
                      type="date"
                      value={filtroData}
                      onChange={(e) => setFiltroData(e.target.value)}
                    />
                  </div>

                  {/* Botão para limpar filtros */}
                  <Button
                    variant="outline"
                    onClick={limparFiltros}
                  >
                    Limpar Filtros
                  </Button>
                </div>

                {/* Indicador de resultados */}
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      {sortedRegistros.length} registro(s) encontrado(s)
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {filtroFuncionario !== "todos" && `Funcionário: ${filtroFuncionario}`}
                    {filtroData && ` | Data: ${filtroData}`}
                    {(!filtroFuncionario || filtroFuncionario === "todos") && !filtroData && " | Ordenado: Mais recente"}
                  </div>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Horas Trabalhadas</TableHead>
                      <TableHead>Horas Extras</TableHead>
                      <TableHead>Horas Negativas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRegistros.map((registro) => {
                      // Verificar se está em atraso (múltiplas variações do status)
                      const isAtraso = registro.status === 'Atraso' || 
                                      registro.status === 'atraso' || 
                                      registro.status?.toLowerCase().includes('atraso') ||
                                      registro.status === 'Atrasado' ||
                                      registro.status === 'atrasado'
                      
                      // Verificar se tem registros incompletos (sem saída do almoço, volta do almoço ou saída)
                      const isIncompleto = (!registro.saida_almoco && registro.entrada) || 
                                         (!registro.volta_almoco && registro.saida_almoco) || 
                                         (!registro.saida && registro.volta_almoco)
                      
                      // Aplicar cores condicionais (removidas para manter texto preto)
                      const nomeColor = ''
                      const dataColor = ''
                      
                      return (
                        <TableRow key={registro.id}>
                          <TableCell className={`font-medium ${nomeColor}`}>
                            <div className="flex items-center gap-2">
                              {(registro.horas_extras || 0) > 0 && 
                               registro.status !== 'Pendente Aprovação' && 
                               registro.status !== 'Aprovado' && 
                               registro.status !== 'Autorizado' && 
                               registro.status !== 'Rejeitado' && (
                              <button
                                onClick={() => abrirAprovacao(registro)}
                                className="p-2 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors shadow-sm"
                                title="Enviar para Aprovação"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-4 h-4">
                                  <path fill="currentColor" d="M144 224C161.7 224 176 238.3 176 256L176 512C176 529.7 161.7 544 144 544L96 544C78.3 544 64 529.7 64 512L64 256C64 238.3 78.3 224 96 224L144 224zM334.6 80C361.9 80 384 102.1 384 129.4L384 133.6C384 140.4 382.7 147.2 380.2 153.5L352 224L512 224C538.5 224 560 245.5 560 272C560 291.7 548.1 308.6 531.1 316C548.1 323.4 560 340.3 560 360C560 383.4 543.2 402.9 521 407.1C525.4 414.4 528 422.9 528 432C528 454.2 513 472.8 492.6 478.3C494.8 483.8 496 489.8 496 496C496 522.5 474.5 544 448 544L360.1 544C323.8 544 288.5 531.6 260.2 508.9L248 499.2C232.8 487.1 224 468.7 224 449.2L224 262.6C224 247.7 227.5 233 234.1 219.7L290.3 107.3C298.7 90.6 315.8 80 334.6 80z"/>
                                </svg>
                              </button>
                            )}
                            <span>{registro.funcionario?.nome || 'Funcionário não encontrado'}</span>
                            {isAtraso && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">ATRASO</span>}
                            {isIncompleto && !isAtraso && <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">INCOMPLETO</span>}
                          </div>
                        </TableCell>
                        <TableCell>{utilsPonto.formatarData(registro.data)}</TableCell>
                        <TableCell>
                          <ToggleEntrada registro={registro} />
                        </TableCell>
                        <TableCell>
                          <ToggleSaida registro={registro} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {registro.horas_trabalhadas}h
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const horasExtras = registro.horas_extras || 0;
                            if (horasExtras > 0) {
                              return (
                                <Badge className="bg-orange-100 text-orange-800">
                                  +{horasExtras}h
                                </Badge>
                              );
                            } else if (horasExtras < 0) {
                              return (
                                <Badge className="bg-red-100 text-red-800">
                                  {horasExtras}h
                                </Badge>
                              );
                            } else {
                              return <span className="text-gray-400">-</span>;
                            }
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            // Calcular horas trabalhadas dinamicamente considerando horários de almoço
                            const horasTrabalhadas = utilsPonto.calcularHorasTrabalhadas(
                              registro.entrada,
                              registro.saida,
                              registro.saida_almoco,
                              registro.volta_almoco
                            );
                            const horasNegativas = horasTrabalhadas < 8 ? 8 - horasTrabalhadas : 0;
                            
                            if (horasNegativas > 0) {
                              return (
                                <Badge className="bg-red-50 text-red-700 border-red-200">
                                  -{horasNegativas.toFixed(1)}h
                                </Badge>
                              );
                            } else {
                              return <span className="text-gray-400">-</span>;
                            }
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const statusInfo = getRegistroStatusInfo(registro)
                            return statusInfo.badge
                          })()}
                        </TableCell>
                        <TableCell>
                          {registro.aprovador?.nome ? (
                            <span className="text-sm font-medium">{registro.aprovador.nome}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {(() => {
                              const statusInfo = getRegistroStatusInfo(registro)
                              return statusInfo.acoes
                            })()}
                          </div>
                        </TableCell>
                      </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação Avançada */}
              <AdvancedPagination
                currentPage={pagination?.page || currentPage}
                totalPages={pagination?.pages || 1}
                totalItems={pagination?.total || 0}
                itemsPerPage={pageSize}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemsPerPageOptions={[10, 20, 50, 100]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horas-extras">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Controle de Horas Extras</CardTitle>
                  <CardDescription>Gerencie e aprove horas extras dos funcionários</CardDescription>
                </div>
                {registrosSelecionadosHorasExtras.size > 0 && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => aprovarHorasExtrasLote(Array.from(registrosSelecionadosHorasExtras))}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Aprovar {registrosSelecionadosHorasExtras.size}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const motivo = prompt('Motivo da rejeição:')
                        if (motivo) {
                          rejeitarHorasExtrasLote(Array.from(registrosSelecionadosHorasExtras), motivo)
                        }
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rejeitar {registrosSelecionadosHorasExtras.size}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div >
                {/* Estatísticas de Horas Extras */}
                {estatisticasHorasExtras && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-full">
                            <Clock className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Registros</p>
                            <p className="text-2xl font-bold">{estatisticasHorasExtras.total_registros}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-full">
                            <Clock className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Horas</p>
                            <p className="text-2xl font-bold">{estatisticasHorasExtras.total_horas_extras}h</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Funcionários</p>
                            <p className="text-2xl font-bold">{estatisticasHorasExtras.total_funcionarios}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Média/Funcionário</p>
                            <p className="text-2xl font-bold">{estatisticasHorasExtras.media_por_funcionario.toFixed(1)}h</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Tabela de Horas Extras */}
                {loadingHorasExtras ? (
                  <div className="flex items-center justify-center h-64">
                    <Loading />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              checked={registrosSelecionadosHorasExtras.size === registrosHorasExtras.length && registrosHorasExtras.length > 0}
                              onChange={toggleSelecionarTodosHorasExtras}
                              className="cursor-pointer"
                            />
                          </TableHead>
                          <TableHead>Funcionário</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Horas Trabalhadas</TableHead>
                          <TableHead>Horas Extras</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Observações</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrosHorasExtras.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                              Nenhum registro de hora extra encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          registrosHorasExtras.map((registro) => (
                            <TableRow key={registro.id}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={registrosSelecionadosHorasExtras.has(registro.id!)}
                                  onChange={() => toggleSelecionarHoraExtra(registro.id!)}
                                  className="cursor-pointer"
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {registro.funcionario?.nome || 'Funcionário não encontrado'}
                              </TableCell>
                              <TableCell>{utilsPonto.formatarData(registro.data || '')}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {registro.horas_trabalhadas || 0}h
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-orange-100 text-orange-800">
                                  +{registro.horas_extras || 0}h
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const statusInfo = utilsPonto.obterBadgeStatus(registro.status || '')
                                  return (
                                    <Badge className={statusInfo.className}>
                                      {statusInfo.text}
                                    </Badge>
                                  )
                                })()}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {registro.observacoes || '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  {registro.status === 'Pendente Aprovação' && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => aprovarHorasExtrasLote([registro.id!])}
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const motivo = prompt('Motivo da rejeição:')
                                          if (motivo) {
                                            rejeitarHorasExtrasLote([registro.id!], motivo)
                                          }
                                        }}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                  {(registro.horas_extras || 0) > 0 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        try {
                                          setLoadingHorasExtras(true)
                                          const resultado = await apiHorasExtras.notificarSupervisor(registro.id!)
                                          if (resultado.success) {
                                            toast({
                                              title: "Sucesso",
                                              description: resultado.message || "Notificação enviada com sucesso!",
                                            })
                                            // Não recarregar para manter o item na tabela
                                          } else {
                                            throw new Error(resultado.message || 'Erro ao enviar notificação')
                                          }
                                        } catch (error: any) {
                                          console.error('Erro ao notificar supervisor:', error)
                                          toast({
                                            title: "Erro",
                                            description: error.message || "Erro ao enviar notificação WhatsApp",
                                            variant: "destructive"
                                          })
                                        } finally {
                                          setLoadingHorasExtras(false)
                                        }
                                      }}
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                      disabled={loadingHorasExtras}
                                    >
                                      <MessageSquare className="w-4 h-4 mr-1" />
                                      Notificar
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="justificativas">
          <Card>
            <CardHeader>
              <CardTitle>Justificativas</CardTitle>
              <CardDescription>Gerencie justificativas de atrasos, faltas e saídas antecipadas</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtro por nome */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Filtrar por nome do funcionário..."
                    value={filtroNomeJustificativa}
                    onChange={(e) => setFiltroNomeJustificativa(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tabela de justificativas */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aprovador</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.justificativas
                      .filter((just) => {
                        if (!filtroNomeJustificativa) return true
                        const nomeFuncionario = just.funcionario?.nome || ''
                        return nomeFuncionario.toLowerCase().includes(filtroNomeJustificativa.toLowerCase())
                      })
                      .map((just) => {
                        const statusBadge = utilsPonto.obterBadgeStatus(just.status)
                        const isExpanded = justificativasExpandidas.has(just.id)
                        
                        return (
                          <React.Fragment key={just.id}>
                            <TableRow
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => toggleJustificativa(just.id)}
                            >
                              <TableCell>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {just.funcionario?.nome || 'Funcionário não encontrado'}
                                {just.funcionario?.cargo && (
                                  <p className="text-xs text-gray-500 mt-1">{just.funcionario.cargo}</p>
                                )}
                              </TableCell>
                              <TableCell>{utilsPonto.formatarData(just.data)}</TableCell>
                              <TableCell>{just.tipo}</TableCell>
                              <TableCell className="max-w-xs">
                                <p className="truncate" title={just.motivo}>
                                  {just.motivo}
                                </p>
                              </TableCell>
                              <TableCell>
                                <Badge className={statusBadge.className}>
                                  {statusBadge.text}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {just.aprovador ? (
                                  <div>
                                    <p className="text-sm">{just.aprovador.nome}</p>
                                    {just.data_aprovacao && (
                                      <p className="text-xs text-gray-500">
                                        {utilsPonto.formatarData(just.data_aprovacao)}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {/* Justificativa já é a validação, não precisa de aprovação */}
                              </TableCell>
                            </TableRow>
                            
                            {/* Linha expandida com detalhes */}
                            {isExpanded && (
                              <TableRow>
                                <TableCell colSpan={8} className="bg-gray-50 p-4">
                                  <div className="space-y-4">
                                    {/* Motivo completo */}
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Motivo Completo</h4>
                                      <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200">
                                        {just.motivo}
                                      </p>
                                    </div>

                                    {/* Observações */}
                                    {just.observacoes && (
                                      <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Observações</h4>
                                        <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200">
                                          {just.observacoes}
                                        </p>
                                      </div>
                                    )}

                                    {/* Anexos/Arquivos */}
                                    {just.anexos && just.anexos.length > 0 && (
                                      <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Arquivos Anexados</h4>
                                        <div className="space-y-2">
                                          {just.anexos.map((anexo, index) => {
                                            const nomeArquivo = typeof anexo === 'string' 
                                              ? anexo.split('/').pop() || `arquivo-${index + 1}` 
                                              : `arquivo-${index + 1}`
                                            return (
                                              <div
                                                key={index}
                                                className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200"
                                              >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                  <span className="text-sm text-gray-600 truncate">{nomeArquivo}</span>
                                                </div>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="h-8 flex-shrink-0"
                                                  onClick={() => handleDownloadArquivo(
                                                    typeof anexo === 'string' ? anexo : '',
                                                    nomeArquivo
                                                  )}
                                                >
                                                  <Download className="w-4 h-4 mr-1" />
                                                  Download
                                                </Button>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}

                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        )
                      })}
                    {data.justificativas.filter((just) => {
                      if (!filtroNomeJustificativa) return true
                      const nomeFuncionario = just.funcionario?.nome || ''
                      return nomeFuncionario.toLowerCase().includes(filtroNomeJustificativa.toLowerCase())
                    }).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Nenhuma justificativa encontrada</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorio">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Relatório Mensal</CardTitle>
                  <CardDescription>Resumo das horas trabalhadas e frequência dos funcionários</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => exportarRelatorio('pdf')} variant="default" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button onClick={() => exportarRelatorio('csv')} variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="mes-relatorio">Mês:</Label>
                  <Select value={mesRelatorio.toString()} onValueChange={(value) => setMesRelatorio(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Janeiro</SelectItem>
                      <SelectItem value="2">Fevereiro</SelectItem>
                      <SelectItem value="3">Março</SelectItem>
                      <SelectItem value="4">Abril</SelectItem>
                      <SelectItem value="5">Maio</SelectItem>
                      <SelectItem value="6">Junho</SelectItem>
                      <SelectItem value="7">Julho</SelectItem>
                      <SelectItem value="8">Agosto</SelectItem>
                      <SelectItem value="9">Setembro</SelectItem>
                      <SelectItem value="10">Outubro</SelectItem>
                      <SelectItem value="11">Novembro</SelectItem>
                      <SelectItem value="12">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="ano-relatorio">Ano:</Label>
                  <Select value={anoRelatorio.toString()} onValueChange={(value) => setAnoRelatorio(parseInt(value))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={carregarRelatorioMensal} variant="outline" size="sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingRelatorioMensal ? (
                  <div className="flex items-center justify-center h-64">
                    <Loading />
                  </div>
                ) : dadosRelatorioMensal ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Funcionário</TableHead>
                          <TableHead className="text-center">Horas Trabalhadas</TableHead>
                          <TableHead className="text-center">Dias Presentes</TableHead>
                          <TableHead className="text-center">Atrasos</TableHead>
                          <TableHead className="text-center">Faltas</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dadosRelatorioMensal.resumo?.funcionarios?.map((resumoFunc: any) => {
                          const funcionario = data.funcionarios.find(f => f.id === resumoFunc.funcionario_id)
                          if (!funcionario) return null
                          
                          // Determinar status geral
                          let status = "Regular"
                          let statusColor = "bg-green-100 text-green-800"
                          
                          if (resumoFunc.faltas > 3) {
                            status = "Irregular"
                            statusColor = "bg-red-100 text-red-800"
                          } else if (resumoFunc.atrasos > 5) {
                            status = "Atenção"
                            statusColor = "bg-yellow-100 text-yellow-800"
                          }
                          
                          return (
                            <TableRow key={funcionario.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{funcionario.nome}</p>
                                    <p className="text-sm text-gray-500">{funcionario.cargo || 'Sem cargo'}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-medium">{(resumoFunc.horas_trabalhadas || 0).toFixed(1)}h</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-medium">{resumoFunc.dias_presentes || 0} dias</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-medium text-yellow-600">{resumoFunc.atrasos || 0}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-medium text-red-600">{resumoFunc.faltas || 0}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={statusColor}>
                                  {status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        }) || data.funcionarios.map((func) => {
                          const registrosFuncionario = (dadosRelatorioMensal.registros || []).filter((r: any) => r.funcionario_id === func.id)
                          const totalHoras = registrosFuncionario.reduce((total: number, r: any) => total + (r.horas_trabalhadas || 0), 0)
                          const diasPresentes = registrosFuncionario.filter((r: any) => (r.status || '') !== 'Falta').length
                          const atrasos = registrosFuncionario.filter((r: any) => (r.status || '') === 'Atraso').length
                          const faltas = registrosFuncionario.filter((r: any) => (r.status || '') === 'Falta').length
                          
                          // Determinar status geral
                          let status = "Regular"
                          let statusColor = "bg-green-100 text-green-800"
                          
                          if (faltas > 3) {
                            status = "Irregular"
                            statusColor = "bg-red-100 text-red-800"
                          } else if (atrasos > 5) {
                            status = "Atenção"
                            statusColor = "bg-yellow-100 text-yellow-800"
                          }
                          
                          return (
                            <TableRow key={func.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{func.nome}</p>
                                    <p className="text-sm text-gray-500">{func.cargo || 'Sem cargo'}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-medium">{(totalHoras || 0).toFixed(1)}h</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-medium">{diasPresentes} dias</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-medium text-yellow-600">{atrasos}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-medium text-red-600">{faltas}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={statusColor}>
                                  {status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Selecione um mês e ano e clique em "Atualizar" para carregar o relatório
                  </div>
                )}
                
                {/* Resumo Geral */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Resumo Geral - {mesRelatorio}/{anoRelatorio}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-600">Total Funcionários</p>
                      <p className="font-semibold text-lg">{data.funcionarios.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Total Horas</p>
                      <p className="font-semibold text-lg">
                        {data.funcionarios.reduce((total, func) => {
                          const registrosFuncionario = data.registrosPonto.filter(r => r.funcionario_id === func.id)
                          const totalHoras = registrosFuncionario.reduce((total, r) => total + (r.horas_trabalhadas || 0), 0)
                          return total + totalHoras
                        }, 0).toFixed(1)}h
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Total Atrasos</p>
                      <p className="font-semibold text-lg text-yellow-600">
                        {data.funcionarios.reduce((total, func) => {
                          const registrosFuncionario = data.registrosPonto.filter(r => r.funcionario_id === func.id)
                          const atrasos = registrosFuncionario.filter(r => (r.status || '') === 'Atraso').length
                          return total + atrasos
                        }, 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Total Faltas</p>
                      <p className="font-semibold text-lg text-red-600">
                        {data.funcionarios.reduce((total, func) => {
                          const registrosFuncionario = data.registrosPonto.filter(r => r.funcionario_id === func.id)
                          const faltas = registrosFuncionario.filter(r => (r.status || '') === 'Falta').length
                          return total + faltas
                        }, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Aprovação de Horas Extras */}
      <AprovacaoHorasExtrasDialog
        isOpen={isAprovacaoOpen}
        onClose={fecharAprovacao}
        registro={registroParaAprovacao}
      />

      {/* Modal de Aprovação/Rejeição */}
      <Dialog open={isModalAprovacaoOpen} onOpenChange={setIsModalAprovacaoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tipoAcao === 'aprovar' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Aprovar Horas Extras
                </>
              ) : (
                <>
                  <X className="w-5 h-5 text-red-600" />
                  Rejeitar Horas Extras
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {tipoAcao === 'aprovar' 
                ? 'Confirme a aprovação das horas extras do funcionário'
                : 'Informe o motivo da rejeição das horas extras'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Informações do registro */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Registro</h4>
              <p className="text-sm text-gray-600">
                <strong>Funcionário:</strong> {registroParaModal?.funcionario?.nome}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Data:</strong> {registroParaModal?.data && new Date(registroParaModal.data).toLocaleDateString("pt-BR")}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Horas Extras:</strong> +{registroParaModal?.horas_extras || 0}h
              </p>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">
                Observações {tipoAcao === 'aprovar' ? '(opcional)' : '(opcional)'}
              </Label>
              <Textarea
                id="observacoes"
                value={observacoesModal}
                onChange={(e) => setObservacoesModal(e.target.value)}
                placeholder={tipoAcao === 'aprovar' 
                  ? "Adicione observações sobre a aprovação..."
                  : "Adicione observações sobre a rejeição..."
                }
                rows={3}
              />
            </div>

            {/* Justificativa */}
            <div className="space-y-2">
              <Label htmlFor="justificativa">
                {tipoAcao === 'aprovar' ? 'Justificativa da Aprovação' : 'Motivo da Rejeição'} *
              </Label>
              <Textarea
                id="justificativa"
                value={justificativaModal}
                onChange={(e) => setJustificativaModal(e.target.value)}
                placeholder={tipoAcao === 'aprovar' 
                  ? "Explique por que está aprovando estas horas extras..."
                  : "Explique por que está rejeitando estas horas extras..."
                }
                rows={3}
                required
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalAprovacaoOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                className={tipoAcao === 'aprovar' 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-red-600 hover:bg-red-700"
                }
                onClick={tipoAcao === 'aprovar' ? handleAprovarDireto : handleRejeitarDireto}
              >
                {tipoAcao === 'aprovar' ? 'Aprovar' : 'Rejeitar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </ProtectedRoute>
  )
}
