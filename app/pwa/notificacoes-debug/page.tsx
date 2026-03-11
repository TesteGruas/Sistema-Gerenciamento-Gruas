"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellRing, Clock, Play, ShieldCheck } from "lucide-react"
import { pwaNotifications } from "@/lib/pwa-notifications"
import { useToast } from "@/hooks/use-toast"
import { STORAGE_KEY_NOTIFICACOES_LOCAIS } from "@/hooks/use-vencimentos-documentos"
import { ensurePushSubscription, triggerApiPushBroadcast } from "@/lib/pwa-push-subscription"

const TIPOS = [
  "info",
  "warning",
  "error",
  "success",
  "grua",
  "obra",
  "financeiro",
  "rh",
  "estoque"
] as const

export default function PWANotificacoesDebugPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const salvarNotificacaoLocal = (tipo: string) => {
    if (typeof window === "undefined") return

    const tipoLabel = tipo.toUpperCase()
    const item = {
      id: `local_debug_${tipo}_${Date.now()}`,
      titulo: `[DEBUG] ${tipoLabel}`,
      mensagem: `Notificação local de teste para o tipo ${tipo}.`,
      tipo,
      link: "/pwa/notificacoes",
      data: new Date().toISOString(),
      lida: false,
      local: true
    }

    const atuaisRaw = localStorage.getItem(STORAGE_KEY_NOTIFICACOES_LOCAIS)
    const atuais = atuaisRaw ? JSON.parse(atuaisRaw) : []
    const notificacoes = Array.isArray(atuais) ? atuais : []
    notificacoes.unshift(item)
    localStorage.setItem(STORAGE_KEY_NOTIFICACOES_LOCAIS, JSON.stringify(notificacoes))

    window.dispatchEvent(new CustomEvent("notificacoes-locais-atualizadas", {
      detail: { total: notificacoes.length }
    }))
  }

  const testarTipo = async (tipo: string) => {
    await pwaNotifications.sendDebugTypeNotification(tipo)
    salvarNotificacaoLocal(tipo)
  }

  const testarTodosOsTipos = async () => {
    await pwaNotifications.sendAllDebugNotifications()
    for (const tipo of TIPOS) {
      salvarNotificacaoLocal(tipo)
    }
  }

  const simularBroadcastApi = async () => {
    const sub = await ensurePushSubscription()
    if (!sub.success) {
      throw new Error(`Inscrição push necessária: ${sub.message}`)
    }

    const result = await triggerApiPushBroadcast({
      titulo: "[SIMULAÇÃO API] Aviso de almoço",
      mensagem: "Disparo de teste vindo da API para todos os usuários do app.",
      tipo: "warning",
      link: "/pwa/notificacoes"
    })

    if (!result.success) {
      throw new Error(result.message)
    }
  }

  const withLoading = async (key: string, fn: () => Promise<void>) => {
    setLoading(key)
    try {
      await fn()
      toast({
        title: "Teste executado",
        description: "Verifique a notificação no dispositivo."
      })
    } catch (error: any) {
      toast({
        title: "Erro ao testar notificação",
        description: error?.message || "Não foi possível executar o teste.",
        variant: "destructive"
      })
    } finally {
      setLoading(null)
    }
  }

  const solicitarPermissao = async () => {
    const permission = await pwaNotifications.requestPermission()
    if (permission === "granted") {
      const sub = await ensurePushSubscription()
      if (!sub.success) {
        toast({
          title: "Permissão concedida",
          description: `Push local ativo, mas inscrição no backend falhou: ${sub.message}`,
          variant: "destructive"
        })
      } else {
        toast({ title: "Permissão concedida", description: "Push habilitado e dispositivo inscrito no backend." })
      }
      await pwaNotifications.startBackgroundReminders()
      return
    }

    toast({
      title: "Permissão não concedida",
      description: "Ative as notificações no navegador para receber os lembretes.",
      variant: "destructive"
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Debug de Notificações</h1>
        <p className="text-gray-600">Teste push local, lembrete de almoço (11:30) e todos os tipos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Permissão atual:</span>
            <Badge variant={pwaNotifications.getPermission() === "granted" ? "default" : "secondary"}>
              {pwaNotifications.getPermission()}
            </Badge>
          </div>
          <Button
            onClick={() => withLoading("permission", solicitarPermissao)}
            disabled={loading !== null}
            className="w-full"
          >
            <Bell className="w-4 h-4 mr-2" />
            Solicitar / Revalidar Permissão
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Lembretes do Ponto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            onClick={() => withLoading("almoco", () => pwaNotifications.notifyLunchReminder(true))}
            disabled={loading !== null}
            className="w-full"
          >
            <BellRing className="w-4 h-4 mr-2" />
            Testar aviso de almoço agora
          </Button>
          <Button
            variant="outline"
            onClick={() => withLoading("fim-expediente", () => pwaNotifications.notifyEndOfDayReminder(true))}
            disabled={loading !== null}
            className="w-full"
          >
            <BellRing className="w-4 h-4 mr-2" />
            Testar aviso de fim do expediente
          </Button>
          <Button
            onClick={() => withLoading("agendar", () => pwaNotifications.startBackgroundReminders())}
            disabled={loading !== null}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            Ativar agendamento diário (11:30 / 18:00)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Tipos de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={() => withLoading("todos", testarTodosOsTipos)}
            disabled={loading !== null}
            className="w-full"
          >
            Disparar todos os tipos
          </Button>

          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map((tipo) => (
              <Button
                key={tipo}
                variant="outline"
                onClick={() => withLoading(tipo, () => testarTipo(tipo))}
                disabled={loading !== null}
                className="capitalize"
              >
                {tipo}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="w-5 h-5" />
            Simulação via API (origem servidor)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => withLoading("broadcast-api", simularBroadcastApi)}
            disabled={loading !== null}
            className="w-full"
          >
            Disparar broadcast push da API para todos
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
