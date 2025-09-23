"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Calendar as CalendarIcon,
  Clock,
  User,
  Eye,
  Bell
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { mockGruas, mockUsers, getHistoricoByGrua, getHistoricoByMonth } from "@/lib/mock-data"

export default function HistoricoPage() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGrua, setSelectedGrua] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'all' | 'month'>('all')

  // Aplicar filtros da URL
  useEffect(() => {
    const gruaParam = searchParams.get('grua')
    const obraParam = searchParams.get('obra')
    
    if (gruaParam) {
      setSelectedGrua(gruaParam)
    }
  }, [searchParams])

  // Obter histórico baseado nos filtros
  const getFilteredHistorico = () => {
    let historico: any[] = []
    
    if (selectedGrua === "all") {
      mockGruas.forEach(grua => {
        historico = [...historico, ...grua.historico]
      })
    } else {
      historico = getHistoricoByGrua(selectedGrua)
    }

    if (viewMode === 'month') {
      historico = getHistoricoByMonth(selectedGrua, selectedMonth.getMonth(), selectedMonth.getFullYear())
    }

    return historico
      .filter(entry => {
        const matchesSearch = (entry.observacoes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (entry.funcionarioName || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = selectedStatus === "all" || entry.status === selectedStatus
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }

  const filteredHistorico = getFilteredHistorico()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800'
      case 'falha': return 'bg-red-100 text-red-800'
      case 'manutencao': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-4 h-4" />
      case 'falha': return <AlertTriangle className="w-4 h-4" />
      case 'manutencao': return <Wrench className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'checklist': return 'bg-blue-100 text-blue-800'
      case 'manutencao': return 'bg-yellow-100 text-yellow-800'
      case 'falha': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewDetails = (entry: any) => {
    window.location.href = `/dashboard/historico/${entry.id}`
  }

  const stats = [
    { 
      title: "Total de Entradas", 
      value: filteredHistorico.length, 
      icon: BookOpen, 
      color: "bg-blue-500" 
    },
    { 
      title: "Status OK", 
      value: filteredHistorico.filter(e => e.status === 'ok').length, 
      icon: CheckCircle, 
      color: "bg-green-500" 
    },
    { 
      title: "Falhas Registradas", 
      value: filteredHistorico.filter(e => e.status === 'falha').length, 
      icon: AlertTriangle, 
      color: "bg-red-500" 
    },
    { 
      title: "Manutenções", 
      value: filteredHistorico.filter(e => e.tipo === 'manutencao').length, 
      icon: Wrench, 
      color: "bg-yellow-500" 
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Livro de Histórico</h1>
          <p className="text-gray-600">Registro diário de checklists e manutenções das gruas</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => window.location.href = '/dashboard/historico/nova'}
        >
          <Plus className="w-4 h-4" />
          Nova Entrada
        </Button>
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

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Observações ou funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="grua">Grua</Label>
              <Select value={selectedGrua} onValueChange={setSelectedGrua}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as gruas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as gruas</SelectItem>
                  {mockGruas.map(grua => (
                    <SelectItem key={grua.id} value={grua.id}>
                      {grua.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ok">OK</SelectItem>
                  <SelectItem value="falha">Falha</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Visualização</Label>
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'all' | 'month')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="month">Mensal</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {viewMode === 'month' && (
              <div>
                <Label>Mês/Ano</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedMonth, "MMM/yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedMonth}
                      onSelect={(date) => date && setSelectedMonth(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Entradas ({filteredHistorico.length})</CardTitle>
          <CardDescription>Registros de checklists e manutenções</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Grua</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Funcionário</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistorico.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {format(new Date(entry.data), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{mockGruas.find(g => g.id === entry.gruaId)?.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(entry.status)}>
                      {getStatusIcon(entry.status)}
                      <span className="ml-1 capitalize">{entry.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTipoColor(entry.tipo)}>
                      {entry.tipo === 'checklist' && <Clock className="w-3 h-3 mr-1" />}
                      {entry.tipo === 'manutencao' && <Wrench className="w-3 h-3 mr-1" />}
                      {entry.tipo === 'falha' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      <span className="capitalize">{entry.tipo}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{entry.funcionarioName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {entry.observacoes}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {entry.status === 'falha' && entry.notificacaoEnviada && (
                        <Bell className="w-4 h-4 text-red-500" title="Notificação enviada" />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(entry)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}

