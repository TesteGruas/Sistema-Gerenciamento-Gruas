#!/usr/bin/env node

/**
 * Script para testar o envio de notificações de almoço
 * SEM tentar iniciar o servidor
 */

// Definir variável de ambiente para evitar import do server.js
process.env.SKIP_SERVER_IMPORT = 'true';

import { enviarNotificacoesAlmoco } from './src/services/almoco-automatico-service.js';

console.log('🧪 Testando envio de notificações de almoço...\n');

try {
  const resultado = await enviarNotificacoesAlmoco();
  
  console.log('\n✅ Teste concluído!');
  console.log('\n📊 Resultado:');
  console.log(JSON.stringify(resultado, null, 2));
  
  if (resultado.sucesso) {
    console.log(`\n✅ ${resultado.enviados} notificação(ões) enviada(s) com sucesso`);
    
    if (resultado.erros && resultado.erros.length > 0) {
      console.log(`\n⚠️  ${resultado.erros.length} erro(s) encontrado(s):`);
      resultado.erros.forEach((erro, index) => {
        console.log(`   ${index + 1}. ${erro.funcionario || 'Desconhecido'}: ${erro.erro}`);
      });
    }
  } else {
    console.log('\n❌ Erro ao executar teste');
    if (resultado.erros && resultado.erros.length > 0) {
      resultado.erros.forEach((erro, index) => {
        console.log(`   ${index + 1}. ${erro.erro || erro}`);
      });
    }
  }
  
  process.exit(0);
} catch (error) {
  console.error('\n❌ Erro ao executar teste:', error.message);
  console.error(error.stack);
  process.exit(1);
}
