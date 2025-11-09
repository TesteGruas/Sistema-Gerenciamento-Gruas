"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  ArrowLeft,
  Plus,
  Eye,
  Edit,
  Wrench,
  Calendar,
  DollarSign,
  RefreshCw,
  Filter
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { manutencoesApi, type ManutencaoOrdemBackend } from "@/lib/api-manutencoes"
import { CardLoader } from "@/components/ui/loader"
import { ManutencaoForm } from "@/components/manutencao-form"

export default function ManutencoesObraPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const obraId = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [manutencoes, setManutencoes] = useState<ManutencaoOrdemBackend[]>([])
  const [selectedManutencao, setSelectedManutencao] = useState<ManutencaoOrdemBackend | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<string>("")
  const [filtroStatus, setFiltroStatus] = useState<string>("")

  useEffect(() => {
    if (obraId) {
      loadManutencoes()
    }
  }, [obraId, filtroTipo, filtroStatus])

  const loadManutencoes = async () => {
    setLoading(true)
    try {
      const response = await manutencoesApi.ordens.listar({
        obra_id: obraId,
        tipo: filtroTipo || undefined,
        status: filtroStatus || undefined
      })

      if (response.success) {
        setManutencoes(response.data || [])
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar manutenções",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedManutencao(null)
    setShowDialog(true)
  }

  const handleView = async (manutencao: ManutencaoOrdemBackend) => {
    try {
      const response = await manutencoesApi.ordens.obter(manutencao.id)
      if (response.success) {
        setSelectedManutencao(response.data)
        setShowDialog(true)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar manutenção",
        variant: "destructive"
      })
    }
  }

  const handleSave = async () => {
    setShowDialog(false)
    await loadManutencoes()
  }

  const getTipoBadge = (tipo: string) => {
    const tipoMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      preventiva: { label: "Preventiva", variant: "default" },
      corretiva: { label: "Corretiva", variant: "secondary" },
      preditiva: { label: "Preditiva", variant: "outline" },
      emergencial: { label: "Emergencial", variant: "destructive" }
    }
    const tipoInfo = tipoMap[tipo] || { label: tipo, variant: "outline" }
    return <Badge variant={tipoInfo.variant}>{tipoInfo.label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      agendada: { label: "Agendada", variant: "outline" },
      em_andamento: { label: "Em Andamento", variant: "secondary" },
      concluida: { label: "Concluída", variant: "default" },
      cancelada: { label: "Cancelada", variant: "destructive" }
    }
    const statusInfo = statusMap[status] || { label: status, variant: "outline" }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getPrioridadeBadge = (prioridade: string) => {
    const prioridadeMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      baixa: { label: "Baixa", variant: "outline" },
      media: { label: "Média", variant: "secondary" },
      alta: { label: "Alta", variant: "default" },
      critica: { label: "Crítica", variant: "destructive" }
    }
    const prioridadeInfo = prioridadeMap[prioridade] || { label: prioridade, variant: "outline" }
    return <Badge variant={prioridadeInfo.variant}>{prioridadeInfo.label}</Badge>
  }

  if (loading && manutencoes.length === 0) {
    return <CardLoader text="Carregando manutenções..." />
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
            <h1 className="text-3xl font-bold">Manutenções</h1>
            <p className="text-muted-foreground">Gerencie as manutenções da obra</p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Manutenção
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="preventiva">Preventiva</option>
                <option value="corretiva">Corretiva</option>
                <option value="preditiva">Preditiva</option>
                <option value="emergencial">Emergencial</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="agendada">Agendada</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={loadManutencoes}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Manutenções */}
      <Card>
        <CardHeader>
          <CardTitle>Manutenções</CardTitle>
          <CardDescription>
            {manutencoes.length} manutenção(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {manutencoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma manutenção encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grua</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Prevista</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manutencoes.map((manutencao) => (
                  <TableRow key={manutencao.id}>
                    <TableCell>
                      {manutencao.gruas?.name || manutencao.gruas?.modelo || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getTipoBadge(manutencao.tipo)}
                    </TableCell>
                    <TableCell>
                      {getPrioridadeBadge(manutencao.prioridade)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(manutencao.status)}
                    </TableCell>
                    <TableCell>
                      {manutencao.data_prevista 
                        ? new Date(manutencao.data_prevista).toLocaleDateString('pt-BR')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        {manutencao.custo_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(manutencao)}
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

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedManutencao ? "Detalhes da Manutenção" : "Nova Manutenção"}
            </DialogTitle>
          </DialogHeader>
          <ManutencaoForm
            obraId={obraId}
            manutencao={selectedManutencao || undefined}
            onSave={handleSave}
            onCancel={() => setShowDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

