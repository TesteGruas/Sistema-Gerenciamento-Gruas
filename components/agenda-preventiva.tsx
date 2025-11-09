"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus,
  Calendar,
  Clock,
  Wrench,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2
} from "lucide-react"
import { ButtonLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { manutencoesApi, type AgendaPreventivaBackend, type AgendaPreventivaCreateData, type AgendaPreventivaUpdateData } from "@/lib/api-manutencoes"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AgendaPreventivaProps {
  gruaId: string
}

export function AgendaPreventiva({ gruaId }: AgendaPreventivaProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [agendas, setAgendas] = useState<AgendaPreventivaBackend[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaPreventivaBackend | null>(null)

  const [tipoManutencao, setTipoManutencao] = useState("")
  const [intervaloTipo, setIntervaloTipo] = useState<'horas' | 'dias' | 'meses' | 'km'>('horas')
  const [intervaloValor, setIntervaloValor] = useState("")
  const [ultimaManutencaoHorimetro, setUltimaManutencaoHorimetro] = useState("")
  const [ultimaManutencaoData, setUltimaManutencaoData] = useState("")

  useEffect(() => {
    if (gruaId) {
      loadAgendas()
    }
  }, [gruaId])

  const loadAgendas = async () => {
    setLoading(true)
    try {
      const response = await manutencoesApi.agendaPreventiva.listar(gruaId)
      if (response.success) {
        setAgendas(response.data || [])
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar agenda preventiva",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedAgenda(null)
    setTipoManutencao("")
    setIntervaloTipo('horas')
    setIntervaloValor("")
    setUltimaManutencaoHorimetro("")
    setUltimaManutencaoData("")
    setShowDialog(true)
  }

  const handleEdit = (agenda: AgendaPreventivaBackend) => {
    setSelectedAgenda(agenda)
    setTipoManutencao(agenda.tipo_manutencao)
    setIntervaloTipo(agenda.intervalo_tipo)
    setIntervaloValor(agenda.intervalo_valor.toString())
    setUltimaManutencaoHorimetro(agenda.ultima_manutencao_horimetro?.toString() || "")
    setUltimaManutencaoData(agenda.ultima_manutencao_data || "")
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!tipoManutencao.trim() || !intervaloValor) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const data: AgendaPreventivaCreateData = {
        grua_id: gruaId,
        tipo_manutencao: tipoManutencao.trim(),
        intervalo_tipo: intervaloTipo,
        intervalo_valor: Number(intervaloValor),
        ultima_manutencao_horimetro: ultimaManutencaoHorimetro ? Number(ultimaManutencaoHorimetro) : undefined,
        ultima_manutencao_data: ultimaManutencaoData || undefined
      }

      if (selectedAgenda) {
        const updateData: AgendaPreventivaUpdateData = {
          ultima_manutencao_horimetro: ultimaManutencaoHorimetro ? Number(ultimaManutencaoHorimetro) : undefined,
          ultima_manutencao_data: ultimaManutencaoData || undefined
        }
        await manutencoesApi.agendaPreventiva.atualizar(selectedAgenda.id, updateData)
        toast({
          title: "Sucesso",
          description: "Agenda preventiva atualizada com sucesso"
        })
      } else {
        await manutencoesApi.agendaPreventiva.criar(data)
        toast({
          title: "Sucesso",
          description: "Agenda preventiva criada com sucesso"
        })
      }
      setShowDialog(false)
      await loadAgendas()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar agenda preventiva",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDesativar = async (agenda: AgendaPreventivaBackend) => {
    if (!confirm("Deseja realmente desativar esta agenda preventiva?")) {
      return
    }

    setLoading(true)
    try {
      await manutencoesApi.agendaPreventiva.atualizar(agenda.id, { ativo: false })
      toast({
        title: "Sucesso",
        description: "Agenda preventiva desativada com sucesso"
      })
      await loadAgendas()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao desativar agenda preventiva",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (agenda: AgendaPreventivaBackend) => {
    if (!agenda.proxima_manutencao_data && !agenda.proxima_manutencao_horimetro) {
      return <Badge variant="outline">Sem data definida</Badge>
    }

    const hoje = new Date()
    if (agenda.proxima_manutencao_data) {
      const proximaData = new Date(agenda.proxima_manutencao_data)
      const diasRestantes = Math.ceil((proximaData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diasRestantes < 0) {
        return <Badge variant="destructive">Vencida</Badge>
      } else if (diasRestantes <= 7) {
        return <Badge variant="destructive">Próxima ({diasRestantes} dias)</Badge>
      } else if (diasRestantes <= 30) {
        return <Badge variant="secondary">Em breve ({diasRestantes} dias)</Badge>
      } else {
        return <Badge variant="outline">{diasRestantes} dias</Badge>
      }
    }

    return <Badge variant="outline">Agendada</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Agenda Preventiva</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os agendamentos de manutenção preventiva
          </p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nova Agenda
        </Button>
      </div>

      {loading && agendas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Carregando agenda preventiva...
          </CardContent>
        </Card>
      ) : agendas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma agenda preventiva cadastrada
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Manutenção</TableHead>
                  <TableHead>Intervalo</TableHead>
                  <TableHead>Última Manutenção</TableHead>
                  <TableHead>Próxima Manutenção</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendas.map((agenda) => (
                  <TableRow key={agenda.id}>
                    <TableCell className="font-medium">
                      {agenda.tipo_manutencao}
                    </TableCell>
                    <TableCell>
                      {agenda.intervalo_valor} {agenda.intervalo_tipo}
                    </TableCell>
                    <TableCell>
                      {agenda.ultima_manutencao_data ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {format(new Date(agenda.ultima_manutencao_data), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      ) : agenda.ultima_manutencao_horimetro ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {agenda.ultima_manutencao_horimetro.toLocaleString('pt-BR')}h
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {agenda.proxima_manutencao_data ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {format(new Date(agenda.proxima_manutencao_data), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      ) : agenda.proxima_manutencao_horimetro ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {agenda.proxima_manutencao_horimetro.toLocaleString('pt-BR')}h
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(agenda)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(agenda)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDesativar(agenda)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Criar/Editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAgenda ? "Editar Agenda Preventiva" : "Nova Agenda Preventiva"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tipo_manutencao">Tipo de Manutenção *</Label>
              <Input
                id="tipo_manutencao"
                value={tipoManutencao}
                onChange={(e) => setTipoManutencao(e.target.value)}
                placeholder="Ex: Troca de óleo, Revisão geral, etc."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="intervalo_tipo">Tipo de Intervalo *</Label>
                <Select
                  value={intervaloTipo}
                  onValueChange={(value: any) => setIntervaloTipo(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horas">Horas</SelectItem>
                    <SelectItem value="dias">Dias</SelectItem>
                    <SelectItem value="meses">Meses</SelectItem>
                    <SelectItem value="km">Quilômetros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="intervalo_valor">Valor do Intervalo *</Label>
                <Input
                  id="intervalo_valor"
                  type="number"
                  value={intervaloValor}
                  onChange={(e) => setIntervaloValor(e.target.value)}
                  placeholder="Ex: 500"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ultima_manutencao_horimetro">Última Manutenção - Horímetro</Label>
                <Input
                  id="ultima_manutencao_horimetro"
                  type="number"
                  value={ultimaManutencaoHorimetro}
                  onChange={(e) => setUltimaManutencaoHorimetro(e.target.value)}
                  placeholder="Ex: 1000"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="ultima_manutencao_data">Última Manutenção - Data</Label>
                <Input
                  id="ultima_manutencao_data"
                  type="date"
                  value={ultimaManutencaoData}
                  onChange={(e) => setUltimaManutencaoData(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ButtonLoader text="Salvando..." />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

