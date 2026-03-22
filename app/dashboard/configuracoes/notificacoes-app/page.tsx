"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Smartphone, Send, Loader2, AlertTriangle } from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { usePermissions } from "@/hooks/use-permissions"

type AlvoDebug = "eu" | "usuario" | "todos_inscritos"

export default function NotificacoesAppDebugPage() {
  const { toast } = useToast()
  const { hasPermission, loading: permLoading } = usePermissions()
  const pode = hasPermission("usuarios:gerenciar")

  const [titulo, setTitulo] = useState("Teste push (debug)")
  const [mensagem, setMensagem] = useState(
    "Mensagem de teste disparada pelo servidor."
  )
  const [link, setLink] = useState("/pwa/notificacoes")
  const [alvo, setAlvo] = useState<AlvoDebug>("eu")
  const [usuarioId, setUsuarioId] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [ultimaResposta, setUltimaResposta] = useState<unknown>(null)

  const enviar = async () => {
    if (!pode) return
    setEnviando(true)
    setUltimaResposta(null)
    try {
      const body: Record<string, unknown> = {
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        alvo,
      }
      const l = link.trim()
      if (l) body.link = l
      if (alvo === "usuario") {
        body.usuario_id = usuarioId.trim()
      }

      const { data } = await api.post("/push/debug-send", body, {
        timeout: 120_000,
      })

      setUltimaResposta(data)

      if (data?.success) {
        const d = data?.data as
          | {
              push_enviados?: number
              push_falhas?: number
              push_total_subscriptions?: number
              falhas_detalhe?: Array<{ message?: string; bodyPreview?: string }>
              dicas?: string[]
            }
          | undefined
        const enviados = d?.push_enviados ?? 0
        const falhas = d?.push_falhas ?? 0
        const primeiroErro = d?.falhas_detalhe?.[0]
        const trechoErro =
          primeiroErro?.message ||
          (primeiroErro?.bodyPreview
            ? String(primeiroErro.bodyPreview).slice(0, 160)
            : null)

        if (falhas > 0 && enviados === 0) {
          toast({
            title: "Push não entregue",
            description: trechoErro
              ? `${trechoErro}${d?.dicas?.[0] ? ` — ${d.dicas[0]}` : ""}`
              : (d?.dicas?.[0] ??
                "Veja o JSON abaixo (falhas_detalhe) para o motivo exato."),
            variant: "destructive",
          })
        } else {
          toast({
            title: enviados > 0 ? "Push enviado" : "Processado",
            description:
              d != null
                ? `${enviados} entregue(s), ${falhas} falha(s), ${d.push_total_subscriptions ?? 0} subscription(s).`
                : ((data?.message as string) || "OK"),
          })
        }
      } else {
        toast({
          title: "Falha",
          description: (data?.message as string) || "Erro ao enviar push",
          variant: "destructive",
        })
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown }; message?: string }
      setUltimaResposta(err?.response?.data ?? { error: err?.message })
      toast({
        title: "Erro na requisição",
        description:
          (err?.response?.data as { message?: string })?.message ||
          err?.message ||
          "Falha de rede ou servidor",
        variant: "destructive",
      })
    } finally {
      setEnviando(false)
    }
  }

  if (permLoading) {
    return (
      <div className="container max-w-3xl py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!pode) {
    return (
      <div className="container max-w-3xl py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acesso negado</AlertTitle>
          <AlertDescription>
            Apenas quem tem permissão de gerenciar usuários (admin de sistema)
            pode usar esta ferramenta de debug de push.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Smartphone className="h-7 w-7" />
          Notificações app (debug)
        </h1>
        <p className="text-muted-foreground mt-1">
          Dispara Web Push pelo backend, no mesmo fluxo usado pelo PWA — sem
          gravar linhas na tabela de notificações nem broadcast em tempo real.
        </p>
      </div>

      <Alert>
        <AlertTitle>Como testar no celular</AlertTitle>
        <AlertDescription>
          Abra o PWA no aparelho, faça login, aceite permissão de notificações e
          mantenha o app em segundo plano. Use o alvo &quot;Meus
          dispositivos&quot; com o mesmo usuário logado no painel, ou informe o{" "}
          <code className="text-xs bg-muted px-1 rounded">usuarios.id</code> de
          quem tem subscription ativa.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Enviar push de teste</CardTitle>
          <CardDescription>
            Escolha o escopo e o texto. &quot;Todos os dispositivos
            inscritos&quot; percorre todas as subscriptions ativas — use com
            cuidado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alvo">Alvo</Label>
            <Select
              value={alvo}
              onValueChange={(v) => setAlvo(v as AlvoDebug)}
              disabled={enviando}
            >
              <SelectTrigger id="alvo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eu">Meus dispositivos (usuário logado)</SelectItem>
                <SelectItem value="usuario">Usuário por ID</SelectItem>
                <SelectItem value="todos_inscritos">
                  Todos os dispositivos inscritos
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {alvo === "usuario" && (
            <div className="space-y-2">
              <Label htmlFor="usuario_id">ID do usuário (usuarios.id)</Label>
              <Input
                id="usuario_id"
                inputMode="numeric"
                placeholder="Ex.: 181"
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                disabled={enviando}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={enviando}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea
              id="mensagem"
              rows={3}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              disabled={enviando}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">URL ao tocar (opcional)</Label>
            <Input
              id="link"
              placeholder="/pwa/notificacoes"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={enviando}
            />
          </div>

          <Button onClick={enviar} disabled={enviando}>
            {enviando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Disparar push
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {ultimaResposta != null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Última resposta da API</CardTitle>
            <CardDescription>
              <code className="text-xs">POST /api/push/debug-send</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-80 overflow-y-auto">
              {JSON.stringify(ultimaResposta, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
