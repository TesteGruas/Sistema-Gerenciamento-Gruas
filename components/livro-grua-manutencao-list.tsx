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
  Filter,
  RefreshCw,
  Download
} from "lucide-react"
import { livroGruaApi } from "@/lib/api-livro-grua"
import { CardLoader } from "@/components/ui/loader"
import { ExportButton } from "@/components/export-button"
import { useToast } from "@/hooks/use-toast"

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

interface LivroGruaManutencaoListProps {
  gruaId: string
  onNovaManutencao?: () => void
  onEditarManutencao?: (manutencao: Manutencao) => void
  onVisualizarManutencao?: (manutencao: Manutencao) => void
  onExcluirManutencao?: (manutencao: Manutencao) => void
}

export function LivroGruaManutencaoList({
  gruaId,
  onNovaManutencao,
  onEditarManutencao,
  onVisualizarManutencao,
  onExcluirManutencao
}: LivroGruaManutencaoListProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([])
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")

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

  // Filtrar manutenções - memoizado para evitar recálculo desnecessário
  const manutencoesFiltradas = useMemo(() => manutencoes.filter(manutencao => {
    const matchDataInicio = !filtroDataInicio || manutencao.data >= filtroDataInicio
    const matchDataFim = !filtroDataFim || manutencao.data <= filtroDataFim

    return matchDataInicio && matchDataFim
  }), [manutencoes, filtroDataInicio, filtroDataFim])

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

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Manutenções
            </CardTitle>
            <CardDescription>
              Histórico de manutenções realizadas nesta grua
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
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
              <Button onClick={onNovaManutencao} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nova Manutenção
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4 items-end">
          <div className="flex-1 min-w-[140px]">
            <Label htmlFor="filtroDataInicio">Data Início</Label>
            <Input
              id="filtroDataInicio"
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <Label htmlFor="filtroDataFim">Data Fim</Label>
            <Input
              id="filtroDataFim"
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setFiltroDataInicio("")
                setFiltroDataFim("")
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {loading && <CardLoader />}

        {/* Tabela */}
        {!loading && manutencoesFiltradas.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Nenhuma manutenção encontrada</p>
            {onNovaManutencao && (
              <Button onClick={onNovaManutencao} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Primeira Manutenção
              </Button>
            )}
          </div>
        )}

        {!loading && manutencoesFiltradas.length > 0 && (
          <>
            {/* Desktop: Tabela */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Realizado Por</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manutencoesFiltradas.map((manutencao) => (
                    <TableRow key={manutencao.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(manutencao.data).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {manutencao.realizado_por_nome || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {manutencao.cargo || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {manutencao.descricao || 'Sem descrição'}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {onVisualizarManutencao && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onVisualizarManutencao(manutencao)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {onEditarManutencao && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditarManutencao(manutencao)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {onExcluirManutencao && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja excluir esta manutenção?')) {
                                  onExcluirManutencao(manutencao)
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: Cards */}
            <div className="md:hidden space-y-3">
              {manutencoesFiltradas.map((manutencao) => (
                <Card key={manutencao.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header com Data */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-sm">
                          {new Date(manutencao.data).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      {/* Realizado Por e Cargo */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {manutencao.realizado_por_nome || 'N/A'}
                          </span>
                        </div>
                        {manutencao.cargo && (
                          <div>
                            <Badge variant="outline" className="text-xs">
                              {manutencao.cargo}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Descrição */}
                      {manutencao.descricao && (
                        <div className="bg-gray-50 p-2 rounded-md">
                          <p className="text-xs text-gray-600 mb-1">Descrição</p>
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {manutencao.descricao}
                          </p>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex gap-2 pt-2 border-t">
                        {onVisualizarManutencao && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onVisualizarManutencao(manutencao)}
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                        )}
                        {onEditarManutencao && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditarManutencao(manutencao)}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        )}
                        {onExcluirManutencao && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir esta manutenção?')) {
                                onExcluirManutencao(manutencao)
                              }
                            }}
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

