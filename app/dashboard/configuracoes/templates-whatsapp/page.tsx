"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { ArrowLeft, Eye, Loader2, MessageCircle, Save, Send } from "lucide-react"

type WhatsAppTemplateRow = {
  id: number
  tipo: string
  nome: string
  texto_template: string
  variaveis: string[] | unknown
  ativo: boolean
  updated_at: string
}

function normalizeVars(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map(String)
}

function renderLocalPreview(text: string) {
  return String(text || "").replace(/\|/g, "\n")
}

function normalizeTestPhone(raw: string) {
  const digits = String(raw || "").replace(/\D/g, "")
  if (!digits) return ""
  if (digits.startsWith("55")) return digits
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  return digits
}

export default function TemplatesWhatsAppPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewText, setPreviewText] = useState("")
  const [testOpen, setTestOpen] = useState(false)
  const [testNumber, setTestNumber] = useState("")
  const [sendingTest, setSendingTest] = useState(false)
  const [templates, setTemplates] = useState<WhatsAppTemplateRow[]>([])
  const [selected, setSelected] = useState<WhatsAppTemplateRow | null>(null)

  const vars = useMemo(() => normalizeVars(selected?.variaveis), [selected?.variaveis])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const res = await api.get("/whatsapp/templates")
      const rows: WhatsAppTemplateRow[] = res.data?.data || []
      setTemplates(rows)
      setSelected((prev) => {
        if (!rows.length) return null
        if (prev && rows.some((r) => r.tipo === prev.tipo)) {
          return rows.find((r) => r.tipo === prev.tipo) ?? rows[0]
        }
        return rows[0]
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os templates de WhatsApp.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const saveTemplate = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await api.put(`/whatsapp/templates/${encodeURIComponent(selected.tipo)}`, {
        nome: selected.nome,
        texto_template: selected.texto_template,
        ativo: selected.ativo,
      })
      toast({ title: "Salvo", description: "Template de WhatsApp atualizado." })
      await loadTemplates()
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Falha ao salvar o template.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const openPreview = async () => {
    if (!selected) return
    setPreviewOpen(true)
    setPreviewLoading(true)
    setPreviewText("")
    try {
      const res = await api.post(`/whatsapp/templates/${encodeURIComponent(selected.tipo)}/preview`, {
        texto_template: selected.texto_template,
      })
      setPreviewText(res.data?.data?.mensagem || "")
    } catch (error) {
      console.error(error)
      setPreviewOpen(false)
      toast({
        title: "Erro",
        description: "Não foi possível gerar o preview.",
        variant: "destructive",
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  const sendTestNotification = async () => {
    if (!selected) return
    const numberRaw = testNumber.trim()
    if (!numberRaw) {
      toast({
        title: "Número obrigatório",
        description: "Informe um número para enviar o teste.",
        variant: "destructive",
      })
      return
    }
    const number = normalizeTestPhone(numberRaw)

    setSendingTest(true)
    try {
      // Usa o preview do backend para enviar mensagem já renderizada com dados fictícios
      const previewRes = await api.post(`/whatsapp/templates/${encodeURIComponent(selected.tipo)}/preview`, {
        texto_template: selected.texto_template,
      })
      const mensagem = previewRes.data?.data?.mensagem || renderLocalPreview(selected.texto_template)

      await api.post("/whatsapp/test", {
        number,
        text: mensagem,
      })

      toast({
        title: "Teste enviado",
        description: `Notificação enviada para ${numberRaw}.`,
      })
      setTestOpen(false)
      setTestNumber("")
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar a notificação de teste.",
        variant: "destructive",
      })
    } finally {
      setSendingTest(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const livePreview = renderLocalPreview(selected?.texto_template || "")

  return (
    <div className="p-5 md:p-8 w-full max-w-none space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/configuracoes/templates-email"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para templates de e-mail
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Templates de WhatsApp</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Edite os textos usados nos envios automáticos de WhatsApp.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        <Card className="md:col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Modelos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map((tpl) => (
              <Button
                key={tpl.tipo}
                variant={selected?.tipo === tpl.tipo ? "default" : "outline"}
                className="w-full justify-between gap-2"
                onClick={() => setSelected(tpl)}
              >
                <span className="truncate">{tpl.nome}</span>
                <MessageCircle className="h-4 w-4 shrink-0" />
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-8 lg:col-span-9">
          <CardHeader>
            <CardTitle>{selected?.nome || "Selecione um template"}</CardTitle>
            <CardDescription className="font-mono text-xs">{selected?.tipo}</CardDescription>
          </CardHeader>
          {selected ? (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={selected.nome}
                  onChange={(e) => setSelected({ ...selected, nome: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Template ativo</Label>
                <Switch
                  checked={selected.ativo}
                  onCheckedChange={(checked) => setSelected({ ...selected, ativo: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label>Variáveis disponíveis</Label>
                <div className="flex flex-wrap gap-2">
                  {vars.length ? (
                    vars.map((v) => (
                      <Badge key={v} variant="secondary" className="font-mono text-xs">
                        {`{{${v}}}`}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Sem variáveis listadas.</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Texto da mensagem</Label>
                <Textarea
                  rows={16}
                  className="font-mono text-xs"
                  value={selected.texto_template}
                  onChange={(e) => setSelected({ ...selected, texto_template: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Você pode usar <code>{`{{variavel}}`}</code> e também o caractere <code>|</code> para quebra de linha.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Preview rápido</Label>
                <div className="rounded-xl border bg-muted/30 p-3 md:p-4">
                  <div className="max-w-[420px] rounded-2xl bg-emerald-600 text-white px-4 py-3 whitespace-pre-wrap text-sm leading-relaxed shadow-sm">
                    {livePreview || "Digite o template para visualizar aqui."}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={openPreview}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button variant="outline" onClick={() => setTestOpen(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Testar notificação
                </Button>
                <Button onClick={saveTemplate} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar
                </Button>
              </div>
            </CardContent>
          ) : null}
        </Card>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview da mensagem</DialogTitle>
            <DialogDescription>Renderização com dados fictícios.</DialogDescription>
          </DialogHeader>
          {previewLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
              Gerando preview...
            </div>
          ) : (
            <pre className="whitespace-pre-wrap text-sm rounded-md border p-4 bg-muted/40">{previewText || "Sem conteúdo."}</pre>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Testar notificação</DialogTitle>
            <DialogDescription>
              Informe o número com DDD (e código do país, se necessário) para enviar um teste.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="whatsapp-test-number">Número WhatsApp</Label>
            <Input
              id="whatsapp-test-number"
              placeholder="81987440990"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Ex.: 81987440990 (o sistema adiciona 55 automaticamente)
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTestOpen(false)} disabled={sendingTest}>
              Cancelar
            </Button>
            <Button onClick={sendTestNotification} disabled={sendingTest}>
              {sendingTest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar teste
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
