"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataInputBr } from "@/components/ui/data-input-br"
import { ArrowDown, ArrowUp, Filter, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { PerformanceGruasFiltros } from "@/lib/api-relatorios-performance"

interface PerformanceGruasFiltrosProps {
  filtros: PerformanceGruasFiltros
  onFiltrosChange: (filtros: PerformanceGruasFiltros) => void
  onAplicar: () => void
  onLimpar: () => void
  loading?: boolean
  gruas?: Array<{ id: number; nome: string; modelo: string }>
  obras?: Array<{ id: number; nome: string }>
}

export function PerformanceGruasFiltros({
  filtros,
  onFiltrosChange,
  onAplicar,
  onLimpar,
  loading = false,
  gruas = [],
  obras = []
}: PerformanceGruasFiltrosProps) {
  const [periodoPreset, setPeriodoPreset] = useState<string>("mes")

  const calcularPeriodo = (preset: string) => {
    const hoje = new Date()
    let dataInicio: Date
    let dataFim = hoje

    switch (preset) {
      case 'semana':
        dataInicio = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'mes':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        break
      case 'trimestre':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1)
        break
      case 'semestre':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1)
        break
      case 'ano':
        dataInicio = new Date(hoje.getFullYear(), 0, 1)
        break
      case 'personalizado':
        return // Não alterar datas se for personalizado
      default:
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    }

    onFiltrosChange({
      ...filtros,
      data_inicio: format(dataInicio, 'yyyy-MM-dd'),
      data_fim: format(dataFim, 'yyyy-MM-dd')
    })
  }

  const handlePresetChange = (preset: string) => {
    setPeriodoPreset(preset)
    if (preset !== 'personalizado') {
      calcularPeriodo(preset)
    }
  }

  const parseDataFiltro = (s: string | undefined) => {
    if (!s) return undefined
    const d = new Date(`${s}T12:00:00`)
    return Number.isNaN(d.getTime()) ? undefined : d
  }
  const dataInicio = parseDataFiltro(filtros.data_inicio)
  const dataFim = parseDataFiltro(filtros.data_fim)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[1200px] flex items-end gap-3">
          {/* Período Preset */}
          <div className="min-w-[140px] flex-1">
            <Label>Período</Label>
            <Select value={periodoPreset} onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Última Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
                <SelectItem value="trimestre">Último Trimestre</SelectItem>
                <SelectItem value="semestre">Último Semestre</SelectItem>
                <SelectItem value="ano">Este Ano</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Início */}
          <div className="min-w-[200px] flex-1">
            <Label>Data Início</Label>
            <DataInputBr
              value={dataInicio}
              onChange={(date) => {
                onFiltrosChange({
                  ...filtros,
                  data_inicio: date ? format(date, "yyyy-MM-dd") : undefined,
                })
                setPeriodoPreset("personalizado")
              }}
            />
          </div>

          {/* Data Fim */}
          <div className="min-w-[200px] flex-1">
            <Label>Data Fim</Label>
            <DataInputBr
              value={dataFim}
              onChange={(date) => {
                onFiltrosChange({
                  ...filtros,
                  data_fim: date ? format(date, "yyyy-MM-dd") : undefined,
                })
                setPeriodoPreset("personalizado")
              }}
            />
          </div>

          {/* Grua */}
          <div className="min-w-[170px] flex-1">
            <Label>Grua (Opcional)</Label>
            <Select
              value={filtros.grua_id?.toString() || "all"}
              onValueChange={(value) => {
                onFiltrosChange({
                  ...filtros,
                  grua_id: value === "all" ? undefined : parseInt(value)
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as gruas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as gruas</SelectItem>
                {gruas.map((grua) => (
                  <SelectItem key={grua.id} value={grua.id.toString()}>
                    {grua.nome} - {grua.modelo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Obra */}
          <div className="min-w-[170px] flex-1">
            <Label>Obra (Opcional)</Label>
            <Select
              value={filtros.obra_id?.toString() || "all"}
              onValueChange={(value) => {
                onFiltrosChange({
                  ...filtros,
                  obra_id: value === "all" ? undefined : parseInt(value)
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as obras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as obras</SelectItem>
                {obras.map((obra) => (
                  <SelectItem key={obra.id} value={obra.id.toString()}>
                    {obra.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ordenar Por */}
          <div className="min-w-[180px] flex-1">
            <Label>Ordenar Por</Label>
            <Select
              value={filtros.ordenar_por || "taxa_utilizacao"}
              onValueChange={(value) => {
                onFiltrosChange({
                  ...filtros,
                  ordenar_por: value
                })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="taxa_utilizacao">Taxa de Utilização</SelectItem>
                <SelectItem value="receita_total">Receita Total</SelectItem>
                <SelectItem value="lucro_bruto">Lucro Bruto</SelectItem>
                <SelectItem value="roi">ROI</SelectItem>
                <SelectItem value="horas_trabalhadas">Horas Trabalhadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ordem (ícone para economizar espaço) */}
          <div className="min-w-[76px] shrink-0">
            <Label>Ordem</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full h-10"
              aria-label={filtros.ordem === "asc" ? "Ordem crescente" : "Ordem decrescente"}
              title={filtros.ordem === "asc" ? "Crescente" : "Decrescente"}
              onClick={() =>
                onFiltrosChange({
                  ...filtros,
                  ordem: filtros.ordem === "asc" ? "desc" : "asc"
                })
              }
            >
              {filtros.ordem === "asc" ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="flex gap-2 shrink-0 ml-auto">
            <Button onClick={onAplicar} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={onLimpar} disabled={loading}>
              Limpar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

