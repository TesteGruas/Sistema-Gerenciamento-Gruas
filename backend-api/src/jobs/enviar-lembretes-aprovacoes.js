import { processarLembretes } from '../services/notificacoes-horas-extras.js';

/**
 * Job para enviar lembretes de aprovações pendentes há 3+ dias
 * Executado diariamente às 09:00
 */
async function enviarLembretesAprovacoes() {
  console.log('[job-lembretes] Iniciando envio de lembretes...');
  
  try {
    const lembretes = await processarLembretes();

    if (!lembretes || lembretes.length === 0) {
      console.log('[job-lembretes] Nenhum lembrete enviado');
      return {
        sucesso: true,
        lembretes_enviados: 0,
        mensagem: 'Nenhum lembrete necessário'
      };
    }

    console.log(`[job-lembretes] ✓ ${lembretes.length} lembretes enviados com sucesso`);

    return {
      sucesso: true,
      lembretes_enviados: lembretes.length,
      lembretes
    };

  } catch (error) {
    console.error('[job-lembretes] Erro crítico no job:', error);
    return {
      sucesso: false,
      erro: error.message,
      lembretes_enviados: 0
    };
  }
}

export { enviarLembretesAprovacoes };

