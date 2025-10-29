import { supabaseAdmin } from '../config/supabase.js';
import { criarNotificacaoCancelamento } from '../services/notificacoes-horas-extras.js';

/**
 * Job para cancelar aprovações de horas extras vencidas (7 dias)
 * Executado diariamente às 00:00
 */
async function cancelarAprovacoesVencidas() {
  console.log('[job-cancelar-vencidas] Iniciando verificação de aprovações vencidas...');
  
  try {
    const agora = new Date();
    
    // Buscar aprovações pendentes com prazo expirado
    const { data: aprovacoesVencidas, error: fetchError } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select('*')
      .eq('status', 'pendente')
      .lt('data_limite', agora.toISOString());

    if (fetchError) {
      console.error('[job-cancelar-vencidas] Erro ao buscar aprovações:', fetchError);
      throw fetchError;
    }

    if (!aprovacoesVencidas || aprovacoesVencidas.length === 0) {
      console.log('[job-cancelar-vencidas] Nenhuma aprovação vencida encontrada');
      return {
        sucesso: true,
        canceladas: 0,
        mensagem: 'Nenhuma aprovação vencida'
      };
    }

    console.log(`[job-cancelar-vencidas] Encontradas ${aprovacoesVencidas.length} aprovações vencidas`);

    // Cancelar cada aprovação
    const resultados = [];
    for (const aprovacao of aprovacoesVencidas) {
      try {
        // Atualizar status para cancelado
        const { data: aprovacaoCancelada, error: updateError } = await supabaseAdmin
          .from('aprovacoes_horas_extras')
          .update({
            status: 'cancelado',
            observacoes: `Cancelado automaticamente por prazo expirado em ${agora.toISOString()}. ${aprovacao.observacoes || ''}`
          })
          .eq('id', aprovacao.id)
          .select()
          .single();

        if (updateError) {
          console.error(`[job-cancelar-vencidas] Erro ao cancelar aprovação ${aprovacao.id}:`, updateError);
          resultados.push({
            id: aprovacao.id,
            sucesso: false,
            erro: updateError.message
          });
          continue;
        }

        // Criar notificação para o funcionário
        try {
          await criarNotificacaoCancelamento(aprovacaoCancelada);
          console.log(`[job-cancelar-vencidas] Notificação criada para funcionário ${aprovacao.funcionario_id}`);
        } catch (notifError) {
          console.error(`[job-cancelar-vencidas] Erro ao criar notificação para aprovação ${aprovacao.id}:`, notifError);
        }

        // Registrar log de auditoria
        console.log(`[job-cancelar-vencidas] ✓ Aprovação ${aprovacao.id} cancelada com sucesso`);
        resultados.push({
          id: aprovacao.id,
          sucesso: true,
          funcionario_id: aprovacao.funcionario_id,
          horas_extras: aprovacao.horas_extras
        });

      } catch (error) {
        console.error(`[job-cancelar-vencidas] Erro ao processar aprovação ${aprovacao.id}:`, error);
        resultados.push({
          id: aprovacao.id,
          sucesso: false,
          erro: error.message
        });
      }
    }

    const canceladas = resultados.filter(r => r.sucesso).length;
    const falhas = resultados.filter(r => !r.sucesso).length;

    console.log(`[job-cancelar-vencidas] Job finalizado. Canceladas: ${canceladas}, Falhas: ${falhas}`);

    return {
      sucesso: true,
      canceladas,
      falhas,
      total: aprovacoesVencidas.length,
      resultados
    };

  } catch (error) {
    console.error('[job-cancelar-vencidas] Erro crítico no job:', error);
    return {
      sucesso: false,
      erro: error.message,
      canceladas: 0
    };
  }
}

export { cancelarAprovacoesVencidas };

