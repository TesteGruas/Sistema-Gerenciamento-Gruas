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
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  FileText,
  Building2,
  Wrench,
  Loader2,
  ConeIcon as Crane,
  Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getChecklists,
  getChecklistById,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  finalizarChecklist,
  addItemChecklist,
  updateItemChecklist,
  type ChecklistDevolucao,
  type ChecklistDevolucaoItem
} from "@/lib/api-checklist-devolucao"
import { getGruas, type Grua } from "@/lib/api-gruas"
import { getObras, type Obra } from "@/lib/api-obras"

export default function ChecklistDevolucaoPage() {
  const { toast } = useToast()
  
  // Estados
  const [checklists, setChecklists] = useState<ChecklistDevolucao[]>([])
  const [gruas, setGruas] = useState<Grua[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterObra, setFilterObra] = useState("all")
  const [filterGrua, setFilterGrua] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistDevolucao | null>(null)
  const [checklistToDelete, setChecklistToDelete] = useState<ChecklistDevolucao | null>(null)

  // Formulário de checklist
  const [checklistForm, setChecklistForm] = useState({
    obra_id: '',
    grua_id: '',
    data_devolucao: new Date().toISOString().split('T')[0],
    responsavel_entrega: '',
    responsavel_recebimento: '',
    observacoes_gerais: ''
  })

  // Formulário de item
  const [itemForm, setItemForm] = useState({
    peca_nome: '',
    peca_tipo: '',
    quantidade_enviada: 1,
    quantidade_devolvida: 0,
    condicao: 'ok' as 'ok' | 'danificado' | 'necessita_reparo' | 'perda_total',
    custo_reparo: 0,
    descricao_dano: '',
    observacoes: ''
  })

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [filterObra, filterGrua, filterStatus])

  const carregarDados = async () => {
    setIsLoading(true)
    try {
      const filtros: any = {}
      if (filterObra !== 'all') filtros.obra_id = parseInt(filterObra)
      if (filterGrua !== 'all') filtros.grua_id = filterGrua
      if (filterStatus !== 'all') filtros.status = filterStatus

      const [checklistsData, gruasData, obrasData] = await Promise.all([
        getChecklists(filtros),
        getGruas(),
        getObras()
      ])

      setChecklists(checklistsData)
      setGruas(gruasData)
      setObras(obrasData)
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

  const filteredChecklists = checklists.filter(checklist => {
    const matchesSearch = 
      checklist.numero_checklist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.grua_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.obra_nome?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalizado': return 'bg-green-100 text-green-800'
      case 'em_andamento': return 'bg-blue-100 text-blue-800'
      case 'cancelado': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCondicaoColor = (condicao: string) => {
    switch (condicao) {
      case 'ok': return 'bg-green-100 text-green-800'
      case 'danificado': return 'bg-yellow-100 text-yellow-800'
      case 'necessita_reparo': return 'bg-orange-100 text-orange-800'
      case 'perda_total': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!checklistForm.obra_id || !checklistForm.grua_id) {
      toast({
        title: "Erro",
        description: "Selecione uma obra e uma grua",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createChecklist({
        obra_id: parseInt(checklistForm.obra_id),
        grua_id: checklistForm.grua_id,
        data_devolucao: checklistForm.data_devolucao,
        responsavel_entrega: checklistForm.responsavel_entrega || undefined,
        responsavel_recebimento: checklistForm.responsavel_recebimento || undefined,
        observacoes_gerais: checklistForm.observacoes_gerais || undefined
      })

      await carregarDados()
      setIsCreateDialogOpen(false)
      resetChecklistForm()

      toast({
        title: "Sucesso",
        description: "Checklist criado com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao criar checklist:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar checklist",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewChecklist = async (checklist: ChecklistDevolucao) => {
    setIsLoading(true)
    try {
      const checklistCompleto = await getChecklistById(checklist.id)
      setSelectedChecklist(checklistCompleto)
      setIsViewDialogOpen(true)
    } catch (error) {
      console.error('Erro ao carregar checklist:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar checklist",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedChecklist) return

    setIsSubmitting(true)
    try {
      await addItemChecklist(selectedChecklist.id, {
        peca_nome: itemForm.peca_nome,
        peca_tipo: itemForm.peca_tipo || undefined,
        quantidade_enviada: itemForm.quantidade_enviada,
        quantidade_devolvida: itemForm.quantidade_devolvida,
        condicao: itemForm.condicao,
        custo_reparo: itemForm.custo_reparo,
        descricao_dano: itemForm.descricao_dano || undefined,
        observacoes: itemForm.observacoes || undefined
      })

      // Recarregar checklist
      const checklistAtualizado = await getChecklistById(selectedChecklist.id)
      setSelectedChecklist(checklistAtualizado)
      setIsAddItemDialogOpen(false)
      resetItemForm()

      toast({
        title: "Sucesso",
        description: "Item adicionado com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao adicionar item:', error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar item",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinalizarChecklist = async (id: number) => {
    setIsSubmitting(true)
    try {
      await finalizarChecklist(id)
      await carregarDados()
      
      if (selectedChecklist?.id === id) {
        const checklistAtualizado = await getChecklistById(id)
        setSelectedChecklist(checklistAtualizado)
      }

      toast({
        title: "Sucesso",
        description: "Checklist finalizado com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao finalizar checklist:', error)
      toast({
        title: "Erro",
        description: "Erro ao finalizar checklist",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteChecklist = (checklist: ChecklistDevolucao) => {
    setChecklistToDelete(checklist)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!checklistToDelete) return

    setIsSubmitting(true)
    try {
      await deleteChecklist(checklistToDelete.id)
      await carregarDados()
      setIsDeleteDialogOpen(false)
      setChecklistToDelete(null)

      toast({
        title: "Sucesso",
        description: "Checklist deletado com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao deletar checklist:', error)
      toast({
        title: "Erro",
        description: "Erro ao deletar checklist",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetChecklistForm = () => {
    setChecklistForm({
      obra_id: '',
      grua_id: '',
      data_devolucao: new Date().toISOString().split('T')[0],
      responsavel_entrega: '',
      responsavel_recebimento: '',
      observacoes_gerais: ''
    })
  }

  const resetItemForm = () => {
    setItemForm({
      peca_nome: '',
      peca_tipo: '',
      quantidade_enviada: 1,
      quantidade_devolvida: 0,
      condicao: 'ok',
      custo_reparo: 0,
      descricao_dano: '',
      observacoes: ''
    })
  }

  if (isLoading && checklists.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Checklist de Devolução</h1>
          <p className="text-gray-600">Gerenciamento de devolução de peças e componentes</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Checklist
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Número, grua ou obra..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Obra</Label>
              <Select value={filterObra} onValueChange={setFilterObra}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {obras.map(obra => (
                    <SelectItem key={obra.id} value={String(obra.id)}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Grua</Label>
              <Select value={filterGrua} onValueChange={setFilterGrua}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as gruas</SelectItem>
                  {gruas.map(grua => (
                    <SelectItem key={grua.id} value={grua.id}>
                      {grua.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Checklists */}
      <Card>
        <CardHeader>
          <CardTitle>Checklists de Devolução</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Grua</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Faltantes</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChecklists.map(checklist => (
                <TableRow key={checklist.id}>
                  <TableCell className="font-medium">{checklist.numero_checklist}</TableCell>
                  <TableCell>{checklist.grua_nome}</TableCell>
                  <TableCell>{checklist.obra_nome}</TableCell>
                  <TableCell>{new Date(checklist.data_devolucao).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(checklist.status)}>
                      {checklist.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{checklist.total_itens || 0}</TableCell>
                  <TableCell>
                    {Number(checklist.total_faltantes || 0) > 0 ? (
                      <Badge variant="destructive">{checklist.total_faltantes}</Badge>
                    ) : (
                      <Badge variant="secondary">0</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewChecklist(checklist)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChecklist(checklist)}
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

          {filteredChecklists.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum checklist encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar Checklist */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Checklist de Devolução</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateChecklist} className="space-y-4">
            <div>
              <Label>Obra *</Label>
              <Select
                value={checklistForm.obra_id}
                onValueChange={(value) => setChecklistForm({ ...checklistForm, obra_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma obra" />
                </SelectTrigger>
                <SelectContent>
                  {obras.map(obra => (
                    <SelectItem key={obra.id} value={String(obra.id)}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Grua *</Label>
              <Select
                value={checklistForm.grua_id}
                onValueChange={(value) => setChecklistForm({ ...checklistForm, grua_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma grua" />
                </SelectTrigger>
                <SelectContent>
                  {gruas.map(grua => (
                    <SelectItem key={grua.id} value={grua.id}>
                      {grua.name} - {grua.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data de Devolução *</Label>
              <Input
                type="date"
                value={checklistForm.data_devolucao}
                onChange={(e) => setChecklistForm({ ...checklistForm, data_devolucao: e.target.value })}
              />
            </div>

            <div>
              <Label>Responsável pela Entrega</Label>
              <Input
                value={checklistForm.responsavel_entrega}
                onChange={(e) => setChecklistForm({ ...checklistForm, responsavel_entrega: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>

            <div>
              <Label>Responsável pelo Recebimento</Label>
              <Input
                value={checklistForm.responsavel_recebimento}
                onChange={(e) => setChecklistForm({ ...checklistForm, responsavel_recebimento: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>

            <div>
              <Label>Observações Gerais</Label>
              <Textarea
                value={checklistForm.observacoes_gerais}
                onChange={(e) => setChecklistForm({ ...checklistForm, observacoes_gerais: e.target.value })}
                placeholder="Observações..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Checklist
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualizar Checklist */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Checklist {selectedChecklist?.numero_checklist}
            </DialogTitle>
            <DialogDescription>
              Grua: {selectedChecklist?.grua_nome} | Obra: {selectedChecklist?.obra_nome}
            </DialogDescription>
          </DialogHeader>

          {selectedChecklist && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge className={getStatusColor(selectedChecklist.status)}>
                  {selectedChecklist.status.replace('_', ' ')}
                </Badge>
                {selectedChecklist.status === 'em_andamento' && (
                  <Button
                    onClick={() => handleFinalizarChecklist(selectedChecklist.id)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalizar Checklist
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Data de Devolução:</span>
                  <p className="font-medium">{new Date(selectedChecklist.data_devolucao).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total de Itens:</span>
                  <p className="font-medium">{selectedChecklist.itens?.length || 0}</p>
                </div>
                <div>
                  <span className="text-gray-600">Responsável Entrega:</span>
                  <p className="font-medium">{selectedChecklist.responsavel_entrega || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Responsável Recebimento:</span>
                  <p className="font-medium">{selectedChecklist.responsavel_recebimento || '-'}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Itens do Checklist</h3>
                  {selectedChecklist.status === 'em_andamento' && (
                    <Button
                      size="sm"
                      onClick={() => setIsAddItemDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Item
                    </Button>
                  )}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Peça</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Enviada</TableHead>
                      <TableHead className="text-right">Devolvida</TableHead>
                      <TableHead className="text-right">Faltante</TableHead>
                      <TableHead>Condição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedChecklist.itens?.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.peca_nome}</TableCell>
                        <TableCell>{item.peca_tipo}</TableCell>
                        <TableCell className="text-right">{item.quantidade_enviada}</TableCell>
                        <TableCell className="text-right">{item.quantidade_devolvida}</TableCell>
                        <TableCell className="text-right">
                          {item.quantidade_faltante > 0 ? (
                            <Badge variant="destructive">{item.quantidade_faltante}</Badge>
                          ) : (
                            <span className="text-green-600">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getCondicaoColor(item.condicao)}>
                            {item.condicao.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {(!selectedChecklist.itens || selectedChecklist.itens.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum item adicionado ainda</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Item */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Item ao Checklist</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <Label>Nome da Peça *</Label>
              <Input
                value={itemForm.peca_nome}
                onChange={(e) => setItemForm({ ...itemForm, peca_nome: e.target.value })}
                placeholder="Ex: Módulo de Torre 3m"
                required
              />
            </div>

            <div>
              <Label>Tipo da Peça</Label>
              <Input
                value={itemForm.peca_tipo}
                onChange={(e) => setItemForm({ ...itemForm, peca_tipo: e.target.value })}
                placeholder="Ex: Estrutural"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantidade Enviada *</Label>
                <Input
                  type="number"
                  min="1"
                  value={itemForm.quantidade_enviada}
                  onChange={(e) => setItemForm({ ...itemForm, quantidade_enviada: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div>
                <Label>Quantidade Devolvida</Label>
                <Input
                  type="number"
                  min="0"
                  value={itemForm.quantidade_devolvida}
                  onChange={(e) => setItemForm({ ...itemForm, quantidade_devolvida: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>Condição</Label>
              <Select
                value={itemForm.condicao}
                onValueChange={(value: any) => setItemForm({ ...itemForm, condicao: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ok">OK</SelectItem>
                  <SelectItem value="danificado">Danificado</SelectItem>
                  <SelectItem value="necessita_reparo">Necessita Reparo</SelectItem>
                  <SelectItem value="perda_total">Perda Total</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {itemForm.condicao !== 'ok' && (
              <>
                <div>
                  <Label>Custo de Reparo</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemForm.custo_reparo}
                    onChange={(e) => setItemForm({ ...itemForm, custo_reparo: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>Descrição do Dano</Label>
                  <Textarea
                    value={itemForm.descricao_dano}
                    onChange={(e) => setItemForm({ ...itemForm, descricao_dano: e.target.value })}
                    placeholder="Descreva o dano..."
                    rows={3}
                  />
                </div>
              </>
            )}

            <div>
              <Label>Observações</Label>
              <Textarea
                value={itemForm.observacoes}
                onChange={(e) => setItemForm({ ...itemForm, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddItemDialogOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Adicionar Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Deletar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o checklist <strong>{checklistToDelete?.numero_checklist}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
