"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertCircle, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Calendar,
  User,
  CheckCircle2,
  RefreshCw,
  Check,
  X
} from "lucide-react"
import { livroGruaApi } from "@/lib/api-livro-grua"
import { CardLoader } from "@/components/ui/loader"
import { ExportButton } from "@/components/export-button"
import {
  CHECKLIST_LIVRO_GRUA_ITENS_FIXOS,
  contagemChecklistLivroGrua,
  normalizeChecklistItensExtras
} from "@/lib/checklist-livro-grua-shared"
import { cn } from "@/lib/utils"
import { entradaNoMesReferencia } from "@/lib/livro-grua-entradas-filtro"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

interface ChecklistDiario {
  id?: number
  grua_id: string
  funcionario_id: number
  funcionario_nome?: string
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
  checklist_itens_extras?: unknown
}

function chaveFuncionarioChecklist(c: ChecklistDiario): string {
  const id = Number(c.funcionario_id)
  if (!Number.isNaN(id) && id > 0) return String(id)
  return `nome:${(c.funcionario_nome || "").trim().toLowerCase() || "_"}`
}

function itemFixoOk(c: ChecklistDiario, key: string): boolean {
  const v = (c as unknown as Record<string, unknown>)[key]
  return v === true || v === 1 || v === "1"
}

/** Abreviações para cabeçalhos compactos (título completo no tooltip) */
const CHECKLIST_COL_ABREV: Record<string, string> = {
  cabos: "Cb",
  polias: "Pl",
  estrutura: "Es",
  movimentos: "Mv",
  freios: "Fr",
  limitadores: "Lm",
  indicadores: "In",
  aterramento: "At"
}

interface LivroGruaChecklistListProps {
  gruaId: string
  /** Subtítulo opcional (ex.: modelo da grua e ID) */
  description?: string
  /** Lista somente leitura: sem coluna de ações, tabela mais compacta */
  variant?: "default" | "preview"
  onNovoChecklist?: () => void
  onEditarChecklist?: (checklist: ChecklistDiario) => void
  onVisualizarChecklist?: (checklist: ChecklistDiario) => void
  onExcluirChecklist?: (checklist: ChecklistDiario) => void
}

export function LivroGruaChecklistList({
  gruaId,
  description,
  variant = "default",
  onNovoChecklist,
  onEditarChecklist,
  onVisualizarChecklist,
  onExcluirChecklist
}: LivroGruaChecklistListProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checklists, setChecklists] = useState<ChecklistDiario[]>([])
  const [filtroMes, setFiltroMes] = useState("")
  const [filtroFuncionario, setFiltroFuncionario] = useState<string>("todos")

  // Carregar checklists
  const carregarChecklists = async () => {
    try {
      setLoading(true)
      setError(null)

      // Filtrar por tipo checklist
      const response = await livroGruaApi.listarEntradas({
        grua_id: gruaId,
        tipo_entrada: 'checklist'
      })

      // Converter entradas para formato de checklist
      const checklistsData = response.data.map((entrada: any) => {
        return {
          id: entrada.id,
          grua_id: entrada.grua_id,
          funcionario_id: entrada.funcionario_id,
          funcionario_nome: entrada.funcionario_nome || entrada.funcionarioName,
          data: entrada.data_entrada || entrada.data,
          cabos: entrada.cabos === true || entrada.cabos === 1 || entrada.cabos === '1',
          polias: entrada.polias === true || entrada.polias === 1 || entrada.polias === '1',
          estrutura: entrada.estrutura === true || entrada.estrutura === 1 || entrada.estrutura === '1',
          movimentos: entrada.movimentos === true || entrada.movimentos === 1 || entrada.movimentos === '1',
          freios: entrada.freios === true || entrada.freios === 1 || entrada.freios === '1',
          limitadores: entrada.limitadores === true || entrada.limitadores === 1 || entrada.limitadores === '1',
          indicadores: entrada.indicadores === true || entrada.indicadores === 1 || entrada.indicadores === '1',
          aterramento: entrada.aterramento === true || entrada.aterramento === 1 || entrada.aterramento === '1',
          observacoes: entrada.observacoes,
          created_at: entrada.created_at,
          checklist_itens_extras: entrada.checklist_itens_extras
        }
      })

      setChecklists(checklistsData)

    } catch (err) {
      console.error('Erro ao carregar checklists:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar checklists')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarChecklists()
  }, [gruaId])

  const opcoesFuncionario = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of checklists) {
      const k = chaveFuncionarioChecklist(c)
      const label =
        (c.funcionario_nome || "").trim() ||
        (c.funcionario_id != null && !Number.isNaN(Number(c.funcionario_id))
          ? `ID ${c.funcionario_id}`
          : "Sem nome")
      if (!m.has(k)) m.set(k, label)
    }
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"))
  }, [checklists])

  const checklistsFiltrados = useMemo(
    () =>
      checklists.filter((checklist) => {
        const matchMes = entradaNoMesReferencia(checklist.data, filtroMes)
        const matchFun =
          filtroFuncionario === "todos" || chaveFuncionarioChecklist(checklist) === filtroFuncionario
        return matchMes && matchFun
      }),
    [checklists, filtroMes, filtroFuncionario]
  )

  const contarItensMarcados = useCallback((checklist: ChecklistDiario): number => {
    return contagemChecklistLivroGrua(checklist as unknown as Record<string, unknown>).marcados
  }, [])

  const totalItensChecklist = useCallback((checklist: ChecklistDiario): number => {
    return contagemChecklistLivroGrua(checklist as unknown as Record<string, unknown>).total
  }, [])

  // Função para formatar dados para exportação
  const formatarDadosParaExportacao = useCallback(() => {
    return checklistsFiltrados.map((checklist) => {
      const itensMarcados = contarItensMarcados(checklist)
      const totalItens = totalItensChecklist(checklist)
      const status = itensMarcados === totalItens ? 'Completo' : 'Incompleto'
      const extras = normalizeChecklistItensExtras(checklist.checklist_itens_extras)
      const extrasStr =
        extras.length === 0
          ? ''
          : extras.map((e) => `${e.label}: ${e.ok ? 'Sim' : 'Não'}`).join('; ')

      return {
        'Data': new Date(checklist.data).toLocaleDateString('pt-BR'),
        'Funcionário': checklist.funcionario_nome || 'N/A',
        'Cabos': checklist.cabos ? 'Sim' : 'Não',
        'Polias': checklist.polias ? 'Sim' : 'Não',
        'Estrutura': checklist.estrutura ? 'Sim' : 'Não',
        'Movimentos': checklist.movimentos ? 'Sim' : 'Não',
        'Freios': checklist.freios ? 'Sim' : 'Não',
        'Limitadores': checklist.limitadores ? 'Sim' : 'Não',
        'Indicadores': checklist.indicadores ? 'Sim' : 'Não',
        'Aterramento': checklist.aterramento ? 'Sim' : 'Não',
        'Itens adicionais': extrasStr,
        'Itens Verificados': `${itensMarcados}/${totalItens}`,
        'Status': status,
        'Observações': checklist.observacoes || ''
      }
    })
  }, [checklistsFiltrados, contarItensMarcados, totalItensChecklist])

  const listaVaziaPorFiltro = checklists.length > 0 && checklistsFiltrados.length === 0

  const isPreview = variant === "preview"
  const mostrarAcoes =
    !isPreview &&
    !!(onVisualizarChecklist || onEditarChecklist || onExcluirChecklist)

  return (
    <Card
      className={
        isPreview
          ? "overflow-hidden border border-muted-foreground/20 bg-card shadow-sm"
          : "overflow-hidden shadow-sm"
      }
    >
      <CardHeader className="space-y-1 border-b bg-muted/20 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-0.5">
            <CardTitle className="flex items-center gap-2 text-base font-semibold leading-tight sm:text-lg">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              <span className="truncate">
                {isPreview ? "Pré-visualização — checklists diários" : "Checklists diários"}
              </span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {description ??
                (isPreview
                  ? "Somente leitura. Filtre por mês ou funcionário."
                  : "Lista de checklists diários realizados nesta grua")}
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            {checklistsFiltrados.length > 0 && (
              <ExportButton
                dados={formatarDadosParaExportacao()}
                tipo="relatorios"
                nomeArquivo={`checklists-grua-${gruaId}`}
                titulo="Checklists Diários"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              />
            )}
            {onNovoChecklist && (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onNovoChecklist()
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Checklist
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-b bg-muted/15 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="grid min-w-0 flex-1 gap-1.5 sm:max-w-xs">
              <Label htmlFor="filtroMesChecklist" className="text-xs font-medium text-muted-foreground">
                Mês
              </Label>
              <Input
                id="filtroMesChecklist"
                type="month"
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="h-9 bg-background"
              />
            </div>
            <div className="grid min-w-0 flex-1 gap-1.5 sm:max-w-xs">
              <Label className="text-xs font-medium text-muted-foreground">Funcionário</Label>
              <Select value={filtroFuncionario} onValueChange={setFiltroFuncionario}>
                <SelectTrigger className="h-9 w-full bg-background">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {opcoesFuncionario.map(([k, nome]) => (
                    <SelectItem key={k} value={k}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 w-full shrink-0 sm:ml-auto sm:w-auto"
              onClick={() => {
                setFiltroMes("")
                setFiltroFuncionario("todos")
              }}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Limpar filtros
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && <CardLoader />}

        {!loading && checklistsFiltrados.length === 0 && (
          <div className="mx-4 my-6 rounded-lg border border-dashed bg-muted/20 px-6 py-12 text-center text-muted-foreground">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p className="text-sm">
              {listaVaziaPorFiltro ? "Nenhum checklist corresponde aos filtros." : "Nenhum checklist encontrado."}
            </p>
            {onNovoChecklist && !listaVaziaPorFiltro && (
              <Button
                type="button"
                className="mt-4"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onNovoChecklist()
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro checklist
              </Button>
            )}
          </div>
        )}

        {!loading && checklistsFiltrados.length > 0 && (
          <div className="overflow-x-auto px-1 pb-1 sm:px-2">
            <Table
              className={cn(
                "[&_tbody_tr:nth-child(even)]:bg-muted/25",
                isPreview
                  ? "min-w-[720px] text-sm [&_td]:py-2 [&_th]:h-10 [&_th]:px-1.5 [&_th]:py-2 [&_th]:text-[11px] [&_td]:px-1.5"
                  : "min-w-[800px] [&_th]:text-xs [&_td]:text-sm"
              )}
            >
              <TableHeader>
                <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                  <TableHead className="whitespace-nowrap pl-3 font-semibold">Data</TableHead>
                  <TableHead className="min-w-[6.5rem] pl-2 font-semibold">Quem</TableHead>
                  {CHECKLIST_LIVRO_GRUA_ITENS_FIXOS.map(({ key, label }) => (
                    <TableHead
                      key={key}
                      className="w-9 min-w-[2.25rem] max-w-[2.5rem] px-0.5 text-center font-semibold"
                      title={label}
                    >
                      <span className="tabular-nums tracking-tight">{CHECKLIST_COL_ABREV[key] ?? key.slice(0, 2)}</span>
                    </TableHead>
                  ))}
                  <TableHead
                    className="min-w-[5.5rem] max-w-[8rem] text-left text-xs font-semibold"
                    title="Itens adicionais da obra"
                  >
                    Outros
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-center font-semibold">Total</TableHead>
                  <TableHead className="pr-3 text-center font-semibold">Status</TableHead>
                  {mostrarAcoes && <TableHead className="text-right font-semibold">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {checklistsFiltrados.map((checklist) => {
                  const itensMarcados = contarItensMarcados(checklist)
                  const totalItens = totalItensChecklist(checklist)
                  const todosMarcados = itensMarcados === totalItens
                  const extras = normalizeChecklistItensExtras(checklist.checklist_itens_extras)

                  return (
                    <TableRow
                      key={checklist.id}
                      className="border-b border-border/60 transition-colors hover:bg-muted/35"
                    >
                      <TableCell className="whitespace-nowrap pl-3 text-muted-foreground tabular-nums">
                        <div className="flex items-center gap-1.5">
                          {!isPreview && (
                            <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" />
                          )}
                          {new Date(checklist.data).toLocaleDateString("pt-BR")}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[8.5rem] pl-2">
                        <div className="flex items-center gap-1.5">
                          {!isPreview && (
                            <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70" />
                          )}
                          <span className="truncate text-foreground" title={checklist.funcionario_nome || ""}>
                            {checklist.funcionario_nome || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      {CHECKLIST_LIVRO_GRUA_ITENS_FIXOS.map(({ key, label }) => {
                        const ok = itemFixoOk(checklist, key)
                        return (
                          <TableCell key={key} className="p-0">
                            <div
                              className="flex h-9 items-center justify-center"
                              title={`${label}: ${ok ? "Sim" : "Não"}`}
                            >
                              {ok ? (
                                <Check
                                  className="h-3.5 w-3.5 text-emerald-600"
                                  strokeWidth={2.5}
                                  aria-label={`${label}: sim`}
                                />
                              ) : (
                                <X
                                  className="h-3.5 w-3.5 text-muted-foreground/65"
                                  strokeWidth={2.5}
                                  aria-label={`${label}: não`}
                                />
                              )}
                            </div>
                          </TableCell>
                        )
                      })}
                      <TableCell className="max-w-[9rem] align-middle py-1.5">
                        {extras.length === 0 ? (
                          <span className="text-muted-foreground/80">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {extras.map((e) => (
                              <span
                                key={e.id}
                                className="inline-flex max-w-full items-center gap-0.5 rounded-md border border-border/80 bg-background px-1.5 py-0.5 text-[10px] leading-tight"
                                title={`${e.label}: ${e.ok ? "Sim" : "Não"}`}
                              >
                                <span className="truncate text-muted-foreground">{e.label}</span>
                                {e.ok ? (
                                  <Check className="h-2.5 w-2.5 shrink-0 text-emerald-600" />
                                ) : (
                                  <X className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex flex-wrap items-center justify-center gap-1.5">
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            {itensMarcados}/{totalItens}
                          </span>
                          <Badge
                            variant={todosMarcados ? "default" : "secondary"}
                            className="h-5 px-1.5 text-[10px] font-normal"
                          >
                            {todosMarcados ? "Completo" : "Incompleto"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="pr-3 text-center">
                        <Badge
                          className={cn(
                            "h-6 px-2 text-xs font-medium",
                            todosMarcados ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
                          )}
                        >
                          {todosMarcados ? "OK" : "Pendente"}
                        </Badge>
                      </TableCell>
                      {mostrarAcoes && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {onVisualizarChecklist && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onVisualizarChecklist(checklist)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {onEditarChecklist && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditarChecklist(checklist)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {onExcluirChecklist && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja excluir este checklist?")) {
                                    onExcluirChecklist(checklist)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

