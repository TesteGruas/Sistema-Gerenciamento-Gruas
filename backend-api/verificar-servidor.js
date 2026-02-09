#!/usr/bin/env node

/**
 * Script para verificar se o servidor está rodando e os jobs estão ativos
 */

const PORT = process.env.PORT || 3001;
// Tentar detectar IP do servidor ou usar localhost
const SERVER_IP = process.env.SERVER_IP || '72.60.60.118';
const API_URL = process.env.API_URL || `http://${SERVER_IP}:${PORT}`;
const LOCAL_URL = `http://localhost:${PORT}`;

console.log('🔍 Verificando status do servidor e jobs...\n');

// 1. Verificar se o servidor está respondendo
async function verificarServidor() {
  try {
    console.log('1️⃣ Verificando se o servidor está rodando...');
    console.log(`   Tentando: ${API_URL}/health`);
    
    let response;
    let data;
    
    // Tentar primeiro pelo IP do servidor
    try {
      response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        data = await response.json();
        console.log('✅ Servidor está RODANDO (via IP do servidor)');
        console.log(`   URL: ${API_URL}`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Timestamp: ${data.timestamp}`);
        console.log(`   Ambiente: ${data.environment}`);
        return true;
      }
    } catch (ipError) {
      // Se falhar, tentar localhost
      console.log(`   ⚠️  Falha ao conectar via IP, tentando localhost...`);
      try {
        response = await fetch(`${LOCAL_URL}/health`);
        if (response.ok) {
          data = await response.json();
          console.log('✅ Servidor está RODANDO (via localhost)');
          console.log(`   URL: ${LOCAL_URL}`);
          console.log(`   Status: ${data.status}`);
          console.log(`   Timestamp: ${data.timestamp}`);
          console.log(`   Ambiente: ${data.environment}`);
          console.log(`   ⚠️  Nota: Servidor acessível apenas via localhost`);
          return true;
        }
      } catch (localError) {
        throw ipError; // Usar erro original
      }
    }
    
    console.log('❌ Servidor não está respondendo corretamente');
    return false;
  } catch (error) {
    console.log('❌ Servidor NÃO está rodando');
    console.log(`   Erro: ${error.message}`);
    console.log(`   Tentou: ${API_URL}/health`);
    console.log(`   Tentou: ${LOCAL_URL}/health`);
    console.log(`   💡 Execute: cd backend-api && npm start`);
    return false;
  }
}

// 2. Verificar processos Node.js na porta 3001
async function verificarProcesso() {
  console.log('\n2️⃣ Verificando processos na porta 3001...');
  
  try {
    // Usar import dinâmico para child_process
    const { execSync } = await import('child_process');
    
    try {
      // macOS/Linux
      const processos = execSync(`lsof -ti:${PORT} 2>/dev/null || echo ""`, { encoding: 'utf-8' }).trim();
      
      if (processos) {
        console.log(`✅ Processo encontrado na porta ${PORT}`);
        console.log(`   PID(s): ${processos}`);
        
        // Tentar obter mais informações do processo
        try {
          const info = execSync(`ps -p ${processos.split('\n')[0]} -o command=`, { encoding: 'utf-8' }).trim();
          console.log(`   Comando: ${info.substring(0, 80)}...`);
        } catch (e) {
          // Ignorar erro
        }
      } else {
        console.log(`⚠️  Nenhum processo encontrado na porta ${PORT}`);
      }
    } catch (error) {
      console.log('⚠️  Não foi possível verificar processos');
      console.log(`   Dica: Execute 'lsof -ti:${PORT}' manualmente para verificar`);
    }
  } catch (error) {
    console.log('⚠️  Não foi possível importar módulo child_process');
    console.log(`   Dica: Execute 'lsof -ti:${PORT}' manualmente para verificar`);
  }
}

// 3. Verificar logs do servidor
function verificarLogs() {
  console.log('\n3️⃣ Informações sobre logs:');
  console.log('   📋 Verifique os logs do servidor para confirmar que os jobs foram iniciados:');
  console.log('   💡 Procure por estas mensagens:');
  console.log('      - "[scheduler] Inicializando jobs automáticos..."');
  console.log('      - "[scheduler] 🚀 Job de notificações de almoço iniciado"');
  console.log('      - "[scheduler] ⏰ Agendado para executar diariamente às 11h50"');
  console.log('      - "[scheduler] 🚀 Job de almoço automático iniciado"');
  console.log('      - "[scheduler] ⏰ Agendado para executar diariamente às 12h00"');
}

// 4. Verificar horário atual e próximo agendamento
function verificarAgendamento() {
  console.log('\n4️⃣ Informações sobre agendamento:');
  const agora = new Date();
  const horaAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  console.log(`   Hora atual: ${horaAtual}`);
  console.log(`   Timezone: ${timezone}`);
  console.log(`   Próxima execução de notificações: 11:50 (horário de Brasília)`);
  console.log(`   Próxima execução de almoço automático: 12:00 (horário de Brasília)`);
  
  // Calcular tempo até próxima execução
  const proximaNotificacao = new Date();
  proximaNotificacao.setHours(11, 50, 0, 0);
  
  if (agora > proximaNotificacao) {
    // Se já passou das 11:50, calcular para amanhã
    proximaNotificacao.setDate(proximaNotificacao.getDate() + 1);
  }
  
  const diffMs = proximaNotificacao - agora;
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  console.log(`   Tempo até próxima notificação: ${diffHoras}h ${diffMinutos}min`);
}

// 5. Instruções para testar manualmente
function instrucoesTeste() {
  console.log('\n5️⃣ Como testar manualmente:');
  console.log('   📝 Para testar o job de notificações de almoço ANTES do horário agendado:');
  console.log('   1. Acesse o terminal do servidor');
  console.log('   2. Execute: cd backend-api');
  console.log('   3. Execute: node -e "import(\'./src/services/almoco-automatico-service.js\').then(m => m.enviarNotificacoesAlmoco().then(r => console.log(JSON.stringify(r, null, 2)))).catch(e => console.error(e))"');
  console.log('\n   📝 Para verificar se um funcionário receberá notificação:');
  console.log('   1. O funcionário deve ter registrado entrada hoje');
  console.log('   2. O funcionário NÃO deve ter registrado saída de almoço');
  console.log('   3. O funcionário NÃO deve ter recebido notificação hoje ainda');
  console.log('   4. O funcionário deve estar ativo');
}

// Executar todas as verificações
async function main() {
  const servidorOk = await verificarServidor();
  await verificarProcesso();
  verificarLogs();
  verificarAgendamento();
  instrucoesTeste();
  
  console.log('\n' + '='.repeat(60));
  if (servidorOk) {
    console.log('✅ RESUMO: Servidor está rodando');
    console.log('⚠️  Verifique os logs para confirmar que os jobs foram iniciados');
    console.log('💡 Execute: pm2 logs | grep scheduler');
  } else {
    console.log('❌ RESUMO: Servidor NÃO está rodando');
    console.log('💡 Execute: cd backend-api && npm start');
  }
  console.log('='.repeat(60));
}

main().catch(console.error);
