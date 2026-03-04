import cron from 'node-cron';
import { enviarNotificacoesAlmoco } from '../services/almoco-automatico-service.js';

/**
 * Job para enviar notificações de almoço
 * Executa diariamente às 11h30
 */
const jobNotificacoesAlmoco = cron.schedule('30 11 * * *', async () => {
  console.log('[scheduler] 🍽️ Executando job: enviar notificações de almoço');
  try {
    const resultado = await enviarNotificacoesAlmoco();
    console.log('[scheduler] ✅ Job notificações almoço finalizado:', resultado);
  } catch (error) {
    console.error('[scheduler] ❌ Erro no job notificações almoço:', error);
  }
}, {
  scheduled: true,
  timezone: 'America/Sao_Paulo'
});

/**
 * Inicia o job de notificações de almoço
 */
export function iniciarJobNotificacoesAlmoco() {
  try {
    jobNotificacoesAlmoco.start();
    console.log('[scheduler] 🚀 Job de notificações de almoço iniciado');
    console.log('[scheduler] ⏰ Agendado para executar diariamente às 11h30');
  } catch (error) {
    console.error('[scheduler] ❌ Erro ao iniciar job notificações almoço:', error);
  }
}

/**
 * Para o job de notificações de almoço
 */
export function pararJobNotificacoesAlmoco() {
  try {
    jobNotificacoesAlmoco.stop();
    console.log('[scheduler] ⏹️ Job de notificações de almoço parado');
  } catch (error) {
    console.error('[scheduler] ❌ Erro ao parar job notificações almoço:', error);
  }
}

export { jobNotificacoesAlmoco };

