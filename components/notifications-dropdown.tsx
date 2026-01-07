"use client"

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { NotificacoesAPI, Notificacao, formatarTempoRelativo, NotificationType } from '@/lib/api-notificacoes'
import { useWebSocketNotifications } from '@/hooks/use-websocket-notifications'

// Ícones e cores por tipo de notificação
const tipoConfig: Record<NotificationType, { bg: string; text: string; badge: string }> = {
  info: { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'bg-blue-500' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', badge: 'bg-yellow-500' },
  error: { bg: 'bg-red-100', text: 'text-red-700', badge: 'bg-red-500' },
  success: { bg: 'bg-green-100', text: 'text-green-700', badge: 'bg-green-500' },
  grua: { bg: 'bg-purple-100', text: 'text-purple-700', badge: 'bg-purple-500' },
  obra: { bg: 'bg-orange-100', text: 'text-orange-700', badge: 'bg-orange-500' },
  financeiro: { bg: 'bg-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-500' },
  rh: { bg: 'bg-cyan-100', text: 'text-cyan-700', badge: 'bg-cyan-500' },
  estoque: { bg: 'bg-amber-100', text: 'text-amber-700', badge: 'bg-amber-500' },
}

export function NotificationsDropdown() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  
  // WebSocket para notificações em tempo real
  const { connected: wsConnected } = useWebSocketNotifications()
  
  // Flags para controlar carregamento e evitar chamadas duplicadas
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const loadingRef = useRef(false)

  // Carregar notificações (otimizado - apenas uma chamada)
  const carregarNotificacoes = async () => {
    if (loadingRef.current) return
    
    try {
      loadingRef.current = true
      // Otimização: usar apenas listarNaoLidas e contar localmente (evita 2 chamadas)
      const todas = await NotificacoesAPI.listarNaoLidas()
      setNotificacoes(todas.slice(0, 5)) // Mostrar apenas as 5 mais recentes no dropdown
      setNaoLidas(todas.length) // Contar localmente em vez de fazer outra chamada
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  // Carregar notificações iniciais - apenas uma vez
  useEffect(() => {
    if (!dadosIniciaisCarregados && !loadingRef.current) {
      carregarNotificacoes().finally(() => {
        setDadosIniciaisCarregados(true)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosIniciaisCarregados])

  // Atualizar a cada 30 segundos (apenas após carregamento inicial)
  useEffect(() => {
    if (!dadosIniciaisCarregados) return
    
    const interval = setInterval(() => {
      if (!loadingRef.current) {
        carregarNotificacoes()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [dadosIniciaisCarregados])

  // Marcar como lida
  const marcarComoLida = async (id: string) => {
    try {
      await NotificacoesAPI.marcarComoLida(id)
      await carregarNotificacoes()
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  // Marcar todas como lidas
  const marcarTodasComoLidas = async () => {
    try {
      await NotificacoesAPI.marcarTodasComoLidas()
      await carregarNotificacoes()
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
          {/* Indicador de conexão WebSocket */}
          <span 
            className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white ${
              wsConnected ? 'bg-green-500' : 'bg-gray-400'
            }`} 
            title={wsConnected ? 'Conectado (tempo real)' : 'Desconectado (polling)'} 
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            {naoLidas > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                {naoLidas} nova{naoLidas > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {naoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={marcarTodasComoLidas}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        {/* Lista de Notificações */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Carregando...
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Nenhuma notificação não lida</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificacoes.map((notificacao) => {
                const config = tipoConfig[notificacao.tipo]
                return (
                  <div
                    key={notificacao.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notificacao.lida ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Indicador de cor */}
                      <div className={`w-2 h-2 rounded-full mt-2 ${config.badge} flex-shrink-0`} />
                      
                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm text-gray-900 leading-tight">
                            {notificacao.titulo}
                          </h4>
                          {!notificacao.lida && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={() => marcarComoLida(notificacao.id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notificacao.mensagem}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatarTempoRelativo(notificacao.data)}
                          </span>
                          
                          {notificacao.link && (
                            <Link
                              href={notificacao.link}
                              onClick={() => {
                                setOpen(false)
                                marcarComoLida(notificacao.id)
                              }}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-blue-600 hover:text-blue-700"
                              >
                                Ver detalhes
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50">
          <Link href="/dashboard/notificacoes" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              Ver todas as notificações
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


