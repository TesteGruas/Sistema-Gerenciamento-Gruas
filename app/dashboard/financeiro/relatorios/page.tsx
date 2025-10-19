"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts'
import { 
  FileBarChart, 
  Plus, 
  Search, 
  Eye,
  Edit,
  Download,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Filter,
  MoreHorizontal,
  Package,
  Truck,
  Receipt,
  FileSpreadsheet,
  Printer,
  BarChart3,
  PieChart
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiRelatorios } from "@/lib/api-relatorios"
import { obrasApi } from "@/lib/api-obras"
import { gruasApi } from "@/lib/api-gruas"
import { receitasApi } from "@/lib/api-receitas"
import { custosApi } from "@/lib/api-custos"
import { getVendas } from "@/lib/api-financial"
import { locacoesApi } from "@/lib/api-locacoes"
import { estoqueAPI } from "@/lib/api-estoque"

// Cores para gráficos
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

// Mock data para demonstração
const mockRelatorioFinanceiro = [
  {
    mes: "Janeiro 2024",
    receitas: 250000,
    despesas: 180000,
    saldo: 70000,
    crescimento: 15
  },
  {
    mes: "Fevereiro 2024",
    receitas: 280000,
    despesas: 195000,
    saldo: 85000,
    crescimento: 12
  }
]

const mockRelatorioVendas = [
  {
    cliente: "Construtora ABC Ltda",
    totalVendas: 150000,
    quantidade: 5,
    ticketMedio: 30000,
    ultimaVenda: "2024-01-15"
  },
  {
    cliente: "Engenharia XYZ S/A",
    totalVendas: 120000,
    quantidade: 3,
    ticketMedio: 40000,
    ultimaVenda: "2024-01-14"
  }
]

const mockRelatorioContratos = [
  {
    numero: "CT-001",
    cliente: "Construtora ABC Ltda",
    valorTotal: 180000,
    valorMensal: 15000,
    inicio: "2024-01-01",
    fim: "2024-12-31",
    status: "ativo"
  }
]

const mockRelatorioFaturamento = [
  {
    mes: "Janeiro 2024",
    vendas: 150000,
    locacoes: 100000,
    servicos: 50000,
    total: 300000
  }
]

const mockRelatorioLocacoes = [
  {
    equipamento: "Grua 25t",
    cliente: "Construtora ABC Ltda",
    diasLocados: 30,
    valorTotal: 15000,
    aditivos: 2500,
    status: "ativa"
  }
]

const mockRelatorioEstoque = [
  {
    produto: "Grua 25t",
    categoria: "equipamentos",
    estoque: 3,
    valorUnitario: 15000,
    valorTotal: 45000,
    ultimaMovimentacao: "2024-01-15"
  }
]

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState('financeiro')
  const [selectedPeriod, setSelectedPeriod] = useState('mes')
  const [selectedCliente, setSelectedCliente] = useState('all')
  const [selectedCategoria, setSelectedCategoria] = useState('all')
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  
  // Estados para filtros avançados
  const [filtrosAvancados, setFiltrosAvancados] = useState({
    obra: "all",
    grua: "all",
    status: "all",
    periodoInicio: "",
    periodoFim: "",
    tipoRelatorio: "all"
  })
  
  const [obras, setObras] = useState<any[]>([])
  const [gruas, setGruas] = useState<any[]>([])
  const [colunasSelecionadas, setColunasSelecionadas] = useState<string[]>([])
  const [formatoExportacao, setFormatoExportacao] = useState("pdf")
  const [relatorioFinanceiro, setRelatorioFinanceiro] = useState<any[]>([])
  const [relatorioVendas, setRelatorioVendas] = useState<any[]>([])
  const [relatorioContratos, setRelatorioContratos] = useState<any[]>([])
  const [relatorioFaturamento, setRelatorioFaturamento] = useState<any[]>([])
  const [relatorioLocacoes, setRelatorioLocacoes] = useState<any[]>([])
  const [relatorioEstoque, setRelatorioEstoque] = useState<any[]>([])
  const [relatorioImpostos, setRelatorioImpostos] = useState<any>(null)
  const [isLoadingImpostos, setIsLoadingImpostos] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [])

  // Função para carregar relatório de impostos
  const carregarRelatorioImpostos = async (mes?: number, ano?: number) => {
    try {
      setIsLoadingImpostos(true)
      
      const hoje = new Date()
      const mesAtual = mes || hoje.getMonth() + 1
      const anoAtual = ano || hoje.getFullYear()
      
      const response = await apiRelatorios.impostos({
        mes: mesAtual,
        ano: anoAtual
      })
      
      setRelatorioImpostos(response.data)
      
      toast({
        title: "Sucesso",
        description: "Relatório de impostos carregado com sucesso",
        variant: "default"
      })
    } catch (error: any) {
      console.error('Erro ao carregar relatório de impostos:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar relatório de impostos",
        variant: "destructive"
      })
    } finally {
      setIsLoadingImpostos(false)
    }
  }

  const carregarDados = async () => {
    try {
      setIsLoading(true)
      
      // Definir período (últimos 6 meses)
      const hoje = new Date()
      const seisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1)
      const dataInicio = seisMesesAtras.toISOString().split('T')[0]
      const dataFim = hoje.toISOString().split('T')[0]
      
      // Carregar obras e gruas
      const [obrasData, gruasData] = await Promise.all([
        obrasApi.listarObras({ limit: 100 }),
        gruasApi.listarGruas({ limit: 100 })
      ])
      setObras(obrasData.data || [])
      setGruas(gruasData.data || [])
      
      // Carregar relatório de impostos do mês atual
      await carregarRelatorioImpostos()
      
      // Carregar relatório financeiro
      try {
        console.log('📅 Buscando receitas e custos de:', dataInicio, 'até:', dataFim)
        
        const receitasResponse = await receitasApi.list({ data_inicio: dataInicio, data_fim: dataFim })
        const custosResponse = await custosApi.list({ data_inicio: dataInicio, data_fim: dataFim })
        
        console.log('✅ Receitas response:', receitasResponse)
        console.log('✅ Custos response:', custosResponse)
        
        const receitas = receitasResponse.receitas || []
        const custos = custosResponse.custos || []
        
        // Agrupar por mês
        const dadosPorMes = new Map()
        
        receitas.forEach((receita: any) => {
          const mes = new Date(receita.data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          if (!dadosPorMes.has(mes)) {
            dadosPorMes.set(mes, { mes, receitas: 0, despesas: 0, saldo: 0, crescimento: 0 })
          }
          dadosPorMes.get(mes).receitas += receita.valor || 0
        })
        
        custos.forEach((custo: any) => {
          const mes = new Date(custo.data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          if (!dadosPorMes.has(mes)) {
            dadosPorMes.set(mes, { mes, receitas: 0, despesas: 0, saldo: 0, crescimento: 0 })
          }
          dadosPorMes.get(mes).despesas += custo.valor || 0
        })
        
        const dadosFinanceiros = Array.from(dadosPorMes.values()).map(item => ({
          ...item,
          saldo: item.receitas - item.despesas
        }))
        
        setRelatorioFinanceiro(dadosFinanceiros)
      } catch (error: any) {
        console.error('❌ Erro ao carregar relatório financeiro:', error)
        console.error('❌ Resposta do erro:', error.response?.data)
        console.error('❌ Status do erro:', error.response?.status)
        setRelatorioFinanceiro([])
      }
      
      // Carregar vendas
      try {
        const vendas = await getVendas()
        console.log('📊 Vendas carregadas (SEM FILTRO):', vendas)
        
        // Filtrar vendas por data no frontend
        const vendasFiltradas = vendas.filter((venda: any) => {
          const dataVenda = venda.data_venda || venda.data || venda.created_at
          if (!dataVenda) return false
          
          const data = new Date(dataVenda)
          const inicio = new Date(dataInicio)
          const fim = new Date(dataFim)
          
          return data >= inicio && data <= fim
        })
        
        console.log('📊 Vendas filtradas:', vendasFiltradas)
        
        // Agrupar vendas por cliente
        const vendasPorCliente = new Map()
        vendasFiltradas.forEach((venda: any) => {
          // Acessar dados do cliente do relacionamento do Supabase
          const clienteNome = venda.clientes?.nome || venda.cliente_nome || venda.nome_cliente || `Cliente ID: ${venda.cliente_id}` || 'Cliente não identificado'
          // Usar data de criação ou data da venda
          const dataVenda = venda.data_venda || venda.data || venda.created_at
          
          console.log('🔍 Venda processada:', { 
            venda_id: venda.id, 
            clienteNome, 
            cliente_obj: venda.clientes,
            dataVenda 
          })
          
          if (!vendasPorCliente.has(clienteNome)) {
            vendasPorCliente.set(clienteNome, {
              cliente: clienteNome,
              totalVendas: 0,
              quantidade: 0,
              ultimaVenda: dataVenda
            })
          }
          const dados = vendasPorCliente.get(clienteNome)
          dados.totalVendas += venda.valor_total || venda.valor || 0
          dados.quantidade += 1
          
          // Atualizar última venda apenas se a data for válida
          if (dataVenda && new Date(dataVenda).toString() !== 'Invalid Date') {
            if (!dados.ultimaVenda || new Date(dataVenda) > new Date(dados.ultimaVenda)) {
              dados.ultimaVenda = dataVenda
            }
          }
        })
        
        const dadosVendas = Array.from(vendasPorCliente.values()).map(item => ({
          ...item,
          ticketMedio: item.quantidade > 0 ? item.totalVendas / item.quantidade : 0
        }))
        
        console.log('📊 Relatório de vendas processado:', dadosVendas)
        setRelatorioVendas(dadosVendas)
      } catch (error: any) {
        console.error('❌ Erro ao carregar vendas:', error)
        console.error('❌ Resposta do erro:', error.response?.data)
        setRelatorioVendas([])
      }
      
      // Carregar faturamento (vendas + receitas + medições)
      try {
        const receitasResponse = await receitasApi.list({ data_inicio: dataInicio, data_fim: dataFim })
        const receitas = receitasResponse.receitas || []
        const vendasTodasFat = await getVendas()
        
        // Filtrar vendas por data
        const vendasFat = vendasTodasFat.filter((venda: any) => {
          const dataVenda = venda.data_venda || venda.data || venda.created_at
          if (!dataVenda) return false
          
          const data = new Date(dataVenda)
          const inicio = new Date(dataInicio)
          const fim = new Date(dataFim)
          
          return data >= inicio && data <= fim
        })
        
        console.log('💰 Receitas para faturamento:', receitas)
        console.log('💰 Vendas para faturamento (filtradas):', vendasFat)
        
        // Agrupar por mês
        const faturamentoPorMes = new Map()
        
        // Processar vendas
        vendasFat.forEach((venda: any) => {
          const dataVenda = venda.data_venda || venda.data || venda.created_at
          if (dataVenda && new Date(dataVenda).toString() !== 'Invalid Date') {
            const mes = new Date(dataVenda).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            if (!faturamentoPorMes.has(mes)) {
              faturamentoPorMes.set(mes, { mes, vendas: 0, locacoes: 0, servicos: 0, total: 0 })
            }
            faturamentoPorMes.get(mes).vendas += venda.valor_total || venda.valor || 0
          }
        })
        
        // Processar receitas (separar por tipo)
        receitas.forEach((receita: any) => {
          if (receita.data && new Date(receita.data).toString() !== 'Invalid Date') {
            const mes = new Date(receita.data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            if (!faturamentoPorMes.has(mes)) {
              faturamentoPorMes.set(mes, { mes, vendas: 0, locacoes: 0, servicos: 0, total: 0 })
            }
            
            const tipo = receita.tipo?.toLowerCase() || ''
            const valor = receita.valor || 0
            
            if (tipo.includes('locação') || tipo.includes('locacao') || tipo.includes('aluguel')) {
              faturamentoPorMes.get(mes).locacoes += valor
            } else if (tipo.includes('serviço') || tipo.includes('servico') || tipo.includes('manutenção')) {
              faturamentoPorMes.get(mes).servicos += valor
            } else {
              faturamentoPorMes.get(mes).vendas += valor
            }
          }
        })
        
        // Calcular totais
        const dadosFaturamento = Array.from(faturamentoPorMes.values()).map(item => ({
          ...item,
          total: item.vendas + item.locacoes + item.servicos
        }))
        
        console.log('💰 Relatório de faturamento processado:', dadosFaturamento)
        setRelatorioFaturamento(dadosFaturamento)
      } catch (error: any) {
        console.error('❌ Erro ao carregar faturamento:', error)
        console.error('❌ Resposta do erro:', error.response?.data)
        setRelatorioFaturamento([])
      }
      
      // Carregar locações
      try {
        const locacoesResponse = await locacoesApi.list()
        const locacoesTodas = locacoesResponse.data || locacoesResponse.locacoes || []
        
        // Filtrar locações por data (usar data_inicio)
        const locacoes = locacoesTodas.filter((locacao: any) => {
          const dataLocacao = locacao.data_inicio || locacao.created_at
          if (!dataLocacao) return true // Se não tem data, incluir
          
          const data = new Date(dataLocacao)
          const inicio = new Date(dataInicio)
          const fim = new Date(dataFim)
          
          return data >= inicio && data <= fim
        })
        
        console.log('🏗️ Locações filtradas:', locacoes)
        
        // Carregar gruas para relacionar com equipamento_id
        const gruasResponse = await gruasApi.listarGruas()
        const gruas = gruasResponse.data || gruasResponse || []
        
        const dadosLocacoes = locacoes.map((locacao: any) => {
          // Encontrar a grua correspondente
          const grua = gruas.find((g: any) => g.id === locacao.equipamento_id)
          const equipamentoNome = grua 
            ? `${grua.fabricante || ''} ${grua.modelo || grua.name || ''}`.trim() || grua.id 
            : locacao.equipamento_id || 'N/A'
          
          // Calcular dias locados
          const dataInicio = new Date(locacao.data_inicio)
          const dataFim = locacao.data_fim ? new Date(locacao.data_fim) : new Date()
          const diasLocados = Math.max(0, Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)))
          
          // Calcular valor total (valor mensal * meses)
          const mesesLocados = Math.max(1, Math.ceil(diasLocados / 30))
          const valorTotal = (locacao.valor_mensal || 0) * mesesLocados
          
          return {
            equipamento: equipamentoNome,
            cliente: locacao.cliente_nome || 'N/A',
            diasLocados,
            valorTotal,
            aditivos: locacao.total_aditivos || 0,
            status: locacao.status || 'ativa'
          }
        })
        
        console.log('🏗️ Relatório de locações processado:', dadosLocacoes)
        setRelatorioLocacoes(dadosLocacoes)
      } catch (error: any) {
        console.error('❌ Erro ao carregar locações:', error)
        console.error('❌ Resposta do erro:', error.response?.data)
        setRelatorioLocacoes([])
      }
      
      // Carregar estoque (movimentações)
      try {
        // Passar filtros de data para a API
        const movimentacoesResponse = await estoqueAPI.listarMovimentacoes({ 
          limit: 1000, // Aumentar limite para pegar mais movimentações
          data_inicio: dataInicio,
          data_fim: dataFim
        })
        const movimentacoes = movimentacoesResponse.data || []
        
        console.log('📦 Movimentações de estoque carregadas (com filtro):', movimentacoes)
        
        // Agrupar movimentações por produto
        const estoquePorProduto = new Map()
        
        movimentacoes.forEach((mov: any) => {
          // Acessar dados do produto do relacionamento do Supabase (igual ao que funciona no estoque)
          const produtoNome = mov.produtos?.nome || mov.produto_nome || `Produto ID: ${mov.produto_id}` || 'Produto não identificado'
          const produtoId = mov.produto_id || mov.produtos?.id
          
          console.log('📦 Movimentação processada:', {
            mov_id: mov.id,
            produtoNome,
            produtos_obj: mov.produtos,
            produto_id: mov.produto_id
          })
          
          if (!estoquePorProduto.has(produtoId)) {
            estoquePorProduto.set(produtoId, {
              produto: produtoNome,
              categoria: mov.produtos?.categorias?.nome || mov.categoria || 'N/A',
              estoque: 0,
              entradas: 0,
              saidas: 0,
              valorUnitario: mov.produtos?.valor_unitario || mov.valor_unitario || 0,
              ultimaMovimentacao: mov.data || mov.created_at
            })
          }
          
          const dados = estoquePorProduto.get(produtoId)
          const quantidade = mov.quantidade || 0
          
          // Contabilizar movimentações
          if (mov.tipo === 'Entrada' || mov.tipo === 'entrada') {
            dados.estoque += quantidade
            dados.entradas += quantidade
          } else if (mov.tipo === 'Saída' || mov.tipo === 'saida') {
            dados.estoque -= quantidade
            dados.saidas += quantidade
          }
          
          // Atualizar última movimentação
          const dataMovimentacao = mov.data || mov.created_at
          if (dataMovimentacao && new Date(dataMovimentacao) > new Date(dados.ultimaMovimentacao)) {
            dados.ultimaMovimentacao = dataMovimentacao
          }
        })
        
        const dadosEstoque = Array.from(estoquePorProduto.values()).map(item => ({
          produto: item.produto,
          categoria: item.categoria,
          estoque: item.estoque,
          valorUnitario: item.valorUnitario,
          valorTotal: item.estoque * item.valorUnitario,
          ultimaMovimentacao: item.ultimaMovimentacao
        }))
        
        console.log('📦 Relatório de estoque processado:', dadosEstoque)
        setRelatorioEstoque(dadosEstoque)
      } catch (error: any) {
        console.error('❌ Erro ao carregar estoque:', error)
        console.error('❌ Resposta do erro:', error.response?.data)
        setRelatorioEstoque([])
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos relatórios",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const gerarRelatorio = async () => {
    try {
      // Simplesmente recarregar todos os dados com os filtros atuais
      await carregarDados()
      
      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso"
      })
      
      setIsGenerateDialogOpen(false)
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório",
        variant: "destructive"
      })
    }
  }

  const exportarRelatorio = (formato: string) => {
    try {
      // Preparar dados para exportação
      const dados = {
        relatorio: relatorioFinanceiro,
        formato,
        filtros: filtrosAvancados,
        colunas: colunasSelecionadas
      }
      
      console.log(`Exportando relatório em formato ${formato}`, dados)
      
      toast({
        title: "Exportando",
        description: `Relatório sendo exportado em formato ${formato.toUpperCase()}`
      })
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório",
        variant: "destructive"
      })
    }
  }

  const stats = [
    { 
      title: "Relatórios Gerados", 
      value: "24", 
      icon: FileBarChart, 
      color: "bg-blue-500",
      change: "3 esta semana"
    },
    { 
      title: "Exportações", 
      value: "156", 
      icon: Download, 
      color: "bg-green-500",
      change: "12 hoje"
    },
    { 
      title: "Impressões", 
      value: "89", 
      icon: Printer, 
      color: "bg-purple-500",
      change: "5 hoje"
    },
    { 
      title: "Relatórios Pendentes", 
      value: "3", 
      icon: Clock, 
      color: "bg-orange-500",
      change: "2 vencem hoje"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800'
      case 'inativo':
        return 'bg-red-100 text-red-800'
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'equipamentos':
        return 'bg-blue-100 text-blue-800'
      case 'materiais':
        return 'bg-green-100 text-green-800'
      case 'servicos':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulo de Relatórios</h1>
          <p className="text-gray-600">Relatórios e análises personalizadas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Todos
          </Button>
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Todos
          </Button>
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Gerar Relatório Personalizado</DialogTitle>
                <DialogDescription>
                  Configure e gere um relatório personalizado
                </DialogDescription>
              </DialogHeader>
              <RelatorioForm onClose={() => setIsGenerateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros Avançados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="obra">Obra</Label>
              <Select 
                value={filtrosAvancados.obra} 
                onValueChange={(value) => setFiltrosAvancados({...filtrosAvancados, obra: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a obra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {obras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="grua">Grua</Label>
              <Select 
                value={filtrosAvancados.grua} 
                onValueChange={(value) => setFiltrosAvancados({...filtrosAvancados, grua: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a grua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as gruas</SelectItem>
                  {gruas.map(grua => (
                    <SelectItem key={grua.id} value={grua.id}>
                      {grua.nome} - {grua.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={filtrosAvancados.status} 
                onValueChange={(value) => setFiltrosAvancados({...filtrosAvancados, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="periodoInicio">Período Início</Label>
              <Input
                id="periodoInicio"
                type="date"
                value={filtrosAvancados.periodoInicio}
                onChange={(e) => setFiltrosAvancados({...filtrosAvancados, periodoInicio: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="periodoFim">Período Fim</Label>
              <Input
                id="periodoFim"
                type="date"
                value={filtrosAvancados.periodoFim}
                onChange={(e) => setFiltrosAvancados({...filtrosAvancados, periodoFim: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="tipoRelatorio">Tipo de Relatório</Label>
              <Select 
                value={filtrosAvancados.tipoRelatorio} 
                onValueChange={(value) => setFiltrosAvancados({...filtrosAvancados, tipoRelatorio: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="operacional">Operacional</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              <Button onClick={gerarRelatorio}>
                <FileBarChart className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
              <Button variant="outline" onClick={() => setFiltrosAvancados({
                obra: "all",
                grua: "all", 
                status: "all",
                periodoInicio: "",
                periodoFim: "",
                tipoRelatorio: "all"
              })}>
                <Filter className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="formato">Formato:</Label>
              <Select value={formatoExportacao} onValueChange={setFormatoExportacao}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos Consolidados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Receitas vs Despesas
            </CardTitle>
            <CardDescription>Evolução mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={mockRelatorioFinanceiro}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
                <Line type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={2} name="Saldo" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Faturamento por Categoria
            </CardTitle>
            <CardDescription>Distribuição mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsBarChart data={mockRelatorioFaturamento}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="vendas" stackId="a" fill="#3b82f6" name="Vendas" />
                <Bar dataKey="locacoes" stackId="a" fill="#10b981" name="Locações" />
                <Bar dataKey="servicos" stackId="a" fill="#f59e0b" name="Serviços" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Top Clientes
            </CardTitle>
            <CardDescription>Por volume de vendas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={mockRelatorioVendas.map(v => ({ 
                    name: v.cliente.split(' ')[0], 
                    value: v.totalVendas 
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockRelatorioVendas.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="locacoes">Locações</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="impostos">Impostos</TabsTrigger>
        </TabsList>

        {/* Relatório Financeiro */}
        <TabsContent value="financeiro" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Relatório Financeiro
              </CardTitle>
              <CardDescription>Fluxo de caixa diário e mensal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="periodo">Período</Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mes">Este Mês</SelectItem>
                        <SelectItem value="trimestre">Este Trimestre</SelectItem>
                        <SelectItem value="ano">Este Ano</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo de Relatório</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fluxo-caixa">Fluxo de Caixa</SelectItem>
                        <SelectItem value="dre">DRE</SelectItem>
                        <SelectItem value="balanco">Balanço</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="formato">Formato</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button>
                    <FileBarChart className="w-4 h-4 mr-2" />
                    Gerar Relatório
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                  <Button variant="outline">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead>Receitas</TableHead>
                      <TableHead>Despesas</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Crescimento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorioFinanceiro.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          {isLoading ? 'Carregando...' : 'Nenhum dado disponível'}
                        </TableCell>
                      </TableRow>
                    ) : relatorioFinanceiro.map((relatorio, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{relatorio.mes}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          R$ {relatorio.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="font-semibold text-red-600">
                          R$ {relatorio.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="font-bold text-lg">
                          R$ {relatorio.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            +{relatorio.crescimento}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Vendas */}
        <TabsContent value="vendas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Vendas</CardTitle>
              <CardDescription>Análise de vendas por cliente e período</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total Vendas</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Ticket Médio</TableHead>
                    <TableHead>Última Venda</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatorioVendas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        {isLoading ? 'Carregando...' : 'Nenhum dado disponível'}
                      </TableCell>
                    </TableRow>
                  ) : relatorioVendas.map((venda, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{venda.cliente}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {venda.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{venda.quantidade}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {venda.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {venda.ultimaVenda && new Date(venda.ultimaVenda).toString() !== 'Invalid Date' 
                          ? new Date(venda.ultimaVenda).toLocaleDateString('pt-BR')
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Contratos */}
        <TabsContent value="contratos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Contratos</CardTitle>
              <CardDescription>Análise de contratos ativos e inativos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatorioContratos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        {isLoading ? 'Carregando...' : 'Nenhum dado disponível'}
                      </TableCell>
                    </TableRow>
                  ) : relatorioContratos.map((contrato, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{contrato.numero}</TableCell>
                      <TableCell>{contrato.cliente}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {contrato.valorTotal.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {contrato.valorMensal.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {new Date(contrato.inicio).toLocaleDateString('pt-BR')} - {new Date(contrato.fim).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contrato.status)}>
                          {contrato.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Faturamento */}
        <TabsContent value="faturamento" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Faturamento</CardTitle>
              <CardDescription>Análise de faturamento por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Locações</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatorioFaturamento.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        {isLoading ? 'Carregando...' : 'Nenhum dado disponível'}
                      </TableCell>
                    </TableRow>
                  ) : relatorioFaturamento.map((faturamento, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{faturamento.mes}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {faturamento.vendas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {faturamento.locacoes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {faturamento.servicos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-bold text-lg">
                        R$ {faturamento.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Locações */}
        <TabsContent value="locacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Locações</CardTitle>
              <CardDescription>Equipamentos locados, aditivos e pagamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Dias Locados</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Aditivos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatorioLocacoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        {isLoading ? 'Carregando...' : 'Nenhum dado disponível'}
                      </TableCell>
                    </TableRow>
                  ) : relatorioLocacoes.map((locacao, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{locacao.equipamento}</TableCell>
                      <TableCell>{locacao.cliente}</TableCell>
                      <TableCell>{locacao.diasLocados}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {locacao.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {locacao.aditivos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(locacao.status)}>
                          {locacao.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Estoque */}
        <TabsContent value="estoque" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Estoque</CardTitle>
              <CardDescription>Análise de estoque e movimentações</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Valor Unitário</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Última Movimentação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatorioEstoque.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        {isLoading ? 'Carregando...' : 'Nenhum dado disponível'}
                      </TableCell>
                    </TableRow>
                  ) : relatorioEstoque.map((estoque, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{estoque.produto}</TableCell>
                      <TableCell>
                        <Badge className={getCategoriaColor(estoque.categoria)}>
                          {estoque.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell>{estoque.estoque}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {estoque.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-bold">
                        R$ {estoque.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {estoque.ultimaMovimentacao && new Date(estoque.ultimaMovimentacao).toString() !== 'Invalid Date'
                          ? new Date(estoque.ultimaMovimentacao).toLocaleDateString('pt-BR')
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Impostos */}
        <TabsContent value="impostos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Relatório de Impostos
              </CardTitle>
              <CardDescription>Análise de impostos por competência</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Label htmlFor="mes-impostos">Mês:</Label>
                  <Select onValueChange={(value) => carregarRelatorioImpostos(parseInt(value), new Date().getFullYear())}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="ano-impostos">Ano:</Label>
                  <Select onValueChange={(value) => carregarRelatorioImpostos(new Date().getMonth() + 1, parseInt(value))}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const ano = new Date().getFullYear() - 2 + i
                        return (
                          <SelectItem key={ano} value={ano.toString()}>
                            {ano}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => carregarRelatorioImpostos()} 
                  disabled={isLoadingImpostos}
                  className="flex items-center gap-2"
                >
                  {isLoadingImpostos ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Buscar
                </Button>
              </div>

              {relatorioImpostos ? (
                <div className="space-y-6">
                  {/* Resumo Geral */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total de Impostos</p>
                            <p className="text-2xl font-bold text-gray-900">
                              R$ {relatorioImpostos.total_impostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Pago</p>
                            <p className="text-2xl font-bold text-green-600">
                              R$ {relatorioImpostos.total_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Pendente</p>
                            <p className="text-2xl font-bold text-orange-600">
                              R$ {relatorioImpostos.total_pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <Clock className="w-8 h-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Taxa de Pagamento</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {((relatorioImpostos.total_pago / relatorioImpostos.total_impostos) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detalhamento por Tipo */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Detalhamento por Tipo de Imposto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo de Imposto</TableHead>
                            <TableHead>Valor Total</TableHead>
                            <TableHead>Valor Pago</TableHead>
                            <TableHead>Valor Pendente</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {relatorioImpostos.impostos_por_tipo.map((imposto, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{imposto.tipo}</TableCell>
                              <TableCell>
                                R$ {imposto.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="text-green-600">
                                R$ {imposto.valor_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="text-orange-600">
                                R$ {imposto.valor_pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  className={
                                    imposto.valor_pendente === 0 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-orange-100 text-orange-800"
                                  }
                                >
                                  {imposto.valor_pendente === 0 ? "Pago" : "Pendente"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {isLoadingImpostos ? 'Carregando relatório de impostos...' : 'Selecione um período para visualizar o relatório de impostos'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RelatorioForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    tipo: '',
    periodo: '',
    formato: 'pdf',
    filtros: '',
    observacoes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Gerando relatório:', formData)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipo">Tipo de Relatório</Label>
          <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financeiro">Financeiro</SelectItem>
              <SelectItem value="vendas">Vendas</SelectItem>
              <SelectItem value="contratos">Contratos</SelectItem>
              <SelectItem value="faturamento">Faturamento</SelectItem>
              <SelectItem value="locacoes">Locações</SelectItem>
              <SelectItem value="estoque">Estoque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="periodo">Período</Label>
          <Select value={formData.periodo} onValueChange={(value) => setFormData({ ...formData, periodo: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="trimestre">Este Trimestre</SelectItem>
              <SelectItem value="ano">Este Ano</SelectItem>
              <SelectItem value="personalizado">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="formato">Formato</Label>
          <Select value={formData.formato} onValueChange={(value) => setFormData({ ...formData, formato: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="filtros">Filtros Adicionais</Label>
          <Input
            id="filtros"
            value={formData.filtros}
            onChange={(e) => setFormData({ ...formData, filtros: e.target.value })}
            placeholder="Ex: cliente, categoria, status..."
          />
        </div>
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          rows={3}
          placeholder="Observações adicionais para o relatório..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Gerar Relatório
        </Button>
      </div>
    </form>
  )
}
