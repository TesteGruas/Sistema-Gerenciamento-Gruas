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
import {
  DollarSign,
  Plus,
  Search,
  Edit,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Calendar,
  AlertCircle,
  BarChart3,
  Calculator,
  Download,
  Target,
} from "lucide-react"

const lancamentosData = [
  {
    id: "LANC001",
    data: "2024-01-22",
    descricao: "Serviço de Grua - Obra Centro SP",
    categoria: "Receita Operacional",
    centroCusto: "Operações",
    tipo: "Receita",
    valor: 15000.0,
    status: "Recebido",
    cliente: "Construtora ABC Ltda",
    vencimento: "2024-01-22",
    formaPagamento: "PIX",
    numeroNF: "NF001",
  },
  {
    id: "LANC002",
    data: "2024-01-20",
    descricao: "Combustível - Gruas",
    categoria: "Combustível",
    centroCusto: "Operações",
    tipo: "Despesa",
    valor: 2500.0,
    status: "Pago",
    fornecedor: "Posto Ipiranga",
    vencimento: "2024-01-20",
    formaPagamento: "Cartão",
    numeroNF: "NF002",
  },
  {
    id: "LANC003",
    data: "2024-01-18",
    descricao: "Manutenção Grua GRU002",
    categoria: "Manutenção",
    centroCusto: "Manutenção",
    tipo: "Despesa",
    valor: 3200.0,
    status: "Pago",
    fornecedor: "Oficina Especializada",
    vencimento: "2024-01-18",
    formaPagamento: "Transferência",
    numeroNF: "NF003",
  },
  {
    id: "LANC004",
    data: "2024-01-25",
    descricao: "Serviço de Montagem - Campinas",
    categoria: "Receita Operacional",
    centroCusto: "Operações",
    tipo: "Receita",
    valor: 8500.0,
    status: "Pendente",
    cliente: "Indústria XYZ SA",
    vencimento: "2024-02-10",
    formaPagamento: "Boleto",
    numeroNF: "NF004",
  },
  {
    id: "LANC005",
    data: "2024-01-15",
    descricao: "Folha de Pagamento - Janeiro",
    categoria: "Salários",
    centroCusto: "Administrativo",
    tipo: "Despesa",
    valor: 25400.0,
    status: "Pago",
    vencimento: "2024-01-15",
    formaPagamento: "Transferência",
    numeroNF: "RPA001",
  },
]

const dreData = {
  receitaBruta: 285000,
  deducoes: 28500,
  receitaLiquida: 256500,
  custoProdutos: 142000,
  lucroBruto: 114500,
  despesasOperacionais: {
    vendas: 15000,
    administrativas: 25400,
    financeiras: 3200,
    total: 43600,
  },
  lucroOperacional: 70900,
  outrasReceitas: 2500,
  outrasDespesas: 1200,
  lucroAntesImposto: 72200,
  impostos: 14440,
  lucroLiquido: 57760,
}

const balancoData = {
  ativo: {
    circulante: {
      caixa: 45000,
      contasReceber: 85000,
      estoque: 125400,
      total: 255400,
    },
    naoCirculante: {
      imobilizado: 450000,
      intangivel: 25000,
      total: 475000,
    },
    total: 730400,
  },
  passivo: {
    circulante: {
      fornecedores: 28000,
      salarios: 15000,
      impostos: 12000,
      total: 55000,
    },
    naoCirculante: {
      financiamentos: 180000,
      total: 180000,
    },
    patrimonioLiquido: {
      capital: 400000,
      lucrosAcumulados: 95400,
      total: 495400,
    },
    total: 730400,
  },
}

const orcamentoData = [
  { categoria: "Receita Operacional", orcado: 300000, realizado: 285000, variacao: -5.0 },
  { categoria: "Combustível", orcado: 25000, realizado: 28500, variacao: 14.0 },
  { categoria: "Manutenção", orcado: 35000, realizado: 32000, variacao: -8.6 },
  { categoria: "Salários", orcado: 250000, realizado: 254000, variacao: 1.6 },
  { categoria: "Administrativo", orcado: 45000, realizado: 43600, variacao: -3.1 },
]

// Dados de contas bancárias
const contasBancarias = [
  { id: "CONTA001", banco: "Banco do Brasil", agencia: "1234-5", conta: "12345-6", saldo: 45000.0 },
  { id: "CONTA002", banco: "Itaú", agencia: "5678-9", conta: "67890-1", saldo: 28000.0 },
  { id: "CONTA003", banco: "Santander", agencia: "9876-5", conta: "54321-0", saldo: 15000.0 },
]

export default function FinanceiroPage() {
  const [lancamentos, setLancamentos] = useState(lancamentosData)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLancamento, setEditingLancamento] = useState<any>(null)

  const [formData, setFormData] = useState({
    descricao: "",
    categoria: "",
    centroCusto: "",
    tipo: "Receita",
    valor: 0,
    cliente: "",
    fornecedor: "",
    vencimento: "",
    formaPagamento: "",
    numeroNF: "",
    observacoes: "",
  })

  const filteredLancamentos = lancamentos.filter(
    (lanc) =>
      lanc.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lanc.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lanc.cliente && lanc.cliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lanc.fornecedor && lanc.fornecedor.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Recebido":
      case "Pago":
        return <Badge className="bg-green-100 text-green-800">{status}</Badge>
      case "Pendente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case "Vencido":
        return <Badge className="bg-red-100 text-red-800">Vencido</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    return tipo === "Receita" ? (
      <Badge className="bg-green-100 text-green-800">
        <TrendingUp className="w-3 h-3 mr-1" />
        Receita
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <TrendingDown className="w-3 h-3 mr-1" />
        Despesa
      </Badge>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingLancamento) {
      setLancamentos(
        lancamentos.map((lanc) =>
          lanc.id === editingLancamento.id
            ? {
                ...lanc,
                ...formData,
                status: "Pendente",
              }
            : lanc,
        ),
      )
    } else {
      const newLancamento = {
        ...formData,
        id: `LANC${String(lancamentos.length + 1).padStart(3, "0")}`,
        data: new Date().toISOString().split("T")[0],
        status: "Pendente",
      }
      setLancamentos([...lancamentos, newLancamento])
    }

    setFormData({
      descricao: "",
      categoria: "",
      centroCusto: "",
      tipo: "Receita",
      valor: 0,
      cliente: "",
      fornecedor: "",
      vencimento: "",
      formaPagamento: "",
      numeroNF: "",
      observacoes: "",
    })
    setEditingLancamento(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (lancamento: any) => {
    setEditingLancamento(lancamento)
    setFormData({
      descricao: lancamento.descricao,
      categoria: lancamento.categoria,
      centroCusto: lancamento.centroCusto,
      tipo: lancamento.tipo,
      valor: lancamento.valor,
      cliente: lancamento.cliente || "",
      fornecedor: lancamento.fornecedor || "",
      vencimento: lancamento.vencimento,
      formaPagamento: lancamento.formaPagamento || "",
      numeroNF: lancamento.numeroNF || "",
      observacoes: "",
    })
    setIsDialogOpen(true)
  }

  // Cálculos financeiros
  const totalReceitas = lancamentos.filter((l) => l.tipo === "Receita").reduce((acc, l) => acc + l.valor, 0)
  const totalDespesas = lancamentos.filter((l) => l.tipo === "Despesa").reduce((acc, l) => acc + l.valor, 0)
  const saldoTotal = totalReceitas - totalDespesas
  const totalBancos = contasBancarias.reduce((acc, conta) => acc + conta.saldo, 0)

  const stats = [
    {
      title: "Receitas do Mês",
      value: `R$ ${totalReceitas.toLocaleString()}`,
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      title: "Despesas do Mês",
      value: `R$ ${totalDespesas.toLocaleString()}`,
      icon: TrendingDown,
      color: "bg-red-500",
    },
    { title: "Saldo do Mês", value: `R$ ${saldoTotal.toLocaleString()}`, icon: DollarSign, color: "bg-blue-500" },
    { title: "Saldo em Bancos", value: `R$ ${totalBancos.toLocaleString()}`, icon: CreditCard, color: "bg-purple-500" },
  ]

  const exportarRelatorio = (tipo: string) => {
    alert(`Exportando ${tipo} em PDF...`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulo Financeiro Avançado</h1>
          <p className="text-gray-600">Controle completo e análises financeiras da empresa</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => exportarRelatorio("DRE")}>
            <Download className="w-4 h-4 mr-2" />
            Exportar DRE
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Lançamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{editingLancamento ? "Editar Lançamento" : "Novo Lançamento Financeiro"}</DialogTitle>
                <DialogDescription>
                  {editingLancamento ? "Atualize as informações do lançamento" : "Registre uma nova receita ou despesa"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Ex: Serviço de Grua - Obra Centro SP"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numeroNF">Número NF/Documento</Label>
                    <Input
                      id="numeroNF"
                      value={formData.numeroNF}
                      onChange={(e) => setFormData({ ...formData, numeroNF: e.target.value })}
                      placeholder="Ex: NF001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Receita">Receita</SelectItem>
                        <SelectItem value="Despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.tipo === "Receita" ? (
                          <>
                            <SelectItem value="Receita Operacional">Receita Operacional</SelectItem>
                            <SelectItem value="Receita de Serviços">Receita de Serviços</SelectItem>
                            <SelectItem value="Outras Receitas">Outras Receitas</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="Combustível">Combustível</SelectItem>
                            <SelectItem value="Manutenção">Manutenção</SelectItem>
                            <SelectItem value="Salários">Salários</SelectItem>
                            <SelectItem value="Impostos">Impostos</SelectItem>
                            <SelectItem value="Aluguel">Aluguel</SelectItem>
                            <SelectItem value="Outras Despesas">Outras Despesas</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="centroCusto">Centro de Custo</Label>
                    <Select
                      value={formData.centroCusto}
                      onValueChange={(value) => setFormData({ ...formData, centroCusto: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operações">Operações</SelectItem>
                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                        <SelectItem value="Administrativo">Administrativo</SelectItem>
                        <SelectItem value="Comercial">Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor (R$)</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: Number.parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vencimento">Data de Vencimento</Label>
                    <Input
                      id="vencimento"
                      type="date"
                      value={formData.vencimento}
                      onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                    <Select
                      value={formData.formaPagamento}
                      onValueChange={(value) => setFormData({ ...formData, formaPagamento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="Transferência">Transferência</SelectItem>
                        <SelectItem value="Boleto">Boleto</SelectItem>
                        <SelectItem value="Cartão">Cartão</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.tipo === "Receita" ? (
                  <div className="space-y-2">
                    <Label htmlFor="cliente">Cliente</Label>
                    <Input
                      id="cliente"
                      value={formData.cliente}
                      onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                      placeholder="Nome do cliente"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="fornecedor">Fornecedor</Label>
                    <Input
                      id="fornecedor"
                      value={formData.fornecedor}
                      onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                      placeholder="Nome do fornecedor"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Informações adicionais..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingLancamento ? "Atualizar" : "Registrar"}
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

      <Tabs defaultValue="lancamentos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="contas">Contas</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="balanco">Balanço</TabsTrigger>
          <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
        </TabsList>

        <TabsContent value="lancamentos">
          <Card>
            <CardHeader>
              <CardTitle>Lançamentos Financeiros</CardTitle>
              <CardDescription>Visualize e gerencie todas as receitas e despesas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por descrição, categoria, cliente ou fornecedor..."
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
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Cliente/Fornecedor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLancamentos.map((lancamento) => (
                      <TableRow key={lancamento.id}>
                        <TableCell>{new Date(lancamento.data).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="font-medium">{lancamento.descricao}</TableCell>
                        <TableCell>{lancamento.categoria}</TableCell>
                        <TableCell>{getTipoBadge(lancamento.tipo)}</TableCell>
                        <TableCell className={lancamento.tipo === "Receita" ? "text-green-600" : "text-red-600"}>
                          {lancamento.tipo === "Receita" ? "+" : "-"}R$ {lancamento.valor.toLocaleString()}
                        </TableCell>
                        <TableCell>{lancamento.cliente || lancamento.fornecedor || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(lancamento.vencimento).toLocaleDateString("pt-BR")}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(lancamento.status)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(lancamento)}>
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

        <TabsContent value="contas">
          <Card>
            <CardHeader>
              <CardTitle>Contas Bancárias</CardTitle>
              <CardDescription>Saldos e movimentações das contas bancárias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {contasBancarias.map((conta) => (
                  <Card key={conta.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{conta.banco}</p>
                          <p className="text-sm text-gray-500">
                            Ag: {conta.agencia} | CC: {conta.conta}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Saldo Atual:</span>
                          <span className="font-bold text-lg text-green-600">R$ {conta.saldo.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fluxo">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
              <CardDescription>Projeção de entradas e saídas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Resumo do Fluxo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Entradas Previstas</p>
                          <p className="text-2xl font-bold text-green-900">
                            R${" "}
                            {lancamentos
                              .filter((l) => l.tipo === "Receita" && l.status === "Pendente")
                              .reduce((acc, l) => acc + l.valor, 0)
                              .toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <TrendingDown className="w-8 h-8 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Saídas Previstas</p>
                          <p className="text-2xl font-bold text-red-900">
                            R${" "}
                            {lancamentos
                              .filter((l) => l.tipo === "Despesa" && l.status === "Pendente")
                              .reduce((acc, l) => acc + l.valor, 0)
                              .toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Saldo Projetado</p>
                          <p className="text-2xl font-bold text-blue-900">
                            R${" "}
                            {(
                              totalBancos +
                              lancamentos
                                .filter((l) => l.tipo === "Receita" && l.status === "Pendente")
                                .reduce((acc, l) => acc + l.valor, 0) -
                              lancamentos
                                .filter((l) => l.tipo === "Despesa" && l.status === "Pendente")
                                .reduce((acc, l) => acc + l.valor, 0)
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Próximos Vencimentos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Próximos Vencimentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {lancamentos
                        .filter((l) => l.status === "Pendente")
                        .sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime())
                        .slice(0, 5)
                        .map((lancamento) => (
                          <div
                            key={lancamento.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {lancamento.tipo === "Receita" ? (
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                              ) : (
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                              )}
                              <div>
                                <p className="font-medium">{lancamento.descricao}</p>
                                <p className="text-sm text-gray-500">{lancamento.cliente || lancamento.fornecedor}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-medium ${
                                  lancamento.tipo === "Receita" ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {lancamento.tipo === "Receita" ? "+" : "-"}R$ {lancamento.valor.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(lancamento.vencimento).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dre">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Demonstração do Resultado do Exercício (DRE)
              </CardTitle>
              <CardDescription>Análise detalhada do resultado financeiro do período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Receitas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Receita Bruta</span>
                        <span className="font-medium">R$ {dreData.receitaBruta.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>(-) Deduções</span>
                        <span className="font-medium">R$ {dreData.deducoes.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-green-600 border-t pt-2">
                        <span>Receita Líquida</span>
                        <span>R$ {dreData.receitaLiquida.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Custos e Despesas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-red-600">
                        <span>Custo dos Produtos</span>
                        <span className="font-medium">R$ {dreData.custoProdutos.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-blue-600 border-t pt-2">
                        <span>Lucro Bruto</span>
                        <span>R$ {dreData.lucroBruto.toLocaleString()}</span>
                      </div>
                      <div className="space-y-2 mt-4">
                        <p className="font-medium text-gray-700">Despesas Operacionais:</p>
                        <div className="flex justify-between text-sm">
                          <span>• Vendas</span>
                          <span>R$ {dreData.despesasOperacionais.vendas.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>• Administrativas</span>
                          <span>R$ {dreData.despesasOperacionais.administrativas.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>• Financeiras</span>
                          <span>R$ {dreData.despesasOperacionais.financeiras.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <p className="text-sm text-green-800">Lucro Operacional</p>
                        <p className="text-2xl font-bold text-green-900">
                          R$ {dreData.lucroOperacional.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-green-800">Lucro Antes Imposto</p>
                        <p className="text-2xl font-bold text-green-900">
                          R$ {dreData.lucroAntesImposto.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-red-800">Impostos</p>
                        <p className="text-2xl font-bold text-red-900">R$ {dreData.impostos.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-blue-800">Lucro Líquido</p>
                        <p className="text-3xl font-bold text-blue-900">R$ {dreData.lucroLiquido.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-gray-600">Margem Bruta</p>
                      <p className="text-xl font-bold text-blue-600">
                        {((dreData.lucroBruto / dreData.receitaLiquida) * 100).toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-gray-600">Margem Operacional</p>
                      <p className="text-xl font-bold text-green-600">
                        {((dreData.lucroOperacional / dreData.receitaLiquida) * 100).toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-gray-600">Margem Líquida</p>
                      <p className="text-xl font-bold text-purple-600">
                        {((dreData.lucroLiquido / dreData.receitaLiquida) * 100).toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balanco">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Balanço Patrimonial
              </CardTitle>
              <CardDescription>Posição patrimonial e financeira da empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ativo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-600">ATIVO</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Ativo Circulante</p>
                      <div className="space-y-1 ml-4">
                        <div className="flex justify-between text-sm">
                          <span>Caixa e Equivalentes</span>
                          <span>R$ {balancoData.ativo.circulante.caixa.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Contas a Receber</span>
                          <span>R$ {balancoData.ativo.circulante.contasReceber.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Estoque</span>
                          <span>R$ {balancoData.ativo.circulante.estoque.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Total Circulante</span>
                          <span>R$ {balancoData.ativo.circulante.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700 mb-2">Ativo Não Circulante</p>
                      <div className="space-y-1 ml-4">
                        <div className="flex justify-between text-sm">
                          <span>Imobilizado</span>
                          <span>R$ {balancoData.ativo.naoCirculante.imobilizado.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Intangível</span>
                          <span>R$ {balancoData.ativo.naoCirculante.intangivel.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Total Não Circulante</span>
                          <span>R$ {balancoData.ativo.naoCirculante.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between font-bold text-lg text-blue-600 border-t-2 pt-2">
                      <span>TOTAL DO ATIVO</span>
                      <span>R$ {balancoData.ativo.total.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Passivo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">PASSIVO</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Passivo Circulante</p>
                      <div className="space-y-1 ml-4">
                        <div className="flex justify-between text-sm">
                          <span>Fornecedores</span>
                          <span>R$ {balancoData.passivo.circulante.fornecedores.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Salários a Pagar</span>
                          <span>R$ {balancoData.passivo.circulante.salarios.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Impostos a Pagar</span>
                          <span>R$ {balancoData.passivo.circulante.impostos.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Total Circulante</span>
                          <span>R$ {balancoData.passivo.circulante.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700 mb-2">Passivo Não Circulante</p>
                      <div className="space-y-1 ml-4">
                        <div className="flex justify-between text-sm">
                          <span>Financiamentos</span>
                          <span>R$ {balancoData.passivo.naoCirculante.financiamentos.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Total Não Circulante</span>
                          <span>R$ {balancoData.passivo.naoCirculante.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700 mb-2">Patrimônio Líquido</p>
                      <div className="space-y-1 ml-4">
                        <div className="flex justify-between text-sm">
                          <span>Capital Social</span>
                          <span>R$ {balancoData.passivo.patrimonioLiquido.capital.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Lucros Acumulados</span>
                          <span>R$ {balancoData.passivo.patrimonioLiquido.lucrosAcumulados.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Total Patrimônio Líquido</span>
                          <span>R$ {balancoData.passivo.patrimonioLiquido.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between font-bold text-lg text-red-600 border-t-2 pt-2">
                      <span>TOTAL DO PASSIVO</span>
                      <span>R$ {balancoData.passivo.total.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Indicadores Financeiros */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Indicadores Financeiros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Liquidez Corrente</p>
                      <p className="text-xl font-bold text-blue-600">
                        {(balancoData.ativo.circulante.total / balancoData.passivo.circulante.total).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Endividamento</p>
                      <p className="text-xl font-bold text-red-600">
                        {(
                          ((balancoData.passivo.circulante.total + balancoData.passivo.naoCirculante.total) /
                            balancoData.ativo.total) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">ROE</p>
                      <p className="text-xl font-bold text-green-600">
                        {((dreData.lucroLiquido / balancoData.passivo.patrimonioLiquido.total) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">ROA</p>
                      <p className="text-xl font-bold text-purple-600">
                        {((dreData.lucroLiquido / balancoData.ativo.total) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orcamento">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Orçamento vs Realizado
              </CardTitle>
              <CardDescription>Análise comparativa entre valores orçados e realizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Orçado (R$)</TableHead>
                      <TableHead className="text-right">Realizado (R$)</TableHead>
                      <TableHead className="text-right">Variação</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orcamentoData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.categoria}</TableCell>
                        <TableCell className="text-right">R$ {item.orcado.toLocaleString()}</TableCell>
                        <TableCell className="text-right">R$ {item.realizado.toLocaleString()}</TableCell>
                        <TableCell className={`text-right ${item.variacao >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {item.variacao >= 0 ? "+" : ""}
                          {item.variacao.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {Math.abs(item.variacao) <= 5 ? (
                            <Badge className="bg-green-100 text-green-800">No Meta</Badge>
                          ) : item.variacao > 5 ? (
                            <Badge className="bg-red-100 text-red-800">Acima</Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800">Abaixo</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-green-800">Dentro da Meta</p>
                    <p className="text-2xl font-bold text-green-900">
                      {orcamentoData.filter((item) => Math.abs(item.variacao) <= 5).length}
                    </p>
                    <p className="text-xs text-green-700">categorias</p>
                  </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-red-800">Acima do Orçado</p>
                    <p className="text-2xl font-bold text-red-900">
                      {orcamentoData.filter((item) => item.variacao > 5).length}
                    </p>
                    <p className="text-xs text-red-700">categorias</p>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-blue-800">Abaixo do Orçado</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {orcamentoData.filter((item) => item.variacao < -5).length}
                    </p>
                    <p className="text-xs text-blue-700">categorias</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
