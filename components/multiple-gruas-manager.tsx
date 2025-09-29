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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Search, 
  Edit,
  Trash2, 
  Eye,
  Package,
  Settings,
  RefreshCw,
  Filter,
  Calendar,
  DollarSign,
  Building2,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Tipos para múltiplas gruas por obra
interface GruaObra {
  id: string
  obra_id: string
  grua_id: string
  data_inicio: string
  data_fim?: string
  status: 'ativa' | 'concluida' | 'suspensa' | 'cancelada'
  valor_locacao_mensal: number
  observacoes?: string
  created_at: string
  updated_at: string
  gruas?: {
    id: string
    nome: string
    modelo: string
    fabricante: string
    capacidade: string
    status: string
  }
}

interface GruaDisponivel {
  id: string
  nome: string
  modelo: string
  fabricante: string
  capacidade: string
  status: string
  localizacao: string
}

interface MultipleGruasManagerProps {
  obraId: string
  obraNome: string
}

export default function MultipleGruasManager({ obraId, obraNome }: MultipleGruasManagerProps) {
  const { toast } = useToast()
  
  // Estados
  const [gruasObra, setGruasObra] = useState<GruaObra[]>([])
  const [gruasDisponiveis, setGruasDisponiveis] = useState<GruaDisponivel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingGrua, setEditingGrua] = useState<GruaObra | null>(null)

  // Formulário para adicionar grua
  const [gruaForm, setGruaForm] = useState({
    grua_id: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    valor_locacao_mensal: 0,
    observacoes: ''
  })

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [obraId])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento de dados (substituir por chamadas reais da API)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Dados mockados para demonstração
      const mockGruasObra: GruaObra[] = [
        {
          id: '1',
          obra_id: obraId,
          grua_id: '1',
          data_inicio: '2025-01-01',
          data_fim: undefined,
          status: 'ativa',
          valor_locacao_mensal: 25000,
          observacoes: 'Grua principal da obra',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          gruas: {
            id: '1',
            nome: 'Grua STT293',
            modelo: 'Potain MDT 178',
            fabricante: 'Potain',
            capacidade: '8t',
            status: 'Operacional'
          }
        },
        {
          id: '2',
          obra_id: obraId,
          grua_id: '2',
          data_inicio: '2025-01-15',
          data_fim: '2025-02-15',
          status: 'concluida',
          valor_locacao_mensal: 30000,
          observacoes: 'Grua auxiliar temporária',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          gruas: {
            id: '2',
            nome: 'Grua Liebherr',
            modelo: '132 EC-H',
            fabricante: 'Liebherr',
            capacidade: '6t',
            status: 'Disponível'
          }
        }
      ]

      const mockGruasDisponiveis: GruaDisponivel[] = [
        {
          id: '3',
          nome: 'Grua Terex',
          modelo: 'CTT 181-8',
          fabricante: 'Terex',
          capacidade: '10t',
          status: 'Disponível',
          localizacao: 'Depósito Central'
        },
        {
          id: '4',
          nome: 'Grua Favelle',
          modelo: 'M440D',
          fabricante: 'Favelle Favco',
          capacidade: '12t',
          status: 'Disponível',
          localizacao: 'Depósito Central'
        }
      ]

      setGruasObra(mockGruasObra)
      setGruasDisponiveis(mockGruasDisponiveis)
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar gruas da obra",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar gruas
  const filteredGruas = gruasObra.filter(grua => {
    const matchesSearch = grua.gruas?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grua.gruas?.modelo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || grua.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Handlers
  const handleAddGrua = async () => {
    try {
      const novaGrua: GruaObra = {
        id: Date.now().toString(),
        obra_id: obraId,
        grua_id: gruaForm.grua_id,
        data_inicio: gruaForm.data_inicio,
        data_fim: gruaForm.data_fim || undefined,
        status: 'ativa',
        valor_locacao_mensal: gruaForm.valor_locacao_mensal,
        observacoes: gruaForm.observacoes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        gruas: gruasDisponiveis.find(g => g.id === gruaForm.grua_id)
      }

      setGruasObra([...gruasObra, novaGrua])
      setIsAddDialogOpen(false)
      resetForm()

      toast({
        title: "Sucesso",
        description: "Grua adicionada à obra com sucesso"
      })
    } catch (error) {
      console.error('Erro ao adicionar grua:', error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar grua à obra",
        variant: "destructive"
      })
    }
  }

  const handleEditGrua = (grua: GruaObra) => {
    setEditingGrua(grua)
    setGruaForm({
      grua_id: grua.grua_id,
      data_inicio: grua.data_inicio,
      data_fim: grua.data_fim || '',
      valor_locacao_mensal: grua.valor_locacao_mensal,
      observacoes: grua.observacoes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateGrua = async () => {
    try {
      if (!editingGrua) return

      const gruasAtualizadas = gruasObra.map(grua => 
        grua.id === editingGrua.id 
          ? {
              ...grua,
              data_inicio: gruaForm.data_inicio,
              data_fim: gruaForm.data_fim || undefined,
              valor_locacao_mensal: gruaForm.valor_locacao_mensal,
              observacoes: gruaForm.observacoes,
              updated_at: new Date().toISOString()
            }
          : grua
      )

      setGruasObra(gruasAtualizadas)
      setIsEditDialogOpen(false)
      setEditingGrua(null)
      resetForm()

      toast({
        title: "Sucesso",
        description: "Grua atualizada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao atualizar grua:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar grua",
        variant: "destructive"
      })
    }
  }

  const handleRemoveGrua = async (id: string) => {
    try {
      setGruasObra(gruasObra.filter(g => g.id !== id))
      toast({
        title: "Sucesso",
        description: "Grua removida da obra com sucesso"
      })
    } catch (error) {
      console.error('Erro ao remover grua:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover grua da obra",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setGruaForm({
      grua_id: '',
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: '',
      valor_locacao_mensal: 0,
      observacoes: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-500'
      case 'concluida': return 'bg-blue-500'
      case 'suspensa': return 'bg-yellow-500'
      case 'cancelada': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativa': return 'Ativa'
      case 'concluida': return 'Concluída'
      case 'suspensa': return 'Suspensa'
      case 'cancelada': return 'Cancelada'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativa': return <CheckCircle className="w-4 h-4" />
      case 'concluida': return <Clock className="w-4 h-4" />
      case 'suspensa': return <AlertTriangle className="w-4 h-4" />
      case 'cancelada': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando gruas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gruas da Obra
          </h2>
          <p className="text-gray-600">
            {obraNome} - {gruasObra.length} grua(s) vinculada(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Grua
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por nome ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="suspensa">Suspensa</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={carregarDados}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Gruas */}
      <Card>
        <CardHeader>
          <CardTitle>Gruas Vinculadas ({filteredGruas.length})</CardTitle>
          <CardDescription>
            Lista de todas as gruas vinculadas a esta obra
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredGruas.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhuma grua encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grua</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Valor Mensal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGruas.map((grua) => (
                  <TableRow key={grua.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{grua.gruas?.nome}</div>
                          <div className="text-sm text-gray-500">
                            {grua.gruas?.modelo} - {grua.gruas?.fabricante}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm">
                            {new Date(grua.data_inicio).toLocaleDateString('pt-BR')}
                          </div>
                          {grua.data_fim && (
                            <div className="text-sm text-gray-500">
                              até {new Date(grua.data_fim).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        R$ {grua.valor_locacao_mensal.toLocaleString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(grua.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(grua.status)}
                          {getStatusLabel(grua.status)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditGrua(grua)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Grua</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover esta grua da obra? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveGrua(grua.id)}
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Adicionar Grua */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Grua à Obra</DialogTitle>
            <DialogDescription>
              Selecione uma grua disponível para vincular a esta obra
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleAddGrua(); }} className="space-y-4">
            <div>
              <Label htmlFor="grua_id">Grua *</Label>
              <Select 
                value={gruaForm.grua_id} 
                onValueChange={(value) => setGruaForm({ ...gruaForm, grua_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a grua" />
                </SelectTrigger>
                <SelectContent>
                  {gruasDisponiveis.map((grua) => (
                    <SelectItem key={grua.id} value={grua.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{grua.nome}</span>
                        <span className="text-xs text-gray-500">
                          {grua.modelo} - {grua.fabricante} - {grua.capacidade}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_inicio">Data de Início *</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={gruaForm.data_inicio}
                  onChange={(e) => setGruaForm({ ...gruaForm, data_inicio: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="data_fim">Data de Fim (opcional)</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={gruaForm.data_fim}
                  onChange={(e) => setGruaForm({ ...gruaForm, data_fim: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="valor_locacao_mensal">Valor de Locação Mensal (R$) *</Label>
              <Input
                id="valor_locacao_mensal"
                type="number"
                step="0.01"
                min="0"
                value={gruaForm.valor_locacao_mensal}
                onChange={(e) => setGruaForm({ ...gruaForm, valor_locacao_mensal: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                value={gruaForm.observacoes}
                onChange={(e) => setGruaForm({ ...gruaForm, observacoes: e.target.value })}
                placeholder="Observações sobre a grua nesta obra"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Adicionar Grua
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar Grua */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Grua da Obra</DialogTitle>
            <DialogDescription>
              Edite as informações da grua nesta obra
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateGrua(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_data_inicio">Data de Início *</Label>
                <Input
                  id="edit_data_inicio"
                  type="date"
                  value={gruaForm.data_inicio}
                  onChange={(e) => setGruaForm({ ...gruaForm, data_inicio: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_data_fim">Data de Fim (opcional)</Label>
                <Input
                  id="edit_data_fim"
                  type="date"
                  value={gruaForm.data_fim}
                  onChange={(e) => setGruaForm({ ...gruaForm, data_fim: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_valor_locacao_mensal">Valor de Locação Mensal (R$) *</Label>
              <Input
                id="edit_valor_locacao_mensal"
                type="number"
                step="0.01"
                min="0"
                value={gruaForm.valor_locacao_mensal}
                onChange={(e) => setGruaForm({ ...gruaForm, valor_locacao_mensal: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_observacoes">Observações</Label>
              <Input
                id="edit_observacoes"
                value={gruaForm.observacoes}
                onChange={(e) => setGruaForm({ ...gruaForm, observacoes: e.target.value })}
                placeholder="Observações sobre a grua nesta obra"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Atualizar Grua
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
