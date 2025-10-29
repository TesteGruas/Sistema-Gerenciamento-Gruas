import { criarNotificacaoAprovacao, formatarDataNotificacao } from '../utils/aprovacoes-helpers.js';

/**
 * Cria notificação quando uma nova aprovação de horas extras é criada
 * Notifica o supervisor responsável
 * @param {Object} aprovacao - Dados da aprovação criada
 * @param {Object} funcionario - Dados do funcionário
 * @returns {Promise<Object>} - Notificação criada
 */
async function criarNotificacaoNovaAprovacao(aprovacao, funcionario) {
  const titulo = 'Nova Aprovação de Horas Extras';
  const mensagem = `${funcionario.nome || `Funcionário #${funcionario.id}`} solicitou aprovação de ${aprovacao.horas_extras}h extras trabalhadas em ${formatarDataNotificacao(aprovacao.data_trabalho)}. Prazo: 7 dias.`;

  return await criarNotificacaoAprovacao(
    aprovacao,
    aprovacao.supervisor_id,
    'nova_aprovacao',
    titulo,
    mensagem
  );
}

/**
 * Cria notificação quando uma aprovação é processada (aprovada ou rejeitada)
 * Notifica o funcionário
 * @param {Object} aprovacao - Dados da aprovação
 * @param {string} resultado - 'aprovado' ou 'rejeitado'
 * @param {Object} supervisor - Dados do supervisor que processou
 * @param {string} observacoes - Observações do supervisor (opcional)
 * @returns {Promise<Object>} - Notificação criada
 */
async function criarNotificacaoResultado(aprovacao, resultado, supervisor, observacoes = null) {
  const isAprovado = resultado === 'aprovado';
  
  const titulo = isAprovado 
    ? '✅ Horas Extras Aprovadas' 
    : '❌ Horas Extras Rejeitadas';
  
  let mensagem = isAprovado
    ? `Suas ${aprovacao.horas_extras}h extras do dia ${formatarDataNotificacao(aprovacao.data_trabalho)} foram aprovadas por ${supervisor.nome || `Supervisor #${supervisor.id}`}.`
    : `Suas ${aprovacao.horas_extras}h extras do dia ${formatarDataNotificacao(aprovacao.data_trabalho)} foram rejeitadas por ${supervisor.nome || `Supervisor #${supervisor.id}`}.`;

  if (observacoes) {
    mensagem += ` Observações: ${observacoes}`;
  }

  return await criarNotificacaoAprovacao(
    aprovacao,
    aprovacao.funcionario_id,
    resultado,
    titulo,
    mensagem
  );
}

/**
 * Cria notificação de lembrete para supervisor
 * Enviado após 3 dias sem resposta
 * @param {Object} aprovacao - Dados da aprovação
 * @param {Object} funcionario - Dados do funcionário
 * @param {number} diasRestantes - Dias restantes para aprovação
 * @returns {Promise<Object>} - Notificação criada
 */
async function criarNotificacaoLembrete(aprovacao, funcionario, diasRestantes) {
  const titulo = '⏰ Lembrete: Aprovação de Horas Extras Pendente';
  const mensagem = `Você tem ${diasRestantes} dia(s) para aprovar ${aprovacao.horas_extras}h extras de ${funcionario.nome || `Funcionário #${funcionario.id}`} do dia ${formatarDataNotificacao(aprovacao.data_trabalho)}.`;

  return await criarNotificacaoAprovacao(
    aprovacao,
    aprovacao.supervisor_id,
    'lembrete',
    titulo,
    mensagem
  );
}

/**
 * Cria notificação quando uma aprovação é cancelada automaticamente (prazo expirado)
 * Notifica o funcionário
 * @param {Object} aprovacao - Dados da aprovação
 * @returns {Promise<Object>} - Notificação criada
 */
async function criarNotificacaoCancelamento(aprovacao) {
  const titulo = '⚠️ Aprovação de Horas Extras Cancelada';
  const mensagem = `Sua solicitação de ${aprovacao.horas_extras}h extras do dia ${formatarDataNotificacao(aprovacao.data_trabalho)} foi cancelada automaticamente por prazo expirado (7 dias). Entre em contato com seu supervisor.`;

  return await criarNotificacaoAprovacao(
    aprovacao,
    aprovacao.funcionario_id,
    'cancelado',
    titulo,
    mensagem
  );
}

/**
 * Cria notificação para aprovação em lote
 * @param {Array} aprovacoes - Array de aprovações aprovadas/rejeitadas
 * @param {string} resultado - 'aprovado' ou 'rejeitado'
 * @param {Object} supervisor - Dados do supervisor
 * @returns {Promise<Array>} - Array de notificações criadas
 */
async function criarNotificacoesLote(aprovacoes, resultado, supervisor) {
  const promises = aprovacoes.map(async (aprovacao) => {
    try {
      return await criarNotificacaoResultado(aprovacao, resultado, supervisor);
    } catch (error) {
      console.error(`[notificacoes-horas-extras] Erro ao criar notificação para aprovação ${aprovacao.id}:`, error);
      return null;
    }
  });

  const resultados = await Promise.all(promises);
  return resultados.filter(r => r !== null);
}

/**
 * Busca e cria lembretes para aprovações pendentes há 3+ dias
 * Usado pelo job de lembretes
 * @returns {Promise<Array>} - Array de notificações criadas
 */
async function processarLembretes() {
  const { supabaseAdmin } = await import('../config/supabase.js');
  const { buscarFuncionario, calcularDiasRestantes } = await import('../utils/aprovacoes-helpers.js');

  try {
    // Buscar aprovações pendentes com mais de 3 dias e menos de 7 dias
    const dataLimite3Dias = new Date();
    dataLimite3Dias.setDate(dataLimite3Dias.getDate() - 3);

    const { data: aprovacoes, error } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select('*')
      .eq('status', 'pendente')
      .lte('data_submissao', dataLimite3Dias.toISOString())
      .gt('data_limite', new Date().toISOString());

    if (error) throw error;

    if (!aprovacoes || aprovacoes.length === 0) {
      console.log('[notificacoes-horas-extras] Nenhuma aprovação pendente para lembrete');
      return [];
    }

    // Verificar se já enviou lembrete (checar se existe notificação do tipo 'lembrete')
    const aprovacoesComLembrete = await Promise.all(
      aprovacoes.map(async (aprovacao) => {
        const { data: notificacoes } = await supabaseAdmin
          .from('notificacoes_horas_extras')
          .select('id')
          .eq('aprovacao_id', aprovacao.id)
          .eq('tipo', 'lembrete')
          .limit(1);

        return { aprovacao, jaTemLembrete: notificacoes && notificacoes.length > 0 };
      })
    );

    // Filtrar apenas aprovações sem lembrete
    const aprovacoesSemLembrete = aprovacoesComLembrete
      .filter(item => !item.jaTemLembrete)
      .map(item => item.aprovacao);

    if (aprovacoesSemLembrete.length === 0) {
      console.log('[notificacoes-horas-extras] Todas as aprovações já têm lembretes');
      return [];
    }

    // Criar lembretes
    const lembretes = [];
    for (const aprovacao of aprovacoesSemLembrete) {
      try {
        const funcionario = await buscarFuncionario(aprovacao.funcionario_id);
        const diasRestantes = calcularDiasRestantes(aprovacao.data_limite);
        
        const lembrete = await criarNotificacaoLembrete(aprovacao, funcionario, diasRestantes);
        lembretes.push(lembrete);
        
        console.log(`[notificacoes-horas-extras] Lembrete criado para aprovação ${aprovacao.id}`);
      } catch (error) {
        console.error(`[notificacoes-horas-extras] Erro ao criar lembrete para aprovação ${aprovacao.id}:`, error);
      }
    }

    return lembretes;
  } catch (error) {
    console.error('[notificacoes-horas-extras] Erro ao processar lembretes:', error);
    return [];
  }
}

export {
  criarNotificacaoNovaAprovacao,
  criarNotificacaoResultado,
  criarNotificacaoLembrete,
  criarNotificacaoCancelamento,
  criarNotificacoesLote,
  processarLembretes
};

