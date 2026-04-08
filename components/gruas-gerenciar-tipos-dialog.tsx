"use client"

import { useCallback, useEffect, useState } from "react"
import { gruasApi, type TipoGrua } from "@/lib/api-gruas"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"

function apiErrorMessage(err: unknown): string {
  const ax = err as { response?: { data?: { message?: string; error?: string } } }
  return (
    ax?.response?.data?.message ||
    ax?.response?.data?.error ||
    (err instanceof Error ? err.message : null) ||
    "Tente novamente."
  )
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCatalogoAlterado: () => void | Promise<void>
}

export function GruasGerenciarTiposDialog({ open, onOpenChange, onCatalogoAlterado }: Props) {
  const { toast } = useToast()
  const [tipos, setTipos] = useState<TipoGrua[]>([])
  const [loading, setLoading] = useState(false)
  const [novoNome, setNovoNome] = useState("")
  const [salvandoNovo, setSalvandoNovo] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState("")
  const [salvandoEdit, setSalvandoEdit] = useState(false)
  const [excluirTipo, setExcluirTipo] = useState<TipoGrua | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await gruasApi.listarTiposGrua()
      if (r.success) setTipos(r.data)
    } catch (e) {
      console.error(e)
      toast({
        title: "Tipos de grua",
        description: "Não foi possível carregar a lista.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (open) {
      void carregar()
      setNovoNome("")
      setEditandoId(null)
      setEditNome("")
      setExcluirTipo(null)
    } else {
      setExcluirTipo(null)
      setEditandoId(null)
      setEditNome("")
    }
  }, [open, carregar])

  const adicionar = async () => {
    const nome = novoNome.trim()
    if (!nome) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do novo tipo.",
        variant: "destructive",
      })
      return
    }
    setSalvandoNovo(true)
    try {
      await gruasApi.criarTipoGrua(nome)
      setNovoNome("")
      await carregar()
      await onCatalogoAlterado()
      toast({ title: "Tipo adicionado", description: `"${nome}" foi cadastrado.` })
    } catch (err) {
      toast({
        title: "Não foi possível salvar",
        description: apiErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setSalvandoNovo(false)
    }
  }

  const iniciarEdicao = (t: TipoGrua) => {
    setEditandoId(t.id)
    setEditNome(t.nome)
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setEditNome("")
  }

  const salvarEdicao = async () => {
    if (!editandoId) return
    const nome = editNome.trim()
    if (!nome) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do tipo não pode ficar vazio.",
        variant: "destructive",
      })
      return
    }
    setSalvandoEdit(true)
    try {
      await gruasApi.atualizarTipoGrua(editandoId, nome)
      cancelarEdicao()
      await carregar()
      await onCatalogoAlterado()
      toast({ title: "Tipo atualizado", description: "Alterações salvas." })
    } catch (err) {
      toast({
        title: "Não foi possível salvar",
        description: apiErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setSalvandoEdit(false)
    }
  }

  const confirmarExclusao = async () => {
    if (!excluirTipo) return
    const nomeRemovido = excluirTipo.nome
    setExcluindo(true)
    try {
      await gruasApi.excluirTipoGrua(excluirTipo.id)
      setExcluirTipo(null)
      await carregar()
      await onCatalogoAlterado()
      toast({ title: "Tipo removido", description: `"${nomeRemovido}" foi excluído.` })
    } catch (err) {
      toast({
        title: "Não foi possível excluir",
        description: apiErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setExcluirTipo(null)
          setEditandoId(null)
          setEditNome("")
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Gerenciar tipos de grua</DialogTitle>
            <DialogDescription>
              Cadastre, renomeie ou remova tipos do catálogo. Tipos em uso por alguma grua não podem ser
              excluídos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 shrink-0">
            <Label htmlFor="novo-tipo-catalogo">Novo tipo</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="novo-tipo-catalogo"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex: Torre autotranslante"
                maxLength={128}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    void adicionar()
                  }
                }}
              />
              <Button
                type="button"
                className="sm:w-auto shrink-0"
                onClick={() => void adicionar()}
                disabled={salvandoNovo}
              >
                {salvandoNovo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Carregando…
              </div>
            ) : tipos.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">Nenhum tipo cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[140px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tipos.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        {editandoId === t.id ? (
                          <Input
                            value={editNome}
                            onChange={(e) => setEditNome(e.target.value)}
                            maxLength={128}
                            className="h-8"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                void salvarEdicao()
                              }
                              if (e.key === "Escape") cancelarEdicao()
                            }}
                          />
                        ) : (
                          <span className="text-sm font-medium">{t.nome}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {editandoId === t.id ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={cancelarEdicao}
                              disabled={salvandoEdit}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-8"
                              onClick={() => void salvarEdicao()}
                              disabled={salvandoEdit}
                            >
                              {salvandoEdit ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Salvar"
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Editar"
                              onClick={() => iniciarEdicao(t)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Excluir"
                              onClick={() => setExcluirTipo(t)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {excluirTipo ? (
            <div
              className="shrink-0 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 space-y-3"
              role="alert"
            >
              <p className="text-sm text-foreground">
                Excluir <span className="font-semibold">{excluirTipo.nome}</span> do catálogo? Só é possível se
                nenhuma grua usar este tipo.
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExcluirTipo(null)}
                  disabled={excluindo}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => void confirmarExclusao()}
                  disabled={excluindo}
                >
                  {excluindo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
                </Button>
              </div>
            </div>
          ) : null}

          <DialogFooter className="shrink-0 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}
