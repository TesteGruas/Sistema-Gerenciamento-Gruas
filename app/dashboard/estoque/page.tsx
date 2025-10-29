"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

// Dados simulados de obras e gruas (mantidos por enquanto)
const obrasData = [
  { id: "OBR001", nome: "Residencial Jardim das Flores", cliente: "Construtora ABC", endereco: "Rua das Flores, 123" },
  { id: "OBR002", nome: "Shopping Center Norte", cliente: "Empresa XYZ", endereco: "Av. Principal, 456" },
  { id: "OBR003", nome: "Condomínio Vista Mar", cliente: "Construtora DEF", endereco: "Rua do Mar, 789" },
  { id: "OBR004", nome: "Torre Comercial", cliente: "Empresa GHI", endereco: "Av. Comercial, 321" },
]

const gruasData = [
  { id: "GRU001", modelo: "Potain MDT 178", status: "Operacional", localizacao: "Obra Jardim das Flores" },
  { id: "GRU002", modelo: "Liebherr 132 EC-H", status: "Operacional", localizacao: "Shopping Center Norte" },
  { id: "GRU003", modelo: "Terex CTT 181-8", status: "Manutenção", localizacao: "Condomínio Vista Mar" },
  { id: "GRU004", modelo: "Favelle Favco M440D", status: "Disponível", localizacao: "Depósito Central" },
]

export default function EstoquePage() {
  const { toast } = useToast()
  
  // Estados principais
  const [estoque, setEstoque] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMovDialogOpen, setIsMovDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Produto | null>(null)
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    categoria_id: "todas",
    status: "todos",
    page: 1,
    limit: 10
  })
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // Estados para filtros de movimentações
  const [filtrosMovimentacoes, setFiltrosMovimentacoes] = useState({
    tipo: "todos",
    data_inicio: "",
    data_fim: "",
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

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados()
  }, [filtros])

  // Carregar movimentações separadamente
  useEffect(() => {
    carregarMovimentacoes()
  }, [filtrosMovimentacoes])

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

      const [produtosResponse, categoriasResponse] = await Promise.all([
        estoqueAPI.listarProdutos(params),
        estoqueAPI.listarCategorias()
      ])
      
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
      
      if (filtrosMovimentacoes.data_inicio) {
        paramsMovimentacoes.data_inicio = filtrosMovimentacoes.data_inicio
      }
      
      if (filtrosMovimentacoes.data_fim) {
        paramsMovimentacoes.data_fim = filtrosMovimentacoes.data_fim
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

  const limparFiltros = () => {
    setFiltros({
      categoria_id: "todas",
      status: "todos",
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
      data_inicio: "",
      data_fim: "",
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

  const filteredEstoque = estoque.filter(
    (item) =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.categorias?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.codigo_barras || '').toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Função auxiliar para buscar dados de estoque de um produto
  const getEstoqueData = (produtoId: string) => {
    const produto = estoque.find((e: any) => e.id === produtoId)
    return produto?.estoque as any || null
  }

  const getStatusBadge = (item: Produto) => {
    // Buscar dados de estoque para este produto
    const estoqueData = getEstoqueData(item.id)
    const estoqueAtual = estoqueData?.quantidade_disponivel || 0
    const estoqueMinimo = item.estoque_minimo || 0
    
    if (estoqueAtual <= estoqueMinimo) {
      return <Badge variant="secondary">Estoque Baixo</Badge>
    }
    if (estoqueAtual <= estoqueMinimo * 1.5) {
      return <Badge variant="secondary">Atenção</Badge>
    }
    return <Badge variant="secondary">Normal</Badge>
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
        await estoqueAPI.criarProduto(formData)
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

      <Tabs defaultValue="estoque" className="space-y-6">
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
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Filtros de Categoria e Status */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={filtros.categoria_id}
                      onValueChange={(value) => handleFiltroChange('categoria_id', value)}
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

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={limparFiltros}
                      className="text-gray-600"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
                
                {/* Controles de Paginação e Quantidade */}
                <div className="flex items-center gap-4">
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
                      
                      <span className="text-sm text-gray-600 min-w-[80px] text-center">
                        Página {filtros.page} de {totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(filtros.page + 1)}
                        disabled={filtros.page >= totalPages}
                      >
                        →
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Quantidade Disponível</TableHead>
                      <TableHead>Quantidade Reservada</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor Unit.</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEstoque.map((item) => {
                      // Buscar dados de estoque para este produto
                      const estoqueData = getEstoqueData(item.id)
                      const quantidadeDisponivel = estoqueData?.quantidade_disponivel || 0
                      const quantidadeReservada = estoqueData?.quantidade_reservada || 0
                      const valorTotal = estoqueData?.valor_total || 0
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.nome}</p>
                              <p className="text-sm text-gray-500">{item.id}</p>
                              {item.codigo_barras && (
                                <p className="text-xs text-gray-400">Código: {item.codigo_barras}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.categorias?.nome || "Sem categoria"}</TableCell>
                          <TableCell>
                            <div className="text-center">
                              <p className="font-medium">{quantidadeDisponivel}</p>
                              <p className="text-xs text-gray-500">{item.unidade_medida}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <p className="font-medium text-orange-600">{quantidadeReservada}</p>
                              <p className="text-xs text-gray-500">{item.unidade_medida}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(item)}</TableCell>
                          <TableCell>R$ {(item.valor_unitario || 0).toFixed(2)}</TableCell>
                          <TableCell>R$ {(valorTotal || 0).toFixed(2)}</TableCell>
                          <TableCell>{item.localizacao || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
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
              
              {/* Informações de contagem */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
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
                
                {totalPages > 1 && (
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
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-5 gap-4">
                  <div className="space-y-2">
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

                  <div className="space-y-2">
                    <Label htmlFor="data-inicio">Data Início</Label>
                    <Input
                      id="data-inicio"
                      type="date"
                      value={filtrosMovimentacoes.data_inicio}
                      onChange={(e) => handleFiltroMovimentacaoChange('data_inicio', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data-fim">Data Fim</Label>
                    <Input
                      id="data-fim"
                      type="date"
                      value={filtrosMovimentacoes.data_fim}
                      onChange={(e) => handleFiltroMovimentacaoChange('data_fim', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="limite-movimentacoes">Itens por página</Label>
                    <Select
                      value={filtrosMovimentacoes.limit.toString()}
                      onValueChange={(value) => handleFiltroMovimentacaoChange('limit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 itens</SelectItem>
                        <SelectItem value="25">25 itens</SelectItem>
                        <SelectItem value="50">50 itens</SelectItem>
                        <SelectItem value="100">100 itens</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-transparent">Ações</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={limparFiltrosMovimentacoes}
                        className="text-gray-600"
                      >
                        Limpar Filtros
                      </Button>
                      {(filtrosMovimentacoes.tipo !== "todos" || filtrosMovimentacoes.data_inicio || filtrosMovimentacoes.data_fim) && (
                        <Badge variant="secondary" className="text-xs">
                          Filtros ativos
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end mt-4">
                  <div className="text-sm text-gray-600">
                    {totalItemsMovimentacoes > 0 && (
                      <>
                        Mostrando {((filtrosMovimentacoes.page - 1) * filtrosMovimentacoes.limit) + 1} a{' '}
                        {Math.min(filtrosMovimentacoes.page * filtrosMovimentacoes.limit, totalItemsMovimentacoes)} de {totalItemsMovimentacoes} movimentações
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Valor Unit.</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentacoes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          Nenhuma movimentação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimentacoes.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{new Date(mov.data_movimentacao).toLocaleDateString("pt-BR")}</p>
                              <p className="text-xs text-gray-500">{new Date(mov.data_movimentacao).toLocaleTimeString("pt-BR")}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{(mov as any).produtos?.nome || mov.produto_id}</p>
                              <p className="text-xs text-gray-500">{(mov as any).produtos?.unidade_medida || ""}</p>
                            </div>
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <p className="font-medium">{mov.quantidade}</p>
                              <p className="text-xs text-gray-500">{(mov as any).produtos?.unidade_medida || ""}</p>
                            </div>
                          </TableCell>
                          <TableCell>R$ {(mov.valor_unitario || 0).toFixed(2)}</TableCell>
                          <TableCell>R$ {(mov.valor_total || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{mov.motivo}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">ID: {mov.responsavel_id}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{mov.observacoes || "-"}</span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Paginação para Movimentações */}
              {totalPagesMovimentacoes > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Página {filtrosMovimentacoes.page} de {totalPagesMovimentacoes}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChangeMovimentacoes(filtrosMovimentacoes.page - 1)}
                      disabled={filtrosMovimentacoes.page <= 1}
                    >
                      Anterior
                    </Button>
                    
                    {/* Mostrar números das páginas */}
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
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChangeMovimentacoes(filtrosMovimentacoes.page + 1)}
                      disabled={filtrosMovimentacoes.page >= totalPagesMovimentacoes}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </ProtectedRoute>
  )
}
