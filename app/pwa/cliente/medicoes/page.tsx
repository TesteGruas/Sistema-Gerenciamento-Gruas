"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Receipt,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Building2,
  Forklift
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { medicoesMensaisApi, MedicaoMensal } from "@/lib/api-medicoes-mensais"
import { clientesApi } from "@/lib/api-clientes"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function PWAClienteMedicoesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [medicoes, setMedicoes] = useState<MedicaoMensal[]>([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [clienteId, setClienteId] = useState<number | null>(null)
  const [selectedMedicao, setSelectedMedicao] = useState<MedicaoMensal | null>(null)
  const [isAprovarDialogOpen, setIsAprovarDialogOpen] = useState(false)
  const [isRejeitarDialogOpen, setIsRejeitarDialogOpen] = useState(false)
  const [observacoes, setObservacoes] = useState("")
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (isOnline) {
      carregarDados()
    }
  }, [isOnline])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Buscar dados do usuário
      const userDataStr = localStorage.getItem('user_data')
      if (!userDataStr) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        })
        router.push('/pwa/login')
        return
      }

      const userData = JSON.parse(userDataStr)
      const userId = userData?.user?.id || userData?.id

      if (!userId) {
        toast({
          title: "Erro",
          description: "ID do usuário não encontrado",
          variant: "destructive"
        })
        return
      }

      // Buscar cliente pelo usuario_id
      const clienteResponse = await clientesApi.buscarPorUsuarioId(userId)
      if (!clienteResponse.success || !clienteResponse.data) {
        toast({
          title: "Erro",
          description: "Cliente não encontrado para este usuário",
          variant: "destructive"
        })
        return
      }

      const cliente = clienteResponse.data
      setClienteId(cliente.id)

      // Buscar medições do cliente (apenas enviadas)
      const medicoesResponse = await medicoesMensaisApi.listarPorCliente(cliente.id)
      if (medicoesResponse.success) {
        setMedicoes(medicoesResponse.data || [])
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar medições",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAprovar = async () => {
    if (!selectedMedicao) return

    try {
      setProcessando(true)
      const response = await medicoesMensaisApi.aprovar(
        selectedMedicao.id,
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
        setSelectedMedicao(null)
        await carregarDados()
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
    if (!selectedMedicao || !observacoes.trim()) {
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
        selectedMedicao.id,
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
        setSelectedMedicao(null)
        await carregarDados()
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
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Carregando medições...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Medições para Aprovação</h1>
              <p className="text-gray-600">Medições enviadas aguardando sua aprovação</p>
            </div>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={carregarDados}
                disabled={!isOnline}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Lista de Medições */}
          {medicoes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">Nenhuma medição encontrada</p>
                <p className="text-sm text-gray-500 mt-2">
                  Não há medições aguardando aprovação no momento
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {medicoes.map((medicao) => (
                <Card key={medicao.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{medicao.numero}</CardTitle>
                        <CardDescription>
                          Período: {medicao.periodo}
                        </CardDescription>
                      </div>
                      {getStatusBadge(medicao.status_aprovacao || 'pendente')}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {medicao.obras && (
                          <div>
                            <span className="text-gray-600">Obra:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{medicao.obras.nome}</span>
                            </div>
                          </div>
                        )}
                        {medicao.gruas && (
                          <div>
                            <span className="text-gray-600">Grua:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Forklift className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{medicao.gruas.name || medicao.gruas.nome}</span>
                            </div>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Valor Total:</span>
                          <p className="font-bold text-blue-600 text-lg">
                            {formatCurrency(medicao.valor_total || 0)}
                          </p>
                        </div>
                        {medicao.data_envio && (
                          <div>
                            <span className="text-gray-600">Data de Envio:</span>
                            <p className="font-medium">
                              {format(new Date(medicao.data_envio), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        )}
                      </div>

                      {medicao.observacoes && (
                        <div className="pt-2 border-t">
                          <span className="text-sm text-gray-600">Observações:</span>
                          <p className="text-sm text-gray-800 mt-1">{medicao.observacoes}</p>
                        </div>
                      )}

                      {medicao.status_aprovacao === 'pendente' || !medicao.status_aprovacao ? (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedMedicao(medicao)
                              setIsAprovarDialogOpen(true)
                            }}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Aprovar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedMedicao(medicao)
                              setIsRejeitarDialogOpen(true)
                            }}
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rejeitar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/pwa/cliente/medicoes/${medicao.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Detalhes
                          </Button>
                        </div>
                      ) : (
                        <div className="pt-4 border-t">
                          <p className="text-sm text-gray-600">
                            {medicao.status_aprovacao === 'aprovada' 
                              ? '✓ Esta medição foi aprovada'
                              : '✗ Esta medição foi rejeitada'}
                          </p>
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
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Dialog de Aprovar */}
        <Dialog open={isAprovarDialogOpen} onOpenChange={setIsAprovarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Medição</DialogTitle>
              <DialogDescription>
                Confirme a aprovação da medição {selectedMedicao?.numero}
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
                Informe o motivo da rejeição da medição {selectedMedicao?.numero}
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
