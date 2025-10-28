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

export default function ImpostosPage() {
  const [activeTab, setActiveTab] = useState('pagamentos')
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedTipo, setSelectedTipo] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const { toast } = useToast()

  // Estados para dados reais da API
  const [impostos, setImpostos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadImpostos()
  }, [])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800'
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800'
      case 'vencido':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Pagamento de Imposto</DialogTitle>
                <DialogDescription>
                  Registre um novo pagamento de imposto
                </DialogDescription>
              </DialogHeader>
              <PagamentoForm onClose={() => setIsCreateDialogOpen(false)} />
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
            <CardContent>
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
                        <SelectItem value="ICMS">ICMS</SelectItem>
                        <SelectItem value="PIS">PIS</SelectItem>
                        <SelectItem value="COFINS">COFINS</SelectItem>
                        <SelectItem value="IRPJ">IRPJ</SelectItem>
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
                    ) : impostos.map((pagamento) => (
                      <TableRow key={pagamento.id}>
                        <TableCell>
                          <Badge className={getTipoColor(pagamento.tipo)}>
                            {pagamento.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{pagamento.descricao}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {pagamento.valor.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>{new Date(pagamento.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(pagamento.status)}>
                            {pagamento.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {pagamento.dataPagamento ? new Date(pagamento.dataPagamento).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>{pagamento.numeroNota}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
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

        {/* Relatório de Impostos */}
        <TabsContent value="relatorio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Impostos</CardTitle>
              <CardDescription>Relatório mensal de impostos pagos e pendentes</CardDescription>
            </CardHeader>
            <CardContent>
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
                        <SelectItem value="ICMS">ICMS</SelectItem>
                        <SelectItem value="PIS">PIS</SelectItem>
                        <SelectItem value="COFINS">COFINS</SelectItem>
                        <SelectItem value="IRPJ">IRPJ</SelectItem>
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
    </div>
  )
}

function PagamentoForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    tipo: '',
    descricao: '',
    valor: '',
    vencimento: '',
    dataPagamento: '',
    numeroNota: '',
    status: 'pendente'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Salvando pagamento:', formData)
    onClose()
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
              <SelectItem value="ICMS">ICMS</SelectItem>
              <SelectItem value="PIS">PIS</SelectItem>
              <SelectItem value="COFINS">COFINS</SelectItem>
              <SelectItem value="IRPJ">IRPJ</SelectItem>
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
