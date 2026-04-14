"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import {
  Save,
  X,
  User,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2
} from "lucide-react"
import { ButtonLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { livroGruaApi } from "@/lib/api-livro-grua"
import { useCurrentUser } from "@/hooks/use-current-user"
import {
  criarChecklistItemCustomObra,
  listarChecklistItensCustomObra
} from "@/lib/api-obra-checklist-itens-custom"
import {
  CHECKLIST_LIVRO_GRUA_ITENS_FIXOS,
  normalizeChecklistItensExtras,
  novoIdItemExtra,
  type ChecklistItemExtra
} from "@/lib/checklist-livro-grua-shared"

interface ChecklistDiario {
  id?: number
  grua_id: string
  funcionario_id: number
  funcionario_nome?: string
  cargo?: string
  data: string
  cabos: boolean
  polias: boolean
  estrutura: boolean
  movimentos: boolean
  freios: boolean
  limitadores: boolean
  indicadores: boolean
  aterramento: boolean
  observacoes?: string
  created_at?: string
  checklist_itens_extras?: ChecklistItemExtra[]
}

interface LivroGruaChecklistDiarioProps {
  gruaId: string
  /** Quando informado, novos checklists carregam itens extras salvos da obra e novos itens ficam no catálogo da obra */
  obraId?: number
  checklist?: ChecklistDiario
  onSave?: (checklist: ChecklistDiario) => void
  onCancel?: () => void
  modoEdicao?: boolean
  modoVisualizacao?: boolean
}

export function LivroGruaChecklistDiario({
  gruaId,
  obraId,
  checklist,
  onSave,
  onCancel,
  modoEdicao = false,
  modoVisualizacao = false
}: LivroGruaChecklistDiarioProps) {
  const { toast } = useToast()
  const { user, loading: userLoading } = useCurrentUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extras, setExtras] = useState<ChecklistItemExtra[]>([])
  const [novoItemLabel, setNovoItemLabel] = useState("")
  const [carregandoCatalogoObra, setCarregandoCatalogoObra] = useState(false)
  const [dialogMarcarAberto, setDialogMarcarAberto] = useState(false)
  const [labelPendenteAdicionar, setLabelPendenteAdicionar] = useState<string | null>(null)
  const [salvandoItemObra, setSalvandoItemObra] = useState(false)

  const [formData, setFormData] = useState<ChecklistDiario>({
    grua_id: gruaId,
    funcionario_id: 0,
    data: new Date().toISOString().split("T")[0],
    cabos: false,
    polias: false,
    estrutura: false,
    movimentos: false,
    freios: false,
    limitadores: false,
    indicadores: false,
    aterramento: false,
    observacoes: ""
  })

  useEffect(() => {
    if (user && user.funcionario_id) {
      setFormData((prev) => ({
        ...prev,
        funcionario_id: user.funcionario_id || user.id
      }))
    }
  }, [user])

  useEffect(() => {
    if (checklist) {
      setFormData({
        id: checklist.id,
        grua_id: checklist.grua_id || gruaId,
        funcionario_id: checklist.funcionario_id,
        data: checklist.data,
        cabos: checklist.cabos === true || checklist.cabos === 1 || checklist.cabos === "1",
        polias: checklist.polias === true || checklist.polias === 1 || checklist.polias === "1",
        estrutura: checklist.estrutura === true || checklist.estrutura === 1 || checklist.estrutura === "1",
        movimentos: checklist.movimentos === true || checklist.movimentos === 1 || checklist.movimentos === "1",
        freios: checklist.freios === true || checklist.freios === 1 || checklist.freios === "1",
        limitadores: checklist.limitadores === true || checklist.limitadores === 1 || checklist.limitadores === "1",
        indicadores: checklist.indicadores === true || checklist.indicadores === 1 || checklist.indicadores === "1",
        aterramento: checklist.aterramento === true || checklist.aterramento === 1 || checklist.aterramento === "1",
        observacoes: checklist.observacoes || "",
        created_at: checklist.created_at
      })
    }
  }, [checklist, gruaId])

  useEffect(() => {
    let cancelled = false

    if (checklist) {
      setExtras(normalizeChecklistItensExtras(checklist.checklist_itens_extras))
      return
    }

    setExtras([])

    if (!obraId || modoVisualizacao) {
      return () => {
        cancelled = true
      }
    }

    ;(async () => {
      try {
        setCarregandoCatalogoObra(true)
        const res = await listarChecklistItensCustomObra(obraId, "checklist_diario")
        if (cancelled) return
        const rows = res.data || []
        setExtras(
          rows.map((r) => ({
            id: `obra_cat_${r.id}`,
            label: r.label,
            ok: false,
            obra_item_id: r.id
          }))
        )
      } catch (e) {
        console.error("Catálogo de checklist da obra:", e)
        if (!cancelled) {
          toast({
            title: "Itens da obra",
            description: "Não foi possível carregar os itens adicionais salvos desta obra.",
            variant: "destructive"
          })
        }
      } finally {
        if (!cancelled) setCarregandoCatalogoObra(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [checklist, obraId, modoVisualizacao])

  const solicitarAdicionarItemExtra = () => {
    const label = novoItemLabel.trim()
    if (!label) {
      toast({
        title: "Nome do item",
        description: "Digite o nome do item antes de adicionar.",
        variant: "destructive"
      })
      return
    }
    if (extras.length >= 40) {
      toast({
        title: "Limite",
        description: "Máximo de 40 itens adicionais por checklist.",
        variant: "destructive"
      })
      return
    }
    const duplicado = extras.some((e) => e.label.trim().toLowerCase() === label.toLowerCase())
    if (duplicado) {
      toast({
        title: "Item repetido",
        description: "Já existe um item com esse nome neste checklist.",
        variant: "destructive"
      })
      return
    }
    setLabelPendenteAdicionar(label)
    setDialogMarcarAberto(true)
  }

  const fecharDialogMarcar = () => {
    setDialogMarcarAberto(false)
    setLabelPendenteAdicionar(null)
  }

  const confirmarAdicionarItemExtra = async (marcar: boolean) => {
    const label = labelPendenteAdicionar
    if (!label) return

    fecharDialogMarcar()
    setNovoItemLabel("")

    try {
      if (obraId) {
        setSalvandoItemObra(true)
        const res = await criarChecklistItemCustomObra(obraId, label, "checklist_diario")
        if (!res.success || !res.data) {
          throw new Error("Resposta inválida ao salvar item na obra")
        }
        const row = res.data
        setExtras((prev) => [
          ...prev,
          {
            id: `obra_cat_${row.id}`,
            label: row.label,
            ok: marcar,
            obra_item_id: row.id
          }
        ])
        toast({
          title: marcar ? "Item adicionado e marcado" : "Item adicionado",
          description: obraId
            ? "O item foi vinculado a esta obra e aparecerá nos próximos checklists."
            : undefined
        })
      } else {
        setExtras((prev) => [...prev, { id: novoIdItemExtra(), label, ok: marcar }])
        toast({
          title: marcar ? "Item adicionado e marcado" : "Item adicionado",
          description: "Informe a obra no cadastro para reutilizar este item em outros checklists."
        })
      }
    } catch (err) {
      console.error(err)
      toast({
        title: "Erro ao salvar item",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setSalvandoItemObra(false)
    }
  }

  const removerItemExtra = (id: string) => {
    setExtras((prev) => prev.filter((e) => e.id !== id))
  }

  const toggleExtraOk = (id: string) => {
    setExtras((prev) => prev.map((e) => (e.id === id ? { ...e, ok: !e.ok } : e)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (modoVisualizacao) return

    if (!formData.funcionario_id || formData.funcionario_id === 0) {
      setError("Funcionário não identificado. Verifique se você está logado corretamente.")
      toast({
        title: "Erro",
        description: "Funcionário não identificado",
        variant: "destructive"
      })
      return
    }

    if (!formData.data) {
      setError("Data é obrigatória")
      toast({
        title: "Erro",
        description: "Data é obrigatória",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const checklistData = {
        grua_id: formData.grua_id,
        funcionario_id: formData.funcionario_id,
        data_entrada: formData.data,
        hora_entrada: new Date().toTimeString().slice(0, 5),
        tipo_entrada: "checklist" as const,
        status_entrada: "ok" as const,
        descricao: `Checklist diário - ${formData.data}`,
        observacoes: formData.observacoes || "",
        cabos: formData.cabos,
        polias: formData.polias,
        estrutura: formData.estrutura,
        movimentos: formData.movimentos,
        freios: formData.freios,
        limitadores: formData.limitadores,
        indicadores: formData.indicadores,
        aterramento: formData.aterramento,
        checklist_itens_extras: extras
      }

      if (modoEdicao && formData.id) {
        await livroGruaApi.atualizarEntrada(formData.id, checklistData as any)
        toast({
          title: "Sucesso",
          description: "Checklist atualizado com sucesso"
        })
      } else {
        await livroGruaApi.criarEntrada(checklistData as any)
        toast({
          title: "Sucesso",
          description: "Checklist criado com sucesso"
        })
      }

      onSave?.(formData)
    } catch (err) {
      console.error("Erro ao salvar checklist:", err)
      const errorMessage = err instanceof Error ? err.message : "Erro ao salvar checklist"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleCheckbox = (field: keyof ChecklistDiario) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  if (userLoading) {
    return <ButtonLoader text="Carregando dados do funcionário..." />
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {checklist && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {user && (
                  <div>
                    <Label className="text-xs text-gray-500">Funcionário</Label>
                    <Input
                      value={checklist?.funcionario_nome || user.nome || ""}
                      disabled
                      className="bg-gray-50 mt-1"
                    />
                  </div>
                )}

                {user && (
                  <div>
                    <Label className="text-xs text-gray-500">Cargo</Label>
                    <Input
                      value={checklist?.cargo || user.cargo || ""}
                      disabled
                      className="bg-gray-50 mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="data" className="text-xs text-gray-500">
                    Data <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                    disabled={modoVisualizacao || !modoEdicao}
                    className={`mt-1 ${!modoEdicao || modoVisualizacao ? "bg-gray-50 cursor-not-allowed" : ""}`}
                  />
                  {!modoEdicao && (
                    <p className="text-xs text-gray-500 mt-1">Data fixa: hoje</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Itens do Checklist
            </CardTitle>
            <CardDescription className="text-xs">
              Marque os itens que foram verificados e estão em conformidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {carregandoCatalogoObra && (
              <p className="text-xs text-muted-foreground">Carregando itens da obra…</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CHECKLIST_LIVRO_GRUA_ITENS_FIXOS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 transition-colors min-w-0"
                >
                  <Checkbox
                    id={item.key}
                    checked={formData[item.key as keyof ChecklistDiario] as boolean}
                    disabled={modoVisualizacao}
                    onCheckedChange={modoVisualizacao ? undefined : () => toggleCheckbox(item.key as keyof ChecklistDiario)}
                  />
                  <Label
                    htmlFor={item.key}
                    className={`text-sm font-medium leading-none flex-1 min-w-0 ${modoVisualizacao ? "" : "cursor-pointer"}`}
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
              {extras.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors min-w-0"
                >
                  <Checkbox
                    id={`extra-${ex.id}`}
                    checked={ex.ok}
                    disabled={modoVisualizacao}
                    className="shrink-0"
                    onCheckedChange={modoVisualizacao ? undefined : () => toggleExtraOk(ex.id)}
                  />
                  <Label
                    htmlFor={`extra-${ex.id}`}
                    className={`text-sm font-medium leading-none flex-1 min-w-0 truncate ${modoVisualizacao ? "" : "cursor-pointer"}`}
                  >
                    {ex.label}
                  </Label>
                  {!modoVisualizacao && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removerItemExtra(ex.id)}
                      aria-label={`Remover ${ex.label}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {!modoVisualizacao && (
              <div className="pt-4 border-t space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Adicionar item</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {obraId
                      ? "Novos itens ficam salvos nesta obra e aparecem aqui nos próximos checklists."
                      : "Inclua verificações extras. Use o contexto da obra quando disponível para reutilizar itens."}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={novoItemLabel}
                    onChange={(e) => setNovoItemLabel(e.target.value)}
                    placeholder="Ex.: Cabine, iluminação, anemômetro..."
                    maxLength={200}
                    disabled={salvandoItemObra}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        solicitarAdicionarItemExtra()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={solicitarAdicionarItemExtra}
                    className="shrink-0"
                    disabled={salvandoItemObra}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar item
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="observacoes" className="text-xs text-gray-500">
                Observações Adicionais
              </Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes || ""}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                disabled={modoVisualizacao}
                rows={3}
                placeholder="Adicione observações sobre o checklist (opcional)..."
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              {modoVisualizacao ? "Fechar" : "Cancelar"}
            </Button>
          )}
          {!modoVisualizacao && (
            <Button type="submit" disabled={loading || salvandoItemObra}>
              {loading ? (
                <ButtonLoader text="Salvando..." />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {modoEdicao ? "Atualizar" : "Salvar"} Checklist
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      <AlertDialog
        open={dialogMarcarAberto}
        onOpenChange={(open) => {
          if (!open) fecharDialogMarcar()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como verificado?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  O item <span className="font-medium text-foreground">&quot;{labelPendenteAdicionar}&quot;</span> será
                  incluído no checklist.
                </p>
                <p>Deseja marcá-lo já como verificado e em conformidade, ou deixar pendente para marcar depois?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="ghost" onClick={fecharDialogMarcar} disabled={salvandoItemObra}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void confirmarAdicionarItemExtra(false)}
              disabled={salvandoItemObra}
            >
              Deixar pendente
            </Button>
            <Button type="button" onClick={() => void confirmarAdicionarItemExtra(true)} disabled={salvandoItemObra}>
              {salvandoItemObra ? "Salvando…" : "Marcar como verificado"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
