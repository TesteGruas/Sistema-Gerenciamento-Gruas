"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  Eye, 
  Calculator,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Send
} from "lucide-react"
import { gruasApi } from "@/lib/api-gruas"
import { medicoesMensaisApi, MedicaoMensal } from "@/lib/api-medicoes-mensais"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function GruaDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const gruaId = params.id as string

  const [grua, setGrua] = useState<any>(null)
  const [medicoes, setMedicoes] = useState<MedicaoMensal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMedicao, setSelectedMedicao] = useState<MedicaoMensal | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  useEffect(() => {
    if (gruaId) {
      carregarDados()
    }
  }, [gruaId])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar grua
      const gruaResponse = await gruasApi.obterGrua(gruaId)
      if (gruaResponse.success && gruaResponse.data) {
        setGrua(gruaResponse.data)
      } else {
        console.error('Erro ao carregar grua:', gruaResponse)
        toast({
          title: "Erro",
          description: "Erro ao carregar dados da grua",
          variant: "destructive"
        })
        return
      }

      // Carregar medições da grua
      console.log('Buscando medições para grua:', gruaId)
      const medicoesResponse = await medicoesMensaisApi.listarPorGrua(gruaId)
      console.log('Resposta de medições:', medicoesResponse)
      
      if (medicoesResponse.success) {
        setMedicoes(medicoesResponse.data || [])
        console.log('Medições carregadas:', medicoesResponse.data?.length || 0)
      } else {
        console.error('Erro ao carregar medições:', medicoesResponse)
        toast({
          title: "Aviso",
          description: "Não foi possível carregar as medições",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar dados da grua",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente", variant: "outline" },
      finalizada: { label: "Finalizada", variant: "default" },
      enviada: { label: "Enviada", variant: "secondary" },
      cancelada: { label: "Cancelada", variant: "destructive" }
    }
    const statusInfo = statusMap[status] || statusMap.pendente
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getAprovacaoBadge = (statusAprovacao?: string | null) => {
    if (!statusAprovacao) return null
    const aprovacaoMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      pendente: { label: "Aguardando Aprovação", variant: "secondary" },
      aprovada: { label: "Aprovada", variant: "default" },
      rejeitada: { label: "Rejeitada", variant: "destructive" }
    }
    const aprovacaoInfo = aprovacaoMap[statusAprovacao] || aprovacaoMap.pendente
    return <Badge variant={aprovacaoInfo.variant}>{aprovacaoInfo.label}</Badge>
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!grua) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-gray-600">Grua não encontrada</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{grua.name || `Grua ${grua.id}`}</h1>
            <p className="text-gray-600">
              {grua.model || grua.modelo || ''} {grua.fabricante || ''} - {grua.capacity || grua.capacidade || ''}
            </p>
          </div>
        </div>
      </div>

      {/* Informações da Grua */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Grua</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Modelo</Label>
              <p className="font-semibold">{grua.model || grua.modelo || '-'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Fabricante</Label>
              <p className="font-semibold">{grua.fabricante || '-'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Capacidade</Label>
              <p className="font-semibold">{grua.capacity || grua.capacidade || '-'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Status</Label>
              <p className="font-semibold">{grua.status || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medições */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Medições ({medicoes.length})
          </CardTitle>
          <CardDescription>
            Visualize todas as medições vinculadas a esta grua
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando medições...</p>
            </div>
          ) : medicoes.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Nenhuma medição encontrada para esta grua</p>
              <p className="text-sm text-gray-400">
                As medições vinculadas a esta grua aparecerão aqui
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/dashboard/medicoes')}
              >
                Ir para Medições
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aprovação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicoes.map((medicao) => (
                  <TableRow key={medicao.id}>
                    <TableCell className="font-medium">{medicao.numero}</TableCell>
                    <TableCell>{medicao.periodo}</TableCell>
                    <TableCell>
                      {medicao.obras ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{medicao.obras.nome}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(medicao.valor_total || 0)}</TableCell>
                    <TableCell>{getStatusBadge(medicao.status)}</TableCell>
                    <TableCell>{getAprovacaoBadge(medicao.status_aprovacao)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMedicao(medicao)
                          setIsViewDialogOpen(true)
                        }}
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

      {/* Dialog de Visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Medição</DialogTitle>
          </DialogHeader>
          {selectedMedicao && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número</Label>
                  <p className="font-semibold">{selectedMedicao.numero}</p>
                </div>
                <div>
                  <Label>Período</Label>
                  <p>{selectedMedicao.periodo}</p>
                </div>
                {selectedMedicao.gruas && (
                  <div>
                    <Label>Grua</Label>
                    <p>{selectedMedicao.gruas.name}</p>
                  </div>
                )}
                {selectedMedicao.obras && (
                  <div>
                    <Label>Obra</Label>
                    <p>{selectedMedicao.obras.nome}</p>
                  </div>
                )}
                <div>
                  <Label>Valor Total</Label>
                  <p className="font-semibold text-lg">{formatCurrency(selectedMedicao.valor_total || 0)}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedMedicao.status)}</div>
                </div>
                {selectedMedicao.status_aprovacao && (
                  <div>
                    <Label>Status de Aprovação</Label>
                    <div>{getAprovacaoBadge(selectedMedicao.status_aprovacao)}</div>
                  </div>
                )}
                {selectedMedicao.data_envio && (
                  <div>
                    <Label>Data de Envio</Label>
                    <p>{formatDate(selectedMedicao.data_envio)}</p>
                  </div>
                )}
                {selectedMedicao.data_aprovacao && (
                  <div>
                    <Label>Data de Aprovação</Label>
                    <p>{formatDate(selectedMedicao.data_aprovacao)}</p>
                  </div>
                )}
              </div>
              {selectedMedicao.observacoes && (
                <div>
                  <Label>Observações</Label>
                  <p>{selectedMedicao.observacoes}</p>
                </div>
              )}
              {selectedMedicao.observacoes_aprovacao && (
                <div>
                  <Label>Observações de Aprovação</Label>
                  <p>{selectedMedicao.observacoes_aprovacao}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
