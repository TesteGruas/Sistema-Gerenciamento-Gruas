"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Save, Send, Mail, Eye, ArrowLeft } from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface EmailTemplateRow {
  id: number
  tipo: string
  nome: string
  assunto: string
  html_template: string
  variaveis: string[] | unknown
  ativo: boolean
  updated_at: string
}

function normalizeVariaveis(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  return []
}

export default function TemplateEditPage() {
  const params = useParams()
  const rawTipo = params?.tipo
  const tipo =
    typeof rawTipo === "string"
      ? rawTipo
      : Array.isArray(rawTipo)
        ? rawTipo[0]
        : ""

  const { toast } = useToast()
  const [template, setTemplate] = useState<EmailTemplateRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [sendingTest, setSendingTest] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewAssunto, setPreviewAssunto] = useState("")
  const [previewHtml, setPreviewHtml] = useState("")

  useEffect(() => {
    if (!tipo) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get(
          `/email-config/templates/${encodeURIComponent(tipo)}`
        )
        if (!cancelled && res.data?.data) {
          setTemplate(res.data.data)
        }
      } catch (e: unknown) {
        console.error(e)
        toast({
          title: "Erro",
          description: "Não foi possível carregar o template.",
          variant: "destructive",
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tipo])

  const save = async () => {
    if (!template) return
    setSaving(true)
    try {
      await api.put(`/email-config/templates/${encodeURIComponent(tipo)}`, {
        assunto: template.assunto,
        html_template: template.html_template,
        ativo: template.ativo,
      })
      toast({ title: "Salvo", description: "Template atualizado." })
      const res = await api.get(
        `/email-config/templates/${encodeURIComponent(tipo)}`
      )
      if (res.data?.data) setTemplate(res.data.data)
    } catch (e: unknown) {
      console.error(e)
      toast({
        title: "Erro",
        description: "Falha ao salvar o template.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const sendTest = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "E-mail obrigatório",
        description: "Informe um destinatário para o teste.",
        variant: "destructive",
      })
      return
    }
    setSendingTest(true)
    try {
      await api.post("/email-config/test", {
        tipo,
        destinatario: testEmail.trim(),
        dados_teste: {},
      })
      toast({
        title: "Enviado",
        description: `E-mail de teste enviado para ${testEmail.trim()}`,
      })
    } catch (e: unknown) {
      console.error(e)
      toast({
        title: "Erro",
        description: "Não foi possível enviar o e-mail de teste.",
        variant: "destructive",
      })
    } finally {
      setSendingTest(false)
    }
  }

  const abrirPreview = async () => {
    if (!template) return
    setPreviewOpen(true)
    setPreviewLoading(true)
    setPreviewAssunto("")
    setPreviewHtml("")
    try {
      const res = await api.post(
        `/email-config/templates/${encodeURIComponent(tipo)}/preview`,
        {
          assunto: template.assunto,
          html_template: template.html_template,
        }
      )
      const data = res.data?.data
      if (data?.assunto != null) setPreviewAssunto(data.assunto)
      if (data?.html != null) setPreviewHtml(data.html)
    } catch (e: unknown) {
      console.error(e)
      setPreviewOpen(false)
      toast({
        title: "Erro",
        description: "Não foi possível gerar o preview do e-mail.",
        variant: "destructive",
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  if (!tipo) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Tipo de template inválido.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="p-6 md:p-8 max-w-3xl">
        <Link
          href="/dashboard/configuracoes/templates-email"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar à visão geral
        </Link>
        <p className="text-muted-foreground">
          Template não encontrado. Verifique o identificador na URL ou crie um
          novo na visão geral.
        </p>
      </div>
    )
  }

  const vars = normalizeVariaveis(template.variaveis)

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/configuracoes/templates-email"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Visão geral
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{template.nome}</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">
            {template.tipo}
          </p>
          <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
            Use{" "}
            <code className="text-xs bg-muted px-1 rounded">
              {`{{nome_da_variavel}}`}
            </code>{" "}
            no assunto e no HTML. O preview e o envio de teste usam dados fictícios
            gerados no servidor (para medição, o mesmo payload rico do fluxo real).
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="shrink-0 gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variáveis disponíveis</CardTitle>
          <CardDescription>
            Substituições aplicadas no servidor no momento do envio.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {vars.length ? (
            vars.map((v) => (
              <Badge key={v} variant="secondary" className="font-mono text-xs">
                {`{{${v}}}`}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              Nenhuma variável listada — edite no banco se necessário.
            </span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Conteúdo</CardTitle>
            <CardDescription className="mt-1.5">
              Pré-visualize com dados fictícios antes de salvar ou enviar teste.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            title="Pré-visualizar e-mail"
            onClick={abrirPreview}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Pré-visualizar e-mail</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label>Template ativo</Label>
              <p className="text-xs text-muted-foreground">
                Se desativado, o sistema pode usar um HTML padrão simples (conforme
                o tipo).
              </p>
            </div>
            <Switch
              checked={template.ativo}
              onCheckedChange={(checked) =>
                setTemplate({ ...template, ativo: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assunto">Assunto</Label>
            <Input
              id="assunto"
              value={template.assunto}
              onChange={(e) =>
                setTemplate({ ...template, assunto: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="html">HTML</Label>
            <Textarea
              id="html"
              className="font-mono text-xs min-h-[320px]"
              value={template.html_template}
              onChange={(e) =>
                setTemplate({ ...template, html_template: e.target.value })
              }
            />
          </div>

          <Button onClick={save} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar template
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Testar envio
          </CardTitle>
          <CardDescription>
            Envia um e-mail de teste com assunto e HTML renderizados com dados
            fictícios. O template precisa estar{" "}
            <strong>ativo</strong> (exceto o preview, que funciona mesmo inativo).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="teste-email">Destinatário</Label>
            <Input
              id="teste-email"
              type="email"
              placeholder="seu@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={sendTest}
            disabled={sendingTest || !template?.ativo}
          >
            {sendingTest ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar teste
          </Button>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
          <div className="p-6 pb-4 border-b shrink-0">
            <DialogHeader>
              <DialogTitle>Preview do e-mail</DialogTitle>
              <DialogDescription>
                {tipo === "medicao_enviada"
                  ? "Mesma lógica do envio real de medição (payload fictício completo)."
                  : "Dados fictícios de exemplo para cada variável do template."}
              </DialogDescription>
              {previewAssunto ? (
                <p className="text-sm text-left pt-2">
                  <span className="font-medium text-foreground">Assunto:</span>{" "}
                  <span className="break-all text-muted-foreground">
                    {previewAssunto}
                  </span>
                </p>
              ) : null}
            </DialogHeader>
          </div>
          <div className="flex-1 min-h-0 px-6 pb-6 overflow-hidden flex flex-col">
            {previewLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Gerando preview…</span>
              </div>
            ) : previewHtml ? (
              <iframe
                title="Preview do e-mail"
                className="w-full flex-1 min-h-[60vh] rounded-md border bg-white"
                sandbox="allow-same-origin"
                srcDoc={previewHtml}
              />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhum conteúdo para exibir.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
