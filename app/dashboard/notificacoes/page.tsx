"use client"

import { useState, useEffect } from 'react'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Package,
  Building2,
  DollarSign,
  Users,
  ConeIcon as Crane,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { NotificacoesAPI, Notificacao, formatarTempoRelativo, NotificationType, ListarNotificacoesResponse } from '@/lib/api-notificacoes'
import { useToast } from '@/hooks/use-toast'
import { NovaNotificacaoDialog } from '@/components/nova-notificacao-dialog'
import { NotificacaoDetailModal } from '@/components/notificacao-detail-modal'

// Configuração de ícones e cores
const tipoConfig: Record<NotificationType, { 
  icon: any; 
  bg: string; 
  text: string; 
  badge: string;
  label: string;
}> = {
  info: { 
    icon: Info, 
    bg: 'bg-blue-100', 
    text: 'text-blue-700', 
    badge: 'bg-blue-500',
    label: 'Informação'
  },
  warning: { 
    icon: AlertTriangle, 
    bg: 'bg-yellow-100', 
    text: 'text-yellow-700', 
    badge: 'bg-yellow-500',
    label: 'Aviso'
  },
  error: { 
    icon: AlertCircle, 
    bg: 'bg-red-100', 
    text: 'text-red-700', 
    badge: 'bg-red-500',
    label: 'Erro'
  },
  success: { 
    icon: CheckCircle, 
    bg: 'bg-green-100', 
    text: 'text-green-700', 
    badge: 'bg-green-500',
    label: 'Sucesso'
  },
  grua: { 
    icon: Crane, 
    bg: 'bg-purple-100', 
    text: 'text-purple-700', 
    badge: 'bg-purple-500',
    label: 'Gruas'
  },
  obra: { 
    icon: Building2, 
    bg: 'bg-orange-100', 
    text: 'text-orange-700', 
    badge: 'bg-orange-500',
    label: 'Obras'
  },
  financeiro: { 
    icon: DollarSign, 
    bg: 'bg-emerald-100', 
    text: 'text-emerald-700', 
    badge: 'bg-emerald-500',
    label: 'Financeiro'
  },
  rh: { 
    icon: Users, 
    bg: 'bg-cyan-100', 
    text: 'text-cyan-700', 
    badge: 'bg-cyan-500',
    label: 'RH'
  },
  estoque: { 
    icon: Package, 
    bg: 'bg-amber-100', 
    text: 'text-amber-700', 
    badge: 'bg-amber-500',
    label: 'Estoque'
  },
}

export default function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'nao_lidas' | 'lidas'>('todas')
  const [filtroTipoNotificacao, setFiltroTipoNotificacao] = useState<string>('all')
  const [pagina, setPagina] = useState(1)
  const [limite, setLimite] = useState(10)
  const [paginacao, setPaginacao] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  })
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState<Notificacao | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false)
  const [notificacaoParaDeletar, setNotificacaoParaDeletar] = useState<string | null>(null)
  const { toast } = useToast()

  // Carregar notificações com paginação e filtros
  const carregarNotificacoes = async (novaPagina?: number, novoLimite?: number) => {
    setLoading(true)
    try {
      const params = {
        page: novaPagina || pagina,
        limit: novoLimite || limite,
        search: busca || undefined,
        tipo: filtroTipoNotificacao !== 'all' ? filtroTipoNotificacao as NotificationType : undefined,
        lida: filtroTipo === 'todas' ? undefined : filtroTipo === 'nao_lidas' ? false : true
      }

      const response = await NotificacoesAPI.listar(params)
      setNotificacoes(response.data)
      setPaginacao(response.pagination)
    } catch (error) {
      toast({
        title: 'Erro ao carregar notificações',
        description: 'Não foi possível carregar as notificações.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarNotificacoes()
  }, [])

  // Recarregar quando filtros mudarem
  useEffect(() => {
    if (pagina > 1) {
      setPagina(1) // Reset para primeira página
    } else {
      carregarNotificacoes()
    }
  }, [busca, filtroTipo, filtroTipoNotificacao, limite])

  // Mudar página
  const mudarPagina = (novaPagina: number) => {
    setPagina(novaPagina)
    carregarNotificacoes(novaPagina)
  }

  // Mudar limite por página
  const mudarLimite = (novoLimite: number) => {
    setLimite(novoLimite)
    setPagina(1)
    carregarNotificacoes(1, novoLimite)
  }

  // Abrir modal de detalhes
  const abrirDetalhes = (notificacao: Notificacao) => {
    setNotificacaoSelecionada(notificacao)
    setModalAberto(true)
  }

  // Fechar modal
  const fecharModal = () => {
    setModalAberto(false)
    setNotificacaoSelecionada(null)
  }

  // Marcar como lida
  const marcarComoLida = async (id: string) => {
    try {
      await NotificacoesAPI.marcarComoLida(id)
      await carregarNotificacoes()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar como lida.',
        variant: 'destructive',
      })
    }
  }

  // Marcar todas como lidas
  const marcarTodasComoLidas = async () => {
    try {
      await NotificacoesAPI.marcarTodasComoLidas()
      await carregarNotificacoes()
      toast({
        title: 'Sucesso',
        description: 'Todas as notificações foram marcadas como lidas.',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar todas como lidas.',
        variant: 'destructive',
      })
    }
  }

  // Abrir popup de confirmação para deletar notificação
  const abrirConfirmacaoDeletar = (id: string) => {
    setNotificacaoParaDeletar(id)
    setConfirmacaoAberta(true)
  }

  // Deletar notificação após confirmação
  const deletarNotificacao = async () => {
    if (!notificacaoParaDeletar) return
    
    try {
      await NotificacoesAPI.deletar(notificacaoParaDeletar)
      await carregarNotificacoes()
      toast({
        title: 'Notificação excluída',
        description: 'A notificação foi excluída com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a notificação.',
        variant: 'destructive',
      })
    } finally {
      setConfirmacaoAberta(false)
      setNotificacaoParaDeletar(null)
    }
  }

  // Deletar todas
  const deletarTodas = async () => {
    if (!confirm('Deseja realmente excluir todas as notificações?')) return
    
    try {
      await NotificacoesAPI.deletarTodas()
      await carregarNotificacoes()
      toast({
        title: 'Notificações excluídas',
        description: 'Todas as notificações foram excluídas.',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir as notificações.',
        variant: 'destructive',
      })
    }
  }

  const naoLidas = notificacoes.filter(n => !n.lida).length

  // Função para formatar o destinatário
  const formatarDestinatario = (destinatario: any) => {
    if (!destinatario) return ''
    
    if (destinatario.tipo === 'geral') {
      return 'Todos os usuários'
    }
    
    const tipoFormatado = destinatario.tipo.charAt(0).toUpperCase() + destinatario.tipo.slice(1)
    const nome = destinatario.nome || 'N/A'
    return `${tipoFormatado} - ${nome}`
  }

  // Função para formatar múltiplos destinatários
  const formatarDestinatarios = (notificacao: any) => {
    // Priorizar destinatarios (array) sobre destinatario (único)
    if (notificacao.destinatarios && notificacao.destinatarios.length > 0) {
      if (notificacao.destinatarios[0].tipo === 'geral') {
        return 'Todos os usuários'
      }
      
      if (notificacao.destinatarios.length === 1) {
        return formatarDestinatario(notificacao.destinatarios[0])
      }
      
      const tipos = notificacao.destinatarios.reduce((acc: any, dest: any) => {
        acc[dest.tipo] = (acc[dest.tipo] || 0) + 1
        return acc
      }, {})
      
      const resumo = Object.entries(tipos).map(([tipo, count]) => {
        const tipoFormatado = tipo.charAt(0).toUpperCase() + tipo.slice(1)
        return `${count} ${tipoFormatado}${count > 1 ? 's' : ''}`
      }).join(', ')
      
      return `${notificacao.destinatarios.length} destinatários (${resumo})`
    }
    
    // Fallback para o formato antigo (único destinatário)
    if (notificacao.destinatario) {
      return formatarDestinatario(notificacao.destinatario)
    }
    
    return ''
  }

  return (
    <div className="space-y-4">
      {/* Header Compacto */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-sm text-gray-600">
            {paginacao.total} notificação{paginacao.total !== 1 ? 'ões' : ''} encontrada{paginacao.total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => carregarNotificacoes()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <NovaNotificacaoDialog onNotificacaoCriada={carregarNotificacoes} />
        </div>
      </div>

      {/* Filtros Compactos */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            {/* Busca */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Título ou mensagem..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>

            {/* Filtro por Status */}
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
              <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as any)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="nao_lidas">Não Lidas</SelectItem>
                  <SelectItem value="lidas">Lidas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Tipo */}
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo</label>
              <Select value={filtroTipoNotificacao} onValueChange={setFiltroTipoNotificacao}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="grua">Gruas</SelectItem>
                  <SelectItem value="obra">Obras</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="rh">RH</SelectItem>
                  <SelectItem value="estoque">Estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Itens por página */}
            <div className="flex-1 min-w-[120px]">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Por página</label>
              <Select value={limite.toString()} onValueChange={(v) => mudarLimite(parseInt(v))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              {naoLidas > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={marcarTodasComoLidas}
                  className="h-9"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Marcar lidas
                </Button>
              )}
              
              {notificacoes.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deletarTodas}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Excluir
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Notificações */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 mx-auto text-gray-400 mb-4 animate-spin" />
            <div className="text-gray-500">Carregando notificações...</div>
          </CardContent>
        </Card>
      ) : notificacoes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma notificação encontrada
            </h3>
            <p className="text-gray-500">
              {busca ? 'Tente ajustar sua busca' : 'Você está em dia!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mensagem
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remetente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notificacoes.map((notificacao) => {
                    const config = tipoConfig[notificacao.tipo]
                    const Icon = config.icon

                    return (
                      <tr
                        key={notificacao.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          !notificacao.lida ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {!notificacao.lida && (
                              <span className="h-2 w-2 bg-blue-500 rounded-full" />
                            )}
                            <span className={`text-xs font-medium ${
                              notificacao.lida ? 'text-gray-500' : 'text-blue-600'
                            }`}>
                              {notificacao.lida ? 'Lida' : 'Não lida'}
                            </span>
                          </div>
                        </td>

                        {/* Tipo */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${config.bg} ${config.text}`}>
                              <Icon className="h-3 w-3" />
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {config.label}
                            </Badge>
                          </div>
                        </td>

                        {/* Título */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => abrirDetalhes(notificacao)}
                            className="text-sm font-medium text-gray-900 max-w-xs truncate hover:text-blue-600 hover:underline text-left"
                          >
                            {notificacao.titulo}
                          </button>
                        </td>

                        {/* Mensagem */}
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {notificacao.mensagem}
                          </div>
                        </td>

                        {/* Remetente */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {notificacao.remetente || 'Sistema'}
                          </div>
                        </td>

                        {/* Data */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatarTempoRelativo(notificacao.data)}
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1">
                            {!notificacao.lida && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => marcarComoLida(notificacao.id)}
                                className="h-7 px-2 text-xs"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Lida
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirDetalhes(notificacao)}
                              className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver detalhes
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirConfirmacaoDeletar(notificacao.id)}
                              className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {!loading && notificacoes.length > 0 && paginacao.pages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Informações da paginação */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  Mostrando {((paginacao.page - 1) * paginacao.limit) + 1} a{' '}
                  {Math.min(paginacao.page * paginacao.limit, paginacao.total)} de{' '}
                  {paginacao.total} notificações
                </span>
              </div>

              {/* Controles de navegação */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => mudarPagina(pagina - 1)}
                  disabled={pagina <= 1}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, paginacao.pages) }, (_, i) => {
                    const pageNum = i + 1
                    const isActive = pageNum === pagina
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => mudarPagina(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  
                  {paginacao.pages > 5 && (
                    <>
                      <span className="text-gray-400">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => mudarPagina(paginacao.pages)}
                        className="h-8"
                      >
                        {paginacao.pages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => mudarPagina(pagina + 1)}
                  disabled={pagina >= paginacao.pages}
                  className="h-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhes da Notificação */}
      <NotificacaoDetailModal
        notificacao={notificacaoSelecionada}
        isOpen={modalAberto}
        onClose={fecharModal}
        onMarcarComoLida={marcarComoLida}
        onDeletar={abrirConfirmacaoDeletar}
      />

      {/* Dialog de confirmação para deletar notificação */}
      <Dialog open={confirmacaoAberta} onOpenChange={setConfirmacaoAberta}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmacaoAberta(false)
                setNotificacaoParaDeletar(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={deletarNotificacao}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

