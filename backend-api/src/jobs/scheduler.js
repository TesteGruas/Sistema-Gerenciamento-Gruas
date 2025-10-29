import cron from 'node-cron';
import { cancelarAprovacoesVencidas } from './cancelar-aprovacoes-vencidas.js';
import { enviarLembretesAprovacoes } from './enviar-lembretes-aprovacoes.js';

/**
 * Inicializa os jobs automáticos do sistema
 */
function inicializarScheduler() {
  console.log('[scheduler] Inicializando jobs automáticos...');

  // Job 1: Cancelar aprovações vencidas (7 dias)
  // Executa diariamente às 00:00
  const jobCancelar = cron.schedule('0 0 * * *', async () => {
    console.log('[scheduler] Executando job: cancelar aprovações vencidas');
    try {
      const resultado = await cancelarAprovacoesVencidas();
      console.log('[scheduler] Job cancelar vencidas finalizado:', resultado);
    } catch (error) {
      console.error('[scheduler] Erro no job cancelar vencidas:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  });

  // Job 2: Enviar lembretes de aprovações pendentes
  // Executa diariamente às 09:00
  const jobLembretes = cron.schedule('0 9 * * *', async () => {
    console.log('[scheduler] Executando job: enviar lembretes');
    try {
      const resultado = await enviarLembretesAprovacoes();
      console.log('[scheduler] Job lembretes finalizado:', resultado);
    } catch (error) {
      console.error('[scheduler] Erro no job lembretes:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  });

  console.log('[scheduler] ✓ Jobs agendados com sucesso:');
  console.log('  - Cancelar aprovações vencidas: diariamente às 00:00');
  console.log('  - Enviar lembretes: diariamente às 09:00');

  return {
    jobCancelar,
    jobLembretes
  };
}

/**
 * Para todos os jobs em execução
 * Útil para testes ou shutdown do servidor
 */
function pararScheduler(jobs) {
  if (jobs && jobs.jobCancelar) {
    jobs.jobCancelar.stop();
    console.log('[scheduler] Job cancelar vencidas parado');
  }
  if (jobs && jobs.jobLembretes) {
    jobs.jobLembretes.stop();
    console.log('[scheduler] Job lembretes parado');
  }
}

/**
 * Executa um job manualmente para testes
 * @param {string} jobName - 'cancelar' ou 'lembretes'
 */
async function executarJobManual(jobName) {
  console.log(`[scheduler] Executando job manual: ${jobName}`);
  
  try {
    let resultado;
    
    if (jobName === 'cancelar') {
      resultado = await cancelarAprovacoesVencidas();
    } else if (jobName === 'lembretes') {
      resultado = await enviarLembretesAprovacoes();
    } else {
      throw new Error(`Job desconhecido: ${jobName}`);
    }
    
    console.log(`[scheduler] Job manual ${jobName} finalizado:`, resultado);
    return resultado;
  } catch (error) {
    console.error(`[scheduler] Erro ao executar job manual ${jobName}:`, error);
    throw error;
  }
}

export {
  inicializarScheduler,
  pararScheduler,
  executarJobManual
};

