"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Search, 
  Edit,
  Trash2, 
  Eye,
  Settings,
  Calendar,
  DollarSign,
  ConeIcon as Crane,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  obraGruasApi, 
  type ObraGruaConfiguracao,
  type ObraGruaConfiguracaoInput 
} from "@/lib/api-obra-gruas"
import { getGruas, type Grua } from "@/lib/api-gruas"
import GruaComplementosManager from "@/components/grua-complementos-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MultipleGruasManagerProps {
  obraId: number
  obraNome: string
}

export default function MultipleGruasManager({ obraId, obraNome }: MultipleGruasManagerProps) {
  const { toast } = useToast()
  
  // Estados
  const [gruasObra, setGruasObra] = useState<ObraGruaConfiguracao[]>([])
  const [gruasDisponiveis, setGruasDisponiveis] = useState<Grua[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingGrua, setEditingGrua] = useState<ObraGruaConfiguracao | null>(null)
  const [gruaToDelete, setGruaToDelete] = useState<ObraGruaConfiguracao | null>(null)

  // Formulário para adicionar/editar grua
  const [gruaForm, setGruaForm] = useState({
    grua_id: '',
    data_instalacao: new Date().toISOString().split('T')[0],
    data_remocao: '',
    posicao_x: 0,
    posicao_y: 0,
    posicao_z: 0,
    angulo_rotacao: 0,
    alcance_operacao: 0,
    observacoes: ''
  })

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [obraId])

  const carregarDados = async () => {
    setIsLoading(true)
    try {
      const [gruasObraResponse, todasGruas] = await Promise.all([
        obraGruasApi.listarGruasObra(obraId),
        getGruas()
      ])

      setGruasObra(gruasObraResponse.data || [])
      
      // Filtrar gruas disponíveis (que não estão na obra)
      const gruasNaObra = (gruasObraResponse.data || []).map(go => go.grua_id)
      const disponiveis = todasGruas.filter(g => !gruasNaObra.includes(g.id) && g.status !== 'Vendida')
      setGruasDisponiveis(disponiveis)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredGruasObra = gruasObra.filter(gruaObra => {
    const matchesSearch = 
      gruaObra.grua?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gruaObra.grua?.modelo?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || gruaObra.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-100 text-green-800'
      case 'inativa': return 'bg-gray-100 text-gray-800'
      case 'manutencao': return 'bg-yellow-100 text-yellow-800'
      case 'removida': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativa': return <CheckCircle className="w-4 h-4" />
      case 'inativa': return <Clock className="w-4 h-4" />
      case 'manutencao': return <AlertTriangle className="w-4 h-4" />
      case 'removida': return <Trash2 className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const handleAddGrua = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!gruaForm.grua_id) {
      toast({
        title: "Erro",
        description: "Selecione uma grua",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const dados: ObraGruaConfiguracaoInput = {
        obra_id: obraId,
        grua_id: gruaForm.grua_id,
        data_instalacao: gruaForm.data_instalacao || undefined,
        posicao_x: gruaForm.posicao_x || undefined,
        posicao_y: gruaForm.posicao_y || undefined,
        posicao_z: gruaForm.posicao_z || undefined,
        angulo_rotacao: gruaForm.angulo_rotacao || undefined,
        alcance_operacao: gruaForm.alcance_operacao || undefined,
        observacoes: gruaForm.observacoes || undefined
      }

      await obraGruasApi.adicionarGruaObra(dados)
      await carregarDados()
      setIsAddDialogOpen(false)
      resetForm()

      toast({
        title: "Sucesso",
        description: "Grua adicionada à obra com sucesso!"
      })
    } catch (error: any) {
      console.error('Erro ao adicionar grua:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao adicionar grua",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditGrua = (grua: ObraGruaConfiguracao) => {
    setEditingGrua(grua)
    setGruaForm({
      grua_id: grua.grua_id,
      data_instalacao: grua.data_instalacao ? new Date(grua.data_instalacao).toISOString().split('T')[0] : '',
      data_remocao: grua.data_remocao ? new Date(grua.data_remocao).toISOString().split('T')[0] : '',
      posicao_x: grua.posicao_x || 0,
      posicao_y: grua.posicao_y || 0,
      posicao_z: grua.posicao_z || 0,
      angulo_rotacao: grua.angulo_rotacao || 0,
      alcance_operacao: grua.alcance_operacao || 0,
      observacoes: grua.observacoes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateGrua = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingGrua) return

    setIsSubmitting(true)
    try {
      const dados: Partial<ObraGruaConfiguracaoInput> = {
        posicao_x: gruaForm.posicao_x || undefined,
        posicao_y: gruaForm.posicao_y || undefined,
        posicao_z: gruaForm.posicao_z || undefined,
        angulo_rotacao: gruaForm.angulo_rotacao || undefined,
        alcance_operacao: gruaForm.alcance_operacao || undefined,
        observacoes: gruaForm.observacoes || undefined
      }

      await obraGruasApi.atualizarConfiguracao(editingGrua.id, dados)
      await carregarDados()
      setIsEditDialogOpen(false)
      setEditingGrua(null)
      resetForm()

      toast({
        title: "Sucesso",
        description: "Configuração atualizada com sucesso!"
      })
    } catch (error: any) {
      console.error('Erro ao atualizar configuração:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao atualizar configuração",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteGrua = (grua: ObraGruaConfiguracao) => {
    setGruaToDelete(grua)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!gruaToDelete) return

    setIsSubmitting(true)
    try {
      await obraGruasApi.removerGruaObra(gruaToDelete.id)
      await carregarDados()
      setIsDeleteDialogOpen(false)
      setGruaToDelete(null)

      toast({
        title: "Sucesso",
        description: "Grua removida da obra com sucesso!"
      })
    } catch (error: any) {
      console.error('Erro ao remover grua:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao remover grua",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setGruaForm({
      grua_id: '',
      data_instalacao: new Date().toISOString().split('T')[0],
      data_remocao: '',
      posicao_x: 0,
      posicao_y: 0,
      posicao_z: 0,
      angulo_rotacao: 0,
      alcance_operacao: 0,
      observacoes: ''
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Múltiplas Gruas em Obra</h2>
          <p className="text-gray-600">Obra: {obraNome}</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Grua
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Nome ou modelo da grua..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="removida">Removida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Gruas */}
      <Card>
        <CardHeader>
          <CardTitle>Gruas na Obra ({filteredGruasObra.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grua</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead>Data Instalação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGruasObra.map(gruaObra => (
                <TableRow key={gruaObra.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Crane className="w-4 h-4 text-blue-600" />
                      {gruaObra.grua?.name || gruaObra.grua_id}
                    </div>
                  </TableCell>
                  <TableCell>{gruaObra.grua?.modelo || '-'}</TableCell>
                  <TableCell>{gruaObra.grua?.capacidade || '-'}</TableCell>
                  <TableCell>
                    {gruaObra.data_instalacao 
                      ? new Date(gruaObra.data_instalacao).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(gruaObra.status)}>
                      {getStatusIcon(gruaObra.status)}
                      <span className="ml-1 capitalize">{gruaObra.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditGrua(gruaObra)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGrua(gruaObra)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredGruasObra.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Crane className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma grua encontrada nesta obra</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Adicionar Grua */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Grua à Obra</DialogTitle>
            <DialogDescription>
              Adicione uma nova grua a {obraNome}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="configuracao" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="configuracao">Configuração</TabsTrigger>
              <TabsTrigger value="complementos">Complementos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="configuracao" className="space-y-4">
              <form onSubmit={handleAddGrua} className="space-y-4">
            <div>
              <Label>Grua *</Label>
              <Select
                value={gruaForm.grua_id}
                onValueChange={(value) => setGruaForm({ ...gruaForm, grua_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma grua" />
                </SelectTrigger>
                <SelectContent>
                  {gruasDisponiveis.map(grua => (
                    <SelectItem key={grua.id} value={grua.id}>
                      {grua.name} - {grua.modelo} ({grua.capacidade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data de Instalação</Label>
              <Input
                type="date"
                value={gruaForm.data_instalacao}
                onChange={(e) => setGruaForm({ ...gruaForm, data_instalacao: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Posição X</Label>
                <Input
                  type="number"
                  value={gruaForm.posicao_x}
                  onChange={(e) => setGruaForm({ ...gruaForm, posicao_x: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Posição Y</Label>
                <Input
                  type="number"
                  value={gruaForm.posicao_y}
                  onChange={(e) => setGruaForm({ ...gruaForm, posicao_y: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Posição Z</Label>
                <Input
                  type="number"
                  value={gruaForm.posicao_z}
                  onChange={(e) => setGruaForm({ ...gruaForm, posicao_z: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ângulo de Rotação (°)</Label>
                <Input
                  type="number"
                  value={gruaForm.angulo_rotacao}
                  onChange={(e) => setGruaForm({ ...gruaForm, angulo_rotacao: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Alcance de Operação (m)</Label>
                <Input
                  type="number"
                  value={gruaForm.alcance_operacao}
                  onChange={(e) => setGruaForm({ ...gruaForm, alcance_operacao: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={gruaForm.observacoes}
                onChange={(e) => setGruaForm({ ...gruaForm, observacoes: e.target.value })}
                placeholder="Observações sobre a instalação..."
                rows={3}
              />
            </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Adicionar
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="complementos" className="space-y-4">
              <GruaComplementosManager
                obraId={obraId}
                gruaId={gruaForm.grua_id}
                dataInicioLocacao={gruaForm.data_instalacao}
                mesesLocacao={12}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Grua */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Configuração da Grua</DialogTitle>
            <DialogDescription>
              {editingGrua?.grua?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="configuracao" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="configuracao">Configuração</TabsTrigger>
              <TabsTrigger value="complementos">Complementos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="configuracao" className="space-y-4">
              <form onSubmit={handleUpdateGrua} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Posição X</Label>
                <Input
                  type="number"
                  value={gruaForm.posicao_x}
                  onChange={(e) => setGruaForm({ ...gruaForm, posicao_x: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Posição Y</Label>
                <Input
                  type="number"
                  value={gruaForm.posicao_y}
                  onChange={(e) => setGruaForm({ ...gruaForm, posicao_y: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Posição Z</Label>
                <Input
                  type="number"
                  value={gruaForm.posicao_z}
                  onChange={(e) => setGruaForm({ ...gruaForm, posicao_z: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ângulo de Rotação (°)</Label>
                <Input
                  type="number"
                  value={gruaForm.angulo_rotacao}
                  onChange={(e) => setGruaForm({ ...gruaForm, angulo_rotacao: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Alcance de Operação (m)</Label>
                <Input
                  type="number"
                  value={gruaForm.alcance_operacao}
                  onChange={(e) => setGruaForm({ ...gruaForm, alcance_operacao: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={gruaForm.observacoes}
                onChange={(e) => setGruaForm({ ...gruaForm, observacoes: e.target.value })}
                placeholder="Observações sobre a configuração..."
                rows={3}
              />
            </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Atualizar
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="complementos" className="space-y-4">
              {editingGrua && (
                <GruaComplementosManager
                  gruaObraId={editingGrua.id.toString()}
                  obraId={obraId}
                  gruaId={editingGrua.grua_id}
                  dataInicioLocacao={editingGrua.data_instalacao}
                  mesesLocacao={12}
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog Deletar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Remoção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover a grua <strong>{gruaToDelete?.grua?.name}</strong> desta obra?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
