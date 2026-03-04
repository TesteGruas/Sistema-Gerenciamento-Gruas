import cron from 'node-cron';
import { registrarVoltaAlmocoAutomatico } from '../services/almoco-automatico-service.js';

/**
 * Job para registrar volta de almoço automática
 * Executa diariamente às 13h00
 */
const jobVoltaAlmocoAutomatico = cron.schedule('0 13 * * *', async () => {
  console.log('[scheduler] 🍽️ Executando job: registrar volta de almoço automática');
  try {
    const resultado = await registrarVoltaAlmocoAutomatico();
    console.log('[scheduler] ✅ Job volta de almoço automático finalizado:', resultado);
  } catch (error) {
    console.error('[scheduler] ❌ Erro no job volta de almoço automático:', error);
  }
}, {
  scheduled: true,
  timezone: 'America/Sao_Paulo'
});

/**
 * Inicia o job de volta de almoço automática
 */
export function iniciarJobVoltaAlmocoAutomatico() {
  try {
    jobVoltaAlmocoAutomatico.start();
    console.log('[scheduler] 🚀 Job de volta de almoço automática iniciado');
    console.log('[scheduler] ⏰ Agendado para executar diariamente às 13h00');
  } catch (error) {
    console.error('[scheduler] ❌ Erro ao iniciar job volta de almoço automático:', error);
  }
}

/**
 * Para o job de volta de almoço automática
 */
export function pararJobVoltaAlmocoAutomatico() {
  try {
    jobVoltaAlmocoAutomatico.stop();
    console.log('[scheduler] ⏹️ Job de volta de almoço automática parado');
  } catch (error) {
    console.error('[scheduler] ❌ Erro ao parar job volta de almoço automático:', error);
  }
}

export { jobVoltaAlmocoAutomatico };
