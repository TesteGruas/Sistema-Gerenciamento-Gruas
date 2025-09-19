"use client"

import { useState } from "react"
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
  DollarSign, 
  Plus, 
  Search, 
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  PieChart,
  BarChart3
} from "lucide-react"
import { mockCustos, mockObras, getCustosByObra, mockCustosMensais, getCustosMensaisByObra, getCustosMensaisByObraAndMes, getMesesDisponiveis } from "@/lib/mock-data"

export default function FinanceiroPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedObra, setSelectedObra] = useState("all")
  const [selectedTipo, setSelectedTipo] = useState("all")
  const [selectedCategoria, setSelectedCategoria] = useState("all")
  const [selectedCusto, setSelectedCusto] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [mesSelecionado, setMesSelecionado] = useState("todos")
  const [custosMensais, setCustosMensais] = useState<any[]>([])
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  const filteredCustos = mockCustos.filter(custo => {
    const matchesSearch = custo.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         custo.obraName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesObra = selectedObra === "all" || custo.obraId === selectedObra
    const matchesTipo = selectedTipo === "all" || custo.tipo === selectedTipo
    const matchesCategoria = selectedCategoria === "all" || custo.categoria === selectedCategoria
    
    return matchesSearch && matchesObra && matchesTipo && matchesCategoria
  })

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'inicial': return 'bg-blue-100 text-blue-800'
      case 'adicional': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'equipamentos': return 'bg-purple-100 text-purple-800'
      case 'materiais': return 'bg-green-100 text-green-800'
      case 'mao_obra': return 'bg-yellow-100 text-yellow-800'
      case 'outros': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewDetails = (custo: any) => {
    setSelectedCusto(custo)
    setIsDetailsDialogOpen(true)
  }

  const handleEdit = (custo: any) => {
    setSelectedCusto(custo)
    setIsEditDialogOpen(true)
  }

  const carregarCustosMensais = (obraId: string) => {
    if (mesSelecionado && mesSelecionado !== 'todos') {
      const custos = getCustosMensaisByObraAndMes(obraId, mesSelecionado)
      setCustosMensais(custos)
    } else {
      const custos = getCustosMensaisByObra(obraId)
      setCustosMensais(custos)
    }
  }

  const handleExportarCustos = (tipo: 'geral' | 'mes', obraId: string) => {
    let dadosParaExportar = custosMensais
    
    if (tipo === 'mes' && mesSelecionado && mesSelecionado !== 'todos') {
      dadosParaExportar = getCustosMensaisByObraAndMes(obraId, mesSelecionado)
    } else if (tipo === 'geral') {
      dadosParaExportar = getCustosMensaisByObra(obraId)
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
    
    const obra = mockObras.find(o => o.id === obraId)
    const nomeArquivo = tipo === 'geral' 
      ? `custos_geral_${obra?.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
      : `custos_${mesSelecionado}_${obra?.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    
    link.setAttribute('download', nomeArquivo)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    alert(`Arquivo ${nomeArquivo} baixado com sucesso!`)
  }

  // Calcular estatísticas
  const totalCustos = mockCustos.reduce((sum, custo) => sum + custo.valor, 0)
  const custosIniciais = mockCustos.filter(c => c.tipo === 'inicial').reduce((sum, custo) => sum + custo.valor, 0)
  const custosAdicionais = mockCustos.filter(c => c.tipo === 'adicional').reduce((sum, custo) => sum + custo.valor, 0)
  
  // Calcular estatísticas dos custos mensais (BMM)
  const totalCustosMensais = mockCustosMensais.reduce((sum, custo) => sum + custo.valorAcumulado, 0)
  const totalOrcamento = mockCustosMensais.reduce((sum, custo) => sum + custo.totalOrcamento, 0)
  const totalRealizado = mockCustosMensais.reduce((sum, custo) => sum + custo.valorRealizado, 0)
  const totalSaldo = mockCustosMensais.reduce((sum, custo) => sum + custo.valorSaldo, 0)
  
  const custosPorObra = mockObras.map(obra => {
    const custos = getCustosByObra(obra.id)
    const custosMensaisObra = getCustosMensaisByObra(obra.id)
    const totalOrcamentoObra = custosMensaisObra.reduce((sum, custo) => sum + custo.totalOrcamento, 0)
    const totalRealizadoObra = custosMensaisObra.reduce((sum, custo) => sum + custo.valorRealizado, 0)
    
    return {
      obra: obra.name,
      obraId: obra.id,
      total: custos.reduce((sum, custo) => sum + custo.valor, 0),
      inicial: custos.filter(c => c.tipo === 'inicial').reduce((sum, custo) => sum + custo.valor, 0),
      adicional: custos.filter(c => c.tipo === 'adicional').reduce((sum, custo) => sum + custo.valor, 0),
      totalOrcamento: totalOrcamentoObra,
      totalRealizado: totalRealizadoObra,
      saldo: totalOrcamentoObra - totalRealizadoObra,
      mesesDisponiveis: getMesesDisponiveis(obra.id).length
    }
  })

  const stats = [
    { 
      title: "Total Orçado (BMM)", 
      value: `R$ ${totalOrcamento.toLocaleString('pt-BR')}`, 
      icon: DollarSign, 
      color: "bg-blue-500",
      change: `${((totalRealizado / totalOrcamento) * 100).toFixed(1)}% realizado`
    },
    { 
      title: "Total Realizado", 
      value: `R$ ${totalRealizado.toLocaleString('pt-BR')}`, 
      icon: TrendingUp, 
      color: "bg-green-500",
      change: `${((totalRealizado / totalOrcamento) * 100).toFixed(1)}% do orçamento`
    },
    { 
      title: "Saldo Restante", 
      value: `R$ ${totalSaldo.toLocaleString('pt-BR')}`, 
      icon: TrendingDown, 
      color: "bg-orange-500",
      change: `${((totalSaldo / totalOrcamento) * 100).toFixed(1)}% do orçamento`
    },
    { 
      title: "Obras Ativas", 
      value: mockObras.filter(o => o.status === 'ativa').length.toString(), 
      icon: Building2, 
      color: "bg-purple-500",
      change: `${mockObras.filter(o => o.status === 'ativa').length} obras`
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600">Controle de custos e análise financeira das obras</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Custo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Custo</DialogTitle>
              <DialogDescription>
                Registre um novo custo para uma obra
              </DialogDescription>
            </DialogHeader>
            <CustoForm onClose={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
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
                  {stat.change && (
                    <p className="text-xs text-green-600 mt-1">{stat.change} vs mês anterior</p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo por Obra */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Resumo por Obra - BMM
          </CardTitle>
          <CardDescription>Distribuição de custos mensais por obra</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra</TableHead>
                <TableHead>Total Orçado</TableHead>
                <TableHead>Total Realizado</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>% Realizado</TableHead>
                <TableHead>Meses</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {custosPorObra.map((obra, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{obra.obra}</TableCell>
                  <TableCell>R$ {obra.totalOrcamento.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>R$ {obra.totalRealizado.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className={`font-semibold ${obra.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {obra.saldo.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(obra.totalRealizado / obra.totalOrcamento) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">
                        {((obra.totalRealizado / obra.totalOrcamento) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {obra.mesesDisponiveis} meses
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/dashboard/obras/${obra.obraId}?tab=custos`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver BMM
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          carregarCustosMensais(obra.obraId)
                          setIsExportDialogOpen(true)
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Exportar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Boletins Mensais de Medição */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Boletins Mensais de Medição (BMM)
          </CardTitle>
          <CardDescription>Controle de medições mensais por obra</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockObras.map((obra) => {
              const custosMensaisObra = getCustosMensaisByObra(obra.id)
              const totalOrcamentoObra = custosMensaisObra.reduce((sum, custo) => sum + custo.totalOrcamento, 0)
              const totalRealizadoObra = custosMensaisObra.reduce((sum, custo) => sum + custo.valorRealizado, 0)
              const mesesDisponiveis = getMesesDisponiveis(obra.id)
              const ultimoMes = custosMensaisObra.length > 0 ? 
                custosMensaisObra[custosMensaisObra.length - 1] : null
              
              return (
                <Card key={obra.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">{obra.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {obra.description} • {obra.status}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={obra.status === 'ativa' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {obra.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `/dashboard/obras/${obra.id}?tab=custos`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver BMM
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Início:</span>
                        <span>{new Date(obra.startDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Fim:</span>
                        <span>{obra.endDate ? new Date(obra.endDate).toLocaleDateString('pt-BR') : 'Em andamento'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Orçado:</span>
                        <span className="font-medium">R$ {totalOrcamentoObra.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Realizado:</span>
                        <span className="font-medium">R$ {totalRealizadoObra.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Progresso do BMM</p>
                          <p className="text-xs text-gray-500">
                            {mesesDisponiveis.length} meses disponíveis • 
                            {((totalRealizadoObra / totalOrcamentoObra) * 100).toFixed(1)}% realizado
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">
                            R$ {(totalOrcamentoObra - totalRealizadoObra).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-500">Saldo restante</p>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(totalRealizadoObra / totalOrcamentoObra) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Buscar custos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Descrição ou obra..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="obra">Obra</Label>
              <Select value={selectedObra} onValueChange={setSelectedObra}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as obras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {mockObras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="inicial">Inicial</SelectItem>
                  <SelectItem value="adicional">Adicional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="equipamentos">Equipamentos</SelectItem>
                  <SelectItem value="materiais">Materiais</SelectItem>
                  <SelectItem value="mao_obra">Mão de Obra</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setSelectedObra("all")
                  setSelectedTipo("all")
                  setSelectedCategoria("all")
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Custos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Custos ({filteredCustos.length})</CardTitle>
          <CardDescription>Registro de todos os custos das obras</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustos.map((custo) => (
                <TableRow key={custo.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(custo.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{custo.obraName}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {custo.descricao}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTipoColor(custo.tipo)}>
                      {custo.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoriaColor(custo.categoria)}>
                      {custo.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    R$ {custo.valor.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>{custo.responsavelName}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(custo)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(custo)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Custo</DialogTitle>
            <DialogDescription>Informações completas do custo</DialogDescription>
          </DialogHeader>
          {selectedCusto && <CustoDetails custo={selectedCusto} />}
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Custo</DialogTitle>
            <DialogDescription>
              Atualize as informações do custo
            </DialogDescription>
          </DialogHeader>
          {selectedCusto && <CustoForm custo={selectedCusto} onClose={() => setIsEditDialogOpen(false)} />}
        </DialogContent>
      </Dialog>

      {/* Dialog de Exportação */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Exportar Custos Mensais
            </DialogTitle>
            <DialogDescription>
              Escolha o tipo de exportação desejada
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => {
                  const obraId = custosPorObra.find(o => o.obraId)?.obraId || '1'
                  handleExportarCustos('geral', obraId)
                  setIsExportDialogOpen(false)
                }}
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <Download className="w-6 h-6" />
                <span>Exportar Geral</span>
                <span className="text-xs text-gray-500">Todos os meses</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  const obraId = custosPorObra.find(o => o.obraId)?.obraId || '1'
                  handleExportarCustos('mes', obraId)
                  setIsExportDialogOpen(false)
                }}
                className="h-20 flex flex-col items-center justify-center gap-2"
                disabled={mesSelecionado === 'todos' || !mesSelecionado}
              >
                <Download className="w-6 h-6" />
                <span>Exportar Mês</span>
                <span className="text-xs text-gray-500">Mês selecionado</span>
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {custosMensais.length} itens disponíveis para exportação
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CustoForm({ custo, onClose }: { custo?: any; onClose: () => void }) {
  const [formData, setFormData] = useState({
    obraId: custo?.obraId || '',
    descricao: custo?.descricao || '',
    valor: custo?.valor || '',
    tipo: custo?.tipo || 'inicial',
    categoria: custo?.categoria || 'equipamentos',
    data: custo?.data || new Date().toISOString().split('T')[0],
    responsavelId: custo?.responsavelId || '3',
    comprovante: custo?.comprovante || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui seria a lógica para salvar/atualizar o custo
    console.log('Salvando custo:', formData)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="obra">Obra</Label>
          <Select value={formData.obraId} onValueChange={(value) => setFormData({ ...formData, obraId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a obra" />
            </SelectTrigger>
            <SelectContent>
              {mockObras.map(obra => (
                <SelectItem key={obra.id} value={obra.id}>
                  {obra.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="data">Data</Label>
          <Input
            id="data"
            type="date"
            value={formData.data}
            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="valor">Valor (R$)</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inicial">Inicial</SelectItem>
              <SelectItem value="adicional">Adicional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="categoria">Categoria</Label>
          <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equipamentos">Equipamentos</SelectItem>
              <SelectItem value="materiais">Materiais</SelectItem>
              <SelectItem value="mao_obra">Mão de Obra</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="comprovante">Comprovante (opcional)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="comprovante"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFormData({ ...formData, comprovante: e.target.files?.[0]?.name || '' })}
          />
          <Button type="button" variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {custo ? 'Atualizar' : 'Registrar'} Custo
        </Button>
      </div>
    </form>
  )
}

function CustoDetails({ custo }: { custo: any }) {
  const obra = mockObras.find(o => o.id === custo.obraId)
  const responsavel = mockUsers.find(u => u.id === custo.responsavelId)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Informações do Custo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Obra:</span>
              <span className="text-sm font-medium">{obra?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Data:</span>
              <span className="text-sm">{new Date(custo.data).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tipo:</span>
              <Badge className={custo.tipo === 'inicial' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}>
                {custo.tipo}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Categoria:</span>
              <Badge className={custo.categoria === 'equipamentos' ? 'bg-purple-100 text-purple-800' : 
                               custo.categoria === 'materiais' ? 'bg-green-100 text-green-800' : 
                               custo.categoria === 'mao_obra' ? 'bg-yellow-100 text-yellow-800' : 
                               'bg-gray-100 text-gray-800'}>
                {custo.categoria}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Valor:</span>
              <span className="text-sm font-bold text-lg">R$ {custo.valor.toLocaleString('pt-BR')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Responsável e Comprovante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Responsável:</span>
              <span className="text-sm font-medium">{responsavel?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Email:</span>
              <span className="text-sm">{responsavel?.email}</span>
            </div>
            {custo.comprovante && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Comprovante:</span>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Baixar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Descrição Detalhada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">{custo.descricao}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}