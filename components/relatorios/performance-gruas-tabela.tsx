"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"
import type { GruaPerformance } from "@/lib/types/performance-gruas"

interface PerformanceGruasTabelaProps {
  dados?: GruaPerformance[] | null
  pagina?: number
  totalPaginas?: number
  limite?: number
  onPaginaChange?: (pagina: number) => void
  onLimiteChange?: (limite: number) => void
}

export const PerformanceGruasTabela = memo(function PerformanceGruasTabela({
  dados = [],
  pagina = 1,
  totalPaginas = 1,
  limite = 10,
  onPaginaChange,
  onLimiteChange
}: PerformanceGruasTabelaProps) {
  const [gruaDetalhes, setGruaDetalhes] = useState<GruaPerformance | null>(null)
  const [showDetalhes, setShowDetalhes] = useState(false)

  // Garantir que dados é um array válido - memoizado
  const dadosArray = useMemo(() => Array.isArray(dados) ? dados : [], [dados])

  const getStatusBadge = useCallback((status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      'Operacional': { color: 'bg-green-100 text-green-800', label: 'Operacional' },
      'Manutenção': { color: 'bg-yellow-100 text-yellow-800', label: 'Manutenção' },
      'Disponível': { color: 'bg-blue-100 text-blue-800', label: 'Disponível' },
      'Indisponível': { color: 'bg-red-100 text-red-800', label: 'Indisponível' }
    }
    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status }
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
  }

  const getUtilizacaoBadge = useCallback((taxa: number) => {
    if (taxa >= 80) {
      return <Badge className="bg-green-100 text-green-800">{taxa.toFixed(1)}%</Badge>
    } else if (taxa >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800">{taxa.toFixed(1)}%</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">{taxa.toFixed(1)}%</Badge>
    }
  }, [])

  const getROIBadge = useCallback((roi: number) => {
    if (roi >= 50) {
      return <Badge className="bg-green-100 text-green-800">{roi.toFixed(1)}%</Badge>
    } else if (roi >= 20) {
      return <Badge className="bg-yellow-100 text-yellow-800">{roi.toFixed(1)}%</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">{roi.toFixed(1)}%</Badge>
    }
  }, [])

  const handleVerDetalhes = useCallback((grua: GruaPerformance) => {
    setGruaDetalhes(grua)
    setShowDetalhes(true)
  }, [])

  // Memoizar dados paginados e cálculos de paginação
  const { dadosPagina, inicio, fim, totalPaginasCalculado } = useMemo(() => {
    const inicioCalc = (pagina - 1) * limite
    const fimCalc = inicioCalc + limite
    const dadosPaginaCalc = dadosArray.slice(inicioCalc, fimCalc)
    const totalPaginasCalc = Math.ceil(dadosArray.length / limite)
    return {
      dadosPagina: dadosPaginaCalc,
      inicio: inicioCalc,
      fim: fimCalc,
      totalPaginasCalculado: totalPaginasCalc
    }
  }, [dadosArray, pagina, limite])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Performance por Grua</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grua</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Horas Trabalhadas</TableHead>
                  <TableHead className="text-right">Taxa Utilização</TableHead>
                  <TableHead className="text-right">Receita Total</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                  <TableHead className="text-right">Lucro Bruto</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">Receita/Hora</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosPagina.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      Nenhum dado disponível
                    </TableCell>
                  </TableRow>
                ) : (
                  dadosPagina.map((item, index) => (
                    <TableRow key={item?.grua?.id || index}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{item?.grua?.nome || 'N/A'}</div>
                          <div className="text-sm text-gray-500">
                            {item?.grua?.modelo || ''} - {item?.grua?.fabricante || ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item?.grua?.status || 'N/A')}</TableCell>
                      <TableCell className="text-right">
                        {(item?.metricas?.horas_trabalhadas || 0).toLocaleString('pt-BR')}h
                      </TableCell>
                      <TableCell className="text-right">
                        {getUtilizacaoBadge(item?.metricas?.taxa_utilizacao || 0)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        R$ {(item?.financeiro?.receita_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        R$ {(item?.financeiro?.custo_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${(item?.financeiro?.lucro_bruto || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        R$ {(item?.financeiro?.lucro_bruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        {(item?.financeiro?.margem_lucro || 0).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {getROIBadge(item?.roi?.roi_percentual || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {(item?.financeiro?.receita_por_hora || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerDetalhes(item)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {dadosArray.length > limite && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Mostrando {inicio + 1} a {Math.min(fim, dadosArray.length)} de {dadosArray.length} resultados
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPaginaChange?.(pagina - 1)}
                  disabled={pagina <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Página {pagina} de {totalPaginasCalculado}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPaginaChange?.(pagina + 1)}
                  disabled={pagina >= totalPaginasCalculado}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Performance - {gruaDetalhes?.grua?.nome || 'N/A'}</DialogTitle>
          </DialogHeader>
          {gruaDetalhes && (
            <div className="space-y-6">
              {/* Informações da Grua */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Informações da Grua</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Modelo:</span> {gruaDetalhes?.grua?.modelo || 'N/A'}</p>
                    <p><span className="font-medium">Fabricante:</span> {gruaDetalhes?.grua?.fabricante || 'N/A'}</p>
                    <p><span className="font-medium">Tipo:</span> {gruaDetalhes?.grua?.tipo || 'N/A'}</p>
                    <p><span className="font-medium">Status:</span> {gruaDetalhes?.grua?.status || 'N/A'}</p>
                    {gruaDetalhes?.grua?.numero_serie && (
                      <p><span className="font-medium">Nº Série:</span> {gruaDetalhes.grua.numero_serie}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Métricas Operacionais</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Horas Trabalhadas:</span> {(gruaDetalhes?.metricas?.horas_trabalhadas || 0).toLocaleString('pt-BR')}h</p>
                    <p><span className="font-medium">Horas Disponíveis:</span> {(gruaDetalhes?.metricas?.horas_disponiveis || 0).toLocaleString('pt-BR')}h</p>
                    <p><span className="font-medium">Horas Ociosas:</span> {(gruaDetalhes?.metricas?.horas_ociosas || 0).toLocaleString('pt-BR')}h</p>
                    <p><span className="font-medium">Taxa de Utilização:</span> {(gruaDetalhes?.metricas?.taxa_utilizacao || 0).toFixed(1)}%</p>
                    <p><span className="font-medium">Dias em Operação:</span> {gruaDetalhes?.metricas?.dias_em_operacao || 0} dias</p>
                  </div>
                </div>
              </div>

              {/* Informações Financeiras */}
              <div>
                <h4 className="font-semibold mb-2">Informações Financeiras</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Receita Total</p>
                    <p className="font-bold text-green-600">
                      R$ {(gruaDetalhes?.financeiro?.receita_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Custo Total</p>
                    <p className="font-bold text-red-600">
                      R$ {(gruaDetalhes?.financeiro?.custo_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Lucro Bruto</p>
                    <p className={`font-bold ${(gruaDetalhes?.financeiro?.lucro_bruto || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      R$ {(gruaDetalhes?.financeiro?.lucro_bruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Margem de Lucro</p>
                    <p className="font-bold">{(gruaDetalhes?.financeiro?.margem_lucro || 0).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Receita por Hora</p>
                    <p className="font-bold">R$ {(gruaDetalhes?.financeiro?.receita_por_hora || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Lucro por Hora</p>
                    <p className="font-bold">R$ {(gruaDetalhes?.financeiro?.lucro_por_hora || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* ROI */}
              <div>
                <h4 className="font-semibold mb-2">ROI (Retorno sobre Investimento)</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Investimento Inicial</p>
                    <p className="font-bold">
                      R$ {(gruaDetalhes?.roi?.investimento_inicial || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">ROI Percentual</p>
                    <p className="font-bold">{(gruaDetalhes?.roi?.roi_percentual || 0).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tempo de Retorno</p>
                    <p className="font-bold">
                      {(gruaDetalhes?.roi?.tempo_retorno_meses || 0) > 0 
                        ? `${gruaDetalhes.roi.tempo_retorno_meses} meses`
                        : 'Não calculável'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Obras */}
              <div>
                <h4 className="font-semibold mb-2">Obras ({gruaDetalhes?.obras?.total_obras || 0})</h4>
                <div className="space-y-2">
                  {(gruaDetalhes?.obras?.obras_visitadas || []).map((obra, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{obra?.obra_nome || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{obra?.dias_permanencia || 0} dias</p>
                      </div>
                      <p className="font-semibold text-green-600">
                        R$ {(obra?.receita_gerada || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparativo */}
              {gruaDetalhes?.comparativo_periodo_anterior && (
                <div>
                  <h4 className="font-semibold mb-2">Comparativo com Período Anterior</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Variação Horas Trabalhadas</p>
                      <p className={`font-bold ${(gruaDetalhes.comparativo_periodo_anterior?.horas_trabalhadas_variacao || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(gruaDetalhes.comparativo_periodo_anterior?.horas_trabalhadas_variacao || 0) >= 0 ? '+' : ''}
                        {(gruaDetalhes.comparativo_periodo_anterior?.horas_trabalhadas_variacao || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Variação Receita</p>
                      <p className={`font-bold ${(gruaDetalhes.comparativo_periodo_anterior?.receita_variacao || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(gruaDetalhes.comparativo_periodo_anterior?.receita_variacao || 0) >= 0 ? '+' : ''}
                        {(gruaDetalhes.comparativo_periodo_anterior?.receita_variacao || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Variação Utilização</p>
                      <p className={`font-bold ${(gruaDetalhes.comparativo_periodo_anterior?.utilizacao_variacao || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(gruaDetalhes.comparativo_periodo_anterior?.utilizacao_variacao || 0) >= 0 ? '+' : ''}
                        {(gruaDetalhes.comparativo_periodo_anterior?.utilizacao_variacao || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
})

