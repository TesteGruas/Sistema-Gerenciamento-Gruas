import cron from 'node-cron';
import { enviarLembretesAprovacao } from '../utils/notificacoes.js';

/**
 * Job para verificação diária de aprovações pendentes
 * Executa todo dia às 9h da manhã
 */
const jobVerificacaoAprovacoes = cron.schedule('0 9 * * *', async () => {
  try {
    console.log('🕘 Iniciando verificação diária de aprovações pendentes...');
    console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
    
    await enviarLembretesAprovacao();
    
    console.log('✅ Verificação diária de aprovações concluída com sucesso');
  } catch (error) {
    console.error('❌ Erro na verificação diária de aprovações:', error);
  }
}, {
  scheduled: false, // Não iniciar automaticamente
  timezone: 'America/Sao_Paulo'
});

/**
 * Inicia o job de verificação diária
 */
export function iniciarJobVerificacaoAprovacoes() {
  try {
    jobVerificacaoAprovacoes.start();
    console.log('🚀 Job de verificação diária de aprovações iniciado');
    console.log('⏰ Agendado para executar todo dia às 9h da manhã');
  } catch (error) {
    console.error('❌ Erro ao iniciar job de verificação:', error);
  }
}

/**
 * Para o job de verificação diária
 */
export function pararJobVerificacaoAprovacoes() {
  try {
    jobVerificacaoAprovacoes.stop();
    console.log('⏹️ Job de verificação diária de aprovações parado');
  } catch (error) {
    console.error('❌ Erro ao parar job de verificação:', error);
  }
}

/**
 * Executa o job manualmente (para testes)
 */
export async function executarVerificacaoManual() {
  try {
    console.log('🔧 Executando verificação manual de aprovações...');
    await enviarLembretesAprovacao();
    console.log('✅ Verificação manual concluída');
  } catch (error) {
    console.error('❌ Erro na verificação manual:', error);
    throw error;
  }
}

// Exportar o job para uso externo
export { jobVerificacaoAprovacoes };
