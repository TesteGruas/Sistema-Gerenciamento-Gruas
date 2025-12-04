"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
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
  Filter,
  RefreshCw,
  Download
} from "lucide-react"
import { livroGruaApi } from "@/lib/api-livro-grua"
import { CardLoader } from "@/components/ui/loader"
import { ExportButton } from "@/components/export-button"
import { useToast } from "@/hooks/use-toast"

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
}

interface LivroGruaChecklistListProps {
  gruaId: string
  onNovoChecklist?: () => void
  onEditarChecklist?: (checklist: ChecklistDiario) => void
  onVisualizarChecklist?: (checklist: ChecklistDiario) => void
  onExcluirChecklist?: (checklist: ChecklistDiario) => void
}

export function LivroGruaChecklistList({
  gruaId,
  onNovoChecklist,
  onEditarChecklist,
  onVisualizarChecklist,
  onExcluirChecklist
}: LivroGruaChecklistListProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checklists, setChecklists] = useState<ChecklistDiario[]>([])
  const [filtroData, setFiltroData] = useState("")

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
        // Debug: log para verificar se os campos estão chegando
        console.log('🔍 Checklist entrada recebida:', {
          id: entrada.id,
          cabos: entrada.cabos,
          polias: entrada.polias,
          estrutura: entrada.estrutura,
          movimentos: entrada.movimentos,
          freios: entrada.freios,
          limitadores: entrada.limitadores,
          indicadores: entrada.indicadores,
          aterramento: entrada.aterramento
        })
        
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
          created_at: entrada.created_at
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

  // Filtrar checklists - memoizado para evitar recálculo desnecessário
  const checklistsFiltrados = useMemo(() => checklists.filter(checklist => {
    const matchData = !filtroData || checklist.data === filtroData

    return matchData
  }), [checklists, filtroData])

  const contarItensMarcados = useCallback((checklist: ChecklistDiario): number => {
    return [
      checklist.cabos,
      checklist.polias,
      checklist.estrutura,
      checklist.movimentos,
      checklist.freios,
      checklist.limitadores,
      checklist.indicadores,
      checklist.aterramento
    ].filter(Boolean).length
  }, [])

  // Função para formatar dados para exportação
  const formatarDadosParaExportacao = useCallback(() => {
    return checklistsFiltrados.map((checklist) => {
      const itensMarcados = contarItensMarcados(checklist)
      const totalItens = 8
      const status = itensMarcados === totalItens ? 'Completo' : 'Incompleto'
      
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
        'Itens Verificados': `${itensMarcados}/${totalItens}`,
        'Status': status,
        'Observações': checklist.observacoes || ''
      }
    })
  }, [checklistsFiltrados, contarItensMarcados])

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Checklists Diários
            </CardTitle>
            <CardDescription>
              Lista de checklists diários realizados nesta grua
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
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
              <Button onClick={onNovoChecklist} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Novo Checklist
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex gap-2 mb-4 items-end">
          <div className="flex-1">
            <Label htmlFor="filtroData">Filtrar por Data</Label>
            <Input
              id="filtroData"
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setFiltroData("")
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
        {!loading && checklistsFiltrados.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Nenhum checklist encontrado</p>
            {onNovoChecklist && (
              <Button onClick={onNovoChecklist} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Checklist
              </Button>
            )}
          </div>
        )}

        {!loading && checklistsFiltrados.length > 0 && (
          <>
            {/* Desktop: Tabela */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Itens Verificados</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checklistsFiltrados.map((checklist) => {
                    const itensMarcados = contarItensMarcados(checklist)
                    const totalItens = 8
                    const todosMarcados = itensMarcados === totalItens
                    
                    return (
                      <TableRow key={checklist.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(checklist.data).toLocaleDateString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {checklist.funcionario_nome || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {itensMarcados}/{totalItens}
                            </span>
                            <Badge variant={todosMarcados ? "default" : "secondary"}>
                              {todosMarcados ? "Completo" : "Incompleto"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={todosMarcados ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                            {todosMarcados ? "OK" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {onVisualizarChecklist && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onVisualizarChecklist(checklist)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            {onEditarChecklist && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditarChecklist(checklist)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {onExcluirChecklist && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja excluir este checklist?')) {
                                    onExcluirChecklist(checklist)
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: Cards */}
            <div className="md:hidden space-y-3">
              {checklistsFiltrados.map((checklist) => {
                const itensMarcados = contarItensMarcados(checklist)
                const totalItens = 8
                const todosMarcados = itensMarcados === totalItens
                
                return (
                  <Card key={checklist.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header com Data e Status */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-sm">
                              {new Date(checklist.data).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <Badge className={todosMarcados ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                            {todosMarcados ? "OK" : "Pendente"}
                          </Badge>
                        </div>

                        {/* Funcionário */}
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {checklist.funcionario_nome || 'N/A'}
                          </span>
                        </div>

                        {/* Itens Verificados */}
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <span className="text-xs text-gray-600">Itens Verificados</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {itensMarcados}/{totalItens}
                            </span>
                            <Badge variant={todosMarcados ? "default" : "secondary"} className="text-xs">
                              {todosMarcados ? "Completo" : "Incompleto"}
                            </Badge>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 pt-2 border-t">
                          {onVisualizarChecklist && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onVisualizarChecklist(checklist)}
                              className="flex-1"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver
                            </Button>
                          )}
                          {onEditarChecklist && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditarChecklist(checklist)}
                              className="flex-1"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </Button>
                          )}
                          {onExcluirChecklist && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja excluir este checklist?')) {
                                  onExcluirChecklist(checklist)
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
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

