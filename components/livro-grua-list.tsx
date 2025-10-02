"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertCircle, 
  Search, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Calendar,
  Clock,
  User,
  Wrench,
  Filter,
  RefreshCw
} from "lucide-react"
import { livroGruaApi, EntradaLivroGruaCompleta, FiltrosLivroGrua } from "@/lib/api-livro-grua"
import { CardLoader } from "@/components/ui/loader"

interface LivroGruaListProps {
  gruaId?: string
  onNovaEntrada?: () => void
  onEditarEntrada?: (entrada: EntradaLivroGruaCompleta) => void
  onVisualizarEntrada?: (entrada: EntradaLivroGruaCompleta) => void
  onExcluirEntrada?: (entrada: EntradaLivroGruaCompleta) => void
  modoCompacto?: boolean
}

export default function LivroGruaList({
  gruaId,
  onNovaEntrada,
  onEditarEntrada,
  onVisualizarEntrada,
  onExcluirEntrada,
  modoCompacto = false
}: LivroGruaListProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entradas, setEntradas] = useState<EntradaLivroGruaCompleta[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosLivroGrua>({
    grua_id: gruaId,
    page: 1,
    limit: modoCompacto ? 5 : 20
  })

  const [searchTerm, setSearchTerm] = useState("")

  // Carregar entradas
  const carregarEntradas = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await livroGruaApi.listarEntradas(filtros)
      setEntradas(response.data)
      setPagination(response.pagination)

    } catch (err) {
      console.error('Erro ao carregar entradas:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar entradas')
    } finally {
      setLoading(false)
    }
  }

  // Carregar entradas na inicialização e quando filtros mudarem
  useEffect(() => {
    carregarEntradas()
  }, [filtros])

  // Atualizar filtros quando searchTerm mudar
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFiltros(prev => ({
        ...prev,
        page: 1 // Reset para primeira página
      }))
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleFiltroChange = (campo: keyof FiltrosLivroGrua, valor: any) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      page: 1 // Reset para primeira página
    }))
  }

  const handlePageChange = (novaPagina: number) => {
    setFiltros(prev => ({
      ...prev,
      page: novaPagina
    }))
  }

  const handleExportar = async () => {
    if (!gruaId) return

    try {
      await livroGruaApi.baixarCSV(gruaId, filtros.data_inicio, filtros.data_fim)
    } catch (err) {
      console.error('Erro ao exportar:', err)
      setError('Erro ao exportar dados')
    }
  }

  const obterCorStatus = (status: string) => {
    const cores: Record<string, string> = {
      'ok': 'bg-green-100 text-green-800',
      'manutencao': 'bg-yellow-100 text-yellow-800',
      'falha': 'bg-red-100 text-red-800'
    }
    return cores[status] || 'bg-gray-100 text-gray-800'
  }

  const obterCorTipo = (tipo: string) => {
    const cores: Record<string, string> = {
      'checklist': 'bg-green-100 text-green-800',
      'manutencao': 'bg-yellow-100 text-yellow-800',
      'falha': 'bg-red-100 text-red-800'
    }
    return cores[tipo] || 'bg-gray-100 text-gray-800'
  }

  const tiposEntrada = livroGruaApi.getTiposEntrada()
  const statusEntrada = livroGruaApi.getStatusEntrada()

  if (modoCompacto) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Últimas Entradas</CardTitle>
            {onNovaEntrada && (
              <Button size="sm" onClick={onNovaEntrada}>
                <Plus className="w-4 h-4 mr-1" />
                Nova
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <CardLoader text="Carregando..." />
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : entradas.length > 0 ? (
            <div className="space-y-3">
              {entradas.map((entrada) => (
                <div key={entrada.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      entrada.status_entrada === 'ok' ? 'bg-green-500' : 
                      entrada.status_entrada === 'falha' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{entrada.descricao}</p>
                      <p className="text-xs text-gray-500">
                        {livroGruaApi.formatarData(entrada.data_entrada)} • {entrada.funcionario_nome}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={obterCorStatus(entrada.status_entrada)}>
                      {entrada.status_entrada}
                    </Badge>
                    {onVisualizarEntrada && (
                      <Button size="sm" variant="ghost" onClick={() => onVisualizarEntrada(entrada)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhuma entrada encontrada
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com ações */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Livro da Grua
              </CardTitle>
              <CardDescription>
                {pagination.total} entradas encontradas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={carregarEntradas} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              {gruaId && (
                <Button variant="outline" onClick={handleExportar}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
              {onNovaEntrada && (
                <Button onClick={onNovaEntrada}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Entrada
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Descrição, funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Tipo</Label>
              <Select
                value={filtros.tipo_entrada || 'todos'}
                onValueChange={(value) => handleFiltroChange('tipo_entrada', value === 'todos' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {tiposEntrada.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={filtros.status_entrada || 'todos'}
                onValueChange={(value) => handleFiltroChange('status_entrada', value === 'todos' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  {statusEntrada.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data Início</Label>
              <Input
                type="date"
                value={filtros.data_inicio || ''}
                onChange={(e) => handleFiltroChange('data_inicio', e.target.value || undefined)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de entradas */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <CardLoader text="Carregando entradas..." />
          ) : error ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : entradas.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Data</TableHead>
                    <TableHead className="w-[150px]">Grua</TableHead>
                    <TableHead className="w-[150px]">Funcionário</TableHead>
                    <TableHead className="w-[100px]">Tipo</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[200px]">Descrição</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entradas.map((entrada) => (
                    <TableRow key={entrada.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>{livroGruaApi.formatarData(entrada.data_entrada)}</span>
                        </div>
                        {entrada.hora_entrada && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {entrada.hora_entrada}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-blue-600" />
                          <span>{entrada.grua_modelo || entrada.grua_id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>{entrada.funcionario_nome || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={obterCorTipo(entrada.tipo_entrada)}>
                          {entrada.tipo_entrada_display || entrada.tipo_entrada}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={obterCorStatus(entrada.status_entrada)}>
                          {entrada.status_entrada}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="max-w-[200px] truncate" title={entrada.descricao}>
                          {entrada.descricao}
                        </div>
                        {entrada.observacoes && (
                          <div className="text-xs text-gray-500 mt-1 truncate" title={entrada.observacoes}>
                            Obs: {entrada.observacoes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {onVisualizarEntrada && (
                            <Button size="sm" variant="ghost" onClick={() => onVisualizarEntrada(entrada)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {onEditarEntrada && (
                            <Button size="sm" variant="ghost" onClick={() => onEditarEntrada(entrada)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {onExcluirEntrada && (
                            <Button size="sm" variant="ghost" onClick={() => onExcluirEntrada(entrada)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma entrada encontrada</h3>
              <p className="text-gray-600 mb-4">
                Não há entradas que correspondam aos filtros selecionados.
              </p>
              {onNovaEntrada && (
                <Button onClick={onNovaEntrada}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Entrada
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {pagination.pages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.pages} ({pagination.total} entradas)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
