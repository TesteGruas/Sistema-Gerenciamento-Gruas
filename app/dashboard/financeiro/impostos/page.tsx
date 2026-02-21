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
import { useToast } from "@/hooks/use-toast"
import { 
  Calculator, 
  Plus, 
  Search, 
  Eye,
  Edit,
  Download,
  FileText,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Filter,
  MoreHorizontal,
  Receipt,
  FileSpreadsheet,
  Loader2
} from "lucide-react"

// Helper para obter token de autenticação
const getAuthToken = () => {
  return localStorage.getItem('access_token') || localStorage.getItem('token')
}

// Funções auxiliares para cores
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pago':
      return 'bg-green-100 text-green-800'
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800'
    case 'atrasado':
      return 'bg-red-100 text-red-800'
    case 'vencido':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getTipoColor = (tipo: string) => {
  const tipoUpper = tipo?.toUpperCase() || ''
  switch (tipoUpper) {
    case 'DAS':
      return 'bg-blue-100 text-blue-800'
    case 'DARF':
      return 'bg-green-100 text-green-800'
    case 'FGTS':
      return 'bg-yellow-100 text-yellow-800'
    case 'INSS':
      return 'bg-purple-100 text-purple-800'
    case 'TRIBUTOS MUNICIPAIS':
      return 'bg-cyan-100 text-cyan-800'
    case 'TRIBUTOS ESTADUAIS':
      return 'bg-indigo-100 text-indigo-800'
    case 'ICMS':
      return 'bg-blue-100 text-blue-800'
    case 'PIS':
      return 'bg-purple-100 text-purple-800'
    case 'COFINS':
      return 'bg-orange-100 text-orange-800'
    case 'IRPJ':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function ImpostosPage() {
  const [activeTab, setActiveTab] = useState('pagamentos')
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedTipo, setSelectedTipo] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const { toast } = useToast()

  // Estados para dados reais da API
  const [impostos, setImpostos] = useState<any[]>([])
  const [tiposImpostos, setTiposImpostos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTipoDialogOpen, setIsTipoDialogOpen] = useState(false)
  const [isPagoDialogOpen, setIsPagoDialogOpen] = useState(false)
  const [impostoParaPagar, setImpostoParaPagar] = useState<any>(null)
  const [contaBancariaPago, setContaBancariaPago] = useState('')
  const [contasBancariasMain, setContasBancariasMain] = useState<any[]>([])

  // Tipos padrão
  const tiposPadrao = [
    'DAS',
    'DARF',
    'FGTS',
    'INSS',
    'TRIBUTOS MUNICIPAIS',
    'TRIBUTOS ESTADUAIS'
  ]

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadImpostos()
    loadTiposImpostos()
    loadContasBancarias()
  }, [])

  const loadContasBancarias = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = getAuthToken()
      const res = await fetch(`${API_URL}/api/contas-bancarias`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setContasBancariasMain((data.data || []).filter((c: any) => c.status === 'ativa'))
      }
    } catch (err) {
      console.error('Erro ao carregar contas bancárias:', err)
    }
  }

  const loadImpostos = async () => {
    setIsLoading(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = getAuthToken()

      const response = await fetch(`${API_URL}/api/impostos-financeiros`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setImpostos(data.data || data || [])
      } else {
        throw new Error('Erro ao carregar impostos')
      }
    } catch (error) {
      console.error('Erro ao carregar impostos:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar impostos. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadTiposImpostos = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = getAuthToken()

      const response = await fetch(`${API_URL}/api/tipos-impostos?ativo=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTiposImpostos(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de impostos:', error)
    }
  }

  const isImpostoDeNF = (imposto: any) => {
    return typeof imposto?.id === 'string' && imposto.id.startsWith('nf-')
  }

  const abrirDialogPago = (imposto: any) => {
    setImpostoParaPagar(imposto)
    setContaBancariaPago('')
    if (isImpostoDeNF(imposto)) {
      // Impostos de NF já tiveram o saldo decrementado na NF — marcar direto
      confirmarPagamentoDireto(imposto)
    } else {
      setIsPagoDialogOpen(true)
    }
  }

  const confirmarPagamentoDireto = async (imposto: any) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = getAuthToken()
      const hoje = new Date().toISOString().split('T')[0]

      const response = await fetch(`${API_URL}/api/impostos-financeiros/${imposto.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'pago', data_pagamento: hoje })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao marcar como pago')
      }

      toast({
        title: "Sucesso",
        description: "Imposto de NF marcado como pago (saldo já decrementado pela nota fiscal)",
      })
      loadImpostos()
    } catch (error: any) {
      console.error('Erro ao marcar como pago:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao marcar imposto como pago.",
        variant: "destructive"
      })
    }
  }

  const confirmarPagamento = async () => {
    if (!impostoParaPagar) return

    if (!contaBancariaPago) {
      toast({
        title: "Atenção",
        description: "Selecione uma conta bancária para débito",
        variant: "destructive"
      })
      return
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = getAuthToken()
      const hoje = new Date().toISOString().split('T')[0]

      const response = await fetch(`${API_URL}/api/impostos-financeiros/${impostoParaPagar.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'pago',
          data_pagamento: hoje
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao marcar como pago')
      }

      // Registrar movimentação bancária (saída) — apenas para impostos manuais (não NF)
      try {
        await fetch(`${API_URL}/api/contas-bancarias/${contaBancariaPago}/movimentacoes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tipo: 'saida',
            valor: parseFloat(impostoParaPagar.valor),
            descricao: `Pagamento de imposto: ${impostoParaPagar.tipo || ''} - ${impostoParaPagar.descricao || ''}`.trim(),
            referencia: impostoParaPagar.referencia || `IMP-${impostoParaPagar.id}`,
            data: hoje,
            categoria: 'impostos'
          })
        })
      } catch (movErr) {
        console.error('Erro ao registrar movimentação bancária:', movErr)
        toast({
          title: "Aviso",
          description: "Imposto marcado como pago, mas houve erro ao registrar movimentação bancária",
          variant: "destructive"
        })
      }

      toast({
        title: "Sucesso",
        description: "Imposto marcado como pago e movimentação bancária registrada",
      })

      setIsPagoDialogOpen(false)
      setImpostoParaPagar(null)
      loadImpostos()
      loadContasBancarias()
    } catch (error: any) {
      console.error('Erro ao marcar como pago:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao marcar imposto como pago. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  // Combinar tipos padrão com tipos do banco
  const todosTipos = [
    ...tiposPadrao,
    ...tiposImpostos.filter(t => tiposPadrao.indexOf(t.nome) === -1).map(t => t.nome)
  ].sort()

  // Agrupar impostos por mês
  const groupImpostosByMonth = (impostos: any[]) => {
    const grouped: any = {}
    
    impostos.forEach(imposto => {
      const mes = imposto.mes_competencia || 'Sem mês'
      if (!grouped[mes]) {
        grouped[mes] = {
          mes,
          icms: 0,
          pis: 0,
          cofins: 0,
          total: 0,
          status: 'pendente'
        }
      }
      
      const tipo = imposto.tipo_imposto?.toUpperCase()
      const valor = imposto.valor || 0
      
      if (tipo === 'ICMS') grouped[mes].icms += valor
      else if (tipo === 'PIS') grouped[mes].pis += valor
      else if (tipo === 'COFINS') grouped[mes].cofins += valor
      
      grouped[mes].total += valor
      
      if (imposto.status === 'pago') {
        grouped[mes].status = 'pago'
      }
    })
    
    return Object.values(grouped)
  }

  const totalImpostos = impostos.reduce((sum, i) => sum + (i.valor || 0), 0)
  const totalPago = impostos.filter(i => i.status === 'pago').reduce((sum, i) => sum + (i.valor || 0), 0)
  const totalPendente = totalImpostos - totalPago

  const stats = [
    { 
      title: "Total de Impostos", 
      value: `R$ ${totalImpostos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: TrendingDown, 
      color: "bg-red-500",
      change: `${impostos.length} registro(s)`
    },
    { 
      title: "Pagamentos Pendentes", 
      value: impostos.filter(i => i.status === 'pendente' || i.status === 'atrasado').length.toString(), 
      icon: Clock, 
      color: "bg-orange-500",
      change: `A pagar`
    },
    { 
      title: "Total Pago", 
      value: `R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: CheckCircle, 
      color: "bg-green-500",
      change: `${impostos.filter(i => i.status === 'pago').length} quitado(s)`
    },
    { 
      title: "Tipos de Impostos", 
      value: new Set(impostos.map(i => i.tipo_imposto)).size.toString(), 
      icon: Calculator, 
      color: "bg-blue-500",
      change: "Tipos diferentes"
    }
  ]


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulo de Impostos</h1>
          <p className="text-gray-600">Gestão de impostos e tributos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsTipoDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Tipo de Imposto
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Pagamento de Imposto</DialogTitle>
                <DialogDescription>
                  Registre um novo pagamento de imposto
                </DialogDescription>
              </DialogHeader>
              <PagamentoForm 
                onClose={() => {
                  setIsCreateDialogOpen(false)
                  loadImpostos()
                }}
                tiposImpostos={todosTipos}
              />
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

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pagamentos">Pagamentos de Impostos</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório de Impostos</TabsTrigger>
        </TabsList>

        {/* Pagamentos de Impostos */}
        <TabsContent value="pagamentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos de Impostos</CardTitle>
              <CardDescription>Gestão de pagamentos de impostos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="search"
                        placeholder="Tipo, descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {todosTipos.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                      <TableHead>Número Nota</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : impostos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhum imposto encontrado
                        </TableCell>
                      </TableRow>
                    ) : impostos.map((imposto) => {
                      const dataVencimento = imposto.data_vencimento || imposto.vencimento
                      const dataPagamento = imposto.data_pagamento || imposto.dataPagamento
                      const numeroNota = imposto.referencia || imposto.numeroNota
                      
                      return (
                        <TableRow key={imposto.id}>
                          <TableCell>
                            <Badge className={getTipoColor(imposto.tipo)}>
                              {imposto.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>{imposto.descricao}</TableCell>
                          <TableCell className="font-semibold">
                            R$ {parseFloat(imposto.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            {dataVencimento ? new Date(dataVencimento).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(imposto.status)}>
                              {imposto.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {dataPagamento ? new Date(dataPagamento).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell>{numeroNota || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {imposto.status !== 'pago' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => abrirDialogPago(imposto)}
                                  title="Marcar como pago"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(imposto)
                                  setIsViewDialogOpen(true)
                                }}
                                title="Visualizar"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(imposto)
                                  setIsEditDialogOpen(true)
                                }}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" title="Download">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório de Impostos */}
        <TabsContent value="relatorio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Impostos</CardTitle>
              <CardDescription>Relatório mensal de impostos pagos e pendentes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="periodo">Período</Label>
                    <Select>
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
                  <div>
                    <Label htmlFor="tipo">Tipo de Imposto</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {todosTipos.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Gerar Relatório
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Excel
                  </Button>
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead>ICMS</TableHead>
                      <TableHead>PIS</TableHead>
                      <TableHead>COFINS</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : impostos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum relatório disponível
                        </TableCell>
                      </TableRow>
                    ) : groupImpostosByMonth(impostos).map((relatorio, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{relatorio.mes}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {relatorio.icms.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-semibold">
                          R$ {relatorio.pis.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-semibold">
                          R$ {relatorio.cofins.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-bold text-lg">
                          R$ {relatorio.total.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(relatorio.status)}>
                            {relatorio.status}
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
      </Tabs>

      {/* Dialog para criar novo tipo de imposto */}
      <Dialog open={isTipoDialogOpen} onOpenChange={setIsTipoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Tipo de Imposto</DialogTitle>
            <DialogDescription>
              Adicione um novo tipo de imposto personalizado
            </DialogDescription>
          </DialogHeader>
          <TipoImpostoForm
            onClose={() => {
              setIsTipoDialogOpen(false)
              loadTiposImpostos()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar imposto */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Imposto</DialogTitle>
            <DialogDescription>
              Informações completas do imposto
            </DialogDescription>
          </DialogHeader>
          {selectedItem && <ViewImpostoForm imposto={selectedItem} />}
        </DialogContent>
      </Dialog>

      {/* Dialog para editar imposto */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Imposto</DialogTitle>
            <DialogDescription>
              Atualize as informações do imposto
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <EditImpostoForm
              imposto={selectedItem}
              tiposImpostos={todosTipos}
              onClose={() => {
                setIsEditDialogOpen(false)
                setSelectedItem(null)
                loadImpostos()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar pagamento com seleção de conta bancária */}
      <Dialog open={isPagoDialogOpen} onOpenChange={setIsPagoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Selecione a conta bancária para débito do pagamento
            </DialogDescription>
          </DialogHeader>
          {impostoParaPagar && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg space-y-1">
                <p className="text-sm"><strong>Imposto:</strong> {impostoParaPagar.tipo} - {impostoParaPagar.descricao}</p>
                <p className="text-sm"><strong>Valor:</strong> R$ {parseFloat(impostoParaPagar.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>

              <div>
                <Label>Conta Bancária para débito *</Label>
                <Select value={contaBancariaPago} onValueChange={setContaBancariaPago}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {contasBancariasMain.map((conta: any) => (
                      <SelectItem key={conta.id} value={String(conta.id)}>
                        {conta.banco} - Ag: {conta.agencia} / CC: {conta.conta} (Saldo: R$ {parseFloat(conta.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {contasBancariasMain.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">Nenhuma conta bancária ativa encontrada</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPagoDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={confirmarPagamento} disabled={!contaBancariaPago}>
                  Confirmar Pagamento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ViewImpostoForm({ imposto }: { imposto: any }) {
  const dataVencimento = imposto.data_vencimento || imposto.vencimento
  const dataPagamento = imposto.data_pagamento || imposto.dataPagamento
  const competencia = imposto.competencia || (dataVencimento ? `${new Date(dataVencimento).getFullYear()}-${String(new Date(dataVencimento).getMonth() + 1).padStart(2, '0')}` : '-')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tipo de Imposto</Label>
          <div className="mt-1">
            <Badge className={getTipoColor(imposto.tipo)}>
              {imposto.tipo}
            </Badge>
          </div>
        </div>
        <div>
          <Label>Status</Label>
          <div className="mt-1">
            <Badge className={getStatusColor(imposto.status)}>
              {imposto.status}
            </Badge>
          </div>
        </div>
      </div>

      <div>
        <Label>Descrição</Label>
        <p className="mt-1 text-sm text-gray-700">{imposto.descricao}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Valor</Label>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            R$ {parseFloat(imposto.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <Label>Valor Base</Label>
          <p className="mt-1 text-sm text-gray-700">
            R$ {parseFloat(imposto.valor_base || imposto.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Alíquota</Label>
          <p className="mt-1 text-sm text-gray-700">
            {parseFloat(imposto.aliquota || 0).toFixed(2)}%
          </p>
        </div>
        <div>
          <Label>Competência</Label>
          <p className="mt-1 text-sm text-gray-700">{competencia}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Data de Vencimento</Label>
          <p className="mt-1 text-sm text-gray-700">
            {dataVencimento ? new Date(dataVencimento).toLocaleDateString('pt-BR') : '-'}
          </p>
        </div>
        <div>
          <Label>Data de Pagamento</Label>
          <p className="mt-1 text-sm text-gray-700">
            {dataPagamento ? new Date(dataPagamento).toLocaleDateString('pt-BR') : '-'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Referência / Número da Nota</Label>
          <p className="mt-1 text-sm text-gray-700">
            {imposto.referencia || imposto.numeroNota || '-'}
          </p>
        </div>
        <div>
          <Label>Observações</Label>
          <p className="mt-1 text-sm text-gray-700">
            {imposto.observacoes || '-'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Data de Criação</Label>
          <p className="mt-1 text-sm text-gray-700">
            {imposto.created_at ? new Date(imposto.created_at).toLocaleDateString('pt-BR') : '-'}
          </p>
        </div>
        <div>
          <Label>Última Atualização</Label>
          <p className="mt-1 text-sm text-gray-700">
            {imposto.updated_at ? new Date(imposto.updated_at).toLocaleDateString('pt-BR') : '-'}
          </p>
        </div>
      </div>
    </div>
  )
}

function EditImpostoForm({ imposto, tiposImpostos, onClose }: { imposto: any; tiposImpostos: string[]; onClose: () => void }) {
  const statusAnterior = imposto.status || 'pendente'
  const [formData, setFormData] = useState({
    tipo: imposto.tipo || '',
    descricao: imposto.descricao || '',
    valor: imposto.valor || '',
    valor_base: imposto.valor_base || imposto.valor || '',
    aliquota: imposto.aliquota || 0,
    competencia: imposto.competencia || '',
    vencimento: imposto.data_vencimento || imposto.vencimento || '',
    dataPagamento: imposto.data_pagamento || imposto.dataPagamento || '',
    numeroNota: imposto.referencia || imposto.numeroNota || '',
    status: imposto.status || 'pendente',
    observacoes: imposto.observacoes || '',
    contaBancariaId: ''
  })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contasBancarias, setContasBancarias] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const loadContas = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const token = getAuthToken()
        const res = await fetch(`${API_URL}/api/contas-bancarias`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setContasBancarias((data.data || []).filter((c: any) => c.status === 'ativa'))
        }
      } catch (err) {
        console.error('Erro ao carregar contas bancárias:', err)
      }
    }
    loadContas()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.tipo || !formData.descricao || !formData.valor || !formData.vencimento) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = getAuthToken()

      // Preparar dados do imposto
      const impostoData: any = {
        tipo: formData.tipo,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        valor_base: parseFloat(formData.valor_base),
        aliquota: parseFloat(formData.aliquota),
        competencia: formData.competencia || (() => {
          const vencimentoDate = new Date(formData.vencimento)
          return `${vencimentoDate.getFullYear()}-${String(vencimentoDate.getMonth() + 1).padStart(2, '0')}`
        })(),
        data_vencimento: formData.vencimento
      }

      // Adicionar campos opcionais
      if (formData.dataPagamento) {
        impostoData.data_pagamento = formData.dataPagamento
      }
      if (formData.numeroNota && formData.numeroNota.trim()) {
        impostoData.referencia = formData.numeroNota
      }
      if (formData.observacoes && formData.observacoes.trim()) {
        impostoData.observacoes = formData.observacoes
      }
      if (formData.status) {
        impostoData.status = formData.status
      }

      const response = await fetch(`${API_URL}/api/impostos-financeiros/${imposto.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(impostoData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao atualizar imposto')
      }

      const result = await response.json()

      // Registrar movimentação bancária se status mudou para pago
      // Impostos derivados de NF (id começa com "nf-") já tiveram saldo decrementado pela nota fiscal
      const impostoDeNF = typeof imposto.id === 'string' && imposto.id.startsWith('nf-')
      if (formData.status === 'pago' && statusAnterior !== 'pago' && formData.contaBancariaId && !impostoDeNF) {
        try {
          await fetch(`${API_URL}/api/contas-bancarias/${formData.contaBancariaId}/movimentacoes`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              tipo: 'saida',
              valor: parseFloat(formData.valor),
              descricao: `Pagamento de imposto: ${formData.tipo} - ${formData.descricao}`,
              referencia: formData.numeroNota || `IMP-${result.data?.id || imposto.id}`,
              data: formData.dataPagamento || new Date().toISOString().split('T')[0],
              categoria: 'impostos'
            })
          })
        } catch (movErr) {
          console.error('Erro ao registrar movimentação bancária:', movErr)
        }
      }

      // Se houver arquivo, fazer upload
      if (uploadFile && result.data?.id) {
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('arquivo', uploadFile)
          formDataUpload.append('tipo', 'comprovante')

          const uploadResponse = await fetch(`${API_URL}/api/impostos-financeiros/${result.data.id}/arquivo`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataUpload
          })

          if (!uploadResponse.ok) {
            console.warn('Erro ao fazer upload do arquivo')
            toast({
              title: "Aviso",
              description: "Imposto atualizado, mas houve erro ao enviar o arquivo",
              variant: "destructive"
            })
          } else {
            toast({
              title: "Sucesso",
              description: "Imposto atualizado e arquivo enviado com sucesso",
            })
          }
        } catch (uploadError) {
          console.error('Erro ao fazer upload:', uploadError)
          toast({
            title: "Aviso",
            description: "Imposto atualizado, mas houve erro ao enviar o arquivo",
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "Sucesso",
          description: "Imposto atualizado com sucesso",
        })
      }

      onClose()
    } catch (error: any) {
      console.error('Erro ao atualizar imposto:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar imposto. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipo">Tipo de Imposto</Label>
          <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {tiposImpostos.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
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
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="valor_base">Valor Base (R$)</Label>
          <Input
            id="valor_base"
            type="number"
            step="0.01"
            value={formData.valor_base}
            onChange={(e) => setFormData({ ...formData, valor_base: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="aliquota">Alíquota (%)</Label>
          <Input
            id="aliquota"
            type="number"
            step="0.01"
            value={formData.aliquota}
            onChange={(e) => setFormData({ ...formData, aliquota: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="competencia">Competência (YYYY-MM)</Label>
          <Input
            id="competencia"
            type="text"
            placeholder="2025-01"
            value={formData.competencia}
            onChange={(e) => setFormData({ ...formData, competencia: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="numeroNota">Número da Nota / Referência</Label>
          <Input
            id="numeroNota"
            value={formData.numeroNota}
            onChange={(e) => setFormData({ ...formData, numeroNota: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vencimento">Data de Vencimento</Label>
          <Input
            id="vencimento"
            type="date"
            value={formData.vencimento ? new Date(formData.vencimento).toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="dataPagamento">Data de Pagamento</Label>
          <Input
            id="dataPagamento"
            type="date"
            value={formData.dataPagamento ? new Date(formData.dataPagamento).toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
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
        />
      </div>

      {/* Conta Bancária para débito (visível quando muda para pago e NÃO é imposto de NF) */}
      {formData.status === 'pago' && statusAnterior !== 'pago' && !(typeof imposto.id === 'string' && imposto.id.startsWith('nf-')) && (
        <div>
          <Label htmlFor="contaBancaria_edit">Conta Bancária (débito)</Label>
          <Select
            value={formData.contaBancariaId}
            onValueChange={(value) => setFormData({ ...formData, contaBancariaId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta para débito" />
            </SelectTrigger>
            <SelectContent>
              {contasBancarias.map((conta: any) => (
                <SelectItem key={conta.id} value={String(conta.id)}>
                  {conta.banco} - Ag: {conta.agencia} / CC: {conta.conta} (Saldo: R$ {parseFloat(conta.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {contasBancarias.length === 0 && (
            <p className="text-sm text-muted-foreground mt-1">Nenhuma conta bancária ativa encontrada</p>
          )}
        </div>
      )}

      {/* Upload de Arquivo */}
      <div>
        <Label htmlFor="arquivo_edit">Anexar Arquivo (Comprovante, Nota Fiscal, etc.)</Label>
        <Input
          id="arquivo_edit"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              // Validar tamanho (10MB)
              if (file.size > 10 * 1024 * 1024) {
                toast({
                  title: "Erro",
                  description: "Arquivo muito grande. Tamanho máximo: 10MB",
                  variant: "destructive"
                })
                e.target.value = ''
                return
              }
              // Validar tipo
              const validTypes = [
                'application/pdf',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              ]
              const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx']
              const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
              if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
                toast({
                  title: "Erro",
                  description: "Tipo de arquivo inválido. Use PDF, imagem, Word ou Excel",
                  variant: "destructive"
                })
                e.target.value = ''
                return
              }
              setUploadFile(file)
            } else {
              setUploadFile(null)
            }
          }}
        />
        {uploadFile && (
          <p className="text-sm text-gray-600 mt-2">
            Novo arquivo selecionado: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
        {!uploadFile && imposto.arquivo && (
          <p className="text-sm text-gray-500 mt-2">
            Arquivo atual: {imposto.arquivo}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </form>
  )
}

function TipoImpostoForm({ onClose }: { onClose: () => void }) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome do tipo é obrigatório",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = getAuthToken()

      const response = await fetch(`${API_URL}/api/tipos-impostos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          ativo: true
        })
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Tipo de imposto criado com sucesso",
        })
        onClose()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao criar tipo de imposto')
      }
    } catch (error: any) {
      console.error('Erro ao criar tipo de imposto:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar tipo de imposto. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome do Tipo *</Label>
        <Input
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: IPTU, ITR, etc"
          required
        />
      </div>

      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          placeholder="Descrição opcional do tipo de imposto"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Tipo'}
        </Button>
      </div>
    </form>
  )
}

function PagamentoForm({ onClose, tiposImpostos }: { onClose: () => void; tiposImpostos: string[] }) {
  const [formData, setFormData] = useState({
    tipo: '',
    descricao: '',
    valor: '',
    vencimento: '',
    dataPagamento: '',
    numeroNota: '',
    status: 'pendente',
    contaBancariaId: ''
  })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [contasBancarias, setContasBancarias] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const loadContas = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const token = getAuthToken()
        const res = await fetch(`${API_URL}/api/contas-bancarias`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setContasBancarias((data.data || []).filter((c: any) => c.status === 'ativa'))
        }
      } catch (err) {
        console.error('Erro ao carregar contas bancárias:', err)
      }
    }
    loadContas()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.tipo || !formData.descricao || !formData.valor || !formData.vencimento) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = getAuthToken()

      // Extrair competência da data de vencimento (YYYY-MM)
      const vencimentoDate = new Date(formData.vencimento)
      const competencia = `${vencimentoDate.getFullYear()}-${String(vencimentoDate.getMonth() + 1).padStart(2, '0')}`

      // Preparar dados do imposto
      const impostoData: any = {
        tipo: formData.tipo,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        valor_base: parseFloat(formData.valor), // Usando o valor como base por padrão
        aliquota: 0, // Pode ser calculado depois ou deixar 0
        competencia: competencia,
        data_vencimento: formData.vencimento
      }

      // Adicionar campos opcionais apenas se tiverem valor (não enviar se vazio)
      if (formData.numeroNota && formData.numeroNota.trim()) {
        impostoData.referencia = formData.numeroNota
      }
      // data_pagamento não é permitido na criação, será atualizado depois se necessário

      // Criar o imposto
      const response = await fetch(`${API_URL}/api/impostos-financeiros`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(impostoData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao criar imposto')
      }

      const result = await response.json()

      // Se o status for "pago" e houver data de pagamento, atualizar o imposto
      if (formData.status === 'pago' && formData.dataPagamento && result.data?.id) {
        try {
          const updateResponse = await fetch(`${API_URL}/api/impostos-financeiros/${result.data.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              data_pagamento: formData.dataPagamento,
              status: 'pago'
            })
          })

          if (!updateResponse.ok) {
            console.warn('Erro ao atualizar data de pagamento')
          }
        } catch (updateError) {
          console.error('Erro ao atualizar data de pagamento:', updateError)
        }

        // Registrar movimentação bancária (saída) na conta selecionada
        if (formData.contaBancariaId) {
          try {
            await fetch(`${API_URL}/api/contas-bancarias/${formData.contaBancariaId}/movimentacoes`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                tipo: 'saida',
                valor: parseFloat(formData.valor),
                descricao: `Pagamento de imposto: ${formData.tipo} - ${formData.descricao}`,
                referencia: formData.numeroNota || `IMP-${result.data.id}`,
                data: formData.dataPagamento,
                categoria: 'impostos'
              })
            })
          } catch (movErr) {
            console.error('Erro ao registrar movimentação bancária:', movErr)
          }
        }
      }

      // Fazer upload do arquivo se houver
      if (uploadFile && result.data?.id) {
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('arquivo', uploadFile)

          const uploadResponse = await fetch(`${API_URL}/api/impostos-financeiros/${result.data.id}/arquivo`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataUpload
          })

          if (!uploadResponse.ok) {
            console.warn('Erro ao fazer upload do arquivo')
            const uploadError = await uploadResponse.json()
            console.error('Erro detalhado:', uploadError)
          }
        } catch (uploadError) {
          console.error('Erro ao fazer upload do arquivo:', uploadError)
          // Não bloquear o fluxo se o upload falhar
        }
      }

      toast({
        title: "Sucesso",
        description: "Pagamento de imposto registrado com sucesso",
      })

      onClose()
      
      // Recarregar a página para atualizar a lista
      window.location.reload()
    } catch (error: any) {
      console.error('Erro ao salvar imposto:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar pagamento de imposto. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipo">Tipo de Imposto</Label>
          <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {tiposImpostos.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="valor">Valor (R$)</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="numeroNota">Número da Nota</Label>
          <Input
            id="numeroNota"
            value={formData.numeroNota}
            onChange={(e) => setFormData({ ...formData, numeroNota: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vencimento">Data de Vencimento</Label>
          <Input
            id="vencimento"
            type="date"
            value={formData.vencimento}
            onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="dataPagamento">Data de Pagamento</Label>
          <Input
            id="dataPagamento"
            type="date"
            value={formData.dataPagamento}
            onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
          />
        </div>
      </div>

      {/* Conta Bancária para débito */}
      {formData.status === 'pago' && (
        <div>
          <Label htmlFor="contaBancaria">Conta Bancária (débito)</Label>
          <Select
            value={formData.contaBancariaId}
            onValueChange={(value) => setFormData({ ...formData, contaBancariaId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta para débito" />
            </SelectTrigger>
            <SelectContent>
              {contasBancarias.map((conta: any) => (
                <SelectItem key={conta.id} value={String(conta.id)}>
                  {conta.banco} - Ag: {conta.agencia} / CC: {conta.conta} (Saldo: R$ {parseFloat(conta.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {contasBancarias.length === 0 && (
            <p className="text-sm text-muted-foreground mt-1">Nenhuma conta bancária ativa encontrada</p>
          )}
        </div>
      )}

      {/* Upload de Arquivo */}
      <div>
        <Label htmlFor="arquivo">Anexar Arquivo (Comprovante, Nota Fiscal, etc.)</Label>
        <Input
          id="arquivo"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              if (file.size > 10 * 1024 * 1024) {
                toast({
                  title: "Erro",
                  description: "Arquivo muito grande. Tamanho máximo: 10MB",
                  variant: "destructive"
                })
                e.target.value = ''
                return
              }
              const validTypes = [
                'application/pdf',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              ]
              const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx']
              const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
              if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
                toast({
                  title: "Erro",
                  description: "Tipo de arquivo inválido. Use PDF, imagem, Word ou Excel",
                  variant: "destructive"
                })
                e.target.value = ''
                return
              }
              setUploadFile(file)
            } else {
              setUploadFile(null)
            }
          }}
        />
        {uploadFile && (
          <p className="text-sm text-gray-600 mt-2">
            Arquivo selecionado: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar Pagamento
        </Button>
      </div>
    </form>
  )
}
