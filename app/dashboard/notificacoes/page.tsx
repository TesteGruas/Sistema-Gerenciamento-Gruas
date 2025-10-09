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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotificacoesAPI, Notificacao, formatarTempoRelativo, NotificationType } from '@/lib/api-notificacoes'
import { useToast } from '@/hooks/use-toast'
import { NovaNotificacaoDialog } from '@/components/nova-notificacao-dialog'

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
  const [filtradas, setFiltradas] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'nao_lidas' | 'lidas'>('todas')
  const { toast } = useToast()

  // Carregar notificações
  const carregarNotificacoes = async () => {
    setLoading(true)
    try {
      const dados = await NotificacoesAPI.listar()
      setNotificacoes(dados)
      setFiltradas(dados)
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

  // Aplicar filtros
  useEffect(() => {
    let resultado = [...notificacoes]

    // Filtro por leitura
    if (filtroTipo === 'nao_lidas') {
      resultado = resultado.filter(n => !n.lida)
    } else if (filtroTipo === 'lidas') {
      resultado = resultado.filter(n => n.lida)
    }

    // Filtro por busca
    if (busca) {
      resultado = resultado.filter(n => 
        n.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        n.mensagem.toLowerCase().includes(busca.toLowerCase())
      )
    }

    setFiltradas(resultado)
  }, [notificacoes, filtroTipo, busca])

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

  // Deletar notificação
  const deletarNotificacao = async (id: string) => {
    try {
      await NotificacoesAPI.deletar(id)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notificações</h1>
          <p className="text-gray-600 mt-2">
            Gerencie todas as suas notificações do sistema
          </p>
        </div>
        <NovaNotificacaoDialog onNotificacaoCriada={carregarNotificacoes} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificacoes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Não Lidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{naoLidas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Lidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">
              {notificacoes.length - naoLidas}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar notificações..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              {naoLidas > 0 && (
                <Button
                  variant="outline"
                  onClick={marcarTodasComoLidas}
                  className="whitespace-nowrap"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Marcar todas como lidas
                </Button>
              )}
              
              {notificacoes.length > 0 && (
                <Button
                  variant="outline"
                  onClick={deletarTodas}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 whitespace-nowrap"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir todas
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Filtros */}
      <Tabs value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as any)}>
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="todas">
            Todas ({notificacoes.length})
          </TabsTrigger>
          <TabsTrigger value="nao_lidas">
            Não Lidas ({naoLidas})
          </TabsTrigger>
          <TabsTrigger value="lidas">
            Lidas ({notificacoes.length - naoLidas})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filtroTipo} className="mt-6 space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-500">Carregando notificações...</div>
              </CardContent>
            </Card>
          ) : filtradas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma notificação encontrada
                </h3>
                <p className="text-gray-500">
                  {busca ? 'Tente ajustar sua busca' : 'Você está em dia!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtradas.map((notificacao) => {
              const config = tipoConfig[notificacao.tipo]
              const Icon = config.icon

              return (
                <Card
                  key={notificacao.id}
                  className={`transition-all hover:shadow-md ${
                    !notificacao.lida ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Ícone */}
                      <div className={`p-3 rounded-lg ${config.bg} ${config.text} h-fit`}>
                        <Icon className="h-6 w-6" />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {notificacao.titulo}
                              </h3>
                              {!notificacao.lida && (
                                <span className="h-2 w-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {config.label}
                            </Badge>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-2">
                            {!notificacao.lida && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => marcarComoLida(notificacao.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Marcar como lida
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletarNotificacao(notificacao.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-3">
                          {notificacao.mensagem}
                        </p>

                        <div className="flex flex-col gap-2">
                          {/* Destinatário e Remetente */}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {(notificacao.destinatario || notificacao.destinatarios) && (
                              <>
                                <span className="font-medium">Para:</span>
                                <span>{formatarDestinatarios(notificacao)}</span>
                                <span className="text-gray-300">•</span>
                              </>
                            )}
                            {notificacao.remetente && (
                              <>
                                <span className="font-medium">De:</span>
                                <span>{notificacao.remetente}</span>
                                <span className="text-gray-300">•</span>
                              </>
                            )}
                            <span>{formatarTempoRelativo(notificacao.data)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

