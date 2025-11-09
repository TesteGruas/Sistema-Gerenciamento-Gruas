"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  X,
  CheckCircle2,
  XCircle,
  Send,
  DollarSign,
  Calendar,
  User,
  AlertCircle,
  FileText
} from "lucide-react"
import { ButtonLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { ordemComprasApi, type OrdemCompraBackend } from "@/lib/api-ordem-compras"

interface FluxoAprovacaoCompraProps {
  ordem: OrdemCompraBackend
  onSave: () => void
  onCancel: () => void
}

export function FluxoAprovacaoCompra({
  ordem,
  onSave,
  onCancel
}: FluxoAprovacaoCompraProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [comentarios, setComentarios] = useState("")

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

  const handleAprovarOrcamento = async () => {
    setLoading(true)
    try {
      await ordemComprasApi.aprovarOrcamento(ordem.id, { comentarios: comentarios || undefined })
      toast({
        title: "Sucesso",
        description: "Orçamento aprovado com sucesso"
      })
      onSave()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao aprovar orçamento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarOrcamento = async () => {
    setLoading(true)
    try {
      await ordemComprasApi.enviarOrcamento(ordem.id)
      toast({
        title: "Sucesso",
        description: "Orçamento enviado para aprovação"
      })
      onSave()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar orçamento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarFinanceiro = async () => {
    setLoading(true)
    try {
      await ordemComprasApi.enviarFinanceiro(ordem.id)
      toast({
        title: "Sucesso",
        description: "Ordem enviada ao financeiro"
      })
      onSave()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar ao financeiro",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegistrarPagamento = async () => {
    setLoading(true)
    try {
      await ordemComprasApi.registrarPagamento(ordem.id)
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso"
      })
      onSave()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar pagamento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAprovarFinal = async () => {
    setLoading(true)
    try {
      await ordemComprasApi.aprovarFinal(ordem.id, { comentarios: comentarios || undefined })
      toast({
        title: "Sucesso",
        description: "Ordem finalizada com sucesso"
      })
      onSave()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao finalizar ordem",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRejeitar = async () => {
    if (!comentarios.trim()) {
      toast({
        title: "Erro",
        description: "Comentários são obrigatórios para rejeitar",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Determinar etapa atual
      let etapa: 'orcamento' | 'financeiro' | 'pagamento' = 'orcamento'
      if (ordem.status === 'enviado_financeiro' || ordem.status === 'pagamento_registrado') {
        etapa = 'financeiro'
      } else if (ordem.status === 'pagamento_registrado') {
        etapa = 'pagamento'
      }

      await ordemComprasApi.rejeitar(ordem.id, { etapa, comentarios })
      toast({
        title: "Sucesso",
        description: "Ordem rejeitada"
      })
      onSave()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao rejeitar ordem",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const canAprovarOrcamento = ordem.status === 'aguardando_orcamento'
  const canEnviarOrcamento = ordem.status === 'rascunho'
  const canEnviarFinanceiro = ordem.status === 'orcamento_aprovado'
  const canRegistrarPagamento = ordem.status === 'enviado_financeiro'
  const canAprovarFinal = ordem.status === 'pagamento_registrado'
  const canRejeitar = ['aguardando_orcamento', 'enviado_financeiro', 'pagamento_registrado'].includes(ordem.status)

  return (
    <div className="space-y-4">
      {/* Informações da Ordem */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Informações da Ordem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <div className="mt-1">
                {getStatusBadge(ordem.status)}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Valor Total
              </Label>
              <p className="text-lg font-semibold mt-1">
                {ordem.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <p className="text-sm mt-1">{ordem.descricao}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" />
                Solicitante
              </Label>
              <p className="text-sm mt-1">
                {ordem.funcionarios?.nome || ordem.usuarios?.nome || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Data de Criação
              </Label>
              <p className="text-sm mt-1">
                {new Date(ordem.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Aprovações */}
      {ordem.aprovacoes && ordem.aprovacoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de Aprovações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ordem.aprovacoes.map((aprovacao) => (
                <div key={aprovacao.id} className="flex items-start gap-3 p-3 border rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{aprovacao.etapa}</Badge>
                      <Badge variant={aprovacao.status === 'aprovado' ? 'default' : 'destructive'}>
                        {aprovacao.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {aprovacao.usuarios?.nome || 'N/A'}
                    </p>
                    {aprovacao.comentarios && (
                      <p className="text-sm mt-1">{aprovacao.comentarios}</p>
                    )}
                    {aprovacao.data_aprovacao && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(aprovacao.data_aprovacao).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      {(canAprovarOrcamento || canEnviarOrcamento || canEnviarFinanceiro || canRegistrarPagamento || canAprovarFinal || canRejeitar) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações</CardTitle>
            <CardDescription>Execute ações no fluxo de aprovação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="comentarios">Comentários</Label>
              <Textarea
                id="comentarios"
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Adicione comentários sobre a aprovação ou rejeição..."
                rows={3}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {canEnviarOrcamento && (
                <Button
                  onClick={handleEnviarOrcamento}
                  disabled={loading}
                  variant="outline"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar para Aprovação
                </Button>
              )}

              {canAprovarOrcamento && (
                <Button
                  onClick={handleAprovarOrcamento}
                  disabled={loading}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aprovar Orçamento
                </Button>
              )}

              {canEnviarFinanceiro && (
                <Button
                  onClick={handleEnviarFinanceiro}
                  disabled={loading}
                  variant="outline"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar ao Financeiro
                </Button>
              )}

              {canRegistrarPagamento && (
                <Button
                  onClick={handleRegistrarPagamento}
                  disabled={loading}
                  variant="outline"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Registrar Pagamento
                </Button>
              )}

              {canAprovarFinal && (
                <Button
                  onClick={handleAprovarFinal}
                  disabled={loading}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aprovar Final
                </Button>
              )}

              {canRejeitar && (
                <Button
                  onClick={handleRejeitar}
                  disabled={loading}
                  variant="destructive"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-2" />
          Fechar
        </Button>
      </div>
    </div>
  )
}

