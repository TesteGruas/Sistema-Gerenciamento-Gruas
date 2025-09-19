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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ConeIcon as Crane, 
  Plus, 
  Search, 
  Edit,
  Eye,
  CheckCircle,
  Clock,
  Wrench,
  Building2,
  Calendar,
  Trash2
} from "lucide-react"
import { mockGruas, mockObras, mockUsers } from "@/lib/mock-data"

export default function GruasPage() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedObra, setSelectedObra] = useState("all")
  const [selectedGrua, setSelectedGrua] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [gruaToDelete, setGruaToDelete] = useState<any>(null)
  const [gruaFormData, setGruaFormData] = useState({
    name: '',
    model: '',
    capacity: '',
    status: 'disponivel',
    obraId: '',
    observacoes: ''
  })

  // Aplicar filtros da URL
  useEffect(() => {
    const obraParam = searchParams.get('obra')
    
    if (obraParam) {
      setSelectedObra(obraParam)
    }
  }, [searchParams])

  const filteredGruas = mockGruas.filter(grua => {
    const matchesSearch = grua.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grua.model.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleDeleteGrua = (grua: any) => {
    setGruaToDelete(grua)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteGrua = () => {
    if (!gruaToDelete) return

    // Verificar se a grua está em obra
    if (gruaToDelete.status === 'em_obra') {
      alert(`Não é possível excluir a grua "${gruaToDelete.name}" pois ela está atualmente em obra. Remova-a da obra primeiro.`)
      setIsDeleteDialogOpen(false)
      return
    }

    // Simular exclusão da grua
    console.log('Grua excluída:', gruaToDelete)
    
    setIsDeleteDialogOpen(false)
    setGruaToDelete(null)
    
    // Mostrar mensagem de sucesso (simulado)
    alert(`Grua "${gruaToDelete.name}" excluída com sucesso!`)
  }

  const handleCreateGrua = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simular criação da grua
    const newGrua = {
      id: (mockGruas.length + 1).toString(),
      name: gruaFormData.name,
      model: gruaFormData.model,
      capacity: gruaFormData.capacity,
      status: gruaFormData.status as 'disponivel' | 'em_obra' | 'manutencao' | 'inativa',
      currentObraId: gruaFormData.obraId || null,
      currentObraName: gruaFormData.obraId ? mockObras.find(o => o.id === gruaFormData.obraId)?.name : null,
      responsavelId: null,
      responsavelName: null,
      createdAt: new Date().toISOString(),
      historico: []
    }

    // Em uma aplicação real, isso seria uma chamada para a API
    console.log('Nova grua criada:', newGrua)
    
    // Resetar formulário e fechar dialog
    setGruaFormData({
      name: '',
      model: '',
      capacity: '',
      status: 'disponivel',
      obraId: '',
      observacoes: ''
    })
    setIsCreateDialogOpen(false)
    
    // Mostrar mensagem de sucesso (simulado)
    alert('Grua criada com sucesso!')
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
                  
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Criada em: {new Date(grua.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/obras/${grua.currentObraId}?tab=livro`}
                      className="flex-1"
                      disabled={!grua.currentObraId}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver na Obra
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(grua)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteGrua(grua)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialog de Criação de Grua */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crane className="w-5 h-5" />
              Nova Grua
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGrua} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Grua *</Label>
                <Input
                  id="name"
                  value={gruaFormData.name}
                  onChange={(e) => setGruaFormData({ ...gruaFormData, name: e.target.value })}
                  placeholder="Ex: Grua 001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  value={gruaFormData.model}
                  onChange={(e) => setGruaFormData({ ...gruaFormData, model: e.target.value })}
                  placeholder="Ex: Liebherr 200HC"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity">Capacidade *</Label>
                <Input
                  id="capacity"
                  value={gruaFormData.capacity}
                  onChange={(e) => setGruaFormData({ ...gruaFormData, capacity: e.target.value })}
                  placeholder="Ex: 200 ton"
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={gruaFormData.status}
                  onValueChange={(value) => setGruaFormData({ ...gruaFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="em_obra">Em Obra</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="inativa">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="obraId">Obra (Opcional)</Label>
              <Select
                value={gruaFormData.obraId || "none"}
                onValueChange={(value) => setGruaFormData({ ...gruaFormData, obraId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma obra (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma obra</SelectItem>
                  {mockObras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Uma grua pode ser criada sem estar atrelada a uma obra
              </p>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={gruaFormData.observacoes}
                onChange={(e) => setGruaFormData({ ...gruaFormData, observacoes: e.target.value })}
                placeholder="Observações sobre a grua..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Grua
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tem certeza que deseja excluir a grua <strong>{gruaToDelete?.name}</strong>?
            </p>
            <p className="text-xs text-red-600">
              ⚠️ Esta ação não pode ser desfeita. A grua será permanentemente removida do sistema.
            </p>
            {gruaToDelete?.status === 'em_obra' && (
              <p className="text-xs text-orange-600">
                ⚠️ Esta grua está atualmente em obra. A exclusão será bloqueada.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteGrua}
              disabled={gruaToDelete?.status === 'em_obra'}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

