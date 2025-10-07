"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  DollarSign,
  Users,
  TrendingUp,
  ArrowLeft
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { rhApi, Cargo } from "@/lib/api-rh-completo"

export default function CargosPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Estados
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null)
  const [cargoToDelete, setCargoToDelete] = useState<Cargo | null>(null)
  
  // Formulário
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    nivel: 'Operacional' as 'Operacional' | 'Técnico' | 'Supervisor' | 'Gerencial' | 'Diretoria',
    salario_minimo: '',
    salario_maximo: '',
    requisitos: '',
    competencias: '',
    ativo: true
  })

  // Carregar cargos
  useEffect(() => {
    carregarCargos()
  }, [])

  const carregarCargos = async () => {
    try {
      setLoading(true)
      const response = await rhApi.listarCargos()
      setCargos(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar cargos:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar cargos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar cargos
  const cargosFiltrados = cargos.filter(cargo =>
    cargo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cargo.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handlers
  const handleCreateCargo = async () => {
    try {
      const cargoData = {
        ...formData,
        salario_minimo: formData.salario_minimo ? parseFloat(formData.salario_minimo) : undefined,
        salario_maximo: formData.salario_maximo ? parseFloat(formData.salario_maximo) : undefined,
        requisitos: formData.requisitos ? formData.requisitos.split(',').map(r => r.trim()) : [],
        competencias: formData.competencias ? formData.competencias.split(',').map(c => c.trim()) : []
      }

      const response = await rhApi.criarCargo(cargoData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Cargo criado com sucesso!",
        })
        setIsCreateDialogOpen(false)
        resetForm()
        await carregarCargos()
      }
    } catch (error: any) {
      console.error('Erro ao criar cargo:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar cargo",
        variant: "destructive"
      })
    }
  }

  const handleEditCargo = (cargo: Cargo) => {
    setEditingCargo(cargo)
    setFormData({
      nome: cargo.nome,
      descricao: cargo.descricao || '',
      nivel: cargo.nivel,
      salario_minimo: cargo.salario_minimo?.toString() || '',
      salario_maximo: cargo.salario_maximo?.toString() || '',
      requisitos: cargo.requisitos?.join(', ') || '',
      competencias: cargo.competencias?.join(', ') || '',
      ativo: cargo.ativo
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateCargo = async () => {
    if (!editingCargo) return

    try {
      const cargoData = {
        ...formData,
        salario_minimo: formData.salario_minimo ? parseFloat(formData.salario_minimo) : undefined,
        salario_maximo: formData.salario_maximo ? parseFloat(formData.salario_maximo) : undefined,
        requisitos: formData.requisitos ? formData.requisitos.split(',').map(r => r.trim()) : [],
        competencias: formData.competencias ? formData.competencias.split(',').map(c => c.trim()) : []
      }

      const response = await rhApi.atualizarCargo(editingCargo.id, cargoData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Cargo atualizado com sucesso!",
        })
        setIsEditDialogOpen(false)
        setEditingCargo(null)
        resetForm()
        await carregarCargos()
      }
    } catch (error: any) {
      console.error('Erro ao atualizar cargo:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar cargo",
        variant: "destructive"
      })
    }
  }

  const handleDeleteCargo = async () => {
    if (!cargoToDelete) return

    try {
      const response = await rhApi.excluirCargo(cargoToDelete.id)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Cargo excluído com sucesso!",
        })
        setCargoToDelete(null)
        await carregarCargos()
      }
    } catch (error: any) {
      console.error('Erro ao excluir cargo:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir cargo",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      nivel: 'Operacional',
      salario_minimo: '',
      salario_maximo: '',
      requisitos: '',
      competencias: '',
      ativo: true
    })
  }

  const getNivelColor = (nivel: string) => {
    const colors = {
      'Operacional': 'bg-blue-100 text-blue-800',
      'Técnico': 'bg-green-100 text-green-800',
      'Supervisor': 'bg-yellow-100 text-yellow-800',
      'Gerencial': 'bg-purple-100 text-purple-800',
      'Diretoria': 'bg-red-100 text-red-800'
    }
    return colors[nivel as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando cargos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Cargos</h1>
            <p className="text-gray-600">Gerencie cargos, níveis hierárquicos e faixas salariais</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cargo
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Nome ou descrição do cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cargos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cargosFiltrados.map((cargo) => (
          <Card key={cargo.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{cargo.nome}</CardTitle>
                  <CardDescription>{cargo.descricao}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditCargo(cargo)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setCargoToDelete(cargo)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Cargo</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o cargo "{cargo.nome}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteCargo}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={getNivelColor(cargo.nivel)}>
                  {cargo.nivel}
                </Badge>
                <Badge variant={cargo.ativo ? "default" : "secondary"}>
                  {cargo.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              {cargo.salario_minimo && cargo.salario_maximo && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    R$ {cargo.salario_minimo.toLocaleString('pt-BR')} - R$ {cargo.salario_maximo.toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              {cargo.requisitos && cargo.requisitos.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Requisitos:</h4>
                  <div className="flex flex-wrap gap-1">
                    {cargo.requisitos.slice(0, 3).map((req, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                    {cargo.requisitos.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{cargo.requisitos.length - 3} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {cargo.competencias && cargo.competencias.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Competências:</h4>
                  <div className="flex flex-wrap gap-1">
                    {cargo.competencias.slice(0, 3).map((comp, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {comp}
                      </Badge>
                    ))}
                    {cargo.competencias.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{cargo.competencias.length - 3} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {cargosFiltrados.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhum cargo encontrado</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Criação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cargo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome do Cargo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nivel">Nível Hierárquico</Label>
                <Select 
                  value={formData.nivel} 
                  onValueChange={(value) => setFormData({ ...formData, nivel: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operacional">Operacional</SelectItem>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Gerencial">Gerencial</SelectItem>
                    <SelectItem value="Diretoria">Diretoria</SelectItem>
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
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salario_minimo">Salário Mínimo (R$)</Label>
                <Input
                  id="salario_minimo"
                  type="number"
                  step="0.01"
                  value={formData.salario_minimo}
                  onChange={(e) => setFormData({ ...formData, salario_minimo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="salario_maximo">Salário Máximo (R$)</Label>
                <Input
                  id="salario_maximo"
                  type="number"
                  step="0.01"
                  value={formData.salario_maximo}
                  onChange={(e) => setFormData({ ...formData, salario_maximo: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="requisitos">Requisitos (separados por vírgula)</Label>
              <Input
                id="requisitos"
                value={formData.requisitos}
                onChange={(e) => setFormData({ ...formData, requisitos: e.target.value })}
                placeholder="Ex: Ensino médio, Experiência em..."
              />
            </div>

            <div>
              <Label htmlFor="competencias">Competências (separadas por vírgula)</Label>
              <Input
                id="competencias"
                value={formData.competencias}
                onChange={(e) => setFormData({ ...formData, competencias: e.target.value })}
                placeholder="Ex: Liderança, Trabalho em equipe..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCargo}>
                Criar Cargo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cargo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_nome">Nome do Cargo *</Label>
                <Input
                  id="edit_nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_nivel">Nível Hierárquico</Label>
                <Select 
                  value={formData.nivel} 
                  onValueChange={(value) => setFormData({ ...formData, nivel: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operacional">Operacional</SelectItem>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Gerencial">Gerencial</SelectItem>
                    <SelectItem value="Diretoria">Diretoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit_descricao">Descrição</Label>
              <Textarea
                id="edit_descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_salario_minimo">Salário Mínimo (R$)</Label>
                <Input
                  id="edit_salario_minimo"
                  type="number"
                  step="0.01"
                  value={formData.salario_minimo}
                  onChange={(e) => setFormData({ ...formData, salario_minimo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_salario_maximo">Salário Máximo (R$)</Label>
                <Input
                  id="edit_salario_maximo"
                  type="number"
                  step="0.01"
                  value={formData.salario_maximo}
                  onChange={(e) => setFormData({ ...formData, salario_maximo: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_requisitos">Requisitos (separados por vírgula)</Label>
              <Input
                id="edit_requisitos"
                value={formData.requisitos}
                onChange={(e) => setFormData({ ...formData, requisitos: e.target.value })}
                placeholder="Ex: Ensino médio, Experiência em..."
              />
            </div>

            <div>
              <Label htmlFor="edit_competencias">Competências (separadas por vírgula)</Label>
              <Input
                id="edit_competencias"
                value={formData.competencias}
                onChange={(e) => setFormData({ ...formData, competencias: e.target.value })}
                placeholder="Ex: Liderança, Trabalho em equipe..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateCargo}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
