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
  Wrench,
  RefreshCw
} from "lucide-react"
import { livroGruaApi } from "@/lib/api-livro-grua"
import { CardLoader } from "@/components/ui/loader"
import { ExportButton } from "@/components/export-button"
import { entradaNoMesReferencia } from "@/lib/livro-grua-entradas-filtro"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

interface Manutencao {
  id?: number
  grua_id: string
  data: string
  realizado_por_id: number
  realizado_por_nome?: string
  cargo?: string
  descricao?: string
  observacoes?: string
  created_at?: string
}

function chaveResponsavelManutencao(m: Manutencao): string {
  const id = m.realizado_por_id
  if (id != null && id !== "" && !Number.isNaN(Number(id))) {
    return `id:${id}`
  }
  const n = (m.realizado_por_nome || "").trim().toLowerCase()
  return `nome:${n || "_"}`
}

interface LivroGruaManutencaoListProps {
  gruaId: string
  description?: string
  variant?: "default" | "preview"
  onNovaManutencao?: () => void
  onEditarManutencao?: (manutencao: Manutencao) => void
  onVisualizarManutencao?: (manutencao: Manutencao) => void
  onExcluirManutencao?: (manutencao: Manutencao) => void
}

export function LivroGruaManutencaoList({
  gruaId,
  description,
  variant = "default",
  onNovaManutencao,
  onEditarManutencao,
  onVisualizarManutencao,
  onExcluirManutencao
}: LivroGruaManutencaoListProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([])
  const [filtroMes, setFiltroMes] = useState("")
  const [filtroResponsavel, setFiltroResponsavel] = useState("todos")

  // Carregar manutenções
  const carregarManutencoes = async () => {
    try {
      setLoading(true)
      setError(null)

      // Filtrar por tipo manutenção
      const response = await livroGruaApi.listarEntradas({
        grua_id: gruaId,
        tipo_entrada: 'manutencao'
      })

      // Converter entradas para formato de manutenção
      const manutencoesData = response.data.map((entrada: any) => ({
        id: entrada.id,
        grua_id: entrada.grua_id,
        data: entrada.data_entrada || entrada.data,
        realizado_por_id: entrada.funcionario_id || entrada.realizado_por_id,
        realizado_por_nome: entrada.funcionario_nome || entrada.realizado_por_nome || entrada.funcionarioName,
        cargo: entrada.funcionario_cargo || entrada.cargo,
        descricao: entrada.descricao,
        observacoes: entrada.observacoes,
        created_at: entrada.created_at
      }))

      setManutencoes(manutencoesData)

    } catch (err) {
      console.error('Erro ao carregar manutenções:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar manutenções')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarManutencoes()
  }, [gruaId])

  const opcoesResponsavel = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of manutencoes) {
      const k = chaveResponsavelManutencao(m)
      const label = (m.realizado_por_nome || "").trim() || "Sem nome"
      if (!map.has(k)) map.set(k, label)
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"))
  }, [manutencoes])

  const manutencoesFiltradas = useMemo(
    () =>
      manutencoes.filter((manutencao) => {
        const matchMes = entradaNoMesReferencia(manutencao.data, filtroMes)
        const matchResp =
          filtroResponsavel === "todos" || chaveResponsavelManutencao(manutencao) === filtroResponsavel
        return matchMes && matchResp
      }),
    [manutencoes, filtroMes, filtroResponsavel]
  )

  // Função para formatar dados para exportação
  const formatarDadosParaExportacao = useCallback(() => {
    return manutencoesFiltradas.map((manutencao) => ({
      'Data': new Date(manutencao.data).toLocaleDateString('pt-BR'),
      'Realizado Por': manutencao.realizado_por_nome || 'N/A',
      'Cargo': manutencao.cargo || 'N/A',
      'Descrição': manutencao.descricao || 'Sem descrição',
      'Observações': manutencao.observacoes || ''
    }))
  }, [manutencoesFiltradas])

  const listaVaziaPorFiltro = manutencoes.length > 0 && manutencoesFiltradas.length === 0

  const isPreview = variant === "preview"
  const mostrarAcoes =
    !isPreview &&
    !!(onVisualizarManutencao || onEditarManutencao || onExcluirManutencao)

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
              <Wrench className="h-5 w-5 shrink-0 text-primary" />
              <span className="truncate">
                {isPreview ? "Pré-visualização — manutenções" : "Manutenções"}
              </span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {description ??
                (isPreview
                  ? "Somente leitura. Filtre por mês ou funcionário."
                  : "Histórico de manutenções realizadas nesta grua")}
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            {manutencoesFiltradas.length > 0 && (
              <ExportButton
                dados={formatarDadosParaExportacao()}
                tipo="relatorios"
                nomeArquivo={`manutencoes-grua-${gruaId}`}
                titulo="Manutenções"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              />
            )}
            {onNovaManutencao && (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onNovaManutencao()
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova manutenção
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-b bg-muted/15 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="grid min-w-0 flex-1 gap-1.5 sm:max-w-xs">
              <Label htmlFor="filtroMesManut" className="text-xs font-medium text-muted-foreground">
                Mês
              </Label>
              <Input
                id="filtroMesManut"
                type="month"
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="h-9 bg-background"
              />
            </div>
            <div className="grid min-w-0 flex-1 gap-1.5 sm:max-w-xs">
              <Label className="text-xs font-medium text-muted-foreground">Funcionário</Label>
              <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
                <SelectTrigger className="h-9 w-full bg-background">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {opcoesResponsavel.map(([k, nome]) => (
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
                setFiltroResponsavel("todos")
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

        {!loading && manutencoesFiltradas.length === 0 && (
          <div className="mx-4 my-6 rounded-lg border border-dashed bg-muted/20 px-6 py-12 text-center text-muted-foreground">
            <Wrench className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p className="text-sm">
              {listaVaziaPorFiltro
                ? "Nenhuma manutenção corresponde aos filtros."
                : "Nenhuma manutenção encontrada."}
            </p>
            {onNovaManutencao && !listaVaziaPorFiltro && (
              <Button
                type="button"
                className="mt-4"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onNovaManutencao()
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Registrar primeira manutenção
              </Button>
            )}
          </div>
        )}

        {!loading && manutencoesFiltradas.length > 0 && (
          <div className="overflow-x-auto px-1 pb-1 sm:px-2">
            <Table
              className={cn(
                "[&_tbody_tr:nth-child(even)]:bg-muted/25",
                isPreview
                  ? "min-w-[560px] text-sm [&_td]:py-2.5 [&_th]:h-10 [&_th]:px-3 [&_td]:px-3"
                  : "min-w-[720px]"
              )}
            >
              <TableHeader>
                <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-3 font-semibold">Data</TableHead>
                  <TableHead className="font-semibold">Realizado por</TableHead>
                  <TableHead className="font-semibold">Cargo</TableHead>
                  <TableHead className="pr-3 font-semibold">Descrição</TableHead>
                  {mostrarAcoes && <TableHead className="text-right font-semibold">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {manutencoesFiltradas.map((manutencao) => (
                  <TableRow
                    key={manutencao.id}
                    className="border-b border-border/60 transition-colors hover:bg-muted/35"
                  >
                    <TableCell className="pl-3 tabular-nums text-muted-foreground">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        {!isPreview && (
                          <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        )}
                        {new Date(manutencao.data).toLocaleDateString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {!isPreview && (
                          <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70" />
                        )}
                        <span className="max-w-[200px] truncate text-foreground">
                          {manutencao.realizado_por_nome || "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-normal", isPreview && "text-xs")}>
                        {manutencao.cargo || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-3">
                      <p
                        className={cn(
                          "line-clamp-2 max-w-md",
                          isPreview ? "text-muted-foreground" : "text-sm text-muted-foreground"
                        )}
                      >
                        {manutencao.descricao || "Sem descrição"}
                      </p>
                    </TableCell>
                    {mostrarAcoes && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {onVisualizarManutencao && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onVisualizarManutencao(manutencao)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {onEditarManutencao && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditarManutencao(manutencao)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onExcluirManutencao && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Tem certeza que deseja excluir esta manutenção?")) {
                                  onExcluirManutencao(manutencao)
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

