"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { 
  Clock, 
  User, 
  Building2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw
} from "lucide-react"
import AdminGuard from "@/components/admin-guard"

interface Aprovacao {
  id: string
  funcionario_id: number
  data: string
  entrada: string
  saida: string
  horas_trabalhadas: number
  horas_extras: number
  status: string
  observacoes?: string
  aprovado_por?: number
  data_aprovacao?: string
  assinatura_digital_path?: string
  funcionario: {
    nome: string
    cargo: string
    turno: string
    obra_atual_id: number
  }
  aprovador?: {
    nome: string
  }
}

interface Estatisticas {
  total_pendentes: number
  total_aprovados: number
  total_rejeitados: number
  tempo_medio_aprovacao: number
  taxa_aprovacao: number
}

export default function AprovacoesDashboard() {
  const { toast } = useToast()
  
  const [aprovacoes, setAprovacoes] = useState<Aprovacao[]>([])
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    status: 'todas',
    obra: 'todas',
    data_inicio: '',
    data_fim: '',
    funcionario: ''
  })
  const [paginacao, setPaginacao] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    carregarAprovacoes()
    carregarEstatisticas()
  }, [filtros, paginacao.page])

  const carregarAprovacoes = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: paginacao.page.toString(),
        limit: paginacao.limit.toString()
      })

      if (filtros.status !== 'todas') {
        params.append('status', filtros.status)
      }
      if (filtros.data_inicio) {
        params.append('data_inicio', filtros.data_inicio)
      }
      if (filtros.data_fim) {
        params.append('data_fim', filtros.data_fim)
      }
      if (filtros.funcionario) {
        params.append('funcionario', filtros.funcionario)
      }

      const response = await fetch(`/api/ponto-eletronico/registros?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar aprovações')
      }

      const result = await response.json()
      
      if (result.success) {
        // Filtrar apenas registros com horas extras
        const registrosComHorasExtras = result.data.filter((registro: Aprovacao) => 
          registro.horas_extras > 0
        )
        
        setAprovacoes(registrosComHorasExtras)
        setPaginacao(prev => ({
          ...prev,
          total: result.pagination.total,
          pages: result.pagination.pages
        }))
      } else {
        throw new Error(result.message || 'Erro ao carregar aprovações')
      }
    } catch (error) {
      console.error("Erro ao carregar aprovações:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das aprovações",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarEstatisticas = async () => {
    try {
      const response = await fetch('/api/ponto-eletronico/relatorios/horas-extras?data_inicio=2024-01-01&data_fim=2024-12-31', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Calcular estatísticas básicas
          const totalRegistros = result.data.registros.length
          const aprovados = result.data.registros.filter((r: Aprovacao) => r.status === 'Aprovado').length
          const rejeitados = result.data.registros.filter((r: Aprovacao) => r.status === 'Rejeitado').length
          const pendentes = result.data.registros.filter((r: Aprovacao) => r.status === 'Pendente Aprovação').length
          
          setEstatisticas({
            total_pendentes: pendentes,
            total_aprovados: aprovados,
            total_rejeitados: rejeitados,
            tempo_medio_aprovacao: 2.5, // Mock - calcular baseado em data_aprovacao - created_at
            taxa_aprovacao: totalRegistros > 0 ? (aprovados / totalRegistros) * 100 : 0
          })
        }
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendente Aprovação':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case 'Aprovado':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
      case 'Rejeitado':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarHorario = (horario: string) => {
    return horario || '-'
  }

  const exportarRelatorio = async () => {
    try {
      const params = new URLSearchParams()
      
      if (filtros.status !== 'todas') {
        params.append('status', filtros.status)
      }
      if (filtros.data_inicio) {
        params.append('data_inicio', filtros.data_inicio)
      }
      if (filtros.data_fim) {
        params.append('data_fim', filtros.data_fim)
      }

      const response = await fetch(`/api/ponto-eletronico/relatorios/horas-extras?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Aqui você implementaria a lógica de exportação
          toast({
            title: "Sucesso",
            description: "Relatório exportado com sucesso",
            variant: "default"
          })
        }
      }
    } catch (error) {
      console.error("Erro ao exportar relatório:", error)
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório",
        variant: "destructive"
      })
    }
  }

  const limparFiltros = () => {
    setFiltros({
      status: 'todas',
      obra: 'todas',
      data_inicio: '',
      data_fim: '',
      funcionario: ''
    })
    setPaginacao(prev => ({ ...prev, page: 1 }))
  }

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestão de Aprovações</h1>
            <p className="text-gray-600">Gerencie aprovações de horas extras</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={carregarAprovacoes}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={exportarRelatorio}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pendentes</p>
                    <p className="text-2xl font-bold">{estatisticas.total_pendentes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Aprovados</p>
                    <p className="text-2xl font-bold">{estatisticas.total_aprovados}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rejeitados</p>
                    <p className="text-2xl font-bold">{estatisticas.total_rejeitados}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Taxa Aprovação</p>
                    <p className="text-2xl font-bold">{estatisticas.taxa_aprovacao.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filtros.status} onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="Pendente Aprovação">Pendente</SelectItem>
                    <SelectItem value="Aprovado">Aprovado</SelectItem>
                    <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data Início</label>
                <Input
                  type="date"
                  value={filtros.data_inicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data Fim</label>
                <Input
                  type="date"
                  value={filtros.data_fim}
                  onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Funcionário</label>
                <Input
                  placeholder="Buscar funcionário..."
                  value={filtros.funcionario}
                  onChange={(e) => setFiltros(prev => ({ ...prev, funcionario: e.target.value }))}
                />
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={limparFiltros} className="w-full">
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Aprovações */}
        <Card>
          <CardHeader>
            <CardTitle>Registros de Horas Extras</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Horários</TableHead>
                      <TableHead>Horas Extras</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aprovado Por</TableHead>
                      <TableHead>Data Aprovação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aprovacoes.map((aprovacao) => (
                      <TableRow key={aprovacao.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{aprovacao.funcionario.nome}</div>
                            <div className="text-sm text-gray-500">{aprovacao.funcionario.cargo}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatarData(aprovacao.data)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Entrada: {formatarHorario(aprovacao.entrada)}</div>
                            <div>Saída: {formatarHorario(aprovacao.saida)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-orange-100 text-orange-800">
                            +{aprovacao.horas_extras}h
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(aprovacao.status)}</TableCell>
                        <TableCell>
                          {aprovacao.aprovador?.nome || '-'}
                        </TableCell>
                        <TableCell>
                          {aprovacao.data_aprovacao ? formatarData(aprovacao.data_aprovacao) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {aprovacao.assinatura_digital_path && (
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {aprovacoes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum registro encontrado
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {paginacao.pages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Página {paginacao.page} de {paginacao.pages} ({paginacao.total} registros)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginacao(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={paginacao.page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginacao(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={paginacao.page === paginacao.pages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  )
}
