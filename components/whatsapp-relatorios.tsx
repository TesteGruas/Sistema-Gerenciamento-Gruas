"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Download, 
  Filter, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Loader2,
  MessageSquare,
  BarChart3
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { whatsappApi, type WhatsAppLog, type EstatisticasWhatsApp, type FiltrosLogs } from "@/lib/api-whatsapp"


export function WhatsAppRelatorios() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<WhatsAppLog[]>([])
  const [estatisticas, setEstatisticas] = useState<EstatisticasWhatsApp>({
    total_enviadas: 0,
    total_entregues: 0,
    total_lidas: 0,
    total_erros: 0,
    taxa_entrega: 0,
    taxa_leitura: 0,
    tempo_medio_resposta: 0
  })
  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: '',
    status: 'all',
    tipo: 'all',
    aprovacao_id: ''
  })
  const [logSelecionado, setLogSelecionado] = useState<WhatsAppLog | null>(null)
  const [showDetalhes, setShowDetalhes] = useState(false)
  
  // Flags para controlar carregamento e evitar chamadas duplicadas
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const loadingRef = useRef(false)

  // Carregar dados iniciais apenas uma vez
  useEffect(() => {
    if (!dadosIniciaisCarregados && !loadingRef.current) {
      loadingRef.current = true
      Promise.all([carregarLogs(), carregarEstatisticas()]).finally(() => {
        setDadosIniciaisCarregados(true)
        loadingRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosIniciaisCarregados])

  // Recarregar quando filtros mudarem (com debounce)
  useEffect(() => {
    if (!dadosIniciaisCarregados) return
    
    const timer = setTimeout(() => {
      if (!loadingRef.current) {
        loadingRef.current = true
        Promise.all([carregarLogs(), carregarEstatisticas()]).finally(() => {
          loadingRef.current = false
        })
      }
    }, 300)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, dadosIniciaisCarregados])

  const carregarLogs = async () => {
    try {
      setLoading(true)
      const filtrosApi: FiltrosLogs = {
        data_inicio: filtros.data_inicio || undefined,
        data_fim: filtros.data_fim || undefined,
        status: filtros.status && filtros.status !== 'all' ? filtros.status : undefined,
        tipo: filtros.tipo && filtros.tipo !== 'all' ? filtros.tipo : undefined,
        aprovacao_id: filtros.aprovacao_id || undefined
      }
      
      const response = await whatsappApi.listarLogs(filtrosApi)
      if (response.success) {
        setLogs(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar logs de mensagens",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarEstatisticas = async () => {
    try {
      const response = await whatsappApi.obterEstatisticas({
        data_inicio: filtros.data_inicio || undefined,
        data_fim: filtros.data_fim || undefined
      })
      if (response.success) {
        setEstatisticas(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleExport = async () => {
    try {
      const filtrosApi: FiltrosLogs = {
        data_inicio: filtros.data_inicio || undefined,
        data_fim: filtros.data_fim || undefined,
        status: filtros.status && filtros.status !== 'all' ? filtros.status : undefined,
        tipo: filtros.tipo && filtros.tipo !== 'all' ? filtros.tipo : undefined
      }
      
      const blob = await whatsappApi.exportarLogs(filtrosApi)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `whatsapp-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!",
      })
    } catch (error: any) {
      console.error('Erro ao exportar:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao exportar relatório",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enviado':
        return <Badge className="bg-blue-100 text-blue-800"><Send className="w-3 h-3 mr-1" /> Enviado</Badge>
      case 'entregue':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Entregue</Badge>
      case 'lido':
        return <Badge className="bg-purple-100 text-purple-800"><Eye className="w-3 h-3 mr-1" /> Lido</Badge>
      case 'erro':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Erro</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    if (tipo === 'aprovacao') {
      return <Badge variant="outline" className="bg-blue-50">Aprovação</Badge>
    }
    return <Badge variant="outline" className="bg-orange-50">Lembrete</Badge>
  }

  const logsFiltrados = logs.filter(log => {
    if (filtros.status && filtros.status !== 'all' && log.status !== filtros.status) return false
    if (filtros.tipo && filtros.tipo !== 'all' && log.tipo !== filtros.tipo) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">{estatisticas.total_enviadas}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Entregues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold">{estatisticas.total_entregues}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {estatisticas.taxa_entrega.toFixed(1)}% taxa de entrega
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Lidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold">{estatisticas.total_lidas}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {estatisticas.taxa_leitura.toFixed(1)}% taxa de leitura
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Erros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold">{estatisticas.total_erros}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filtros.status || 'all'}
                defaultValue="all"
                onValueChange={(value) => setFiltros({ ...filtros, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="lido">Lido</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={filtros.tipo || 'all'}
                defaultValue="all"
                onValueChange={(value) => setFiltros({ ...filtros, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="aprovacao">Aprovação</SelectItem>
                  <SelectItem value="lembrete">Lembrete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={carregarLogs} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Logs de Mensagens
          </CardTitle>
          <CardDescription>
            Histórico completo de mensagens enviadas via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            </div>
          ) : logsFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tentativa</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsFiltrados.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(log.created_at), 'dd/MM/yyyy', { locale: ptBR })}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(log.created_at), 'HH:mm:ss', { locale: ptBR })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTipoBadge(log.tipo)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{log.telefone_destino}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{log.aprovacao?.funcionario_nome || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{log.aprovacao?.obra_nome || '-'}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.tentativa}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLogSelecionado(log)
                            setShowDetalhes(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Mensagem</DialogTitle>
          </DialogHeader>
          {logSelecionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(logSelecionado.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Tipo</Label>
                  <div className="mt-1">{getTipoBadge(logSelecionado.tipo)}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Telefone</Label>
                  <p className="text-sm font-medium">{logSelecionado.telefone_destino}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Tentativa</Label>
                  <p className="text-sm font-medium">{logSelecionado.tentativa}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Data de Envio</Label>
                  <p className="text-sm">
                    {format(new Date(logSelecionado.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                  </p>
                </div>
                {logSelecionado.updated_at && (
                  <div>
                    <Label className="text-xs text-gray-500">Última Atualização</Label>
                    <p className="text-sm">
                      {format(new Date(logSelecionado.updated_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
              
              {logSelecionado.aprovacao && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Informações da Aprovação</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-gray-500">Funcionário</Label>
                      <p className="font-medium">{logSelecionado.aprovacao.funcionario_nome}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Obra</Label>
                      <p className="font-medium">{logSelecionado.aprovacao.obra_nome}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Data</Label>
                      <p className="font-medium">
                        {format(new Date(logSelecionado.aprovacao.data), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Horas Extras</Label>
                      <p className="font-medium">{logSelecionado.aprovacao.horas_extras}h</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="text-xs text-gray-500 mb-2 block">Mensagem Enviada</Label>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{logSelecionado.mensagem}</p>
                </div>
              </div>

              {logSelecionado.status_detalhes && (
                <div className="border-t pt-4">
                  <Label className="text-xs text-gray-500 mb-2 block">Detalhes do Status</Label>
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <p className="text-sm">{logSelecionado.status_detalhes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

