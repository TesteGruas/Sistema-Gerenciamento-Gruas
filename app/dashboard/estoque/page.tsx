"use client"

import type React from "react"

import { useState } from "react"
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
import { Package, Plus, Search, Edit, TrendingDown, TrendingUp, AlertTriangle, Archive, BarChart3, CheckCircle } from "lucide-react"

// Dados simulados do estoque
const estoqueData = [
  {
    id: "EST001",
    nome: "Cabo de Aço 12mm",
    categoria: "Cabos e Cordas",
    quantidade: 150,
    unidade: "metros",
    estoqueMinimo: 50,
    valorUnitario: 25.5,
    fornecedor: "Aços Especiais Ltda",
    localizacao: "Galpão A - Prateleira 1",
    ultimaMovimentacao: "2024-01-20",
  },
  {
    id: "EST002",
    nome: "Gancho Industrial 5T",
    categoria: "Acessórios",
    quantidade: 8,
    unidade: "unidades",
    estoqueMinimo: 5,
    valorUnitario: 450.0,
    fornecedor: "Equipamentos Industriais SA",
    localizacao: "Galpão B - Setor 2",
    ultimaMovimentacao: "2024-01-18",
  },
  {
    id: "EST003",
    nome: "Óleo Hidráulico ISO 68",
    categoria: "Lubrificantes",
    quantidade: 25,
    unidade: "litros",
    estoqueMinimo: 30,
    valorUnitario: 18.75,
    fornecedor: "Lubrificantes Premium",
    localizacao: "Galpão C - Área Química",
    ultimaMovimentacao: "2024-01-15",
  },
  {
    id: "EST004",
    nome: "Filtro Hidráulico HF6177",
    categoria: "Filtros",
    quantidade: 12,
    unidade: "unidades",
    estoqueMinimo: 8,
    valorUnitario: 85.0,
    fornecedor: "Filtros Industriais",
    localizacao: "Galpão A - Prateleira 3",
    ultimaMovimentacao: "2024-01-22",
  },
  {
    id: "EST005",
    nome: "Parafuso M16x80",
    categoria: "Fixadores",
    quantidade: 2,
    unidade: "unidades",
    estoqueMinimo: 20,
    valorUnitario: 3.25,
    fornecedor: "Parafusos e Porcas SA",
    localizacao: "Galpão A - Gaveta 15",
    ultimaMovimentacao: "2024-01-19",
  },
]

// Dados simulados de obras
const obrasData = [
  { id: "OBR001", nome: "Residencial Jardim das Flores", cliente: "Construtora ABC", endereco: "Rua das Flores, 123" },
  { id: "OBR002", nome: "Shopping Center Norte", cliente: "Empresa XYZ", endereco: "Av. Principal, 456" },
  { id: "OBR003", nome: "Condomínio Vista Mar", cliente: "Construtora DEF", endereco: "Rua do Mar, 789" },
  { id: "OBR004", nome: "Torre Comercial", cliente: "Empresa GHI", endereco: "Av. Comercial, 321" },
]

// Dados simulados de gruas
const gruasData = [
  { id: "GRU001", modelo: "Potain MDT 178", status: "Operacional", localizacao: "Obra Jardim das Flores" },
  { id: "GRU002", modelo: "Liebherr 132 EC-H", status: "Operacional", localizacao: "Shopping Center Norte" },
  { id: "GRU003", modelo: "Terex CTT 181-8", status: "Manutenção", localizacao: "Condomínio Vista Mar" },
  { id: "GRU004", modelo: "Favelle Favco M440D", status: "Disponível", localizacao: "Depósito Central" },
]

// Dados de movimentações
const movimentacoesData = [
  {
    id: "MOV001",
    produto: "Cabo de Aço 12mm",
    tipo: "Entrada",
    quantidade: 100,
    data: "2024-01-20",
    responsavel: "João Silva",
    observacao: "Compra para obra Centro-SP",
    obra: "Residencial Jardim das Flores",
    grua: "Potain MDT 178",
  },
  {
    id: "MOV002",
    produto: "Gancho Industrial 5T",
    tipo: "Saída",
    quantidade: 2,
    data: "2024-01-18",
    responsavel: "Maria Santos",
    observacao: "Uso na grua GRU003",
    obra: "Condomínio Vista Mar",
    grua: "Terex CTT 181-8",
  },
  {
    id: "MOV003",
    produto: "Óleo Hidráulico ISO 68",
    tipo: "Saída",
    quantidade: 15,
    data: "2024-01-15",
    responsavel: "Carlos Oliveira",
    observacao: "Manutenção preventiva",
    obra: "Shopping Center Norte",
    grua: "Liebherr 132 EC-H",
  },
]

export default function EstoquePage() {
  const [estoque, setEstoque] = useState(estoqueData)
  const [movimentacoes, setMovimentacoes] = useState(movimentacoesData)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMovDialogOpen, setIsMovDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Formulário para novo item
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    quantidade: 0,
    unidade: "",
    estoqueMinimo: 0,
    valorUnitario: 0,
    fornecedor: "",
    localizacao: "",
  })

  // Formulário para movimentação
  const [movFormData, setMovFormData] = useState({
    produto: "",
    tipo: "Entrada",
    quantidade: 0,
    responsavel: "",
    observacao: "",
    obra: "",
    grua: "",
  })

  const filteredEstoque = estoque.filter(
    (item) =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (item: any) => {
    if (item.quantidade <= item.estoqueMinimo) {
      return <Badge className="bg-red-100 text-red-800">Estoque Baixo</Badge>
    }
    if (item.quantidade <= item.estoqueMinimo * 1.5) {
      return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Normal</Badge>
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem) {
      setEstoque(estoque.map((item) => (item.id === editingItem.id ? { ...item, ...formData } : item)))
    } else {
      const newItem = {
        ...formData,
        id: `EST${String(estoque.length + 1).padStart(3, "0")}`,
        ultimaMovimentacao: new Date().toISOString().split("T")[0],
      }
      setEstoque([...estoque, newItem])
    }

    setFormData({
      nome: "",
      categoria: "",
      quantidade: 0,
      unidade: "",
      estoqueMinimo: 0,
      valorUnitario: 0,
      fornecedor: "",
      localizacao: "",
    })
    setEditingItem(null)
    setIsDialogOpen(false)
  }

  const handleMovimentacao = (e: React.FormEvent) => {
    e.preventDefault()
    const newMov = {
      ...movFormData,
      id: `MOV${String(movimentacoes.length + 1).padStart(3, "0")}`,
      data: new Date().toISOString().split("T")[0],
    }
    setMovimentacoes([newMov, ...movimentacoes])

    // Atualizar estoque
    setEstoque(
      estoque.map((item) => {
        if (item.nome === movFormData.produto) {
          const novaQuantidade =
            movFormData.tipo === "Entrada"
              ? item.quantidade + movFormData.quantidade
              : item.quantidade - movFormData.quantidade
          return { ...item, quantidade: Math.max(0, novaQuantidade) }
        }
        return item
      }),
    )

    setMovFormData({
      produto: "",
      tipo: "Entrada",
      quantidade: 0,
      responsavel: "",
      observacao: "",
      obra: "",
      grua: "",
    })
    setIsMovDialogOpen(false)
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setFormData({
      nome: item.nome,
      categoria: item.categoria,
      quantidade: item.quantidade,
      unidade: item.unidade,
      estoqueMinimo: item.estoqueMinimo,
      valorUnitario: item.valorUnitario,
      fornecedor: item.fornecedor,
      localizacao: item.localizacao,
    })
    setIsDialogOpen(true)
  }

  const exportToExcel = () => {
    // Criar dados para exportação
    const dadosParaExportar = estoque.map((item) => [
      item.id,
      item.nome,
      item.categoria,
      item.quantidade,
      item.unidade,
      item.estoqueMinimo,
      `R$ ${item.valorUnitario.toFixed(2)}`,
      item.fornecedor,
      item.localizacao,
      item.ultimaMovimentacao,
      item.quantidade <= item.estoqueMinimo ? "Estoque Baixo" : 
      item.quantidade <= item.estoqueMinimo * 1.5 ? "Atenção" : "Normal"
    ])

    // Cabeçalhos da planilha
    const headers = [
      "ID",
      "Produto",
      "Categoria", 
      "Quantidade",
      "Unidade",
      "Estoque Mínimo",
      "Valor Unitário",
      "Fornecedor",
      "Localização",
      "Última Movimentação",
      "Status"
    ]

    // Criar CSV
    const csvContent = [
      headers.join(","),
      ...dadosParaExportar.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    // Download do arquivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `estoque_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const stats = [
    { title: "Total de Itens", value: estoque.length, icon: Package, color: "bg-blue-500" },
    {
      title: "Estoque Baixo",
      value: estoque.filter((item) => item.quantidade <= item.estoqueMinimo).length,
      icon: AlertTriangle,
      color: "bg-red-500",
    },
    {
      title: "Valor Total",
      value: `R$ ${estoque.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0).toLocaleString()}`,
      icon: BarChart3,
      color: "bg-green-500",
    },
    {
      title: "Categorias",
      value: new Set(estoque.map((item) => item.categoria)).size,
      icon: Archive,
      color: "bg-purple-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Estoque</h1>
          <p className="text-gray-600">Gerenciamento completo do estoque de materiais</p>
        </div>
        <div className="flex gap-3">
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
                    value={movFormData.produto}
                    onValueChange={(value) => setMovFormData({ ...movFormData, produto: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {estoque.map((item) => (
                        <SelectItem key={item.id} value={item.nome}>
                          {item.nome}
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
                      onValueChange={(value) => setMovFormData({ ...movFormData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entrada">Entrada</SelectItem>
                        <SelectItem value="Saída">Saída</SelectItem>
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
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input
                    id="responsavel"
                    value={movFormData.responsavel}
                    onChange={(e) => setMovFormData({ ...movFormData, responsavel: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="obra">Obra</Label>
                    <Select
                      value={movFormData.obra}
                      onValueChange={(value) => setMovFormData({ ...movFormData, obra: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma obra" />
                      </SelectTrigger>
                      <SelectContent>
                        {obrasData.map((obra) => (
                          <SelectItem key={obra.id} value={obra.nome}>
                            {obra.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grua">Grua</Label>
                    <Select
                      value={movFormData.grua}
                      onValueChange={(value) => setMovFormData({ ...movFormData, grua: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma grua" />
                      </SelectTrigger>
                      <SelectContent>
                        {gruasData.map((grua) => (
                          <SelectItem key={grua.id} value={grua.modelo}>
                            {grua.modelo} - {grua.status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacao">Observação</Label>
                  <Textarea
                    id="observacao"
                    value={movFormData.observacao}
                    onChange={(e) => setMovFormData({ ...movFormData, observacao: e.target.value })}
                    placeholder="Motivo da movimentação..."
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

          <Button 
            variant="outline" 
            className="border-green-600 text-green-600 hover:bg-green-50 bg-transparent"
            onClick={exportToExcel}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Item
              </Button>
            </DialogTrigger>
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
                    <Label htmlFor="categoria">Categoria</Label>
                    <Input
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      value={formData.quantidade}
                      onChange={(e) => setFormData({ ...formData, quantidade: Number.parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unidade">Unidade</Label>
                    <Input
                      id="unidade"
                      value={formData.unidade}
                      onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                      placeholder="Ex: unidades, metros, litros"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
                    <Input
                      id="estoqueMinimo"
                      type="number"
                      value={formData.estoqueMinimo}
                      onChange={(e) =>
                        setFormData({ ...formData, estoqueMinimo: Number.parseInt(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valorUnitario">Valor Unitário (R$)</Label>
                    <Input
                      id="valorUnitario"
                      type="number"
                      step="0.01"
                      value={formData.valorUnitario}
                      onChange={(e) =>
                        setFormData({ ...formData, valorUnitario: Number.parseFloat(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fornecedor">Fornecedor</Label>
                    <Input
                      id="fornecedor"
                      value={formData.fornecedor}
                      onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                      required
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
                    required
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
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, categoria ou fornecedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor Unit.</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEstoque.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.nome}</p>
                            <p className="text-sm text-gray-500">{item.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.categoria}</TableCell>
                        <TableCell>
                          {item.quantidade} {item.unidade}
                        </TableCell>
                        <TableCell>{getStatusBadge(item)}</TableCell>
                        <TableCell>R$ {item.valorUnitario.toFixed(2)}</TableCell>
                        <TableCell>R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</TableCell>
                        <TableCell>{item.fornecedor}</TableCell>
                        <TableCell>{item.localizacao}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Obra</TableHead>
                      <TableHead>Grua</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentacoes.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>{new Date(mov.data).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{mov.produto}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              mov.tipo === "Entrada" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }
                          >
                            {mov.tipo === "Entrada" ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {mov.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{mov.quantidade}</TableCell>
                        <TableCell>{mov.obra || "-"}</TableCell>
                        <TableCell>{mov.grua || "-"}</TableCell>
                        <TableCell>{mov.responsavel}</TableCell>
                        <TableCell>{mov.observacao}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Painel de Alertas Melhorado */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="w-5 h-5" />
            Alertas de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Estoque Crítico */}
            {estoque.filter((item) => item.quantidade <= item.estoqueMinimo).length > 0 && (
              <div className="p-4 bg-red-100 border border-red-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800">🚨 Estoque Crítico</p>
                    <p className="text-sm text-red-700">
                      {estoque.filter((item) => item.quantidade <= item.estoqueMinimo).length} itens estão abaixo do estoque mínimo
                    </p>
                    <div className="mt-2 space-y-1">
                      {estoque
                        .filter((item) => item.quantidade <= item.estoqueMinimo)
                        .map((item) => (
                          <div key={item.id} className="text-xs text-red-600">
                            • {item.nome}: {item.quantidade} {item.unidade} (mín: {item.estoqueMinimo})
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Estoque em Atenção */}
            {estoque.filter((item) => item.quantidade > item.estoqueMinimo && item.quantidade <= item.estoqueMinimo * 1.5).length > 0 && (
              <div className="p-4 bg-yellow-100 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-800">⚠️ Estoque em Atenção</p>
                    <p className="text-sm text-yellow-700">
                      {estoque.filter((item) => item.quantidade > item.estoqueMinimo && item.quantidade <= item.estoqueMinimo * 1.5).length} itens próximos do estoque mínimo
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Geral */}
            {estoque.filter((item) => item.quantidade <= item.estoqueMinimo).length === 0 && 
             estoque.filter((item) => item.quantidade > item.estoqueMinimo && item.quantidade <= item.estoqueMinimo * 1.5).length === 0 && (
              <div className="p-4 bg-green-100 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">✅ Estoque Normal</p>
                    <p className="text-sm text-green-700">
                      Todos os itens estão com estoque adequado
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
