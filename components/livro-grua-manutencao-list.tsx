"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertCircle, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Calendar,
  User,
  Wrench,
  Filter,
  RefreshCw
} from "lucide-react"
import { livroGruaApi } from "@/lib/api-livro-grua"
import { CardLoader } from "@/components/ui/loader"

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([])
  const [searchTerm, setSearchTerm] = useState("")
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

  // Filtrar manutenções
  const manutencoesFiltradas = manutencoes.filter(manutencao => {
    const matchSearch = !searchTerm || 
      manutencao.realizado_por_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manutencao.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manutencao.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchDataInicio = !filtroDataInicio || manutencao.data >= filtroDataInicio
    const matchDataFim = !filtroDataFim || manutencao.data <= filtroDataFim

    return matchSearch && matchDataInicio && matchDataFim
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Manutenções
            </CardTitle>
            <CardDescription>
              Histórico de manutenções realizadas nesta grua
            </CardDescription>
          </div>
          {onNovaManutencao && (
            <Button onClick={onNovaManutencao}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Manutenção
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="search"
                placeholder="Buscar por funcionário, cargo ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="filtroDataInicio">Data Início</Label>
            <Input
              id="filtroDataInicio"
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="filtroDataFim">Data Fim</Label>
            <div className="flex gap-2">
              <Input
                id="filtroDataFim"
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setFiltroDataInicio("")
                  setFiltroDataFim("")
                }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
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
          <div className="overflow-x-auto">
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
        )}
      </CardContent>
    </Card>
  )
}

