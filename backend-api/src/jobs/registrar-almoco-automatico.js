import cron from 'node-cron';
import { registrarAlmocoAutomatico } from '../services/almoco-automatico-service.js';

/**
 * Job para registrar almoço automático
 * Executa diariamente às 12h00
 */
const jobAlmocoAutomatico = cron.schedule('0 12 * * *', async () => {
  console.log('[scheduler] 🍽️ Executando job: registrar almoço automático');
  try {
    const resultado = await registrarAlmocoAutomatico();
    console.log('[scheduler] ✅ Job almoço automático finalizado:', resultado);
  } catch (error) {
    console.error('[scheduler] ❌ Erro no job almoço automático:', error);
  }
}, {
  scheduled: true,
  timezone: 'America/Sao_Paulo'
});

/**
 * Inicia o job de almoço automático
 */
export function iniciarJobAlmocoAutomatico() {
  try {
    jobAlmocoAutomatico.start();
    console.log('[scheduler] 🚀 Job de almoço automático iniciado');
    console.log('[scheduler] ⏰ Agendado para executar diariamente às 12h00');
  } catch (error) {
    console.error('[scheduler] ❌ Erro ao iniciar job almoço automático:', error);
  }
}

/**
 * Para o job de almoço automático
 */
export function pararJobAlmocoAutomatico() {
  try {
    jobAlmocoAutomatico.stop();
    console.log('[scheduler] ⏹️ Job de almoço automático parado');
  } catch (error) {
    console.error('[scheduler] ❌ Erro ao parar job almoço automático:', error);
  }
}

export { jobAlmocoAutomatico };

