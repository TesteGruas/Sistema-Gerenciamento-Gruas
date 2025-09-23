"use client"

import { useState, useEffect } from "react"
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
  Bell
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { mockGruas, mockObras, mockUsers, getHistoricoByGrua } from "@/lib/mock-data"

export default function GruasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedObra, setSelectedObra] = useState("all")
  const [selectedGrua, setSelectedGrua] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isHistoricoDialogOpen, setIsHistoricoDialogOpen] = useState(false)

  const filteredGruas = mockGruas.filter(grua => {
    const matchesSearch = (grua.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (grua.model || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || grua.status === selectedStatus
    const matchesObra = selectedObra === "all" || grua.currentObraId === selectedObra
    
    return matchesSearch && matchesStatus && matchesObra
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel': return 'bg-green-100 text-green-800'
      case 'em_obra': return 'bg-blue-100 text-blue-800'
      case 'manutencao': return 'bg-yellow-100 text-yellow-800'
      case 'inativa': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'disponivel': return <CheckCircle className="w-4 h-4" />
      case 'em_obra': return <Building2 className="w-4 h-4" />
      case 'manutencao': return <Wrench className="w-4 h-4" />
      case 'inativa': return <Clock className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const handleViewDetails = (grua: any) => {
    setSelectedGrua(grua)
  }

  const handleAddHistorico = (grua: any) => {
    setSelectedGrua(grua)
    setIsHistoricoDialogOpen(true)
  }

  const stats = [
    { 
      title: "Total de Gruas", 
      value: mockGruas.length, 
      icon: Crane, 
      color: "bg-blue-500" 
    },
    { 
      title: "Em Obra", 
      value: mockGruas.filter(g => g.status === 'em_obra').length, 
      icon: Building2, 
      color: "bg-green-500" 
    },
    { 
      title: "Em Manutenção", 
      value: mockGruas.filter(g => g.status === 'manutencao').length, 
      icon: Wrench, 
      color: "bg-yellow-500" 
    },
    { 
      title: "Disponíveis", 
      value: mockGruas.filter(g => g.status === 'disponivel').length, 
      icon: CheckCircle, 
      color: "bg-purple-500" 
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Gruas</h1>
          <p className="text-gray-600">Gerenciamento de gruas e histórico de manutenção</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Nova Grua
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar gruas</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Nome ou modelo..."
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
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_obra">Em Obra</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                </SelectContent>
              </Select>
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
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setSelectedStatus("all")
                  setSelectedObra("all")
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Gruas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGruas.map((grua) => {
          const historico = getHistoricoByGrua(grua.id)
          const obra = mockObras.find(o => o.id === grua.currentObraId)
          
          return (
            <Card key={grua.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Crane className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{grua.name}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(grua.status)}>
                    {getStatusIcon(grua.status)}
                    <span className="ml-1 capitalize">{grua.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
                <CardDescription>{grua.model} - {grua.capacity}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {obra && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span>Obra: {obra.name}</span>
                    </div>
                  )}
                  
                  {/* Histórico Recente */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Histórico Recente</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddHistorico(grua)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Nova Entrada
                      </Button>
                    </div>
                    {historico.length > 0 ? (
                      <div className="space-y-2">
                        {historico.slice(0, 3).map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                entry.status === 'ok' ? 'bg-green-500' : 
                                entry.status === 'falha' ? 'bg-red-500' : 'bg-yellow-500'
                              }`} />
                              <span className="text-sm">{entry.observacoes.substring(0, 40)}...</span>
                              {entry.status === 'falha' && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(entry.data), "dd/MM", { locale: ptBR })}
                            </div>
                          </div>
                        ))}
                        {historico.length > 3 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2"
                            onClick={() => handleViewDetails(grua)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Histórico Completo
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-2">Nenhum histórico registrado</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAddHistorico(grua)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Primeira Entrada
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(grua)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddHistorico(grua)}
                    >
                      <Wrench className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialog de Nova Entrada no Histórico */}
      {selectedGrua && (
        <HistoricoDialog 
          grua={selectedGrua}
          isOpen={isHistoricoDialogOpen}
          onClose={() => setIsHistoricoDialogOpen(false)}
        />
      )}
    </div>
  )
}

function HistoricoDialog({ grua, isOpen, onClose }: { grua: any; isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    status: 'ok',
    tipo: 'checklist',
    observacoes: '',
    funcionarioId: '4' // Ana Oliveira por padrão
  })

  // Preencher automaticamente baseado na grua e obra
  useEffect(() => {
    if (grua) {
      const obra = mockObras.find(o => o.id === grua.currentObraId)
      const funcionario = mockUsers.find(u => u.obraId === grua.currentObraId)
      
      setFormData(prev => ({
        ...prev,
        funcionarioId: funcionario?.id || '4',
        // Se a grua está em obra, tipo padrão é checklist
        tipo: grua.status === 'em_obra' ? 'checklist' : 'manutencao'
      }))
    }
  }, [grua])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui seria a lógica para salvar a entrada
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
              <h2 className="text-xl font-semibold">Nova Entrada no Histórico</h2>
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
