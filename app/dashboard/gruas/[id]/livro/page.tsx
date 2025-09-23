"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ConeIcon as Crane, 
  ArrowLeft,
  Plus, 
  Search, 
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Building2,
  Calendar,
  User,
  Bell,
  BookOpen
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { mockGruas, mockObras, mockUsers, getHistoricoByGrua } from "@/lib/mock-data"

export default function LivroGruaPage() {
  const params = useParams()
  const gruaId = params.id as string
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'all' | 'month'>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const grua = mockGruas.find(g => g.id === gruaId)
  
  if (!grua) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Grua não encontrada</h2>
          <p className="text-gray-600">A grua solicitada não existe ou foi removida.</p>
        </div>
      </div>
    )
  }

  const obra = mockObras.find(o => o.id === grua.currentObraId)
  const historico = getHistoricoByGrua(gruaId)

  // Obter histórico baseado nos filtros
  const getFilteredHistorico = () => {
    let filtered = historico

    if (viewMode === 'month') {
      filtered = historico.filter(entry => {
        const entryDate = new Date(entry.data)
        return entryDate.getMonth() === selectedMonth.getMonth() && 
               entryDate.getFullYear() === selectedMonth.getFullYear()
      })
    }

    return filtered
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

  const stats = [
    { 
      title: "Total de Entradas", 
      value: historico.length, 
      icon: BookOpen, 
      color: "bg-blue-500" 
    },
    { 
      title: "Status OK", 
      value: historico.filter(e => e.status === 'ok').length, 
      icon: CheckCircle, 
      color: "bg-green-500" 
    },
    { 
      title: "Falhas Registradas", 
      value: historico.filter(e => e.status === 'falha').length, 
      icon: AlertTriangle, 
      color: "bg-red-500" 
    },
    { 
      title: "Manutenções", 
      value: historico.filter(e => e.tipo === 'manutencao').length, 
      icon: Wrench, 
      color: "bg-yellow-500" 
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Livro da Grua</h1>
          <p className="text-gray-600">{grua.name} - {grua.model} - {grua.capacity}</p>
          {obra && (
            <p className="text-sm text-blue-600">Obra: {obra.name}</p>
          )}
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

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar entradas</Label>
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
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setSelectedStatus("all")
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Nova Entrada */}
      <div className="flex justify-end">
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Nova Entrada
        </Button>
      </div>

      {/* Lista de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Entradas ({filteredHistorico.length})</CardTitle>
          <CardDescription>Registros de checklists e manutenções da grua</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
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
                        onClick={() => window.location.href = `/dashboard/gruas/${gruaId}/livro/${entry.id}`}
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

      {/* Dialog de Nova Entrada */}
      {isCreateDialogOpen && (
        <NovaEntradaDialog 
          grua={grua}
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        />
      )}
    </div>
  )
}

function NovaEntradaDialog({ grua, isOpen, onClose }: { grua: any; isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    status: 'ok',
    tipo: 'checklist',
    observacoes: '',
    funcionarioId: '4'
  })

  // Preencher automaticamente baseado na grua e obra
  useEffect(() => {
    if (grua) {
      const obra = mockObras.find(o => o.id === grua.currentObraId)
      const funcionario = mockUsers.find(u => u.obraId === grua.currentObraId)
      
      setFormData(prev => ({
        ...prev,
        funcionarioId: funcionario?.id || '4',
        tipo: grua.status === 'em_obra' ? 'checklist' : 'manutencao'
      }))
    }
  }, [grua])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Salvando entrada:', { ...formData, gruaId: grua.id })
    onClose()
  }

  const obra = mockObras.find(o => o.id === grua.currentObraId)
  const funcionario = mockUsers.find(u => u.id === formData.funcionarioId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Nova Entrada no Livro da Grua</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
            
            {/* Informações da Grua */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-900">{grua.name}</h3>
              <p className="text-sm text-blue-700">{grua.model} - {grua.capacity}</p>
              {obra && (
                <p className="text-sm text-blue-600">Obra: {obra.name}</p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checklist">Checklist Diário</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                      <SelectItem value="falha">Falha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ok">OK</SelectItem>
                      <SelectItem value="falha">Falha</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="responsavel">Responsável *</Label>
                  <Select value={formData.funcionarioId} onValueChange={(value) => setFormData({ ...formData, funcionarioId: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockUsers.filter(user => user.obraId === grua.currentObraId || user.role === 'admin').map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações *</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={4}
                  placeholder="Descreva as observações da inspeção ou manutenção..."
                  required
                />
              </div>

              {/* Resumo dos dados preenchidos */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Resumo da Entrada:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Grua:</strong> {grua.name} - {grua.model}</p>
                  <p><strong>Obra:</strong> {obra?.name || 'Nenhuma obra vinculada'}</p>
                  <p><strong>Data:</strong> {new Date(formData.data).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Tipo:</strong> {formData.tipo}</p>
                  <p><strong>Status:</strong> {formData.status}</p>
                  <p><strong>Responsável:</strong> {funcionario?.name}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar Entrada
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
