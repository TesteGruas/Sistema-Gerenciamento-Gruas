"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Clock, Play, Square, Coffee, User, AlertCircle, CheckCircle, Search, FileText, Check, X } from "lucide-react"
import { AprovacaoHorasExtrasDialog } from "@/components/aprovacao-horas-extras-dialog"
import {
  PieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts'
import { 
  apiFuncionarios, 
  apiRegistrosPonto, 
  apiJustificativas,
  apiRelatorios,
  apiHorasExtras,
  apiGraficos,
  utilsPonto,
  type Funcionario,
  type RegistroPonto,
  type Justificativa
} from "@/lib/api-ponto-eletronico"
import { ExportButton } from "@/components/export-button"
import { Loading, PageLoading, TableLoading, CardLoading, useLoading } from "@/components/ui/loading"
import { AdvancedPagination } from "@/components/ui/advanced-pagination"

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
interface DadosGraficos {
  horasTrabalhadas: any[]
  frequencia: any[]
  statusFuncionarios: any[]
  dashboard: any | null
}

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
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")
  const [ordenacaoHorasExtras, setOrdenacaoHorasExtras] = useState("data") // Ordenar por data (mais recente primeiro)
  const [filtroStatus, setFiltroStatus] = useState("todos")
  
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

  // Estados para gráficos
  const [dadosGraficos, setDadosGraficos] = useState<DadosGraficos>({
    horasTrabalhadas: [],
    frequencia: [],
    statusFuncionarios: [],
    dashboard: null
  })
  const [loadingGraficos, setLoadingGraficos] = useState(false)
  const [periodoGraficos, setPeriodoGraficos] = useState<'semana' | 'mes' | 'trimestre' | 'ano'>('mes')

  // Atualizar relógio a cada segundo (apenas no cliente)
  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados()
  }, [])

  // Recarregar dados quando filtros ou paginação mudarem
  useEffect(() => {
    carregarDadosComFiltros()
  }, [filtroFuncionario, filtroDataInicio, filtroDataFim, filtroStatus, currentPage, pageSize])

  // Debug dos registros e filtros (apenas uma vez após carregar)
  useEffect(() => {
    if (data.registrosPonto.length > 0) {
      console.log('🔍 Debug após carregamento:')
      console.log('  Total registros:', data.registrosPonto.length)
      console.log('  Filtros:', { filtroFuncionario, filtroStatus, filtroDataInicio, filtroDataFim, searchTerm })
    }
  }, [data.registrosPonto.length])

  // Função para carregar dados da API
  const carregarDados = async () => {
    setData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // ID do usuário atual (em um sistema real, isso viria do contexto de autenticação)
      const usuarioId = 2 // Hardcoded para exemplo - usuário admin
      
      // Carregar funcionários com verificação de admin e outros dados em paralelo
      const [funcionariosResponse, registrosResponse, justificativasResponse] = await Promise.all([
        apiFuncionarios.listarParaPonto(usuarioId),
        apiRegistrosPonto.listar({ 
          page: currentPage, 
          limit: pageSize 
        }),
        apiJustificativas.listar({})
      ])

      // Verificar se a resposta tem a estrutura esperada
      const isAdmin = funcionariosResponse?.isAdmin || false
      const funcionarios = funcionariosResponse?.funcionarios || []

      // Definir usuário atual (primeiro funcionário da lista se não for admin)
      const usuarioAtual = isAdmin 
        ? null 
        : funcionarios[0] || null

      const registros = registrosResponse.data || []
      const paginationData = registrosResponse.pagination || { page: 1, limit: pageSize, total: registros.length, pages: 1 }
      
      console.log('📊 Total de registros carregados:', registros.length)
      console.log('📊 Paginação:', paginationData)
      console.log('📅 Primeiros 5 registros:', registros.slice(0, 5).map(r => ({
        id: r.id,
        funcionario: r.funcionario?.nome,
        data: r.data,
        entrada: r.entrada,
        status: r.status
      })))
      
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

      // Se não for admin, selecionar automaticamente o próprio usuário
      if (!isAdmin && usuarioAtual) {
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
    console.log('🚀 carregarDadosComFiltros chamada!')
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
      
      if (filtroDataInicio) {
        filtros.data_inicio = filtroDataInicio
      }
      
      if (filtroDataFim) {
        filtros.data_fim = filtroDataFim
      }
      
      if (filtroStatus !== "todos") {
        filtros.status = filtroStatus
      }

      console.log('🔍 Aplicando filtros:', filtros)

      // Carregar registros com filtros
      console.log('📡 Chamando API...')
      const registrosResponse = await apiRegistrosPonto.listar(filtros)
      console.log('📡 Resposta da API:', registrosResponse)
      
      const registros = registrosResponse.data || []
      const paginationData = registrosResponse.pagination || { page: 1, limit: pageSize, total: registros.length, pages: 1 }
      
      console.log('📊 Registros filtrados:', registros.length)
      console.log('📊 Paginação filtrada:', paginationData)
      console.log('📊 Primeiros registros filtrados:', registros.slice(0, 3))

      // Atualizar apenas os registros e paginação, mantendo outros dados
      setData(prev => ({
        ...prev,
        registrosPonto: registros
      }))
      
      setPagination(paginationData)

      // Debug: verificar se os dados foram atualizados
      console.log('📊 Estado atualizado - registrosPonto.length:', registros.length)
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
    setFiltroDataInicio("")
    setFiltroDataFim("")
    setFiltroStatus("todos")
    setOrdenacaoHorasExtras("data")
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
        ordenacao: ordenacaoHorasExtras,
        page: 1,
        limit: 100
      }

      if (filtroFuncionario !== 'todos') {
        params.funcionario_id = filtroFuncionario
      }
      if (filtroDataInicio) {
        params.data_inicio = filtroDataInicio
      }
      if (filtroDataFim) {
        params.data_fim = filtroDataFim
      }
      if (filtroStatus !== 'todos') {
        params.status = filtroStatus
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

  // ========================================
  // FUNÇÕES DE GRÁFICOS
  // ========================================

  // Carregar dados dos gráficos
  const carregarGraficos = async () => {
    setLoadingGraficos(true)
    try {
      const periodo = periodoGraficos as any
      const [horasTrabalhadas, frequencia, status, dashboard] = await Promise.all([
        apiGraficos.horasTrabalhadas({ periodo }),
        apiGraficos.frequencia({ periodo }),
        apiGraficos.status({ periodo, agrupamento: 'funcionario' }),
        apiGraficos.dashboard({ periodo })
      ])

      setDadosGraficos({
        horasTrabalhadas: horasTrabalhadas.data || [],
        frequencia: frequencia.data || [],
        statusFuncionarios: status.data || [],
        dashboard: dashboard.data || null
      })
    } catch (error) {
      console.error('Erro ao carregar gráficos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os gráficos",
        variant: "destructive"
      })
    } finally {
      setLoadingGraficos(false)
    }
  }

  // ========================================
  // FUNÇÕES DE EXPORTAÇÃO
  // ========================================

  // Exportar relatório
  const exportarRelatorio = async (tipo: 'csv' | 'json' | 'pdf') => {
    try {
      const hoje = new Date()
      const mes = hoje.getMonth() + 1
      const ano = hoje.getFullYear()

      if (tipo === 'pdf') {
        // Para PDF, fazer requisição direta para baixar o arquivo
        const token = localStorage.getItem('access_token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ponto-eletronico/relatorios/exportar?tipo=pdf&formato=mensal&mes=${mes}&ano=${ano}`, {
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

  // useEffect para carregar horas extras quando filtros mudarem
  useEffect(() => {
    carregarHorasExtras()
  }, [filtroFuncionario, filtroDataInicio, filtroDataFim, filtroStatus, ordenacaoHorasExtras])

  // useEffect para carregar gráficos quando período mudar
  useEffect(() => {
    carregarGraficos()
  }, [periodoGraficos])

  // Debug: mostrar total de registros antes do filtro
  console.log('🔍 Total de registros antes do filtro:', data.registrosPonto.length)
  console.log('🔍 Filtros aplicados:', {
    searchTerm,
    filtroFuncionario,
    filtroDataInicio,
    filtroDataFim,
    filtroStatus
  })

  const filteredRegistros = data.registrosPonto
    .filter((registro) => {
      // Filtro por termo de busca
      const matchesSearch = 
        (registro.funcionario?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        registro.data.includes(searchTerm) ||
        (registro.status || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filtro por funcionário
      const matchesFuncionario = 
        filtroFuncionario === "todos" || 
        registro.funcionario_id === parseInt(filtroFuncionario)
      
      // Filtro por data
      const registroData = new Date(registro.data)
      const dataInicio = filtroDataInicio ? new Date(filtroDataInicio) : null
      const dataFim = filtroDataFim ? new Date(filtroDataFim) : null
      
      const matchesData = 
        (!dataInicio || registroData >= dataInicio) &&
        (!dataFim || registroData <= dataFim)
      
      // Filtro por status
      const matchesStatus = 
        filtroStatus === "todos" || 
        (registro.status || '') === filtroStatus
      
      // Debug: log para entender por que está filtrando
      if (registro.funcionario_id === 100) {
        console.log('🔍 Debug filtro para funcionário 100:', {
          registro: {
            id: registro.id,
            funcionario_id: registro.funcionario_id,
            data: registro.data,
            status: registro.status
          },
          filtros: {
            searchTerm,
            filtroFuncionario,
            filtroDataInicio,
            filtroDataFim,
            filtroStatus
          },
          matches: {
            matchesSearch,
            matchesFuncionario,
            matchesData,
            matchesStatus
          },
          final: matchesSearch && matchesFuncionario && matchesData && matchesStatus
        })
      }
      
      return matchesSearch && matchesFuncionario && matchesData && matchesStatus
    })

  // Debug: mostrar total de registros após o filtro
  console.log('🔍 Total de registros após o filtro:', filteredRegistros.length)

  const sortedRegistros = filteredRegistros
    .sort((a, b) => {
      // Ordenação por horas extras
      if (ordenacaoHorasExtras === "maior") {
        return (b.horas_extras || 0) - (a.horas_extras || 0)
      } else if (ordenacaoHorasExtras === "menor") {
        return (a.horas_extras || 0) - (b.horas_extras || 0)
      } else {
        // Ordenação por data (mais recente primeiro)
        return new Date(b.data).getTime() - new Date(a.data).getTime()
      }
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
      console.log('Enviando para aprovação:', {
        registroId: registroParaAprovacao.id,
        gestorId,
        observacoes
      })

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ponto Eletrônico</h1>
          <p className="text-gray-600">Sistema de controle de frequência dos funcionários</p>
        </div>
        <div className="flex gap-2">
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
              {data.isAdmin ? (
                <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.funcionarios.map((func) => (
                      <SelectItem key={func.id} value={func.id.toString()}>
                        {func.nome} - {func.cargo || 'Sem cargo'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-gray-50 rounded-md border">
                  <p className="font-medium">{data.usuarioAtual?.nome || 'Carregando...'}</p>
                  <p className="text-sm text-gray-500">Seu registro de ponto</p>
                </div>
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

      <Tabs defaultValue="registros" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="registros">Registros de Ponto</TabsTrigger>
          <TabsTrigger value="horas-extras">Controle de Horas Extras</TabsTrigger>
          <TabsTrigger value="justificativas">Justificativas</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório Mensal</TabsTrigger>
          <TabsTrigger value="graficos">📊 Gráficos Visuais</TabsTrigger>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Filtro por funcionário */}
                  <div className="space-y-2">
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

                  {/* Filtro por data início */}
                  <div className="space-y-2">
                    <Label htmlFor="filtro-data-inicio">Data Início</Label>
                    <Input
                      id="filtro-data-inicio"
                      type="date"
                      value={filtroDataInicio}
                      onChange={(e) => setFiltroDataInicio(e.target.value)}
                    />
                  </div>

                  {/* Filtro por data fim */}
                  <div className="space-y-2">
                    <Label htmlFor="filtro-data-fim">Data Fim</Label>
                    <Input
                      id="filtro-data-fim"
                      type="date"
                      value={filtroDataFim}
                      onChange={(e) => setFiltroDataFim(e.target.value)}
                    />
                  </div>

                  {/* Filtro por status */}
                  <div className="space-y-2">
                    <Label htmlFor="filtro-status">Status</Label>
                    <Select
                      value={filtroStatus}
                      onValueChange={setFiltroStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        <SelectItem value="Completo">Completo</SelectItem>
                        <SelectItem value="Em Andamento">Aberto</SelectItem>
                        <SelectItem value="Atraso">Atraso</SelectItem>
                        <SelectItem value="Falta">Falta</SelectItem>
                        <SelectItem value="Pendente Aprovação">Pendente Aprovação</SelectItem>
                        <SelectItem value="Aprovado">Aprovado</SelectItem>
                        <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ordenação por horas extras */}
                  <div className="space-y-2">
                    <Label htmlFor="ordenacao-horas">Ordenar por Horas Extras</Label>
                    <Select
                      value={ordenacaoHorasExtras}
                      onValueChange={setOrdenacaoHorasExtras}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ordenar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="data">Mais Recente</SelectItem>
                        <SelectItem value="maior">Maior Número de Horas Extras</SelectItem>
                        <SelectItem value="menor">Menor Número de Horas Extras</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Botão para limpar filtros */}
                <div className="flex justify-end">
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
                    {filtroDataInicio && ` | Período: ${filtroDataInicio} até ${filtroDataFim || "hoje"}`}
                    {filtroStatus !== "todos" && ` | Status: ${filtroStatus}`}
                    {ordenacaoHorasExtras === "maior" && " | Ordenado: Maior horas extras"}
                    {ordenacaoHorasExtras === "menor" && " | Ordenado: Menor horas extras"}
                    {ordenacaoHorasExtras === "data" && " | Ordenado: Mais recente"}
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
              <div className="space-y-6">
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

                {/* Filtros */}
                <div className="flex gap-4">
                  <Select value={ordenacaoHorasExtras} onValueChange={setOrdenacaoHorasExtras}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data">Data (mais recente)</SelectItem>
                      <SelectItem value="maior">Maior horas extras</SelectItem>
                      <SelectItem value="menor">Menor horas extras</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={carregarHorasExtras} variant="outline" size="sm">
                    Atualizar
                  </Button>
                </div>

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
              <div className="space-y-4">
                {data.justificativas.map((just) => {
                  const statusBadge = utilsPonto.obterBadgeStatus(just.status)
                  return (
                    <Card key={just.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <FileText className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium">{just.funcionario?.nome || 'Funcionário não encontrado'}</p>
                              <p className="text-sm text-gray-500">{utilsPonto.formatarData(just.data)} - {just.tipo}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={statusBadge.className}>
                              {statusBadge.text}
                            </Badge>
                            {just.status === 'Pendente' && (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8"
                                  onClick={() => handleAprovarJustificativa(String(just.id || ''))}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8"
                                  onClick={() => handleRejeitarJustificativa(String(just.id || ''))}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-gray-600">{just.motivo}</p>
                        {just.aprovador && (
                          <p className="mt-2 text-xs text-gray-500">
                            {just.status === 'Aprovada' ? 'Aprovada' : 'Rejeitada'} por: {just.aprovador.nome} em {utilsPonto.formatarData(just.data_aprovacao || '')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
                {data.justificativas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma justificativa encontrada</p>
                  </div>
                )}
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
                  <Button onClick={() => exportarRelatorio('json')} variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar JSON
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.funcionarios.map((func) => {
                  const registrosFuncionario = data.registrosPonto.filter(r => r.funcionario_id === func.id)
                  const totalHoras = registrosFuncionario.reduce((total, r) => total + (r.horas_trabalhadas || 0), 0)
                  const diasPresentes = registrosFuncionario.filter(r => (r.status || '') !== 'Falta').length
                  const atrasos = registrosFuncionario.filter(r => (r.status || '') === 'Atraso').length
                  const faltas = registrosFuncionario.filter(r => (r.status || '') === 'Falta').length
                  
                  return (
                    <Card key={func.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{func.nome}</p>
                            <p className="text-sm text-gray-500">{func.cargo || 'Sem cargo'}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Horas Trabalhadas:</span>
                            <span className="font-medium">{(totalHoras || 0).toFixed(1)}h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Dias Presentes:</span>
                            <span className="font-medium">{diasPresentes} dias</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Atrasos:</span>
                            <span className="font-medium text-yellow-600">{atrasos}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Faltas:</span>
                            <span className="font-medium text-red-600">{faltas}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nova aba de Gráficos Visuais */}
        <TabsContent value="graficos">
          <div className="space-y-6">
            {/* Controles de Período */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Label>Período:</Label>
                  <Select value={periodoGraficos} onValueChange={(value: any) => setPeriodoGraficos(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semana">Última Semana</SelectItem>
                      <SelectItem value="mes">Último Mês</SelectItem>
                      <SelectItem value="trimestre">Último Trimestre</SelectItem>
                      <SelectItem value="ano">Último Ano</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={carregarGraficos} variant="outline" size="sm">
                    Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {loadingGraficos ? (
              <div className="flex items-center justify-center h-96">
                <Loading />
              </div>
            ) : (
              <>
                {/* Estatísticas Resumidas do Dashboard */}
                {dadosGraficos.dashboard?.estatisticas && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Registros</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {dadosGraficos.dashboard.estatisticas.total_registros}
                            </p>
                          </div>
                          <Clock className="w-8 h-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Horas</p>
                            <p className="text-2xl font-bold text-green-600">
                              {dadosGraficos.dashboard.estatisticas.total_horas_trabalhadas.toFixed(0)}h
                            </p>
                          </div>
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Horas Extras</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {dadosGraficos.dashboard.estatisticas.total_horas_extras.toFixed(1)}h
                            </p>
                          </div>
                          <AlertCircle className="w-8 h-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Func. Ativos</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {dadosGraficos.dashboard.estatisticas.funcionarios_ativos}
                            </p>
                          </div>
                          <User className="w-8 h-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Gráfico de Horas Trabalhadas por Dia */}
                {dadosGraficos.horasTrabalhadas.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>📈 Horas Trabalhadas por Período</CardTitle>
                      <CardDescription>Distribuição das horas normais e extras</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={dadosGraficos.horasTrabalhadas}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="dia" />
                          <YAxis />
                          <RechartsTooltip 
                            formatter={(value: number, name: string) => [
                              `${value}h`, 
                              name === 'horas' ? 'Horas Normais' : 'Horas Extras'
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="horas" fill="#3b82f6" name="Horas Normais" />
                          <Bar dataKey="extras" fill="#10b981" name="Horas Extras" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Gráfico de Frequência */}
                {dadosGraficos.frequencia.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>📊 Frequência por Funcionário</CardTitle>
                      <CardDescription>Presenças, faltas e atrasos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={dadosGraficos.frequencia.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="funcionario" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="presencas" fill="#10b981" name="Presenças" />
                          <Bar dataKey="faltas" fill="#ef4444" name="Faltas" />
                          <Bar dataKey="atrasos" fill="#f59e0b" name="Atrasos" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Gráfico de Status por Funcionário */}
                {dadosGraficos.statusFuncionarios.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>👥 Horas por Funcionário</CardTitle>
                      <CardDescription>Total de horas trabalhadas no período</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={dadosGraficos.statusFuncionarios.slice(0, 10)} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="funcionario" type="category" width={120} />
                          <RechartsTooltip 
                            formatter={(value: number) => [`${value}h`, 'Horas']}
                          />
                          <Bar dataKey="horas" fill="#10b981" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Top Horas Extras */}
                {dadosGraficos.dashboard?.top_horas_extras && dadosGraficos.dashboard.top_horas_extras.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>🏆 Top 5 - Horas Extras</CardTitle>
                      <CardDescription>Funcionários com mais horas extras no período</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dadosGraficos.dashboard.top_horas_extras.map((func: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{func.nome}</p>
                                <p className="text-sm text-gray-500">{func.cargo}</p>
                              </div>
                            </div>
                            <Badge className="bg-orange-100 text-orange-800">
                              +{func.total_horas_extras}h
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Mensagem se não houver dados */}
                {!dadosGraficos.dashboard && dadosGraficos.horasTrabalhadas.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Nenhum dado disponível para o período selecionado</p>
                      <p className="text-sm mt-2">Tente selecionar um período diferente ou aguarde o carregamento de dados</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
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
  )
}
