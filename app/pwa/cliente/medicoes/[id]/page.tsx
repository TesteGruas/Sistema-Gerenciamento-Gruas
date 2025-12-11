"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Receipt, Building2, Forklift, CheckCircle, XCircle, Calendar, DollarSign } from "lucide-react"
import { medicoesMensaisApi, MedicaoMensal } from "@/lib/api-medicoes-mensais"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function PWAClienteMedicaoDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [medicao, setMedicao] = useState<MedicaoMensal | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAprovarDialogOpen, setIsAprovarDialogOpen] = useState(false)
  const [isRejeitarDialogOpen, setIsRejeitarDialogOpen] = useState(false)
  const [observacoes, setObservacoes] = useState("")
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    if (params.id) {
      carregarMedicao()
    }
  }, [params.id])

  const carregarMedicao = async () => {
    try {
      setLoading(true)
      const response = await medicoesMensaisApi.obter(Number(params.id))
      if (response.success) {
        setMedicao(response.data)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar detalhes da medição",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAprovar = async () => {
    if (!medicao) return

    try {
      setProcessando(true)
      const response = await medicoesMensaisApi.aprovar(
        medicao.id,
        'aprovada',
        observacoes || undefined
      )

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Medição aprovada com sucesso"
        })
        setIsAprovarDialogOpen(false)
        setObservacoes("")
        await carregarMedicao()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao aprovar medição",
        variant: "destructive"
      })
    } finally {
      setProcessando(false)
    }
  }

  const handleRejeitar = async () => {
    if (!medicao || !observacoes.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, informe o motivo da rejeição",
        variant: "destructive"
      })
      return
    }

    try {
      setProcessando(true)
      const response = await medicoesMensaisApi.aprovar(
        medicao.id,
        'rejeitada',
        observacoes
      )

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Medição rejeitada"
        })
        setIsRejeitarDialogOpen(false)
        setObservacoes("")
        await carregarMedicao()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao rejeitar medição",
        variant: "destructive"
      })
    } finally {
      setProcessando(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      enviada: { label: "Enviada", variant: "secondary" },
      aprovada: { label: "Aprovada", variant: "default" },
      rejeitada: { label: "Rejeitada", variant: "destructive" },
      pendente: { label: "Aguardando Aprovação", variant: "outline" }
    }
    const statusInfo = statusMap[status] || statusMap.enviada
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!medicao) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Card className="mt-4">
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">Medição não encontrada</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{medicao.numero}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Período: {medicao.periodo}
                  </CardDescription>
                </div>
                {getStatusBadge(medicao.status_aprovacao || 'pendente')}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {medicao.obras && (
                  <div>
                    <Label className="text-sm text-gray-600">Obra</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <p className="font-medium">{medicao.obras.nome}</p>
                    </div>
                  </div>
                )}
                {medicao.gruas && (
                  <div>
                    <Label className="text-sm text-gray-600">Grua</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Forklift className="w-5 h-5 text-gray-400" />
                      <p className="font-medium">{medicao.gruas.name || medicao.gruas.nome}</p>
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-sm text-gray-600">Valor Total</Label>
                  <p className="font-bold text-blue-600 text-2xl mt-1">
                    {formatCurrency(medicao.valor_total || 0)}
                  </p>
                </div>
                {medicao.data_envio && (
                  <div>
                    <Label className="text-sm text-gray-600">Data de Envio</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <p className="font-medium">
                        {format(new Date(medicao.data_envio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Valores Detalhados */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Valores Detalhados</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600">Valor Mensal Bruto</Label>
                    <p className="font-medium">{formatCurrency(medicao.valor_mensal_bruto || 0)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Aditivos</Label>
                    <p className="font-medium">{formatCurrency(medicao.valor_aditivos || 0)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Custos Extras</Label>
                    <p className="font-medium">{formatCurrency(medicao.valor_custos_extras || 0)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Descontos</Label>
                    <p className="font-medium text-red-600">-{formatCurrency(medicao.valor_descontos || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {medicao.observacoes && (
                <div className="border-t pt-6">
                  <Label className="text-sm text-gray-600">Observações</Label>
                  <p className="text-gray-800 mt-2">{medicao.observacoes}</p>
                </div>
              )}

              {/* Status de Aprovação */}
              {medicao.status_aprovacao && medicao.status_aprovacao !== 'pendente' && (
                <div className="border-t pt-6">
                  <Label className="text-sm text-gray-600">Status de Aprovação</Label>
                  <div className="mt-2">
                    {getStatusBadge(medicao.status_aprovacao)}
                    {medicao.observacoes_aprovacao && (
                      <p className="text-sm text-gray-800 mt-2">
                        <span className="font-medium">Observações:</span> {medicao.observacoes_aprovacao}
                      </p>
                    )}
                    {medicao.data_aprovacao && (
                      <p className="text-xs text-gray-500 mt-1">
                        Em {format(new Date(medicao.data_aprovacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Ações */}
              {(medicao.status_aprovacao === 'pendente' || !medicao.status_aprovacao) && (
                <div className="border-t pt-6 flex gap-3">
                  <Button
                    variant="default"
                    onClick={() => setIsAprovarDialogOpen(true)}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar Medição
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setIsRejeitarDialogOpen(true)}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar Medição
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialog de Aprovar */}
        <Dialog open={isAprovarDialogOpen} onOpenChange={setIsAprovarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Medição</DialogTitle>
              <DialogDescription>
                Confirme a aprovação da medição {medicao?.numero}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="observacoes-aprovar">Observações (opcional)</Label>
                <Textarea
                  id="observacoes-aprovar"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione observações sobre a aprovação..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAprovarDialogOpen(false)
                setObservacoes("")
              }}>
                Cancelar
              </Button>
              <Button onClick={handleAprovar} disabled={processando}>
                {processando ? "Aprovando..." : "Confirmar Aprovação"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Rejeitar */}
        <Dialog open={isRejeitarDialogOpen} onOpenChange={setIsRejeitarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Medição</DialogTitle>
              <DialogDescription>
                Informe o motivo da rejeição da medição {medicao?.numero}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="observacoes-rejeitar">Motivo da Rejeição *</Label>
                <Textarea
                  id="observacoes-rejeitar"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informe o motivo da rejeição..."
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  O motivo da rejeição é obrigatório
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsRejeitarDialogOpen(false)
                setObservacoes("")
              }}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRejeitar} 
                disabled={processando || !observacoes.trim()}
              >
                {processando ? "Rejeitando..." : "Confirmar Rejeição"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
