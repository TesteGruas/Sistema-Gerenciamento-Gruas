"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { 
  Bell, 
  BellRing,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  RefreshCw,
  Briefcase,
  Eye,
  CalendarDays
} from "lucide-react"
import { NotificacoesAPI, Notificacao as NotificacaoAPI } from "@/lib/api-notificacoes"
import { STORAGE_KEY_NOTIFICACOES_LOCAIS } from "@/hooks/use-vencimentos-documentos"
import { PWA_NOTIFICACOES_API_EVENT } from "@/hooks/use-pwa-socket-notifications"

interface Notificacao {
  id: string
  tipo: 'info' | 'alerta' | 'sucesso' | 'erro'
  tipoOriginal?: string // Tipo original da API (grua, obra, etc)
  titulo: string
  mensagem: string
  lida: boolean
  data: string
  acao?: string
}

type PeriodoData = 'todas' | 'hoje' | 'ontem' | 'ultimos7' | 'ultimos30'

function inicioDoDia(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function fimDoDia(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function mesmoDiaCalendario(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function notificacaoNoPeriodo(dataIso: string, periodo: PeriodoData): boolean {
  if (periodo === 'todas') return true

  const t = new Date(dataIso)
  if (Number.isNaN(t.getTime())) return false

  const agora = new Date()
  const hojeInicio = inicioDoDia(agora)
  const hojeFim = fimDoDia(agora)

  if (periodo === 'hoje') {
    return t >= hojeInicio && t <= hojeFim
  }

  const ontem = new Date(hojeInicio)
  ontem.setDate(ontem.getDate() - 1)
  if (periodo === 'ontem') {
    return mesmoDiaCalendario(t, ontem)
  }

  if (periodo === 'ultimos7') {
    const limite = new Date(hojeInicio)
    limite.setDate(limite.getDate() - 6)
    return t >= limite && t <= hojeFim
  }

  if (periodo === 'ultimos30') {
    const limite = new Date(hojeInicio)
    limite.setDate(limite.getDate() - 29)
    return t >= limite && t <= hojeFim
  }

  return true
}

const PERIODOS: { id: PeriodoData; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "hoje", label: "Hoje" },
  { id: "ontem", label: "Ontem" },
  { id: "ultimos7", label: "7 dias" },
  { id: "ultimos30", label: "30 dias" },
]

export default function PWANotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [filtro, setFiltro] = useState<'todas' | 'nao-lidas'>('todas')
  const [periodoData, setPeriodoData] = useState<PeriodoData>('todas')
  const [loading, setLoading] = useState(false)
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState<Notificacao | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const carregarNotificacoes = useCallback(async () => {
    setLoading(true)
    try {
      // Buscar notificações reais da API
      const response = await NotificacoesAPI.listar({
        page: 1,
        limit: 50,
        lida: filtro === 'todas' ? undefined : false
      })

      // Buscar notificações locais (fallback para vencimentos)
      // IMPORTANTE: Usar a constante exportada do hook para garantir que é a mesma chave
      const notificacoesLocaisKey = STORAGE_KEY_NOTIFICACOES_LOCAIS
      const notificacoesLocaisStr = localStorage.getItem(notificacoesLocaisKey)
      let notificacoesLocais: any[] = []
      
      try {
        if (notificacoesLocaisStr) {
          const parsed = JSON.parse(notificacoesLocaisStr)
          // Garantir que é um array - se não for, algo está errado
          if (Array.isArray(parsed)) {
            notificacoesLocais = parsed
          } else {
            notificacoesLocais = []
          }
        } else {
          notificacoesLocais = []
        }
      } catch (parseError) {
        notificacoesLocais = []
      }

      // Mapear notificações da API para o formato esperado (mesmo que seja array vazio)
      const notificacoesMapeadas: Notificacao[] = (response.success && response.data && Array.isArray(response.data))
        ? response.data.map((notif: NotificacaoAPI) => {
          // Mapear tipos da API para tipos do componente
          let tipo: 'info' | 'alerta' | 'sucesso' | 'erro' = 'info'
          const tipoOriginal = notif.tipo
          if (tipoOriginal === 'warning') {
            tipo = 'alerta'
          } else if (tipoOriginal === 'success') {
            tipo = 'sucesso'
          } else if (tipoOriginal === 'error') {
            tipo = 'erro'
          }

          return {
            id: String(notif.id),
            tipo,
            tipoOriginal: notif.tipo, // Manter tipo original
            titulo: notif.titulo,
            mensagem: notif.mensagem,
            lida: notif.lida,
            data: notif.data || notif.created_at || new Date().toISOString(),
              acao: notif.link
            }
          })
        : []

      // Adicionar notificações locais ao final (sempre, mesmo se a API retornar vazio)
      const notificacoesLocaisMapeadas: Notificacao[] = notificacoesLocais
        .filter((n: any) => {
          // Validar que é um objeto válido
          if (!n || typeof n !== 'object') {
            return false
          }
          
          // Filtrar apenas notificações não lidas se o filtro for 'nao-lidas'
          if (filtro === 'nao-lidas' && n.lida) {
            return false
          }
          return true
        })
        .map((n: any) => {
          return {
            id: n.id || `local_${Date.now()}_${Math.random()}`,
            tipo: (n.tipo === 'warning' ? 'alerta' : 'info') as 'info' | 'alerta' | 'sucesso' | 'erro',
            tipoOriginal: n.tipo || 'warning',
            titulo: n.titulo || 'Notificação',
            mensagem: n.mensagem || '',
            lida: n.lida || false,
            data: n.data || new Date().toISOString(),
            acao: n.link || n.acao
          }
        })

      // Combinar notificações da API com notificações locais
      const todasNotificacoes = [...notificacoesMapeadas, ...notificacoesLocaisMapeadas]
      setNotificacoes(todasNotificacoes)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
      
      setNotificacoes([])
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => {
    carregarNotificacoes()
  }, [carregarNotificacoes])

  useEffect(() => {
    const onApi = () => {
      void carregarNotificacoes()
    }
    window.addEventListener(PWA_NOTIFICACOES_API_EVENT, onApi)
    return () => window.removeEventListener(PWA_NOTIFICACOES_API_EVENT, onApi)
  }, [carregarNotificacoes])

  // Recarregar notificações quando houver mudanças no localStorage (notificações locais)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_NOTIFICACOES_LOCAIS) {
        carregarNotificacoes()
      }
    }
    
    // Listener para evento customizado (mesma aba)
    const handleNotificacoesAtualizadas = (e: CustomEvent) => {
      // Pequeno delay para garantir que o localStorage foi atualizado
      setTimeout(() => {
        carregarNotificacoes()
      }, 100)
    }

    // Listener para mudanças no localStorage (outras abas)
    window.addEventListener('storage', handleStorageChange)
    
    // Listener para evento customizado (mesma aba)
    window.addEventListener('notificacoes-locais-atualizadas', handleNotificacoesAtualizadas as EventListener)

    // Verificar mudanças periodicamente (mesma aba - storage event não funciona na mesma aba)
    const intervalId = setInterval(() => {
      try {
        const locaisStr = localStorage.getItem(STORAGE_KEY_NOTIFICACOES_LOCAIS)
        if (!locaisStr) {
          // Se não há notificações locais mas havia antes, recarregar para limpar
          if (notificacoes.some(n => n.id?.startsWith('local_'))) {
            carregarNotificacoes()
          }
          return
        }
        
        let locais: any[] = []
        try {
          const parsed = JSON.parse(locaisStr)
          locais = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? Object.values(parsed) : [])
        } catch (parseErr) {
          return
        }
        
        // Verificar se há notificações locais que não estão sendo exibidas
        if (locais.length > 0) {
          const temLocaisNaLista = notificacoes.some(n => n.id?.startsWith('local_'))
          const totalLocaisNaLista = notificacoes.filter(n => n.id?.startsWith('local_')).length
          
          // Se o número de notificações locais no localStorage é diferente do número na lista, recarregar
          if (totalLocaisNaLista !== locais.length || (!temLocaisNaLista && locais.length > 0)) {
            carregarNotificacoes()
          }
        } else {
          // Se não há notificações locais mas havia antes, recarregar para limpar
          if (notificacoes.some(n => n.id?.startsWith('local_'))) {
            carregarNotificacoes()
          }
        }
      } catch (err) {
        // Silenciar erros na verificação periódica
      }
    }, 2000) // Verificar a cada 2 segundos

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('notificacoes-locais-atualizadas', handleNotificacoesAtualizadas as EventListener)
      clearInterval(intervalId)
    }
  }, [notificacoes, carregarNotificacoes]) // Usar carregarNotificacoes como dependência

  const marcarComoLida = async (id: string) => {
    try {
      await NotificacoesAPI.marcarComoLida(id)
      setNotificacoes(prev => 
        prev.map(n => n.id === id ? { ...n, lida: true } : n)
      )
      
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      
    }
  }

  const excluirNotificacao = async (id: string) => {
    try {
      await NotificacoesAPI.deletar(id)
      setNotificacoes(prev => prev.filter(n => n.id !== id))
      
    } catch (error) {
      console.error('Erro ao excluir notificação:', error)
      
    }
  }

  const marcarTodasComoLidas = async () => {
    try {
      await NotificacoesAPI.marcarTodasComoLidas()
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
      
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      
    }
  }

  const getIconeNotificacao = (tipo: string, tipoOriginal?: string) => {
    // Se for tipo grua, usar ícone de grua
    if (tipoOriginal === 'grua') {
      return <Briefcase className="w-5 h-5 text-purple-600" />
    }
    
    switch (tipo) {
      case 'sucesso': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'alerta': return <AlertCircle className="w-5 h-5 text-orange-600" />
      case 'erro': return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return <Info className="w-5 h-5 text-blue-600" />
    }
  }
  
  const getBadgeTipo = (tipoOriginal?: string) => {
    if (!tipoOriginal) return null
    
    const badges: Record<string, { label: string; className: string }> = {
      'grua': { label: 'Grua', className: 'bg-purple-100 text-purple-700 border-purple-300' },
      'obra': { label: 'Obra', className: 'bg-blue-100 text-blue-700 border-blue-300' },
      'financeiro': { label: 'Financeiro', className: 'bg-green-100 text-green-700 border-green-300' },
      'rh': { label: 'RH', className: 'bg-pink-100 text-pink-700 border-pink-300' },
      'estoque': { label: 'Estoque', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' }
    }
    
    return badges[tipoOriginal]
  }

  const notificacoesNoPeriodo = notificacoes.filter((n) =>
    notificacaoNoPeriodo(n.data, periodoData)
  )

  const notificacoesFiltradas = notificacoesNoPeriodo.filter(
    (n) => filtro === 'todas' || !n.lida
  )

  const naoLidas = notificacoesNoPeriodo.filter((n) => !n.lida).length
  const totalNoPeriodo = notificacoesNoPeriodo.length

  const listaNotificacoesUi = loading ? (
    <div className="flex flex-col items-center justify-center py-14">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <RefreshCw className="h-7 w-7 animate-spin text-[#871b0b]" />
      </div>
      <p className="text-sm font-medium text-foreground">Carregando…</p>
      <p className="text-xs text-muted-foreground">Buscando suas notificações</p>
    </div>
  ) : notificacoesFiltradas.length === 0 ? (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80">
        <Bell className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <p className="font-medium text-foreground">
        {notificacoes.length === 0
          ? "Nenhuma notificação"
          : "Nada neste período"}
      </p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {notificacoes.length === 0
          ? "Quando houver alertas, eles aparecem aqui."
          : "Ajuste o período ou a aba para ver mais itens."}
      </p>
    </div>
  ) : (
    <ul className="space-y-3">
      {notificacoesFiltradas.map((notif) => (
        <li key={notif.id}>
          <div
            className={cn(
              "rounded-xl border bg-card transition-shadow hover:shadow-sm",
              notif.lida
                ? "border-border/70 shadow-none"
                : "border-blue-200/80 shadow-sm"
            )}
          >
            <div className="space-y-2 p-4">
              <div className="flex min-w-0 items-start gap-2">
                <span
                  className="mt-0.5 flex shrink-0 [&_svg]:h-5 [&_svg]:w-5"
                  aria-hidden
                >
                  {getIconeNotificacao(notif.tipo, notif.tipoOriginal)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h4 className="font-medium leading-snug text-foreground">
                      {notif.titulo}
                    </h4>
                    {!notif.lida && (
                      <Badge className="border-0 bg-blue-100 text-[10px] font-semibold text-blue-800">
                        Nova
                      </Badge>
                    )}
                    {getBadgeTipo(notif.tipoOriginal) && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          getBadgeTipo(notif.tipoOriginal)?.className
                        )}
                      >
                        {getBadgeTipo(notif.tipoOriginal)?.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {notif.mensagem}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <time dateTime={notif.data}>
                  {new Date(notif.data).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1 border-t border-border/50 px-3 py-2 sm:px-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs sm:h-8"
                onClick={() => {
                  setNotificacaoSelecionada(notif)
                  setIsModalOpen(true)
                }}
              >
                <Eye className="mr-1.5 h-4 w-4" />
                Detalhes
              </Button>
              {!notif.lida && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs text-blue-700 hover:bg-blue-50 hover:text-blue-800 sm:h-8"
                  onClick={() => marcarComoLida(notif.id)}
                >
                  <CheckCircle className="mr-1.5 h-4 w-4" />
                  Lida
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive sm:h-8"
                onClick={() => excluirNotificacao(notif.id)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Excluir
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="space-y-5 pb-2">
      {/* Cabeçalho — alinhado ao tema PWA */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#871b0b] via-[#7a1809] to-[#5c1207] px-5 py-6 text-white shadow-lg ring-1 ring-black/10">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/[0.07]" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-24 w-24 rounded-full bg-black/10" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/20">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Notificações
              </h1>
              <p className="mt-0.5 text-sm text-red-100/90">
                Alertas e avisos em um só lugar
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {naoLidas > 0 && (
              <Badge className="border-white/25 bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-white/20">
                {naoLidas} não lida{naoLidas !== 1 ? "s" : ""}
              </Badge>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="border-0 bg-white/15 text-white shadow-sm hover:bg-white/25"
              onClick={carregarNotificacoes}
              disabled={loading}
              title="Atualizar"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            {naoLidas > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="border-0 bg-white text-[#871b0b] shadow-sm hover:bg-red-50"
                onClick={marcarTodasComoLidas}
              >
                Marcar todas lidas
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-md ring-1 ring-black/[0.06]">
        <Tabs value={filtro} onValueChange={(v) => setFiltro(v as "todas" | "nao-lidas")}>
          <CardHeader className="space-y-4 border-b border-border/60 bg-muted/25 pb-5 pt-5">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base font-semibold sm:text-lg">
                Lista
              </CardTitle>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Filtre por período e por status de leitura
              </p>
            </div>

            <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/80 p-1">
              <TabsTrigger
                value="todas"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Todas
                <span className="ml-1.5 tabular-nums text-muted-foreground data-[state=active]:text-foreground">
                  ({totalNoPeriodo})
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="nao-lidas"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Não lidas
                <span className="ml-1.5 tabular-nums text-muted-foreground data-[state=active]:text-foreground">
                  ({naoLidas})
                </span>
              </TabsTrigger>
            </TabsList>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Período
              </p>
              <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {PERIODOS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriodoData(p.id)}
                    className={cn(
                      "shrink-0 rounded-full px-3.5 py-2 text-xs font-medium transition-all sm:text-sm",
                      periodoData === p.id
                        ? "bg-[#871b0b] text-white shadow-md ring-2 ring-[#871b0b]/30"
                        : "bg-muted/90 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-6 pt-5 sm:px-6">
            <TabsContent value="todas" className="mt-0 outline-none">
              {listaNotificacoesUi}
            </TabsContent>
            <TabsContent value="nao-lidas" className="mt-0 outline-none">
              {listaNotificacoesUi}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Modal de Detalhes da Notificação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border-0 p-0 sm:max-w-[500px]">
          <DialogHeader className="space-y-3 border-b border-border/60 bg-muted/30 px-6 py-5 text-left">
            <div className="flex items-start gap-3">
              {notificacaoSelecionada && (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border/60">
                  {getIconeNotificacao(
                    notificacaoSelecionada.tipo,
                    notificacaoSelecionada.tipoOriginal
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1 pt-0.5">
                <DialogTitle className="text-lg leading-snug">
                  {notificacaoSelecionada?.titulo ?? "Detalhes"}
                </DialogTitle>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Notificação
                </p>
              </div>
            </div>
          </DialogHeader>

          {notificacaoSelecionada && (
            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl bg-muted/50 p-4 ring-1 ring-border/50">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {notificacaoSelecionada.mensagem}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 opacity-80" />
                  <span>
                    {new Date(notificacaoSelecionada.data).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {notificacaoSelecionada.lida ? (
                  <Badge
                    variant="outline"
                    className="border-green-300 bg-green-50 text-green-800"
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Lida
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-amber-900"
                  >
                    <BellRing className="mr-1 h-3 w-3" />
                    Não lida
                  </Badge>
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row">
                {!notificacaoSelecionada.lida && (
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-[#871b0b]/30 text-[#871b0b] hover:bg-red-50"
                    onClick={() => {
                      marcarComoLida(notificacaoSelecionada.id)
                      setNotificacaoSelecionada((prev) =>
                        prev ? { ...prev, lida: true } : null
                      )
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como lida
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    excluirNotificacao(notificacaoSelecionada.id)
                    setIsModalOpen(false)
                    setNotificacaoSelecionada(null)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

