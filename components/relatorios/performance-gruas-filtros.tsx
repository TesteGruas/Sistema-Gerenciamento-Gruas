"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter, RefreshCw } from "lucide-react"
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

  const dataInicio = filtros.data_inicio ? new Date(filtros.data_inicio) : undefined
  const dataFim = filtros.data_fim ? new Date(filtros.data_fim) : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Período Preset */}
          <div>
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
          <div>
            <Label>Data Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dataInicio}
                  onSelect={(date) => {
                    if (date) {
                      onFiltrosChange({
                        ...filtros,
                        data_inicio: format(date, 'yyyy-MM-dd')
                      })
                      setPeriodoPreset('personalizado')
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data Fim */}
          <div>
            <Label>Data Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dataFim}
                  onSelect={(date) => {
                    if (date) {
                      onFiltrosChange({
                        ...filtros,
                        data_fim: format(date, 'yyyy-MM-dd')
                      })
                      setPeriodoPreset('personalizado')
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Grua */}
          <div>
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
          <div>
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
          <div>
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

          {/* Ordem */}
          <div>
            <Label>Ordem</Label>
            <Select
              value={filtros.ordem || "desc"}
              onValueChange={(value) => {
                onFiltrosChange({
                  ...filtros,
                  ordem: value as 'asc' | 'desc'
                })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Decrescente</SelectItem>
                <SelectItem value="asc">Crescente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={onAplicar} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aplicar Filtros
          </Button>
          <Button variant="outline" onClick={onLimpar} disabled={loading}>
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

