import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { 
  apiAprovacoesHorasExtras, 
  RegistroPontoAprovacao,
  AprovacaoComAssinaturaPayload,
  RejeicaoPayload
} from '@/lib/api-aprovacoes-horas-extras'

interface UseAprovacoesHorasExtrasReturn {
  aprovacoes: RegistroPontoAprovacao[];
  loading: boolean;
  error: string | null;
  fetchAprovacoes: (gestor_id?: number) => Promise<void>;
  aprovar: (registro_id: string, assinatura: string, observacoes?: string) => Promise<boolean>;
  rejeitar: (registro_id: string, motivo: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useAprovacoesHorasExtras(gestor_id?: number): UseAprovacoesHorasExtrasReturn {
  const [aprovacoes, setAprovacoes] = useState<RegistroPontoAprovacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGestorId, setLastGestorId] = useState<number | undefined>(gestor_id);

  /**
   * Busca lista de aprovações pendentes
   */
  const fetchAprovacoes = useCallback(async (gestorIdParam?: number) => {
    const idToUse = gestorIdParam ?? lastGestorId;
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await apiAprovacoesHorasExtras.listarPendentes({
        gestor_id: idToUse
      });
      
      setAprovacoes(data);
      setLastGestorId(idToUse);
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
  }, [lastGestorId]);

  /**
   * Aprova horas extras com assinatura digital
   */
  const aprovar = useCallback(async (
    registro_id: string,
    assinatura: string,
    observacoes?: string
  ): Promise<boolean> => {
    // Validação básica de assinatura
    if (!assinatura || assinatura.length < 500) {
      toast.error('Assinatura digital inválida ou vazia');
      return false;
    }

    // TODO: Buscar do context de autenticação
    const gestor_id = lastGestorId || 1; // Default para gestor ID 1 se não informado

    try {
      const payload: AprovacaoComAssinaturaPayload = {
        gestor_id: gestor_id,
        assinatura_digital: assinatura,
        observacoes_aprovacao: observacoes
      };

      const { message } = await apiAprovacoesHorasExtras.aprovarComAssinatura(
        registro_id,
        payload
      );

      toast.success(message);
      
      // Recarregar lista completa para atualizar todos os status
      await fetchAprovacoes(lastGestorId);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao aprovar horas extras';
      
      // Tratamento específico de erros
      if (err.response?.status === 400) {
        toast.error(errorMessage);
      } else if (err.response?.status === 404) {
        toast.error('Registro não encontrado');
      } else if (err.response?.status === 500) {
        toast.error('Erro no servidor. Tente novamente.');
      } else {
        toast.error(errorMessage);
      }
      
      console.error('Erro ao aprovar:', err);
      return false;
    }
  }, [lastGestorId]);

  /**
   * Rejeita horas extras com motivo
   */
  const rejeitar = useCallback(async (
    registro_id: string,
    motivo: string
  ): Promise<boolean> => {
    // Validação básica do motivo
    if (!motivo || motivo.trim().length < 10) {
      toast.error('O motivo da rejeição deve ter pelo menos 10 caracteres');
      return false;
    }

    try {
      const payload: RejeicaoPayload = {
        motivo_rejeicao: motivo
      };

      const { message } = await apiAprovacoesHorasExtras.rejeitar(
        registro_id,
        payload
      );

      toast.success(message);
      
      // Recarregar lista completa para atualizar todos os status
      await fetchAprovacoes(lastGestorId);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao rejeitar horas extras';
      
      // Tratamento específico de erros
      if (err.response?.status === 400) {
        toast.error(errorMessage);
      } else if (err.response?.status === 404) {
        toast.error('Registro não encontrado');
      } else {
        toast.error(errorMessage);
      }
      
      console.error('Erro ao rejeitar:', err);
      return false;
    }
  }, []);

  /**
   * Refetch - recarrega a lista usando o último gestor_id
   */
  const refetch = useCallback(async () => {
    await fetchAprovacoes(lastGestorId);
  }, [fetchAprovacoes, lastGestorId]);

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

