"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, Pencil, LayoutTemplate, Sparkles, BookOpen } from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  EMAIL_TEMPLATES_CATALOG,
  EMAIL_CATALOG_CATEGORIES,
  type EmailTemplateCatalogItem,
} from "@/lib/email-templates-catalog"

interface EmailTemplateRow {
  id: number
  tipo: string
  nome: string
  assunto: string
  ativo: boolean
  updated_at: string
}

export default function TemplatesEmailOverviewPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [novoTipo, setNovoTipo] = useState("")
  const [novoNome, setNovoNome] = useState("")
  const [cloneFrom, setCloneFrom] = useState<string>("")

  const load = async () => {
    try {
      const res = await api.get("/email-config/templates")
      if (res.data?.data) setTemplates(res.data.data)
    } catch (e) {
      console.error(e)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os templates.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const resetCreateForm = () => {
    setNovoTipo("")
    setNovoNome("")
    setCloneFrom("")
  }

  const criarTemplate = async () => {
    const tipo = novoTipo.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
    if (tipo.length < 3) {
      toast({
        title: "Identificador inválido",
        description:
          "Use pelo menos 3 caracteres: letras minúsculas, números e sublinhado (ex.: cobranca_mensal).",
        variant: "destructive",
      })
      return
    }
    if (!novoNome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe um nome para exibição.",
        variant: "destructive",
      })
      return
    }
    setCreating(true)
    try {
      const body: Record<string, unknown> = {
        tipo,
        nome: novoNome.trim(),
      }
      if (cloneFrom) body.clone_from = cloneFrom

      await api.post("/email-config/templates", body)
      toast({ title: "Template criado", description: "Redirecionando para o editor." })
      setCreateOpen(false)
      resetCreateForm()
      await load()
      router.push(
        `/dashboard/configuracoes/templates-email/edit/${encodeURIComponent(tipo)}`
      )
      router.refresh()
    } catch (e: unknown) {
      console.error(e)
      const err = e as { response?: { data?: { error?: string } } }
      toast({
        title: "Não foi possível criar",
        description:
          err.response?.data?.error ||
          "Verifique se o identificador já existe ou os dados enviados.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const catalogByCategory = EMAIL_TEMPLATES_CATALOG.reduce<
    Record<string, EmailTemplateCatalogItem[]>
  >((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = []
    acc[item.categoria].push(item)
    return acc
  }, {})

  const categoryOrder: EmailTemplateCatalogItem["categoria"][] = [
    "medicao",
    "conta",
    "ponto",
    "sistema",
  ]

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Configurações
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Templates de e-mail
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Edite modelos HTML e assuntos. A aba &quot;Onde é usado&quot; descreve cada
            fluxo (medição, nova obra, ponto, conta, etc.) conforme o código atual.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Novo template
        </Button>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="templates" className="gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="uso" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Onde é usado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6 mt-0">
          <div className="grid gap-4 sm:grid-cols-2">
            {templates.map((t) => (
              <Link
                key={t.tipo}
                href={`/dashboard/configuracoes/templates-email/edit/${encodeURIComponent(t.tipo)}`}
                className="group block rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/30"
              >
                <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                          <LayoutTemplate className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                            {t.nome}
                          </CardTitle>
                          <CardDescription className="font-mono text-xs truncate">
                            {t.tipo}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={t.ativo ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {t.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="line-clamp-1">
                      {t.assunto || "Sem assunto definido"}
                    </span>
                    <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {templates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <LayoutTemplate className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">Nenhum template cadastrado</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
                  Crie um novo modelo ou verifique se as migrações do banco foram
                  aplicadas.
                </p>
                <Button variant="outline" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro template
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="uso" className="space-y-8 mt-0">
          <p className="text-sm text-muted-foreground">
            Referência alinhada ao backend: cada item indica o identificador
            (<code className="text-xs bg-muted px-1 rounded">tipo</code>) e onde o
            envio é disparado.
          </p>
          {categoryOrder.map((cat) => {
            const items = catalogByCategory[cat]
            if (!items?.length) return null
            return (
              <div key={cat} className="space-y-3">
                <h2 className="text-lg font-semibold border-b pb-2">
                  {EMAIL_CATALOG_CATEGORIES[cat]}
                </h2>
                <div className="space-y-3">
                  {items.map((item) => {
                    const row = templates.find((x) => x.tipo === item.tipo)
                    return (
                      <Card key={item.tipo}>
                        <CardHeader className="pb-2">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div>
                              <CardTitle className="text-base">{item.nome}</CardTitle>
                              <CardDescription className="font-mono text-xs mt-1">
                                {item.tipo}
                              </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2 shrink-0">
                              {item.editavelNoPainel && item.tipo ? (
                                row ? (
                                  <Button variant="outline" size="sm" asChild>
                                    <Link
                                      href={`/dashboard/configuracoes/templates-email/edit/${encodeURIComponent(item.tipo)}`}
                                    >
                                      Editar template
                                    </Link>
                                  </Button>
                                ) : (
                                  <Badge variant="outline" className="text-amber-700 border-amber-300">
                                    Migração / registro ausente
                                  </Badge>
                                )
                              ) : (
                                <Badge variant="secondary">Sem template no painel</Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p className="text-muted-foreground">{item.gatilho}</p>
                          <div>
                            <p className="text-xs font-medium text-foreground mb-1">
                              Onde (código)
                            </p>
                            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                              {item.onde.map((path) => (
                                <li key={path}>
                                  <code className="break-all">{path}</code>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </TabsContent>
      </Tabs>

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o)
          if (!o) resetCreateForm()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo template</DialogTitle>
            <DialogDescription>
              O identificador é único e usado internamente (não pode ser alterado
              depois). Opcionalmente copie HTML e assunto de um template existente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="novo-tipo">Identificador (tipo)</Label>
              <Input
                id="novo-tipo"
                placeholder="ex.: relatorio_obra"
                value={novoTipo}
                onChange={(e) => setNovoTipo(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas, números e _ (mín. 3 caracteres).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="novo-nome">Nome para exibição</Label>
              <Input
                id="novo-nome"
                placeholder="ex.: Relatório da obra"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Copiar de (opcional)</Label>
              <Select
                value={cloneFrom || "__none__"}
                onValueChange={(v) =>
                  setCloneFrom(v === "__none__" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Começar do zero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Começar do zero</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.tipo} value={t.tipo}>
                      {t.nome} ({t.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={criarTemplate} disabled={creating}>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Criar e editar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
