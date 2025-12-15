"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
import { Package, Plus, Search, Edit, TrendingDown, TrendingUp, AlertTriangle, Archive, BarChart3, CheckCircle, Loader2, Trash2 } from "lucide-react"
import { estoqueAPI, type Produto, type Categoria, type Movimentacao } from "@/lib/api-estoque"
import { useToast } from "@/hooks/use-toast"
import { ExportButton } from "@/components/export-button"
import { ProtectedRoute } from "@/components/protected-route"
import { obrasApi } from "@/lib/api-obras"
import { gruasApi } from "@/lib/api-gruas"
import { DebugButton } from "@/components/debug-button"

export default function EstoquePage() {
  const { toast } = useToast()
  
  // Estados principais
  const [estoque, setEstoque] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMovimentacoes, setLoadingMovimentacoes] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMovDialogOpen, setIsMovDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Produto | null>(null)
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    categoria_id: "todas",
    status: "todos",
    tipo_item: "todos",
    page: 1,
    limit: 10
  })
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // Estados para filtros de movimentações
  const [filtrosMovimentacoes, setFiltrosMovimentacoes] = useState({
    tipo: "todos",
    data: "",
    categoria_id: "todas",
    page: 1,
    limit: 10
  })
  const [totalPagesMovimentacoes, setTotalPagesMovimentacoes] = useState(1)
  const [totalItemsMovimentacoes, setTotalItemsMovimentacoes] = useState(0)

  // Formulário para novo item
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    categoria_id: 0,
    codigo_barras: "",
    unidade_medida: "",
    valor_unitario: 0,
    estoque_minimo: 0,
    estoque_maximo: 0,
    localizacao: "",
    status: "Ativo" as "Ativo" | "Inativo",
    quantidade_inicial: 0,
    quantidade_reservada_inicial: 0,
    classificacao_tipo: "" as "" | "componente" | "item" | "ativo" | "complemento",
    subcategoria_ativo: "" as "" | "grua" | "equipamento_grua" | "ferramenta" | "ar_condicionado" | "camera" | "auto" | "pc",
  })

  // Formulário para movimentação
  const [movFormData, setMovFormData] = useState({
    produto_id: "",
    tipo: "Entrada" as "Entrada" | "Saída" | "Ajuste",
    quantidade: 0,
    motivo: "",
    observacoes: "",
  })

  // Formulário para nova categoria
  const [categoryFormData, setCategoryFormData] = useState({
    nome: "",
    descricao: "",
    status: "Ativa" as "Ativa" | "Inativa",
  })

  // Flags para controlar carregamento e evitar chamadas duplicadas
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const loadingRef = useRef(false)
  const movimentacoesLoadingRef = useRef(false)

  // Carregar dados iniciais - apenas uma vez
  useEffect(() => {
    if (!dadosIniciaisCarregados && !loadingRef.current) {
      loadingRef.current = true
      carregarDados().finally(() => {
        setDadosIniciaisCarregados(true)
        loadingRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosIniciaisCarregados])

  // Recarregar quando filtros mudarem (com debounce)
  useEffect(() => {
    if (!dadosIniciaisCarregados) return
    
    const timer = setTimeout(() => {
      if (!loadingRef.current) {
        loadingRef.current = true
        carregarDados().finally(() => {
          loadingRef.current = false
        })
      }
    }, 300)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, dadosIniciaisCarregados])

  // Carregar movimentações separadamente (com debounce)
  useEffect(() => {
    if (!dadosIniciaisCarregados) return
    
    const timer = setTimeout(() => {
      if (!movimentacoesLoadingRef.current) {
        movimentacoesLoadingRef.current = true
        setLoadingMovimentacoes(true)
        carregarMovimentacoes().finally(() => {
          movimentacoesLoadingRef.current = false
          setLoadingMovimentacoes(false)
        })
      }
    }, 400)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosMovimentacoes, dadosIniciaisCarregados])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Preparar parâmetros de filtro
      const params: any = {
        page: filtros.page,
        limit: filtros.limit
      }
      
      if (filtros.categoria_id && filtros.categoria_id !== "todas") {
        params.categoria_id = parseInt(filtros.categoria_id)
      }
      
      if (filtros.status && filtros.status !== "todos") {
        params.status = filtros.status
      }
      
      if (filtros.tipo_item && filtros.tipo_item !== "todos") {
        params.tipo_item = filtros.tipo_item
      }

      const [produtosResponse, categoriasResponse] = await Promise.all([
        estoqueAPI.listarProdutos(params),
        estoqueAPI.listarCategorias()
      ])
      
      // Debug: verificar estrutura dos dados
      if (produtosResponse.data && produtosResponse.data.length > 0) {
        console.log('Primeiro produto:', produtosResponse.data[0])
        console.log('Estrutura do estoque:', produtosResponse.data[0]?.estoque)
      }
      
      setEstoque(produtosResponse.data)
      setCategorias(categoriasResponse.data)
      
      // Atualizar informações de paginação se disponíveis
      if (produtosResponse.pagination) {
        setTotalItems(produtosResponse.pagination.total)
        setTotalPages(produtosResponse.pagination.pages)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do estoque",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarMovimentacoes = async () => {
    try {
      // Preparar parâmetros para movimentações
      const paramsMovimentacoes: any = {
        page: filtrosMovimentacoes.page,
        limit: filtrosMovimentacoes.limit
      }
      
      if (filtrosMovimentacoes.tipo && filtrosMovimentacoes.tipo !== "todos") {
        paramsMovimentacoes.tipo = filtrosMovimentacoes.tipo
      }
      
      if (filtrosMovimentacoes.data) {
        paramsMovimentacoes.data_inicio = filtrosMovimentacoes.data
        paramsMovimentacoes.data_fim = filtrosMovimentacoes.data
      }
      
      if (filtrosMovimentacoes.categoria_id && filtrosMovimentacoes.categoria_id !== "todas") {
        paramsMovimentacoes.categoria_id = parseInt(filtrosMovimentacoes.categoria_id)
      }

      const movimentacoesResponse = await estoqueAPI.listarMovimentacoes(paramsMovimentacoes)
      setMovimentacoes(movimentacoesResponse.data)
      
      // Atualizar informações de paginação das movimentações
      if (movimentacoesResponse.pagination) {
        setTotalItemsMovimentacoes(movimentacoesResponse.pagination.total)
        setTotalPagesMovimentacoes(movimentacoesResponse.pagination.pages)
      }
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar movimentações",
        variant: "destructive",
      })
    }
  }

  // Funções para gerenciar filtros
  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      page: 1 // Reset para primeira página ao filtrar
    }))
  }

  const limparFiltros = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setFiltros({
      categoria_id: "todas",
      status: "todos",
      tipo_item: "todos",
      page: 1,
      limit: 10
    })
    setSearchTerm("")
  }

  const handlePageChange = (novaPagina: number) => {
    setFiltros(prev => ({
      ...prev,
      page: novaPagina
    }))
  }

  // Funções para gerenciar filtros de movimentações
  const handleFiltroMovimentacaoChange = (campo: string, valor: string) => {
    setFiltrosMovimentacoes(prev => ({
      ...prev,
      [campo]: valor,
      page: 1 // Reset para primeira página ao filtrar
    }))
  }

  const limparFiltrosMovimentacoes = () => {
    setFiltrosMovimentacoes({
      tipo: "todos",
      data: "",
      categoria_id: "todas",
      page: 1,
      limit: 10
    })
  }

  const handlePageChangeMovimentacoes = (novaPagina: number) => {
    setFiltrosMovimentacoes(prev => ({
      ...prev,
      page: novaPagina
    }))
  }

  // Funções para buscar todos os dados da API para exportação
  const buscarTodosDadosEstoque = async () => {
    try {
      // Preparar parâmetros de filtro (mesmos da visualização)
      const params: any = {
        page: 1,
        limit: 10000 // Limite alto para buscar todos
      }
      
      if (filtros.categoria_id && filtros.categoria_id !== "todas") {
        params.categoria_id = parseInt(filtros.categoria_id)
      }
      
      if (filtros.status && filtros.status !== "todos") {
        params.status = filtros.status
      }
      
      if (filtros.tipo_item && filtros.tipo_item !== "todos") {
        params.tipo_item = filtros.tipo_item
      }

      const response = await estoqueAPI.listarProdutos(params)
      
      // Se houver mais páginas, buscar todas
      if (response.pagination && response.pagination.pages > 1) {
        const todasPaginas = await Promise.all(
          Array.from({ length: response.pagination.pages }, (_, i) => 
            estoqueAPI.listarProdutos({ ...params, page: i + 1, limit: response.pagination?.limit || 10000 })
          )
        )
        return todasPaginas.flatMap(page => page.data)
      }
      
      return response.data
    } catch (error) {
      console.error('Erro ao buscar dados de estoque:', error)
      throw error
    }
  }

  const buscarTodosDadosMovimentacoes = async () => {
    try {
      // Preparar parâmetros de filtro (mesmos da visualização)
      const paramsMovimentacoes: any = {
        page: 1,
        limit: 10000 // Limite alto para buscar todos
      }
      
      if (filtrosMovimentacoes.tipo && filtrosMovimentacoes.tipo !== "todos") {
        paramsMovimentacoes.tipo = filtrosMovimentacoes.tipo
      }
      
      if (filtrosMovimentacoes.data) {
        paramsMovimentacoes.data_inicio = filtrosMovimentacoes.data
        paramsMovimentacoes.data_fim = filtrosMovimentacoes.data
      }
      
      if (filtrosMovimentacoes.categoria_id && filtrosMovimentacoes.categoria_id !== "todas") {
        paramsMovimentacoes.categoria_id = parseInt(filtrosMovimentacoes.categoria_id)
      }

      const response = await estoqueAPI.listarMovimentacoes(paramsMovimentacoes)
      
      // Se houver mais páginas, buscar todas
      if (response.pagination && response.pagination.pages > 1) {
        const todasPaginas = await Promise.all(
          Array.from({ length: response.pagination.pages }, (_, i) => 
            estoqueAPI.listarMovimentacoes({ ...paramsMovimentacoes, page: i + 1, limit: response.pagination?.limit || 10000 })
          )
        )
        return todasPaginas.flatMap(page => page.data)
      }
      
      return response.data
    } catch (error) {
      console.error('Erro ao buscar dados de movimentações:', error)
      throw error
    }
  }

  // Funções de exportação
  const prepararDadosEstoque = (dados: Produto[]) => {
    return dados.map((item: Produto) => {
      // Buscar dados de estoque
      let estoqueData: any = null
      if (item.estoque) {
        if (Array.isArray(item.estoque)) {
          estoqueData = item.estoque.length > 0 ? item.estoque[0] : null
        } else {
          estoqueData = item.estoque
        }
      }
      
      return {
        'ID': item.id,
        'Nome': item.nome,
        'Descrição': item.descricao || '',
        'Categoria': item.categorias?.nome || '',
        'Código de Barras': item.codigo_barras || '',
        'Unidade de Medida': item.unidade_medida || '',
        'Quantidade Disponível': estoqueData?.quantidade_disponivel || 0,
        'Quantidade Reservada': estoqueData?.quantidade_reservada || 0,
        'Quantidade Atual': estoqueData?.quantidade_atual || 0,
        'Estoque Mínimo': item.estoque_minimo || 0,
        'Estoque Máximo': item.estoque_maximo || 0,
        'Valor Unitário': `R$ ${(item.valor_unitario || 0).toFixed(2)}`,
        'Valor Total': `R$ ${(estoqueData?.valor_total || 0).toFixed(2)}`,
        'Localização': item.localizacao || '',
        'Status': item.status || 'Ativo',
        'Última Movimentação': estoqueData?.ultima_movimentacao 
          ? new Date(estoqueData.ultima_movimentacao).toLocaleString('pt-BR')
          : 'N/A'
      }
    })
  }

  const prepararDadosMovimentacoes = (dados: Movimentacao[]) => {
    return dados.map((mov: Movimentacao) => {
      const produtoNome = (mov as any).produtos?.nome || mov.produto_id || 'N/A'
      const categoriaNome = (mov as any).produtos?.categorias?.nome || 'N/A'
      return {
        'Data': new Date(mov.data_movimentacao).toLocaleDateString('pt-BR'),
        'Hora': new Date(mov.data_movimentacao).toLocaleTimeString('pt-BR'),
        'Produto': produtoNome,
        'Categoria': categoriaNome,
        'Tipo': mov.tipo,
        'Quantidade': mov.quantidade,
        'Unidade de Medida': (mov as any).produtos?.unidade_medida || '',
        'Valor Unitário': `R$ ${(mov.valor_unitario || 0).toFixed(2)}`,
        'Valor Total': `R$ ${(mov.valor_total || 0).toFixed(2)}`,
        'Motivo': mov.motivo || '',
        'Responsável ID': mov.responsavel_id || '',
        'Observações': mov.observacoes || '',
        'Referência': (mov as any).referencia || ''
      }
    })
  }

  const exportarEstoque = async (formato: 'pdf' | 'excel' | 'csv') => {
    try {
      setLoadingMovimentacoes(true) // Reutilizar o loading state
      toast({
        title: "Carregando dados...",
        description: "Buscando todos os itens de estoque para exportação.",
      })
      
      // Buscar todos os dados da API
      const todosDados = await buscarTodosDadosEstoque()
      
      if (todosDados.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há itens de estoque para exportar.",
          variant: "destructive"
        })
        return
      }
      
      // Aplicar filtro de busca se houver
      let dadosFiltrados = todosDados
      if (searchTerm) {
        dadosFiltrados = todosDados.filter(
          (item) =>
            item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.categorias?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.codigo_barras || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      const dados = prepararDadosEstoque(dadosFiltrados)
      
      if (dados.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há itens de estoque que correspondam aos filtros aplicados.",
          variant: "destructive"
        })
        return
      }

      if (formato === 'csv') {
        const headers = Object.keys(dados[0])
        const csvContent = [
          headers.join(','),
          ...dados.map((row: any) => 
            headers.map(header => {
              const value = row[header]
              if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`
              }
              return value || ''
            }).join(',')
          )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `estoque-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Exportação concluída!",
          description: "Arquivo CSV baixado com sucesso.",
        })
      } else if (formato === 'pdf') {
      try {
        const { jsPDF } = await import('jspdf')
        const autoTable = (await import('jspdf-autotable')).default

        const doc = new jsPDF()
        
        // Adicionar logos no cabeçalho
        const { adicionarLogosNoCabecalhoFrontend } = await import('@/lib/utils/pdf-logos-frontend')
        let yPos = await adicionarLogosNoCabecalhoFrontend(doc, 10)
        
        // Título
        doc.setFontSize(16)
        doc.text('Relatório de Estoque', 14, yPos)
        yPos += 8
        doc.setFontSize(10)
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, yPos)
        yPos += 8

        // Dados da tabela
        const headers = Object.keys(dados[0])
        const tableData = dados.map((row: any) => 
          headers.map(header => row[header] || '')
        )

        autoTable(doc, {
          head: [headers],
          body: tableData,
          startY: yPos,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [66, 139, 202] },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        })

        // Adicionar rodapé
        const { adicionarRodapeEmpresaFrontend } = await import('@/lib/utils/pdf-rodape-frontend')
        adicionarRodapeEmpresaFrontend(doc)

        doc.save(`estoque-${new Date().toISOString().split('T')[0]}.pdf`)

        toast({
          title: "Exportação concluída!",
          description: "Arquivo PDF baixado com sucesso.",
        })
      } catch (error) {
        console.error('Erro ao exportar PDF:', error)
        toast({
          title: "Erro na exportação",
          description: "Não foi possível exportar o PDF.",
          variant: "destructive"
        })
      }
      }
    } catch (error) {
      console.error('Erro ao exportar estoque:', error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível buscar os dados para exportação.",
        variant: "destructive"
      })
    } finally {
      setLoadingMovimentacoes(false)
    }
  }

  const exportarMovimentacoes = async (formato: 'pdf' | 'excel' | 'csv') => {
    try {
      setLoadingMovimentacoes(true)
      toast({
        title: "Carregando dados...",
        description: "Buscando todas as movimentações para exportação.",
      })
      
      // Buscar todos os dados da API
      const todosDados = await buscarTodosDadosMovimentacoes()
      
      if (todosDados.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há movimentações para exportar.",
          variant: "destructive"
        })
        return
      }
      
      const dados = prepararDadosMovimentacoes(todosDados)
      
      if (dados.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há movimentações que correspondam aos filtros aplicados.",
          variant: "destructive"
        })
        return
      }

      if (formato === 'csv') {
        const headers = Object.keys(dados[0])
        const csvContent = [
          headers.join(','),
          ...dados.map((row: any) => 
            headers.map(header => {
              const value = row[header]
              if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`
              }
              return value || ''
            }).join(',')
          )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `movimentacoes-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Exportação concluída!",
          description: "Arquivo CSV baixado com sucesso.",
        })
      } else if (formato === 'pdf') {
      try {
        const { jsPDF } = await import('jspdf')
        const autoTable = (await import('jspdf-autotable')).default

        const doc = new jsPDF()
        
        // Adicionar logos no cabeçalho
        const { adicionarLogosNoCabecalhoFrontend } = await import('@/lib/utils/pdf-logos-frontend')
        let yPos = await adicionarLogosNoCabecalhoFrontend(doc, 10)
        
        // Título
        doc.setFontSize(16)
        doc.text('Relatório de Movimentações de Estoque', 14, yPos)
        yPos += 8
        doc.setFontSize(10)
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, yPos)
        yPos += 8

        // Dados da tabela
        const headers = Object.keys(dados[0])
        const tableData = dados.map((row: any) => 
          headers.map(header => row[header] || '')
        )

        autoTable(doc, {
          head: [headers],
          body: tableData,
          startY: yPos,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [66, 139, 202] },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        })

        // Adicionar rodapé
        const { adicionarRodapeEmpresaFrontend } = await import('@/lib/utils/pdf-rodape-frontend')
        adicionarRodapeEmpresaFrontend(doc)

        doc.save(`movimentacoes-${new Date().toISOString().split('T')[0]}.pdf`)

        toast({
          title: "Exportação concluída!",
          description: "Arquivo PDF baixado com sucesso.",
        })
      } catch (error) {
        console.error('Erro ao exportar PDF:', error)
        toast({
          title: "Erro na exportação",
          description: "Não foi possível exportar o PDF.",
          variant: "destructive"
        })
      }
      }
    } catch (error) {
      console.error('Erro ao exportar movimentações:', error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível buscar os dados para exportação.",
        variant: "destructive"
      })
    } finally {
      setLoadingMovimentacoes(false)
    }
  }

  const filteredEstoque = estoque.filter(
    (item) =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.categorias?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.codigo_barras || '').toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Função auxiliar para buscar dados de estoque de um produto
  const getEstoqueData = (produtoId: string) => {
    const produto = estoque.find((e: any) => e.id === produtoId)
    if (!produto) {
      console.warn(`Produto ${produtoId} não encontrado no estado`)
      return null
    }
    
    // O Supabase pode retornar como array ou objeto único
    const estoqueData = produto.estoque
    
    // Se não existe estoque, retornar null
    if (!estoqueData) {
      console.warn(`Estoque não encontrado para produto ${produtoId}`)
      return null
    }
    
    // Se for array (relacionamento do Supabase)
    if (Array.isArray(estoqueData)) {
      if (estoqueData.length === 0) {
        console.warn(`Array de estoque vazio para produto ${produtoId}`)
        return null
      }
      return estoqueData[0]
    }
    
    // Se for um objeto único, retornar diretamente
    if (typeof estoqueData === 'object') {
      return estoqueData
    }
    
    console.warn(`Formato de estoque desconhecido para produto ${produtoId}:`, typeof estoqueData)
    return null
  }

  const getStatusBadge = (item: Produto) => {
    // Buscar dados de estoque para este produto
    const estoqueData = getEstoqueData(item.id)
    const estoqueAtual = estoqueData?.quantidade_disponivel || 0
    const estoqueMinimo = item.estoque_minimo || 0
    
    if (estoqueAtual <= estoqueMinimo) {
      return (
        <Badge 
          variant="secondary" 
          className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
        >
          Estoque Baixo
        </Badge>
      )
    }
    if (estoqueAtual <= estoqueMinimo * 1.5) {
      return (
        <Badge 
          variant="secondary" 
          className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
        >
          Atenção
        </Badge>
      )
    }
    return (
      <Badge 
        variant="secondary" 
        className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
      >
        Normal
      </Badge>
    )
  }

  const preencherDadosDebugEstoque = () => {
    setFormData({
      nome: "Cabo de Aço 12mm",
      descricao: "Cabo de aço galvanizado 12mm, resistência 8 toneladas",
      categoria_id: categorias.length > 0 ? categorias[0].id : 0,
      codigo_barras: "7891234567890",
      unidade_medida: "metro",
      valor_unitario: 45.50,
      estoque_minimo: 100,
      estoque_maximo: 500,
      localizacao: "Galpão A - Prateleira 3",
      status: "Ativo",
      quantidade_inicial: 250,
      quantidade_reservada_inicial: 0
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação do estoque máximo
    if (formData.estoque_maximo && formData.estoque_maximo <= formData.estoque_minimo) {
      toast({
        title: "Erro de Validação",
        description: "O estoque máximo deve ser maior que o estoque mínimo",
        variant: "destructive",
      })
      return
    }
    
    try {
      if (editingItem) {
        await estoqueAPI.atualizarProduto(editingItem.id, formData)
        toast({
          title: "Sucesso",
          description: "Produto atualizado com sucesso",
        })
      } else {
        // Criar produto
        const produtoResponse = await estoqueAPI.criarProduto({
          nome: formData.nome,
          descricao: formData.descricao,
          categoria_id: formData.categoria_id,
          codigo_barras: formData.codigo_barras,
          unidade_medida: formData.unidade_medida,
          valor_unitario: formData.valor_unitario,
          estoque_minimo: formData.estoque_minimo,
          estoque_maximo: formData.estoque_maximo,
          localizacao: formData.localizacao,
          status: formData.status,
          classificacao_tipo: formData.classificacao_tipo || undefined,
          subcategoria_ativo: formData.classificacao_tipo === "ativo" ? formData.subcategoria_ativo || undefined : undefined,
        } as any)
        
        // Se houver quantidade inicial, criar movimentação de entrada
        if (formData.quantidade_inicial > 0 && produtoResponse.data?.id) {
          try {
            await estoqueAPI.movimentarEstoque({
              produto_id: produtoResponse.data.id,
              tipo: "Entrada",
              quantidade: formData.quantidade_inicial,
              motivo: "Estoque inicial",
              observacoes: "Estoque inicial do produto",
            })
          } catch (movError) {
            console.error('Erro ao criar movimentação inicial:', movError)
            // Não falhar a criação do produto se a movimentação falhar
            toast({
              title: "Aviso",
              description: "Produto criado, mas houve erro ao registrar estoque inicial",
              variant: "default",
            })
          }
        }
        
        // Se houver quantidade reservada inicial, criar reserva
        if (formData.quantidade_reservada_inicial > 0 && produtoResponse.data?.id) {
          try {
            await estoqueAPI.reservarEstoque({
              produto_id: produtoResponse.data.id,
              quantidade: formData.quantidade_reservada_inicial,
              motivo: "Reserva inicial",
              observacoes: "Reserva inicial do produto",
            })
          } catch (reservaError) {
            console.error('Erro ao criar reserva inicial:', reservaError)
            // Não falhar se a reserva falhar
          }
        }
        
        toast({
          title: "Sucesso",
          description: "Produto criado com sucesso",
        })
      }
      
      await carregarDados()
      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar produto",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      categoria_id: 0,
      codigo_barras: "",
      unidade_medida: "",
      valor_unitario: 0,
      estoque_minimo: 0,
      estoque_maximo: 0,
      localizacao: "",
      status: "Ativo",
      quantidade_inicial: 0,
      quantidade_reservada_inicial: 0,
      classificacao_tipo: "",
      subcategoria_ativo: "",
    })
    setEditingItem(null)
  }

  const handleMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await estoqueAPI.movimentarEstoque(movFormData)
      toast({
        title: "Sucesso",
        description: "Movimentação registrada com sucesso",
      })
      
      await carregarDados()
      setMovFormData({
        produto_id: "",
        tipo: "Entrada",
        quantidade: 0,
        motivo: "",
        observacoes: "",
      })
      setIsMovDialogOpen(false)
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao registrar movimentação",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (produto: Produto) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
      return
    }

    try {
      await estoqueAPI.excluirProduto(produto.id)
      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso",
      })
      await carregarDados()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir produto",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (item: Produto) => {
    setEditingItem(item)
    setFormData({
      nome: item.nome,
      descricao: item.descricao || "",
      categoria_id: item.categoria_id,
      codigo_barras: item.codigo_barras || "",
      unidade_medida: item.unidade_medida,
      valor_unitario: item.valor_unitario,
      estoque_minimo: item.estoque_minimo,
      estoque_maximo: item.estoque_maximo || 0,
      localizacao: item.localizacao || "",
      status: item.status,
      quantidade_inicial: 0,
      quantidade_reservada_inicial: 0,
      classificacao_tipo: (item as any).classificacao_tipo || "",
      subcategoria_ativo: (item as any).subcategoria_ativo || "",
    })
    setIsDialogOpen(true)
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await estoqueAPI.criarCategoria(categoryFormData)
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso",
      })
      
      await carregarDados()
      setCategoryFormData({
        nome: "",
        descricao: "",
        status: "Ativa",
      })
      setIsCategoryDialogOpen(false)
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar categoria",
        variant: "destructive",
      })
    }
  }


  const stats = [
    { 
      title: "Total de Itens", 
      value: totalItems > 0 ? totalItems : estoque.length, 
      icon: Package, 
      color: "bg-blue-500" 
    },
    {
      title: "Estoque Baixo",
      value: estoque.filter((item) => {
        const estoqueData = getEstoqueData(item.id)
        const estoqueAtual = estoqueData?.quantidade_disponivel || 0
        const estoqueMinimo = item.estoque_minimo || 0
        return estoqueAtual <= estoqueMinimo
      }).length,
      icon: AlertTriangle,
      color: "bg-red-500",
    },
    {
      title: "Valor Total",
      value: `R$ ${estoque.reduce((acc, item) => {
        const estoqueData = getEstoqueData(item.id)
        const valorTotal = estoqueData?.valor_total || 0
        return acc + valorTotal
      }, 0).toLocaleString()}`,
      icon: BarChart3,
      color: "bg-green-500",
    },
    {
      title: "Categorias",
      value: new Set(estoque.map((item) => item.categorias?.nome).filter(Boolean)).size,
      icon: Archive,
      color: "bg-purple-500",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando estoque...</span>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute permission="estoque:visualizar" showAccessDenied={true}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Controle de Estoque</h1>
          <p className="text-gray-600">Gerenciamento completo do estoque de materiais</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <div className="flex gap-2">
              <ExportButton
                dados={estoque}
                tipo="estoque"
                nomeArquivo="relatorio-estoque"
                titulo="Relatório de Estoque"
              />
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Item
                </Button>
              </DialogTrigger>
            </div>
          </Dialog>

          <Dialog open={isMovDialogOpen} onOpenChange={setIsMovDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent">
                <TrendingUp className="w-4 h-4 mr-2" />
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Movimentação</DialogTitle>
                <DialogDescription>Registre entrada ou saída de produtos do estoque</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleMovimentacao} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="produto">Produto</Label>
                  <Select
                    value={movFormData.produto_id}
                    onValueChange={(value) => setMovFormData({ ...movFormData, produto_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {estoque.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nome} - {item.categorias?.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={movFormData.tipo}
                      onValueChange={(value) => setMovFormData({ ...movFormData, tipo: value as "Entrada" | "Saída" | "Ajuste" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entrada">Entrada</SelectItem>
                        <SelectItem value="Saída">Saída</SelectItem>
                        <SelectItem value="Ajuste">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      value={movFormData.quantidade}
                      onChange={(e) =>
                        setMovFormData({ ...movFormData, quantidade: Number.parseInt(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivo">Motivo</Label>
                  <Input
                    id="motivo"
                    value={movFormData.motivo}
                    onChange={(e) => setMovFormData({ ...movFormData, motivo: e.target.value })}
                    placeholder="Ex: Compra, Venda, Ajuste de inventário"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={movFormData.observacoes}
                    onChange={(e) => setMovFormData({ ...movFormData, observacoes: e.target.value })}
                    placeholder="Observações adicionais..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsMovDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Registrar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 bg-transparent">
                <Archive className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Categoria</DialogTitle>
                <DialogDescription>Adicione uma nova categoria para organizar os produtos</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria-nome">Nome da Categoria</Label>
                  <Input
                    id="categoria-nome"
                    value={categoryFormData.nome}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, nome: e.target.value })}
                    placeholder="Ex: Ferramentas, Materiais de Construção"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria-descricao">Descrição</Label>
                  <Textarea
                    id="categoria-descricao"
                    value={categoryFormData.descricao}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, descricao: e.target.value })}
                    placeholder="Descrição da categoria..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria-status">Status</Label>
                  <Select
                    value={categoryFormData.status}
                    onValueChange={(value) => setCategoryFormData({ ...categoryFormData, status: value as "Ativa" | "Inativa" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativa">Ativa</SelectItem>
                      <SelectItem value="Inativa">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Criar Categoria
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Item" : "Cadastrar Novo Item"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Atualize as informações do item" : "Preencha os dados do novo item"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-end">
                  <DebugButton onClick={preencherDadosDebugEstoque} disabled={loading} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Item</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria_id">Categoria</Label>
                    <Select
                      value={formData.categoria_id.toString()}
                      onValueChange={(value) => setFormData({ ...formData, categoria_id: Number.parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id.toString()}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Classificação do Item */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classificacao_tipo">Classificação *</Label>
                    <Select
                      value={formData.classificacao_tipo}
                      onValueChange={(value) => setFormData({ ...formData, classificacao_tipo: value as any, subcategoria_ativo: value !== "ativo" ? "" : formData.subcategoria_ativo })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a classificação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="componente">Componente (Partes do ativo)</SelectItem>
                        <SelectItem value="item">Item (Consumíveis)</SelectItem>
                        <SelectItem value="ativo">Ativo (Imobilizados)</SelectItem>
                        <SelectItem value="complemento">Complemento (Peças que compõem ativos)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Componentes: Partes do ativo | Itens: Consumíveis | Ativos: Imobilizados | Complementos: Peças dos ativos
                    </p>
                  </div>

                  {formData.classificacao_tipo === "ativo" && (
                    <div className="space-y-2">
                      <Label htmlFor="subcategoria_ativo">Subcategoria do Ativo *</Label>
                      <Select
                        value={formData.subcategoria_ativo}
                        onValueChange={(value) => setFormData({ ...formData, subcategoria_ativo: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a subcategoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grua">Grua</SelectItem>
                          <SelectItem value="equipamento_grua">Equipamento (Complemento de Grua)</SelectItem>
                          <SelectItem value="ferramenta">Ferramenta</SelectItem>
                          <SelectItem value="ar_condicionado">Ar Condicionado</SelectItem>
                          <SelectItem value="camera">Câmera</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                          <SelectItem value="pc">PC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição detalhada do produto..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo_barras">Código de Barras</Label>
                    <Input
                      id="codigo_barras"
                      value={formData.codigo_barras}
                      onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                      placeholder="Código de barras do produto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unidade_medida">Unidade de Medida</Label>
                    <Select
                      value={formData.unidade_medida}
                      onValueChange={(value) => setFormData({ ...formData, unidade_medida: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UN">Unidade</SelectItem>
                        <SelectItem value="KG">Quilograma</SelectItem>
                        <SelectItem value="M">Metro</SelectItem>
                        <SelectItem value="L">Litro</SelectItem>
                        <SelectItem value="M2">Metro Quadrado</SelectItem>
                        <SelectItem value="M3">Metro Cúbico</SelectItem>
                        <SelectItem value="UNIDADE">Unidade</SelectItem>
                        <SelectItem value="PECA">Peça</SelectItem>
                        <SelectItem value="CAIXA">Caixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as "Ativo" | "Inativo" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor_unitario">Valor Unitário (R$)</Label>
                    <Input
                      id="valor_unitario"
                      type="number"
                      step="0.01"
                      value={formData.valor_unitario}
                      onChange={(e) =>
                        setFormData({ ...formData, valor_unitario: Number.parseFloat(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                    <Input
                      id="estoque_minimo"
                      type="number"
                      value={formData.estoque_minimo}
                      onChange={(e) =>
                        setFormData({ ...formData, estoque_minimo: Number.parseInt(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estoque_maximo">Estoque Máximo</Label>
                    <Input
                      id="estoque_maximo"
                      type="number"
                      value={formData.estoque_maximo}
                      onChange={(e) =>
                        setFormData({ ...formData, estoque_maximo: Number.parseInt(e.target.value) || 0 })
                      }
                      className={formData.estoque_maximo && formData.estoque_maximo <= formData.estoque_minimo ? "border-red-500" : ""}
                    />
                    
                  </div>
                </div>

                {!editingItem && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantidade_inicial">Quantidade Inicial</Label>
                      <Input
                        id="quantidade_inicial"
                        type="number"
                        min="0"
                        value={formData.quantidade_inicial}
                        onChange={(e) =>
                          setFormData({ ...formData, quantidade_inicial: Number.parseInt(e.target.value) || 0 })
                        }
                        placeholder="Quantidade inicial em estoque"
                      />
                      <p className="text-xs text-gray-500">
                        Quantidade inicial do produto no estoque (será criada uma movimentação de entrada)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantidade_reservada_inicial">Quantidade Reservada Inicial</Label>
                      <Input
                        id="quantidade_reservada_inicial"
                        type="number"
                        min="0"
                        value={formData.quantidade_reservada_inicial}
                        onChange={(e) =>
                          setFormData({ ...formData, quantidade_reservada_inicial: Number.parseInt(e.target.value) || 0 })
                        }
                        placeholder="Quantidade reservada inicial"
                      />
                      <p className="text-xs text-gray-500">
                        Quantidade que será reservada inicialmente (opcional)
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="localizacao">Localização</Label>
                  <Input
                    id="localizacao"
                    value={formData.localizacao}
                    onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                    placeholder="Ex: Galpão A - Prateleira 1"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingItem ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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

      <Tabs defaultValue="estoque">
        <TabsList>
          <TabsTrigger value="estoque">Itens em Estoque</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="estoque">
          <Card>
            <CardHeader>
              <CardTitle>Itens em Estoque</CardTitle>
              <CardDescription>Visualize e gerencie todos os itens do estoque</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome, categoria ou código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          e.stopPropagation()
                        }
                      }}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Filtros de Categoria e Status */}
                  <div 
                    className="flex items-center gap-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.stopPropagation()
                      }
                    }}
                  >
                    <Select
                      value={filtros.categoria_id}
                      onValueChange={(value) => {
                        handleFiltroChange('categoria_id', value)
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as categorias</SelectItem>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id.toString()}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filtros.status}
                      onValueChange={(value) => handleFiltroChange('status', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filtros.tipo_item}
                      onValueChange={(value) => handleFiltroChange('tipo_item', value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Tipo de Item" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="produto">Produto</SelectItem>
                        <SelectItem value="componente">Componente</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={limparFiltros}
                      className="text-gray-600"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
                <div>
                <ExportButton
                  dados={[]}
                  tipo="estoque"
                  nomeArquivo="estoque"
                  titulo="Relatório de Estoque"
                  onExport={exportarEstoque}
                />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Item</TableHead>
                      <TableHead className="text-center">Categoria</TableHead>
                      <TableHead className="text-center">Quantidade Disponível</TableHead>
                      <TableHead className="text-center">Quantidade Reservada</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Valor Unit.</TableHead>
                      <TableHead className="text-center">Valor Total</TableHead>
                      <TableHead className="text-center">Localização</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEstoque.map((item) => {
                      // Buscar dados de estoque para este produto
                      // Tentar acessar diretamente do item primeiro
                      let estoqueData: any = null
                      
                      // Debug: verificar estrutura do item
                      if (item.id === 'P0011') {
                        console.log('Item P0011 completo:', item)
                        console.log('Item.estoque:', item.estoque)
                        console.log('Tipo de estoque:', typeof item.estoque, Array.isArray(item.estoque))
                      }
                      
                      // Verificar se estoque está diretamente no item
                      if (item.estoque) {
                        if (Array.isArray(item.estoque)) {
                          estoqueData = item.estoque.length > 0 ? item.estoque[0] : null
                        } else {
                          estoqueData = item.estoque
                        }
                      }
                      
                      // Se não encontrou, usar a função auxiliar
                      if (!estoqueData) {
                        estoqueData = getEstoqueData(item.id)
                      }
                      
                      // Debug: verificar dados de estoque encontrados
                      if (item.id === 'P0011') {
                        console.log('EstoqueData encontrado:', estoqueData)
                      }
                      
                      const quantidadeDisponivel = estoqueData?.quantidade_disponivel ?? 0
                      const quantidadeReservada = estoqueData?.quantidade_reservada ?? 0
                      const valorTotal = estoqueData?.valor_total ?? 0
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <p className="font-medium">{item.nome}</p>
                              <p className="text-sm text-gray-500">{item.id}</p>
                              {item.codigo_barras && (
                                <p className="text-xs text-gray-400">Código: {item.codigo_barras}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.categorias?.nome || "Sem categoria"}</TableCell>
                          <TableCell className="text-center">
                            <div>
                              <p className="font-medium">{quantidadeDisponivel}</p>
                              <p className="text-xs text-gray-500">{item.unidade_medida}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div>
                              <p className="font-medium text-orange-600">{quantidadeReservada}</p>
                              <p className="text-xs text-gray-500">{item.unidade_medida}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              {getStatusBadge(item)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">R$ {(item.valor_unitario || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-center">R$ {(valorTotal || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-center">{item.localizacao || "-"}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-1 justify-center">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDelete(item)}
                                className="text-red-600 hover:text-red-700"
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
              
              {/* Informações de contagem e paginação */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {totalItems > 0 ? (
                      <>
                        Mostrando {((filtros.page - 1) * filtros.limit) + 1} a{' '}
                        {Math.min(filtros.page * filtros.limit, totalItems)} de {totalItems} itens
                      </>
                    ) : (
                      "Nenhum item encontrado"
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor="itens-por-pagina" className="text-sm text-gray-600">
                      Itens por página:
                    </Label>
                    <Select
                      value={filtros.limit.toString()}
                      onValueChange={(value) => handleFiltroChange('limit', value)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(filtros.page - 1)}
                      disabled={filtros.page <= 1}
                    >
                      ←
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {/* Números das páginas */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, filtros.page - 2) + i
                        if (pageNum > totalPages) return null
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === filtros.page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(filtros.page + 1)}
                      disabled={filtros.page >= totalPages}
                    >
                      →
                    </Button>
                    
                    <span className="text-sm text-gray-600 min-w-[100px] text-center">
                      Página {filtros.page} de {totalPages}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimentacoes">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>Acompanhe todas as entradas e saídas do estoque</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtros para Movimentações */}
              <div className="mb-6">
                <div className="flex items-end gap-4 flex-wrap">
                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <Label htmlFor="tipo-movimentacao">Tipo de Movimentação</Label>
                    <Select
                      value={filtrosMovimentacoes.tipo}
                      onValueChange={(value) => handleFiltroMovimentacaoChange('tipo', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os tipos</SelectItem>
                        <SelectItem value="Entrada">Entrada</SelectItem>
                        <SelectItem value="Saída">Saída</SelectItem>
                        <SelectItem value="Ajuste">Ajuste</SelectItem>
                        <SelectItem value="Transferência">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <Label htmlFor="categoria-movimentacao">Categoria</Label>
                    <Select
                      value={filtrosMovimentacoes.categoria_id}
                      onValueChange={(value) => handleFiltroMovimentacaoChange('categoria_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as categorias</SelectItem>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id.toString()}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <Label htmlFor="data-movimentacao">Data</Label>
                    <Input
                      id="data-movimentacao"
                      type="date"
                      value={filtrosMovimentacoes.data}
                      onChange={(e) => handleFiltroMovimentacaoChange('data', e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={limparFiltrosMovimentacoes}
                      className="text-gray-600"
                    >
                      Limpar Filtros
                    </Button>
                    <ExportButton
                      dados={[]}
                      tipo="estoque"
                      nomeArquivo="movimentacoes"
                      titulo="Relatório de Movimentações de Estoque"
                      onExport={exportarMovimentacoes}
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Data</TableHead>
                      <TableHead className="text-center">Produto</TableHead>
                      <TableHead className="text-center">Tipo</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead className="text-center">Valor Unit.</TableHead>
                      <TableHead className="text-center">Valor Total</TableHead>
                      <TableHead className="text-center">Motivo</TableHead>
                      <TableHead className="text-center">Responsável</TableHead>
                      <TableHead className="text-center">Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingMovimentacoes ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            <span className="text-gray-500">Carregando movimentações...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : movimentacoes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          Nenhuma movimentação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimentacoes.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <p className="font-medium">{new Date(mov.data_movimentacao).toLocaleDateString("pt-BR")}</p>
                              <p className="text-xs text-gray-500">{new Date(mov.data_movimentacao).toLocaleTimeString("pt-BR")}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <p className="font-medium">{(mov as any).produtos?.nome || mov.produto_id}</p>
                              <p className="text-xs text-gray-500">{(mov as any).produtos?.unidade_medida || ""}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Badge variant="secondary">
                                {mov.tipo === "Entrada" ? (
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                ) : mov.tipo === "Saída" ? (
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                ) : (
                                  <Edit className="w-3 h-3 mr-1" />
                                )}
                                {mov.tipo}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div>
                              <p className="font-medium">{mov.quantidade}</p>
                              <p className="text-xs text-gray-500">{(mov as any).produtos?.unidade_medida || ""}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">R$ {(mov.valor_unitario || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-center">R$ {(mov.valor_total || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm text-gray-600">{mov.motivo}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm text-gray-600">ID: {mov.responsavel_id}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm text-gray-600">{mov.observacoes || "-"}</span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Informações de contagem e paginação */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {totalItemsMovimentacoes > 0 ? (
                      <>
                        Mostrando {((filtrosMovimentacoes.page - 1) * filtrosMovimentacoes.limit) + 1} a{' '}
                        {Math.min(filtrosMovimentacoes.page * filtrosMovimentacoes.limit, totalItemsMovimentacoes)} de {totalItemsMovimentacoes} movimentações
                      </>
                    ) : (
                      "Nenhuma movimentação encontrada"
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor="limite-movimentacoes" className="text-sm text-gray-600">
                      Itens por página:
                    </Label>
                    <Select
                      value={filtrosMovimentacoes.limit.toString()}
                      onValueChange={(value) => handleFiltroMovimentacaoChange('limit', value)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {totalPagesMovimentacoes > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChangeMovimentacoes(filtrosMovimentacoes.page - 1)}
                      disabled={filtrosMovimentacoes.page <= 1}
                    >
                      ←
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {/* Números das páginas */}
                      {Array.from({ length: Math.min(5, totalPagesMovimentacoes) }, (_, i) => {
                        const pageNum = Math.max(1, filtrosMovimentacoes.page - 2) + i
                        if (pageNum > totalPagesMovimentacoes) return null
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === filtrosMovimentacoes.page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChangeMovimentacoes(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChangeMovimentacoes(filtrosMovimentacoes.page + 1)}
                      disabled={filtrosMovimentacoes.page >= totalPagesMovimentacoes}
                    >
                      →
                    </Button>
                    
                    <span className="text-sm text-gray-600 min-w-[100px] text-center">
                      Página {filtrosMovimentacoes.page} de {totalPagesMovimentacoes}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </ProtectedRoute>
  )
}
