"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { 
  ArrowLeft,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  FileText,
  Settings,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { checklistDiarioApi, type ChecklistModeloBackend, type ChecklistDiarioBackend } from "@/lib/api-checklist-diario"
import { CardLoader } from "@/components/ui/loader"
import { ChecklistModeloForm } from "@/components/checklist-modelo-form"
import { ChecklistDiarioForm } from "@/components/checklist-diario-form"
import { NaoConformidadePlanoAcao } from "@/components/nc-plano-acao"

export default function ChecklistDiarioObraPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const obraId = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [modelos, setModelos] = useState<ChecklistModeloBackend[]>([])
  const [checklists, setChecklists] = useState<ChecklistDiarioBackend[]>([])
  const [selectedModelo, setSelectedModelo] = useState<ChecklistModeloBackend | null>(null)
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistDiarioBackend | null>(null)
  const [showModeloDialog, setShowModeloDialog] = useState(false)
  const [showChecklistDialog, setShowChecklistDialog] = useState(false)
  const [showNCDialog, setShowNCDialog] = useState(false)
  const [selectedNC, setSelectedNC] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("checklists")

  useEffect(() => {
    if (obraId) {
      loadData()
    }
  }, [obraId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [modelosRes, checklistsRes] = await Promise.all([
        checklistDiarioApi.modelos.listar(obraId),
        checklistDiarioApi.checklists.listar(obraId)
      ])

      if (modelosRes.success) {
        setModelos(modelosRes.data || [])
      }

      if (checklistsRes.success) {
        setChecklists(checklistsRes.data || [])
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar dados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateModelo = () => {
    setSelectedModelo(null)
    setShowModeloDialog(true)
  }

  const handleEditModelo = (modelo: ChecklistModeloBackend) => {
    setSelectedModelo(modelo)
    setShowModeloDialog(true)
  }

  const handleSaveModelo = async () => {
    setShowModeloDialog(false)
    await loadData()
  }

  const handleCreateChecklist = () => {
    if (modelos.length === 0) {
      toast({
        title: "Atenção",
        description: "É necessário criar um modelo de checklist primeiro",
        variant: "destructive"
      })
      return
    }
    setSelectedChecklist(null)
    setShowChecklistDialog(true)
  }

  const handleViewChecklist = async (checklist: ChecklistDiarioBackend) => {
    try {
      const response = await checklistDiarioApi.checklists.obterDetalhes(checklist.id)
      if (response.success) {
        setSelectedChecklist(response.data)
        setShowChecklistDialog(true)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar checklist",
        variant: "destructive"
      })
    }
  }

  const handleSaveChecklist = async () => {
    setShowChecklistDialog(false)
    await loadData()
  }

  const handleViewNC = async (nc: any) => {
    setSelectedNC(nc)
    setShowNCDialog(true)
  }

  const handleSaveNC = async () => {
    setShowNCDialog(false)
    await loadData()
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente", variant: "outline" },
      concluido: { label: "Concluído", variant: "default" },
      em_andamento: { label: "Em Andamento", variant: "secondary" }
    }
    const statusInfo = statusMap[status] || { label: status, variant: "outline" }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (loading) {
    return <CardLoader text="Carregando checklists..." />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Checklist Diário</h1>
            <p className="text-muted-foreground">Gerencie modelos e checklists diários da obra</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="checklists">
            <FileText className="w-4 h-4 mr-2" />
            Checklists
          </TabsTrigger>
          <TabsTrigger value="modelos">
            <Settings className="w-4 h-4 mr-2" />
            Modelos
          </TabsTrigger>
          <TabsTrigger value="nc">
            <AlertCircle className="w-4 h-4 mr-2" />
            Não Conformidades
          </TabsTrigger>
        </TabsList>

        {/* Tab: Checklists */}
        <TabsContent value="checklists" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Checklists Diários</CardTitle>
                  <CardDescription>Lista de checklists preenchidos</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={loadData}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button onClick={handleCreateChecklist}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Checklist
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {checklists.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum checklist encontrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checklists.map((checklist) => (
                      <TableRow key={checklist.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(checklist.data).toLocaleDateString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {checklist.checklists_modelos?.nome || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {checklist.funcionarios?.nome || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(checklist.status)}
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Modelos */}
        <TabsContent value="modelos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Modelos de Checklist</CardTitle>
                  <CardDescription>Configure modelos customizáveis para checklists diários</CardDescription>
                </div>
                <Button onClick={handleCreateModelo}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Modelo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {modelos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum modelo encontrado. Crie um modelo para começar.
                </div>
              ) : (
                <div className="grid gap-4">
                  {modelos.map((modelo) => (
                    <Card key={modelo.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{modelo.nome}</CardTitle>
                            {modelo.descricao && (
                              <CardDescription>{modelo.descricao}</CardDescription>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={modelo.ativo ? "default" : "secondary"}>
                              {modelo.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditModelo(modelo)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {modelo.itens && modelo.itens.length > 0 && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {modelo.itens.length} item(ns) configurado(s)
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Não Conformidades */}
        <TabsContent value="nc" className="space-y-4">
          <NaoConformidadesList obraId={obraId} onViewNC={handleViewNC} />
        </TabsContent>
      </Tabs>

      {/* Dialog: Modelo */}
      <Dialog open={showModeloDialog} onOpenChange={setShowModeloDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedModelo ? "Editar Modelo" : "Novo Modelo"}
            </DialogTitle>
            <DialogDescription>
              Configure os itens do modelo de checklist
            </DialogDescription>
          </DialogHeader>
          <ChecklistModeloForm
            obraId={obraId}
            modelo={selectedModelo || undefined}
            onSave={handleSaveModelo}
            onCancel={() => setShowModeloDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Checklist */}
      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedChecklist ? "Visualizar Checklist" : "Novo Checklist"}
            </DialogTitle>
            <DialogDescription>
              {selectedChecklist ? "Detalhes do checklist" : "Preencha o checklist diário"}
            </DialogDescription>
          </DialogHeader>
          <ChecklistDiarioForm
            obraId={obraId}
            modelos={modelos}
            checklist={selectedChecklist || undefined}
            onSave={handleSaveChecklist}
            onCancel={() => setShowChecklistDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Não Conformidade */}
      <Dialog open={showNCDialog} onOpenChange={setShowNCDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Plano de Ação - Não Conformidade</DialogTitle>
            <DialogDescription>
              Gerencie o plano de ação para a não conformidade
            </DialogDescription>
          </DialogHeader>
          {selectedNC && (
            <NaoConformidadePlanoAcao
              naoConformidade={selectedNC}
              onSave={handleSaveNC}
              onCancel={() => setShowNCDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente para listar não conformidades
function NaoConformidadesList({ obraId, onViewNC }: { obraId: number; onViewNC: (nc: any) => void }) {
  const [loading, setLoading] = useState(true)
  const [ncs, setNcs] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadNCs()
  }, [obraId])

  const loadNCs = async () => {
    setLoading(true)
    try {
      const response = await checklistDiarioApi.naoConformidades.listar(obraId)
      if (response.success) {
        setNcs(response.data || [])
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar não conformidades",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <CardLoader text="Carregando não conformidades..." />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Não Conformidades</CardTitle>
        <CardDescription>Itens não conformes que precisam de ação corretiva</CardDescription>
      </CardHeader>
      <CardContent>
        {ncs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma não conformidade encontrada
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status Correção</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ncs.map((nc) => (
                <TableRow key={nc.id}>
                  <TableCell>
                    {nc.checklist_itens?.descricao || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {nc.checklists_diarios?.data 
                      ? new Date(nc.checklists_diarios.data).toLocaleDateString('pt-BR')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      nc.status_correcao === 'concluido' ? 'default' :
                      nc.status_correcao === 'em_andamento' ? 'secondary' :
                      'destructive'
                    }>
                      {nc.status_correcao || 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {nc.funcionarios?.nome || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewNC(nc)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

