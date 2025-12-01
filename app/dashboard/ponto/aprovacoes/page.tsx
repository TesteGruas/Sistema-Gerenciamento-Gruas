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
  RefreshCw,
  FileText
} from "lucide-react"
import AdminGuard from "@/components/admin-guard"
import { WhatsAppTestButton } from "@/components/whatsapp-test-button"
import api from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  created_at?: string
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
  
  // Recarregar estatísticas quando filtros mudarem
  useEffect(() => {
    carregarEstatisticas()
  }, [filtros.data_inicio, filtros.data_fim])

  const carregarAprovacoes = async () => {
    try {
      setLoading(true)
      
      const params: any = {
        page: paginacao.page,
        limit: paginacao.limit
      }

      if (filtros.status !== 'todas') {
        params.status = filtros.status
      }
      if (filtros.data_inicio) {
        params.data_inicio = filtros.data_inicio
      }
      if (filtros.data_fim) {
        params.data_fim = filtros.data_fim
      }
      if (filtros.funcionario) {
        params.funcionario = filtros.funcionario
      }

      const response = await api.get('ponto-eletronico/registros', { params })
      const result = response.data
      
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
      const response = await api.get('ponto-eletronico/relatorios/horas-extras', {
        params: {
          data_inicio: filtros.data_inicio || '2024-01-01',
          data_fim: filtros.data_fim || '2024-12-31'
        }
      })
      const result = response.data
      
      if (result.success) {
        // Calcular estatísticas básicas
        const registros = result.data.registros || []
        const totalRegistros = registros.length
        const aprovados = registros.filter((r: Aprovacao) => r.status === 'Aprovado').length
        const rejeitados = registros.filter((r: Aprovacao) => r.status === 'Rejeitado').length
        const pendentes = registros.filter((r: Aprovacao) => r.status === 'Pendente Aprovação').length
        
        // Calcular tempo médio de aprovação baseado em data_aprovacao - created_at
        const calcularTempoMedioAprovacao = (registros: Aprovacao[]): number => {
          const aprovadosComDatas = registros.filter((r: Aprovacao) => 
            r.status === 'Aprovado' && 
            r.data_aprovacao && 
            r.created_at
          )
          
          if (aprovadosComDatas.length === 0) return 0
          
          const tempos = aprovadosComDatas.map((r: Aprovacao) => {
            try {
              const criado = new Date(r.created_at!)
              const aprovado = new Date(r.data_aprovacao!)
              
              // Calcular diferença em horas
              const diffMs = aprovado.getTime() - criado.getTime()
              const diffHoras = diffMs / (1000 * 60 * 60)
              
              return diffHoras
            } catch (error) {
              console.warn('Erro ao calcular tempo de aprovação:', error)
              return 0
            }
          }).filter(t => t > 0) // Remover valores inválidos
          
          if (tempos.length === 0) return 0
          
          const soma = tempos.reduce((a, b) => a + b, 0)
          return soma / tempos.length
        }
        
        const tempoMedio = calcularTempoMedioAprovacao(registros)
        
        setEstatisticas({
          total_pendentes: pendentes,
          total_aprovados: aprovados,
          total_rejeitados: rejeitados,
          tempo_medio_aprovacao: tempoMedio,
          taxa_aprovacao: totalRegistros > 0 ? (aprovados / totalRegistros) * 100 : 0
        })
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

  const exportarRelatorio = async (tipo: 'csv' | 'pdf' | 'json' = 'csv') => {
    try {
      const params: any = {}
      
      if (filtros.status !== 'todas') {
        params.status = filtros.status
      }
      if (filtros.data_inicio) {
        params.data_inicio = filtros.data_inicio
      }
      if (filtros.data_fim) {
        params.data_fim = filtros.data_fim
      }
      if (filtros.funcionario) {
        params.funcionario = filtros.funcionario
      }

      const response = await api.get('ponto-eletronico/relatorios/horas-extras', { params })
      const result = response.data
      
      if (!result.success || !result.data?.registros) {
        throw new Error('Dados não disponíveis para exportação')
      }

      const registros = result.data.registros || []
      
      if (tipo === 'csv') {
        // Gerar CSV
        const headers = ['Funcionário', 'Cargo', 'Data', 'Entrada', 'Saída', 'Horas Trabalhadas', 'Horas Extras', 'Status', 'Aprovado Por', 'Data Aprovação']
        const rows = registros.map((r: Aprovacao) => [
          r.funcionario?.nome || '',
          r.funcionario?.cargo || '',
          formatarData(r.data),
          r.entrada || '-',
          r.saida || '-',
          (r.horas_trabalhadas || 0).toFixed(2),
          (r.horas_extras || 0).toFixed(2),
          r.status,
          r.aprovador?.nome || '-',
          r.data_aprovacao ? formatarData(r.data_aprovacao) : '-'
        ])
        
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `aprovacoes_horas_extras_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
      } else if (tipo === 'json') {
        // Gerar JSON
        const jsonContent = JSON.stringify(registros, null, 2)
        const blob = new Blob([jsonContent], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `aprovacoes_horas_extras_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
      } else if (tipo === 'pdf') {
        // Gerar PDF usando jsPDF
        try {
          const { jsPDF } = await import('jspdf')
          const autoTable = (await import('jspdf-autotable')).default
          
          const doc = new jsPDF('landscape', 'mm', 'a4')
          
          // Adicionar logos no cabeçalho se disponível
          let yPos = 15
          try {
            const { adicionarLogosNoCabecalhoFrontend } = await import('@/lib/utils/pdf-logos-frontend')
            yPos = await adicionarLogosNoCabecalhoFrontend(doc, 10)
            yPos += 5
          } catch {
            yPos = 20
          }
          
          // Título
          doc.setFontSize(18)
          doc.setFont('helvetica', 'bold')
          doc.text('RELATÓRIO DE APROVAÇÕES - HORAS EXTRAS', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' })
          yPos += 10
          
          // Informações do período
          doc.setFontSize(11)
          doc.setFont('helvetica', 'normal')
          const periodoTexto = filtros.data_inicio && filtros.data_fim
            ? `Período: ${formatarData(filtros.data_inicio)} a ${formatarData(filtros.data_fim)}`
            : 'Período: Todos os registros'
          doc.text(periodoTexto, 14, yPos)
          yPos += 6
          doc.text(`Total de registros: ${registros.length}`, 14, yPos)
          yPos += 10
          
          // Dados da tabela
          const tableData = registros.map((r: Aprovacao) => [
            r.funcionario?.nome || '-',
            r.funcionario?.cargo || '-',
            formatarData(r.data),
            r.entrada || '-',
            r.saida || '-',
            `${(r.horas_trabalhadas || 0).toFixed(2)}h`,
            `${(r.horas_extras || 0).toFixed(2)}h`,
            r.status,
            r.aprovador?.nome || '-',
            r.data_aprovacao ? formatarData(r.data_aprovacao) : '-'
          ])
          
          autoTable(doc, {
            head: [['Funcionário', 'Cargo', 'Data', 'Entrada', 'Saída', 'Horas', 'Extras', 'Status', 'Aprovado Por', 'Data Aprovação']],
            body: tableData,
            startY: yPos,
            styles: { 
              fontSize: 8,
              cellPadding: 2,
              textColor: [0, 0, 0]
            },
            headStyles: { 
              fillColor: [66, 139, 202],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 8
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245]
            },
            margin: { left: 14, right: 14 }
          })
          
          // Data de geração
          const finalY = (doc as any).lastAutoTable.finalY + 10
          doc.setFontSize(8)
          doc.setTextColor(128, 128, 128)
          doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, doc.internal.pageSize.getWidth() / 2, finalY, { align: 'center' })
          
          // Adicionar rodapé se disponível
          try {
            const { adicionarRodapeEmpresaFrontend } = await import('@/lib/utils/pdf-rodape-frontend')
            adicionarRodapeEmpresaFrontend(doc)
          } catch {
            // Continuar sem rodapé
          }
          
          // Salvar PDF
          doc.save(`aprovacoes_horas_extras_${new Date().toISOString().split('T')[0]}.pdf`)
        } catch (error) {
          console.error('Erro ao gerar PDF:', error)
          throw new Error('Erro ao gerar PDF. Certifique-se de que os dados estão carregados.')
        }
      }
      
      toast({
        title: "Sucesso",
        description: `Relatório exportado em ${tipo.toUpperCase()} com sucesso`,
        variant: "default"
      })
    } catch (error) {
      console.error("Erro ao exportar relatório:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao exportar relatório",
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
            <WhatsAppTestButton variant="outline" size="default" />
            <Button
              variant="outline"
              onClick={carregarAprovacoes}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportarRelatorio('csv')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportarRelatorio('json')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportarRelatorio('pdf')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tempo Médio Aprovação</p>
                    <p className="text-2xl font-bold">{estatisticas.tempo_medio_aprovacao.toFixed(1)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-purple-600" />
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
