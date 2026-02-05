import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { 
  apiAprovacoesHorasExtras, 
  AprovacaoHorasExtras,
  AprovacaoPayload,
  RejeicaoPayload
} from '@/lib/api-aprovacoes-horas-extras'

interface UseAprovacoesHorasExtrasReturn {
  aprovacoes: AprovacaoHorasExtras[];
  loading: boolean;
  error: string | null;
  fetchAprovacoes: (gestor_id?: number) => Promise<void>;
  aprovar: (aprovacao_id: string, assinatura: string, observacoes?: string) => Promise<boolean>;
  rejeitar: (aprovacao_id: string, motivo: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useAprovacoesHorasExtras(gestor_id?: number): UseAprovacoesHorasExtrasReturn {
  const [aprovacoes, setAprovacoes] = useState<AprovacaoHorasExtras[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca lista de aprovações pendentes do supervisor logado
   * A API usa automaticamente o req.user.id do token de autenticação
   */
  const fetchAprovacoes = useCallback(async (gestorIdParam?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // A API /pendentes usa automaticamente o req.user.id do token
      // Não precisa passar gestor_id, pois o backend já filtra pelo supervisor_id = req.user.id
      const { data } = await apiAprovacoesHorasExtras.listarPendentes();
      
      setAprovacoes(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar aprovações';
      setError(errorMessage);
      
      // Tratamento específico de erros
      if (err.response?.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        // Redirecionar para login pode ser feito aqui
      } else if (err.response?.status === 403) {
        toast.error('Você não tem permissão para visualizar essas aprovações');
      } else {
        toast.error(errorMessage);
      }
      
      console.error('Erro ao buscar aprovações:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Aprova horas extras com assinatura digital
   */
  const aprovar = useCallback(async (
    aprovacao_id: string,
    assinatura: string,
    observacoes?: string
  ): Promise<boolean> => {
    // Validação básica de assinatura
    if (!assinatura || assinatura.length < 500) {
      toast.error('Assinatura digital inválida ou vazia');
      return false;
    }

    try {
      const payload: AprovacaoPayload = {
        assinatura: assinatura,
        observacoes: observacoes
      };

      const { message } = await apiAprovacoesHorasExtras.aprovar(
        aprovacao_id,
        payload
      );

      toast.success(message);
      
      // Recarregar lista completa para atualizar todos os status
      await fetchAprovacoes();
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao aprovar horas extras';
      
      // Tratamento específico de erros
      if (err.response?.status === 400) {
        toast.error(errorMessage);
      } else if (err.response?.status === 404) {
        toast.error('Aprovação não encontrada');
      } else if (err.response?.status === 500) {
        toast.error('Erro no servidor. Tente novamente.');
      } else {
        toast.error(errorMessage);
      }
      
      console.error('Erro ao aprovar:', err);
      return false;
    }
  }, [fetchAprovacoes]);

  /**
   * Rejeita horas extras com motivo
   */
  const rejeitar = useCallback(async (
    aprovacao_id: string,
    motivo: string
  ): Promise<boolean> => {
    // Validação básica do motivo
    if (!motivo || motivo.trim().length < 10) {
      toast.error('O motivo da rejeição deve ter pelo menos 10 caracteres');
      return false;
    }

    try {
      const payload: RejeicaoPayload = {
        motivo: motivo
      };

      const { message } = await apiAprovacoesHorasExtras.rejeitar(
        aprovacao_id,
        payload
      );

      toast.success(message);
      
      // Recarregar lista completa para atualizar todos os status
      await fetchAprovacoes();
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao rejeitar horas extras';
      
      // Tratamento específico de erros
      if (err.response?.status === 400) {
        toast.error(errorMessage);
      } else if (err.response?.status === 404) {
        toast.error('Aprovação não encontrada');
      } else {
        toast.error(errorMessage);
      }
      
      console.error('Erro ao rejeitar:', err);
      return false;
    }
  }, [fetchAprovacoes]);

  /**
   * Refetch - recarrega a lista
   */
  const refetch = useCallback(async () => {
    await fetchAprovacoes();
  }, [fetchAprovacoes]);

  return {
    aprovacoes,
    loading,
    error,
    fetchAprovacoes,
    aprovar,
    rejeitar,
    refetch
  };
}

