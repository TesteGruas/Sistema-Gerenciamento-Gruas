"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Edit,
  Trash2, 
  DollarSign,
  Calendar,
  Building2,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  X,
  Receipt,
  ExternalLink
} from "lucide-react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import { useToast } from "@/hooks/use-toast"
import apiContasBancarias from "@/lib/api-contas-bancarias"
import { notasFiscaisApi } from "@/lib/api-notas-fiscais"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Helper para obter o token correto
const getAuthToken = () => {
  return localStorage.getItem('access_token') || localStorage.getItem('token')
}

interface ContaBancaria {
  id: number
  banco: string
  agencia: string
  conta: string
  tipo_conta: string
  saldo_atual: number
  status: string
  nome?: string
}

interface Movimentacao {
  id: number
  conta_bancaria_id: number
  tipo: 'entrada' | 'saida'
  valor: number
  descricao: string
  referencia?: string
  data: string
  categoria?: string
  observacoes?: string
  created_at: string
  contas_bancarias?: {
    id: number
    banco: string
    agencia: string
    conta: string
    tipo_conta: string
  }
}

export default function BancosPage() {
  const { toast } = useToast()
  
  // Estados
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateBancoOpen, setIsCreateBancoOpen] = useState(false)
  const [isCreateMovimentacaoOpen, setIsCreateMovimentacaoOpen] = useState(false)
  const [isEditMovimentacaoOpen, setIsEditMovimentacaoOpen] = useState(false)
  const [editingMovimentacao, setEditingMovimentacao] = useState<Movimentacao | null>(null)
  const [isNotaFiscalDialogOpen, setIsNotaFiscalDialogOpen] = useState(false)
  const [notaFiscalDetalhes, setNotaFiscalDetalhes] = useState<any>(null)
  const [loadingNotaFiscal, setLoadingNotaFiscal] = useState(false)
  
  // Filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<string>("all")
  const [filtroBanco, setFiltroBanco] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Formulários
  const [bancoForm, setBancoForm] = useState({
    banco: '',
    agencia: '',
    conta: '',
    tipo_conta: 'corrente' as 'corrente' | 'poupanca' | 'investimento',
    saldo_atual: 0,
    status: 'ativa' as 'ativa' | 'inativa' | 'bloqueada'
  })
  
  const [movimentacaoForm, setMovimentacaoForm] = useState({
    conta_bancaria_id: '',
    tipo: 'entrada' as 'entrada' | 'saida',
    valor: 0,
    descricao: '',
    referencia: '',
    data: new Date().toISOString().split('T')[0],
    categoria: '',
    observacoes: ''
  })

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [filtroDataInicio, filtroDataFim, filtroTipo, filtroBanco])

  // Recarregar dados quando a página ganha foco (útil quando volta de outra página)
  useEffect(() => {
    const handleFocus = () => {
      carregarDados()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      console.log('🔄 [BANCOS] Carregando dados...')
      
      // Carregar contas bancárias com cache busting
      const contasResponse = await apiContasBancarias.listar()
      console.log('📊 [BANCOS] Resposta das contas:', contasResponse)
      if (contasResponse.success) {
        const contasData = contasResponse.data || []
        console.log('✅ [BANCOS] Contas carregadas:', contasData.length, contasData)
        setContas(contasData)
      } else {
        console.error('❌ [BANCOS] Erro ao carregar contas:', contasResponse)
      }
      
      // Carregar movimentações
      await carregarMovimentacoes()
      console.log('✅ [BANCOS] Dados carregados com sucesso')
    } catch (error) {
      console.error('❌ [BANCOS] Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarMovimentacoes = async () => {
    try {
      const token = getAuthToken()
      const params = new URLSearchParams()
      
      if (filtroDataInicio) params.append('data_inicio', filtroDataInicio)
      if (filtroDataFim) params.append('data_fim', filtroDataFim)
      if (filtroTipo !== 'all') params.append('tipo', filtroTipo)
      if (filtroBanco !== 'all') params.append('conta_bancaria_id', filtroBanco)
      
      // Adicionar timestamp para evitar cache
      params.append('_t', Date.now().toString())
      
      const url = `${API_URL}/api/contas-bancarias/movimentacoes/todas?${params.toString()}`
      console.log('🔄 [BANCOS] Carregando movimentações:', url)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      })
      
      const data = await response.json()
      console.log('📊 [BANCOS] Resposta das movimentações:', data)
      if (data.success) {
        const movimentacoesData = data.data || []
        console.log('✅ [BANCOS] Movimentações carregadas:', movimentacoesData.length, movimentacoesData)
        setMovimentacoes(movimentacoesData)
      } else {
        console.error('❌ [BANCOS] Erro ao carregar movimentações:', data)
      }
    } catch (error) {
      console.error('❌ [BANCOS] Erro ao carregar movimentações:', error)
    }
  }

  // Handlers de Banco
  const handleCreateBanco = async () => {
    try {
      if (!bancoForm.banco || !bancoForm.agencia || !bancoForm.conta) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha banco, agência e conta",
          variant: "destructive"
        })
        return
      }

      const response = await apiContasBancarias.criar({
        nome: bancoForm.banco,
        banco: bancoForm.banco,
        agencia: bancoForm.agencia,
        conta: bancoForm.conta,
        tipo: bancoForm.tipo_conta,
        saldo_inicial: bancoForm.saldo_atual,
        ativa: bancoForm.status === 'ativa'
      })

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Banco cadastrado com sucesso"
        })
        setIsCreateBancoOpen(false)
        resetBancoForm()
        carregarDados()
      }
    } catch (error: any) {
      console.error('Erro ao criar banco:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar banco",
        variant: "destructive"
      })
    }
  }

  const handleDeleteBanco = async (id: number) => {
    try {
      await apiContasBancarias.excluir(id)
      toast({
        title: "Sucesso",
        description: "Banco excluído com sucesso"
      })
      carregarDados()
    } catch (error: any) {
      console.error('Erro ao excluir banco:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir banco",
        variant: "destructive"
      })
    }
  }

  // Handlers de Movimentação
  const handleCreateMovimentacao = async () => {
    try {
      if (!movimentacaoForm.conta_bancaria_id || !movimentacaoForm.descricao || !movimentacaoForm.valor || !movimentacaoForm.data) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha conta, descrição, valor e data",
          variant: "destructive"
        })
        return
      }

      const token = getAuthToken()
      const response = await fetch(`${API_URL}/api/contas-bancarias/${movimentacaoForm.conta_bancaria_id}/movimentacoes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: movimentacaoForm.tipo,
          valor: movimentacaoForm.valor,
          descricao: movimentacaoForm.descricao,
          referencia: movimentacaoForm.referencia || null,
          data: movimentacaoForm.data,
          categoria: movimentacaoForm.categoria || null,
          observacoes: movimentacaoForm.observacoes || null
        })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Movimentação registrada com sucesso"
        })
        setIsCreateMovimentacaoOpen(false)
        resetMovimentacaoForm()
        carregarDados()
      } else {
        throw new Error(data.message || 'Erro ao criar movimentação')
      }
    } catch (error: any) {
      console.error('Erro ao criar movimentação:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar movimentação",
        variant: "destructive"
      })
    }
  }

  const handleEditMovimentacao = (movimentacao: Movimentacao) => {
    setEditingMovimentacao(movimentacao)
    setMovimentacaoForm({
      conta_bancaria_id: movimentacao.conta_bancaria_id.toString(),
      tipo: movimentacao.tipo,
      valor: movimentacao.valor,
      descricao: movimentacao.descricao,
      referencia: movimentacao.referencia || '',
      data: movimentacao.data,
      categoria: movimentacao.categoria || '',
      observacoes: movimentacao.observacoes || ''
    })
    setIsEditMovimentacaoOpen(true)
  }

  const handleUpdateMovimentacao = async () => {
    if (!editingMovimentacao) return

    try {
      const token = getAuthToken()
      const response = await fetch(`${API_URL}/api/contas-bancarias/movimentacoes/${editingMovimentacao.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conta_bancaria_id: parseInt(movimentacaoForm.conta_bancaria_id),
          tipo: movimentacaoForm.tipo,
          valor: movimentacaoForm.valor,
          descricao: movimentacaoForm.descricao,
          referencia: movimentacaoForm.referencia || null,
          data: movimentacaoForm.data,
          categoria: movimentacaoForm.categoria || null,
          observacoes: movimentacaoForm.observacoes || null
        })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Movimentação atualizada com sucesso"
        })
        setIsEditMovimentacaoOpen(false)
        setEditingMovimentacao(null)
        resetMovimentacaoForm()
        carregarDados()
      } else {
        throw new Error(data.message || 'Erro ao atualizar movimentação')
      }
    } catch (error: any) {
      console.error('Erro ao atualizar movimentação:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar movimentação",
        variant: "destructive"
      })
    }
  }

  const handleDeleteMovimentacao = async (id: number) => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_URL}/api/contas-bancarias/movimentacoes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Movimentação excluída com sucesso"
        })
        carregarDados()
      } else {
        throw new Error(data.message || 'Erro ao excluir movimentação')
      }
    } catch (error: any) {
      console.error('Erro ao excluir movimentação:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir movimentação",
        variant: "destructive"
      })
    }
  }

  const handleViewNotaFiscal = async (movimentacao: Movimentacao) => {
    // Extrair ID da nota fiscal da referência (ex: "NF-58" -> 58)
    const referencia = movimentacao.referencia
    if (!referencia || !referencia.startsWith('NF-')) {
      toast({
        title: "Aviso",
        description: "Esta movimentação não está vinculada a uma nota fiscal",
        variant: "default"
      })
      return
    }

    const notaFiscalId = parseInt(referencia.replace('NF-', ''))
    if (isNaN(notaFiscalId)) {
      toast({
        title: "Erro",
        description: "Não foi possível identificar a nota fiscal",
        variant: "destructive"
      })
      return
    }

    setIsNotaFiscalDialogOpen(true)
    setLoadingNotaFiscal(true)
    setNotaFiscalDetalhes(null)

    try {
      const response = await notasFiscaisApi.getById(notaFiscalId)
      if (response.success && response.data) {
        setNotaFiscalDetalhes(response.data)
      } else {
        throw new Error(response.message || 'Erro ao buscar nota fiscal')
      }
    } catch (error: any) {
      console.error('Erro ao buscar nota fiscal:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao buscar detalhes da nota fiscal",
        variant: "destructive"
      })
      setIsNotaFiscalDialogOpen(false)
    } finally {
      setLoadingNotaFiscal(false)
    }
  }

  // Reset forms
  const resetBancoForm = () => {
    setBancoForm({
      banco: '',
      agencia: '',
      conta: '',
      tipo_conta: 'corrente',
      saldo_atual: 0,
      status: 'ativa'
    })
  }

  const resetMovimentacaoForm = () => {
    setMovimentacaoForm({
      conta_bancaria_id: '',
      tipo: 'entrada',
      valor: 0,
      descricao: '',
      referencia: '',
      data: new Date().toISOString().split('T')[0],
      categoria: '',
      observacoes: ''
    })
  }

  // Utilitários
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0)
  }

  const formatarData = (data: string) => {
    if (!data) return 'N/A'
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  // Filtrar movimentações
  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter(mov => {
      const matchesSearch = searchTerm === '' || 
        mov.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.referencia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.contas_bancarias?.banco.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [movimentacoes, searchTerm])

  // Calcular totais
  const totalEntradas = useMemo(() => {
    return movimentacoesFiltradas
      .filter(m => m.tipo === 'entrada')
      .reduce((sum, m) => sum + m.valor, 0)
  }, [movimentacoesFiltradas])

  const totalSaidas = useMemo(() => {
    return movimentacoesFiltradas
      .filter(m => m.tipo === 'saida')
      .reduce((sum, m) => sum + m.valor, 0)
  }, [movimentacoesFiltradas])

  const saldoTotal = useMemo(() => {
    return contas
      .filter(c => c.status === 'ativa')
      .reduce((sum, c) => sum + parseFloat(String(c.saldo_atual)), 0)
  }, [contas])

  // Dados para gráfico de transações por banco
  const dadosGraficoTransacoes = useMemo(() => {
    const dadosPorBanco: Record<number, { banco: string; entradas: number; saidas: number }> = {}
    
    // Inicializar com todas as contas
    contas.forEach(conta => {
      dadosPorBanco[conta.id] = {
        banco: conta.banco,
        entradas: 0,
        saidas: 0
      }
    })
    
    // Somar movimentações por banco
    movimentacoesFiltradas.forEach(mov => {
      const bancoId = mov.conta_bancaria_id
      if (dadosPorBanco[bancoId]) {
        if (mov.tipo === 'entrada') {
          dadosPorBanco[bancoId].entradas += mov.valor
        } else {
          dadosPorBanco[bancoId].saidas += mov.valor
        }
      }
    })
    
    return Object.values(dadosPorBanco).map(dado => ({
      ...dado,
      saldo: dado.entradas - dado.saidas
    }))
  }, [contas, movimentacoesFiltradas])

  // Dados para gráfico de saldo por banco
  const dadosGraficoSaldo = useMemo(() => {
    return contas
      .filter(c => c.status === 'ativa')
      .map(conta => ({
        banco: conta.banco,
        saldo: parseFloat(String(conta.saldo_atual))
      }))
      .sort((a, b) => b.saldo - a.saldo)
  }, [contas])

  // Cores para os gráficos
  const CORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Bancos</h1>
          <p className="text-gray-600">Gerencie contas bancárias e movimentações</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => carregarDados()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={() => setIsCreateMovimentacaoOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Movimentação
          </Button>
          <Button onClick={() => setIsCreateBancoOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Banco
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saldo Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatarMoeda(saldoTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Entradas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatarMoeda(totalEntradas)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Saídas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatarMoeda(totalSaidas)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bancos Cadastrados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contas.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Bancos */}
      <Card>
        <CardHeader>
          <CardTitle>Contas Bancárias ({contas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {contas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Nenhum banco cadastrado</p>
              <p className="text-sm mt-1">Clique em "Novo Banco" para adicionar uma conta</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contas.map((conta) => {
                const saldo = parseFloat(String(conta.saldo_atual))
                const isSaldoPositivo = saldo >= 0
                const tipoContaLabel = conta.tipo_conta === 'corrente' ? 'Conta Corrente' : 
                                      conta.tipo_conta === 'poupanca' ? 'Poupança' : 
                                      conta.tipo_conta === 'investimento' ? 'Investimento' : conta.tipo_conta
                
                return (
                  <div
                    key={conta.id}
                    className="group relative p-5 border-2 rounded-xl bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-white transition-all duration-200 hover:shadow-lg hover:border-blue-200 hover:-translate-y-1"
                  >
                    {/* Ícone do banco com fundo colorido */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{conta.banco}</h3>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">
                            {tipoContaLabel}
                          </p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Banco</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este banco? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBanco(conta.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {/* Informações da conta */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex-1">
                          <span className="font-medium">Agência:</span> {conta.agencia}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">Conta:</span> {conta.conta}
                        </div>
                      </div>
                      
                      {/* Saldo */}
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Saldo Atual</p>
                        <p className={`text-2xl font-bold ${isSaldoPositivo ? 'text-green-600' : 'text-red-600'}`}>
                          {formatarMoeda(saldo)}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <Badge 
                        className={`${
                          conta.status === 'ativa' 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : conta.status === 'inativa'
                            ? 'bg-gray-500 hover:bg-gray-600'
                            : 'bg-red-500 hover:bg-red-600'
                        } text-white font-medium`}
                      >
                        {conta.status === 'ativa' ? 'Ativa' : conta.status === 'inativa' ? 'Inativa' : 'Bloqueada'}
                      </Badge>
                      <div className="text-xs text-gray-400">
                        ID: {conta.id}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Transações por Banco */}
        <Card>
          <CardHeader>
            <CardTitle>Transações por Banco</CardTitle>
            <CardDescription>Entradas e saídas por banco</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGraficoTransacoes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="banco" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => formatarMoeda(value)}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Bar dataKey="entradas" fill="#10b981" name="Entradas" />
                <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Saldo por Banco */}
        <Card>
          <CardHeader>
            <CardTitle>Saldo por Banco</CardTitle>
            <CardDescription>Distribuição do saldo atual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosGraficoSaldo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ banco, saldo, percent }) => 
                    `${banco}: ${formatarMoeda(saldo)} (${(percent * 100).toFixed(1)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="saldo"
                >
                  {dadosGraficoSaldo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatarMoeda(value)}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras Horizontal - Saldo por Banco */}
      <Card>
        <CardHeader>
          <CardTitle>Saldo Atual por Banco</CardTitle>
          <CardDescription>Comparação visual dos saldos</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={dadosGraficoSaldo}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number"
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                dataKey="banco" 
                type="category"
                width={100}
              />
              <Tooltip 
                formatter={(value: number) => formatarMoeda(value)}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
              />
              <Bar 
                dataKey="saldo" 
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
              >
                {dadosGraficoSaldo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="banco">Banco</Label>
              <Select value={filtroBanco} onValueChange={setFiltroBanco}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {contas.map(conta => (
                    <SelectItem key={conta.id} value={conta.id.toString()}>
                      {conta.banco} - {conta.agencia}/{conta.conta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações ({movimentacoesFiltradas.length})</CardTitle>
          <CardDescription>Entradas e saídas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {movimentacoesFiltradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma movimentação encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoesFiltradas.map((mov) => (
                  <TableRow 
                    key={mov.id}
                    className={mov.referencia?.startsWith('NF-') ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={() => mov.referencia?.startsWith('NF-') && handleViewNotaFiscal(mov)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatarData(mov.data)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {mov.contas_bancarias?.banco || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={mov.tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500'}>
                        {mov.tipo === 'entrada' ? (
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3 mr-1" />
                        )}
                        {mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{mov.descricao}</TableCell>
                    <TableCell>
                      {mov.categoria ? (
                        <Badge variant="outline" className="text-xs">
                          {mov.categoria}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {mov.referencia?.startsWith('NF-') ? (
                        <div className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                          <Receipt className="w-4 h-4" />
                          <span className="font-medium">{mov.referencia}</span>
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </div>
                      ) : (
                        mov.referencia || '-'
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {mov.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(mov.valor)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditMovimentacao(mov)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Movimentação</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMovimentacao(mov.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar Banco */}
      <Dialog open={isCreateBancoOpen} onOpenChange={setIsCreateBancoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Banco</DialogTitle>
            <DialogDescription>
              Cadastre uma nova conta bancária
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="banco">Banco *</Label>
              <Input
                id="banco"
                value={bancoForm.banco}
                onChange={(e) => setBancoForm({ ...bancoForm, banco: e.target.value })}
                placeholder="Ex: Banco do Brasil"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="agencia">Agência *</Label>
                <Input
                  id="agencia"
                  value={bancoForm.agencia}
                  onChange={(e) => setBancoForm({ ...bancoForm, agencia: e.target.value })}
                  placeholder="Ex: 1234-5"
                />
              </div>
              <div>
                <Label htmlFor="conta">Conta *</Label>
                <Input
                  id="conta"
                  value={bancoForm.conta}
                  onChange={(e) => setBancoForm({ ...bancoForm, conta: e.target.value })}
                  placeholder="Ex: 12345-6"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo_conta">Tipo de Conta *</Label>
                <Select
                  value={bancoForm.tipo_conta}
                  onValueChange={(value: any) => setBancoForm({ ...bancoForm, tipo_conta: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Conta Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                    <SelectItem value="investimento">Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="saldo_atual">Saldo Inicial</Label>
                <Input
                  id="saldo_atual"
                  type="number"
                  step="0.01"
                  value={bancoForm.saldo_atual}
                  onChange={(e) => setBancoForm({ ...bancoForm, saldo_atual: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={bancoForm.status}
                onValueChange={(value: any) => setBancoForm({ ...bancoForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                  <SelectItem value="bloqueada">Bloqueada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateBancoOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateBanco}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Criar Movimentação */}
      <Dialog open={isCreateMovimentacaoOpen} onOpenChange={setIsCreateMovimentacaoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Movimentação</DialogTitle>
            <DialogDescription>
              Registre uma entrada ou saída bancária
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mov_conta">Banco *</Label>
                <Select
                  value={movimentacaoForm.conta_bancaria_id}
                  onValueChange={(value) => setMovimentacaoForm({ ...movimentacaoForm, conta_bancaria_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {contas.map(conta => (
                      <SelectItem key={conta.id} value={conta.id.toString()}>
                        {conta.banco} - {conta.agencia}/{conta.conta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mov_tipo">Tipo *</Label>
                <Select
                  value={movimentacaoForm.tipo}
                  onValueChange={(value: any) => setMovimentacaoForm({ ...movimentacaoForm, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mov_valor">Valor *</Label>
                <Input
                  id="mov_valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={movimentacaoForm.valor}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, valor: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="mov_data">Data *</Label>
                <Input
                  id="mov_data"
                  type="date"
                  value={movimentacaoForm.data}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, data: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="mov_descricao">Descrição *</Label>
              <Input
                id="mov_descricao"
                value={movimentacaoForm.descricao}
                onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, descricao: e.target.value })}
                placeholder="Ex: Recebimento de cliente"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mov_referencia">Referência</Label>
                <Input
                  id="mov_referencia"
                  value={movimentacaoForm.referencia}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, referencia: e.target.value })}
                  placeholder="Ex: NF 12345"
                />
              </div>
              <div>
                <Label htmlFor="mov_categoria">Categoria</Label>
                <Input
                  id="mov_categoria"
                  value={movimentacaoForm.categoria}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, categoria: e.target.value })}
                  placeholder="Ex: Recebimento, Pagamento"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="mov_observacoes">Observações</Label>
              <Textarea
                id="mov_observacoes"
                value={movimentacaoForm.observacoes}
                onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateMovimentacaoOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateMovimentacao}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Movimentação */}
      <Dialog open={isEditMovimentacaoOpen} onOpenChange={setIsEditMovimentacaoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Movimentação</DialogTitle>
            <DialogDescription>
              Edite as informações da movimentação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_mov_conta">Banco *</Label>
                <Select
                  value={movimentacaoForm.conta_bancaria_id}
                  onValueChange={(value) => setMovimentacaoForm({ ...movimentacaoForm, conta_bancaria_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {contas.map(conta => (
                      <SelectItem key={conta.id} value={conta.id.toString()}>
                        {conta.banco} - {conta.agencia}/{conta.conta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_mov_tipo">Tipo *</Label>
                <Select
                  value={movimentacaoForm.tipo}
                  onValueChange={(value: any) => setMovimentacaoForm({ ...movimentacaoForm, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_mov_valor">Valor *</Label>
                <Input
                  id="edit_mov_valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={movimentacaoForm.valor}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, valor: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit_mov_data">Data *</Label>
                <Input
                  id="edit_mov_data"
                  type="date"
                  value={movimentacaoForm.data}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, data: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_mov_descricao">Descrição *</Label>
              <Input
                id="edit_mov_descricao"
                value={movimentacaoForm.descricao}
                onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, descricao: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_mov_referencia">Referência</Label>
                <Input
                  id="edit_mov_referencia"
                  value={movimentacaoForm.referencia}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, referencia: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_mov_categoria">Categoria</Label>
                <Input
                  id="edit_mov_categoria"
                  value={movimentacaoForm.categoria}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, categoria: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_mov_observacoes">Observações</Label>
              <Textarea
                id="edit_mov_observacoes"
                value={movimentacaoForm.observacoes}
                onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditMovimentacaoOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateMovimentacao}>
                Atualizar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes Nota Fiscal */}
      <Dialog open={isNotaFiscalDialogOpen} onOpenChange={setIsNotaFiscalDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
            <DialogDescription>
              Informações completas da nota fiscal vinculada a esta movimentação
            </DialogDescription>
          </DialogHeader>
          
          {loadingNotaFiscal ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando detalhes...</span>
            </div>
          ) : notaFiscalDetalhes ? (
            <div className="space-y-6">
              {/* Informações Principais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Número da NF</Label>
                  <p className="font-semibold">{notaFiscalDetalhes.numero_nf || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Série</Label>
                  <p className="font-semibold">{notaFiscalDetalhes.serie || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tipo</Label>
                  <Badge className={notaFiscalDetalhes.tipo === 'saida' ? 'bg-blue-500' : 'bg-orange-500'}>
                    {notaFiscalDetalhes.tipo === 'saida' ? 'Saída' : 'Entrada'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge 
                    className={
                      notaFiscalDetalhes.status === 'paga' ? 'bg-green-500' :
                      notaFiscalDetalhes.status === 'vencida' ? 'bg-red-500' :
                      notaFiscalDetalhes.status === 'cancelada' ? 'bg-gray-500' :
                      'bg-yellow-500'
                    }
                  >
                    {notaFiscalDetalhes.status === 'paga' ? 'Paga' :
                     notaFiscalDetalhes.status === 'vencida' ? 'Vencida' :
                     notaFiscalDetalhes.status === 'cancelada' ? 'Cancelada' :
                     'Pendente'}
                  </Badge>
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Data de Emissão</Label>
                  <p className="font-medium">{formatarData(notaFiscalDetalhes.data_emissao)}</p>
                </div>
                {notaFiscalDetalhes.data_vencimento && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Data de Vencimento</Label>
                    <p className="font-medium">{formatarData(notaFiscalDetalhes.data_vencimento)}</p>
                  </div>
                )}
              </div>

              {/* Valor Total */}
              <div className="border-t pt-4">
                <Label className="text-xs text-muted-foreground">Valor Total</Label>
                <p className="text-2xl font-bold text-primary">{formatarMoeda(notaFiscalDetalhes.valor_total || 0)}</p>
              </div>

              {/* Cliente/Fornecedor */}
              {(notaFiscalDetalhes.clientes || notaFiscalDetalhes.fornecedores) && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold mb-2 block">
                    {notaFiscalDetalhes.tipo === 'saida' ? 'Cliente' : 'Fornecedor'}
                  </Label>
                  {notaFiscalDetalhes.clientes && (
                    <div className="space-y-1">
                      <p className="font-medium">{notaFiscalDetalhes.clientes.nome || 'N/A'}</p>
                      {notaFiscalDetalhes.clientes.cnpj && (
                        <p className="text-sm text-muted-foreground">CNPJ: {notaFiscalDetalhes.clientes.cnpj}</p>
                      )}
                      {notaFiscalDetalhes.clientes.telefone && (
                        <p className="text-sm text-muted-foreground">Telefone: {notaFiscalDetalhes.clientes.telefone}</p>
                      )}
                      {notaFiscalDetalhes.clientes.email && (
                        <p className="text-sm text-muted-foreground">Email: {notaFiscalDetalhes.clientes.email}</p>
                      )}
                    </div>
                  )}
                  {notaFiscalDetalhes.fornecedores && (
                    <div className="space-y-1">
                      <p className="font-medium">{notaFiscalDetalhes.fornecedores.nome || 'N/A'}</p>
                      {notaFiscalDetalhes.fornecedores.cnpj && (
                        <p className="text-sm text-muted-foreground">CNPJ: {notaFiscalDetalhes.fornecedores.cnpj}</p>
                      )}
                      {notaFiscalDetalhes.fornecedores.telefone && (
                        <p className="text-sm text-muted-foreground">Telefone: {notaFiscalDetalhes.fornecedores.telefone}</p>
                      )}
                      {notaFiscalDetalhes.fornecedores.email && (
                        <p className="text-sm text-muted-foreground">Email: {notaFiscalDetalhes.fornecedores.email}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Venda/Compra Vinculada */}
              {(notaFiscalDetalhes.vendas || notaFiscalDetalhes.compras) && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold mb-2 block">
                    {notaFiscalDetalhes.vendas ? 'Venda Vinculada' : 'Compra Vinculada'}
                  </Label>
                  {notaFiscalDetalhes.vendas && (
                    <div>
                      <p className="font-medium">Número da Venda: {notaFiscalDetalhes.vendas.numero_venda || 'N/A'}</p>
                      {notaFiscalDetalhes.vendas.data_venda && (
                        <p className="text-sm text-muted-foreground">Data: {formatarData(notaFiscalDetalhes.vendas.data_venda)}</p>
                      )}
                    </div>
                  )}
                  {notaFiscalDetalhes.compras && (
                    <div>
                      <p className="font-medium">Número do Pedido: {notaFiscalDetalhes.compras.numero_pedido || 'N/A'}</p>
                      {notaFiscalDetalhes.compras.data_pedido && (
                        <p className="text-sm text-muted-foreground">Data: {formatarData(notaFiscalDetalhes.compras.data_pedido)}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Boletos Vinculados */}
              {notaFiscalDetalhes.boletos && Array.isArray(notaFiscalDetalhes.boletos) && notaFiscalDetalhes.boletos.length > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold mb-2 block">Boletos Vinculados</Label>
                  <div className="space-y-2">
                    {notaFiscalDetalhes.boletos.map((boleto: any) => (
                      <div key={boleto.id} className="p-3 bg-muted rounded-lg">
                        <p className="font-medium">Boleto: {boleto.numero_boleto || 'N/A'}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <p>Valor: {formatarMoeda(boleto.valor || 0)}</p>
                          {boleto.data_vencimento && (
                            <p>Vencimento: {formatarData(boleto.data_vencimento)}</p>
                          )}
                          <p>Status: 
                            <Badge className="ml-2" variant={
                              boleto.status === 'pago' ? 'default' :
                              boleto.status === 'vencido' ? 'destructive' :
                              'secondary'
                            }>
                              {boleto.status === 'pago' ? 'Pago' :
                               boleto.status === 'vencido' ? 'Vencido' :
                               'Pendente'}
                            </Badge>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              {notaFiscalDetalhes.observacoes && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold mb-2 block">Observações</Label>
                  <p className="text-sm whitespace-pre-wrap">{notaFiscalDetalhes.observacoes}</p>
                </div>
              )}

              {/* Informações Adicionais */}
              <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <Label className="text-xs">Criado em</Label>
                  <p>{notaFiscalDetalhes.created_at ? new Date(notaFiscalDetalhes.created_at).toLocaleString('pt-BR') : 'N/A'}</p>
                </div>
                {notaFiscalDetalhes.updated_at && (
                  <div>
                    <Label className="text-xs">Atualizado em</Label>
                    <p>{new Date(notaFiscalDetalhes.updated_at).toLocaleString('pt-BR')}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Não foi possível carregar os detalhes da nota fiscal
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsNotaFiscalDialogOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
