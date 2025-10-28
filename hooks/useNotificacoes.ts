import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'

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

const POLLING_INTERVAL = 30000; // 30 segundos

export function useNotificacoes(usuario_id?: number): UseNotificacoesReturn {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Busca notificações do usuário
   */
  const fetchNotificacoes = useCallback(async () => {
    if (!usuario_id) return;

    setLoading(true);
    setError(null);

    try {
      // TODO: Atualizar quando a rota de notificações estiver implementada no backend
      const response = await api.get(`notificacoes`, {
        params: {
          usuario_id,
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
      
      // Em caso de erro 404 (rota não implementada), usar array vazio
      if (err.response?.status === 404) {
        setNotificacoes([]);
        setError(null); // Não mostrar erro se a rota ainda não existe
      }
    } finally {
      setLoading(false);
    }
  }, [usuario_id]);

  /**
   * Marca uma notificação como lida
   */
  const marcarComoLida = useCallback(async (notificacao_id: number) => {
    try {
      // TODO: Atualizar quando a rota de notificações estiver implementada no backend
      await api.patch(`notificacoes/${notificacao_id}/lida`, {
        lida: true
      });

      // Atualizar estado local
      setNotificacoes(prev =>
        prev.map(n => (n.id === notificacao_id ? { ...n, lida: true } : n))
      );
    } catch (err: any) {
      console.error('Erro ao marcar notificação como lida:', err);
      
      // Se a rota não existir, apenas atualizar localmente
      if (err.response?.status === 404) {
        setNotificacoes(prev =>
          prev.map(n => (n.id === notificacao_id ? { ...n, lida: true } : n))
        );
      }
    }
  }, []);

  /**
   * Marca todas as notificações como lidas
   */
  const marcarTodasComoLidas = useCallback(async () => {
    try {
      // TODO: Criar rota no backend para marcar todas como lidas
      await api.patch(`notificacoes/marcar-todas-lidas`, {
        usuario_id
      });

      // Atualizar estado local
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (err: any) {
      console.error('Erro ao marcar todas notificações como lidas:', err);
      
      // Se a rota não existir, apenas atualizar localmente
      if (err.response?.status === 404) {
        setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      }
    }
  }, [usuario_id]);

  /**
   * Refetch - recarrega a lista
   */
  const refetch = useCallback(async () => {
    await fetchNotificacoes();
  }, [fetchNotificacoes]);

  /**
   * Calcula número de não lidas
   */
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  /**
   * Configurar polling quando o componente é montado
   */
  useEffect(() => {
    if (!usuario_id) return;

    // Buscar imediatamente ao montar
    fetchNotificacoes();

    // Configurar polling
    pollingIntervalRef.current = setInterval(() => {
      fetchNotificacoes();
    }, POLLING_INTERVAL);

    // Cleanup ao desmontar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [usuario_id, fetchNotificacoes]);

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

