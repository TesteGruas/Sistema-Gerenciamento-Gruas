import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { Notificacao } from '@/lib/api-notificacoes'
import { useAuth } from '@/hooks/use-auth'

interface UseWebSocketNotificationsReturn {
  socket: Socket | null
  connected: boolean
  notificacoes: Notificacao[]
  novaNotificacao: Notificacao | null
  marcarComoLida: (id: string) => void
  marcarTodasComoLidas: () => void
}

const SOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'
const maxReconnectAttempts = 5

export function useWebSocketNotifications(): UseWebSocketNotificationsReturn {
  const { user, token } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [novaNotificacao, setNovaNotificacao] = useState<Notificacao | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)

  // Conectar ao WebSocket
  const connect = useCallback(() => {
    if (!token || socketRef.current?.connected) {
      return
    }

    // Desconectar socket anterior se existir
    if (socketRef.current) {
      socketRef.current.disconnect()
    }

    console.log('🔌 [WebSocket] Conectando...', SOCKET_URL)

    const socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts
    })

    socket.on('connect', () => {
      console.log('✅ [WebSocket] Conectado')
      setConnected(true)
      reconnectAttempts.current = 0
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ [WebSocket] Desconectado:', reason)
      setConnected(false)

      // Tentar reconectar manualmente se não foi desconexão intencional
      if (reason === 'io server disconnect') {
        // Servidor desconectou, reconectar
        socket.connect()
      }
    })

    socket.on('connect_error', (error) => {
      console.error('❌ [WebSocket] Erro de conexão:', error.message)
      setConnected(false)
      
      reconnectAttempts.current++
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`🔄 [WebSocket] Tentando reconectar (${reconnectAttempts.current}/${maxReconnectAttempts})...`)
          connect()
        }, 5000 * reconnectAttempts.current)
      } else {
        console.error('❌ [WebSocket] Máximo de tentativas de reconexão atingido')
      }
    })

    socket.on('connected', (data) => {
      console.log('✅ [WebSocket] Autenticado:', data)
    })

    socket.on('nova-notificacao', (notificacao: Notificacao) => {
      console.log('🔔 [WebSocket] Nova notificação recebida:', notificacao)
      
      setNovaNotificacao(notificacao)
      setNotificacoes(prev => {
        // Evitar duplicatas
        const existe = prev.find(n => n.id === notificacao.id)
        if (existe) return prev
        return [notificacao, ...prev]
      })
      
      // Mostrar notificação push do navegador (se permitido)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notificacao.titulo, {
            body: notificacao.mensagem,
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
            tag: `notificacao-${notificacao.id}`,
            data: {
              url: notificacao.link || '/dashboard/notificacoes'
            }
          })
        } catch (error) {
          console.error('Erro ao mostrar notificação push:', error)
        }
      }
    })

    socket.on('notificacao-atualizada', (data: { id: string; lida: boolean }) => {
      console.log('✅ [WebSocket] Notificação atualizada:', data)
      setNotificacoes(prev =>
        prev.map(n => (n.id === data.id ? { ...n, lida: data.lida } : n))
      )
    })

    socket.on('todas-marcadas-lidas', () => {
      console.log('✅ [WebSocket] Todas as notificações marcadas como lidas')
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
    })

    socket.on('erro', (data: { mensagem: string }) => {
      console.error('❌ [WebSocket] Erro:', data.mensagem)
    })

    socketRef.current = socket
  }, [token])

  // Desconectar ao desmontar
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 [WebSocket] Desconectando...')
      socketRef.current.disconnect()
      socketRef.current = null
      setConnected(false)
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
  }, [])

  // Conectar quando token estiver disponível
  useEffect(() => {
    if (token && user) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [token, user, connect, disconnect])

  // Marcar como lida via WebSocket
  const marcarComoLida = useCallback((id: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('marcar-lida', { notificacaoId: id })
    }
  }, [])

  // Marcar todas como lidas via WebSocket
  const marcarTodasComoLidas = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('marcar-todas-lidas')
    }
  }, [])

  return {
    socket: socketRef.current,
    connected,
    notificacoes,
    novaNotificacao,
    marcarComoLida,
    marcarTodasComoLidas
  }
}

