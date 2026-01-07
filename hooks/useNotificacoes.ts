import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { useWebSocketNotifications } from './use-websocket-notifications'

interface Notificacao {
  id: number;
  usuario_id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string;
  lida: boolean;
  data: string;
  created_at: string;
}

interface UseNotificacoesReturn {
  notificacoes: Notificacao[];
  naoLidas: number;
  loading: boolean;
  error: string | null;
  marcarComoLida: (notificacao_id: number) => Promise<void>;
  marcarTodasComoLidas: () => Promise<void>;
  refetch: () => Promise<void>;
}

// Reduzir polling quando WebSocket está conectado
const POLLING_INTERVAL_WS = 300000; // 5 minutos se WebSocket conectado
const POLLING_INTERVAL_REST = 30000; // 30 segundos se usando REST

export function useNotificacoes(usuario_id?: number): UseNotificacoesReturn {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Usar WebSocket para notificações em tempo real
  const { 
    connected: wsConnected, 
    novaNotificacao,
    marcarComoLida: wsMarcarComoLida,
    marcarTodasComoLidas: wsMarcarTodasComoLidas
  } = useWebSocketNotifications()

  /**
   * Busca notificações do usuário
   */
  const fetchNotificacoes = useCallback(async () => {
    if (!usuario_id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`notificacoes`, {
        params: {
          limit: 50,
          ordenacao: 'recente'
        }
      });

      const data = response.data.data || response.data || [];
      setNotificacoes(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar notificações';
      setError(errorMessage);
      console.error('Erro ao buscar notificações:', err);
    } finally {
      setLoading(false);
    }
  }, [usuario_id]);

  /**
   * Marca uma notificação como lida (usar WebSocket se disponível, senão REST)
   */
  const marcarComoLida = useCallback(async (notificacao_id: number) => {
    if (wsConnected) {
      // Usar WebSocket se disponível
      wsMarcarComoLida(String(notificacao_id))
      // Atualizar estado local imediatamente (WebSocket confirma depois)
      setNotificacoes(prev =>
        prev.map(n => (n.id === notificacao_id ? { ...n, lida: true } : n))
      )
    } else {
      // Fallback para REST
      try {
        await api.patch(`notificacoes/${notificacao_id}/marcar-lida`);

        // Atualizar estado local
        setNotificacoes(prev =>
          prev.map(n => (n.id === notificacao_id ? { ...n, lida: true } : n))
        );
      } catch (err: any) {
        console.error('Erro ao marcar notificação como lida:', err);
        throw err;
      }
    }
  }, [wsConnected, wsMarcarComoLida]);

  /**
   * Marca todas as notificações como lidas (usar WebSocket se disponível, senão REST)
   */
  const marcarTodasComoLidas = useCallback(async () => {
    if (wsConnected) {
      // Usar WebSocket se disponível
      wsMarcarTodasComoLidas()
      // Atualizar estado local imediatamente (WebSocket confirma depois)
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
    } else {
      // Fallback para REST
      try {
        await api.patch(`notificacoes/marcar-todas-lidas`);

        // Atualizar estado local
        setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      } catch (err: any) {
        console.error('Erro ao marcar todas notificações como lidas:', err);
        throw err;
      }
    }
  }, [wsConnected, wsMarcarTodasComoLidas]);

  /**
   * Refetch - recarrega a lista
   */
  const refetch = useCallback(async () => {
    await fetchNotificacoes();
  }, [fetchNotificacoes]);

  /**
   * Atualizar quando receber nova notificação via WebSocket
   */
  useEffect(() => {
    if (novaNotificacao) {
      setNotificacoes(prev => {
        // Evitar duplicatas
        const existe = prev.find(n => String(n.id) === String(novaNotificacao.id))
        if (existe) return prev
        
        // Converter formato WebSocket para formato interno se necessário
        const notifFormatada: Notificacao = {
          id: typeof novaNotificacao.id === 'string' ? parseInt(novaNotificacao.id) : novaNotificacao.id,
          usuario_id: usuario_id || 0,
          tipo: novaNotificacao.tipo,
          titulo: novaNotificacao.titulo,
          mensagem: novaNotificacao.mensagem,
          link: novaNotificacao.link,
          lida: novaNotificacao.lida,
          data: novaNotificacao.data,
          created_at: novaNotificacao.created_at || novaNotificacao.data
        }
        
        return [notifFormatada, ...prev]
      })
    }
  }, [novaNotificacao, usuario_id])

  /**
   * Calcula número de não lidas
   */
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  /**
   * Configurar polling quando o componente é montado
   * Reduzir frequência se WebSocket estiver conectado
   */
  useEffect(() => {
    if (!usuario_id) return;

    // Limpar intervalo anterior
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Buscar imediatamente ao montar
    fetchNotificacoes();

    // Configurar polling (menos frequente se WebSocket conectado)
    const interval = wsConnected ? POLLING_INTERVAL_WS : POLLING_INTERVAL_REST;
    pollingIntervalRef.current = setInterval(() => {
      fetchNotificacoes();
    }, interval);

    // Cleanup ao desmontar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [usuario_id, fetchNotificacoes, wsConnected]);

  /**
   * Pausar polling quando a aba está inativa (opcional)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pausar polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      } else {
        // Retomar polling e buscar imediatamente
        fetchNotificacoes();
        pollingIntervalRef.current = setInterval(() => {
          fetchNotificacoes();
        }, POLLING_INTERVAL);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotificacoes]);

  return {
    notificacoes,
    naoLidas,
    loading,
    error,
    marcarComoLida,
    marcarTodasComoLidas,
    refetch
  };
}

