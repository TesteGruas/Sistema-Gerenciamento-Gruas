"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Loader2, Plus, Search, Trash2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  estoqueAPI,
  type Categoria,
  type EstoqueClassificacao,
  type EstoqueSubcategoriaAtivo,
} from "@/lib/api-estoque"

type StatusTaxonomia = "Ativa" | "Inativa"

type ItemBase = {
  id: number
  nome: string
  descricao?: string | null
  status?: StatusTaxonomia
  codigo?: string
  exige_subcategoria?: boolean
}

type Modo = "categoria" | "classificacao"

type SavePayload = {
  nome: string
  codigo?: string
  descricao?: string
  status: StatusTaxonomia
  exige_subcategoria?: boolean
}

interface EstoqueTaxonomiaManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modo: Modo
  onChanged?: () => void
}

function FormularioCompacto({
  item,
  comCodigo,
  comExigeSubcategoria,
  saving,
  onCancel,
  onSave,
}: {
  item: ItemBase | null
  comCodigo?: boolean
  comExigeSubcategoria?: boolean
  saving: boolean
  onCancel: () => void
  onSave: (dados: SavePayload) => Promise<void>
}) {
  const [nome, setNome] = useState(item?.nome || "")
  const [codigo, setCodigo] = useState(item?.codigo || "")
  const [descricao, setDescricao] = useState(item?.descricao || "")
  const [status, setStatus] = useState<StatusTaxonomia>(item?.status || "Ativa")
  const [exigeSubcategoria, setExigeSubcategoria] = useState(Boolean(item?.exige_subcategoria))

  useEffect(() => {
    setNome(item?.nome || "")
    setCodigo(item?.codigo || "")
    setDescricao(item?.descricao || "")
    setStatus(item?.status || "Ativa")
    setExigeSubcategoria(Boolean(item?.exige_subcategoria))
  }, [item])

  return (
    <form
      className="rounded-lg border bg-background p-3 shadow-sm"
      onSubmit={async (e) => {
        e.preventDefault()
        await onSave({
          nome: nome.trim(),
          codigo: comCodigo ? codigo.trim() || undefined : undefined,
          descricao: descricao.trim() || undefined,
          status,
          exige_subcategoria: comExigeSubcategoria ? exigeSubcategoria : undefined,
        })
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{item ? "Editar registro" : "Novo registro"}</p>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Nome</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome"
              required
              autoFocus
              className="h-9"
            />
          </div>
          {comCodigo && (
            <div className="w-full space-y-1 sm:w-40">
              <Label className="text-xs text-muted-foreground">Código</Label>
              <Input
                value={codigo}
                onChange={(e) =>
                  setCodigo(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))
                }
                placeholder="auto"
                className="h-9 font-mono text-xs"
              />
            </div>
          )}
          <div className="w-full space-y-1 sm:w-32">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusTaxonomia)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativa">Ativa</SelectItem>
                <SelectItem value="Inativa">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="h-9 shrink-0" disabled={saving || !nome.trim()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {item ? "Salvar" : "Adicionar"}
          </Button>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Descrição</Label>
          <Textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Opcional"
            rows={1}
            className="min-h-[36px] resize-y"
          />
        </div>

        {comExigeSubcategoria && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={exigeSubcategoria}
              onCheckedChange={(v) => setExigeSubcategoria(Boolean(v))}
            />
            Exige subcategoria do ativo
          </label>
        )}
      </div>
    </form>
  )
}

function PainelLista({
  tituloSingular,
  items,
  loading,
  busca,
  onBuscaChange,
  comCodigo,
  comExigeSubcategoria,
  formAberto,
  editing,
  saving,
  onAbrirNovo,
  onEdit,
  onDelete,
  onCancelForm,
  onSave,
}: {
  tituloSingular: string
  items: ItemBase[]
  loading: boolean
  busca: string
  onBuscaChange: (v: string) => void
  comCodigo?: boolean
  comExigeSubcategoria?: boolean
  formAberto: boolean
  editing: ItemBase | null
  saving: boolean
  onAbrirNovo: () => void
  onEdit: (item: ItemBase) => void
  onDelete: (item: ItemBase) => void
  onCancelForm: () => void
  onSave: (dados: SavePayload) => Promise<void>
}) {
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.nome.toLowerCase().includes(q) ||
        (i.codigo || "").toLowerCase().includes(q) ||
        (i.descricao || "").toLowerCase().includes(q)
    )
  }, [items, busca])

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            placeholder={`Buscar ${tituloSingular}...`}
            className="h-9 pl-8"
          />
        </div>
        {!formAberto && (
          <Button type="button" size="sm" className="h-9 shrink-0" onClick={onAbrirNovo}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nova {tituloSingular}
          </Button>
        )}
      </div>

      {formAberto && (
        <FormularioCompacto
          item={editing}
          comCodigo={comCodigo}
          comExigeSubcategoria={comExigeSubcategoria}
          saving={saving}
          onCancel={onCancelForm}
          onSave={onSave}
        />
      )}

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-muted-foreground">
            {busca.trim()
              ? "Nenhum resultado para a busca."
              : `Nenhuma ${tituloSingular} cadastrada. Clique em «Nova ${tituloSingular}» para começar.`}
          </div>
        ) : (
          <div className="max-h-[min(52vh,420px)] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead>Nome</TableHead>
                  {comCodigo && <TableHead className="w-[120px]">Código</TableHead>}
                  {comExigeSubcategoria && <TableHead className="w-[88px]">Subcat.</TableHead>}
                  <TableHead className="w-[90px]">Status</TableHead>
                  <TableHead className="w-[88px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((item) => (
                  <TableRow
                    key={item.id}
                    className={editing?.id === item.id ? "bg-muted/40" : undefined}
                  >
                    <TableCell className="align-middle">
                      <div className="font-medium leading-tight">{item.nome}</div>
                      {item.descricao ? (
                        <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {item.descricao}
                        </div>
                      ) : null}
                    </TableCell>
                    {comCodigo && (
                      <TableCell className="align-middle font-mono text-xs text-muted-foreground">
                        {item.codigo}
                      </TableCell>
                    )}
                    {comExigeSubcategoria && (
                      <TableCell className="align-middle text-sm text-muted-foreground">
                        {item.exige_subcategoria ? "Sim" : "Não"}
                      </TableCell>
                    )}
                    <TableCell className="align-middle">
                      <Badge
                        variant="outline"
                        className={
                          item.status === "Inativa"
                            ? "border-muted-foreground/30 text-muted-foreground"
                            : "border-emerald-600/30 bg-emerald-50 text-emerald-700"
                        }
                      >
                        {item.status || "Ativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-middle text-right">
                      <div className="inline-flex items-center gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {!loading && items.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtrados.length === items.length
            ? `${items.length} registro${items.length === 1 ? "" : "s"}`
            : `${filtrados.length} de ${items.length} registros`}
        </p>
      )}
    </div>
  )
}

export function EstoqueTaxonomiaManagerDialog({
  open,
  onOpenChange,
  modo,
  onChanged,
}: EstoqueTaxonomiaManagerDialogProps) {
  const { toast } = useToast()
  const [tab, setTab] = useState<"classificacoes" | "subcategorias">("classificacoes")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [classificacoes, setClassificacoes] = useState<EstoqueClassificacao[]>([])
  const [subcategorias, setSubcategorias] = useState<EstoqueSubcategoriaAtivo[]>([])
  const [editing, setEditing] = useState<ItemBase | null>(null)
  const [formAberto, setFormAberto] = useState(false)
  const [busca, setBusca] = useState("")

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      if (modo === "categoria") {
        const res = await estoqueAPI.listarCategorias({ limit: 500 })
        setCategorias(res.data || [])
      } else {
        const [cls, sub] = await Promise.all([
          estoqueAPI.listarClassificacoes(),
          estoqueAPI.listarSubcategoriasAtivo(),
        ])
        setClassificacoes(cls.data || [])
        setSubcategorias(sub.data || [])
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao carregar registros",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [modo, toast])

  useEffect(() => {
    if (!open) {
      setEditing(null)
      setFormAberto(false)
      setBusca("")
      return
    }
    setTab("classificacoes")
    setEditing(null)
    setFormAberto(false)
    setBusca("")
    void carregar()
  }, [open, carregar])

  const fecharForm = () => {
    setEditing(null)
    setFormAberto(false)
  }

  const abrirNovo = () => {
    setEditing(null)
    setFormAberto(true)
  }

  const abrirEdicao = (item: ItemBase) => {
    setEditing(item)
    setFormAberto(true)
  }

  const notifyChanged = () => onChanged?.()

  const handleDelete = async (tipo: "categoria" | "classificacao" | "subcategoria", item: ItemBase) => {
    if (!window.confirm(`Excluir "${item.nome}"? Esta ação não pode ser desfeita.`)) return
    try {
      if (tipo === "categoria") await estoqueAPI.excluirCategoria(item.id)
      else if (tipo === "classificacao") await estoqueAPI.excluirClassificacao(item.id)
      else await estoqueAPI.excluirSubcategoriaAtivo(item.id)

      toast({ title: "Sucesso", description: "Registro excluído" })
      if (editing?.id === item.id) fecharForm()
      await carregar()
      notifyChanged()
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível excluir",
        variant: "destructive",
      })
    }
  }

  const title =
    modo === "categoria" ? "Gerenciar Categorias" : "Gerenciar Classificações e Subcategorias"
  const description =
    modo === "categoria"
      ? "Liste, busque e mantenha as categorias dos produtos."
      : "Classificações do item e subcategorias do ativo usadas no cadastro."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-4 overflow-hidden">
        <DialogHeader className="shrink-0 space-y-1">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {modo === "categoria" ? (
          <PainelLista
            tituloSingular="categoria"
            items={categorias}
            loading={loading}
            busca={busca}
            onBuscaChange={setBusca}
            formAberto={formAberto}
            editing={editing}
            saving={saving}
            onAbrirNovo={abrirNovo}
            onEdit={abrirEdicao}
            onDelete={(item) => handleDelete("categoria", item)}
            onCancelForm={fecharForm}
            onSave={async (dados) => {
              setSaving(true)
              try {
                if (editing) {
                  await estoqueAPI.atualizarCategoria(editing.id, {
                    nome: dados.nome,
                    descricao: dados.descricao,
                    status: dados.status,
                  })
                  toast({ title: "Sucesso", description: "Categoria atualizada" })
                } else {
                  await estoqueAPI.criarCategoria({
                    nome: dados.nome,
                    descricao: dados.descricao,
                    status: dados.status,
                  })
                  toast({ title: "Sucesso", description: "Categoria criada" })
                }
                fecharForm()
                await carregar()
                notifyChanged()
              } catch (error) {
                toast({
                  title: "Erro",
                  description: error instanceof Error ? error.message : "Falha ao salvar categoria",
                  variant: "destructive",
                })
              } finally {
                setSaving(false)
              }
            }}
          />
        ) : (
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as "classificacoes" | "subcategorias")
              fecharForm()
              setBusca("")
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList className="grid w-full shrink-0 grid-cols-2">
              <TabsTrigger value="classificacoes">Classificações</TabsTrigger>
              <TabsTrigger value="subcategorias">Subcategorias</TabsTrigger>
            </TabsList>

            <TabsContent value="classificacoes" className="mt-3 min-h-0 flex-1 data-[state=inactive]:hidden">
              <PainelLista
                tituloSingular="classificação"
                items={classificacoes}
                loading={loading}
                busca={busca}
                onBuscaChange={setBusca}
                comCodigo
                comExigeSubcategoria
                formAberto={formAberto}
                editing={editing}
                saving={saving}
                onAbrirNovo={abrirNovo}
                onEdit={abrirEdicao}
                onDelete={(item) => handleDelete("classificacao", item)}
                onCancelForm={fecharForm}
                onSave={async (dados) => {
                  setSaving(true)
                  try {
                    const payload = {
                      nome: dados.nome,
                      codigo: dados.codigo,
                      descricao: dados.descricao,
                      status: dados.status,
                      exige_subcategoria: dados.exige_subcategoria,
                    }
                    if (editing) {
                      await estoqueAPI.atualizarClassificacao(editing.id, payload)
                      toast({ title: "Sucesso", description: "Classificação atualizada" })
                    } else {
                      await estoqueAPI.criarClassificacao(payload)
                      toast({ title: "Sucesso", description: "Classificação criada" })
                    }
                    fecharForm()
                    await carregar()
                    notifyChanged()
                  } catch (error) {
                    toast({
                      title: "Erro",
                      description:
                        error instanceof Error ? error.message : "Falha ao salvar classificação",
                      variant: "destructive",
                    })
                  } finally {
                    setSaving(false)
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="subcategorias" className="mt-3 min-h-0 flex-1 data-[state=inactive]:hidden">
              <PainelLista
                tituloSingular="subcategoria"
                items={subcategorias}
                loading={loading}
                busca={busca}
                onBuscaChange={setBusca}
                comCodigo
                formAberto={formAberto}
                editing={editing}
                saving={saving}
                onAbrirNovo={abrirNovo}
                onEdit={abrirEdicao}
                onDelete={(item) => handleDelete("subcategoria", item)}
                onCancelForm={fecharForm}
                onSave={async (dados) => {
                  setSaving(true)
                  try {
                    const payload = {
                      nome: dados.nome,
                      codigo: dados.codigo,
                      descricao: dados.descricao,
                      status: dados.status,
                    }
                    if (editing) {
                      await estoqueAPI.atualizarSubcategoriaAtivo(editing.id, payload)
                      toast({ title: "Sucesso", description: "Subcategoria atualizada" })
                    } else {
                      await estoqueAPI.criarSubcategoriaAtivo(payload)
                      toast({ title: "Sucesso", description: "Subcategoria criada" })
                    }
                    fecharForm()
                    await carregar()
                    notifyChanged()
                  } catch (error) {
                    toast({
                      title: "Erro",
                      description:
                        error instanceof Error ? error.message : "Falha ao salvar subcategoria",
                      variant: "destructive",
                    })
                  } finally {
                    setSaving(false)
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
