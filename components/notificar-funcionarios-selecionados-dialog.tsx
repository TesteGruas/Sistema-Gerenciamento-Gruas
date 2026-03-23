"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  NotificacoesAPI,
  type NotificationType,
  obterTiposPermitidosPorRole,
} from "@/lib/api-notificacoes"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Send, Loader2 } from "lucide-react"

export type FuncionarioNotificacaoPick = { id: number; nome: string; cargo?: string }

interface NotificarFuncionariosSelecionadosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  funcionarios: FuncionarioNotificacaoPick[]
  onEnviado?: () => void
}

export function NotificarFuncionariosSelecionadosDialog({
  open,
  onOpenChange,
  funcionarios,
  onEnviado,
}: NotificarFuncionariosSelecionadosDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const tiposPermitidos = obterTiposPermitidosPorRole(user?.role)
  const tipoInicial = (tiposPermitidos[0] || "info") as NotificationType

  const [titulo, setTitulo] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [tipo, setTipo] = useState<NotificationType>(tipoInicial)

  useEffect(() => {
    if (!tiposPermitidos.includes(tipo)) {
      setTipo(tipoInicial)
    }
  }, [tiposPermitidos, tipo, tipoInicial])

  useEffect(() => {
    if (open) {
      setTitulo("")
      setMensagem("")
      setTipo(tipoInicial)
    }
  }, [open, tipoInicial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (funcionarios.length === 0) {
      toast({
        title: "Nenhum destinatário",
        description: "Selecione ao menos um funcionário na lista.",
        variant: "destructive",
      })
      return
    }
    if (!titulo.trim() || !mensagem.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título e mensagem.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await NotificacoesAPI.criar({
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        tipo,
        destinatarios: funcionarios.map((f) => ({
          tipo: "funcionario" as const,
          id: String(f.id),
          nome: f.nome,
          info: f.cargo || "",
        })),
        remetente: localStorage.getItem("userName") || "Sistema",
      })

      toast({
        title: "Notificações enviadas",
        description: `Mensagem enviada para ${funcionarios.length} colaborador(es).`,
      })
      onOpenChange(false)
      onEnviado?.()
    } catch (error: unknown) {
      const data =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string; details?: string } } }).response
              ?.data
          : undefined
      const msg = data?.message || data?.details || "Não foi possível enviar."
      toast({
        title: "Erro ao enviar",
        description: msg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Notificar colaboradores selecionados</DialogTitle>
          <DialogDescription>
            A mesma mensagem será enviada para {funcionarios.length} pessoa(s) com usuário vinculado
            ao cadastro de funcionário.
          </DialogDescription>
        </DialogHeader>

        {funcionarios.length > 0 && (
          <ul className="text-sm text-muted-foreground max-h-24 overflow-y-auto border rounded-md p-2 space-y-0.5">
            {funcionarios.map((f) => (
              <li key={f.id}>
                <span className="font-medium text-foreground">{f.nome}</span>
                {f.cargo ? <span className="text-muted-foreground"> — {f.cargo}</span> : null}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as NotificationType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposPermitidos.includes("info") && (
                  <SelectItem value="info">Informação</SelectItem>
                )}
                {tiposPermitidos.includes("success") && (
                  <SelectItem value="success">Sucesso</SelectItem>
                )}
                {tiposPermitidos.includes("warning") && (
                  <SelectItem value="warning">Aviso</SelectItem>
                )}
                {tiposPermitidos.includes("error") && <SelectItem value="error">Erro</SelectItem>}
                {tiposPermitidos.includes("grua") && <SelectItem value="grua">Gruas</SelectItem>}
                {tiposPermitidos.includes("obra") && <SelectItem value="obra">Obras</SelectItem>}
                {tiposPermitidos.includes("financeiro") && (
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                )}
                {tiposPermitidos.includes("rh") && <SelectItem value="rh">RH</SelectItem>}
                {tiposPermitidos.includes("estoque") && (
                  <SelectItem value="estoque">Estoque</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rh-notif-titulo">Título *</Label>
            <Input
              id="rh-notif-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Assunto da notificação"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rh-notif-msg">Mensagem *</Label>
            <Textarea
              id="rh-notif-msg"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Texto que os colaboradores verão no painel"
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || funcionarios.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para {funcionarios.length}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
