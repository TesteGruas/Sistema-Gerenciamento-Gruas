"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Send,
  DollarSign,
  Calendar,
  User,
  RefreshCw,
  FileText
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ordemComprasApi, type OrdemCompraBackend } from "@/lib/api-ordem-compras"
import { CardLoader } from "@/components/ui/loader"
import { FluxoAprovacaoCompra } from "@/components/fluxo-aprovacao-compra"
import { OrdemCompraForm } from "@/components/ordem-compra-form"
import { useCurrentUser } from "@/hooks/use-current-user"

export default function OrdemComprasPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [ordens, setOrdens] = useState<OrdemCompraBackend[]>([])
  const [ordensPendentes, setOrdensPendentes] = useState<any[]>([])
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemCompraBackend | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("todas")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [ordensRes, pendentesRes] = await Promise.all([
        ordemComprasApi.listar({ solicitante_id: user?.id }),
        ordemComprasApi.listarPendentesAprovacao()
      ])

      if (ordensRes.success) {
        setOrdens(ordensRes.data || [])
      }

      if (pendentesRes.success) {
        setOrdensPendentes(pendentesRes.data || [])
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar ordens de compra",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (ordem: OrdemCompraBackend) => {
    try {
      const response = await ordemComprasApi.obter(ordem.id)
      if (response.success) {
        setSelectedOrdem(response.data)
        setShowDialog(true)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar ordem de compra",
        variant: "destructive"
      })
    }
  }

  const handleSave = async () => {
    setShowDialog(false)
    await loadData()
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      rascunho: { label: "Rascunho", variant: "outline" },
      aguardando_orcamento: { label: "Aguardando Orçamento", variant: "secondary" },
      orcamento_aprovado: { label: "Orçamento Aprovado", variant: "default" },
      enviado_financeiro: { label: "Enviado ao Financeiro", variant: "secondary" },
      pagamento_registrado: { label: "Pagamento Registrado", variant: "default" },
      finalizada: { label: "Finalizada", variant: "default" },
      cancelada: { label: "Cancelada", variant: "destructive" }
    }
    const statusInfo = statusMap[status] || { label: status, variant: "outline" }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (loading && ordens.length === 0) {
    return <CardLoader text="Carregando ordens de compra..." />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ordem de Compras</h1>
          <p className="text-muted-foreground">Gerencie o fluxo de aprovação de compras</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => {
            setSelectedOrdem(null)
            setIsEditing(false)
            setShowFormDialog(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Ordem
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="todas">
            <FileText className="w-4 h-4 mr-2" />
            Todas
          </TabsTrigger>
          <TabsTrigger value="pendentes">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Pendentes de Aprovação
            {ordensPendentes.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {ordensPendentes.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Todas */}
        <TabsContent value="todas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ordens de Compra</CardTitle>
              <CardDescription>
                {ordens.length} ordem(ns) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma ordem de compra encontrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordens.map((ordem) => (
                      <TableRow key={ordem.id}>
                        <TableCell className="font-medium">
                          {ordem.descricao}
                        </TableCell>
                        <TableCell>
                          {ordem.funcionarios?.nome || ordem.usuarios?.nome || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            {ordem.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(ordem.status)}
                        </TableCell>
                        <TableCell>
                          {new Date(ordem.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(ordem)}
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
        </TabsContent>

        {/* Tab: Pendentes */}
        <TabsContent value="pendentes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pendentes de Aprovação</CardTitle>
              <CardDescription>
                {ordensPendentes.length} ordem(ns) aguardando sua aprovação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordensPendentes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma ordem pendente de aprovação
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordensPendentes.map((item) => {
                      const ordem = item.ordem_compras
                      return (
                        <TableRow key={ordem.id}>
                          <TableCell className="font-medium">
                            {ordem.descricao}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.etapa}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              {ordem.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(ordem.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(ordem)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Visualização/Aprovação */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Ordem de Compra</DialogTitle>
          </DialogHeader>
          {selectedOrdem && (
            <FluxoAprovacaoCompra
              ordem={selectedOrdem}
              onSave={handleSave}
              onCancel={() => setShowDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Criar/Editar */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Ordem de Compra" : "Nova Ordem de Compra"}
            </DialogTitle>
          </DialogHeader>
          <OrdemCompraForm
            ordem={selectedOrdem || undefined}
            onSave={async () => {
              setShowFormDialog(false)
              await loadData()
            }}
            onCancel={() => {
              setShowFormDialog(false)
              setSelectedOrdem(null)
              setIsEditing(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

